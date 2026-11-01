import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { WrfAlert, WrfCard, WrfEmptyState } from '../components/DesignSystem';
import { FORECAST_DUELS_PATH, publicGet } from '../services/publicReadonlyApi';
import { walletCall } from '../services/walletApi';
import { FORECASTING_GUIDE_HREF, useForecasterThemeVars } from './publicForecastersShared';
import { DuelCard, FREE_PLAY_NOTE, useSignedInWallet } from './forecastDuelsShared';
import './PublicForecastersPage.css';
import './ForecastDuelsPage.css';

/**
 * Free-play forecast duels (/duels; backend#228 and #1424, owner demo queue 2026-11-01 item 10): "two
 * forecasters pick the same station and hour; after the reveal, the chain's own scorer names the winner".
 *
 * Reads GET /api/duels (public board). Opening a duel is a POST /api/duels as the signed-in wallet. There
 * are no stakes anywhere: funded duels are a separate consensus feature that does not exist yet.
 */

const STATION_ALIAS_RE = /^st_[0-9a-f]{12}$/;
const HOUR = 3_600_000;

/** Whole UTC hours from 7 h to 7 days ahead, the window the server accepts. */
export function targetHourOptions(now = Date.now()) {
  const first = Math.ceil((now + 7 * HOUR) / HOUR) * HOUR;
  return Array.from({ length: 24 }, (_, i) => new Date(first + i * HOUR).toISOString());
}

const REFUSALS = {
  UNKNOWN_STATION: 'No station has that alias. Copy it from the station\'s page.',
  TOO_MANY_OPEN: 'You already have 5 unresolved duels.',
  INVALID_TARGET: 'Pick a target hour at least 7 hours ahead.',
  INVALID_OPPONENT: 'That opponent address is not a 0x wallet address.',
};

function OpenDuel({ onOpened }) {
  const navigate = useNavigate();
  const [stationAlias, setStationAlias] = useState('');
  const [targetAt, setTargetAt] = useState(() => targetHourOptions()[0]);
  const [opponent, setOpponent] = useState('');
  const [state, setState] = useState({ busy: false, message: null });
  const alias = stationAlias.trim().toLowerCase();
  const submit = async e => {
    e.preventDefault();
    setState({ busy: true, message: null });
    const result = await walletCall('POST', '/duels', { stationAlias: alias, targetAt, ...(opponent.trim() ? { opponent: opponent.trim() } : {}) });
    if (result.kind === 'ok' && result.data?.duel?.id) { onOpened(); navigate(`/duels/${result.data.duel.id}`); return; }
    setState({ busy: false, message: result.kind === 'refused' ? (REFUSALS[result.code] ?? result.message) : result.kind === 'signed_out' ? 'Your wallet session ended. Sign in again on the Wallet page.' : 'Duels are unavailable right now.' });
  };
  return (
    <form className="du-form" onSubmit={submit} aria-label="Open a duel">
      <div className="du-fields">
        <label className="du-field">Station alias<input value={stationAlias} onChange={e => setStationAlias(e.target.value)} placeholder="st_7d29a4c1e0b8" maxLength={15} spellCheck={false} /></label>
        <label className="du-field">Target hour (UTC)
          <select value={targetAt} onChange={e => setTargetAt(e.target.value)}>
            {targetHourOptions().map(t => <option key={t} value={t}>{t.slice(0, 16).replace('T', ' ')}</option>)}
          </select>
        </label>
        <label className="du-field">Opponent wallet (optional)<input value={opponent} onChange={e => setOpponent(e.target.value)} placeholder="0x… or leave open" spellCheck={false} /></label>
      </div>
      <div className="du-actions">
        <button type="submit" className="du-action" disabled={state.busy || !STATION_ALIAS_RE.test(alias)}>{state.busy ? 'Opening…' : 'Open duel'}</button>
        <span className="fc-note">Both players commit a 6-hour forecast for that hour with the forecast kit and link it before the lock.</span>
      </div>
      {state.message ? <WrfAlert severity="warning" role="status" className="du-notice">{state.message}</WrfAlert> : null}
    </form>
  );
}

function Section({ title, duels, you, empty }) {
  return (
    <section className="du-list" aria-label={title}>
      <div className="fc-section-head"><h2>{title}</h2><span className="fc-count">{duels.length}</span></div>
      {duels.length ? duels.map(d => <DuelCard key={d.id} duel={d} you={you} />) : <p className="fc-placeholder du-empty">{empty}</p>}
    </section>
  );
}

export default function ForecastDuelsPage() {
  const themeVars = useForecasterThemeVars();
  const you = useSignedInWallet();
  const [state, setState] = useState({ loading: true, result: null });
  const load = useCallback(() => {
    const controller = new globalThis.AbortController();
    setState(prev => ({ loading: true, result: prev.result }));
    publicGet(FORECAST_DUELS_PATH, controller.signal).then(result => setState({ loading: false, result })).catch(() => {});
    return () => controller.abort();
  }, []);
  useEffect(() => load(), [load]);
  const { loading, result } = state;
  const board = result?.kind === 'ok' ? result.data : null;

  return (
    <div className="public-read-page fc-page du-page" data-testid="forecast-duels" style={themeVars}>
      <header className="fc-head">
        <div>
          <h1>Forecast duels</h1>
          <p className="fc-lede">Two forecasters, one station, one hour. After the reveal, the chain&apos;s own scoring decides who forecast better.</p>
          <p className="fc-note">{FREE_PLAY_NOTE}</p>
        </div>
        <div className="fc-head-side"><a className="fc-guide" href={FORECASTING_GUIDE_HREF} target="_blank" rel="noreferrer">How to forecast with the kit</a></div>
      </header>

      {result?.kind === 'not_found' ? (
        <WrfEmptyState title="Forecast duels are not switched on yet" description="This server does not run duels yet." />
      ) : (
        <>
          <WrfCard component="section" aria-label="Open a duel" className="fc-section" header={<div className="fc-section-head"><h2>Open a duel</h2></div>} noPadding>
            {you ? <OpenDuel onOpened={load} /> : (
              <div className="du-signin"><p><strong>Sign in with your wallet</strong> to open or accept a duel. Your wallet is your account.</p><Link className="du-action" to="/wallet">Open your wallet</Link></div>
            )}
          </WrfCard>
          {loading && !board ? <p className="fc-count" role="status">Loading duels…</p> : null}
          {!loading && !board ? (
            <WrfAlert severity="info" role="alert" className="fc-unavailable" actionLabel="Retry" onAction={load}>
              {result?.kind === 'rate_limited' ? 'Too many requests right now. Please wait a moment and try again.' : 'Duels are unavailable right now.'}
            </WrfAlert>
          ) : null}
          {board ? (
            <>
              <Section title="Open: take the other side" duels={board.open ?? []} you={you} empty="No open duels right now. Open one above." />
              <Section title="In progress" duels={board.live ?? []} you={you} empty="No duel is running." />
              <Section title="Finished" duels={board.finished ?? []} you={you} empty="No duel has finished yet." />
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
