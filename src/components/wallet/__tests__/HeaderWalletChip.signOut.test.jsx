/**
 * @jest-environment jsdom
 *
 * Sign out from the taskbar, mounted the way the app mounts it: the wallet button sits in the shell, OUTSIDE
 * every WalletProvider (each wallet route has its own). Signing out must still lock an unlocked 12-word
 * wallet, so the wallet page stops showing it as unlocked, and clear the session.
 */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import '@testing-library/jest-dom';

const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const VECTOR_ADDRESS = '0x3f995ceb27e8177077dbed8b1e4f696af74da492';

const actualFeatures = await import('../../../config/features');
const features = new Proxy(actualFeatures.FEATURES, {
  get: (target, key) => (key === 'multiWallet' || key === 'passkeyWallet' ? true : target[key]),
});
await jest.unstable_mockModule('../../../config/features', () => ({ ...actualFeatures, FEATURES: features, default: features }));
const { clearAuthToken, getAuthToken, setAuthToken } = await import('../../../services/authTokenStore');
const b64 = o => globalThis.btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const tokenFor = sub => `${b64({ alg: 'HS256' })}.${b64({ sub })}.sig`;
// The login itself is stubbed (no backend); it stores a token for the wallet as the real one does.
await jest.unstable_mockModule('../../../services/walletAuthService.ts', () => ({
  loginWalletWithEd25519: jest.fn(async address => { setAuthToken(tokenFor(address)); return { address }; }),
  loginWalletWithSigner: jest.fn(async address => ({ address })),
  clearWalletAuthSession: () => clearAuthToken(),
}));
await jest.unstable_mockModule('../../../utils/walletUtils.ts', () => ({ walletManager: { currentWallet: null } }));
await jest.unstable_mockModule('../../../services/apiClient/index.ts', () => ({
  walletService: { getBalance: jest.fn(async () => ({ balance: '0' })), getNonce: jest.fn() },
}));

const { walletProviderManager } = await import('../../../services/walletProviders/WalletProviderManager.js');
const { WalletProvider, useWallet, useOptionalWallet } = await import('../../../contexts/WalletContext.jsx');
const { default: HeaderWalletChip } = await import('../HeaderWalletChip');

let wallet;
let chipContext = 'unset';
function WalletPage() {
  wallet = useWallet();
  return <p data-testid="wallet-page">{wallet.isConnected ? 'Unlocked' : 'Locked'}</p>;
}
function Shell() {
  chipContext = useOptionalWallet();
  return <HeaderWalletChip />;
}
// As in App.jsx: the taskbar is a sibling of the routes; only the wallet route is inside a WalletProvider.
const mountApp = () => render(
  <MemoryRouter initialEntries={['/wallet']}>
    <Routes>
      <Route path="/wallet" element={<WalletProvider><WalletPage /></WalletProvider>} />
    </Routes>
    <Shell />
  </MemoryRouter>,
);

describe('taskbar sign out, mounted as the app mounts it', () => {
  beforeEach(async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.clear(); clearAuthToken();
    await walletProviderManager.disconnect().catch(() => {});
  });
  afterEach(cleanup);

  it('locks the unlocked 12-word wallet and clears the session', async () => {
    await act(async () => { mountApp(); });
    await act(async () => { await wallet.connectWallet('custom', { walletData: { address: VECTOR_ADDRESS, mnemonic } }); });
    // The premise: the button has no wallet context of its own.
    expect(chipContext).toBeNull();
    expect(screen.getByTestId('wallet-page')).toHaveTextContent('Unlocked');
    expect(walletProviderManager.getActiveProvider()).not.toBeNull();
    expect(getAuthToken()).toBe(tokenFor(VECTOR_ADDRESS));

    fireEvent.click(screen.getByTestId('wallet-chip'));
    await act(async () => { fireEvent.click(screen.getByTestId('wallet-chip-sign-out')); });

    await waitFor(() => expect(walletProviderManager.getActiveProvider()).toBeNull());
    expect(walletProviderManager.getLoginIdentity()).toBeNull();
    expect(getAuthToken()).toBe('');
    await waitFor(() => expect(screen.getByTestId('wallet-page')).toHaveTextContent('Locked'));
    expect(screen.getByTestId('wallet-chip')).not.toHaveClass('wallet-chip--active');
  });

  it('the session rule needs no mounted provider: a passkey login from any page locks the 12-word wallet', async () => {
    await act(async () => { mountApp(); });
    await act(async () => { await wallet.connectWallet('custom', { walletData: { address: VECTOR_ADDRESS, mnemonic } }); });
    cleanup(); // the visitor is now on a page with no WalletProvider at all
    expect(walletProviderManager.getActiveProvider()).not.toBeNull();
    const { beforeWalletLogin } = await import('../../../services/walletSessionSwitch.ts');
    globalThis.__VITE_ENV__ = { VITE_ENABLE_PASSKEY_WALLET: 'true', VITE_ENABLE_MULTI_WALLET: 'true' };
    try {
      await expect(beforeWalletLogin(`0x${'9a'.repeat(20)}`)).resolves.toBe(true);
    } finally {
      delete globalThis.__VITE_ENV__;
    }
    expect(walletProviderManager.getActiveProvider()).toBeNull();
  });

  it('with nothing unlocked (a passkey session), it just clears the session', async () => {
    await act(async () => { mountApp(); });
    act(() => setAuthToken(tokenFor(`0x${'9a'.repeat(20)}`)));
    fireEvent.click(screen.getByTestId('wallet-chip'));
    await act(async () => { fireEvent.click(screen.getByTestId('wallet-chip-sign-out')); });
    await waitFor(() => expect(getAuthToken()).toBe(''));
  });
});
