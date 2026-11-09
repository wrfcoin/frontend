import { When } from './publicForecastersShared';

/**
 * A website forecast's practice score, in plain words (backend `practiceScore` on GET /forecasts/mine, sent only
 * while the backend switch WEBSITE_FORECAST_SCORE_ENABLED is on). The backend sends whole numbers: values in
 * hundredths of the display unit (0.01 °C; Pa = 0.01 hPa) and skill in millionths. Nothing is paid for it.
 */
const UNITS = new Map([['temp_c_centi', '°C'], ['pressure_pa', 'hPa']]);
const BASELINE_WORDS = new Map([
  ['persistence_spread', lead => `how much this station usually changes in ${lead} hour${lead === 1 ? '' : 's'}`],
  ['climatology_spread', () => 'how much this station varied over the day before'],
]);
const UNSCORED_WORDS = new Map([
  ['no_reading', 'The station had no confirmed reading within 15 minutes of the target time, so there is nothing to score against.'],
  ['no_baseline', 'The station had too few readings in the day before your forecast to set a baseline.'],
  ['node_unavailable', 'The chain could not be read for a day after the target time, so this forecast was not scored.'],
  ['out_of_range', 'The forecast value is outside the range that is scored.'],
]);
const PANEL_STATUSES = new Set(['pending', 'scored', 'unscored']);
export const PAY_NOTE = 'Practice score. Nothing is paid for it.';

/** Whether a panel will render for this score (the page keeps its older cell otherwise). */
export const hasPracticePanel = score => Boolean(score) && PANEL_STATUSES.has(score.status);

/** Hundredths as a decimal: at least one place, two only when the second is not zero. */
export function fmtHundredths(value, unit) {
  if (!Number.isSafeInteger(value)) return '—';
  const sign = value < 0 ? '−' : '';
  const abs = Math.abs(value);
  const frac = String(abs % 100).padStart(2, '0');
  return `${sign}${Math.floor(abs / 100)}.${frac.endsWith('0') ? frac[0] : frac}${unit ? ` ${unit}` : ''}`;
}

/**
 * Skill in millionths as a score out of 100, rounded down so a miss never reads as a win. A real but tiny
 * skill (under one point) is shown as "under 1", never as 0 next to "Beat the baseline: yes".
 */
export function skillOutOf100(skill) {
  if (!Number.isSafeInteger(skill) || skill < 0) return null;
  if (skill > 0 && skill < 10_000) return 'under 1';
  return String(Math.floor(skill / 10_000));
}

function Nws({ nws, unit }) {
  if (!nws || !Number.isSafeInteger(nws.error)) return null;
  const off = `off by ${fmtHundredths(nws.error, unit)}`;
  const line = nws.result === 'you_beat_nws' ? <><strong>You beat NOAA’s forecast</strong> for that hour ({off}).</>
    : nws.result === 'nws_beat_you' ? <><strong>NOAA’s forecast beat you</strong> for that hour ({off}).</>
      : <>You tied NOAA’s forecast for that hour ({off}).</>;
  return <p className="ps-line" data-testid="practice-nws">{line}</p>;
}

export default function ForecastPracticeScore({ score, leadHours }) {
  if (!hasPracticePanel(score)) return null;
  const unit = UNITS.get(score.unit) ?? '';
  if (score.status === 'pending') {
    return (
      <div className="ps ps--pending" data-testid="practice-score">
        <p className="ps-head">Practice score: not yet</p>
        {score.reason === 'node_unavailable'
          ? <p className="ps-line">The chain could not be read just now. We will try again.</p>
          : score.reason === 'waiting_for_reading'
            ? <p className="ps-line">Waiting for a confirmed station reading close to the target time.{score.giveUpAt ? <> We keep looking until <When value={score.giveUpAt} withTime />.</> : null}</p>
            : <p className="ps-line">{score.pendingUntil ? <>Scored after <When value={score.pendingUntil} withTime />, once the station’s readings are confirmed on chain.</> : 'Scored after the target time.'}</p>}
      </div>
    );
  }
  if (score.status === 'unscored') {
    return (
      <div className="ps ps--unscored" data-testid="practice-score">
        <p className="ps-head">Not scored</p>
        <p className="ps-line">{UNSCORED_WORDS.get(score.reason) ?? UNSCORED_WORDS.get('no_reading')}</p>
      </div>
    );
  }
  const points = skillOutOf100(score.skill);
  const baseline = BASELINE_WORDS.get(score.baseline?.kind)?.(leadHours);
  const baselineError = score.baseline?.error;
  return (
    <div className={`ps ps--scored ${score.beatBaseline ? 'ps--beat' : 'ps--missed'}`} data-testid="practice-score">
      <div className="ps-top">
        <p className="ps-head">Practice score <strong className="ps-points">{points ?? '—'}</strong><span className="ps-of"> / 100</span></p>
        <span className={`ps-pill ${score.beatBaseline ? 'ps-pill--yes' : 'ps-pill--no'}`}>Beat the baseline: {score.beatBaseline ? 'yes' : 'no'}</span>
      </div>
      <p className="ps-line">You said {fmtHundredths(score.forecast, unit)}. The station measured <strong>{fmtHundredths(score.truth, unit)}</strong>{score.truthObservedAt ? <> (<When value={score.truthObservedAt} withTime />)</> : null}. You were off by <strong>{fmtHundredths(score.error, unit)}</strong>.</p>
      {score.copied
        ? <p className="ps-line">Scored 0: your forecast was the same as the station’s last reading or its 24-hour average, so it adds nothing new.</p>
        : baselineError === 0
          ? <p className="ps-line">The station changed too little in the day before to score against, so there was nothing to beat.</p>
          : Number.isSafeInteger(baselineError)
            ? <p className="ps-line">Baseline to beat: {fmtHundredths(baselineError, unit)}{baseline ? ` (${baseline})` : ''}. {score.beatBaseline ? 'Your miss was smaller.' : 'Your miss was not smaller.'}</p>
            : null}
      <Nws nws={score.nws} unit={unit} />
      <p className="ps-note">{PAY_NOTE}</p>
    </div>
  );
}
