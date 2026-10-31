import React from 'react';
import { jest } from '@jest/globals';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
// Session keys: a locked wallet whose browser holds a registered device key signs in
// with that key (no password, no phrase) and shows the owner's wallet.
const address = '0x' + '3'.repeat(40);
const other = '0x' + '4'.repeat(40);
let vault;
const signIn = jest.fn();
await jest.unstable_mockModule('../../contexts/WalletContext.jsx', () => ({ useWallet: () => ({ account: null, activeProvider: null, isConnected: false, receiveOnly: false }) }));
await jest.unstable_mockModule('../../services/walletProviders/WalletProviderManager.js', () => ({ walletProviderManager: { getLoginIdentity: () => null } }));
await jest.unstable_mockModule('../../services/walletVault', () => ({ readVault: () => vault }));
await jest.unstable_mockModule('../../config/features', () => ({ FEATURES: { walletSend: true } }));
await jest.unstable_mockModule('../../components/wallet/PhoneStationStatusCard', () => ({ default: () => null }));
await jest.unstable_mockModule('../../components/wallet/DeviceKeyCard', () => ({ default: ({ ownerAddress }) => <p>device card for {ownerAddress}</p> }));
await jest.unstable_mockModule('../../components/wallet/VaultSend', () => ({ default: () => <button>Send</button> }));
await jest.unstable_mockModule('../../components/wallet/WalletEarningsPanel', () => ({ default: ({ aside }) => <div>{aside}</div> }));
await jest.unstable_mockModule('../../services/walletCrypto/deviceSession', () => ({ signInWithThisDevice: signIn }));
const { default: OwnWalletAddress, DEVICE_SIGNED_IN_LABEL } = await import('../OwnWalletAddress');
afterEach(cleanup);
const mount = () => render(<MemoryRouter><OwnWalletAddress /></MemoryRouter>);

it('signs in with this device key and shows the wallet, Send and the device card', async () => {
  vault = { address };
  signIn.mockResolvedValueOnce({ address, jwt: 'j', refreshToken: 'r', expiresIn: 900 });
  mount();
  expect(await screen.findByText(DEVICE_SIGNED_IN_LABEL)).toBeTruthy();
  expect(signIn).toHaveBeenCalledWith(address);
  expect(screen.getByRole('button', { name: 'Send' })).toBeTruthy();
  expect(await screen.findByText(`device card for ${address}`)).toBeTruthy();
});

it('stays locked when this browser has no device key (nothing is signed)', async () => {
  vault = { address: other };
  signIn.mockResolvedValueOnce(null);
  mount();
  await new Promise(r => setTimeout(r, 20));
  expect(signIn).toHaveBeenCalledWith(other);
  expect(screen.queryByText(DEVICE_SIGNED_IN_LABEL)).toBeNull();
  expect(screen.getByTestId('wallet-locked')).toBeTruthy();
});
