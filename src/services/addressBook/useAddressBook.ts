import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import {
  EMPTY_BOOK, BOOK_ERROR_MESSAGES, addContact, editContact, removeContact, turnAllowlistOn, requestAllowlistOff,
  cancelAllowlistOff, settle, importBook, exportBook, type AddressBook, type ImportSummary,
} from './addressBook';
import { defaultStore, memoryStore, type BookStore } from './deviceStore';

/**
 * One address book per page load, shared by every component that shows it (the manager and each Send form),
 * so an edit in one is seen by the others at once. Loaded lazily from the device store on first use.
 */
interface Snapshot { book: AddressBook; ready: boolean; persistent: boolean }

let store: BookStore | null = null;
let snapshot: Snapshot = { book: EMPTY_BOOK, ready: false, persistent: true };
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit(next: Snapshot) { snapshot = next; listeners.forEach(l => l()); }

function ensureLoaded(): Promise<void> {
  if (loading) return loading;
  store ??= defaultStore();
  const s = store;
  loading = s.load()
    .then(book => emit({ book: settle(book, Date.now()), ready: true, persistent: s.persistent }))
    .catch(() => {
      // Unreadable (storage blocked, or a key the browser lost): keep this visit's edits in memory and never
      // overwrite what is stored with a guess.
      store = memoryStore();
      emit({ book: EMPTY_BOOK, ready: true, persistent: false });
    });
  return loading;
}

async function commit(book: AddressBook) {
  emit({ ...snapshot, book });
  try { await (store ?? memoryStore()).save(book); }
  catch { store = memoryStore(); emit({ ...snapshot, persistent: false }); }
}

/** Tests only: swap the store and forget the loaded book. */
export function __resetAddressBookForTests(next: BookStore | null) {
  store = next; loading = null; snapshot = { book: EMPTY_BOOK, ready: false, persistent: true };
  listeners.forEach(l => l());
}

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

let idCounter = 0;
const makeId = () => {
  idCounter += 1;
  const rand = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  return `c-${idCounter}-${rand}`;
};

/** `now` advances every 30 s so cooldown states and "about N h" stay current without a reload. */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function useAddressBook() {
  const snap = useSyncExternalStore(subscribe, () => snapshot, () => snapshot);
  useEffect(() => { void ensureLoaded(); }, []);
  // The ticker only re-renders; every render reads the clock itself, so a state that just changed (a contact
  // added a moment ago, the allowlist just turned on) is never judged against an older time.
  useNow();
  const now = Date.now();

  const add = useCallback(async (name: string, address: string): Promise<string | null> => {
    const r = addContact(snapshot.book, name, address, Date.now(), makeId());
    if (!r.ok) return BOOK_ERROR_MESSAGES[r.error];
    await commit(r.book); return null;
  }, []);
  const edit = useCallback(async (id: string, name: string, address: string): Promise<string | null> => {
    const r = editContact(snapshot.book, id, name, address, Date.now());
    if (!r.ok) return BOOK_ERROR_MESSAGES[r.error];
    await commit(r.book); return null;
  }, []);
  const remove = useCallback((id: string) => commit(removeContact(snapshot.book, id)), []);
  const allowlistOnNow = useCallback(() => commit(turnAllowlistOn(snapshot.book, Date.now())), []);
  const allowlistOffRequest = useCallback(() => commit(requestAllowlistOff(snapshot.book, Date.now())), []);
  const allowlistOffCancel = useCallback(() => commit(cancelAllowlistOff(snapshot.book, Date.now())), []);
  const importText = useCallback(async (text: string): Promise<ImportSummary> => {
    const summary = importBook(snapshot.book, text, Date.now(), makeId);
    await commit(summary.book);
    return summary;
  }, []);
  const exportText = useCallback(() => JSON.stringify(exportBook(snapshot.book, Date.now()), null, 2), []);

  return {
    book: settle(snap.book, now), ready: snap.ready, persistent: snap.persistent, now,
    add, edit, remove, allowlistOnNow, allowlistOffRequest, allowlistOffCancel, importText, exportText,
  };
}
