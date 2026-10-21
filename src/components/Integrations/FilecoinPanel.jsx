import React, { useState, useEffect } from 'react';

import axios from 'axios';

import './IntegrationsHub.css';
import { sanitizeInput, sanitizeObject } from '../../utils/security';

const FilecoinPanel = ({ status = 'on' }) => {
  // Sanitize the incoming status prop
  const sanitizedStatus = sanitizeInput(status);

  const [networkData, setNetworkData] = useState(null);
  const [marketInfo, setMarketInfo] = useState(null);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [uploadData, setUploadData] = useState({
    name: '',
    contentType: 'application/json',
    data: '',
    replicationFactor: 3,
  });
  const [uploadResult, setUploadResult] = useState(null);
  const [cidToCheck, setCidToCheck] = useState('');
  const [storageStatus, setStorageStatus] = useState(null);
  const [transferData, setTransferData] = useState({
    amount: '',
    sender: '',
    recipient: '',
    sourceChain: 'FILECOIN',
    destinationChain: 'WRFCOIN',
    memo: '',
  });
  const [transferResult, setTransferResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [checking, setChecking] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    if (sanitizedStatus === 'on' || sanitizedStatus === 'testnet') {
      fetchFilecoinData();
    } else {
      setLoading(false);
    }
  }, [sanitizedStatus]);

  const fetchFilecoinData = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      // Fetching network status
      const networkStatusResponse = await axios.get('/api/filecoin/status');
      if (networkStatusResponse.data.success) {
        // Sanitize the API response data before setting state
        setNetworkData(sanitizeObject(networkStatusResponse.data.status));
      }

      // Fetching token info
      const tokenResponse = await axios.get('/api/filecoin/token');
      if (tokenResponse.data.success) {
        // Sanitize the API response data before setting state
        setTokenInfo(sanitizeObject(tokenResponse.data.token));
      }

      // Fetching market info
      const marketResponse = await axios.get('/api/filecoin/market');
      if (marketResponse.data.success) {
        // Sanitize the API response data before setting state
        setMarketInfo(sanitizeObject(marketResponse.data.market));
      }

      // Fetching providers
      const providersResponse = await axios.get('/api/filecoin/providers');
      if (providersResponse.data.success) {
        // Sanitize the array of providers before setting state
        const sanitizedProviders = Array.isArray(
          providersResponse.data.providers.providers,
        )
          ? providersResponse.data.providers.providers.map(provider =>
            sanitizeObject(provider),
          )
          : [];
        setProviders(sanitizedProviders);
      }
    } catch (error) {
      console.error('Error fetching Filecoin data:', error);
      setErrorMessage('Error connecting to Filecoin network');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadInputChange = e => {
    const { name, value } = e.target;
    // Sanitize user input before storing it in state
    const sanitizedName = sanitizeInput(name);
    const sanitizedValue = sanitizeInput(value);

    setUploadData(prev => ({
      ...prev,
      [sanitizedName]: sanitizedValue,
    }));
  };

  const handleUpload = async e => {
    e.preventDefault();
    try {
      setUploading(true);
      setErrorMessage(null);

      const response = await axios.post('/api/filecoin/store', {
        ...uploadData,
        isBase64: false,
      });

      if (response.data.success) {
        setUploadResult(response.data.storage);
      } else {
        throw new Error(
          response.data.error || 'Failed to store data on Filecoin',
        );
      }
    } catch (error) {
      console.error('Error uploading to Filecoin:', error);
      setErrorMessage(error.message || 'Failed to store data on Filecoin');
      setUploadResult(null);
    } finally {
      setUploading(false);
    }
  };

  const handleCheckStatus = async e => {
    e.preventDefault();
    // Sanitize the CID before validation
    const sanitizedCid = sanitizeInput(cidToCheck);

    if (!sanitizedCid) {
      setErrorMessage('Please enter a valid CID to check');
      return;
    }

    try {
      setChecking(true);
      setErrorMessage(null);

      // Use the sanitized CID in the API request
      const response = await axios.get(`/api/filecoin/status/${sanitizedCid}`);

      if (response.data.success) {
        // Sanitize the API response before setting state
        setStorageStatus(sanitizeObject(response.data.status));
      } else {
        throw new Error(
          response.data.error || 'Failed to retrieve storage status',
        );
      }
    } catch (error) {
      console.error('Error checking Filecoin storage status:', error);
      // Sanitize any error message before setting it
      setErrorMessage(sanitizeInput(error.message));
      setStorageStatus(null);
    } finally {
      setChecking(false);
    }
  };

  const handleTransferInputChange = e => {
    const { name, value } = e.target;
    // Sanitize user input before storing it in state
    const sanitizedName = sanitizeInput(name);
    const sanitizedValue = sanitizeInput(value);

    setTransferData(prev => ({
      ...prev,
      [sanitizedName]: sanitizedValue,
    }));
  };

  const handleTransfer = async e => {
    e.preventDefault();
    // First sanitize all transfer data fields
    const sanitizedTransferData = {
      amount: sanitizeInput(transferData.amount),
      sender: sanitizeInput(transferData.sender),
      recipient: sanitizeInput(transferData.recipient),
      sourceChain: sanitizeInput(transferData.sourceChain),
      destinationChain: sanitizeInput(transferData.destinationChain),
      memo: sanitizeInput(transferData.memo || ''),
    };

    const { amount, sender, recipient, sourceChain, destinationChain } =
      sanitizedTransferData;

    if (!amount || !sender || !recipient || !sourceChain || !destinationChain) {
      setErrorMessage('Please fill in all required fields for the transfer');
      return;
    }

    try {
      setTransferring(true);
      setErrorMessage(null);

      // Use sanitized data for the API request
      const response = await axios.post(
        '/api/filecoin/transfer',
        sanitizedTransferData,
      );

      if (response.data.success) {
        // Sanitize API response before setting state
        setTransferResult(sanitizeObject(response.data.transfer));
      } else {
        throw new Error(
          response.data.error || 'Failed to initiate token transfer',
        );
      }
    } catch (error) {
      console.error('Error transferring tokens:', error);
      // Sanitize error message before setting it
      setErrorMessage(sanitizeInput(error.message));
      setTransferResult(null);
    } finally {
      setTransferring(false);
    }
  };

  const renderTabContent = () => {
    // Sanitize the activeTab value before using it in the switch statement
    const sanitizedTab = sanitizeInput(activeTab);

    switch (sanitizedTab) {
    case 'overview':
      return renderOverviewTab();
    case 'storage':
      return renderStorageTab();
    case 'providers':
      return renderProvidersTab();
    case 'transfer':
      return renderTransferTab();
    default:
      return (
        <div className="coming-soon">
          <div className="alert-message info">
            <i className="bi bi-info-circle"></i>
            <span>This feature is coming soon in the next update.</span>
          </div>
        </div>
      );
    }
  };

  const renderOverviewTab = () => {
    if (loading) {
      return (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <span>Loading Filecoin network data...</span>
        </div>
      );
    }

    if (!networkData || !tokenInfo || !marketInfo) {
      return (
        <div className="alert-message info">
          <i className="bi bi-info-circle"></i>
          <span>No data available. Please try refreshing.</span>
        </div>
      );
    }

    return (
      <>
        <h3>Network Status</h3>
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-title">Network</div>
            <div className="stat-value">{networkData.network}</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Block Height</div>
            <div className="stat-value">
              {networkData.blockHeight?.toLocaleString()}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Network Power</div>
            <div className="stat-value">
              {networkData.totalPower || 'Unknown'}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Network Version</div>
            <div className="stat-value">
              {networkData.networkVersion || 'Unknown'}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Base Fee</div>
            <div className="stat-value">{networkData.baseFee || 'Unknown'}</div>
          </div>
        </div>

        <h3>Token Information (FIL)</h3>
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-title">Current Price</div>
            <div className="stat-value">
              ${tokenInfo.price?.usd?.toFixed(2) || 'Unknown'}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-title">24h Change</div>
            <div
              className={`stat-value ${parseFloat(tokenInfo.price?.change24h || 0) >= 0 ? 'positive' : 'negative'}`}
            >
              {tokenInfo.price?.change24h > 0 ? '+' : ''}
              {tokenInfo.price?.change24h?.toFixed(2)}%
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Total Supply</div>
            <div className="stat-value">
              {tokenInfo.supply?.total?.toLocaleString() || 'Unknown'}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Circulating Supply</div>
            <div className="stat-value">
              {tokenInfo.supply?.circulating?.toLocaleString() || 'Unknown'}
            </div>
          </div>
        </div>

        <h3>Storage Market Overview</h3>
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-title">Total Deals</div>
            <div className="stat-value">
              {marketInfo.marketDeals?.totalDeals?.toLocaleString() ||
                'Unknown'}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Active Deals</div>
            <div className="stat-value">
              {marketInfo.marketDeals?.activeDeals?.toLocaleString() ||
                'Unknown'}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Committed Storage</div>
            <div className="stat-value">
              {marketInfo.storageCapacity?.committed || 'Unknown'}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Available Storage</div>
            <div className="stat-value">
              {marketInfo.storageCapacity?.available || 'Unknown'}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Storage Ask</div>
            <div className="stat-value">
              {marketInfo.averagePrices?.storageAsk || 'Unknown'}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Verified Ask</div>
            <div className="stat-value">
              {marketInfo.averagePrices?.verifiedAsk || 'Unknown'}
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderStorageTab = () => {
    return (
      <div className="storage-tab">
        <div className="grid-2-columns">
          <div className="column">
            <h3>Store Data on Filecoin</h3>
            <form className="form" onSubmit={handleUpload}>
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={uploadData.name}
                  onChange={handleUploadInputChange}
                  required
                  placeholder="Name for your stored data"
                />
              </div>

              <div className="form-group">
                <label htmlFor="contentType">Content Type</label>
                <input
                  id="contentType"
                  name="contentType"
                  type="text"
                  value={uploadData.contentType}
                  onChange={handleUploadInputChange}
                  required
                  placeholder="e.g., application/json, text/plain"
                />
              </div>

              <div className="form-group">
                <label htmlFor="data">Data</label>
                <textarea
                  id="data"
                  name="data"
                  value={uploadData.data}
                  onChange={handleUploadInputChange}
                  required
                  rows={4}
                  placeholder="Enter the data to store"
                />
              </div>

              <div className="form-group">
                <label htmlFor="replicationFactor">Replication Factor</label>
                <input
                  id="replicationFactor"
                  name="replicationFactor"
                  type="number"
                  min="1"
                  max="10"
                  value={uploadData.replicationFactor}
                  onChange={handleUploadInputChange}
                  required
                />
              </div>

              <button
                type="submit"
                className="button primary"
                disabled={uploading || !uploadData.name || !uploadData.data}
              >
                {uploading ? 'Uploading...' : 'Store on Filecoin'}
              </button>
            </form>
          </div>

          <div className="column">
            <h3>Check Storage Status</h3>
            <form className="form" onSubmit={handleCheckStatus}>
              <div className="form-group">
                <label htmlFor="cid">Content ID (CID)</label>
                <div className="input-with-button">
                  <input
                    id="cid"
                    type="text"
                    value={cidToCheck}
                    onChange={e => setCidToCheck(e.target.value)}
                    required
                    placeholder="Enter a CID to check its status"
                  />
                  <button
                    type="submit"
                    className="button primary"
                    disabled={checking || !cidToCheck}
                  >
                    {checking ? 'Checking...' : 'Check'}
                  </button>
                </div>
              </div>
            </form>

            {uploadResult && (
              <div className="result-card">
                <h4>Upload Result</h4>
                <div className="result-details">
                  <div className="detail-item">
                    <div className="detail-label">CID:</div>
                    <div className="detail-value">{uploadResult.cid}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Name:</div>
                    <div className="detail-value">{uploadResult.name}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Status:</div>
                    <div className="detail-value">
                      <span
                        className={`status-badge ${uploadResult.status.toLowerCase()}`}
                      >
                        {uploadResult.status}
                      </span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Size:</div>
                    <div className="detail-value">
                      {(uploadResult.size / 1024).toFixed(2)} KB
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Created:</div>
                    <div className="detail-value">
                      {new Date(uploadResult.created).toLocaleString()}
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Est. Completion:</div>
                    <div className="detail-value">
                      {new Date(
                        uploadResult.estimatedCompletion,
                      ).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {storageStatus && (
              <div className="result-card">
                <h4>Storage Status</h4>
                <div className="result-details">
                  {storageStatus.found ? (
                    <>
                      <div className="detail-item">
                        <div className="detail-label">CID:</div>
                        <div className="detail-value">{storageStatus.cid}</div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">Status:</div>
                        <div className="detail-value">
                          <span
                            className={`status-badge ${storageStatus.status.toLowerCase()}`}
                          >
                            {storageStatus.status}
                          </span>
                        </div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">Total Deals:</div>
                        <div className="detail-value">
                          {storageStatus.deals?.total || 0}
                        </div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">
                          Active/Pending/Failed:
                        </div>
                        <div className="detail-value">
                          {storageStatus.deals?.active || 0} /{' '}
                          {storageStatus.deals?.pending || 0} /{' '}
                          {storageStatus.deals?.failed || 0}
                        </div>
                      </div>
                      {storageStatus.providers &&
                        storageStatus.providers.length > 0 && (
                        <div className="detail-item">
                          <div className="detail-label">
                              Storage Providers:
                          </div>
                          <div className="detail-value">
                            {storageStatus.providers.join(', ')}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="alert-message error">
                      <i className="bi bi-exclamation-circle"></i>
                      <span>
                        Content with CID {storageStatus.cid} not found
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderProvidersTab = () => {
    if (loading) {
      return (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <span>Loading storage providers...</span>
        </div>
      );
    }

    if (!providers || providers.length === 0) {
      return (
        <div className="alert-message info">
          <i className="bi bi-info-circle"></i>
          <span>No storage providers available. Please try refreshing.</span>
        </div>
      );
    }

    return (
      <div className="providers-tab">
        <h3>Storage Providers</h3>
        <div className="providers-grid">
          {providers.map((provider, index) => (
            <div className="provider-card" key={provider.address || index}>
              <div className="provider-header">
                <h4>{provider.address}</h4>
                <span
                  className={`status-badge ${provider.verified ? 'active' : 'inactive'}`}
                >
                  {provider.verified ? 'Verified' : 'Unverified'}
                </span>
              </div>
              <div className="provider-details">
                <div className="detail-item">
                  <div className="detail-label">Region:</div>
                  <div className="detail-value">
                    {provider.region || 'Unknown'}
                  </div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Power:</div>
                  <div className="detail-value">
                    {provider.powerTiB ? `${provider.powerTiB} TiB` : 'Unknown'}
                  </div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Ask Price:</div>
                  <div className="detail-value">
                    {provider.askPrice || 'Unknown'}
                  </div>
                </div>
                {provider.score && (
                  <div className="detail-item">
                    <div className="detail-label">Score:</div>
                    <div className="detail-value">
                      <span
                        className={`score ${
                          provider.score >= 80
                            ? 'high'
                            : provider.score >= 50
                              ? 'medium'
                              : 'low'
                        }`}
                      >
                        {provider.score}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTransferTab = () => {
    return (
      <div className="transfer-tab">
        <div className="grid-2-columns">
          <div className="column">
            <h3>Transfer Tokens</h3>
            <form className="form" onSubmit={handleTransfer}>
              <div className="form-group">
                <label htmlFor="amount">Amount</label>
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  min="0.00001"
                  step="0.00001"
                  value={transferData.amount}
                  onChange={handleTransferInputChange}
                  required
                  placeholder="Amount to transfer"
                />
              </div>

              <div className="form-group">
                <label htmlFor="sender">Sender Address</label>
                <input
                  id="sender"
                  name="sender"
                  type="text"
                  value={transferData.sender}
                  onChange={handleTransferInputChange}
                  required
                  placeholder="Sender address"
                />
              </div>

              <div className="form-group">
                <label htmlFor="recipient">Recipient Address</label>
                <input
                  id="recipient"
                  name="recipient"
                  type="text"
                  value={transferData.recipient}
                  onChange={handleTransferInputChange}
                  required
                  placeholder="Recipient address"
                />
              </div>

              <div className="form-group">
                <label htmlFor="sourceChain">Source Chain</label>
                <select
                  id="sourceChain"
                  name="sourceChain"
                  value={transferData.sourceChain}
                  onChange={handleTransferInputChange}
                  required
                >
                  <option value="FILECOIN">Filecoin</option>
                  <option value="WRFCOIN">Wrfcoin</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="destinationChain">Destination Chain</label>
                <select
                  id="destinationChain"
                  name="destinationChain"
                  value={transferData.destinationChain}
                  onChange={handleTransferInputChange}
                  required
                >
                  <option value="WRFCOIN">Wrfcoin</option>
                  <option value="FILECOIN">Filecoin</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="memo">Memo (Optional)</label>
                <input
                  id="memo"
                  name="memo"
                  type="text"
                  value={transferData.memo}
                  onChange={handleTransferInputChange}
                  placeholder="Optional memo for the transfer"
                />
              </div>

              <button
                type="submit"
                className="button primary"
                disabled={
                  transferring ||
                  !transferData.amount ||
                  !transferData.sender ||
                  !transferData.recipient
                }
              >
                {transferring ? 'Processing...' : 'Transfer Tokens'}
              </button>
            </form>
          </div>

          <div className="column">
            <h3>Transfer Status</h3>
            {transferResult ? (
              <div className="result-card">
                <div className="result-details">
                  <div className="detail-item">
                    <div className="detail-label">Transfer ID:</div>
                    <div className="detail-value">
                      {transferResult.transferId}
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Amount:</div>
                    <div className="detail-value">
                      {transferResult.amount}{' '}
                      {transferResult.sourceChain === 'FILECOIN'
                        ? 'FIL'
                        : 'WRF'}
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Fee:</div>
                    <div className="detail-value">
                      {transferResult.fee}{' '}
                      {transferResult.sourceChain === 'FILECOIN'
                        ? 'FIL'
                        : 'WRF'}
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">From:</div>
                    <div className="detail-value">{transferResult.sender}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">To:</div>
                    <div className="detail-value">
                      {transferResult.recipient}
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Route:</div>
                    <div className="detail-value">
                      {transferResult.sourceChain} →{' '}
                      {transferResult.destinationChain}
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Status:</div>
                    <div className="detail-value">
                      <span
                        className={`status-badge ${transferResult.status.toLowerCase()}`}
                      >
                        {transferResult.status}
                      </span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Est. Completion:</div>
                    <div className="detail-value">
                      {new Date(
                        transferResult.estimatedCompletion,
                      ).toLocaleString()}
                    </div>
                  </div>
                  {transferResult.hash && (
                    <div className="detail-item">
                      <div className="detail-label">Transaction Hash:</div>
                      <div className="detail-value">{transferResult.hash}</div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="info-message">
                <p>
                  No transfer initiated yet. Fill in the form and click
                  "Transfer Tokens" to start a transfer.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (status === 'off') {
    return (
      <div className="integration-card">
        <div className="alert-message warning">
          <i className="bi bi-exclamation-triangle"></i>
          <div>
            <strong>Filecoin Integration Disabled</strong>
            <p>
              This integration is currently disabled. Enable it from the
              governance dashboard to access decentralized storage features and
              token transfer capabilities.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="integration-card">
      <div className="integration-header">
        <div>
          <h2>
            <i className="bi bi-hdd-network"></i> Filecoin Integration
          </h2>
          {status === 'testnet' && (
            <span className="testnet-badge">Testnet Mode</span>
          )}
          <p>
            Store data on the Filecoin network, monitor storage deals, and
            transfer FIL tokens between Filecoin and Wrfcoin networks.
          </p>
        </div>
        <div>
          <button
            className="button primary"
            onClick={fetchFilecoinData}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      <div className="divider"></div>

      {errorMessage && (
        <div className="alert-message error">
          <i className="bi bi-exclamation-circle"></i>
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="tabs">
        <div
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <i className="bi bi-database"></i> Network Overview
        </div>
        <div
          className={`tab ${activeTab === 'storage' ? 'active' : ''}`}
          onClick={() => setActiveTab('storage')}
        >
          <i className="bi bi-cloud-upload"></i> Storage
        </div>
        <div
          className={`tab ${activeTab === 'providers' ? 'active' : ''}`}
          onClick={() => setActiveTab('providers')}
        >
          <i className="bi bi-server"></i> Providers
        </div>
        <div
          className={`tab ${activeTab === 'transfer' ? 'active' : ''}`}
          onClick={() => setActiveTab('transfer')}
        >
          <i className="bi bi-currency-exchange"></i> Token Transfer
        </div>
      </div>

      <div className="tab-content">{renderTabContent()}</div>
    </div>
  );
};

export default FilecoinPanel;
