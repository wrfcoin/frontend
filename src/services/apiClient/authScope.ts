/**
 * Which requests may carry the wallet session Bearer token.
 *
 * The token is attached only to this explicit allowlist; every other request
 * (public reads included) goes out with no Authorization header. Matching is on
 * the full request pathname (base URL + path, query and fragment ignored), with
 * an optional leading `/api` because service base URLs resolve to `/api` or a
 * `/api/<service>` prefix. Patterns are anchored, so lookalikes such as
 * `/api/walletx/...` or a short `/api/wallet/0x123` do not match.
 *
 * Add a route here only when the backend gates it on the JWT.
 */
const WALLET_ADDRESS = '0x[0-9A-Fa-f]{40}';
const STATION_ID = '[A-Za-z0-9_-]{1,64}';
const PROPOSAL_ID = '[A-Za-z0-9_-]{1,128}';

interface AuthenticatedRoute {
  method: string;
  path: RegExp;
}

const AUTHENTICATED_ROUTES: readonly AuthenticatedRoute[] = [
  // Own-wallet reads and send (edge: Authorization "Bearer *").
  { method: 'GET', path: new RegExp(`^(?:/api)?/wallet/${WALLET_ADDRESS}$`) },
  { method: 'GET', path: new RegExp(`^(?:/api)?/wallet/${WALLET_ADDRESS}/transactions$`) },
  { method: 'GET', path: new RegExp(`^(?:/api)?/wallet/${WALLET_ADDRESS}/nonce$`) },
  { method: 'POST', path: /^(?:\/api)?\/wallet\/send$/ },
  // Station owner: own phone-station status, registration, key check, reward progress.
  { method: 'GET', path: /^(?:\/api)?\/weather\/stations\/mobile$/ },
  { method: 'POST', path: /^(?:\/api)?\/(?:weather\/)?stations$/ },
  { method: 'POST', path: /^(?:\/api)?\/(?:weather\/)?stations\/verify-key$/ },
  { method: 'GET', path: new RegExp(`^(?:/api)?/weather/stations/${STATION_ID}/reward-progress$`) },
  // Optional token (backend peekWalletSubject): the owner wallet gets the lifetime address total.
  { method: 'GET', path: new RegExp(`^(?:/api)?/(?:weather/)?stations/${STATION_ID}/earnings$`) },
  // Governance writes (backend requireAuth; the voter is the JWT subject).
  { method: 'POST', path: /^(?:\/api)?\/governance\/proposals$/ },
  { method: 'POST', path: new RegExp(`^(?:/api)?/governance/proposals/${PROPOSAL_ID}/vote$`) },
  { method: 'POST', path: /^(?:\/api)?\/governance\/delegate$/ },
  // Operator preview builds: the miner panel's node poll (backend /api/mining requireAuth).
  { method: 'GET', path: /^(?:\/api)?\/mining\/node-stats$/ },
  // Payout notifications (backend#389): wallet-login subscription routes (payoutNotifications.ts).
  { method: 'POST', path: /^(?:\/api)?\/notifications\/subscriptions$/ },
  { method: 'GET', path: new RegExp(`^(?:/api)?/notifications/subscriptions/${WALLET_ADDRESS}$`) },
  { method: 'DELETE', path: /^(?:\/api)?\/notifications\/subscriptions\/[0-9a-f-]{36}$/ },
  { method: 'POST', path: /^(?:\/api)?\/notifications\/subscriptions\/[0-9a-f-]{36}\/test$/ },
  // Compute job submission (backend requireAuth), including its fallback paths.
  { method: 'POST', path: /^(?:\/api)?\/compute\/(?:tasks|submit|submit-job)$/ },
];

function pathnameOf(url: string): string {
  const withoutOrigin = url.replace(/^[a-z][a-z0-9+.-]*:\/\/[^/?#]*/i, '');
  return withoutOrigin.split(/[?#]/, 1)[0];
}

export function shouldAttachBearer(method: string, url: string): boolean {
  const upper = method.toUpperCase();
  const pathname = pathnameOf(url);
  return AUTHENTICATED_ROUTES.some(route => route.method === upper && route.path.test(pathname));
}
