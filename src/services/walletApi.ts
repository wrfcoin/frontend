import { API_BASE_URL } from './config';
import { getAuthToken } from './authTokenStore';

/**
 * Calls made as the signed-in wallet (friend challenges, free-play duels). The wallet login token from
 * walletAuthService (in memory only, authTokenStore) is the only credential; without it nothing is sent
 * and the caller gets `signed_out`. Every path must match an edge matcher that admits a Bearer request
 * (infra testnet/edge/public_onboarding.caddy). No retry and no polling.
 */
export type WalletCallResult<T> =
  | { kind: 'ok'; status: number; data: T }
  | { kind: 'signed_out' }
  | { kind: 'not_found' }
  | { kind: 'refused'; status: number; code: string | null; message: string | null }
  | { kind: 'rate_limited'; retryAfterSeconds: number | null }
  | { kind: 'error'; status: number | null };

export async function walletCall<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<WalletCallResult<T>> {
  const token = getAuthToken();
  if (!token) return { kind: 'signed_out' };
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      credentials: 'omit',
      // A POST always carries a JSON body: the edge admits these writes only with Content-Type application/json.
      headers: { Authorization: `Bearer ${token}`, ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}) },
      ...(method === 'POST' ? { body: JSON.stringify(body ?? {}) } : {}),
    });
  } catch {
    return { kind: 'error', status: null };
  }
  if (response.status === 401) return { kind: 'signed_out' };
  if (response.status === 404 && method === 'GET') return { kind: 'not_found' };
  if (response.status === 429) {
    const header = Number(response.headers?.get?.('Retry-After'));
    return { kind: 'rate_limited', retryAfterSeconds: Number.isFinite(header) && header > 0 ? header : null };
  }
  const payload: { error?: { code?: unknown; message?: unknown } } | null = await response.json().catch(() => null);
  if (response.ok) return { kind: 'ok', status: response.status, data: payload as unknown as T };
  if (response.status >= 400 && response.status < 500) {
    const error = payload?.error;
    if (response.status === 404 && typeof error?.code !== 'string') return { kind: 'not_found' };
    return { kind: 'refused', status: response.status, code: typeof error?.code === 'string' ? error.code : null, message: typeof error?.message === 'string' ? error.message : null };
  }
  return { kind: 'error', status: response.status };
}

/** The wallet a login token was issued to (its `address` claim, else `sub`), for display only; the server verifies. */
export function tokenWallet(token: string): string | null {
  const part = token.split('.')[1];
  if (!part) return null;
  try {
    const json = JSON.parse(globalThis.atob(part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=')));
    const claim = typeof json?.address === 'string' ? json.address : typeof json?.sub === 'string' ? json.sub : '';
    const address = claim.toLowerCase();
    return /^0x[0-9a-f]{40}$/.test(address) ? address : null;
  } catch {
    return null;
  }
}
