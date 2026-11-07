/**
 * Website forecast commit (design 2026-11-05, epic 7): check the backend's draft, then sign the commit with
 * the 12-word wallet key. Only the commit is signed; the backend relay holds the reveal package and reveals
 * in the next block, so a closed tab still reveals.
 *
 * The browser never signs server bytes blindly. Before signing it re-derives everything that matters from
 * the draft itself: the values are exactly what the person typed, the lead and station are the ones picked,
 * the forecaster is the unlocked wallet, and the commit id re-hashes from data, nonce, station and timestamp
 * (core4 `Transaction::compute_commit_id`).
 *
 * The signed message is core4 `commit_authorization_message_with_domain` (shared-protocol transaction.rs):
 *   "wrfcoin_commit_auth_v2" || u32le|chain_id || u32le|network_id || u32le|station_id || u32le|commit_id
 *   || u32le|"forecast"
 * The domain tag is raw bytes (not length-prefixed); every other field is u32 little-endian length + UTF-8.
 */
import { sha256 } from '@noble/hashes/sha2.js';
import { sha3_256 } from '@noble/hashes/sha3.js';
import { bytesToHex } from './firstPartyKeys';

const encoder = new TextEncoder();

export const COMMIT_AUTH_DOMAIN = 'wrfcoin_commit_auth_v2';
export const FORECAST_CONTRIBUTION_TYPE = 'forecast';
export const FORECAST_LEADS = [1, 6, 12, 24] as const;
export const FORECAST_VARIABLES = ['temperature_c', 'pressure_hpa'] as const;
export type ForecastVariable = (typeof FORECAST_VARIABLES)[number];

const HEX64 = /^[0-9a-f]{64}$/;
const ADDRESS = /^0x[0-9a-f]{40}$/;

function u32le(n: number): Uint8Array {
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, n, true);
  return out;
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) { out.set(p, at); at += p.length; }
  return out;
}

const framed = (text: string): Uint8Array => {
  const bytes = encoder.encode(text);
  return concat(u32le(bytes.length), bytes);
};

/** core4 commit_authorization_message_with_domain for a forecast commit. */
export function forecastCommitMessage(input: { chainId: string; networkId: string; stationId: string; commitId: string }): Uint8Array {
  return concat(
    encoder.encode(COMMIT_AUTH_DOMAIN),
    framed(input.chainId),
    framed(input.networkId),
    framed(input.stationId),
    framed(input.commitId),
    framed(FORECAST_CONTRIBUTION_TYPE),
  );
}

/** Public station alias (backend utils/station-alias.js): "st_" + 12 hex of sha256(domain + id). */
export function stationAliasOf(stationId: string): string {
  return `st_${bytesToHex(sha256(encoder.encode(`wrfcoin-station-alias-v1:${stationId}`))).slice(0, 12)}`;
}

/** core4 Transaction::compute_commit_id over the exact data text. */
export function forecastCommitId(data: string, nonce: string, stationId: string, timestamp: number): string {
  return bytesToHex(sha3_256(encoder.encode(`${data}||${nonce}||${stationId}||${timestamp}||${FORECAST_CONTRIBUTION_TYPE}`)));
}

/** The value as it is committed: rounded to one decimal place. */
export const roundForecastValue = (value: number): number => Math.round(value * 10) / 10;

export interface ForecastDraft {
  forecaster: string;
  stationAlias: string;
  stationId: string;
  variable: string;
  leadHours: number;
  value: number;
  data: string;
  nonce: string;
  timestamp: number;
  commitId: string;
  issuedAt: number;
  validAt: number;
}

export interface ForecastIntent {
  wallet: string;
  stationAlias: string;
  variable: ForecastVariable;
  leadHours: number;
  value: number;
}

export class DraftMismatch extends Error {}

/**
 * Check the draft against what the person asked for. Throws DraftMismatch naming the first problem; returns
 * the station id to sign over when everything matches.
 */
export function verifyForecastDraft(draft: ForecastDraft, intent: ForecastIntent): { stationId: string } {
  const fail = (why: string): never => { throw new DraftMismatch(why); };
  if (!draft || typeof draft !== 'object') fail('no draft');
  if (typeof draft.data !== 'string' || typeof draft.nonce !== 'string' || !Number.isSafeInteger(draft.timestamp)) fail('draft is incomplete');
  if (!HEX64.test(String(draft.commitId))) fail('commit id is not 64 hex characters');
  let parsed: Record<string, unknown>;
  try { parsed = JSON.parse(draft.data); } catch { return fail('data is not JSON'); }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) fail('data is not an object');
  const stationId = parsed.station_id;
  if (typeof stationId !== 'string' || !stationId) fail('data names no station');
  if (stationId !== draft.stationId) fail('station id differs from the draft');
  if (stationAliasOf(stationId as string) !== intent.stationAlias) fail('the draft is for a different station');
  if (parsed.horizon_hours !== intent.leadHours) fail('the draft has a different lead time');
  const values = parsed.values as Record<string, unknown> | undefined;
  const keys = values && typeof values === 'object' && !Array.isArray(values) ? Object.keys(values) : [];
  if (keys.length !== 1 || keys[0] !== intent.variable) fail('the draft forecasts a different variable');
  if (values![intent.variable] !== roundForecastValue(intent.value)) fail('the draft value differs from yours');
  if (parsed.issued_at !== draft.timestamp) fail('the commit time differs from the forecast time');
  if (parsed.valid_at !== draft.timestamp + intent.leadHours * 3600) fail('the target time does not match the lead');
  if (!ADDRESS.test(intent.wallet) || String(draft.forecaster).toLowerCase() !== intent.wallet.toLowerCase()) fail('the draft names a different wallet');
  if (forecastCommitId(draft.data, draft.nonce, stationId as string, draft.timestamp) !== draft.commitId) {
    fail('the commit id does not match the forecast');
  }
  return { stationId: stationId as string };
}

export interface SignedForecastCommit {
  data: string;
  nonce: string;
  timestamp: number;
  commitId: string;
  authPubkey: string;
  authSignature: string;
}

/**
 * Build the body for POST /api/forecasts/submit. `signer` is the unlocked wallet account (publicKey + sign);
 * the caller supplies it through withOwnerKey so the key lives for one signature only.
 */
export function signForecastCommit(
  draft: ForecastDraft,
  stationId: string,
  chain: { chainId: string; networkId: string },
  signer: { publicKey: Uint8Array; sign(message: Uint8Array): Uint8Array },
): SignedForecastCommit {
  const message = forecastCommitMessage({ chainId: chain.chainId, networkId: chain.networkId, stationId, commitId: draft.commitId });
  return {
    data: draft.data,
    nonce: draft.nonce,
    timestamp: draft.timestamp,
    commitId: draft.commitId,
    authPubkey: bytesToHex(signer.publicKey),
    authSignature: bytesToHex(signer.sign(message)),
  };
}
