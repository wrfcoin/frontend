import React, { useEffect, useState } from 'react';
import { useInRouterContext, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import { FEATURES } from '../../config/features';
import { readVault } from '../../services/walletVault';
import { loadStoredPasskey } from '../../services/walletCrypto/passkeySend';
import { passkeyRecordAddress } from '../../services/walletCrypto/passkey';
import { palette } from '../DesignSystem/tokens';
import { WALLETS_CHANGED_EVENT } from './activeWallet';

export type WalletKind = 'passkey' | 'phrase';

export const PASSKEY_WALLET_PATH = '/wallet/passkey';
export const PHRASE_WALLET_PATH = '/wallet';
/** Where "Add" goes for a 12-word wallet: wallet setup creates, imports or unlocks it. */
export const PHRASE_SETUP_PATH = '/onboarding';

/** `0x1234…abcd`: short enough for two tabs side by side at phone width. */
export const shortAddress = (address: string): string =>
  address.length <= 12 ? address : `${address.slice(0, 6)}…${address.slice(-4)}`;

export interface SavedWallets {
  passkey: string | null;
  phrase: string | null;
}

/**
 * The two wallets this browser can hold side by side, as public addresses only: the 12-word vault keeps its
 * address in clear, and a passkey address derives from the saved public key. Nothing is decrypted or signed.
 */
export function readSavedWallets(): SavedWallets {
  return { passkey: savedPasskeyAddress(), phrase: readVault()?.address.toLowerCase() ?? null };
}

// Deriving the address hashes the public key; the same saved record always gives the same address.
let derived: { key: string; address: string } | null = null;

function savedPasskeyAddress(): string | null {
  try {
    const record = FEATURES.passkeyWallet ? loadStoredPasskey() : null;
    if (!record) return null;
    const key = `${record.rpId}|${Array.from(record.publicKeyXY).join(',')}`;
    if (derived?.key !== key) derived = { key, address: passkeyRecordAddress(record).toLowerCase() };
    return derived.address;
  } catch {
    return null;
  }
}

interface TabProps {
  kind: WalletKind;
  selected: boolean;
  address: string | null;
  status?: string;
  href: string;
  onSelect: (event: React.MouseEvent) => void;
}

function WalletTab({ kind, selected, address, status, href, onSelect }: TabProps) {
  const label = kind === 'passkey' ? 'Passkey wallet' : '12-word wallet';
  const Icon = kind === 'passkey' ? FingerprintIcon : KeyOutlinedIcon;
  const detail = address ? shortAddress(address) : 'Add';
  return (
    <ButtonBase
      component="a"
      href={href}
      onClick={onSelect}
      aria-current={selected ? 'page' : undefined}
      aria-label={`${label}${address ? `, ${address}` : ', not added yet'}${status ? `, ${status}` : ''}`}
      data-testid={`wallet-switcher-${kind}`}
      sx={{
        flex: '1 1 0', minWidth: 0, justifyContent: 'flex-start', gap: 1, px: 1.5, py: 1, borderRadius: '10px',
        textAlign: 'left',
        border: `1px solid ${selected ? palette.primary.main : 'transparent'}`,
        background: selected ? palette.background.row : 'transparent',
        '&:hover': { background: palette.background.hover },
        '&.Mui-focusVisible': { outline: `2px solid ${palette.primary.main}`, outlineOffset: 2 },
      }}
    >
      <Icon fontSize="small" sx={{ color: selected ? palette.primary.main : palette.text.secondary, flexShrink: 0 }} />
      <Box sx={{ minWidth: 0 }}>
        <Typography component="span" sx={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: palette.text.primary, whiteSpace: 'nowrap' }}>
          {label}
        </Typography>
        <Typography
          component="span"
          sx={{
            display: 'block', fontSize: '0.75rem', color: palette.text.secondary, whiteSpace: 'nowrap',
            overflow: 'hidden', textOverflow: 'ellipsis',
            fontFamily: address ? '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace' : undefined,
          }}
        >
          {detail}
        </Typography>
        {status && (
          <Typography component="span" sx={{ display: 'block', fontSize: '0.75rem', color: palette.text.secondary, whiteSpace: 'nowrap' }}>
            {status}
          </Typography>
        )}
      </Box>
    </ButtonBase>
  );
}

/**
 * "Your wallets": the passkey wallet and the 12-word wallet this browser holds, side by side. Choosing the other
 * one opens its page (client-side, so an unlocked 12-word wallet stays unlocked). Only in a build that serves the
 * passkey wallet. It never decrypts, signs or logs in.
 */
interface SwitcherProps {
  current: WalletKind;
  /** The signed-in first-party (12-word) address, if any (useOwnedFirstPartyAddress); it marks the 12-word tab Unlocked. */
  unlockedAddress?: string | null;
}

export default function WalletSwitcher(props: SwitcherProps) {
  // Outside a router (some page tests) the tabs are plain links.
  return useInRouterContext() ? <RoutedWalletSwitcher {...props} /> : <WalletSwitcherView {...props} />;
}

function RoutedWalletSwitcher(props: SwitcherProps) {
  const navigate = useNavigate();
  return <WalletSwitcherView {...props} navigate={navigate} />;
}

function WalletSwitcherView({ current, unlockedAddress = null, navigate }: SwitcherProps & { navigate?: (path: string) => void }) {
  const [saved, setSaved] = useState(readSavedWallets);
  // A wallet removed on this page (RemovePhraseWallet), or added or removed in another tab, must not stay listed.
  useEffect(() => {
    const changed = () => setSaved(readSavedWallets());
    window.addEventListener(WALLETS_CHANGED_EVENT, changed);
    window.addEventListener('storage', changed);
    return () => {
      window.removeEventListener(WALLETS_CHANGED_EVENT, changed);
      window.removeEventListener('storage', changed);
    };
  }, []);
  if (!FEATURES.passkeyWallet) return null;
  const phraseUnlocked = Boolean(saved.phrase && unlockedAddress?.toLowerCase() === saved.phrase);
  const hrefOf = (kind: WalletKind) =>
    kind === 'passkey' ? PASSKEY_WALLET_PATH : saved.phrase ? PHRASE_WALLET_PATH : PHRASE_SETUP_PATH;
  // A plain click stays in the app (an unlocked 12-word wallet stays unlocked); a modified click opens a new tab.
  const go = (kind: WalletKind) => (event: React.MouseEvent) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    if (kind === current) return;
    if (navigate) navigate(hrefOf(kind));
    else window.location.assign(hrefOf(kind));
  };
  return (
    <Box component="nav" aria-label="Your wallets" data-testid="wallet-switcher" sx={{ mb: 2 }}>
      <Box
        sx={{
          display: 'flex', gap: 0.5, p: 0.5, borderRadius: '12px',
          border: `1px solid ${palette.background.tertiary}`, background: palette.background.secondary,
        }}
      >
        <WalletTab kind="passkey" selected={current === 'passkey'} address={saved.passkey} href={hrefOf('passkey')} onSelect={go('passkey')} />
        <WalletTab
          kind="phrase"
          selected={current === 'phrase'}
          address={saved.phrase}
          status={saved.phrase ? (phraseUnlocked ? 'Unlocked' : 'Locked') : undefined}
          href={hrefOf('phrase')}
          onSelect={go('phrase')}
        />
      </Box>
      {saved.passkey && saved.phrase && (
        <Typography data-testid="wallet-switcher-note" sx={{ mt: 0.75, fontSize: '0.75rem', color: palette.text.secondary }}>
          Two separate wallets with different addresses. Weather stations join with the 12-word wallet.
        </Typography>
      )}
    </Box>
  );
}
