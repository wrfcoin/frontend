import React, { useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { WrfButton } from '../DesignSystem/WrfButton';
import { WrfInput } from '../DesignSystem/WrfInput';
import { WrfAlert } from '../DesignSystem/WrfAlert';
import { WrfModal } from '../DesignSystem/WrfModal';
import { readVault } from '../../services/walletVault';

/**
 * The 12 words are a cold backup (owner GO 2026-11-01): shown once at creation with a check step, never asked
 * for in normal use, and only shown again from here, behind a warning, a typed confirmation and the browser
 * password. Nothing leaves the browser: the words are decrypted locally, shown, and dropped when the dialog
 * closes or after REVEAL_SECONDS.
 */
export const REVEAL_CONFIRM_TEXT = 'show my phrase';
export const REVEAL_SECONDS = 60;
export const REVEAL_WARNINGS = [
  'Anyone who sees these words can take everything in this wallet, from anywhere, without asking you.',
  'WRFCoin will never ask for them: not by email, chat, phone call or on any website. If someone asked you to open this, stop here.',
  'You only need them to restore this wallet on a new device. Signing in and sending never need them.',
] as const;

type Step = 'warn' | 'password' | 'shown';

export default function RecoveryPhraseBackup({ address }: { address: string }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('warn');
  const [alone, setAlone] = useState(false);
  const [typed, setTyped] = useState('');
  const [password, setPassword] = useState('');
  const [words, setWords] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(REVEAL_SECONDS);

  const close = useCallback(() => {
    setOpen(false); setStep('warn'); setAlone(false); setTyped(''); setPassword('');
    setWords([]); setError(''); setBusy(false); setSecondsLeft(REVEAL_SECONDS);
  }, []);

  // The words disappear on their own: a phrase left on screen is a phrase someone else can photograph.
  useEffect(() => {
    if (step !== 'shown') return undefined;
    if (secondsLeft <= 0) { close(); return undefined; }
    const t = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [step, secondsLeft, close]);

  const confirmed = alone && typed.trim().toLowerCase() === REVEAL_CONFIRM_TEXT;

  const reveal = useCallback(async () => {
    setBusy(true); setError('');
    try {
      const saved = readVault();
      if (!saved || saved.address.toLowerCase() !== address.toLowerCase()) {
        setError('This browser does not hold the words for this address.');
        return;
      }
      const { unlockVault } = await import('../../services/walletVault');
      const unlocked = await unlockVault(password);
      setPassword('');
      setWords(unlocked.mnemonic.trim().split(/\s+/));
      unlocked.mnemonic = '';
      setSecondsLeft(REVEAL_SECONDS);
      setStep('shown');
    } catch {
      setError('Wrong password. Nothing was shown.');
    } finally { setBusy(false); }
  }, [address, password]);

  const actions = step === 'warn' ? (
    <>
      <WrfButton variant="ghost" onClick={close}>Cancel</WrfButton>
      <WrfButton variant="primary" onClick={() => setStep('password')} disabled={!confirmed} data-testid="phrase-reveal-continue">Continue</WrfButton>
    </>
  ) : step === 'password' ? (
    <>
      <WrfButton variant="ghost" onClick={close}>Cancel</WrfButton>
      <WrfButton variant="primary" onClick={() => void reveal()} loading={busy} disabled={busy || !password} data-testid="phrase-reveal-show">Show the words</WrfButton>
    </>
  ) : (
    <WrfButton variant="primary" onClick={close} data-testid="phrase-reveal-hide">Hide the words</WrfButton>
  );

  return (
    <>
      <WrfButton variant="ghost" size="md" onClick={() => setOpen(true)} data-testid="phrase-backup-open">
        Back up recovery phrase
      </WrfButton>
      <WrfModal open={open} onClose={close} maxWidth="sm" fullWidth title="Show your recovery phrase?" actions={actions}>
        {step === 'warn' && (
          <Box sx={{ display: 'grid', gap: 1.5 }} data-testid="phrase-reveal-warning">
            <WrfAlert severity="warning" title="Read this first">
              <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                {REVEAL_WARNINGS.map(w => <li key={w}>{w}</li>)}
              </Box>
            </WrfAlert>
            <Box component="label" sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', fontSize: '0.875rem' }}>
              <input type="checkbox" checked={alone} onChange={e => setAlone(e.target.checked)} data-testid="phrase-reveal-alone" />
              Nobody asked me to do this, and nobody can see my screen.
            </Box>
            <Typography variant="body2">
              To continue, type <strong>{REVEAL_CONFIRM_TEXT}</strong>
            </Typography>
            <WrfInput
              label="Type the words above"
              value={typed}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTyped(e.target.value)}
              autoComplete="off"
              inputProps={{ 'data-testid': 'phrase-reveal-typed' }}
            />
          </Box>
        )}
        {step === 'password' && (
          <Box sx={{ display: 'grid', gap: 1.5 }}>
            <Typography variant="body2">Enter the password that locks this browser&apos;s copy of the wallet.</Typography>
            <WrfInput
              label="Browser password"
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              autoComplete="current-password"
              inputProps={{ 'data-testid': 'phrase-reveal-password' }}
            />
            {error && <WrfAlert severity="error">{error}</WrfAlert>}
          </Box>
        )}
        {step === 'shown' && (
          <Box sx={{ display: 'grid', gap: 1.5 }}>
            <Box component="ol" aria-label="Recovery words" sx={{ m: 0, pl: 3, columns: 2, fontFamily: 'monospace' }}>
              {words.map((w, i) => <li key={i}>{w}</li>)}
            </Box>
            <Typography variant="body2" role="status">
              Write them on paper, in order, and keep it somewhere safe and offline. These words hide in {secondsLeft} s.
            </Typography>
          </Box>
        )}
      </WrfModal>
    </>
  );
}
