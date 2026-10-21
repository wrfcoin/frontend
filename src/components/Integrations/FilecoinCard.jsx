import React, { useState, useEffect } from 'react';
import { WrfBadge, WrfButton } from '../DesignSystem';
import './IntegrationCards.css';

/**
 * FilecoinCard Component
 *
 * This component provides integration with Filecoin's decentralized storage network,
 * allowing for efficient climate and weather data storage.
 */
const FilecoinCard = ({ integrationState = 'off' }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [walletBalance, setWalletBalance] = useState('0.00');
  const [storedFiles, setStoredFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [dealStatus, setDealStatus] = useState([]);

  // Connect to Filecoin network
  useEffect(() => {
    if (integrationState === 'on' || integrationState === 'testnet') {
      setConnectionStatus('connecting');

      // Simulate connection delay
      const timer = setTimeout(() => {
        setConnectionStatus('connected');
        setWalletBalance('35.42');

        // Mock stored files
        setStoredFiles([
          {
            id: 'bafybeicgmdpvw4duutrmdxl4a7gc52sxyuk7nz5gby77afwdteh3jc5bqa',
            name: 'climate-model-results-2025.nc',
            type: 'netCDF',
            size: '1.2 GB',
            timestamp: new Date('2025-05-10T13:24:58Z'),
            dealId: 'f01234567',
            status: 'Active',
          },
          {
            id: 'bafybeibnsoufr2renrk2m7spusxh2zpjbpbaa2iqffs5reg4cyvhhtuws4',
            name: 'weather-station-data-archive.zip',
            type: 'ZIP',
            size: '435 MB',
            timestamp: new Date('2025-04-28T09:12:33Z'),
            dealId: 'f01234568',
            status: 'Active',
          },
          {
            id: 'bafybeihvbxexmluhtebv4locvj77umnsktkt3my4o5euf2lfaauexdfj4q',
            name: 'satellite-imagery-dataset.tar.gz',
            type: 'TAR',
            size: '2.8 GB',
            timestamp: new Date('2025-04-15T16:45:21Z'),
            dealId: 'f01234569',
            status: 'Active',
          },
        ]);

        // Mock deal status
        setDealStatus([
          {
            dealId: 'f01234567',
            provider: 'f0127896',
            startEpoch: 1234560,
            endEpoch: 1454560,
            pricePerEpoch: '0.00000001 FIL',
            totalCost: '2.2 FIL',
            status: 'Active',
            verifiedDeal: true,
          },
          {
            dealId: 'f01234568',
            provider: 'f0128934',
            startEpoch: 1230000,
            endEpoch: 1450000,
            pricePerEpoch: '0.0000001 FIL',
            totalCost: '22 FIL',
            status: 'Active',
            verifiedDeal: true,
          },
          {
            dealId: 'f01234569',
            provider: 'f0129045',
            startEpoch: 1225000,
            endEpoch: 1445000,
            pricePerEpoch: '0.00000015 FIL',
            totalCost: '33 FIL',
            status: 'Active',
            verifiedDeal: false,
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
            id: 'bafybeideq42stultkjeswna6fpqhv2tqejwusr24wzmwoaojtxm2rjjgwu',
            name: 'climate-simulation-output-may2025.nc',
            type: 'netCDF',
            size: '1.8 GB',
            timestamp: new Date(),
            dealId: 'f01234570',
            status: 'Pending',
          };

          setStoredFiles(prev => [newFile, ...prev]);

          // Add new deal
          const newDeal = {
            dealId: 'f01234570',
            provider: 'f0127896',
            startEpoch: 1240000,
            endEpoch: 1460000,
            pricePerEpoch: '0.00000012 FIL',
            totalCost: '26.4 FIL',
            status: 'Pending',
            verifiedDeal: true,
          };

          setDealStatus(prev => [newDeal, ...prev]);

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
          {connectionStatus === 'disconnected' && 'Disconnected from Filecoin'}
          {connectionStatus === 'connecting' && 'Connecting to Filecoin...'}
          {connectionStatus === 'connected' && 'Connected to Filecoin'}
        </div>
        {connectionStatus === 'connected' && (
          <div className="wallet-balance">
            <i className="bi bi-wallet2"></i>
            <span>{walletBalance} FIL</span>
          </div>
        )}
      </div>

      <div className="integration-info">
        <div className="info-item">
          <div className="info-label">Network</div>
          <div className="info-value">
            {integrationState === 'testnet'
              ? 'Hyperspace Testnet'
              : integrationState === 'on'
                ? 'Mainnet'
                : 'Offline'}
          </div>
        </div>
        <div className="info-item">
          <div className="info-label">Storage Type</div>
          <div className="info-value">Decentralized</div>
        </div>
        <div className="info-item">
          <div className="info-label">Protocol</div>
          <div className="info-value">Filecoin</div>
        </div>
        <div className="info-item">
          <div className="info-label">Files Stored</div>
          <div className="info-value">
            {connectionStatus === 'connected' ? storedFiles.length : '0'}
          </div>
        </div>
      </div>

      <div className="integration-description">
        <h4>About Filecoin</h4>
        <p>
          Filecoin is a decentralized storage network designed to store
          humanity's most important information. Climate and weather data stored
          on Filecoin is secured by cryptographic proofs, ensuring it remains
          intact and retrievable over time. The network incentivizes reliable
          storage through a blockchain-based marketplace.
        </p>
      </div>
    </div>
  );

  // Render Storage Explorer Tab
  const renderExplorerTab = () => (
    <div className="tab-content">
      <div className="data-explorer">
        <div className="explorer-header">
          <h4>Decentralized Storage</h4>
          <WrfButton
            variant="primary"
            size="sm"
            onClick={handleUpload}
            disabled={isUploading || connectionStatus !== 'connected'}
          >
            <i className="bi bi-cloud-upload"></i> Create Storage Deal
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
            <div className="upload-text">
              Preparing storage deal on Filecoin...
            </div>
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
                  <th>Deal ID</th>
                  <th>Status</th>
                  <th>Date</th>
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
                    <td>{file.dealId}</td>
                    <td>
                      <span
                        className={`status-badge ${file.status.toLowerCase()}`}
                      >
                        {file.status}
                      </span>
                    </td>
                    <td>{file.timestamp.toLocaleString()}</td>
                    <td className="file-actions">
                      <WrfButton variant="outline" size="sm">
                        <i className="bi bi-download"></i>
                      </WrfButton>
                      <WrfButton variant="outline" size="sm">
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
            <p>Not connected to Filecoin network</p>
          </div>
        )}
      </div>
    </div>
  );

  // Render Deals Tab
  const renderDealsTab = () => (
    <div className="tab-content">
      <div className="deals-container">
        <h4>Storage Deals</h4>
        <p>
          Storage deals are agreements between clients and storage providers
          (miners) on the Filecoin network. These deals ensure climate and
          weather data remains accessible for specified periods.
        </p>

        {connectionStatus === 'connected' ? (
          <div className="deals-list">
            <table className="table">
              <thead>
                <tr>
                  <th>Deal ID</th>
                  <th>Provider</th>
                  <th>Status</th>
                  <th>Start Epoch</th>
                  <th>End Epoch</th>
                  <th>Price</th>
                  <th>Total Cost</th>
                  <th>Verified</th>
                </tr>
              </thead>
              <tbody>
                {dealStatus.map(deal => (
                  <tr key={deal.dealId}>
                    <td>{deal.dealId}</td>
                    <td>{deal.provider}</td>
                    <td>
                      <span
                        className={`status-badge ${deal.status.toLowerCase()}`}
                      >
                        {deal.status}
                      </span>
                    </td>
                    <td>{deal.startEpoch}</td>
                    <td>{deal.endEpoch}</td>
                    <td>{deal.pricePerEpoch}</td>
                    <td>{deal.totalCost}</td>
                    <td>
                      {deal.verifiedDeal ? (
                        <i className="bi bi-check-circle text-success"></i>
                      ) : (
                        <i className="bi bi-x-circle text-muted"></i>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-connection">
            <i className="bi bi-exclamation-triangle"></i>
            <p>Not connected to Filecoin network</p>
          </div>
        )}

        <div className="deals-info">
          <h5>Verified Deals</h5>
          <p>
            Verified deals receive discounted storage rates on the Filecoin
            network, making them ideal for storing climate and weather data.
            These deals require DataCap allocations, which are granted to
            trusted clients storing valuable data.
          </p>

          <div className="datacap-status">
            <div className="status-item">
              <div className="status-label">DataCap Available:</div>
              <div className="status-value">125 TiB</div>
            </div>
            <div className="status-item">
              <div className="status-label">DataCap Used:</div>
              <div className="status-value">4.5 TiB</div>
            </div>
            <div className="status-item">
              <div className="status-label">Allocation Remaining:</div>
              <div className="status-value">120.5 TiB</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (integrationState === 'off') {
    return (
      <div className="integration-card filecoin-card disabled">
        <div className="filecoin-header">
          <h3>
            <i className="bi bi-hdd-network"></i> Filecoin Storage
            <WrfBadge color="danger">Offline</WrfBadge>
          </h3>
        </div>
        <div className="card-content">
          <p>
            Filecoin integration is currently disabled. Enable it in Governance
            settings to store climate and weather data on the decentralized
            network.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="integration-card filecoin-card">
      <div className="filecoin-header">
        <h3>
          <i className="bi bi-hdd-network"></i> Filecoin Storage
          {integrationState === 'testnet' && (
            <WrfBadge color="warning">Testnet</WrfBadge>
          )}
          {integrationState === 'on' && (
            <WrfBadge color="success">Mainnet</WrfBadge>
          )}
        </h3>
        <p>Decentralized storage for climate and weather data</p>
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
              className={`tab ${activeTab === 'deals' ? 'active' : ''}`}
              onClick={() => setActiveTab('deals')}
            >
              Storage Deals
            </div>
          </div>
          <div className="tab-content-container">
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'explorer' && renderExplorerTab()}
            {activeTab === 'deals' && renderDealsTab()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilecoinCard;
