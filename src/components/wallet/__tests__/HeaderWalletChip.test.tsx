/**
 * @jest-environment jsdom
 */
// The taskbar wallet button: names the active wallet (the one the login token was issued to) by kind and
// short address, lists both saved wallets, opens either, and signs out. Absent unless the flag is on.
import { jest } from '@jest/globals';
import React from 'react';
import '@testing-library/jest-dom';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const features = { passkeyWallet: true, multiWallet: true };
await jest.unstable_mockModule('../../../config/features', () => ({ FEATURES: features, default: features }));
const disconnectWallet = jest.fn(async () => {});
const walletState = { isConnected: false, disconnectWallet };
await jest.unstable_mockModule('../../../contexts/WalletContext.jsx', () => ({ useOptionalWallet: () => walletState }));
const { clearAuthToken, getAuthToken, setAuthToken } = await import('../../../services/authTokenStore');
await jest.unstable_mockModule('../../../services/walletAuthService', () => ({ clearWalletAuthSession: () => clearAuthToken() }));

const { default: HeaderWalletChip, walletRowStatus } = await import('../HeaderWalletChip');
const { shortAddress } = await import('../WalletSwitcher');
const { passkeyRecordAddress, hexToBytes } = await import('../../../services/walletCrypto/passkey');

const VAULT_ADDRESS = `0x${'cd'.repeat(20)}`;
const saveVaultRecord = () => localStorage.setItem('wrfcoin_wallet_vault_v1', JSON.stringify({
  v: 1, scheme: 'ed25519-slip10-master-v1', address: VAULT_ADDRESS,
  kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: 600_000, salt: 'AA==' },
  cipher: { name: 'AES-GCM', iv: 'AA==' }, ct: 'AA==',
}));
const PASSKEY = { credentialId: '01'.repeat(16), publicKeyXY: '02'.repeat(64), rpId: 'wrfcoin.com' };
const PASSKEY_ADDRESS = passkeyRecordAddress({
  credentialId: hexToBytes(PASSKEY.credentialId), publicKeyXY: hexToBytes(PASSKEY.publicKeyXY), rpId: PASSKEY.rpId,
}).toLowerCase();
const savePasskey = () => localStorage.setItem('wrfcoin.passkey.credential.v1', JSON.stringify(PASSKEY));
const b64 = (o: unknown) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const tokenFor = (sub: string) => `${b64({ alg: 'HS256' })}.${b64({ sub })}.sig`;

const mount = () => render(
  <MemoryRouter initialEntries={['/']}>
    <HeaderWalletChip />
    <Routes>
      <Route path="/" element={<p>home</p>} />
      <Route path="/wallet" element={<p>phrase page</p>} />
      <Route path="/wallet/passkey" element={<p>passkey page</p>} />
      <Route path="/onboarding" element={<p>setup page</p>} />
    </Routes>
  </MemoryRouter>,
);

beforeEach(() => {
  localStorage.clear(); clearAuthToken(); disconnectWallet.mockClear();
  features.passkeyWallet = true; features.multiWallet = true; walletState.isConnected = false;
});
afterEach(cleanup);

describe('HeaderWalletChip', () => {
  it('renders nothing when the flag is off', () => {
    features.multiWallet = false;
    savePasskey(); saveVaultRecord();
    mount();
    expect(screen.queryByTestId('wallet-chip')).toBeNull();
  });

  it('nobody signed in: says how many wallets the browser holds, with no address', () => {
    savePasskey(); saveVaultRecord();
    mount();
    const chip = screen.getByTestId('wallet-chip');
    expect(chip).toHaveTextContent('Wallets');
    expect(chip).toHaveAccessibleName('Your wallets. 2 wallets in this browser, none signed in');
    expect(screen.queryByTestId('wallet-chip-kind')).toBeNull();
  });

  it('12-word wallet signed in: kind badge and short address; the menu marks it Signed in and the passkey On this device', () => {
    savePasskey(); saveVaultRecord(); setAuthToken(tokenFor(VAULT_ADDRESS));
    mount();
    expect(screen.getByTestId('wallet-chip-kind')).toHaveTextContent('12-word');
    expect(screen.getByTestId('wallet-chip-text')).toHaveTextContent(shortAddress(VAULT_ADDRESS));
    fireEvent.click(screen.getByTestId('wallet-chip'));
    expect(screen.getByTestId('wallet-chip-row-phrase')).toHaveTextContent(`12-word wallet${shortAddress(VAULT_ADDRESS)} · Signed in`);
    expect(screen.getByTestId('wallet-chip-row-passkey')).toHaveTextContent(`Passkey wallet${shortAddress(PASSKEY_ADDRESS)} · On this device`);
  });

  it('passkey wallet signed in: the button names the passkey wallet and the 12-word row says Locked', () => {
    savePasskey(); saveVaultRecord(); setAuthToken(tokenFor(PASSKEY_ADDRESS));
    mount();
    expect(screen.getByTestId('wallet-chip-kind')).toHaveTextContent('Passkey');
    expect(screen.getByTestId('wallet-chip-text')).toHaveTextContent(shortAddress(PASSKEY_ADDRESS));
    fireEvent.click(screen.getByTestId('wallet-chip'));
    expect(screen.getByTestId('wallet-chip-row-phrase')).toHaveTextContent('Locked');
    expect(screen.getByTestId('wallet-chip-row-passkey')).toHaveTextContent('Signed in');
  });

  it('the button follows the session: a new login for the other wallet renames it at once', () => {
    savePasskey(); saveVaultRecord(); setAuthToken(tokenFor(VAULT_ADDRESS));
    mount();
    expect(screen.getByTestId('wallet-chip-kind')).toHaveTextContent('12-word');
    act(() => setAuthToken(tokenFor(PASSKEY_ADDRESS)));
    expect(screen.getByTestId('wallet-chip-kind')).toHaveTextContent('Passkey');
    expect(screen.getByTestId('wallet-chip-text')).toHaveTextContent(shortAddress(PASSKEY_ADDRESS));
  });

  it('passkey only: offers to add a 12-word wallet, which opens wallet setup and leaves the passkey record alone', () => {
    savePasskey();
    const before = localStorage.getItem('wrfcoin.passkey.credential.v1');
    mount();
    fireEvent.click(screen.getByTestId('wallet-chip'));
    const add = screen.getByTestId('wallet-chip-row-phrase');
    expect(add).toHaveTextContent('Add a 12-word wallet');
    fireEvent.click(add);
    expect(screen.getByText('setup page')).toBeInTheDocument();
    expect(localStorage.getItem('wrfcoin.passkey.credential.v1')).toBe(before);
  });

  it('choosing a wallet opens its page and does not change the session', () => {
    savePasskey(); saveVaultRecord(); setAuthToken(tokenFor(VAULT_ADDRESS));
    mount();
    fireEvent.click(screen.getByTestId('wallet-chip'));
    fireEvent.click(screen.getByTestId('wallet-chip-row-passkey'));
    expect(screen.getByText('passkey page')).toBeInTheDocument();
    expect(getAuthToken()).toBe(tokenFor(VAULT_ADDRESS));
    expect(disconnectWallet).not.toHaveBeenCalled();
  });

  it('sign out locks an unlocked wallet and clears the session', async () => {
    saveVaultRecord(); setAuthToken(tokenFor(VAULT_ADDRESS)); walletState.isConnected = true;
    mount();
    fireEvent.click(screen.getByTestId('wallet-chip'));
    await act(async () => { fireEvent.click(screen.getByTestId('wallet-chip-sign-out')); });
    expect(disconnectWallet).toHaveBeenCalledTimes(1);
    expect(getAuthToken()).toBe('');
    expect(screen.getByTestId('wallet-chip')).toHaveTextContent('Wallets');
  });

  it('no sign-out entry when nobody is signed in', () => {
    savePasskey();
    mount();
    fireEvent.click(screen.getByTestId('wallet-chip'));
    expect(screen.queryByTestId('wallet-chip-sign-out')).toBeNull();
  });

  it('never shows a full address or reads the encrypted words', () => {
    savePasskey(); saveVaultRecord(); setAuthToken(tokenFor(VAULT_ADDRESS));
    const { container } = mount();
    fireEvent.click(screen.getByTestId('wallet-chip'));
    expect(container.textContent).not.toContain(VAULT_ADDRESS);
    expect(walletRowStatus('phrase', false)).toBe('Locked');
    expect(walletRowStatus('passkey', false)).toBe('On this device');
  });
});
