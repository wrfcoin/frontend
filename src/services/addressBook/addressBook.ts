/**
 * The named address book ("Send to Mom") and the app-level send allowlist.
 *
 * Owner GO 2026-11-01: the book lives ONLY on this device and is never sent to a WRFCoin server. The
 * allowlist is opt-in and is a guard against mistakes and scams inside this app, not against a stolen
 * phrase: anyone holding the key can send with other software. The chain-enforced allowlist with
 * time-locked additions is a separate (consensus) workstream.
 *
 * Rules, all pure functions of (book, now) so they are testable with any clock:
 * - Turning the allowlist ON is instant (it only tightens).
 * - Turning it OFF needs a confirmation and waits ALLOWLIST_COOLDOWN_MS; it can be cancelled meanwhile.
 * - While it is on, a new contact (added, imported, or an address edited) can receive only after the
 *   same cooldown. Removing a contact is instant (it only tightens).
 * - Contacts added while it was off are allowed as soon as it is turned on: they were the owner's choices.
 */
import { recipientStatus } from '../walletCrypto/recipientStatus';

export const ALLOWLIST_COOLDOWN_MS = 24 * 60 * 60 * 1000;
export const MAX_NAME_LENGTH = 64;
export const MAX_CONTACTS = 500;
export const EXPORT_FORMAT = 'wrfcoin-address-book';

export const ALLOWLIST_HELP =
  'This protects you from mistakes in this app. For protection against a stolen phrase, see the on-chain allowlist (coming)';

export interface Contact {
  id: string;
  name: string;
  /** Canonical lowercase 0x + 40 hex. */
  address: string;
  createdAt: number;
  /** When this contact may receive while the allowlist is on (ms since epoch). */
  allowedFrom: number;
}

export interface AddressBook {
  version: 1;
  contacts: Contact[];
  allowlist: {
    enabled: boolean;
    /** Set when the owner asked to turn the allowlist off; it turns off at this time. */
    disableAt: number | null;
  };
}

export const EMPTY_BOOK: AddressBook = { version: 1, contacts: [], allowlist: { enabled: false, disableAt: null } };

const ADDRESS = /^0x[0-9a-f]{40}$/;

/** `0x…` or the older `wrf…` alias, trimmed and lower-cased; null when it is not a launch address. */
export function canonicalAddress(input: string): string | null {
  const a = input.trim().toLowerCase().replace(/^wrf([0-9a-f]{40})$/, '0x$1');
  return ADDRESS.test(a) ? a : null;
}

export function cleanName(input: string): string {
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LENGTH);
}

export type BookError = 'bad-name' | 'bad-address' | 'legacy-address' | 'duplicate' | 'full' | 'not-found';

export const BOOK_ERROR_MESSAGES: Record<BookError, string> = {
  'bad-name': 'Give the contact a name.',
  'bad-address': 'Enter a full WRFCoin address: 0x followed by 40 letters and digits.',
  'legacy-address': 'This address is known to be legacy receive-only. Ask for their current address.',
  duplicate: 'That address is already in your address book.',
  full: `The address book holds up to ${MAX_CONTACTS} contacts.`,
  'not-found': 'That contact is no longer in the address book.',
};

type Result = { ok: true; book: AddressBook } | { ok: false; error: BookError };

/** The allowlist as it stands at `now` (a requested turn-off takes effect once its time has passed). */
export function allowlistOn(book: AddressBook, now: number): boolean {
  if (!book.allowlist.enabled) return false;
  return !(book.allowlist.disableAt !== null && now >= book.allowlist.disableAt);
}

/** Folds a turn-off whose time has passed into the stored state. */
export function settle(book: AddressBook, now: number): AddressBook {
  if (book.allowlist.enabled && book.allowlist.disableAt !== null && now >= book.allowlist.disableAt) {
    return { ...book, allowlist: { enabled: false, disableAt: null } };
  }
  return book;
}

function newContactAllowedFrom(book: AddressBook, now: number): number {
  return allowlistOn(book, now) ? now + ALLOWLIST_COOLDOWN_MS : now;
}

function validate(name: string, address: string): { name: string; address: string } | BookError {
  const n = cleanName(name);
  if (!n) return 'bad-name';
  const a = canonicalAddress(address);
  if (!a) return 'bad-address';
  if (recipientStatus(a) === 'known-legacy-receive-only') return 'legacy-address';
  return { name: n, address: a };
}

export function addContact(book: AddressBook, name: string, address: string, now: number, id: string): Result {
  const v = validate(name, address);
  if (typeof v === 'string') return { ok: false, error: v };
  if (book.contacts.some(c => c.address === v.address)) return { ok: false, error: 'duplicate' };
  if (book.contacts.length >= MAX_CONTACTS) return { ok: false, error: 'full' };
  const contact: Contact = { id, name: v.name, address: v.address, createdAt: now, allowedFrom: newContactAllowedFrom(book, now) };
  return { ok: true, book: { ...book, contacts: [...book.contacts, contact] } };
}

/** A new name is instant; a new address is a new recipient and starts its own cooldown. */
export function editContact(book: AddressBook, id: string, name: string, address: string, now: number): Result {
  const current = book.contacts.find(c => c.id === id);
  if (!current) return { ok: false, error: 'not-found' };
  const v = validate(name, address);
  if (typeof v === 'string') return { ok: false, error: v };
  if (book.contacts.some(c => c.id !== id && c.address === v.address)) return { ok: false, error: 'duplicate' };
  const addressChanged = v.address !== current.address;
  const updated: Contact = {
    ...current,
    name: v.name,
    address: v.address,
    allowedFrom: addressChanged ? newContactAllowedFrom(book, now) : current.allowedFrom,
  };
  return { ok: true, book: { ...book, contacts: book.contacts.map(c => (c.id === id ? updated : c)) } };
}

export function removeContact(book: AddressBook, id: string): AddressBook {
  return { ...book, contacts: book.contacts.filter(c => c.id !== id) };
}

/** Instant: it only narrows where this app will send. Cancels a pending turn-off too. */
export function turnAllowlistOn(book: AddressBook, now: number): AddressBook {
  const wasOn = allowlistOn(book, now);
  return {
    ...book,
    // Turning it on from off: the contacts already chosen become allowed now.
    contacts: wasOn ? book.contacts : book.contacts.map(c => ({ ...c, allowedFrom: Math.min(c.allowedFrom, now) })),
    allowlist: { enabled: true, disableAt: null },
  };
}

/** Asks to turn it off: it stays on for ALLOWLIST_COOLDOWN_MS, during which the owner can cancel. */
export function requestAllowlistOff(book: AddressBook, now: number): AddressBook {
  if (!allowlistOn(book, now)) return settle(book, now);
  if (book.allowlist.disableAt !== null) return book;
  return { ...book, allowlist: { enabled: true, disableAt: now + ALLOWLIST_COOLDOWN_MS } };
}

export function cancelAllowlistOff(book: AddressBook, now: number): AddressBook {
  if (!allowlistOn(book, now)) return settle(book, now);
  return { ...book, allowlist: { enabled: true, disableAt: null } };
}

export type SendCheck =
  | { ok: true; contact: Contact | null }
  | { ok: false; reason: 'not-in-book' }
  | { ok: false; reason: 'pending'; contact: Contact; until: number };

/** Whether this app may send to `recipient` now. With the allowlist off, anything the chain accepts. */
export function checkRecipient(book: AddressBook, recipient: string, now: number): SendCheck {
  const a = canonicalAddress(recipient);
  const contact = a ? book.contacts.find(c => c.address === a) ?? null : null;
  if (!allowlistOn(book, now)) return { ok: true, contact };
  if (!contact) return { ok: false, reason: 'not-in-book' };
  if (now < contact.allowedFrom) return { ok: false, reason: 'pending', contact, until: contact.allowedFrom };
  return { ok: true, contact };
}

export function contactStatus(book: AddressBook, contact: Contact, now: number): 'allowed' | 'pending' | 'off' {
  if (!allowlistOn(book, now)) return 'off';
  return now < contact.allowedFrom ? 'pending' : 'allowed';
}

/** Readable time for a cooldown end: "Sat 1 Nov, 15:42" in the viewer's locale and zone. */
export function formatWhen(ms: number): string {
  return new Date(ms).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/** "about 23 h" / "about 40 min" until `until`. */
export function formatRemaining(until: number, now: number): string {
  const ms = Math.max(0, until - now);
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 1) return `about ${hours} h`;
  return `about ${Math.max(1, Math.ceil(ms / 60_000))} min`;
}

export const SEND_REFUSED_NOT_IN_BOOK =
  'Send refused: your allowlist is on and this address is not in your address book. Add it first; a new address can receive 24 hours after you add it.';
export function sendRefusedPending(contact: Contact, now: number): string {
  return `Send refused: ${contact.name} was added recently. Your allowlist lets this app send to them from ${formatWhen(contact.allowedFrom)} (${formatRemaining(contact.allowedFrom, now)}).`;
}
export function refusalMessage(check: SendCheck, now: number): string | null {
  if (check.ok) return null;
  return check.reason === 'not-in-book' ? SEND_REFUSED_NOT_IN_BOOK : sendRefusedPending(check.contact, now);
}

// ---- file import / export ---------------------------------------------------

export interface ExportFile {
  format: typeof EXPORT_FORMAT;
  version: 1;
  exportedAt: string;
  contacts: Array<{ name: string; address: string }>;
}

/** Names and addresses only; the allowlist state never leaves the device in a file. */
export function exportBook(book: AddressBook, now: number): ExportFile {
  return {
    format: EXPORT_FORMAT,
    version: 1,
    exportedAt: new Date(now).toISOString(),
    contacts: book.contacts.map(c => ({ name: c.name, address: c.address })),
  };
}

export interface ImportSummary { added: number; skipped: number; book: AddressBook }

/**
 * Merges a file made by exportBook. Every row is validated like a typed contact; an address already in the
 * book is kept as it is (never renamed or re-timed by a file). With the allowlist on, imported contacts wait
 * the cooldown like any other new address. Throws on a file that is not an address-book export.
 */
export function importBook(book: AddressBook, text: string, now: number, makeId: () => string): ImportSummary {
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { throw new Error('This file is not an address book export.'); }
  const file = parsed as Partial<ExportFile> | null;
  if (!file || file.format !== EXPORT_FORMAT || file.version !== 1 || !Array.isArray(file.contacts)) {
    throw new Error('This file is not an address book export.');
  }
  let next = book;
  let added = 0;
  let skipped = 0;
  for (const row of file.contacts.slice(0, MAX_CONTACTS)) {
    const name = typeof row?.name === 'string' ? row.name : '';
    const address = typeof row?.address === 'string' ? row.address : '';
    const r = addContact(next, name, address, now, makeId());
    if (r.ok) { next = r.book; added += 1; } else { skipped += 1; }
  }
  skipped += Math.max(0, file.contacts.length - MAX_CONTACTS);
  return { added, skipped, book: next };
}

/** Accepts only well-formed stored data; anything else becomes an empty book rather than a guess. */
export function sanitizeStored(value: unknown): AddressBook {
  const v = value as Partial<AddressBook> | null;
  if (!v || v.version !== 1 || !Array.isArray(v.contacts) || typeof v.allowlist !== 'object' || v.allowlist === null) {
    return EMPTY_BOOK;
  }
  const contacts: Contact[] = [];
  const seen = new Set<string>();
  for (const c of v.contacts) {
    const address = typeof c?.address === 'string' ? canonicalAddress(c.address) : null;
    const name = typeof c?.name === 'string' ? cleanName(c.name) : '';
    if (!address || !name || seen.has(address) || typeof c.id !== 'string') continue;
    if (!Number.isFinite(c.createdAt) || !Number.isFinite(c.allowedFrom)) continue;
    seen.add(address);
    contacts.push({ id: c.id, name, address, createdAt: c.createdAt, allowedFrom: c.allowedFrom });
  }
  const enabled = v.allowlist.enabled === true;
  const disableAt = enabled && Number.isFinite(v.allowlist.disableAt) ? (v.allowlist.disableAt as number) : null;
  return { version: 1, contacts: contacts.slice(0, MAX_CONTACTS), allowlist: { enabled, disableAt } };
}
