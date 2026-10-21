import React from 'react';
import { WrfCard } from '../DesignSystem';

const MarketData = () => {
  // Using the market data provided by the user
  const marketData = {
    marketCap: '0',
    fdv: '0',
    tradingVolume24h: '0',
    circulatingSupply: '0',
    maxSupply: '42,000,000',
  };

  return (
    <WrfCard title="Market Data">
      <div className="network-status">
        <div className="network-status-item">
          <span className="network-status-label">Market Cap:</span>
          <span className="network-status-value">{marketData.marketCap}</span>
        </div>

        <div className="network-status-item">
          <span className="network-status-label">FDV:</span>
          <span className="network-status-value">{marketData.fdv}</span>
        </div>

        <div className="network-status-item">
          <span className="network-status-label">24H Trading Volume:</span>
          <span className="network-status-value">
            {marketData.tradingVolume24h}
          </span>
        </div>

        <div className="network-status-item">
          <span className="network-status-label">Circulating Supply:</span>
          <span className="network-status-value">
            {marketData.circulatingSupply}
          </span>
        </div>

        <div className="network-status-item">
          <span className="network-status-label">Max Supply:</span>
          <span className="network-status-value">{marketData.maxSupply}</span>
        </div>
      </div>
    </WrfCard>
  );
};

export default MarketData;
