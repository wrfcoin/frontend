/**
 * Multi-wallet: one session, one wallet. Before another wallet signs in (the passkey wallet), the 12-word
 * wallet unlocked in this tab is locked and its session dropped. The same wallet signing in again changes
 * nothing, and without the flag nothing is registered at all.
 */
import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const VECTOR_ADDRESS = '0x3f995ceb27e8177077dbed8b1e4f696af74da492';
const PASSKEY_ADDRESS = `0x${'9a'.repeat(20)}`;

let multiWalletOn = true;
const actualFeatures = await import('../../config/features');
const features = new Proxy(actualFeatures.FEATURES, {
  get: (target, key) => (key === 'multiWallet' ? multiWalletOn : target[key]),
});
await jest.unstable_mockModule('../../config/features', () => ({ ...actualFeatures, FEATURES: features, default: features }));
const clearWalletAuthSession = jest.fn();
await jest.unstable_mockModule('../../services/walletAuthService.ts', () => ({
  loginWalletWithEd25519: jest.fn(async address => ({ address })),
  loginWalletWithSigner: jest.fn(async address => ({ address })),
  clearWalletAuthSession,
}));
await jest.unstable_mockModule('../../utils/walletUtils.ts', () => ({ walletManager: { currentWallet: null } }));
await jest.unstable_mockModule('../../services/apiClient/index.ts', () => ({
  walletService: { getBalance: jest.fn(async () => ({ balance: '0' })), getNonce: jest.fn() },
}));

const { walletProviderManager } = await import('../../services/walletProviders/WalletProviderManager.js');
const { WalletProvider, useWallet } = await import('../WalletContext.jsx');
const { beforeWalletLogin } = await import('../../services/walletSessionSwitch.ts');

let wallet;
function Capture() {
  wallet = useWallet();
  return null;
}
async function unlockPhraseWallet() {
  await act(async () => { render(<WalletProvider><Capture /></WalletProvider>); });
  await act(async () => {
    await wallet.connectWallet('custom', { walletData: { address: VECTOR_ADDRESS, mnemonic } });
  });
  expect(wallet.isConnected).toBe(true);
  clearWalletAuthSession.mockClear();
}

describe('WalletContext, one session per wallet', () => {
  beforeEach(async () => {
    multiWalletOn = true;
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await walletProviderManager.disconnect().catch(() => {});
  });
  afterEach(cleanup);

  it('another wallet signing in locks the unlocked 12-word wallet and drops its session', async () => {
    await unlockPhraseWallet();
    await act(async () => { await beforeWalletLogin(PASSKEY_ADDRESS); });
    expect(wallet.isConnected).toBe(false);
    expect(wallet.account).toBeNull();
    expect(walletProviderManager.getLoginIdentity()).toBeNull();
    expect(clearWalletAuthSession).toHaveBeenCalled();
  });

  it('the same wallet signing in again stays unlocked', async () => {
    await unlockPhraseWallet();
    await act(async () => { await beforeWalletLogin(VECTOR_ADDRESS.toUpperCase().replace('0X', '0x')); });
    expect(wallet.isConnected).toBe(true);
    expect(clearWalletAuthSession).not.toHaveBeenCalled();
  });

  it('with nothing unlocked it does nothing', async () => {
    await act(async () => { render(<WalletProvider><Capture /></WalletProvider>); });
    clearWalletAuthSession.mockClear();
    await act(async () => { await beforeWalletLogin(PASSKEY_ADDRESS); });
    expect(clearWalletAuthSession).not.toHaveBeenCalled();
  });

  it('flag off: no handler is registered, so today\'s behaviour is unchanged', async () => {
    multiWalletOn = false;
    await unlockPhraseWallet();
    await act(async () => { await beforeWalletLogin(PASSKEY_ADDRESS); });
    expect(wallet.isConnected).toBe(true);
  });

  it('the handler is removed when the provider unmounts', async () => {
    await unlockPhraseWallet();
    cleanup();
    await beforeWalletLogin(PASSKEY_ADDRESS);
    expect(walletProviderManager.getLoginIdentity()?.address?.toLowerCase()).toBe(VECTOR_ADDRESS);
  });
});
