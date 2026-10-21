import React, { useState } from 'react';
import IPKit from './IPKit';
import ProtocolContracts from './ProtocolContracts';
import NFTOracle from './NFTOracle';

/**
 * Story Protocol Integration Container Component
 *
 * This component serves as the main interface for Story Protocol integrations,
 * combining the three key technologies: IPKit, Protocol Contracts, and NFT Oracle.
 */
function StoryProtocolIntegration() {
  const [activeTab, setActiveTab] = useState('ipkit');

  return (
    <div className="story-protocol-container">
      <div className="story-protocol-header">
        <h2>Story Protocol Integration</h2>
        <p className="description">
          Leverage Story Protocol's technologies to enhance intellectual
          property management, provenance tracking, and real-world data
          validation for weather data and computational models.
        </p>
      </div>

      <div className="story-protocol-tabs">
        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === 'ipkit' ? 'active' : ''}`}
            onClick={() => setActiveTab('ipkit')}
          >
            IP Kit
          </button>
          <button
            className={`tab-button ${activeTab === 'protocol-contracts' ? 'active' : ''}`}
            onClick={() => setActiveTab('protocol-contracts')}
          >
            Protocol Contracts
          </button>
          <button
            className={`tab-button ${activeTab === 'nft-oracle' ? 'active' : ''}`}
            onClick={() => setActiveTab('nft-oracle')}
          >
            NFT Oracle
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'ipkit' && <IPKit />}
          {activeTab === 'protocol-contracts' && <ProtocolContracts />}
          {activeTab === 'nft-oracle' && <NFTOracle />}
        </div>
      </div>
    </div>
  );
}

export default StoryProtocolIntegration;
