import React, { useState, useEffect } from 'react';
import { WrfButton, WrfInput, WrfSelect } from '../../DesignSystem';
import DemoSurfaceGate from '../../common/DemoSurfaceGate';

// frontend#352: in the demo build this sample's actions are disabled; none of
// them reached a backend, and several reported success after a timer.
const SAMPLE_ACTION = 'Sample only: no validation request is created.';

/**
 * NFT Oracle Integration Component
 *
 * This component integrates Story Protocol's NFT Oracle for validating
 * real-world weather data in the Wrfcoin ecosystem.
 *
 * Key features:
 * - Real-world data validation
 * - Sensor data attestation
 * - Oracle network for weather data
 * - Verification of weather models
 */
function NFTOracleSample() {
  const [validationRequests, setValidationRequests] = useState([]);
  const [activeValidations, setActiveValidations] = useState([]);
  const [completedValidations, setCompletedValidations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newRequest, setNewRequest] = useState({
    datasetName: '',
    dataType: 'TEMPERATURE',
    dataSource: 'WEATHER_STATION',
    region: 'NORTH_AMERICA',
    timeframe: 'LAST_24_HOURS',
  });

  // Data types
  const dataTypes = [
    { id: 'TEMPERATURE', name: 'Temperature' },
    { id: 'PRECIPITATION', name: 'Precipitation' },
    { id: 'HUMIDITY', name: 'Humidity' },
    { id: 'WIND_SPEED', name: 'Wind Speed' },
    { id: 'ATMOSPHERIC_PRESSURE', name: 'Atmospheric Pressure' },
  ];

  // Data sources
  const dataSources = [
    { id: 'WEATHER_STATION', name: 'Weather Station Network' },
    { id: 'SATELLITE', name: 'Satellite Imagery' },
    { id: 'RADAR', name: 'Weather Radar' },
    { id: 'BUOY', name: 'Ocean Buoy Network' },
    { id: 'AIRCRAFT', name: 'Aircraft Observations' },
  ];

  // Regions
  const regions = [
    { id: 'GLOBAL', name: 'Global' },
    { id: 'NORTH_AMERICA', name: 'North America' },
    { id: 'SOUTH_AMERICA', name: 'South America' },
    { id: 'EUROPE', name: 'Europe' },
    { id: 'ASIA', name: 'Asia' },
    { id: 'AFRICA', name: 'Africa' },
    { id: 'OCEANIA', name: 'Oceania' },
    { id: 'ARCTIC', name: 'Arctic' },
    { id: 'ANTARCTIC', name: 'Antarctic' },
  ];

  // Timeframes
  const timeframes = [
    { id: 'LAST_HOUR', name: 'Last Hour' },
    { id: 'LAST_24_HOURS', name: 'Last 24 Hours' },
    { id: 'LAST_WEEK', name: 'Last Week' },
    { id: 'LAST_MONTH', name: 'Last Month' },
    { id: 'CUSTOM', name: 'Custom Range' },
  ];

  // Load mock validation data
  useEffect(() => {
    // Simulating API call to NFT Oracle
    setTimeout(() => {
      const mockValidations = [
        {
          id: 'val-001',
          datasetName: 'North American Temperature Dataset',
          dataType: 'TEMPERATURE',
          dataSource: 'WEATHER_STATION',
          region: 'NORTH_AMERICA',
          timeframe: 'LAST_MONTH',
          status: 'PENDING',
          requestedBy: 'research_user',
          requestedAt: '2025-05-16T18:30:22Z',
          oracles: 5,
          confirmedOracles: 2,
        },
        {
          id: 'val-002',
          datasetName: 'Global Precipitation Analysis',
          dataType: 'PRECIPITATION',
          dataSource: 'SATELLITE',
          region: 'GLOBAL',
          timeframe: 'LAST_WEEK',
          status: 'IN_PROGRESS',
          requestedBy: 'data_curator',
          requestedAt: '2025-05-17T09:15:45Z',
          oracles: 7,
          confirmedOracles: 4,
        },
        {
          id: 'val-003',
          datasetName: 'European Wind Speed Measurements',
          dataType: 'WIND_SPEED',
          dataSource: 'WEATHER_STATION',
          region: 'EUROPE',
          timeframe: 'LAST_24_HOURS',
          status: 'COMPLETED',
          requestedBy: 'climate_scientist',
          requestedAt: '2025-05-15T14:22:10Z',
          completedAt: '2025-05-16T02:45:33Z',
          oracles: 5,
          confirmedOracles: 5,
          result: 'VALIDATED',
          confidence: 0.96,
          ipfsHash: 'Qm9s23dj8fhs7dhf7shd7',
          transactionId: 'tx582hjs8d',
        },
        {
          id: 'val-004',
          datasetName: 'Pacific Ocean Pressure Readings',
          dataType: 'ATMOSPHERIC_PRESSURE',
          dataSource: 'BUOY',
          region: 'OCEANIA',
          timeframe: 'LAST_WEEK',
          status: 'COMPLETED',
          requestedBy: 'ocean_researcher',
          requestedAt: '2025-05-14T11:08:22Z',
          completedAt: '2025-05-15T16:32:45Z',
          oracles: 6,
          confirmedOracles: 4,
          result: 'REJECTED',
          confidence: 0.62,
          ipfsHash: 'Qm8fd72jd82jd82j8d2',
          transactionId: 'tx8329hs72',
        },
      ];

      setValidationRequests(mockValidations);

      // Filter by status
      setActiveValidations(
        mockValidations.filter(v =>
          ['PENDING', 'IN_PROGRESS'].includes(v.status),
        ),
      );
      setCompletedValidations(
        mockValidations.filter(v => v.status === 'COMPLETED'),
      );

      setLoading(false);
    }, 1000);
  }, []);

  // Handle input changes
  const handleInputChange = e => {
    const { name, value } = e.target;
    setNewRequest(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Submit validation request
  const handleSubmitRequest = e => {
    e.preventDefault();

    // Validate form
    if (!newRequest.datasetName.trim()) {
      alert('Please enter a dataset name');
      return;
    }

    setLoading(true);

    // Simulate API call to create validation request
    setTimeout(() => {
      const newValidation = {
        id: `val-${Math.floor(Math.random() * 1000)}`,
        ...newRequest,
        status: 'PENDING',
        requestedBy: 'current_user',
        requestedAt: new Date().toISOString(),
        oracles: 5,
        confirmedOracles: 0,
      };

      setValidationRequests(prev => [...prev, newValidation]);
      setActiveValidations(prev => [...prev, newValidation]);

      setNewRequest({
        datasetName: '',
        dataType: 'TEMPERATURE',
        dataSource: 'WEATHER_STATION',
        region: 'NORTH_AMERICA',
        timeframe: 'LAST_24_HOURS',
      });

      setLoading(false);
    }, 1500);
  };

  return (
    <div className="nft-oracle-container">
      <h2>NFT Oracle Integration</h2>
      <p className="description">
        Validate real-world weather data using Story Protocol's decentralized
        NFT Oracle network to ensure data accuracy and reliability.
      </p>

      <div className="nft-oracle-content">
        <div className="validation-request-form">
          <h3>Request Data Validation</h3>
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="form-group">
              <label htmlFor="datasetName">Dataset Name</label>
              <WrfInput
                type="text"
                id="datasetName"
                name="datasetName"
                value={newRequest.datasetName}
                onChange={handleInputChange}
                required
                placeholder="e.g., Midwest Temperature Dataset May 2025"
              />
            </div>

            <div className="form-group">
              <label htmlFor="dataType">Data Type</label>
              <WrfSelect
                id="dataType"
                name="dataType"
                value={newRequest.dataType}
                onChange={handleInputChange}
              >
                {dataTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </WrfSelect>
            </div>

            <div className="form-group">
              <label htmlFor="dataSource">Data Source</label>
              <WrfSelect
                id="dataSource"
                name="dataSource"
                value={newRequest.dataSource}
                onChange={handleInputChange}
              >
                {dataSources.map(source => (
                  <option key={source.id} value={source.id}>
                    {source.name}
                  </option>
                ))}
              </WrfSelect>
            </div>

            <div className="form-group">
              <label htmlFor="region">Region</label>
              <WrfSelect
                id="region"
                name="region"
                value={newRequest.region}
                onChange={handleInputChange}
              >
                {regions.map(region => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </WrfSelect>
            </div>

            <div className="form-group">
              <label htmlFor="timeframe">Timeframe</label>
              <WrfSelect
                id="timeframe"
                name="timeframe"
                value={newRequest.timeframe}
                onChange={handleInputChange}
              >
                {timeframes.map(timeframe => (
                  <option key={timeframe.id} value={timeframe.id}>
                    {timeframe.name}
                  </option>
                ))}
              </WrfSelect>
            </div>

            <WrfButton
              type="submit"
              title={SAMPLE_ACTION}
              variant="primary"
              disabled
            >
              {loading ? 'Submitting...' : 'Submit Validation Request'}
            </WrfButton>
          </form>
        </div>

        <div className="validation-status">
          <h3>Active Validation Requests</h3>

          {loading ? (
            <p>Loading validation requests...</p>
          ) : activeValidations.length > 0 ? (
            <div className="validations-grid">
              {activeValidations.map(validation => (
                <div key={validation.id} className="validation-card">
                  <div className="validation-header">
                    <h4>{validation.datasetName}</h4>
                    <span
                      className={`status-badge ${validation.status.toLowerCase()}`}
                    >
                      {validation.status === 'PENDING'
                        ? 'Pending'
                        : 'In Progress'}
                    </span>
                  </div>
                  <div className="validation-details">
                    <span className="detail-item">
                      Data Type:{' '}
                      {dataTypes.find(t => t.id === validation.dataType)
                        ?.name || validation.dataType}
                    </span>
                    <span className="detail-item">
                      Source:{' '}
                      {dataSources.find(s => s.id === validation.dataSource)
                        ?.name || validation.dataSource}
                    </span>
                    <span className="detail-item">
                      Region:{' '}
                      {regions.find(r => r.id === validation.region)?.name ||
                        validation.region}
                    </span>
                    <span className="detail-item">
                      Timeframe:{' '}
                      {timeframes.find(t => t.id === validation.timeframe)
                        ?.name || validation.timeframe}
                    </span>
                    <span className="detail-item">
                      Requested:{' '}
                      {new Date(validation.requestedAt).toLocaleString()}
                    </span>
                    <span className="detail-item">
                      Oracles: {validation.confirmedOracles}/
                      {validation.oracles} confirmed
                    </span>
                  </div>
                  <div className="validation-progress">
                    <div
                      className="progress-bar"
                      style={{
                        width: `${(validation.confirmedOracles / validation.oracles) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No active validation requests at this time.</p>
          )}

          <h3>Completed Validations</h3>

          {loading ? (
            <p>Loading completed validations...</p>
          ) : completedValidations.length > 0 ? (
            <div className="validations-grid">
              {completedValidations.map(validation => (
                <div key={validation.id} className="validation-card completed">
                  <div className="validation-header">
                    <h4>{validation.datasetName}</h4>
                    <span
                      className={`result-badge ${validation.result.toLowerCase()}`}
                    >
                      {validation.result}
                    </span>
                  </div>
                  <div className="validation-details">
                    <span className="detail-item">
                      Data Type:{' '}
                      {dataTypes.find(t => t.id === validation.dataType)
                        ?.name || validation.dataType}
                    </span>
                    <span className="detail-item">
                      Source:{' '}
                      {dataSources.find(s => s.id === validation.dataSource)
                        ?.name || validation.dataSource}
                    </span>
                    <span className="detail-item">
                      Region:{' '}
                      {regions.find(r => r.id === validation.region)?.name ||
                        validation.region}
                    </span>
                    <span className="detail-item">
                      Confidence: {(validation.confidence * 100).toFixed(1)}%
                    </span>
                    <span className="detail-item">
                      Completed:{' '}
                      {new Date(validation.completedAt).toLocaleString()}
                    </span>
                    <span className="detail-item">
                      Transaction: {validation.transactionId.substring(0, 10)}
                      ...
                    </span>
                  </div>
                  <div className="validation-actions">
                    <WrfButton disabled title={SAMPLE_ACTION} variant="outline" size="sm">
                      View Details
                    </WrfButton>
                    <WrfButton disabled title={SAMPLE_ACTION} variant="outline" size="sm">
                      Verify on Chain
                    </WrfButton>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No completed validations yet.</p>
          )}
        </div>
      </div>

      <div className="oracle-features">
        <h3>NFT Oracle Features</h3>
        <div className="features-grid">
          <div className="feature-card">
            <h4>Decentralized Validation</h4>
            <p>
              Validate weather data through a network of independent oracles
            </p>
          </div>
          <div className="feature-card">
            <h4>Real-World Attestation</h4>
            <p>
              Verify sensor data accuracy and consistency against multiple
              sources
            </p>
          </div>
          <div className="feature-card">
            <h4>Confidence Scoring</h4>
            <p>
              Determine data reliability through consensus-based confidence
              scores
            </p>
          </div>
          <div className="feature-card">
            <h4>Immutable Proof</h4>
            <p>Secure validation results on-chain for permanent reference</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// frontend#352: display-only fabricated surface. The default build shows an
// honest not-live state and never mounts the sample.
const NFTOracle = () => (
  <DemoSurfaceGate
    title="The Story Protocol NFT oracle is not live"
    description="No backend route serves or creates NFT oracle validations yet."
    testId="story-nft-oracle"
  >
    <NFTOracleSample />
  </DemoSurfaceGate>
);

export default NFTOracle;
