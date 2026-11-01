/**
 * @jest-environment jsdom
 *
 * The device-only address book and the app-level send allowlist, through the real dialog and the real
 * 12-word wallet Send form. The store is the in-memory one (the IndexedDB store is the same contract).
 */
import React from 'react';
import { jest, beforeEach, afterEach, it, expect, describe } from '@jest/globals';
import '@testing-library/jest-dom';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

const from = '0x' + '1'.repeat(40);
const MOM = '0x' + '2'.repeat(40);
const STRANGER = '0x' + '3'.repeat(40);
const prepare = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const submit = jest.fn<(...args: unknown[]) => Promise<{ txHash: string }>>();
await jest.unstable_mockModule('../../../services/walletCrypto/vaultTransfer', () => ({ previewVaultTransfer: prepare, submitVaultTransfer: submit }));
// This browser's device key (session key): the same allowlist must stop it too.
class DeviceSendRefusedError extends Error {}
const deviceCheck = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const deviceSubmit = jest.fn<(p: { to: string }, refusal: (to: string) => string | null) => Promise<{ txHash: string }>>();
await jest.unstable_mockModule('../../../services/walletCrypto/deviceSession', () => ({
  checkThisDeviceCanSend: deviceCheck,
  submitDeviceTransfer: deviceSubmit,
  errorCode: () => null,
  deviceFallbackMessage: () => null,
  DeviceSendRefusedError,
}));
const fetchSpy = jest.fn();
(globalThis as { fetch: unknown }).fetch = fetchSpy;

const { default: VaultSend } = await import('../VaultSend');
const { default: AddressBookButton } = await import('../AddressBook');
const { __resetAddressBookForTests } = await import('../../../services/addressBook/useAddressBook');
const { memoryStore } = await import('../../../services/addressBook/deviceStore');
const { ALLOWLIST_HELP, ALLOWLIST_COOLDOWN_MS } = await import('../../../services/addressBook/addressBook');

const T0 = Date.UTC(2026, 10, 1, 12, 0, 0);
let now = T0;

beforeEach(() => {
  now = T0;
  jest.spyOn(Date, 'now').mockImplementation(() => now);
  __resetAddressBookForTests({ ...memoryStore(), persistent: true });
  prepare.mockReset().mockResolvedValue({ from, to: MOM, amountBaseUnits: '100000000', nonce: '1', chainId: '888', networkId: 'testnet' });
  submit.mockReset().mockResolvedValue({ txHash: 'h' });
  deviceCheck.mockReset().mockResolvedValue({ ok: false, reason: 'no-key' });
  // Like the real submitDeviceTransfer: the allowlist check runs before anything is signed.
  deviceSubmit.mockReset().mockImplementation(async (p, refusal) => {
    const r = refusal(p.to);
    if (r) throw new DeviceSendRefusedError(r);
    return { txHash: 'device-h' };
  });
  fetchSpy.mockReset();
});
afterEach(() => { cleanup(); jest.restoreAllMocks(); });

async function openBook() {
  render(<AddressBookButton />);
  fireEvent.click(screen.getByTestId('address-book-open'));
  return screen.findByTestId('address-book');
}
async function addContact(name: string, address: string) {
  const form = screen.getByRole('form', { name: 'Add a contact' });
  fireEvent.change(within(form).getByLabelText('Name'), { target: { value: name } });
  fireEvent.change(within(form).getByLabelText('Address'), { target: { value: address } });
  fireEvent.click(within(form).getByTestId('add-contact'));
}

describe('address book dialog', () => {
  it('says it stays on this device, and adds a contact without any network call', async () => {
    const book = await openBook();
    expect(within(book).getByTestId('address-book-storage')).toHaveTextContent('Saved only on this device');
    await addContact('Mom', MOM);
    expect(await within(book).findByText('Mom')).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('allowlist: help text, instant on, 24 h confirmation to turn off, cancellable', async () => {
    await openBook();
    expect(screen.getByTestId('allowlist-help')).toHaveTextContent(ALLOWLIST_HELP);
    fireEvent.click(screen.getByTestId('allowlist-on'));
    expect(await screen.findByText('On')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('allowlist-off'));
    expect(screen.getByTestId('allowlist-off-confirm')).toHaveTextContent('It stays on for 24 hours');
    fireEvent.click(screen.getByTestId('allowlist-off-start'));
    expect(await screen.findByTestId('allowlist-pending-off')).toHaveTextContent('about 24 h');
    fireEvent.click(screen.getByTestId('allowlist-off-cancel'));
    await waitFor(() => expect(screen.queryByTestId('allowlist-pending-off')).toBeNull());
    expect(screen.getByTestId('allowlist-off')).toBeInTheDocument();
  });

  it('with the allowlist on, adding a contact asks first and shows its 24 h wait', async () => {
    await openBook();
    fireEvent.click(screen.getByTestId('allowlist-on'));
    await addContact('Mom', MOM);
    expect(screen.getByTestId('add-contact-confirm')).toHaveTextContent('Add with a 24-hour wait?');
    expect(screen.queryByTestId('contact-row')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Add and start the wait' }));
    const row = await screen.findByTestId('contact-row');
    expect(row).toHaveTextContent('Waiting');
    expect(row).toHaveTextContent('Can receive from');
  });
});

describe('Send with the allowlist', () => {
  async function setUpBook(onBeforeAdd: boolean) {
    const book = await openBook();
    if (onBeforeAdd) fireEvent.click(within(book).getByTestId('allowlist-on'));
    await addContact('Mom', MOM);
    if (onBeforeAdd) fireEvent.click(screen.getByRole('button', { name: 'Add and start the wait' }));
    else fireEvent.click(within(book).getByTestId('allowlist-on'));
    await screen.findByTestId('contact-row');
    cleanup();
  }
  const openSend = () => {
    render(<VaultSend address={from} />);
    fireEvent.click(screen.getByRole('button', { name: /^Send$/ }));
  };

  it('refuses an address outside the book: no preview, no signing', async () => {
    await setUpBook(false);
    openSend();
    fireEvent.change(screen.getByLabelText('Recipient address'), { target: { value: STRANGER } });
    expect(screen.getByTestId('send-allowlist-refusal')).toHaveTextContent('not in your address book');
    expect(screen.getByRole('button', { name: 'Review transfer' })).toBeDisabled();
    expect(prepare).not.toHaveBeenCalled();
  });

  it('a contact picked from the book is allowed and named in the review', async () => {
    await setUpBook(false);
    openSend();
    fireEvent.click(within(screen.getByTestId('contact-picks')).getByRole('button', { name: 'Mom' }));
    expect(screen.getByLabelText('Recipient address')).toHaveValue(MOM);
    fireEvent.change(screen.getByLabelText('Amount in WRF'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Review transfer' }));
    expect(await screen.findByTestId('send-review-contact')).toHaveTextContent('Mom');
  });

  it('a contact added while the allowlist is on can receive only after 24 h', async () => {
    await setUpBook(true);
    openSend();
    fireEvent.change(screen.getByLabelText('Recipient address'), { target: { value: MOM } });
    expect(screen.getByTestId('send-allowlist-refusal')).toHaveTextContent('Mom was added recently');
    cleanup();
    now = T0 + ALLOWLIST_COOLDOWN_MS;
    openSend();
    fireEvent.change(screen.getByLabelText('Recipient address'), { target: { value: MOM } });
    expect(screen.queryByTestId('send-allowlist-refusal')).toBeNull();
  });

  it('device key: a send the device could sign alone is still refused once the allowlist is on', async () => {
    deviceCheck.mockResolvedValue({ ok: true });
    prepare.mockResolvedValue({ from, to: STRANGER, amountBaseUnits: '100000000', nonce: '1', chainId: '888', networkId: 'testnet' });
    render(<><VaultSend address={from} /><AddressBookButton /></>);
    fireEvent.click(screen.getByRole('button', { name: /^Send$/ }));
    fireEvent.change(screen.getByLabelText('Recipient address'), { target: { value: STRANGER } });
    fireEvent.change(screen.getByLabelText('Amount in WRF'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Review transfer' }));
    expect(await screen.findByTestId('device-signs')).toHaveTextContent('No password needed');
    // The allowlist goes on after the review (another tab, or the book dialog).
    fireEvent.click(screen.getByTestId('address-book-open'));
    fireEvent.click(await screen.findByTestId('allowlist-on'));
    await screen.findByText('On');
    // The book dialog sits on top of the send review (which is aria-hidden meanwhile).
    fireEvent.click(screen.getByRole('button', { name: 'Confirm & Send', hidden: true }));
    await waitFor(() => expect(screen.getAllByText(/not in your address book/).length).toBeGreaterThan(0));
    expect(deviceSubmit).not.toHaveBeenCalled();
    expect(submit).not.toHaveBeenCalled();
  });

  it('device key: the allowlist check handed to the device path is the live one', async () => {
    await setUpBook(false);
    deviceCheck.mockResolvedValue({ ok: true });
    openSend();
    fireEvent.change(screen.getByLabelText('Recipient address'), { target: { value: MOM } });
    fireEvent.change(screen.getByLabelText('Amount in WRF'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Review transfer' }));
    expect(await screen.findByTestId('device-signs')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm & Send' }));
    await screen.findByText('Submitted; settlement is not yet confirmed.');
    expect(deviceSubmit).toHaveBeenCalledTimes(1);
    const refusal = deviceSubmit.mock.calls[0][1];
    expect(refusal(MOM)).toBeNull();
    expect(refusal(STRANGER)).toMatch(/not in your address book/);
  });
});
