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
const { default: OwnWalletAddress, PASSKEY_PROMPT, PASSKEY_LINK_LABEL, PASSKEY_WALLET_PATH, PASSKEY_LOCKED_TITLE, PASSKEY_LOCKED_DESCRIPTION } = await import('../OwnWalletAddress');

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

describe('wallet page and the passkey wallet', () => {
  it('flag on, locked: the passkey wallet is the first choice and the 12-word wallet is Advanced', () => {
    passkeyOn = true;
    mount();
    const panel = screen.getByTestId('wallet-locked-passkey-first');
    expect(screen.getByText(PASSKEY_LOCKED_TITLE)).toBeTruthy();
    expect(PASSKEY_LOCKED_DESCRIPTION).toContain('no recovery phrase to write down');
    const buttons = Array.from(panel.querySelectorAll('button')).map(b => b.textContent);
    expect(buttons[0]).toContain('Create with Face ID or fingerprint');
    expect(buttons).toContain('Advanced: 12-word wallet');
    // No vault in this browser: no unlock button, and nothing offers to import a phrase.
    expect(buttons).not.toContain('Unlock 12-word wallet');
    expect(screen.queryByText('Import recovery phrase')).toBeNull();
    // The "Prefer no 12 words?" row is for an unlocked phrase wallet; locked, the panel already leads with passkeys.
    expect(screen.queryByTestId('wallet-passkey-link')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Create with Face ID or fingerprint/ }));
    expect(screen.getByText('passkey page')).toBeTruthy();
  });

  it('flag off: no passkey link at all', () => {
    mount();
    expect(screen.queryByTestId('wallet-passkey-link')).toBeNull();
    expect(screen.queryByRole('link', { name: PASSKEY_LINK_LABEL })).toBeNull();
    expect(screen.getByText('Create, import or unlock your wallet')).toBeTruthy();
    expect(PASSKEY_PROMPT).toBe('Prefer no 12 words?');
    expect(PASSKEY_WALLET_PATH).toBe('/wallet/passkey');
  });
});
