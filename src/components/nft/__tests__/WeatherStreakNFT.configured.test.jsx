/** @jest-environment jsdom */
//
// frontend#305 — with a real contract address configured, the milestone card
// explains that badges are oracle-minted; it still never offers a claim
// transaction, because the contract has no claim function.
import { jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const REAL = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';
jest.unstable_mockModule('../../../config/contracts', () => ({
  ZERO_ADDRESS: '0x0000000000000000000000000000000000000000',
  WEATHER_STREAK_NFT_ADDRESS: REAL,
  WEATHER_STREAK_NFT_ABI: [],
  WEATHER_STREAK_TIER_LABELS: ['Bronze', 'Silver', 'Gold', 'Diamond'],
  isContractConfigured: (a) => a === REAL,
}));
jest.unstable_mockModule('../../../hooks/useWeatherStreak', () => ({
  STREAK_MILESTONES: [7, 30, 90],
  useWeatherStreak: () => ({ currentStreak: 0, longestStreak: 0, nextMilestone: 7, milestoneReached: null, loading: false, error: null }),
}));

const { StreakBadgeStatus } = await import('../WeatherStreakNFT');

it('explains that badges are oracle-minted instead of offering a claim transaction', () => {
  render(<StreakBadgeStatus walletAddress="0x1111111111111111111111111111111111111111" milestoneLevel={30} />);
  expect(screen.getByTestId('streak-badge-auto-minted')).toBeInTheDocument();
  expect(screen.getByText(/minted automatically by the oracle/)).toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});
