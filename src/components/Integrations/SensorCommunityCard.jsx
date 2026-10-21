import React, { useState } from 'react';
import { WrfButton } from '../DesignSystem';
import './IntegrationCards.css';

/**
 * SensorCommunityCard Component
 *
 * This component displays a card for the Sensor.Community integration with
 * key features, statistics, and connection status.
 */
const SensorCommunityCard = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  // Toggle connection status for demo purposes
  const toggleConnection = e => {
    e.stopPropagation();
    setIsConnected(!isConnected);
  };

  return (
    <div
      className={`integration-card ${isConnected ? 'connected' : ''}`}
      onClick={() => setShowDetails(!showDetails)}
    >
      <div className="card-header">
        <div className="integration-icon">
          <i className="bi bi-cloud-check"></i>
        </div>
        <div className="integration-name">Sensor.Community</div>
        <div className="connection-status">
          <button
            className={`status-indicator ${isConnected ? 'connected' : ''}`}
            onClick={toggleConnection}
          >
            {isConnected ? 'Connected' : 'Disconnected'}
          </button>
        </div>
      </div>

      <div className="integration-stats">
        <div className="stat-item">
          <span className="stat-value">3,412</span>
          <span className="stat-label">Sensors</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">47</span>
          <span className="stat-label">Countries</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">9.2M</span>
          <span className="stat-label">Data Points</span>
        </div>
      </div>

      {showDetails && (
        <div className="integration-details">
          <div className="detail-item">
            <i className="bi bi-thermometer-half"></i>
            <span>Temperature, Humidity, Air Quality</span>
          </div>
          <div className="detail-item">
            <i className="bi bi-globe"></i>
            <span>Global Coverage, Open Standardized Data</span>
          </div>
          <div className="detail-item">
            <i className="bi bi-clock-history"></i>
            <span>Data Retention: Configurable (3-36 months)</span>
          </div>
          <div className="detail-item">
            <i className="bi bi-shield-check"></i>
            <span>Merkle Tree Sensor Data Validation</span>
          </div>
          <div className="detail-controls">
            <WrfButton variant="primary" size="sm">Configure</WrfButton>
            <WrfButton variant="outlined" size="sm">
              View Data
            </WrfButton>
          </div>
        </div>
      )}

      <div className="card-footer">
        <div className="tag">IoT</div>
        <div className="tag">Environmental</div>
        <div className="tag">Crowdsourced</div>
      </div>
    </div>
  );
};

export default SensorCommunityCard;
