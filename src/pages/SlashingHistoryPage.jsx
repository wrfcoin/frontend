import React from 'react';
import { SlashingEventLog } from '../components/oracle/SlashingEventLog';
import { useSlashingEvents } from '../hooks/useSlashingEvents';
import LoadingSpinner from '../components/Loading/LoadingSpinner';
import './SlashingHistoryPage.css';

export default function SlashingHistoryPage() {
  const {
    totalSlashed,
    uniqueOracles,
    byQualityBand,
    lastUpdated,
    events,
    loading,
    error,
    refetch,
  } = useSlashingEvents();

  const violationTypeCount = Object.keys(byQualityBand).length;

  if (loading) {
    return (
      <div className="slashing-page">
        <div className="slashing-page__header">
          <h1>Data Quality Slashing History</h1>
        </div>
        <LoadingSpinner message="Loading slashing events…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="slashing-page">
        <div className="slashing-page__header">
          <h1>Data Quality Slashing History</h1>
        </div>
        <div
          style={{
            padding: '24px',
            margin: '24px 0',
            border: '1px solid var(--danger-color, #dc3545)',
            borderRadius: '8px',
            background: 'rgba(220,53,69,0.05)',
            color: 'var(--text-color)',
          }}
        >
          <p style={{ margin: '0 0 8px', fontWeight: 600, color: 'var(--danger-color, #dc3545)' }}>
            Failed to load slashing events
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
    <div className="slashing-page">
      <div className="slashing-page__header">
        <h1>Data Quality Slashing History</h1>
        <p className="slashing-page__subtitle">
          On-chain record of oracle slashing events for physical-range and data-quality violations
        </p>
        {lastUpdated && (
          <p className="slashing-page__updated">
            Last updated: {lastUpdated.toLocaleTimeString()} &middot; auto-refreshes every 60s
          </p>
        )}
      </div>

      <div className="slashing-stats-bar">
        <div className="slashing-stat">
          <span className="slashing-stat__value">{events.length}</span>
          <span className="slashing-stat__label">Total Events</span>
        </div>
        <div className="slashing-stat">
          <span className="slashing-stat__value">{uniqueOracles}</span>
          <span className="slashing-stat__label">Participants Slashed</span>
        </div>
        <div className="slashing-stat">
          <span className="slashing-stat__value slashing-stat__value--red">
            {(totalSlashed / 1e8).toFixed(2)} WRF
          </span>
          <span className="slashing-stat__label">Total Slashed</span>
        </div>
        <div className="slashing-stat">
          <span className="slashing-stat__value">{violationTypeCount}</span>
          <span className="slashing-stat__label">Quality Bands</span>
        </div>
      </div>

      <section className="slashing-page__table-section">
        <SlashingEventLog />
      </section>
    </div>
  );
}
