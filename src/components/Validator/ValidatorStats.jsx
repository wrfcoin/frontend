import React from 'react';
import './Validator.css';

/**
 * Displays an overview of validator statistics
 */
const ValidatorStats = ({ stats, loading, error }) => {
  if (loading) {
    return (
      <div className="validator-loading">Loading validator statistics...</div>
    );
  }

  if (error) {
    return <div className="validator-error">{error}</div>;
  }

  const {
    total_validators: totalValidators,
    active_validators: activeValidators,
    total_stake: totalStake,
    average_uptime: averageUptime,
    jailed_validators: slashingEvents,
  } = stats || {};

  return (
    <div className="validator-stats-container">
      <h3>Validator Network Overview</h3>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{totalValidators}</div>
          <div className="stat-label">Total Validators</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{activeValidators}</div>
          <div className="stat-label">Active Validators</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">
            {totalStake?.toLocaleString() || '0'}
          </div>
          <div className="stat-label">Total Stake (WRF)</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{averageUptime?.toFixed(2) || '0'}%</div>
          <div className="stat-label">Average Uptime</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{slashingEvents}</div>
          <div className="stat-label">Slashing Events</div>
        </div>
      </div>

      <div className="validator-network-health">
        <h4>Network Health</h4>
        <div className="health-meter">
          <div
            className="health-indicator"
            style={{
              width: `${Math.min((activeValidators / totalValidators) * 100, 100)}%`,
              backgroundColor: getHealthColor(
                activeValidators / totalValidators,
              ),
            }}
          />
        </div>
        <div className="health-label">
          {getHealthStatus(activeValidators / totalValidators)}
        </div>
      </div>
    </div>
  );
};

// Helper functions for health visualization
function getHealthColor(ratio) {
  if (ratio >= 0.9) return '#4CAF50'; // Green
  if (ratio >= 0.7) return '#FFC107'; // Yellow
  return '#F44336'; // Red
}

function getHealthStatus(ratio) {
  if (ratio >= 0.9) return 'Excellent';
  if (ratio >= 0.7) return 'Good';
  if (ratio >= 0.5) return 'Fair';
  return 'Critical';
}

export default ValidatorStats;
