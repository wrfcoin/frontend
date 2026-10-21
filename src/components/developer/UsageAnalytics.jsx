/**
 * Usage Analytics Component
 * Displays comprehensive API usage analytics and metrics
 */

import React, { useState, useEffect } from 'react';
import { WrfButton } from '../DesignSystem';
import './UsageAnalytics.css';

const UsageAnalytics = ({ userId }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedApiKey, setSelectedApiKey] = useState('all');

  useEffect(() => {
    loadAnalytics();
  }, [userId, selectedPeriod, selectedApiKey]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/developer/usage-analytics', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('apiKey')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data.data);
      } else {
        console.error('Failed to load analytics');
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = num => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num?.toString() || '0';
  };

  const formatPercentage = num => {
    return `${(num || 0).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="usage-analytics loading">
        <div className="loading-spinner">Loading analytics...</div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="usage-analytics error">
        <div className="error-message">
          <h4>Unable to Load Analytics</h4>
          <p>
            There was an error loading your usage analytics. Please try again
            later.
          </p>
          <WrfButton variant="primary" onClick={loadAnalytics}>
            Retry
          </WrfButton>
        </div>
      </div>
    );
  }

  const { overview, apiKeys } = analyticsData;

  return (
    <div className="usage-analytics">
      {/* Controls */}
      <div className="analytics-controls">
        <div className="control-group">
          <label>Time Period:</label>
          <select
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)}
          >
            <option value="day">Last 24 Hours</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last Year</option>
          </select>
        </div>

        <div className="control-group">
          <label>API Key:</label>
          <select
            value={selectedApiKey}
            onChange={e => setSelectedApiKey(e.target.value)}
          >
            <option value="all">All API Keys</option>
            {apiKeys.map(key => (
              <option key={key.id} value={key.id}>
                {key.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="metrics-overview">
        <div className="metric-card">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <h3>{formatNumber(overview.totalRequests)}</h3>
            <p>Total Requests</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📈</div>
          <div className="metric-content">
            <h3>{formatNumber(overview.requestsToday)}</h3>
            <p>Requests Today</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🔑</div>
          <div className="metric-content">
            <h3>{overview.activeApiKeys}</h3>
            <p>Active API Keys</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">⚡</div>
          <div className="metric-content">
            <h3>{overview.averageResponseTime}ms</h3>
            <p>Avg Response Time</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">⚠️</div>
          <div className="metric-content">
            <h3>{formatPercentage(overview.errorRate)}</h3>
            <p>Error Rate</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📅</div>
          <div className="metric-content">
            <h3>{formatNumber(overview.requestsThisMonth)}</h3>
            <p>This Month</p>
          </div>
        </div>
      </div>

      {/* API Key Breakdown */}
      <div className="api-key-breakdown">
        <h3>API Key Performance</h3>
        <div className="breakdown-table">
          <div className="table-header">
            <div className="col-name">API Key</div>
            <div className="col-requests">Total Requests</div>
            <div className="col-today">Today</div>
            <div className="col-month">This Month</div>
            <div className="col-response">Avg Response</div>
            <div className="col-errors">Error Rate</div>
            <div className="col-last-used">Last Used</div>
          </div>

          {apiKeys.map(key => (
            <div key={key.id} className="table-row">
              <div className="col-name">
                <div className="key-name">{key.name}</div>
                <div className="key-id">{key.id.substring(0, 8)}...</div>
              </div>
              <div className="col-requests">
                {formatNumber(key.stats.totalRequests)}
              </div>
              <div className="col-today">
                {formatNumber(key.stats.requestsToday)}
              </div>
              <div className="col-month">
                {formatNumber(key.stats.requestsThisMonth)}
              </div>
              <div className="col-response">
                {Math.round(key.stats.averageResponseTime || 0)}ms
              </div>
              <div className="col-errors">
                <span
                  className={`error-rate ${key.stats.errorRate > 5 ? 'high' : key.stats.errorRate > 1 ? 'medium' : 'low'}`}
                >
                  {formatPercentage(key.stats.errorRate)}
                </span>
              </div>
              <div className="col-last-used">
                {key.stats.lastUsed
                  ? new Date(key.stats.lastUsed).toLocaleDateString()
                  : 'Never'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* frontend#328: the former "Request Volume Over Time" chart was 30
          Math.random() bars. No usage-history route is mounted on the
          testnet API (marketplace-routes /usage is unmounted), so say so. */}
      <div className="usage-chart" data-testid="usage-volume-not-live">
        <h3>Request Volume Over Time</h3>
        <p className="chart-placeholder">
          Request volume history is not available yet — no usage-history route is served by the testnet
          API, so no chart is drawn in its place.
        </p>
      </div>

      {/* frontend#328: the former "Top Endpoints" list was a hard-coded array
          (/api/blockchain/status 8,330 requests, …). Same source gap as the
          chart above — no usage-history route is mounted. */}
      <div className="top-endpoints" data-testid="usage-endpoints-not-live">
        <h3>Top Endpoints</h3>
        <p className="chart-placeholder">
          Per-endpoint request counts are not available yet for the same reason.
        </p>
      </div>

      {/* frontend#343: the former "Response Status Distribution" was four
          hard-coded percentages (94.2 / 2.1 / 3.2 / 0.5). Same source gap. */}
      <div className="status-codes" data-testid="usage-status-not-live">
        <h3>Response Status Distribution</h3>
        <p className="chart-placeholder">
          Status-code breakdown is not available yet for the same reason.
        </p>
      </div>


    </div>
  );
};

export default UsageAnalytics;
