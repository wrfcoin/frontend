/** @jest-environment jsdom */
// frontend#438: the web wallet's password vault. The words are the wallet (empty BIP-39 passphrase); the
// password only encrypts this browser's copy (AES-GCM under PBKDF2-SHA256, 600,000 iterations).
import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';

// jsdom's crypto has getRandomValues but no subtle; browsers (in a secure context) have both.
Object.defineProperty(globalThis.crypto, 'subtle', { value: webcrypto.subtle, configurable: true });

const VECTOR = JSON.parse(readFileSync('contract-fixtures/wallet-key-scheme-vector.json', 'utf8')) as {
  mnemonic: string; address: string;
};
const vault = await import('../walletVault.ts');
const { createWebLocksStub, installWebLocks } = await import('../__fixtures__/webLocksStub.ts');

// Browsers with WebCrypto (a secure context) also have Web Locks; jsdom has neither. One shared manager.
let uninstallLocks: () => void = () => {};
beforeAll(() => { uninstallLocks = installWebLocks(createWebLocksStub()); });
afterAll(() => uninstallLocks());
const { CustomWalletProvider } = await import('../walletProviders/CustomWalletProvider.js');

describe('wallet vault (frontend#438)', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips the words; a wrong password fails the authenticated decryption', async () => {
    await vault.saveVault(VECTOR.mnemonic, VECTOR.address, 'correct horse 1');
    expect(await vault.unlockVault('correct horse 1')).toEqual({ mnemonic: VECTOR.mnemonic, address: VECTOR.address });
    await expect(vault.unlockVault('correct horse 2')).rejects.toThrow('Wrong password');
  }, 30000);

  it('stores no word in clear, uses a fresh salt and IV each time, and at least 600,000 iterations', async () => {
    await vault.saveVault(VECTOR.mnemonic, VECTOR.address, 'correct horse 1');
    const first = vault.readVault();
    const raw = localStorage.getItem('wrfcoin_wallet_vault_v1') as string;
    for (const word of new Set(VECTOR.mnemonic.split(' '))) expect(raw).not.toContain(word);
    expect(first?.kdf.iterations).toBeGreaterThanOrEqual(600000);
    await vault.saveVault(VECTOR.mnemonic, VECTOR.address, 'correct horse 1');
    const second = vault.readVault();
    expect(second?.kdf.salt).not.toBe(first?.kdf.salt);
    expect(second?.cipher.iv).not.toBe(first?.cipher.iv);
  }, 30000);

  it('a changed ciphertext is refused (GCM tag), never decrypted to other words', async () => {
    await vault.saveVault(VECTOR.mnemonic, VECTOR.address, 'correct horse 1');
    const r = vault.readVault()!;
    const ct = atob(r.ct);
    const flipped = String.fromCharCode(ct.charCodeAt(0) ^ 1) + ct.slice(1);
    localStorage.setItem('wrfcoin_wallet_vault_v1', JSON.stringify({ ...r, ct: btoa(flipped) }));
    await expect(vault.unlockVault('correct horse 1')).rejects.toThrow('Wrong password');
  }, 30000);

  it('a record weakened below the iteration floor is not read at all', async () => {
    await vault.saveVault(VECTOR.mnemonic, VECTOR.address, 'correct horse 1');
    const r = vault.readVault()!;
    localStorage.setItem('wrfcoin_wallet_vault_v1', JSON.stringify({ ...r, kdf: { ...r.kdf, iterations: 1000 } }));
    expect(vault.readVault()).toBeNull();
    await expect(vault.unlockVault('correct horse 1')).rejects.toThrow('No wallet is stored');
  }, 30000);

  it('never silently replaces another wallet; a short password is refused', async () => {
    await vault.saveVault(VECTOR.mnemonic, VECTOR.address, 'correct horse 1');
    await expect(vault.saveVault(VECTOR.mnemonic, '0x' + '22'.repeat(20), 'correct horse 1'))
      .rejects.toThrow('already holds another wallet');
    expect(vault.readVault()?.address).toBe(VECTOR.address);
    await expect(vault.saveVault(VECTOR.mnemonic, VECTOR.address, 'short')).rejects.toThrow('at least 8');
  }, 30000);
});

// SOL-A review of 4537f820: P2-1 (no lost wallet through concurrent or unreadable-record writes), P3 (the
// stored address is authenticated), P2-3 (an explicit capability error).
describe('wallet vault writes and address binding (frontend#438 review)', () => {
  const OTHER = '0x' + '22'.repeat(20);
  const KEY = 'wrfcoin_wallet_vault_v1';
  beforeEach(() => localStorage.clear());

  it('two concurrent saves of different wallets: exactly one is stored, the other is refused', async () => {
    const results = await Promise.allSettled([
      vault.saveVault(VECTOR.mnemonic, VECTOR.address, 'correct horse 1'),
      vault.saveVault(VECTOR.mnemonic, OTHER, 'correct horse 2'),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual(['fulfilled', 'rejected']);
    const refused = results.find((r) => r.status === 'rejected') as PromiseRejectedResult;
    expect(String(refused.reason)).toContain('already holds another wallet');
    const winner = results[0].status === 'fulfilled' ? VECTOR.address : OTHER;
    expect(vault.readVault()?.address).toBe(winner);
  }, 60000);

  it('a present but unreadable record (below the iteration floor) is never replaced without confirmation', async () => {
    await vault.saveVault(VECTOR.mnemonic, VECTOR.address, 'correct horse 1');
    const weakened = JSON.stringify({ ...vault.readVault()!, kdf: { ...vault.readVault()!.kdf, iterations: 1000 } });
    localStorage.setItem(KEY, weakened);
    await expect(vault.saveVault(VECTOR.mnemonic, OTHER, 'correct horse 1')).rejects.toThrow('cannot read');
    expect(localStorage.getItem(KEY)).toBe(weakened);
    localStorage.setItem(KEY, '{not json');
    await expect(vault.saveVault(VECTOR.mnemonic, VECTOR.address, 'correct horse 1')).rejects.toThrow('cannot read');
    expect(localStorage.getItem(KEY)).toBe('{not json');
    // Explicit confirmation (the caller asked the user) replaces it.
    await vault.saveVault(VECTOR.mnemonic, OTHER, 'correct horse 1', { replace: true });
    expect(vault.readVault()?.address).toBe(OTHER);
  }, 60000);

  it('a wallet written by another tab while this save derives its key is kept; this save is refused', async () => {
    const pending = vault.saveVault(VECTOR.mnemonic, VECTOR.address, 'correct horse 1');
    // Another tab (outside this tab's lock) stores its wallet before this save finishes.
    const otherTab = JSON.stringify({ written: 'by another tab' });
    await Promise.resolve();
    localStorage.setItem(KEY, otherTab);
    await expect(pending).rejects.toThrow('changed while saving');
    expect(localStorage.getItem(KEY)).toBe(otherTab);
  }, 30000);

  it('two tabs (two separately loaded vault modules) saving different wallets at once: one write, one refusal', async () => {
    let tabB: typeof vault | undefined;
    await jest.isolateModulesAsync(async () => { tabB = await import('../walletVault.ts'); });
    expect(tabB).toBeDefined();
    expect(tabB).not.toBe(vault);
    const writes = jest.spyOn(Storage.prototype, 'setItem');
    try {
      const results = await Promise.allSettled([
        vault.saveVault(VECTOR.mnemonic, VECTOR.address, 'correct horse 1'),
        tabB!.saveVault(VECTOR.mnemonic, OTHER, 'correct horse 2'),
      ]);
      expect(results.map((r) => r.status).sort()).toEqual(['fulfilled', 'rejected']);
      expect(writes.mock.calls.filter(([key]) => key === KEY)).toHaveLength(1);
    } finally {
      writes.mockRestore();
    }
  }, 60000);

  it('without Web Locks it refuses to save (no per-tab fallback that two tabs could both pass)', async () => {
    const restore = installWebLocks(undefined);
    const writes = jest.spyOn(Storage.prototype, 'setItem');
    try {
      expect(vault.vaultSupported()).toBe(false);
      const results = await Promise.allSettled([
        vault.saveVault(VECTOR.mnemonic, VECTOR.address, 'correct horse 1'),
        vault.saveVault(VECTOR.mnemonic, OTHER, 'correct horse 2'),
      ]);
      expect(results.map((r) => r.status)).toEqual(['rejected', 'rejected']);
      for (const r of results) expect(String((r as PromiseRejectedResult).reason)).toContain(vault.VAULT_UNSUPPORTED_MESSAGE);
      expect(writes.mock.calls.filter(([key]) => key === KEY)).toHaveLength(0);
    } finally {
      writes.mockRestore();
      restore();
    }
    expect(vault.vaultSupported()).toBe(true);
  }, 30000);

  it('the stored address is authenticated: editing it makes the record undecryptable', async () => {
    await vault.saveVault(VECTOR.mnemonic, VECTOR.address, 'correct horse 1');
    const r = vault.readVault()!;
    localStorage.setItem(KEY, JSON.stringify({ ...r, address: OTHER }));
    await expect(vault.unlockVault('correct horse 1')).rejects.toThrow('Wrong password');
    localStorage.setItem(KEY, JSON.stringify(r));
    expect((await vault.unlockVault('correct horse 1')).mnemonic).toBe(VECTOR.mnemonic);
  }, 60000);

  it('without WebCrypto: vaultSupported() is false and a save says why, storing nothing', async () => {
    const subtle = globalThis.crypto.subtle;
    Object.defineProperty(globalThis.crypto, 'subtle', { value: undefined, configurable: true });
    try {
      expect(vault.vaultSupported()).toBe(false);
      await expect(vault.saveVault(VECTOR.mnemonic, VECTOR.address, 'correct horse 1'))
        .rejects.toThrow(vault.VAULT_UNSUPPORTED_MESSAGE);
      expect(localStorage.getItem(KEY)).toBeNull();
    } finally {
      Object.defineProperty(globalThis.crypto, 'subtle', { value: subtle, configurable: true });
    }
    expect(vault.vaultSupported()).toBe(true);
  });
});

describe('old password-salted onboarding records (frontend#438 migration note)', () => {
  const legacy = { name: 'Mine', address: '0x' + '44'.repeat(20), type: 'created', created: '2026-09-01T00:00:00.000Z' };

  it('are detected, and only those', () => {
    expect(vault.isPasswordSaltedLegacyRecord(legacy)).toBe(true);
    expect(vault.isPasswordSaltedLegacyRecord({ ...legacy, mnemonic: VECTOR.mnemonic })).toBe(false);
    expect(vault.isPasswordSaltedLegacyRecord({ ...legacy, type: 'imported' })).toBe(false);
    expect(vault.isPasswordSaltedLegacyRecord(null)).toBe(false);
  });

  it('connect as receive-only with the exact warning; the address is kept, never re-derived', async () => {
    const provider = new CustomWalletProvider();
    const result = await provider.connect(legacy as never);
    expect(result.address).toBe(legacy.address);
    expect(result.receiveOnly).toBe(true);
    expect(result.notice).toBe(vault.LEGACY_PASSWORD_WALLET_NOTICE);
    expect(result.notice).toContain('12 words alone do NOT restore');
    expect(provider.getLoginIdentity()).toBeNull();
  });

  it('a wallet created from the words connects with signing, at the vector address, with no notice', async () => {
    const provider = new CustomWalletProvider();
    const data = (await provider.importWallet(VECTOR.mnemonic)) as { address: string };
    expect(data.address).toBe(VECTOR.address);
    expect(provider.getLoginIdentity()?.address).toBe(VECTOR.address);
  });
});
