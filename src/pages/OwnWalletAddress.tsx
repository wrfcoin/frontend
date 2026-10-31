import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import { useWallet } from '../contexts/WalletContext.jsx';
import { walletProviderManager } from '../services/walletProviders/WalletProviderManager.js';
import PhoneStationStatusCard from '../components/wallet/PhoneStationStatusCard';
import WalletEarningsPanel from '../components/wallet/WalletEarningsPanel';
import VaultSend from '../components/wallet/VaultSend';
import { readVault } from '../services/walletVault';
import { FEATURES } from '../config/features';
import { recipientStatus } from '../services/walletCrypto/recipientStatus';
import { WrfBadge } from '../components/DesignSystem/WrfBadge';
import { WrfButton } from '../components/DesignSystem/WrfButton';
import { WrfEmptyState } from '../components/DesignSystem/WrfEmptyState';
import { useIsDarkTheme } from '../theme/ThemeProvider';
import { WrfTooltip } from '../components/DesignSystem/WrfTooltip';
import { palette } from '../components/DesignSystem/tokens';

/** `0x7d29a4c1…6c5e0cb2`: the first 10 and last 8 characters. */
export function maskAddress(address: string): string {
  return address.length <= 20 ? address : `${address.slice(0, 10)}…${address.slice(-8)}`;
}

export const RECEIVE_CARD_ID = 'wallet-receive';
export const LOCKED_TITLE = 'Create, import or unlock your wallet';
/** Where the main wallet points people who would rather not keep a 12-word recovery phrase. */
export const PASSKEY_WALLET_PATH = '/wallet/passkey';
export const PASSKEY_PROMPT = 'Prefer no 12 words?';
export const PASSKEY_LINK_LABEL = 'Use a passkey wallet';
export const LOCKED_DESCRIPTION =
  'Your wallet lives in this browser. Unlock it with your password, or create or import one to see your address and activity.';

/** Only the first-party signing account can supply this page's address. */
export default function OwnWalletAddress() {
  const { account, activeProvider, isConnected, receiveOnly } = useWallet();
  const identity = walletProviderManager.getLoginIdentity();
  const ownsAddress = isConnected && activeProvider === 'custom' && !receiveOnly
    && typeof account === 'string' && identity?.scheme === 'ed25519'
    && identity.address.toLowerCase() === account.toLowerCase()
    // Every ordinary Receive/address/QR consumer must stay behind this guard.
    // An unknown third-party address is never verified by this owner check.
    && recipientStatus(account) !== 'known-legacy-receive-only';
  const ownerAddress = ownsAddress ? account : null;
  const navigate = useNavigate();
  const isDark = useIsDarkTheme();
  const openSetup = useCallback(() => navigate('/onboarding'), [navigate]);
  // A real link (href) so it can be opened in a new tab; a plain click stays in the app.
  const openPasskey = useCallback((event: React.MouseEvent) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    navigate(PASSKEY_WALLET_PATH);
  }, [navigate]);
  const [copied, setCopied] = useState(false);
  // Exact base units the earnings panel last read for this owner; null = unknown (Send then does not gate).
  const [availableUnits, setAvailableUnits] = useState<string | null>(null);
  const copyAddress = useCallback(async () => {
    if (!ownerAddress) return;
    try {
      await navigator.clipboard.writeText(ownerAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }, [ownerAddress]);
  const showReceive = useCallback(() => {
    document.getElementById(RECEIVE_CARD_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <Box component="section" aria-label="Your wallet" sx={{ maxWidth: 1120, mx: 'auto', px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 3 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" component="h1" fontWeight={700} sx={{ m: 0 }}>Your wallet</Typography>
          {ownerAddress && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
              <Typography
                component="span"
                title={ownerAddress}
                sx={{ fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.8125rem', color: palette.text.secondary }}
              >
                {maskAddress(ownerAddress)}
              </Typography>
              <WrfTooltip title={copied ? 'Copied' : 'Copy your address'}>
                <IconButton size="small" aria-label={copied ? 'Copied' : 'Copy your address'} onClick={() => void copyAddress()} sx={{ color: copied ? palette.success.main : palette.text.secondary }}>
                  {copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                </IconButton>
              </WrfTooltip>
              <WrfBadge status="active" label="Unlocked" />
            </Box>
          )}
        </Box>
        {ownerAddress && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <WrfButton variant="outline" size="md" startIcon={<QrCode2Icon fontSize="small" />} onClick={showReceive}>
              Receive
            </WrfButton>
            {FEATURES.walletSend && readVault()?.address.toLowerCase() === ownerAddress.toLowerCase()
              && <VaultSend key={ownerAddress} address={ownerAddress} availableUnits={availableUnits} />}
          </Box>
        )}
      </Box>

      {/* Only in a build with the passkey flag on, where /wallet/passkey is a route. */}
      {FEATURES.passkeyWallet && (
        <Box data-testid="wallet-passkey-link" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
          <Typography sx={{ color: palette.text.secondary }}>{PASSKEY_PROMPT}</Typography>
          <WrfButton variant="outline" size="sm" startIcon={<FingerprintIcon fontSize="small" />} href={PASSKEY_WALLET_PATH} onClick={openPasskey}>
            {PASSKEY_LINK_LABEL}
          </WrfButton>
        </Box>
      )}

      {!ownerAddress && (
        <Box
          // One panel: the empty state's gradient covers the actions too, so the buttons sit inside it with even spacing.
          sx={{
            border: `1px solid ${isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(148, 163, 184, 0.3)'}`,
            borderRadius: '16px',
            overflow: 'hidden',
            // The empty state's text follows the theme, so the panel behind it must too.
            background: isDark ? 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)' : 'linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 100%)',
          }}
          data-testid="wallet-locked"
        >
          <WrfEmptyState icon={LockOutlinedIcon} title={LOCKED_TITLE} description={LOCKED_DESCRIPTION} sx={{ pb: 3, background: 'transparent' }} />
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: 'center', pt: 0, pb: 5, px: 3 }}>
            <WrfButton variant="primary" onClick={openSetup}>Unlock wallet</WrfButton>
            <WrfButton variant="outline" onClick={openSetup}>Create new wallet</WrfButton>
            <WrfButton variant="outline" onClick={openSetup}>Import recovery phrase</WrfButton>
          </Box>
        </Box>
      )}

      {/* S3: balance, reward totals, activity and Receive; every read is Bearer-authenticated and owner-only.
          W28: the owner's own phone station; the status read is wallet-scoped, so only an owned address asks. */}
      <WalletEarningsPanel
        onAvailableUnits={setAvailableUnits}
        ownerAddress={ownerAddress}
        aside={<PhoneStationStatusCard ownerAddress={ownerAddress} />}
      />
    </Box>
  );
}
