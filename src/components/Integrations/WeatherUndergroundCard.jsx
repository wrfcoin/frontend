import React, { useState, useEffect } from 'react';
import StatusBadge from '../common/StatusBadge';
import InfoBox from '../common/InfoBox';

/**
 * Weather Underground Integration Card
 * Enables existing Weather Underground users to earn WRF tokens
 * by dual-posting their weather station data to Wrfcoin
 */
const WeatherUndergroundCard = ({ onClick, isActive }) => {
  const [stats, setStats] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('available');

  useEffect(() => {
    // Weather Underground network stats
    setStats({
      stations: '285,000+',
      dailyReports: '50M+',
      coverage: 'Global',
      dataTypes: [
        'Temperature',
        'Humidity',
        'Pressure',
        'Wind',
        'Precipitation',
      ],
      earnPotential: '0.1-0.5 WRF/hour',
    });
  }, []);

  const status = 'available';

  return (
    <div
      className={`integration-card weather-underground ${isActive ? 'active' : ''}`}
      onClick={onClick}
      style={{ borderLeft: '4px solid #FF6B35' }}
    >
      <div className="integration-header">
        <div
          className="integration-icon"
          style={{ backgroundColor: '#FF6B35' }}
        >
          <i className="bi bi-cloud-drizzle"></i>
        </div>
        <div className="integration-info">
          <h3>Weather Underground</h3>
          <p>Connect your existing WU station to earn WRF tokens</p>
          <StatusBadge status={status} />
        </div>
      </div>

      <div className="integration-content">
        <div className="integration-section">
          <h4>Easy Dual-Posting Setup</h4>
          <p>
            Already sharing data with Weather Underground? Connect your station
            credentials to automatically earn WRF tokens while continuing your
            existing data sharing.
          </p>

          {stats && (
            <div className="wu-stats">
              <div className="stat-row">
                <span className="stat-label">Active Stations:</span>
                <span className="stat-value">{stats.stations}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Daily Reports:</span>
                <span className="stat-value">{stats.dailyReports}</span>
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
          <h4>What You Get</h4>
          <div className="feature-list">
            <div className="feature">
              <i className="bi bi-coin"></i>
              <span>Earn WRF tokens for existing data sharing</span>
            </div>
            <div className="feature">
              <i className="bi bi-shield-check"></i>
              <span>
                No interruption to current Weather Underground uploads
              </span>
            </div>
            <div className="feature">
              <i className="bi bi-gear-wide-connected"></i>
              <span>Automatic data synchronization every 5 minutes</span>
            </div>
            <div className="feature">
              <i className="bi bi-graph-up"></i>
              <span>Enhanced reputation scoring across networks</span>
            </div>
          </div>
        </div>

        <div className="integration-requirements">
          <h4>Quick Setup Requirements</h4>
          <div className="requirements-list">
            <div className="requirement">
              <i className="bi bi-check-circle"></i>
              <span>Weather Underground Station ID</span>
            </div>
            <div className="requirement">
              <i className="bi bi-check-circle"></i>
              <span>Station Password/API Key</span>
            </div>
            <div className="requirement">
              <i className="bi bi-check-circle"></i>
              <span>WRF wallet address (we'll help create one)</span>
            </div>
          </div>
        </div>

        <InfoBox
          type="success"
          title="Perfect for Existing Users"
          message="If you're already sharing weather data with Weather Underground, this is the fastest way to start earning WRF tokens with zero additional hardware setup."
        />
      </div>
    </div>
  );
};

export default WeatherUndergroundCard;
