import React, { useState, useEffect } from 'react';
import { WrfBadge, WrfButton } from '../../DesignSystem';
import './LangChainIntegrationDetails.css';
import { devLog } from '../../../utils/logger';

const LangChainIntegrationDetails = ({ selectedIntegration }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    if (selectedIntegration === 'langchain') {
      fetchAnalyticsData();
    }
  }, [selectedIntegration]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      // Check for real-time analytics from the platform
      const response = await fetch('/api/blockchain/status');
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
        generateInsights(data);
      }
    } catch (error) {
      devLog(
        'Analytics data will be generated when LangChain service starts',
      );
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = data => {
    const newInsights = [];

    if (data.recentBlocks && data.recentBlocks.length > 0) {
      const avgTransactions =
        data.recentBlocks.reduce(
          (sum, block) => sum + (block.transactions || 0),
          0,
        ) / data.recentBlocks.length;

      newInsights.push({
        type: 'Network Activity',
        value: `${avgTransactions.toFixed(1)} avg transactions/block`,
        trend:
          avgTransactions > 20
            ? 'high'
            : avgTransactions > 10
              ? 'medium'
              : 'low',
        recommendation:
          avgTransactions < 10
            ? 'Consider promoting data collection incentives'
            : 'Network activity is healthy',
      });
    }

    if (data.height) {
      newInsights.push({
        type: 'Blockchain Health',
        value: `Block ${data.height}`,
        trend: 'healthy',
        recommendation: 'Blockchain is actively producing blocks',
      });
    }

    setInsights(newInsights);
  };

  const handleEnableAnalytics = async () => {
    setIsEnabled(true);
    setLoading(true);

    // Simulate starting the analytics service
    setTimeout(() => {
      setLoading(false);
      fetchAnalyticsData();
    }, 2000);
  };

  if (selectedIntegration !== 'langchain') {
    return null;
  }

  return (
    <div className="langchain-integration-details">
      <div className="integration-header">
        <div className="header-icon">
          <i className="bi bi-robot"></i>
        </div>
        <div className="header-content">
          <h2>LangChain Environmental Analytics</h2>
          <p>
            External AI-powered insights for your environmental monitoring
            platform
          </p>
          <div className="integration-badges">
            <WrfBadge label="External Processing" status="info" />
            <WrfBadge label="Read-Only Access" status="active" />
            <WrfBadge label="Optional Enhancement" status="neutral" />
          </div>
        </div>
      </div>

      <div className="integration-content">
        <div className="section">
          <h3>Key Features</h3>
          <div className="features-grid">
            <div className="feature-card">
              <i className="bi bi-graph-up"></i>
              <h4>Environmental Trend Analysis</h4>
              <p>
                AI-powered pattern recognition in weather station data and
                environmental trends
              </p>
            </div>
            <div className="feature-card">
              <i className="bi bi-lightbulb"></i>
              <h4>Governance Insights</h4>
              <p>
                Generate recommendations for DAO proposals and network
                governance decisions
              </p>
            </div>
            <div className="feature-card">
              <i className="bi bi-diagram-3"></i>
              <h4>Cross-Chain Analytics</h4>
              <p>
                Analyze cross-chain bridge performance and optimize token
                transfer strategies
              </p>
            </div>
            <div className="feature-card">
              <i className="bi bi-shield-check"></i>
              <h4>Independence Guarantee</h4>
              <p>
                Zero blockchain dependencies - platform remains fully functional
                if disabled
              </p>
            </div>
          </div>
        </div>

        <div className="section">
          <h3>Architecture & Security</h3>
          <div className="architecture-info">
            <div className="arch-item">
              <span className="label">Data Access:</span>
              <span className="value">
                Read-only API connections to platform services
              </span>
            </div>
            <div className="arch-item">
              <span className="label">Processing:</span>
              <span className="value">
                External computation with no blockchain write access
              </span>
            </div>
            <div className="arch-item">
              <span className="label">Storage:</span>
              <span className="value">
                Advisory insights stored externally, not on-chain
              </span>
            </div>
            <div className="arch-item">
              <span className="label">Impact:</span>
              <span className="value">
                Zero disruption to core platform functionality
              </span>
            </div>
          </div>
        </div>

        {isEnabled ? (
          <div className="section">
            <h3>Current Analytics</h3>
            {loading ? (
              <div className="loading-state">
                <i className="bi bi-arrow-clockwise spinning"></i>
                <span>Analyzing platform data...</span>
              </div>
            ) : (
              <div className="analytics-dashboard">
                {insights.length > 0 ? (
                  <div className="insights-grid">
                    {insights.map((insight, index) => (
                      <div
                        key={index}
                        className={`insight-card ${insight.trend}`}
                      >
                        <div className="insight-header">
                          <span className="insight-type">{insight.type}</span>
                          <span className={`trend-indicator ${insight.trend}`}>
                            {insight.trend === 'high' && '📈'}
                            {insight.trend === 'medium' && '📊'}
                            {insight.trend === 'low' && '📉'}
                            {insight.trend === 'healthy' && '✅'}
                          </span>
                        </div>
                        <div className="insight-value">{insight.value}</div>
                        <div className="insight-recommendation">
                          {insight.recommendation}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-data">
                    <i className="bi bi-graph-up"></i>
                    <p>
                      Analytics will appear here once data collection begins
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="section">
            <h3>Enable Analytics</h3>
            <div className="enable-section">
              <div className="enable-info">
                <h4>Start AI-Powered Environmental Analytics</h4>
                <p>
                  Enable LangChain analytics to get intelligent insights about
                  your environmental monitoring network, governance
                  recommendations, and cross-chain optimization suggestions.
                </p>
                <ul>
                  <li>Real-time weather pattern analysis</li>
                  <li>Network health monitoring</li>
                  <li>Cross-chain performance optimization</li>
                  <li>Governance decision support</li>
                </ul>
              </div>
              <WrfButton
                variant="primary"
                onClick={handleEnableAnalytics}
                disabled={loading}
                loading={loading}
              >
                {loading ? (
                  <>
                    <i className="bi bi-arrow-clockwise spinning"></i>
                    Initializing...
                  </>
                ) : (
                  <>
                    <i className="bi bi-play-circle"></i>
                    Enable Analytics
                  </>
                )}
              </WrfButton>
            </div>
          </div>
        )}

        <div className="section">
          <h3>Integration Status</h3>
          <div className="status-grid">
            <div className="status-item">
              <span className="status-label">Platform APIs</span>
              <span className="status-value connected">Connected</span>
            </div>
            <div className="status-item">
              <span className="status-label">Analytics Engine</span>
              <span
                className={`status-value ${isEnabled ? 'connected' : 'available'}`}
              >
                {isEnabled ? 'Active' : 'Available'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Data Processing</span>
              <span className="status-value external">External</span>
            </div>
            <div className="status-item">
              <span className="status-label">Platform Impact</span>
              <span className="status-value safe">None</span>
            </div>
          </div>
        </div>

        <div className="section">
          <h3>Documentation & Support</h3>
          <div className="docs-links">
            <a href="/docs/integrations/langchain" className="doc-link">
              <i className="bi bi-book"></i>
              Integration Guide
            </a>
            <a href="/docs/api/analytics" className="doc-link">
              <i className="bi bi-code-slash"></i>
              API Reference
            </a>
            <a href="/docs/security/external-integrations" className="doc-link">
              <i className="bi bi-shield-check"></i>
              Security Model
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LangChainIntegrationDetails;
