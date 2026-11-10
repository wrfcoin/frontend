/** @jest-environment jsdom */
// The passkey wallet page in a multi-wallet build: Send names the sending wallet, and a passkey wallet that
// owns a station cannot be forgotten on this device.
import React from 'react';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

const record = { credentialId: new Uint8Array(16).fill(7), publicKeyXY: new Uint8Array(64).fill(9), rpId: 'localhost' };
const clearStoredPasskey = jest.fn();
let multiWalletOn = true;
const actualFeatures = await import('../../config/features');
const features = new Proxy(actualFeatures.FEATURES, {
  get: (target, key) => (key === 'multiWallet' || key === 'passkeyWallet' ? multiWalletOn : (target as any)[key]),
});
await jest.unstable_mockModule('../../config/features', () => ({ ...actualFeatures, FEATURES: features, default: features }));
await jest.unstable_mockModule('../../services/walletCrypto/passkeyBalance', () => ({
  getPasskeyPublicBalance: async () => ({ units: '100000000', height: 4209 }),
}));
await jest.unstable_mockModule('../../hooks/usePublicTestnetStats', () => ({ default: () => ({ blockHeight: 4210 }) }));
await jest.unstable_mockModule('../../config/network', () => ({ WRFCOIN_CHAIN_ID: 777 }));
await jest.unstable_mockModule('../../services/walletCrypto/passkeySend', () => ({
  clearStoredPasskey: () => clearStoredPasskey(),
  getPasskeyNonce: async () => '0',
  loadStoredPasskey: () => record,
  saveStoredPasskey: jest.fn(),
  submitPasskeyTransfer: jest.fn(),
}));
const { default: PasskeyWalletPage, addressTail } = await import('../PasskeyWalletPage');
const { passkeyRecordAddress } = await import('../../services/walletCrypto/passkey');
const { shortAddress } = await import('../../components/wallet/WalletSwitcher');
const { markStationBound } = await import('../../services/stationBoundWallets');
const address = passkeyRecordAddress(record as any);

beforeEach(() => { localStorage.clear(); multiWalletOn = true; clearStoredPasskey.mockReset(); });
afterEach(cleanup);

describe('passkey wallet page, multi-wallet build', () => {
  it('Send names the sending wallet', async () => {
    render(<PasskeyWalletPage />);
    expect(await screen.findByTestId('passkey-send-from')).toHaveTextContent(`Sending from your passkey wallet ${shortAddress(address)}.`);
  });

  it('flag off: no sending-wallet line', async () => {
    multiWalletOn = false;
    render(<PasskeyWalletPage />);
    await screen.findByTestId('passkey-balance');
    expect(screen.queryByTestId('passkey-send-from')).toBeNull();
  });

  it('a passkey wallet that owns a station cannot be forgotten, even with the right confirmation', async () => {
    markStationBound(address, 'st_abc123');
    render(<PasskeyWalletPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Forget on this device' }));
    expect(await screen.findByTestId('passkey-forget-station-bound')).toBeInTheDocument();
    fireEvent.change(screen.getByTestId('passkey-forget-tail'), { target: { value: addressTail(address) } });
    expect(screen.getByTestId('passkey-forget-confirm')).toBeDisabled();
    expect(clearStoredPasskey).not.toHaveBeenCalled();
  });

  it('an unreadable or forged station record does not block forgetting; it says the check could not be made', async () => {
    localStorage.setItem('wrfcoin.wallet.station_bound.v1', '{broken');
    render(<PasskeyWalletPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Forget on this device' }));
    expect(await screen.findByTestId('passkey-forget-record-unreadable')).toHaveTextContent('could not be read');
    expect(screen.queryByTestId('passkey-forget-station-bound')).toBeNull();
    fireEvent.change(screen.getByTestId('passkey-forget-tail'), { target: { value: addressTail(address) } });
    expect(screen.getByTestId('passkey-forget-confirm')).toBeEnabled();
  });

  it('without a station it can still be forgotten', async () => {
    render(<PasskeyWalletPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Forget on this device' }));
    fireEvent.change(await screen.findByTestId('passkey-forget-tail'), { target: { value: addressTail(address) } });
    expect(screen.getByTestId('passkey-forget-confirm')).toBeEnabled();
    expect(screen.queryByTestId('passkey-forget-station-bound')).toBeNull();
  });
});
