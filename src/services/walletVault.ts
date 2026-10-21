/**
 * Password vault for the first-party web wallet (frontend#438).
 *
 * The recovery words are the wallet: they are derived with the EMPTY BIP-39 passphrase, so the 12 words
 * alone restore the same address everywhere (the shared cross-wallet vector). The password the user picks
 * on this site only encrypts this browser's copy of the words, and never enters the key.
 *
 * Storage: one record in localStorage, AES-GCM 256 under a PBKDF2-SHA256 key (600,000 iterations, random
 * 16-byte salt, random 12-byte IV). The record holds the public address in clear (so the site can show
 * which wallet is locked) and the words encrypted; nothing else. The words are never sent anywhere. The
 * address is bound to the ciphertext as AES-GCM additional data, so a record whose address was edited does
 * not decrypt.
 *
 * Writes never lose a stored wallet silently: a record that is present but unreadable counts as occupied,
 * every save holds the Web Locks lock shared by all tabs of this site, and the stored value must be unchanged
 * between the check and the write. localStorage itself has no cross-tab locking, so a browser without Web
 * Locks cannot save here at all (it never falls back to a per-tab queue, which two tabs could both pass).
 * Web Locks, like WebCrypto, exists in every current browser in a secure context (https or localhost).
 */

const VAULT_KEY = 'wrfcoin_wallet_vault_v1';
export const VAULT_ITERATIONS = 600_000;
const SCHEME = 'ed25519-slip10-master-v1';

export interface WalletVaultRecord {
  v: 1;
  scheme: typeof SCHEME;
  address: string;
  kdf: { name: 'PBKDF2'; hash: 'SHA-256'; iterations: number; salt: string };
  cipher: { name: 'AES-GCM'; iv: string };
  ct: string;
}

const b64 = (bytes: Uint8Array): string => btoa(String.fromCharCode(...bytes));
const unb64 = (text: string): Uint8Array<ArrayBuffer> => new Uint8Array(Array.from(atob(text), (c) => c.charCodeAt(0)));

/**
 * Shown when the browser cannot store the words safely: WebCrypto and Web Locks exist only in a secure context
 * (https or localhost), in a current browser.
 */
export const VAULT_UNSUPPORTED_MESSAGE =
  'This browser cannot store a wallet securely here: open the site over https (a secure connection) in a ' +
  'current browser. Nothing was saved.';

function webLocks(): LockManager | null {
  const locks = (globalThis.navigator as Navigator | undefined)?.locks;
  return locks && typeof locks.request === 'function' ? locks : null;
}

/** True when this browser can encrypt the words AND serialize saves across tabs (WebCrypto and Web Locks). */
export function vaultSupported(): boolean {
  return Boolean(globalThis.crypto?.subtle) && webLocks() !== null;
}

function subtle(): SubtleCrypto {
  const s = globalThis.crypto?.subtle;
  if (!s) throw new Error(VAULT_UNSUPPORTED_MESSAGE);
  return s;
}

/** The address, bound to the ciphertext as AES-GCM additional data. */
const boundAddress = (address: string): Uint8Array<ArrayBuffer> =>
  new TextEncoder().encode(`${SCHEME}|${address.toLowerCase()}`);

/** Run `task` holding the vault's write lock, shared by every tab of this site. No lock, no save. */
function withVaultLock<T>(task: () => Promise<T>): Promise<T> {
  const locks = webLocks();
  if (!locks) return Promise.reject(new Error(VAULT_UNSUPPORTED_MESSAGE));
  return locks.request(VAULT_KEY, { mode: 'exclusive' }, task) as Promise<T>;
}

async function vaultKey(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number): Promise<CryptoKey> {
  const base = await subtle().importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return subtle().deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** The stored record, or null when there is none or it is not a well-formed v1 record. */
export function readVault(): WalletVaultRecord | null {
  try {
    const raw = localStorage.getItem(VAULT_KEY);
    if (!raw) return null;
    const r = JSON.parse(raw) as WalletVaultRecord;
    const ok = r?.v === 1 && r.scheme === SCHEME && typeof r.address === 'string'
      && r.kdf?.name === 'PBKDF2' && r.kdf.hash === 'SHA-256' && Number.isInteger(r.kdf.iterations)
      && r.kdf.iterations >= VAULT_ITERATIONS && typeof r.kdf.salt === 'string'
      && r.cipher?.name === 'AES-GCM' && typeof r.cipher.iv === 'string' && typeof r.ct === 'string';
    return ok ? r : null;
  } catch {
    return null;
  }
}

/**
 * Encrypt the words under the password and store them. Refuses to replace a vault that holds a DIFFERENT
 * address unless `replace` is set (the caller must have made the user confirm that).
 */
export async function saveVault(
  mnemonic: string,
  address: string,
  password: string,
  { replace = false }: { replace?: boolean } = {},
): Promise<void> {
  if (password.length < 8) throw new Error('The password must be at least 8 characters');
  subtle();
  return withVaultLock(async () => {
    const before = localStorage.getItem(VAULT_KEY);
    if (before !== null && !replace) {
      const existing = readVault();
      if (!existing) throw new Error('This browser holds a wallet record it cannot read; nothing was replaced');
      if (existing.address.toLowerCase() !== address.toLowerCase()) {
        throw new Error('This browser already holds another wallet');
      }
    }
    await writeRecord(mnemonic, address, password, before);
  });
}

async function writeRecord(mnemonic: string, address: string, password: string, before: string | null): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await vaultKey(password, salt, VAULT_ITERATIONS);
  const ct = new Uint8Array(await subtle().encrypt(
    { name: 'AES-GCM', iv, additionalData: boundAddress(address) }, key, new TextEncoder().encode(mnemonic),
  ));
  const record: WalletVaultRecord = {
    v: 1,
    scheme: SCHEME,
    address,
    kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: VAULT_ITERATIONS, salt: b64(salt) },
    cipher: { name: 'AES-GCM', iv: b64(iv) },
    ct: b64(ct),
  };
  // Another tab (or a writer without the lock) may have stored a wallet while the key was derived.
  if (localStorage.getItem(VAULT_KEY) !== before) {
    throw new Error('The wallet stored in this browser changed while saving; nothing was replaced');
  }
  localStorage.setItem(VAULT_KEY, JSON.stringify(record));
}

/**
 * Decrypt the words with the password. A wrong password, or a changed record (including its address, which is
 * bound as additional data), fails the GCM tag check.
 */
export async function unlockVault(password: string): Promise<{ mnemonic: string; address: string }> {
  const r = readVault();
  if (!r) throw new Error('No wallet is stored in this browser');
  const key = await vaultKey(password, unb64(r.kdf.salt), r.kdf.iterations);
  let plain: ArrayBuffer;
  try {
    plain = await subtle().decrypt(
      { name: 'AES-GCM', iv: unb64(r.cipher.iv), additionalData: boundAddress(r.address) }, key, unb64(r.ct),
    );
  } catch {
    throw new Error('Wrong password');
  }
  try {
    return { mnemonic: new TextDecoder().decode(plain), address: r.address };
  } finally {
    new Uint8Array(plain).fill(0);
  }
}

export function clearVault(): void {
  localStorage.removeItem(VAULT_KEY);
}

/**
 * A wallet record left by the old onboarding flow, which used the password as the BIP-39 passphrase:
 * `localStorage['wrfcoin_wallet']` (or its session copy) with `type: 'created'` and no words. Its address
 * cannot be restored from the 12 words alone, and this site never re-derives it.
 */
export function isPasswordSaltedLegacyRecord(record: unknown): boolean {
  if (!record || typeof record !== 'object') return false;
  const r = record as Record<string, unknown>;
  return r.type === 'created' && typeof r.address === 'string' && !r.mnemonic;
}

export const LEGACY_PASSWORD_WALLET_NOTICE =
  'This browser holds a wallet address created by an older version of this site, which mixed your password '
  + 'into the key. Your 12 words alone do NOT restore that address: restore it with the 12 words AND that '
  + 'password as the BIP-39 passphrase in a wallet that supports one, then move any funds to a new wallet '
  + 'created here. This site will not re-derive it.';
