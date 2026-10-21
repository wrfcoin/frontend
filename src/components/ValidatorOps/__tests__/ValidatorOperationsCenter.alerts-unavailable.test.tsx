/** @jest-environment jsdom */
import React from 'react';
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockUseValidators = jest.fn();
const mockUseNetworkStats = jest.fn();

jest.unstable_mockModule('../../../hooks/api/useValidatorQueries', () => ({
  useValidators: mockUseValidators,
  useNetworkStats: mockUseNetworkStats,
}));

jest.unstable_mockModule('react-chartjs-2', () => ({
  Line: () => <div data-testid="line-chart" />,
}));

jest.unstable_mockModule('../../DesignSystem', () => ({
  WrfCapabilityReadinessBadge: () => <div data-testid="capability-badge" />,
}));

const alertGet = jest.fn(async () => { throw new Error('404: validator alerts unavailable'); });
jest.unstable_mockModule('../../../services/apiClient', () => ({ apiClient: { get: alertGet } }));
const { default: ValidatorOperationsCenter } = await import('../ValidatorOperationsCenter');

function queryResult(overrides: Record<string, unknown> = {}) {
  return {
    data: undefined,
    error: null,
    isLoading: false,
    isError: false,
    ...overrides,
  };
}

describe('ValidatorOperationsCenter live wiring states', () => {
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
            uptime: 99.1,
            proposals: 10,
            attestations: 900,
            missedSlots: 2,
            lastAttestation: '5s ago',
          },
        ],
      }),
    );
    mockUseNetworkStats.mockReturnValue(
      queryResult({
        data: {
          totalStaked: 32,
          availableBalance: 5,
          totalRewards: 1,
          pendingRewards: 0.1,
        },
      }),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('unsupported alerts are unavailable while served validator data remains visible', () => {
    render(<ValidatorOperationsCenter />);
    expect(screen.getByText('Validator alerts are unavailable')).toBeInTheDocument();
    expect(screen.getByText('Validator One')).toBeInTheDocument();
    expect(screen.queryByText('0 unacknowledged')).not.toBeInTheDocument();
    expect(alertGet).not.toHaveBeenCalled();
  });
});
