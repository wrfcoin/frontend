/** @jest-environment jsdom */
import React from 'react';
import { jest } from '@jest/globals';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockGetNodeStats = jest.fn();

jest.unstable_mockModule('../../../../services/api', () => ({
  miningAPI: { getNodeStats: mockGetNodeStats },
}));

jest.unstable_mockModule('lucide-react', () => ({
  Zap: () => null,
  Target: () => null,
  Coins: () => null,
  Wifi: () => null,
}));

const { default: MiningStatsSection } = await import('../MiningStatsSection');

describe('MiningStatsSection — API shape hardening', () => {
  afterEach(() => jest.clearAllMocks());

  it('shows loading skeleton while fetch is pending', async () => {
    mockGetNodeStats.mockReturnValue(new Promise(() => {}));
    await act(async () => { render(<MiningStatsSection />); });
    expect(screen.getByTestId('mining-stats-loading')).toBeInTheDocument();
  });

  it('shows error banner and — values when API throws', async () => {
    mockGetNodeStats.mockRejectedValue(new Error('network error'));
    await act(async () => { render(<MiningStatsSection />); });
    expect(screen.getByTestId('mining-stats-error')).toBeInTheDocument();
    expect(screen.getByTestId('stat-data-verified-value')).toHaveTextContent('—');
    expect(screen.getByTestId('stat-rewards-value')).toHaveTextContent('—');
    expect(screen.getByTestId('stat-network-rate-value')).toHaveTextContent('—');
  });

  it('renders real values from a full API response', async () => {
    mockGetNodeStats.mockResolvedValue({
      hashRate: '88.0',
      blocksFound: 42,
      earnings: '3.14',
      uptime: 7200,
      difficulty: '0x1f',
      efficiency: 0.99,
    });
    await act(async () => { render(<MiningStatsSection />); });
    expect(screen.getByTestId('stat-data-verified-value')).toHaveTextContent('42');
    expect(screen.getByTestId('stat-rewards-value')).toHaveTextContent('3.14 WRF');
    expect(screen.getByTestId('stat-network-rate-value')).toHaveTextContent('88.0 obs/min');
  });

  it('shows — for non-numeric earnings without crashing', async () => {
    mockGetNodeStats.mockResolvedValue({ hashRate: '0', blocksFound: 0, earnings: 'N/A', uptime: 0 });
    await act(async () => { render(<MiningStatsSection />); });
    expect(screen.getByTestId('stat-rewards-value')).toHaveTextContent('—');
  });

  it('handles unknown API response shape without crashing', async () => {
    mockGetNodeStats.mockResolvedValue({ unexpectedField: 'x' });
    await act(async () => { render(<MiningStatsSection />); });
    expect(screen.getByTestId('stat-data-verified-value')).toHaveTextContent('—');
    expect(screen.queryByTestId('mining-stats-error')).not.toBeInTheDocument();
  });
});
