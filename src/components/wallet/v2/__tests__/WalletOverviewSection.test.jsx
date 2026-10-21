/**
 * @jest-environment jsdom
 */

import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { jest } from '@jest/globals';

// Mock the hook with controllable state
await jest.unstable_mockModule('../../../../hooks/useWalletData', () => ({
  useWalletData: jest.fn(),
}));

// Mock CSS and config imports
await jest.unstable_mockModule('../WalletOverviewSection.css', () => ({}));
await jest.unstable_mockModule('../../../../config/network', () => ({
  explorerAddressUrl: () => null,
}));

const { default: WalletOverviewSection } = await import('../WalletOverviewSection.jsx');
const { useWalletData } = await import('../../../../hooks/useWalletData');

describe('WalletOverviewSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows disconnected state when wallet is not connected', () => {
    useWalletData.mockReturnValue({
      account: null,
      isConnected: false,
      balance: null,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<WalletOverviewSection />);
    expect(screen.getByText(/Connect your wallet/i)).toBeInTheDocument();
  });

  it('shows loading state while fetching', () => {
    useWalletData.mockReturnValue({
      account: 'wrf1abc',
      isConnected: true,
      balance: null,
      isLoading: true,
      error: null,
      refresh: jest.fn(),
    });

    render(<WalletOverviewSection />);
    expect(screen.getByText(/Loading wallet data/i)).toBeInTheDocument();
  });

  it('shows error state with retry button on RPC failure', () => {
    const refresh = jest.fn();
    useWalletData.mockReturnValue({
      account: 'wrf1abc',
      isConnected: true,
      balance: null,
      isLoading: false,
      error: new Error('Network error'),
      refresh,
    });

    render(<WalletOverviewSection />);
    expect(screen.getByText(/Could not load wallet data/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
  });

  it('renders real balance and address — no hardcoded values', () => {
    useWalletData.mockReturnValue({
      account: 'wrf1realaddress9876543210',
      isConnected: true,
      // Balance arrives as an EXACT base-units string (issue #236). 42.5 WRF =
      // 4_250_000_000 base units; it must render as 42.5 WRF, not 10^8x inflated (#245).
      balance: '4250000000',
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<WalletOverviewSection />);
    expect(screen.getByText(/42\.5/)).toBeInTheDocument();
    expect(screen.getByText(/wrf1reala/i)).toBeInTheDocument();
    // Must NOT show the old fake hardcoded balance
    expect(screen.queryByText(/8\.60/)).not.toBeInTheDocument();
    expect(screen.queryByText(/13,542/)).not.toBeInTheDocument();
  });

  it('shows em-dash when balance is 0 (empty wallet, not loading)', () => {
    useWalletData.mockReturnValue({
      account: 'wrf1empty',
      isConnected: true,
      balance: '0',
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<WalletOverviewSection />);
    // 0 renders as 0.00, not em-dash
    expect(screen.getByText(/0\.00/)).toBeInTheDocument();
  });
});
