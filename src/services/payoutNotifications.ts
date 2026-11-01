import { API_BASE_URL } from './config';
import { getAuthToken } from './authTokenStore';
import { sha256 } from '@noble/hashes/sha2.js';
import { sha3_256 } from '@noble/hashes/sha3.js';
import { assertPasskey, bytesToHex, concat, framed, passkeyRecordAddress, u64le, type PasskeyAuthJson, type PasskeyCredentialRecord } from './walletCrypto/passkey';

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

// ---- Passkey wallets (owner approval 2026-11-01) ------------------------------------------------------
// A passkey wallet has no wallet-login token. It signs each subscribe/unsubscribe with its passkey instead:
// the server issues a single-use nonce, the passkey asserts over SHA3-256 of a message binding the domain
// tag, chain, network, address, action, channel, target hash, nonce and expiry (backend
// services/payout-notify/passkey-proof.ts), and the server checks that the credential derives the address.
// The server keeps no list it would hand out without a login, so this browser remembers (public data only)
// which subscriptions it made for each passkey address.

export const PASSKEY_NOTIFY_DOMAIN = 'wrfcoin_passkey_payout_notify_v1';
export type PasskeyNotifyAction = 'subscribe' | 'unsubscribe';
export interface PasskeyNotifyFields {
  chainId: string;
  network: string;
  address: string;
  action: PasskeyNotifyAction;
  channel: 'webpush' | 'ntfy';
  targetHash: string;
  nonce: string;
  expiresAtSec: number;
}

export function passkeyNotifyMessage(f: PasskeyNotifyFields): Uint8Array {
  return concat(new TextEncoder().encode(PASSKEY_NOTIFY_DOMAIN), framed(f.chainId), framed(f.network), framed(f.address), framed(f.action),
    framed(f.channel), framed(f.targetHash), framed(f.nonce), u64le(BigInt(f.expiresAtSec)));
}
export const passkeyNotifyChallenge = (f: PasskeyNotifyFields): Uint8Array => sha3_256(passkeyNotifyMessage(f));

interface PasskeyChallenge { domain: string; chainId: string; network: string; address: string; nonce: string; expiresAt: number }

type Assert = (record: PasskeyCredentialRecord, challenge: Uint8Array) => Promise<PasskeyAuthJson>;

/** Ask for a nonce, sign `action` on (channel, target hash) with the passkey, return the signed fields. */
async function passkeyProof(record: PasskeyCredentialRecord, address: string, action: PasskeyNotifyAction, channel: 'webpush' | 'ntfy', hash: string, assert: Assert):
Promise<Result<{ nonce: string; passkey_auth: PasskeyAuthJson }>> {
  if (passkeyRecordAddress(record) !== address) return { ok: false, status: null, code: 'PASSKEY_ADDRESS_MISMATCH' };
  const c = await call<PasskeyChallenge>('POST', '/notifications/passkey/challenge', { body: { address } });
  if (!c.ok) return c;
  const ch = c.value;
  if (ch?.domain !== PASSKEY_NOTIFY_DOMAIN || ch.address !== address || !/^[0-9]{1,10}$/.test(String(ch.chainId)) || !/^[0-9a-f]{64}$/.test(ch.nonce) || !Number.isSafeInteger(ch.expiresAt)) {
    return { ok: false, status: null, code: null };
  }
  const passkeyAuth = await assert(record, passkeyNotifyChallenge({
    chainId: String(ch.chainId), network: ch.network, address, action, channel, targetHash: hash, nonce: ch.nonce, expiresAtSec: ch.expiresAt,
  }));
  return { ok: true, value: { nonce: ch.nonce, passkey_auth: passkeyAuth } };
}

const PASSKEY_SUBS_KEY = 'wrfcoin.payoutNotify.passkey.v1';

function readPasskeySubs(): Record<string, NotificationSubscription[]> {
  try {
    const parsed = JSON.parse(localStorage.getItem(PASSKEY_SUBS_KEY) ?? '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch { return {}; }
}
function writePasskeySubs(address: string, subs: NotificationSubscription[]): void {
  try {
    const all = readPasskeySubs();
    if (subs.length) all[address] = subs; else delete all[address];
    localStorage.setItem(PASSKEY_SUBS_KEY, JSON.stringify(all));
  } catch { /* storage unavailable: the subscription still works, this page just forgets it */ }
}
/** The subscriptions this browser made for a passkey address. */
export function listPasskeySubscriptions(address: string): NotificationSubscription[] {
  const subs = readPasskeySubs()[address];
  return Array.isArray(subs) ? subs.filter(s => s && typeof s.targetHash === 'string' && (s.channel === 'ntfy' || s.channel === 'webpush')) : [];
}
function rememberPasskeySubscription(sub: NotificationSubscription): void {
  writePasskeySubs(sub.address, [...listPasskeySubscriptions(sub.address).filter(s => !(s.channel === sub.channel && s.targetHash === sub.targetHash)), sub]);
}
export function forgetPasskeySubscription(address: string, channel: string, hash: string): void {
  writePasskeySubs(address, listPasskeySubscriptions(address).filter(s => !(s.channel === channel && s.targetHash === hash)));
}

async function passkeySubscribe(record: PasskeyCredentialRecord, address: string, channel: 'webpush' | 'ntfy', target: string, body: Record<string, unknown>, assert: Assert):
Promise<Result<NotificationSubscription>> {
  const proof = await passkeyProof(record, address, 'subscribe', channel, bytesToHex(sha256(new TextEncoder().encode(target))), assert);
  if (!proof.ok) return proof;
  const r = await call<{ subscription: NotificationSubscription }>('POST', '/notifications/passkey/subscriptions', { body: { address, channel, ...body, ...proof.value } });
  if (!r.ok) return r;
  rememberPasskeySubscription(r.value.subscription);
  return { ok: true, value: r.value.subscription };
}

export const subscribeNtfyPasskey = (record: PasskeyCredentialRecord, address: string, topic: string, assert: Assert = assertPasskey) =>
  passkeySubscribe(record, address, 'ntfy', topic, { topic }, assert);

export const subscribeWebPushPasskey = (record: PasskeyCredentialRecord, address: string, subscription: { endpoint: string; keys: { p256dh: string; auth: string } }, assert: Assert = assertPasskey) =>
  passkeySubscribe(record, address, 'webpush', subscription.endpoint, { subscription: { endpoint: subscription.endpoint, keys: subscription.keys } }, assert);

/** Remove one of this passkey address's subscriptions by its target hash (signed with the passkey). */
export async function unsubscribePasskey(record: PasskeyCredentialRecord, address: string, channel: 'webpush' | 'ntfy', hash: string, assert: Assert = assertPasskey): Promise<Result<{ removed: number }>> {
  const proof = await passkeyProof(record, address, 'unsubscribe', channel, hash, assert);
  if (!proof.ok) return proof;
  const r = await call<{ removed: number }>('POST', '/notifications/passkey/unsubscribe', { body: { address, channel, targetHash: hash, ...proof.value } });
  if (r.ok) forgetPasskeySubscription(address, channel, hash);
  return r;
}
