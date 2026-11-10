import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { WrfAlert, WrfCard, WrfEmptyState } from '../components/DesignSystem';
import { WRFCOIN_CHAIN_ID, explorerTxUrl } from '../config/network';
import { publicGet } from '../services/publicReadonlyApi';
import { readVault } from '../services/walletVault';
import { withOwnerKey } from '../services/walletCrypto/deviceSession';
import {
  DraftMismatch, FORECAST_LEADS, roundForecastValue, signForecastCommit, verifyForecastDraft,
} from '../services/walletCrypto/forecastCommit';
import { readForecastStatus, readMyForecasts, requestForecastDraft, submitForecast } from '../services/websiteForecastApi';
import { useForecasterThemeVars, When } from './publicForecastersShared';
import ForecastPracticeScore, { hasPracticePanel } from './ForecastPracticeScore';
import { useSignedInWallet } from './friendChallengesShared';
import { FEATURES } from '../config/features';
import ForecastWalletNotice, { forecastWalletNoticeReplaces, useForecastWallets } from './ForecastWalletNotice';
import './PublicForecastersPage.css';
import './FriendChallengesPage.css';
import './ForecastNewPage.css';

/**
 * Make a forecast from the website (/forecast/new; design 2026-11-05, epic 7, demo week of 12-07).
 *
 * A 12-word wallet picks a station, a variable and a lead, edits the suggested value (the station's last
 * reading), unlocks the wallet and submits. The browser checks the backend's draft and signs only the commit;
 * the backend relays it and reveals in the next block, so closing the tab after Submit loses nothing.
 * Passkeys cannot sign a forecast yet (the chain's commit takes an ed25519 key only).
 */

export const VARIABLES = {
  temperature_c: { label: 'Temperature', unit: '°C', field: 'temperatureC', min: -60, max: 60 },
  pressure_hpa: { label: 'Pressure', unit: 'hPa', field: 'pressureHpa', min: 850, max: 1100 },
};
const NETWORK_ID = 'testnet';
export const PRACTICE_NOTE = 'Practice score. Nothing is paid for it.';
const STATUS_LABEL = { committing: 'Sending to chain', committed: 'Committed, reveal next', revealing: 'Revealing', revealed: 'Revealed on chain', failed: 'Failed' };
const REFUSALS = {
  ALREADY_FORECAST: 'You already made a forecast for this station and lead time today (UTC). One per station, lead and day.',
  STATION_NOT_FOUND: 'That station is not registered for forecasts.',
  FORECASTER_MISMATCH: 'The signed key is not the wallet you are signed in with. Sign in again with this wallet.',
  NODE_REFUSED: 'The chain node refused this forecast.',
  WALLET_LOGIN_REQUIRED: 'Sign in with your wallet first.',
  DRAFT_EXPIRED: 'This forecast took too long to sign. Start again.',
  TOO_MANY_FORECASTS: 'You have made too many forecasts for now. Try again later.',
};
/** Plain words for a failed row; the raw code never reaches the page. */
export const failureLine = code => (typeof code === 'string' && code.startsWith('reveal_')
  ? 'Committed, but the reveal didn\'t reach the chain in time. You can try again.'
  : 'Didn\'t reach the chain; you can try again.');
const failure = result => {
  if (result.kind === 'refused') return REFUSALS[result.code] ?? result.message ?? 'The server refused this forecast.';
  if (result.kind === 'rate_limited') return 'Too many requests right now. Wait a moment and try again.';
  if (result.kind === 'signed_out') return 'Your wallet session ended. Sign in again on the Wallet page.';
  if (result.kind === 'not_found') return 'Website forecasts are not open on this server yet.';
  return 'Forecasts are unavailable right now. Try again in a minute.';
};

function TxLink({ hash }) {
  if (typeof hash !== 'string' || !hash) return <span className="fc-un">—</span>;
  const url = explorerTxUrl(hash);
  const short = `${hash.slice(0, 10)}…${hash.slice(-6)}`;
  return url ? <a href={url} target="_blank" rel="noreferrer" className="fn-mono">{short}</a> : <span className="fn-mono" title={hash}>{short}</span>;
}

const fmtValue = (value, variable) => (typeof value === 'number' && Number.isFinite(value) ? `${value.toFixed(1)} ${VARIABLES[variable]?.unit ?? ''}` : '—');

function ScoreCell({ score, variable }) {
  if (!score) return <span className="fc-un">After the target time</span>;
  if (score.status === 'scored') {
    return <span>measured {fmtValue(score.truth, variable)} · off by {typeof score.error === 'number' ? `${score.error > 0 ? '+' : ''}${score.error.toFixed(1)}` : '—'}</span>;
  }
  return <span className="fc-un">{score.status === 'unavailable' ? 'No reading to score against' : 'Waiting for readings'}</span>;
}

export function MyForecasts({ rows, loading, error, onRefresh }) {
  return (
    <section aria-label="My forecasts" className="ch-list">
      <div className="fc-section-head"><h2>My forecasts</h2>
        <button type="button" className="ch-action ch-action--ghost" onClick={onRefresh} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</button>
      </div>
      {error ? <WrfAlert severity="info" role="alert" className="ch-notice">{error}</WrfAlert> : null}
      {rows && rows.length === 0 ? <WrfEmptyState title="No forecasts yet" description="Make your first one above." /> : null}
      {(rows ?? []).map(f => (
        <article key={f.commitId} className="ch-board fn-row" aria-label={`Forecast ${f.commitId.slice(0, 8)}`}>
          <div className="ch-board-head">
            <div>
              <h3>{VARIABLES[f.variable]?.label ?? f.variable} {fmtValue(f.value, f.variable)} · {f.leadHours} h</h3>
              <p className="ch-desc">Station <span className="fn-mono">{f.stationAlias}</span> · target <When value={f.practiceScore?.validAt ?? f.validAt} withTime /></p>
            </div>
            <span className={`ch-status fn-status--${f.status}`}>{STATUS_LABEL[f.status] ?? f.status}</span>
          </div>
          <dl className="fn-facts">
            <div><dt>Commit</dt><dd><TxLink hash={f.commitTxHash} />{Number.isSafeInteger(f.committedAtHeight) ? ` · block ${f.committedAtHeight.toLocaleString('en-US')}` : ''}</dd></div>
            <div><dt>Reveal</dt><dd><TxLink hash={f.revealTxHash} />{Number.isSafeInteger(f.revealedAtHeight) ? ` · block ${f.revealedAtHeight.toLocaleString('en-US')}` : ''}</dd></div>
            {hasPracticePanel(f.practiceScore) ? null : <div><dt>Practice score</dt><dd><ScoreCell score={f.score} variable={f.variable} /></dd></div>}
          </dl>
          {hasPracticePanel(f.practiceScore) ? <ForecastPracticeScore score={f.practiceScore} leadHours={f.leadHours} /> : null}
          {f.status === 'failed' ? <p className="fn-fail">{failureLine(f.failure)}</p> : null}
        </article>
      ))}
    </section>
  );
}

function suggestionFrom(observation, variable) {
  const v = observation?.[VARIABLES[variable].field];
  return typeof v === 'number' && Number.isFinite(v) ? roundForecastValue(v) : null;
}

export default function ForecastNewPage() {
  const themeVars = useForecasterThemeVars();
  const you = useSignedInWallet();
  const vaultAddress = readVault()?.address?.toLowerCase() ?? null;
  const [open, setOpen] = useState('loading');
  const [stations, setStations] = useState(null);
  const [alias, setAlias] = useState('');
  const [variable, setVariable] = useState('temperature_c');
  const [lead, setLead] = useState(6);
  const [value, setValue] = useState('');
  const [edited, setEdited] = useState(false);
  const [suggested, setSuggested] = useState({ loading: false, value: null, at: null });
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [done, setDone] = useState(null);
  const [mine, setMine] = useState({ loading: false, rows: null, error: null });
  const poll = useRef(null);

  useEffect(() => {
    let live = true;
    readForecastStatus().then(r => { if (live) setOpen(r.kind === 'ok' && r.data?.enabled ? 'open' : r.kind === 'not_found' ? 'closed' : 'error'); });
    return () => { live = false; };
  }, []);

  useEffect(() => {
    if (open !== 'open') return undefined;
    let live = true;
    publicGet('/weather/stations').then(r => {
      if (!live) return;
      const list = r.kind === 'ok' && Array.isArray(r.data?.stations) ? r.data.stations.filter(s => /^st_[0-9a-f]{12}$/.test(s?.alias ?? '')) : [];
      list.sort((a, b) => Number(b.status === 'live') - Number(a.status === 'live'));
      setStations(list);
      if (list[0]) setAlias(prev => prev || list[0].alias);
    });
    return () => { live = false; };
  }, [open]);

  useEffect(() => {
    if (!alias) return undefined;
    let live = true;
    setSuggested({ loading: true, value: null, at: null });
    publicGet(`/stations/${alias}/observations?limit=1`).then(r => {
      if (!live) return;
      const row = r.kind === 'ok' && Array.isArray(r.data?.observations) ? r.data.observations[0] : null;
      const s = suggestionFrom(row, variable);
      setSuggested({ loading: false, value: s, at: row?.timestamp ?? null });
      if (!edited) setValue(s === null ? '' : String(s));
    });
    return () => { live = false; };
  }, [alias, variable, edited]);

  const loadMine = useCallback(async () => {
    if (!you) return;
    setMine(prev => ({ ...prev, loading: true }));
    const r = await readMyForecasts();
    setMine(r.kind === 'ok' ? { loading: false, rows: Array.isArray(r.data?.forecasts) ? r.data.forecasts : [], error: null } : { loading: false, rows: null, error: failure(r) });
  }, [you]);
  useEffect(() => { if (open === 'open') void loadMine(); }, [open, loadMine]);
  useEffect(() => {
    const pending = (mine.rows ?? []).some(f => f.status === 'committing' || f.status === 'committed' || f.status === 'revealing');
    if (pending && !poll.current) poll.current = setInterval(() => void loadMine(), 20_000);
    if (!pending && poll.current) { clearInterval(poll.current); poll.current = null; }
    return undefined;
  }, [mine.rows, loadMine]);
  useEffect(() => () => { if (poll.current) clearInterval(poll.current); }, []);

  const numeric = Number(value);
  const range = VARIABLES[variable];
  const valueOk = value.trim() !== '' && Number.isFinite(numeric) && numeric >= range.min && numeric <= range.max;
  const canSign = Boolean(you) && vaultAddress === you;
  // Multi-wallet builds name the wallet that signs, and offer to unlock or switch to it.
  const savedWallets = useForecastWallets(Boolean(FEATURES.multiWallet));
  const walletNotice = FEATURES.multiWallet && open === 'open';
  const noticeReplaces = walletNotice && forecastWalletNoticeReplaces(you, canSign, savedWallets);

  const submit = async e => {
    e.preventDefault();
    if (!canSign || !valueOk || !password) return;
    setBusy(true); setNotice(null); setDone(null);
    try {
      if (!WRFCOIN_CHAIN_ID) { setNotice({ tone: 'error', message: 'Signing chain is not configured on this site.' }); return; }
      const intent = { wallet: you, stationAlias: alias, variable, leadHours: lead, value: roundForecastValue(numeric) };
      const draft = await requestForecastDraft({ stationAlias: alias, variable, leadHours: lead, value: intent.value });
      if (draft.kind !== 'ok') { setNotice({ tone: 'warning', message: failure(draft) }); return; }
      let signed;
      try {
        const { stationId } = verifyForecastDraft(draft.data, intent);
        signed = await withOwnerKey(you, password, account => signForecastCommit(draft.data, stationId, { chainId: WRFCOIN_CHAIN_ID, networkId: NETWORK_ID }, account));
      } catch (err) {
        setNotice({ tone: 'error', message: err instanceof DraftMismatch ? `Not signed: the server's draft did not match your forecast (${err.message}).` : err?.message || 'Could not sign.' });
        return;
      } finally {
        setPassword('');
      }
      const result = await submitForecast(signed);
      if (result.kind !== 'ok') { setNotice({ tone: 'warning', message: failure(result) }); return; }
      setDone({ ...result.data, variable, value: intent.value, leadHours: lead });
      setEdited(false);
      void loadMine();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="public-read-page fc-page ch-page fn-page" data-testid="forecast-new" style={themeVars}>
      <header className="fc-head">
        <div>
          <h1>Make a forecast</h1>
          <p className="fc-lede">Forecast the weather at a real station. Your forecast goes on chain in a few minutes, and it is scored against what the station measures.</p>
          <p className="fc-note">{PRACTICE_NOTE}</p>
        </div>
      </header>

      {open === 'loading' ? <p className="fc-note">Loading…</p> : null}
      {open === 'closed' ? <WrfAlert severity="info" role="status" className="ch-notice">Website forecasts are not open yet. They switch on when the network is ready; see <Link to="/forecast-check">how forecasts score</Link> in the meantime.</WrfAlert> : null}
      {open === 'error' ? <WrfAlert severity="info" role="status" className="ch-notice">Forecasts are unavailable right now. Try again in a minute.</WrfAlert> : null}

      {walletNotice ? <ForecastWalletNotice you={you} canSign={canSign} saved={savedWallets} /> : null}

      {open === 'open' && !you && !noticeReplaces ? (
        <WrfCard component="section" aria-label="Sign in" className="fc-section" noPadding>
          <div className="ch-signin">
            <p><strong>Sign in with a 12-word wallet</strong> to make a forecast. Your wallet is your account: no email or name is asked for.</p>
            <Link className="ch-action" to="/wallet">Open your wallet</Link>
          </div>
          <div className="ch-signin ch-signin--code">
            <p>No wallet yet? Create one with 12 recovery words. Passkey wallets can't sign a forecast yet.</p>
            <Link className="ch-action ch-action--ghost" to="/onboarding">Create a 12-word wallet</Link>
          </div>
        </WrfCard>
      ) : null}

      {open === 'open' && you ? (
        <>
          {!canSign && !noticeReplaces ? (
            <WrfAlert severity="info" role="status" className="ch-notice">
              Forecasts are signed with your 12-word wallet on this device. This browser has no 12-word wallet for the signed-in address. <Link to="/onboarding">Set one up</Link> or sign in with it on the <Link to="/wallet">Wallet page</Link>. Passkeys can't sign a forecast yet.
            </WrfAlert>
          ) : null}
          <WrfCard component="section" aria-label="New forecast" className="fc-section" header={<div className="fc-section-head"><h2>New forecast</h2></div>} noPadding>
            <form className="ch-form" onSubmit={submit} aria-label="New forecast">
              <label className="ch-field">Station
                <select value={alias} onChange={e => { setAlias(e.target.value); setEdited(false); }} disabled={!stations || stations.length === 0}>
                  {(stations ?? []).map(s => <option key={s.alias} value={s.alias}>{s.name || 'Weather station'} · {s.alias}{s.status === 'live' ? '' : ' (not reporting)'}</option>)}
                </select>
              </label>
              {stations && stations.length === 0 ? <p className="fc-note">No stations are listed right now.</p> : null}
              <div className="ch-fields">
                <label className="ch-field">What
                  <select value={variable} onChange={e => { setVariable(e.target.value); setEdited(false); }}>
                    {Object.entries(VARIABLES).map(([k, v]) => <option key={k} value={k}>{v.label} ({v.unit})</option>)}
                  </select>
                </label>
                <label className="ch-field">How far ahead
                  <select value={lead} onChange={e => setLead(Number(e.target.value))}>
                    {FORECAST_LEADS.map(h => <option key={h} value={h}>{h} hour{h === 1 ? '' : 's'}</option>)}
                  </select>
                </label>
                <label className="ch-field">Your forecast ({range.unit})
                  <input inputMode="decimal" value={value} onChange={e => { setValue(e.target.value); setEdited(true); }} aria-describedby="fn-suggest" />
                </label>
              </div>
              <p id="fn-suggest" className="fc-note fn-suggest">
                {suggested.loading ? 'Reading the last measurement…'
                  : suggested.value !== null ? <>Suggested: {fmtValue(suggested.value, variable)}, the station's last reading (<When value={suggested.at} withTime />). Change it if you expect something else.</>
                    : 'No recent reading to suggest a value. Type your own.'}
              </p>
              {value.trim() !== '' && !valueOk ? <p className="fn-fail" role="alert">Enter a number from {range.min} to {range.max} {range.unit}.</p> : null}
              <label className="ch-field">Wallet password
                <input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} disabled={!canSign} />
              </label>
              <p className="fc-note">One forecast per station, lead time and day (UTC). Your first one is the one that counts.</p>
              <button type="submit" className="ch-action" disabled={busy || !canSign || !alias || !valueOk || !password}>{busy ? 'Signing and sending…' : 'Sign and submit'}</button>
            </form>
          </WrfCard>
          {notice ? <WrfAlert severity={notice.tone} role="alert" className="ch-notice">{notice.message}</WrfAlert> : null}
          {done ? (
            <WrfAlert severity="success" role="status" className="ch-notice" data-testid="forecast-submitted">
              <strong>{done.status === 'committing' ? 'Sending to chain.' : 'Committed.'}</strong> Your forecast ({VARIABLES[done.variable].label.toLowerCase()} {fmtValue(done.value, done.variable)}, {done.leadHours} h ahead) {done.status === 'committing' ? 'is on its way to the chain; the server keeps checking.' : <>is in the chain's queue: commit <TxLink hash={done.commitTxHash} />.</>} The server reveals it in the next block, even if you close this tab. After <When value={new Date(done.validAt * 1000).toISOString()} withTime /> it is scored on <Link to="/forecast-check">Forecast check</Link>.
            </WrfAlert>
          ) : null}
          <MyForecasts rows={mine.rows} loading={mine.loading} error={mine.error} onRefresh={() => void loadMine()} />
        </>
      ) : null}
    </div>
  );
}
