/**
 * Regression test for issue #236 — through the ACTUAL production hook.
 *
 * `WalletHero` (the primary on-screen balance) consumes `useWalletData`. This
 * test proves that a u64/u128 balance above 2^53 base units surfaces from the
 * hook as an EXACT base-units string — not a truncated JS number — by exercising
 * the real `walletService.getBalance()` lossless path the hook now uses.
 *
 * Before the fix, `useWalletData` sourced the balance from the axios-based
 * `walletAPI.getWallet`, whose internal `JSON.parse` rounds 9000000000000000001
 * to 9000000000000000000 (and the hook then re-truncated via `Number(...)`).
 */

import { renderHook, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';

// Mock the wallet connection context so the hook treats us as connected.
jest.unstable_mockModule('../../contexts/WalletContext.jsx', () => ({
  useWallet: () => ({ account: '0xabc', isConnected: true }),
}));

// Mock the apiClient barrel. We only need `walletService.getBalance`; requiring
// the real module would pull in `runtime.ts`, which uses Vite-only `import.meta`
// and cannot load under Jest.
jest.unstable_mockModule('../../services/apiClient', () => ({
  walletService: {
    getBalance: jest.fn(),
    getTransactions: jest.fn(),
  },
}));

const { useWalletData } = await import('../useWalletData');
const { walletService } = await import('../../services/apiClient');

describe('useWalletData balance precision (issue #236)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('surfaces a >2^53 balance as an EXACT string (no truncation)', async () => {
    // 9_000_000_000_000_000_001 is above Number.MAX_SAFE_INTEGER
    // (9_007_199_254_740_991). The trailing ...001 is the canary that native
    // JSON.parse / Number() coercion would destroy.
    const exact = '9000000000000000001';
    walletService.getBalance.mockResolvedValue({
      address: '0xabc',
      balance: exact,
      symbol: 'WRF',
    });

    const { result } = renderHook(() =>
      useWalletData({ withTransactions: false }),
    );

    await waitFor(() => expect(result.current.balance).not.toBeNull());

    // The exact string is preserved end-to-end through the production hook.
    expect(typeof result.current.balance).toBe('string');
    expect(result.current.balance).toBe(exact);

    // And it must NOT have been coerced through a JS number at any point.
    expect(Number(result.current.balance).toString()).not.toBe(
      result.current.balance,
    );
    expect(walletService.getBalance).toHaveBeenCalledWith('0xabc');
  });

  it('preserves the 2^53 boundary balance exactly', async () => {
    const boundary = '9007199254740993'; // 2^53 + 1
    walletService.getBalance.mockResolvedValue({
      address: '0xabc',
      balance: boundary,
      symbol: 'WRF',
    });

    const { result } = renderHook(() =>
      useWalletData({ withTransactions: false }),
    );

    await waitFor(() => expect(result.current.balance).not.toBeNull());
    expect(result.current.balance).toBe(boundary);
  });

  it('still surfaces small balances as exact strings', async () => {
    walletService.getBalance.mockResolvedValue({
      address: '0xabc',
      balance: '150000000',
      symbol: 'WRF',
    });

    const { result } = renderHook(() =>
      useWalletData({ withTransactions: false }),
    );

    await waitFor(() => expect(result.current.balance).not.toBeNull());
    expect(result.current.balance).toBe('150000000');
  });

  it('keeps transaction amounts exact through the production hook', async () => {
    const exact = '340282366920938463463374607431768211455';
    walletService.getBalance.mockResolvedValue({
      address: '0xabc',
      balance: '150000000',
      symbol: 'WRF',
    });
    walletService.getTransactions.mockResolvedValue([
      {
        id: 'tx-u128',
        amount: exact,
        status: 'confirmed',
        timestamp: '2026-03-23T12:00:00.000Z',
        from: '0xdef',
        to: '0xabc',
      },
    ]);

    const { result } = renderHook(() => useWalletData({ withTransactions: true }));

    await waitFor(() => expect(result.current.transactions).toHaveLength(1));
    expect(result.current.transactions[0].amount).toBe(exact);
    expect(walletService.getTransactions).toHaveBeenCalledWith('0xabc');
  });
});
