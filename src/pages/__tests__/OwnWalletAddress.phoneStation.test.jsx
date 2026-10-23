// W28: /wallet shows the phone-station status for the signed-in owner only (the read is wallet-scoped).
import React, { Suspense } from 'react';
import { jest } from '@jest/globals';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Routes } from 'react-router-dom';
import { readFileSync } from 'node:fs';
const vector = JSON.parse(readFileSync('contract-fixtures/wallet-key-scheme-vector.json', 'utf8'));
let state;
await jest.unstable_mockModule('../../contexts/WalletContext.jsx', () => ({
  WalletProvider: ({ children }) => children,
  useWallet: () => state,
}));
await jest.unstable_mockModule('../../components/wallet/PhoneStationStatusCard', () => ({
  default: ({ ownerAddress }) => <p data-testid="phone-card">{ownerAddress === null ? 'no owner' : `owner ${ownerAddress}`}</p>,
}));
const { walletProviderManager } = await import('../../services/walletProviders/WalletProviderManager.js');
const { default: walletRoutes } = await import('../../routes/walletRoutes.jsx');
// /wallet renders the page through React.lazy, so the first mount shows the
// Suspense fallback until the page module is imported. A cold import of the
// page's module graph (transform + evaluate) takes ~1-3 s, longer than
// findBy's 1 s default, so whichever test mounts first used to time out on
// the fallback. Import it once here, after the mocks above are registered;
// the lazy route then resolves from the module registry. The hook gets its
// own budget because a cold, uncached import can exceed jest's 5 s default.
beforeAll(async () => { await import('../OwnWalletAddress'); }, 30000);
const mount = () => render(<MemoryRouter initialEntries={['/wallet']}><Suspense fallback="Loading"><Routes>{walletRoutes()}</Routes></Suspense></MemoryRouter>);
beforeEach(async () => {
  await walletProviderManager.connect('custom', { walletData: { address: vector.address, mnemonic: vector.mnemonic } });
  state = { account: vector.address, activeProvider: 'custom', isConnected: true, receiveOnly: false };
});
afterEach(async () => { cleanup(); await walletProviderManager.disconnect(); localStorage.clear(); sessionStorage.clear(); });

it('the owner of the shown address gets the phone-station card for that address', async () => {
  mount();
  expect((await screen.findByTestId('phone-card')).textContent).toBe(`owner ${vector.address}`);
});
it.each([
  ['disconnected', { isConnected: false }],
  ['receive-only', { receiveOnly: true }],
  ['another account', { account: `0x${'1'.repeat(40)}` }],
])('%s: the card gets no owner, so it reads nothing', async (_, change) => {
  state = { ...state, ...change };
  mount();
  expect((await screen.findByTestId('phone-card')).textContent).toBe('no owner');
});
