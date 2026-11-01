import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { WrfAlert, WrfCard, WrfEmptyState } from '../components/DesignSystem';
import { walletCall } from '../services/walletApi';
import { useForecasterThemeVars } from './publicForecastersShared';
import { ChallengeCard, INVITE_CODE_RE, POINTS_NOTE, useSignedInWallet } from './friendChallengesShared';
import './PublicForecastersPage.css';
import './FriendChallengesPage.css';

/**
 * Friend challenges (/challenges; backend#249, owner demo queue 2026-11-01 item 8): "two friends start a
 * 7-day collection challenge and watch each other's counts". The same service as the phone screen.
 *
 * Reads GET /api/challenges and writes POST /api/challenges and /api/challenges/join, all as the signed-in
 * wallet (its login token is the only credential; nothing about a person is asked for or stored). Counts
 * come from the chain on the server; this page never counts anything itself.
 */

const LENGTHS = [
  { hours: 24, label: '1 day' },
  { hours: 72, label: '3 days' },
  { hours: 168, label: '7 days' },
  { hours: 336, label: '14 days' },
];
const TARGETS = [10, 25, 50, 100, 250];
const REFUSALS = {
  NO_SUCH_CODE: 'No challenge matched that invite code.',
  ALREADY_JOINED: 'You already joined this challenge.',
  CHALLENGE_FULL: 'This challenge is already full.',
  CHALLENGE_ENDED: 'This challenge has ended.',
  TOO_MANY_ACTIVE: 'You already run 5 challenges. Finish one first.',
  WALLET_LOGIN_REQUIRED: 'Sign in with your wallet first.',
};
const failure = result => {
  if (result.kind === 'refused') return REFUSALS[result.code] ?? result.message ?? 'The server refused this.';
  if (result.kind === 'rate_limited') return 'Too many requests right now. Please wait a moment and try again.';
  if (result.kind === 'signed_out') return 'Your wallet session ended. Sign in again on the Wallet page.';
  if (result.kind === 'not_found') return 'Friend challenges are not switched on for this server yet.';
  return 'Challenges are unavailable right now.';
};

function OpenByCode() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const normalized = code.trim().toUpperCase();
  return (
    <form className="ch-inline" onSubmit={e => { e.preventDefault(); if (INVITE_CODE_RE.test(normalized)) navigate(`/challenges/${normalized}`); }}>
      <label className="ch-field">Invite code<input value={code} onChange={e => setCode(e.target.value)} placeholder="ABCD-2345" maxLength={9} autoCapitalize="characters" /></label>
      <button type="submit" className="ch-action ch-action--ghost" disabled={!INVITE_CODE_RE.test(normalized)}>Open board</button>
    </form>
  );
}

function CreateForm({ onDone, busy, setBusy }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [format, setFormat] = useState('headToHead');
  const [targetScore, setTargetScore] = useState(50);
  const [durationHours, setDurationHours] = useState(168);
  const submit = async e => {
    e.preventDefault();
    setBusy(true);
    const result = await walletCall('POST', '/challenges', { title: title.trim(), description: description.trim(), format, targetScore, durationHours });
    setBusy(false);
    if (result.kind === 'ok') { setTitle(''); setDescription(''); onDone(result.data.challenges, 'Challenge created. Share its invite code with a friend.'); } else onDone(null, failure(result));
  };
  return (
    <form className="ch-form" onSubmit={submit} aria-label="Start a challenge">
      <label className="ch-field">Title<input value={title} onChange={e => setTitle(e.target.value)} maxLength={60} required placeholder="Coast collection race" /></label>
      <label className="ch-field">Description (optional)<input value={description} onChange={e => setDescription(e.target.value)} maxLength={200} /></label>
      <div className="ch-fields">
        <label className="ch-field">Format
          <select value={format} onChange={e => setFormat(e.target.value)}><option value="headToHead">Head-to-head</option><option value="team">Team battle</option></select>
        </label>
        <label className="ch-field">Target
          <select value={targetScore} onChange={e => setTargetScore(Number(e.target.value))}>{TARGETS.map(t => <option key={t} value={t}>{t} readings</option>)}</select>
        </label>
        <label className="ch-field">Length
          <select value={durationHours} onChange={e => setDurationHours(Number(e.target.value))}>{LENGTHS.map(l => <option key={l.hours} value={l.hours}>{l.label}</option>)}</select>
        </label>
      </div>
      <button type="submit" className="ch-action" disabled={busy || !title.trim()}>{busy ? 'Working…' : 'Start challenge'}</button>
    </form>
  );
}

function JoinForm({ onDone, busy, setBusy }) {
  const [code, setCode] = useState('');
  const normalized = code.trim().toUpperCase();
  const submit = async e => {
    e.preventDefault();
    setBusy(true);
    const result = await walletCall('POST', '/challenges/join', { inviteCode: normalized });
    setBusy(false);
    if (result.kind === 'ok') { setCode(''); onDone(result.data.challenges, 'Joined. Your readings count from now on.'); } else onDone(null, failure(result));
  };
  return (
    <form className="ch-form" onSubmit={submit} aria-label="Join a challenge">
      <label className="ch-field">Invite code<input value={code} onChange={e => setCode(e.target.value)} placeholder="ABCD-2345" maxLength={9} autoCapitalize="characters" /></label>
      <button type="submit" className="ch-action" disabled={busy || !INVITE_CODE_RE.test(normalized)}>Join challenge</button>
    </form>
  );
}

export default function FriendChallengesPage() {
  const themeVars = useForecasterThemeVars();
  const you = useSignedInWallet();
  const [state, setState] = useState({ loading: Boolean(you), challenges: null, error: null });
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    if (!you) return;
    setState(prev => ({ ...prev, loading: true }));
    const result = await walletCall('GET', '/challenges');
    setState(result.kind === 'ok' ? { loading: false, challenges: result.data.challenges ?? [], error: null } : { loading: false, challenges: null, error: result });
  }, [you]);
  useEffect(() => { void load(); }, [load]);
  const onDone = (challenges, message) => {
    if (challenges) { setState({ loading: false, challenges, error: null }); setNotice({ tone: 'success', message }); } else setNotice({ tone: 'warning', message });
  };

  return (
    <div className="public-read-page fc-page ch-page" data-testid="friend-challenges" style={themeVars}>
      <header className="fc-head">
        <div>
          <h1>Friend challenges</h1>
          <p className="fc-lede">Challenge a friend to see who lands more weather readings on chain. Start one, share the invite code, and watch the counts.</p>
          <p className="fc-note">{POINTS_NOTE}</p>
        </div>
      </header>

      {!you ? (
        <WrfCard component="section" aria-label="Sign in" className="fc-section" noPadding>
          <div className="ch-signin">
            <p><strong>Sign in with your wallet</strong> to start or join a challenge. Your wallet is your account: no email or name is asked for.</p>
            <Link className="ch-action" to="/wallet">Open your wallet</Link>
          </div>
          <div className="ch-signin ch-signin--code"><p>Have an invite code? Anyone can look at a challenge board.</p><OpenByCode /></div>
        </WrfCard>
      ) : (
        <>
          <div className="fc-grid-2 ch-forms">
            <WrfCard component="section" aria-label="Start a challenge" className="fc-section" header={<div className="fc-section-head"><h2>Start a challenge</h2></div>} noPadding>
              <CreateForm onDone={onDone} busy={busy} setBusy={setBusy} />
            </WrfCard>
            <WrfCard component="section" aria-label="Join a challenge" className="fc-section" header={<div className="fc-section-head"><h2>Join with a code</h2></div>} noPadding>
              <JoinForm onDone={onDone} busy={busy} setBusy={setBusy} />
            </WrfCard>
          </div>
          {notice ? <WrfAlert severity={notice.tone} role="status" className="ch-notice">{notice.message}</WrfAlert> : null}

          <section aria-label="Your challenges" className="ch-list">
            <div className="fc-section-head"><h2>Your challenges</h2>
              <button type="button" className="ch-action ch-action--ghost" onClick={() => void load()} disabled={state.loading}>{state.loading ? 'Refreshing…' : 'Refresh counts'}</button>
            </div>
            {state.error ? <WrfAlert severity="info" role="alert" className="ch-notice">{failure(state.error)}</WrfAlert> : null}
            {state.challenges && state.challenges.length === 0 ? (
              <WrfEmptyState title="No challenges yet" description="Start one above, or join a friend's with their invite code." />
            ) : null}
            {(state.challenges ?? []).map(c => (
              <ChallengeCard key={c.id} challenge={c} you={you} footer={<Link className="fc-guide" to={`/challenges/${c.inviteCode}`}>Share board</Link>} />
            ))}
          </section>
        </>
      )}
    </div>
  );
}
