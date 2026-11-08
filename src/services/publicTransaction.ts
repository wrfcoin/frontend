import { publicReadonlyApi } from '../config/publicReadonlyApi';

/**
 * Public lookup of one transaction by hash: backend `GET /api/blockchain/transactions/:hash`.
 * The answer carries only what the chain already makes public about a hash: whether the node has
 * it (pending or in a block), the block height, the transaction type and that block's time. No
 * sender, recipient, amount or payload is in the answer. The node only searches the blocks it keeps
 * and its mempool, so "unknown" means "not found on this node", not "never existed".
 */

export type TxStatus = 'pending' | 'included' | 'unknown';

export interface PublicTransaction {
  hash: string;
  status: TxStatus;
  blockHeight: number | null;
  txType: string | null;
  /** ISO time of the block, or null when the node did not say. */
  timestamp: string | null;
}

export type PublicTransactionLookup =
  | { kind: 'ok'; value: PublicTransaction }
  /** 501: this server's backend predates the lookup. */
  | { kind: 'off' }
  /** 429: rate limit; try again shortly. */
  | { kind: 'busy' }
  /** Anything else: the node or server could not answer, or the answer was not well formed. */
  | { kind: 'unavailable' };

const HASH = /^(?:0x)?([0-9a-fA-F]{64})$/;
const TYPE = /^[A-Za-z][A-Za-z0-9]{0,63}$/;
const STATUSES: ReadonlySet<string> = new Set(['pending', 'included', 'unknown']);

/** `0x` + 64 lowercase hex, or null. */
export function normalizeTxHash(input: string): string | null {
  const match = HASH.exec(input.trim());
  return match ? `0x${match[1].toLowerCase()}` : null;
}

export function parsePublicTransaction(body: unknown, hash: string): PublicTransaction | null {
  if (!body || typeof body !== 'object') return null;
  const data = (body as { data?: unknown }).data;
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  if (typeof d.hash !== 'string' || normalizeTxHash(d.hash) !== hash) return null;
  if (typeof d.status !== 'string' || !STATUSES.has(d.status)) return null;
  const status = d.status as TxStatus;
  const blockHeight =
    status === 'included' && typeof d.blockHeight === 'number' && Number.isSafeInteger(d.blockHeight) && d.blockHeight >= 0
      ? d.blockHeight
      : null;
  if (status === 'included' && blockHeight === null) return null;
  const txType = typeof d.txType === 'string' && TYPE.test(d.txType) ? d.txType : null;
  const timestamp = typeof d.timestamp === 'string' && Number.isFinite(Date.parse(d.timestamp)) ? d.timestamp : null;
  return { hash, status, blockHeight, txType, timestamp };
}

type FetchSignal = NonNullable<Parameters<typeof fetch>[1]>['signal'];

export async function lookupPublicTransaction(input: string, signal?: FetchSignal): Promise<PublicTransactionLookup> {
  const hash = normalizeTxHash(input);
  if (!hash) return { kind: 'unavailable' };
  let response: Response;
  try {
    response = await fetch(publicReadonlyApi.transaction(hash), { signal, headers: { accept: 'application/json' } });
  } catch (error) {
    if ((error as { name?: string } | null)?.name === 'AbortError') throw error;
    return { kind: 'unavailable' };
  }
  if (response.status === 501) return { kind: 'off' };
  if (response.status === 429) return { kind: 'busy' };
  if (!response.ok) return { kind: 'unavailable' };
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return { kind: 'unavailable' };
  }
  const value = parsePublicTransaction(body, hash);
  return value ? { kind: 'ok', value } : { kind: 'unavailable' };
}

const TYPE_LABELS: Readonly<Record<string, string>> = {
  Transfer: 'Send',
  Regular: 'Send',
  Coinbase: 'Block reward',
  Reward: 'Reward',
  ForecastCommit: 'Forecast (sealed)',
  ForecastReveal: 'Forecast reveal',
  ContributionCommit: 'Station reading (sealed)',
  ContributionReveal: 'Station reading reveal',
  OracleAttestation: 'Reading check',
  StationRegistration: 'Station registration',
  Stake: 'Stake',
  Unstake: 'Unstake',
  GovernanceProposal: 'Governance proposal',
  GovernanceVote: 'Governance vote',
};

/** Plain words for a core4 transaction type: a known label, else the name split into words. */
export function txTypeLabel(txType: string | null): string {
  if (!txType) return 'Not reported';
  return TYPE_LABELS[txType] ?? txType.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
}
