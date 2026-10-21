import React, { useState, useEffect } from 'react';
import { WrfButton } from '../../DesignSystem';
import './LangChainCard.css';

const LangChainCard = ({ isSelected, onSelect }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    // Check if LangChain analytics is available
    checkLangChainStatus();
  }, []);

  const checkLangChainStatus = async () => {
    try {
      // Check if our LangChain integration is running
      const response = await fetch('/api/integrations/langchain/status');
      if (response.ok) {
        const data = await response.json();
        setConnectionStatus('connected');
        setIsEnabled(data.enabled);
        setAnalyticsData(data.analytics);
      }
    } catch (error) {
      setConnectionStatus('available');
    }
  };

  const handleToggle = async () => {
    if (!isEnabled) {
      setConnectionStatus('connecting');
      // In a real implementation, this would start the LangChain analytics service
      setTimeout(() => {
        setIsEnabled(true);
        setConnectionStatus('connected');
      }, 2000);
    } else {
      setIsEnabled(false);
      setConnectionStatus('available');
    }
  };

  return (
    <div
      className={`integration-card langchain-card ${isSelected ? 'selected' : ''} ${isEnabled ? 'enabled' : ''}`}
      onClick={onSelect}
    >
      <div className="card-header">
        <div className="icon-wrapper">
          <i className="bi bi-robot"></i>
        </div>
        <div className="header-content">
          <h3>LangChain Analytics</h3>
          <span className={`status-badge ${connectionStatus}`}>
            {connectionStatus === 'connected' && '● Connected'}
            {connectionStatus === 'connecting' && '◐ Connecting'}
            {connectionStatus === 'available' && '○ Available'}
            {connectionStatus === 'disconnected' && '○ Optional'}
          </span>
        </div>
        <div className="card-actions">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={handleToggle}
              onClick={e => e.stopPropagation()}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      <div className="card-content">
        <p className="description">
          External AI-powered analytics for environmental data patterns,
          governance insights, and network optimization recommendations.
        </p>

        <div className="features-list">
          <div className="feature-item">
            <i className="bi bi-graph-up"></i>
            <span>Environmental Trend Analysis</span>
          </div>
          <div className="feature-item">
            <i className="bi bi-shield-check"></i>
            <span>Read-Only External Processing</span>
          </div>
          <div className="feature-item">
            <i className="bi bi-lightbulb"></i>
            <span>Governance Recommendations</span>
          </div>
          <div className="feature-item">
            <i className="bi bi-diagram-3"></i>
            <span>Cross-Chain Pattern Recognition</span>
          </div>
        </div>

        {isEnabled && analyticsData && (
          <div className="analytics-preview">
            <h4>Recent Insights</h4>
            <div className="insight-items">
              <div className="insight">
                <span className="insight-type">Network Health</span>
                <span className="insight-value">
                  {analyticsData.networkHealth || 'Analyzing...'}
                </span>
              </div>
              <div className="insight">
                <span className="insight-type">Recommendations</span>
                <span className="insight-value">
                  {analyticsData.recommendations || '0'} Generated
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="integration-info">
          <div className="info-item">
            <span className="label">Independence:</span>
            <span className="value">Complete - No blockchain dependencies</span>
          </div>
          <div className="info-item">
            <span className="label">Access:</span>
            <span className="value">Read-only API connections</span>
          </div>
          <div className="info-item">
            <span className="label">Processing:</span>
            <span className="value">External advisory insights only</span>
          </div>
        </div>
      </div>

      {isSelected && (
        <div className="card-footer">
          <WrfButton
            variant="primary"
            onClick={e => {
              e.stopPropagation();
              // Open detailed configuration
            }}
          >
            Configure Analytics
          </WrfButton>
          <WrfButton
            variant="secondary"
            onClick={e => {
              e.stopPropagation();
              // View documentation
            }}
          >
            View Documentation
          </WrfButton>
        </div>
      )}
    </div>
  );
};

export default LangChainCard;
