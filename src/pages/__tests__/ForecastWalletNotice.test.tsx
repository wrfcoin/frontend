/**
 * @jest-environment jsdom
 */
// Make a forecast, multi-wallet builds: the page names the wallet that signs, and when the active wallet
// cannot sign it offers the one step that gets there (unlock, or switch away from the passkey session).
import { jest } from '@jest/globals';
import React from 'react';
import '@testing-library/jest-dom';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

const features = { passkeyWallet: true, multiWallet: true };
await jest.unstable_mockModule('../../config/features', () => ({ FEATURES: features, default: features }));
const { clearAuthToken, getAuthToken, setAuthToken } = await import('../../services/authTokenStore');
await jest.unstable_mockModule('../../services/walletAuthService', () => ({ clearWalletAuthSession: () => clearAuthToken() }));

const { default: ForecastWalletNotice, forecastWalletNoticeReplaces } = await import('../ForecastWalletNotice');
const { shortAddress } = await import('../../components/wallet/WalletSwitcher');
const { passkeyRecordAddress, hexToBytes } = await import('../../services/walletCrypto/passkey');

const VAULT_ADDRESS = `0x${'cd'.repeat(20)}`;
const OTHER = `0x${'11'.repeat(20)}`;
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

function Setup() {
  const state = useLocation().state as { returnTo?: string } | null;
  return <p>setup page, returns to {state?.returnTo ?? 'nowhere'}</p>;
}
const mount = (you: string | null, canSign: boolean) => render(
  <MemoryRouter initialEntries={['/forecast/new']}>
    <Routes>
      <Route path="/forecast/new" element={<ForecastWalletNotice you={you} canSign={canSign} />} />
      <Route path="/onboarding" element={<Setup />} />
    </Routes>
  </MemoryRouter>,
);

beforeEach(() => { localStorage.clear(); clearAuthToken(); });
afterEach(cleanup);

describe('ForecastWalletNotice', () => {
  it('signed in with the 12-word wallet: names the wallet that signs', () => {
    saveVaultRecord(); savePasskey();
    mount(VAULT_ADDRESS, true);
    expect(screen.getByTestId('forecast-wallet-line')).toHaveTextContent(`Forecasting as your 12-word wallet ${shortAddress(VAULT_ADDRESS)}.`);
    expect(forecastWalletNoticeReplaces(VAULT_ADDRESS, true)).toBe(false);
  });

  it('12-word wallet saved but locked: offers to unlock it and comes back to the forecast', () => {
    saveVaultRecord(); savePasskey();
    mount(null, false);
    expect(screen.getByTestId('forecast-wallet-unlock')).toHaveTextContent(shortAddress(VAULT_ADDRESS));
    expect(forecastWalletNoticeReplaces(null, false)).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Unlock 12-word wallet' }));
    expect(screen.getByText('setup page, returns to /forecast/new')).toBeInTheDocument();
  });

  it('signed in with the passkey wallet: says forecasts use the 12-word wallet; switching signs the passkey out first', () => {
    saveVaultRecord(); savePasskey(); setAuthToken('header.payload.sig');
    mount(PASSKEY_ADDRESS, false);
    const notice = screen.getByTestId('forecast-wallet-switch');
    expect(notice).toHaveTextContent(`You are signed in with your passkey wallet ${shortAddress(PASSKEY_ADDRESS)}.`);
    expect(notice).toHaveTextContent(`unlocks your 12-word wallet ${shortAddress(VAULT_ADDRESS)}`);
    fireEvent.click(screen.getByRole('button', { name: 'Switch to 12-word wallet' }));
    expect(getAuthToken()).toBe('');
    expect(screen.getByText('setup page, returns to /forecast/new')).toBeInTheDocument();
  });

  it('signed in with the passkey wallet and no 12-word wallet yet: offers to add one next to it', () => {
    savePasskey();
    const before = localStorage.getItem('wrfcoin.passkey.credential.v1');
    mount(PASSKEY_ADDRESS, false);
    expect(screen.getByTestId('forecast-wallet-switch')).toHaveTextContent('the passkey wallet stays as it is');
    fireEvent.click(screen.getByRole('button', { name: 'Add a 12-word wallet' }));
    expect(screen.getByText('setup page, returns to /forecast/new')).toBeInTheDocument();
    expect(localStorage.getItem('wrfcoin.passkey.credential.v1')).toBe(before);
  });

  it('adds nothing when nobody is signed in and no 12-word wallet is saved, or for an unknown signed-in address', () => {
    savePasskey();
    const first = mount(null, false);
    expect(first.container).toBeEmptyDOMElement();
    expect(forecastWalletNoticeReplaces(null, false)).toBe(false);
    cleanup();
    const second = mount(OTHER, false);
    expect(second.container).toBeEmptyDOMElement();
    expect(forecastWalletNoticeReplaces(OTHER, false)).toBe(false);
  });
});
