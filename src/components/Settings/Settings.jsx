import React, { useState } from 'react';
import PrivacySettings from '../Privacy/PrivacySettings';
import NFTWhitelistManager from '../Security/NFTWhitelistManager';
import HSMSecurityDashboard from '../Security/HSMSecurityDashboard';
import PageTitle from '../common/PageTitle';
import usePageNavigation from '../../hooks/usePageNavigation';
import UserPreferencesPage from './UserPreferencesPage';
import NetworkPage from './NetworkPage';
import SecurityPage from './SecurityPage';
import IntegrationsPage from './IntegrationsPage';
import './Settings.css';

/**
 * Settings Component
 *
 * A consolidated settings dashboard with multiple tabs for different settings categories.
 * Currently includes:
 * - User Preferences: For customizing the UI and user experience
 * - Privacy Settings: For controlling blockchain privacy features
 * - Network Settings: For configuring node and network behavior
 * - Security Settings: For managing wallet security and authentication
 * - Integrations Settings: For enabling/disabling blockchain integrations
 */
import ModuleManagementPage from './ModuleManagementPage';
import CrossChainConfigPage from './CrossChainConfigPage';
import EnvironmentalDataPage from './EnvironmentalDataPage';
import ServiceManagementPage from './ServiceManagementPage';
import NASStoragePage from './NASStoragePage';
import ComputeContributionPage from './ComputeContributionPage';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('preferences');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { prevPage, nextPage, goToPrev, goToNext } = usePageNavigation();

  return (
    <div className="settings-dashboard">
      <PageTitle
        title="Settings"
        subtitle="Configure your advanced blockchain node and environmental intelligence platform"
        stats={{
          'Active Tab': activeTab.charAt(0).toUpperCase() + activeTab.slice(1),
          Version: '2.1.0',
          'Last Updated': new Date().toLocaleDateString(),
        }}
        showNavigation={true}
        onPrev={goToPrev}
        onNext={goToNext}
        prevLabel={prevPage?.title}
        nextLabel={nextPage?.title}
      />
      <div className="settings-container">
        <div
          className={`settings-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}
        >
          <div className="sidebar-header">
            <div className="sidebar-controls">
              <button
                className="sidebar-pin-button"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                title={
                  sidebarCollapsed
                    ? 'Expand Settings Panel'
                    : 'Collapse Settings Panel'
                }
              >
                <i
                  className={`bi ${sidebarCollapsed ? 'bi-layout-sidebar' : 'bi-layout-sidebar-inset'}`}
                ></i>
                {!sidebarCollapsed && <span>Pin/Unpin</span>}
              </button>
            </div>
            <h4 style={{ display: sidebarCollapsed ? 'none' : 'block' }}>
              SETTINGS
            </h4>
          </div>
          <div className="settings-tabs">
            <div
              className={`settings-tab ${activeTab === 'services' ? 'active' : ''}`}
              onClick={() => setActiveTab('services')}
            >
              <i className="bi bi-server"></i>
              <span>Service Management</span>
            </div>
            <div
              className={`settings-tab ${activeTab === 'modules' ? 'active' : ''}`}
              onClick={() => setActiveTab('modules')}
            >
              <i className="bi bi-gear-wide-connected"></i>
              <span>Module Management</span>
            </div>
            <div
              className={`settings-tab ${activeTab === 'cross-chain' ? 'active' : ''}`}
              onClick={() => setActiveTab('cross-chain')}
            >
              <i className="bi bi-diagram-3-fill"></i>
              <span>Cross-Chain Bridges</span>
            </div>
            <div
              className={`settings-tab ${activeTab === 'environmental' ? 'active' : ''}`}
              onClick={() => setActiveTab('environmental')}
            >
              <i className="bi bi-cloud-drizzle-fill"></i>
              <span>Environmental Data</span>
            </div>
            <div
              className={`settings-tab ${activeTab === 'nas-storage' ? 'active' : ''}`}
              onClick={() => setActiveTab('nas-storage')}
            >
              <i className="bi bi-hdd-stack"></i>
              <span>NAS Storage</span>
            </div>
            <div
              className={`settings-tab ${activeTab === 'preferences' ? 'active' : ''}`}
              onClick={() => setActiveTab('preferences')}
            >
              <i className="bi bi-sliders"></i>
              <span>User Preferences</span>
            </div>
            <div
              className={`settings-tab ${activeTab === 'privacy' ? 'active' : ''}`}
              onClick={() => setActiveTab('privacy')}
            >
              <i className="bi bi-shield-lock"></i>
              <span>Privacy</span>
            </div>
            <div
              className={`settings-tab ${activeTab === 'network' ? 'active' : ''}`}
              onClick={() => setActiveTab('network')}
            >
              <i className="bi bi-diagram-3"></i>
              <span>Network</span>
            </div>
            <div
              className={`settings-tab ${activeTab === 'integrations' ? 'active' : ''}`}
              onClick={() => setActiveTab('integrations')}
            >
              <i className="bi bi-box"></i>
              <span>Integrations</span>
            </div>
            <div
              className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <i className="bi bi-fingerprint"></i>
              <span>Security</span>
            </div>
            <div
              className={`settings-tab ${activeTab === 'compute-contribution' ? 'active' : ''}`}
              onClick={() => setActiveTab('compute-contribution')}
            >
              <i className="bi bi-cpu"></i>
              <span>Compute Contribution</span>
            </div>
            <div
              className={`settings-tab ${activeTab === 'nft-security' ? 'active' : ''}`}
              onClick={() => setActiveTab('nft-security')}
            >
              <i className="bi bi-shield-check"></i>
              <span>NFT Security</span>
            </div>
            <div
              className={`settings-tab ${activeTab === 'blockchain-security' ? 'active' : ''}`}
              onClick={() => setActiveTab('blockchain-security')}
            >
              <i className="bi bi-key-fill"></i>
              <span>Blockchain Security</span>
            </div>
          </div>
        </div>

        <div className="settings-content">
          {activeTab === 'services' && <ServiceManagementPage />}
          {activeTab === 'modules' && <ModuleManagementPage />}
          {activeTab === 'cross-chain' && <CrossChainConfigPage />}
          {activeTab === 'environmental' && <EnvironmentalDataPage />}
          {activeTab === 'nas-storage' && <NASStoragePage />}
          {activeTab === 'compute-contribution' && <ComputeContributionPage />}
          {activeTab === 'preferences' && <UserPreferencesPage />}
          {activeTab === 'privacy' && <PrivacySettings />}
          {activeTab === 'network' && <NetworkPage />}
          {activeTab === 'security' && <SecurityPage />}
          {activeTab === 'integrations' && <IntegrationsPage />}
          {activeTab === 'nft-security' && <NFTWhitelistManager />}
          {activeTab === 'blockchain-security' && <HSMSecurityDashboard />}
        </div>
      </div>
    </div>
  );
};

export default Settings;
