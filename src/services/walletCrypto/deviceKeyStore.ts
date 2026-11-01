/**
 * This browser's device key (a session key; see sessionKeys.ts).
 *
 * Only ever a WebCrypto Ed25519 key generated NON-extractable and kept in
 * IndexedDB as a CryptoKey. Page scripts can ask it to sign, but cannot read
 * the private key out, and it never touches localStorage. There is no
 * software fallback: a browser without WebCrypto Ed25519 gets no device key
 * (DeviceKeyUnsupportedError) and keeps using the password/passkey flow.
 * A stored record whose key is extractable, or not a CryptoKey, is refused.
 *
 * One device key per wallet address per browser.
 */
import { sha3_256 } from '@noble/hashes/sha3.js';
import { bytesToHex } from './firstPartyKeys';

export type DeviceKeyKind = 'webcrypto';

export const DEVICE_KEY_UNSUPPORTED_MESSAGE =
  'This browser can\'t keep a device key that stays locked inside it, so sends here keep asking for your password.';

/** This browser has no non-extractable WebCrypto Ed25519. */
export class DeviceKeyUnsupportedError extends Error {
  constructor() { super(DEVICE_KEY_UNSUPPORTED_MESSAGE); this.name = 'DeviceKeyUnsupportedError'; }
}

export interface StoredDeviceKey {
  owner: string;
  publicKeyHex: string;
  kind: DeviceKeyKind;
  createdAt: number;
  /** Non-extractable WebCrypto private key. */
  privateKey: CryptoKey;
}

export interface DeviceKey {
  owner: string;
  publicKeyHex: string;
  /** core4 address of the device key: 0x + SHA3-256(pubkey)[..20]. */
  address: string;
  kind: DeviceKeyKind;
  sign(message: Uint8Array): Promise<Uint8Array>;
}

/** Where device keys live. IndexedDB in the browser; tests pass an in-memory one. */
export interface DeviceKeyStorage {
  get(owner: string): Promise<StoredDeviceKey | null>;
  put(record: StoredDeviceKey): Promise<void>;
  delete(owner: string): Promise<void>;
}

export function keyAddress(publicKeyHex: string): string {
  const bytes = Uint8Array.from(publicKeyHex.match(/../g) ?? [], h => Number.parseInt(h, 16));
  return `0x${bytesToHex(sha3_256(bytes).slice(0, 20))}`;
}

const DB_NAME = 'wrfcoin-device-keys';
const STORE = 'keys';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('IndexedDB is unavailable')); return; }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => { req.result.createObjectStore(STORE, { keyPath: 'owner' }); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
  });
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = run(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req.result as T);
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB request failed'));
      tx.onabort = () => reject(tx.error ?? new Error('IndexedDB request aborted'));
    });
  } finally {
    db.close();
  }
}

export const indexedDbDeviceKeyStorage: DeviceKeyStorage = {
  get: async owner => (await withStore<StoredDeviceKey | undefined>('readonly', s => s.get(owner.toLowerCase()))) ?? null,
  put: async record => { await withStore('readwrite', s => s.put({ ...record, owner: record.owner.toLowerCase() })); },
  delete: async owner => { await withStore('readwrite', s => s.delete(owner.toLowerCase())); },
};

/** In-memory storage (tests, and a browser that refuses IndexedDB: the key then lasts one page load). */
export function memoryDeviceKeyStorage(): DeviceKeyStorage {
  const m = new Map<string, StoredDeviceKey>();
  return {
    get: async owner => m.get(owner.toLowerCase()) ?? null,
    put: async record => { m.set(record.owner.toLowerCase(), { ...record, owner: record.owner.toLowerCase() }); },
    delete: async owner => { m.delete(owner.toLowerCase()); },
  };
}

let storage: DeviceKeyStorage = indexedDbDeviceKeyStorage;
export function setDeviceKeyStorage(next: DeviceKeyStorage): void { storage = next; }

function toDeviceKey(record: StoredDeviceKey): DeviceKey {
  const base = { owner: record.owner, publicKeyHex: record.publicKeyHex, address: keyAddress(record.publicKeyHex), kind: record.kind };
  const privateKey = record.privateKey;
  if (
    record.kind !== 'webcrypto' ||
    typeof CryptoKey === 'undefined' ||
    !(privateKey instanceof CryptoKey) ||
    privateKey.extractable !== false ||
    privateKey.type !== 'private' ||
    !/^[0-9a-f]{64}$/.test(record.publicKeyHex)
  ) {
    throw new Error('Stored device key is not a non-extractable key');
  }
  return {
    ...base,
    sign: async message => new Uint8Array(await crypto.subtle.sign({ name: 'Ed25519' }, privateKey, message as BufferSource)),
  };
}

/** Generate a WebCrypto Ed25519 key that cannot be exported, or null if the browser lacks Ed25519. */
async function generateWebCryptoKey(): Promise<{ privateKey: CryptoKey; publicKeyHex: string } | null> {
  try {
    if (!globalThis.crypto?.subtle) return null;
    const pair = (await crypto.subtle.generateKey({ name: 'Ed25519' }, false, ['sign', 'verify'])) as CryptoKeyPair;
    if (pair.privateKey.extractable) return null;
    const raw = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
    if (raw.length !== 32) return null;
    return { privateKey: pair.privateKey, publicKeyHex: bytesToHex(raw) };
  } catch {
    return null;
  }
}

export async function loadDeviceKey(owner: string): Promise<DeviceKey | null> {
  try {
    const record = await storage.get(owner.toLowerCase());
    return record ? toDeviceKey(record) : null;
  } catch {
    return null;
  }
}

/** This device's key for `owner`, created on first use. */
export async function getOrCreateDeviceKey(owner: string): Promise<DeviceKey> {
  const existing = await loadDeviceKey(owner);
  if (existing) return existing;
  const generated = await generateWebCryptoKey();
  // No software fallback: a key whose private half could be read out is never made.
  if (!generated) throw new DeviceKeyUnsupportedError();
  const record: StoredDeviceKey = {
    owner: owner.toLowerCase(), publicKeyHex: generated.publicKeyHex, kind: 'webcrypto', createdAt: Date.now(), privateKey: generated.privateKey,
  };
  await storage.put(record);
  return toDeviceKey(record);
}

/** Forget this device's key (after it is removed on chain, or to start over). */
export async function forgetDeviceKey(owner: string): Promise<void> {
  await storage.delete(owner.toLowerCase());
}
