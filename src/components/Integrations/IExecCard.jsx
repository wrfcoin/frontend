import React, { useState, useEffect } from 'react';
import { WrfCard, WrfBadge, WrfButton } from '../DesignSystem';
import './IntegrationCards.css';

/**
 * IExecCard Component
 *
 * This component provides integration with iExec's decentralized cloud computing marketplace,
 * allowing users to access computational resources for weather and climate calculations.
 *
 * @param {Object} integrationState - Current state of the iExec integration
 * @param {Function} onRefresh - Function to refresh the integration status
 */
const IExecCard = ({ integrationState, onRefresh }) => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [selectedResource, setSelectedResource] = useState(null);
  const [availableResources, setAvailableResources] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState(null);
  const [runtimeOptions, setRuntimeOptions] = useState([]);
  const [selectedRuntime, setSelectedRuntime] = useState(null);
  const [walletBalance, setWalletBalance] = useState('0.00');
  const [confComputingEnabled, setConfComputingEnabled] = useState(false);

  // Simulate iExec connection
  useEffect(() => {
    const connectToIExec = async () => {
      setConnectionStatus('connecting');

      // Simulate connection delay
      setTimeout(() => {
        setConnectionStatus('connected');

        // Simulate available worker resources
        setAvailableResources([
          {
            id: 'weather-computing-standard',
            name: 'Weather Computing - Standard',
            description: 'Standard compute resources for weather modeling',
            cost: '0.35 RLC',
            provider: 'MeteoCompute',
            category: 'Weather',
            specs: {
              cpu: '8 cores',
              memory: '16 GB',
              disk: '100 GB',
              gpuEnabled: false,
            },
          },
          {
            id: 'climate-computing-advanced',
            name: 'Climate Computing - Advanced',
            description: 'High-performance resources for climate simulations',
            cost: '1.20 RLC',
            provider: 'ClimateNodes',
            category: 'Climate',
            specs: {
              cpu: '32 cores',
              memory: '64 GB',
              disk: '500 GB',
              gpuEnabled: true,
            },
          },
          {
            id: 'air-quality-computing',
            name: 'Air Quality Computing',
            description: 'Specialized resources for air quality modeling',
            cost: '0.25 RLC',
            provider: 'AirQualityCluster',
            category: 'Air Quality',
            specs: {
              cpu: '4 cores',
              memory: '8 GB',
              disk: '50 GB',
              gpuEnabled: false,
            },
          },
          {
            id: 'tee-secure-computing',
            name: 'TEE Secure Computing',
            description:
              'Confidential computing with Trusted Execution Environment',
            cost: '0.60 RLC',
            provider: 'iExec Secure Workers',
            category: 'Secure',
            specs: {
              cpu: '16 cores',
              memory: '32 GB',
              disk: '200 GB',
              gpuEnabled: false,
              teeEnabled: true,
            },
          },
        ]);

        // Simulate runtime options
        setRuntimeOptions([
          {
            id: 'wrf-model',
            name: 'WRF Weather Model',
            version: '4.3.1',
            description: 'Weather Research and Forecasting Model',
          },
          {
            id: 'cesm-model',
            name: 'CESM',
            version: '2.1.3',
            description: 'Community Earth System Model',
          },
          {
            id: 'cmaq-model',
            name: 'CMAQ',
            version: '5.3.2',
            description: 'Community Multiscale Air Quality Model',
          },
          {
            id: 'custom-container',
            name: 'Custom Container',
            version: 'latest',
            description: 'Upload your own Docker container',
          },
        ]);

        // Simulate wallet balance
        setWalletBalance('43.75');
      }, 1500);
    };

    if (integrationState === 'testnet' || integrationState === 'on') {
      connectToIExec();
    }
  }, [integrationState]);

  // Handle resource selection
  const handleResourceSelect = resource => {
    setSelectedResource(resource);
  };

  // Handle runtime selection
  const handleRuntimeSelect = runtime => {
    setSelectedRuntime(runtime);
  };

  // Toggle confidential computing
  const toggleConfComputing = () => {
    setConfComputingEnabled(!confComputingEnabled);
  };

  // Handle job submission
  const handleSubmitJob = async () => {
    if (!selectedResource || !selectedRuntime) return;

    setIsProcessing(true);
    setProcessResult(null);

    // Simulate job processing
    setTimeout(() => {
      setIsProcessing(false);

      // Generate mock result based on selected resource and runtime
      const result = {
        jobId: `iexec-${Math.random().toString(36).substr(2, 9)}`,
        status: 'COMPLETED',
        resource: selectedResource,
        runtime: selectedRuntime,
        timestamp: new Date().toISOString(),
        duration: Math.floor(Math.random() * 600 + 120), // 2-10 minutes in seconds
        usedResources: {
          cpu: `${Math.floor(Math.random() * 95 + 5)}%`,
          memory: `${Math.floor(Math.random() * 80 + 20)}%`,
          storage: `${Math.floor(Math.random() * 50 + 10)}%`,
        },
        costDetails: {
          compute: parseFloat((Math.random() * 0.2 + 0.1).toFixed(4)),
          storage: parseFloat((Math.random() * 0.05 + 0.01).toFixed(4)),
          network: parseFloat((Math.random() * 0.03 + 0.01).toFixed(4)),
          total: 0,
        },
        resultData: {
          type:
            selectedRuntime.id === 'wrf-model'
              ? 'WEATHER_FORECAST'
              : selectedRuntime.id === 'cesm-model'
                ? 'CLIMATE_SIMULATION'
                : selectedRuntime.id === 'cmaq-model'
                  ? 'AIR_QUALITY_MODEL'
                  : 'CUSTOM_COMPUTATION',
          output: {
            success: true,
            files: [
              {
                name: 'result_data.nc',
                size: '142 MB',
                uri: 'ipfs://QmT8jkR3u4Z1YL5FgmP9EWxHj45W',
              },
              {
                name: 'metadata.json',
                size: '24 KB',
                uri: 'ipfs://QmT8jkR3u4Z1YL5FgmP9EWxHj45X',
              },
              {
                name: 'visualization.png',
                size: '2.3 MB',
                uri: 'ipfs://QmT8jkR3u4Z1YL5FgmP9EWxHj45Y',
              },
            ],
            dataPoints: Math.floor(Math.random() * 50000 + 10000),
            resolution: selectedResource.id.includes('advanced')
              ? 'high'
              : 'standard',
            confidentialComputing: confComputingEnabled,
          },
        },
      };

      // Calculate total cost
      result.costDetails.total = (
        result.costDetails.compute +
        result.costDetails.storage +
        result.costDetails.network
      ).toFixed(4);

      setProcessResult(result);

      // Simulate token balance reduction
      const cost = parseFloat(selectedResource.cost.split(' ')[0]);
      setWalletBalance(prevBalance => {
        const newBalance = (parseFloat(prevBalance) - cost).toFixed(2);
        return newBalance;
      });
    }, 4000);
  };

  // Reset processing state
  const handleReset = () => {
    setSelectedResource(null);
    setSelectedRuntime(null);
    setProcessResult(null);
    setConfComputingEnabled(false);
  };

  if (integrationState === 'off') {
    return (
      <WrfCard
        className="integration-card iexec-card"
        headerTitle={
          <span>
            <i className="bi bi-cpu"></i> iExec Blockchain Computing
            <WrfBadge color="danger">Offline</WrfBadge>
          </span>
        }
      >
        <p>Decentralized cloud computing resources are currently disabled</p>
        <p>
          Enable iExec integration in the governance settings to access
          decentralized computing resources for weather and climate
          computations.
        </p>
      </WrfCard>
    );
  }

  return (
    <WrfCard
      className="integration-card iexec-card"
      headerTitle={
        <span>
          <i className="bi bi-cpu"></i> iExec Blockchain Computing
          {integrationState === 'testnet' && (
            <WrfBadge color="warning">Testnet</WrfBadge>
          )}
          {integrationState === 'on' && (
            <WrfBadge color="success">Mainnet</WrfBadge>
          )}
        </span>
      }
    >
      <div className="card-subtitle">
        <p>
          Access decentralized computing resources for weather and climate
          computations
        </p>
      </div>
      <div>
        <div className="connection-status">
          {connectionStatus === 'disconnected' && (
            <div className="status-disconnected">
              <i className="bi bi-x-circle"></i> Disconnected from iExec network
            </div>
          )}
          {connectionStatus === 'connecting' && (
            <div className="status-connecting">
              <i className="bi bi-arrow-repeat spinning"></i> Connecting to
              iExec network...
            </div>
          )}
          {connectionStatus === 'connected' && (
            <div className="status-connected">
              <i className="bi bi-check-circle"></i> Connected to iExec network
              <div style={{ marginLeft: 'auto' }}>
                <i className="bi bi-coin"></i> {walletBalance} RLC
              </div>
            </div>
          )}
          {isProcessing && (
            <div className="status-processing">
              <i className="bi bi-arrow-repeat spinning"></i> Processing
              computational job...
            </div>
          )}
        </div>

        {connectionStatus === 'connected' && !processResult && (
          <>
            <div className="resources-section">
              <h4>Available Computing Resources</h4>
              <div className="resources-list">
                {availableResources.map(resource => (
                  <div
                    key={resource.id}
                    className={`resource-item ${selectedResource?.id === resource.id ? 'selected' : ''}`}
                    onClick={() => handleResourceSelect(resource)}
                  >
                    <div className="resource-name">
                      <i className="bi bi-hdd-rack"></i>
                      {resource.name}
                    </div>
                    <div className="resource-description">
                      {resource.description}
                    </div>
                    <div className="resource-specs">
                      <span>
                        <i className="bi bi-cpu"></i> {resource.specs.cpu}
                      </span>
                      <span>
                        <i className="bi bi-memory"></i> {resource.specs.memory}
                      </span>
                      {resource.specs.gpuEnabled && (
                        <span>
                          <i className="bi bi-gpu-card"></i> GPU
                        </span>
                      )}
                      {resource.specs.teeEnabled && (
                        <span>
                          <i className="bi bi-shield-lock"></i> TEE
                        </span>
                      )}
                    </div>
                    <div className="resource-provider">
                      <span>
                        <i className="bi bi-building"></i> {resource.provider}
                      </span>
                      <span>
                        <i className="bi bi-tag"></i> {resource.cost}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedResource && (
              <div className="runtime-section">
                <h4>Select Runtime Environment</h4>
                <div className="runtime-list">
                  {runtimeOptions.map(runtime => (
                    <div
                      key={runtime.id}
                      className={`runtime-item ${selectedRuntime?.id === runtime.id ? 'selected' : ''}`}
                      onClick={() => handleRuntimeSelect(runtime)}
                    >
                      <div className="runtime-name">
                        <i className="bi bi-gear"></i>
                        {runtime.name}{' '}
                        <span className="runtime-version">
                          {runtime.version}
                        </span>
                      </div>
                      <div className="runtime-description">
                        {runtime.description}
                      </div>
                    </div>
                  ))}
                </div>

                {selectedResource.specs.teeEnabled && (
                  <div className="confidential-computing-toggle">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={confComputingEnabled}
                        onChange={toggleConfComputing}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    <span>Enable Confidential Computing (TEE)</span>
                    <i
                      className="bi bi-info-circle"
                      title="Protect sensitive data using Trusted Execution Environment"
                    ></i>
                  </div>
                )}
              </div>
            )}

            <div className="job-actions">
              <WrfButton
                variant="primary"
                disabled={!selectedResource || !selectedRuntime}
                onClick={handleSubmitJob}
              >
                <i className="bi bi-play-fill"></i>
                Submit Job
              </WrfButton>
              <WrfButton
                variant="secondary"
                onClick={handleReset}
                disabled={!selectedResource && !selectedRuntime}
              >
                <i className="bi bi-x"></i>
                Cancel
              </WrfButton>
            </div>
          </>
        )}

        {processResult && (
          <div className="job-result">
            <h4>Computation Result</h4>
            <div className="result-header">
              <span className="result-title">
                {processResult.resultData.type === 'WEATHER_FORECAST' &&
                  'Weather Forecast Computation'}
                {processResult.resultData.type === 'CLIMATE_SIMULATION' &&
                  'Climate Simulation Computation'}
                {processResult.resultData.type === 'AIR_QUALITY_MODEL' &&
                  'Air Quality Model Computation'}
                {processResult.resultData.type === 'CUSTOM_COMPUTATION' &&
                  'Custom Computation'}
              </span>
              <span className="result-timestamp">
                {new Date(processResult.timestamp).toLocaleString()}
              </span>
            </div>

            <div className="result-data">
              <div className="integration-info">
                <div className="info-item">
                  <div className="info-label">Job ID:</div>
                  <div className="info-value">{processResult.jobId}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Status:</div>
                  <div className="info-value status-success">
                    {processResult.status}
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-label">Duration:</div>
                  <div className="info-value">
                    {processResult.duration} seconds
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-label">Data Points:</div>
                  <div className="info-value">
                    {processResult.resultData.output.dataPoints.toLocaleString()}
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-label">Resolution:</div>
                  <div className="info-value">
                    {processResult.resultData.output.resolution}
                  </div>
                </div>
                {processResult.resultData.output.confidentialComputing && (
                  <div className="info-item">
                    <div className="info-label">Security:</div>
                    <div className="info-value">
                      <i className="bi bi-shield-lock"></i> Confidential
                      Computing Enabled
                    </div>
                  </div>
                )}
              </div>

              <div className="result-files">
                <h5>Output Files</h5>
                <table className="files-table">
                  <thead>
                    <tr>
                      <th>Filename</th>
                      <th>Size</th>
                      <th>URI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processResult.resultData.output.files.map(
                      (file, index) => (
                        <tr key={index}>
                          <td>{file.name}</td>
                          <td>{file.size}</td>
                          <td className="file-uri">{file.uri}</td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>

              <div className="resource-usage">
                <h5>Resource Usage</h5>
                <div className="usage-gauges">
                  <div className="usage-gauge">
                    <div className="gauge-label">CPU</div>
                    <div className="gauge-value">
                      {processResult.usedResources.cpu}
                    </div>
                  </div>
                  <div className="usage-gauge">
                    <div className="gauge-label">Memory</div>
                    <div className="gauge-value">
                      {processResult.usedResources.memory}
                    </div>
                  </div>
                  <div className="usage-gauge">
                    <div className="gauge-label">Storage</div>
                    <div className="gauge-value">
                      {processResult.usedResources.storage}
                    </div>
                  </div>
                </div>
              </div>

              <div className="cost-details">
                <h5>Cost Breakdown</h5>
                <div className="cost-items">
                  <div className="cost-item">
                    <div className="cost-label">Compute:</div>
                    <div className="cost-value">
                      {processResult.costDetails.compute} RLC
                    </div>
                  </div>
                  <div className="cost-item">
                    <div className="cost-label">Storage:</div>
                    <div className="cost-value">
                      {processResult.costDetails.storage} RLC
                    </div>
                  </div>
                  <div className="cost-item">
                    <div className="cost-label">Network:</div>
                    <div className="cost-value">
                      {processResult.costDetails.network} RLC
                    </div>
                  </div>
                  <div className="cost-item total">
                    <div className="cost-label">Total:</div>
                    <div className="cost-value">
                      {processResult.costDetails.total} RLC
                    </div>
                  </div>
                </div>
              </div>

              <div className="job-actions" style={{ marginTop: '15px' }}>
                <WrfButton
                  variant="primary"
                  onClick={handleReset}
                >
                  <i className="bi bi-arrow-counterclockwise"></i>
                  New Computation
                </WrfButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </WrfCard>
  );
};

export default IExecCard;
