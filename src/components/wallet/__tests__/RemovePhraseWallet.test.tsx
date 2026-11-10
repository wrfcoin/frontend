/**
 * @jest-environment jsdom
 */
// Removing the 12-word wallet from this browser: explicit, refused while the wallet owns a station, and it
// never touches the passkey wallet's record.
import { jest } from '@jest/globals';
import React from 'react';
import '@testing-library/jest-dom';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const forgetDeviceKey = jest.fn(async (_owner: string) => {});
await jest.unstable_mockModule('../../../services/walletCrypto/deviceKeyStore', () => ({ forgetDeviceKey }));

const {
  default: RemovePhraseWallet, REMOVE_CHECK_FAILED, REMOVE_STATION_BOUND, REMOVE_WARNINGS, addressTail,
} = await import('../RemovePhraseWallet');
const { markStationBound } = await import('../../../services/stationBoundWallets');

const VAULT_KEY = 'wrfcoin_wallet_vault_v1';
const PASSKEY_KEY = 'wrfcoin.passkey.credential.v1';
const ADDRESS = `0x${'cd'.repeat(18)}12ef`;
const PASSKEY_RECORD = JSON.stringify({ credentialId: '01'.repeat(16), publicKeyXY: '02'.repeat(64), rpId: 'wrfcoin.com' });
const saveVaultRecord = (address = ADDRESS) => localStorage.setItem(VAULT_KEY, JSON.stringify({
  v: 1, scheme: 'ed25519-slip10-master-v1', address,
  kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: 600_000, salt: 'AA==' },
  cipher: { name: 'AES-GCM', iv: 'AA==' }, ct: 'AA==',
}));

const onRemoved = jest.fn(async () => {});
const mount = (props: { signedIn?: boolean; hasPhoneStation?: () => Promise<boolean> } = {}) => render(
  <RemovePhraseWallet
    address={ADDRESS}
    signedIn={props.signedIn ?? true}
    hasPhoneStation={props.hasPhoneStation ?? (async () => false)}
    onRemoved={onRemoved}
  />,
);
const openDialog = async () => { await act(async () => { fireEvent.click(screen.getByTestId('remove-wallet-open')); }); };
const confirmButton = () => screen.getByTestId('remove-wallet-confirm');

beforeEach(() => {
  localStorage.clear(); onRemoved.mockClear(); forgetDeviceKey.mockClear();
  saveVaultRecord(); localStorage.setItem(PASSKEY_KEY, PASSKEY_RECORD);
});
afterEach(cleanup);

describe('RemovePhraseWallet', () => {
  it('shows the backup warning and needs both the tick and the last four characters', async () => {
    mount();
    await openDialog();
    for (const line of REMOVE_WARNINGS) expect(screen.getByText(line)).toBeInTheDocument();
    expect(screen.getByTestId('remove-wallet-address')).toHaveTextContent(ADDRESS);
    expect(confirmButton()).toBeDisabled();
    fireEvent.click(screen.getByTestId('remove-wallet-written'));
    expect(confirmButton()).toBeDisabled();
    fireEvent.change(screen.getByTestId('remove-wallet-tail'), { target: { value: 'zzzz' } });
    expect(confirmButton()).toBeDisabled();
    fireEvent.change(screen.getByTestId('remove-wallet-tail'), { target: { value: addressTail(ADDRESS).toUpperCase() } });
    expect(confirmButton()).toBeEnabled();
  });

  it('removes only this wallet: the vault slot and its device key go, the passkey record stays byte for byte', async () => {
    mount();
    await openDialog();
    fireEvent.click(screen.getByTestId('remove-wallet-written'));
    fireEvent.change(screen.getByTestId('remove-wallet-tail'), { target: { value: addressTail(ADDRESS) } });
    await act(async () => { fireEvent.click(confirmButton()); });
    await waitFor(() => expect(onRemoved).toHaveBeenCalledTimes(1));
    expect(localStorage.getItem(VAULT_KEY)).toBeNull();
    expect(localStorage.getItem(PASSKEY_KEY)).toBe(PASSKEY_RECORD);
    expect(forgetDeviceKey).toHaveBeenCalledWith(ADDRESS);
  });

  it('a wallet with a station connected in this browser cannot be removed', async () => {
    markStationBound(ADDRESS, 'st_abc123');
    const hasPhoneStation = jest.fn(async () => false);
    mount({ hasPhoneStation });
    await openDialog();
    expect(screen.getByTestId('remove-wallet-station-bound')).toHaveTextContent(`${REMOVE_STATION_BOUND} Station: st_abc123.`);
    expect(screen.queryByTestId('remove-wallet-written')).toBeNull();
    expect(confirmButton()).toBeDisabled();
    expect(hasPhoneStation).not.toHaveBeenCalled();
    expect(localStorage.getItem(VAULT_KEY)).not.toBeNull();
  });

  it('a signed-in wallet with a phone station cannot be removed', async () => {
    mount({ hasPhoneStation: async () => true });
    await openDialog();
    expect(await screen.findByTestId('remove-wallet-station-bound')).toHaveTextContent(REMOVE_STATION_BOUND);
    expect(confirmButton()).toBeDisabled();
  });

  it('a station check that fails refuses removal', async () => {
    mount({ hasPhoneStation: async () => { throw new Error('offline'); } });
    await openDialog();
    expect(await screen.findByTestId('remove-wallet-check-failed')).toHaveTextContent(REMOVE_CHECK_FAILED);
    expect(confirmButton()).toBeDisabled();
    expect(localStorage.getItem(VAULT_KEY)).not.toBeNull();
  });

  it('a locked wallet is checked against this browser only, says so, and never asks the server', async () => {
    const hasPhoneStation = jest.fn(async () => true);
    mount({ signedIn: false, hasPhoneStation });
    await openDialog();
    expect(screen.getByTestId('remove-wallet-locked-note')).toHaveTextContent('keep your 12 words');
    expect(hasPhoneStation).not.toHaveBeenCalled();
  });

  it('an unreadable station record blocks removal', async () => {
    localStorage.setItem('wrfcoin.wallet.station_bound.v1', '{broken');
    mount();
    await openDialog();
    expect(screen.getByTestId('remove-wallet-station-bound')).toBeInTheDocument();
    expect(confirmButton()).toBeDisabled();
  });

  it('refuses if the saved wallet changed while the dialog was open', async () => {
    mount();
    await openDialog();
    fireEvent.click(screen.getByTestId('remove-wallet-written'));
    fireEvent.change(screen.getByTestId('remove-wallet-tail'), { target: { value: addressTail(ADDRESS) } });
    saveVaultRecord(`0x${'11'.repeat(20)}`);
    await act(async () => { fireEvent.click(confirmButton()); });
    expect(await screen.findByText('The wallet saved in this browser changed. Nothing was removed.')).toBeInTheDocument();
    expect(localStorage.getItem(VAULT_KEY)).not.toBeNull();
    expect(onRemoved).not.toHaveBeenCalled();
    expect(forgetDeviceKey).not.toHaveBeenCalled();
  });

  it('if the device key cannot be forgotten, the words stay', async () => {
    forgetDeviceKey.mockRejectedValueOnce(new Error('idb'));
    mount();
    await openDialog();
    fireEvent.click(screen.getByTestId('remove-wallet-written'));
    fireEvent.change(screen.getByTestId('remove-wallet-tail'), { target: { value: addressTail(ADDRESS) } });
    await act(async () => { fireEvent.click(confirmButton()); });
    expect(await screen.findByText('Could not remove the wallet. Nothing else was changed.')).toBeInTheDocument();
    expect(localStorage.getItem(VAULT_KEY)).not.toBeNull();
    expect(onRemoved).not.toHaveBeenCalled();
  });
});
