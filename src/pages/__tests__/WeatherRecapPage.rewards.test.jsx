/** @jest-environment jsdom */
/**
 * backend#1222: the anonymous operator profile returns
 * `totalRewardsEarned: null`. A withheld total must never render as "0 WRF",
 * on the page or on the share card; a real 0 still does.
 */
import React from 'react';
import { jest } from '@jest/globals';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const profileState = { profile: null };
const downloadOrShareEarnCard = jest.fn(async () => 'downloaded');

await jest.unstable_mockModule('react-router-dom', () => ({
  useParams: () => ({ address: '0xabcdef0123456789abcdef0123456789abcdef01' }),
}));
await jest.unstable_mockModule('../../hooks/useWalletConnection', () => ({
  useWalletConnection: () => ({ account: null }),
}));
await jest.unstable_mockModule('../../hooks/useOperatorProfile', () => ({
  useOperatorProfile: () => ({ profile: profileState.profile, loading: false, error: null }),
}));
await jest.unstable_mockModule('../../utils/earnShareCard', () => ({
  downloadOrShareEarnCard,
}));

const { default: WeatherRecapPage, visibleRewardTotal } = await import('../WeatherRecapPage');

function profileWith(totalRewardsEarned) {
  return {
    walletAddress: '0xabcdef0123456789abcdef0123456789abcdef01',
    displayName: 'Storm Node',
    totalSubmissions: 1234,
    stationCount: 2,
    currentStreak: 5,
    longestStreak: 9,
    qualityScore: 97,
    rank: 12,
    badges: [],
    totalRewardsEarned,
  };
}

async function renderWith(totalRewardsEarned) {
  profileState.profile = profileWith(totalRewardsEarned);
  const view = render(<WeatherRecapPage />);
  await screen.findByText('Readings submitted');
  return view;
}

async function sharedAmount() {
  fireEvent.click(screen.getByRole('button', { name: /share PNG/i }));
  await waitFor(() => expect(downloadOrShareEarnCard).toHaveBeenCalledTimes(1));
  return downloadOrShareEarnCard.mock.calls[0][0].amount;
}

afterEach(() => {
  cleanup();
  downloadOrShareEarnCard.mockClear();
});

describe('visibleRewardTotal', () => {
  it.each([null, undefined, '', '  ', 'abc', NaN, Infinity])('withholds %p', value => {
    expect(visibleRewardTotal(value)).toBeNull();
  });

  it.each([[0, 0], ['0', 0], [42.5, 42.5], ['1500', 1500]])('keeps %p as %p', (value, expected) => {
    expect(visibleRewardTotal(value)).toBe(expected);
  });
});

describe('WeatherRecapPage reward total', () => {
  it.each([null, undefined])('hides the WRF earned card when the total is %p', async value => {
    const { container } = await renderWith(value);
    expect(screen.queryByText('WRF earned')).toBeNull();
    expect(container.textContent).not.toMatch(/\b0 WRF\b/);
    expect(container.textContent).not.toContain('NaN');
  });

  it('passes a withheld total to the share card as null, never 0', async () => {
    await renderWith(null);
    expect(await sharedAmount()).toBeNull();
  });

  it('shows a real zero as 0 WRF', async () => {
    await renderWith(0);
    expect(screen.getByText('WRF earned')).not.toBeNull();
    expect(screen.getByText('0 WRF')).not.toBeNull();
    expect(await sharedAmount()).toBe(0);
  });

  it('shows a positive total', async () => {
    await renderWith(1500);
    expect(screen.getByText('WRF earned')).not.toBeNull();
    expect(screen.getByText(`${(1500).toLocaleString()} WRF`)).not.toBeNull();
    expect(await sharedAmount()).toBe(1500);
  });

  it('keeps the activity stats when the total is withheld', async () => {
    await renderWith(null);
    expect(screen.getByText('1,234')).not.toBeNull();
    expect(screen.getByText('97%')).not.toBeNull();
  });
});
