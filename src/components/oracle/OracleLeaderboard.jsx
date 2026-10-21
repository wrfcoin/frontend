import { useState } from 'react';
import { useOracleLeaderboard } from '../../hooks/useOracleLeaderboard';

const PAGE_SIZE = 20;

const MEDALS = ['\uD83E\uDD47', '\uD83E\uDD48', '\uD83E\uDD49']; // 🥇🥈🥉

/**
 * Truncate an oracle_id for display.
 * Shows first 6 chars + ellipsis + last 4 chars.
 */
function truncateAddr(addr) {
  if (!addr || addr.length < 12) return addr ?? '\u2014';
  return `${addr.slice(0, 6)}\u2026${addr.slice(-4)}`;
}

/**
 * Tier badge — maps tier string from backend to a colour class.
 * Tiers (from core4): "Bronze" | "Silver" | "Gold" | "Platinum"
 */
function TierBadge({ tier }) {
  const cls =
    tier === 'Platinum'
      ? 'oracle-tier--platinum'
      : tier === 'Gold'
        ? 'oracle-tier--gold'
        : tier === 'Silver'
          ? 'oracle-tier--silver'
          : 'oracle-tier--bronze';
  return <span className={`oracle-tier-badge ${cls}`}>{tier ?? '\u2014'}</span>;
}

/**
 * Colour-coded reputation_pct badge.
 * reputation_pct is 0–100 (already computed by backend as score/1_000_000 * 100).
 */
function ScoreBadge({ pct }) {
  const cls =
    pct >= 75 ? 'score--high' : pct >= 50 ? 'score--mid' : pct >= 25 ? 'score--low' : 'score--very-low';
  return (
    <span className={`oracle-score ${cls}`}>
      {pct != null ? pct.toFixed(2) : '\u2014'}%
    </span>
  );
}

/**
 * Ranked table of oracles by reputation score.
 *
 * Props:
 *   compact  {boolean}  If true, show top 5 only (rank + oracle + score), no pagination.
 *   limit    {number}   Max entries to fetch (default 50).
 */
export function OracleLeaderboard({ compact = false, limit = 50 }) {
  const { entries, loading, error } = useOracleLeaderboard(compact ? 5 : limit);
  const [page, setPage] = useState(0);

  // Backend already sorts descending by reputation_score, but add client-side fallback.
  const sorted = [...entries].sort(
    (a, b) => (b.reputation_score ?? 0) - (a.reputation_score ?? 0),
  );

  const display = compact
    ? sorted.slice(0, 5)
    : sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);

  if (loading) {
    return (
      <div className="oracle-lb-skeleton">
        <p>Loading leaderboard\u2026</p>
        <table className="oracle-lb-table oracle-lb-table--loading">
          <tbody>
            {Array.from({ length: compact ? 5 : 8 }).map((_, i) => (
              <tr key={i}>
                <td colSpan={compact ? 3 : 5}>
                  <span className="oracle-lb-placeholder" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (error) {
    return <div className="oracle-lb-error">Failed to load: {error}</div>;
  }

  if (display.length === 0) {
    return <p className="oracle-lb-empty">No oracle data available.</p>;
  }

  return (
    <div className={`oracle-leaderboard${compact ? ' oracle-leaderboard--compact' : ''}`}>
      <table className="oracle-lb-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Oracle</th>
            <th>Reputation</th>
            {!compact && <th>Tier</th>}
            {!compact && <th>Raw Score</th>}
          </tr>
        </thead>
        <tbody>
          {display.map((entry, i) => {
            const rank = compact ? i + 1 : page * PAGE_SIZE + i + 1;
            return (
              <tr key={entry.oracle_id ?? i}>
                <td className="oracle-lb-rank">
                  {rank <= 3 ? MEDALS[rank - 1] : rank}
                </td>
                <td
                  className="oracle-lb-addr slashing-mono"
                  title={entry.oracle_id}
                >
                  {truncateAddr(entry.oracle_id)}
                </td>
                <td>
                  <ScoreBadge pct={entry.reputation_pct} />
                </td>
                {!compact && (
                  <td>
                    <TierBadge tier={entry.tier} />
                  </td>
                )}
                {!compact && (
                  <td className="oracle-lb-raw-score">
                    {entry.reputation_score?.toLocaleString() ?? '\u2014'}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {!compact && totalPages > 1 && (
        <div className="slashing-pagination">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            &larr; Prev
          </button>
          <span>
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
          >
            Next &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
