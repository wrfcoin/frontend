import React from 'react';
import './IntegrationCard.css';

/**
 * OpenAQCard Component
 *
 * This component displays a card for the OpenAQ integration in the grid view,
 * providing a summary of the air quality data platform's integration with Wrfcoin.
 */
const OpenAQCard = ({ onExpand }) => {
  return (
    <div className="integration-card" onClick={onExpand}>
      <div className="card-header">
        <img
          src="/static/icons/openaq-logo.svg"
          alt="OpenAQ Logo"
          className="integration-logo"
        />
        <h3>OpenAQ Integration</h3>
        <span className="status-badge connected">CONNECTED</span>
      </div>

      <div className="card-content">
        <p>
          Connects to the OpenAQ platform for global air quality data, utilized
          for air quality forecasting and environmental health metrics in
          Wrfcoin.
        </p>

        <div className="stats-container">
          <div className="stat-item">
            <span className="stat-value">143</span>
            <span className="stat-label">Countries</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">12.8K</span>
            <span className="stat-label">Active Monitors</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">24M+</span>
            <span className="stat-label">Daily Records</span>
          </div>
        </div>
      </div>

      <div className="card-footer">
        <button className="view-details-btn" onClick={onExpand}>
          View Details
          <i className="bi bi-arrow-right-circle"></i>
        </button>
      </div>
    </div>
  );
};

export default OpenAQCard;
