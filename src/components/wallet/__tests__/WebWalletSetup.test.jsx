import React from 'react';
import { jest } from '@jest/globals';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { webcrypto, createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createWebLocksStub, installWebLocks } from '../../../services/__fixtures__/webLocksStub';
// Each flow runs real BIP-39/KDF work: measured 2.7-5.2 s per test on origin/main when isolated,
// so the 5 s default is marginal under full-suite load. Budget is a timing limit, not a behavior one.
jest.setTimeout(30000);
const restoreLocks = installWebLocks(createWebLocksStub());
afterAll(restoreLocks);
import { ed25519 } from '@noble/curves/ed25519.js';
Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
const { Mnemonic, sha256 } = await import('ethers');
// ethers' Node SHA implementation returns a foreign-realm Buffer in jsdom.
// Preserve real SHA-256, copying its result to this realm for BytesLike checks.
sha256.register(data => new Uint8Array(createHash('sha256').update(data).digest()));
afterAll(() => sha256.register(sha256._));
it('validates the published BIP-39 vector with the real checksum implementation', () => { expect(Mnemonic.phraseToEntropy(vector.mnemonic)).toBe('0x' + '00'.repeat(16)); });
const vector = JSON.parse(readFileSync('contract-fixtures/wallet-key-scheme-vector.json', 'utf8'));
const password = 'synthetic-browser-password';
const { getAuthToken, setAuthToken, clearAuthToken } = await import('../../../services/authTokenStore');
const login = jest.fn();
const clearSession = jest.fn(() => clearAuthToken());
await jest.unstable_mockModule('../../../services/walletAuthService.ts', () => ({
  clearWalletAuthSession: clearSession, loginWalletWithEd25519: login,
  loginWalletWithSigner: jest.fn(async () => { throw new Error('Unexpected EVM login'); }),
}));
await jest.unstable_mockModule('../../../services/apiClient/index.ts', () => ({ walletService: { getBalance: jest.fn(async () => ({ balance: '0' })) }, stationRegistrationService: { getMobileStationStatus: jest.fn(async () => { throw new Error('unavailable'); }) }, weatherService: { getStationOwnership: jest.fn(async () => { throw new Error('unavailable'); }) } }));
const { WalletProvider } = await import('../../../contexts/WalletContext.jsx');
const { walletProviderManager } = await import('../../../services/walletProviders/WalletProviderManager.js');
const { walletManager } = await import('../../../utils/walletUtils.ts');
const { readVault, saveVault, unlockVault, VAULT_UNSUPPORTED_MESSAGE } = await import('../../../services/walletVault');
const secureStorage = await import('../../../services/secureWalletStorage');
const { getSecureWallet } = secureStorage;
const { default: EncryptionService } = await import('../../../services/encryptionService');
let storageWrites;
const { default: WebWalletSetup } = await import('../WebWalletSetup');
const { default: PublicWalletSetupProvider } = await import('../PublicWalletSetupProvider');
const { default: FirstPartyWalletProvider } = await import('../FirstPartyWalletProvider');
const { default: OwnWalletAddress } = await import('../../../pages/OwnWalletAddress');
const { MemoryRouter } = await import('react-router-dom');
const done = jest.fn();
const mount = () => render(<WalletProvider passive={false}><WebWalletSetup onComplete={done} /></WalletProvider>);
const fillPassword = () => {
  fireEvent.change(screen.getByLabelText('Browser password'), { target: { value: password } });
  fireEvent.change(screen.getByLabelText('Confirm browser password'), { target: { value: password } });
};
const prepare = async (mode = 'create') => {
  fireEvent.click(screen.getByRole('button', { name: mode === 'create' ? 'Create New Wallet' : 'Import Recovery Phrase' }));
  fillPassword();
  if (mode === 'import') fireEvent.change(screen.getByLabelText('Recovery phrase'), { target: { value: vector.mnemonic } });
  fireEvent.click(screen.getByRole('button', { name: mode === 'create' ? 'Generate Recovery Words' : 'Review Backup' }));
  await screen.findByRole('heading', { name: 'Back up your recovery words' });
};
const verify = () => {
  fireEvent.click(screen.getByRole('button', { name: 'I have written down my words' }));
  expect(screen.queryByRole('list', { name: 'Recovery words' })).toBeNull();
  fireEvent.change(screen.getByLabelText('Verify your backup'), { target: { value: vector.mnemonic } });
  fireEvent.click(screen.getByRole('checkbox'));
};
// Check raw keys/values and the session payload decryptable with a key in
// the same storage. Ciphertext in the password-derived vault is allowed.
const assertPublicStorageOnly = () => {
  const written = new Map();
  for (const [key, value] of storageWrites.mock.calls) {
    expect(key).not.toMatch(/mnemonic|private.?key|seed|passphrase/i);
    expect(value).not.toContain(vector.mnemonic);
    expect(value).not.toContain(password);
    expect(value).not.toMatch(/"(?:mnemonic|privateKey|seed|passphrase)"\s*:/i);
    written.set(key, value);
    if (key === 'wrfcoin_wallet_secure' || key === 'wrfcoin_wallet_imported_secure') {
      const secret = written.get('wrfcoin_wallet_session_secret') || sessionStorage.getItem('wrfcoin_wallet_session_secret');
      const payload = JSON.parse(EncryptionService.decrypt(JSON.parse(value), secret));
      expect(Object.keys(payload).sort()).toEqual(['address', 'publicKey']);
    }
  }
  for (const storage of [localStorage, sessionStorage]) {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      const value = storage.getItem(key);
      expect(key).not.toMatch(/mnemonic|private.?key|seed|passphrase/i);
      expect(value).not.toContain(vector.mnemonic);
      expect(value).not.toContain(password);
      expect(value).not.toMatch(/"(?:mnemonic|privateKey|seed|passphrase)"\s*:/i);
    }
  }
  const session = getSecureWallet();
  if (session) {
    expect(Object.keys(session).sort()).toEqual(['address', 'publicKey']);
    expect(session.address).toBe(vector.address);
    expect(session.publicKey).toMatch(/^[0-9a-f]{64}$/);
  }
  expect(secureStorage.getSecureImportedWallet()).toBeNull();
};
beforeEach(async () => {
  storageWrites = jest.spyOn(Storage.prototype, 'setItem');
  jest.spyOn(Date, 'now').mockReturnValue(Date.UTC(2026, 9, 2, 12));
  await walletProviderManager.disconnect(); localStorage.clear(); sessionStorage.clear(); done.mockClear(); login.mockReset(); clearSession.mockClear(); setAuthToken('synthetic-previous-login');
  jest.spyOn(walletManager, 'generateNewMnemonic').mockResolvedValue(vector.mnemonic);
  jest.spyOn(walletProviderManager, 'autoConnect').mockResolvedValue(null);
  jest.spyOn(console, 'error').mockImplementation(() => {});
  walletProviderManager.getProvider('custom').config = { chainId: '777', walletAuthOrigin: 'https://wallet.example.invalid', walletAuthChainId: '777', walletAuthNetwork: 'testnet' };
  login.mockImplementation(async (address, publicKey, sign) => {
    // First activation must discard the prior session. A same-tab route
    // remount can authenticate the already-unlocked account again.
    expect(getAuthToken()).toBe(login.mock.calls.length > 1 ? `synthetic-login:${address}` : '');
    const now = Date.now();
    const message = ['wrfcoin_wallet_login_ed25519_v1', 'wallet.example.invalid wants you to sign in with your WRFCoin ed25519 account:', address, '', 'Sign in to WRFCoin Testnet.', '', 'URI: https://wallet.example.invalid', 'Version: 1', 'Scheme: ed25519', 'Chain ID: 777', 'Network: testnet', `Nonce: ${'ab'.repeat(32)}`, `Issued At: ${new Date(now - 1000).toISOString()}`, `Expiration Time: ${new Date(now + 60000).toISOString()}`].join('\n');
    const signature = await sign(message);
    const fromHex = hex => Uint8Array.from(hex.match(/.{2}/g), b => parseInt(b, 16));
    expect(ed25519.verify(fromHex(signature), new TextEncoder().encode(message), fromHex(publicKey))).toBe(true);
    setAuthToken(`synthetic-login:${address}`);
    return { token: 'synthetic-login-token' };
  });
});
afterEach(async () => { cleanup(); await walletProviderManager.disconnect(); walletManager.lockWallet(); clearAuthToken(); jest.restoreAllMocks(); localStorage.clear(); sessionStorage.clear(); });

it.each(['create', 'import'])('%s persists and activates the canonical wallet only after the hidden-word backup check', async mode => {
  mount(); const create = jest.spyOn(walletManager, 'createWalletFromMnemonic');
  await prepare(mode);
  assertPublicStorageOnly();
  expect(create).not.toHaveBeenCalled(); expect(readVault()).toBeNull(); expect(login).not.toHaveBeenCalled(); expect(done).not.toHaveBeenCalled();
  verify(); fireEvent.click(screen.getByRole('button', { name: 'Save and Connect Wallet' }));
  await waitFor(() => expect(done).toHaveBeenCalledWith(vector.address));
  expect(walletProviderManager.getLoginIdentity().address).toBe(vector.address);
  expect(login).toHaveBeenCalledTimes(1);
  expect(getAuthToken()).toBe(`synthetic-login:${vector.address}`);
  expect(getSecureWallet().address).toBe(vector.address);
  assertPublicStorageOnly();
  expect((await unlockVault(password)).mnemonic).toBe(vector.mnemonic);
  const stored = JSON.stringify({ ...localStorage });
  expect(stored).not.toContain(vector.mnemonic); expect(stored).not.toContain(password);
});
it('wrong backup words and missing acknowledgement cannot save or connect', async () => {
  mount(); await prepare();
  fireEvent.click(screen.getByRole('button', { name: 'I have written down my words' }));
  fireEvent.change(screen.getByLabelText('Verify your backup'), { target: { value: vector.mnemonic } });
  expect(screen.getByRole('button', { name: 'Save and Connect Wallet' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Save and Connect Wallet' }));
  expect(readVault()).toBeNull(); expect(login).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.change(screen.getByLabelText('Verify your backup'), { target: { value: 'abandon '.repeat(12).trim() } });
  expect(screen.getByRole('button', { name: 'Save and Connect Wallet' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Save and Connect Wallet' }));
  expect(readVault()).toBeNull(); expect(login).not.toHaveBeenCalled(); expect(done).not.toHaveBeenCalled();
});
it('cancel discards generated words without persistence or activation', async () => {
  mount(); await prepare(); fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(screen.queryByRole('list')).toBeNull(); expect(readVault()).toBeNull(); expect(getSecureWallet()).toBeNull(); expect(login).not.toHaveBeenCalled();
});
it('rejects an import with the right word count and wrong checksum', async () => {
  mount(); fireEvent.click(screen.getByRole('button', { name: 'Import Recovery Phrase' })); fillPassword();
  fireEvent.change(screen.getByLabelText('Recovery phrase'), { target: { value: 'abandon '.repeat(12).trim() } });
  fireEvent.click(screen.getByRole('button', { name: 'Review Backup' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('checksum'); expect(readVault()).toBeNull(); expect(login).not.toHaveBeenCalled();
});
it('authentication refusal keeps the encrypted backup but does not complete or retain an active wallet', async () => {
  login.mockRejectedValue(new Error('Synthetic login unavailable'));
  mount(); await prepare(); verify(); fireEvent.click(screen.getByRole('button', { name: 'Save and Connect Wallet' }));
  await screen.findByRole('button', { name: 'Unlock Wallet' });
  expect(done).not.toHaveBeenCalled(); expect(walletProviderManager.getActiveProvider()).toBeNull(); expect(getSecureWallet()).toBeNull();
  expect((await unlockVault(password)).address).toBe(vector.address);
});
it('a returning browser unlocks its real words and signing account with the vault password', async () => {
  await saveVault(vector.mnemonic, vector.address, password); mount();
  fireEvent.change(screen.getByLabelText('Browser password'), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: 'Unlock Wallet' }));
  await waitFor(() => expect(done).toHaveBeenCalledWith(vector.address)); expect(login).toHaveBeenCalledTimes(1);
  assertPublicStorageOnly();
});
it('a changed public vault address cannot be presented as the recovered signing address', async () => {
  await saveVault(vector.mnemonic, `0x${'1'.repeat(40)}`, password); mount();
  fireEvent.change(screen.getByLabelText('Browser password'), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: 'Unlock Wallet' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('does not match'); expect(login).not.toHaveBeenCalled(); expect(done).not.toHaveBeenCalled();
});

it('a wrong vault password never connects or completes', async () => {
  await saveVault(vector.mnemonic, vector.address, password); mount();
  fireEvent.change(screen.getByLabelText('Browser password'), { target: { value: 'synthetic-wrong-password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Unlock Wallet' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Check your password');
  expect(login).not.toHaveBeenCalled(); expect(done).not.toHaveBeenCalled(); expect(getSecureWallet()).toBeNull();
});

it('retains the migration notice for password-salted legacy address metadata', () => {
  localStorage.setItem('wrfcoin_wallet', JSON.stringify({ type: 'created', address: `0x${'1'.repeat(40)}` }));
  mount();
  expect(screen.getByRole('note')).toHaveTextContent('12 words alone do NOT restore that address');
  expect(login).not.toHaveBeenCalled(); expect(done).not.toHaveBeenCalled();
});

const withoutVaultCrypto = async task => {
  Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true });
  try { await task(); }
  finally { Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true }); }
};

it.each([undefined, { getRandomValues: webcrypto.getRandomValues.bind(webcrypto) }])('an unsupported browser exposes no wallet creation, import or secret fields (%p)', async cryptoValue => {
  Object.defineProperty(globalThis, 'crypto', { value: cryptoValue, configurable: true });
  try {
    mount();
    expect(screen.getByRole('alert')).toHaveTextContent(VAULT_UNSUPPORTED_MESSAGE);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByLabelText(/password|recovery|backup/i)).toBeNull();
    expect(walletManager.generateNewMnemonic).not.toHaveBeenCalled();
    expect(readVault()).toBeNull(); expect(login).not.toHaveBeenCalled(); expect(done).not.toHaveBeenCalled();
  } finally { Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true }); }
});

it('an unsupported browser preserves a stored encrypted vault and offers no unlock fields', async () => {
  await saveVault(vector.mnemonic, vector.address, password);
  const before = localStorage.getItem('wrfcoin_wallet_vault_v1');
  await withoutVaultCrypto(async () => {
    mount();
    expect(screen.getByRole('alert')).toHaveTextContent(VAULT_UNSUPPORTED_MESSAGE);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByLabelText('Browser password')).toBeNull();
    expect(localStorage.getItem('wrfcoin_wallet_vault_v1')).toBe(before);
    expect(login).not.toHaveBeenCalled(); expect(done).not.toHaveBeenCalled();
  });
});

it('losing encryption support before generation never exposes recovery words', async () => {
  mount(); fireEvent.click(screen.getByRole('button', { name: 'Create New Wallet' })); fillPassword();
  await withoutVaultCrypto(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Generate Recovery Words' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(VAULT_UNSUPPORTED_MESSAGE);
    expect(screen.queryByRole('list', { name: 'Recovery words' })).toBeNull();
    expect(walletManager.generateNewMnemonic).not.toHaveBeenCalled();
    expect(readVault()).toBeNull(); expect(login).not.toHaveBeenCalled(); expect(done).not.toHaveBeenCalled();
  });
});

it('losing encryption support at backup confirmation refuses before wallet derivation', async () => {
  mount(); await prepare(); verify();
  const derive = jest.spyOn(walletManager, 'createWalletFromMnemonic');
  await withoutVaultCrypto(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Save and Connect Wallet' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(VAULT_UNSUPPORTED_MESSAGE);
    expect(derive).not.toHaveBeenCalled(); expect(readVault()).toBeNull();
    expect(login).not.toHaveBeenCalled(); expect(done).not.toHaveBeenCalled();
  });
});

it('losing encryption support before unlock reports the unsupported message and preserves the vault', async () => {
  await saveVault(vector.mnemonic, vector.address, password); mount();
  const before = localStorage.getItem('wrfcoin_wallet_vault_v1');
  fireEvent.change(screen.getByLabelText('Browser password'), { target: { value: password } });
  await withoutVaultCrypto(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Unlock Wallet' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(VAULT_UNSUPPORTED_MESSAGE);
    expect(localStorage.getItem('wrfcoin_wallet_vault_v1')).toBe(before);
    expect(login).not.toHaveBeenCalled(); expect(done).not.toHaveBeenCalled();
  });
});

it('without Web Locks a supported encryption browser cannot create or import', () => {
  const restore = installWebLocks(undefined);
  try {
    mount();
    expect(screen.getByRole('alert')).toHaveTextContent(VAULT_UNSUPPORTED_MESSAGE);
    expect(screen.queryByRole('button')).toBeNull();
    expect(walletManager.generateNewMnemonic).not.toHaveBeenCalled();
    expect(readVault()).toBeNull(); expect(login).not.toHaveBeenCalled();
  } finally { restore(); }
});

it('an unsupported browser leaves the legacy record unread and renders the vault notice', async () => {
  const legacy = JSON.stringify({ type: 'created', address: 'synthetic-legacy-address' });
  localStorage.setItem('wrfcoin_wallet', legacy);
  const readLegacy = jest.spyOn(Storage.prototype, 'getItem');
  await withoutVaultCrypto(async () => {
    mount();
    expect(screen.getByRole('alert')).toHaveTextContent(VAULT_UNSUPPORTED_MESSAGE);
    expect(readLegacy.mock.calls.some(([key]) => key === 'wrfcoin_wallet')).toBe(false);
  });
  expect(localStorage.getItem('wrfcoin_wallet')).toBe(legacy);
});

it('a retained public session signs only after an explicit successful vault unlock', async () => {
  walletProviderManager.autoConnect.mockRestore();
  await saveVault(vector.mnemonic, vector.address, password);
  secureStorage.setSecureWallet({ address: vector.address, mnemonic: vector.mnemonic, passphrase: '' });
  secureStorage.setActiveProvider('custom');
  render(<PublicWalletSetupProvider><WebWalletSetup onComplete={done} /></PublicWalletSetupProvider>);
  await screen.findByRole('button', { name: 'Unlock Wallet' });
  expect(login).not.toHaveBeenCalled();
  expect(getAuthToken()).toBe('');
  expect(walletProviderManager.getLoginIdentity()).toBeNull();
  expect(sessionStorage.getItem('wrfcoin_wallet_secure')).toBeNull();
  fireEvent.change(screen.getByLabelText('Browser password'), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: 'Unlock Wallet' }));
  await waitFor(() => expect(done).toHaveBeenCalledWith(vector.address));
  expect(login).toHaveBeenCalledTimes(1);
  expect(walletProviderManager.getLoginIdentity().address).toBe(vector.address);
});

it('losing Web Locks after backup refuses before derivation or persistence', async () => {
  mount(); await prepare(); verify();
  const derive = jest.spyOn(walletManager, 'createWalletFromMnemonic');
  const restore = installWebLocks(undefined);
  try {
    fireEvent.click(screen.getByRole('button', { name: 'Save and Connect Wallet' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(VAULT_UNSUPPORTED_MESSAGE);
    expect(derive).not.toHaveBeenCalled(); expect(readVault()).toBeNull();
    expect(login).not.toHaveBeenCalled(); expect(done).not.toHaveBeenCalled();
  } finally { restore(); }
});

it.each(['create', 'import', 'unlock'])('%s reload cannot restore a signer or login without the vault password', async mode => {
  walletProviderManager.autoConnect.mockRestore();
  if (mode === 'unlock') await saveVault(vector.mnemonic, vector.address, password);
  render(<PublicWalletSetupProvider><WebWalletSetup onComplete={done} /></PublicWalletSetupProvider>);
  if (mode === 'unlock') {
    await screen.findByRole('button', { name: 'Unlock Wallet' });
    fireEvent.change(screen.getByLabelText('Browser password'), { target: { value: password } });
    fireEvent.click(screen.getByRole('button', { name: 'Unlock Wallet' }));
  } else {
    await screen.findByRole('button', { name: 'Create New Wallet' });
    await prepare(mode); assertPublicStorageOnly(); verify();
    fireEvent.click(screen.getByRole('button', { name: 'Save and Connect Wallet' }));
  }
  await waitFor(() => expect(done).toHaveBeenCalledWith(vector.address));
  expect(login).toHaveBeenCalledTimes(1);
  assertPublicStorageOnly();
  // Model fresh process memory with the retained browser storage. Provider
  // disconnect itself clears the selector, so restore that public selector.
  cleanup(); await walletProviderManager.disconnect(); walletManager.lockWallet();
  secureStorage.setActiveProvider('custom'); login.mockClear(); clearAuthToken(); done.mockClear();
  const reloadConnect = jest.spyOn(walletProviderManager, 'autoConnect');
  render(<MemoryRouter><FirstPartyWalletProvider><OwnWalletAddress /></FirstPartyWalletProvider></MemoryRouter>);
  await screen.findByText('Create, import or unlock your wallet');
  await waitFor(() => expect(reloadConnect).toHaveBeenCalled());
  const restored = await reloadConnect.mock.results[0].value;
  expect(restored.receiveOnly).toBe(true);
  await waitFor(() => expect(walletProviderManager.getActiveProvider()).toBeNull());
  reloadConnect.mockRestore();
  expect(walletProviderManager.getLoginIdentity()).toBeNull();
  expect(login).not.toHaveBeenCalled();
  expect(screen.queryByLabelText('Your WRFCoin address')).toBeNull();
  assertPublicStorageOnly();
  cleanup();
  render(<PublicWalletSetupProvider><WebWalletSetup onComplete={done} /></PublicWalletSetupProvider>);
  await screen.findByRole('button', { name: 'Unlock Wallet' });
  expect(login).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Browser password'), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: 'Unlock Wallet' }));
  await waitFor(() => expect(done).toHaveBeenCalledWith(vector.address));
  expect(login).toHaveBeenCalledTimes(1); assertPublicStorageOnly();
}, 20_000);

it('same-tab wallet navigation preserves the explicitly unlocked signing identity', async () => {
  walletProviderManager.autoConnect.mockRestore();
  render(<PublicWalletSetupProvider><WebWalletSetup onComplete={done} /></PublicWalletSetupProvider>);
  await screen.findByRole('button', { name: 'Create New Wallet' });
  await prepare('import'); verify(); fireEvent.click(screen.getByRole('button', { name: 'Save and Connect Wallet' }));
  await waitFor(() => expect(done).toHaveBeenCalledWith(vector.address));
  expect(walletProviderManager.getLoginIdentity().address).toBe(vector.address);
  const provider = walletProviderManager.getActiveProvider();
  expect(provider.signingAccount).toBeNull();
  expect(provider.getWalletInfo()).toEqual({ address: vector.address });
  await expect(provider.signMessage('arbitrary')).rejects.toThrow('do not sign arbitrary');
  await expect(provider.sendTransaction({ to: vector.address, amount: '1' })).rejects.toThrow('password-confirmed');
  assertPublicStorageOnly();
  // Route remount without a process reload: no disconnect or memory lock.
  cleanup();
  render(<MemoryRouter><FirstPartyWalletProvider><OwnWalletAddress /></FirstPartyWalletProvider></MemoryRouter>);
  expect(await screen.findByLabelText('Your WRFCoin address')).toHaveTextContent(vector.address);
  expect(walletProviderManager.getLoginIdentity().address).toBe(vector.address);
  assertPublicStorageOnly();
});

it.each(['lock', 'changed-public-address'])('a %s cannot resume an earlier in-memory signer', async reason => {
  walletProviderManager.autoConnect.mockRestore();
  await saveVault(vector.mnemonic, vector.address, password);
  render(<PublicWalletSetupProvider><WebWalletSetup onComplete={done} /></PublicWalletSetupProvider>);
  await screen.findByRole('button', { name: 'Unlock Wallet' });
  fireEvent.change(screen.getByLabelText('Browser password'), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: 'Unlock Wallet' }));
  await waitFor(() => expect(done).toHaveBeenCalledWith(vector.address));
  cleanup(); login.mockClear();
  if (reason === 'lock') walletManager.lockWallet();
  else secureStorage.setSecureWallet({ address: `0x${'1'.repeat(40)}`, publicKey: getSecureWallet().publicKey });
  const reconnect = jest.spyOn(walletProviderManager, 'autoConnect');
  render(<MemoryRouter><FirstPartyWalletProvider><OwnWalletAddress /></FirstPartyWalletProvider></MemoryRouter>);
  await waitFor(() => expect(reconnect).toHaveBeenCalled());
  expect((await reconnect.mock.results[0].value).receiveOnly).toBe(true);
  await waitFor(() => expect(walletProviderManager.getActiveProvider()).toBeNull());
  expect(walletProviderManager.getLoginIdentity()).toBeNull(); expect(login).not.toHaveBeenCalled();
  expect(screen.queryByLabelText('Your WRFCoin address')).toBeNull();
});
