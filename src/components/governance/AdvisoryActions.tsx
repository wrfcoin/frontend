/**
 * Website propose/vote for advisory governance (owner decision 2026-11-09). Either wallet this browser holds
 * can sign: the passkey wallet (one passkey prompt) or the 12-word wallet (its password, once). The signed
 * action goes to the backend relay, which hands it to the node; it counts once it is in a block.
 *
 * Rendered only when the build flag is on AND the node reports advisory_governance active (the caller checks
 * both). Nothing here is carried out on chain beyond recording the text and the votes.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Link as RouterLink } from 'react-router-dom';
import { WrfButton } from '../DesignSystem/WrfButton';
import { WrfInput } from '../DesignSystem/WrfInput';
import { WrfAlert } from '../DesignSystem/WrfAlert';
import { palette } from '../DesignSystem/tokens';
import { readSavedWallets, shortAddress, PASSKEY_WALLET_PATH, PHRASE_WALLET_PATH, type WalletKind } from '../wallet/WalletSwitcher';
import { loadStoredPasskey } from '../../services/walletCrypto/passkeySend';
import type { CredentialsLike } from '../../services/walletCrypto/passkey';
import {
  MAX_SUMMARY_BYTES,
  MAX_TITLE_BYTES,
  advisoryTextProblem,
  fetchAdvisoryEligibility,
  fetchAdvisoryNonce,
  submitWithPasskey,
  submitWithPhrase,
  type AdvisoryAction,
  type AdvisorySubmitted,
} from '../../services/walletCrypto/advisoryGovernance';

const bodySx = { color: palette.text.secondary, fontSize: '0.875rem', m: 0 } as const;
const encoder = new TextEncoder();

export const DEPOSIT_NOTE =
  'Proposing holds 1 WRF from this wallet. It comes back when the vote is decided, and stays held if fewer than 3 wallets vote.';
export const PENDING_NOTE = 'Sent. It counts once it is in a block (about a minute). Refresh to see it.';

/** Relay and node refusals in words; anything else gets a short generic line. */
export function describeAdvisoryError(e: unknown): string {
  // ApiError carries the envelope's { code, message } as `details` and the message as `message`.
  const err = (e ?? {}) as { name?: string; message?: string; details?: { code?: unknown } };
  const text = `${err.name ?? ''} ${err.message ?? ''}`;
  if (/NotAllowed|cancel/i.test(text)) return /Nothing was sent/.test(text) ? (err.message as string) : 'The passkey prompt was cancelled. Nothing was sent.';
  const code = err.details?.code;
  const nodeMessage = typeof err.message === 'string' && err.message ? err.message : null;
  if (code === 'FEATURE_NOT_ACTIVE') return 'Advisory voting is not on in the network yet.';
  if (typeof code === 'string' && /ADVISORY|REFUSED|MEMPOOL/.test(code) && nodeMessage) {
    return `The network refused it: ${nodeMessage.replace(/^.*SP_ADVISORY_GOVERNANCE_REFUSED:\s*/, '').slice(0, 160)}`;
  }
  if (code === 'RATE_LIMITED' || /Too many/i.test(text)) return 'Too many tries. Wait a few minutes and try again.';
  const msg = err.message ?? '';
  return msg && msg.length < 160 ? msg : 'Could not send that. Try again in a minute.';
}

interface Signer {
  kind: WalletKind;
  address: string;
}

interface AdvisoryContextValue {
  signer: Signer | null;
  /**
   * Sign `action` with the chosen wallet (asks for the password first for the 12-word wallet). `subject`
   * names what is signed (the proposal title) in the password prompt.
   */
  sign: (action: AdvisoryAction, nonce: bigint, subject?: string) => Promise<AdvisorySubmitted>;
  askPassword: (title: string) => Promise<string>;
  /** True while any propose or vote on this card is running: one action at a time. */
  busy: boolean;
  /**
   * Runs one whole propose/vote action. Only one runs at a time for the card; a second one while the first
   * is running is refused (its buttons are disabled anyway).
   */
  exclusive: <T>(run: () => Promise<T>) => Promise<T>;
}

export const ANOTHER_ACTION_RUNNING = 'Finish or cancel the other vote or proposal first.';

const AdvisoryContext = createContext<AdvisoryContextValue | null>(null);

interface PasswordAsk { title: string; resolve: (pw: string) => void; reject: (e: Error) => void }

function PasswordPanel({ ask, onDone }: { ask: PasswordAsk; onDone: () => void }) {
  const password = useRef<HTMLInputElement>(null);
  return (
    <Box data-testid="advisory-password" sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, p: 1.5, borderRadius: '10px', backgroundColor: palette.background.row }}>
      <Typography sx={{ fontWeight: 600, m: 0 }}>{ask.title}</Typography>
      <WrfInput
        ref={password}
        type="password"
        label="Wallet password"
        autoComplete="off"
        prefixIcon={<LockOutlinedIcon fontSize="small" />}
        helperText="Unlocks your recovery phrase once to sign. Not stored."
      />
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <WrfButton variant="primary" size="sm" onClick={() => {
          const pw = password.current?.value ?? '';
          if (password.current) password.current.value = '';
          ask.resolve(pw);
          onDone();
        }}>Sign and send</WrfButton>
        <WrfButton variant="ghost" size="sm" onClick={() => { ask.reject(new Error('Cancelled. Nothing was sent.')); onDone(); }}>Cancel</WrfButton>
      </Box>
    </Box>
  );
}

/**
 * Holds the chosen wallet for the whole advisory card and renders the wallet picker. Children (the propose
 * form and every row's vote buttons) sign through the context.
 */
export function AdvisoryActionsProvider({ children, credentials }: { children: React.ReactNode; credentials?: CredentialsLike }) {
  const saved = useMemo(() => readSavedWallets(), []);
  const choices: Signer[] = [
    ...(saved.passkey ? [{ kind: 'passkey' as const, address: saved.passkey }] : []),
    ...(saved.phrase ? [{ kind: 'phrase' as const, address: saved.phrase }] : []),
  ];
  const [chosen, setChosen] = useState<WalletKind | null>(choices[0]?.kind ?? null);
  const signer = choices.find(c => c.kind === chosen) ?? null;
  const [pending, setPending] = useState<PasswordAsk | null>(null);
  const pendingRef = useRef<PasswordAsk | null>(null);
  const runningRef = useRef(false);
  const [busy, setBusy] = useState(false);

  // One password slot. A new ask settles the one it replaces (rejected), so no action is left waiting forever.
  const askPassword = useCallback((title: string) => new Promise<string>((resolve, reject) => {
    pendingRef.current?.reject(new Error('Cancelled. Nothing was sent.'));
    const ask: PasswordAsk = { title, resolve, reject };
    pendingRef.current = ask;
    setPending(ask);
  }), []);
  const closePassword = useCallback(() => { pendingRef.current = null; setPending(null); }, []);
  // Leaving the page settles an open prompt too.
  useEffect(() => () => { pendingRef.current?.reject(new Error('Cancelled. Nothing was sent.')); pendingRef.current = null; }, []);

  const exclusive = useCallback(async <T,>(run: () => Promise<T>): Promise<T> => {
    if (runningRef.current) throw new Error(ANOTHER_ACTION_RUNNING);
    runningRef.current = true;
    setBusy(true);
    try {
      return await run();
    } finally {
      runningRef.current = false;
      setBusy(false);
    }
  }, []);

  const sign = useCallback(async (action: AdvisoryAction, nonce: bigint, subject?: string) => {
    if (!signer) throw new Error('Open a wallet on this device first.');
    if (signer.kind === 'passkey') {
      const record = loadStoredPasskey();
      if (!record) throw new Error('The passkey wallet is not on this device.');
      return submitWithPasskey({ record, action, nonce, credentials });
    }
    const named = subject ? ` “${subject.length > 80 ? `${subject.slice(0, 79)}…` : subject}”` : '';
    const password = await askPassword(action.kind === 'propose'
      ? `Sign the proposal${named}`
      : `Sign your vote ${action.approve ? 'for' : 'against'}${named || ` proposal ${action.proposalId}`}`);
    return submitWithPhrase({ owner: signer.address, password, action, nonce });
  }, [signer, credentials, askPassword]);

  const value = useMemo(() => ({ signer, sign, askPassword, busy, exclusive }), [signer, sign, askPassword, busy, exclusive]);

  return (
    <AdvisoryContext.Provider value={value}>
      <Box data-testid="advisory-actions" sx={{ display: 'grid', gap: 1.5, mb: 2 }}>
        {choices.length === 0 ? (
          <WrfAlert severity="info" data-testid="advisory-no-wallet">
            To propose or vote, open a wallet on this device: a <RouterLink to={PASSKEY_WALLET_PATH}>passkey wallet</RouterLink> or
            your <RouterLink to={PHRASE_WALLET_PATH}>12-word wallet</RouterLink>.
          </WrfAlert>
        ) : (
          <Box role="radiogroup" aria-label="Sign with" sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography sx={{ ...bodySx, mr: 0.5 }}>Sign with</Typography>
            {choices.map(c => (
              <WrfButton
                key={c.kind}
                role="radio"
                aria-checked={c.kind === chosen}
                data-testid={`advisory-signer-${c.kind}`}
                variant={c.kind === chosen ? 'primary' : 'outline'}
                size="sm"
                disabled={busy}
                onClick={() => setChosen(c.kind)}
              >
                {c.kind === 'passkey' ? 'Passkey wallet' : '12-word wallet'} · {shortAddress(c.address)}
              </WrfButton>
            ))}
          </Box>
        )}
        {pending ? <PasswordPanel key={pending.title} ask={pending} onDone={closePassword} /> : null}
        {children}
      </Box>
    </AdvisoryContext.Provider>
  );
}

/** The propose form (collapsed until opened). */
export function AdvisoryProposeForm({ onSubmitted }: { onSubmitted?: () => void }) {
  const ctx = useContext(AdvisoryContext);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  if (!ctx?.signer) return null;
  const titleBytes = encoder.encode(title).length;
  const summaryBytes = encoder.encode(summary).length;
  const problem = (title || summary) ? (advisoryTextProblem('title', title) ?? advisoryTextProblem('summary', summary)) : null;

  if (!open) {
    return (
      <Box>
        <WrfButton variant="outline" size="sm" data-testid="advisory-propose-open" onClick={() => { setOpen(true); setDone(null); }}>
          Propose something
        </WrfButton>
        {done ? <WrfAlert severity="success" sx={{ mt: 1 }} data-testid="advisory-propose-done">{done}</WrfAlert> : null}
      </Box>
    );
  }

  const submit = async () => {
    setBusy(true); setError(null);
    try {
      const r = await ctx.exclusive(async () => {
        const nonce = await fetchAdvisoryNonce(ctx.signer!.address);
        return ctx.sign({ kind: 'propose', title, summary }, nonce, title);
      });
      setDone(`${PENDING_NOTE}${r.proposalId ? ` Proposal ${r.proposalId}.` : ''}`);
      setOpen(false); setTitle(''); setSummary('');
      onSubmitted?.();
    } catch (e) {
      setError(describeAdvisoryError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box component="form" aria-label="Propose" data-testid="advisory-propose-form" onSubmit={e => { e.preventDefault(); void submit(); }}
      sx={{ display: 'grid', gap: 1.25, p: 1.5, borderRadius: '10px', border: '1px solid var(--border-default, rgba(148,163,184,0.3))' }}>
      <Typography sx={{ fontWeight: 700, m: 0 }}>New advisory proposal</Typography>
      <Typography sx={bodySx}>A title and a short text. Wallets vote for or against for about 24 hours. Nothing it says is carried out.</Typography>
      <WrfInput label="Title" value={title} onChange={e => setTitle(e.target.value.replace(/\n/g, ' '))} disabled={busy}
        helperText={`${titleBytes} / ${MAX_TITLE_BYTES} bytes, one line`} inputProps={{ 'data-testid': 'advisory-title' }} />
      <WrfInput label="Summary" value={summary} onChange={e => setSummary(e.target.value)} disabled={busy} multiline minRows={3}
        helperText={`${summaryBytes} / ${MAX_SUMMARY_BYTES} bytes`} inputProps={{ 'data-testid': 'advisory-summary' }} />
      <Typography sx={bodySx} data-testid="advisory-deposit-note">{DEPOSIT_NOTE}</Typography>
      {problem ? <WrfAlert severity="warning">{problem}</WrfAlert> : null}
      {error ? <WrfAlert severity="error" data-testid="advisory-error">{error}</WrfAlert> : null}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <WrfButton type="submit" variant="primary" size="sm" loading={busy} disabled={busy || ctx.busy || !title || !summary || problem !== null}
          data-testid="advisory-propose-submit">Sign and propose</WrfButton>
        <WrfButton variant="ghost" size="sm" disabled={busy} onClick={() => { setOpen(false); setError(null); }}>Cancel</WrfButton>
      </Box>
    </Box>
  );
}

/** For / against on one active proposal. Checks eligibility first, so a refusal is explained before signing. */
export function AdvisoryVoteButtons({ proposalId, title }: { proposalId: string; title?: string }) {
  const ctx = useContext(AdvisoryContext);
  const [busy, setBusy] = useState<'for' | 'against' | null>(null);
  const [note, setNote] = useState<{ severity: 'success' | 'error' | 'info'; text: string } | null>(null);
  if (!ctx?.signer) return null;

  const vote = async (approve: boolean) => {
    setBusy(approve ? 'for' : 'against'); setNote(null);
    try {
      const outcome = await ctx.exclusive(async () => {
        const e = await fetchAdvisoryEligibility(proposalId, ctx.signer!.address);
        if (!e.canVote || e.nextNonce === null) {
          return { severity: 'info' as const, text: e.voted ? `This wallet already voted ${e.voted}.` : (e.reason ? `This wallet can't vote: ${e.reason}.` : 'This wallet can\'t vote on this one.') };
        }
        await ctx.sign({ kind: 'vote', proposalId, approve }, BigInt(e.nextNonce), title);
        return { severity: 'success' as const, text: PENDING_NOTE };
      });
      setNote(outcome);
    } catch (err) {
      setNote({ severity: 'error', text: describeAdvisoryError(err) });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Box data-testid="advisory-vote" sx={{ display: 'grid', gap: 1, mt: 1 }}>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <WrfButton variant="outline" size="sm" loading={busy === 'for'} disabled={busy !== null || ctx.busy} onClick={() => void vote(true)} data-testid="advisory-vote-for">Vote for</WrfButton>
        <WrfButton variant="outline" size="sm" loading={busy === 'against'} disabled={busy !== null || ctx.busy} onClick={() => void vote(false)} data-testid="advisory-vote-against">Vote against</WrfButton>
      </Box>
      {note ? <WrfAlert severity={note.severity} data-testid="advisory-vote-note">{note.text}</WrfAlert> : null}
    </Box>
  );
}
