import React from 'react';
import { jest } from '@jest/globals';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
const address = '0x' + '1'.repeat(40);
let state; let vault; let identity;
const features = { walletSend: true };
await jest.unstable_mockModule('../../contexts/WalletContext.jsx', () => ({ useWallet: () => state }));
await jest.unstable_mockModule('../../services/walletProviders/WalletProviderManager.js', () => ({ walletProviderManager: { getLoginIdentity: () => identity } }));
await jest.unstable_mockModule('../../services/walletVault', () => ({ readVault: () => vault }));
await jest.unstable_mockModule('../../config/features', () => ({ FEATURES: features }));
await jest.unstable_mockModule('../../components/wallet/PhoneStationStatusCard', () => ({ default: () => null }));
await jest.unstable_mockModule('../../components/wallet/VaultSend', () => ({ default: () => <button>Send</button> }));
const { default: OwnWalletAddress } = await import('../OwnWalletAddress');
beforeEach(() => {
  state = { account: address, activeProvider: 'custom', isConnected: true, receiveOnly: false };
  vault = { address }; identity = { scheme: 'ed25519', address }; features.walletSend = true;
});
afterEach(cleanup);
const mount = () => render(<MemoryRouter><OwnWalletAddress /></MemoryRouter>);
it('offers Send for the explicitly unlocked owner with a matching vault', () => {
  mount(); expect(screen.getByRole('button', { name: 'Send' })).toBeTruthy();
});
it.each(['locked', 'receive-only', 'external', 'other-vault', 'no-vault', 'gate-off'])('hides Send for %s', reason => {
  if (reason === 'locked') identity = null;
  if (reason === 'receive-only') state.receiveOnly = true;
  if (reason === 'external') state.activeProvider = 'metamask';
  if (reason === 'other-vault') vault = { address: '0x' + '2'.repeat(40) };
  if (reason === 'no-vault') vault = null;
  if (reason === 'gate-off') features.walletSend = false;
  mount(); expect(screen.queryByRole('button', { name: 'Send' })).toBeNull();
});

it('does not publish a known legacy address as the current Receive identity even if public metadata calls it current', () => {
  const legacy = '0x465230af3383c16d024c5f4b87ed2d1b595be148';
  state.account = legacy; identity.address = legacy; vault.address = legacy;
  mount();
  expect(screen.queryByLabelText('Your WRFCoin address')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Send' })).toBeNull();
});

it('Receive identity is the verified current address, never the legacy address from a URL', () => {
  const current = '0x1747c0169753965c854230c59c876be0f9b5a275';
  state.account = current; identity.address = current; vault.address = current;
  render(<MemoryRouter initialEntries={['/wallet?address=0x465230af3383c16d024c5f4b87ed2d1b595be148']}><OwnWalletAddress /></MemoryRouter>);
  expect(screen.getByLabelText('Your WRFCoin address').textContent).toBe(current);
  expect(screen.queryByText('0x465230af3383c16d024c5f4b87ed2d1b595be148')).toBeNull();
});

it('Send off (kill switch) hides Send but keeps the address (Receive) visible', () => {
  features.walletSend = false;
  mount();
  expect(screen.queryByRole('button', { name: 'Send' })).toBeNull();
  expect(screen.getByLabelText('Your WRFCoin address').textContent).toBe(address);
});

it('the recovery phrase is a cold backup: offered only to the unlocked owner of this browser\'s vault', () => {
  mount();
  expect(screen.getByRole('button', { name: 'Back up recovery phrase' })).toBeTruthy();
  cleanup();
  vault = { address: '0x' + '2'.repeat(40) };
  mount();
  expect(screen.queryByRole('button', { name: 'Back up recovery phrase' })).toBeNull();
  cleanup();
  identity = null;
  mount();
  expect(screen.queryByRole('button', { name: 'Back up recovery phrase' })).toBeNull();
});
