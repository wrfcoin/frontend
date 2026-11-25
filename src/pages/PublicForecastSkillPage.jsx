import { WrfAlert, WrfCard, WrfStatCard } from '../components/DesignSystem';
import { categoryColors, primary, success, warning } from '../components/DesignSystem/tokens';
import vendoredSummary from '../data/forecastSkill/summary.json';
import vendoredSource from '../data/forecastSkill/summary.source.json';
import { useForecasterThemeVars } from './publicForecastersShared';
import './PublicForecastersPage.css';
import './PublicForecastSkillPage.css';

/**
 * Forecast skill (/forecast-skill; owner ruling 2026-11-24): the published result of the wrfcomp forecast
 * competition harness for one candidate, as a static page.
 *
 * It reads nothing over the network. Every figure is formatted from src/data/forecastSkill/summary.json, a
 * byte-for-byte copy of the results file in wrfcoin/wrfcomp; summary.source.json records the commit and the
 * SHA-256, and a test fails when the copy and the record disagree. Nothing here is typed in by hand, and a
 * figure the file does not carry is shown as a dash.
 */

const REPO_URL = 'https://github.com/wrfcoin/wrfcomp';
/** The year held back to confirm the result; the other years in the file are the ones the candidate was judged on first. */
const CONFIRMATION_YEAR = '2023';
const VARIABLES = [
  ['t2m', 'Temperature'],
  ['td2m', 'Dewpoint'],
  ['u10', 'Wind east-west'],
  ['v10', 'Wind north-south'],
  ['msl', 'Sea-level pressure'],
];
const REFERENCES = [
  ['noaa-gefs', 'raw NOAA GEFS'],
  ['climatology', 'climatology'],
];

const isCount = value => Number.isSafeInteger(value) && value >= 0;
const count = value => (isCount(value) ? value.toLocaleString('en-US') : '—');
/** crpss_vs_baseline is a fraction; shown as a signed percent with one decimal. */
export const skillPercent = value => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  const text = (value * 100).toFixed(1);
  return `${value > 0 ? '+' : ''}${text}%`;
};
const quarterLabel = key => String(key).replace('-', ' ');

/** The years in the file, the confirmation year last, each with its quarters in order. */
export function yearsOf(summary) {
  const years = summary?.years && typeof summary.years === 'object' ? summary.years : {};
  return Object.keys(years)
    .sort((a, b) => (a === CONFIRMATION_YEAR) - (b === CONFIRMATION_YEAR) || b.localeCompare(a))
    .map(year => {
      const record = years[year] ?? {};
      const quarters = Object.keys(record.quarters ?? {}).sort().map(key => ({ key, ...record.quarters[key] }));
      return {
        year,
        confirmation: year === CONFIRMATION_YEAR,
        promoted: record.decision === 'PROMOTED',
        passed: record.quarters_passed,
        required: record.quarters_required,
        quarters,
        harness: record.harness_version?.wrfcomp,
        rule: record.promotion_rule_version,
      };
    });
}

const tally = y => `${count(y.passed)} of ${count(y.quarters.length)} quarters`;

function Headline({ years, candidate }) {
  if (years.length === 0) {
    return <WrfAlert severity="info" role="status" className="fs-headline">No result is published yet.</WrfAlert>;
  }
  const allPromoted = years.every(y => y.promoted);
  const parts = years.map(y => `${tally(y)} of ${y.year}${y.confirmation ? ', the year held back to confirm it' : ''}`);
  return (
    <WrfAlert severity={allPromoted ? 'success' : 'warning'} role="status" className="fs-headline" data-testid="forecast-skill-headline">
      <strong>{allPromoted ? 'Passed.' : 'Not passed.'}</strong>{' '}
      Candidate <span className="fs-mono">{candidate}</span> met every gate against both raw NOAA GEFS and climatology in {parts.join(' and in ')}.
      {allPromoted ? '' : ' That is not enough in every year, so it is not promoted.'}
    </WrfAlert>
  );
}

function SkillCells({ reference }) {
  return VARIABLES.map(([key, label]) => (
    <td key={key} className="fc-num" data-label={label}>{skillPercent(reference?.crpss_vs_baseline?.[key])}</td>
  ));
}

function QuarterRows({ quarter }) {
  const passed = quarter.verdict === 'PASSED';
  const first = quarter.references?.[REFERENCES[0][0]];
  return (
    <tbody data-testid="forecast-skill-quarter">
      {REFERENCES.map(([key, label], index) => {
        const reference = quarter.references?.[key];
        return (
          <tr key={key}>
            {index === 0 ? (
              <>
                <th scope="rowgroup" rowSpan={REFERENCES.length} className="fs-quarter">
                  {quarterLabel(quarter.key)}
                  <div className="fc-sub"><span className="fs-nowrap">{count(first?.n_init_times)} forecast runs</span> · <span className="fs-nowrap">{count(first?.n_stations)} stations</span></div>
                </th>
                <td rowSpan={REFERENCES.length} className="fs-result">
                  <span className={`fs-status fs-status--${passed ? 'pass' : 'fail'}`}>{passed ? 'Passed' : 'Not passed'}</span>
                </td>
              </>
            ) : null}
            <td className="fs-ref">
              against {label}
              <div className={`fc-sub${reference?.all_gates_passed === false ? ' fs-gate-fail' : ''}`}>
                {reference?.all_gates_passed === true ? 'every gate met' : reference?.all_gates_passed === false ? 'a gate was missed' : '—'}
              </div>
            </td>
            <SkillCells reference={reference} />
          </tr>
        );
      })}
    </tbody>
  );
}

function YearSection({ y }) {
  const title = `${y.year}${y.confirmation ? ' · confirmation year' : ''}`;
  return (
    <WrfCard
      component="section"
      aria-label={`Results for ${y.year}`}
      className="fc-section"
      header={<div className="fc-section-head"><h2>{title}</h2><span className="fc-count">{tally(y)} passed · needs {count(y.required)}</span></div>}
      noPadding
    >
      <div className="fs-scroll">
        <table className="fc-table fs-table" data-testid={`forecast-skill-${y.year}`}>
          <thead>
            <tr>
              <th>Quarter</th>
              <th>Result</th>
              <th>Skill</th>
              {VARIABLES.map(([key, label]) => <th key={key} className="fc-num">{label}</th>)}
            </tr>
          </thead>
          {y.quarters.map(quarter => <QuarterRows key={quarter.key} quarter={quarter} />)}
        </table>
      </div>
      <div className="fc-foot">
        <span>Skill is how much lower the forecast&apos;s error score (CRPS) is than the reference&apos;s, as a percent. Above zero is better than the reference.</span>
        <span>Skill is one of the gates. A quarter passes only when every gate is met against both references.</span>
      </div>
    </WrfCard>
  );
}

export function ForecastSkillView({ summary, source }) {
  const themeVars = useForecasterThemeVars();
  const years = yearsOf(summary);
  const stations = years[0]?.quarters[0]?.references?.[REFERENCES[0][0]]?.n_stations;
  const commit = typeof source?.commit === 'string' ? source.commit : '';
  const folder = typeof source?.path === 'string' ? source.path.replace(/\/[^/]+$/, '') : '';
  const resultsUrl = commit && folder ? `${REPO_URL}/tree/${commit}/${folder}` : REPO_URL;
  const first = years[0];

  return (
    <div className="public-read-page fc-page fs-page" data-testid="public-forecast-skill" style={themeVars}>
      <header className="fc-head">
        <div>
          <h1>Forecast skill</h1>
          <p className="fc-lede">
            Can a forecast beat NOAA&apos;s own? We tested one candidate: NOAA&apos;s GEFS forecast, corrected station by station from
            its recent verified errors. It was scored against weather station measurements, next to raw NOAA GEFS and climatology
            (the usual weather for the place and season).
          </p>
        </div>
      </header>

      <Headline years={years} candidate={summary?.candidate ?? '—'} />

      <div className="fc-stats" data-testid="forecast-skill-stats">
        {years.map(y => (
          <WrfStatCard
            key={y.year}
            label={`${y.year}${y.confirmation ? ' (confirmation)' : ''} quarters passed`}
            value={<span className="fc-stat-value">{count(y.passed)} of {count(y.quarters.length)}</span>}
            color={y.promoted ? success : warning}
          />
        ))}
        <WrfStatCard label="Stations scored" value={<span className="fc-stat-value">{count(stations)}</span>} color={categoryColors.weather} />
        <WrfStatCard label="Payouts" value={<span className="fc-stat-value fc-stat-value--un">Paper only</span>} color={primary} />
      </div>
      <p className="fs-ledger" role="note" data-testid="forecast-skill-ledger">
        Payouts are a paper ledger only. Nothing pays out.
      </p>

      {years.map(y => <YearSection key={y.year} y={y} />)}

      <div className="fc-grid-2">
        <WrfCard component="section" aria-label="The rules" className="fc-section" header={<div className="fc-section-head"><h2>The rules</h2></div>}>
          <ol className="fs-list">
            <li>One locked scoring harness scores every candidate the same way.</li>
            <li>
              A candidate must meet every gate against both references (raw NOAA GEFS and climatology) in at
              least {count(first?.required)} of {count(first?.quarters.length)} quarters.
            </li>
            <li>A second, untouched year must confirm the result.</li>
          </ol>
        </WrfCard>
        <WrfCard component="section" aria-label="Run it yourself" className="fc-section" header={<div className="fc-section-head"><h2>Run it yourself</h2></div>}>
          <p className="fs-text">
            The harness, the rules and every record behind this page are public:{' '}
            <a className="fc-guide" href={REPO_URL} target="_blank" rel="noreferrer">github.com/wrfcoin/wrfcomp</a> and its{' '}
            <a className="fc-guide" href={resultsUrl} target="_blank" rel="noreferrer" data-testid="forecast-skill-results-link">results folder</a>.
          </p>
          <p className="fs-text fs-muted" data-testid="forecast-skill-source">
            The numbers on this page are read from <span className="fs-mono">summary.json</span> in that folder
            {commit ? <> at commit <span className="fs-mono">{commit.slice(0, 8)}</span></> : null}
            {first?.harness ? <>, scored with wrfcomp {first.harness}</> : null}
            {first?.rule !== undefined ? <>, promotion rule version {count(first.rule)}</> : null}.
          </p>
        </WrfCard>
      </div>

      <p className="fs-next" role="note" data-testid="forecast-skill-next">
        <strong>Next:</strong> testing whether citizen weather stations improve this forecast. In progress, no result yet.
      </p>
    </div>
  );
}

export default function PublicForecastSkillPage() {
  return <ForecastSkillView summary={vendoredSummary} source={vendoredSource} />;
}
