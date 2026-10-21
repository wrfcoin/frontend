/**
 * @jest-environment jsdom
 */

import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';

const mockCreateWalletFromMnemonic = jest.fn();
const mockEncryptMnemonicAsync = jest.fn();
const mockIsValidEncryptedPayload = jest.fn();

await jest.unstable_mockModule('../../../utils/walletUtils.ts', () => ({
  walletManager: {
    createWalletFromMnemonic: (...args) => mockCreateWalletFromMnemonic(...args),
  },
}));

await jest.unstable_mockModule('../../../services/encryptionService.ts', () => ({
  __esModule: true,
  default: {
    encryptMnemonicAsync: (...args) => mockEncryptMnemonicAsync(...args),
    isValidEncryptedPayload: (...args) => mockIsValidEncryptedPayload(...args),
  },
}));

const { default: WalletImport } = await import('../WalletImport.jsx');

describe('WalletImport secret handling', () => {
  const validMnemonic =
    'alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu';
  const validPassword = 'StrongPass#123';

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockIsValidEncryptedPayload.mockReturnValue(true);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  const fillImportForm = async () => {
    fireEvent.change(screen.getByLabelText(/Mnemonic Phrase/i), {
      target: { value: validMnemonic },
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Valid 12-word mnemonic phrase detected/i),
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Wallet Password/i), {
      target: { value: validPassword },
    });
  };

  it('encrypts mnemonic and only persists/emits sanitized wallet metadata', async () => {
    mockCreateWalletFromMnemonic.mockResolvedValue({
      address: 'wrf123',
      publicKey: 'pub_123',
      mnemonic: 'raw secret should not leak',
      password: 'raw password should not leak',
      privateKey: '0xsecret',
      imported: true,
      nested: {
        privateKey: 'nested secret key',
        label: 'safe label',
      },
      accounts: [
        {
          address: 'wrf_account_1',
          mnemonic: 'nested mnemonic secret',
        },
      ],
    });
    mockEncryptMnemonicAsync.mockResolvedValue({
      data: 'ciphertext',
      iv: 'iv',
      salt: 'salt',
      timestamp: 123456,
      version: '1.0.0',
    });

    const onWalletImported = jest.fn();
    render(<WalletImport onWalletImported={onWalletImported} onClose={jest.fn()} />);

    await fillImportForm();
    fireEvent.click(screen.getByRole('button', { name: /Import Wallet/i }));

    await waitFor(() => {
      expect(onWalletImported).toHaveBeenCalledTimes(1);
    });

    expect(mockCreateWalletFromMnemonic).toHaveBeenCalledWith(
      validMnemonic,
      validPassword,
    );
    expect(mockEncryptMnemonicAsync).toHaveBeenCalledWith(
      validMnemonic,
      validPassword,
    );
    expect(mockIsValidEncryptedPayload).toHaveBeenCalled();

    const persisted = JSON.parse(localStorage.getItem('wrfcoin_wallet_imported'));
    expect(persisted.hasWallet).toBe(true);
    expect(persisted.encrypted).toBe(true);
    expect(persisted.address).toBe('wrf123');
    expect(persisted.encryptedMnemonic.data).toBe('ciphertext');
    expect(persisted.wordCount).toBe(12);
    expect(persisted.strength).toBe(128);
    expect(persisted.mnemonic).toBeUndefined();
    expect(persisted.password).toBeUndefined();
    expect(persisted.privateKey).toBeUndefined();
    expect(persisted.nested.privateKey).toBeUndefined();
    expect(persisted.nested.label).toBe('safe label');
    expect(persisted.accounts[0].mnemonic).toBeUndefined();
    expect(localStorage.getItem('wrfcoin_wallet_imported')).not.toContain(
      '[ENCRYPTED]',
    );
    expect(localStorage.getItem('wrfcoin_wallet_imported')).not.toContain(
      validMnemonic,
    );
    expect(localStorage.getItem('wrfcoin_wallet_imported')).not.toContain(
      validPassword,
    );

    const callbackPayload = onWalletImported.mock.calls[0][0];
    expect(callbackPayload.encrypted).toBe(true);
    expect(callbackPayload.address).toBe('wrf123');
    expect(callbackPayload.mnemonic).toBeUndefined();
    expect(callbackPayload.password).toBeUndefined();
    expect(callbackPayload.privateKey).toBeUndefined();
    expect(callbackPayload.nested.privateKey).toBeUndefined();
    expect(callbackPayload.accounts[0].mnemonic).toBeUndefined();
  });

  it('fails closed when encryption fails and does not persist raw secrets', async () => {
    mockCreateWalletFromMnemonic.mockResolvedValue({
      address: 'wrf456',
      mnemonic: 'raw secret should never persist',
    });
    mockEncryptMnemonicAsync.mockRejectedValue(
      new Error('encryption unavailable'),
    );

    const onWalletImported = jest.fn();
    render(<WalletImport onWalletImported={onWalletImported} onClose={jest.fn()} />);

    await fillImportForm();
    fireEvent.click(screen.getByRole('button', { name: /Import Wallet/i }));

    await waitFor(() => {
      expect(
        screen.getByText(
          /Failed to import wallet securely. Please verify your recovery phrase and try again./i,
        ),
      ).toBeInTheDocument();
    });

    expect(localStorage.getItem('wrfcoin_wallet_imported')).toBeNull();
    expect(onWalletImported).not.toHaveBeenCalled();
  });

  it('fails closed when encrypted payload is malformed', async () => {
    mockCreateWalletFromMnemonic.mockResolvedValue({
      address: 'wrf789',
      mnemonic: 'raw secret should never persist',
    });
    mockEncryptMnemonicAsync.mockResolvedValue({ data: 'bad payload' });
    mockIsValidEncryptedPayload.mockReturnValue(false);

    const onWalletImported = jest.fn();
    render(<WalletImport onWalletImported={onWalletImported} onClose={jest.fn()} />);

    await fillImportForm();
    fireEvent.click(screen.getByRole('button', { name: /Import Wallet/i }));

    await waitFor(() => {
      expect(
        screen.getByText(
          /Failed to import wallet securely. Please verify your recovery phrase and try again./i,
        ),
      ).toBeInTheDocument();
    });

    expect(localStorage.getItem('wrfcoin_wallet_imported')).toBeNull();
    expect(onWalletImported).not.toHaveBeenCalled();
  });

  it('fails closed when wallet creation fails', async () => {
    mockCreateWalletFromMnemonic.mockRejectedValue(
      new Error('wallet creation failed'),
    );

    const onWalletImported = jest.fn();
    render(<WalletImport onWalletImported={onWalletImported} onClose={jest.fn()} />);

    await fillImportForm();
    fireEvent.click(screen.getByRole('button', { name: /Import Wallet/i }));

    await waitFor(() => {
      expect(
        screen.getByText(
          /Failed to import wallet securely. Please verify your recovery phrase and try again./i,
        ),
      ).toBeInTheDocument();
    });

    expect(mockEncryptMnemonicAsync).not.toHaveBeenCalled();
    expect(localStorage.getItem('wrfcoin_wallet_imported')).toBeNull();
    expect(onWalletImported).not.toHaveBeenCalled();
  });

  it('fails closed when local storage persistence fails', async () => {
    mockCreateWalletFromMnemonic.mockResolvedValue({
      address: 'wrf900',
    });
    mockEncryptMnemonicAsync.mockResolvedValue({
      data: 'ciphertext',
      iv: 'iv',
      salt: 'salt',
      timestamp: 123456,
      version: '1.0.0',
    });

    const setItemSpy = jest
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('storage unavailable');
      });

    const onWalletImported = jest.fn();
    render(<WalletImport onWalletImported={onWalletImported} onClose={jest.fn()} />);

    await fillImportForm();
    fireEvent.click(screen.getByRole('button', { name: /Import Wallet/i }));

    await waitFor(() => {
      expect(
        screen.getByText(
          /Failed to import wallet securely. Please verify your recovery phrase and try again./i,
        ),
      ).toBeInTheDocument();
    });

    expect(onWalletImported).not.toHaveBeenCalled();
    setItemSpy.mockRestore();
  });

  it('treats callback exceptions as non-fatal after secure persistence', async () => {
    mockCreateWalletFromMnemonic.mockResolvedValue({
      address: 'wrf901',
    });
    mockEncryptMnemonicAsync.mockResolvedValue({
      data: 'ciphertext',
      iv: 'iv',
      salt: 'salt',
      timestamp: 123456,
      version: '1.0.0',
    });

    const onWalletImported = jest.fn(() => {
      throw new Error('callback failure');
    });
    render(<WalletImport onWalletImported={onWalletImported} onClose={jest.fn()} />);

    await fillImportForm();
    fireEvent.click(screen.getByRole('button', { name: /Import Wallet/i }));

    await waitFor(() => {
      const persisted = JSON.parse(localStorage.getItem('wrfcoin_wallet_imported'));
      expect(persisted.address).toBe('wrf901');
    });

    expect(
      screen.queryByText(
        /Failed to import wallet securely. Please verify your recovery phrase and try again./i,
      ),
    ).not.toBeInTheDocument();
    expect(onWalletImported).toHaveBeenCalledTimes(1);
  });
});
