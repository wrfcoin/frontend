import React, { useState } from 'react';
import './IntegrationPanels.css';

/**
 * OpenAQ Panel Component
 *
 * This component provides a detailed panel view for the OpenAQ integration,
 * including dashboard data, map view, configuration options, and tokenization settings.
 */
const OpenAQPanel = ({ onCollapse }) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="integration-panel">
      <div className="panel-header">
        <div className="panel-header-content">
          <img
            src="/static/icons/openaq-logo.svg"
            alt="OpenAQ Logo"
            className="integration-logo"
          />
          <h2>OpenAQ Integration</h2>
          <span className="status-badge connected">CONNECTED</span>
        </div>
        <button className="collapse-button" onClick={onCollapse}>
          <i className="bi bi-x-lg"></i>
        </button>
      </div>

      <div className="panel-tabs">
        <div
          className={`panel-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <i className="bi bi-speedometer2"></i> Dashboard
        </div>
        <div
          className={`panel-tab ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => setActiveTab('map')}
        >
          <i className="bi bi-map"></i> Map View
        </div>
        <div
          className={`panel-tab ${activeTab === 'configure' ? 'active' : ''}`}
          onClick={() => setActiveTab('configure')}
        >
          <i className="bi bi-gear"></i> Configure
        </div>
        <div
          className={`panel-tab ${activeTab === 'tokenization' ? 'active' : ''}`}
          onClick={() => setActiveTab('tokenization')}
        >
          <i className="bi bi-coin"></i> Tokenization
        </div>
      </div>

      <div className="panel-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard-content">
            <h3>OpenAQ Data Dashboard</h3>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">143</div>
                <div className="stat-label">Countries</div>
                <div className="stat-icon">
                  <i className="bi bi-globe"></i>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-value">12.8K</div>
                <div className="stat-label">Active Monitors</div>
                <div className="stat-icon">
                  <i className="bi bi-broadcast-pin"></i>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-value">24M+</div>
                <div className="stat-label">Daily Records</div>
                <div className="stat-icon">
                  <i className="bi bi-database-add"></i>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-value">6</div>
                <div className="stat-label">Parameters</div>
                <div className="stat-icon">
                  <i className="bi bi-list-check"></i>
                </div>
              </div>
            </div>

            <h4>Parameters Monitored</h4>
            <div className="parameters-grid">
              <div className="parameter-card">
                <div className="parameter-icon">
                  PM<sub>2.5</sub>
                </div>
                <div className="parameter-name">Fine Particulate Matter</div>
                <div className="parameter-count">5.8M Records/day</div>
              </div>

              <div className="parameter-card">
                <div className="parameter-icon">
                  PM<sub>10</sub>
                </div>
                <div className="parameter-name">Coarse Particulate Matter</div>
                <div className="parameter-count">4.2M Records/day</div>
              </div>

              <div className="parameter-card">
                <div className="parameter-icon">
                  O<sub>3</sub>
                </div>
                <div className="parameter-name">Ozone</div>
                <div className="parameter-count">4.7M Records/day</div>
              </div>

              <div className="parameter-card">
                <div className="parameter-icon">
                  NO<sub>2</sub>
                </div>
                <div className="parameter-name">Nitrogen Dioxide</div>
                <div className="parameter-count">3.9M Records/day</div>
              </div>

              <div className="parameter-card">
                <div className="parameter-icon">
                  SO<sub>2</sub>
                </div>
                <div className="parameter-name">Sulfur Dioxide</div>
                <div className="parameter-count">3.1M Records/day</div>
              </div>

              <div className="parameter-card">
                <div className="parameter-icon">CO</div>
                <div className="parameter-name">Carbon Monoxide</div>
                <div className="parameter-count">2.3M Records/day</div>
              </div>
            </div>

            <h4>Recent Activity</h4>
            <div className="activity-feed">
              <div className="activity-item">
                <div className="activity-icon">
                  <i className="bi bi-arrow-down-circle"></i>
                </div>
                <div className="activity-details">
                  <span className="activity-title">Data Sync Completed</span>
                  <span className="activity-description">
                    Successfully synchronized 2.3M new records
                  </span>
                  <span className="activity-time">10 minutes ago</span>
                </div>
              </div>

              <div className="activity-item">
                <div className="activity-icon">
                  <i className="bi bi-stars"></i>
                </div>
                <div className="activity-details">
                  <span className="activity-title">Quality Analysis Run</span>
                  <span className="activity-description">
                    Completed data quality assessment on 5.8M records
                  </span>
                  <span className="activity-time">2 hours ago</span>
                </div>
              </div>

              <div className="activity-item">
                <div className="activity-icon">
                  <i className="bi bi-coin"></i>
                </div>
                <div className="activity-details">
                  <span className="activity-title">Tokens Distributed</span>
                  <span className="activity-description">
                    Distributed 18,452 tokens to data providers
                  </span>
                  <span className="activity-time">6 hours ago</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="map-content">
            <h3>OpenAQ Global Monitoring Network</h3>
            <div className="map-placeholder">
              <div className="map-overlay">
                <i className="bi bi-map"></i>
                <p>
                  Interactive map of OpenAQ monitoring locations would be
                  displayed here.
                </p>
                <p>
                  The map would show locations of 12.8K active air quality
                  monitors across 143 countries.
                </p>
              </div>
            </div>

            <div className="map-filters">
              <h4>Map Filters</h4>
              <div className="filter-group">
                <label>Parameter:</label>
                <select className="filter-select">
                  <option value="all">All Parameters</option>
                  <option value="pm25">PM2.5</option>
                  <option value="pm10">PM10</option>
                  <option value="o3">Ozone (O3)</option>
                  <option value="no2">Nitrogen Dioxide (NO2)</option>
                  <option value="so2">Sulfur Dioxide (SO2)</option>
                  <option value="co">Carbon Monoxide (CO)</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Data Freshness:</label>
                <select className="filter-select">
                  <option value="1h">Last Hour</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="all">All Data</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Region:</label>
                <select className="filter-select">
                  <option value="all">Global</option>
                  <option value="na">North America</option>
                  <option value="sa">South America</option>
                  <option value="eu">Europe</option>
                  <option value="as">Asia</option>
                  <option value="af">Africa</option>
                  <option value="oc">Oceania</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'configure' && (
          <div className="configure-content">
            <h3>OpenAQ Integration Configuration</h3>

            <div className="config-section">
              <h4>API Settings</h4>
              <div className="config-form">
                <div className="form-group">
                  <label>API Key:</label>
                  <input type="password" value="••••••••••••••••" readOnly />
                  <button className="small-button">Update</button>
                </div>

                <div className="form-group">
                  <label>API Endpoint:</label>
                  <input
                    type="text"
                    value="https://api.openaq.org/v2/"
                    readOnly
                  />
                </div>

                <div className="form-group">
                  <label>Request Timeout (seconds):</label>
                  <input type="number" defaultValue={30} />
                </div>
              </div>
            </div>

            <div className="config-section">
              <h4>Data Synchronization</h4>
              <div className="config-form">
                <div className="form-group">
                  <label>Sync Frequency:</label>
                  <select defaultValue="1h">
                    <option value="15m">Every 15 minutes</option>
                    <option value="30m">Every 30 minutes</option>
                    <option value="1h">Every hour</option>
                    <option value="3h">Every 3 hours</option>
                    <option value="6h">Every 6 hours</option>
                    <option value="12h">Every 12 hours</option>
                    <option value="24h">Every 24 hours</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Parameters to Sync:</label>
                  <div className="checkbox-group">
                    <label>
                      <input type="checkbox" checked readOnly /> PM2.5
                    </label>
                    <label>
                      <input type="checkbox" checked readOnly /> PM10
                    </label>
                    <label>
                      <input type="checkbox" checked readOnly /> Ozone (O3)
                    </label>
                    <label>
                      <input type="checkbox" checked readOnly /> Nitrogen
                      Dioxide (NO2)
                    </label>
                    <label>
                      <input type="checkbox" checked readOnly /> Sulfur Dioxide
                      (SO2)
                    </label>
                    <label>
                      <input type="checkbox" checked readOnly /> Carbon Monoxide
                      (CO)
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Data Retention Period:</label>
                  <select defaultValue="6m">
                    <option value="1m">1 Month</option>
                    <option value="3m">3 Months</option>
                    <option value="6m">6 Months</option>
                    <option value="1y">1 Year</option>
                    <option value="2y">2 Years</option>
                    <option value="all">Keep All Data</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="config-section">
              <h4>Quality Control</h4>
              <div className="config-form">
                <div className="form-group">
                  <label>Enable Data Quality Checks:</label>
                  <label className="switch">
                    <input type="checkbox" checked readOnly />
                    <span className="slider round"></span>
                  </label>
                </div>

                <div className="form-group">
                  <label>Valid Value Ranges:</label>
                  <table className="config-table">
                    <thead>
                      <tr>
                        <th>Parameter</th>
                        <th>Min Value</th>
                        <th>Max Value</th>
                        <th>Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>PM2.5</td>
                        <td>0</td>
                        <td>1000</td>
                        <td>µg/m³</td>
                      </tr>
                      <tr>
                        <td>PM10</td>
                        <td>0</td>
                        <td>1500</td>
                        <td>µg/m³</td>
                      </tr>
                      <tr>
                        <td>Ozone (O3)</td>
                        <td>0</td>
                        <td>500</td>
                        <td>ppb</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button className="primary-button">Save Changes</button>
              <button className="secondary-button">Reset Defaults</button>
            </div>
          </div>
        )}

        {activeTab === 'tokenization' && (
          <div className="tokenization-content">
            <h3>OpenAQ Data Tokenization Settings</h3>

            <div className="tokenization-section">
              <h4>Tokenization Rules</h4>
              <p>
                Configure how OpenAQ air quality data is tokenized and
                incentivized on the Wrfcoin blockchain.
              </p>

              <div className="config-form">
                <div className="form-group">
                  <label>Enable Tokenization:</label>
                  <label className="switch">
                    <input type="checkbox" checked readOnly />
                    <span className="slider round"></span>
                  </label>
                </div>

                <div className="form-group">
                  <label>Token Distribution Model:</label>
                  <select defaultValue="contribution">
                    <option value="equal">Equal Distribution</option>
                    <option value="contribution">By Contribution Volume</option>
                    <option value="quality">By Data Quality</option>
                    <option value="hybrid">Hybrid Model</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Distribution Frequency:</label>
                  <select defaultValue="daily">
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="tokenization-section">
              <h4>Token Allocation</h4>

              <div className="allocation-chart">
                <div className="chart-container">
                  <div className="chart-placeholder">
                    [Allocation Chart Visualization]
                  </div>
                </div>

                <div className="allocation-details">
                  <div className="allocation-item">
                    <div
                      className="color-box"
                      style={{ backgroundColor: '#4CAF50' }}
                    ></div>
                    <div className="item-label">Data Providers</div>
                    <div className="item-value">60%</div>
                  </div>

                  <div className="allocation-item">
                    <div
                      className="color-box"
                      style={{ backgroundColor: '#2196F3' }}
                    ></div>
                    <div className="item-label">Data Validators</div>
                    <div className="item-value">20%</div>
                  </div>

                  <div className="allocation-item">
                    <div
                      className="color-box"
                      style={{ backgroundColor: '#9C27B0' }}
                    ></div>
                    <div className="item-label">Forecast Compute</div>
                    <div className="item-value">15%</div>
                  </div>

                  <div className="allocation-item">
                    <div
                      className="color-box"
                      style={{ backgroundColor: '#FF9800' }}
                    ></div>
                    <div className="item-label">Community Fund</div>
                    <div className="item-value">5%</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="tokenization-section">
              <h4>Reward Factors</h4>

              <div className="config-form">
                <div className="factor-group">
                  <h5>Data Quality Multipliers</h5>
                  <div className="factor-controls">
                    <div className="factor-item">
                      <label>Calibrated Sensors:</label>
                      <input
                        type="number"
                        defaultValue={2.0}
                        min={0}
                        step={0.1}
                      />
                      <span className="factor-suffix">×</span>
                    </div>

                    <div className="factor-item">
                      <label>Data Completeness:</label>
                      <input
                        type="number"
                        defaultValue={1.5}
                        min={0}
                        step={0.1}
                      />
                      <span className="factor-suffix">×</span>
                    </div>

                    <div className="factor-item">
                      <label>Reference Grade Equipment:</label>
                      <input
                        type="number"
                        defaultValue={3.0}
                        min={0}
                        step={0.1}
                      />
                      <span className="factor-suffix">×</span>
                    </div>
                  </div>
                </div>

                <div className="factor-group">
                  <h5>Geographic Multipliers</h5>
                  <div className="factor-controls">
                    <div className="factor-item">
                      <label>Data Sparse Regions:</label>
                      <input
                        type="number"
                        defaultValue={2.5}
                        min={0}
                        step={0.1}
                      />
                      <span className="factor-suffix">×</span>
                    </div>

                    <div className="factor-item">
                      <label>Urban Core Areas:</label>
                      <input
                        type="number"
                        defaultValue={1.2}
                        min={0}
                        step={0.1}
                      />
                      <span className="factor-suffix">×</span>
                    </div>

                    <div className="factor-item">
                      <label>High-Risk Regions:</label>
                      <input
                        type="number"
                        defaultValue={1.8}
                        min={0}
                        step={0.1}
                      />
                      <span className="factor-suffix">×</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button className="primary-button">
                Apply Tokenization Rules
              </button>
              <button className="secondary-button">Preview Distribution</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpenAQPanel;
