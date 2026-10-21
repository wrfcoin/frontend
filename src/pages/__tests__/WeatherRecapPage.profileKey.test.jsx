/** @jest-environment jsdom */
/** backend#1361: /impact/:key pages work with a short address and share the key, never an address. */
import React from 'react';
import { jest } from '@jest/globals';
import { cleanup, render, screen } from '@testing-library/react';

const state = { param: 'c_0123456789abcdef01234567', account: null, profile: null };

await jest.unstable_mockModule('react-router-dom', () => ({ useParams: () => ({ address: state.param }) }));
await jest.unstable_mockModule('../../hooks/useWalletConnection', () => ({
  useWalletConnection: () => ({ account: state.account }),
}));
await jest.unstable_mockModule('../../hooks/useOperatorProfile', () => ({
  useOperatorProfile: () => ({ profile: state.profile, loading: false, error: null }),
}));
await jest.unstable_mockModule('../../utils/earnShareCard', () => ({ downloadOrShareEarnCard: jest.fn() }));

const { default: WeatherRecapPage } = await import('../WeatherRecapPage');

const profile = (over = {}) => ({
  walletAddress: '0xa1a1…a1a1', profileKey: 'c_0123456789abcdef01234567', isYou: false, displayName: null,
  totalSubmissions: 12, stationCount: 1, currentStreak: 2, longestStreak: 4, qualityScore: 90, rank: 3,
  badges: [], totalRewardsEarned: null, ...over,
});

afterEach(cleanup);

describe('WeatherRecapPage opened by profile key', () => {
  test('shows the short address and a sensible default name, and never a full address', async () => {
    state.profile = profile();
    const { container } = render(<WeatherRecapPage />);
    await screen.findByText('Readings submitted');
    expect(container.textContent).toContain('0xa1a1…a1a1');
    expect(container.textContent).toContain('WeatherNode-A1A1');
    expect(container.innerHTML).not.toMatch(/(?:0x|wrf)[0-9a-f]{40}/i);
    expect(screen.getByText(/public impact page/)).toBeTruthy();
  });

  test('the share text links to the key, not to any address', async () => {
    state.profile = profile();
    const { container } = render(<WeatherRecapPage />);
    await screen.findByText('Readings submitted');
    const hrefs = [...container.querySelectorAll('a')].map(a => decodeURIComponent(a.getAttribute('href') ?? ''));
    const share = hrefs.find(h => h.includes('twitter.com'));
    expect(share).toContain('/impact/c_0123456789abcdef01234567');
    expect(share).not.toMatch(/(?:0x|wrf)[0-9a-f]{40}/i);
  });

  test('no key and only a short address: the share text carries no impact link', async () => {
    state.profile = profile({ profileKey: null });
    const { container } = render(<WeatherRecapPage />);
    await screen.findByText('Readings submitted');
    const share = [...container.querySelectorAll('a')].map(a => decodeURIComponent(a.getAttribute('href') ?? '')).find(h => h.includes('twitter.com'));
    expect(share).not.toContain('/impact/');
  });

  test('the wallet owner is recognised from the verified isYou, not from a short-form match', async () => {
    state.profile = profile({ isYou: true });
    render(<WeatherRecapPage />);
    await screen.findByText('Readings submitted');
    expect(screen.queryByText(/public impact page/)).toBeNull();

    // a connected wallet whose short form merely matches is NOT treated as the owner
    cleanup();
    state.profile = profile();
    state.account = '0xA1A1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1';
    render(<WeatherRecapPage />);
    await screen.findByText('Readings submitted');
    expect(screen.getByText(/public impact page/)).toBeTruthy();
    state.account = null;
  });

  test('COLLISION: two different full wallets with the same short form are not the same owner', async () => {
    const mine = `0xa1a1${'11'.repeat(16)}a1a1`;
    const other = `0xa1a1${'22'.repeat(16)}a1a1`;
    state.param = other;
    state.account = mine;
    state.profile = profile({ walletAddress: other, profileKey: null });
    render(<WeatherRecapPage />);
    await screen.findByText('Readings submitted');
    expect(screen.getByText(/public impact page/)).toBeTruthy();
    state.param = 'c_0123456789abcdef01234567';
    state.account = null;
  });
});
