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
  default: RemovePhraseWallet, REMOVE_CHANGED, REMOVE_CHECK_CAVEAT, REMOVE_CHECK_FAILED, REMOVE_FAILED,
  REMOVE_DEVICE_KEY_GONE, REMOVE_RECORD_UNREADABLE, REMOVE_CHECK_ALL, KEEP_WORDS_TITLE, KEEP_WORDS_NOTE, REMOVE_STATION_BOUND, REMOVE_UNSUPPORTED, REMOVE_WARNINGS, addressTail,
} = await import('../RemovePhraseWallet');
// jsdom's crypto has getRandomValues but no subtle; browsers in a secure context have both.
const { webcrypto } = await import('node:crypto');
Object.defineProperty(globalThis.crypto, 'subtle', { value: webcrypto.subtle, configurable: true });
const { createWebLocksStub, installWebLocks } = await import('../../../services/__fixtures__/webLocksStub.ts');
// The vault is removed under its cross-tab lock; jsdom has no Web Locks, browsers in a secure context do.
let uninstallLocks: () => void = () => {};
beforeAll(() => { uninstallLocks = installWebLocks(createWebLocksStub()); });
afterAll(() => uninstallLocks());
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
const mount = (props: { signedIn?: boolean; hasPhoneStation?: () => Promise<boolean>; hasServerStation?: () => Promise<boolean> } = {}) => render(
  <RemovePhraseWallet
    address={ADDRESS}
    signedIn={props.signedIn ?? true}
    hasPhoneStation={props.hasPhoneStation ?? (async () => false)}
    hasServerStation={props.hasServerStation}
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

  it('a locked wallet never asks the server, and says what was checked', async () => {
    const hasPhoneStation = jest.fn(async () => true);
    mount({ signedIn: false, hasPhoneStation });
    await openDialog();
    expect(screen.getByTestId('remove-wallet-check-caveat')).toHaveTextContent(REMOVE_CHECK_CAVEAT);
    expect(hasPhoneStation).not.toHaveBeenCalled();
  });

  it('a signed-in wallet gets the same caveat: the check does not cover stations connected elsewhere', async () => {
    mount({ signedIn: true });
    await openDialog();
    expect(await screen.findByTestId('remove-wallet-check-caveat')).toHaveTextContent(REMOVE_CHECK_CAVEAT);
    expect(REMOVE_CHECK_CAVEAT).toContain('A station connected elsewhere keeps paying this address: keep your 12 words.');
  });

  it('an unreadable or forged station record does not lock the person out: it says so and removal stays possible', async () => {
    localStorage.setItem('wrfcoin.wallet.station_bound.v1', '{broken');
    mount();
    await openDialog();
    expect(screen.queryByTestId('remove-wallet-station-bound')).toBeNull();
    expect(await screen.findByTestId('remove-wallet-check-caveat')).toHaveTextContent(`${REMOVE_RECORD_UNREADABLE} ${REMOVE_CHECK_CAVEAT}`);
    fireEvent.click(screen.getByTestId('remove-wallet-written'));
    fireEvent.change(screen.getByTestId('remove-wallet-tail'), { target: { value: addressTail(ADDRESS) } });
    expect(confirmButton()).toBeEnabled();
  });

  it('without Web Locks it refuses up front, with the reason, before the device key is touched', async () => {
    uninstallLocks();
    try {
      mount();
      await openDialog();
      fireEvent.click(screen.getByTestId('remove-wallet-written'));
      fireEvent.change(screen.getByTestId('remove-wallet-tail'), { target: { value: addressTail(ADDRESS) } });
      await act(async () => { fireEvent.click(confirmButton()); });
      expect(await screen.findByText(REMOVE_UNSUPPORTED)).toBeInTheDocument();
      expect(REMOVE_UNSUPPORTED).toContain('Nothing was removed');
      expect(forgetDeviceKey).not.toHaveBeenCalled();
      expect(localStorage.getItem(VAULT_KEY)).not.toBeNull();
      expect(onRemoved).not.toHaveBeenCalled();
    } finally {
      uninstallLocks = installWebLocks(createWebLocksStub());
    }
  });

  it('tells the taskbar button that the saved wallets changed', async () => {
    const changed = jest.fn();
    window.addEventListener('wrfcoin:wallets-changed', changed);
    mount();
    await openDialog();
    fireEvent.click(screen.getByTestId('remove-wallet-written'));
    fireEvent.change(screen.getByTestId('remove-wallet-tail'), { target: { value: addressTail(ADDRESS) } });
    await act(async () => { fireEvent.click(confirmButton()); });
    await waitFor(() => expect(onRemoved).toHaveBeenCalledTimes(1));
    expect(changed).toHaveBeenCalledTimes(1);
    window.removeEventListener('wrfcoin:wallets-changed', changed);
  });

  it('refuses if the saved wallet changed while the dialog was open', async () => {
    mount();
    await openDialog();
    fireEvent.click(screen.getByTestId('remove-wallet-written'));
    fireEvent.change(screen.getByTestId('remove-wallet-tail'), { target: { value: addressTail(ADDRESS) } });
    saveVaultRecord(`0x${'11'.repeat(20)}`);
    await act(async () => { fireEvent.click(confirmButton()); });
    expect(await screen.findByText(REMOVE_CHANGED)).toBeInTheDocument();
    expect(localStorage.getItem(VAULT_KEY)).not.toBeNull();
    expect(onRemoved).not.toHaveBeenCalled();
    expect(forgetDeviceKey).not.toHaveBeenCalled();
  });

  it('if the words cannot be removed after the device key is gone, the message names the device key', async () => {
    // Another tab replaces the saved wallet between the device-key step and the vault step.
    forgetDeviceKey.mockImplementationOnce(async () => { saveVaultRecord(`0x${'11'.repeat(20)}`); });
    mount();
    await openDialog();
    fireEvent.click(screen.getByTestId('remove-wallet-written'));
    fireEvent.change(screen.getByTestId('remove-wallet-tail'), { target: { value: addressTail(ADDRESS) } });
    await act(async () => { fireEvent.click(confirmButton()); });
    expect(await screen.findByText(REMOVE_DEVICE_KEY_GONE)).toBeInTheDocument();
    expect(REMOVE_DEVICE_KEY_GONE).toContain("this wallet's device key on this browser was");
    expect(localStorage.getItem(VAULT_KEY)).not.toBeNull();
    expect(onRemoved).not.toHaveBeenCalled();
  });

  it('a page that fails to refresh after the removal does not report a failed removal', async () => {
    onRemoved.mockRejectedValueOnce(new Error('refresh failed'));
    mount();
    await openDialog();
    fireEvent.click(screen.getByTestId('remove-wallet-written'));
    fireEvent.change(screen.getByTestId('remove-wallet-tail'), { target: { value: addressTail(ADDRESS) } });
    await act(async () => { fireEvent.click(confirmButton()); });
    await waitFor(() => expect(localStorage.getItem(VAULT_KEY)).toBeNull());
    expect(screen.queryByText(REMOVE_FAILED)).toBeNull();
    expect(screen.queryByText(REMOVE_DEVICE_KEY_GONE)).toBeNull();
  });

  it('if the device key cannot be forgotten, the words stay', async () => {
    forgetDeviceKey.mockRejectedValueOnce(new Error('idb'));
    mount();
    await openDialog();
    fireEvent.click(screen.getByTestId('remove-wallet-written'));
    fireEvent.change(screen.getByTestId('remove-wallet-tail'), { target: { value: addressTail(ADDRESS) } });
    await act(async () => { fireEvent.click(confirmButton()); });
    expect(await screen.findByText(REMOVE_FAILED)).toBeInTheDocument();
    expect(localStorage.getItem(VAULT_KEY)).not.toBeNull();
    expect(onRemoved).not.toHaveBeenCalled();
  });
  describe('my stations on (owner rule 2026-11-10)', () => {
    it('the dialog opens with "Keep your 12 words" before any other warning', async () => {
      mount({ signedIn: false });
      await openDialog();
      const note = screen.getByTestId('remove-wallet-keep-words');
      expect(note).toHaveTextContent(KEEP_WORDS_TITLE);
      expect(note).toHaveTextContent(KEEP_WORDS_NOTE);
      const first = screen.getByText(REMOVE_WARNINGS[0]);
      expect(note.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('a locked wallet with no station is removable, and the server is not asked', async () => {
      const hasServerStation = jest.fn(async () => true);
      mount({ signedIn: false, hasServerStation });
      await openDialog();
      expect(hasServerStation).not.toHaveBeenCalled();
      expect(screen.getByTestId('remove-wallet-check-caveat')).toHaveTextContent(REMOVE_CHECK_CAVEAT);
      fireEvent.click(screen.getByTestId('remove-wallet-written'));
      fireEvent.change(screen.getByTestId('remove-wallet-tail'), { target: { value: addressTail(ADDRESS) } });
      expect(confirmButton()).toBeEnabled();
      await act(async () => { fireEvent.click(confirmButton()); });
      await waitFor(() => expect(localStorage.getItem(VAULT_KEY)).toBeNull());
    });

    it('signed in: a station connected from another browser blocks removal', async () => {
      mount({ signedIn: true, hasServerStation: async () => true });
      await openDialog();
      expect(await screen.findByTestId('remove-wallet-station-bound')).toHaveTextContent(REMOVE_STATION_BOUND);
      expect(confirmButton()).toBeDisabled();
    });

    it('signed in: a failed server read refuses removal', async () => {
      mount({ signedIn: true, hasServerStation: async () => { throw new Error('503'); } });
      await openDialog();
      expect(await screen.findByText(REMOVE_CHECK_FAILED)).toBeInTheDocument();
      expect(confirmButton()).toBeDisabled();
    });

    it('signed in with no station anywhere: says every station was checked', async () => {
      mount({ signedIn: true, hasServerStation: async () => false });
      await openDialog();
      expect(await screen.findByTestId('remove-wallet-check-caveat')).toHaveTextContent(REMOVE_CHECK_ALL);
    });
  });
});
