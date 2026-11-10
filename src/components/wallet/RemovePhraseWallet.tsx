import React, { useCallback, useEffect, useState } from 'react';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { WrfButton } from '../DesignSystem/WrfButton';
import { WrfInput } from '../DesignSystem/WrfInput';
import { WrfAlert } from '../DesignSystem/WrfAlert';
import { WrfModal } from '../DesignSystem/WrfModal';
import { readVault } from '../../services/walletVault';
import { stationBound } from '../../services/stationBoundWallets';
import { WALLETS_CHANGED_EVENT } from './activeWallet';

const mono = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

export const REMOVE_WALLET_LABEL = 'Remove from this browser';
export const REMOVE_WARNINGS = [
  'This deletes the saved copy of your 12 words from this browser. The wallet and its coins stay on the network.',
  'Only your 12 words bring it back. WRFCoin does not have them and cannot recover them.',
] as const;
export const REMOVE_STATION_BOUND =
  'This wallet owns a weather station, so it cannot be removed from this browser. The station and its rewards stay with this wallet.';
export const REMOVE_CHECK_FAILED =
  'Could not check whether this wallet owns a station, so nothing was removed. Try again in a minute.';
/** Always shown: what the station check covers, signed in or not. */
export const REMOVE_CHECK_CAVEAT =
  'Only stations connected in this browser, and a phone station, were checked. A station connected elsewhere keeps paying this address: keep your 12 words.';
export const REMOVE_RECORD_UNREADABLE =
  'This browser\'s record of connected stations could not be read, so stations connected here could not be checked.';
export const REMOVE_CHANGED = 'The wallet saved in this browser changed. Nothing was removed.';
export const REMOVE_FAILED = 'Could not remove the wallet. Nothing was removed.';
/** Refused up front: without WebCrypto and Web Locks the saved wallet cannot be changed safely. */
export const REMOVE_UNSUPPORTED =
  'This browser cannot change the saved wallet safely here: open the site over https (a secure connection) in a current browser. Nothing was removed.';
/** Added when the words stayed but this wallet's device key had already been removed. */
export const REMOVE_DEVICE_KEY_GONE =
  'The saved words were not removed, but this wallet\'s device key on this browser was. You can set up this device again from the wallet page.';

/** Last four characters of the address, lower-cased: what a person types to confirm. */
export const addressTail = (address: string): string => address.slice(-4).toLowerCase();

type Check = 'checking' | 'free' | 'bound' | 'failed';

interface Props {
  /** The 12-word wallet saved in this browser (its public address). */
  address: string;
  /** True when this wallet holds the session, so its own phone-station read can be asked. */
  signedIn: boolean;
  /** Owner-only read of this wallet's phone station: resolves true when it has one. Only called when signed in. */
  hasPhoneStation: () => Promise<boolean>;
  /** Lock the wallet and drop its session (when signed in), after the saved copy is gone. */
  onRemoved: () => void | Promise<void>;
}

/**
 * Remove the 12-word wallet from this browser (multi-wallet builds). Explicit: a warning, a ticked "I have my
 * 12 words written down" and the last four characters of the address. Refused while the wallet owns a station
 * (owner ruling 2026-10-28): known from this browser's station record and, when signed in, the wallet's own
 * phone-station read; a read that fails refuses too. That is all the site can check, and the dialog says so.
 * Deletes only this browser's records for THIS wallet: its device key, then the encrypted words, removed under
 * the vault's cross-tab lock and only if they are still this wallet's. The passkey wallet's record is never
 * touched, and nothing is sent.
 */
export default function RemovePhraseWallet({ address, signedIn, hasPhoneStation, onRemoved }: Props) {
  const [open, setOpen] = useState(false);
  const [check, setCheck] = useState<Check>('checking');
  const [stationIds, setStationIds] = useState<string[]>([]);
  const [recordUnreadable, setRecordUnreadable] = useState(false);
  const [written, setWritten] = useState(false);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const close = useCallback(() => { setOpen(false); setWritten(false); setTyped(''); setError(''); setBusy(false); }, []);

  useEffect(() => {
    if (!open) return undefined;
    let live = true;
    const local = stationBound(address);
    if (local.bound) { setStationIds(local.stationIds); setCheck('bound'); return undefined; }
    setRecordUnreadable(Boolean(local.unreadable));
    if (!signedIn) { setCheck('free'); return undefined; }
    setCheck('checking');
    hasPhoneStation()
      .then(has => { if (live) setCheck(has ? 'bound' : 'free'); })
      .catch(() => { if (live) setCheck('failed'); });
    return () => { live = false; };
  }, [open, address, signedIn, hasPhoneStation]);

  const confirmed = check === 'free' && written && typed.trim().toLowerCase() === addressTail(address);

  const remove = useCallback(async () => {
    if (!confirmed) return;
    setBusy(true); setError('');
    let deviceKeyForgotten = false;
    try {
      // Checked again at the moment of removal: the record may have changed since the dialog opened.
      const saved = readVault();
      if (!saved || saved.address.toLowerCase() !== address.toLowerCase() || stationBound(address).bound) {
        setError(REMOVE_CHANGED);
        return;
      }
      // Refuse before anything is deleted if this browser cannot take the vault's lock.
      const { removeVaultIfAddress, vaultSupported } = await import('../../services/walletVault');
      if (!vaultSupported()) { setError(REMOVE_UNSUPPORTED); return; }
      // This wallet's device key first: with the words gone it must not keep signing for the address. If
      // the words then cannot be removed, the message says the device key is gone; no coins move.
      const { forgetDeviceKey } = await import('../../services/walletCrypto/deviceKeyStore');
      await forgetDeviceKey(address.toLowerCase());
      deviceKeyForgotten = true;
      if (!(await removeVaultIfAddress(address))) { setError(REMOVE_DEVICE_KEY_GONE); return; }
      try { window.dispatchEvent(new Event(WALLETS_CHANGED_EVENT)); } catch { /* no window events: nothing to refresh */ }
      // The words are gone from here on; a page that fails to refresh must not turn that into an error.
      try { await onRemoved(); } catch { /* the wallet is removed either way */ }
      close();
    } catch {
      setError(deviceKeyForgotten ? REMOVE_DEVICE_KEY_GONE : REMOVE_FAILED);
    } finally {
      setBusy(false);
    }
  }, [address, close, confirmed, onRemoved]);

  return (
    <>
      <WrfButton variant="ghost" size="md" onClick={() => setOpen(true)} data-testid="remove-wallet-open">
        {REMOVE_WALLET_LABEL}
      </WrfButton>
      <WrfModal
        open={open}
        onClose={close}
        maxWidth="sm"
        fullWidth
        title="Remove this 12-word wallet from this browser?"
        actions={(
          <>
            <WrfButton variant="ghost" onClick={close}>Keep it</WrfButton>
            <WrfButton variant="primary" onClick={() => void remove()} disabled={!confirmed || busy} data-testid="remove-wallet-confirm">
              Remove wallet
            </WrfButton>
          </>
        )}
      >
        <Typography sx={{ mb: 1.5, fontFamily: mono, wordBreak: 'break-all' }} data-testid="remove-wallet-address">{address}</Typography>
        {check === 'bound' && (
          <WrfAlert severity="warning" data-testid="remove-wallet-station-bound">
            {REMOVE_STATION_BOUND}{stationIds.length > 0 ? ` Station: ${stationIds.join(', ')}.` : ''}
          </WrfAlert>
        )}
        {check === 'failed' && <WrfAlert severity="error" data-testid="remove-wallet-check-failed">{REMOVE_CHECK_FAILED}</WrfAlert>}
        {check === 'checking' && <Typography role="status">Checking whether this wallet owns a station…</Typography>}
        {check === 'free' && (
          <>
            {REMOVE_WARNINGS.map(line => <Typography key={line} sx={{ mb: 1.5 }}>{line}</Typography>)}
            <WrfAlert severity="info" sx={{ mb: 1.5 }} data-testid="remove-wallet-check-caveat">
              {recordUnreadable ? `${REMOVE_RECORD_UNREADABLE} ` : ''}{REMOVE_CHECK_CAVEAT}
            </WrfAlert>
            <FormControlLabel
              control={<Checkbox checked={written} onChange={e => setWritten(e.target.checked)} inputProps={{ 'data-testid': 'remove-wallet-written' } as React.InputHTMLAttributes<HTMLInputElement>} />}
              label="I have my 12 words written down"
            />
            <Typography sx={{ my: 1.5 }}>
              To confirm, type the last 4 characters of the address: <strong data-testid="remove-wallet-hint" style={{ fontFamily: mono }}>{addressTail(address)}</strong>
            </Typography>
            <WrfInput
              label="Last 4 characters"
              value={typed}
              onChange={e => setTyped(e.target.value)}
              autoComplete="off"
              inputProps={{ 'data-testid': 'remove-wallet-tail', maxLength: 8, style: { fontFamily: mono } }}
            />
          </>
        )}
        {error && <WrfAlert severity="error" sx={{ mt: 1.5 }}>{error}</WrfAlert>}
      </WrfModal>
    </>
  );
}
