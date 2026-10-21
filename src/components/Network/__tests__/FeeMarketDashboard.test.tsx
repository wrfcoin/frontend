/** @jest-environment jsdom */
import React from 'react';
import { jest } from '@jest/globals';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockGetInfo = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule('../../../services/api', () => ({
  blockchainAPI: { getInfo: mockGetInfo },
}));

// MUI and chart.js need stubs in jsdom
jest.unstable_mockModule('@mui/material', () => ({
  Box: ({ children, ...p }: any) => <div {...p}>{children}</div>,
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  Typography: ({ children, ...p }: any) => <span {...p}>{children}</span>,
  Stack: ({ children }: any) => <div>{children}</div>,
  Chip: ({ label }: any) => <span>{label}</span>,
  Paper: ({ children }: any) => <div>{children}</div>,
  LinearProgress: ({ value }: any) => <div role="progressbar" aria-valuenow={value} />,
  Tooltip: ({ children }: any) => <>{children}</>,
}));

jest.unstable_mockModule('@mui/icons-material', () => ({
  LocalGasStation: () => null,
  Whatshot: () => null,
  Shield: () => null,
  Speed: () => null,
  Timeline: () => null,
  ViewInAr: () => null,
}));

const { default: FeeMarketDashboard } = await import('../FeeMarketDashboard');

describe('FeeMarketDashboard — API shape hardening', () => {
  afterEach(() => jest.clearAllMocks());

  it('shows loading state while initial fetch is pending', async () => {
    mockGetInfo.mockReturnValue(new Promise(() => {}));
    await act(async () => { render(<FeeMarketDashboard />); });
    expect(screen.getByTestId('fee-market-loading')).toBeInTheDocument();
  });

  it('shows error banner when API throws', async () => {
    mockGetInfo.mockRejectedValue(new Error('node unreachable'));
    await act(async () => { render(<FeeMarketDashboard />); });
    expect(screen.getByTestId('fee-market-error')).toBeInTheDocument();
    expect(screen.queryByTestId('fee-market-loading')).not.toBeInTheDocument();
  });

  it('renders block height when API returns valid data', async () => {
    // Field name matches the real backend response (server/routes/blockchain-routes.js:67)
    // and the BlockchainStatus type — this test previously used `height`,
    // which the component never actually reads, silently masking the bug
    // (frontend#282 cross-provider review).
    mockGetInfo.mockResolvedValue({ blockHeight: 5000, network: 'testnet' });
    await act(async () => { render(<FeeMarketDashboard />); });
    expect(screen.queryByTestId('fee-market-loading')).not.toBeInTheDocument();
    expect(screen.queryByTestId('fee-market-error')).not.toBeInTheDocument();
    expect(screen.getByText('5,000')).toBeInTheDocument();
  });

  it('does not crash when API returns null height', async () => {
    mockGetInfo.mockResolvedValue({ blockHeight: null, network: 'testnet' });
    await act(async () => { render(<FeeMarketDashboard />); });
    expect(screen.queryByTestId('fee-market-loading')).not.toBeInTheDocument();
    expect(screen.queryByTestId('fee-market-error')).not.toBeInTheDocument();
  });
});
