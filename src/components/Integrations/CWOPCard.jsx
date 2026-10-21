import React, { useState, useEffect } from 'react';
import StatusBadge from '../common/StatusBadge';
import InfoBox from '../common/InfoBox';

/**
 * CWOP (Citizen Weather Observer Program) Integration Card
 * NOAA-affiliated program for amateur weather stations
 */
const CWOPCard = ({ onClick, isActive }) => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    setStats({
      stations: '12,000+',
      countries: '50+',
      dataTypes: [
        'Temperature',
        'Humidity',
        'Pressure',
        'Wind',
        'Precipitation',
      ],
      noaaAffiliated: true,
      earnPotential: '0.15-0.6 WRF/hour',
    });
  }, []);

  const status = 'available';

  return (
    <div
      className={`integration-card cwop ${isActive ? 'active' : ''}`}
      onClick={onClick}
      style={{ borderLeft: '4px solid #1E40AF' }}
    >
      <div className="integration-header">
        <div
          className="integration-icon"
          style={{ backgroundColor: '#1E40AF' }}
        >
          <i className="bi bi-shield-check"></i>
        </div>
        <div className="integration-info">
          <h3>CWOP (NOAA)</h3>
          <p>Citizen Weather Observer Program - NOAA affiliated</p>
          <StatusBadge status={status} />
        </div>
      </div>

      <div className="integration-content">
        <div className="integration-section">
          <h4>NOAA-Recognized Data Sharing</h4>
          <p>
            Connect your CWOP station to earn WRF tokens while contributing to
            NOAA's Meteorological Assimilation Data Ingest System (MADIS). Your
            data supports both government weather services and blockchain
            rewards.
          </p>

          {stats && (
            <div className="cwop-stats">
              <div className="stat-row">
                <span className="stat-label">Active Stations:</span>
                <span className="stat-value">{stats.stations}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Global Coverage:</span>
                <span className="stat-value">{stats.countries} countries</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Earn Potential:</span>
                <span className="stat-value highlight">
                  {stats.earnPotential}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="integration-features">
          <h4>Benefits</h4>
          <div className="feature-list">
            <div className="feature">
              <i className="bi bi-award"></i>
              <span>NOAA-recognized data quality standards</span>
            </div>
            <div className="feature">
              <i className="bi bi-coin"></i>
              <span>Premium WRF rewards for government-grade data</span>
            </div>
            <div className="feature">
              <i className="bi bi-globe"></i>
              <span>Contribute to national weather infrastructure</span>
            </div>
            <div className="feature">
              <i className="bi bi-graph-up-arrow"></i>
              <span>Enhanced reputation for MADIS integration</span>
            </div>
          </div>
        </div>

        <div className="integration-requirements">
          <h4>Setup Requirements</h4>
          <div className="requirements-list">
            <div className="requirement">
              <i className="bi bi-check-circle"></i>
              <span>CWOP Station ID (format: XXXXXX)</span>
            </div>
            <div className="requirement">
              <i className="bi bi-check-circle"></i>
              <span>APRS-IS passcode</span>
            </div>
            <div className="requirement">
              <i className="bi bi-check-circle"></i>
              <span>Valid station coordinates</span>
            </div>
          </div>
        </div>

        <InfoBox
          type="info"
          title="Government Integration"
          message="CWOP stations contribute to official weather forecasting. Earn WRF tokens while supporting national weather infrastructure with scientifically valuable data."
        />
      </div>
    </div>
  );
};

export default CWOPCard;
