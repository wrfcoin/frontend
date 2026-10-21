import React from 'react';

/**
 * MyAcuRite Integration Card
 * For users with existing AcuRite weather stations and MyAcuRite accounts
 */
const MyAcuRiteCard = () => {
  return (
    <div className="integration-card weather-platform-card">
      <div className="card-header">
        <div className="platform-icon myacurite">
          <i className="bi bi-cloud-check"></i>
        </div>
        <div className="platform-info">
          <h3>MyAcuRite</h3>
          <p className="platform-description">Official AcuRite Cloud Service</p>
        </div>
      </div>

      <div className="card-content">
        <div className="compatibility-info">
          <h4>Compatible Devices</h4>
          <ul>
            <li>AcuRite Iris® (5-in-1)</li>
            <li>AcuRite Atlas™</li>
            <li>AcuRite Access™</li>
            <li>All MyAcuRite connected stations</li>
          </ul>
        </div>

        <div className="earning-potential">
          <div className="earning-stat">
            <span className="value">0.1-0.8 WRF</span>
            <span className="label">Per Hour</span>
          </div>
          <div className="earning-stat">
            <span className="value">24/7</span>
            <span className="label">Auto Mining</span>
          </div>
        </div>
      </div>

      <div className="card-footer">
        <div className="setup-info">
          <div className="setup-time">
            <i className="bi bi-clock"></i>
            <span>2 min setup</span>
          </div>
          <div className="user-count">
            <i className="bi bi-people"></i>
            <span>50K+ users</span>
          </div>
        </div>

        <div className="connection-status">
          <div className="status-indicator available">
            <i className="bi bi-check-circle"></i>
            <span>Ready to Connect</span>
          </div>
        </div>
      </div>

      <div className="hover-overlay">
        <div className="connect-prompt">
          <i className="bi bi-link-45deg"></i>
          <span>Click to Connect</span>
        </div>
      </div>
    </div>
  );
};

export default MyAcuRiteCard;
