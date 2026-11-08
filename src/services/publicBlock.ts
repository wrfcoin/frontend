import { publicReadonlyApi } from '../config/publicReadonlyApi';

/**
 * Public lookup of one block by height: backend `GET /api/blockchain/blocks/:height`, which serves
 * anonymous callers the backend#65 projection: the header, the transaction list without senders
 * (type, plus a commit id for readings and reading checks), and block-level metadata aggregates.
 * No address, station id or per-identity amount is in the answer. This parser keeps only the
 * fields the page shows and drops anything it cannot read.
 */

export const MAX_BLOCK_HEIGHT = 9_999_999_999; // the edge admits 1 to 10 digits

export interface BlockRewardSummary {
  count: number | null;
  /** Base units (1 WRF = 1e8) as a digit string, or null when the server could not total them. */
  totalBaseUnits: string | null;
}

export interface PublicBlock {
  height: number;
  hash: string | null;
  previousHash: string | null;
  /** ISO time, or null. */
  timestamp: string | null;
  transactionCount: number;
  /** Count of transactions per core4 type, in first-seen order. */
  typeCounts: Array<{ type: string | null; count: number }>;
  /** Commit ids of station-reading reveals in this block (each has a proof page). */
  revealCommitIds: string[];
  rewards: {
    stations: BlockRewardSummary | null;
    attesters: BlockRewardSummary | null;
    producerBaseUnits: string | null;
    mintedTotalBaseUnits: string | null;
  };
}

export type PublicBlockLookup =
  | { kind: 'ok'; value: PublicBlock }
  /** 404: no block at this height on this node (not produced yet, or outside what it keeps). */
  | { kind: 'missing' }
  /** 429: rate limit. */
  | { kind: 'busy' }
  /** Anything else, including an answer this app cannot read. */
  | { kind: 'unavailable' };

const HEIGHT = /^\d{1,10}$/;
const HEX64 = /^(?:0x)?[0-9a-fA-F]{64}$/;
const TYPE = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;
const DIGITS = /^\d{1,40}$/;

/** A block height from user input: 0 to 9,999,999,999, digits only. */
export function parseBlockHeight(input: string): number | null {
  const s = input.trim();
  if (!HEIGHT.test(s)) return null;
  const n = Number(s);
  return Number.isSafeInteger(n) && n >= 0 && n <= MAX_BLOCK_HEIGHT ? n : null;
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const hexOrNull = (v: unknown) => (typeof v === 'string' && HEX64.test(v) ? v.replace(/^0x/, '').toLowerCase() : null);
const count = (v: unknown) => (typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 ? v : null);
/** core4 writes metadata numbers as strings; accept a digit string or a safe non-negative integer. */
const digits = (v: unknown): string | null => {
  if (typeof v === 'string' && DIGITS.test(v)) return v.replace(/^0+(?=\d)/, '');
  if (typeof v === 'number' && Number.isSafeInteger(v) && v >= 0) return String(v);
  return null;
};

function summary(v: unknown): BlockRewardSummary | null {
  if (!isObj(v)) return null;
  return { count: count(v.count), totalBaseUnits: digits(v.total_amount) };
}

export function parsePublicBlock(body: unknown, height: number): PublicBlock | null {
  if (!isObj(body)) return null;
  const b = isObj(body.data) ? body.data : body;
  if (count(b.height) !== height) return null;
  const txs = Array.isArray(b.transactions) ? b.transactions : [];
  const typeCounts: PublicBlock['typeCounts'] = [];
  const revealCommitIds: string[] = [];
  for (const tx of txs) {
    const type = isObj(tx) && typeof tx.type === 'string' && TYPE.test(tx.type) ? tx.type : null;
    const row = typeCounts.find(r => r.type === type);
    if (row) row.count += 1;
    else typeCounts.push({ type, count: 1 });
    if (type === 'ContributionReveal' && isObj(tx) && isObj(tx.payload)) {
      const id = hexOrNull(tx.payload.commit_id);
      if (id && !revealCommitIds.includes(id)) revealCommitIds.push(id);
    }
  }
  const md = isObj(b.metadata) ? b.metadata : {};
  const producer = isObj(md.producer_settlement) ? digits(md.producer_settlement.amount) : null;
  // Same rule as the explorer list (parseBlockDate): a number below 1e12 is seconds.
  const millis = typeof b.timestamp === 'number' && Number.isFinite(b.timestamp)
    ? (b.timestamp < 1e12 ? b.timestamp * 1000 : b.timestamp)
    : typeof b.timestamp === 'string' ? Date.parse(b.timestamp) : Number.NaN;
  const timestamp = Number.isFinite(millis) ? new Date(millis).toISOString() : null;
  return {
    height,
    hash: hexOrNull(b.hash),
    previousHash: hexOrNull(b.previousHash),
    timestamp,
    transactionCount: count(b.transactionCount) ?? txs.length,
    typeCounts,
    revealCommitIds,
    rewards: {
      stations: summary(md.reward_entries_summary),
      attesters: summary(md.attester_settlements_summary),
      producerBaseUnits: producer,
      mintedTotalBaseUnits: digits(md.rewards_minted_total),
    },
  };
}

type FetchSignal = NonNullable<Parameters<typeof fetch>[1]>['signal'];

export async function lookupPublicBlock(height: number, signal?: FetchSignal): Promise<PublicBlockLookup> {
  if (!Number.isSafeInteger(height) || height < 0 || height > MAX_BLOCK_HEIGHT) return { kind: 'unavailable' };
  let response: Response;
  try {
    response = await fetch(publicReadonlyApi.block(height), { signal, headers: { accept: 'application/json' } });
  } catch (error) {
    if ((error as { name?: string } | null)?.name === 'AbortError') throw error;
    return { kind: 'unavailable' };
  }
  if (response.status === 404) return { kind: 'missing' };
  if (response.status === 429) return { kind: 'busy' };
  if (!response.ok) return { kind: 'unavailable' };
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return { kind: 'unavailable' };
  }
  const value = parsePublicBlock(body, height);
  return value ? { kind: 'ok', value } : { kind: 'unavailable' };
}
