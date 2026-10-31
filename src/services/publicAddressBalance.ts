import { publicReadonlyApi } from '../config/publicReadonlyApi';

/**
 * Public address lookup for the explorer: backend `GET /api/public/balance/:address` (backend#30,
 * earned total added for the 2026-10-31 node-pay demo). No login, no bearer, rate-limited, and
 * default OFF on the server (404 when off).
 *
 * The route answers `{ address, balance, height, earned }`: `balance` is spendable base units and
 * `earned` is core4 `earned_balance_total` (everything the chain itself has credited to the address,
 * node pay included, which never shows as a transaction). Both are decimal strings. `earned` is
 * null when the server or node did not send it: shown as "unavailable", never as zero.
 */

export interface PublicAddressBalance {
  address: string;
  balanceUnits: string;
  earnedUnits: string | null;
  height: number;
}

export type PublicAddressLookup =
  | { kind: 'ok'; value: PublicAddressBalance }
  /** 404: the public read is switched off on this server. */
  | { kind: 'off' }
  /** 429, or 503 UPSTREAM_BUDGET_EXHAUSTED: rate limit or the server's node budget; try again shortly. */
  | { kind: 'busy' }
  /** Anything else: the node or server could not answer, or the answer was not well formed. */
  | { kind: 'unavailable' };

const HEX40 = /^[0-9a-fA-F]{40}$/;
const BASE_UNITS = /^(0|[1-9]\d{0,38})$/;

/**
 * `0x<40 hex>` or `wrf<40 hex>` (the same 20 bytes under the wallet's display prefix, see
 * walletUtils formatWrfcoinAddress) to lowercase `0x<40 hex>`; anything else is null.
 */
export function normalizeLookupAddress(input: string): string | null {
  const text = input.trim();
  const lower = text.toLowerCase();
  const hex = lower.startsWith('0x') ? text.slice(2) : lower.startsWith('wrf') ? text.slice(3) : null;
  return hex !== null && HEX40.test(hex) ? `0x${hex.toLowerCase()}` : null;
}

/** Strict parse of the route's answer for `address`; null when it is not well formed. */
export function parsePublicAddressBalance(body: unknown, address: string): PublicAddressBalance | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  if (typeof b.address !== 'string' || b.address.toLowerCase() !== address.toLowerCase()) return null;
  if (typeof b.balance !== 'string' || !BASE_UNITS.test(b.balance)) return null;
  if (typeof b.height !== 'number' || !Number.isSafeInteger(b.height) || b.height < 0) return null;
  let earnedUnits: string | null = null;
  if (b.earned !== undefined && b.earned !== null) {
    if (typeof b.earned !== 'string' || !BASE_UNITS.test(b.earned)) return null;
    earnedUnits = b.earned;
  }
  return { address: address.toLowerCase(), balanceUnits: b.balance, earnedUnits, height: b.height };
}

type FetchSignal = NonNullable<Parameters<typeof fetch>[1]>['signal'];

export async function lookupPublicAddress(address: string, signal?: FetchSignal): Promise<PublicAddressLookup> {
  const normalized = normalizeLookupAddress(address);
  if (!normalized) return { kind: 'unavailable' };
  let response: Response;
  try {
    response = await fetch(publicReadonlyApi.balance(normalized), { signal, headers: { accept: 'application/json' } });
  } catch (error) {
    if ((error as { name?: string } | null)?.name === 'AbortError') throw error;
    return { kind: 'unavailable' };
  }
  if (response.status === 404) return { kind: 'off' };
  if (response.status === 429) return { kind: 'busy' };
  if (response.status === 503) {
    // Only the node-budget 503 is "busy"; a 503 for missing server config is plain unavailable.
    const code = await response.json().then((j: { error?: { code?: unknown } }) => j?.error?.code, () => undefined);
    return code === 'UPSTREAM_BUDGET_EXHAUSTED' ? { kind: 'busy' } : { kind: 'unavailable' };
  }
  if (!response.ok) return { kind: 'unavailable' };
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return { kind: 'unavailable' };
  }
  const value = parsePublicAddressBalance(body, normalized);
  return value ? { kind: 'ok', value } : { kind: 'unavailable' };
}
