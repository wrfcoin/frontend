import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { WrfAlert, WrfCard, WrfEmptyState } from '../components/DesignSystem';
import { forecastDuelPath, publicGet, publicPost } from '../services/publicReadonlyApi';
import { walletCall } from '../services/walletApi';
import { CopyButton, useForecasterThemeVars } from './publicForecastersShared';
import { DUEL_ID_RE, DuelCard, FREE_PLAY_NOTE, useSignedInWallet } from './forecastDuelsShared';
import './PublicForecastersPage.css';
import './ForecastDuelsPage.css';

/**
 * One free-play duel (/duels/:id; backend#228, demo item 10). Reads GET /api/duels/<id>. A signed-in wallet
 * can accept an open duel and link its own forecast commit before the lock; anyone can hand in a linked
 * forecast's commit record after the reveal (POST /api/duels/<id>/record, no login: it proves itself).
 */

const REFUSALS = {
  OWN_DUEL: 'You opened this duel; another wallet must accept it.',
  NOT_OPEN: 'This duel already has two players.',
  NOT_INVITED: 'This duel is for another wallet.',
  LOCKED: 'This duel is past its lock time.',
  NOT_ON_CHAIN: 'The chain has no commit with this id yet. Commit your forecast first.',
  NOT_A_FORECAST: 'That commit is not a forecast.',
  STATION_MISMATCH: 'That forecast is for a different station.',
  TARGET_MISMATCH: 'That forecast is for a different hour than this duel.',
  ALREADY_LINKED: 'A forecast is already linked for you, or that forecast is used elsewhere.',
  NOT_LINKED: 'That commit is not linked to this duel.',
  NOT_REVEALED: 'Reveal the forecast on chain first.',
  COMMIT_MISMATCH: 'These files do not hash to that commit id.',
  NOT_A_PLAYER: 'Only the two players can link forecasts.',
};
const say = result => (result.kind === 'refused' ? (REFUSALS[result.code] ?? result.message ?? 'The server refused this.')
  : result.kind === 'signed_out' ? 'Your wallet session ended. Sign in again on the Wallet page.'
    : result.kind === 'rate_limited' ? 'Too many requests right now. Please wait a moment and try again.' : 'Duels are unavailable right now.');

function LinkForecast({ id, onChanged, setNotice }) {
  const [commitId, setCommitId] = useState('');
  const value = commitId.trim().toLowerCase();
  const submit = async e => {
    e.preventDefault();
    const result = await walletCall('POST', `/duels/${id}/forecast`, { commitId: value });
    if (result.kind === 'ok') { setCommitId(''); setNotice({ tone: 'success', message: 'Forecast linked. Reveal it after the target hour, then hand in its record below.' }); onChanged(); } else setNotice({ tone: 'warning', message: say(result) });
  };
  return (
    <form className="du-inline" onSubmit={submit} aria-label="Link your forecast">
      <label className="du-field">Your forecast commit id<input value={commitId} onChange={e => setCommitId(e.target.value)} placeholder="64 hex characters from commit.json" spellCheck={false} /></label>
      <button type="submit" className="du-action" disabled={!/^[0-9a-f]{64}$/.test(value)}>Link forecast</button>
    </form>
  );
}

function HandInRecord({ id, onChanged, setNotice }) {
  const [commitText, setCommitText] = useState('');
  const [dataText, setDataText] = useState('');
  const submit = async e => {
    e.preventDefault();
    let commit;
    try { commit = JSON.parse(commitText); } catch { setNotice({ tone: 'warning', message: 'commit.json is not valid JSON.' }); return; }
    const result = await publicPost(`/duels/${id}/record`, {
      commitId: String(commit?.commit_id ?? '').toLowerCase(), nonce: commit?.nonce, timestamp: commit?.timestamp, data: dataText.replace(/\r\n/g, '\n').trim(),
    });
    if (result.kind === 'ok') { setNotice({ tone: 'success', message: 'Record checked against the chain.' }); onChanged(); } else setNotice({ tone: 'warning', message: say(result) });
  };
  return (
    <form className="du-form" onSubmit={submit} aria-label="Hand in a forecast record">
      <div className="du-fields du-fields--2">
        <label className="du-field">commit.json<textarea rows={4} value={commitText} onChange={e => setCommitText(e.target.value)} spellCheck={false} /></label>
        <label className="du-field">data.json<textarea rows={4} value={dataText} onChange={e => setDataText(e.target.value)} spellCheck={false} /></label>
      </div>
      <button type="submit" className="du-action" disabled={!commitText.trim() || !dataText.trim()}>Hand in record</button>
    </form>
  );
}

export default function ForecastDuelPage() {
  const { id } = useParams();
  const path = DUEL_ID_RE.test(String(id ?? '')) ? forecastDuelPath(String(id)) : null;
  const themeVars = useForecasterThemeVars();
  const you = useSignedInWallet();
  const [state, setState] = useState({ loading: Boolean(path), result: null });
  const [notice, setNotice] = useState(null);
  const load = useCallback(() => {
    if (!path) return undefined;
    const controller = new globalThis.AbortController();
    setState(prev => ({ loading: true, result: prev.result }));
    publicGet(path, controller.signal).then(result => setState({ loading: false, result })).catch(() => {});
    return () => controller.abort();
  }, [path]);
  useEffect(() => load(), [load]);

  const shell = children => (
    <div className="public-read-page fc-page du-page" data-testid="forecast-duel" style={themeVars}>
      <Link className="fc-back" to="/duels">← Forecast duels</Link>
      {children}
    </div>
  );
  const { loading, result } = state;
  if (!path || result?.kind === 'not_found') return shell(<WrfEmptyState title="No duel here" description="Check the link, or forecast duels are not switched on for this server yet." />);
  if (loading && !result) return shell(<p className="fc-count" role="status">Loading the duel…</p>);
  if (result?.kind !== 'ok' || !result.data?.duel) {
    return shell(<WrfAlert severity="info" role="alert" className="fc-unavailable" actionLabel="Retry" onAction={load}>This duel is unavailable right now.</WrfAlert>);
  }
  const duel = result.data.duel;
  const isPlayer = you && (duel.creator?.address === you || duel.opponent?.address === you);
  const mine = isPlayer ? (duel.creator?.address === you ? duel.creator : duel.opponent) : null;
  const canAccept = you && !isPlayer && duel.phase === 'open' && (!duel.invitedOpponent || duel.invitedOpponent === you);
  const canLink = isPlayer && !mine?.commitId && (duel.phase === 'open' || duel.phase === 'committing');
  const needsRecords = (duel.phase === 'judging' || duel.phase === 'waiting_for_target') && [duel.creator, duel.opponent].some(e => e?.commitId && !e.recordVerified);
  const accept = async () => {
    const r = await walletCall('POST', `/duels/${duel.id}/accept`);
    if (r.kind === 'ok') { setNotice({ tone: 'success', message: 'You are in. Link your forecast before the lock.' }); load(); } else setNotice({ tone: 'warning', message: say(r) });
  };

  return shell(
    <>
      <header className="fc-head">
        <div>
          <h1>Forecast duel</h1>
          <p className="fc-note">{FREE_PLAY_NOTE}</p>
        </div>
        <div className="fc-head-side"><CopyButton text={`${globalThis.location?.origin ?? ''}/duels/${duel.id}`} label="Copy link to this duel" /></div>
      </header>
      <DuelCard duel={duel} you={you} link={false} />
      {notice ? <WrfAlert severity={notice.tone} role="status" className="du-notice">{notice.message}</WrfAlert> : null}
      {canAccept ? <div className="du-cta"><button type="button" className="du-action" onClick={() => void accept()}>Accept this duel</button></div> : null}
      {!you && duel.phase === 'open' ? <p className="fc-note"><Link className="fc-guide" to="/wallet">Sign in with your wallet</Link> to accept this duel.</p> : null}
      {canLink ? (
        <WrfCard component="section" aria-label="Link your forecast" className="fc-section" header={<div className="fc-section-head"><h2>Link your forecast</h2></div>} noPadding>
          <LinkForecast id={duel.id} onChanged={load} setNotice={setNotice} />
        </WrfCard>
      ) : null}
      {needsRecords ? (
        <WrfCard component="section" aria-label="Hand in a forecast record" className="fc-section" header={<div className="fc-section-head"><h2>Hand in a revealed forecast</h2></div>} noPadding>
          <p className="du-help">After revealing, paste the forecast&apos;s <code>commit.json</code> and <code>data.json</code>. The server checks they hash to the linked commit and target this hour.</p>
          <HandInRecord id={duel.id} onChanged={load} setNotice={setNotice} />
        </WrfCard>
      ) : null}
    </>,
  );
}
