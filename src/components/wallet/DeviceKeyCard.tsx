import React, { useCallback, useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import RefreshIcon from '@mui/icons-material/Refresh';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PhonelinkLockIcon from '@mui/icons-material/PhonelinkLock';
import { WrfCard } from '../DesignSystem/WrfCard';
import { WrfBadge } from '../DesignSystem/WrfBadge';
import { WrfButton } from '../DesignSystem/WrfButton';
import { WrfInput } from '../DesignSystem/WrfInput';
import { WrfAlert } from '../DesignSystem/WrfAlert';
import { palette } from '../DesignSystem/tokens';
import {
  FEATURE_OFF_MESSAGE,
  readDeviceState,
  registerThisDevice,
  revokeThisDevice,
  type DeviceState,
} from '../../services/walletCrypto/deviceSession';
import { DEFAULT_LIFETIME_DAYS, wrfLabel } from '../../services/walletCrypto/sessionKeys';
import { useAddressBook } from '../../services/addressBook/useAddressBook';
import { allowlistOn } from '../../services/addressBook/addressBook';
import { DEVICE_KEY_UNSUPPORTED_MESSAGE, DeviceKeyUnsupportedError } from '../../services/walletCrypto/deviceKeyStore';

/**
 * "This device": a key kept in this browser that can make small sends and sign
 * in without the recovery phrase, within limits set on chain (sessionKeys.ts).
 * Setting it up or removing it needs the wallet password once.
 */
export const SETUP_SUMMARY =
  `Small sends and sign-in from this browser without your recovery phrase: up to 10 WRF a send and 10 WRF a day, 300 WRF in all, for about ${DEFAULT_LIFETIME_DAYS} days. Bigger sends still ask for your password.`;
export const PENDING_MESSAGE = 'Sent to the network. It shows here once the next block includes it (about a minute).';
export const SETUP_FAILED_MESSAGE = 'Could not set up this device. Check your password and try again.';
export const REMOVE_FAILED_MESSAGE = 'Could not remove this device. Check your password and try again.';
export const UNAVAILABLE_MESSAGE = 'Device key status is not available right now. Try again later.';

const SECONDS_PER_BLOCK = 77;

type View =
  | { kind: 'loading' }
  | { kind: 'unavailable' }
  | { kind: 'ready'; state: DeviceState };

const rowLabelSx = { fontSize: '0.75rem', fontWeight: 600, color: palette.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em', m: 0 } as const;
const rowValueSx = { m: 0, fontSize: '0.875rem', overflowWrap: 'anywhere', fontVariantNumeric: 'tabular-nums' } as const;
const bodySx = { color: palette.text.secondary, fontSize: '0.875rem' } as const;

function statusBadge(status: string): { status: 'active' | 'warning' | 'error' | 'neutral'; label: string } {
  switch (status) {
  case 'active': return { status: 'active', label: 'On' };
  case 'not_yet_valid': return { status: 'warning', label: 'Starting soon' };
  case 'expired': return { status: 'neutral', label: 'Expired' };
  case 'exhausted': return { status: 'neutral', label: 'Used up' };
  case 'revoked': return { status: 'neutral', label: 'Removed' };
  default: return { status: 'neutral', label: status };
  }
}

function aboutDays(blocks: number): string {
  const days = Math.max(0, Math.round((blocks * SECONDS_PER_BLOCK) / 86400));
  return days === 1 ? 'about 1 day' : `about ${days} days`;
}

/** Addresses from free text: one per line or comma separated. */
export function parseAllowlist(text: string): string[] {
  return text.split(/[\s,]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
}

export default function DeviceKeyCard({ ownerAddress, canUnlock = true }: { ownerAddress: string | null; canUnlock?: boolean }) {
  const [view, setView] = useState<View>({ kind: 'loading' });
  const [mode, setMode] = useState<'idle' | 'setup' | 'remove'>('idle');
  const [recipients, setRecipients] = useState<'anyone' | 'book' | 'list'>('anyone');
  // The device-only address book: "only my address book" limits this device to those addresses on chain.
  const { book } = useAddressBook();
  const bookAddresses = [...new Set(book.contacts.map(c => c.address.toLowerCase()))].slice(0, 64);
  // With the app-level allowlist on, start from "Only my address book" so the on-chain limit matches it.
  const allowlistIsOn = allowlistOn(book, Date.now());
  const [allowlist, setAllowlist] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const password = useRef<HTMLInputElement>(null);
  const latest = useRef(0);

  const load = useCallback(async () => {
    if (!ownerAddress) return;
    const mine = ++latest.current;
    setView({ kind: 'loading' });
    try {
      const state = await readDeviceState(ownerAddress);
      if (latest.current !== mine) return;
      setView({ kind: 'ready', state });
      if (state.record) setPending(false);
    } catch {
      if (latest.current === mine) setView({ kind: 'unavailable' });
    }
  }, [ownerAddress]);

  useEffect(() => {
    if (ownerAddress) void load();
    return () => { latest.current += 1; };
  }, [ownerAddress, load]);

  if (!ownerAddress) return null;

  const state = view.kind === 'ready' ? view.state : null;
  const featureOn = state?.list?.feature_active === true;
  const record = state?.record ?? null;
  const live = record && record.status !== 'revoked' && record.status !== 'expired' && record.status !== 'exhausted';

  const takePassword = (): string => {
    const value = password.current?.value ?? '';
    if (password.current) password.current.value = '';
    return value;
  };

  const setUp = async () => {
    if (busy) return;
    const pw = takePassword();
    if (!pw) { setError('Enter your wallet password.'); return; }
    let list: string[] | 'anyone' = 'anyone';
    if (recipients === 'book') {
      list = bookAddresses;
      if (list.length === 0) { setError('Your address book is empty.'); return; }
    } else if (recipients === 'list') {
      list = parseAllowlist(allowlist);
      if (list.length === 0 || list.some(a => !/^0x[0-9a-f]{40}$/.test(a))) {
        setError('Enter full 0x addresses (40 hex digits), one per line.');
        return;
      }
    }
    setBusy(true); setError('');
    try {
      await registerThisDevice({ owner: ownerAddress, password: pw, recipients: list });
      setMode('idle'); setPending(true);
      await load();
    } catch (e) {
      setError(e instanceof DeviceKeyUnsupportedError ? DEVICE_KEY_UNSUPPORTED_MESSAGE
        : e instanceof Error && e.message === FEATURE_OFF_MESSAGE ? FEATURE_OFF_MESSAGE : SETUP_FAILED_MESSAGE);
    } finally { setBusy(false); }
  };

  const remove = async () => {
    if (busy || !record) return;
    const pw = takePassword();
    if (!pw) { setError('Enter your wallet password.'); return; }
    setBusy(true); setError('');
    try {
      await revokeThisDevice({ owner: ownerAddress, password: pw, record });
      setMode('idle'); setPending(false);
      await load();
    } catch {
      setError(REMOVE_FAILED_MESSAGE);
    } finally { setBusy(false); }
  };

  const badge = !state ? { status: 'neutral' as const, label: view.kind === 'unavailable' ? 'Unavailable' : 'Checking' }
    : !featureOn ? { status: 'neutral' as const, label: 'Not on yet' }
      : record ? statusBadge(record.status)
        : pending ? { status: 'warning' as const, label: 'Pending' }
          : { status: 'neutral' as const, label: 'Not set up' };

  const passwordField = (label: string) => (
    <WrfInput
      ref={password}
      type="password"
      label={label}
      autoComplete="off"
      disabled={busy}
      prefixIcon={<LockOutlinedIcon fontSize="small" />}
      helperText="Unlocks your recovery phrase once to sign. Not stored."
    />
  );

  return (
    <WrfCard
      component="section"
      aria-label="This device"
      data-testid="device-key-card"
      variant="outlined"
      header={<Typography component="h2" sx={{ fontSize: '1.0625rem', fontWeight: 700, m: 0 }}>This device</Typography>}
      headerAction={<WrfBadge status={badge.status} label={badge.label} />}
      footer={
        <WrfButton variant="ghost" size="sm" startIcon={<RefreshIcon fontSize="small" />} onClick={() => void load()} disabled={view.kind === 'loading' || busy}>
          Refresh
        </WrfButton>
      }
      sx={{ backgroundColor: palette.background.secondary, borderRadius: '16px' }}
    >
      {view.kind === 'loading' && <Typography sx={bodySx}>Checking this device…</Typography>}
      {view.kind === 'unavailable' && <Typography role="status" sx={bodySx}>{UNAVAILABLE_MESSAGE}</Typography>}

      {state && !featureOn && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'flex-start' }}>
          <Typography sx={bodySx}>{SETUP_SUMMARY}</Typography>
          <Typography role="status" sx={{ ...bodySx, fontWeight: 600 }}>{FEATURE_OFF_MESSAGE}</Typography>
          <WrfButton variant="outline" size="md" startIcon={<PhonelinkLockIcon fontSize="small" />} disabled>Set up this device</WrfButton>
        </Box>
      )}

      {state && featureOn && error && <WrfAlert severity="error" sx={{ mb: 1.5 }}>{error}</WrfAlert>}

      {state && featureOn && !record && mode !== 'setup' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'flex-start' }}>
          <Typography sx={bodySx}>{pending ? PENDING_MESSAGE : SETUP_SUMMARY}</Typography>
          {!pending && (
            <WrfButton variant="primary" size="md" startIcon={<PhonelinkLockIcon fontSize="small" />} disabled={!canUnlock} onClick={() => { setMode('setup'); setError(''); if (allowlistIsOn && bookAddresses.length > 0) setRecipients('book'); }}>
              Set up this device
            </WrfButton>
          )}
        </Box>
      )}

      {state && featureOn && !record && mode === 'setup' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography sx={bodySx}>{SETUP_SUMMARY}</Typography>
          <Box component="fieldset" sx={{ border: 0, p: 0, m: 0, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            <Typography component="legend" sx={{ ...rowLabelSx, mb: 0.5 }}>Who can this device pay?</Typography>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.875rem' }}>
              <input type="radio" name="device-recipients" checked={recipients === 'anyone'} onChange={() => setRecipients('anyone')} disabled={busy} />
              Anyone
            </label>
            {bookAddresses.length > 0 && (
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.875rem' }}>
                <input type="radio" name="device-recipients" checked={recipients === 'book'} onChange={() => setRecipients('book')} disabled={busy} />
                Only my address book ({bookAddresses.length})
              </label>
            )}
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.875rem' }}>
              <input type="radio" name="device-recipients" checked={recipients === 'list'} onChange={() => setRecipients('list')} disabled={busy} />
              Only these addresses
            </label>
            {recipients === 'list' && (
              <WrfInput
                label="Allowed addresses"
                value={allowlist}
                onChange={e => setAllowlist(e.target.value)}
                multiline
                minRows={2}
                disabled={busy}
                spellCheck={false}
                helperText="One 0x address per line."
                slotProps={{ input: { sx: { fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontSize: '0.8125rem' } } }}
              />
            )}
          </Box>
          {passwordField('Wallet password')}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <WrfButton variant="primary" loading={busy} disabled={busy} onClick={() => void setUp()}>Set up</WrfButton>
            <WrfButton variant="ghost" disabled={busy} onClick={() => { setMode('idle'); setError(''); }}>Cancel</WrfButton>
          </Box>
        </Box>
      )}

      {state && featureOn && record && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography sx={bodySx}>
            {live ? 'Small sends from this browser need no password.' : 'This device can no longer send. Set it up again to keep using it.'}
          </Typography>
          <Box component="dl" sx={{ display: 'grid', gridTemplateColumns: 'minmax(104px, auto) minmax(0, 1fr)', rowGap: 1, columnGap: 2, m: 0 }}>
            <Typography component="dt" sx={rowLabelSx}>Per send</Typography>
            <Typography component="dd" sx={rowValueSx}>{wrfLabel(record.max_value_per_use)}</Typography>
            {record.window && (
              <>
                <Typography component="dt" sx={rowLabelSx}>Left today</Typography>
                <Typography component="dd" sx={rowValueSx} data-testid="device-left-today">
                  {wrfLabel(record.window.remaining)} of {wrfLabel(record.window.max_value)}
                </Typography>
              </>
            )}
            <Typography component="dt" sx={rowLabelSx}>Left in total</Typography>
            <Typography component="dd" sx={rowValueSx}>{wrfLabel(record.total_remaining)} of {wrfLabel(record.max_total_value)}</Typography>
            <Typography component="dt" sx={rowLabelSx}>Can pay</Typography>
            <Typography component="dd" sx={rowValueSx}>
              {record.any_target ? 'Anyone' : `${record.allowed_targets.length} saved address${record.allowed_targets.length === 1 ? '' : 'es'}`}
            </Typography>
            <Typography component="dt" sx={rowLabelSx}>Good until</Typography>
            <Typography component="dd" sx={rowValueSx}>
              Block {record.valid_until.toLocaleString()} ({aboutDays(record.valid_until - (state.list?.next_height ?? record.valid_until))})
            </Typography>
          </Box>
          {record.status !== 'revoked' && mode !== 'remove' && (
            <Box>
              <WrfButton variant="outline" size="sm" disabled={!canUnlock} onClick={() => { setMode('remove'); setError(''); }}>Remove this device</WrfButton>
            </Box>
          )}
          {mode === 'remove' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography sx={bodySx}>Removing stops this browser from sending or signing in without your password.</Typography>
              {passwordField('Wallet password')}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <WrfButton variant="primary" loading={busy} disabled={busy} onClick={() => void remove()}>Remove</WrfButton>
                <WrfButton variant="ghost" disabled={busy} onClick={() => { setMode('idle'); setError(''); }}>Cancel</WrfButton>
              </Box>
            </Box>
          )}
        </Box>
      )}
    </WrfCard>
  );
}

