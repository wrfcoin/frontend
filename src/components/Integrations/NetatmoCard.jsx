import React, { useState, useEffect } from 'react';
import StatusBadge from '../common/StatusBadge';
import InfoBox from '../common/InfoBox';

/**
 * Netatmo Weather Network Integration Card
 * Consumer-grade smart weather stations with robust API access
 */
const NetatmoCard = ({ onClick, isActive }) => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Netatmo network stats
    setStats({
      stations: '100,000+',
      coverage: 'Smart Home Network',
      dataTypes: ['Temperature', 'Humidity', 'CO2', 'Noise', 'Pressure'],
      smartFeatures: 'Mobile App + API',
      earnPotential: '0.15-0.7 WRF/hour',
    });
  }, []);

  const status = 'available';

  return (
    <div
      className={`integration-card netatmo ${isActive ? 'active' : ''}`}
      onClick={onClick}
      style={{ borderLeft: '4px solid #7209B7' }}
    >
      <div className="integration-header">
        <div
          className="integration-icon"
          style={{ backgroundColor: '#7209B7' }}
        >
          <i className="bi bi-house"></i>
        </div>
        <div className="integration-info">
          <h3>Netatmo Weather</h3>
          <p>Smart home weather stations with mobile app</p>
          <StatusBadge status={status} />
        </div>
      </div>

      <div className="integration-content">
        <div className="integration-section">
          <h4>Smart Home Weather Data</h4>
          <p>
            Own a Netatmo weather station? Connect your smart home weather data
            to earn WRF tokens while continuing to monitor your environment
            through the Netatmo mobile app and web platform.
          </p>

          {stats && (
            <div className="netatmo-stats">
              <div className="stat-row">
                <span className="stat-label">Smart Stations:</span>
                <span className="stat-value">{stats.stations}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Features:</span>
                <span className="stat-value">{stats.smartFeatures}</span>
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
          <h4>Smart Home Benefits</h4>
          <div className="feature-list">
            <div className="feature">
              <i className="bi bi-phone"></i>
              <span>Seamless mobile app integration</span>
            </div>
            <div className="feature">
              <i className="bi bi-cpu"></i>
              <span>Smart sensor data including CO2 and noise</span>
            </div>
            <div className="feature">
              <i className="bi bi-coin"></i>
              <span>Monetize your smart home weather data</span>
            </div>
            <div className="feature">
              <i className="bi bi-cloud-upload"></i>
              <span>Automatic cloud synchronization</span>
            </div>
          </div>
        </div>

        <div className="integration-requirements">
          <h4>Setup Requirements</h4>
          <div className="requirements-list">
            <div className="requirement">
              <i className="bi bi-check-circle"></i>
              <span>Netatmo Developer Account</span>
            </div>
            <div className="requirement">
              <i className="bi bi-check-circle"></i>
              <span>Weather Station MAC Address</span>
            </div>
            <div className="requirement">
              <i className="bi bi-check-circle"></i>
              <span>API Access Token</span>
            </div>
            <div className="requirement">
              <i className="bi bi-check-circle"></i>
              <span>WRF wallet setup</span>
            </div>
          </div>
        </div>

        <InfoBox
          type="success"
          title="Smart Home Integration"
          message="Netatmo's robust API makes it easy to earn WRF tokens from your smart home weather data while maintaining full access to mobile apps and smart home features."
        />
      </div>
    </div>
  );
};

export default NetatmoCard;
