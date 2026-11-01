/** @jest-environment jsdom */
import React from 'react';
import { jest, beforeEach, it, expect } from '@jest/globals';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
const p = { from: '0x' + '1'.repeat(40), to: '0x' + '2'.repeat(40), amountBaseUnits: '9007199254740991', nonce: '9007199254740993', chainId: '777', networkId: 'testnet' };
const prepare = jest.fn<() => Promise<typeof p>>();
const submit = jest.fn<(...args: unknown[]) => Promise<{ txHash: string }>>();
const deviceCheck = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const deviceSubmit = jest.fn<(...args: unknown[]) => Promise<{ txHash: string }>>();
await jest.unstable_mockModule('../../../services/walletCrypto/vaultTransfer', () => ({ previewVaultTransfer: prepare, submitVaultTransfer: submit }));
const realDeviceSession = { errorCode: (e: any) => (typeof e?.details?.code === 'string' ? e.details.code : null) };
await jest.unstable_mockModule('../../../services/walletCrypto/deviceSession', () => ({
  checkThisDeviceCanSend: deviceCheck,
  submitDeviceTransfer: deviceSubmit,
  errorCode: realDeviceSession.errorCode,
  DeviceSendRefusedError: class DeviceSendRefusedError extends Error {},
  deviceFallbackMessage: (d: any) => (d && !d.ok && d.reason === 'daily' ? 'Over this device\'s 10 WRF daily limit. Confirm with your recovery phrase password.' : d && !d.ok && d.reason === 'refused' ? 'REFUSED-NOTE' : null),
}));
const { default: VaultSend } = await import('../VaultSend');
beforeEach(() => {
  cleanup(); prepare.mockReset().mockResolvedValue(p); submit.mockReset().mockResolvedValue({ txHash: 'submitted-id' });
  deviceCheck.mockReset().mockResolvedValue({ ok: false, reason: 'no-key' }); deviceSubmit.mockReset().mockResolvedValue({ txHash: 'device-id' });
});
const review = async () => {
  render(<VaultSend address={p.from} />);
  fireEvent.click(screen.getByRole('button', { name: /^Send$/ }));
  fireEvent.change(screen.getByLabelText('Recipient address'), { target: { value: p.to } });
  fireEvent.change(screen.getByLabelText('Amount in WRF'), { target: { value: '90071992.54740991' } });
  fireEvent.click(screen.getByRole('button', { name: 'Review transfer' }));
  await screen.findByText('90071992.54740991 WRF');
};
it('shows full exact preview and requires a fresh password before explicit confirmation', async () => {
  await review();
  for (const value of [p.to, p.nonce, p.amountBaseUnits, '777', 'testnet']) expect(screen.getByText(value)).toBeTruthy();
  expect(submit).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Confirm & Send' }));
  expect(submit).not.toHaveBeenCalled();
  const password = screen.getByLabelText('Wallet password for this send') as HTMLInputElement;
  fireEvent.change(password, { target: { value: 'one-send-password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Confirm & Send' }));
  expect(password.value).toBe('');
  await screen.findByText('Submitted; settlement is not yet confirmed.');
  expect(submit).toHaveBeenCalledTimes(1);
  expect(submit).toHaveBeenCalledWith(p, 'one-send-password');
});
it('on rejection clears the password, requires a new review, and never echoes the exception', async () => {
  await review(); submit.mockRejectedValueOnce(new Error('sensitive-crypto-exception'));
  fireEvent.change(screen.getByLabelText('Wallet password for this send'), { target: { value: 'one-send-password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Confirm & Send' }));
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('review again'));
  expect(screen.queryByText('sensitive-crypto-exception')).toBeNull();
  expect(screen.queryByLabelText('Wallet password for this send')).toBeNull();
  expect(screen.getByRole('button', { name: 'Review transfer' })).toBeTruthy();
});

it('does not offer review or confirmation for a positively known legacy recipient', () => {
  render(<VaultSend address={p.from} />);
  fireEvent.click(screen.getByRole('button', { name: /^Send$/ }));
  fireEvent.change(screen.getByLabelText('Recipient address'), { target: { value: '0x465230af3383c16d024c5f4b87ed2d1b595be148' } });
  expect(screen.getByRole('alert').textContent).toContain('Ordinary Send is blocked');
  expect((screen.getByRole('button', { name: 'Review transfer' }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Review transfer' }));
  expect(prepare).not.toHaveBeenCalled(); expect(submit).not.toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: 'Confirm & Send' })).toBeNull();
});

it('keeps an unclassified recipient unknown in the full preview', async () => {
  await review();
  expect(screen.getByText('Recipient status is unknown. Address format does not establish that the recipient can spend.')).toBeTruthy();
  expect(submit).not.toHaveBeenCalled();
});

it('refuses to review a send from a wallet with 0 WRF available and says why', () => {
  render(<VaultSend address={p.from} availableUnits="0" />);
  fireEvent.click(screen.getByRole('button', { name: /^Send$/ }));
  expect(screen.getByText('No WRF to send')).toBeTruthy();
  expect(screen.getByText(/this wallet has 0 WRF available/).textContent).toContain('weather rewards');
  const review = screen.getByRole('button', { name: 'Review transfer' }) as HTMLButtonElement;
  expect(review.disabled).toBe(true);
  fireEvent.change(screen.getByLabelText('Recipient address'), { target: { value: p.to } });
  fireEvent.change(screen.getByLabelText('Amount in WRF'), { target: { value: '1' } });
  fireEvent.click(review);
  expect(prepare).not.toHaveBeenCalled(); expect(submit).not.toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: 'Confirm & Send' })).toBeNull();
});

it('refuses an amount above the available balance but reviews one within it', async () => {
  render(<VaultSend address={p.from} availableUnits="250000000" />);
  fireEvent.click(screen.getByRole('button', { name: /^Send$/ }));
  fireEvent.change(screen.getByLabelText('Recipient address'), { target: { value: p.to } });
  fireEvent.change(screen.getByLabelText('Amount in WRF'), { target: { value: '2.50000001' } });
  expect(screen.getByText('Amount too high')).toBeTruthy();
  expect(screen.getByText(/Available: 2\.50000000 WRF/)).toBeTruthy();
  const review = screen.getByRole('button', { name: 'Review transfer' }) as HTMLButtonElement;
  expect(review.disabled).toBe(true);
  fireEvent.click(review);
  expect(prepare).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Amount in WRF'), { target: { value: '2.5' } });
  expect(screen.queryByText('Amount too high')).toBeNull();
  expect((screen.getByRole('button', { name: 'Review transfer' }) as HTMLButtonElement).disabled).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: 'Review transfer' }));
  await waitFor(() => expect(prepare.mock.calls).toEqual([[p.from, p.to, '2.5']]));
});

it('does not gate the amount when the balance is unknown', async () => {
  await review();
  expect(screen.queryByText('No WRF to send')).toBeNull();
  expect(prepare).toHaveBeenCalledTimes(1);
});

it('device key: a send inside this device\'s limits needs no password and is signed by the device', async () => {
  deviceCheck.mockResolvedValue({ ok: true });
  await review();
  expect(screen.getByTestId('device-signs').textContent).toContain('No password needed');
  expect(screen.queryByLabelText('Wallet password for this send')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Confirm & Send' }));
  await screen.findByText('Submitted; settlement is not yet confirmed.');
  expect(deviceSubmit).toHaveBeenCalledWith(p, expect.any(Function));
  // The allowlist check handed to the device path is the live guard (allowlist off here: allowed).
  const recipientRefusal = deviceSubmit.mock.calls[0][1] as (to: string) => string | null;
  expect(recipientRefusal(p.to)).toBeNull();
  expect(submit).not.toHaveBeenCalled();
});

it('device key: over the daily limit falls back to the password with a short reason', async () => {
  deviceCheck.mockResolvedValue({ ok: false, reason: 'daily' });
  await review();
  expect(screen.getByTestId('device-fallback').textContent).toContain('daily limit');
  expect(screen.getByLabelText('Wallet password for this send')).toBeTruthy();
  expect(deviceSubmit).not.toHaveBeenCalled();
});

it('device key: if the node refuses the device signature, nothing is sent and the password path opens', async () => {
  deviceCheck.mockResolvedValue({ ok: true });
  deviceSubmit.mockRejectedValueOnce(Object.assign(new Error('limit'), { details: { code: 'SESSION_KEY_LIMIT' } }));
  await review();
  fireEvent.click(screen.getByRole('button', { name: 'Confirm & Send' }));
  await screen.findByTestId('device-fallback');
  fireEvent.change(screen.getByLabelText('Wallet password for this send'), { target: { value: 'pw' } });
  fireEvent.click(screen.getByRole('button', { name: 'Confirm & Send' }));
  await screen.findByText('Submitted; settlement is not yet confirmed.');
  expect(submit).toHaveBeenCalledWith(p, 'pw');
});

it('device key: no device key (or the feature off) keeps the password flow unchanged', async () => {
  await review();
  expect(screen.queryByTestId('device-signs')).toBeNull();
  expect(screen.queryByTestId('device-fallback')).toBeNull();
  expect(screen.getByLabelText('Wallet password for this send')).toBeTruthy();
});
