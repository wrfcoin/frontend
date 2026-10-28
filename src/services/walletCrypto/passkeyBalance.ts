import { ApiClient } from '../apiClient/client';

/**
 * The passkey account's spendable balance from backend `GET /api/public/balance/:address` (owner ruling
 * 2026-10-28 (b)): read-only, no login, rate-limited, default OFF on the server. The route answers
 * exactly `{ address, balance, height }`; balance is base units as a decimal string.
 *
 * Anything other than a well-formed answer for THIS address throws, so the caller shows
 * "Unavailable" instead of a number: a 404 (route switched off), a 429, a 502/504 (node could not
 * answer), a missing or non-integer balance, or an answer for another address.
 */
export interface PasskeyPublicBalance {
  units: string;
  height: number;
}

const client = new ApiClient({ baseUrl: '/api' });
const BASE_UNITS = /^(0|[1-9]\d*)$/;
const ADDRESS = /^0x[0-9a-fA-F]{40}$/;

export async function getPasskeyPublicBalance(address: string): Promise<PasskeyPublicBalance> {
  if (!ADDRESS.test(address)) throw new Error('PASSKEY_BALANCE_BAD_ADDRESS');
  const body = await client.get<{ address?: unknown; balance?: unknown; height?: unknown }>(
    `/public/balance/${encodeURIComponent(address.toLowerCase())}`,
  );
  const units = body?.balance;
  const height = typeof body?.height === 'string' && /^\d{1,15}$/.test(body.height) ? Number(body.height) : body?.height;
  if (typeof body?.address !== 'string' || body.address.toLowerCase() !== address.toLowerCase()) throw new Error('PASSKEY_BALANCE_INVALID');
  if (typeof units !== 'string' || !BASE_UNITS.test(units)) throw new Error('PASSKEY_BALANCE_INVALID');
  if (typeof height !== 'number' || !Number.isSafeInteger(height) || height < 0) throw new Error('PASSKEY_BALANCE_INVALID');
  return { units, height };
}
