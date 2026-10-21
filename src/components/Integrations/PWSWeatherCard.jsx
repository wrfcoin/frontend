import React, { useState, useEffect } from 'react';
import StatusBadge from '../common/StatusBadge';
import InfoBox from '../common/InfoBox';

/**
 * PWSWeather (AerisWeather) Integration Card
 * Professional and hobbyist weather station data sharing platform
 */
const PWSWeatherCard = ({ onClick, isActive }) => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // PWSWeather network stats
    setStats({
      stations: '45,000+',
      coverage: 'Global Professional Network',
      dataTypes: ['Temperature', 'Humidity', 'Wind', 'Pressure', 'UV', 'Solar'],
      commercial: 'Used by AerisWeather',
      earnPotential: '0.3-1.2 WRF/hour',
    });
  }, []);

  const status = 'available';

  return (
    <div
      className={`integration-card pwsweather ${isActive ? 'active' : ''}`}
      onClick={onClick}
      style={{ borderLeft: '4px solid #2E86AB' }}
    >
      <div className="integration-header">
        <div
          className="integration-icon"
          style={{ backgroundColor: '#2E86AB' }}
        >
          <i className="bi bi-cloud-rain"></i>
        </div>
        <div className="integration-info">
          <h3>PWSWeather</h3>
          <p>Professional weather network owned by AerisWeather</p>
          <StatusBadge status={status} />
        </div>
      </div>

      <div className="integration-content">
        <div className="integration-section">
          <h4>Professional Data Sharing</h4>
          <p>
            Already contributing to PWSWeather's professional network? Connect
            your station credentials to simultaneously earn WRF tokens while
            maintaining your commercial-grade data sharing.
          </p>

          {stats && (
            <div className="pws-stats">
              <div className="stat-row">
                <span className="stat-label">Active Stations:</span>
                <span className="stat-value">{stats.stations}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Network Type:</span>
                <span className="stat-value">{stats.commercial}</span>
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
          <h4>Professional Benefits</h4>
          <div className="feature-list">
            <div className="feature">
              <i className="bi bi-briefcase"></i>
              <span>Commercial-grade data quality standards</span>
            </div>
            <div className="feature">
              <i className="bi bi-coin"></i>
              <span>Higher WRF rewards for professional data</span>
            </div>
            <div className="feature">
              <i className="bi bi-globe"></i>
              <span>Global network with AerisWeather integration</span>
            </div>
            <div className="feature">
              <i className="bi bi-shield-check"></i>
              <span>Maintains existing professional relationships</span>
            </div>
          </div>
        </div>

        <div className="integration-requirements">
          <h4>Setup Requirements</h4>
          <div className="requirements-list">
            <div className="requirement">
              <i className="bi bi-check-circle"></i>
              <span>PWSWeather Station ID</span>
            </div>
            <div className="requirement">
              <i className="bi bi-check-circle"></i>
              <span>API Key or Station Password</span>
            </div>
            <div className="requirement">
              <i className="bi bi-check-circle"></i>
              <span>WRF wallet (we'll help create one)</span>
            </div>
          </div>
        </div>

        <InfoBox
          type="info"
          title="Professional Network Integration"
          message="PWSWeather serves commercial and educational markets. Earn WRF tokens while contributing to professional weather forecasting and research."
        />
      </div>
    </div>
  );
};

export default PWSWeatherCard;
