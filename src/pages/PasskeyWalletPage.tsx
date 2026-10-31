import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { WrfButton } from '../components/DesignSystem/WrfButton';
import { WrfInput } from '../components/DesignSystem/WrfInput';
import { WrfAlert } from '../components/DesignSystem/WrfAlert';
import { WrfBadge } from '../components/DesignSystem/WrfBadge';
import { WrfModal } from '../components/DesignSystem/WrfModal';
import { palette } from '../components/DesignSystem/tokens';
import { AddressQr } from '../components/wallet/WalletEarningsPanel';
import { formatBaseUnitsToWrf } from '../services/apiClient/number';
import usePublicTestnetStats from '../hooks/usePublicTestnetStats';
import { WRFCOIN_CHAIN_ID } from '../config/network';
import { registerPasskey, signPasskeyTransfer, passkeyRecordAddress, type PasskeyAuthenticatorChoice, type PasskeyCredentialRecord } from '../services/walletCrypto/passkey';
import { wrfToBaseUnits } from '../services/walletCrypto/transferPayload';
import { recipientStatus } from '../services/walletCrypto/recipientStatus';
import { clearStoredPasskey, getPasskeyNonce, loadStoredPasskey, saveStoredPasskey, submitPasskeyTransfer } from '../services/walletCrypto/passkeySend';
import { getPasskeyPublicBalance } from '../services/walletCrypto/passkeyBalance';
import { PasskeyFaucetPanel } from '../components/wallet/PasskeyFaucetPanel';

const mono = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
const LAUNCH_ADDRESS = /^0x[0-9a-fA-F]{40}$/;

export type PasskeyBalanceView = { kind: 'loading' } | { kind: 'unavailable' } | { kind: 'ready'; units: string; height: number };

/** Last four characters of the address, lower-cased: what a person types to confirm forgetting the account. */
export function addressTail(address: string): string {
  return address.slice(-4).toLowerCase();
}

/**
 * Read the account's spendable balance from the public balance route (no login). Any failure, including
 * the route being switched off (404), is "unavailable" and never replaced by a number. Each read (a new
 * address or `refreshKey`) clears the previous number first, so an old balance is never shown as current.
 */
export function usePasskeyBalance(address: string | null, refreshKey = 0): PasskeyBalanceView {
  const [view, setView] = useState<PasskeyBalanceView>({ kind: 'loading' });
  const latest = useRef(0);
  useEffect(() => {
    if (!address) return undefined;
    const mine = ++latest.current;
    setView({ kind: 'loading' });
    Promise.resolve()
      .then(() => getPasskeyPublicBalance(address))
      .then(read => { if (latest.current === mine) setView({ kind: 'ready', units: read.units, height: read.height }); })
      .catch(() => { if (latest.current === mine) setView({ kind: 'unavailable' }); });
    return () => { latest.current += 1; };
  }, [address, refreshKey]);
  return view;
}

function unitsOf(amount: string): bigint | null {
  try { const v = wrfToBaseUnits(amount); return v > 0n ? v : null; } catch { return null; }
}

export const NOT_ACTIVE_MESSAGE = 'Passkey transfers are not active on the chain yet. Nothing was sent.';
export const UNSUPPORTED_MESSAGE = 'This browser or device cannot create a passkey that stays on the device. Try a recent Chrome, Safari or Edge with a screen lock enabled.';
export const SECURITY_KEY_UNSUPPORTED_MESSAGE = 'No passkey was created on a security key. Check that the key is plugged in (or held to the phone) and has a PIN set, then try again in a recent Chrome, Safari, Edge or Firefox.';
export const SECURITY_KEY_NOTE = 'A security key needs the physical key, a touch and its PIN every time you send. If you lose the key you lose the account: there is no recovery yet, so keep only small amounts on it.';
/** After a faucet claim, read the balance again once the next blocks have had time to include it. */
const FAUCET_SETTLE_MS = 15_000;

function describeError(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  if (message === 'PASSKEY_NOT_ACTIVE') return NOT_ACTIVE_MESSAGE;
  if (message === 'NO_FUNDS') return 'This account has no funds yet. Nothing was sent.';
  if (message === 'EXCEEDS_AVAILABLE') return 'That is more than the available balance. Nothing was sent.';
  if (message === 'PASSKEY_AUTHORIZATION_INVALID') return 'The chain rejected the passkey signature. Nothing was sent.';
  if (message === 'PASSKEY_WALLET_UNAVAILABLE') return 'The passkey wallet is switched off.';
  if (/NotAllowed|cancel/i.test(`${(error as any)?.name ?? ''} ${message}`)) return 'The passkey prompt was cancelled.';
  return 'The transfer could not be completed. Check the address and amount, then try again.';
}

/** Passkey wallet preview (flag VITE_ENABLE_PASSKEY_WALLET). The account lives in the device's authenticator, not a recovery phrase. */
export default function PasskeyWalletPage() {
  const [record, setRecord] = useState<PasskeyCredentialRecord | null>(() => loadStoredPasskey());
  const [busy, setBusy] = useState<false | PasskeyAuthenticatorChoice | 'send'>(false);
  const [error, setError] = useState<string | null>(null);
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [sent, setSent] = useState<string | null>(null);
  const address = useMemo(() => (record ? passkeyRecordAddress(record) : null), [record]);
  const [balanceRead, setBalanceRead] = useState(0);
  const balance = usePasskeyBalance(address, balanceRead);
  const chain = usePublicTestnetStats();
  const [copied, setCopied] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [typedTail, setTypedTail] = useState('');
  const availableUnits = balance.kind === 'ready' ? BigInt(balance.units) : null;
  const requested = unitsOf(amount);
  const noFunds = availableUnits === 0n;
  const exceeds = availableUnits !== null && requested !== null && requested > availableUnits;
  const balanceText = balance.kind === 'ready' ? formatBaseUnitsToWrf(balance.units) : null;

  const copyAddress = useCallback(async () => {
    if (!address) return;
    try { await navigator.clipboard.writeText(address); setCopied('copied'); setTimeout(() => setCopied('idle'), 2000); }
    catch { setCopied('failed'); }
  }, [address]);

  const create = useCallback(async (choice: PasskeyAuthenticatorChoice) => {
    setBusy(choice); setError(null);
    try {
      const created = await registerPasskey(window.location.hostname, 'WRFCoin passkey wallet', undefined, choice);
      saveStoredPasskey(created);
      setRecord(created);
    } catch (e) {
      setError(/NotAllowed|cancel/i.test(`${(e as any)?.name ?? ''}`) ? describeError(e)
        : choice === 'security-key' ? SECURITY_KEY_UNSUPPORTED_MESSAGE : UNSUPPORTED_MESSAGE);
    } finally { setBusy(false); }
  }, []);

  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (settleTimer.current) clearTimeout(settleTimer.current); }, []);
  const faucetClaimed = useCallback(() => {
    setBalanceRead(n => n + 1);
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => setBalanceRead(n => n + 1), FAUCET_SETTLE_MS);
  }, []);

  const send = useCallback(async () => {
    if (!record || !address) return;
    setBusy('send'); setError(null); setSent(null);
    try {
      if (noFunds) throw new Error('NO_FUNDS');
      if (exceeds) throw new Error('EXCEEDS_AVAILABLE');
      if (!LAUNCH_ADDRESS.test(to.trim()) || recipientStatus(to.trim()) === 'known-legacy-receive-only') throw new Error('bad recipient');
      if (!WRFCOIN_CHAIN_ID) throw new Error('Signing chain is not configured');
      const amountBaseUnits = wrfToBaseUnits(amount);
      if (amountBaseUnits <= 0n) throw new Error('bad amount');
      const nonce = BigInt(await getPasskeyNonce(address));
      const body = await signPasskeyTransfer(record, {
        chainId: WRFCOIN_CHAIN_ID, networkId: 'testnet', from: address, to: to.trim().toLowerCase(), amountBaseUnits, nonce,
      });
      const result = await submitPasskeyTransfer(body);
      setSent(result.txHash);
      setAmount('');
      setBalanceRead(n => n + 1);
    } catch (e) { setError(describeError(e)); } finally { setBusy(false); }
  }, [record, address, to, amount, noFunds, exceeds]);

  const forget = useCallback(() => { clearStoredPasskey(); setRecord(null); setSent(null); setError(null); setConfirmOpen(false); setTypedTail(''); }, []);
  const tailOk = address !== null && typedTail.trim().toLowerCase() === addressTail(address);

  return (
    <Box component="section" aria-label="Passkey wallet" sx={{ maxWidth: 640, mx: 'auto', px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
        <Typography variant="h4" component="h1" fontWeight={700} sx={{ m: 0 }}>Passkey wallet</Typography>
        <WrfBadge status="info" label="Preview" />
      </Box>
      <Typography sx={{ color: palette.text.secondary, mb: 3 }}>
        Your account is a passkey: on this device, unlocked with your fingerprint, face or screen lock, or on a hardware security key you plug in or tap. There is no recovery phrase to write down. The passkey is tied to this site ("{window.location.hostname}"): another address, such as www versus the bare domain, is a different account. If you lose the passkey, the account cannot be recovered.
      </Typography>

      {!record && (
        <Box sx={{ display: 'grid', gap: 1.5, justifyItems: 'start' }}>
          <WrfButton variant="primary" onClick={() => void create('any')} disabled={busy !== false} data-testid="passkey-create">
            {busy === 'any' ? 'Waiting for your device…' : 'Create passkey account'}
          </WrfButton>
          <WrfButton variant="outline" onClick={() => void create('security-key')} disabled={busy !== false} data-testid="passkey-create-security-key">
            {busy === 'security-key' ? 'Touch your security key…' : 'Use a security key (YubiKey)'}
          </WrfButton>
          <Typography variant="body2" data-testid="passkey-security-key-note" sx={{ color: palette.text.secondary }}>
            {SECURITY_KEY_NOTE}
          </Typography>
        </Box>
      )}

      {record && address && (
        <Box sx={{ display: 'grid', gap: 2 }}>
          <Box>
            <Typography variant="overline" sx={{ color: palette.text.secondary }}>Your address</Typography>
            <Typography data-testid="passkey-address" sx={{ fontFamily: mono, fontSize: '0.8125rem', wordBreak: 'break-all' }}>{address}</Typography>
            <Typography variant="caption" sx={{ color: palette.text.secondary }}>Fund this address to start.</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mt: 1.5 }}>
              <AddressQr value={address} size={132} />
              <Box sx={{ display: 'grid', gap: 0.75 }}>
                <WrfButton variant="outline" size="sm" onClick={() => void copyAddress()} data-testid="passkey-copy">
                  {copied === 'copied' ? 'Copied' : 'Copy address'}
                </WrfButton>
                <Typography role="status" variant="caption" sx={{ color: palette.text.secondary }}>
                  {copied === 'copied' ? 'Address copied to the clipboard.' : copied === 'failed' ? 'Copy is not available here: select the address and copy it.' : 'Scan the code or copy the address to receive.'}
                </Typography>
              </Box>
            </Box>
          </Box>
          <Box data-testid="passkey-balance">
            <Typography variant="overline" sx={{ color: palette.text.secondary }}>Available balance</Typography>
            <Typography sx={{ fontWeight: 600 }}>
              {balance.kind === 'loading' ? 'Loading…' : balanceText !== null ? `${balanceText} WRF` : 'Unavailable'}
            </Typography>
            {balance.kind === 'ready' && (
              <Typography variant="caption" component="p" sx={{ color: palette.text.secondary, m: 0 }} data-testid="passkey-balance-height">
                Read at block {balance.height.toLocaleString('en-US')}.
              </Typography>
            )}
            {balance.kind === 'unavailable' && (
              <Typography variant="caption" sx={{ color: palette.text.secondary }}>
                The balance could not be read right now. Nothing is guessed: the chain checks the amount when you send.
              </Typography>
            )}
            <Typography variant="caption" component="p" sx={{ color: palette.text.secondary, m: 0 }} data-testid="passkey-activation">
              Sending is active once the chain reports it active.{' '}
              {chain.blockHeight !== null ? `Current block: ${chain.blockHeight.toLocaleString('en-US')}.` : 'Current block: unavailable.'}
            </Typography>
          </Box>
          <PasskeyFaucetPanel address={address} onClaimed={faucetClaimed} />
          <WrfInput label="Recipient address" value={to} onChange={(e) => setTo(e.target.value)} placeholder="0x…" autoComplete="off" inputProps={{ style: { fontFamily: mono } }} />
          <WrfInput label="Amount (WRF)" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" autoComplete="off" />
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <WrfButton variant="primary" onClick={() => void send()} disabled={busy !== false || !to.trim() || !amount.trim() || noFunds || exceeds}>
              {busy === 'send' ? 'Waiting for your device…' : 'Send with passkey'}
            </WrfButton>
            <WrfButton variant="outline" onClick={() => { setTypedTail(''); setConfirmOpen(true); }} disabled={busy !== false}>Forget on this device</WrfButton>
          </Box>
          {noFunds && <Typography role="status" variant="caption" sx={{ color: palette.text.secondary }}>This account has no funds yet, so sending is off.</Typography>}
          {exceeds && <WrfAlert severity="error" role="alert">That is more than the available balance.</WrfAlert>}
        </Box>
      )}

      <WrfModal
        open={confirmOpen && address !== null}
        onClose={() => { setConfirmOpen(false); setTypedTail(''); }}
        maxWidth="sm"
        fullWidth
        title="Forget this passkey account?"
        actions={(
          <>
            <WrfButton variant="ghost" onClick={() => { setConfirmOpen(false); setTypedTail(''); }}>Keep it</WrfButton>
            <WrfButton variant="primary" onClick={forget} disabled={!tailOk} data-testid="passkey-forget-confirm">Forget this account</WrfButton>
          </>
        )}
      >
        <Typography sx={{ mb: 1.5 }}>
          This removes the pointer to your passkey account from this device. Without it this device can no longer open the account, and it cannot be recovered here afterwards. Any funds sent to it stay on the chain but you will not be able to spend them from here.
        </Typography>
        <Typography sx={{ mb: 1.5 }}>
          To confirm, type the last 4 characters of your address: <strong data-testid="passkey-forget-hint" style={{ fontFamily: mono }}>{address ? addressTail(address) : ''}</strong>
        </Typography>
        <WrfInput
          label="Last 4 characters"
          value={typedTail}
          onChange={(e) => setTypedTail(e.target.value)}
          autoComplete="off"
          inputProps={{ 'data-testid': 'passkey-forget-tail', maxLength: 8, style: { fontFamily: mono } }}
        />
      </WrfModal>

      {error && <WrfAlert severity="error" sx={{ mt: 2 }}>{error}</WrfAlert>}
      {sent && <WrfAlert severity="success" sx={{ mt: 2 }}>Submitted. Reference: <span style={{ fontFamily: mono, wordBreak: 'break-all' }}>{sent}</span></WrfAlert>}
    </Box>
  );
}
