/** @jest-environment jsdom */
/**
 * "Use an existing passkey" on the passkey page, with a real P-256 software authenticator behind a fake
 * navigator.credentials and the real localStorage record. It never calls create, sends nothing, stores
 * nothing on failure, and never replaces a saved wallet without asking.
 */
import React from 'react';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { p256 } from '@noble/curves/nist.js';
import { sha256 } from '@noble/hashes/sha2.js';

await jest.unstable_mockModule('../../services/walletCrypto/passkeyBalance', () => ({
  getPasskeyPublicBalance: async () => ({ units: '100000000', height: 4209 }),
}));
await jest.unstable_mockModule('../../hooks/usePublicTestnetStats', () => ({ default: () => ({ blockHeight: 4210 }) }));
await jest.unstable_mockModule('../../config/network', () => ({ WRFCOIN_CHAIN_ID: 777 }));
await jest.unstable_mockModule('../../components/wallet/PasskeyFaucetPanel', () => ({ PasskeyFaucetPanel: () => null }));
await jest.unstable_mockModule('../../components/explorer/NotifyMe', () => ({ default: () => null }));
const { concat, passkeyRecordAddress } = await import('../../services/walletCrypto/passkey');
const { webAuthnSignedMessage } = await import('../../services/walletCrypto/passkeyRecover');
const { saveStoredPasskey, loadStoredPasskey } = await import('../../services/walletCrypto/passkeySend');
const { default: PasskeyWalletPage, CREATE_OR_EXISTING_NOTE } = await import('../PasskeyWalletPage');
const { EXISTING_CANCELLED_MESSAGE, EXISTING_DIFFERENT_MESSAGE, EXISTING_FAILED_MESSAGE } = await import('../passkeyMessages');

const STORAGE_KEY = 'wrfcoin.passkey.credential.v1';
const encoder = new TextEncoder();
const b64url = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function authenticator(id: Uint8Array = Uint8Array.of(1, 2, 3)) {
  const secret = p256.utils.randomSecretKey();
  const assertion = async ({ publicKey: o }: any) => {
    const clientDataJSON = encoder.encode(JSON.stringify({ type: 'webauthn.get', challenge: b64url(o.challenge), origin: `https://${o.rpId}` }));
    const authenticatorData = concat(sha256(encoder.encode(o.rpId)), Uint8Array.of(0x05), Uint8Array.of(0, 0, 0, 1));
    const signature = p256.sign(webAuthnSignedMessage(authenticatorData, clientDataJSON), secret, { format: 'der' });
    return { rawId: id, response: { authenticatorData, clientDataJSON, signature } };
  };
  const record = (rpId: string) => ({ credentialId: id, publicKeyXY: p256.getPublicKey(secret, false).slice(1), rpId });
  return { assertion, record };
}

const get = jest.fn<(options: any) => Promise<any>>();
const create = jest.fn<(options: any) => Promise<any>>();
const fetchSpy = jest.fn<(...args: unknown[]) => Promise<never>>();

beforeEach(() => {
  localStorage.clear();
  get.mockReset(); create.mockReset(); fetchSpy.mockReset();
  fetchSpy.mockRejectedValue(new Error('no network in this test'));
  Object.defineProperty(navigator, 'credentials', { configurable: true, value: { get, create } });
  (globalThis as any).fetch = fetchSpy;
});
afterEach(cleanup);

const touch = async (testId: string) => { fireEvent.click(await screen.findByTestId(testId)); };
const bothTouches = async () => { await touch('passkey-use-existing'); await touch('passkey-existing-second'); };

describe('with nothing saved', () => {
  it('says plainly what Create and Use an existing passkey each do', () => {
    render(<PasskeyWalletPage hostname="wrfcoin.com" />);
    expect(screen.getByTestId('passkey-create-or-existing')).toHaveTextContent(CREATE_OR_EXISTING_NOTE);
    expect(CREATE_OR_EXISTING_NOTE).toContain('new wallet with a different address');
    expect(CREATE_OR_EXISTING_NOTE).toContain('opens the wallet you already have');
    expect(screen.getByRole('button', { name: 'Use an existing passkey' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Create on a security key (YubiKey)' })).toBeEnabled();
  });

  it('two touches open the wallet: the normal record is saved, nothing sent, no credential created', async () => {
    const a = authenticator();
    get.mockImplementation(a.assertion);
    render(<PasskeyWalletPage hostname="wrfcoin.com" />);
    await bothTouches();
    const expected = passkeyRecordAddress(a.record('wrfcoin.com'));
    expect(await screen.findByTestId('passkey-address')).toHaveTextContent(expected);
    expect(screen.getByTestId('passkey-opened')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).rpId).toBe('wrfcoin.com');
    expect(passkeyRecordAddress(loadStoredPasskey()!)).toBe(expected);
    expect(get).toHaveBeenCalledTimes(2);
    expect(create).not.toHaveBeenCalled();
    expect(fetchSpy.mock.calls.filter(([u]) => String(u).includes(expected))).toEqual([]);
  });

  it.each([
    ['www.wrfcoin.com', 'wrfcoin.com'],
    ['next.wrfcoin.com', 'wrfcoin.com'],
    ['wrfcoin-n5.tail1234.ts.net', 'wrfcoin-n5.tail1234.ts.net'],
  ])('on %s it asks for the RP ID %s', async (host, rpId) => {
    const a = authenticator();
    get.mockImplementation(a.assertion);
    render(<PasskeyWalletPage hostname={host} />);
    await bothTouches();
    expect(await screen.findByTestId('passkey-address')).toHaveTextContent(passkeyRecordAddress(a.record(rpId)));
    expect(get.mock.calls.every(([o]) => o.publicKey.rpId === rpId)).toBe(true);
  });

  it('Create is locked from the first touch until the flow ends, and Cancel stores nothing', async () => {
    get.mockImplementation(authenticator().assertion);
    render(<PasskeyWalletPage hostname="wrfcoin.com" />);
    await touch('passkey-use-existing');
    await screen.findByTestId('passkey-existing-second-step');
    expect(screen.getByTestId('passkey-create')).toBeDisabled();
    expect(screen.getByTestId('passkey-create-security-key')).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.getByTestId('passkey-create')).toBeEnabled());
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('a cancelled prompt stores nothing and says so', async () => {
    get.mockRejectedValue(Object.assign(new Error('x'), { name: 'NotAllowedError' }));
    render(<PasskeyWalletPage hostname="wrfcoin.com" />);
    await touch('passkey-use-existing');
    expect(await screen.findByTestId('passkey-existing-error')).toHaveTextContent(EXISTING_CANCELLED_MESSAGE);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('two different credential IDs store nothing and say so', async () => {
    const a = authenticator(Uint8Array.of(1));
    const b = authenticator(Uint8Array.of(2));
    get.mockImplementationOnce(a.assertion).mockImplementationOnce(b.assertion);
    render(<PasskeyWalletPage hostname="wrfcoin.com" />);
    await bothTouches();
    expect(await screen.findByTestId('passkey-existing-error')).toHaveTextContent(EXISTING_DIFFERENT_MESSAGE);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(screen.queryByTestId('passkey-address')).not.toBeInTheDocument();
  });

  it('two keys under one credential ID store nothing and say so', async () => {
    const a = authenticator();
    const b = authenticator();
    get.mockImplementationOnce(a.assertion).mockImplementationOnce(b.assertion);
    render(<PasskeyWalletPage hostname="wrfcoin.com" />);
    await bothTouches();
    expect(await screen.findByTestId('passkey-existing-error')).toHaveTextContent(EXISTING_FAILED_MESSAGE);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe('with a different wallet already saved', () => {
  const setup = () => {
    const saved = authenticator(Uint8Array.of(8));
    const other = authenticator(Uint8Array.of(9));
    saveStoredPasskey(saved.record('wrfcoin.com'));
    return { saved, other, savedRaw: localStorage.getItem(STORAGE_KEY) };
  };

  it('asks first, and "Keep" leaves it exactly as it was', async () => {
    const { saved, other, savedRaw } = setup();
    get.mockImplementation(other.assertion);
    render(<PasskeyWalletPage hostname="wrfcoin.com" />);
    await bothTouches();
    expect(await screen.findByTestId('passkey-existing-found-address')).toHaveTextContent(passkeyRecordAddress(other.record('wrfcoin.com')));
    expect(screen.getByTestId('passkey-existing-current-address')).toHaveTextContent(passkeyRecordAddress(saved.record('wrfcoin.com')));
    expect(localStorage.getItem(STORAGE_KEY)).toBe(savedRaw);
    fireEvent.click(screen.getByTestId('passkey-existing-keep'));
    await waitFor(() => expect(screen.queryByTestId('passkey-existing-found-address')).not.toBeInTheDocument());
    expect(localStorage.getItem(STORAGE_KEY)).toBe(savedRaw);
    expect(screen.getByTestId('passkey-address')).toHaveTextContent(passkeyRecordAddress(saved.record('wrfcoin.com')));
  });

  it('"Switch" saves the new one and shows it', async () => {
    const { other } = setup();
    get.mockImplementation(other.assertion);
    render(<PasskeyWalletPage hostname="wrfcoin.com" />);
    await bothTouches();
    fireEvent.click(await screen.findByTestId('passkey-existing-switch'));
    const expected = passkeyRecordAddress(other.record('wrfcoin.com'));
    await waitFor(() => expect(screen.getByTestId('passkey-address')).toHaveTextContent(expected));
    expect(passkeyRecordAddress(loadStoredPasskey()!)).toBe(expected);
    expect(create).not.toHaveBeenCalled();
  });

  it('the same wallet changes nothing and says so', async () => {
    const { saved, savedRaw } = setup();
    get.mockImplementation(saved.assertion);
    render(<PasskeyWalletPage hostname="wrfcoin.com" />);
    await bothTouches();
    expect(await screen.findByTestId('passkey-existing-notice')).toHaveTextContent('already open here');
    expect(localStorage.getItem(STORAGE_KEY)).toBe(savedRaw);
    expect(screen.queryByTestId('passkey-existing-switch')).not.toBeInTheDocument();
  });
});
