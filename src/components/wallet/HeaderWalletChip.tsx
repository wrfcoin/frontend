import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import { FEATURES } from '../../config/features';
import { clearWalletAuthSession } from '../../services/walletAuthService';
import { getAuthToken, subscribeAuthToken } from '../../services/authTokenStore';
import { lockUnlockedWallet } from '../../services/walletSessionSwitch';
import {
  PASSKEY_WALLET_PATH, PHRASE_SETUP_PATH, PHRASE_WALLET_PATH, readSavedWallets, shortAddress, type WalletKind,
} from './WalletSwitcher';
import { activeWalletOf, WALLET_KIND_LABEL, WALLET_KIND_NAME, WALLETS_CHANGED_EVENT } from './activeWallet';

const KIND_ICON: Record<WalletKind, typeof FingerprintIcon> = { passkey: FingerprintIcon, phrase: KeyOutlinedIcon };

/** What the menu says about a saved wallet. The passkey wallet needs no sign-in for its own page. */
export function walletRowStatus(kind: WalletKind, signedIn: boolean): string {
  if (signedIn) return 'Signed in';
  return kind === 'phrase' ? 'Locked' : 'On this device';
}

/**
 * The wallet button in the taskbar (multi-wallet builds only). It names the active wallet, the one the login
 * token was issued to, by kind and short address, and its menu lists both wallets this browser holds, opens
 * either one, and signs out. It reads public addresses only: it never decrypts, signs or logs in. Choosing a
 * wallet opens its page; a session only ever changes by that wallet signing in itself.
 */
export default function HeaderWalletChip() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = useSyncExternalStore(subscribeAuthToken, getAuthToken, getAuthToken);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  // A wallet removed on this page, or added or removed in another tab, changes what the button shows.
  const [changes, setChanges] = useState(0);
  useEffect(() => {
    const changed = () => setChanges(n => n + 1);
    window.addEventListener(WALLETS_CHANGED_EVENT, changed);
    window.addEventListener('storage', changed);
    return () => {
      window.removeEventListener(WALLETS_CHANGED_EVENT, changed);
      window.removeEventListener('storage', changed);
    };
  }, []);
  // One read of the saved wallets per navigation, menu opening, session change or wallet change (public
  // addresses only), and the active wallet is worked out from that same read.
  // `changes`, `open`, the path and the token are triggers, not inputs.
  const saved = useMemo(readSavedWallets, [location.pathname, open, token, changes]);
  const active = useMemo(() => activeWalletOf(token, saved), [token, saved]);

  const go = useCallback((path: string) => { setOpen(false); navigate(path); }, [navigate]);
  const signOut = useCallback(async () => {
    setOpen(false);
    // The taskbar sits outside every wallet provider, so this locks through the provider manager itself: an
    // unlocked 12-word wallet is locked (a mounted wallet page hears it and updates), then the token goes.
    await lockUnlockedWallet().catch(() => {});
    clearWalletAuthSession();
  }, []);

  if (!FEATURES.multiWallet) return null;

  const activeKind = active && active.kind !== 'other' ? active.kind : null;
  const count = Number(Boolean(saved.passkey)) + Number(Boolean(saved.phrase));
  const Icon = activeKind ? KIND_ICON[activeKind] : active ? KeyOutlinedIcon : AccountBalanceWalletOutlinedIcon;
  const summary = active
    ? `Signed in: ${activeKind ? WALLET_KIND_NAME[activeKind] : 'wallet'} ${active.address}`
    : count === 0 ? 'No wallet in this browser yet' : `${count} ${count === 1 ? 'wallet' : 'wallets'} in this browser, none signed in`;

  const row = (kind: WalletKind) => {
    const address = saved[kind];
    const RowIcon = KIND_ICON[kind];
    const signedIn = Boolean(address && active?.address === address.toLowerCase());
    const path = kind === 'passkey' ? PASSKEY_WALLET_PATH : address ? PHRASE_WALLET_PATH : PHRASE_SETUP_PATH;
    return (
      <MenuItem key={kind} onClick={() => go(path)} data-testid={`wallet-chip-row-${kind}`} className="wallet-chip-row">
        <RowIcon fontSize="small" aria-hidden />
        <span className="wallet-chip-row-text">
          <span className="wallet-chip-row-title">
            {address ? `${WALLET_KIND_LABEL[kind]} wallet` : `Add a ${WALLET_KIND_NAME[kind]}`}
          </span>
          {address && (
            <span className="wallet-chip-row-sub">
              <span className="wallet-chip-mono" title={address}>{shortAddress(address)}</span>
              {' · '}{walletRowStatus(kind, signedIn)}
            </span>
          )}
        </span>
      </MenuItem>
    );
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={`wallet-chip${active ? ' wallet-chip--active' : ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Your wallets. ${summary}`}
        title={summary}
        data-testid="wallet-chip"
        onClick={() => setOpen(value => !value)}
      >
        <Icon fontSize="small" aria-hidden />
        {activeKind && <span className="wallet-chip-kind" data-testid="wallet-chip-kind">{WALLET_KIND_LABEL[activeKind]}</span>}
        {active ? (
          <>
            <span className="wallet-chip-mono wallet-chip-wide" data-testid="wallet-chip-text">{shortAddress(active.address)}</span>
            {/* Phone width: the last four characters only, so the page name keeps its room. */}
            <span className="wallet-chip-mono wallet-chip-narrow" aria-hidden>…{active.address.slice(-4)}</span>
          </>
        ) : (
          <span className="wallet-chip-label" data-testid="wallet-chip-text">{count === 0 ? 'Wallet' : 'Wallets'}</span>
        )}
      </button>
      <Menu
        anchorEl={buttonRef.current}
        open={open}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        MenuListProps={{ 'aria-label': 'Your wallets' }}
        slotProps={{ paper: { className: 'wallet-chip-menu' } }}
      >
        {row('passkey')}
        {row('phrase')}
        {saved.passkey && saved.phrase && (
          <li className="wallet-chip-note" role="presentation">
            Two separate wallets. Only one is signed in at a time.
          </li>
        )}
        {active && <Divider component="li" />}
        {active && (
          <MenuItem onClick={() => void signOut()} data-testid="wallet-chip-sign-out">
            Sign out {shortAddress(active.address)}
          </MenuItem>
        )}
      </Menu>
    </>
  );
}
