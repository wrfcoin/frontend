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

// ---- Proof card for one station reading (backend#229, owner demo queue 2026-11-01) -------------------------
// backend proof-card-routes.ts: GET /api/proofs/<commit id>[?h=<height>]. The commit id is core4's
// 64-character lowercase hex; `h` is only a hint telling the server which block to read first (the
// server proves the reading is in that block from the chain itself, so a wrong hint finds nothing).
export const PROOF_COMMIT_ID_RE = /^[0-9a-f]{64}$/;
const PROOF_HEIGHT_RE = /^[1-9][0-9]{0,11}$/;

export function proofCardPath(commitId: string, height?: number | string | null): string | null {
  if (!PROOF_COMMIT_ID_RE.test(commitId)) return null;
  const h = height === null || height === undefined ? '' : String(height);
  return PROOF_HEIGHT_RE.test(h) ? `/proofs/${commitId}?h=${h}` : `/proofs/${commitId}`;
}

/** The public page for a reading: `/proof/<commit id>` plus the height hint when it is known. */
// ---- Friend challenge board (backend#249, demo item 8) ------------------------------------------------------
// backend challenge-routes.ts: GET /api/challenges/code/<ABCD-2345>, no login, no query. Writes are wallet
// calls (services/walletApi.ts), not public reads.
export const CHALLENGE_CODE_RE = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;
export function challengeCodePath(code: string): string | null {
  return CHALLENGE_CODE_RE.test(code) ? `/challenges/code/${code}` : null;
}

export function proofPagePath(commitId: string, height?: number | string | null): string | null {
  const api = proofCardPath(commitId, height);
  return api ? api.replace(/^\/proofs\//, '/proof/') : null;
}
// ---- Producers and bonded nodes (owner demo queue 2026-11-01, item 3) --------------------------------------
// backend network-nodes-routes.ts: GET /api/network/nodes, no query. One cached snapshot read from the node.
export const NETWORK_NODES_PATH = '/network/nodes';

// ---- Weekly forecast competition (backend#251, points only) ---------------------------------------------
// backend competition-routes.ts: GET /api/competitions (this week + recent weeks with their top three),
// GET /api/competitions/current and GET /api/competitions/<ISO week, e.g. 2026-W45>. No query string on any
// of them (the edge admits none). All three are 503 while the forecast index or the competition flag is off.
export const COMPETITIONS_PATH = '/competitions';
export const COMPETITION_CURRENT_PATH = '/competitions/current';
export const COMPETITION_WEEK_RE = /^[0-9]{4}-W[0-9]{2}$/;
export function competitionWeekPath(week: string): string | null {
  return COMPETITION_WEEK_RE.test(week) ? `/competitions/${week}` : null;
}

// ---- Forecast check: on-chain forecasts vs station readings and NOAA (backend PR#72/#1494, demo item 7) ----
// backend forecast-verification-routes.ts (default export): GET summary, GET one record, POST a commit record.
// No query strings anywhere. The POST carries no credential: the record proves itself (its hash is the
// chain commit id) and is taken only after the forecast is revealed on chain.
export const FORECAST_CHECK_SUMMARY_PATH = '/forecast-verification/summary';
export const FORECAST_CHECK_SUBMIT_PATH = '/forecast-verification/forecasts';
export function forecastCheckRecordPath(commitId: string): string | null {
  return PROOF_COMMIT_ID_RE.test(commitId) ? `/forecast-verification/forecasts/${commitId}` : null;
}

// ---- Free-play forecast duels (backend#228/#1424, demo item 10) ---------------------------------------------
// backend duel-routes.ts: GET /api/duels (board) and GET /api/duels/<uuid>, no query. Opening, accepting and
// linking are wallet calls (services/walletApi.ts); handing in a revealed record is publicPost below.
export const FORECAST_DUELS_PATH = '/duels';
const DUEL_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export function forecastDuelPath(id: string): string | null {
  return DUEL_ID_RE.test(id) ? `/duels/${id}` : null;
}

export type PublicPostResult<T> =
  | { kind: 'ok'; status: number; data: T }
  | { kind: 'refused'; status: number; code: string | null; message: string | null }
  | { kind: 'rate_limited'; retryAfterSeconds: number | null }
  | { kind: 'error'; status: number | null };

/** JSON POST with no credentials; a 4xx comes back as `refused` with the server's code and message. */
export async function publicPost<T>(path: string, body: unknown): Promise<PublicPostResult<T>> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST', credentials: 'omit', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
  } catch {
    return { kind: 'error', status: null };
  }
  if (response.status === 429) {
    const header = Number(response.headers?.get?.('Retry-After'));
    return { kind: 'rate_limited', retryAfterSeconds: Number.isFinite(header) && header > 0 ? header : null };
  }
  const payload: { error?: { code?: unknown; message?: unknown } } | null = await response.json().catch(() => null);
  if (response.ok) return { kind: 'ok', status: response.status, data: payload as unknown as T };
  if (response.status >= 400 && response.status < 500) {
    const error = payload?.error;
    return {
      kind: 'refused',
      status: response.status,
      code: typeof error?.code === 'string' ? error.code : null,
      message: typeof error?.message === 'string' ? error.message : null,
    };
  }
  return { kind: 'error', status: response.status };
}
