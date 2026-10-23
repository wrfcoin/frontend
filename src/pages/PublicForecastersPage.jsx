import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { WrfCard, WrfEmptyState, WrfStatCard } from '../components/DesignSystem';
import { categoryColors, infoLight, primary, success } from '../components/DesignSystem/tokens';
import { FORECASTERS_PAGE_SIZE, forecastersPath, publicGet } from '../services/publicReadonlyApi';
import {
  CopyButton, FORECASTING_GUIDE_HREF, GuideLink, NOT_YET_LABEL, PERIODS, PeriodTabs, useForecasterThemeVars, Unavailable, When,
  count, splitBaseUnits,
} from './publicForecastersShared';
import './PublicForecastersPage.css';

/**
 * Public forecaster leaderboard (/forecasters; Phase A item A4 of wrfcoin/core4#3604, [post-GO]).
 *
 * Reads GET /api/forecasters?period&limit only. Rows are ranked by forecasts whose reward decision was first
 * recorded in the window; the previous-window delta is the backend's own figure. Anonymous callers get a
 * short address and the opaque profile key, so rows link to /forecasters/<profileKey>. Skill and paid WRF per
 * forecaster are shown exactly as the API states them: "Not yet available", never a made-up number.
 */

function Delta({ value }) {
  if (value === null || value === undefined) return <span className="fc-delta fc-delta--flat">—</span>;
  const n = Number(value);
  if (!Number.isFinite(n)) return <span className="fc-delta fc-delta--flat">—</span>;
  if (n > 0) return <span className="fc-delta fc-delta--up">▲ {n.toLocaleString()}</span>;
  if (n < 0) return <span className="fc-delta fc-delta--down">▼ {Math.abs(n).toLocaleString()}</span>;
  return <span className="fc-delta fc-delta--flat">0</span>;
}

function ForecasterCell({ row }) {
  const shown = row.address ?? row.shortAddress ?? '—';
  // Rows link by the opaque key only: a raw address is never a public profile segment.
  const segment = row.profileKey ?? null;
  const name = segment ? <Link to={`/forecasters/${encodeURIComponent(segment)}`}>{shown}</Link> : <span className="fc-mono">{shown}</span>;
  return (
    <div className="fc-addr">
      {name}
      {row.address ? <CopyButton text={row.address} label={`Copy address ${row.address}`} /> : null}
      {row.isYou ? <span className="fc-you">You</span> : null}
    </div>
  );
}

function Row({ row }) {
  const rank = row.rank;
  return (
    <tr data-testid="forecaster-row">
      <td className={`fc-rank${rank <= 3 ? ' fc-rank--top' : ''}`}>#{rank}</td>
      <td>
        <ForecasterCell row={row} />
        <div className="fc-sub fc-only-phone">Last active <When value={row.lastActiveAt} /></div>
      </td>
      <td className="fc-num">{count(row.forecasts)}</td>
      <td className="fc-num fc-hide-phone"><Delta value={row.forecastsDelta} /></td>
      <td className="fc-hide-phone"><span className="fc-un" title={row.skill?.reason}>{NOT_YET_LABEL}</span></td>
      <td className="fc-hide-phone fc-muted"><When value={row.lastActiveAt} /></td>
    </tr>
  );
}

function NetworkStats({ network }) {
  const minted = splitBaseUnits(network?.rewardsMintedBaseUnits);
  const un = <span className="fc-stat-value fc-stat-value--un">{NOT_YET_LABEL}</span>;
  return (
    <>
      <div className="fc-stats" data-testid="forecasters-network">
        <WrfStatCard label="Forecasters" value={<span className="fc-stat-value">{count(network?.forecasters)}</span>} color={primary} />
        <WrfStatCard label="Forecasts decided" value={<span className="fc-stat-value">{count(network?.forecasts)}</span>} color={categoryColors.weather} />
        <WrfStatCard
          label="Forecast rewards paid"
          value={minted ? <span className="fc-stat-value">{minted.whole}<small>{minted.frac} WRF</small></span> : un}
          color={success}
        />
        <WrfStatCard label="Network mean skill" value={un} color={infoLight} />
      </div>
      <p className="fc-note">
        Counts cover forecasts whose reward decision was first recorded in the window. Skill scores appear once the
        node publishes forecast receipts; until then nothing here estimates them.
      </p>
    </>
  );
}

export default function PublicForecastersPage() {
  const themeVars = useForecasterThemeVars();
  const [period, setPeriod] = useState('7d');
  const [state, setState] = useState({ loading: true, result: null });
  const load = useCallback(() => {
    const controller = new globalThis.AbortController();
    setState({ loading: true, result: null });
    publicGet(forecastersPath(period, FORECASTERS_PAGE_SIZE), controller.signal)
      .then(result => setState({ loading: false, result }))
      .catch(() => {});
    return () => controller.abort();
  }, [period]);
  useEffect(() => load(), [load]);

  const { loading, result } = state;
  const ok = result?.kind === 'ok';
  const rows = ok && Array.isArray(result.data?.rows) ? result.data.rows : [];
  const periodLabel = PERIODS.find(p => p.key === period)?.label ?? period;

  return (
    <div className="public-read-page fc-page" data-testid="public-forecasters" style={themeVars}>
      <header className="fc-head">
        <div>
          <h1>Forecasters</h1>
          <p className="fc-lede">
            Who is forecasting on the testnet and how their track record is building. Forecasts are paid for skill
            against later observations; anyone with a wallet can take part.
          </p>
        </div>
        <div className="fc-head-side">
          <PeriodTabs value={period} onChange={setPeriod} />
          <GuideLink />
        </div>
      </header>

      {ok ? <NetworkStats network={result.data.network} /> : null}

      <WrfCard
        component="section"
        aria-label="Forecasters"
        className="fc-section"
        header={(
          <div className="fc-section-head">
            <h2>Top forecasters · {periodLabel}</h2>
            {ok ? <span className="fc-count">{rows.length} shown</span> : null}
          </div>
        )}
        noPadding
      >
        {loading ? (
          <p className="fc-count fc-loading" role="status">Loading forecasters…</p>
        ) : !ok ? (
          <Unavailable result={result} what="Forecaster track records" onRetry={load} />
        ) : rows.length === 0 ? (
          <div className="fc-empty-wrap">
            <WrfEmptyState
              title="No forecasts yet"
              description={period === 'all'
                ? 'No forecast has reached a reward decision on this network yet. Forecasting is open to anyone with a wallet.'
                : `No forecast reached a reward decision in the last ${periodLabel.toLowerCase()}. Forecasting is open to anyone with a wallet.`}
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
                <th className="fc-num">Forecasts</th>
                <th className="fc-num fc-hide-phone">vs previous</th>
                <th className="fc-hide-phone">Mean skill</th>
                <th className="fc-hide-phone">Last active</th>
              </tr>
            </thead>
            <tbody>{rows.map(row => <Row key={row.profileKey ?? row.address ?? row.rank} row={row} />)}</tbody>
          </table>
        )}
        {ok ? (
          <div className="fc-foot">
            <span>
              As of height {count(result.data.asOf?.height)} · <When value={result.data.asOf?.time} withTime />
              {result.data.coverage?.skippedRecords && result.data.coverage.skippedRecords !== '0'
                ? ` · ${count(result.data.coverage.skippedRecords)} chain record(s) could not be read`
                : ''}
            </span>
            <span>Addresses are shortened for visitors; sign in to your wallet to see your own.</span>
          </div>
        ) : null}
      </WrfCard>
    </div>
  );
}
