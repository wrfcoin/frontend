export const CAPABILITY_REQUIRED_FEATURES = [
  'identity', 'fleet', 'feeMarket', 'community', 'notifications', 'leaderboard',
] as const;

const routeFamilies: Array<[string, string]> = [
  ['/identity', 'identity'], ['/fleet', 'fleet'], ['/network/fees', 'feeMarket'],
  ['/community', 'community'], ['/notifications', 'notifications'],
  ['/leaderboard', 'leaderboard'], ['/leaderboard/cooperatives', 'community'],
];
export function isCapabilityRouteAvailable(path: string, enabled: (key: string) => boolean): boolean {
  // The public contributors page is gated by `leaderboardRead` (CapabilitiesContext), not `leaderboard`.
  if (path === '/leaderboard/contributors') return enabled('leaderboardRead');
  return routeFamilies.every(([prefix, key]) =>
    (path !== prefix && !path.startsWith(`${prefix}/`)) || enabled(key));
}
