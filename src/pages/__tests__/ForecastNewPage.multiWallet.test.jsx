/** @jest-environment jsdom */
/**
 * Make a forecast in a multi-wallet build: the page names the wallet that signs, offers to unlock a saved
 * 12-word wallet instead of the generic sign-in card, and offers a passkey session the switch.
 */
import { jest } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

Object.assign(globalThis, { __VITE_ENV__: { VITE_WRFCOIN_CHAIN_ID: '888' } });
const A = `0x${'cd'.repeat(20)}`;
let vault = { address: A };
let multiWalletOn = true;
const actualFeatures = await import('../../config/features');
const features = new Proxy(actualFeatures.FEATURES, {
  get: (target, key) => (key === 'multiWallet' || key === 'passkeyWallet' ? multiWalletOn : target[key]),
});
await jest.unstable_mockModule('../../config/features', () => ({ ...actualFeatures, FEATURES: features, default: features }));
await jest.unstable_mockModule('../../services/walletVault', () => ({ readVault: () => vault }));
await jest.unstable_mockModule('../../services/walletCrypto/deviceSession', () => ({ withOwnerKey: jest.fn() }));
const { setAuthToken, clearAuthToken } = await import('../../services/authTokenStore');
const { passkeyRecordAddress, hexToBytes } = await import('../../services/walletCrypto/passkey');
const { shortAddress } = await import('../../components/wallet/WalletSwitcher');
const { default: ForecastNewPage } = await import('../ForecastNewPage');

const PASSKEY = { credentialId: '01'.repeat(16), publicKeyXY: '02'.repeat(64), rpId: 'wrfcoin.com' };
const PASSKEY_ADDRESS = passkeyRecordAddress({
  credentialId: hexToBytes(PASSKEY.credentialId), publicKeyXY: hexToBytes(PASSKEY.publicKeyXY), rpId: PASSKEY.rpId,
}).toLowerCase();
const b64 = obj => globalThis.btoa(JSON.stringify(obj)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const tokenFor = address => `${b64({ alg: 'HS256' })}.${b64({ sub: address, address, role: 'wallet' })}.sig`;
const reply = (status, body) => Promise.resolve({ ok: status >= 200 && status < 300, status, headers: { get: () => null }, json: () => Promise.resolve(body) });

beforeEach(() => {
  localStorage.clear(); multiWalletOn = true; vault = { address: A };
  localStorage.setItem('wrfcoin.passkey.credential.v1', JSON.stringify(PASSKEY));
  globalThis.fetch = jest.fn(url => {
    const path = String(url).replace(/^.*\/api/, '');
    if (path === '/forecasts/status') return reply(200, { enabled: true, leads: [1, 6, 12, 24], variables: ['temperature_c'] });
    if (path === '/weather/stations') return reply(200, { stations: [] });
    if (path === '/forecasts/mine') return reply(200, { forecasts: [] });
    return reply(404, {});
  });
});
afterEach(() => { cleanup(); clearAuthToken(); });
const renderPage = () => render(<MemoryRouter initialEntries={['/forecast/new']}><ForecastNewPage /></MemoryRouter>);

it('signed in with the 12-word wallet: says which wallet signs the forecast', async () => {
  setAuthToken(tokenFor(A));
  renderPage();
  expect(await screen.findByTestId('forecast-wallet-line')).toHaveTextContent(`Forecasting as your 12-word wallet ${shortAddress(A)}.`);
  expect(screen.queryByTestId('forecast-wallet-switch')).toBeNull();
});

it('saved but locked: offers to unlock that wallet instead of the generic sign-in card', async () => {
  renderPage();
  expect(await screen.findByTestId('forecast-wallet-unlock')).toHaveTextContent(shortAddress(A));
  expect(screen.queryByText(/Sign in with a 12-word wallet/)).toBeNull();
});

it('signed in with the passkey wallet: offers the switch, and the form cannot sign', async () => {
  setAuthToken(tokenFor(PASSKEY_ADDRESS));
  renderPage();
  expect(await screen.findByTestId('forecast-wallet-switch')).toHaveTextContent('Switch to 12-word wallet');
  expect(screen.queryByText(/This browser has no 12-word wallet/)).toBeNull();
  expect(screen.getByRole('button', { name: 'Sign and submit' })).toBeDisabled();
});

it('flag off: none of the wallet lines appear', async () => {
  multiWalletOn = false;
  setAuthToken(tokenFor(A));
  renderPage();
  expect(await screen.findByRole('form', { name: 'New forecast' })).toBeInTheDocument();
  expect(screen.queryByTestId('forecast-wallet-line')).toBeNull();
});
