/**
 * Where the address book is kept: this browser's IndexedDB only, encrypted with AES-GCM under a
 * non-extractable key that WebCrypto generates on this device and keeps in the same database. No network
 * call reads or writes it. The key cannot be exported, so a copied database file or a storage dump does not
 * reveal names or addresses; code running in this page could still ask the browser to decrypt, which is why
 * the allowlist is described as a guard against mistakes, not against an attacker.
 *
 * Without IndexedDB or WebCrypto (an http page, a locked-down private window) the book lives in memory for
 * this visit only, and the UI says so.
 */
import { EMPTY_BOOK, sanitizeStored, type AddressBook } from './addressBook';

const DB_NAME = 'wrfcoin-device';
const STORE = 'kv';
const KEY_ID = 'address-book-key-v1';
const DATA_ID = 'address-book-v1';

export interface BookStore {
  readonly persistent: boolean;
  load(): Promise<AddressBook>;
  save(book: AddressBook): Promise<void>;
}

function request<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

function openDb(idb: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = idb.open(DB_NAME, 1);
    r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE); };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

async function get<T>(db: IDBDatabase, key: string): Promise<T | undefined> {
  return request(db.transaction(STORE, 'readonly').objectStore(STORE).get(key)) as Promise<T | undefined>;
}
async function put(db: IDBDatabase, key: string, value: unknown): Promise<void> {
  await request(db.transaction(STORE, 'readwrite').objectStore(STORE).put(value, key));
}

/** The encrypted IndexedDB store. */
export function indexedDbStore(idb: IDBFactory, subtle: SubtleCrypto, random: (b: Uint8Array<ArrayBuffer>) => Uint8Array<ArrayBuffer>): BookStore {
  let dbPromise: Promise<IDBDatabase> | null = null;
  const db = () => (dbPromise ??= openDb(idb));
  const deviceKey = async (): Promise<CryptoKey> => {
    const d = await db();
    const existing = await get<CryptoKey>(d, KEY_ID);
    if (existing) return existing;
    const key = await subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    await put(d, KEY_ID, key);
    return key;
  };
  return {
    persistent: true,
    async load() {
      const d = await db();
      const rec = await get<{ iv: Uint8Array<ArrayBuffer>; ct: ArrayBuffer }>(d, DATA_ID);
      if (!rec) return EMPTY_BOOK;
      const plain = await subtle.decrypt({ name: 'AES-GCM', iv: rec.iv }, await deviceKey(), rec.ct);
      return sanitizeStored(JSON.parse(new TextDecoder().decode(plain)));
    },
    async save(book) {
      const iv = random(new Uint8Array(12));
      const ct = await subtle.encrypt({ name: 'AES-GCM', iv }, await deviceKey(), new TextEncoder().encode(JSON.stringify(book)));
      await put(await db(), DATA_ID, { iv, ct });
    },
  };
}

/** For this visit only. */
export function memoryStore(): BookStore {
  let kept: AddressBook = EMPTY_BOOK;
  return { persistent: false, async load() { return kept; }, async save(book) { kept = book; } };
}

export function defaultStore(): BookStore {
  const idb = typeof indexedDB !== 'undefined' ? indexedDB : undefined;
  const c = typeof crypto !== 'undefined' ? crypto : undefined;
  if (!idb || !c?.subtle || typeof c.getRandomValues !== 'function') return memoryStore();
  return indexedDbStore(idb, c.subtle, b => c.getRandomValues(b));
}
