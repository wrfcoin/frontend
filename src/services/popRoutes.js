/**
 * frontend#354: popService talks to /api/pop/*, but the deployed backend
 * (enhanced_unified_api_optimized.ts; see
 * src/routes/__fixtures__/backend-main-mounts.json) mounts no /api/pop routes.
 * Until it does, PoP write controls are disabled and say why, and a forced
 * submit sends nothing. Flip this only together with a backend route that
 * serves them.
 */
export const POP_ROUTES_SERVED = false;

// The one explanation every PoP submit control shows while the routes are unserved.
export const POP_SUBMISSION_UNAVAILABLE =
  'Environmental data submissions are not accepted by the testnet API yet: it serves no /api/pop routes.';
