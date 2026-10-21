/** @jest-environment jsdom */
import React from 'react';
import { jest } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockGetStationEarnings = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule('../../../services/apiClient', () => ({
  earningsService: { getStationEarnings: mockGetStationEarnings },
}));

jest.unstable_mockModule('react-chartjs-2', () => ({
  Doughnut: () => <div data-testid="doughnut-chart" />,
}));

const {
  default: RewardBreakdown,
  buildRewardCategories,
} = await import('../RewardBreakdown');

const u128 = '340282366920938463463374607431768211455';
const u64 = '9007199254740993';

function earnings() {
  return [{
    stationId: 'station-1',
    timestamp: 1774310400000,
    period: 'daily' as const,
    baseReward: '150000000',
    accuracyBonus: u128,
    uptimeBonus: u64,
    dataQualityBonus: '150000000',
    totalEarned: '100000000',
    status: 'confirmed',
  }];
}

describe('mounted RewardBreakdown lossless controls', () => {
  beforeEach(() => {
    mockGetStationEarnings.mockReset();
  });

  it('keeps safe/u64/u128 rows and totals exact in ordinary text', async () => {
    mockGetStationEarnings.mockResolvedValue(earnings());
    render(<RewardBreakdown stationId="station-1" />);

    await waitFor(() => expect(screen.getByText('Reward Breakdown')).toBeInTheDocument());
    expect(screen.getAllByText('1.5')).toHaveLength(2);
    expect(screen.getByText('90,071,992.5')).toBeInTheDocument();
    expect(screen.getByText('3,402,823,669,209,384,634,633,746,074,317.6')).toBeInTheDocument();
    expect(screen.getByText('3,402,823,669,209,384,634,633,836,146,314.2')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Data Quality Bonus'));
    expect(screen.getByText('+1.5000')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Consistency Streak'));
    expect(screen.getByText('+90,071,992.5474')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Spatial Coverage'));
    expect(screen.getByText('+3,402,823,669,209,384,634,633,746,074,317.6821')).toBeInTheDocument();
    expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument();
  });

  it('has a mutation control against numeric reward aggregation and zero fallback', () => {
    const categories = buildRewardCategories(earnings());
    expect(categories[0].amount).toBe('150000000');
    expect(categories[1].amount).toBe(u64);
    expect(categories[2].amount).toBe(u128);
    expect(categories[3].amount).toBe('150000000');
    expect(categories[4].amount).toBe('100000000');
    expect(buildRewardCategories([{ ...earnings()[0], accuracyBonus: null as unknown as string }])[2].amount).toBeNull();
  });

  it.each(['malformed', 'missing', 'null'])('renders an unavailable state for %s service data', async (label) => {
    mockGetStationEarnings.mockRejectedValue(new Error(`${label} reward`));
    render(<RewardBreakdown stationId="station-1" />);

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Reward breakdown unavailable'));
    expect(screen.queryByText(/0\.0 WRF/)).not.toBeInTheDocument();
  });
});
