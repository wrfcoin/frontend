/**
 * The main wallet page points people who would rather not keep 12 recovery words to the passkey
 * wallet, but only in a build with the passkey flag on (where /wallet/passkey is a route).
 */
import React from 'react';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

let passkeyOn = false;
const actualFeatures = await import('../../config/features');
const features = new Proxy(actualFeatures.FEATURES, {
  get: (target, key) => (key === 'passkeyWallet' ? passkeyOn : target[key]),
});
await jest.unstable_mockModule('../../config/features', () => ({ ...actualFeatures, FEATURES: features, default: features }));
await jest.unstable_mockModule('../../contexts/WalletContext.jsx', () => ({
  WalletProvider: ({ children }) => children,
  useWallet: () => ({ account: null, activeProvider: null, isConnected: false, receiveOnly: false }),
}));
await jest.unstable_mockModule('../../components/wallet/WalletEarningsPanel', () => ({ default: () => null }));
const { default: OwnWalletAddress, PASSKEY_PROMPT, PASSKEY_LINK_LABEL, PASSKEY_WALLET_PATH } = await import('../OwnWalletAddress');

const mount = () => render(
  <MemoryRouter initialEntries={['/wallet']}>
    <Routes>
      <Route path="/wallet" element={<OwnWalletAddress />} />
      <Route path="/wallet/passkey" element={<p>passkey page</p>} />
    </Routes>
  </MemoryRouter>,
);

beforeEach(() => { passkeyOn = false; });
afterEach(cleanup);

describe('wallet page link to the passkey wallet', () => {
  it('flag on: a link "Use a passkey wallet" to /wallet/passkey, after "Prefer no 12 words?"', () => {
    passkeyOn = true;
    mount();
    expect(screen.getByTestId('wallet-passkey-link').textContent).toContain(PASSKEY_PROMPT);
    expect(PASSKEY_PROMPT).toBe('Prefer no 12 words?');
    const link = screen.getByRole('link', { name: PASSKEY_LINK_LABEL });
    expect(link.getAttribute('href')).toBe('/wallet/passkey');
    expect(PASSKEY_WALLET_PATH).toBe('/wallet/passkey');
    fireEvent.click(link);
    expect(screen.getByText('passkey page')).toBeTruthy();
  });

  it('flag on: a modified click (new tab) is left to the browser', () => {
    passkeyOn = true;
    mount();
    fireEvent.click(screen.getByRole('link', { name: PASSKEY_LINK_LABEL }), { ctrlKey: true });
    expect(screen.queryByText('passkey page')).toBeNull();
  });

  it('flag off: no passkey link at all', () => {
    mount();
    expect(screen.queryByTestId('wallet-passkey-link')).toBeNull();
    expect(screen.queryByRole('link', { name: PASSKEY_LINK_LABEL })).toBeNull();
    expect(screen.getByText('Create, import or unlock your wallet')).toBeTruthy();
  });
});
