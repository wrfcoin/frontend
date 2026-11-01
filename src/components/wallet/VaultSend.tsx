import React, { useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { previewVaultTransfer, submitVaultTransfer, type TransferPreview } from '../../services/walletCrypto/vaultTransfer';
import { wrfToBaseUnits } from '../../services/walletCrypto/transferPayload';
import { recipientStatus, LEGACY_RECIPIENT_MESSAGE, UNKNOWN_RECIPIENT_MESSAGE } from '../../services/walletCrypto/recipientStatus';
import {
  checkThisDeviceCanSend,
  deviceFallbackMessage,
  errorCode,
  submitDeviceTransfer,
  DeviceSendRefusedError,
  type DeviceSendDecision,
} from '../../services/walletCrypto/deviceSession';
import { WrfModal } from '../DesignSystem/WrfModal';
import { WrfInput } from '../DesignSystem/WrfInput';
import { WrfButton } from '../DesignSystem/WrfButton';
import { WrfAlert } from '../DesignSystem/WrfAlert';
import { WrfBadge } from '../DesignSystem/WrfBadge';
import { palette } from '../DesignSystem/tokens';
import AddressBookButton, { ContactPicks, useRecipientGuard } from './AddressBook';

const decimal = (units: string) => `${BigInt(units) / 100000000n}.${(BigInt(units) % 100000000n).toString().padStart(8, '0')}`;
const mono = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
const mask = (address: string) => (address.length <= 20 ? address : `${address.slice(0, 10)}…${address.slice(-8)}`);

/** The form knows the available balance; a transfer it cannot cover is refused before any preview. */
export const ZERO_BALANCE_MESSAGE =
  'Nothing to send yet: this wallet has 0 WRF available. Testnet WRF arrives as weather rewards or as a transfer to this address.';
export const EXCEEDS_AVAILABLE_MESSAGE = 'Amount exceeds the available balance.';
/** Base units the amount field represents, or null when it is empty or not a valid WRF amount. */
function amountUnits(amount: string): bigint | null {
  if (!amount.trim()) return null;
  try { return wrfToBaseUnits(amount); } catch { return null; }
}
export const PREPARE_FAILED_MESSAGE =
  'Unable to prepare transfer. Check the full address, amount (up to 8 decimals), and wallet connection.';
export const DEVICE_SIGNS_MESSAGE = 'This device signs this send. No password needed.';
export const NOT_CONFIRMED_MESSAGE =
  'Transfer was not confirmed. Check activity before retrying; review again and re-enter your password.';

function CopyHash({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <IconButton
      size="small"
      aria-label={copied ? 'Copied' : 'Copy submission identifier'}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          setCopied(false);
        }
      }}
      sx={{ color: copied ? palette.success.main : palette.text.secondary }}
    >
      {copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
    </IconButton>
  );
}

const dtSx = { fontSize: '0.8125rem', color: palette.text.secondary, m: 0 } as const;
const ddSx = { fontSize: '0.8125rem', m: 0, overflowWrap: 'anywhere', textAlign: 'right' } as const;

/**
 * The Send flow (S9), as a modal over the wallet page: form → review + password → submitted.
 * The password is read from an uncontrolled input once and cleared before any await.
 */
export default function VaultSend({ address, availableUnits }: { address: string; availableUnits?: string | null }) {
  const [open, setOpen] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [preview, setPreview] = useState<TransferPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [hash, setHash] = useState('');
  // Whether this browser's device key (a session key with limits) can sign the reviewed send by itself.
  const [device, setDevice] = useState<DeviceSendDecision | null>(null);
  const password = useRef<HTMLInputElement>(null);
  const inFlight = useRef(false);
  const knownLegacy = recipientStatus(recipient) === 'known-legacy-receive-only';
  // App-level allowlist (device-only, opt-in): refuses recipients outside the address book before any preview.
  const guard = useRecipientGuard();
  const allowlistRefusal = recipient.trim() ? guard.refusal(recipient) : null;
  const contactName = guard.contactName(recipient);
  const availableBase = availableUnits != null && /^\d+$/.test(availableUnits) ? BigInt(availableUnits) : null;
  const requested = amountUnits(amount);
  const zeroBalance = availableBase === 0n;
  const exceedsAvailable = availableBase !== null && requested !== null && requested > availableBase;
  const review = async () => {
    if (inFlight.current) return;
    if (knownLegacy) { setError(LEGACY_RECIPIENT_MESSAGE); return; }
    const refusal = guard.refusal(recipient, Date.now());
    if (refusal) { setError(refusal); return; }
    if (zeroBalance) { setError(ZERO_BALANCE_MESSAGE); return; }
    if (exceedsAvailable) { setError(EXCEEDS_AVAILABLE_MESSAGE); return; }
    inFlight.current = true; setBusy(true); setError('');
    try {
      const next = await previewVaultTransfer(address.toLowerCase(), recipient, amount);
      setDevice(await checkThisDeviceCanSend(next).catch(() => null));
      setPreview(next);
    }
    catch { setError(PREPARE_FAILED_MESSAGE); }
    finally { inFlight.current = false; setBusy(false); }
  };
  const confirmWithDevice = async () => {
    if (!preview || inFlight.current) return;
    inFlight.current = true; setBusy(true); setError('');
    try { setHash((await submitDeviceTransfer(preview, to => guard.refusal(to, Date.now()))).txHash); setPreview(null); }
    catch (e) {
      if (e instanceof DeviceSendRefusedError) { setPreview(null); setError(e.message); return; }
      const code = errorCode(e);
      if (code === 'SESSION_KEY_LIMIT' || code === 'FEATURE_NOT_ACTIVE' || code === 'AUTHORIZATION_INVALID') {
        // The node said no to the device key: nothing was sent. Keep the review; ask for the password.
        setDevice({ ok: false, reason: 'refused', record: device?.record ?? null });
      } else {
        setError(NOT_CONFIRMED_MESSAGE);
        setPreview(null);
      }
    } finally { inFlight.current = false; setBusy(false); }
  };
  const confirm = async () => {
    if (!preview || inFlight.current) return;
    // Checked again at the moment of signing (device key or password): the allowlist may have been turned on since the review.
    const refusal = guard.refusal(preview.to, Date.now());
    if (refusal) { if (password.current) password.current.value = ''; setPreview(null); setError(refusal); return; }
    // The device path signs without a password, so it also needs the stored address book loaded (fail closed).
    if (device?.ok && guard.ready) { await confirmWithDevice(); return; }
    if (!password.current?.value) return;
    inFlight.current = true; setBusy(true); setError('');
    const pending = submitVaultTransfer(preview, password.current.value);
    password.current.value = '';
    try { setHash((await pending).txHash); setPreview(null); }
    catch {
      setError(NOT_CONFIRMED_MESSAGE);
      setPreview(null);
    } finally { inFlight.current = false; setBusy(false); }
  };
  const close = () => {
    if (busy) return;
    setOpen(false); setPreview(null);
  };
  const openSend = () => { setOpen(true); setHash(''); setError(''); setDevice(null); };
  const deviceSigns = device?.ok === true && guard.ready;
  const fallbackNote = deviceFallbackMessage(device);

  const stage: 'form' | 'review' | 'submitted' = hash ? 'submitted' : preview ? 'review' : 'form';
  const title = stage === 'submitted' ? 'Transfer submitted' : stage === 'review' ? 'Review transfer' : 'Send WRF';
  const available = availableUnits != null && /^\d+$/.test(availableUnits) ? decimal(availableUnits) : null;

  const footer = stage === 'submitted' ? (
    <WrfButton variant="primary" onClick={close}>Done</WrfButton>
  ) : stage === 'review' ? (
    <>
      <WrfButton variant="ghost" disabled={busy} onClick={() => setPreview(null)}>Back</WrfButton>
      <WrfButton variant="primary" disabled={busy} loading={busy} onClick={confirm} startIcon={<SendIcon fontSize="small" />}>Confirm &amp; Send</WrfButton>
    </>
  ) : (
    <>
      <WrfButton variant="ghost" disabled={busy} onClick={close}>Cancel</WrfButton>
      <WrfButton variant="primary" onClick={review} disabled={busy || knownLegacy || zeroBalance || exceedsAvailable || Boolean(allowlistRefusal)} loading={busy}>Review transfer</WrfButton>
    </>
  );

  return (
    <>
      <WrfButton variant="primary" size="md" startIcon={<SendIcon fontSize="small" />} onClick={openSend}>Send</WrfButton>
      <WrfModal
        open={open}
        onClose={close}
        maxWidth="sm"
        fullWidth
        aria-label="Send WRF"
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {stage === 'review' && (
              <IconButton size="small" aria-label="Back to the form" disabled={busy} onClick={() => setPreview(null)} sx={{ color: palette.text.secondary }}>
                <ArrowBackIcon fontSize="small" />
              </IconButton>
            )}
            <span>{title}</span>
          </Box>
        }
        actions={footer}
        sx={{ '& .MuiDialog-paper': { width: '100%', maxWidth: 520, m: { xs: 1, sm: 4 }, backgroundImage: 'none' } }}
      >
        {stage === 'submitted' && (
          <Box sx={{ textAlign: 'center', py: 1 }}>
            <Box
              aria-hidden="true"
              sx={{ width: 64, height: 64, borderRadius: '50%', mx: 'auto', mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: palette.success.main }}
            >
              <CheckIcon fontSize="large" />
            </Box>
            <Typography component="p" sx={{ fontWeight: 600, m: 0 }}>Submitted; settlement is not yet confirmed.</Typography>
            <Typography sx={{ color: palette.text.secondary, fontSize: '0.875rem', mt: 1, mb: 2 }}>
              It will appear in Recent activity as processing until the chain includes it.
            </Typography>
            <Box sx={{ textAlign: 'left', p: 1.5, borderRadius: '8px', backgroundColor: palette.background.row, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: palette.text.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Submission identifier</Typography>
                <Typography component="output" aria-label="Submission identifier" sx={{ display: 'block', fontFamily: mono, fontSize: '0.75rem', overflowWrap: 'anywhere' }}>{hash}</Typography>
              </Box>
              <CopyHash value={hash} />
            </Box>
          </Box>
        )}

        {stage === 'review' && preview && (
          <Box>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: palette.text.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>You are sending</Typography>
              <Typography component="p" sx={{ fontSize: { xs: '1.75rem', sm: '2.25rem' }, fontWeight: 700, m: 0, fontVariantNumeric: 'tabular-nums', overflowWrap: 'anywhere' }}>
                {decimal(preview.amountBaseUnits)} WRF
              </Typography>
            </Box>
            <Box component="dl" sx={{ display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)', columnGap: 2, rowGap: 1, m: 0, mb: 2, p: 1.5, borderRadius: '8px', backgroundColor: palette.background.row }}>
              <Typography component="dt" sx={dtSx}>Recipient</Typography>
              <Typography component="dd" sx={{ ...ddSx, fontFamily: mono }}>{preview.to}</Typography>
              {guard.contactName(preview.to) && (
                <>
                  <Typography component="dt" sx={dtSx}>Contact</Typography>
                  <Typography component="dd" sx={ddSx} data-testid="send-review-contact">{guard.contactName(preview.to)}</Typography>
                </>
              )}
              <Typography component="dt" sx={dtSx}>From</Typography>
              <Typography component="dd" sx={{ ...ddSx, fontFamily: mono }}>{preview.from}</Typography>
              <Typography component="dt" sx={dtSx}>Recipient status</Typography>
              <Typography component="dd" sx={ddSx}>{UNKNOWN_RECIPIENT_MESSAGE}</Typography>
              <Typography component="dt" sx={dtSx}>Base units</Typography>
              <Typography component="dd" sx={{ ...ddSx, fontFamily: mono }}>{preview.amountBaseUnits}</Typography>
              <Typography component="dt" sx={dtSx}>Nonce</Typography>
              <Typography component="dd" sx={{ ...ddSx, fontFamily: mono }}>{preview.nonce}</Typography>
              <Typography component="dt" sx={dtSx}>Chain</Typography>
              <Typography component="dd" sx={ddSx}>{preview.chainId}</Typography>
              <Typography component="dt" sx={dtSx}>Network</Typography>
              <Typography component="dd" sx={ddSx}>{preview.networkId}</Typography>
            </Box>
            <WrfAlert severity="warning" role="note" sx={{ mb: 2 }}>
              This transparent transfer reveals the sender, recipient and amount. Verify the full address; transfers cannot be reversed.
            </WrfAlert>
            {deviceSigns ? (
              <WrfAlert severity="success" role="status" data-testid="device-signs">{DEVICE_SIGNS_MESSAGE}</WrfAlert>
            ) : (
              <>
                {fallbackNote && <WrfAlert severity="info" role="note" sx={{ mb: 2 }} data-testid="device-fallback">{fallbackNote}</WrfAlert>}
                <WrfInput
                  ref={password}
                  type="password"
                  label="Wallet password for this send"
                  autoComplete="off"
                  disabled={busy}
                  prefixIcon={<LockOutlinedIcon fontSize="small" />}
                  helperText="Your password signs this one transfer and is not stored."
                />
              </>
            )}
          </Box>
        )}

        {stage === 'form' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {error && (
              <WrfAlert severity="error" title={error === NOT_CONFIRMED_MESSAGE ? 'Transfer was not confirmed' : undefined}>
                {error}
              </WrfAlert>
            )}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', p: 1.25, borderRadius: '8px', backgroundColor: palette.background.row, fontSize: '0.8125rem' }}>
              <Typography component="span" sx={{ fontSize: 'inherit', color: palette.text.secondary }}>From</Typography>
              <Typography component="span" title={address} sx={{ fontSize: 'inherit', fontFamily: mono }}>{mask(address)}</Typography>
              {available !== null && (
                <>
                  <Typography component="span" sx={{ fontSize: 'inherit', color: palette.text.muted }}>·</Typography>
                  <Typography component="span" sx={{ fontSize: 'inherit', color: palette.text.secondary }}>Available</Typography>
                  <Typography component="span" sx={{ fontSize: 'inherit', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{available} WRF</Typography>
                </>
              )}
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', justifyContent: 'space-between' }}>
              <ContactPicks onPick={setRecipient} disabled={busy} />
              <AddressBookButton size="sm" />
            </Box>
            <WrfInput
              label="Recipient address"
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
              disabled={busy}
              error={knownLegacy}
              autoComplete="off"
              spellCheck={false}
              suffixIcon={knownLegacy ? <WrfBadge status="error" label="Legacy" /> : undefined}
              helperText={recipient && !knownLegacy ? <span role="status">{contactName ? `${contactName} (from your address book). ` : ''}{UNKNOWN_RECIPIENT_MESSAGE}</span> : ' '}
              slotProps={{ input: { sx: { fontFamily: mono, fontSize: '0.8125rem' } } }}
            />
            {knownLegacy && (
              <WrfAlert severity="error" title="Send blocked: legacy receive-only address">{LEGACY_RECIPIENT_MESSAGE}</WrfAlert>
            )}
            {allowlistRefusal && !knownLegacy && (
              <WrfAlert severity="error" title="Not in your allowlist" data-testid="send-allowlist-refusal">{allowlistRefusal}</WrfAlert>
            )}
            {zeroBalance && !knownLegacy && (
              <WrfAlert severity="info" title="No WRF to send">{ZERO_BALANCE_MESSAGE}</WrfAlert>
            )}
            {exceedsAvailable && !zeroBalance && !knownLegacy && (
              <WrfAlert severity="error" title="Amount too high">{EXCEEDS_AVAILABLE_MESSAGE} Available: {available} WRF.</WrfAlert>
            )}
            <WrfInput
              label="Amount"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              disabled={busy}
              inputMode="decimal"
              autoComplete="off"
              suffixIcon={<Typography component="span" sx={{ fontSize: '0.75rem', fontWeight: 600, color: palette.text.muted }}>WRF</Typography>}
              helperText="Up to 8 decimals."
              slotProps={{ htmlInput: { 'aria-label': 'Amount in WRF', inputMode: 'decimal' } }}
            />
          </Box>
        )}
      </WrfModal>
    </>
  );
}
