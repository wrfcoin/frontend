/**
 * @jest-environment jsdom
 *
 * Flag off, the two wallet pages render what they rendered before this work. The flag only ADDS a small,
 * named set of elements: with the flag on and those elements taken out, the page is the same markup as with
 * the flag off. So a build without VITE_ENABLE_MULTI_WALLET shows nothing new on these pages.
 */
import React from 'react';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

let multiWalletOn = false;
const actualFeatures = await import('../../config/features');
const features = new Proxy(actualFeatures.FEATURES, {
  get: (target, key) => (key === 'multiWallet' ? multiWalletOn : key === 'passkeyWallet' ? true : target[key]),
});
await jest.unstable_mockModule('../../config/features', () => ({ ...actualFeatures, FEATURES: features, default: features }));
await jest.unstable_mockModule('../../contexts/WalletContext.jsx', () => ({
  WalletProvider: ({ children }) => children,
  useWallet: () => ({ account: null, activeProvider: null, isConnected: false, receiveOnly: false, disconnectWallet: async () => {} }),
  useOptionalWallet: () => null,
}));
const actualPanel = await import('../../components/wallet/WalletEarningsPanel');
await jest.unstable_mockModule('../../components/wallet/WalletEarningsPanel', () => ({ ...actualPanel, default: () => null }));
await jest.unstable_mockModule('../../components/wallet/VaultSend', () => ({ default: () => null }));
await jest.unstable_mockModule('../../services/walletCrypto/passkeyBalance', () => ({
  getPasskeyPublicBalance: async () => ({ units: '100000000', height: 4209 }),
}));
await jest.unstable_mockModule('../../hooks/usePublicTestnetStats', () => ({ default: () => ({ blockHeight: 4210 }) }));
const { default: OwnWalletAddress } = await import('../OwnWalletAddress');
const { default: PasskeyWalletPage } = await import('../PasskeyWalletPage');

// Every element this work adds to the two wallet pages.
const ADDED = ['remove-wallet-open', 'passkey-send-from'];
const withoutAdded = container => {
  const copy = container.cloneNode(true);
  for (const id of ADDED) copy.querySelectorAll(`[data-testid="${id}"]`).forEach(node => node.remove());
  return copy.innerHTML;
};
// MUI numbers its generated ids per render; they are not content.
const stable = html => html.replace(/(id|for|aria-labelledby|aria-describedby)="[^"]*"/g, '$1=""');

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('wrfcoin_wallet_vault_v1', JSON.stringify({
    v: 1, scheme: 'ed25519-slip10-master-v1', address: `0x${'cd'.repeat(20)}`,
    kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: 600_000, salt: 'AA==' },
    cipher: { name: 'AES-GCM', iv: 'AA==' }, ct: 'AA==',
  }));
  localStorage.setItem('wrfcoin.passkey.credential.v1', JSON.stringify({ credentialId: '01'.repeat(16), publicKeyXY: '02'.repeat(64), rpId: 'localhost' }));
});
afterEach(cleanup);

async function renderBoth(Page, ready) {
  multiWalletOn = false;
  const off = render(<MemoryRouter><Page /></MemoryRouter>);
  await ready();
  const offHtml = off.container.innerHTML;
  const offHasAdded = ADDED.filter(id => off.container.querySelector(`[data-testid="${id}"]`));
  cleanup();
  multiWalletOn = true;
  const on = render(<MemoryRouter><Page /></MemoryRouter>);
  await ready();
  return { offHtml, offHasAdded, onContainer: on.container };
}

describe('wallet pages with the multi-wallet flag off', () => {
  it('/wallet (12-word wallet saved, locked): nothing new, and the flag only adds the remove offer', async () => {
    const { offHtml, offHasAdded, onContainer } = await renderBoth(OwnWalletAddress, () => screen.findByTestId('wallet-locked'));
    expect(offHasAdded).toEqual([]);
    expect(onContainer.querySelector('[data-testid="remove-wallet-open"]')).not.toBeNull();
    expect(stable(withoutAdded(onContainer))).toBe(stable(offHtml));
  });

  it('/wallet/passkey: nothing new, and the flag only adds the sending-wallet line', async () => {
    const { offHtml, offHasAdded, onContainer } = await renderBoth(PasskeyWalletPage, async () => {
      await screen.findByTestId('passkey-balance');
      await screen.findByText(/Read at block/);
    });
    expect(offHasAdded).toEqual([]);
    expect(onContainer.querySelector('[data-testid="passkey-send-from"]')).not.toBeNull();
    expect(stable(withoutAdded(onContainer))).toBe(stable(offHtml));
  });
});
