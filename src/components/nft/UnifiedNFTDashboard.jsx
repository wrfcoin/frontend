import React, { useState } from 'react';
import CreateNft from '../CreateNft/CreateNft';
import NFTShowcase from '../ComputationalNFT/NFTShowcase';
import WRFGFSRecipeBuilder from '../ComputationalNFT/WRFGFSRecipeBuilder';
import EnterpriseDemo from '../ComputationalNFT/EnterpriseDemo';
import BrowseNFTTab from './BrowseNFTTab';
import MyExecutionsTab from './MyExecutionsTab';
import './UnifiedNFTDashboard.css';

/**
 * Unified NFT Dashboard Component
 *
 * Consolidates all NFT functionality into one comprehensive marketplace:
 * - Browse NFT (from ComputationalNFTMarketplace)
 * - My Executions (from ComputationalNFTMarketplace)
 * - WRF/GFS Models (from /nfts page)
 * - Enterprise Demo (from /nfts page)
 * - NFT Showcase (from /nfts page)
 * - Create NFT (standard functionality)
 */
const UnifiedNFTDashboard = () => {
  const [activeTab, setActiveTab] = useState('browse');

  const getTabTitle = () => {
    switch (activeTab) {
    case 'browse':
      return 'Browse NFT Marketplace';
    case 'executions':
      return 'My Executions Dashboard';
    case 'wrf-gfs':
      return 'WRF/GFS Weather Models';
    case 'enterprise':
      return 'Enterprise Demo';
    case 'showcase':
      return 'NFT Showcase';
    case 'create':
      return 'Create New NFT';
    default:
      return 'Enterprise Computational NFT Demo';
    }
  };

  return (
    <div className="unified-nft-dashboard" style={{ paddingTop: '20px' }}>
      <h1
        style={{ textAlign: 'center', marginBottom: '30px', color: '#2196F3' }}
      >
        {getTabTitle()}
      </h1>
      <div className="tab-navigation">
        <div
          className={`tab-item ${activeTab === 'browse' ? 'active' : ''}`}
          onClick={() => setActiveTab('browse')}
        >
          <i className="bi bi-search"></i>
          <span>Browse NFT</span>
        </div>
        <div
          className={`tab-item ${activeTab === 'executions' ? 'active' : ''}`}
          onClick={() => setActiveTab('executions')}
        >
          <i className="bi bi-graph-up"></i>
          <span>My Executions</span>
        </div>
        <div
          className={`tab-item ${activeTab === 'wrf-gfs' ? 'active' : ''}`}
          onClick={() => setActiveTab('wrf-gfs')}
        >
          <i className="bi bi-cloud-sun"></i>
          <span>WRF/GFS Models</span>
        </div>
        <div
          className={`tab-item ${activeTab === 'enterprise' ? 'active' : ''}`}
          onClick={() => setActiveTab('enterprise')}
        >
          <i className="bi bi-building"></i>
          <span>Enterprise Demo</span>
        </div>
        <div
          className={`tab-item ${activeTab === 'showcase' ? 'active' : ''}`}
          onClick={() => setActiveTab('showcase')}
        >
          <i className="bi bi-trophy"></i>
          <span>NFT Showcase</span>
        </div>
        <div
          className={`tab-item ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          <i className="bi bi-palette"></i>
          <span>Create NFT</span>
        </div>
      </div>

      <div className="tab-content">
        {activeTab === 'browse' && <BrowseNFTTab />}
        {activeTab === 'executions' && <MyExecutionsTab />}
        {activeTab === 'wrf-gfs' && <WRFGFSRecipeBuilder />}
        {activeTab === 'enterprise' && <EnterpriseDemo />}
        {activeTab === 'showcase' && <NFTShowcase />}
        {activeTab === 'create' && <CreateNft />}
      </div>
    </div>
  );
};

export default UnifiedNFTDashboard;
