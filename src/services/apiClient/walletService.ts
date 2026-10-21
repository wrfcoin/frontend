import type {
  WalletBalance,
  WalletHistoryDirection,
  WalletHistoryItem,
  WalletHistoryPage,
  WalletSendRequest,
  WalletSendResult,
  WalletTransaction,
} from './types';
import type { ServiceBaseUrls } from './runtime';
import { ApiClient } from './client';
import { requireExactBaseUnits } from './number';
import { FEATURES } from '../../config/features';
import { assertOrdinarySendRecipient } from '../walletCrypto/recipientStatus';

/** The edge admits `limit=<1..50>&offset=<0..999999>` in exactly this order (infra public_onboarding.caddy). */
export const WALLET_HISTORY_MAX_LIMIT = 50;
export const WALLET_HISTORY_MAX_OFFSET = 999_999;
export const WALLET_HISTORY_DEFAULT_LIMIT = 20;

/** Same bound as the backend's baseUnitString and the app's chain reward amount. */
function reportedChainAmount(value: unknown): string | null {
  if (typeof value === 'number') return Number.isSafeInteger(value) && value >= 0 ? String(value) : null;
  return typeof value === 'string' && /^(0|[1-9][0-9]{0,38})$/.test(value) ? value : null;
}

function nonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const text = String(value).trim();
  return text === '' ? null : text;
}

function exactAmountOrNull(value: unknown): string | null {
  if (typeof value === 'string' && /^-?\d+$/.test(value)) return value;
  if (typeof value === 'number' && Number.isSafeInteger(value)) return String(value);
  return null;
}

const sameAddress = (a: string | null, b: string): boolean => a !== null && a.toLowerCase() === b.toLowerCase();

function historyDirection(
  explicit: unknown,
  from: string | null,
  to: string | null,
  own: string,
): WalletHistoryDirection {
  if (explicit === 'received' || explicit === 'sent' || explicit === 'self') return explicit;
  if (explicit === 'incoming') return 'received';
  if (explicit === 'outgoing') return 'sent';
  if (from !== null) {
    if (!sameAddress(from, own)) return 'received';
    return to === null || !sameAddress(to, own) ? 'sent' : 'self';
  }
  return sameAddress(to, own) ? 'received' : 'unknown';
}

function toHistoryItem(entry: any, index: number, own: string): WalletHistoryItem {
  const from = nonEmptyString(entry.from ?? entry.sender);
  const to = nonEmptyString(entry.to);
  const height = Number(entry.blockHeight ?? entry.blockNumber);
  const direction = historyDirection(entry.direction, from, to, own);
  // v1 rows carry from/to and no counterparty: the other party is the one that is not the owner.
  const derived = direction === 'sent' ? to : direction === 'received' ? from : null;
  return {
    id: String(entry.eventId ?? entry.txId ?? entry.hash ?? entry.id ?? `tx-${index}`),
    type: nonEmptyString(entry.kind ?? entry.type),
    direction,
    amount: exactAmountOrNull(entry.amountBaseUnits ?? entry.amount),
    counterparty: nonEmptyString(entry.counterparty) ?? derived,
    from,
    to,
    timestamp: nonEmptyString(entry.timestamp),
    settlement: nonEmptyString(entry.settlement),
    status: nonEmptyString(entry.status),
    blockHeight: Number.isSafeInteger(height) && height >= 0 ? height : null,
  };
}

/**
 * The legacy consumers (useWalletData) know `confirmed`/`pending`/`failed`.
 * An explicit node status is kept verbatim (unknown words stay explicit); v2
 * settlement `paid`/`included` is on-chain, hence confirmed; with neither, a
 * block height means confirmed and anything else is pending.
 */
function legacyStatus(item: WalletHistoryItem): string {
  if (item.status !== null) return item.status;
  if (item.settlement === 'paid' || item.settlement === 'included') return 'confirmed';
  if (item.settlement !== null) return item.settlement;
  return item.blockHeight !== null ? 'confirmed' : 'pending';
}

function historyQuery(limit: number, offset: number): string {
  if (!Number.isInteger(limit) || limit < 1 || limit > WALLET_HISTORY_MAX_LIMIT) {
    throw new RangeError(`wallet history limit must be an integer 1..${WALLET_HISTORY_MAX_LIMIT}`);
  }
  if (!Number.isInteger(offset) || offset < 0 || offset > WALLET_HISTORY_MAX_OFFSET) {
    throw new RangeError(`wallet history offset must be an integer 0..${WALLET_HISTORY_MAX_OFFSET}`);
  }
  // Fixed order: the edge matcher is an anchored regex over the whole query.
  return `limit=${limit}&offset=${offset}`;
}

export class WalletService {
  private readonly client: ApiClient;

  constructor(baseUrls: ServiceBaseUrls) {
    this.client = new ApiClient({ baseUrl: baseUrls.wallet });
  }

  async getBalance(address: string): Promise<WalletBalance> {
    const response = await this.client.get<any>(`/wallet/${encodeURIComponent(address)}`);

    // Balance arrives as an exact decimal string (large u64/u128 base units) or
    // a small JS number, thanks to the big-integer-preserving JSON parser in
    // ApiClient (issue #236). Normalise to an exact base-units string so no
    // precision is lost above 2^53.
    const rawBalance = response.balance ?? response.available;
    const balance = requireExactBaseUnits(rawBalance, 'wallet balance');

    return {
      address,
      balance,
      symbol: response.symbol || 'WRF',
      updatedAt: response.updatedAt || new Date().toISOString(),
      earnedBalanceTotal: reportedChainAmount(
        response.earned_balance_total ?? response.earnedBalanceTotal,
      ),
      weatherRewards: reportedChainAmount(response.weatherRewards),
      weatherRewardsPending: reportedChainAmount(response.weatherRewardsPending),
      weatherRewardsUnavailable: nonEmptyString(response.weatherRewardsUnavailable),
    };
  }

  /**
   * One page of the wallet's own history. Reads only what the node reports: an
   * unreported amount, time or counterparty stays null (never a default), and
   * the direction is derived from the sender when the node does not state it.
   */
  async getWalletHistory(
    address: string,
    { limit = WALLET_HISTORY_DEFAULT_LIMIT, offset = 0 }: { limit?: number; offset?: number } = {},
  ): Promise<WalletHistoryPage> {
    const query = historyQuery(limit, offset);
    const response = await this.client.get<any>(
      `/wallet/${encodeURIComponent(address)}/transactions?${query}`,
    );
    const list = (value: unknown): any[] =>
      (Array.isArray(value) ? value : []).filter((row) => row !== null && typeof row === 'object');
    const items = list(Array.isArray(response) ? response : (response?.items ?? response?.transactions));
    const optionalInt = (value: unknown): number | null => {
      const n = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
      return typeof n === 'number' && Number.isSafeInteger(n) && n >= 0 ? n : null;
    };
    return {
      items: items.map((row, index) => toHistoryItem(row, index, address)),
      creditItems: list(response?.creditItems).map((row, index) => toHistoryItem(row, index, address)),
      offset,
      limit,
      complete: typeof response?.complete === 'boolean' ? response.complete : null,
      creditNextCursor: nonEmptyString(response?.creditNextCursor),
      windowStartHeight: optionalInt(response?.windowStartHeight),
      totalInWindow: optionalInt(response?.totalInWindow),
    };
  }

  /**
   * Legacy flat shape. A row whose amount the node did not report cannot be
   * represented here, so it is left out rather than shown as zero.
   */
  async getTransactions(
    address: string,
    options: { limit?: number; offset?: number } = {},
  ): Promise<WalletTransaction[]> {
    const page = await this.getWalletHistory(address, options);
    return page.items.flatMap((item) =>
      item.amount === null
        ? []
        : [{
          id: item.id,
          amount: item.amount,
          status: legacyStatus(item),
          timestamp: item.timestamp ?? new Date().toISOString(),
          // Reported from/to win; otherwise place the owner and the counterparty by direction.
          from: item.from ?? (item.direction === 'received' ? item.counterparty ?? undefined
            : item.direction === 'unknown' ? undefined : address),
          to: item.to ?? (item.direction === 'sent' ? item.counterparty ?? undefined
            : item.direction === 'unknown' ? undefined : address),
        }],
    );
  }

  async getNonce(address: string): Promise<string> {
    const response = await this.client.get<any>(`/${encodeURIComponent(address)}/nonce`);
    return requireExactBaseUnits(response.nonce, 'wallet nonce');
  }

  async sendSignedTransaction(request: WalletSendRequest): Promise<WalletSendResult> {
    assertOrdinarySendRecipient(request.to);
    if (!FEATURES.walletSend) {
      throw new Error('WALLET_SEND_UNAVAILABLE');
    }

    const response = await this.client.post<any>('/send', {
      from: request.from,
      to: request.to,
      amount: request.amount,
      nonce: request.nonce,
      auth_pubkey: request.auth_pubkey,
      auth_signature: request.auth_signature,
    });

    const txHash = String(
      response?.txHash ??
        response?.transaction?.hash ??
        response?.hash ??
        '',
    ).trim();

    if (!txHash) {
      throw new Error('Wallet send response did not include a transaction hash.');
    }

    return {
      txHash,
      status: response?.transaction?.status ?? response?.status,
      message: response?.message,
    };
  }
}

export default WalletService;
