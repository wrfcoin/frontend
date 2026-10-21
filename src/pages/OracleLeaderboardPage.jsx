import React from 'react';
import { OracleLeaderboard } from '../components/oracle/OracleLeaderboard';
import { useOracleLeaderboard } from '../hooks/useOracleLeaderboard';
import LoadingSpinner from '../components/Loading/LoadingSpinner';
import './OracleLeaderboardPage.css';

export default function OracleLeaderboardPage() {
  const { entries, totalOracles, lastUpdated, loading, error, refetch } = useOracleLeaderboard(50);

  // Top oracle by reputation (first entry - already sorted descending by backend)
  const topOracle = entries[0];

  if (loading) {
    return (
      <div className="oracle-lb-page">
        <div className="oracle-lb-page__header">
          <h1>Oracle Reputation Leaderboard</h1>
        </div>
        <LoadingSpinner message="Loading oracle leaderboard…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="oracle-lb-page">
        <div className="oracle-lb-page__header">
          <h1>Oracle Reputation Leaderboard</h1>
        </div>
        <div
          style={{
            padding: '24px',
            margin: '24px 0',
            border: '1px solid var(--danger-color, #dc3545)',
            borderRadius: '8px',
            background: 'rgba(220,53,69,0.05)',
          }}
        >
          <p style={{ margin: '0 0 8px', fontWeight: 600, color: 'var(--danger-color, #dc3545)' }}>
            Failed to load oracle leaderboard
          </p>
          <p style={{ margin: '0 0 16px', fontSize: '0.9em', opacity: 0.8 }}>{error}</p>
          <button
            onClick={refetch}
            style={{
              background: 'var(--primary-color, #007bff)',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="oracle-lb-page">
      <div className="oracle-lb-page__header">
        <h1>Oracle Reputation Leaderboard</h1>
        <p className="oracle-lb-subtitle">
          Live reputation scores from the ReputationEngine &mdash; updated every block
        </p>
        {lastUpdated && (
          <p className="oracle-lb-updated">
            Last updated: {lastUpdated.toLocaleTimeString()} &middot; auto-refreshes every 30s
            {totalOracles > 0 && ` · ${totalOracles} oracle${totalOracles !== 1 ? 's' : ''} tracked`}
          </p>
        )}
      </div>

      {topOracle && (
        <div className="oracle-lb-top-card">
          <span className="oracle-lb-top-medal">🥇</span>
          <div>
            <div className="oracle-lb-top-addr">{topOracle.oracle_id}</div>
            <div className="oracle-lb-top-score">
              {topOracle.reputation_pct?.toFixed(2)}% reputation
              {topOracle.tier && (
                <span className="oracle-lb-top-tier"> &middot; {topOracle.tier}</span>
              )}
            </div>
          </div>
        </div>
      )}

      <section className="oracle-lb-page__table-section">
        <OracleLeaderboard limit={50} />
      </section>
    </div>
  );
}
