import React, { useState, useEffect } from 'react';
import StatusBadge from '../common/StatusBadge';
import InfoBox from '../common/InfoBox';

/**
 * Ecowitt / Fine Offset Integration Card
 * Popular weather station brand with global footprint
 */
const EcowittCard = ({ onClick, isActive }) => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Ecowitt network stats
    setStats({
      stations: '200,000+',
      coverage: 'Global Consumer Market',
      dataTypes: ['Temperature', 'Humidity', 'Wind', 'Rain', 'UV', 'PM2.5'],
      brands: 'Ecowitt, Fine Offset, Froggit',
      earnPotential: '0.1-0.6 WRF/hour',
    });
  }, []);

  const status = 'available';

  return (
    <div
      className={`integration-card ecowitt ${isActive ? 'active' : ''}`}
      onClick={onClick}
      style={{ borderLeft: '4px solid #06D6A0' }}
    >
      <div className="integration-header">
        <div
          className="integration-icon"
          style={{ backgroundColor: '#06D6A0' }}
        >
          <i className="bi bi-thermometer-sun"></i>
        </div>
        <div className="integration-info">
          <h3>Ecowitt / Fine Offset</h3>
          <p>Popular consumer weather station brands</p>
          <StatusBadge status={status} />
        </div>
      </div>

      <div className="integration-content">
        <div className="integration-section">
          <h4>Popular Weather Station Brands</h4>
          <p>
            Own an Ecowitt, Fine Offset, or compatible weather station? Connect
            your station to earn WRF tokens while maintaining access to your
            existing weather monitoring apps and third-party integrations.
          </p>

          {stats && (
            <div className="ecowitt-stats">
              <div className="stat-row">
                <span className="stat-label">Global Stations:</span>
                <span className="stat-value">{stats.stations}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Compatible Brands:</span>
                <span className="stat-value">{stats.brands}</span>
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
          <h4>Multi-Brand Compatibility</h4>
          <div className="feature-list">
            <div className="feature">
              <i className="bi bi-gear-wide-connected"></i>
              <span>Works with Ecowitt, Fine Offset, Froggit stations</span>
            </div>
            <div className="feature">
              <i className="bi bi-cloud"></i>
              <span>Supports WS View, Ecowitt.net integration</span>
            </div>
            <div className="feature">
              <i className="bi bi-coin"></i>
              <span>Earn from existing weather station investment</span>
            </div>
            <div className="feature">
              <i className="bi bi-wifi"></i>
              <span>WiFi and cellular connectivity options</span>
            </div>
          </div>
        </div>

        <div className="integration-requirements">
          <h4>Setup Requirements</h4>
          <div className="requirements-list">
            <div className="requirement">
              <i className="bi bi-check-circle"></i>
              <span>Station MAC Address or ID</span>
            </div>
            <div className="requirement">
              <i className="bi bi-check-circle"></i>
              <span>Ecowitt.net or WS View account</span>
            </div>
            <div className="requirement">
              <i className="bi bi-check-circle"></i>
              <span>WiFi or cellular connection</span>
            </div>
            <div className="requirement">
              <i className="bi bi-check-circle"></i>
              <span>WRF wallet address</span>
            </div>
          </div>
        </div>

        <InfoBox
          type="info"
          title="Popular Brand Support"
          message="Ecowitt and Fine Offset stations are among the most popular consumer weather stations globally. Start earning from your existing hardware investment."
        />
      </div>
    </div>
  );
};

export default EcowittCard;
