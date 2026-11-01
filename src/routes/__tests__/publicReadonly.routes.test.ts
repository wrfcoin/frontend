import {
  PUBLIC_ONBOARDING_PATHS,
  PUBLIC_READONLY_PATHS,
  explicitPathClass,
  isPublicTestnetPath,
} from '../../config/contractSurfacePolicy';

describe('Stage 1.5 public route policy', () => {
  it('admits exactly the read-only and onboarding paths when enabled', () => {
    const candidates = [
      '/explore', '/explorer', '/map', '/search', '/weather/station/:stationId', '/leaderboard/contributors',
      '/governance/public', '/governance/public/:proposalId', '/weather/forecast', '/contributor/:key',
      '/forecasters', '/forecasters/:profileKey', '/competitions',
      '/faucet/bond-grants', '/faucet', '/faucet/bond-grant', '/faucet/bond-grants/x',
      '/proof/:commitId', '/proof', '/proofs/:commitId', '/proof/:commitId/x',
      '/nodes', '/nodes/x', '/network/nodes',
      '/forecast-check', '/forecast-check/x',
      '/wallet', '/onboarding', '/governance', '/nfts', '/miner', '/dashboard',
      '/earnings', '/weather/dashboard', '/connect-station', '/earn', '/connect-station/x', '/earn/x',
      '/leaderboard', '/leaderboard/contributors/x', '/leaderboard/nearby', '/leaderboard/profile/:address',
    ];
    const admitted = candidates.filter(path => isPublicTestnetPath(path, false, true));
    // W18 (owner rulings 2026-10-01 and 2026-10-02 #14): the web onboarding loop and the exact station
    // join paths join the public build; no subpath and nothing else does.
    expect(admitted).toEqual([...PUBLIC_READONLY_PATHS, '/wallet', '/onboarding', '/connect-station', '/earn']);
    // S4-S6 added exact entries only; their parents and descendants must not ride along by prefix.
    expect(PUBLIC_READONLY_PATHS.has('/governance/public')).toBe(true);
    expect(isPublicTestnetPath('/governance', false, true)).toBe(false);
    expect(isPublicTestnetPath('/governance/public/x/votes', false, true)).toBe(false);
    expect(isPublicTestnetPath('/weather/forecast/studio', false, true)).toBe(false);
    expect(isPublicTestnetPath('/forecast', false, true)).toBe(false);
    expect(isPublicTestnetPath('/contributor', false, true)).toBe(false);
    expect(isPublicTestnetPath('/contributor/:key/edit', false, true)).toBe(false);
    expect(isPublicTestnetPath('/impact/:address', false, true)).toBe(false);
    // core4#3604 A4: two exact forecaster entries; no other descendant rides along.
    expect(isPublicTestnetPath('/forecasters/:profileKey/edit', false, true)).toBe(false);
    expect(isPublicTestnetPath('/forecasters/abc', false, true)).toBe(false);
    // Bond-grant audit list: one exact entry; the faucet's other paths never ride along.
    expect(isPublicTestnetPath('/faucet', false, true)).toBe(false);
    expect(isPublicTestnetPath('/faucet/bond-grants/x', false, true)).toBe(false);
    // backend#229 proof card: one exact entry.
    expect(isPublicTestnetPath('/proof', false, true)).toBe(false);
    expect(isPublicTestnetPath('/proof/:commitId/x', false, true)).toBe(false);
    // Producers and bonded nodes: one exact entry; /network stays never-public.
    expect(isPublicTestnetPath('/nodes/x', false, true)).toBe(false);
    expect(isPublicTestnetPath('/network/nodes', false, true)).toBe(false);
    // Demo item 7 forecast check: one exact entry.
    expect(isPublicTestnetPath('/forecast-check/x', false, true)).toBe(false);
    expect([...PUBLIC_ONBOARDING_PATHS]).toEqual(['/onboarding', '/wallet', '/wallet/passkey', '/connect-station', '/earn']);
  });

  it('leaves the default public route set unchanged when disabled', () => {
    const routeInventory = [
      '/', '/terms', '/privacy', '/api-terms', '/security',
      ...PUBLIC_READONLY_PATHS,
      '/wallet', '/governance', '/network/status', '/unlisted', '*',
      '/earnings',
    ];
    for (const path of routeInventory) {
      expect(isPublicTestnetPath(path, false, false)).toBe(
        isPublicTestnetPath(path, false),
      );
    }
  });
});

// frontend#349: station detail joins the Stage 1.5 set; /earnings stays
// operator-only (frontend#347).
describe('Stage 1.5 station detail', () => {
  const STATION = '/weather/station/:stationId';

  it('is the only addition to the prior four read-only paths (plus the public leaderboard)', () => {
    expect([...PUBLIC_READONLY_PATHS]).toEqual([
      '/explore', '/explorer', '/map', '/search', STATION, '/leaderboard/contributors',
      '/governance/public', '/governance/public/:proposalId', '/weather/forecast', '/contributor/:key',
      '/forecasters', '/forecasters/:profileKey', '/competitions',
      '/faucet/bond-grants',
      '/proof/:commitId',
      '/nodes',
      '/forecast-check',
    ]);
  });

  it('is excluded from the default build and admitted by the read-only build', () => {
    expect(isPublicTestnetPath(STATION, false)).toBe(false);
    expect(isPublicTestnetPath(STATION, false, false)).toBe(false);
    expect(isPublicTestnetPath(STATION, false, true)).toBe(true);
    expect(isPublicTestnetPath(`${STATION}/`, false, true)).toBe(true);
  });

  it.each([
    '/weather/station/../earnings',
    '/weather/station/%2e%2e/earnings',
    '/weather/station/:stationId/../../earnings',
    '/weather/station/abc/earnings',
    '/weather/station/:stationId/edit',
    '/weather/station/:stationIdX',
    '/weather/station/abc',
    '/weather/station',
    '/weather/station/',
    '/weather/stationX',
    '/weather/stationX/:stationId',
    '/weather/stations/:stationId',
    '/weather',
    '/weather/dashboard',
    '/earnings',
    '/earnings/history',
  ])('does not leak %s through the read-only build', path => {
    expect(isPublicTestnetPath(path, false, true)).toBe(false);
  });

  it('keeps /earnings operator-only in every other build', () => {
    expect(isPublicTestnetPath('/earnings', true, true)).toBe(false);
    expect(isPublicTestnetPath('/earnings', true, true, false)).toBe(false);
    expect(isPublicTestnetPath('/earnings', false, true, true)).toBe(false);
    expect(isPublicTestnetPath('/earnings', true, false, true)).toBe(true);
  });
});

it.each(['/wallet/send', '/wallet/history', '/wallet/other', '/walletX'])('does not admit %s through the public wallet path', path => { expect(isPublicTestnetPath(path, false, true)).toBe(false); });

// Owner ruling 2026-10-08: the public leaderboard is exactly one page.
describe('public leaderboard route policy', () => {
  const PAGE = '/leaderboard/contributors';

  it('is public with the read-only flag on and hidden with it off, in every other flag state', () => {
    expect(explicitPathClass(PAGE)).toBe('public-readonly');
    expect(isPublicTestnetPath(PAGE, false, true)).toBe(true);
    expect(isPublicTestnetPath(`${PAGE}/`, false, true)).toBe(true);
    expect(isPublicTestnetPath(PAGE, false, false)).toBe(false);
    expect(isPublicTestnetPath(PAGE, false)).toBe(false);
    // Without the flag it is operator-preview, exactly as before.
    expect(isPublicTestnetPath(PAGE, true, false, false)).toBe(false);
    expect(isPublicTestnetPath(PAGE, true, false, true)).toBe(true);
  });

  it.each([
    '/leaderboard',
    '/leaderboard/',
    '/leaderboard/contributors/x',
    '/leaderboard/contributors/profile',
    '/leaderboard/contributorsX',
    '/leaderboard/profile/:address',
    '/leaderboard/nearby',
    '/leaderboard/cooperatives',
    '/leaderboard/station-of-the-day',
    '/impact/:address',
    '/referrals',
  ])('does not admit %s through the public build', path => {
    expect(isPublicTestnetPath(path, false, true)).toBe(false);
  });
});
