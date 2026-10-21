import React, { useState, useEffect } from 'react';
import StatusBadge from '../common/StatusBadge';
import InfoBox from '../common/InfoBox';

/**
 * Ambient Weather Network Integration Card
 * Popular consumer weather station brand with cloud connectivity
 */
const AmbientWeatherCard = ({ onClick, isActive }) => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    setStats({
      stations: '150,000+',
      coverage: 'North America + Global',
      dataTypes: [
        'Temperature',
        'Humidity',
        'Wind',
        'Rain',
        'UV',
        'Solar Radiation',
      ],
      updateFrequency: '30 seconds',
      earnPotential: '0.2-0.8 WRF/hour',
    });
  }, []);

  const status = 'available';

  return (
    <div
      className={`integration-card ambient-weather ${isActive ? 'active' : ''}`}
      onClick={onClick}
      style={{ borderLeft: '4px solid #28A745' }}
    >
      <div className="integration-header">
        <div
          className="integration-icon"
          style={{ backgroundColor: '#28A745' }}
        >
          <i className="bi bi-cloud-sun"></i>
        </div>
        <div className="integration-info">
          <h3>Ambient Weather</h3>
          <p>Connect your Ambient Weather station for instant WRF rewards</p>
          <StatusBadge status={status} />
        </div>
      </div>

      <div className="integration-content">
        <div className="integration-section">
          <h4>Popular Consumer Weather Stations</h4>
          <p>
            Ambient Weather stations are among the most popular consumer-grade
            weather monitoring systems. Connect your existing station's cloud
            account to start earning WRF tokens immediately with no hardware
            changes.
          </p>

          {stats && (
            <div className="ambient-stats">
              <div className="stat-row">
                <span className="stat-label">Active Stations:</span>
                <span className="stat-value">{stats.stations}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Update Frequency:</span>
                <span className="stat-value">{stats.updateFrequency}</span>
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
          <h4>Supported Stations</h4>
          <div className="feature-list">
            <div className="feature">
              <i className="bi bi-wifi"></i>
              <span>WS-2902, WS-5000, WS-8480 series</span>
            </div>
            <div className="feature">
              <i className="bi bi-speedometer2"></i>
              <span>High-frequency data updates (30 seconds)</span>
            </div>
            <div className="feature">
              <i className="bi bi-sun"></i>
              <span>Full weather metrics including UV and solar</span>
            </div>
            <div className="feature">
              <i className="bi bi-phone"></i>
              <span>Works with existing AmbientWeather.net account</span>
            </div>
          </div>
        </div>

        <div className="integration-requirements">
          <h4>Easy Connection</h4>
          <div className="requirements-list">
            <div className="requirement">
              <i className="bi bi-check-circle"></i>
              <span>AmbientWeather.net account credentials</span>
            </div>
            <div className="requirement">
              <i className="bi bi-check-circle"></i>
              <span>API key from your dashboard</span>
            </div>
            <div className="requirement">
              <i className="bi bi-check-circle"></i>
              <span>Station MAC address</span>
            </div>
          </div>
        </div>

        <InfoBox
          type="success"
          title="Instant Setup"
          message="Most Ambient Weather users can connect in under 2 minutes using their existing account. No additional hardware or software installation required."
        />
      </div>
    </div>
  );
};

export default AmbientWeatherCard;
