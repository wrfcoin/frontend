/**
 * @jest-environment jsdom
 */
// frontend#438: onboarding "Create New Wallet" (internal build). The REAL wallet manager derives the key;
// the 12 words alone must give the shared cross-wallet vector's address (empty BIP-39 passphrase), the
// password must only encrypt this browser's copy, and the created wallet must become the connected AND signed-in
// account (connectWallet, which runs the login). A saved copy can be unlocked again (review of 4537f820).
import { jest } from '@jest/globals';
import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { MemoryRouter } from 'react-router';

import { webcrypto } from 'node:crypto';

// jsdom's crypto has getRandomValues but no subtle; browsers (in a secure context) have both.
Object.defineProperty(globalThis.crypto, 'subtle', { value: webcrypto.subtle, configurable: true });

const VECTOR = JSON.parse(readFileSync('contract-fixtures/wallet-key-scheme-vector.json', 'utf8')) as {
  mnemonic: string; passphrase: string; address: string;
};

type Connected = { type: string; address: string; mnemonic: string };
const connected: Connected[] = [];
let loginFails = false;
const importCustomWallet = jest.fn();
const mockWalletContext = {
  isConnected: false, isConnecting: false, account: null as string | null, chainId: null,
  openWalletSelector: jest.fn(),
  importCustomWallet,
  // The real connectWallet runs the ed25519 login and disconnects again when it fails.
  connectWallet: async (type: string, options: { walletData: { address: string; mnemonic: string } }) => {
    if (loginFails) throw new Error('login refused');
    connected.push({ type, address: options.walletData.address, mnemonic: options.walletData.mnemonic });
    return { address: options.walletData.address };
  },
};
await jest.unstable_mockModule('../../contexts/WalletContext.jsx', () => ({
  useWallet: () => mockWalletContext,
}));

const mockNavigate = jest.fn();
await jest.unstable_mockModule('react-router', () => ({
  useNavigate: () => mockNavigate,
}));

await jest.unstable_mockModule('../../components/wallet/v2/HardwareWalletSection.jsx', () => ({
  default: function MockHardwareWalletSection({ onWalletConnected }: { onWalletConnected?: () => void }) {
    return React.createElement('div', { 'data-testid': 'hardware-wallet-mock' }, 'Hardware Wallet Mock');
  },
}));

// Stub @mui/material barrel to prevent 1200+ VM modules from loading in ESM mode.
// These passthrough stubs preserve rendered text so assertions on content still pass.
await jest.unstable_mockModule('@mui/material', () => ({
  Stepper: ({ children }: { children?: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'stepper' }, children),
  Step: ({ children }: { children?: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'step' }, children),
  StepLabel: ({ children }: { children?: React.ReactNode }) =>
    React.createElement('div', { className: 'step-label' }, children),
  Box: ({ children }: { children?: React.ReactNode }) =>
    React.createElement('div', null, children),
  Typography: ({ children }: { children?: React.ReactNode }) =>
    React.createElement('span', null, children),
  CircularProgress: () =>
    React.createElement('span', { 'data-testid': 'loading-spinner' }),
  Collapse: ({ children }: { children?: React.ReactNode }) =>
    React.createElement('div', null, children),
}));

await jest.unstable_mockModule('../../components/DesignSystem', () => ({
  WrfButton: ({
    children,
    onClick,
    disabled,
    loading,
    type,
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    loading?: boolean;
    type?: string;
  }) =>
    React.createElement('button', { onClick, disabled: disabled || loading, type }, children),
  WrfCard: ({ children, headerTitle, onClick }: { children?: React.ReactNode; headerTitle?: string; onClick?: () => void }) =>
    React.createElement('div', { onClick }, headerTitle && React.createElement('div', null, headerTitle), children),
  WrfAlert: ({
    children,
    title,
    severity,
  }: {
    children?: React.ReactNode;
    title?: string;
    severity?: string;
  }) =>
    React.createElement(
      'div',
      { role: 'alert', 'data-severity': severity },
      title && React.createElement('strong', null, title),
      children,
    ),
  WrfInput: ({
    value,
    onChange,
    placeholder,
    label,
    type,
    id,
  }: {
    value?: string;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    placeholder?: string;
    label?: string;
    type?: string;
    id?: string;
  }) =>
    React.createElement('input', {
      value,
      onChange,
      placeholder: placeholder ?? label,
      type: type ?? 'text',
      id,
    }),
  WrfThemeProvider: ({ children }: { children?: React.ReactNode }) =>
    React.createElement('div', null, children),
}));

await jest.unstable_mockModule('../../components/auth/SocialLoginButton', () => ({
  SocialLoginButton: ({ label, onClick }: { label?: string; onClick?: () => void }) =>
    React.createElement('button', { onClick }, label ?? 'Social Login'),
  default: ({ label, onClick }: { label?: string; onClick?: () => void }) =>
    React.createElement('button', { onClick }, label ?? 'Social Login'),
}));

global.fetch = jest.fn() as typeof global.fetch;

global.fetch = jest.fn() as typeof global.fetch;

const { createWebLocksStub, installWebLocks } = await import('../../services/__fixtures__/webLocksStub.ts');
// A browser with WebCrypto (a secure context) also has Web Locks; jsdom has neither.
installWebLocks(createWebLocksStub());

const { walletManager } = await import('../../utils/walletUtils.ts');
const { unlockVault, readVault, clearVault, saveVault, VAULT_UNSUPPORTED_MESSAGE } = await import('../../services/walletVault.ts');
const { deriveAccount } = await import('../../services/walletCrypto/firstPartyKeys.ts');
const { default: OnboardingPage } = await import('../OnboardingPage');

async function createWith(password: string) {
  jest.spyOn(walletManager, 'generateNewMnemonic').mockResolvedValue(VECTOR.mnemonic);
  render(React.createElement(MemoryRouter, null, React.createElement(OnboardingPage)));
  fireEvent.click(await screen.findByText('Create New Wallet'));
  fireEvent.change(screen.getByPlaceholderText('My WRFCoin Wallet'), { target: { value: 'Mine' } });
  fireEvent.change(screen.getByPlaceholderText('At least 8 characters'), { target: { value: password } });
  fireEvent.change(screen.getByPlaceholderText('Re-enter your password'), { target: { value: password } });
  fireEvent.click(screen.getByText('Generate Mnemonic'));
  await screen.findByText('Your Recovery Phrase');
  fireEvent.click(screen.getByLabelText(/I agree to the Terms/));
  fireEvent.click(screen.getByText('Create Wallet'));
}

describe('onboarding Create New Wallet (frontend#438)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    connected.length = 0;
    loginFails = false;
    importCustomWallet.mockClear();
  });

  it('the shared vector really is an empty-passphrase vector, and a password-salted key would differ', () => {
    expect(VECTOR.passphrase).toBe('');
    expect(deriveAccount(VECTOR.mnemonic).address).toBe(VECTOR.address);
    expect(deriveAccount(VECTOR.mnemonic, 'correct horse 1').address).not.toBe(VECTOR.address);
  });

  it.each(['correct horse 1', 'another password 2'])(
    'with password %p: the vault and the connected wallet hold the vector address; the password unlocks only the words',
    async (password) => {
      await createWith(password);
      await waitFor(() => {
        expect(screen.queryByText(/Failed to create wallet/)).toBeNull();
        expect(readVault()?.address).toBe(VECTOR.address);
      }, { timeout: 15000 });
      // The created wallet is connected AND signed in through connectWallet (never importCustomWallet).
      await waitFor(() => expect(connected).toEqual([{ type: 'custom', address: VECTOR.address, mnemonic: VECTOR.mnemonic }]));
      expect(importCustomWallet).not.toHaveBeenCalled();
      expect(await unlockVault(password)).toEqual({ mnemonic: VECTOR.mnemonic, address: VECTOR.address });
      await expect(unlockVault('not the password')).rejects.toThrow('Wrong password');
      // Nothing in storage holds the words in clear, and the old plain record is not written.
      const stored = JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage });
      expect(stored).not.toContain(VECTOR.mnemonic.split(' ').slice(0, 3).join(' '));
      expect(localStorage.getItem('wrfcoin_wallet')).toBeNull();
      expect(screen.queryByText(/Failed to create wallet/)).toBeNull();
      clearVault();
    },
    30000,
  );

  it('says the password only locks this browser\'s copy', async () => {
    await createWith('correct horse 1');
    expect(screen.getByText(/only locks this browser.s copy of your wallet. It is not part of your recovery/)).toBeInTheDocument();
  });

  it('a refused sign-in keeps the saved copy and says how to retry; the step does not advance', async () => {
    loginFails = true;
    await createWith('correct horse 1');
    await screen.findByText(/saved in this browser, but signing in failed/, undefined, { timeout: 15000 });
    expect(readVault()?.address).toBe(VECTOR.address);
    expect(connected).toEqual([]);
    clearVault();
  }, 30000);

  it('without WebCrypto (not a secure context) it says so plainly and stores nothing', async () => {
    const subtle = globalThis.crypto.subtle;
    Object.defineProperty(globalThis.crypto, 'subtle', { value: undefined, configurable: true });
    try {
      await createWith('correct horse 1');
      expect(await screen.findByText(VAULT_UNSUPPORTED_MESSAGE)).toBeInTheDocument();
      expect(screen.queryByText(/Failed to create wallet. Please try again/)).toBeNull();
      // Only the onboarding progress record may exist: no vault, no plain wallet record, no word anywhere.
      expect(localStorage.getItem('wrfcoin_wallet_vault_v1')).toBeNull();
      expect(localStorage.getItem('wrfcoin_wallet')).toBeNull();
      const stored = JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage });
      for (const word of new Set(VECTOR.mnemonic.split(' '))) expect(stored).not.toContain(word);
      expect(connected).toEqual([]);
    } finally {
      Object.defineProperty(globalThis.crypto, 'subtle', { value: subtle, configurable: true });
    }
  }, 30000);
});

describe('onboarding unlocks the wallet saved in this browser (frontend#438 review P1)', () => {
  const unlockWith = async (password: string) => {
    render(React.createElement(MemoryRouter, null, React.createElement(OnboardingPage)));
    fireEvent.change(await screen.findByPlaceholderText('Password for this browser\'s copy'), { target: { value: password } });
    fireEvent.click(screen.getByText('Unlock'));
  };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    connected.length = 0;
    loginFails = false;
  });

  it('no saved wallet: no unlock offer', async () => {
    render(React.createElement(MemoryRouter, null, React.createElement(OnboardingPage)));
    await screen.findByText('Create New Wallet');
    expect(screen.queryByText('Unlock the wallet saved in this browser')).toBeNull();
  });

  it('the right password unlocks, the words are checked against the address, and the wallet signs in', async () => {
    await saveVault(VECTOR.mnemonic, VECTOR.address, 'correct horse 1');
    await unlockWith('correct horse 1');
    await waitFor(() => expect(connected).toEqual([{ type: 'custom', address: VECTOR.address, mnemonic: VECTOR.mnemonic }]),
      { timeout: 15000 });
    expect(screen.getByText(VECTOR.address)).toBeInTheDocument();
  }, 30000);

  it('a wrong password is refused and nothing connects', async () => {
    await saveVault(VECTOR.mnemonic, VECTOR.address, 'correct horse 1');
    await unlockWith('not the password');
    await screen.findByText('Wrong password.', undefined, { timeout: 15000 });
    expect(connected).toEqual([]);
  }, 30000);

  it('a saved copy whose words do not derive its address is never used', async () => {
    const OTHER = '0x' + '22'.repeat(20);
    await saveVault(VECTOR.mnemonic, OTHER, 'correct horse 1');
    await unlockWith('correct horse 1');
    await screen.findByText(/does not match its address/, undefined, { timeout: 15000 });
    expect(connected).toEqual([]);
  }, 30000);

  it('a refused sign-in after unlocking says so and connects nothing', async () => {
    await saveVault(VECTOR.mnemonic, VECTOR.address, 'correct horse 1');
    loginFails = true;
    await unlockWith('correct horse 1');
    await screen.findByText('Signing in failed. Please try again.', undefined, { timeout: 15000 });
    expect(connected).toEqual([]);
  }, 30000);
});
