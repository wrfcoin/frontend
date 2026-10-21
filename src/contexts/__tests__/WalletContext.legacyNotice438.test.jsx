/**
 * frontend#438 review (SOL-A P2-2): an old password-salted onboarding wallet can never sign in, so the
 * context refuses the login and disconnects. The provider's exact recovery notice must survive that
 * disconnect, through an explicit connection AND through the automatic restore on page load, while
 * signing stays refused and the address is never re-derived.
 */
import React from 'react';
import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const loginWalletWithEd25519 = jest.fn(async address => ({ address }));
const loginWalletWithSigner = jest.fn(async address => ({ address }));
const clearWalletAuthSession = jest.fn();

await jest.unstable_mockModule('../../services/walletAuthService.ts', () => ({
  loginWalletWithEd25519,
  loginWalletWithSigner,
  clearWalletAuthSession,
}));
await jest.unstable_mockModule('../../utils/walletUtils.ts', () => ({
  walletManager: { currentWallet: null },
}));
await jest.unstable_mockModule('../../services/apiClient/index.ts', () => ({
  walletService: { getBalance: jest.fn(async () => ({ balance: '0' })), getNonce: jest.fn() },
}));

const { walletProviderManager } = await import('../../services/walletProviders/WalletProviderManager.js');
const { WalletProvider, useWallet } = await import('../WalletContext.jsx');
const { LEGACY_PASSWORD_WALLET_NOTICE } = await import('../../services/walletVault.ts');

// Synthetic old-flow record: `type: 'created'`, no words (the password was mixed into the key).
const LEGACY = { name: 'Mine', address: '0x' + '44'.repeat(20), type: 'created', created: '2026-09-01T00:00:00.000Z' };

let wallet;
function Capture() {
  wallet = useWallet();
  return null;
}

async function renderProvider() {
  await act(async () => {
    render(<WalletProvider><Capture /></WalletProvider>);
  });
}

function expectRefusedWithNotice() {
  expect(wallet.walletNotice).toBe(LEGACY_PASSWORD_WALLET_NOTICE);
  expect(wallet.isConnected).toBe(false);
  expect(wallet.account).toBeNull();
  expect(loginWalletWithEd25519).not.toHaveBeenCalled();
  expect(loginWalletWithSigner).not.toHaveBeenCalled();
  expect(clearWalletAuthSession).toHaveBeenCalled();
  expect(walletProviderManager.getActiveProvider()).toBeNull();
}

describe('legacy password-salted wallet: the recovery notice survives the refused login (frontend#438)', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.clear();
    sessionStorage.clear();
    await walletProviderManager.disconnect().catch(() => {});
  });

  it('explicit connection: refused, disconnected, and the exact notice is both the error and the wallet notice', async () => {
    await renderProvider();
    const custom = walletProviderManager.getProvider('custom');
    const genericSign = jest.spyOn(custom, 'signMessage');
    let error;
    await act(async () => {
      error = await wallet.connectWallet('custom', { walletData: LEGACY }).catch(e => e);
    });
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe(LEGACY_PASSWORD_WALLET_NOTICE);
    expect(wallet.error).toBe(LEGACY_PASSWORD_WALLET_NOTICE);
    expect(genericSign).not.toHaveBeenCalled();
    expectRefusedWithNotice();
  });

  it('automatic restore on load: refused, disconnected, and the exact notice is kept', async () => {
    localStorage.setItem('wrfcoin_wallet', JSON.stringify(LEGACY));
    sessionStorage.setItem('wrfcoin_active_provider', 'custom');
    await renderProvider();
    await act(async () => {});
    expectRefusedWithNotice();
  });

  it('a later successful connection replaces the notice (it is not sticky)', async () => {
    await renderProvider();
    await act(async () => {
      await wallet.connectWallet('custom', { walletData: LEGACY }).catch(() => {});
    });
    expect(wallet.walletNotice).toBe(LEGACY_PASSWORD_WALLET_NOTICE);
    const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    await act(async () => {
      await wallet.connectWallet('custom', {
        walletData: { address: '0x3f995ceb27e8177077dbed8b1e4f696af74da492', mnemonic },
      });
    });
    expect(wallet.isConnected).toBe(true);
    expect(wallet.walletNotice).toBeNull();
  });
});
