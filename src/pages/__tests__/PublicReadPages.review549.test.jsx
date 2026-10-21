/** @jest-environment jsdom */
/** Regression probes from the #549 cross-provider review (each was RED on 257aec80). */
import React from 'react';
import { jest } from '@jest/globals';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const state = { entries: [] };
Object.assign(globalThis, { __VITE_ENV__: { VITE_PUBLIC_READONLY_PATHS: 'true' } });
await jest.unstable_mockModule('../../contexts/WalletContext.jsx', () => ({ useOptionalWallet: () => ({ account: null }) }));
await jest.unstable_mockModule('../../hooks/useWeatherLeaderboard', () => ({
  LEADERBOARD_REGIONS: ['Global'],
  useWeatherLeaderboard: () => ({ entries: state.entries, loading: false, error: null, updatedAt: null }),
}));
await jest.unstable_mockModule('../../config/features', () => ({ FEATURES: { leaderboardRegions: false } }));

const { default: ContributorLeaderboardPage } = await import('../ContributorLeaderboardPage');
const { default: PublicForecastPage } = await import('../PublicForecastPage');
const { default: PublicContributorProfilePage } = await import('../PublicContributorProfilePage');
const { PUBLIC_NAV_ENTRIES } = await import('../../config/publicNavigation');

const GOOD = 'c_0123456789abcdef01234567';
const FULL = '0x' + 'a1'.repeat(20);
const entry = over => ({
  rank: 1, displayName: 'Alice', value: 90, badgeLevel: 'gold', country: null, city: null,
  walletAddress: '0xa1a1…a1a1', profileKey: GOOD, isYou: false, ...over,
});
const wrap = (el, route = '/', at = '/') =>
  render(<MemoryRouter initialEntries={[at]}><Routes><Route path={route} element={el} /></Routes></MemoryRouter>);
afterEach(() => { cleanup(); jest.restoreAllMocks(); });

describe('finding 1: days=14 is ~7 days', () => {
  it('is labelled 7-day everywhere and never 14-day', async () => {
    const periods = Array.from({ length: 14 }, (_, i) => ({
      name: `P${i}`, startTime: new Date(Date.UTC(2026, 9, 15, i % 2 ? 18 : 6) + Math.floor(i / 2) * 864e5).toISOString(),
      temperature: 60, temperatureUnit: 'F', shortForecast: 'Clear',
    }));
    global.fetch = jest.fn(async () => new Response(JSON.stringify({ status: 'success', current: { data: {} }, forecast: { periods } }), { status: 200 }));
    const { container } = render(<PublicForecastPage />);
    fireEvent.change(screen.getByLabelText(/Latitude/), { target: { value: '40' } });
    fireEvent.change(screen.getByLabelText(/Longitude/), { target: { value: '-74' } });
    fireEvent.click(screen.getByText('Get forecast'));
    await screen.findByText('7-day outlook');
    expect(container.textContent).not.toMatch(/14-day/);
    // the daily list really is 14 half-day periods spanning 7 days
    const first = new Date(periods[0].startTime).getTime();
    const last = new Date(periods[13].startTime).getTime();
    expect((last - first) / 864e5).toBeCloseTo(6.5, 5); // 14 half-day periods start within 6.5 days
    expect(PUBLIC_NAV_ENTRIES.map(e => e.description).join(' ')).not.toMatch(/14-day/);
  });
});

describe('finding 2: no lossy amount rendering on the profile', () => {
  it.each([['1'], [1], ['9007199254740993'], [1e-8]])('never renders legacy total %p', async total => {
    global.fetch = jest.fn(async () => new Response(JSON.stringify({ profile: {
      walletAddress: '0xa1a1…a1a1', totalSubmissions: 1, stationCount: 1, currentStreak: 0, longestStreak: 0,
      qualityScore: 1, totalRewardsEarned: total,
    } }), { status: 200 }));
    const { container } = wrap(<PublicContributorProfilePage />, '/contributor/:key', `/contributor/${GOOD}`);
    await screen.findByText('Readings submitted');
    expect(container.textContent).not.toMatch(/WRF earned|\b0 WRF\b/);
  });
});

describe('finding 3: leaderboard links', () => {
  const links = () => [...document.querySelectorAll('a.lb-contributor-link')].map(a => a.getAttribute('href'));
  it.each([
    ['malformed key', { profileKey: 'c_zz' }],
    ['raw address as key', { profileKey: FULL }],
    ['uppercase key', { profileKey: GOOD.toUpperCase() }],
    ['path-ish key', { profileKey: `${GOOD}/../x` }],
  ])('public build: %s is not a link', (_n, over) => {
    state.entries = [entry(over)];
    wrap(<ContributorLeaderboardPage />);
    expect(links()).toEqual([]);
    expect(screen.getByText('Alice')).toBeTruthy();
  });

  it('public build: a well-formed key links to /contributor, an address-only row does not', () => {
    state.entries = [entry({}), entry({ rank: 2, displayName: 'Bob', profileKey: null, walletAddress: FULL })];
    wrap(<ContributorLeaderboardPage />);
    expect(links()).toEqual([`/contributor/${GOOD}`]);
  });
});
