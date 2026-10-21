import React, { useState, useEffect } from 'react';
import { WrfButton } from '../../DesignSystem';
import DemoSurfaceGate from '../../common/DemoSurfaceGate';

// frontend#352: in the demo build this sample's actions are disabled; none of
// them reached a backend, and several reported success after a timer.
const SAMPLE_ACTION = 'Sample only: provenance is not verified.';

/**
 * Protocol Contracts Integration Component
 *
 * This component integrates Story Protocol's Protocol Contracts for provenance tracking
 * of weather data and computational models in the Wrfcoin ecosystem.
 *
 * Key features:
 * - Data provenance tracking
 * - Verification of data sources
 * - Attribution chain maintenance
 * - Rights management for derived works
 */
function ProtocolContractsSample() {
  const [weatherDatasets, setWeatherDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [provenanceChain, setProvenanceChain] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  // Load mock weather datasets
  useEffect(() => {
    // Simulating API call to get datasets with provenance info
    setTimeout(() => {
      const mockDatasets = [
        {
          id: 'ds-001',
          name: 'Global Temperature Dataset 2023-Q1',
          description: 'Global temperature measurements from NOAA stations',
          owner: 'NOAA',
          created: '2023-04-15',
          lastUpdated: '2023-04-20',
          size: '43.2 GB',
          stations: 1256,
          parameters: ['temperature', 'humidity', 'pressure', 'precipitation'],
          provenance: 'verified',
          licenseType: 'CC BY 4.0',
        },
        {
          id: 'ds-002',
          name: 'Pacific Hurricane Data 2022',
          description: 'Pacific hurricane tracking and intensity data',
          owner: 'NHC',
          created: '2023-01-22',
          lastUpdated: '2023-03-15',
          size: '12.8 GB',
          stations: 108,
          parameters: [
            'wind_speed',
            'pressure',
            'temperature',
            'precipitation',
          ],
          provenance: 'verified',
          licenseType: 'CC BY-NC 4.0',
        },
        {
          id: 'ds-003',
          name: 'European Drought Index 2020-2023',
          description:
            'Drought severity indices across European monitoring stations',
          owner: 'EU Copernicus',
          created: '2023-02-10',
          lastUpdated: '2023-05-01',
          size: '8.4 GB',
          stations: 312,
          parameters: ['soil_moisture', 'precipitation', 'temperature'],
          provenance: 'pending',
          licenseType: 'CC BY 4.0',
        },
      ];

      setWeatherDatasets(mockDatasets);
      setLoading(false);
    }, 1000);
  }, []);

  // Simulate loading the provenance chain when a dataset is selected
  const loadProvenanceChain = datasetId => {
    setVerifying(true);

    // Find the dataset
    const dataset = weatherDatasets.find(ds => ds.id === datasetId);
    if (!dataset) {
      setVerifying(false);
      return;
    }

    setSelectedDataset(dataset);

    // Simulate API call to get provenance chain
    setTimeout(() => {
      let mockProvenanceChain;

      if (dataset.id === 'ds-001') {
        mockProvenanceChain = [
          {
            id: 'prov-001',
            timestamp: '2023-01-05T08:00:00Z',
            action: 'CREATED',
            actor: 'NOAA Data Collection System',
            details: 'Initial raw data collection from 1256 weather stations',
          },
          {
            id: 'prov-002',
            timestamp: '2023-01-15T14:22:10Z',
            action: 'PROCESSED',
            actor: 'NOAA Data Processing Pipeline',
            details: 'Quality control and anomaly detection applied',
          },
          {
            id: 'prov-003',
            timestamp: '2023-02-02T11:45:23Z',
            action: 'PUBLISHED',
            actor: 'NOAA Data Distribution',
            details: 'Dataset published to NOAA public data portal',
          },
          {
            id: 'prov-004',
            timestamp: '2023-04-15T09:12:05Z',
            action: 'IMPORTED',
            actor: 'Wrfcoin Data Curator',
            details:
              'Dataset imported into Wrfcoin with integrity verification',
          },
        ];
      } else if (dataset.id === 'ds-002') {
        mockProvenanceChain = [
          {
            id: 'prov-001',
            timestamp: '2022-12-20T10:30:00Z',
            action: 'CREATED',
            actor: 'NHC Hurricane Tracking System',
            details: 'Initial hurricane tracking data collection',
          },
          {
            id: 'prov-002',
            timestamp: '2023-01-10T08:15:33Z',
            action: 'PROCESSED',
            actor: 'NHC Analysis Team',
            details: 'Post-season analysis and verification',
          },
          {
            id: 'prov-003',
            timestamp: '2023-01-22T15:40:12Z',
            action: 'PUBLISHED',
            actor: 'NHC Data Center',
            details: 'Dataset published to NHC public repository',
          },
        ];
      } else {
        mockProvenanceChain = [
          {
            id: 'prov-001',
            timestamp: '2023-02-10T13:20:15Z',
            action: 'CREATED',
            actor: 'EU Copernicus Program',
            details: 'Initial drought index data compilation',
          },
          {
            id: 'prov-002',
            timestamp: '2023-05-01T09:45:22Z',
            action: 'UPDATED',
            actor: 'EU Copernicus Program',
            details: 'Additional 3 months of data added',
          },
        ];
      }

      setProvenanceChain(mockProvenanceChain);
      setVerifying(false);
    }, 1500);
  };

  // Verify data provenance
  const verifyProvenance = datasetId => {
    setVerifying(true);

    // Simulate verification API call
    setTimeout(() => {
      // Update the dataset's provenance status
      setWeatherDatasets(prevDatasets =>
        prevDatasets.map(dataset =>
          dataset.id === datasetId
            ? { ...dataset, provenance: 'verified' }
            : dataset,
        ),
      );

      setVerifying(false);
    }, 2000);
  };

  return (
    <div className="protocol-contracts-container">
      <h2>Protocol Contracts Integration</h2>
      <p className="description">
        Track the provenance and verify the authenticity of weather data across
        the Wrfcoin ecosystem using Story Protocol's Protocol Contracts.
      </p>

      <div className="protocol-contracts-content">
        <div className="datasets-section">
          <h3>Weather Datasets</h3>

          {loading ? (
            <p>Loading datasets...</p>
          ) : (
            <div className="datasets-grid">
              {weatherDatasets.map(dataset => (
                <div
                  key={dataset.id}
                  className={`dataset-card ${selectedDataset?.id === dataset.id ? 'selected' : ''}`}
                  onClick={() => loadProvenanceChain(dataset.id)}
                >
                  <div className="dataset-header">
                    <h4>{dataset.name}</h4>
                    <span className={`provenance-badge ${dataset.provenance}`}>
                      {dataset.provenance === 'verified'
                        ? '✓ Verified'
                        : '⌛ Pending'}
                    </span>
                  </div>
                  <p className="dataset-description">{dataset.description}</p>
                  <div className="dataset-details">
                    <span className="dataset-owner">
                      Owner: {dataset.owner}
                    </span>
                    <span className="dataset-date">
                      Created: {dataset.created}
                    </span>
                    <span className="dataset-size">Size: {dataset.size}</span>
                    <span className="dataset-stations">
                      Stations: {dataset.stations}
                    </span>
                    <span className="dataset-license">
                      License: {dataset.licenseType}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedDataset && (
          <div className="provenance-section">
            <h3>Provenance Chain for {selectedDataset.name}</h3>

            {verifying ? (
              <p>Loading provenance data...</p>
            ) : (
              <>
                <div className="provenance-actions">
                  <WrfButton
                    variant="primary"
                    disabled title={SAMPLE_ACTION}
                  >
                    {selectedDataset.provenance === 'verified'
                      ? 'Already Verified'
                      : 'Verify Provenance'}
                  </WrfButton>
                </div>

                <div className="provenance-chain">
                  {provenanceChain.map((entry, index) => (
                    <div key={entry.id} className="provenance-entry">
                      <div className="entry-timeline">
                        <div className="timeline-dot"></div>
                        {index < provenanceChain.length - 1 && (
                          <div className="timeline-line"></div>
                        )}
                      </div>
                      <div className="entry-content">
                        <h4>{entry.action}</h4>
                        <p className="entry-details">{entry.details}</p>
                        <div className="entry-meta">
                          <span className="entry-actor">By: {entry.actor}</span>
                          <span className="entry-timestamp">
                            {new Date(entry.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="protocol-features">
        <h3>Protocol Contracts Features</h3>
        <div className="features-grid">
          <div className="feature-card">
            <h4>Data Provenance</h4>
            <p>Track the complete history and origin of all weather datasets</p>
          </div>
          <div className="feature-card">
            <h4>Source Verification</h4>
            <p>
              Verify the authenticity of data sources using cryptographic proofs
            </p>
          </div>
          <div className="feature-card">
            <h4>Attribution Chains</h4>
            <p>Maintain proper attribution for derivative works and analysis</p>
          </div>
          <div className="feature-card">
            <h4>Rights Management</h4>
            <p>Enforce licensing terms and usage rights for weather data</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// frontend#352: display-only fabricated surface. The default build shows an
// honest not-live state and never mounts the sample.
const ProtocolContracts = () => (
  <DemoSurfaceGate
    title="Story Protocol provenance is not live"
    description="No backend route serves dataset provenance chains or verifies them yet."
    testId="story-protocol-contracts"
  >
    <ProtocolContractsSample />
  </DemoSurfaceGate>
);

export default ProtocolContracts;
