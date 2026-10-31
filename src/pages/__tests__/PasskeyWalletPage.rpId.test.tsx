/** @jest-environment jsdom */
/**
 * Which RP ID the passkey page uses: every wrfcoin.com host creates on "wrfcoin.com" (one account for
 * www and the bare domain), any other host keeps its own hostname and says its accounts are a preview,
 * and a credential already saved on this device keeps the RP ID it was made with.
 */
import React from 'react';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

type Rec = { credentialId: Uint8Array; publicKeyXY: Uint8Array; rpId: string };
const key = { credentialId: new Uint8Array(16).fill(7), publicKeyXY: new Uint8Array(64).fill(9) };
let stored: Rec | null = null;
const registerPasskey = jest.fn<(...args: unknown[]) => Promise<Rec>>();
const signPasskeyTransfer = jest.fn<(r: Rec, f: unknown) => Promise<unknown>>();

await jest.unstable_mockModule('../../services/walletCrypto/passkeyBalance', () => ({
  getPasskeyPublicBalance: async () => ({ units: '100000000', height: 4209 }),
}));
const actualPasskey = await import('../../services/walletCrypto/passkey');
await jest.unstable_mockModule('../../services/walletCrypto/passkey', () => ({
  ...actualPasskey,
  registerPasskey: (...args: unknown[]) => registerPasskey(...args),
  signPasskeyTransfer: (r: Rec, f: unknown) => signPasskeyTransfer(r, f),
}));
await jest.unstable_mockModule('../../hooks/usePublicTestnetStats', () => ({ default: () => ({ blockHeight: 4210 }) }));
await jest.unstable_mockModule('../../config/network', () => ({ WRFCOIN_CHAIN_ID: 777 }));
await jest.unstable_mockModule('../../components/wallet/PasskeyFaucetPanel', () => ({ PasskeyFaucetPanel: () => null }));
await jest.unstable_mockModule('../../services/walletCrypto/passkeySend', () => ({
  clearStoredPasskey: jest.fn(),
  getPasskeyNonce: async () => '0',
  loadStoredPasskey: () => stored,
  saveStoredPasskey: jest.fn(),
  submitPasskeyTransfer: async () => ({ txHash: '0xabc', status: 'submitted' }),
}));
const { default: PasskeyWalletPage, PREVIEW_HOST_NOTE, CANONICAL_PASSKEY_URL } = await import('../PasskeyWalletPage');

beforeEach(() => {
  stored = null;
  registerPasskey.mockReset(); signPasskeyTransfer.mockReset();
  registerPasskey.mockImplementation(async (rpId) => ({ ...key, rpId: rpId as string }));
  signPasskeyTransfer.mockResolvedValue({ fixture: true });
});
afterEach(cleanup);

describe('passkey page on a wrfcoin.com host', () => {
  it.each(['wrfcoin.com', 'www.wrfcoin.com'])('%s creates on the RP ID wrfcoin.com, with no preview note and no www warning', async (host) => {
    render(<PasskeyWalletPage hostname={host} />);
    expect(screen.queryByTestId('passkey-preview-host')).not.toBeInTheDocument();
    const site = screen.getByTestId('passkey-site');
    expect(site).toHaveTextContent('"wrfcoin.com"');
    expect(site).toHaveTextContent('open the same account');
    expect(site).not.toHaveTextContent('different account');
    fireEvent.click(screen.getByTestId('passkey-create'));
    await waitFor(() => expect(registerPasskey).toHaveBeenCalledWith('wrfcoin.com', 'WRFCoin passkey wallet', undefined, 'any'));
  });

  it('the security-key choice uses the same RP ID', async () => {
    render(<PasskeyWalletPage hostname="next.wrfcoin.com" />);
    fireEvent.click(screen.getByTestId('passkey-create-security-key'));
    await waitFor(() => expect(registerPasskey).toHaveBeenCalledWith('wrfcoin.com', 'WRFCoin passkey wallet', undefined, 'security-key'));
  });
});

describe('passkey page on another host', () => {
  it('keeps the hostname as the RP ID and says accounts made here are a preview', async () => {
    const host = 'wrfcoin-n5.tail1234.ts.net';
    render(<PasskeyWalletPage hostname={host} />);
    const note = screen.getByTestId('passkey-preview-host');
    expect(note).toHaveTextContent(PREVIEW_HOST_NOTE);
    expect(screen.getByRole('link', { name: CANONICAL_PASSKEY_URL })).toHaveAttribute('href', 'https://wrfcoin.com/wallet/passkey');
    expect(screen.getByTestId('passkey-site')).toHaveTextContent(`("${host}")`);
    expect(screen.getByTestId('passkey-site')).toHaveTextContent('different account');
    fireEvent.click(screen.getByTestId('passkey-create'));
    await waitFor(() => expect(registerPasskey).toHaveBeenCalledWith(host, 'WRFCoin passkey wallet', undefined, 'any'));
  });

  it('a look-alike host is not treated as wrfcoin.com', async () => {
    render(<PasskeyWalletPage hostname="evilwrfcoin.com" />);
    expect(screen.getByTestId('passkey-preview-host')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('passkey-create'));
    await waitFor(() => expect(registerPasskey).toHaveBeenCalledWith('evilwrfcoin.com', 'WRFCoin passkey wallet', undefined, 'any'));
  });
});

describe('a passkey already saved on this device', () => {
  it.each([
    ['wrfcoin-n5.tail1234.ts.net', 'wrfcoin-n5.tail1234.ts.net'],
    ['www.wrfcoin.com', 'www.wrfcoin.com'],
  ])('on %s keeps its saved RP ID %s for the address and for signing', async (host, savedRpId) => {
    stored = { ...key, rpId: savedRpId };
    const address = actualPasskey.passkeyRecordAddress(stored);
    render(<PasskeyWalletPage hostname={host} />);
    expect(screen.getByTestId('passkey-address')).toHaveTextContent(address);
    expect(screen.getByTestId('passkey-site')).toHaveTextContent(`("${savedRpId}")`);
    fireEvent.change(screen.getByLabelText('Recipient address'), { target: { value: `0x${'1'.repeat(40)}` } });
    fireEvent.change(screen.getByLabelText('Amount (WRF)'), { target: { value: '0.1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send with passkey' }));
    await waitFor(() => expect(signPasskeyTransfer).toHaveBeenCalled());
    const [usedRecord, fields] = signPasskeyTransfer.mock.calls[0] as [Rec, { from: string }];
    expect(usedRecord.rpId).toBe(savedRpId);
    expect(fields.from).toBe(address);
    expect(registerPasskey).not.toHaveBeenCalled();
  });
});
