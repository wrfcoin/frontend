import React, { useState, useEffect } from 'react';
import './IntegrationPanels.css';

/**
 * SensorCommunityPanel Component
 *
 * This component displays detailed information about the Sensor.Community
 * integration including dashboard, map view, and configuration options.
 */
const SensorCommunityPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sensorCount, setSensorCount] = useState(3412);
  const [lastUpdated, setLastUpdated] = useState(new Date().toISOString());
  const [config, setConfig] = useState({
    retentionPeriod: '12',
    merklizationEnabled: true,
    autoTokenize: true,
    computationalBlocks: true,
  });

  // Demonstration data for the panel
  const sensorTypes = [
    { name: 'Temperature', count: 3293, icon: 'bi-thermometer-half' },
    { name: 'Humidity', count: 3105, icon: 'bi-droplet-half' },
    { name: 'Air Quality (PM2.5)', count: 2891, icon: 'bi-cloud' },
    { name: 'Air Quality (PM10)', count: 2873, icon: 'bi-cloud-haze' },
    { name: 'Pressure', count: 2512, icon: 'bi-arrow-down-up' },
  ];

  const regions = [
    { name: 'Europe', count: 2156, percentage: '63.2%' },
    { name: 'North America', count: 621, percentage: '18.2%' },
    { name: 'Asia', count: 421, percentage: '12.3%' },
    { name: 'Australia', count: 128, percentage: '3.8%' },
    { name: 'South America', count: 54, percentage: '1.6%' },
    { name: 'Africa', count: 32, percentage: '0.9%' },
  ];

  const handleConfigChange = e => {
    const { name, value, type, checked } = e.target;
    setConfig({
      ...config,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSaveConfig = () => {
    alert('Configuration saved!');
    // In a real implementation, this would save to backend
  };

  return (
    <div className="integration-panel sensor-community-panel">
      <div className="panel-header">
        <h2>
          <i className="bi bi-cloud-check"></i>
          Sensor.Community Integration
        </h2>
        <div className="status-badge connected">
          <i className="bi bi-check-circle-fill"></i> Connected
        </div>
      </div>

      <div className="panel-tabs">
        <button
          className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <i className="bi bi-grid"></i> Dashboard
        </button>
        <button
          className={`tab-button ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => setActiveTab('map')}
        >
          <i className="bi bi-map"></i> Map View
        </button>
        <button
          className={`tab-button ${activeTab === 'configure' ? 'active' : ''}`}
          onClick={() => setActiveTab('configure')}
        >
          <i className="bi bi-gear"></i> Configure
        </button>
        <button
          className={`tab-button ${activeTab === 'tokenization' ? 'active' : ''}`}
          onClick={() => setActiveTab('tokenization')}
        >
          <i className="bi bi-coin"></i> Tokenization
        </button>
      </div>

      <div className="panel-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard-view">
            <div className="stats-cards">
              <div className="stat-card">
                <div className="stat-value">{sensorCount.toLocaleString()}</div>
                <div className="stat-label">Active Sensors</div>
                <div className="stat-icon">
                  <i className="bi bi-broadcast"></i>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-value">47</div>
                <div className="stat-label">Countries</div>
                <div className="stat-icon">
                  <i className="bi bi-globe"></i>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-value">9.2M</div>
                <div className="stat-label">Daily Data Points</div>
                <div className="stat-icon">
                  <i className="bi bi-bar-chart"></i>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{config.retentionPeriod}</div>
                <div className="stat-label">Month Retention</div>
                <div className="stat-icon">
                  <i className="bi bi-clock-history"></i>
                </div>
              </div>
            </div>

            <div className="data-section">
              <h3>Sensor Distribution by Type</h3>
              <div className="sensor-types">
                {sensorTypes.map((type, index) => (
                  <div key={index} className="sensor-type-item">
                    <i className={`bi ${type.icon}`}></i>
                    <span className="type-name">{type.name}</span>
                    <span className="type-count">
                      {type.count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="data-section">
              <h3>Geographic Distribution</h3>
              <div className="region-distribution">
                {regions.map((region, index) => (
                  <div key={index} className="region-item">
                    <div className="region-name">{region.name}</div>
                    <div className="region-bar-container">
                      <div
                        className="region-bar"
                        style={{ width: region.percentage }}
                      ></div>
                    </div>
                    <div className="region-stats">
                      <span className="region-count">{region.count}</span>
                      <span className="region-percentage">
                        {region.percentage}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="data-section">
              <h3>Recent Activity</h3>
              <div className="recent-activity">
                <div className="activity-item">
                  <i className="bi bi-arrow-up-circle"></i>
                  <div className="activity-details">
                    <div className="activity-text">
                      Data batch received from 342 sensors
                    </div>
                    <div className="activity-time">10 minutes ago</div>
                  </div>
                </div>
                <div className="activity-item">
                  <i className="bi bi-check-circle"></i>
                  <div className="activity-details">
                    <div className="activity-text">
                      Merkle tree generated for PM2.5 data
                    </div>
                    <div className="activity-time">25 minutes ago</div>
                  </div>
                </div>
                <div className="activity-item">
                  <i className="bi bi-database-check"></i>
                  <div className="activity-details">
                    <div className="activity-text">
                      Computational block created for April data
                    </div>
                    <div className="activity-time">1 hour ago</div>
                  </div>
                </div>
                <div className="activity-item">
                  <i className="bi bi-graph-up"></i>
                  <div className="activity-details">
                    <div className="activity-text">
                      Data validation completed with 99.7% success rate
                    </div>
                    <div className="activity-time">3 hours ago</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="last-updated">
              Last updated: {new Date(lastUpdated).toLocaleString()}
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="map-view">
            <div className="map-placeholder">
              <div className="map-overlay">
                <i className="bi bi-map"></i>
                <h3>Sensor.Community Global Map</h3>
                <p>Interactive map showing 3,412 sensors across 47 countries</p>
              </div>
            </div>
            <div className="map-filters">
              <div className="filter-group">
                <label>Sensor Type:</label>
                <select>
                  <option value="all">All Sensors</option>
                  <option value="temperature">Temperature</option>
                  <option value="humidity">Humidity</option>
                  <option value="pm25">PM2.5</option>
                  <option value="pm10">PM10</option>
                  <option value="pressure">Pressure</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Time Range:</label>
                <select>
                  <option value="1h">Last Hour</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Region:</label>
                <select>
                  <option value="global">Global</option>
                  <option value="europe">Europe</option>
                  <option value="namerica">North America</option>
                  <option value="asia">Asia</option>
                  <option value="australia">Australia</option>
                  <option value="samerica">South America</option>
                  <option value="africa">Africa</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'configure' && (
          <div className="configure-view">
            <div className="config-section">
              <h3>Data Configuration</h3>
              <div className="config-form">
                <div className="form-group">
                  <label htmlFor="retentionPeriod">
                    Data Retention Period:
                  </label>
                  <select
                    id="retentionPeriod"
                    name="retentionPeriod"
                    value={config.retentionPeriod}
                    onChange={handleConfigChange}
                  >
                    <option value="3">3 Months</option>
                    <option value="6">6 Months</option>
                    <option value="12">12 Months</option>
                    <option value="36">36 Months</option>
                  </select>
                </div>
                <div className="form-group checkbox-group">
                  <input
                    type="checkbox"
                    id="merklizationEnabled"
                    name="merklizationEnabled"
                    checked={config.merklizationEnabled}
                    onChange={handleConfigChange}
                  />
                  <label htmlFor="merklizationEnabled">
                    Enable Merkle Tree Validation
                  </label>
                </div>
                <div className="form-group checkbox-group">
                  <input
                    type="checkbox"
                    id="autoTokenize"
                    name="autoTokenize"
                    checked={config.autoTokenize}
                    onChange={handleConfigChange}
                  />
                  <label htmlFor="autoTokenize">Automatic Tokenization</label>
                </div>
                <div className="form-group checkbox-group">
                  <input
                    type="checkbox"
                    id="computationalBlocks"
                    name="computationalBlocks"
                    checked={config.computationalBlocks}
                    onChange={handleConfigChange}
                  />
                  <label htmlFor="computationalBlocks">
                    Generate Computational Blocks
                  </label>
                </div>
                <div className="form-actions">
                  <button className="btn-save" onClick={handleSaveConfig}>
                    Save Configuration
                  </button>
                  <button className="btn-cancel">Cancel</button>
                </div>
              </div>
            </div>

            <div className="config-section">
              <h3>API Configuration</h3>
              <div className="api-info">
                <div className="api-item">
                  <span className="api-label">Endpoint URL:</span>
                  <span className="api-value">
                    https://data.sensor.community/airrohr/v1/
                  </span>
                </div>
                <div className="api-item">
                  <span className="api-label">Update Frequency:</span>
                  <span className="api-value">5 minutes</span>
                </div>
                <div className="api-item">
                  <span className="api-label">Request Timeout:</span>
                  <span className="api-value">30 seconds</span>
                </div>
                <div className="api-item">
                  <span className="api-label">Retry Strategy:</span>
                  <span className="api-value">
                    3 attempts with exponential backoff
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tokenization' && (
          <div className="tokenization-view">
            <div className="tokenization-info">
              <h3>Data Tokenization System</h3>
              <p>
                The Sensor.Community data is tokenized on the Wrfcoin
                blockchain, creating incentives for data contributors and
                ensuring data quality through validation mechanisms.
              </p>

              <div className="tokenization-stats">
                <div className="token-stat-card">
                  <div className="token-stat-value">214,512</div>
                  <div className="token-stat-label">Tokens Minted</div>
                </div>
                <div className="token-stat-card">
                  <div className="token-stat-value">1,245</div>
                  <div className="token-stat-label">Contributors Rewarded</div>
                </div>
                <div className="token-stat-card">
                  <div className="token-stat-value">99.7%</div>
                  <div className="token-stat-label">Data Quality</div>
                </div>
              </div>

              <h3>Tokenization Rules</h3>
              <div className="tokenization-rules">
                <div className="rule-item">
                  <i className="bi bi-check-circle"></i>
                  <div className="rule-text">
                    <strong>Sensor Quality:</strong> Higher quality sensors
                    receive more tokens
                  </div>
                </div>
                <div className="rule-item">
                  <i className="bi bi-check-circle"></i>
                  <div className="rule-text">
                    <strong>Data Consistency:</strong> Consistent data reporting
                    increases token rewards
                  </div>
                </div>
                <div className="rule-item">
                  <i className="bi bi-check-circle"></i>
                  <div className="rule-text">
                    <strong>Coverage Bonus:</strong> Sensors in underrepresented
                    areas earn additional tokens
                  </div>
                </div>
                <div className="rule-item">
                  <i className="bi bi-check-circle"></i>
                  <div className="rule-text">
                    <strong>Cross-Validation:</strong> Data validated by nearby
                    sensors earns verification bonuses
                  </div>
                </div>
              </div>
            </div>

            <div className="computational-blocks">
              <h3>Computational Blocks</h3>
              <p>
                Environmental data is processed into specialized computational
                blocks with configurable pruning periods to optimize storage
                while preserving critical historical data.
              </p>

              <div className="block-types">
                <div className="block-type">
                  <div className="block-icon">
                    <i className="bi bi-calendar-week"></i>
                  </div>
                  <div className="block-details">
                    <div className="block-title">
                      Short-Term Blocks (3 months)
                    </div>
                    <div className="block-description">
                      High-resolution data with complete sensor readings
                    </div>
                  </div>
                </div>
                <div className="block-type">
                  <div className="block-icon">
                    <i className="bi bi-calendar-month"></i>
                  </div>
                  <div className="block-details">
                    <div className="block-title">
                      Medium-Term Blocks (6-12 months)
                    </div>
                    <div className="block-description">
                      Aggregated daily averages with statistical metadata
                    </div>
                  </div>
                </div>
                <div className="block-type">
                  <div className="block-icon">
                    <i className="bi bi-calendar3"></i>
                  </div>
                  <div className="block-details">
                    <div className="block-title">
                      Long-Term Blocks (36 months)
                    </div>
                    <div className="block-description">
                      Monthly averages with trend analysis data
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SensorCommunityPanel;
