/** @jest-environment jsdom */
import React from 'react';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

// Fixture account: a stored passkey record (public material only); signing and WebAuthn are never reached.
const record = { credentialId: new Uint8Array(16).fill(7), publicKeyXY: new Uint8Array(64).fill(9), rpId: 'localhost' };
// The public balance route answers { units, height } via passkeyBalance; `balance` keeps the old fixture shape.
const getBalance = jest.fn<(a: string) => Promise<{ balance: string; height?: number }>>();
const clearStoredPasskey = jest.fn();
const submitPasskeyTransfer = jest.fn<(b: unknown) => Promise<{ txHash: string; status: 'submitted' }>>();
let stats: { blockHeight: number | null } = { blockHeight: 4210 };

await jest.unstable_mockModule('../../services/walletCrypto/passkeyBalance', () => ({
  getPasskeyPublicBalance: async (a: string) => { const r = await getBalance(a); return { units: r.balance, height: r.height ?? 4209 }; },
}));
// Signing is replaced by a fixture body: WebAuthn is never reached. The address derivation stays real.
const actualPasskey = await import('../../services/walletCrypto/passkey');
await jest.unstable_mockModule('../../services/walletCrypto/passkey', () => ({
  ...actualPasskey,
  signPasskeyTransfer: async () => ({ fixture: true }),
}));
await jest.unstable_mockModule('../../hooks/usePublicTestnetStats', () => ({ default: () => stats }));
await jest.unstable_mockModule('../../config/network', () => ({ WRFCOIN_CHAIN_ID: 777 }));
await jest.unstable_mockModule('../../services/walletCrypto/passkeySend', () => ({
  clearStoredPasskey: () => clearStoredPasskey(),
  getPasskeyNonce: async () => '0',
  loadStoredPasskey: () => record,
  saveStoredPasskey: jest.fn(),
  submitPasskeyTransfer: (b: unknown) => submitPasskeyTransfer(b),
}));
const { default: PasskeyWalletPage, addressTail } = await import('../PasskeyWalletPage');
const { passkeyRecordAddress } = await import('../../services/walletCrypto/passkey');
const address = passkeyRecordAddress(record as any);

const writeText = jest.fn<(t: string) => Promise<void>>();
beforeEach(() => {
  getBalance.mockReset(); clearStoredPasskey.mockReset(); writeText.mockReset(); submitPasskeyTransfer.mockReset();
  writeText.mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  stats = { blockHeight: 4210 };
});
afterEach(cleanup);

describe('passkey wallet: receive', () => {
  it('shows a QR code of the address and copies it with feedback', async () => {
    getBalance.mockResolvedValue({ balance: '0' });
    render(<PasskeyWalletPage />);
    expect(screen.getByTestId('receive-qr')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('passkey-copy'));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(address));
    expect(await screen.findByText('Address copied to the clipboard.')).toBeInTheDocument();
    expect(screen.getByTestId('passkey-copy')).toHaveTextContent('Copied');
  });
  it('says so when the clipboard is unavailable', async () => {
    getBalance.mockResolvedValue({ balance: '0' });
    writeText.mockRejectedValue(new Error('denied'));
    render(<PasskeyWalletPage />);
    fireEvent.click(screen.getByTestId('passkey-copy'));
    expect(await screen.findByText(/Copy is not available here/)).toBeInTheDocument();
  });
});

describe('passkey wallet: forget confirmation', () => {
  const open = () => fireEvent.click(screen.getByRole('button', { name: 'Forget on this device' }));
  it('does not forget on the first click and states it cannot be recovered', async () => {
    getBalance.mockResolvedValue({ balance: '100000000' });
    render(<PasskeyWalletPage />);
    open();
    expect(await screen.findByText(/cannot be recovered here afterwards/)).toBeInTheDocument();
    expect(clearStoredPasskey).not.toHaveBeenCalled();
    expect(screen.getByTestId('passkey-forget-confirm')).toBeDisabled();
  });
  it('requires the last 4 characters of the address', async () => {
    getBalance.mockResolvedValue({ balance: '1' });
    render(<PasskeyWalletPage />);
    open();
    const input = await screen.findByTestId('passkey-forget-tail');
    fireEvent.change(input, { target: { value: 'zzzz' } });
    expect(screen.getByTestId('passkey-forget-confirm')).toBeDisabled();
    fireEvent.change(input, { target: { value: addressTail(address).toUpperCase() } });
    expect(screen.getByTestId('passkey-forget-confirm')).toBeEnabled();
    fireEvent.click(screen.getByTestId('passkey-forget-confirm'));
    expect(clearStoredPasskey).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole('button', { name: 'Create passkey account' })).toBeInTheDocument();
  });
  it('keeping the account clears nothing', async () => {
    getBalance.mockResolvedValue({ balance: '1' });
    render(<PasskeyWalletPage />);
    open();
    fireEvent.click(await screen.findByRole('button', { name: 'Keep it' }));
    expect(clearStoredPasskey).not.toHaveBeenCalled();
  });
});

describe('passkey wallet: balance and send gating', () => {
  const fill = (amount: string) => {
    fireEvent.change(screen.getByLabelText('Recipient address'), { target: { value: '0x' + '2'.repeat(40) } });
    fireEvent.change(screen.getByLabelText('Amount (WRF)'), { target: { value: amount } });
  };
  it('shows the exact available balance and blocks an amount above it', async () => {
    getBalance.mockResolvedValue({ balance: '150000000', height: 4209 }); // 1.5 WRF
    render(<PasskeyWalletPage />);
    expect(await screen.findByText('1.50000000 WRF')).toBeInTheDocument();
    expect(getBalance).toHaveBeenCalledWith(address);
    expect(screen.getByTestId('passkey-balance-height')).toHaveTextContent('Read at block 4,209.');
    fill('1.50000001');
    expect(screen.getAllByRole('alert')[0]).toHaveTextContent('more than the available balance');
    expect(screen.getByRole('button', { name: 'Send with passkey' })).toBeDisabled();
    fill('1.5');
    expect(screen.getByRole('button', { name: 'Send with passkey' })).toBeEnabled();
  });
  it('blocks sending from a zero balance', async () => {
    getBalance.mockResolvedValue({ balance: '0' });
    render(<PasskeyWalletPage />);
    await screen.findByText('0.00000000 WRF');
    fill('1');
    expect(screen.getByRole('button', { name: 'Send with passkey' })).toBeDisabled();
    expect(screen.getByText(/no funds yet/)).toBeInTheDocument();
  });
  it('shows "Unavailable", invents no number and does not gate when the balance cannot be read', async () => {
    getBalance.mockRejectedValue(new Error('401'));
    render(<PasskeyWalletPage />);
    expect(await screen.findByText('Unavailable')).toBeInTheDocument();
    expect(screen.getByTestId('passkey-balance').textContent).not.toMatch(/\d+\.\d{8}/);
    expect(screen.queryByTestId('passkey-balance-height')).not.toBeInTheDocument();
    fill('5');
    expect(screen.getByRole('button', { name: 'Send with passkey' })).toBeEnabled();
  });
  it('re-reads after a send and shows "Unavailable", not the old number, when that read fails', async () => {
    getBalance.mockResolvedValueOnce({ balance: '500000000' }).mockRejectedValueOnce(new Error('502'));
    submitPasskeyTransfer.mockResolvedValue({ txHash: 'tx-fixture', status: 'submitted' });
    render(<PasskeyWalletPage />);
    expect(await screen.findByText('5.00000000 WRF')).toBeInTheDocument();
    fill('1');
    fireEvent.click(screen.getByRole('button', { name: 'Send with passkey' }));
    expect(await screen.findByText('tx-fixture')).toBeInTheDocument();
    expect(await screen.findByText('Unavailable')).toBeInTheDocument();
    expect(screen.queryByText('5.00000000 WRF')).not.toBeInTheDocument();
    expect(getBalance).toHaveBeenCalledTimes(2);
  });
});

describe('passkey wallet: activation note', () => {
  it('shows the current block height and no stale activation block', async () => {
    getBalance.mockResolvedValue({ balance: '0' });
    render(<PasskeyWalletPage />);
    const note = screen.getByTestId('passkey-activation');
    expect(note).toHaveTextContent('Current block: 4,210.');
    expect(note).toHaveTextContent('active once the chain reports it active');
    expect(document.body.textContent).not.toMatch(/3400/);
  });
  it('says the height is unavailable rather than guessing', async () => {
    stats = { blockHeight: null };
    getBalance.mockResolvedValue({ balance: '0' });
    render(<PasskeyWalletPage />);
    expect(screen.getByTestId('passkey-activation')).toHaveTextContent('Current block: unavailable.');
  });
});

describe('passkey wallet: app-level send allowlist', () => {
  it('refuses an address outside the address book before the passkey prompt', async () => {
    const { __resetAddressBookForTests } = await import('../../services/addressBook/useAddressBook');
    const { memoryStore } = await import('../../services/addressBook/deviceStore');
    const { turnAllowlistOn, EMPTY_BOOK } = await import('../../services/addressBook/addressBook');
    const store = memoryStore();
    await store.save(turnAllowlistOn(EMPTY_BOOK, Date.now()));
    __resetAddressBookForTests(store);
    try {
      getBalance.mockResolvedValue({ balance: '100000000' });
      render(<PasskeyWalletPage />);
      await screen.findByText('1.00000000 WRF');
      fireEvent.change(screen.getByLabelText('Recipient address'), { target: { value: '0x' + '4'.repeat(40) } });
      fireEvent.change(screen.getByLabelText('Amount (WRF)'), { target: { value: '0.5' } });
      expect(await screen.findByTestId('passkey-allowlist-refusal')).toHaveTextContent('not in your address book');
      expect(screen.getByRole('button', { name: 'Send with passkey' })).toBeDisabled();
      expect(submitPasskeyTransfer).not.toHaveBeenCalled();
    } finally {
      cleanup();
      __resetAddressBookForTests(null);
    }
  });
});
