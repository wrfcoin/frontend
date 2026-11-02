import React, { useCallback, useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import { WrfButton } from '../components/DesignSystem/WrfButton';
import { WrfAlert } from '../components/DesignSystem/WrfAlert';
import { WrfBadge } from '../components/DesignSystem/WrfBadge';
import { palette } from '../components/DesignSystem/tokens';
import { formatBaseUnitsToWrf } from '../services/apiClient/number';
import { WRFCOIN_CHAIN_ID } from '../config/network';
import { bytesToHex, passkeyRecordAddress, type PasskeyCredentialRecord } from '../services/walletCrypto/passkey';
import { loadStoredPasskey } from '../services/walletCrypto/passkeySend';
import {
  BondPacketError,
  accountHex,
  approvalRefusal,
  approveBondPayout,
  parseBondPacket,
  type ParsedBondPacket,
} from '../services/walletCrypto/nodeBondPayout';

const mono = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
/** Biggest packet the node CLI writes is 40 KiB; leave room, refuse anything far larger. */
const MAX_FILE_BYTES = 64 * 1024;

export const NO_COINS_NOTE = 'Approving only names this wallet as where the bond\'s rewards are paid. It moves no coins from this wallet, and it cannot exit or withdraw the bond.';

type Credentials = Parameters<typeof approveBondPayout>[3];

function Row({ label, value, testId }: { label: string; value: string; testId?: string }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '10rem 1fr' }, gap: { xs: 0, sm: 1.5 }, py: 0.75, borderBottom: '1px solid var(--border-default, rgba(127,127,127,0.25))' }}>
      <Typography variant="body2" sx={{ color: palette.text.secondary }}>{label}</Typography>
      <Typography variant="body2" data-testid={testId} sx={{ fontFamily: mono, wordBreak: 'break-all' }}>{value}</Typography>
    </Box>
  );
}

function describeError(error: unknown): string {
  if (error instanceof BondPacketError) return error.message;
  const e = (error ?? {}) as { name?: string; message?: string };
  if (/NotAllowed|cancel/i.test(`${e.name ?? ''} ${e.message ?? ''}`)) return 'The passkey prompt was cancelled. Nothing was approved.';
  return 'The passkey could not sign this approval. Nothing was approved.';
}

/**
 * Approve this passkey wallet as the payout account of a node bond. The operator's node CLI writes an
 * unsigned deposit or update file; this page shows what it says, refuses unless it pays this wallet,
 * signs it with the passkey and hands back the same file with the approval filled in. No server calls.
 */
export default function PasskeyBondPayoutPage({
  chainId = WRFCOIN_CHAIN_ID,
  networkId = 'testnet',
  credentials,
  initialRecord,
}: { chainId?: string | null; networkId?: string; credentials?: Credentials; initialRecord?: PasskeyCredentialRecord | null } = {}) {
  const [record] = useState<PasskeyCredentialRecord | null>(() => (initialRecord !== undefined ? initialRecord : loadStoredPasskey()));
  const address = useMemo(() => (record ? passkeyRecordAddress(record) : null), [record]);
  const [text, setText] = useState('');
  const [packet, setPacket] = useState<ParsedBondPacket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [approved, setApproved] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);

  const read = useCallback((value: string) => {
    setText(value); setApproved(null); setError(null);
    if (!value.trim()) { setPacket(null); return; }
    try { setPacket(parseBondPacket(value)); } catch (e) { setPacket(null); setError(describeError(e)); }
  }, []);

  const upload = useCallback(async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) { setPacket(null); setError('That file is too large to be a node bond packet.'); return; }
    read(await file.text());
  }, [read]);

  const refusal = packet && address ? approvalRefusal(packet, address) : null;

  const approve = useCallback(async () => {
    if (!packet || !record) return;
    setBusy(true); setError(null);
    try {
      if (!chainId) throw new BondPacketError('The signing chain is not configured in this build. Nothing was approved.');
      const { json } = await approveBondPayout(packet, record, { chainId, networkId }, credentials);
      setApproved(json);
    } catch (e) { setError(describeError(e)); } finally { setBusy(false); }
  }, [packet, record, chainId, networkId, credentials]);

  const download = useCallback(() => {
    if (!approved || !packet) return;
    const alias = packet.authorization.serviceAlias.replace(/[^a-zA-Z0-9.-]+/g, '-').slice(0, 48) || 'node';
    const url = URL.createObjectURL(new Blob([approved], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `node-bond-${packet.authorization.action.toLowerCase()}-${alias}-payout-approved.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }, [approved, packet]);

  const a = packet?.authorization;

  return (
    <Box component="section" aria-label="Approve as payout for a node bond" sx={{ maxWidth: 720, mx: 'auto', px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
        <Typography variant="h4" component="h1" fontWeight={700} sx={{ m: 0 }}>Approve as payout for a node bond</Typography>
        <WrfBadge status="info" label="Preview" />
      </Box>
      <Typography sx={{ color: palette.text.secondary, mb: 2 }}>
        A node operator's tool writes an unsigned bond deposit or update. Load that file here to let this passkey wallet receive the node's rewards. The page checks the file, asks your passkey to sign, and gives the file back with the approval inside. Nothing is sent from this page.
      </Typography>

      {!record || !address ? (
        <WrfAlert severity="info" data-testid="bond-payout-no-passkey">
          There is no passkey wallet on this device yet. <RouterLink to="/wallet/passkey">Open the passkey wallet</RouterLink> to create one first.
        </WrfAlert>
      ) : (
        <Box sx={{ display: 'grid', gap: 2 }}>
          <Box>
            <Typography variant="overline" sx={{ color: palette.text.secondary }}>This passkey wallet</Typography>
            <Typography data-testid="bond-payout-address" sx={{ fontFamily: mono, fontSize: '0.8125rem', wordBreak: 'break-all' }}>{address}</Typography>
          </Box>

          <Box sx={{ display: 'grid', gap: 1 }}>
            <Typography component="label" htmlFor="bond-payout-json" variant="body2" sx={{ fontWeight: 600 }}>Unsigned bond file</Typography>
            <Box
              component="textarea"
              id="bond-payout-json"
              data-testid="bond-payout-json"
              value={text}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => read(e.target.value)}
              placeholder="Paste the JSON from the node tool, or choose the file below."
              spellCheck={false}
              rows={6}
              sx={{ width: '100%', boxSizing: 'border-box', fontFamily: mono, fontSize: '0.75rem', p: 1.25, borderRadius: 1, border: '1px solid var(--border-default, rgba(127,127,127,0.4))', background: 'transparent', color: 'inherit', resize: 'vertical' }}
            />
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
              <input ref={fileInput} type="file" accept="application/json,.json" hidden data-testid="bond-payout-file" onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = ''; }} />
              <WrfButton variant="outline" size="sm" onClick={() => fileInput.current?.click()}>Choose file</WrfButton>
              {text && <WrfButton variant="ghost" size="sm" onClick={() => read('')}>Clear</WrfButton>}
            </Box>
          </Box>

          {a && (
            <Box data-testid="bond-payout-summary">
              <Typography variant="h6" component="h2" sx={{ mb: 0.5 }}>What you are approving</Typography>
              <Row label="Action" value={a.action === 'Deposit' ? 'Deposit (new bond)' : a.action === 'Update' ? 'Update (change an existing bond)' : a.action} testId="bond-payout-action" />
              <Row label="Service alias" value={a.serviceAlias} testId="bond-payout-alias" />
              <Row label="Deployment id" value={bytesToHex(a.deploymentId)} testId="bond-payout-deployment" />
              <Row label="Owner" value={accountHex(a.ownerAccount)} testId="bond-payout-owner" />
              <Row label="Payout account" value={accountHex(a.payoutAccount)} testId="bond-payout-payout" />
              <Row label="Starts at epoch" value={a.effectiveEpoch.toString()} testId="bond-payout-epoch" />
              <Row label="Bond (paid by the owner)" value={`${formatBaseUnitsToWrf(a.amountUnits.toString()) ?? a.amountUnits.toString()} ${formatBaseUnitsToWrf(a.amountUnits.toString()) ? 'WRF' : 'base units'}`} testId="bond-payout-amount" />
              <Row label="Chain" value={chainId ? `${chainId} (${networkId})` : 'not configured'} />
              <WrfAlert severity="info" sx={{ mt: 1.5 }} data-testid="bond-payout-no-coins">{NO_COINS_NOTE}</WrfAlert>
            </Box>
          )}

          {refusal && <WrfAlert severity="error" role="alert" data-testid="bond-payout-refusal">{refusal}</WrfAlert>}

          {packet && !refusal && !approved && (
            <Box>
              <WrfButton variant="primary" onClick={() => void approve()} disabled={busy} data-testid="bond-payout-approve">
                {busy ? 'Waiting for your device…' : 'Approve with passkey'}
              </WrfButton>
            </Box>
          )}

          {approved && (
            <WrfAlert severity="success" data-testid="bond-payout-approved">
              <Typography sx={{ mb: 1 }}>Approved. Download the file and give it back to the node operator; their tool adds the remaining signatures and sends it.</Typography>
              <WrfButton variant="primary" size="sm" onClick={download} data-testid="bond-payout-download">Download approved file</WrfButton>
            </WrfAlert>
          )}
        </Box>
      )}

      {error && <WrfAlert severity="error" role="alert" sx={{ mt: 2 }} data-testid="bond-payout-error">{error}</WrfAlert>}
    </Box>
  );
}
