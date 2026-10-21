import { serviceBaseUrls } from './apiClient';
import { getAuthToken } from './authTokenStore';

export interface NftListPage {
  nfts: Record<string, unknown>[];
  total: number;
}

/**
 * One page of GET /api/nft (backend nft-routes.js -> core4 /nft/list), with
 * the raw envelope `{ success, data, pagination }` kept intact.
 *
 * - Not ApiClient.get: its envelope unwrapping returns `data` and drops
 *   `pagination`, the only source of the minted total (frontend#394).
 * - The NFT router applies requireAuth to every route, so the request carries
 *   the session's bearer token, the same authTokenStore token ApiClient
 *   sends. Without a token there is nothing to ask for.
 * - A malformed envelope or total throws; it is never replaced by a guess.
 */
export async function fetchNftListPage(
  limit: number,
  token: string = getAuthToken(),
): Promise<NftListPage> {
  const bearer = token.trim();
  if (!bearer) {
    throw new Error('NFT listing requires a signed-in session');
  }
  const response = await fetch(`${serviceBaseUrls.api}/nft?limit=${encodeURIComponent(String(limit))}`, {
    headers: { Authorization: `Bearer ${bearer}` },
  });
  if (!response.ok) {
    throw new Error(`NFT listing unavailable (HTTP ${response.status})`);
  }
  const body = (await response.json()) as {
    success?: unknown;
    data?: unknown;
    pagination?: { total?: unknown };
  };
  const total = body?.pagination?.total;
  if (
    body?.success !== true ||
    !Array.isArray(body.data) ||
    typeof total !== 'number' ||
    !Number.isFinite(total) ||
    total < 0
  ) {
    throw new Error('NFT listing response had no valid data and pagination.total');
  }
  return { nfts: body.data as Record<string, unknown>[], total };
}
