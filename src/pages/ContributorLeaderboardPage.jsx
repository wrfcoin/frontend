/**
 * ContributorLeaderboardPage — /leaderboard/contributors
 *
 * Regional contributor leaderboard (#151). Global rankings work today via
 * GET /api/weather/leaderboard; region filtering is wired for backend#695
 * (geographic extension to weather-leaderboard-routes.ts) and gated behind
 * the `leaderboardRegions` feature flag until the backend lands.
 *
 * Links to /impact/:key (PR #155) for each contributor's profile page. The key is the opaque
 * `profileKey` from the API (backend#1361): anonymous callers no longer receive full wallet addresses.
 */

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useOptionalWallet } from '../contexts/WalletContext.jsx';
import { useWeatherLeaderboard, LEADERBOARD_REGIONS } from '../hooks/useWeatherLeaderboard';
import { FEATURES } from '../config/features';
import {
  isFullStudioEnabled,
  isOperatorPreviewEnabled,
  isPublicReadonlyEnabled,
  isPublicTestnetPath,
} from '../config/contractSurfacePolicy';
import { CONTRIBUTOR_KEY_RE } from '../services/publicReadonlyApi';
import { mayBeWallet, profileSegment, sameWallet, shortAddr } from '../utils/publicAddress';
import './ContributorLeaderboardPage.css';
import RoleEarningsBoard from '../components/Leaderboard/RoleEarnings';

const METRICS = [
  { key: 'earnings', label: 'Earnings' },
  { key: 'submissions', label: 'Readings' },
  { key: 'quality_score', label: 'Quality' },
  { key: 'streak', label: 'Streak' },
];

const PERIODS = [
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: 'all', label: 'All time' },
];

// Active region filter set driven by backend#695's LeaderboardRegion enum.
const REGION_TABS = LEADERBOARD_REGIONS.map(r => ({ key: r, label: r }));

// WRF amounts are exact base units (8 decimals): BigInt only, never Number() (frontend#526).
const WRF_UNITS_PER_COIN = 100000000n;
function formatBaseUnits(raw) {
  if (typeof raw !== 'string' || !/^\d{1,39}$/.test(raw)) return null;
  const units = BigInt(raw);
  const whole = (units / WRF_UNITS_PER_COIN).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const fraction = (units % WRF_UNITS_PER_COIN).toString().padStart(8, '0').replace(/0+$/, '');
  return `${fraction ? `${whole}.${fraction}` : whole} WRF`;
}

function entryMetric(metric, entry) {
  return metric === 'earnings' ? (formatBaseUnits(entry.earningsBaseUnits) ?? '—') : metricLabel(metric, entry.value);
}

function metricLabel(metric, value) {
  if (metric === 'quality_score') return `${value}%`;
  if (metric === 'streak') return `${value}d`;
  return Number(value).toLocaleString();
}

function metricColumnHeader(metric) {
  if (metric === 'quality_score') return 'Avg quality';
  if (metric === 'streak') return 'Streak';
  if (metric === 'earnings') return 'WRF earned (lifetime)';
  return 'Readings';
}

// The page is public, but /impact and /referrals are not: a link is rendered only when the build's own
// route policy would mount its target, so the public build never points at a 404 or a preview page.
function pathReachable(path) {
  return isPublicTestnetPath(
    path,
    isFullStudioEnabled(import.meta.env?.VITE_ENABLE_FULL_STUDIO),
    isPublicReadonlyEnabled(import.meta.env?.VITE_PUBLIC_READONLY_PATHS),
    isOperatorPreviewEnabled(import.meta.env?.VITE_ENABLE_OPERATOR_PREVIEW),
  );
}

function RankBadge({ rank }) {
  if (rank === 1) return <span className="lb-rank lb-rank--gold">🥇</span>;
  if (rank === 2) return <span className="lb-rank lb-rank--silver">🥈</span>;
  if (rank === 3) return <span className="lb-rank lb-rank--bronze">🥉</span>;
  return <span className="lb-rank">#{rank}</span>;
}

function TabBar({ options, value, onChange }) {
  return (
    <div className="lb-tabbar" role="tablist">
      {options.map(opt => (
        <button
          key={opt.key}
          role="tab"
          aria-selected={value === opt.key}
          className={`lb-tab ${value === opt.key ? 'lb-tab--active' : ''} ${opt.soon ? 'lb-tab--soon' : ''}`}
          onClick={() => !opt.soon && onChange(opt.key)}
          title={opt.soon ? 'Regional rankings launching soon' : undefined}
        >
          {opt.label}
          {opt.soon && <span className="lb-soon-pill">Soon</span>}
        </button>
      ))}
    </div>
  );
}

export default function ContributorLeaderboardPage() {
  // Routed without a WalletProvider in the public build (frontend#302): a visitor with no wallet is fine.
  const account = useOptionalWallet()?.account ?? null;
  // Full-studio/preview builds keep the richer /impact page; the public build links the opaque-key page (S6).
  const impactProfileReachable = pathReachable('/impact/:address');
  const contributorProfileReachable = pathReachable('/contributor/:key');
  const impactReachable = pathReachable('/impact');

  const regionsEnabled = FEATURES.leaderboardRegions;
  const regionOptions = REGION_TABS;
  const defaultRegion = 'Global';

  const [metric, setMetric] = useState('earnings');
  const [period, setPeriod] = useState('7d');
  const [region, setRegion] = useState(defaultRegion);

  const isEarnings = metric === 'earnings';
  const { entries, loading, error, unavailable: earningsUnavailable, updatedAt, refetch } = useWeatherLeaderboard({
    metric,
    period,
    limit: 25,
    region: regionsEnabled && !isEarnings ? region : undefined,
  });

  // Any failed read (earnings 503 included) shows the failure with Retry on every tab: never an empty
  // list or an own-row claim, both of which would be false on a read that did not succeed.
  const failed = Boolean(error) || (isEarnings && earningsUnavailable);

  const hasGeoRows = useMemo(
    () => entries.some(e => e.country != null || e.city != null),
    [entries],
  );
  const showGeoColumn = regionsEnabled && hasGeoRows;

  // Find user's own entry in the list (for pinned row)
  const userEntry = useMemo(
    () => (account ? entries.find(e => e.isYou === true || sameWallet(account, e.walletAddress)) : null),
    [entries, account],
  );

  const userInTopN = Boolean(userEntry);
  // A short address that merely MATCHES the connected wallet is ambiguous (many wallets share a short
  // form): do not claim "not in top 25" then, and do not label anyone "you" without proof.
  const ambiguousRow = !userInTopN && Boolean(account) && entries.some(e => mayBeWallet(account, e.walletAddress));
  const showPinnedRow = account && !userInTopN && !ambiguousRow;

  const shareText = useMemo(() => {
    if (!userEntry) return null;
    return encodeURIComponent(
      `I'm ranked #${userEntry.rank} on the WRFCoin contributor leaderboard (${entryMetric(metric, userEntry)} ${METRICS.find(m => m.key === metric)?.label.toLowerCase()}) — check it out! https://wrfcoin.io/leaderboard/contributors`,
    );
  }, [userEntry, metric]);

  return (
    <div className="lb-page">
      <div className="lb-hero">
        <h1 className="lb-title">Contributor Leaderboard</h1>
        <p className="lb-subtitle">Top weather contributors ranked by WRF earned, readings, quality, and consistency.</p>
      </div>

      <RoleEarningsBoard />

      {/* Region selector */}
      <div className="lb-controls">
        {!isEarnings && regionsEnabled && (<div className="lb-control-group">
          <span className="lb-control-label">Region</span>
          {(
            <label className="lb-region-select-wrap">
              <span className="lb-visually-hidden">Region</span>
              <select
                className="lb-region-select"
                value={region}
                onChange={e => setRegion(e.target.value)}
              >
                {regionOptions.map(opt => (
                  <option key={opt.key} value={opt.key}>{opt.label}</option>
                ))}
              </select>
            </label>
          )}
        </div>)}
        <div className="lb-control-group">
          <span className="lb-control-label">Ranked by</span>
          <TabBar options={METRICS} value={metric} onChange={setMetric} />
        </div>
        {!isEarnings && (<div className="lb-control-group">
          <span className="lb-control-label">Period</span>
          <TabBar options={PERIODS} value={period} onChange={setPeriod} />
        </div>)}
      </div>


      {isEarnings && !failed && !loading && (
        <p className="lb-updated">Lifetime WRF paid for real weather stations, proven by the node.</p>
      )}

      {/* User share card (if ranked) */}
      {userEntry && shareText && (
        <div className="lb-user-share">
          <span className="lb-user-share-text">
            You're <strong>#{userEntry.rank}</strong> — {entryMetric(metric, userEntry)} {METRICS.find(m => m.key === metric)?.label.toLowerCase()}
          </span>
          <a
            className="lb-share-btn lb-share-btn--twitter"
            href={`https://twitter.com/intent/tweet?text=${shareText}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Share on X
          </a>
          <a
            className="lb-share-btn lb-share-btn--farcaster"
            href={`https://warpcast.com/~/compose?text=${shareText}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Share on Farcaster
          </a>
        </div>
      )}

      {/* Table */}
      <div className="lb-table-wrap">
        {loading ? (
          <div className="lb-loading">Loading…</div>
        ) : failed ? (
          <div className="lb-error" role="alert">
            {isEarnings
              ? 'Earnings are unavailable right now: the node could not confirm every contributor.'
              : `Could not load the leaderboard (${error}).`}
            <button type="button" className="lb-tab" onClick={() => refetch()}>Retry</button>
          </div>
        ) : (
          <table className="lb-table">
            <thead>
              <tr>
                <th className="lb-th lb-th--rank">Rank</th>
                <th className="lb-th">Contributor</th>
                {showGeoColumn && (
                  <th className="lb-th lb-th--hide-sm">Location</th>
                )}
                <th className="lb-th lb-th--num">{metricColumnHeader(metric)}</th>
                <th className="lb-th lb-th--num lb-th--hide-sm">Level</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => {
                const isUser = entry.isYou === true || sameWallet(account, entry.walletAddress);
                const segment = profileSegment(entry);
                // Only an opaque c_ key may reach /contributor; a raw-address segment links to /impact or nowhere.
                const profileHref = segment
                  ? impactProfileReachable
                    ? `/impact/${segment}`
                    : CONTRIBUTOR_KEY_RE.test(segment) && contributorProfileReachable
                      ? `/contributor/${segment}`
                      : null
                  : null;
                const contributor = (
                  <>
                    <span className="lb-display-name">{entry.displayName}</span>
                    <span className="lb-addr">{shortAddr(entry.walletAddress)}</span>
                  </>
                );
                return (
                  <tr key={entry.profileKey ?? entry.walletAddress} className={`lb-row ${isUser ? 'lb-row--user' : ''}`}>
                    <td className="lb-td lb-td--rank">
                      <RankBadge rank={entry.rank} />
                    </td>
                    <td className="lb-td lb-td--name">
                      {profileHref ? (
                        <Link to={profileHref} className="lb-contributor-link">
                          {contributor}
                        </Link>
                      ) : (
                        <span className="lb-contributor-link">{contributor}</span>
                      )}
                      {isUser && <span className="lb-you-pill">you</span>}
                    </td>
                    {showGeoColumn && (
                      <td className="lb-td lb-td--hide-sm lb-td--geo">
                        {entry.city && <span className="lb-city">{entry.city}</span>}
                        {entry.city && entry.country && <span className="lb-geo-sep">, </span>}
                        {entry.country && <span className="lb-country">{entry.country}</span>}
                        {!entry.city && !entry.country && <span className="lb-geo-empty">—</span>}
                      </td>
                    )}
                    <td className="lb-td lb-td--num">
                      {entryMetric(metric, entry)}
                    </td>
                    <td className="lb-td lb-td--num lb-td--hide-sm">
                      {entry.badgeLevel ? (
                        <span className={`lb-badge-level lb-badge-level--${entry.badgeLevel}`}>{entry.badgeLevel}</span>
                      ) : '—'}
                    </td>
                  </tr>
                );
              })}

              {/* Pinned user row if outside top-N */}
              {showPinnedRow && !failed && (
                <tr className="lb-row lb-row--user lb-row--pinned">
                  <td className="lb-td lb-td--rank">
                    <span className="lb-rank">—</span>
                  </td>
                  <td className="lb-td lb-td--name" colSpan={showGeoColumn ? 4 : 3}>
                    <span className="lb-display-name">You ({shortAddr(account)})</span>
                    <span className="lb-addr">{isEarnings ? ' — not among the top 25 earners yet' : ' — not in top 25 this period'}</span>
                    {impactReachable && <Link to="/impact" className="lb-link lb-link--sm">View your impact →</Link>}
                  </td>
                </tr>
              )}

              {entries.length === 0 && !loading && !failed && (
                <tr>
                  <td className="lb-empty" colSpan={showGeoColumn ? 5 : 4}>{isEarnings ? 'No contributor has earned WRF yet.' : 'No contributors found for this period.'}</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {updatedAt && (
        <div className="lb-updated">
          Updated {updatedAt.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
