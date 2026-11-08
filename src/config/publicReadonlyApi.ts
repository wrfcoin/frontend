// Every path here must be admitted by the public edge allowlist
// (infra testnet/edge/public_onboarding.caddy), pinned in
// src/routes/__fixtures__/public-edge-allowlist.json. GET
// /api/blockchain/blocks/{height} is admitted (gated, digits only, no query) since
// backend#65 replaced its raw metadata with an allowlist projection.
export const publicReadonlyApi = {
  blocks: '/api/blockchain/blocks?limit=25',
  transaction: (hash: string) => `/api/blockchain/transactions/${encodeURIComponent(hash)}`,
  /** One block by height (backend#65 anonymous projection; edge @public_readonly_block_detail: digits, no query). */
  block: (height: number) => `/api/blockchain/blocks/${height}`,
  stations: '/api/weather/stations',
  /** Address lookup on /explore (backend#30 + earned total); `address` is lowercase 0x + 40 hex. */
  balance: (address: string) => `/api/public/balance/${encodeURIComponent(address)}`,
} as const;
