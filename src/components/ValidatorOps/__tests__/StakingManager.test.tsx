/** @jest-environment jsdom */
import React from 'react';
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockUseValidators = jest.fn();
const mockUseNetworkStats = jest.fn();
const mockUseStakingPositions = jest.fn();

jest.unstable_mockModule('../../../hooks/api/useValidatorQueries', () => ({
  useValidators: mockUseValidators,
  useNetworkStats: mockUseNetworkStats,
  useStakingPositions: mockUseStakingPositions,
}));

jest.unstable_mockModule('react-chartjs-2', () => ({
  Bar: () => <div data-testid="bar-chart" />,
}));

const { default: StakingManager } = await import('../StakingManager');

function queryResult(overrides: Record<string, unknown> = {}) {
  return {
    data: undefined,
    error: null,
    isLoading: false,
    isError: false,
    ...overrides,
  };
}

describe('StakingManager live wiring states', () => {
  beforeEach(() => {
    mockUseValidators.mockReturnValue(
      queryResult({
        data: [
          {
            id: 'val-1',
            name: 'Validator One',
            status: 'online',
            balance: 32,
            effectiveness: 98.5,
            uptime: 99,
            proposals: 2,
            attestations: 100,
            missedSlots: 0,
            lastAttestation: '10s ago',
          },
        ],
      }),
    );
    mockUseNetworkStats.mockReturnValue(
      queryResult({
        data: {
          totalStaked: 32,
          availableBalance: 8,
          totalRewards: 1.2,
          pendingRewards: 0.2,
        },
      }),
    );
    mockUseStakingPositions.mockReturnValue(
      queryResult({
        data: [
          {
            id: 'pos-1',
            validator: 'Validator One',
            amount: 32,
            apy: 4.7,
            status: 'active',
            delegatedAt: '2026-03-01T00:00:00Z',
            rewards: 0.4,
          },
        ],
      }),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading skeleton while staking queries are fetching', () => {
    mockUseStakingPositions.mockReturnValue(queryResult({ isLoading: true }));

    const { container } = render(<StakingManager />);

    expect(container.querySelector('.MuiSkeleton-root')).toBeTruthy();
  });

  it('shows API error state when staking query fails', () => {
    mockUseStakingPositions.mockReturnValue(
      queryResult({ isError: true, error: new Error('staking api unavailable') }),
    );

    render(<StakingManager />);

    expect(screen.getByText('staking api unavailable')).toBeInTheDocument();
    expect(screen.queryByText('WRF Primary Node')).not.toBeInTheDocument();
  });

  it('shows explicit empty-state for missing staking positions', () => {
    mockUseStakingPositions.mockReturnValue(queryResult({ data: [] }));

    render(<StakingManager />);

    expect(
      screen.getByText('No staking positions found for this account context.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('WRF Primary Node')).not.toBeInTheDocument();
  });

  it('renders live staking data successfully', () => {
    render(<StakingManager />);

    expect(screen.getByText('Staking Manager')).toBeInTheDocument();
    expect(screen.getAllByText('Validator One').length).toBeGreaterThan(0);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });
});
