import {
  PUBLIC_ONBOARDING_PATHS,
  PUBLIC_READONLY_PATHS,
  isPublicTestnetPath,
} from './contractSurfacePolicy';

/**
 * Menu entries for the public build (S0). The route policy in
 * contractSurfacePolicy.ts stays the single source of truth for what is
 * reachable: this list only supplies labels, icons and order, and every entry
 * is passed through `isPublicTestnetPath` before it is shown, so an entry the
 * policy does not admit can never render.
 *
 * Routes in the policy sets that are deliberately not menu targets are listed
 * in PUBLIC_NON_MENU_PATHS; a test asserts every public route is either an
 * entry here or named there, so a newly admitted route cannot be forgotten.
 */
export type PublicNavEntry = {
  name: string;
  path: string;
  icon: string;
  /** One line of plain-language description, used on the home page cards. */
  description: string;
  group: 'main' | 'legal';
};

export const PUBLIC_NAV_ENTRIES: readonly PublicNavEntry[] = [
  { name: 'Home', path: '/', icon: 'bi-house', group: 'main', description: 'Testnet overview and live chain numbers.' },
  { name: 'Get started', path: '/onboarding', icon: 'bi-rocket-takeoff', group: 'main', description: 'Create or open a wallet and join the testnet.' },
  { name: 'Weather map', path: '/map', icon: 'bi-globe-americas', group: 'main', description: 'See weather stations and coverage on a map.' },
  { name: 'Explore', path: '/explore', icon: 'bi-boxes', group: 'main', description: 'Look through the latest blocks on the testnet.' },
  { name: 'Nodes', path: '/nodes', icon: 'bi-hdd-network', group: 'main', description: 'Who produces blocks, who is bonded, and who checks readings.' },
  { name: 'Forecasters', path: '/forecasters', icon: 'bi-graph-up-arrow', group: 'main', description: 'Who is forecasting on the testnet, and how their track record is building.' },
  { name: 'Competition', path: '/competitions', icon: 'bi-award', group: 'main', description: "This week's forecast competition: points for every forecast the chain scores." },
  { name: 'Challenges', path: '/challenges', icon: 'bi-people', group: 'main', description: 'Start a forecast challenge with friends, or join one with a code.' },
  { name: 'Duels', path: '/duels', icon: 'bi-lightning-charge', group: 'main', description: 'Free-play forecast duels: two forecasters, one station, no stakes.' },
  { name: 'Search', path: '/search', icon: 'bi-search', group: 'main', description: 'Find a block, transaction, address or station.' },
  { name: 'Leaderboard', path: '/leaderboard/contributors', icon: 'bi-trophy', group: 'main', description: 'Top contributors and what they have earned.' },
  { name: 'Governance', path: '/governance/public', icon: 'bi-bank', group: 'main', description: 'Read proposals and the treasury (read-only).' },
  { name: 'Forecast', path: '/weather/forecast', icon: 'bi-cloud-sun', group: 'main', description: 'Current conditions and a 7-day forecast for a place.' },
  { name: 'Forecast check', path: '/forecast-check', icon: 'bi-clipboard-check', group: 'main', description: 'How forecasts committed on chain scored against station readings.' },
  { name: 'Wallet', path: '/wallet', icon: 'bi-wallet2', group: 'main', description: 'View your own testnet address and balance.' },
  { name: 'Connect a station', path: '/connect-station', icon: 'bi-broadcast-pin', group: 'main', description: 'Link your weather station to your wallet.' },
  { name: 'Downloads', path: '/downloads', icon: 'bi-download', group: 'main', description: 'What you can install, where it works, and how to verify it.' },
  { name: 'Terms', path: '/terms', icon: 'bi-file-text', group: 'legal', description: 'Terms of use.' },
  { name: 'Privacy', path: '/privacy', icon: 'bi-shield-lock', group: 'legal', description: 'Privacy notice.' },
  { name: 'API terms', path: '/api-terms', icon: 'bi-file-code', group: 'legal', description: 'Terms for the public API.' },
  { name: 'Security', path: '/security', icon: 'bi-shield-check', group: 'legal', description: 'Security policy and reporting.' },
];

/**
 * The passkey wallet flag as features.ts reads it (VITE_ENABLE_PASSKEY_WALLET, exact "true" only), for
 * callers that read the env at render time like the read-only flag. Kept here, not imported from
 * features.ts, because many tests replace that module wholesale.
 */
export function isPasskeyWalletEnabled(value: unknown): boolean {
  return value === 'true';
}

/**
 * The passkey wallet entry. It is a menu entry only in a build with the passkey flag on
 * (VITE_ENABLE_PASSKEY_WALLET); with the flag off the route does not exist and the path is
 * listed in PUBLIC_NON_MENU_PATHS instead. It sits right after 'Wallet'.
 */
export const PASSKEY_WALLET_NAV_ENTRY: PublicNavEntry = {
  name: 'Passkey wallet',
  path: '/wallet/passkey',
  icon: 'bi-fingerprint',
  group: 'main',
  description: 'A wallet unlocked with your fingerprint, face or a YubiKey; free test coins built in.',
};

/** Menu entries for a build, with the passkey wallet inserted after 'Wallet' when its flag is on. */
export function publicNavEntriesFor(passkeyWalletEnabled: boolean): PublicNavEntry[] {
  if (!passkeyWalletEnabled) return [...PUBLIC_NAV_ENTRIES];
  const at = PUBLIC_NAV_ENTRIES.findIndex(e => e.path === '/wallet') + 1;
  return [...PUBLIC_NAV_ENTRIES.slice(0, at), PASSKEY_WALLET_NAV_ENTRY, ...PUBLIC_NAV_ENTRIES.slice(at)];
}

/** Public routes that are intentionally not menu entries (passkey flag off), with the reason. */
export const PUBLIC_NON_MENU_PATHS: Readonly<Record<string, string>> = {
  '/explorer': 'redirects to /explore?tab=blocks (same page; one menu entry, frontend#561)',
  '/weather/station/:stationId': 'detail page reached from the map and lists, not a destination',
  '/earn': 'alias of /connect-station (same page)',
  '/governance/public/:proposalId': 'proposal detail reached from the governance list, not a destination',
  '/contributor/:key': 'profile reached from the leaderboard by opaque key, not a destination',
  '/forecasters/:profileKey': 'track record reached from the forecasters page, not a destination',
  '/faucet/bond-grants': 'bond-grant audit list linked from the node operator guide, not a destination',
  '/proof/:commitId': 'proof card for one station reading, opened from a station page or a shared link, not a destination',
  '/challenges/:code': 'one friend challenge board, opened from a shared invite link, not a destination',
  '/duels/:id': 'one duel, opened from the duel board or a shared link, not a destination',
  '/wallet/passkey': 'flagged preview (VITE_ENABLE_PASSKEY_WALLET, default off): with the flag on it is a menu entry instead',
  '/wallet/passkey/bond-payout': 'node bond payout approval, linked from the passkey wallet (VITE_ENABLE_PASSKEY_BOND_PAYOUT, default off), not a destination',
};

/** Non-menu routes for a build: with the passkey flag on, /wallet/passkey is a menu entry, not listed here. */
export function publicNonMenuPathsFor(passkeyWalletEnabled: boolean): Readonly<Record<string, string>> {
  if (!passkeyWalletEnabled) return PUBLIC_NON_MENU_PATHS;
  const { '/wallet/passkey': _menuEntry, ...rest } = PUBLIC_NON_MENU_PATHS;
  return rest;
}

/** Entries the public build can actually reach, in display order. */
export function getPublicNavEntries(publicReadonlyEnabled: boolean, passkeyWalletEnabled = false): PublicNavEntry[] {
  return publicNavEntriesFor(passkeyWalletEnabled).filter(entry =>
    isPublicTestnetPath(entry.path, false, publicReadonlyEnabled, false),
  );
}

/** Every route the policy admits to the public build, for coverage checks. */
export function allPublicPolicyPaths(): string[] {
  return [
    ...PUBLIC_READONLY_PATHS,
    ...PUBLIC_ONBOARDING_PATHS,
    '/',
    '/terms',
    '/privacy',
    '/api-terms',
    '/security',
    '/downloads',
  ];
}
