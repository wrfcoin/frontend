/** @jest-environment jsdom */
/**
 * Approve as payout for a node bond: the page shows what the file says, refuses a file that pays
 * another account (without prompting the passkey), signs a matching one and offers the result for
 * download. It makes no network calls.
 */
import React from 'react';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { p256 } from '@noble/curves/nist.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { hexToBytes, passkeyRecordAddress, type PasskeyCredentialRecord } from '../../services/walletCrypto/passkey';

await jest.unstable_mockModule('../../config/network', () => ({ WRFCOIN_CHAIN_ID: '888' }));
const { default: PasskeyBondPayoutPage, NO_COINS_NOTE } = await import('../PasskeyBondPayoutPage');

const priv = p256.utils.randomSecretKey();
const record: PasskeyCredentialRecord = { credentialId: new Uint8Array([7, 7]), publicKeyXY: p256.getPublicKey(priv, false).slice(1), rpId: 'wrfcoin.com' };
const address = passkeyRecordAddress(record);

function packet(payout: number[] = Array.from(hexToBytes(address.slice(2))), action = 'Deposit') {
  const data = {
    signed: {
      authorization: {
        genesis_hash: Array(32).fill(1), deployment_id: Array(32).fill(0xab), owner_account: Array(20).fill(3),
        escrow_account: Array(20).fill(4), payout_account: payout, server_key: Array(32).fill(6), consumer_key: Array(32).fill(7),
        service_alias: 'node-1.example', action, amount_units: 25_000_000_000, expected_nonce: 4, effective_epoch: 9,
      },
      owner_signature: [], server_signature: [], consumer_signature: [],
    },
    owner_key: Array(32).fill(9), governance_key: Array(32).fill(8), governance_signature: [], payout_key: null, payout_signature: [],
  };
  return JSON.stringify({ id: 'x', tx_type: 'NodeBondLifecycle', data: JSON.stringify(data) });
}

function authenticator() {
  return {
    get: jest.fn(async (options: any) => {
      const clientDataJSON = new TextEncoder().encode(JSON.stringify({ type: 'webauthn.get', challenge: Buffer.from(options.publicKey.challenge).toString('base64url') }));
      const authenticatorData = new Uint8Array([...sha256(new TextEncoder().encode('wrfcoin.com')), 0x05, 0, 0, 0, 1]);
      const signature = p256.sign(new Uint8Array([...authenticatorData, ...sha256(clientDataJSON)]), priv, { format: 'der' });
      return { response: { authenticatorData, clientDataJSON, signature } };
    }),
  };
}

const fetchSpy = jest.fn();
beforeEach(() => { (globalThis as any).fetch = fetchSpy; fetchSpy.mockReset(); });
afterEach(cleanup);

const renderPage = (props: Parameters<typeof PasskeyBondPayoutPage>[0] = {}) =>
  render(<MemoryRouter><PasskeyBondPayoutPage initialRecord={record} {...props} /></MemoryRouter>);
const paste = (text: string) => fireEvent.change(screen.getByTestId('bond-payout-json'), { target: { value: text } });

describe('PasskeyBondPayoutPage', () => {
  it('asks for a passkey wallet first when there is none', () => {
    renderPage({ initialRecord: null });
    expect(screen.getByTestId('bond-payout-no-passkey')).toHaveTextContent(/no passkey wallet on this device/);
    expect(screen.queryByTestId('bond-payout-json')).toBeNull();
  });

  it('shows plainly what is being approved, and that no coins move', () => {
    renderPage();
    paste(packet());
    expect(screen.getByTestId('bond-payout-action')).toHaveTextContent('Deposit (new bond)');
    expect(screen.getByTestId('bond-payout-alias')).toHaveTextContent('node-1.example');
    expect(screen.getByTestId('bond-payout-deployment')).toHaveTextContent('ab'.repeat(32));
    expect(screen.getByTestId('bond-payout-owner')).toHaveTextContent(`0x${'03'.repeat(20)}`);
    expect(screen.getByTestId('bond-payout-payout')).toHaveTextContent(address);
    expect(screen.getByTestId('bond-payout-epoch')).toHaveTextContent('9');
    expect(screen.getByTestId('bond-payout-amount')).toHaveTextContent('250');
    expect(screen.getByTestId('bond-payout-no-coins')).toHaveTextContent(NO_COINS_NOTE);
    expect(screen.queryByTestId('bond-payout-refusal')).toBeNull();
  });

  it('refuses a file that pays another account and never prompts the passkey', () => {
    const creds = authenticator();
    renderPage({ credentials: creds });
    paste(packet(Array(20).fill(5)));
    expect(screen.getByTestId('bond-payout-refusal')).toHaveTextContent(/not this passkey wallet/);
    expect(screen.queryByTestId('bond-payout-approve')).toBeNull();
    expect(creds.get).not.toHaveBeenCalled();
  });

  it('refuses an exit', () => {
    renderPage();
    paste(packet(undefined, 'Exit'));
    expect(screen.getByTestId('bond-payout-refusal')).toHaveTextContent(/bond exit/);
  });

  it('says why a file cannot be read', () => {
    renderPage();
    paste('{"hello": 1}');
    expect(screen.getByTestId('bond-payout-error')).toHaveTextContent(/not a node bond packet/);
  });

  it('signs a matching file and offers the approved file for download, with no network calls', async () => {
    const creds = authenticator();
    const created: Blob[] = [];
    (URL as any).createObjectURL = jest.fn((b: Blob) => { created.push(b); return 'blob:x'; });
    (URL as any).revokeObjectURL = jest.fn();
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    renderPage({ credentials: creds });
    paste(packet());
    fireEvent.click(screen.getByTestId('bond-payout-approve'));
    await waitFor(() => expect(screen.getByTestId('bond-payout-approved')).toBeInTheDocument());
    expect(creds.get).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId('bond-payout-download'));
    expect(click).toHaveBeenCalled();
    const text = await new Promise<string>((resolve) => { const r = new window.FileReader(); r.onload = () => resolve(String(r.result)); r.readAsText(created[0]); });
    const out = JSON.parse(text);
    const data = JSON.parse(out.data);
    expect(data.payout_passkey.public_key_p256).toHaveLength(128);
    expect(data.payout_key).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
    click.mockRestore();
  });

  it('does not sign when the build has no chain id', async () => {
    const creds = authenticator();
    renderPage({ credentials: creds, chainId: null });
    paste(packet());
    fireEvent.click(screen.getByTestId('bond-payout-approve'));
    await waitFor(() => expect(screen.getByTestId('bond-payout-error')).toHaveTextContent(/not configured/));
    expect(creds.get).not.toHaveBeenCalled();
  });
});
