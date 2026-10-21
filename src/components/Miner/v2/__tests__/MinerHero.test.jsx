/** @jest-environment jsdom */
import React from 'react';
import { jest } from '@jest/globals';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockGetNodeStats = jest.fn();

jest.unstable_mockModule('../../../../services/api', () => ({
  miningAPI: { getNodeStats: mockGetNodeStats },
}));

// lucide-react uses ESM; stub icons to avoid transform issues in jsdom
jest.unstable_mockModule('lucide-react', () => ({
  Zap: () => null,
  Clock: () => null,
  Coins: () => null,
  Users: () => null,
}));

const { default: MinerHero } = await import('../MinerHero');

describe('MinerHero — API shape hardening', () => {
  afterEach(() => jest.clearAllMocks());

  it('shows — for all stats while API has not resolved', async () => {
    // Promise that never resolves → permanent loading
    mockGetNodeStats.mockReturnValue(new Promise(() => {}));

    await act(async () => { render(<MinerHero miningStatus="idle" />); });

    expect(screen.getByTestId('stat-data-verified')).toHaveTextContent('—');
    expect(screen.getByTestId('stat-earnings')).toHaveTextContent('—');
    expect(screen.getByTestId('stat-uptime')).toHaveTextContent('—');
  });

  it('shows — for all stats and error indicator when API throws', async () => {
    mockGetNodeStats.mockRejectedValue(new Error('network error'));

    await act(async () => { render(<MinerHero miningStatus="idle" />); });

    expect(screen.getByTestId('stat-data-verified')).toHaveTextContent('—');
    expect(screen.getByTestId('stat-earnings')).toHaveTextContent('—');
    expect(screen.getByTestId('stats-error')).toBeInTheDocument();
  });

  it('handles missing/null fields in API response without crashing', async () => {
    // Shape has none of the expected fields
    mockGetNodeStats.mockResolvedValue({ someUnknownField: 'x' });

    await act(async () => { render(<MinerHero miningStatus="idle" />); });

    expect(screen.getByTestId('stat-data-verified')).toHaveTextContent('—');
    expect(screen.getByTestId('stat-earnings')).toHaveTextContent('—');
    expect(screen.getByTestId('stat-uptime')).toHaveTextContent('—');
    expect(screen.queryByTestId('stats-error')).not.toBeInTheDocument();
  });

  it('renders real data when API returns a full response', async () => {
    mockGetNodeStats.mockResolvedValue({
      hashRate: '142.5',
      blocksFound: 88,
      earnings: '6.25',
      uptime: 5400, // 1h 30m
      difficulty: '0x1f',
      efficiency: 0.97,
    });

    await act(async () => { render(<MinerHero miningStatus="idle" />); });

    expect(screen.getByTestId('stat-data-verified')).toHaveTextContent('88');
    expect(screen.getByTestId('stat-earnings')).toHaveTextContent('6.25 WRF');
    expect(screen.getByTestId('stat-uptime')).toHaveTextContent('1h 30m');
  });

  it('shows — for earnings when earnings field is non-numeric', async () => {
    mockGetNodeStats.mockResolvedValue({ hashRate: '0', blocksFound: 0, earnings: 'N/A', uptime: 0 });

    await act(async () => { render(<MinerHero miningStatus="idle" />); });

    expect(screen.getByTestId('stat-earnings')).toHaveTextContent('—');
  });
});
