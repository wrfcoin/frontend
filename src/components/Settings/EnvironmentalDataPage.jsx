import React, { useState, useEffect } from 'react';

import axios from 'axios';

import './Settings.css';

const EnvironmentalDataPage = () => {
  const [dataSources, setDataSources] = useState({
    iot: [
      {
        id: 'sensor-community',
        name: 'Sensor.Community',
        sensors: 15842,
        enabled: true,
        quality: 'high',
        coverage: 'global',
      },
      {
        id: 'ttn',
        name: 'The Things Network',
        sensors: 8934,
        enabled: false,
        quality: 'medium',
        coverage: 'regional',
      },
      {
        id: 'foam',
        name: 'FOAM Protocol',
        sensors: 2341,
        enabled: true,
        quality: 'high',
        coverage: 'urban',
      },
      {
        id: 'luftdaten',
        name: 'Luftdaten Network',
        sensors: 12567,
        enabled: true,
        quality: 'high',
        coverage: 'europe',
      },
      {
        id: 'tataucloud',
        name: 'TatauCloud',
        sensors: 892,
        enabled: false,
        quality: 'medium',
        coverage: 'oceania',
      },
    ],
    weather: [
      {
        id: 'openweather',
        name: 'OpenWeatherMap',
        stations: 40000,
        enabled: true,
        quality: 'high',
        latency: '5min',
      },
      {
        id: 'weather-gov',
        name: 'NOAA Weather',
        stations: 15000,
        enabled: true,
        quality: 'high',
        latency: '10min',
      },
      {
        id: 'meteomatics',
        name: 'Meteomatics',
        stations: 8000,
        enabled: false,
        quality: 'premium',
        latency: '1min',
      },
      {
        id: 'weatherstack',
        name: 'WeatherStack',
        stations: 12000,
        enabled: true,
        quality: 'medium',
        latency: '15min',
      },
    ],
    environmental: [
      {
        id: 'epa',
        name: 'EPA Air Quality',
        stations: 4000,
        enabled: true,
        quality: 'high',
        type: 'air-quality',
      },
      {
        id: 'purpleair',
        name: 'PurpleAir',
        stations: 25000,
        enabled: true,
        quality: 'medium',
        type: 'air-quality',
      },
      {
        id: 'aqicn',
        name: 'AQICN',
        stations: 18000,
        enabled: false,
        quality: 'high',
        type: 'air-quality',
      },
      {
        id: 'usgs',
        name: 'USGS Water Data',
        stations: 8500,
        enabled: true,
        quality: 'high',
        type: 'water-quality',
      },
    ],
  });

  const [validationSettings, setValidationSettings] = useState({
    dataIntegrityChecks: true,
    crossReferenceValidation: true,
    temporalConsistencyCheck: true,
    spatialConsistencyCheck: true,
    outlierDetection: true,
    automaticQualityFiltering: true,
    minimumDataQuality: 'medium',
    maxDataLatency: 30,
    requireMultipleSources: true,
    consensusThreshold: 75,
  });

  const [processingSettings, setProcessingSettings] = useState({
    realTimeProcessing: true,
    batchProcessingInterval: 15,
    dataAggregationLevel: 'high',
    storageRetention: 365,
    backupFrequency: 'daily',
    compressionEnabled: true,
    encryptionEnabled: true,
    redundantStorage: true,
  });

  const [metrics, setMetrics] = useState({
    totalSensors: '952,341',
    activeDataSources: 8,
    dataQualityScore: '94.7%',
    avgLatency: '8.2min',
    dailyDataPoints: '45.2M',
  });

  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleDataSourceToggle = async (category, sourceId) => {
    setLoading(true);
    try {
      setDataSources(prev => ({
        ...prev,
        [category]: prev[category].map(source =>
          source.id === sourceId
            ? { ...source, enabled: !source.enabled }
            : source,
        ),
      }));

      const source = dataSources[category].find(s => s.id === sourceId);
      setSnackbar({
        open: true,
        message: `${source.name} ${source.enabled ? 'disabled' : 'enabled'} successfully`,
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to toggle ${sourceId}`,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleValidationChange = e => {
    const { name, value, type, checked } = e.target;
    setValidationSettings(prev => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? checked
          : type === 'number'
            ? Number(value)
            : value,
    }));
  };

  const handleProcessingChange = e => {
    const { name, value, type, checked } = e.target;
    setProcessingSettings(prev => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? checked
          : type === 'number'
            ? Number(value)
            : value,
    }));
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      setSnackbar({
        open: true,
        message: 'Environmental data settings saved successfully',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to save settings',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const getQualityColor = quality => {
    switch (quality) {
    case 'high':
      return '#4caf50';
    case 'premium':
      return '#2196f3';
    case 'medium':
      return '#ff9800';
    case 'low':
      return '#f44336';
    default:
      return '#9e9e9e';
    }
  };

  const renderDataSourceCategory = (title, category, sources) => (
    <div className="settings-section" key={category}>
      <div className="settings-section-header">
        <h3>{title}</h3>
        <div className="category-actions">
          <button className="btn-enable-all">Enable All</button>
          <button className="btn-disable-all">Disable All</button>
        </div>
      </div>

      <div className="data-sources-grid">
        <table className="data-sources-table">
          <thead className="data-sources-table-header">
            <tr>
              <th>Data Source</th>
              <th>Capacity</th>
              <th>Quality</th>
              <th>Coverage/Latency</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sources.map(source => (
              <tr className="data-source-row" key={source.id}>
                <td className="source-title-cell">
                  <div className="source-title">
                    {source.name}
                    <span
                      className={`status-badge ${source.enabled ? 'active' : 'inactive'}`}
                    >
                      {source.enabled ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </td>
                <td className="source-capacity-cell">
                  {(source.sensors || source.stations).toLocaleString()}{' '}
                  {source.sensors ? 'sensors' : 'stations'}
                </td>
                <td className="source-quality-cell">
                  <span
                    className="quality-indicator"
                    style={{ backgroundColor: getQualityColor(source.quality) }}
                  ></span>
                  {source.quality.charAt(0).toUpperCase() +
                    source.quality.slice(1)}
                </td>
                <td className="source-info-cell">
                  {source.coverage || source.latency || source.type}
                </td>
                <td className="source-actions-cell">
                  <div className="source-actions">
                    <button
                      className="action-btn configure-btn"
                      disabled={loading}
                    >
                      Configure
                    </button>
                    <button
                      className="action-btn test-btn"
                      disabled={loading || !source.enabled}
                    >
                      Test
                    </button>
                    <button
                      className={`action-btn toggle-btn ${source.enabled ? 'disable-btn' : 'enable-btn'}`}
                      onClick={() =>
                        handleDataSourceToggle(category, source.id)
                      }
                      disabled={loading}
                    >
                      {source.enabled ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="settings-content">
      <div className="settings-section">
        <h2>
          <i className="bi bi-cloud-drizzle-fill"></i> Environmental Data
          Sources
        </h2>
        <p className="settings-description">
          Configure and manage environmental data sources including IoT sensor
          networks, weather stations, and environmental monitoring systems.
          Control data validation and processing settings.
        </p>

        {/* Metrics Overview */}
        <div className="environmental-metrics-overview">
          <h3>Data Network Overview</h3>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">Total Sensors</div>
              <div className="metric-value">{metrics.totalSensors}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Active Sources</div>
              <div className="metric-value">{metrics.activeDataSources}/12</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Data Quality</div>
              <div className="metric-value">{metrics.dataQualityScore}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Avg Latency</div>
              <div className="metric-value">{metrics.avgLatency}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Daily Data Points</div>
              <div className="metric-value">{metrics.dailyDataPoints}</div>
            </div>
          </div>
        </div>

        {/* Data Sources */}
        {renderDataSourceCategory(
          'IoT Sensor Networks',
          'iot',
          dataSources.iot,
        )}
        {renderDataSourceCategory(
          'Weather Data Sources',
          'weather',
          dataSources.weather,
        )}
        {renderDataSourceCategory(
          'Environmental Monitoring',
          'environmental',
          dataSources.environmental,
        )}

        {/* Data Validation Settings */}
        <div className="settings-section">
          <h3>Data Validation & Quality Control</h3>
          <form className="validation-settings-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="minimumDataQuality">Minimum Data Quality</label>
                <select
                  id="minimumDataQuality"
                  name="minimumDataQuality"
                  value={validationSettings.minimumDataQuality}
                  onChange={handleValidationChange}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="premium">Premium Only</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="maxDataLatency">
                  Max Data Latency (minutes)
                </label>
                <input
                  type="number"
                  id="maxDataLatency"
                  name="maxDataLatency"
                  min="1"
                  max="1440"
                  value={validationSettings.maxDataLatency}
                  onChange={handleValidationChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="consensusThreshold">
                  Consensus Threshold (%)
                </label>
                <input
                  type="number"
                  id="consensusThreshold"
                  name="consensusThreshold"
                  min="50"
                  max="100"
                  value={validationSettings.consensusThreshold}
                  onChange={handleValidationChange}
                />
                <div className="form-hint">
                  Minimum agreement between sources for data acceptance
                </div>
              </div>
            </div>

            <div className="validation-checks-grid">
              <div className="form-group">
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    id="dataIntegrityChecks"
                    name="dataIntegrityChecks"
                    checked={validationSettings.dataIntegrityChecks}
                    onChange={handleValidationChange}
                  />
                  <label htmlFor="dataIntegrityChecks">
                    Data Integrity Checks
                  </label>
                </div>
                <div className="form-hint">
                  Verify data completeness and format consistency
                </div>
              </div>

              <div className="form-group">
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    id="crossReferenceValidation"
                    name="crossReferenceValidation"
                    checked={validationSettings.crossReferenceValidation}
                    onChange={handleValidationChange}
                  />
                  <label htmlFor="crossReferenceValidation">
                    Cross-Reference Validation
                  </label>
                </div>
                <div className="form-hint">
                  Compare data across multiple sources
                </div>
              </div>

              <div className="form-group">
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    id="temporalConsistencyCheck"
                    name="temporalConsistencyCheck"
                    checked={validationSettings.temporalConsistencyCheck}
                    onChange={handleValidationChange}
                  />
                  <label htmlFor="temporalConsistencyCheck">
                    Temporal Consistency
                  </label>
                </div>
                <div className="form-hint">
                  Check for realistic temporal patterns
                </div>
              </div>

              <div className="form-group">
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    id="spatialConsistencyCheck"
                    name="spatialConsistencyCheck"
                    checked={validationSettings.spatialConsistencyCheck}
                    onChange={handleValidationChange}
                  />
                  <label htmlFor="spatialConsistencyCheck">
                    Spatial Consistency
                  </label>
                </div>
                <div className="form-hint">
                  Validate geographic data relationships
                </div>
              </div>

              <div className="form-group">
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    id="outlierDetection"
                    name="outlierDetection"
                    checked={validationSettings.outlierDetection}
                    onChange={handleValidationChange}
                  />
                  <label htmlFor="outlierDetection">Outlier Detection</label>
                </div>
                <div className="form-hint">
                  Identify and filter statistical outliers
                </div>
              </div>

              <div className="form-group">
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    id="requireMultipleSources"
                    name="requireMultipleSources"
                    checked={validationSettings.requireMultipleSources}
                    onChange={handleValidationChange}
                  />
                  <label htmlFor="requireMultipleSources">
                    Require Multiple Sources
                  </label>
                </div>
                <div className="form-hint">
                  Require confirmation from multiple data sources
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Processing Settings */}
        <div className="settings-section">
          <h3>Data Processing & Storage</h3>
          <form className="processing-settings-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="batchProcessingInterval">
                  Batch Processing Interval (minutes)
                </label>
                <input
                  type="number"
                  id="batchProcessingInterval"
                  name="batchProcessingInterval"
                  min="1"
                  max="1440"
                  value={processingSettings.batchProcessingInterval}
                  onChange={handleProcessingChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="storageRetention">
                  Storage Retention (days)
                </label>
                <input
                  type="number"
                  id="storageRetention"
                  name="storageRetention"
                  min="30"
                  max="3650"
                  value={processingSettings.storageRetention}
                  onChange={handleProcessingChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dataAggregationLevel">
                  Data Aggregation Level
                </label>
                <select
                  id="dataAggregationLevel"
                  name="dataAggregationLevel"
                  value={processingSettings.dataAggregationLevel}
                  onChange={handleProcessingChange}
                >
                  <option value="raw">Raw Data Only</option>
                  <option value="low">Low Aggregation</option>
                  <option value="medium">Medium Aggregation</option>
                  <option value="high">High Aggregation</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="backupFrequency">Backup Frequency</label>
                <select
                  id="backupFrequency"
                  name="backupFrequency"
                  value={processingSettings.backupFrequency}
                  onChange={handleProcessingChange}
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div className="processing-options-grid">
              <div className="form-group">
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    id="realTimeProcessing"
                    name="realTimeProcessing"
                    checked={processingSettings.realTimeProcessing}
                    onChange={handleProcessingChange}
                  />
                  <label htmlFor="realTimeProcessing">
                    Real-Time Processing
                  </label>
                </div>
                <div className="form-hint">Process data as it arrives</div>
              </div>

              <div className="form-group">
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    id="compressionEnabled"
                    name="compressionEnabled"
                    checked={processingSettings.compressionEnabled}
                    onChange={handleProcessingChange}
                  />
                  <label htmlFor="compressionEnabled">Data Compression</label>
                </div>
                <div className="form-hint">
                  Compress stored data to save space
                </div>
              </div>

              <div className="form-group">
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    id="encryptionEnabled"
                    name="encryptionEnabled"
                    checked={processingSettings.encryptionEnabled}
                    onChange={handleProcessingChange}
                  />
                  <label htmlFor="encryptionEnabled">Data Encryption</label>
                </div>
                <div className="form-hint">
                  Encrypt sensitive environmental data
                </div>
              </div>

              <div className="form-group">
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    id="redundantStorage"
                    name="redundantStorage"
                    checked={processingSettings.redundantStorage}
                    onChange={handleProcessingChange}
                  />
                  <label htmlFor="redundantStorage">Redundant Storage</label>
                </div>
                <div className="form-hint">
                  Store data across multiple locations
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="settings-action-buttons">
          <button
            type="button"
            className="save-button"
            onClick={handleSaveSettings}
            disabled={loading}
          >
            <i className="bi bi-save"></i> Save Environmental Settings
          </button>
          <button type="button" className="test-all-button" disabled={loading}>
            <i className="bi bi-check-circle"></i> Test All Sources
          </button>
        </div>

        {/* Snackbar */}
        {snackbar.open && (
          <div className={`snackbar ${snackbar.severity}`}>
            {snackbar.message}
            <button onClick={() => setSnackbar({ ...snackbar, open: false })}>
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnvironmentalDataPage;
