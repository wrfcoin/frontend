import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { WrfCard, WrfEmptyState, WrfStatCard } from '../components/DesignSystem';
import { categoryColors, infoLight, primary } from '../components/DesignSystem/tokens';
import { useIsDarkTheme } from '../theme/ThemeProvider';
import { forecasterPath, publicGet } from '../services/publicReadonlyApi';
import {
  BackLink, CopyButton, FORECASTING_GUIDE_HREF, GuideLink, NOT_YET_LABEL, forecasterChartColors, useForecasterThemeVars, Unavailable, When, count,
} from './publicForecastersShared';
import './PublicForecastersPage.css';

/**
 * One forecaster's public track record (/forecasters/:profileKey; core4#3604 A4, [post-GO]).
 *
 * Reads GET /api/forecasters/<c_ key> only (a raw address is never a public segment). Shows what the chain exposes today (forecasts
 * decided, activity, a 30-day daily series, the recent decisions) and says "Not yet available" for skill,
 * by-variable and by-lead figures, with the backend's own reason, instead of drawing a line it cannot back.
 */

const SHORT_COMMIT = /^([0-9a-f]{8})[0-9a-f]+([0-9a-f]{6})$/i;
const shortCommit = id => (typeof id === 'string' && SHORT_COMMIT.test(id) ? id.replace(SHORT_COMMIT, '$1…$2') : String(id ?? '—'));

function SeriesChart({ series }) {
  const colors = forecasterChartColors(useIsDarkTheme());
  const data = (Array.isArray(series) ? series : []).map(point => ({ day: point.day, forecasts: Number(point.forecasts) || 0 }));
  if (data.length === 0) {
    return <p className="fc-chart-note" role="note">No forecasts in the last 30 days.</p>;
  }
  return (
    <div className="fc-chart" data-testid="forecaster-series">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={colors.grid} vertical={false} />
          <XAxis dataKey="day" tick={{ fill: colors.tick, fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={d => String(d).slice(5)} />
          <YAxis allowDecimals={false} width={28} tick={{ fill: colors.tick, fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: colors.cursor }}
            contentStyle={{ background: colors.tooltip.background, border: `1px solid ${colors.tooltip.border}`, borderRadius: 8, boxShadow: colors.tooltip.shadow, fontSize: 12 }}
            labelStyle={{ color: colors.tooltip.label }}
            itemStyle={{ color: colors.tooltip.item }}
          />
          <Bar dataKey="forecasts" name="Forecasts" fill={colors.bar} radius={[3, 3, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function NotYet({ title, reason }) {
  return (
    <div className="fc-placeholder" role="note">
      <strong>{title}: {NOT_YET_LABEL.toLowerCase()}</strong>
      {reason}
    </div>
  );
}

function RecentRow({ r }) {
  return (
    <tr data-testid="forecast-row">
      <td className="fc-rank" title={r.commitId}>{shortCommit(r.commitId)}</td>
      <td>{r.stationId ?? '—'}<div className="fc-sub fc-only-phone"><When value={r.decidedAt} /> · height {count(r.blockHeight)}</div></td>
      <td className="fc-hide-phone fc-muted"><When value={r.decidedAt} withTime /></td>
      <td className="fc-num fc-hide-phone">{count(r.blockHeight)}</td>
      <td className="fc-hide-phone"><span className="fc-un">{r.receipt === 'present' && typeof r.skill === 'number' ? r.skill.toFixed(3) : NOT_YET_LABEL}</span></td>
    </tr>
  );
}

export default function PublicForecasterPage() {
  const { profileKey } = useParams();
  const themeVars = useForecasterThemeVars();
  const path = forecasterPath(String(profileKey ?? ''));
  const [state, setState] = useState({ loading: Boolean(path), result: null });
  const load = useCallback(() => {
    if (!path) return undefined;
    const controller = new globalThis.AbortController();
    setState({ loading: true, result: null });
    publicGet(path, controller.signal)
      .then(result => setState({ loading: false, result }))
      .catch(() => {});
    return () => controller.abort();
  }, [path]);
  useEffect(() => load(), [load]);

  const { loading, result } = state;
  const notFound = !path || result?.kind === 'not_found';

  if (notFound) {
    return (
      <main className="public-read-page fc-page" data-testid="public-forecaster" style={themeVars}>
        <BackLink />
        <WrfEmptyState title="Forecaster not found" description="No forecaster matches this link. It may have been shortened or copied incompletely." />
      </main>
    );
  }
  if (loading || !result) {
    return <main className="public-read-page fc-page" data-testid="public-forecaster" style={themeVars}><BackLink /><p className="fc-count" role="status">Loading track record…</p></main>;
  }
  if (result.kind !== 'ok') {
    return <main className="public-read-page fc-page" data-testid="public-forecaster" style={themeVars}><BackLink /><Unavailable result={result} what="Forecaster track records" onRetry={load} /></main>;
  }

  const d = result.data;
  const shown = d.address ?? d.shortAddress ?? '—';
  const totals = d.totals ?? {};
  const recent = Array.isArray(d.recent) ? d.recent : [];
  const skillReason = d.skill?.reason ?? totals.meanSkill?.reason ?? '';
  const noForecasts = totals.forecasts === '0';

  return (
    <main className="public-read-page fc-page" data-testid="public-forecaster" style={themeVars}>
      <BackLink />
      <header className="fc-head fc-record-head">
        <div>
          <h1>
            Forecaster <span className="fc-mono" title={d.address ?? undefined}>{shown}</span>
            {d.address ? <CopyButton text={d.address} label={`Copy address ${d.address}`} /> : null}
            {d.isYou ? <span className="fc-you">You</span> : null}
          </h1>
          <p className="fc-lede">
            Public track record from the chain's own forecast reward decisions. Addresses are shortened for visitors;
            {d.isYou ? ' this is your wallet.' : ' sign in to your wallet to see your own in full.'}
          </p>
        </div>
        <div className="fc-head-side">
          {d.isYou ? <Link className="fc-guide" to="/wallet">Open your wallet activity</Link> : null}
          <GuideLink />
        </div>
      </header>

      <div className="fc-stats" data-testid="forecaster-totals">
        <WrfStatCard label="Forecasts decided" value={<span className="fc-stat-value">{count(totals.forecasts)}</span>} color={categoryColors.weather} />
        <WrfStatCard label="First active" value={<span className="fc-stat-value fc-stat-value--un"><When value={totals.firstActiveAt} /></span>} color={primary} />
        <WrfStatCard label="Last active" value={<span className="fc-stat-value fc-stat-value--un"><When value={totals.lastActiveAt} /></span>} color={primary} />
        <WrfStatCard label="Mean skill" value={<span className="fc-stat-value fc-stat-value--un">{NOT_YET_LABEL}</span>} color={infoLight} />
      </div>
      <p className="fc-note">
        {totals.byProvenance ? `Real stations ${count(totals.byProvenance.real)} · synthetic ${count(totals.byProvenance.synthetic)} · unclassified ${count(totals.byProvenance.unclassified)}. ` : ''}
        Paid WRF per forecaster is not in block data yet; the wallet's own activity view shows paid credits.
      </p>

      {noForecasts ? (
        <WrfCard component="section" className="fc-section" noPadding>
          <div className="fc-empty-wrap">
            <WrfEmptyState
              title="No forecasts yet"
              description="This wallet has no forecast with a reward decision on chain. Forecasting is open to anyone with a wallet."
              actionLabel="Learn how"
              onAction={() => globalThis.open?.(FORECASTING_GUIDE_HREF, '_blank', 'noopener,noreferrer')}
              sx={{ background: 'transparent' }}
            />
          </div>
        </WrfCard>
      ) : null}

      <div className="fc-grid-2">
        <WrfCard component="section" aria-label="Skill over time" className="fc-section" header={<div className="fc-section-head"><h2>Forecasts per day · last 30 days</h2></div>} noPadding>
          <SeriesChart series={d.series} />
          <p className="fc-chart-note">Skill over time is drawn on this chart once the node publishes forecast receipts. {skillReason}</p>
        </WrfCard>
        <WrfCard component="section" aria-label="Skill by variable and lead time" className="fc-section" header={<div className="fc-section-head"><h2>By variable and lead time</h2></div>} noPadding>
          <NotYet title="Skill by variable" reason="Temperature, pressure and humidity skill (RMSE, MAE, bias) will be listed per variable." />
          <NotYet title="Skill by lead time" reason="Skill per forecast horizon (6 h, 24 h, 72 h …) will be listed here." />
        </WrfCard>
      </div>

      <WrfCard
        component="section"
        aria-label="Recent forecasts"
        className="fc-section"
        header={<div className="fc-section-head"><h2>Recent forecasts</h2><span className="fc-count">{recent.length} most recent decision{recent.length === 1 ? '' : 's'}</span></div>}
        noPadding
      >
        {recent.length === 0 ? (
          <p className="fc-count fc-loading">No forecast decisions recorded for this wallet.</p>
        ) : (
          <table className="fc-table">
            <thead>
              <tr>
                <th className="fc-rank">Commit</th>
                <th>Station</th>
                <th className="fc-hide-phone">Decided</th>
                <th className="fc-num fc-hide-phone">Height</th>
                <th className="fc-hide-phone">Skill</th>
              </tr>
            </thead>
            <tbody>{recent.map(r => <RecentRow key={`${r.commitId}-${r.blockHeight}`} r={r} />)}</tbody>
          </table>
        )}
        <div className="fc-foot">
          <span>As of height {count(d.asOf?.height)} · <When value={d.asOf?.time} withTime /></span>
          <span>A forecast counts from the block where its reward decision was first recorded.</span>
        </div>
      </WrfCard>
    </main>
  );
}
