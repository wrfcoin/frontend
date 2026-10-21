import React, { useState, useEffect } from 'react';
import StatusBadge from '../common/StatusBadge';
import InfoBox from '../common/InfoBox';

/**
 * WeatherBug / Earth Networks Integration Card
 * Educational and commercial weather monitoring network
 */
const WeatherBugCard = ({ onClick, isActive }) => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    setStats({
      stations: '20,000+',
      schools: '8,000+',
      coverage: 'US + International',
      dataTypes: [
        'Temperature',
        'Humidity',
        'Wind',
        'Lightning',
        'Air Quality',
      ],
      earnPotential: '0.25-1.0 WRF/hour',
    });
  }, []);

  const status = 'available';

  return (
    <div
      className={`integration-card weatherbug ${isActive ? 'active' : ''}`}
      onClick={onClick}
      style={{ borderLeft: '4px solid #FF8C00' }}
    >
      <div className="integration-header">
        <div
          className="integration-icon"
          style={{ backgroundColor: '#FF8C00' }}
        >
          <i className="bi bi-bug"></i>
        </div>
        <div className="integration-info">
          <h3>WeatherBug</h3>
          <p>Earth Networks professional weather monitoring</p>
          <StatusBadge status={status} />
        </div>
      </div>

      <div className="integration-content">
        <div className="integration-section">
          <h4>Educational & Commercial Network</h4>
          <p>
            WeatherBug operates one of the largest networks of
            professional-grade weather stations in schools, businesses, and
            government facilities. Connect your institutional station to earn
            WRF tokens while maintaining professional data sharing.
          </p>

          {stats && (
            <div className="weatherbug-stats">
              <div className="stat-row">
                <span className="stat-label">Active Stations:</span>
                <span className="stat-value">{stats.stations}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">School Network:</span>
                <span className="stat-value">{stats.schools}</span>
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
          <h4>Professional Features</h4>
          <div className="feature-list">
            <div className="feature">
              <i className="bi bi-mortarboard"></i>
              <span>Educational institution partnerships</span>
            </div>
            <div className="feature">
              <i className="bi bi-lightning"></i>
              <span>Lightning detection and severe weather alerts</span>
            </div>
            <div className="feature">
              <i className="bi bi-shield-check"></i>
              <span>Commercial-grade data quality standards</span>
            </div>
            <div className="feature">
              <i className="bi bi-building"></i>
              <span>Enterprise weather monitoring solutions</span>
            </div>
          </div>
        </div>

        <div className="integration-requirements">
          <h4>Connection Requirements</h4>
          <div className="requirements-list">
            <div className="requirement">
              <i className="bi bi-check-circle"></i>
              <span>WeatherBug station ID or account access</span>
            </div>
            <div className="requirement">
              <i className="bi bi-check-circle"></i>
              <span>Institution authorization (if applicable)</span>
            </div>
            <div className="requirement">
              <i className="bi bi-check-circle"></i>
              <span>API credentials from Earth Networks</span>
            </div>
          </div>
        </div>

        <InfoBox
          type="info"
          title="Institutional Support"
          message="Perfect for schools, universities, and businesses already using WeatherBug stations. Earn rewards while maintaining professional weather monitoring standards."
        />
      </div>
    </div>
  );
};

export default WeatherBugCard;
