import { API_BASE_URL } from './config';
import { getAuthToken } from './authTokenStore';

/**
 * Payout notifications (backend#389, owner ruling 2026-11-01: no email or personal data).
 *
 * A subscription is an address plus EITHER this browser's own Web Push subscription OR an ntfy topic the
 * person picks. Creating, listing, testing and removing need the wallet login of that address (the
 * in-memory session token from /wallet); turning a browser off needs only its push endpoint. Every path
 * here is admitted by the public edge (infra testnet/edge/public_onboarding.caddy, @public_notifications_*).
 */

export interface NotificationConfig {
  enabled: boolean;
  checkEveryMinutes: number;
  webPush: { available: boolean; publicKey: string | null };
  ntfy: { available: boolean; server: string | null };
}
export interface NotificationSubscription {
  id: string;
  address: string;
  channel: 'webpush' | 'ntfy';
  label: string;
  targetHash: string;
  createdAt: string;
  lastDeliveredAt: string | null;
}
export type Result<T> = { ok: true; value: T } | { ok: false; status: number | null; code: string | null };

export const NTFY_TOPIC_RE = /^[A-Za-z0-9_-]{12,64}$/;
/** Separate, push-only service worker (no fetch handler, so it never caches the app). */
export const PUSH_SW_URL = '/payout-push-sw.js';
export const PUSH_SW_SCOPE = '/payout-push/';

/** Lowercase `sub` of the in-memory wallet session token, or null. Display only: the server verifies it. */
export function signedInAddress(token: string = getAuthToken()): string | null {
  const part = token.split('.')[1];
  if (!part) return null;
  try {
    const json = JSON.parse(globalThis.atob(part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=')));
    return typeof json?.sub === 'string' && /^0x[0-9a-f]{40}$/i.test(json.sub) ? json.sub.toLowerCase() : null;
  } catch {
    return null;
  }
}

async function call<T>(method: string, path: string, options: { body?: unknown; auth?: boolean; signal?: globalThis.AbortSignal } = {}): Promise<Result<T>> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.auth) {
    const token = getAuthToken();
    if (!token) return { ok: false, status: 401, code: 'WALLET_LOGIN_REQUIRED' };
    headers.Authorization = `Bearer ${token}`;
  }
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method, headers, credentials: 'omit', signal: options.signal,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch (error) {
    if ((error as { name?: string })?.name === 'AbortError') throw error;
    return { ok: false, status: null, code: null };
  }
  let payload: any = null;
  try { payload = await response.json(); } catch { payload = null; }
  if (!response.ok) return { ok: false, status: response.status, code: payload?.error?.code ?? null };
  return { ok: true, value: payload as T };
}

export const getNotificationConfig = (signal?: globalThis.AbortSignal) =>
  call<NotificationConfig>('GET', '/notifications/config', { signal });

export async function listSubscriptions(address: string, signal?: globalThis.AbortSignal): Promise<Result<NotificationSubscription[]>> {
  const r = await call<{ subscriptions: NotificationSubscription[] }>('GET', `/notifications/subscriptions/${address}`, { auth: true, signal });
  return r.ok ? { ok: true, value: Array.isArray(r.value?.subscriptions) ? r.value.subscriptions : [] } : r;
}

export async function subscribeNtfy(address: string, topic: string): Promise<Result<NotificationSubscription>> {
  const r = await call<{ subscription: NotificationSubscription }>('POST', '/notifications/subscriptions', { auth: true, body: { address, channel: 'ntfy', topic } });
  return r.ok ? { ok: true, value: r.value.subscription } : r;
}

export async function subscribeWebPush(address: string, subscription: { endpoint: string; keys: { p256dh: string; auth: string } }): Promise<Result<NotificationSubscription>> {
  const r = await call<{ subscription: NotificationSubscription }>('POST', '/notifications/subscriptions', {
    auth: true, body: { address, channel: 'webpush', subscription: { endpoint: subscription.endpoint, keys: subscription.keys } },
  });
  return r.ok ? { ok: true, value: r.value.subscription } : r;
}

export const removeSubscription = (id: string) => call<{ removed: number }>('DELETE', `/notifications/subscriptions/${id}`, { auth: true });
export const sendTest = (id: string) => call<{ delivered: boolean }>('POST', `/notifications/subscriptions/${id}/test`, { auth: true });
export const unsubscribeEndpoint = (endpoint: string, address?: string) =>
  call<{ removed: number }>('POST', '/notifications/unsubscribe', { body: { channel: 'webpush', endpoint, ...(address ? { address } : {}) } });

/** A hard-to-guess topic suggestion: anyone who knows an ntfy topic can read it. */
export function suggestTopic(random: (n: number) => Uint8Array = n => globalThis.crypto.getRandomValues(new Uint8Array(n))): string {
  return `wrfcoin-pay-${Array.from(random(8), b => b.toString(16).padStart(2, '0')).join('')}`;
}

/** sha256 hex of a string (the backend's targetHash), to tell which listed push subscription is this browser. */
export async function sha256Hex(text: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = globalThis.atob(padded);
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}

export function webPushSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/** This browser's existing payout push subscription, if any. */
export async function currentPushSubscription(): Promise<PushSubscription | null> {
  if (!webPushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration(PUSH_SW_SCOPE);
  return reg ? reg.pushManager.getSubscription() : null;
}

/** Ask permission, register the push-only worker, and subscribe with the server's VAPID key. */
export async function createPushSubscription(publicKey: string): Promise<{ endpoint: string; keys: { p256dh: string; auth: string } }> {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw Object.assign(new Error('Notifications are blocked for this site.'), { code: 'PERMISSION_DENIED' });
  const reg = await navigator.serviceWorker.register(PUSH_SW_URL, { scope: PUSH_SW_SCOPE });
  const existing = await reg.pushManager.getSubscription();
  const sub = existing ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource });
  const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) throw new Error('The browser returned an incomplete push subscription.');
  return { endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } };
}
