/** @jest-environment jsdom */
/**
 * frontend#349 — the route set App.jsx mounts, from the real route modules
 * through the real filter, and what react-router actually matches for
 * concrete URLs in each build.
 */
import { createRoutesFromChildren, matchRoutes } from 'react-router-dom';

import { appRouteElements } from '../appRouteTree';
import { collectRoutePaths, filterPublicRouteNodes } from '../publicRouteFilter';

const STATION = '/weather/station/:stationId';
const PRIOR_READONLY = ['/explore', '/explorer', '/map', '/search'];
const CORE = ['/', '/terms', '/privacy', '/api-terms', '/security', '/downloads', '*'];

function mounted(publicReadonly) {
  const tree = appRouteElements({ validatorOpsEnabled: true, networkInsightsEnabled: true, isFeatureEnabled: () => true });
  return filterPublicRouteNodes(tree, false, publicReadonly, false);
}

// Resolve the URL the way the browser does (dot segments collapse before the
// router sees the pathname), then ask react-router which pattern it lands on.
function matchedPattern(publicReadonly, url) {
  const { pathname } = new URL(url, 'https://wrfcoin.test');
  const matches = matchRoutes(createRoutesFromChildren(mounted(publicReadonly)), pathname);
  return matches ? matches[matches.length - 1].route.path : null;
}

describe('station detail route (Stage 1.5)', () => {
  it('the default build does not mount it', () => {
    const paths = collectRoutePaths(mounted(false));
    expect(paths).not.toContain(STATION);
    expect([...paths].sort()).toEqual([...CORE].sort());
  });

  it('the read-only build mounts exactly the prior four, station detail, the public leaderboard and /onboarding', () => {
    const paths = collectRoutePaths(mounted(true));
    expect(paths.filter(p => !CORE.includes(p)).sort()).toEqual(
      [...PRIOR_READONLY, STATION, '/leaderboard/contributors', '/onboarding', '/wallet', '/connect-station', '/earn',
        '/governance/public', '/governance/public/:proposalId', '/weather/forecast', '/contributor/:key',
        '/forecasters', '/forecasters/:profileKey', '/competitions',
        '/faucet/bond-grants', '/proof/:commitId', '/nodes', '/forecast-check', '/challenges', '/challenges/:code', '/duels', '/duels/:id'].sort(),
    );
    expect(paths).not.toContain('/earnings');
  });

  it('a concrete station URL renders the station page only in the read-only build', () => {
    expect(matchedPattern(true, '/weather/station/abc-123')).toBe(STATION);
    expect(matchedPattern(false, '/weather/station/abc-123')).toBe('*');
  });

  it.each([
    '/weather/station/../earnings',
    '/weather/station/%2e%2e/earnings',
    '/weather/station/abc/../../earnings',
    '/weather/station/abc/earnings',
    '/weather/stationX',
    '/weather/stationX/abc',
    '/weather/station',
    '/earnings',
    '/earnings/history',
  ])('%s falls through to the 404 route in the read-only build', url => {
    expect(matchedPattern(true, url)).toBe('*');
  });
});
