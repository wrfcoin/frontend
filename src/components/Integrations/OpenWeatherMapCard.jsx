import React, { useState, useEffect } from 'react';
import StatusBadge from '../common/StatusBadge';
import InfoBox from '../common/InfoBox';

/**
 * OpenWeatherMap Integration Card
 * Widely used global weather API and data network
 */
const OpenWeatherMapCard = ({ onClick, isActive }) => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // OpenWeatherMap network stats
    setStats({
      stations: '40,000+',
      coverage: 'Global API Network',
      dataTypes: ['Temperature', 'Humidity', 'Pressure', 'Wind', 'Visibility'],
      apiCalls: '1.5B+ daily',
      earnPotential: '0.2-0.9 WRF/hour',
    });
  }, []);

  const status = 'available';

  return (
    <div
      className={`integration-card openweathermap ${isActive ? 'active' : ''}`}
      onClick={onClick}
      style={{ borderLeft: '4px solid #EB6E4B' }}
    >
      <div className="integration-header">
        <div
          className="integration-icon"
          style={{ backgroundColor: '#EB6E4B' }}
        >
          <i className="bi bi-cloud-sun"></i>
        </div>
        <div className="integration-info">
          <h3>OpenWeatherMap</h3>
          <p>Global weather API with extensive data sources</p>
          <StatusBadge status={status} />
        </div>
      </div>

      <div className="integration-content">
        <div className="integration-section">
          <h4>API-First Weather Data</h4>
          <p>
            Contributing data to OpenWeatherMap's global API network? Set up
            dual-posting to earn WRF tokens while maintaining your contribution
            to one of the world's most used weather APIs.
          </p>

          {stats && (
            <div className="owm-stats">
              <div className="stat-row">
                <span className="stat-label">Data Sources:</span>
                <span className="stat-value">{stats.stations}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Daily API Calls:</span>
                <span className="stat-value">{stats.apiCalls}</span>
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
          <h4>API Integration Benefits</h4>
          <div className="feature-list">
            <div className="feature">
              <i className="bi bi-globe"></i>
              <span>Global reach with 1.5B+ daily API calls</span>
            </div>
            <div className="feature">
              <i className="bi bi-code-slash"></i>
              <span>API-first approach with developer tools</span>
            </div>
            <div className="feature">
              <i className="bi bi-coin"></i>
              <span>Earn WRF while contributing to global weather data</span>
            </div>
            <div className="feature">
              <i className="bi bi-lightning"></i>
              <span>Real-time data synchronization</span>
            </div>
          </div>
        </div>

        <div className="integration-requirements">
          <h4>Setup Requirements</h4>
          <div className="requirements-list">
            <div className="requirement">
              <i className="bi bi-check-circle"></i>
              <span>OpenWeatherMap API Key</span>
            </div>
            <div className="requirement">
              <i className="bi bi-check-circle"></i>
              <span>Station Registration Details</span>
            </div>
            <div className="requirement">
              <i className="bi bi-check-circle"></i>
              <span>WRF wallet address</span>
            </div>
          </div>
        </div>

        <InfoBox
          type="success"
          title="Developer-Friendly Integration"
          message="OpenWeatherMap's API-first approach makes it easy to set up automated dual-posting to earn WRF tokens alongside your existing weather data contributions."
        />
      </div>
    </div>
  );
};

export default OpenWeatherMapCard;
