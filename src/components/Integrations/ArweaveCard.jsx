import React, { useState, useEffect } from 'react';
import { WrfBadge, WrfButton } from '../DesignSystem';
import './IntegrationCards.css';

/**
 * ArweaveCard Component
 *
 * This component provides integration with Arweave's permanent data storage,
 * allowing for immutable climate and weather data storage.
 */
const ArweaveCard = ({ integrationState = 'off' }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [walletBalance, setWalletBalance] = useState('0.00');
  const [storedFiles, setStoredFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Connect to Arweave network
  useEffect(() => {
    if (integrationState === 'on' || integrationState === 'testnet') {
      setConnectionStatus('connecting');

      // Simulate connection delay
      const timer = setTimeout(() => {
        setConnectionStatus('connected');
        setWalletBalance('12.76');

        // Mock stored files
        setStoredFiles([
          {
            id: 'ar://7sA4vX3_ZyGfMmjY7Oy3mvAFxJH12dgkJLD-UJN3W8o',
            name: 'global-climate-dataset-2025-q1.nc',
            type: 'netCDF',
            size: '156.4 MB',
            timestamp: new Date('2025-04-21T09:43:12Z'),
            txId: 'NrY6X9vNPCTZfX_vNpb7-F-lhqUQTp5CCmqbbbcbxb8',
          },
          {
            id: 'ar://KfDuTw4_G3XWkwb_VJyCMrHwMnDMf2n-XkgmxPjJYsY',
            name: 'us-weather-stations-metadata.json',
            type: 'JSON',
            size: '8.7 MB',
            timestamp: new Date('2025-04-15T14:22:45Z'),
            txId: 'cplrWA1Qb8ugDPkKXTcvn-uDpvFk31SDMxE0x_C2eVU',
          },
          {
            id: 'ar://4t7YdPrN5Z9IbQ7qxcu-wJV1Ycx3K_rB2nGXNgLo1NA',
            name: 'satellite-imagery-pacific-2025-03.zip',
            type: 'ZIP',
            size: '879.2 MB',
            timestamp: new Date('2025-03-28T06:31:09Z'),
            txId: 'BuyIQ5K4jrtw3lW7MJ7Qi5cFHLUDfmTf4ylFH_-0K-g',
          },
        ]);
      }, 1500);

      return () => clearTimeout(timer);
    } else {
      setConnectionStatus('disconnected');
    }
  }, [integrationState]);

  // Handle file upload simulation
  const handleUpload = () => {
    setIsUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);

          // Add new file to stored files
          const newFile = {
            id: 'ar://9xZ2vP3_QmYtsBuC7Jd6bvLMnp342avfRDL-KJF8Y9q',
            name: 'climate-model-output-2025-05.nc',
            type: 'netCDF',
            size: '245.8 MB',
            timestamp: new Date(),
            txId: 'XpL4Q8J6frtw3lR2MK5Qi7cGLPAWfmTg2ylVH_-9B-h',
          };

          setStoredFiles(prev => [newFile, ...prev]);

          return 0;
        }
        return prev + 5;
      });
    }, 300);

    return () => clearInterval(interval);
  };

  // Render Overview Tab
  const renderOverviewTab = () => (
    <div className="tab-content">
      <div className="connection-status">
        <div className={`status-indicator ${connectionStatus}`}></div>
        <div className="status-text">
          {connectionStatus === 'disconnected' && 'Disconnected from Arweave'}
          {connectionStatus === 'connecting' && 'Connecting to Arweave...'}
          {connectionStatus === 'connected' && 'Connected to Arweave'}
        </div>
        {connectionStatus === 'connected' && (
          <div className="wallet-balance">
            <i className="bi bi-wallet2"></i>
            <span>{walletBalance} AR</span>
          </div>
        )}
      </div>

      <div className="integration-info">
        <div className="info-item">
          <div className="info-label">Network</div>
          <div className="info-value">
            {integrationState === 'testnet'
              ? 'Testnet'
              : integrationState === 'on'
                ? 'Mainnet'
                : 'Offline'}
          </div>
        </div>
        <div className="info-item">
          <div className="info-label">Storage Type</div>
          <div className="info-value">Permanent</div>
        </div>
        <div className="info-item">
          <div className="info-label">Protocol</div>
          <div className="info-value">Arweave</div>
        </div>
        <div className="info-item">
          <div className="info-label">Files Stored</div>
          <div className="info-value">
            {connectionStatus === 'connected' ? storedFiles.length : '0'}
          </div>
        </div>
      </div>

      <div className="integration-description">
        <h4>About Arweave</h4>
        <p>
          Arweave is a decentralized storage network that enables permanent data
          storage. Climate and weather data stored on Arweave remains forever
          accessible, creating an immutable historical record for future
          research and verification.
        </p>
      </div>
    </div>
  );

  // Render Storage Explorer Tab
  const renderExplorerTab = () => (
    <div className="tab-content">
      <div className="data-explorer">
        <div className="explorer-header">
          <h4>Permanent Data Storage</h4>
          <WrfButton
            variant="primary"
            size="sm"
            onClick={handleUpload}
            disabled={isUploading || connectionStatus !== 'connected'}
          >
            <i className="bi bi-cloud-upload"></i> Upload New Data
          </WrfButton>
        </div>

        {isUploading && (
          <div className="upload-progress">
            <div className="progress">
              <div
                className="progress-bar"
                role="progressbar"
                style={{ width: `${uploadProgress}%` }}
                aria-valuenow={uploadProgress}
                aria-valuemin="0"
                aria-valuemax="100"
              >
                {uploadProgress}%
              </div>
            </div>
            <div className="upload-text">Uploading to Arweave...</div>
          </div>
        )}

        {connectionStatus === 'connected' ? (
          <div className="file-list">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Upload Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {storedFiles.map(file => (
                  <tr key={file.id}>
                    <td className="file-name">
                      <i className="bi bi-file-earmark"></i>
                      {file.name}
                    </td>
                    <td>{file.type}</td>
                    <td>{file.size}</td>
                    <td>{file.timestamp.toLocaleString()}</td>
                    <td className="file-actions">
                      <WrfButton variant="outlined" size="sm">
                        <i className="bi bi-download"></i>
                      </WrfButton>
                      <WrfButton variant="outlined" size="sm">
                        <i className="bi bi-info-circle"></i>
                      </WrfButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-connection">
            <i className="bi bi-exclamation-triangle"></i>
            <p>Not connected to Arweave network</p>
          </div>
        )}
      </div>
    </div>
  );

  // Render Permanence Tab
  const renderPermanenceTab = () => (
    <div className="tab-content">
      <div className="permanence-info">
        <h4>Data Permanence</h4>
        <p>
          Arweave enables truly permanent data storage by using a novel
          blockchain mechanism called "Blockweave" and a Proof-of-Access
          consensus mechanism. Climate and weather data stored on Arweave will
          be accessible for hundreds of years.
        </p>

        <div className="permanence-features">
          <div className="feature-item">
            <div className="feature-icon">
              <i className="bi bi-infinity"></i>
            </div>
            <div className="feature-content">
              <h5>Permanent Storage</h5>
              <p>
                One-time payment for permanent storage, ensuring climate data
                remains available forever.
              </p>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon">
              <i className="bi bi-shield-check"></i>
            </div>
            <div className="feature-content">
              <h5>Tamper-Proof</h5>
              <p>
                Immutable climate records that cannot be altered, ensuring data
                integrity.
              </p>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon">
              <i className="bi bi-globe"></i>
            </div>
            <div className="feature-content">
              <h5>Decentralized Access</h5>
              <p>
                Climate data accessible from anywhere in the world through
                multiple gateways.
              </p>
            </div>
          </div>
        </div>

        <div className="permanence-metrics">
          <div className="metric-item">
            <div className="metric-value">200+ years</div>
            <div className="metric-label">Estimated Storage Duration</div>
          </div>
          <div className="metric-item">
            <div className="metric-value">100%</div>
            <div className="metric-label">Data Integrity</div>
          </div>
          <div className="metric-item">
            <div className="metric-value">Global</div>
            <div className="metric-label">Availability</div>
          </div>
        </div>
      </div>
    </div>
  );

  if (integrationState === 'off') {
    return (
      <div className="integration-card arweave-card disabled">
        <div className="card-header">
          <h3>
            <i className="bi bi-infinity"></i> Arweave Permanent Storage
            <WrfBadge color="error">Offline</WrfBadge>
          </h3>
        </div>
        <div className="card-content">
          <p>
            Arweave integration is currently disabled. Enable it in Governance
            settings to store climate and weather data permanently.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="integration-card arweave-card">
      <div className="card-header">
        <h3>
          <i className="bi bi-infinity"></i> Arweave Permanent Storage
          {integrationState === 'testnet' && (
            <WrfBadge color="warning">Testnet</WrfBadge>
          )}
          {integrationState === 'on' && (
            <WrfBadge color="success">Mainnet</WrfBadge>
          )}
        </h3>
        <p>Permanent storage for climate and weather data</p>
      </div>
      <div className="card-content">
        <div className="tabs-container">
          <div className="tabs">
            <div
              className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </div>
            <div
              className={`tab ${activeTab === 'explorer' ? 'active' : ''}`}
              onClick={() => setActiveTab('explorer')}
            >
              Storage Explorer
            </div>
            <div
              className={`tab ${activeTab === 'permanence' ? 'active' : ''}`}
              onClick={() => setActiveTab('permanence')}
            >
              Permanence
            </div>
          </div>
          <div className="tab-content-container">
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'explorer' && renderExplorerTab()}
            {activeTab === 'permanence' && renderPermanenceTab()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArweaveCard;
