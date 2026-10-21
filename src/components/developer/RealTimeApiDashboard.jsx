import DemoSurfaceGate from '../common/DemoSurfaceGate';
/**
 * Real-Time API Status Dashboard Component
 * Extends existing UsageAnalytics with real-time monitoring capabilities
 */

import React, { useState, useEffect, useRef } from 'react';
import { getWebSocketClient } from '../../services/websocketService';
import './RealTimeApiDashboard.css';
import { devLog } from '../../utils/logger';

const RealTimeApiDashboardSample = ({ userId }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [historicalData, setHistoricalData] = useState([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  const [selectedMetric, setSelectedMetric] = useState('requests');

  const metricsHistoryRef = useRef([]);
  const maxHistoryPoints = 60; // Keep last 60 data points for charts

  useEffect(() => {
    // Use global WebSocket service for API monitoring
    const wsClient = getWebSocketClient();
    wsClient.subscribe('api-monitoring');

    const handleConnected = () => {
      setIsConnected(true);
      setConnectionError(null);
    };

    const handleMessage = (data) => {
      handleWebSocketMessage(data);
    };

    const handleError = () => {
      setConnectionError('Failed to connect to real-time monitoring');
    };

    const unsubConnected = wsClient.on('connected', handleConnected);
    const unsubMessage = wsClient.on('message', handleMessage);
    const unsubError = wsClient.on('error', handleError);
    wsClient.connect();

    // Set initial connection status
    if (wsClient.status === 'connected') {
      setIsConnected(true);
    }

    loadHistoricalData();

    return () => {
      [unsubConnected, unsubMessage, unsubError].forEach(unsub => {
        if (typeof unsub === 'function') unsub();
      });
    };
  }, []);

  const handleWebSocketMessage = message => {
    if (message.channel !== 'api-monitoring') return;

    switch (message.event) {
    case 'REAL_TIME_METRICS':
      setRealTimeMetrics(message.data.metrics);
      updateMetricsHistory(message.data.metrics);
      break;

    case 'HEALTH_STATUS_UPDATE':
      setHealthStatus(message.data.health);
      break;

    case 'API_ALERT':
      addAlert(message.data.alert);
      break;

    case 'AGGREGATED_METRICS_UPDATE':
      // Handle aggregated metrics if needed
      break;

    default:
      devLog('📊 Received API monitoring message:', message.event);
    }
  };

  const updateMetricsHistory = metrics => {
    if (!metrics || !metrics.timestamp) return;

    const historyPoint = {
      timestamp: metrics.timestamp,
      requests: metrics.current?.requestsPerMinute || 0,
      responseTime: metrics.current?.averageResponseTime || 0,
      errorRate: metrics.current?.errorRate || 0,
      activeEndpoints: metrics.current?.activeEndpoints || 0,
    };

    metricsHistoryRef.current.push(historyPoint);

    // Keep only the last N points
    if (metricsHistoryRef.current.length > maxHistoryPoints) {
      metricsHistoryRef.current =
        metricsHistoryRef.current.slice(-maxHistoryPoints);
    }

    setHistoricalData([...metricsHistoryRef.current]);
  };

  const addAlert = alert => {
    const alertWithId = {
      ...alert,
      id: Date.now() + Math.random(),
      timestamp: alert.timestamp || Date.now(),
    };

    setAlerts(prev => [alertWithId, ...prev.slice(0, 9)]); // Keep last 10 alerts

    // Auto-remove alert after 30 seconds for non-critical alerts
    if (alert.severity !== 'critical') {
      setTimeout(() => {
        setAlerts(prev => prev.filter(a => a.id !== alertWithId.id));
      }, 30000);
    }
  };

  const loadHistoricalData = async () => {
    try {
      const response = await fetch(
        '/api/metrics/historical?granularity=minute',
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('apiKey')}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.timeSeries) {
          setHistoricalData(data.data.timeSeries.slice(-maxHistoryPoints));
        }
      }
    } catch (error) {
      console.error('Error loading historical data:', error);
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

  const formatUptime = milliseconds => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getHealthStatusColor = status => {
    switch (status) {
    case 'healthy':
      return '#10B981';
    case 'degraded':
      return '#F59E0B';
    case 'unhealthy':
      return '#EF4444';
    default:
      return '#6B7280';
    }
  };

  const getAlertSeverityColor = severity => {
    switch (severity) {
    case 'critical':
      return '#DC2626';
    case 'high':
      return '#EA580C';
    case 'medium':
      return '#D97706';
    case 'low':
      return '#059669';
    default:
      return '#6B7280';
    }
  };

  const renderChart = () => {
    if (!historicalData.length) return null;

    const maxValue = Math.max(
      ...historicalData.map(d => d[selectedMetric] || 0),
    );
    const chartHeight = 100;

    return (
      <div className="chart-container">
        <svg width="100%" height={chartHeight + 40} className="metrics-chart">
          {historicalData.map((point, index) => {
            const x = (index / (historicalData.length - 1)) * 100;
            const y =
              chartHeight -
              ((point[selectedMetric] || 0) / maxValue) * chartHeight;

            return (
              <circle
                key={index}
                cx={`${x}%`}
                cy={y + 20}
                r="2"
                fill="#3B82F6"
                className="chart-point"
              />
            );
          })}

          {/* Connect points with lines */}
          <polyline
            points={historicalData
              .map((point, index) => {
                const x = (index / (historicalData.length - 1)) * 100;
                const y =
                  chartHeight -
                  ((point[selectedMetric] || 0) / maxValue) * chartHeight;
                return `${x}%,${y + 20}`;
              })
              .join(' ')}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
            className="chart-line"
          />

          {/* Y-axis labels */}
          <text x="5" y="25" className="chart-label">
            {formatNumber(maxValue)}
          </text>
          <text x="5" y={chartHeight + 15} className="chart-label">
            0
          </text>
        </svg>
      </div>
    );
  };

  if (!isConnected && !connectionError) {
    return (
      <div className="realtime-dashboard loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Connecting to real-time monitoring...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="realtime-dashboard">
      {/* Connection Status */}
      <div
        className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}
      >
        <div className="status-indicator">
          <span
            className={`status-dot ${isConnected ? 'online' : 'offline'}`}
          ></span>
          {isConnected ? 'Real-time monitoring active' : 'Disconnected'}
        </div>
        {connectionError && (
          <div className="connection-error">{connectionError}</div>
        )}
      </div>

      {/* Health Status Overview */}
      {healthStatus && (
        <div className="health-overview">
          <div className="health-card">
            <div
              className="health-status"
              style={{ color: getHealthStatusColor(healthStatus.status) }}
            >
              <h3>API Health</h3>
              <div
                className="status-badge"
                style={{
                  backgroundColor: getHealthStatusColor(healthStatus.status),
                }}
              >
                {healthStatus.status.toUpperCase()}
              </div>
            </div>
            <div className="health-metrics">
              <div className="metric">
                <label>Uptime</label>
                <value>{formatUptime(healthStatus.uptime)}</value>
              </div>
              <div className="metric">
                <label>P95 Response Time</label>
                <value>{healthStatus.responseTimeP95}ms</value>
              </div>
              <div className="metric">
                <label>Error Rate</label>
                <value>{healthStatus.errorRateThreshold.toFixed(1)}%</value>
              </div>
              <div className="metric">
                <label>Memory Usage</label>
                <value>
                  {formatNumber(healthStatus.memoryUsage?.heapUsed || 0)}B
                </value>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Metrics Cards */}
      {realTimeMetrics && (
        <div className="metrics-grid">
          <div className="metric-card">
            <h4>Requests/Min</h4>
            <div className="metric-value">
              {formatNumber(realTimeMetrics.current?.requestsPerMinute || 0)}
            </div>
            <div
              className={`metric-trend ${realTimeMetrics.trend?.requestsGrowth >= 0 ? 'positive' : 'negative'}`}
            >
              {realTimeMetrics.trend?.requestsGrowth >= 0 ? '↗' : '↘'}{' '}
              {Math.abs(realTimeMetrics.trend?.requestsGrowth || 0).toFixed(1)}%
            </div>
          </div>

          <div className="metric-card">
            <h4>Avg Response Time</h4>
            <div className="metric-value">
              {(realTimeMetrics.current?.averageResponseTime || 0).toFixed(0)}ms
            </div>
            <div
              className={`metric-trend ${realTimeMetrics.trend?.responseTimeGrowth <= 0 ? 'positive' : 'negative'}`}
            >
              {realTimeMetrics.trend?.responseTimeGrowth <= 0 ? '↗' : '↘'}{' '}
              {Math.abs(realTimeMetrics.trend?.responseTimeGrowth || 0).toFixed(
                1,
              )}
              %
            </div>
          </div>

          <div className="metric-card">
            <h4>Error Rate</h4>
            <div className="metric-value">
              {(realTimeMetrics.current?.errorRate || 0).toFixed(1)}%
            </div>
            <div
              className={`metric-trend ${realTimeMetrics.trend?.errorRateGrowth <= 0 ? 'positive' : 'negative'}`}
            >
              {realTimeMetrics.trend?.errorRateGrowth <= 0 ? '↗' : '↘'}{' '}
              {Math.abs(realTimeMetrics.trend?.errorRateGrowth || 0).toFixed(1)}
              %
            </div>
          </div>

          <div className="metric-card">
            <h4>Active Endpoints</h4>
            <div className="metric-value">
              {realTimeMetrics.current?.activeEndpoints || 0}
            </div>
            <div className="metric-trend neutral">
              {realTimeMetrics.topEndpoints?.length || 0} total
            </div>
          </div>
        </div>
      )}

      {/* Historical Chart */}
      <div className="chart-section">
        <div className="chart-header">
          <h3>Real-time Metrics</h3>
          <div className="chart-controls">
            <select
              value={selectedMetric}
              onChange={e => setSelectedMetric(e.target.value)}
              className="metric-selector"
            >
              <option value="requests">Requests</option>
              <option value="responseTime">Response Time</option>
              <option value="errorRate">Error Rate</option>
              <option value="activeEndpoints">Active Endpoints</option>
            </select>
          </div>
        </div>
        {renderChart()}
      </div>

      {/* Top Endpoints */}
      {realTimeMetrics?.topEndpoints && (
        <div className="top-endpoints">
          <h3>Top Endpoints</h3>
          <div className="endpoints-list">
            {realTimeMetrics.topEndpoints.slice(0, 5).map((endpoint, index) => (
              <div key={index} className="endpoint-item">
                <div className="endpoint-path">{endpoint.endpoint}</div>
                <div className="endpoint-stats">
                  <span className="requests">
                    {formatNumber(endpoint.requests)} req
                  </span>
                  <span className="response-time">
                    {endpoint.averageResponseTime.toFixed(0)}ms
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerts Panel */}
      {alerts.length > 0 && (
        <div className="alerts-panel">
          <h3>Recent Alerts</h3>
          <div className="alerts-list">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className={`alert-item severity-${alert.severity}`}
                style={{
                  borderLeftColor: getAlertSeverityColor(alert.severity),
                }}
              >
                <div className="alert-header">
                  <span className="alert-type">{alert.type}</span>
                  <span className="alert-time">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="alert-message">{alert.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Errors */}
      {realTimeMetrics?.recentErrors &&
        realTimeMetrics.recentErrors.length > 0 && (
        <div className="recent-errors">
          <h3>Recent Errors</h3>
          <div className="errors-list">
            {realTimeMetrics.recentErrors.map((error, index) => (
              <div key={index} className="error-item">
                <div className="error-code">{error.statusCode}</div>
                <div className="error-endpoint">{error.endpoint}</div>
                <div className="error-time">
                  {new Date(error.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function RealTimeApiDashboard(props) {
  return <DemoSurfaceGate testId="api-monitoring" title="API monitoring is unavailable"
    description="This API is not served by the testnet. Any enabled preview is illustrative.">
    <RealTimeApiDashboardSample {...props} />
  </DemoSurfaceGate>;
}
