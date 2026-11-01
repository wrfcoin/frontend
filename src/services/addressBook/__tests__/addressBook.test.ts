import { describe, it, expect } from '@jest/globals';
import {
  ALLOWLIST_COOLDOWN_MS, ALLOWLIST_HELP, EMPTY_BOOK, addContact, allowlistOn, cancelAllowlistOff, checkRecipient, editContact,
  exportBook, importBook, refusalMessage, removeContact, requestAllowlistOff, sanitizeStored, settle, turnAllowlistOn,
  type AddressBook,
} from '../addressBook';

const T0 = Date.UTC(2026, 10, 1, 12, 0, 0);
const H = 60 * 60 * 1000;
const MOM = '0x' + '1'.repeat(40);
const DAD = '0x' + '2'.repeat(40);
const LEGACY = '0x465230af3383c16d024c5f4b87ed2d1b595be148';
let n = 0;
const id = () => `id-${(n += 1)}`;

function add(book: AddressBook, name: string, address: string, now: number): AddressBook {
  const r = addContact(book, name, address, now, id());
  if (!r.ok) throw new Error(r.error);
  return r.book;
}

describe('address book', () => {
  it('validates names and addresses, refuses duplicates and the known legacy address', () => {
    expect(addContact(EMPTY_BOOK, '   ', MOM, T0, id())).toEqual({ ok: false, error: 'bad-name' });
    expect(addContact(EMPTY_BOOK, 'Mom', '0x1234', T0, id())).toEqual({ ok: false, error: 'bad-address' });
    expect(addContact(EMPTY_BOOK, 'Old', LEGACY, T0, id())).toEqual({ ok: false, error: 'legacy-address' });
    const book = add(EMPTY_BOOK, '  Mom\n ', MOM.toUpperCase().replace('0X', '0x'), T0);
    expect(book.contacts[0]).toMatchObject({ name: 'Mom', address: MOM });
    expect(addContact(book, 'Mum', `wrf${'1'.repeat(40)}`, T0, id())).toEqual({ ok: false, error: 'duplicate' });
  });

  it('allowlist off: every address passes, contacts or not', () => {
    expect(checkRecipient(EMPTY_BOOK, DAD, T0)).toEqual({ ok: true, contact: null });
  });

  it('turning it on is instant, and contacts chosen while it was off are allowed at once', () => {
    const book = turnAllowlistOn(add(EMPTY_BOOK, 'Mom', MOM, T0), T0 + 1);
    expect(allowlistOn(book, T0 + 1)).toBe(true);
    expect(checkRecipient(book, MOM, T0 + 1).ok).toBe(true);
    const refused = checkRecipient(book, DAD, T0 + 1);
    expect(refused).toEqual({ ok: false, reason: 'not-in-book' });
    expect(refusalMessage(refused, T0 + 1)).toMatch(/not in your address book/);
  });

  it('while on, a new contact waits 24 h; editing its address restarts the wait; a new name does not', () => {
    let book = turnAllowlistOn(EMPTY_BOOK, T0);
    book = add(book, 'Dad', DAD, T0);
    const pending = checkRecipient(book, DAD, T0 + 23 * H);
    expect(pending).toMatchObject({ ok: false, reason: 'pending', until: T0 + ALLOWLIST_COOLDOWN_MS });
    expect(refusalMessage(pending, T0 + 23 * H)).toMatch(/Dad was added recently/);
    expect(checkRecipient(book, DAD, T0 + ALLOWLIST_COOLDOWN_MS).ok).toBe(true);

    const contactId = book.contacts[0].id;
    const renamed = editContact(book, contactId, 'Papa', DAD, T0 + 30 * H);
    if (!renamed.ok) throw new Error(renamed.error);
    expect(checkRecipient(renamed.book, DAD, T0 + 30 * H).ok).toBe(true);

    const moved = editContact(renamed.book, contactId, 'Papa', MOM, T0 + 30 * H);
    if (!moved.ok) throw new Error(moved.error);
    expect(checkRecipient(moved.book, MOM, T0 + 31 * H)).toMatchObject({ ok: false, reason: 'pending' });
    expect(checkRecipient(moved.book, DAD, T0 + 31 * H)).toEqual({ ok: false, reason: 'not-in-book' });
  });

  it('removing a contact is instant', () => {
    let book = turnAllowlistOn(add(EMPTY_BOOK, 'Mom', MOM, T0), T0);
    book = removeContact(book, book.contacts[0].id);
    expect(checkRecipient(book, MOM, T0).ok).toBe(false);
  });

  it('turning it off waits 24 h, can be cancelled, then lets any address through', () => {
    let book = turnAllowlistOn(EMPTY_BOOK, T0);
    book = requestAllowlistOff(book, T0);
    expect(book.allowlist.disableAt).toBe(T0 + ALLOWLIST_COOLDOWN_MS);
    // A second request never moves the time.
    expect(requestAllowlistOff(book, T0 + H).allowlist.disableAt).toBe(T0 + ALLOWLIST_COOLDOWN_MS);
    expect(checkRecipient(book, DAD, T0 + 23 * H).ok).toBe(false);
    expect(cancelAllowlistOff(book, T0 + 2 * H).allowlist).toEqual({ enabled: true, disableAt: null });
    expect(allowlistOn(book, T0 + ALLOWLIST_COOLDOWN_MS)).toBe(false);
    expect(checkRecipient(book, DAD, T0 + ALLOWLIST_COOLDOWN_MS).ok).toBe(true);
    expect(settle(book, T0 + ALLOWLIST_COOLDOWN_MS).allowlist).toEqual({ enabled: false, disableAt: null });
    // Turning it on again during the wait cancels the wait.
    expect(turnAllowlistOn(book, T0 + H).allowlist).toEqual({ enabled: true, disableAt: null });
  });

  it('export carries names and addresses only; import validates, skips duplicates and waits like any new contact', () => {
    let book = add(EMPTY_BOOK, 'Mom', MOM, T0);
    book = turnAllowlistOn(book, T0);
    const file = exportBook(book, T0);
    expect(file).toEqual({ format: 'wrfcoin-address-book', version: 1, exportedAt: new Date(T0).toISOString(), contacts: [{ name: 'Mom', address: MOM }] });
    expect(JSON.stringify(file)).not.toMatch(/allowlist|allowedFrom|enabled/);

    const text = JSON.stringify({ ...file, contacts: [{ name: 'Mum', address: MOM }, { name: 'Dad', address: DAD }, { name: 'Bad', address: 'nope' }, { name: 'Old', address: LEGACY }] });
    const r = importBook(book, text, T0 + H, id);
    expect(r.added).toBe(1);
    expect(r.skipped).toBe(3);
    expect(r.book.contacts.find(c => c.address === MOM)?.name).toBe('Mom');
    expect(checkRecipient(r.book, DAD, T0 + 2 * H)).toMatchObject({ ok: false, reason: 'pending' });
    expect(() => importBook(book, '{"contacts":[]}', T0, id)).toThrow('not an address book export');
    expect(() => importBook(book, 'not json', T0, id)).toThrow('not an address book export');
  });

  it('stored data is accepted only when well formed', () => {
    expect(sanitizeStored(null)).toEqual(EMPTY_BOOK);
    expect(sanitizeStored({ version: 2 })).toEqual(EMPTY_BOOK);
    const s = sanitizeStored({
      version: 1,
      allowlist: { enabled: true, disableAt: 'soon' },
      contacts: [
        { id: 'a', name: 'Mom', address: MOM, createdAt: T0, allowedFrom: T0 },
        { id: 'b', name: 'Mom again', address: MOM, createdAt: T0, allowedFrom: T0 },
        { id: 'c', name: '', address: DAD, createdAt: T0, allowedFrom: T0 },
      ],
    });
    expect(s.contacts.map(c => c.id)).toEqual(['a']);
    expect(s.allowlist).toEqual({ enabled: true, disableAt: null });
  });

  it('the help text says what it protects against, word for word', () => {
    expect(ALLOWLIST_HELP).toBe('This protects you from mistakes in this app. For protection against a stolen phrase, see the on-chain allowlist (coming)');
  });
});
