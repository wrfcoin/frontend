// Every path here must be admitted by the public edge allowlist
// (infra testnet/edge/public_onboarding.caddy), pinned in
// src/routes/__fixtures__/public-edge-allowlist.json. GET
// /api/blockchain/blocks/{height} is deliberately NOT admitted there: the
// backend passes raw block metadata (per-address reward entries) through it.
export const publicReadonlyApi = {
  blocks: '/api/blockchain/blocks?limit=25',
  transaction: (hash: string) => `/api/blockchain/transactions/${encodeURIComponent(hash)}`,
  stations: '/api/weather/stations',
} as const;
