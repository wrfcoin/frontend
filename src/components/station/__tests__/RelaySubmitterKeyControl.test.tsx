/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import React from 'react';
import '@testing-library/jest-dom/jest-globals';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ed25519 } from '@noble/curves/ed25519.js';

(globalThis as any).__VITE_ENV__ = { VITE_WRFCOIN_CHAIN_ID: '888' };
const OWNER = `0x${'a'.repeat(40)}`;
const readVault = jest.fn<() => { address: string } | null>();
const actualVault = await import('../../../services/walletVault');
await jest.unstable_mockModule('../../../services/walletVault', () => ({ ...actualVault, readVault }));
const actual = await import('../../../services/walletCrypto/stationSubmitterKey');
const signSubmitterKeyAction = jest.fn<(r: unknown, pw: string) => Promise<Record<string, unknown>>>();
const submitSubmitterKeyAction = jest.fn<(id: string, p: Record<string, unknown>) => Promise<unknown>>();
await jest.unstable_mockModule('../../../services/walletCrypto/stationSubmitterKey', () => ({
  ...actual, signSubmitterKeyAction, submitSubmitterKeyAction,
}));
const { default: RelaySubmitterKeyControl, RELAY_KEY_NOT_ACTIVE_MESSAGE, RELAY_KEY_FROZEN_MESSAGE, RELAY_KEY_NO_VAULT_MESSAGE, RELAY_KEY_PENDING_MESSAGE } =
  await import('../RelaySubmitterKeyControl');
const { normalizeStationOwnership } = await import('../../../utils/stationOwnership');
const { stationAlias } = await import('../../../utils/stationAlias');

const RELAY = Array.from(ed25519.getPublicKey(new Uint8Array(32).fill(9)), b => b.toString(16).padStart(2, '0')).join('');
const RAW = 'station-relay-1';
const ownership = (over: Record<string, unknown> = {}) => normalizeStationOwnership({
  success: true, stationAlias: stationAlias(RAW), owner: OWNER, ownerNonce: 4, frozen: null, ownerDeactivated: false,
  rewardsSuspended: false, pendingRecovery: null, observedAtHeight: 30000, settledHeight: 29990, isOwner: true,
  features: { stationOwnerConsent: true, stationOwnerActions: true, stationActiveRewardGate: false, stationSubmitterKey: true },
  ...over,
});
const show = (o = ownership(), id = RAW) => render(<RelaySubmitterKeyControl stationId={id} ownership={o} />);

beforeEach(() => {
  readVault.mockReturnValue({ address: OWNER });
  signSubmitterKeyAction.mockReset().mockResolvedValue({ tx_kind: 'station_owner_action_v1' });
  submitSubmitterKeyAction.mockReset().mockResolvedValue({ status: 'accepted_pending_confirmation', transactionIds: [] });
});
afterEach(() => cleanup());

describe('RelaySubmitterKeyControl gate', () => {
  it('feature not reported (every node today): explanatory text, no inputs, nothing signed', () => {
    const features = { stationOwnerConsent: true, stationOwnerActions: true, stationActiveRewardGate: false };
    show(ownership({ features }));
    expect(screen.getByTestId('relay-key-inactive')).toHaveTextContent(RELAY_KEY_NOT_ACTIVE_MESSAGE);
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });
  it('stays off when owner actions are off or the flags are absent or not literally true', () => {
    for (const features of [
      { stationOwnerActions: false, stationSubmitterKey: true }, { stationOwnerActions: true, stationSubmitterKey: 'true' }, undefined,
    ]) {
      show(ownership({ features }));
      expect(screen.getByTestId('relay-key-inactive')).toBeInTheDocument();
      cleanup();
    }
  });
  it('hidden from a viewer who is not the owner', () => {
    show(ownership({ isOwner: false }));
    expect(screen.queryByTestId('relay-submitter-key')).toBeNull();
    cleanup();
    const o: Record<string, unknown> = { ...ownership() };
    show(normalizeStationOwnership({ ...o, isOwner: undefined, frozen: null, features: { stationOwnerActions: true, stationSubmitterKey: true } }));
    expect(screen.queryByTestId('relay-submitter-key')).toBeNull();
  });
  it('frozen or deactivated stations cannot approve', () => {
    show(ownership({ frozen: { sinceHeight: 10 } }));
    expect(screen.getByText(RELAY_KEY_FROZEN_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });
  it('needs the owner wallet saved in this browser', () => {
    readVault.mockReturnValue({ address: `0x${'b'.repeat(40)}` });
    show();
    expect(screen.getByText(RELAY_KEY_NO_VAULT_MESSAGE)).toBeInTheDocument();
    cleanup();
    readVault.mockReturnValue(null);
    show();
    expect(screen.getByText(RELAY_KEY_NO_VAULT_MESSAGE)).toBeInTheDocument();
  });
});

describe('RelaySubmitterKeyControl active', () => {
  it('validates the key before offering review', () => {
    show();
    const approve = screen.getByRole('button', { name: 'Approve relay key' });
    expect(approve).toBeDisabled();
    fireEvent.change(screen.getByTestId('relay-key-input'), { target: { value: 'abc' } });
    fireEvent.blur(screen.getByTestId('relay-key-input'));
    expect(screen.getByRole('alert')).toHaveTextContent('64 hex characters; this one has 3');
    fireEvent.change(screen.getByTestId('relay-key-input'), { target: { value: `0x${RELAY.toUpperCase()}` } });
    expect(approve).toBeEnabled();
  });

  it('approve: review, password, signs a Relay key with the read nonce/height, submits, says pending', async () => {
    show();
    fireEvent.change(screen.getByTestId('relay-key-input'), { target: { value: RELAY } });
    fireEvent.click(screen.getByRole('button', { name: 'Approve relay key' }));
    expect(screen.getByTestId('relay-key-review')).toHaveTextContent(RELAY);
    expect(screen.getByRole('button', { name: 'Sign and send' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Wallet password'), { target: { value: 'pw' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign and send' }));
    expect(await screen.findByTestId('relay-key-sent')).toHaveTextContent(RELAY_KEY_PENDING_MESSAGE);
    expect(signSubmitterKeyAction).toHaveBeenCalledWith(
      { stationId: RAW, ownerAddress: OWNER, ownerNonce: 4, observedAtHeight: 30000, relayPubkey: RELAY }, 'pw',
    );
    expect(submitSubmitterKeyAction).toHaveBeenCalledWith(RAW, { tx_kind: 'station_owner_action_v1' });
  });

  it('clear signs relayPubkey null', async () => {
    show();
    fireEvent.click(screen.getByRole('button', { name: 'Clear submitter key' }));
    expect(screen.getByTestId('relay-key-review')).toHaveTextContent('Remove this station');
    fireEvent.change(screen.getByLabelText('Wallet password'), { target: { value: 'pw' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign and send' }));
    await screen.findByTestId('relay-key-sent');
    expect(signSubmitterKeyAction.mock.calls[0][0]).toMatchObject({ relayPubkey: null });
  });

  it('alias page: asks for the raw station id and checks it against the alias', async () => {
    show(ownership(), stationAlias(RAW));
    fireEvent.change(screen.getByTestId('relay-key-input'), { target: { value: RELAY } });
    const approve = screen.getByRole('button', { name: 'Approve relay key' });
    expect(approve).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/^Station id/), { target: { value: 'some-other-station' } });
    fireEvent.blur(screen.getByLabelText(/^Station id/));
    expect(screen.getByText('That is not this station\'s id.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/^Station id/), { target: { value: RAW } });
    fireEvent.click(approve);
    fireEvent.change(screen.getByLabelText('Wallet password'), { target: { value: 'pw' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign and send' }));
    await screen.findByTestId('relay-key-sent');
    expect(signSubmitterKeyAction.mock.calls[0][0]).toMatchObject({ stationId: RAW });
  });

  it('shows a failure and goes back to editing', async () => {
    signSubmitterKeyAction.mockRejectedValue(new Error('Unable to sign. Check your password and wallet, then try again.'));
    show();
    fireEvent.change(screen.getByTestId('relay-key-input'), { target: { value: RELAY } });
    fireEvent.click(screen.getByRole('button', { name: 'Approve relay key' }));
    fireEvent.change(screen.getByLabelText('Wallet password'), { target: { value: 'bad' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign and send' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to sign');
    expect(submitSubmitterKeyAction).not.toHaveBeenCalled();
  });
});
