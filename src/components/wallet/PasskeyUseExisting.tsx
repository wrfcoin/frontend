import React, { useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { WrfButton } from '../DesignSystem/WrfButton';
import { WrfAlert } from '../DesignSystem/WrfAlert';
import { WrfModal } from '../DesignSystem/WrfModal';
import { palette } from '../DesignSystem/tokens';
import { passkeyRecordAddress, type PasskeyCredentialRecord } from '../../services/walletCrypto/passkey';
import {
  PasskeyRecoveryError,
  recoverPasskeyRecord,
  requestPasskeyRecoveryAssertion,
  type PasskeyRecoveryAssertion,
} from '../../services/walletCrypto/passkeyRecover';
import { EXISTING_CANCELLED_MESSAGE, EXISTING_DIFFERENT_MESSAGE, EXISTING_FAILED_MESSAGE } from '../../pages/passkeyMessages';

const mono = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

type Step =
  | { kind: 'idle' }
  | { kind: 'first-waiting' }
  | { kind: 'second-ready'; first: PasskeyRecoveryAssertion }
  | { kind: 'second-waiting'; first: PasskeyRecoveryAssertion }
  | { kind: 'replace'; found: PasskeyCredentialRecord };

function describeFailure(error: unknown): string {
  if (error instanceof PasskeyRecoveryError) {
    return error.code === 'DIFFERENT_CREDENTIAL' ? EXISTING_DIFFERENT_MESSAGE : EXISTING_FAILED_MESSAGE;
  }
  if (/NotAllowed|Abort/i.test(`${(error as { name?: string })?.name ?? ''}`)) return EXISTING_CANCELLED_MESSAGE;
  return EXISTING_FAILED_MESSAGE;
}

/**
 * "Use an existing passkey": opens a wallet whose passkey is already in a password manager, on a phone or
 * on a security key, in a browser that has no record of it. Two touches, each behind its own press, because
 * browsers may refuse a second prompt that no press started. Nothing is saved until both agree on one key,
 * and a different wallet already saved here is only replaced after the person says so.
 */
export default function PasskeyUseExisting({ rpId, current, disabled, onOpen, onActiveChange }: {
  /** The RP ID a new passkey gets on this host: it is the one the passkey must already belong to. */
  rpId: string;
  /** The wallet saved on this device, if any. */
  current: PasskeyCredentialRecord | null;
  disabled: boolean;
  onOpen: (record: PasskeyCredentialRecord) => void;
  onActiveChange: (active: boolean) => void;
}) {
  const [step, setStep] = useState<Step>({ kind: 'idle' });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const active = step.kind !== 'idle';
  useEffect(() => { onActiveChange(active); }, [active, onActiveChange]);

  const firstTouch = useCallback(async () => {
    setError(null); setNotice(null); setStep({ kind: 'first-waiting' });
    try {
      setStep({ kind: 'second-ready', first: await requestPasskeyRecoveryAssertion(rpId) });
    } catch (e) { setError(describeFailure(e)); setStep({ kind: 'idle' }); }
  }, [rpId]);

  const secondTouch = useCallback(async (first: PasskeyRecoveryAssertion) => {
    setError(null); setStep({ kind: 'second-waiting', first });
    try {
      const second = await requestPasskeyRecoveryAssertion(rpId, first.credentialId);
      const found = recoverPasskeyRecord(rpId, first, second);
      if (current && passkeyRecordAddress(current) === passkeyRecordAddress(found)) {
        setNotice('That passkey is the wallet already open here. Nothing changed.');
        setStep({ kind: 'idle' });
      } else if (current) {
        setStep({ kind: 'replace', found });
      } else {
        setStep({ kind: 'idle' });
        onOpen(found);
      }
    } catch (e) { setError(describeFailure(e)); setStep({ kind: 'idle' }); }
  }, [rpId, current, onOpen]);

  return (
    <Box sx={{ display: 'grid', gap: 1, justifyItems: 'start' }} data-testid="passkey-use-existing-section">
      {(step.kind === 'second-ready' || step.kind === 'second-waiting') ? (
        <>
          <Typography data-testid="passkey-existing-second-step">
            One more touch. A passkey never hands over its public key, so a second signature is what pins down your address. You only do this once in each browser.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <WrfButton variant="primary" onClick={() => void secondTouch(step.first)} disabled={step.kind === 'second-waiting'} data-testid="passkey-existing-second">
              {step.kind === 'second-waiting' ? 'Waiting for your passkey…' : 'Touch your passkey again'}
            </WrfButton>
            <WrfButton variant="ghost" onClick={() => setStep({ kind: 'idle' })} disabled={step.kind === 'second-waiting'}>Cancel</WrfButton>
          </Box>
        </>
      ) : (
        <>
          <WrfButton variant="outline" onClick={() => void firstTouch()} disabled={disabled || active} data-testid="passkey-use-existing">
            {step.kind === 'first-waiting' ? 'Waiting for your passkey…' : 'Use an existing passkey'}
          </WrfButton>
          <Typography variant="body2" data-testid="passkey-use-existing-note" sx={{ color: palette.text.secondary }}>
            {current
              ? 'Opens another wallet you already have. You are asked before it replaces this one on this device.'
              : 'For a passkey you already have in a password manager, on a phone or on a security key. It asks for the passkey twice, once only, and works out your address here in this browser, without asking a server.'}
          </Typography>
        </>
      )}
      {notice && <WrfAlert severity="info" data-testid="passkey-existing-notice">{notice}</WrfAlert>}
      {error && <WrfAlert severity="error" data-testid="passkey-existing-error">{error}</WrfAlert>}
      <WrfModal
        open={step.kind === 'replace' && current !== null}
        onClose={() => setStep({ kind: 'idle' })}
        maxWidth="sm"
        fullWidth
        title="Switch wallets on this device?"
        actions={(
          <>
            <WrfButton variant="ghost" onClick={() => setStep({ kind: 'idle' })} data-testid="passkey-existing-keep">Keep the current wallet</WrfButton>
            <WrfButton variant="primary" onClick={() => { if (step.kind === 'replace') { setStep({ kind: 'idle' }); onOpen(step.found); } }} data-testid="passkey-existing-switch">Switch to this wallet</WrfButton>
          </>
        )}
      >
        <Typography sx={{ mb: 1 }}>This device remembers one passkey wallet at a time.</Typography>
        <Typography variant="body2" sx={{ color: palette.text.secondary }}>Open now</Typography>
        <Typography data-testid="passkey-existing-current-address" sx={{ fontFamily: mono, fontSize: '0.8125rem', wordBreak: 'break-all', mb: 1 }}>{current ? passkeyRecordAddress(current) : ''}</Typography>
        <Typography variant="body2" sx={{ color: palette.text.secondary }}>The passkey you just used</Typography>
        <Typography data-testid="passkey-existing-found-address" sx={{ fontFamily: mono, fontSize: '0.8125rem', wordBreak: 'break-all', mb: 1 }}>{step.kind === 'replace' ? passkeyRecordAddress(step.found) : ''}</Typography>
        <Typography>Switching only changes which wallet this device opens. The current wallet and its funds stay on the chain, and you can come back to it with its own passkey and "Use an existing passkey".</Typography>
      </WrfModal>
    </Box>
  );
}
