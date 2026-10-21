import React, { useState, useEffect } from 'react';
import { WrfButton } from '../DesignSystem';
import './IntegrationCards.css';

const StorjCard = ({ integrationState }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [storjStats, setStorjStats] = useState({
    storageUsed: 243.5, // MB
    storageLimit: 1024, // MB (1GB free tier)
    bandwidthUsed: 1.75, // GB
    bandwidthLimit: 10, // GB
    objectsStored: 57,
    nodesOnline: 12840,
    satellitesOnline: 6,
    avgUptime: '99.97%',
    lastSync: new Date().toISOString(),
  });

  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState([
    {
      name: 'global-climate-model.nc',
      size: '124.3 MB',
      type: 'NetCDF',
      modified: '2 days ago',
    },
    {
      name: 'weather-station-data.csv',
      size: '35.7 MB',
      type: 'CSV',
      modified: '5 hours ago',
    },
    { name: 'air-quality-sensors/', type: 'Folder', modified: '1 day ago' },
    {
      name: 'temperature-predictions.json',
      size: '18.2 MB',
      type: 'JSON',
      modified: '3 days ago',
    },
    { name: 'satellite-imagery/', type: 'Folder', modified: '6 days ago' },
  ]);

  const fetchStorjStats = async () => {
    setIsLoading(true);
    try {
      // In a production environment, this would fetch real data from Storj
      // For now, we'll simulate a successful API call
      setTimeout(() => {
        setStorjStats({
          ...storjStats,
          lastSync: new Date().toISOString(),
        });
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching Storj stats:', error);
      setIsLoading(false);
    }
  };

  const renderOverviewTab = () => (
    <div className="integration-card-content">
      <div className="integration-description">
        <p>
          Storj is a decentralized cloud object storage platform that encrypts
          and distributes your files across a global network of nodes. The
          Wrfcoin integration with Storj enables secure, reliable storage for
          computational NFT data, model outputs, and climate datasets.
        </p>
      </div>

      <div className="integration-stats">
        <div className="stat-item">
          <i className="bi bi-hdd-network"></i>
          <div className="stat-info">
            <span className="stat-value">
              {storjStats.nodesOnline.toLocaleString()}
            </span>
            <span className="stat-label">Storage Nodes</span>
          </div>
        </div>
        <div className="stat-item">
          <i className="bi bi-satellite"></i>
          <div className="stat-info">
            <span className="stat-value">{storjStats.satellitesOnline}</span>
            <span className="stat-label">Satellites</span>
          </div>
        </div>
        <div className="stat-item">
          <i className="bi bi-shield-check"></i>
          <div className="stat-info">
            <span className="stat-value">{storjStats.avgUptime}</span>
            <span className="stat-label">Average Uptime</span>
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
              width: `${(storjStats.storageUsed / storjStats.storageLimit) * 100}%`,
            }}
          ></div>
        </div>
        <div className="storage-details">
          <div className="storage-detail">
            <span className="detail-label">Used</span>
            <span className="detail-value">
              {storjStats.storageUsed.toFixed(1)} MB
            </span>
          </div>
          <div className="storage-detail">
            <span className="detail-label">Total</span>
            <span className="detail-value">{storjStats.storageLimit} MB</span>
          </div>
          <div className="storage-detail">
            <span className="detail-label">Objects</span>
            <span className="detail-value">{storjStats.objectsStored}</span>
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
              width: `${(storjStats.bandwidthUsed / storjStats.bandwidthLimit) * 100}%`,
            }}
          ></div>
        </div>
        <div className="storage-details">
          <div className="storage-detail">
            <span className="detail-label">Used</span>
            <span className="detail-value">
              {storjStats.bandwidthUsed.toFixed(2)} GB
            </span>
          </div>
          <div className="storage-detail">
            <span className="detail-label">Total</span>
            <span className="detail-value">{storjStats.bandwidthLimit} GB</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBrowserTab = () => (
    <div className="integration-card-content">
      <div className="content-browser">
        <div className="browser-header">
          <h4>
            <i className="bi bi-folder2-open"></i> File Browser
          </h4>
          <div className="search-box">
            <input type="text" placeholder="Search files..." />
            <button>
              <i className="bi bi-search"></i>
            </button>
          </div>
        </div>

        <div className="browser-path">/climate-data</div>

        <ul className="file-list">
          {files.map((file, index) => (
            <li
              key={index}
              className={`file-item ${file.type === 'Folder' ? 'folder' : ''}`}
            >
              <div className="file-name">
                <i
                  className={
                    file.type === 'Folder'
                      ? 'bi bi-folder'
                      : 'bi bi-file-earmark'
                  }
                ></i>
                {file.name}
              </div>
              <div className="file-meta">
                {file.size && <span className="file-size">{file.size}</span>}
                <span className="file-modified">{file.modified}</span>
              </div>
            </li>
          ))}
        </ul>

        <div className="browser-actions" style={{ marginTop: '15px' }}>
          <WrfButton variant="primary" size="sm">
            <i className="bi bi-upload"></i> Upload
          </WrfButton>
          <WrfButton variant="secondary" size="sm">
            <i className="bi bi-folder-plus"></i> New Folder
          </WrfButton>
          <WrfButton variant="outlined" size="sm">
            <i className="bi bi-arrow-clockwise"></i> Refresh
          </WrfButton>
        </div>
      </div>
    </div>
  );

  const renderUploaderTab = () => (
    <div className="integration-card-content">
      <div className="uploader">
        <h4>
          <i className="bi bi-cloud-upload"></i> Upload Files
        </h4>

        <div className="upload-area">
          <i className="bi bi-cloud-arrow-up"></i>
          <p>Drag & drop files here</p>
          <span>or</span>
          <WrfButton variant="primary" style={{ marginTop: '10px' }}>
            Browse Files
          </WrfButton>
          <span className="file-note">Maximum file size: 100 MB</span>
        </div>

        <div className="price-estimator">
          <h4>
            <i className="bi bi-calculator"></i> Storage Estimator
          </h4>

          <div className="estimator-form">
            <div className="form-group">
              <label>Storage Size</label>
              <div className="input-with-unit">
                <input type="number" defaultValue="1" />
                <select>
                  <option>GB</option>
                  <option>TB</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Storage Duration</label>
              <div className="input-with-unit">
                <input type="number" defaultValue="1" />
                <select>
                  <option>Month</option>
                  <option>Year</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Bandwidth</label>
              <div className="input-with-unit">
                <input type="number" defaultValue="10" />
                <select>
                  <option>GB</option>
                  <option>TB</option>
                </select>
              </div>
            </div>
          </div>

          <div className="estimate-result">
            <div className="estimate-item">
              <span className="estimate-label">Storage Cost</span>
              <span className="estimate-value">$0.40</span>
            </div>
            <div className="estimate-item">
              <span className="estimate-label">Bandwidth Cost</span>
              <span className="estimate-value">$0.85</span>
            </div>
            <div className="estimate-item total">
              <span className="estimate-label">Estimated Total</span>
              <span className="estimate-value">$1.25 / month</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="integration-card storj-card">
      <div className="integration-card-header">
        <div className="integration-logo">
          <i className="bi bi-hdd-network"></i>
        </div>
        <div className="integration-title">
          <h3>Storj</h3>
          <p>Decentralized Cloud Storage</p>
        </div>
        <div className="integration-status">
          <span className="status-badge active">Connected</span>
          <button
            className="refresh-btn"
            onClick={fetchStorjStats}
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
          className={`tab ${activeTab === 'browser' ? 'active' : ''}`}
          onClick={() => setActiveTab('browser')}
        >
          <i className="bi bi-folder2-open"></i> Browser
        </div>
        <div
          className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <i className="bi bi-cloud-upload"></i> Upload
        </div>
      </div>

      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'browser' && renderBrowserTab()}
      {activeTab === 'upload' && renderUploaderTab()}

      <div className="integration-card-footer">
        <span className="last-updated">
          Last updated: {new Date(storjStats.lastSync).toLocaleString()}
        </span>
      </div>
    </div>
  );
};

export default StorjCard;
