/** @jest-environment jsdom */
import React from 'react';
import { jest } from '@jest/globals';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockGetStationHistory = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule('../../../services/apiClient', () => ({
  earningsService: { getStationHistory: mockGetStationHistory },
}));

const {
  default: PayoutHistory,
  compareExactBaseUnits,
  formatPayoutAmount,
  sumPayoutAmounts,
} = await import('../PayoutHistory');

const u128 = '340282366920938463463374607431768211455';
const lower = '9007199254740992';
const higher = '9007199254740993';

function history() {
  return [
    {
      id: 'u128', stationId: 'station-1', timestamp: '2026-03-23T03:00:00.000Z',
      amount: u128, rewardType: 'base_reward', qualityScore: 99, txHash: '0xu128',
    },
    {
      id: 'higher', stationId: 'station-1', timestamp: '2026-03-23T02:00:00.000Z',
      amount: higher, rewardType: 'uptime_bonus', qualityScore: 90, txHash: '0xhigher',
    },
    {
      id: 'lower', stationId: 'station-1', timestamp: '2026-03-23T01:00:00.000Z',
      amount: lower, rewardType: 'accuracy_bonus', qualityScore: 80, txHash: '0xlower',
    },
    {
      id: 'safe', stationId: 'station-1', timestamp: '2026-03-23T00:00:00.000Z',
      amount: '150000000', rewardType: 'quality_bonus', qualityScore: 70, txHash: '0xsafe',
    },
  ];
}

describe('mounted PayoutHistory lossless controls', () => {
  beforeEach(() => {
    mockGetStationHistory.mockReset();
  });

  it('keeps exact rows, exact total, and exact amount sorting', async () => {
    mockGetStationHistory.mockResolvedValue(history());
    render(<PayoutHistory stationId="station-1" />);

    await waitFor(() => expect(screen.getByText('Payout History')).toBeInTheDocument());
    expect(screen.getByText('+3,402,823,669,209,384,634,633,746,074,317.6821')).toBeInTheDocument();
    expect(screen.getByText('Total:')).toBeInTheDocument();
    expect(screen.getByText('3,402,823,669,209,384,634,633,926,218,304.27 WRF')).toBeInTheDocument();

    const amountHeader = screen.getByText('Amount (WRF)');
    fireEvent.click(amountHeader);
    fireEvent.click(amountHeader);
    await waitFor(() => {
      const rows = screen.getAllByRole('row').slice(1).map((rowElement) => rowElement.textContent ?? '');
      expect(rows[0]).toContain('0xsafe');
      expect(rows[1]).toContain('0xlower');
      expect(rows[2]).toContain('0xhigher');
    });
  });

  it('has a mutation control against parseFloat/toFixed and zero fallbacks', () => {
    expect(compareExactBaseUnits(lower, higher)).toBeLessThan(0);
    expect(formatPayoutAmount(u128)).toBe('3,402,823,669,209,384,634,633,746,074,317.6821');
    expect(sumPayoutAmounts([u128, higher, lower, '150000000'])).toBe(
      '340282366920938463463392621830427693440',
    );
    expect(formatPayoutAmount(null)).toBe('Unavailable');
  });

  it.each(['malformed', 'missing', 'null'])('renders an unavailable state for %s service data', async (label) => {
    mockGetStationHistory.mockRejectedValue(new Error(`${label} amount`));
    render(<PayoutHistory stationId="station-1" />);

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Payout history unavailable'));
    expect(screen.queryByText(/0\.00 WRF/)).not.toBeInTheDocument();
  });
});
