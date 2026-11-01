import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { WrfAlert, WrfCard, WrfEmptyState, WrfStatCard } from '../components/DesignSystem';
import { categoryColors, primary, success, warning } from '../components/DesignSystem/tokens';
import {
  FORECAST_CHECK_SUBMIT_PATH, FORECAST_CHECK_SUMMARY_PATH, PROOF_COMMIT_ID_RE, publicGet, publicPost,
} from '../services/publicReadonlyApi';
import { FORECASTING_GUIDE_HREF, When, useForecasterThemeVars } from './publicForecastersShared';
import './PublicForecastersPage.css';
import './PublicForecastCheckPage.css';

/**
 * Forecast check (/forecast-check; owner demo queue 2026-11-01 item 7, backend PR#72 and #1494):
 * "the forecast page shows how close the platform's own forecasts came to what weather stations measured".
 *
 * Reads GET /api/forecast-verification/summary. Every number is the backend's: forecasts committed on chain
 * with the forecast kit, scored against the hourly mean of the chain's own readings for that station, and
 * NOAA's hourly forecast for the same station and hour (captured before the forecast was issued). A figure
 * the server does not have is shown as "Unavailable" with its reason, never estimated here.
 *
 * Forecasters can hand in their commit record (commit.json + data.json from the kit) with
 * POST /api/forecast-verification/forecasts: the server checks the record hashes to the chain commit id and
 * that the forecast is revealed, so the form needs no login.
 */

const UNAVAILABLE = 'Unavailable';
/** Counts arrive as JSON numbers here (the forecaster pages' count() takes digit strings). */
const count = value => (Number.isSafeInteger(value) && value >= 0 ? value.toLocaleString('en-US') : '—');
const VARIABLES = {
  temperature_c: { label: 'Temperature', unit: '°C', digits: 1 },
  pressure_hpa: { label: 'Pressure', unit: 'hPa', digits: 1 },
  humidity_pct: { label: 'Humidity', unit: '%', digits: 0 },
};
const fmt = (value, variable, signed = false) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  const v = VARIABLES[variable] ?? { unit: '', digits: 2 };
  const text = value.toFixed(v.digits === 0 ? 1 : v.digits + 1);
  return `${signed && value > 0 ? '+' : ''}${text} ${v.unit}`;
};
const STATUS_LABEL = { scored: 'Scored', pending: 'Waiting for readings', unavailable: 'Unavailable' };
const UNAVAILABLE_REASON = {
  no_chain_reading_in_target_hour: 'No station reading landed on chain for the target hour.',
  no_shared_variable: 'The station did not report any variable this forecast predicted.',
};

function ErrorCell({ score, variable }) {
  if (!score) return <span className="fc-un">—</span>;
  return (
    <span className="fv-err">
      <span className="fv-err-main">{fmt(score.forecast, variable)}</span>
      <span className="fv-err-sub">measured {fmt(score.truth, variable)} · off by {fmt(score.error, variable, true)}</span>
    </span>
  );
}

function NoaaCell({ record, variable }) {
  const s = record.scores?.[variable];
  if (record.status !== 'scored') return <span className="fc-un">—</span>;
  if (s?.noaa) {
    return (
      <span className="fv-err">
        <span className="fv-err-main">{fmt(s.noaa.value, variable)}</span>
        <span className="fv-err-sub">off by {fmt(s.noaa.error, variable, true)} · {s.noaa.leadHours} h ahead</span>
      </span>
    );
  }
  return <span className="fc-un" title={record.noaaReason ?? undefined}>{UNAVAILABLE}</span>;
}

function RecordRow({ record }) {
  const main = record.scores?.temperature_c ? 'temperature_c' : Object.keys(record.scores ?? record.forecast ?? {})[0] ?? 'temperature_c';
  return (
    <tr data-testid="forecast-check-row">
      <td className="fv-head-cell">
        <Link className="fc-guide" to={`/weather/station/${record.stationAlias}`}>{record.stationAlias}</Link>
        <div className="fc-sub">{record.modelId ?? 'model not stated'}</div>
      </td>
      <td className="fc-hide-phone"><When value={record.validAt} withTime /></td>
      <td><span className={`fv-status fv-status--${record.status}`}>{STATUS_LABEL[record.status] ?? record.status}</span>
        {record.status === 'unavailable' ? <div className="fc-sub">{UNAVAILABLE_REASON[record.unavailableReason] ?? record.unavailableReason}</div> : null}
        <div className="fc-sub fc-only-phone"><When value={record.validAt} withTime /></div>
      </td>
      <td data-label="Forecast">{record.status === 'scored' ? <ErrorCell score={record.scores?.[main]} variable={main} /> : <span className="fv-err-main">{fmt(record.forecast?.[main], main)}</span>}
        <div className="fc-sub">{VARIABLES[main]?.label ?? main}</div>
      </td>
      <td data-label="NOAA"><NoaaCell record={record} variable={main} /></td>
    </tr>
  );
}

function VariableTable({ variables }) {
  return (
    <table className="fc-table fv-table fv-stack" data-testid="forecast-check-variables">
      <thead>
        <tr><th>Variable</th><th className="fc-num">Forecasts scored</th><th className="fc-num">Average miss</th><th className="fc-num fc-hide-phone">Bias</th><th>Same forecasts vs NOAA</th></tr>
      </thead>
      <tbody>
        {variables.map(v => (
          <tr key={v.variable}>
            <td className="fv-head-cell">{VARIABLES[v.variable]?.label ?? v.variable}</td>
            <td className="fc-num" data-label="Forecasts scored">{v.chain ? count(v.chain.n) : '0'}</td>
            <td className="fc-num" data-label="Average miss">{v.chain ? fmt(v.chain.mae, v.variable) : <span className="fc-un">{UNAVAILABLE}</span>}</td>
            <td className="fc-num fc-hide-phone">{v.chain ? fmt(v.chain.bias, v.variable, true) : '—'}</td>
            <td className="fv-wide" data-label="Same forecasts vs NOAA">
              {v.vsNoaa ? (
                <span className="fv-vs" data-testid={`vs-noaa-${v.variable}`}>
                  <span className={v.vsNoaa.chainMae <= v.vsNoaa.noaaMae ? 'fv-better' : undefined}>On chain {fmt(v.vsNoaa.chainMae, v.variable)}</span>
                  <span className={v.vsNoaa.noaaMae < v.vsNoaa.chainMae ? 'fv-better' : undefined}>NOAA {fmt(v.vsNoaa.noaaMae, v.variable)}</span>
                  <span className="fc-sub">over {count(v.vsNoaa.n)} forecast{v.vsNoaa.n === 1 ? '' : 's'}</span>
                </span>
              ) : <span className="fc-un" title={v.vsNoaaReason ?? undefined}>{UNAVAILABLE}<span className="fv-reason">{v.vsNoaaReason}</span></span>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const REFUSALS = {
  COMMIT_MISMATCH: 'These files do not hash to that commit id. Paste commit.json and data.json from the same forecast folder, unchanged.',
  NOT_ON_CHAIN: 'The chain has no commit with this id yet.',
  NOT_REVEALED: 'Reveal this forecast on chain first, then hand it in.',
  NOT_A_FORECAST: 'That commit is a station reading, not a forecast.',
  STATION_MISMATCH: 'The chain commit names a different station than data.json.',
};

/** commit.json (the kit's record) gives commit_id, nonce and timestamp; data.json is sent exactly as written. */
export function recordFromFiles(commitText, dataText) {
  let commit;
  try { commit = JSON.parse(commitText); } catch { return { error: 'commit.json is not valid JSON.' }; }
  const commitId = typeof commit?.commit_id === 'string' ? commit.commit_id.trim().toLowerCase() : '';
  if (!PROOF_COMMIT_ID_RE.test(commitId)) return { error: 'commit.json has no 64-character commit_id.' };
  if (typeof commit.nonce !== 'string' || !Number.isSafeInteger(commit.timestamp)) return { error: 'commit.json needs its nonce and timestamp.' };
  const data = String(dataText ?? '').replace(/\r\n/g, '\n').trim();
  if (!data) return { error: 'Paste the contents of data.json.' };
  return { record: { commitId, nonce: commit.nonce, timestamp: commit.timestamp, data } };
}

function HandIn({ onAdded }) {
  const [commitText, setCommitText] = useState('');
  const [dataText, setDataText] = useState('');
  const [state, setState] = useState({ busy: false, message: null, tone: 'info' });
  const submit = async event => {
    event.preventDefault();
    const parsed = recordFromFiles(commitText, dataText);
    if (parsed.error) return setState({ busy: false, message: parsed.error, tone: 'warning' });
    setState({ busy: true, message: null, tone: 'info' });
    const result = await publicPost(FORECAST_CHECK_SUBMIT_PATH, parsed.record);
    if (result.kind === 'ok') {
      setState({ busy: false, message: result.status === 201 ? 'Added. It is scored once the target hour has passed and the station\'s readings are on chain.' : 'This forecast was already handed in.', tone: 'success' });
      onAdded();
    } else if (result.kind === 'refused') {
      setState({ busy: false, message: REFUSALS[result.code] ?? result.message ?? 'The server refused this record.', tone: 'warning' });
    } else if (result.kind === 'rate_limited') {
      setState({ busy: false, message: 'Too many requests right now. Please wait a moment and try again.', tone: 'warning' });
    } else {
      setState({ busy: false, message: 'Forecast check is unavailable right now.', tone: 'warning' });
    }
    return undefined;
  };
  return (
    <form className="fv-form" onSubmit={submit} aria-label="Hand in a forecast">
      <p className="fv-form-lede">
        Committed a forecast with the forecast kit? After you reveal it, paste its <code>commit.json</code> and <code>data.json</code> here.
        The server checks they hash to your commit on chain, then scores it once the station&apos;s readings land.
      </p>
      <div className="fv-fields">
        <label>commit.json<textarea value={commitText} onChange={e => setCommitText(e.target.value)} rows={5} spellCheck={false} placeholder='{"commit_id": "…", "nonce": "…", "timestamp": …}' /></label>
        <label>data.json<textarea value={dataText} onChange={e => setDataText(e.target.value)} rows={5} spellCheck={false} placeholder='{"horizon_hours":6,"issued_at":…}' /></label>
      </div>
      <div className="fv-actions">
        <button type="submit" className="fv-submit" disabled={state.busy}>{state.busy ? 'Checking…' : 'Hand in forecast'}</button>
        <a className="fc-guide" href={FORECASTING_GUIDE_HREF} target="_blank" rel="noreferrer">How to forecast with the kit</a>
      </div>
      {state.message ? <WrfAlert severity={state.tone} role="status" className="fv-message">{state.message}</WrfAlert> : null}
    </form>
  );
}

export default function PublicForecastCheckPage() {
  const themeVars = useForecasterThemeVars();
  const [state, setState] = useState({ loading: true, result: null });
  const load = useCallback(() => {
    const controller = new globalThis.AbortController();
    setState(prev => ({ loading: true, result: prev.result }));
    publicGet(FORECAST_CHECK_SUMMARY_PATH, controller.signal)
      .then(result => setState({ loading: false, result }))
      .catch(() => {});
    return () => controller.abort();
  }, []);
  useEffect(() => load(), [load]);

  const { loading, result } = state;
  const ok = result?.kind === 'ok';
  const summary = ok ? result.data : null;
  const off = result?.kind === 'not_found';

  return (
    <div className="public-read-page fc-page fv-page" data-testid="public-forecast-check" style={themeVars}>
      <header className="fc-head">
        <div>
          <h1>Forecast check</h1>
          <p className="fc-lede">
            How close did forecasts committed on chain come to what the station measured? Each one is scored against the
            station&apos;s own readings on chain for the target hour, next to NOAA&apos;s forecast for the same station and hour.
          </p>
        </div>
      </header>

      {off ? (
        <WrfEmptyState title="Forecast check is not switched on yet" description="This server does not score forecasts yet. Nothing on this page is estimated in the meantime." />
      ) : null}
      {!off && !ok && !loading ? (
        <WrfAlert severity="info" role="alert" className="fc-unavailable" actionLabel="Retry" onAction={load}>
          {result?.kind === 'rate_limited' ? 'Too many requests right now. Please wait a moment and try again.' : 'Forecast check is unavailable right now.'}
        </WrfAlert>
      ) : null}
      {loading && !ok ? <p className="fc-count" role="status">Loading scores…</p> : null}

      {summary ? (
        <>
          <div className="fc-stats fv-stats" data-testid="forecast-check-counts">
            <WrfStatCard label={`Scored (${summary.windowDays} days)`} value={<span className="fc-stat-value">{count(summary.counts?.scored)}</span>} color={success} />
            <WrfStatCard label="Waiting for readings" value={<span className="fc-stat-value">{count(summary.counts?.pending)}</span>} color={primary} />
            <WrfStatCard label="No reading to score" value={<span className="fc-stat-value">{count(summary.counts?.unavailable)}</span>} color={warning} />
            <WrfStatCard label="Stations" value={<span className="fc-stat-value">{count(summary.stations?.length ?? 0)}</span>} color={categoryColors.weather} />
          </div>
          {summary.status !== 'available' ? <p className="fc-note" role="note">{summary.reason ?? 'Nothing has been scored yet.'}</p> : null}

          <WrfCard component="section" aria-label="Accuracy by variable" className="fc-section" header={<div className="fc-section-head"><h2>How far off, on average</h2><span className="fc-count">last {summary.windowDays} days</span></div>} noPadding>
            <VariableTable variables={Array.isArray(summary.variables) ? summary.variables : []} />
            <div className="fc-foot"><span>&quot;Average miss&quot; is the mean absolute error. NOAA columns compare only the forecasts that have a NOAA forecast for the same station and hour.</span></div>
          </WrfCard>

          <WrfCard component="section" aria-label="Recent forecasts" className="fc-section" header={<div className="fc-section-head"><h2>Recent forecasts</h2><span className="fc-count">{count(summary.recent?.length ?? 0)} shown</span></div>} noPadding>
            {summary.recent?.length ? (
              <table className="fc-table fv-stack" data-testid="forecast-check-recent">
                <thead><tr><th>Station</th><th className="fc-hide-phone">Target hour</th><th>Status</th><th>Forecast</th><th className="fc-hide-phone">NOAA</th></tr></thead>
                <tbody>{summary.recent.map(r => <RecordRow key={r.commitId} record={r} />)}</tbody>
              </table>
            ) : <p className="fc-placeholder">No forecast has been handed in yet.</p>}
          </WrfCard>
        </>
      ) : null}

      {!off ? (
        <WrfCard component="section" aria-label="Hand in a forecast" className="fc-section" header={<div className="fc-section-head"><h2>Hand in your forecast</h2></div>} noPadding>
          <HandIn onAdded={load} />
        </WrfCard>
      ) : null}
    </div>
  );
}
