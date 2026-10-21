import React, { useState, useEffect } from 'react';
import './IntegrationCards.css';

const ChainlinkCard = () => {
  const [status, setStatus] = useState('connecting');
  const [randomNumber, setRandomNumber] = useState(null);

  useEffect(() => {
    // Simulate connection to Chainlink API
    const timer = setTimeout(() => {
      setStatus('connected');
      setRandomNumber(Math.floor(Math.random() * 1000000));
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const generateNewRandomNumber = () => {
    setStatus('requesting');
    setTimeout(() => {
      setStatus('connected');
      setRandomNumber(Math.floor(Math.random() * 1000000));
    }, 1000);
  };

  return (
    <div className="integration-card">
      <div className="integration-header">
        <h2>Chainlink Integration</h2>
        <div className={`status-indicator ${status}`}>
          {status === 'connecting' && 'Connecting...'}
          {status === 'connected' && 'Connected'}
          {status === 'requesting' && 'Requesting...'}
          {status === 'error' && 'Connection Error'}
        </div>
      </div>

      <div className="integration-content">
        <div className="integration-section">
          <h3>Random Number Generator</h3>
          <p>
            Chainlink VRF (Verifiable Random Function) provides
            cryptographically secure random numbers for smart contracts. This is
            essential for applications requiring randomness like gaming, NFT
            distribution, and fair selection processes.
          </p>

          <div className="random-number-display">
            <div className="number-box">
              {randomNumber !== null ? randomNumber : 'Waiting...'}
            </div>
            <button
              className="generate-btn"
              onClick={generateNewRandomNumber}
              disabled={status === 'connecting' || status === 'requesting'}
            >
              Generate New Random Number
            </button>
          </div>
        </div>

        <div className="integration-section">
          <h3>Price Feeds</h3>
          <p>
            Chainlink Price Feeds provide decentralized, accurate price data for
            various assets that is resistant to manipulation. Wrfcoin uses these
            feeds for cross-chain transactions.
          </p>
          <table className="price-feed-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Price (USD)</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>WRF/USD</td>
                <td>$2.74</td>
                <td>2 min ago</td>
              </tr>
              <tr>
                <td>ETH/USD</td>
                <td>$3,572.18</td>
                <td>1 min ago</td>
              </tr>
              <tr>
                <td>BTC/USD</td>
                <td>$52,384.91</td>
                <td>3 min ago</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="integration-section">
          <h3>Weather Data</h3>
          <p>
            Chainlink Data Feeds for weather information provide reliable
            meteorological data needed for Wrfcoin's Computational NFTs and
            climate modeling applications.
          </p>
          <div className="weather-data-preview">
            <div className="weather-data-item">
              <span className="weather-label">Temperature (NYC):</span>
              <span className="weather-value">72.4°F</span>
            </div>
            <div className="weather-data-item">
              <span className="weather-label">Precipitation (London):</span>
              <span className="weather-value">2.3mm</span>
            </div>
            <div className="weather-data-item">
              <span className="weather-label">Wind Speed (Tokyo):</span>
              <span className="weather-value">12mph</span>
            </div>
          </div>
        </div>
      </div>

      <div className="integration-footer">
        <p>
          Chainlink integration provides secure, verifiable random numbers,
          reliable price feeds, and weather data for Wrfcoin's ecosystem.
        </p>
      </div>
    </div>
  );
};

export default ChainlinkCard;
