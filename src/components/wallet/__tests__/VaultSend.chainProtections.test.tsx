/** @jest-environment jsdom */
import React from 'react';
import { jest, beforeEach, it, expect } from '@jest/globals';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

const from = `0x${'1'.repeat(40)}`;
const listed = `0x${'5'.repeat(40)}`;
const pendingAddr = `0x${'3'.repeat(40)}`;
const stranger = `0x${'7'.repeat(40)}`;
const p = { from, to: listed, amountBaseUnits: '100000000', nonce: '3', chainId: '888', networkId: 'testnet' };
const prepare = jest.fn<(...args: unknown[]) => Promise<typeof p>>();
const submit = jest.fn<(...args: unknown[]) => Promise<{ txHash: string }>>();
await jest.unstable_mockModule('../../../services/walletCrypto/vaultTransfer', () => ({ previewVaultTransfer: prepare, submitVaultTransfer: submit }));
await jest.unstable_mockModule('../../../services/walletCrypto/deviceSession', () => ({
  checkThisDeviceCanSend: async () => ({ ok: true }),
  submitDeviceTransfer: jest.fn(),
  errorCode: () => null,
  DeviceSendRefusedError: class extends Error {},
  deviceFallbackMessage: () => null,
}));
let protections: any = null;
await jest.unstable_mockModule('../../../services/walletCrypto/useChainProtections', () => ({
  useChainProtections: () => protections,
  useNow: () => Date.now(),
}));
const coSigner = jest.fn();
const real = await import('../../../services/walletCrypto/protections');
await jest.unstable_mockModule('../../../services/walletCrypto/protections', () => ({
  ...real,
  securityKeySpendCoSigner: (keys: unknown) => { coSigner(keys); return 'CO-SIGNER'; },
}));
const { default: VaultSend, CHAIN_ALLOWLIST_BLOCKED_MESSAGE, SECURITY_KEY_SEND_MESSAGE } = await import('../VaultSend');

const read = {
  feature_active_next_height: true, observed_at_height: 999,
  allowlist: {
    account: from, next_action_nonce: 1, in_force: true, at_height: 1000, add_delay_blocks: 2244, enabled_at_height: 1,
    allowed: [listed], pending_additions: [{ address: pendingAddr, requested_at_height: 999, effective_at_height: 1010 }],
    pending_disable: null, requests_blocked_until_height: null,
  },
};
const key = { public_key_p256: 'ab'.repeat(64), rp_id_hash: 'cd'.repeat(32), credential_id: '0909' };

beforeEach(() => {
  cleanup(); prepare.mockReset().mockResolvedValue(p); submit.mockReset().mockResolvedValue({ txHash: 'tx' }); coSigner.mockReset();
  protections = { securityKey: null, allowlist: read, fetchedAt: Date.now(), loading: false, reload: async () => {} };
});

const openWith = (to: string) => {
  render(<VaultSend address={from} />);
  fireEvent.click(screen.getByRole('button', { name: /^Send$/ }));
  fireEvent.change(screen.getByLabelText('Recipient address'), { target: { value: to } });
  fireEvent.change(screen.getByLabelText('Amount in WRF'), { target: { value: '1' } });
};

it('blocks a recipient that is not on the chain allowlist before anything is prepared or signed', () => {
  openWith(stranger);
  expect(screen.getByTestId('send-chain-allowlist-refusal').textContent).toContain(CHAIN_ALLOWLIST_BLOCKED_MESSAGE);
  const button = screen.getByRole('button', { name: 'Review transfer' }) as HTMLButtonElement;
  expect(button.disabled).toBe(true);
  fireEvent.click(button);
  expect(prepare).not.toHaveBeenCalled();
});

it('a pending addition says when it can receive (10 blocks ≈ 12 m 50 s)', () => {
  openWith(pendingAddr);
  expect(screen.getByTestId('send-chain-allowlist-refusal').textContent).toMatch(/You can send to it in 12 m (49|50) s/);
});

it('a listed recipient goes through unchanged', async () => {
  openWith(listed);
  expect(screen.queryByTestId('send-chain-allowlist-refusal')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Review transfer' }));
  await screen.findByText('Review transfer', { selector: 'span' });
  expect(prepare).toHaveBeenCalled();
});

it('with no chain read (flag off, feature off, relay down) nothing changes', () => {
  protections = { securityKey: null, allowlist: null, fetchedAt: Date.now(), loading: false, reload: async () => {} };
  openWith(stranger);
  expect(screen.queryByTestId('send-chain-allowlist-refusal')).toBeNull();
  expect((screen.getByRole('button', { name: 'Review transfer' }) as HTMLButtonElement).disabled).toBe(false);
});

it('a YubiKey-protected account never uses the device key and co-signs with the registered keys', async () => {
  protections = { ...protections, securityKey: { required_to_spend: true, keys: [key] } };
  openWith(listed);
  fireEvent.click(screen.getByRole('button', { name: 'Review transfer' }));
  await screen.findByTestId('send-security-key');
  expect(screen.getByTestId('send-security-key').textContent).toBe(SECURITY_KEY_SEND_MESSAGE);
  expect(screen.queryByTestId('device-signs')).toBeNull();
  fireEvent.change(screen.getByLabelText('Wallet password for this send'), { target: { value: 'pw' } });
  fireEvent.click(screen.getByRole('button', { name: 'Confirm & Send' }));
  await screen.findByText('Submitted; settlement is not yet confirmed.');
  expect(coSigner).toHaveBeenCalledWith([key]);
  expect(submit).toHaveBeenCalledWith(p, 'pw', 'CO-SIGNER');
});
