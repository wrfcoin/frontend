import React, { useState, useEffect } from 'react';
import { WrfCard, WrfBadge, WrfButton, WrfSelect } from '../DesignSystem';
import './IntegrationCards.css';
import { devLog } from '../../utils/logger';

const PythCard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [priceFeeds, setPriceFeeds] = useState([]);
  const [pythDataServices, setPythDataServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChain, setSelectedChain] = useState('solana');

  // Supported blockchains by Pyth
  const supportedChains = [
    { id: 'solana', name: 'Solana', status: 'live' },
    { id: 'ethereum', name: 'Ethereum', status: 'live' },
    { id: 'polygon', name: 'Polygon', status: 'live' },
    { id: 'bsc', name: 'BNB Chain', status: 'live' },
    { id: 'avalanche', name: 'Avalanche', status: 'live' },
    { id: 'cosmos', name: 'Cosmos', status: 'testnet' },
    { id: 'wrfcoin', name: 'Wrfcoin', status: 'testnet' },
  ];

  // Mock price data for demonstration (would be replaced with real Pyth API calls)
  const mockPriceFeeds = [
    {
      id: 'ETH-USD',
      price: '4827.21',
      confidence: '0.42',
      lastUpdated: '2 seconds ago',
      status: 'live',
    },
    {
      id: 'BTC-USD',
      price: '68241.45',
      confidence: '1.21',
      lastUpdated: '5 seconds ago',
      status: 'live',
    },
    {
      id: 'WRF-USD',
      price: '3.42',
      confidence: '0.01',
      lastUpdated: '8 seconds ago',
      status: 'testnet',
    },
    {
      id: 'WEATHER-DATA-PREMIUM',
      price: '0.0025',
      confidence: '0.0001',
      lastUpdated: '10 seconds ago',
      status: 'testnet',
    },
    {
      id: 'CLIMATE-MODEL-ACCESS',
      price: '0.35',
      confidence: '0.005',
      lastUpdated: '15 seconds ago',
      status: 'testnet',
    },
  ];

  const weatherDataServices = [
    {
      id: 'global-forecast',
      name: 'Global Weather Forecast Feed',
      description: 'High-resolution global weather forecasting data',
      price: '0.0025 WRF per query',
      status: 'testnet',
    },
    {
      id: 'climate-model',
      name: 'Climate Model Access',
      description: 'Premium access to computational climate models',
      price: '0.35 WRF per hour',
      status: 'testnet',
    },
    {
      id: 'weather-oracle',
      name: 'Weather Oracle Service',
      description: 'Verified weather data for smart contracts',
      price: '0.01 WRF per verification',
      status: 'development',
    },
  ];

  useEffect(() => {
    // Simulate API data loading
    setIsLoading(true);
    setTimeout(() => {
      setPriceFeeds(mockPriceFeeds);
      setPythDataServices(weatherDataServices);
      setIsLoading(false);
    }, 1000);
  }, [selectedChain]);

  const handleRefreshPrices = () => {
    setIsLoading(true);
    devLog('Getting price for ETH-USD');
    // In a real implementation, this would fetch fresh price data from Pyth
    setTimeout(() => {
      // Simulate updated prices with small random changes
      const updatedPrices = mockPriceFeeds.map(feed => {
        const currentPrice = parseFloat(feed.price);
        const change = Math.random() * 0.02 - 0.01; // +/- 1%
        const newPrice = (currentPrice * (1 + change)).toFixed(
          feed.id.includes('WEATHER') ? 4 : 2,
        );
        return {
          ...feed,
          price: newPrice,
          lastUpdated: 'just now',
        };
      });
      setPriceFeeds(updatedPrices);
      setIsLoading(false);
    }, 1500);
  };

  const renderOverviewTab = () => {
    return (
      <div className="integration-tab-content">
        <WrfCard headerTitle="Pyth Network Integration" className="integration-info-card">
          <p>
              Pyth Network provides high-fidelity price feeds for financial and
              weather data on Wrfcoin. This integration enables:
          </p>
          <ul>
            <li>Real-time price feeds for WRF tokens</li>
            <li>Accurate pricing for computational weather models</li>
            <li>Weather data oracle services for smart contracts</li>
            <li>Cross-chain verification of climate data</li>
          </ul>

          <h4>
              Integration Status:{' '}
            <WrfBadge color="warning">Testnet</WrfBadge>
          </h4>

          <div className="stats-container">
            <div className="stat-box">
              <span className="stat-value">{priceFeeds.length}</span>
              <span className="stat-label">Price Feeds</span>
            </div>
            <div className="stat-box">
              <span className="stat-value">
                {supportedChains.filter(c => c.status === 'live').length}
              </span>
              <span className="stat-label">Connected Chains</span>
            </div>
            <div className="stat-box">
              <span className="stat-value">{pythDataServices.length}</span>
              <span className="stat-label">Weather Services</span>
            </div>
          </div>
        </WrfCard>
      </div>
    );
  };

  const renderPriceFeedsTab = () => {
    return (
      <div className="integration-tab-content">
        <WrfCard headerTitle="Price Feeds">
          <div className="card-header-actions">
            <WrfSelect
              className="chain-selector"
              value={selectedChain}
              onChange={e => setSelectedChain(e.target.value)}
            >
              {supportedChains.map(chain => (
                <option key={chain.id} value={chain.id}>
                  {chain.name} {chain.status === 'testnet' ? '(Testnet)' : ''}
                </option>
              ))}
            </WrfSelect>
            <WrfButton
              variant="primary"
              size="sm"
              onClick={handleRefreshPrices}
              disabled={isLoading}
            >
              <i className="bi bi-arrow-repeat"></i> Refresh
            </WrfButton>
          </div>
          {isLoading ? (
            <div className="loading-spinner">
              <i className="bi bi-arrow-repeat spinning"></i>
              <span>Loading price data...</span>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Price Feed</th>
                  <th>Price</th>
                  <th>Confidence</th>
                  <th>Last Updated</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {priceFeeds.map(feed => (
                  <tr key={feed.id}>
                    <td>{feed.id}</td>
                    <td>${feed.price}</td>
                    <td>±${feed.confidence}</td>
                    <td>{feed.lastUpdated}</td>
                    <td>
                      {feed.status === 'live' ? (
                        <WrfBadge color="success">Live</WrfBadge>
                      ) : (
                        <WrfBadge color="warning">Testnet</WrfBadge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </WrfCard>
      </div>
    );
  };

  const renderWeatherServicesTab = () => {
    return (
      <div className="integration-tab-content">
        <WrfCard headerTitle="Weather Data Services">
          <div className="card-header-actions">
            <WrfButton variant="outline" size="sm">
              <i className="bi bi-plus"></i> Request New Feed
            </WrfButton>
          </div>
          {pythDataServices.map(service => (
            <div key={service.id} className="service-card">
              <div className="service-header">
                <h4>{service.name}</h4>
                {service.status === 'testnet' ? (
                  <WrfBadge color="warning">Testnet</WrfBadge>
                ) : service.status === 'development' ? (
                  <WrfBadge color="info">In Development</WrfBadge>
                ) : (
                  <WrfBadge color="success">Live</WrfBadge>
                )}
              </div>
              <div className="service-description">
                <p>{service.description}</p>
              </div>
              <div className="service-details">
                <span className="service-price">
                  <i className="bi bi-currency-exchange"></i> {service.price}
                </span>
                <WrfButton variant="primary" size="sm">
                  <i className="bi bi-cloud-download"></i> Access Service
                </WrfButton>
              </div>
            </div>
          ))}
        </WrfCard>
      </div>
    );
  };

  const renderGovernanceTab = () => {
    return (
      <div className="integration-tab-content">
        <WrfCard headerTitle="Pyth Governance">
          <div className="governance-info">
            <h4>Pyth DAO Status</h4>
            <p>
                The Pyth Network is governed by a decentralized autonomous
                organization (DAO) that manages price feed providers and data
                quality. Wrfcoin is currently applying to become a data provider
                for specialized weather and climate metrics.
            </p>

            <div className="governance-stats">
              <div className="stat-box">
                <span className="stat-value">2</span>
                <span className="stat-label">Active Proposals</span>
              </div>
              <div className="stat-box">
                <span className="stat-value">5.3M</span>
                <span className="stat-label">PYTH Staked</span>
              </div>
              <div className="stat-box">
                <span className="stat-value">0</span>
                <span className="stat-label">Wrfcoin Votes</span>
              </div>
            </div>

            <h4>Pending Proposals</h4>
            <div className="proposal-card">
              <div className="proposal-header">
                <h5>PIP-23: Add Weather Data Providers</h5>
                <WrfBadge color="info">Voting</WrfBadge>
              </div>
              <p>
                  Proposal to add specialized weather data providers to the Pyth
                  network, including Wrfcoin's computational climate models as a
                  verified data source.
              </p>
              <div className="proposal-actions">
                <WrfButton variant="primary" size="sm" disabled>
                    Support (requires PYTH tokens)
                </WrfButton>
              </div>
            </div>

            <div className="proposal-card">
              <div className="proposal-header">
                <h5>PIP-24: Expand to IoT Weather Sensors</h5>
                <WrfBadge color="info">Discussion</WrfBadge>
              </div>
              <p>
                  Proposal to expand Pyth Oracle services to include IoT weather
                  sensor data for enhanced real-world verification of climate
                  conditions.
              </p>
              <div className="proposal-actions">
                <WrfButton variant="outline" size="sm" disabled>
                    Provide Feedback
                </WrfButton>
              </div>
            </div>
          </div>
        </WrfCard>
      </div>
    );
  };

  return (
    <div className="integration-card">
      <div className="integration-nav">
        <ul className="integration-nav-list">
          <li
            className={`integration-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="bi bi-info-circle"></i> Overview
          </li>
          <li
            className={`integration-nav-item ${activeTab === 'price-feeds' ? 'active' : ''}`}
            onClick={() => setActiveTab('price-feeds')}
          >
            <i className="bi bi-graph-up"></i> Price Feeds
          </li>
          <li
            className={`integration-nav-item ${activeTab === 'weather-services' ? 'active' : ''}`}
            onClick={() => setActiveTab('weather-services')}
          >
            <i className="bi bi-cloud"></i> Weather Services
          </li>
          <li
            className={`integration-nav-item ${activeTab === 'governance' ? 'active' : ''}`}
            onClick={() => setActiveTab('governance')}
          >
            <i className="bi bi-people"></i> Governance
          </li>
        </ul>
      </div>
      <div className="integration-content">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'price-feeds' && renderPriceFeedsTab()}
        {activeTab === 'weather-services' && renderWeatherServicesTab()}
        {activeTab === 'governance' && renderGovernanceTab()}
      </div>
    </div>
  );
};

export default PythCard;
