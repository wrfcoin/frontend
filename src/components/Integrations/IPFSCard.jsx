import React, { useState, useEffect } from 'react';
import { WrfButton } from '../DesignSystem';
import './IntegrationCards.css';

const IPFSCard = ({ integrationState }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [ipfsStats, setIpfsStats] = useState({
    storageUsed: 162.8, // MB
    availableSpace: 1024, // MB (1GB free tier)
    bandwidthUsed: 2.34, // GB
    bandwidthLimit: 10, // GB
    filesStored: 42,
    totalPins: 38,
    networkPeers: 15432,
    gatewayStatus: 'online',
    lastSync: new Date().toISOString(),
  });

  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState([
    {
      name: 'weather-models/',
      type: 'directory',
      size: null,
      modified: '3 days ago',
      cid: 'QmX...',
    },
    {
      name: 'climate-dataset-2025-Q1.nc',
      type: 'file',
      size: '78.6 MB',
      modified: '1 day ago',
      cid: 'QmT...',
    },
    {
      name: 'computational-nft-metadata.json',
      type: 'file',
      size: '2.3 KB',
      modified: '6 hours ago',
      cid: 'QmR...',
    },
    {
      name: 'sensor-data/',
      type: 'directory',
      size: null,
      modified: '12 hours ago',
      cid: 'QmY...',
    },
    {
      name: 'air-quality-analysis.csv',
      type: 'file',
      size: '14.2 MB',
      modified: '2 days ago',
      cid: 'QmW...',
    },
  ]);

  const fetchIpfsStats = async () => {
    setIsLoading(true);
    try {
      // In a production environment, this would fetch real data from IPFS
      // For now, we'll simulate a successful API call
      setTimeout(() => {
        setIpfsStats({
          ...ipfsStats,
          lastSync: new Date().toISOString(),
        });
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching IPFS stats:', error);
      setIsLoading(false);
    }
  };

  const renderOverviewTab = () => (
    <div className="integration-card-content">
      <div className="integration-description">
        <p>
          IPFS (InterPlanetary File System) is a protocol and peer-to-peer
          network for storing and sharing data in a distributed file system. The
          Wrfcoin integration with IPFS enables decentralized, content-addressed
          storage for climate data, computational models, and Computational NFT
          assets.
        </p>
      </div>

      <div className="integration-stats">
        <div className="stat-item">
          <i className="bi bi-hdd-stack"></i>
          <div className="stat-info">
            <span className="stat-value">{ipfsStats.filesStored}</span>
            <span className="stat-label">Files Stored</span>
          </div>
        </div>
        <div className="stat-item">
          <i className="bi bi-pin-angle"></i>
          <div className="stat-info">
            <span className="stat-value">{ipfsStats.totalPins}</span>
            <span className="stat-label">Pinned Items</span>
          </div>
        </div>
        <div className="stat-item">
          <i className="bi bi-people"></i>
          <div className="stat-info">
            <span className="stat-value">
              {ipfsStats.networkPeers.toLocaleString()}
            </span>
            <span className="stat-label">Network Peers</span>
          </div>
        </div>
      </div>

      <div className="storage-usage">
        <h4>
          <i className="bi bi-hdd"></i> Storage Usage
        </h4>
        <div className="storage-progress">
          <div
            className="progress-bar"
            style={{
              width: `${(ipfsStats.storageUsed / ipfsStats.availableSpace) * 100}%`,
            }}
          ></div>
        </div>
        <div className="storage-details">
          <div className="storage-detail">
            <span className="detail-label">Used</span>
            <span className="detail-value">
              {ipfsStats.storageUsed.toFixed(1)} MB
            </span>
          </div>
          <div className="storage-detail">
            <span className="detail-label">Available</span>
            <span className="detail-value">{ipfsStats.availableSpace} MB</span>
          </div>
          <div className="storage-detail">
            <span className="detail-label">Files</span>
            <span className="detail-value">{ipfsStats.filesStored}</span>
          </div>
        </div>
      </div>

      <div className="storage-usage" style={{ marginTop: '15px' }}>
        <h4>
          <i className="bi bi-speedometer2"></i> Bandwidth Usage
        </h4>
        <div className="storage-progress">
          <div
            className="progress-bar"
            style={{
              width: `${(ipfsStats.bandwidthUsed / ipfsStats.bandwidthLimit) * 100}%`,
            }}
          ></div>
        </div>
        <div className="storage-details">
          <div className="storage-detail">
            <span className="detail-label">Used</span>
            <span className="detail-value">
              {ipfsStats.bandwidthUsed.toFixed(2)} GB
            </span>
          </div>
          <div className="storage-detail">
            <span className="detail-label">Limit</span>
            <span className="detail-value">{ipfsStats.bandwidthLimit} GB</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderExplorerTab = () => (
    <div className="integration-card-content">
      <div className="content-browser">
        <div className="browser-header">
          <h4>
            <i className="bi bi-search"></i> IPFS Explorer
          </h4>
          <div className="search-box">
            <input type="text" placeholder="Search by CID or filename..." />
            <button>
              <i className="bi bi-search"></i>
            </button>
          </div>
        </div>

        <div className="browser-path">
          <span style={{ opacity: 0.7 }}>ipfs://</span>
          QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn/
        </div>

        <ul className="content-list">
          {files.map((file, index) => (
            <li key={index} className="content-item">
              <div className="content-info">
                <span className="content-name">
                  <i
                    className={
                      file.type === 'directory'
                        ? 'bi bi-folder'
                        : 'bi bi-file-earmark'
                    }
                    style={{ marginRight: '8px' }}
                  ></i>
                  {file.name}
                </span>
                <span className="content-cid">{file.cid}</span>
              </div>
              <div className="content-meta">
                {file.size && <div>{file.size}</div>}
                <div>{file.modified}</div>
              </div>
            </li>
          ))}
        </ul>

        <div className="browser-actions" style={{ marginTop: '15px' }}>
          <WrfButton variant="primary" size="sm">
            <i className="bi bi-cloud-download"></i> Download
          </WrfButton>
          <WrfButton variant="secondary" size="sm">
            <i className="bi bi-pin"></i> Pin
          </WrfButton>
          <WrfButton variant="secondary" size="sm">
            <i className="bi bi-share"></i> Share Gateway Link
          </WrfButton>
        </div>
      </div>
    </div>
  );

  const renderUploaderTab = () => (
    <div className="integration-card-content">
      <div className="uploader">
        <h4>
          <i className="bi bi-cloud-upload"></i> Upload to IPFS
        </h4>

        <div className="upload-area">
          <i className="bi bi-cloud-arrow-up"></i>
          <p>Drag & drop files here</p>
          <span>or</span>
          <WrfButton variant="primary" style={{ marginTop: '10px' }}>
            Browse Files
          </WrfButton>
          <span className="file-note">
            Files will be encrypted and distributed across the IPFS network
          </span>
        </div>

        <div className="pin-options">
          <h5>Pinning Options</h5>
          <div className="option-grid">
            <div className="option">
              <input type="checkbox" id="local-pin" defaultChecked />
              <label htmlFor="local-pin">Pin Locally</label>
            </div>
            <div className="option">
              <input type="checkbox" id="remote-pin" defaultChecked />
              <label htmlFor="remote-pin">Pin to Remote Service</label>
            </div>
            <div className="option">
              <input type="checkbox" id="wrfcoin-gateway" defaultChecked />
              <label htmlFor="wrfcoin-gateway">Use Wrfcoin Gateway</label>
            </div>
            <div className="option">
              <input type="checkbox" id="filecoin-deal" />
              <label htmlFor="filecoin-deal">Create Filecoin Deal</label>
            </div>
          </div>
        </div>

        <WrfButton
          variant="primary"
          style={{ width: '100%', marginTop: '15px' }}
        >
          <i className="bi bi-upload"></i> Upload to IPFS
        </WrfButton>
      </div>
    </div>
  );

  return (
    <div className="integration-card ipfs-card">
      <div className="integration-card-header">
        <div className="integration-logo">
          <i className="bi bi-diagram-3"></i>
        </div>
        <div className="integration-title">
          <h3>IPFS</h3>
          <p>InterPlanetary File System</p>
        </div>
        <div className="integration-status">
          <span className="status-badge active">Connected</span>
          <button
            className="refresh-btn"
            onClick={fetchIpfsStats}
            disabled={isLoading}
          >
            {isLoading ? (
              <i className="bi bi-arrow-repeat spinning"></i>
            ) : (
              <i className="bi bi-arrow-repeat"></i>
            )}
          </button>
        </div>
      </div>

      <div className="integration-card-tabs">
        <div
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <i className="bi bi-info-circle"></i> Overview
        </div>
        <div
          className={`tab ${activeTab === 'explorer' ? 'active' : ''}`}
          onClick={() => setActiveTab('explorer')}
        >
          <i className="bi bi-search"></i> Explorer
        </div>
        <div
          className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <i className="bi bi-cloud-upload"></i> Upload
        </div>
      </div>

      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'explorer' && renderExplorerTab()}
      {activeTab === 'upload' && renderUploaderTab()}

      <div className="integration-card-footer">
        <span className="last-updated">
          Last updated: {new Date(ipfsStats.lastSync).toLocaleString()}
        </span>
      </div>
    </div>
  );
};

export default IPFSCard;
