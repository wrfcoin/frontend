/**
 * Regression test for frontend#285 — /leaderboard/profile/:address ignored
 * the route param entirely. ContributorProfile only ever read a `userId`
 * PROP, which communityRoutes.jsx never passes, so every visit (own profile
 * or someone else's) resolved to `apiClient.get('/leaderboard/profile/me')`.
 *
 * Fixed resolution order: explicit `userId` prop -> route `:address` param
 * -> `'me'`. This test exercises the real component through a MemoryRouter
 * so the route param actually flows through `useParams()`, and asserts the
 * resulting network calls target the right id.
 */
import { jest } from '@jest/globals';
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Mock the apiClient barrel the same way ContributorProfile imports it
// (`import { apiClient } from '../../services/apiClient'`). Mocking the real
// module would pull in Vite-only `import.meta` via runtime.ts, which cannot
// load under Jest.
jest.unstable_mockModule('../../../services/apiClient', () => ({
  apiClient: { get: jest.fn() },
}));
// ContributorProfile reads FEATURES.demoSurfaces (frontend#329); features.ts
// touches import.meta.env at module scope, which Jest ESM does not provide.
jest.unstable_mockModule('../../../config/features', () => ({
  default: { demoSurfaces: false },
  FEATURES: { demoSurfaces: false },
}));

const { apiClient } = await import('../../../services/apiClient');
// The ungated page: the default export is the frontend#415 not-live gate.
const { ContributorProfile } = await import('../ContributorProfile');

// Minimal-but-complete profile shape so StatsGrid/ProfileHeader don't crash
// on undefined fields — this test is only about which id the requests use.
const MOCK_PROFILE = {
  name: 'Test Contributor',
  avatar: 'TC',
  avatarColor: '#000',
  bio: 'test bio',
  memberSince: '2024',
  location: 'Test City',
  reputationTier: 'Bronze',
  totalStations: 1,
  totalReadings: 100,
  avgQualityScore: 99,
  totalWrfEarned: 10,
  globalRank: 1,
  consistencyStreak: 1,
};

function mockDefaultResponses() {
  apiClient.get.mockImplementation((path) => {
    if (path.endsWith('/achievements')) return Promise.resolve({ achievements: [] });
    if (path.endsWith('/stations')) return Promise.resolve({ stations: [] });
    if (path.endsWith('/activity')) return Promise.resolve({ activity: [] });
    return Promise.resolve({ profile: MOCK_PROFILE });
  });
}

function renderAt(path) {
  mockDefaultResponses();
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/leaderboard/profile/:address" element={<ContributorProfile />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ContributorProfile address resolution (frontend#285)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requests the route address, not "me", when a wallet address is in the URL', async () => {
    const address = '0xC0FFEE1234567890ABCDEF1234567890ABCDEF12';
    renderAt(`/leaderboard/profile/${address}`);

    await waitFor(() => expect(apiClient.get).toHaveBeenCalled());

    const calledPaths = apiClient.get.mock.calls.map(([path]) => path);
    expect(calledPaths).toEqual(
      expect.arrayContaining([
        `/leaderboard/profile/${address}`,
        `/leaderboard/profile/${address}/achievements`,
        `/leaderboard/profile/${address}/stations`,
        `/leaderboard/profile/${address}/activity`,
      ]),
    );
    expect(calledPaths.some((p) => p.includes('/profile/me'))).toBe(false);
  });

  it('still falls back to "me" when no address is present (own profile)', async () => {
    mockDefaultResponses();
    render(
      <MemoryRouter initialEntries={['/leaderboard/profile-standalone']}>
        <Routes>
          <Route path="/leaderboard/profile-standalone" element={<ContributorProfile />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(apiClient.get).toHaveBeenCalled());

    const calledPaths = apiClient.get.mock.calls.map(([path]) => path);
    expect(calledPaths).toEqual(
      expect.arrayContaining([
        '/leaderboard/profile/me',
        '/leaderboard/profile/me/achievements',
        '/leaderboard/profile/me/stations',
        '/leaderboard/profile/me/activity',
      ]),
    );
  });

  it('an explicit userId prop still wins over the route address', async () => {
    mockDefaultResponses();
    render(
      <MemoryRouter initialEntries={['/leaderboard/profile/0xROUTE']}>
        <Routes>
          <Route
            path="/leaderboard/profile/:address"
            element={<ContributorProfile userId="0xEXPLICIT" />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(apiClient.get).toHaveBeenCalled());

    const calledPaths = apiClient.get.mock.calls.map(([path]) => path);
    expect(calledPaths).toContain('/leaderboard/profile/0xEXPLICIT');
    expect(calledPaths.some((p) => p.includes('0xROUTE'))).toBe(false);
  });
});
