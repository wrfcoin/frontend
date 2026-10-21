/** @jest-environment jsdom */
import React from 'react';
import { jest } from '@jest/globals';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockGetPoolInfo = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule('../../../../services/api', () => ({
  miningAPI: { getPoolInfo: mockGetPoolInfo },
}));

jest.unstable_mockModule('lucide-react', () => ({
  Server: () => null,
  Plus: () => null,
}));

const { default: PoolStatusSection } = await import('../PoolStatusSection');

const POOL_FULL = {
  totalHashRate: '142 MH/s',
  miners: 87,
  lastBlock: 1234,
  payout: '0.5 WRF',
  fee: 1,
};

describe('PoolStatusSection — API shape hardening', () => {
  afterEach(() => jest.clearAllMocks());

  it('shows loading state while fetch is pending', async () => {
    mockGetPoolInfo.mockReturnValue(new Promise(() => {}));
    await act(async () => { render(<PoolStatusSection />); });
    expect(screen.getByTestId('pool-loading')).toBeInTheDocument();
  });

  it('shows error state when API throws', async () => {
    mockGetPoolInfo.mockRejectedValue(new Error('network error'));
    await act(async () => { render(<PoolStatusSection />); });
    expect(screen.getByTestId('pool-error')).toHaveTextContent('Could not load pool data');
  });

  it('shows empty state when API returns null', async () => {
    mockGetPoolInfo.mockResolvedValue(null);
    await act(async () => { render(<PoolStatusSection />); });
    expect(screen.getByTestId('pool-empty')).toBeInTheDocument();
  });

  it('renders real pool stats from full API response', async () => {
    mockGetPoolInfo.mockResolvedValue(POOL_FULL);
    await act(async () => { render(<PoolStatusSection />); });
    expect(screen.getByTestId('pool-stats-card')).toBeInTheDocument();
    expect(screen.getByTestId('pool-hashrate')).toHaveTextContent('142 MH/s');
    expect(screen.getByTestId('pool-miners')).toHaveTextContent('87');
    expect(screen.getByTestId('pool-last-block')).toHaveTextContent('#1,234');
    expect(screen.getByTestId('pool-payout')).toHaveTextContent('0.5 WRF');
    expect(screen.getByTestId('pool-fee')).toHaveTextContent('1%');
  });

  it('shows — for missing/empty fields without crashing', async () => {
    mockGetPoolInfo.mockResolvedValue({ totalHashRate: '', miners: undefined, lastBlock: 0, payout: null, fee: null });
    await act(async () => { render(<PoolStatusSection />); });
    expect(screen.getByTestId('pool-hashrate')).toHaveTextContent('—');
    expect(screen.getByTestId('pool-miners')).toHaveTextContent('—');
    expect(screen.getByTestId('pool-fee')).toHaveTextContent('—');
  });
});
