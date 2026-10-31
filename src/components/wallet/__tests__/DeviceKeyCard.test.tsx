/** @jest-environment jsdom */
import React from 'react';
import { jest, beforeEach, it, expect } from '@jest/globals';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

const owner = `0x${'1'.repeat(40)}`;
const readDeviceState = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const registerThisDevice = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const revokeThisDevice = jest.fn<(...args: unknown[]) => Promise<unknown>>();
await jest.unstable_mockModule('../../../services/walletCrypto/deviceSession', () => ({
  FEATURE_OFF_MESSAGE: 'Device keys turn on when the network enables them.',
  readDeviceState, registerThisDevice, revokeThisDevice,
}));
let contacts: { id: string; name: string; address: string; createdAt: number; allowedFrom: number }[] = [];
await jest.unstable_mockModule('../../../services/addressBook/useAddressBook', () => ({
  useAddressBook: () => ({ book: { version: 1, contacts, allowlist: { enabled: false, disableAt: null } } }),
}));
const { default: DeviceKeyCard, parseAllowlist } = await import('../DeviceKeyCard');

const list = (featureActive: boolean, keys: unknown[] = []) => ({
  owner, feature_active: featureActive, next_height: 1000, next_registration_nonce: 0, chain_id: '888', session_keys: keys,
});
const record = {
  session_key: `0x${'2'.repeat(40)}`, public_key: 'ab'.repeat(32), registration_nonce: 0, status: 'active',
  allowed_methods: ['transfer', 'wallet_login'], any_target: true, allowed_targets: [],
  max_value_per_use: '1000000000', max_total_value: '30000000000', total_remaining: '29750000000',
  window: { blocks: 1122, max_value: '1000000000', remaining: '750000000', window_ends_at_height: 1121 },
  valid_from: 1000, valid_until: 102000, max_uses: null, uses_so_far: 1, cumulative_value_used: '250000000', revoked: false,
};

beforeEach(() => { contacts = []; cleanup(); readDeviceState.mockReset(); registerThisDevice.mockReset(); revokeThisDevice.mockReset(); });

it('feature off (chain 888 today): the setup button is disabled with one line, and nothing crashes', async () => {
  readDeviceState.mockResolvedValue({ list: list(false), key: null, record: null });
  render(<DeviceKeyCard ownerAddress={owner} />);
  await screen.findByText('Device keys turn on when the network enables them.');
  expect((screen.getByRole('button', { name: 'Set up this device' }) as HTMLButtonElement).disabled).toBe(true);
});

it('an unavailable list says so instead of failing', async () => {
  readDeviceState.mockRejectedValue(new Error('down'));
  render(<DeviceKeyCard ownerAddress={owner} />);
  await screen.findByText(/not available right now/);
});

it('set up: asks for the password once, defaults to anyone, then shows pending', async () => {
  readDeviceState.mockResolvedValue({ list: list(true), key: null, record: null });
  registerThisDevice.mockResolvedValue({ hash: 'tx', publicKeyHex: 'ab'.repeat(32) });
  render(<DeviceKeyCard ownerAddress={owner} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Set up this device' }));
  const pw = screen.getByLabelText('Wallet password') as HTMLInputElement;
  fireEvent.change(pw, { target: { value: 'secret-pw' } });
  fireEvent.click(screen.getByRole('button', { name: 'Set up' }));
  await waitFor(() => expect(registerThisDevice).toHaveBeenCalledWith({ owner, password: 'secret-pw', recipients: 'anyone' }));
  expect(pw.value).toBe('');
  await screen.findByText(/once the next block includes it/);
});

it('set up with an allowlist sends only those addresses', async () => {
  readDeviceState.mockResolvedValue({ list: list(true), key: null, record: null });
  registerThisDevice.mockResolvedValue({ hash: 'tx', publicKeyHex: 'ab'.repeat(32) });
  render(<DeviceKeyCard ownerAddress={owner} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Set up this device' }));
  fireEvent.click(screen.getByLabelText('Only these addresses'));
  const a = `0x${'3'.repeat(40)}`;
  fireEvent.change(screen.getByLabelText('Allowed addresses'), { target: { value: `${a}\n` } });
  fireEvent.change(screen.getByLabelText('Wallet password'), { target: { value: 'pw' } });
  fireEvent.click(screen.getByRole('button', { name: 'Set up' }));
  await waitFor(() => expect(registerThisDevice).toHaveBeenCalledWith({ owner, password: 'pw', recipients: [a] }));
  expect(parseAllowlist(`${a}, ${a.toUpperCase().replace('0X', '0x')}`)).toEqual([a, a]);
});

it('set up device: shows its limits and what is left today, and removes with the password', async () => {
  readDeviceState.mockResolvedValue({ list: list(true, [record]), key: { kind: 'webcrypto', publicKeyHex: record.public_key }, record });
  revokeThisDevice.mockResolvedValue(undefined);
  render(<DeviceKeyCard ownerAddress={owner} />);
  await screen.findByText('Small sends from this browser need no password.');
  expect(screen.getByTestId('device-left-today').textContent).toBe('7.5 WRF of 10 WRF');
  expect(screen.getByText('297.5 WRF of 300 WRF')).toBeTruthy();
  expect(screen.getByText('Anyone')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Remove this device' }));
  fireEvent.change(screen.getByLabelText('Wallet password'), { target: { value: 'pw' } });
  fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
  await waitFor(() => expect(revokeThisDevice).toHaveBeenCalledWith({ owner, password: 'pw', record }));
});

it('renders nothing without an owner', () => {
  const { container } = render(<DeviceKeyCard ownerAddress={null} />);
  expect(container.innerHTML).toBe('');
  expect(readDeviceState).not.toHaveBeenCalled();
});

it('offers "Only my address book" when the device-only address book has contacts, and sends those addresses', async () => {
  const a = `0x${'5'.repeat(40)}`; const b = `0x${'6'.repeat(40)}`;
  contacts = [{ id: '1', name: 'Ann', address: a, createdAt: 0, allowedFrom: 0 }, { id: '2', name: 'Bo', address: b, createdAt: 0, allowedFrom: 0 }];
  readDeviceState.mockResolvedValue({ list: list(true), key: null, record: null });
  registerThisDevice.mockResolvedValue({ hash: 'tx', publicKeyHex: 'ab'.repeat(32) });
  render(<DeviceKeyCard ownerAddress={owner} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Set up this device' }));
  fireEvent.click(screen.getByLabelText('Only my address book (2)'));
  fireEvent.change(screen.getByLabelText('Wallet password'), { target: { value: 'pw' } });
  fireEvent.click(screen.getByRole('button', { name: 'Set up' }));
  await waitFor(() => expect(registerThisDevice).toHaveBeenCalledWith({ owner, password: 'pw', recipients: [a, b] }));
});
