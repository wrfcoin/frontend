import { useState } from 'react';
import { useSlashingEvents, violationLabel } from '../../hooks/useSlashingEvents';

const PAGE_SIZE = 20;

/**
 * Truncate a participant address for display.
 * Shows first 6 chars + ellipsis + last 4 chars.
 */
function truncateAddr(addr) {
  if (!addr || addr.length < 12) return addr ?? '—';
  return `${addr.slice(0, 6)}\u2026${addr.slice(-4)}`;
}

/**
 * Format a slashed_amount (u128 serialised as number) into WRF units.
 * The WRF token uses 10^8 base units per coin (WRF_UNITS_PER_COIN).
 */
function formatWrf(baseUnits) {
  if (baseUnits == null) return '—';
  return (baseUnits / 1e8).toFixed(4) + ' WRF';
}

/**
 * Colour-coded badge for violation type derived from quality_band.
 * "low" band -> DATA-004 physical range violation -> red
 * other bands -> orange/amber
 */
function ViolationBadge({ event }) {
  const label = violationLabel(event);
  const isData = event.quality_band === 'low';
  return (
    <span className={`slashing-badge ${isData ? 'slashing-badge--data' : 'slashing-badge--other'}`}>
      {label}
    </span>
  );
}

/**
 * Paginated slashing-event log table.
 *
 * Props:
 *   compact        {boolean}  If true, show only last 5 rows, no pagination/filter bar.
 *   filterOracle   {string}   If set, only show events from this participant address.
 */
export function SlashingEventLog({ compact = false, filterOracle = null }) {
  const { events, loading, error, byViolationType } = useSlashingEvents();
  const [page, setPage] = useState(0);
  const [bandFilter, setBandFilter] = useState('all');

  let filtered = filterOracle
    ? events.filter(e => e.participant === filterOracle)
    : events;

  if (bandFilter !== 'all') {
    filtered = filtered.filter(e => (e.quality_band ?? 'unknown') === bandFilter);
  }

  const display = compact
    ? filtered.slice(0, 5)
    : filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  if (loading) {
    return (
      <div className="slashing-skeleton">
        <p>Loading slashing events\u2026</p>
        <table className="slashing-table slashing-table--loading">
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                <td colSpan={compact ? 3 : 6}><span className="slashing-placeholder" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (error) {
    return <div className="slashing-error">Failed to load slashing events: {error}</div>;
  }

  const uniqueBands = [...new Set(events.map(e => e.quality_band ?? 'unknown'))];

  return (
    <div className={`slashing-log${compact ? ' slashing-log--compact' : ''}`}>
      {!compact && (
        <div className="slashing-log__filters">
          <label>
            Quality band:&nbsp;
            <select
              value={bandFilter}
              onChange={e => { setBandFilter(e.target.value); setPage(0); }}
            >
              <option value="all">All ({events.length})</option>
              {uniqueBands.map(band => (
                <option key={band} value={band}>
                  {band} ({events.filter(e => (e.quality_band ?? 'unknown') === band).length})
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {display.length === 0 ? (
        <p className="slashing-empty">No slashing events recorded yet.</p>
      ) : (
        <table className="slashing-table">
          <thead>
            <tr>
              <th>Block</th>
              <th>Participant</th>
              <th>Violation</th>
              {!compact && <th>Quality Band</th>}
              <th>Amount Slashed</th>
              {!compact && <th>Streak</th>}
            </tr>
          </thead>
          <tbody>
            {display.map((e, i) => (
              <tr key={`${e.block_height}-${e.participant}-${e.event_id ?? i}`}>
                <td className="slashing-mono">{e.block_height ?? '—'}</td>
                <td
                  className="slashing-mono slashing-addr"
                  title={e.participant}
                >
                  {truncateAddr(e.participant)}
                </td>
                <td><ViolationBadge event={e} /></td>
                {!compact && <td>{e.quality_band ?? '—'}</td>}
                <td className="slashing-amount">{formatWrf(e.slashed_amount)}</td>
                {!compact && (
                  <td className="slashing-streak">
                    {e.low_quality_streak != null
                      ? `${e.low_quality_streak} / ${e.low_quality_slash_threshold ?? '?'}`
                      : '—'}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!compact && totalPages > 1 && (
        <div className="slashing-pagination">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            &larr; Prev
          </button>
          <span>{page + 1} / {totalPages}</span>
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
