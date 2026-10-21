/** @jest-environment jsdom */
//
// frontend#299 — /defi surfaced the raw backend string ("Bearer Token
// Required") in a red alert for an unauthenticated visitor. A 401/403 now
// renders the sign-in notice; other failures render the user-facing message.
import { jest } from '@jest/globals';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ApiError } from '../../../utils/apiError';

const mockGet = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule('../../../services/apiClient', () => ({
  apiClient: { get: mockGet },
}));
jest.unstable_mockModule('react-chartjs-2', () => ({
  Doughnut: () => React.createElement('div', { 'data-testid': 'doughnut-chart' }),
}));
jest.unstable_mockModule('chart.js', () => ({
  Chart: { register: () => {} },
  ArcElement: class {},
  Tooltip: class {},
  Legend: class {},
}));
for (const panel of ['StakingPanel', 'YieldFarmingPanel', 'SwapInterface', 'GovernancePanel']) {
  jest.unstable_mockModule(`../${panel}`, () => ({
    default: () => React.createElement('div', { 'data-testid': panel }),
  }));
}

const { default: DeFiPortfolio } = await import('../DeFiPortfolio');

beforeEach(() => {
  mockGet.mockReset();
});

describe('DeFiPortfolio error states (frontend#299)', () => {
  it('renders the sign-in notice, not the raw backend string, on a 401', async () => {
    mockGet.mockRejectedValue(new ApiError('Bearer Token Required', 401));

    render(<DeFiPortfolio />);

    await waitFor(() => {
      expect(screen.getByText('Sign in to see your DeFi portfolio')).toBeInTheDocument();
    });
    expect(screen.queryByText(/Bearer Token Required/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
  });

  it('renders the user-facing message, not the raw error, for other failures', async () => {
    mockGet.mockRejectedValue(new ApiError('ECONNREFUSED 127.0.0.1:4001', 503));

    render(<DeFiPortfolio />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    });
    expect(screen.queryByText(/ECONNREFUSED/)).not.toBeInTheDocument();
    expect(screen.getByText(/temporarily unavailable/)).toBeInTheDocument();
  });
});
