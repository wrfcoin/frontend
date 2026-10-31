import { useEffect, useId, useRef, useState } from 'react';
import { WrfCard } from '../DesignSystem';
import { publicGet } from '../../services/publicReadonlyApi';
import {
  WOLFRAM_GET_APPID_URL,
  WOLFRAM_TERMS_URL,
  checkReading,
  forgetAppId,
  getStoredAppId,
  maskAppId,
  storeAppId,
} from '../../services/wolframReadingCheck';
import './ReadingUnusualCheck.css';

/**
 * "Is this reading unusual?" (owner ruling 2026-11-01: Wolfram is bring-your-own-key).
 *
 * Compares one station temperature with Wolfram|Alpha's weather history for that place and calendar
 * day, using the person's OWN Wolfram|Alpha AppID. The AppID is saved in this browser only; it leaves
 * the device only inside the person's own check (see services/wolframReadingCheck.ts). Nothing runs
 * until the person presses the button, and the station's public 0.1-degree location is read only then.
 */

const RESULTS_URL_RE = /^https:\/\/www\.wolframalpha\.com\/input\?i=/;
const fmt = v => (typeof v === 'number' && Number.isFinite(v) ? `${v.toFixed(1)} °C` : null);

const VERDICT = {
  typical: { label: 'Typical for this place and day', tone: 'ok' },
  unusual: { label: 'Unusual: outside the usual range for this day', tone: 'warn' },
  outside_record: { label: 'Very unusual: outside the recorded range for this day', tone: 'alert' },
  unknown: { label: 'Wolfram|Alpha had no history this check could read', tone: 'muted' },
};

export function AppIdForm({ onSaved }) {
  const id = useId();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const submit = event => {
    event.preventDefault();
    if (storeAppId(value)) {
      setValue('');
      setError('');
      onSaved();
    } else {
      setError('That does not look like a Wolfram|Alpha AppID (letters and digits with one dash), or this browser would not save it.');
    }
  };
  return (
    <form className="ruc-form" onSubmit={submit} data-testid="wolfram-appid-form">
      <label htmlFor={id} className="ruc-label">Add your Wolfram AppID</label>
      <div className="ruc-line">
        <input
          id={id}
          className="ruc-input"
          type="password"
          autoComplete="off"
          spellCheck={false}
          inputMode="text"
          placeholder="XXXXXX-XXXXXXXXXX"
          value={value}
          onChange={e => setValue(e.target.value)}
          aria-describedby={`${id}-help`}
          aria-invalid={error ? 'true' : undefined}
        />
        <button type="submit" className="ruc-action">Save on this device</button>
      </div>
      {error ? <p className="ruc-error" role="alert">{error}</p> : null}
      <p id={`${id}-help`} className="ruc-help">
        Saved in this browser only. It is sent only with your own checks, through wrfcoin.com to Wolfram|Alpha, and is
        never stored on our servers. No AppID?{' '}
        <a href={WOLFRAM_GET_APPID_URL} target="_blank" rel="noopener noreferrer">Get a free one from Wolfram|Alpha</a>{' '}
        (free for non-commercial use, with a monthly limit).
      </p>
    </form>
  );
}

function Answer({ data }) {
  const verdict = VERDICT[data.verdict] ?? VERDICT.unknown;
  const r = data.reference;
  const typical = r && fmt(r.typicalLowC) && fmt(r.typicalHighC) ? `${fmt(r.typicalLowC)} to ${fmt(r.typicalHighC)}` : null;
  const record = r && fmt(r.recordLowC) && fmt(r.recordHighC) ? `${fmt(r.recordLowC)} to ${fmt(r.recordHighC)}` : null;
  const link = RESULTS_URL_RE.test(data.resultsUrl) ? data.resultsUrl : null;
  return (
    <div className="ruc-answer" data-testid="wolfram-answer" aria-live="polite">
      <p className={`ruc-verdict ruc-verdict--${verdict.tone}`} data-verdict={data.verdict}>{verdict.label}</p>
      <dl className="ruc-kv">
        <dt>This reading</dt><dd>{fmt(data.temperatureC) ?? '—'}</dd>
        {typical ? <><dt>Usual range</dt><dd>{typical}</dd></> : null}
        {record ? <><dt>Recorded range</dt><dd>{record}</dd></> : null}
        {r && fmt(r.averageC) ? <><dt>Average</dt><dd>{fmt(r.averageC)}</dd></> : null}
      </dl>
      {data.pod ? (
        <details className="ruc-pod">
          <summary>What Wolfram|Alpha said{data.pod.title ? `: ${data.pod.title}` : ''}</summary>
          <pre>{data.pod.text}</pre>
        </details>
      ) : null}
      <p className="ruc-attrib">
        {link ? (
          <a href={link} target="_blank" rel="noopener noreferrer" data-testid="wolfram-results-link">
            See this on Wolfram|Alpha
          </a>
        ) : null}
        <span>
          Results from Wolfram|Alpha for “{data.query}”, compared by temperature only. Not a certified source; see the{' '}
          <a href={WOLFRAM_TERMS_URL} target="_blank" rel="noopener noreferrer">Wolfram|Alpha terms</a>.
        </span>
      </p>
    </div>
  );
}

const PROBLEM = {
  off: 'This check is not switched on for this server yet.',
  rejected: 'Wolfram|Alpha did not accept this AppID. Check it, or forget it and add another.',
  limited: 'The limit was reached (your Wolfram|Alpha AppID or this site). Please try again later.',
  busy: 'Wolfram checks are busy right now. Please try again in a minute.',
  error: 'Wolfram|Alpha could not be reached. Please try again.',
  no_location: 'This station has no public location, so there is no place to compare with.',
};

export default function ReadingUnusualCheck({ stationAlias, observedAt, temperatureC }) {
  const [appId, setAppId] = useState(() => getStoredAppId());
  const [state, setState] = useState({ phase: 'idle' });
  const abortRef = useRef(null);
  useEffect(() => () => abortRef.current?.abort(), []);

  const usable = typeof temperatureC === 'number' && Number.isFinite(temperatureC) && Boolean(observedAt) && Boolean(stationAlias);
  if (!usable) return null;

  const forget = () => {
    forgetAppId();
    setAppId(null);
    setState({ phase: 'idle' });
  };

  const run = async () => {
    abortRef.current?.abort();
    const controller = new globalThis.AbortController();
    abortRef.current = controller;
    setState({ phase: 'loading' });
    try {
      // The station's public location (0.1 degree); the same list read the station map uses.
      const stations = await publicGet('/weather/stations', controller.signal);
      const station = stations.kind === 'ok' ? stations.data?.stations?.find(s => s?.alias === stationAlias) : null;
      if (!station || !Number.isFinite(station.latitude) || !Number.isFinite(station.longitude)) {
        setState({ phase: 'problem', kind: stations.kind === 'ok' ? 'no_location' : 'error' });
        return;
      }
      const result = await checkReading(
        { appId, latitude: station.latitude, longitude: station.longitude, observedAt, temperatureC },
        controller.signal,
      );
      setState(result.kind === 'ok' ? { phase: 'done', data: result.data } : { phase: 'problem', kind: result.kind });
    } catch (error) {
      if (error?.name !== 'AbortError') setState({ phase: 'problem', kind: 'error' });
    }
  };

  return (
    <WrfCard
      component="section"
      aria-label="Is this reading unusual?"
      className="fc-section ruc"
      header={<div className="fc-section-head"><h2>Is this reading unusual?</h2></div>}
      noPadding
    >
      <div className="ruc-body" data-testid="wolfram-reading-check">
        <p className="ruc-lede">
          Compare this temperature with Wolfram|Alpha’s weather history for the station’s area on this day of the year,
          using your own Wolfram|Alpha AppID.
        </p>
        {appId ? (
          <>
            <div className="ruc-line ruc-saved">
              <button type="button" className="ruc-action" onClick={run} disabled={state.phase === 'loading'}>
                {state.phase === 'loading' ? 'Asking Wolfram|Alpha…' : 'Check with Wolfram|Alpha'}
              </button>
              <span className="ruc-key">
                Your AppID <span className="ruc-mono">{maskAppId(appId)}</span> is saved on this device.{' '}
                <button type="button" className="ruc-link" onClick={forget}>Forget it</button>
              </span>
            </div>
            {state.phase === 'problem' ? <p className="ruc-error" role="alert">{PROBLEM[state.kind] ?? PROBLEM.error}</p> : null}
            {state.phase === 'done' ? <Answer data={state.data} /> : null}
          </>
        ) : (
          <AppIdForm onSaved={() => setAppId(getStoredAppId())} />
        )}
      </div>
    </WrfCard>
  );
}
