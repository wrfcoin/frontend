import React, { useCallback, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { WrfButton } from '../components/DesignSystem/WrfButton';
import { WrfInput } from '../components/DesignSystem/WrfInput';
import { WrfAlert } from '../components/DesignSystem/WrfAlert';
import { WrfBadge } from '../components/DesignSystem/WrfBadge';
import { palette } from '../components/DesignSystem/tokens';
import { WRFCOIN_CHAIN_ID } from '../config/network';
import { registerPasskey, signPasskeyTransfer, passkeyRecordAddress, type PasskeyCredentialRecord } from '../services/walletCrypto/passkey';
import { wrfToBaseUnits } from '../services/walletCrypto/transferPayload';
import { recipientStatus } from '../services/walletCrypto/recipientStatus';
import { clearStoredPasskey, getPasskeyNonce, loadStoredPasskey, saveStoredPasskey, submitPasskeyTransfer } from '../services/walletCrypto/passkeySend';

const mono = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
const LAUNCH_ADDRESS = /^0x[0-9a-fA-F]{40}$/;

export const NOT_ACTIVE_MESSAGE = 'Passkey transfers are not active on the chain yet (they switch on at block 3400). Nothing was sent.';
export const UNSUPPORTED_MESSAGE = 'This browser or device cannot create a passkey that stays on the device. Try a recent Chrome, Safari or Edge with a screen lock enabled.';

function describeError(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  if (message === 'PASSKEY_NOT_ACTIVE') return NOT_ACTIVE_MESSAGE;
  if (message === 'PASSKEY_AUTHORIZATION_INVALID') return 'The chain rejected the passkey signature. Nothing was sent.';
  if (message === 'PASSKEY_WALLET_UNAVAILABLE') return 'The passkey wallet is switched off.';
  if (/NotAllowed|cancel/i.test(`${(error as any)?.name ?? ''} ${message}`)) return 'The passkey prompt was cancelled.';
  return 'The transfer could not be completed. Check the address and amount, then try again.';
}

/** Passkey wallet preview (flag VITE_ENABLE_PASSKEY_WALLET). The account lives in the device's authenticator, not a recovery phrase. */
export default function PasskeyWalletPage() {
  const [record, setRecord] = useState<PasskeyCredentialRecord | null>(() => loadStoredPasskey());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [sent, setSent] = useState<string | null>(null);
  const address = useMemo(() => (record ? passkeyRecordAddress(record) : null), [record]);

  const create = useCallback(async () => {
    setBusy(true); setError(null);
    try {
      const created = await registerPasskey(window.location.hostname, 'WRFCoin passkey wallet');
      saveStoredPasskey(created);
      setRecord(created);
    } catch (e) {
      setError(/NotAllowed|cancel/i.test(`${(e as any)?.name ?? ''}`) ? describeError(e) : UNSUPPORTED_MESSAGE);
    } finally { setBusy(false); }
  }, []);

  const send = useCallback(async () => {
    if (!record || !address) return;
    setBusy(true); setError(null); setSent(null);
    try {
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
    } catch (e) { setError(describeError(e)); } finally { setBusy(false); }
  }, [record, address, to, amount]);

  const forget = useCallback(() => { clearStoredPasskey(); setRecord(null); setSent(null); setError(null); }, []);

  return (
    <Box component="section" aria-label="Passkey wallet" sx={{ maxWidth: 640, mx: 'auto', px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
        <Typography variant="h4" component="h1" fontWeight={700} sx={{ m: 0 }}>Passkey wallet</Typography>
        <WrfBadge status="info" label="Preview" />
      </Box>
      <Typography sx={{ color: palette.text.secondary, mb: 3 }}>
        Your account is a passkey on this device, unlocked with your fingerprint, face or screen lock. There is no recovery phrase to write down. This passkey stays on this device, and the account cannot be recovered if you lose it.
      </Typography>

      {!record && (
        <Box>
          <WrfButton variant="primary" onClick={() => void create()} disabled={busy}>
            {busy ? 'Waiting for your device…' : 'Create passkey account'}
          </WrfButton>
        </Box>
      )}

      {record && address && (
        <Box sx={{ display: 'grid', gap: 2 }}>
          <Box>
            <Typography variant="overline" sx={{ color: palette.text.secondary }}>Your address</Typography>
            <Typography data-testid="passkey-address" sx={{ fontFamily: mono, fontSize: '0.8125rem', wordBreak: 'break-all' }}>{address}</Typography>
            <Typography variant="caption" sx={{ color: palette.text.secondary }}>Fund this address to start. Sending with it switches on at block 3400.</Typography>
          </Box>
          <WrfInput label="Recipient address" value={to} onChange={(e) => setTo(e.target.value)} placeholder="0x…" autoComplete="off" inputProps={{ style: { fontFamily: mono } }} />
          <WrfInput label="Amount (WRF)" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" autoComplete="off" />
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <WrfButton variant="primary" onClick={() => void send()} disabled={busy || !to.trim() || !amount.trim()}>
              {busy ? 'Waiting for your device…' : 'Send with passkey'}
            </WrfButton>
            <WrfButton variant="outline" onClick={forget} disabled={busy}>Forget on this device</WrfButton>
          </Box>
        </Box>
      )}

      {error && <WrfAlert severity="error" sx={{ mt: 2 }}>{error}</WrfAlert>}
      {sent && <WrfAlert severity="success" sx={{ mt: 2 }}>Submitted. Reference: <span style={{ fontFamily: mono, wordBreak: 'break-all' }}>{sent}</span></WrfAlert>}
    </Box>
  );
}
