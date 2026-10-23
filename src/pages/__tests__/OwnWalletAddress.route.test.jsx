import React, { Suspense } from 'react';
import { jest } from '@jest/globals';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Routes } from 'react-router-dom';
import { readFileSync } from 'node:fs';
const vector = JSON.parse(readFileSync('contract-fixtures/wallet-key-scheme-vector.json', 'utf8'));
const otherAddress = `0x${'1'.repeat(40)}`;
let state;
await jest.unstable_mockModule('../../contexts/WalletContext.jsx', () => ({
  WalletProvider: ({ children }) => children,
  useWallet: () => state,
}));
const { walletProviderManager } = await import('../../services/walletProviders/WalletProviderManager.js');
const { default: walletRoutes } = await import('../../routes/walletRoutes.jsx');
// The /wallet page is React.lazy; a cold import of its module graph takes
// longer than findBy's 1 s default, so preload it (after the mocks above).
// See OwnWalletAddress.phoneStation.test.jsx for the measured race.
beforeAll(async () => { await import('../OwnWalletAddress'); }, 30000);
const mount = () => render(<MemoryRouter initialEntries={[`/wallet?address=${otherAddress}`]}><Suspense fallback="Loading"><Routes>{walletRoutes()}</Routes></Suspense></MemoryRouter>);
beforeEach(async () => {
  localStorage.clear(); sessionStorage.clear();
  await walletProviderManager.connect('custom', { walletData: { address: vector.address, mnemonic: vector.mnemonic } });
  state = { account: vector.address, activeProvider: 'custom', isConnected: true, receiveOnly: false };
});
afterEach(async () => { cleanup(); await walletProviderManager.disconnect(); localStorage.clear(); sessionStorage.clear(); });

it('the actual wallet route shows only the real signing account, ignoring another address in the URL', async () => {
  const view = mount();
  expect((await screen.findByLabelText('Your WRFCoin address')).textContent).toBe(vector.address);
  expect(view.container.textContent).not.toContain(otherAddress);
  expect(view.container.textContent).not.toMatch(/Send|Transaction History/);
  expect(view.container.querySelector('input')).toBeNull();
});
it.each([
  ['disconnected', { isConnected: false }],
  ['receive-only', { receiveOnly: true }],
  ['another account', { account: otherAddress }],
  ['EVM provider', { activeProvider: 'metamask' }],
])('does not display an address for %s state', async (_, change) => {
  state = { ...state, ...change };
  const view = mount();
  await screen.findByText('Create, import or unlock your wallet');
  expect(view.container.querySelector('output')).toBeNull();
});
it('requires a live signing identity even when the context retains a connected address', async () => {
  await walletProviderManager.disconnect();
  const view = mount();
  await screen.findByText('Create, import or unlock your wallet');
  expect(view.container.querySelector('output')).toBeNull();
});
