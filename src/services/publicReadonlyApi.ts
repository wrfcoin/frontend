import { API_BASE_URL } from './config';

/**
 * Minimal GET helper for the public read-only pages (S4-S6). Every path it is given must match an
 * admitted edge matcher exactly (infra testnet/edge/public_onboarding.caddy); anything else 404s at the
 * edge, so callers build paths only through the typed builders below. No credentials are sent, there is
 * no retry and no polling: a 429 is surfaced once as `rate_limited` and the page decides what to show.
 */
export type PublicReadResult<T> =
  | { kind: 'ok'; data: T }
  | { kind: 'not_found' }
  | { kind: 'rate_limited'; retryAfterSeconds: number | null }
  | { kind: 'error'; status: number | null };

export async function publicGet<T>(path: string, signal?: globalThis.AbortSignal): Promise<PublicReadResult<T>> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { method: 'GET', signal, credentials: 'omit' });
  } catch (error) {
    if ((error as { name?: string })?.name === 'AbortError') throw error;
    return { kind: 'error', status: null };
  }
  if (response.status === 404) return { kind: 'not_found' };
  if (response.status === 429) {
    const header = Number(response.headers?.get?.('Retry-After'));
    return { kind: 'rate_limited', retryAfterSeconds: Number.isFinite(header) && header > 0 ? header : null };
  }
  if (!response.ok) return { kind: 'error', status: response.status };
  try {
    return { kind: 'ok', data: (await response.json()) as T };
  } catch {
    return { kind: 'error', status: response.status };
  }
}

// ---- Path builders: one per admitted edge matcher ---------------------------------------------------

/** backend PROPOSAL_ID_RE / edge `[A-Za-z0-9_-]{1,128}`. */
export const PROPOSAL_ID_RE = /^[A-Za-z0-9_-]{1,128}$/;
/** backend contributor-alias.ts opaque key: `c_` + 24 lowercase hex (edge `c_[0-9a-f]{24}`). */
export const CONTRIBUTOR_KEY_RE = /^c_[0-9a-f]{24}$/;

export const GOVERNANCE_PAGE_SIZE = 20;

/** `limit=<1..100>&offset=<0..999999>` in that order; `page` is refused by the edge. */
export function governanceProposalsPath(limit = GOVERNANCE_PAGE_SIZE, offset = 0): string {
  const l = Math.min(100, Math.max(1, Math.trunc(limit)));
  const o = Math.min(999999, Math.max(0, Math.trunc(offset)));
  return `/governance/proposals?limit=${l}&offset=${o}`;
}

export function governanceProposalPath(id: string): string | null {
  return PROPOSAL_ID_RE.test(id) ? `/governance/proposals/${id}` : null;
}

export const GOVERNANCE_TREASURY_PATH = '/governance/treasury';

/**
 * Faucet bond-grant audit list (self-serve bond grant spec section 4): the backend forwards the faucet's
 * `GET /faucet/bond-grants` unchanged, `{ grants: [{ ownerAddress, peerId, serverKey, txHash, time, bonded }] }`,
 * newest first, at most 100. No query parameters.
 */
export const BOND_GRANTS_PATH = '/faucet/bond-grants';

export function contributorProfilePath(key: string): string | null {
  return CONTRIBUTOR_KEY_RE.test(key) ? `/operators/${key}/profile` : null;
}

/** `segment` is the output of coarsePathSegment (`lat,lon`, one decimal each). */
export function weatherCurrentPath(segment: string): string {
  return `/weather/current/${segment}`;
}

// Mobile constants (api_constants.dart): hourly = `type=hourly&days=1`, daily = `days=14`.
export const FORECAST_HOURLY_QUERY = 'type=hourly&days=1';
export const FORECAST_DAILY_QUERY = 'days=14';

export function weatherForecastPath(segment: string, kind: 'hourly' | 'daily'): string {
  return `/weather/forecast/${segment}?${kind === 'hourly' ? FORECAST_HOURLY_QUERY : FORECAST_DAILY_QUERY}`;
}

// ---- Forecaster track record (wrfcoin/core4#3604 A4, [post-GO]) -------------------------------------------
// backend forecasters-routes.ts: GET /api/forecasters?period=7d|30d|all&limit=1..100 and
// GET /api/forecasters/:profileKey (opaque c_ key only: the backend answers a raw-address lookup with the
// unknown-key 404 for every public caller, and own-profile-by-address is a pending owner decision). Both are 503 while the chain-rewards
// index is off on a network; the pages show that as "not available on this network yet".
export const FORECASTER_PERIODS = ['7d', '30d', 'all'] as const;
export type ForecasterPeriod = (typeof FORECASTER_PERIODS)[number];
export const FORECASTERS_PAGE_SIZE = 25;
export function forecastersPath(period: ForecasterPeriod = '7d', limit: number = FORECASTERS_PAGE_SIZE): string {
  const safePeriod = FORECASTER_PERIODS.includes(period) ? period : '7d';
  const safeLimit = Math.min(Math.max(Math.trunc(Number(limit) || FORECASTERS_PAGE_SIZE), 1), 100);
  return `/forecasters?period=${safePeriod}&limit=${safeLimit}`;
}
/** A c_ profile key (CONTRIBUTOR_KEY_RE) only; a raw 0x address or anything else makes no request. */
export const FORECASTER_SEGMENT_RE = CONTRIBUTOR_KEY_RE;
export function forecasterPath(segment: string): string | null {
  return FORECASTER_SEGMENT_RE.test(segment) ? `/forecasters/${segment}` : null;
}
