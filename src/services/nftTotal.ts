import { fetchNftListPage } from './nftApi';

/**
 * Minted NFT count from the mounted GET /api/nft `pagination.total`, read
 * through fetchNftListPage: raw envelope, with the session bearer the NFT
 * router's requireAuth demands. A missing or malformed total throws; it is
 * never replaced by a guess.
 */
export async function fetchNftTotal(token?: string): Promise<number> {
  return (await fetchNftListPage(1, token)).total;
}
