import React, { useState, useEffect } from 'react';
import './LuftdatenStyles.css';
import DemoSurfaceGate from '../common/DemoSurfaceGate';

/**
 * LuftdatenDashboard Component
 *
 * Displays a dashboard for the Luftdaten integration, showing air quality
 * data and sensor information from the Luftdaten/Sensor.Community network.
 */
const LuftdatenDashboardSample = () => {
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [networkStatus, setNetworkStatus] = useState({
    status: 'operational',
    sensors: { total: 0, online: 0 },
    dataPoints: 0,
    regions: 0,
  });
  const [airQuality, setAirQuality] = useState({
    value: 0,
    category: 'good',
    text: 'Good',
  });
  const [recentData, setRecentData] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [viewType, setViewType] = useState('map');

  // Load data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simulate API call to get network status
        setTimeout(() => {
          setNetworkStatus({
            status: 'operational',
            sensors: { total: 12487, online: 10345 },
            dataPoints: 847392,
            regions: 72,
            lastUpdate: new Date().toISOString(),
          });

          setAirQuality({
            value: 35,
            category: 'good',
            text: 'Good',
          });

          setRecentData([
            {
              id: 1,
              timestamp: '2025-05-17T09:55:21Z',
              sensorId: 'luftdaten-12345',
              parameter: 'PM2.5',
              value: 12.5,
              unit: 'µg/m³',
              location: 'Berlin, Germany',
            },
            {
              id: 2,
              timestamp: '2025-05-17T09:54:18Z',
              sensorId: 'luftdaten-23456',
              parameter: 'PM10',
              value: 25.8,
              unit: 'µg/m³',
              location: 'Madrid, Spain',
            },
            {
              id: 3,
              timestamp: '2025-05-17T09:53:42Z',
              sensorId: 'luftdaten-34567',
              parameter: 'Temperature',
              value: 22.4,
              unit: '°C',
              location: 'Paris, France',
            },
            {
              id: 4,
              timestamp: '2025-05-17T09:52:55Z',
              sensorId: 'luftdaten-45678',
              parameter: 'Humidity',
              value: 56.7,
              unit: '%',
              location: 'London, UK',
            },
            {
              id: 5,
              timestamp: '2025-05-17T09:51:30Z',
              sensorId: 'luftdaten-56789',
              parameter: 'PM2.5',
              value: 18.3,
              unit: 'µg/m³',
              location: 'Rome, Italy',
            },
          ]);

          setSensors([
            {
              id: 'luftdaten-12345',
              name: 'Berlin City Center',
              type: 'SDS011',
              parameters: ['PM2.5', 'PM10'],
              status: 'online',
              lastData: '2025-05-17T09:55:21Z',
              location: 'Berlin, Germany',
              owner: 'community',
            },
            {
              id: 'luftdaten-23456',
              name: 'Madrid Environmental',
              type: 'SDS011',
              parameters: ['PM2.5', 'PM10'],
              status: 'online',
              lastData: '2025-05-17T09:54:18Z',
              location: 'Madrid, Spain',
              owner: 'university',
            },
            {
              id: 'luftdaten-34567',
              name: 'Paris Weather Station',
              type: 'DHT22',
              parameters: ['Temperature', 'Humidity'],
              status: 'online',
              lastData: '2025-05-17T09:53:42Z',
              location: 'Paris, France',
              owner: 'community',
            },
            {
              id: 'luftdaten-45678',
              name: 'London Air Quality',
              type: 'BME280',
              parameters: ['Temperature', 'Humidity', 'Pressure'],
              status: 'online',
              lastData: '2025-05-17T09:52:55Z',
              location: 'London, UK',
              owner: 'community',
            },
            {
              id: 'luftdaten-56789',
              name: 'Rome Urban Sensor',
              type: 'SDS011',
              parameters: ['PM2.5', 'PM10'],
              status: 'online',
              lastData: '2025-05-17T09:51:30Z',
              location: 'Rome, Italy',
              owner: 'government',
            },
            {
              id: 'luftdaten-67890',
              name: 'Amsterdam Canal',
              type: 'SDS011',
              parameters: ['PM2.5', 'PM10'],
              status: 'offline',
              lastData: '2025-05-17T08:22:15Z',
              location: 'Amsterdam, Netherlands',
              owner: 'community',
            },
          ]);

          setLoading(false);
        }, 1500);
      } catch (error) {
        console.error('Error fetching Luftdaten data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Format timestamp to human readable format
  const formatTimestamp = timestamp => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  // Calculate time ago from timestamp
  const getTimeAgo = timestamp => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);

    if (diffSec < 60) return `${diffSec} seconds ago`;
    if (diffMin < 60) return `${diffMin} minutes ago`;
    if (diffHour < 24) return `${diffHour} hours ago`;
    return `${Math.round(diffHour / 24)} days ago`;
  };

  // Render network overview tab
  const renderOverviewTab = () => (
    <div className="network-overview">
      <div className="status-card">
        <h3>Network Status</h3>
        <div className="status-indicator">
          <span
            className={`status-indicator-${networkStatus.status === 'operational' ? 'success' : networkStatus.status === 'degraded' ? 'warning' : 'error'}`}
          ></span>
          <span>
            {networkStatus.status === 'operational'
              ? 'Operational'
              : networkStatus.status === 'degraded'
                ? 'Degraded Performance'
                : 'Outage'}
          </span>
        </div>
        <div className="status-stats">
          <div className="stat-item">
            <span className="stat-label">Total Sensors:</span>
            <span className="stat-value">
              {networkStatus.sensors.total.toLocaleString()}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Online Sensors:</span>
            <span className="stat-value">
              {networkStatus.sensors.online.toLocaleString()}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Active Regions:</span>
            <span className="stat-value">{networkStatus.regions}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Data Points:</span>
            <span className="stat-value">
              {networkStatus.dataPoints.toLocaleString()}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Last Update:</span>
            <span className="stat-value">
              {getTimeAgo(networkStatus.lastUpdate)}
            </span>
          </div>
        </div>
      </div>

      <div className="air-quality-card">
        <h3>Current Air Quality</h3>
        <div className="air-quality-text">PM2.5 Average</div>
        <div
          className={`air-quality-indicator air-quality-${airQuality.category}`}
        >
          <span className="air-quality-value">{airQuality.value}</span>
          <span className="air-quality-unit">µg/m³</span>
          <span className="air-quality-label">{airQuality.text}</span>
        </div>
        <p>Based on data from {networkStatus.sensors.online} active sensors.</p>
      </div>

      <div className="map-card">
        <h3>Sensor Map</h3>
        <div className="view-toggle">
          <button
            className={`toggle-button ${viewType === 'map' ? 'active' : ''}`}
            onClick={() => setViewType('map')}
          >
            Map View
          </button>
          <button
            className={`toggle-button ${viewType === 'list' ? 'active' : ''}`}
            onClick={() => setViewType('list')}
          >
            List View
          </button>
        </div>

        {viewType === 'map' ? (
          <div className="map-placeholder">
            <p>
              Interactive map with{' '}
              {networkStatus.sensors.online.toLocaleString()} sensors would be
              displayed here.
            </p>
            <p>Click on any sensor to view detailed data and time series.</p>
          </div>
        ) : (
          <div className="sensors-list">
            <table className="sensors-table">
              <thead>
                <tr>
                  <th>Sensor ID</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Parameters</th>
                  <th>Status</th>
                  <th>Last Update</th>
                </tr>
              </thead>
              <tbody>
                {sensors.map(sensor => (
                  <tr key={sensor.id}>
                    <td>{sensor.id}</td>
                    <td>{sensor.location}</td>
                    <td>{sensor.type}</td>
                    <td>{sensor.parameters.join(', ')}</td>
                    <td>{sensor.status}</td>
                    <td>{getTimeAgo(sensor.lastData)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="recent-data-card">
        <h3>Recent Measurements</h3>
        <table className="recent-data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Sensor</th>
              <th>Parameter</th>
              <th>Value</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            {recentData.map(item => (
              <tr key={item.id}>
                <td>{getTimeAgo(item.timestamp)}</td>
                <td>{item.sensorId}</td>
                <td>{item.parameter}</td>
                <td>
                  {item.value} {item.unit}
                </td>
                <td>{item.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render sensor management tab
  const renderSensorsTab = () => (
    <div className="sensors-management">
      <h3>Sensor Management</h3>
      <p>
        Connect and manage your Luftdaten/Sensor.Community compatible devices.
      </p>

      <div className="chart-placeholder">
        <p>Sensor management interface would be displayed here.</p>
        <p>Register, monitor, and configure your air quality sensors.</p>
      </div>
    </div>
  );

  // Render data analysis tab
  const renderAnalysisTab = () => (
    <div className="data-analysis">
      <h3>Data Analysis</h3>

      <div className="data-filters">
        <div className="filter-group">
          <label>Parameter</label>
          <select>
            <option>PM2.5</option>
            <option>PM10</option>
            <option>Temperature</option>
            <option>Humidity</option>
            <option>Pressure</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Time Range</label>
          <select>
            <option>Last 24 Hours</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Custom Range</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Region</label>
          <select>
            <option>All Regions</option>
            <option>Europe</option>
            <option>North America</option>
            <option>Asia</option>
            <option>South America</option>
            <option>Africa</option>
            <option>Oceania</option>
          </select>
        </div>
      </div>

      <div className="chart-placeholder">
        <p>Interactive time series charts would be displayed here.</p>
        <p>
          Analyze air quality trends, patterns, and anomalies across different
          regions.
        </p>
      </div>

      <div className="stats-cards">
        <div className="stat-card">
          <h4>Statistical Analysis</h4>
          <div className="chart-placeholder">
            <p>
              Statistical metrics and distributions would be displayed here.
            </p>
          </div>
        </div>
        <div className="stat-card">
          <h4>Correlation Analysis</h4>
          <div className="chart-placeholder">
            <p>Parameter correlation analysis would be displayed here.</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Render integration tab
  const renderIntegrationTab = () => (
    <div className="integration">
      <h3>Wrfcoin Integration</h3>
      <p>Connect Luftdaten data with the Wrfcoin blockchain.</p>

      <div className="chart-placeholder">
        <p>Blockchain integration interface would be displayed here.</p>
        <p>
          Submit verified sensor data to Wrfcoin, earn rewards, and manage
          sensor reputation.
        </p>
      </div>
    </div>
  );

  return (
    <div className="luftdaten-dashboard">
      <h2>Luftdaten Air Quality Network</h2>

      <div className="dashboard-tabs">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Network Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'sensors' ? 'active' : ''}`}
          onClick={() => setActiveTab('sensors')}
        >
          Sensor Management
        </button>
        <button
          className={`tab-button ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          Data Analysis
        </button>
        <button
          className={`tab-button ${activeTab === 'integration' ? 'active' : ''}`}
          onClick={() => setActiveTab('integration')}
        >
          Wrfcoin Integration
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading Luftdaten data...</div>
      ) : (
        <>
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'sensors' && renderSensorsTab()}
          {activeTab === 'analysis' && renderAnalysisTab()}
          {activeTab === 'integration' && renderIntegrationTab()}
        </>
      )}
    </div>
  );
};

// frontend#352: display-only fabricated surface. The default build shows an
// honest not-live state and never mounts the sample.
const LuftdatenDashboard = () => (
  <DemoSurfaceGate
    title="The Luftdaten integration is not live"
    description="No backend route serves Luftdaten sensors, readings or network status yet."
    testId="luftdaten"
  >
    <LuftdatenDashboardSample />
  </DemoSurfaceGate>
);

export default LuftdatenDashboard;
