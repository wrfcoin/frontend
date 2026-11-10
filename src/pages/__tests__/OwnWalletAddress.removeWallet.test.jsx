/**
 * The 12-word wallet page in a multi-wallet build: a saved wallet can be removed from this browser from the
 * locked panel, the passkey record is untouched, and the offer is absent without the flag.
 */
import React from 'react';
import { jest, describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

let multiWalletOn = true;
const actualFeatures = await import('../../config/features');
const features = new Proxy(actualFeatures.FEATURES, {
  get: (target, key) => (key === 'multiWallet' || key === 'passkeyWallet' ? multiWalletOn : target[key]),
});
await jest.unstable_mockModule('../../config/features', () => ({ ...actualFeatures, FEATURES: features, default: features }));
const disconnectWallet = jest.fn(async () => {});
await jest.unstable_mockModule('../../contexts/WalletContext.jsx', () => ({
  WalletProvider: ({ children }) => children,
  useWallet: () => ({ account: null, activeProvider: null, isConnected: false, receiveOnly: false, disconnectWallet }),
  useOptionalWallet: () => null,
}));
await jest.unstable_mockModule('../../components/wallet/WalletEarningsPanel', () => ({ default: () => null }));
const forgetDeviceKey = jest.fn(async () => {});
const actualDeviceKeyStore = await import('../../services/walletCrypto/deviceKeyStore');
await jest.unstable_mockModule('../../services/walletCrypto/deviceKeyStore', () => ({ ...actualDeviceKeyStore, forgetDeviceKey }));
await jest.unstable_mockModule('../../components/wallet/VaultSend', () => ({ default: () => null }));
const { default: OwnWalletAddress } = await import('../OwnWalletAddress');
const { markStationBound } = await import('../../services/stationBoundWallets');
const { clearAuthToken, getAuthToken, setAuthToken } = await import('../../services/authTokenStore');
const { createWebLocksStub, installWebLocks } = await import('../../services/__fixtures__/webLocksStub.ts');
let uninstallLocks = () => {};
beforeAll(() => { uninstallLocks = installWebLocks(createWebLocksStub()); });
afterAll(() => uninstallLocks());
const b64 = o => globalThis.btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const tokenFor = sub => `${b64({ alg: 'HS256' })}.${b64({ sub })}.sig`;
const OTHER_WALLET = `0x${'9a'.repeat(20)}`;

const VAULT_KEY = 'wrfcoin_wallet_vault_v1';
const PASSKEY_KEY = 'wrfcoin.passkey.credential.v1';
const ADDRESS = `0x${'cd'.repeat(18)}12ef`;
const PASSKEY_RECORD = JSON.stringify({ credentialId: '01'.repeat(16), publicKeyXY: '02'.repeat(64), rpId: 'wrfcoin.com' });
const mount = () => render(<MemoryRouter initialEntries={['/wallet']}><OwnWalletAddress /></MemoryRouter>);

beforeEach(() => {
  localStorage.clear(); multiWalletOn = true; disconnectWallet.mockClear(); forgetDeviceKey.mockClear(); clearAuthToken();
  localStorage.setItem(VAULT_KEY, JSON.stringify({
    v: 1, scheme: 'ed25519-slip10-master-v1', address: ADDRESS,
    kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: 600_000, salt: 'AA==' },
    cipher: { name: 'AES-GCM', iv: 'AA==' }, ct: 'AA==',
  }));
  localStorage.setItem(PASSKEY_KEY, PASSKEY_RECORD);
});
afterEach(cleanup);

describe('wallet page: remove the 12-word wallet from this browser', () => {
  it('flag off: no remove offer', () => {
    multiWalletOn = false;
    mount();
    expect(screen.queryByTestId('remove-wallet-open')).toBeNull();
  });

  it('locked wallet: removal empties the 12-word slot, keeps the passkey wallet, and the page shows no saved wallet', async () => {
    mount();
    expect(screen.getByRole('button', { name: 'Unlock 12-word wallet' })).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getByTestId('remove-wallet-open')); });
    fireEvent.click(screen.getByTestId('remove-wallet-written'));
    fireEvent.change(screen.getByTestId('remove-wallet-tail'), { target: { value: '12ef' } });
    await act(async () => { fireEvent.click(screen.getByTestId('remove-wallet-confirm')); });
    await waitFor(() => expect(localStorage.getItem(VAULT_KEY)).toBeNull());
    expect(localStorage.getItem(PASSKEY_KEY)).toBe(PASSKEY_RECORD);
    expect(forgetDeviceKey).toHaveBeenCalledWith(ADDRESS);
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Unlock 12-word wallet' })).toBeNull());
    expect(screen.queryByTestId('remove-wallet-open')).toBeNull();
    // The passkey wallet is still offered.
    expect(screen.getByRole('button', { name: 'Open my passkey wallet' })).toBeTruthy();
  });

  it('removing a locked 12-word wallet leaves another wallet\'s session signed in', async () => {
    setAuthToken(tokenFor(OTHER_WALLET)); // e.g. the passkey wallet holds the session
    mount();
    await act(async () => { fireEvent.click(screen.getByTestId('remove-wallet-open')); });
    fireEvent.click(screen.getByTestId('remove-wallet-written'));
    fireEvent.change(screen.getByTestId('remove-wallet-tail'), { target: { value: '12ef' } });
    await act(async () => { fireEvent.click(screen.getByTestId('remove-wallet-confirm')); });
    await waitFor(() => expect(localStorage.getItem(VAULT_KEY)).toBeNull());
    expect(getAuthToken()).toBe(tokenFor(OTHER_WALLET));
    expect(disconnectWallet).not.toHaveBeenCalled();
  });

  it('a wallet that owns a station stays', async () => {
    markStationBound(ADDRESS, 'st_abc123');
    mount();
    await act(async () => { fireEvent.click(screen.getByTestId('remove-wallet-open')); });
    expect(screen.getByTestId('remove-wallet-station-bound')).toBeTruthy();
    expect(screen.getByTestId('remove-wallet-confirm').disabled).toBe(true);
    expect(localStorage.getItem(VAULT_KEY)).not.toBeNull();
  });
});
