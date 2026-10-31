import React, { useCallback, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { WrfButton } from '../DesignSystem/WrfButton';
import { WrfInput } from '../DesignSystem/WrfInput';
import { WrfAlert } from '../DesignSystem/WrfAlert';
import { palette } from '../DesignSystem/tokens';
import { FAUCET_DISCLAIMER, faucetErrorCode, stationRegistrationService, type FaucetClaimResult } from '../../services/apiClient';
import { ApiError } from '../../utils/apiError';

const mono = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

/**
 * Same switch as /onboarding and /connect-station (owner ruling 2026-10-02 #14): the faucet pays nothing
 * until an operator funds it, so only the exact build value `true` offers a claim.
 */
function isFaucetOpen(): boolean {
  return import.meta.env?.VITE_FAUCET_OPEN === 'true';
}

export const FAUCET_MESSAGES = {
  ALREADY_CLAIMED: 'This address already received test coins in the last 24 hours. Try again tomorrow.',
  RATE_LIMITED: 'Too many requests from your network right now. Wait a few minutes, then try again.',
  FAUCET_EMPTY: 'The faucet is out of test coins right now. Try again later.',
  CAPTCHA_FAILED: 'That answer was not right, or the question expired. Here is a new question.',
  BAD_ADDRESS: 'The faucet cannot pay this address.',
  NETWORK: 'The faucet could not be reached. Check your connection, then try again.',
  QUESTION_FAILED: 'The question could not be loaded. Try again in a moment.',
  OTHER: 'The faucet could not send test coins right now. Try again later.',
} as const;

/** Plain-language text for a failed claim. Never shows the server's own wording. */
export function describeFaucetFailure(result: Pick<FaucetClaimResult, 'code' | 'status'>): string {
  switch (result.code) {
  case 'ALREADY_CLAIMED': return FAUCET_MESSAGES.ALREADY_CLAIMED;
  case 'RATE_LIMITED': return FAUCET_MESSAGES.RATE_LIMITED;
  case 'FAUCET_EMPTY': return FAUCET_MESSAGES.FAUCET_EMPTY;
  case 'CAPTCHA_FAILED': return FAUCET_MESSAGES.CAPTCHA_FAILED;
  case 'INVALID_ADDRESS':
  case 'EVM_ADDRESS_REQUIRED': return FAUCET_MESSAGES.BAD_ADDRESS;
  default: break;
  }
  if (!result.status) return FAUCET_MESSAGES.NETWORK;
  if (result.status === 429) return FAUCET_MESSAGES.RATE_LIMITED;
  if (result.status === 503) return FAUCET_MESSAGES.FAUCET_EMPTY;
  return FAUCET_MESSAGES.OTHER;
}

/** `0x1234abcd…9f8e7d`: enough to recognise a transaction without wrapping on a phone. */
export function shortTxHash(hash: string): string {
  return hash.length > 18 ? `${hash.slice(0, 10)}…${hash.slice(-6)}` : hash;
}

type Phase =
  | { kind: 'idle' }
  | { kind: 'loading-question' }
  | { kind: 'question'; challengeId: string; question: string }
  | { kind: 'claiming'; challengeId: string; question: string }
  | { kind: 'done'; amount: string | null; txHash: string | null };

export interface PasskeyFaucetPanelProps {
  address: string;
  /** Called after a successful claim so the page re-reads the balance from the chain. */
  onClaimed: () => void;
}

/**
 * "Get test coins" for a passkey account: the public onboarding faucet (sum question, then claim to this
 * address). No login and no Authorization header. The faucet's own `balance` field is never shown: the
 * page's balance comes only from its public balance read, refreshed through `onClaimed`.
 */
export function PasskeyFaucetPanel({ address, onClaimed }: PasskeyFaucetPanelProps) {
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadQuestion = useCallback(async () => {
    setPhase({ kind: 'loading-question' });
    setAnswer('');
    try {
      const challenge = await stationRegistrationService.requestFaucetChallenge();
      if (!challenge.challengeId || !challenge.question) throw new Error('FAUCET_CHALLENGE_INVALID');
      setPhase({ kind: 'question', challengeId: challenge.challengeId, question: challenge.question });
    } catch (e) {
      const code = faucetErrorCode(e);
      const status = e instanceof ApiError ? e.status : undefined;
      setError(code === 'RATE_LIMITED' || status === 429 ? FAUCET_MESSAGES.RATE_LIMITED
        : e instanceof ApiError && e.status === 0 ? FAUCET_MESSAGES.NETWORK : FAUCET_MESSAGES.QUESTION_FAILED);
      setPhase({ kind: 'idle' });
    }
  }, []);

  const start = useCallback(() => { setError(null); void loadQuestion(); }, [loadQuestion]);

  const claim = useCallback(async () => {
    if (phase.kind !== 'question') return;
    setError(null);
    setPhase({ ...phase, kind: 'claiming' });
    const result = await stationRegistrationService.claimFaucet(address, phase.challengeId, answer.trim());
    if (result.success) {
      setPhase({ kind: 'done', amount: result.amount ?? null, txHash: result.txHash ?? null });
      onClaimed();
      return;
    }
    setError(describeFaucetFailure(result));
    // The server spends the question on every claim, right or wrong: a wrong answer gets a fresh one.
    if (result.code === 'CAPTCHA_FAILED') void loadQuestion();
    else setPhase({ kind: 'idle' });
  }, [phase, address, answer, onClaimed, loadQuestion]);

  if (!isFaucetOpen()) {
    return (
      <Box component="section" aria-label="Get test coins" data-testid="passkey-faucet">
        <Typography variant="overline" sx={{ color: palette.text.secondary }}>Get test coins</Typography>
        <Typography variant="body2" data-testid="passkey-faucet-closed" sx={{ color: palette.text.secondary }}>
          The testnet faucet has no test coins to give out yet. Your address above can still receive WRF from anyone.
        </Typography>
      </Box>
    );
  }

  const busy = phase.kind === 'loading-question' || phase.kind === 'claiming';
  return (
    <Box component="section" aria-label="Get test coins" data-testid="passkey-faucet" sx={{ display: 'grid', gap: 1.25 }}>
      <Typography variant="overline" sx={{ color: palette.text.secondary, lineHeight: 1.5 }}>Get test coins</Typography>
      <Typography variant="body2" sx={{ color: palette.text.secondary, mt: -0.5 }}>
        The testnet faucet sends free test coins to this address, once a day. Answer a short sum to prove you are a person. {FAUCET_DISCLAIMER}
      </Typography>

      {(phase.kind === 'idle' || phase.kind === 'loading-question') && (
        <Box>
          <WrfButton variant="outline" onClick={start} loading={phase.kind === 'loading-question'} data-testid="passkey-faucet-start">
            {error ? 'Try again' : 'Get test coins'}
          </WrfButton>
        </Box>
      )}

      {(phase.kind === 'question' || phase.kind === 'claiming') && (
        <Box sx={{ display: 'grid', gap: 1.25 }}>
          <Typography data-testid="passkey-faucet-question" sx={{ fontWeight: 600 }}>{phase.question}</Typography>
          <WrfInput
            label="Your answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            inputMode="numeric"
            autoComplete="off"
            inputProps={{ 'data-testid': 'passkey-faucet-answer' }}
          />
          <Box>
            <WrfButton
              variant="primary"
              onClick={() => void claim()}
              loading={phase.kind === 'claiming'}
              disabled={busy || !answer.trim()}
              data-testid="passkey-faucet-claim"
            >
              Send test coins to this address
            </WrfButton>
          </Box>
        </Box>
      )}

      {phase.kind === 'done' && (
        <WrfAlert severity="success" role="status" data-testid="passkey-faucet-success">
          {phase.amount ? `${phase.amount} WRF test coins are on the way.` : 'Test coins are on the way.'}
          {phase.txHash && (
            <>
              {' '}Transaction <span title={phase.txHash} style={{ fontFamily: mono }}>{shortTxHash(phase.txHash)}</span>.
            </>
          )}
          {' '}The balance above updates once the chain includes it.
        </WrfAlert>
      )}

      {error && <WrfAlert severity="error" role="alert" data-testid="passkey-faucet-error">{error}</WrfAlert>}
    </Box>
  );
}

export default PasskeyFaucetPanel;
