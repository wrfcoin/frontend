import { isCapabilityRouteAvailable } from '../capabilityRoutePolicy';

describe('the public contributors page has its own capability gate', () => {
  it('follows leaderboardRead, not leaderboard', () => {
    expect(isCapabilityRouteAvailable('/leaderboard/contributors', key => key === 'leaderboardRead')).toBe(true);
    expect(isCapabilityRouteAvailable('/leaderboard/contributors', key => key === 'leaderboard')).toBe(false);
  });

  it('leaves the other leaderboard routes on the leaderboard capability', () => {
    expect(isCapabilityRouteAvailable('/leaderboard', key => key === 'leaderboardRead')).toBe(false);
    expect(isCapabilityRouteAvailable('/leaderboard/nearby', key => key === 'leaderboard')).toBe(true);
  });
});
