/**
 * @jest-environment jsdom
 */
// The passkey wallet and the 12-word wallet side by side: the switcher shows only public addresses, opens the
// other wallet's page in the app, and is absent when the build does not serve the passkey wallet.
import { jest } from '@jest/globals';
import React from 'react';
import '@testing-library/jest-dom';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const features = { passkeyWallet: true };
await jest.unstable_mockModule('../../../config/features', () => ({ FEATURES: features, default: features }));

const { default: WalletSwitcher, readSavedWallets, shortAddress } = await import('../WalletSwitcher');
const { passkeyRecordAddress } = await import('../../../services/walletCrypto/passkey');
const { hexToBytes } = await import('../../../services/walletCrypto/passkey');

const VAULT_ADDRESS = `0x${'cd'.repeat(20)}`;
const saveVaultRecord = () => localStorage.setItem('wrfcoin_wallet_vault_v1', JSON.stringify({
  v: 1, scheme: 'ed25519-slip10-master-v1', address: VAULT_ADDRESS,
  kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: 600_000, salt: 'AA==' },
  cipher: { name: 'AES-GCM', iv: 'AA==' }, ct: 'AA==',
}));
const PASSKEY = { credentialId: '01'.repeat(16), publicKeyXY: '02'.repeat(64), rpId: 'wrfcoin.com' };
const passkeyAddress = passkeyRecordAddress({
  credentialId: hexToBytes(PASSKEY.credentialId), publicKeyXY: hexToBytes(PASSKEY.publicKeyXY), rpId: PASSKEY.rpId,
}).toLowerCase();
const savePasskey = () => localStorage.setItem('wrfcoin.passkey.credential.v1', JSON.stringify(PASSKEY));

const mount = (current: 'passkey' | 'phrase', unlockedAddress: string | null = null, start = current === 'passkey' ? '/wallet/passkey' : '/wallet') => render(
  <MemoryRouter initialEntries={[start]}>
    <Routes>
      <Route path="/wallet" element={<><WalletSwitcher current="phrase" unlockedAddress={unlockedAddress} /><p>phrase page</p></>} />
      <Route path="/wallet/passkey" element={<><WalletSwitcher current="passkey" unlockedAddress={unlockedAddress} /><p>passkey page</p></>} />
      <Route path="/onboarding" element={<p>setup page</p>} />
    </Routes>
  </MemoryRouter>,
);

beforeEach(() => { localStorage.clear(); features.passkeyWallet = true; });
afterEach(cleanup);

describe('WalletSwitcher', () => {
  it('both saved: shows both public addresses, which page is open, and the station note', () => {
    savePasskey(); saveVaultRecord();
    mount('passkey');
    const passkeyTab = screen.getByTestId('wallet-switcher-passkey');
    const phraseTab = screen.getByTestId('wallet-switcher-phrase');
    expect(passkeyTab).toHaveAttribute('aria-current', 'page');
    expect(phraseTab).not.toHaveAttribute('aria-current');
    expect(passkeyTab).toHaveTextContent(shortAddress(passkeyAddress));
    expect(phraseTab).toHaveTextContent(`${shortAddress(VAULT_ADDRESS)}Locked`);
    expect(screen.getByTestId('wallet-switcher-note')).toHaveTextContent('Weather stations join with the 12-word wallet');
  });

  it('switching opens the other page in the app', () => {
    savePasskey(); saveVaultRecord();
    mount('passkey');
    fireEvent.click(screen.getByTestId('wallet-switcher-phrase'));
    expect(screen.getByText('phrase page')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('wallet-switcher-passkey'));
    expect(screen.getByText('passkey page')).toBeInTheDocument();
  });

  it('marks the 12-word wallet Unlocked only for its own signed-in address', () => {
    saveVaultRecord();
    mount('phrase', VAULT_ADDRESS.toUpperCase().replace('0X', '0x'));
    expect(screen.getByTestId('wallet-switcher-phrase')).toHaveTextContent('Unlocked');
    cleanup();
    mount('phrase', `0x${'ee'.repeat(20)}`);
    expect(screen.getByTestId('wallet-switcher-phrase')).toHaveTextContent('Locked');
  });

  it('a missing wallet shows Add: no 12-word wallet goes to wallet setup', () => {
    savePasskey();
    mount('passkey');
    expect(screen.getByTestId('wallet-switcher-phrase')).toHaveTextContent('Add');
    expect(screen.getByTestId('wallet-switcher-phrase')).toHaveAttribute('href', '/onboarding');
    expect(screen.queryByTestId('wallet-switcher-note')).toBeNull();
    fireEvent.click(screen.getByTestId('wallet-switcher-phrase'));
    expect(screen.getByText('setup page')).toBeInTheDocument();
  });

  it('no passkey saved: the passkey tab offers to add one on the passkey page', () => {
    saveVaultRecord();
    mount('phrase');
    expect(screen.getByTestId('wallet-switcher-passkey')).toHaveTextContent('Add');
    expect(screen.getByTestId('wallet-switcher-passkey')).toHaveAttribute('href', '/wallet/passkey');
  });

  it('passkey flag off: nothing is shown and the passkey record is not read', () => {
    features.passkeyWallet = false;
    savePasskey(); saveVaultRecord();
    mount('phrase');
    expect(screen.queryByTestId('wallet-switcher')).toBeNull();
    expect(readSavedWallets()).toEqual({ passkey: null, phrase: VAULT_ADDRESS });
  });

  it('reads public material only: an unreadable passkey record counts as none', () => {
    localStorage.setItem('wrfcoin.passkey.credential.v1', '{"publicKeyXY":"zz"}');
    expect(readSavedWallets()).toEqual({ passkey: null, phrase: null });
  });

  it('a 12-word wallet removed on this page (wallets-changed event) is no longer listed', () => {
    savePasskey(); saveVaultRecord();
    mount('phrase');
    expect(screen.getByTestId('wallet-switcher-phrase')).toHaveTextContent('0xcdcd');
    localStorage.removeItem('wrfcoin_wallet_vault_v1');
    act(() => { window.dispatchEvent(new Event('wrfcoin:wallets-changed')); });
    expect(screen.getByTestId('wallet-switcher-phrase')).toHaveTextContent('Add');
    expect(screen.getByTestId('wallet-switcher-phrase')).toHaveAttribute('href', '/onboarding');
    expect(screen.getByTestId('wallet-switcher-passkey')).toHaveTextContent(shortAddress(passkeyAddress));
  });

  it('a wallet added or removed in another tab (storage event) refreshes the tabs', () => {
    saveVaultRecord();
    mount('phrase');
    expect(screen.getByTestId('wallet-switcher-passkey')).toHaveTextContent('Add');
    savePasskey();
    act(() => { window.dispatchEvent(new StorageEvent('storage', { key: 'wrfcoin.passkey.credential.v1' })); });
    expect(screen.getByTestId('wallet-switcher-passkey')).toHaveTextContent(shortAddress(passkeyAddress));
  });
});
