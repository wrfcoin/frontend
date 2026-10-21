import React, { useState, useEffect } from 'react';

import axios from 'axios';

import './IntegrationsHub.css';
import { sanitizeInput, sanitizeObject } from '../../utils/security';

const HeliumNetworkPanel = ({ status = 'on' }) => {
  // Sanitize the incoming status prop
  const sanitizedStatus = sanitizeInput(status);

  const [networkData, setNetworkData] = useState(null);
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [searchForm, setSearchForm] = useState({
    latitude: 37.7749,
    longitude: -122.4194,
    distance: 5,
  });
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (sanitizedStatus === 'on' || sanitizedStatus === 'testnet') {
      fetchNetworkData();
    } else {
      setLoading(false);
    }
  }, [sanitizedStatus]);

  const fetchNetworkData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/helium/status');

      if (response.data && response.data.success) {
        // Sanitize network data from the API before setting state
        const sanitizedNetworkData = sanitizeObject(response.data.status);
        setNetworkData(sanitizedNetworkData);
        setErrorMessage(null);
      } else {
        setErrorMessage('Failed to fetch Helium Network data');
      }
    } catch (error) {
      console.error('Error fetching Helium Network data:', error);
      // Use a sanitized error message
      setErrorMessage(sanitizeInput('Error connecting to Helium Network'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearchFormChange = e => {
    const { name, value } = e.target;
    // Sanitize input values before setting state
    const sanitizedValue = sanitizeInput(value);
    setSearchForm(prev => ({ ...prev, [sanitizeInput(name)]: sanitizedValue }));
  };

  const searchNearbyHotspots = async e => {
    e.preventDefault();
    try {
      setSearchingLocation(true);
      // Sanitize search form values before using in API call
      const latitude = sanitizeInput(searchForm.latitude);
      const longitude = sanitizeInput(searchForm.longitude);
      const distance = sanitizeInput(searchForm.distance);

      const response = await axios.get(
        `/api/helium/hotspots/nearby?lat=${latitude}&lng=${longitude}&distance=${distance}`,
      );

      if (response.data && response.data.success) {
        // Sanitize API response data before setting state
        const sanitizedHotspots = response.data.hotspots.map(hotspot => {
          return sanitizeObject(hotspot);
        });
        setHotspots(sanitizedHotspots);
        setErrorMessage(null);
      } else {
        setErrorMessage('Failed to find hotspots at this location');
        setHotspots([]);
      }
    } catch (error) {
      console.error('Error searching for hotspots:', error);
      setErrorMessage('Error searching for hotspots');
      setHotspots([]);
    } finally {
      setSearchingLocation(false);
    }
  };

  const renderTabContent = () => {
    // Sanitize activeTab value before using it in the switch statement
    const sanitizedTab = sanitizeInput(activeTab);

    switch (sanitizedTab) {
    case 'overview':
      return renderOverviewTab();
    case 'hotspots':
      return renderHotspotsTab();
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
          <span>Loading Helium Network data...</span>
        </div>
      );
    }

    if (!networkData) {
      return (
        <div className="alert-message info">
          <i className="bi bi-info-circle"></i>
          <span>No data available. Please try refreshing.</span>
        </div>
      );
    }

    // Extra safeguard: ensure networkData is sanitized at display time
    const safeNetwork = sanitizeInput(networkData.network || '');
    const safeBlockHeight = networkData.blockHeight
      ? parseInt(sanitizeInput(networkData.blockHeight.toString()), 10)
      : 0;
    const safeActiveHotspots = networkData.activeHotspots
      ? parseInt(sanitizeInput(networkData.activeHotspots.toString()), 10)
      : 0;
    const safeDataOnlyHotspots = networkData.dataOnlyHotspots
      ? parseInt(sanitizeInput(networkData.dataOnlyHotspots.toString()), 10)
      : 0;
    const safePrice = networkData.tokenPrice?.usd
      ? parseFloat(sanitizeInput(networkData.tokenPrice.usd.toString()))
      : 0;
    const safeChange = networkData.tokenPrice?.change24h
      ? parseFloat(sanitizeInput(networkData.tokenPrice.change24h.toString()))
      : 0;
    const safeValidators = networkData.validators
      ? parseInt(sanitizeInput(networkData.validators.toString()), 10)
      : 0;
    const safeBlockTime = sanitizeInput(
      networkData.blockTime?.toString() || '0',
    );

    return (
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-title">Network</div>
          <div className="stat-value">{safeNetwork}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Block Height</div>
          <div className="stat-value">{safeBlockHeight.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Active Hotspots</div>
          <div className="stat-value">
            {safeActiveHotspots.toLocaleString()}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Data-Only Hotspots</div>
          <div className="stat-value">
            {safeDataOnlyHotspots.toLocaleString()}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-title">HNT Price</div>
          <div className="stat-value">${safePrice.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">24h Change</div>
          <div
            className={`stat-value ${safeChange >= 0 ? 'positive' : 'negative'}`}
          >
            {safeChange.toFixed(2)}%
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Validators</div>
          <div className="stat-value">{safeValidators.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Block Time</div>
          <div className="stat-value">{safeBlockTime}s</div>
        </div>
      </div>
    );
  };

  const renderHotspotsTab = () => {
    return (
      <div className="hotspots-tab">
        <form className="search-form" onSubmit={searchNearbyHotspots}>
          <div className="form-group">
            <label htmlFor="latitude">Latitude</label>
            <input
              id="latitude"
              name="latitude"
              type="number"
              step="0.0001"
              value={searchForm.latitude}
              onChange={handleSearchFormChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="longitude">Longitude</label>
            <input
              id="longitude"
              name="longitude"
              type="number"
              step="0.0001"
              value={searchForm.longitude}
              onChange={handleSearchFormChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="distance">Distance (km)</label>
            <input
              id="distance"
              name="distance"
              type="number"
              min="1"
              max="50"
              value={searchForm.distance}
              onChange={handleSearchFormChange}
              required
            />
          </div>
          <button
            type="submit"
            className="button primary"
            disabled={searchingLocation}
          >
            {searchingLocation ? 'Searching...' : 'Search'}
          </button>
        </form>

        <div className="results-container">
          {searchingLocation ? (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <span>Searching for hotspots...</span>
            </div>
          ) : hotspots.length > 0 ? (
            <div className="hotspots-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Reward Scale</th>
                    <th>Distance</th>
                    <th>Mode</th>
                    <th>Witnesses</th>
                  </tr>
                </thead>
                <tbody>
                  {hotspots.map(hotspot => {
                    // Sanitize all hotspot properties individually to ensure security
                    const safeAddress = sanitizeInput(hotspot.address);
                    const safeName = sanitizeInput(hotspot.name);
                    const safeStatus = sanitizeInput(hotspot.status?.online);
                    const safeScale = hotspot.rewardScale
                      ? parseFloat(
                        sanitizeInput(hotspot.rewardScale.toString()),
                      )
                      : null;
                    const safeDistance = sanitizeInput(
                      hotspot.distance?.toString(),
                    );
                    const safeMode = sanitizeInput(hotspot.mode);
                    const safeWitnesses = sanitizeInput(
                      String(hotspot.witnesses || 0),
                    );

                    return (
                      <tr key={safeAddress}>
                        <td>{safeName}</td>
                        <td>
                          <span
                            className={`status-badge ${safeStatus === 'online' ? 'online' : 'offline'}`}
                          >
                            {safeStatus === 'online' ? 'Online' : 'Offline'}
                          </span>
                        </td>
                        <td>{safeScale?.toFixed(2) || 'N/A'}</td>
                        <td>{safeDistance} km</td>
                        <td>
                          <span className={`mode-badge ${safeMode}`}>
                            {safeMode?.toUpperCase() || 'UNKNOWN'}
                          </span>
                        </td>
                        <td>{safeWitnesses}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="alert-message info">
              <i className="bi bi-info-circle"></i>
              <span>
                No hotspots found in the specified area. Try expanding your
                search radius or searching in a different location.
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (sanitizedStatus === 'off') {
    return (
      <div className="integration-card">
        <div className="alert-message warning">
          <i className="bi bi-exclamation-triangle"></i>
          <div>
            <strong>Helium Network Integration Disabled</strong>
            <p>
              This integration is currently disabled. Enable it from the
              governance dashboard to access IoT, hotspot management, and token
              transfer features.
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
            <i className="bi bi-broadcast"></i> Helium Network Integration
          </h2>
          {sanitizedStatus === 'testnet' && (
            <span className="testnet-badge">Testnet Mode</span>
          )}
          <p>
            Connect IoT devices, manage hotspots, and transfer HNT tokens
            between Helium Network and Wrfcoin blockchain.
          </p>
        </div>
        <div>
          <button
            className="button primary"
            onClick={fetchNetworkData}
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
          <span>{sanitizeInput(errorMessage)}</span>
        </div>
      )}

      <div className="tabs">
        <div
          className={`tab ${sanitizeInput(activeTab) === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <i className="bi bi-database"></i> Network Overview
        </div>
        <div
          className={`tab ${sanitizeInput(activeTab) === 'hotspots' ? 'active' : ''}`}
          onClick={() => setActiveTab('hotspots')}
        >
          <i className="bi bi-geo-alt"></i> Find Hotspots
        </div>
        <div
          className={`tab ${sanitizeInput(activeTab) === 'devices' ? 'active' : ''}`}
          onClick={() => setActiveTab('devices')}
        >
          <i className="bi bi-broadcast"></i> Register Device
        </div>
        <div
          className={`tab ${sanitizeInput(activeTab) === 'transfer' ? 'active' : ''}`}
          onClick={() => setActiveTab('transfer')}
        >
          <i className="bi bi-currency-exchange"></i> Token Transfer
        </div>
      </div>

      <div className="tab-content">{renderTabContent()}</div>
    </div>
  );
};

export default HeliumNetworkPanel;
