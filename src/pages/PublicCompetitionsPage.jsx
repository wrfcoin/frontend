import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { WrfCard, WrfEmptyState, WrfStatCard } from '../components/DesignSystem';
import { categoryColors, infoLight, primary, success } from '../components/DesignSystem/tokens';
import {
  COMPETITIONS_PATH, COMPETITION_CURRENT_PATH, competitionWeekPath, publicGet,
} from '../services/publicReadonlyApi';
import { CopyButton, FORECASTING_GUIDE_HREF, GuideLink, Unavailable, When, count, useForecasterThemeVars } from './publicForecastersShared';
import './PublicForecastersPage.css';
import './PublicCompetitionsPage.css';

/**
 * Weekly forecast competition (/competitions; backend#251, points only).
 *
 * Reads GET /api/competitions (this week and the recent weeks with their top three) and the standings of the
 * chosen week: /api/competitions/current, or /api/competitions/<ISO week>. Points come from the chain: one per
 * forecast the chain scored and decided in the week (the backend's rule text is shown verbatim). No prize, no
 * stake and no entry form: anyone who forecasts is in. Visitors see short addresses and opaque profile keys;
 * rows link to /forecasters/<key>.
 */

const STATUS_LABEL = { open: 'Open', scoring: 'Counting', final: 'Final' };

/** "2 days 4 h" until `until`, or null once it has passed. */
export function timeLeft(until, now = Date.now()) {
  const ms = Date.parse(until) - now;
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const hours = Math.floor(ms / 3_600_000);
  const days = Math.floor(hours / 24);
  if (days >= 1) return `${days} day${days === 1 ? '' : 's'} ${hours % 24} h`;
  const minutes = Math.max(1, Math.floor(ms / 60_000) % 60);
  return hours >= 1 ? `${hours} h ${minutes} min` : `${minutes} min`;
}

/** "Week 45" from "2026-W45". */
const weekNumber = week => (typeof week === 'string' ? `Week ${Number(week.slice(6))}` : '');

/** A UTC calendar day ("Oct 26"): weeks are UTC weeks, so a local time zone must not shift them a day. */
function utcDay(value) {
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) return '—';
  const d = new Date(ms);
  return <time dateTime={d.toISOString()}>{d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })}</time>;
}

function WeekRange({ from, until }) {
  // `until` is exclusive (next Monday 00:00 UTC); show the Sunday it ends on.
  const last = Number.isFinite(Date.parse(until)) ? new Date(Date.parse(until) - 1).toISOString() : until;
  return <>{utcDay(from)} – {utcDay(last)}</>;
}

function ForecasterCell({ row }) {
  const shown = row.address ?? row.shortAddress ?? '—';
  const name = row.profileKey
    ? <Link to={`/forecasters/${encodeURIComponent(row.profileKey)}`}>{shown}</Link>
    : <span className="fc-mono">{shown}</span>;
  return (
    <div className="fc-addr">
      {name}
      {row.address ? <CopyButton text={row.address} label={`Copy address ${row.address}`} /> : null}
      {row.isYou ? <span className="fc-you">You</span> : null}
    </div>
  );
}

function Medal({ rank }) {
  if (rank > 3) return <>#{rank}</>;
  return <span className={`cp-medal cp-medal--${rank}`} aria-label={`Rank ${rank}`}>{rank}</span>;
}

function StandingRow({ row }) {
  return (
    <tr data-testid="competition-row" className={row.isYou ? 'cp-row--you' : undefined}>
      <td className={`fc-rank${row.rank <= 3 ? ' fc-rank--top' : ''}`}><Medal rank={row.rank} /></td>
      <td>
        <ForecasterCell row={row} />
        <div className="fc-sub fc-only-phone">Last forecast <When value={row.lastAt} withTime /></div>
      </td>
      <td className="fc-num cp-points">{count(row.points)}</td>
      <td className="fc-num fc-hide-phone">{count(row.forecasts)}</td>
      <td className="fc-hide-phone fc-muted"><When value={row.lastAt} withTime /></td>
    </tr>
  );
}

function WeekTabs({ weeks, current, value, onChange }) {
  if (!weeks.length) return null;
  return (
    <div className="fc-tabbar cp-weeks" role="tablist" aria-label="Week">
      {weeks.map(w => {
        const selected = (value ?? current) === w.week;
        return (
          <button
            key={w.week}
            type="button"
            role="tab"
            aria-selected={selected}
            className={`fc-tab${selected ? ' fc-tab--active' : ''}`}
            onClick={() => onChange(w.week === current ? null : w.week)}
          >
            {w.week === current ? 'This week' : weekNumber(w.week)}
          </button>
        );
      })}
    </div>
  );
}

function Summary({ data }) {
  const c = data.competition;
  const left = c.status === 'open' ? timeLeft(c.until) : null;
  const statusText = c.status === 'open' && left ? `Ends in ${left}` : STATUS_LABEL[c.status] ?? c.status;
  return (
    <div className="fc-stats" data-testid="competition-summary">
      <WrfStatCard label={weekNumber(c.week)} value={<span className="cp-range"><WeekRange from={c.from} until={c.until} /></span>} color={primary} />
      <WrfStatCard label="Status" value={<span className="fc-stat-value cp-status">{statusText}</span>} color={c.status === 'final' ? success : infoLight} />
      <WrfStatCard label="Forecasters" value={<span className="fc-stat-value">{count(String(data.entrants ?? ''))}</span>} color={categoryColors.weather} />
      <WrfStatCard label="Forecasts scored" value={<span className="fc-stat-value">{count(data.forecasts)}</span>} color={success} />
    </div>
  );
}

function PastWeeks({ weeks, current, onPick }) {
  const past = weeks.filter(w => w.week !== current);
  if (!past.length) return null;
  return (
    <WrfCard component="section" aria-label="Past weeks" className="fc-section" header={<div className="fc-section-head"><h2>Past weeks</h2></div>} noPadding>
      <ul className="cp-past">
        {past.map(w => (
          <li key={w.week}>
            <button type="button" className="cp-past-week" onClick={() => onPick(w.week)}>
              <span className="cp-past-title">{weekNumber(w.week)}</span>
              <span className="fc-muted"><WeekRange from={w.from} until={w.until} /></span>
            </button>
            <div className="cp-past-winner">
              {w.leaders?.[0]
                ? <><span className="fc-muted">{w.status === 'final' ? 'Winner' : 'Leading'}</span> <ForecasterCell row={w.leaders[0]} /> <span className="cp-past-pts">{count(w.leaders[0].points)} pts</span></>
                : <span className="fc-muted">No scored forecasts</span>}
            </div>
            <span className={`cp-pill cp-pill--${w.status}`}>{STATUS_LABEL[w.status] ?? w.status}</span>
          </li>
        ))}
      </ul>
    </WrfCard>
  );
}

function Rules({ rule }) {
  if (!rule) return null;
  return (
    <WrfCard component="section" aria-label="How points work" className="fc-section" header={<div className="fc-section-head"><h2>How points work</h2></div>}>
      <ul className="cp-rules" data-testid="competition-rules">
        <li>{rule.points}</li>
        <li>{rule.ties}</li>
        <li>{rule.week}</li>
        <li><strong>{rule.prizes}</strong></li>
      </ul>
    </WrfCard>
  );
}

export default function PublicCompetitionsPage() {
  const themeVars = useForecasterThemeVars();
  const [week, setWeek] = useState(null); // null = this week
  const [list, setList] = useState({ loading: true, result: null });
  const [state, setState] = useState({ loading: true, result: null });

  const loadList = useCallback(() => {
    const controller = new globalThis.AbortController();
    setList({ loading: true, result: null });
    publicGet(COMPETITIONS_PATH, controller.signal).then(result => setList({ loading: false, result })).catch(() => {});
    return () => controller.abort();
  }, []);
  const load = useCallback(() => {
    const controller = new globalThis.AbortController();
    const path = week === null ? COMPETITION_CURRENT_PATH : competitionWeekPath(week);
    if (!path) return undefined;
    setState({ loading: true, result: null });
    publicGet(path, controller.signal).then(result => setState({ loading: false, result })).catch(() => {});
    return () => controller.abort();
  }, [week]);
  useEffect(() => loadList(), [loadList]);
  useEffect(() => load(), [load]);

  const listOk = list.result?.kind === 'ok';
  const weeks = listOk && Array.isArray(list.result.data?.weeks) ? list.result.data.weeks : [];
  const current = listOk ? list.result.data.current : null;
  const { loading, result } = state;
  const ok = result?.kind === 'ok';
  const data = ok ? result.data : null;
  const rows = ok && Array.isArray(data?.rows) ? data.rows : [];
  const you = ok && data?.you && !rows.some(r => r.isYou) ? data.you : null;
  const isThisWeek = week === null;

  return (
    <div className="public-read-page fc-page cp-page" data-testid="public-competitions" style={themeVars}>
      <header className="fc-head">
        <div>
          <h1>Weekly forecast competition</h1>
          <p className="fc-lede">
            Every forecast the chain scores this week earns a point. No entry form and nothing to stake: if you
            forecast on the testnet, you are in. Points only, no prizes.
          </p>
        </div>
        <div className="fc-head-side">
          <WeekTabs weeks={weeks} current={current} value={week} onChange={setWeek} />
          <GuideLink>Start forecasting</GuideLink>
        </div>
      </header>

      {ok ? <Summary data={data} /> : null}

      <WrfCard
        component="section"
        aria-label="Standings"
        className="fc-section"
        header={(
          <div className="fc-section-head">
            <h2>{ok ? `${isThisWeek ? 'This week' : weekNumber(data.competition.week)} · standings` : 'Standings'}</h2>
            {ok ? <span className="fc-count">{rows.length} shown</span> : null}
          </div>
        )}
        noPadding
      >
        {loading ? (
          <p className="fc-count fc-loading" role="status">Loading standings…</p>
        ) : !ok ? (
          result?.kind === 'not_found'
            ? <p className="fc-placeholder">No competition for that week on this chain.</p>
            : <Unavailable result={result} what="Forecast competitions" onRetry={load} />
        ) : rows.length === 0 ? (
          <div className="fc-empty-wrap">
            <WrfEmptyState
              title={isThisWeek ? 'No points yet this week' : 'No scored forecasts that week'}
              description={isThisWeek
                ? 'The first forecast the chain scores this week takes the lead. Forecasting is open to anyone with a wallet.'
                : 'Nobody had a forecast scored in that week.'}
              actionLabel="Learn how"
              onAction={() => globalThis.open?.(FORECASTING_GUIDE_HREF, '_blank', 'noopener,noreferrer')}
              sx={{ background: 'transparent' }}
            />
          </div>
        ) : (
          <table className="fc-table">
            <thead>
              <tr>
                <th className="fc-rank">#</th>
                <th>Forecaster</th>
                <th className="fc-num">Points</th>
                <th className="fc-num fc-hide-phone">Forecasts</th>
                <th className="fc-hide-phone">Last forecast</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => <StandingRow key={row.profileKey ?? row.rank} row={row} />)}
              {you ? <StandingRow key="you" row={you} /> : null}
            </tbody>
          </table>
        )}
        {ok ? (
          <div className="fc-foot">
            <span>
              {data.competition.final
                ? <>Final, read through block {count(data.competition.final.throughHeight)} · <When value={data.competition.final.finalizedAt} withTime /></>
                : <>Live as of block {count(data.asOf?.height)} · <When value={data.asOf?.time} withTime /></>}
            </span>
            <span>Addresses are shortened for visitors; sign in to your wallet to see your own.</span>
          </div>
        ) : null}
      </WrfCard>

      <div className="cp-grid">
        <PastWeeks weeks={weeks} current={current} onPick={setWeek} />
        <Rules rule={data?.competition?.rule} />
      </div>
    </div>
  );
}
