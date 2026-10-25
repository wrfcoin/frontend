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
  { name: 'Forecasters', path: '/forecasters', icon: 'bi-graph-up-arrow', group: 'main', description: 'Who is forecasting on the testnet, and how their track record is building.' },
  { name: 'Search', path: '/search', icon: 'bi-search', group: 'main', description: 'Find a block, transaction, address or station.' },
  { name: 'Leaderboard', path: '/leaderboard/contributors', icon: 'bi-trophy', group: 'main', description: 'Top contributors and what they have earned.' },
  { name: 'Governance', path: '/governance/public', icon: 'bi-bank', group: 'main', description: 'Read proposals and the treasury (read-only).' },
  { name: 'Forecast', path: '/weather/forecast', icon: 'bi-cloud-sun', group: 'main', description: 'Current conditions and a 7-day forecast for a place.' },
  { name: 'Wallet', path: '/wallet', icon: 'bi-wallet2', group: 'main', description: 'View your own testnet address and balance.' },
  { name: 'Connect a station', path: '/connect-station', icon: 'bi-broadcast-pin', group: 'main', description: 'Link your weather station to your wallet.' },
  { name: 'Downloads', path: '/downloads', icon: 'bi-download', group: 'main', description: 'What you can install, where it works, and how to verify it.' },
  { name: 'Terms', path: '/terms', icon: 'bi-file-text', group: 'legal', description: 'Terms of use.' },
  { name: 'Privacy', path: '/privacy', icon: 'bi-shield-lock', group: 'legal', description: 'Privacy notice.' },
  { name: 'API terms', path: '/api-terms', icon: 'bi-file-code', group: 'legal', description: 'Terms for the public API.' },
  { name: 'Security', path: '/security', icon: 'bi-shield-check', group: 'legal', description: 'Security policy and reporting.' },
];

/** Public routes that are intentionally not menu entries, with the reason. */
export const PUBLIC_NON_MENU_PATHS: Readonly<Record<string, string>> = {
  '/explorer': 'redirects to /explore?tab=blocks (same page; one menu entry, frontend#561)',
  '/weather/station/:stationId': 'detail page reached from the map and lists, not a destination',
  '/earn': 'alias of /connect-station (same page)',
  '/governance/public/:proposalId': 'proposal detail reached from the governance list, not a destination',
  '/contributor/:key': 'profile reached from the leaderboard by opaque key, not a destination',
  '/forecasters/:profileKey': 'track record reached from the forecasters page, not a destination',
  '/faucet/bond-grants': 'bond-grant audit list linked from the node operator guide, not a destination',
  '/wallet/passkey': 'flagged preview (VITE_ENABLE_PASSKEY_WALLET, default off); reached by direct link, not a destination',
};

/** Entries the public build can actually reach, in display order. */
export function getPublicNavEntries(publicReadonlyEnabled: boolean): PublicNavEntry[] {
  return PUBLIC_NAV_ENTRIES.filter(entry =>
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
