import React, { useState, useEffect } from 'react';
import { WrfButton, WrfInput, WrfSelect } from '../DesignSystem';
import '../Integrations/IntegrationCards.css';

const AIOZMediaCard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mediaStatus, setMediaStatus] = useState({
    status: 'testnet',
    activeStreams: 0,
    storageUsed: 0,
    connectedClients: 0,
  });
  const [streamsList, setStreamsList] = useState([]);

  useEffect(() => {
    // Initialize with mock data
    fetchMediaServerStatus();
    fetchStreamsList();
  }, []);

  const fetchMediaServerStatus = () => {
    setIsRefreshing(true);

    // Simulate API call to media server
    setTimeout(() => {
      setMediaStatus({
        status: 'testnet',
        activeStreams: Math.floor(Math.random() * 5) + 1,
        storageUsed: Math.floor(Math.random() * 5000) + 1000,
        connectedClients: Math.floor(Math.random() * 10) + 2,
      });
      setIsRefreshing(false);
    }, 1000);
  };

  const fetchStreamsList = () => {
    // Simulate API call to get streams list
    const demoStreams = [
      {
        id: 'stream-wx-forecast-1',
        name: 'Weather Forecast (Global)',
        type: 'HLS',
        resolution: '1080p',
        bitrate: '4Mbps',
        status: 'active',
        viewers: 3,
      },
      {
        id: 'stream-air-quality-1',
        name: 'Air Quality Visualization',
        type: 'WebRTC',
        resolution: '720p',
        bitrate: '2Mbps',
        status: 'active',
        viewers: 1,
      },
      {
        id: 'stream-climate-1',
        name: 'Climate Simulation Model',
        type: 'RTMP',
        resolution: '4K',
        bitrate: '8Mbps',
        status: 'idle',
        viewers: 0,
      },
    ];

    setStreamsList(demoStreams);
  };

  const handleRefresh = () => {
    fetchMediaServerStatus();
    fetchStreamsList();
  };

  const handleCreateStream = e => {
    e.preventDefault();
    // In a real implementation, this would create a new stream
    alert(
      'Stream creation requested. In a production environment, this would create a new stream from computational resources.',
    );
  };

  const renderOverviewTab = () => (
    <div className="integration-card-content">
      <div className="integration-description">
        <p>
          AIOZ Media Server provides robust media streaming capabilities with
          support for multiple protocols including WebRTC, RTSP, RTMP, HLS, and
          more. Ideal for streaming computational results as video content.
        </p>
      </div>

      <div className="integration-stats">
        <div className="stat-item">
          <i className="fas fa-video"></i>
          <div className="stat-info">
            <span className="stat-value">{mediaStatus.activeStreams}</span>
            <span className="stat-label">Active Streams</span>
          </div>
        </div>
        <div className="stat-item">
          <i className="fas fa-users"></i>
          <div className="stat-info">
            <span className="stat-value">{mediaStatus.connectedClients}</span>
            <span className="stat-label">Connected Clients</span>
          </div>
        </div>
        <div className="stat-item">
          <i className="fas fa-hdd"></i>
          <div className="stat-info">
            <span className="stat-value">
              {mediaStatus.storageUsed.toLocaleString()} MB
            </span>
            <span className="stat-label">Storage Used</span>
          </div>
        </div>
      </div>

      <div className="protocol-info">
        <h4>
          <i className="fas fa-exchange-alt"></i> Supported Protocols
        </h4>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">WebRTC</span>
            <span className="info-value">Enabled</span>
          </div>
          <div className="info-item">
            <span className="info-label">RTMP</span>
            <span className="info-value">Enabled</span>
          </div>
          <div className="info-item">
            <span className="info-label">RTSP</span>
            <span className="info-value">Enabled</span>
          </div>
          <div className="info-item">
            <span className="info-label">HLS</span>
            <span className="info-value">Enabled</span>
          </div>
          <div className="info-item">
            <span className="info-label">SRT</span>
            <span className="info-value">Enabled</span>
          </div>
          <div className="info-item">
            <span className="info-label">MPEG-TS</span>
            <span className="info-value">Enabled</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStreamsTab = () => (
    <div className="integration-card-content">
      <div className="browser-header">
        <h4>
          <i className="fas fa-film"></i> Active Streams
        </h4>
        <div className="browser-actions">
          <WrfButton
            variant="outline"
            size="sm"
            onClick={() => setActiveTab('create')}
          >
            <i className="fas fa-plus"></i> Create Stream
          </WrfButton>
        </div>
      </div>

      <ul className="content-list">
        {streamsList.map(stream => (
          <li
            key={stream.id}
            className={`content-item ${stream.status === 'active' ? 'active' : ''}`}
          >
            <div className="content-info">
              <span className="content-name">{stream.name}</span>
              <span className="content-cid">
                <i
                  className={`fas ${stream.type === 'HLS' ? 'fa-film' : stream.type === 'WebRTC' ? 'fa-bolt' : 'fa-broadcast-tower'}`}
                ></i>{' '}
                {stream.type} | {stream.resolution} | {stream.bitrate}
              </span>
            </div>
            <div className="content-meta">
              <span
                className={`status-badge ${stream.status === 'active' ? 'active' : 'inactive'}`}
              >
                {stream.status === 'active' ? 'Live' : 'Idle'}
              </span>
              <span>
                {stream.viewers} viewer{stream.viewers !== 1 ? 's' : ''}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {streamsList.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <i
            className="fas fa-film"
            style={{ fontSize: '24px', color: '#ccc', marginBottom: '10px' }}
          ></i>
          <p>No active streams found</p>
        </div>
      )}
    </div>
  );

  const renderCreateTab = () => (
    <div className="integration-card-content">
      <h4>
        <i className="fas fa-plus-circle"></i> Create New Stream
      </h4>
      <p>Configure a new stream from computational resources</p>

      <form onSubmit={handleCreateStream}>
        <div className="form-group">
          <label>Stream Name</label>
          <WrfInput
            type="text"
            placeholder="e.g., Weather Forecast Visualization"
          />
        </div>

        <div className="form-group">
          <label>Stream Source</label>
          <WrfSelect>
            <option value="">Select a source</option>
            <option value="computational">Computational Job Output</option>
            <option value="climate">Climate Model</option>
            <option value="weather">Weather Forecast</option>
            <option value="air">Air Quality Model</option>
            <option value="custom">Custom Source</option>
          </WrfSelect>
        </div>

        <div className="form-group">
          <label>Output Format</label>
          <WrfSelect>
            <option value="webrtc">WebRTC (lowest latency)</option>
            <option value="rtmp">RTMP</option>
            <option value="hls">HLS</option>
            <option value="srt">SRT</option>
          </WrfSelect>
        </div>

        <div className="form-group">
          <label>Resolution</label>
          <WrfSelect>
            <option value="720p">720p HD</option>
            <option value="1080p">1080p Full HD</option>
            <option value="1440p">1440p QHD</option>
            <option value="4k">4K UHD</option>
          </WrfSelect>
        </div>

        <div className="form-group">
          <label>Target Bitrate</label>
          <WrfSelect>
            <option value="2">2 Mbps (Good)</option>
            <option value="4">4 Mbps (Better)</option>
            <option value="8">8 Mbps (Best)</option>
          </WrfSelect>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: '20px',
          }}
        >
          <WrfButton
            variant="outline"
            style={{ marginRight: '10px' }}
            onClick={() => setActiveTab('streams')}
          >
            Cancel
          </WrfButton>
          <WrfButton variant="primary" type="submit">
            Create Stream
          </WrfButton>
        </div>
      </form>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="integration-card-content">
      <h4>
        <i className="fas fa-cogs"></i> Media Server Settings
      </h4>

      <div className="form-group">
        <label>Server Mode</label>
        <WrfSelect>
          <option value="testnet">Testnet</option>
          <option value="mainnet">Mainnet</option>
        </WrfSelect>
        <small className="text-muted">
          Testnet mode uses simulated data for development and testing
        </small>
      </div>

      <div className="form-group">
        <label>Maximum Concurrent Streams</label>
        <WrfInput type="number" defaultValue="10" />
      </div>

      <div className="form-group">
        <label>Authentication</label>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '10px',
          }}
        >
          <input
            type="checkbox"
            id="enableAuth"
            style={{ marginRight: '10px' }}
          />
          <label htmlFor="enableAuth" style={{ margin: 0 }}>
            Enable Authentication for Streams
          </label>
        </div>
      </div>

      <div className="form-group">
        <label>Storage Configuration</label>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '10px',
          }}
        >
          <input
            type="checkbox"
            id="enableStorage"
            style={{ marginRight: '10px' }}
            checked
          />
          <label htmlFor="enableStorage" style={{ margin: 0 }}>
            Record Streams
          </label>
        </div>
        <WrfSelect>
          <option value="local">Local Storage</option>
          <option value="ipfs">IPFS</option>
          <option value="arweave">Arweave</option>
          <option value="filecoin">Filecoin</option>
        </WrfSelect>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: '20px',
        }}
      >
        <WrfButton variant="primary">Save Settings</WrfButton>
      </div>
    </div>
  );

  return (
    <div className="integration-card">
      <div className="integration-card-header">
        <div className="integration-logo">
          <i className="fas fa-film"></i>
        </div>
        <div className="integration-title">
          <h3>AIOZ MediaMTX</h3>
          <p>Media streaming server for computational data visualization</p>
        </div>
        <div className="integration-status">
          <span className={`status-badge ${mediaStatus.status}`}>
            {mediaStatus.status === 'active'
              ? 'Active'
              : mediaStatus.status === 'testnet'
                ? 'Testnet'
                : 'Inactive'}
          </span>
          <button
            className={`refresh-btn ${isRefreshing ? 'spinning' : ''}`}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <i className="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>

      <div className="integration-card-tabs">
        <div
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <i className="fas fa-info-circle"></i> Overview
        </div>
        <div
          className={`tab ${activeTab === 'streams' ? 'active' : ''}`}
          onClick={() => setActiveTab('streams')}
        >
          <i className="fas fa-film"></i> Streams
        </div>
        <div
          className={`tab ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          <i className="fas fa-plus"></i> Create
        </div>
        <div
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <i className="fas fa-cogs"></i> Settings
        </div>
      </div>

      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'streams' && renderStreamsTab()}
      {activeTab === 'create' && renderCreateTab()}
      {activeTab === 'settings' && renderSettingsTab()}

      <div className="integration-card-footer">
        <span>Powered by AIOZ Network MediaMTX v0.3.17</span>
      </div>
    </div>
  );
};

export default AIOZMediaCard;
