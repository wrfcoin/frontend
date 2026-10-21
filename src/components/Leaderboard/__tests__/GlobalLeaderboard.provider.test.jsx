/** @jest-environment jsdom */
//
// frontend#302 — /leaderboard crashed into the ErrorBoundary with
// "useWallet must be used within a WalletProvider": the route is mounted
// without a WalletProvider and the page only needs the wallet to highlight
// the viewer's own row. The dependency is now optional.
import { jest } from '@jest/globals';
import React from 'react';
import { render, renderHook, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockGetWithFallback = jest.fn();

jest.unstable_mockModule('../../../services/apiClient', () => ({
  apiClient: { getWithFallback: mockGetWithFallback, get: jest.fn() },
}));
// WalletContext pulls the provider manager, which reads import.meta.env at
// module scope (undefined under this repo's Jest ESM setup). The context
// object itself is all this test needs.
jest.unstable_mockModule('../../../services/walletProviders/WalletProviderManager.js', () => ({
  walletProviderManager: {
    on: () => {},
    off: () => {},
    getAvailableProviders: () => [],
    connect: async () => null,
    disconnect: async () => {},
  },
}));

const { default: GlobalLeaderboard } = await import('../GlobalLeaderboard');
const { useOptionalWallet } = await import('../../../contexts/WalletContext.jsx');

beforeEach(() => {
  mockGetWithFallback.mockReset();
});

describe('GlobalLeaderboard without a WalletProvider (frontend#302)', () => {
  it('renders instead of throwing, and reaches its honest empty state', async () => {
    mockGetWithFallback.mockRejectedValue(new Error('leaderboard routes not mounted (backend#1131)'));

    expect(() => render(<GlobalLeaderboard />)).not.toThrow();

    await waitFor(() => {
      expect(mockGetWithFallback).toHaveBeenCalled();
    });
    expect(document.body.textContent).not.toMatch(/useWallet must be used within a WalletProvider/);
    await waitFor(() => {
      expect(screen.getByText('Not live on the testnet yet')).toBeInTheDocument();
    });
  });

  it('useOptionalWallet returns null outside the provider rather than throwing', () => {
    const { result } = renderHook(() => useOptionalWallet());
    expect(result.current).toBeNull();
  });
});

describe('GlobalLeaderboard with short addresses (backend#1361)', () => {
  it('keys rows by the opaque profileKey and renders names without any full address', async () => {
    const errors = jest.spyOn(console, 'error').mockImplementation(() => {});
    // Two contributors whose SHORT addresses collide must still be two distinct rows.
    mockGetWithFallback.mockResolvedValue({
      entries: [
        { rank: 1, walletAddress: '0xa1a1\u2026a1a1', profileKey: 'c_0123456789abcdef01234567', displayName: 'Alice', value: 90, earnings: 0, stations: 0, quality: 0, consistency: 0 },
        { rank: 2, walletAddress: '0xa1a1\u2026a1a1', profileKey: 'c_89abcdef0123456789abcdef', displayName: 'Alicia', value: 80, earnings: 0, stations: 0, quality: 0, consistency: 0 },
      ],
    });
    render(<GlobalLeaderboard />);
    await waitFor(() => expect(screen.getAllByText(/Alic/).length).toBeGreaterThanOrEqual(2));
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Alicia')).toBeInTheDocument();
    expect(document.body.innerHTML).not.toMatch(/(?:0x|wrf)[0-9a-f]{40}/i);
    const keyWarnings = errors.mock.calls.filter(c => String(c[0]).includes('same key'));
    expect(keyWarnings).toEqual([]);
    errors.mockRestore();
  });
});
