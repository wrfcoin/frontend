/** @jest-environment jsdom */
//
// frontend#305 — with no deployed contract (the default: address 0x0), the
// streak page must not offer a claim that would revert against address(0),
// and must say the badges are not deployed. With a real address it explains
// that badges are oracle-minted (the contract has no claim function).
import { jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const contractsMock = {
  ZERO_ADDRESS: '0x0000000000000000000000000000000000000000',
  WEATHER_STREAK_NFT_ADDRESS: '0x0000000000000000000000000000000000000000',
  WEATHER_STREAK_NFT_ABI: [],
  WEATHER_STREAK_TIER_LABELS: ['Bronze', 'Silver', 'Gold', 'Diamond'],
  isContractConfigured: (a) => typeof a === 'string' && /^0x[0-9a-fA-F]{40}$/.test(a) && a !== '0x0000000000000000000000000000000000000000',
};

jest.unstable_mockModule('../../../config/contracts', () => contractsMock);
jest.unstable_mockModule('../../../hooks/useWeatherStreak', () => ({
  STREAK_MILESTONES: [7, 30, 90],
  useWeatherStreak: () => ({ currentStreak: 0, longestStreak: 0, nextMilestone: 7, milestoneReached: null, loading: false, error: null }),
}));

const mod = await import('../WeatherStreakNFT');
const { StreakBadgeStatus, MyStreakNFTs, ClaimStreakNFT } = mod;
const WALLET = '0x1111111111111111111111111111111111111111';

describe('StreakBadgeStatus — contract not deployed (default)', () => {
  it('renders the not-deployed notice and no claim control', () => {
    render(<StreakBadgeStatus walletAddress={WALLET} milestoneLevel={7} />);
    expect(screen.getByTestId('streak-badge-not-deployed')).toBeInTheDocument();
    expect(screen.getByText('Streak badges are not deployed on the testnet yet.')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Claim/);
  });

  it('MyStreakNFTs also reports not deployed and never touches a provider', () => {
    window.ethereum = { request: jest.fn() };
    render(<MyStreakNFTs walletAddress={WALLET} />);
    expect(screen.getByTestId('my-streak-nfts-not-deployed')).toBeInTheDocument();
    expect(window.ethereum.request).not.toHaveBeenCalled();
    delete window.ethereum;
  });

  it('keeps the ClaimStreakNFT alias pointing at the honest component', () => {
    expect(ClaimStreakNFT).toBe(StreakBadgeStatus);
  });
});
