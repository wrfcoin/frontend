import React, { useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ContactsOutlinedIcon from '@mui/icons-material/ContactsOutlined';
import { WrfButton } from '../DesignSystem/WrfButton';
import { WrfInput } from '../DesignSystem/WrfInput';
import { WrfAlert } from '../DesignSystem/WrfAlert';
import { WrfBadge } from '../DesignSystem/WrfBadge';
import { WrfModal } from '../DesignSystem/WrfModal';
import { palette } from '../DesignSystem/tokens';
import { useAddressBook } from '../../services/addressBook/useAddressBook';
import {
  ALLOWLIST_HELP, ALLOWLIST_COOLDOWN_MS, allowlistOn, canonicalAddress, checkRecipient, contactStatus, formatRemaining,
  formatWhen, refusalMessage, type Contact,
} from '../../services/addressBook/addressBook';

const mono = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
const mask = (a: string) => (a.length <= 20 ? a : `${a.slice(0, 8)}…${a.slice(-6)}`);

export const DEVICE_ONLY_NOTE = 'Saved only on this device, encrypted. Your contacts are never sent to WRFCoin or anyone else.';
export const MEMORY_ONLY_NOTE = 'This browser cannot save the address book, so contacts last only until you close this tab.';
export const EXPORT_NOTE = 'The exported file is not encrypted: keep it like any contacts list.';

/** Names and addresses this device knows, as quick picks for a Send form. Nothing is shown when the book is empty. */
export function ContactPicks({ onPick, disabled }: { onPick: (address: string) => void; disabled?: boolean }) {
  const { book, now, ready } = useAddressBook();
  if (!ready || book.contacts.length === 0) return null;
  return (
    <Box data-testid="contact-picks" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
      <Typography component="span" sx={{ fontSize: '0.8125rem', color: palette.text.secondary }}>Send to</Typography>
      {book.contacts.map(c => {
        const status = contactStatus(book, c, now);
        return (
          <WrfButton
            key={c.id}
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={() => onPick(c.address)}
            title={status === 'pending' ? `Can receive from ${formatWhen(c.allowedFrom)}` : c.address}
          >
            {c.name}{status === 'pending' ? ' (waiting)' : ''}
          </WrfButton>
        );
      })}
    </Box>
  );
}

/**
 * The allowlist decision for a Send form: null when this app may send, else the refusal to show. It is read
 * again at the moment of sending (callers pass Date.now()), so a stale render never lets a send through.
 */
export function useRecipientGuard() {
  const { book } = useAddressBook();
  return {
    allowlistOn: (now = Date.now()) => allowlistOn(book, now),
    refusal: (recipient: string, now = Date.now()) => refusalMessage(checkRecipient(book, recipient, now), now),
    contactName: (recipient: string) => {
      const a = canonicalAddress(recipient);
      return a ? book.contacts.find(c => c.address === a)?.name ?? null : null;
    },
  };
}

function AllowlistSection() {
  const { book, now, allowlistOnNow, allowlistOffRequest, allowlistOffCancel } = useAddressBook();
  const [confirmOff, setConfirmOff] = useState(false);
  const on = allowlistOn(book, now);
  const disableAt = on ? book.allowlist.disableAt : null;
  return (
    <Box component="section" aria-label="Send allowlist" data-testid="allowlist-section"
      sx={{ p: 1.5, borderRadius: '8px', border: '1px solid', borderColor: 'divider', display: 'grid', gap: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Typography component="h3" sx={{ fontWeight: 600, fontSize: '0.9375rem', m: 0 }}>Only send to my address book</Typography>
        <WrfBadge status={on ? 'active' : 'neutral'} label={on ? (disableAt ? 'On, turning off' : 'On') : 'Off'} />
      </Box>
      <Typography sx={{ fontSize: '0.8125rem', color: palette.text.secondary, m: 0 }}>
        When this is on, this app refuses to send to any address that is not in your address book. A new contact can
        receive 24 hours after you add it, and turning this off also takes 24 hours, so a hurried or tricked send has
        time to be noticed.
      </Typography>
      <Typography sx={{ fontSize: '0.8125rem', color: palette.text.secondary, m: 0 }} data-testid="allowlist-help">
        {ALLOWLIST_HELP}.
      </Typography>
      {!on && (
        <WrfButton variant="primary" size="sm" onClick={() => void allowlistOnNow()} data-testid="allowlist-on" sx={{ justifySelf: 'start' }}>
          Turn on
        </WrfButton>
      )}
      {on && !disableAt && !confirmOff && (
        <WrfButton variant="outline" size="sm" onClick={() => setConfirmOff(true)} data-testid="allowlist-off" sx={{ justifySelf: 'start' }}>
          Turn off…
        </WrfButton>
      )}
      {on && !disableAt && confirmOff && (
        <WrfAlert severity="warning" title="Turn the allowlist off?" data-testid="allowlist-off-confirm">
          It stays on for 24 hours ({formatWhen(now + ALLOWLIST_COOLDOWN_MS)}), then this app can send to any address.
          You can cancel at any time before then. If someone is telling you to do this now, stop.
          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
            <WrfButton variant="ghost" size="sm" onClick={() => setConfirmOff(false)}>Keep it on</WrfButton>
            <WrfButton variant="primary" size="sm" onClick={() => { setConfirmOff(false); void allowlistOffRequest(); }} data-testid="allowlist-off-start">
              Start the 24-hour wait
            </WrfButton>
          </Box>
        </WrfAlert>
      )}
      {on && disableAt && (
        <WrfAlert severity="info" title="Turning off" data-testid="allowlist-pending-off">
          The allowlist stays on until {formatWhen(disableAt)} ({formatRemaining(disableAt, now)}).
          <Box sx={{ mt: 1 }}>
            <WrfButton variant="outline" size="sm" onClick={() => void allowlistOffCancel()} data-testid="allowlist-off-cancel">Keep it on</WrfButton>
          </Box>
        </WrfAlert>
      )}
    </Box>
  );
}

function ContactRow({ contact }: { contact: Contact }) {
  const { book, now, edit, remove } = useAddressBook();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(contact.name);
  const [address, setAddress] = useState(contact.address);
  const [error, setError] = useState('');
  const status = contactStatus(book, contact, now);
  const addressChanged = canonicalAddress(address) !== contact.address;
  const on = allowlistOn(book, now);
  if (editing) {
    return (
      <Box component="li" sx={{ display: 'grid', gap: 1, py: 1 }}>
        <WrfInput label="Name" value={name} onChange={e => setName(e.target.value)} autoComplete="off" />
        <WrfInput label="Address" value={address} onChange={e => setAddress(e.target.value)} autoComplete="off" spellCheck={false}
          slotProps={{ input: { sx: { fontFamily: mono, fontSize: '0.8125rem' } } }} />
        {on && addressChanged && (
          <Typography sx={{ fontSize: '0.8125rem', color: palette.text.secondary, m: 0 }}>
            A new address is a new recipient: it can receive from {formatWhen(now + ALLOWLIST_COOLDOWN_MS)}.
          </Typography>
        )}
        {error && <WrfAlert severity="error">{error}</WrfAlert>}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <WrfButton variant="ghost" size="sm" onClick={() => { setEditing(false); setName(contact.name); setAddress(contact.address); setError(''); }}>Cancel</WrfButton>
          <WrfButton variant="primary" size="sm" onClick={async () => {
            const e = await edit(contact.id, name, address);
            if (e) setError(e); else { setEditing(false); setError(''); }
          }}>Save</WrfButton>
        </Box>
      </Box>
    );
  }
  return (
    <Box component="li" data-testid="contact-row" sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', py: 1 }}>
      <Box sx={{ minWidth: 0, flex: '1 1 180px' }}>
        <Typography sx={{ fontWeight: 600, m: 0, overflowWrap: 'anywhere' }}>{contact.name}</Typography>
        <Typography title={contact.address} sx={{ fontFamily: mono, fontSize: '0.75rem', color: palette.text.secondary, m: 0 }}>{mask(contact.address)}</Typography>
        {status === 'pending' && (
          <Typography sx={{ fontSize: '0.75rem', color: palette.text.secondary, m: 0 }}>
            Can receive from {formatWhen(contact.allowedFrom)} ({formatRemaining(contact.allowedFrom, now)})
          </Typography>
        )}
      </Box>
      {status === 'allowed' && <WrfBadge status="active" label="Allowed" />}
      {status === 'pending' && <WrfBadge status="warning" label="Waiting" />}
      <WrfButton variant="ghost" size="sm" onClick={() => setEditing(true)} aria-label={`Edit ${contact.name}`}>Edit</WrfButton>
      <WrfButton variant="ghost" size="sm" onClick={() => void remove(contact.id)} aria-label={`Remove ${contact.name}`}>Remove</WrfButton>
    </Box>
  );
}

function AddContactForm() {
  const { book, now, add } = useAddressBook();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const on = allowlistOn(book, now);
  const save = async () => {
    const e = await add(name, address);
    if (e) { setError(e); setConfirming(false); return; }
    setName(''); setAddress(''); setError(''); setConfirming(false);
  };
  return (
    <Box component="form" aria-label="Add a contact" onSubmit={e => { e.preventDefault(); if (on && !confirming) setConfirming(true); else void save(); }}
      sx={{ display: 'grid', gap: 1 }}>
      <Typography component="h3" sx={{ fontWeight: 600, fontSize: '0.9375rem', m: 0 }}>Add a contact</Typography>
      <WrfInput label="Name" placeholder="Mom" value={name} onChange={e => { setName(e.target.value); setConfirming(false); }} autoComplete="off" />
      <WrfInput label="Address" placeholder="0x…" value={address} onChange={e => { setAddress(e.target.value); setConfirming(false); }} autoComplete="off" spellCheck={false}
        slotProps={{ input: { sx: { fontFamily: mono, fontSize: '0.8125rem' } } }} />
      {error && <WrfAlert severity="error">{error}</WrfAlert>}
      {confirming && (
        <WrfAlert severity="info" title="Add with a 24-hour wait?" data-testid="add-contact-confirm">
          Your allowlist is on, so this app can send to {name.trim() || 'this contact'} from {formatWhen(now + ALLOWLIST_COOLDOWN_MS)}.
          Check the address with them another way (a call, not a message) before you send.
        </WrfAlert>
      )}
      <WrfButton type="submit" variant="primary" size="sm" sx={{ justifySelf: 'start' }} disabled={!name.trim() || !address.trim()} data-testid="add-contact">
        {confirming ? 'Add and start the wait' : 'Add contact'}
      </WrfButton>
    </Box>
  );
}

function ImportExport() {
  const { book, now, importText, exportText } = useAddressBook();
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const exportFile = () => {
    const blob = new Blob([exportText()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'wrfcoin-address-book.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const importFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const { added, skipped } = await importText(await file.text());
      const wait = added > 0 && allowlistOn(book, now) ? ` New contacts can receive from ${formatWhen(Date.now() + ALLOWLIST_COOLDOWN_MS)}.` : '';
      setMessage({ kind: 'success', text: `Added ${added} contact${added === 1 ? '' : 's'}${skipped ? `, skipped ${skipped} (already here or not valid)` : ''}.${wait}` });
    } catch (e) {
      setMessage({ kind: 'error', text: e instanceof Error ? e.message : 'This file could not be read.' });
    } finally {
      if (fileInput.current) fileInput.current.value = '';
    }
  };
  return (
    <Box sx={{ display: 'grid', gap: 1 }}>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <WrfButton variant="outline" size="sm" onClick={exportFile} disabled={book.contacts.length === 0} data-testid="address-book-export">Export to a file</WrfButton>
        <WrfButton variant="outline" size="sm" onClick={() => fileInput.current?.click()} data-testid="address-book-import">Import from a file</WrfButton>
        <input ref={fileInput} type="file" accept="application/json,.json" hidden aria-label="Address book file"
          onChange={e => void importFile(e.target.files?.[0])} data-testid="address-book-file" />
      </Box>
      <Typography sx={{ fontSize: '0.75rem', color: palette.text.secondary, m: 0 }}>{EXPORT_NOTE}</Typography>
      {message && <WrfAlert severity={message.kind} role="status">{message.text}</WrfAlert>}
    </Box>
  );
}

/** The address book manager: a button that opens it as a dialog. */
export default function AddressBookButton({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <WrfButton variant="outline" size={size} startIcon={<ContactsOutlinedIcon fontSize="small" />} onClick={() => setOpen(true)} data-testid="address-book-open">
        Address book
      </WrfButton>
      {open && <AddressBookDialog onClose={() => setOpen(false)} />}
    </>
  );
}

export function AddressBookDialog({ onClose }: { onClose: () => void }) {
  const { book, ready, persistent } = useAddressBook();
  return (
    <WrfModal open onClose={onClose} maxWidth="sm" fullWidth title="Address book" aria-label="Address book"
      actions={<WrfButton variant="primary" onClick={onClose}>Done</WrfButton>}
      sx={{ '& .MuiDialog-paper': { width: '100%', maxWidth: 560, m: { xs: 1, sm: 4 }, backgroundImage: 'none' } }}>
      <Box sx={{ display: 'grid', gap: 2 }} data-testid="address-book">
        <Typography sx={{ fontSize: '0.8125rem', color: palette.text.secondary, m: 0 }} data-testid="address-book-storage">
          {persistent ? DEVICE_ONLY_NOTE : MEMORY_ONLY_NOTE}
        </Typography>
        <AllowlistSection />
        {ready && book.contacts.length === 0 && (
          <Typography sx={{ m: 0 }}>No contacts yet. Add the people you send to, with a name you will recognise.</Typography>
        )}
        {book.contacts.length > 0 && (
          <Box component="ul" aria-label="Contacts" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid' }}>
            {book.contacts.map(c => <ContactRow key={c.id} contact={c} />)}
          </Box>
        )}
        <AddContactForm />
        <ImportExport />
      </Box>
    </WrfModal>
  );
}
