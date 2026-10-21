/**
 * Developer Portal - Main page for API key management and developer resources
 */

import React, { useState, useEffect } from 'react';
import { WrfTabs, WrfTabPanel } from '../components/DesignSystem';
import './DeveloperPortal.css';
import ApiKeyManager from '../components/developer/ApiKeyManager';
import UsageAnalytics from '../components/developer/UsageAnalytics';
import ApiDocumentation from '../components/developer/ApiDocumentation';
import SDKDownloads from '../components/developer/SDKDownloads';
import RealTimeApiDashboard from '../components/developer/RealTimeApiDashboard';
import ComingSoonPanel from '../components/wallet/v2/ComingSoonPanel';

const DeveloperPortal = () => {
  const [activeTab, setActiveTab] = useState('api-keys');
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    setProfileError(null);
    try {
      // This would typically come from your auth context
      setUserProfile({
        id: 'user-123',
        name: 'Developer User',
        email: 'developer@example.com',
        plan: 'Standard',
      });
    } catch (error) {
      console.error('Error loading user profile:', error);
      setProfileError(error.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="developer-portal loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Developer Portal...</p>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="developer-portal">
        <div
          style={{
            padding: '24px',
            margin: '24px',
            border: '1px solid var(--danger-color, #dc3545)',
            borderRadius: '8px',
            background: 'rgba(220,53,69,0.05)',
          }}
        >
          <p style={{ margin: '0 0 8px', fontWeight: 600, color: 'var(--danger-color, #dc3545)' }}>
            Failed to load Developer Portal
          </p>
          <p style={{ margin: '0 0 16px', fontSize: '0.9em', opacity: 0.8 }}>{profileError}</p>
          <button
            onClick={loadUserProfile}
            style={{
              background: 'var(--primary-color, #007bff)',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="developer-portal">
      <div className="portal-header">
        <div className="header-content">
          <h1>WRFCoin Developer Portal</h1>
          <p className="portal-subtitle">
            Build powerful applications with our climate-focused blockchain
            platform
          </p>

          <div className="user-info">
            <div className="user-avatar">
              {userProfile?.name?.charAt(0) || 'D'}
            </div>
            <div className="user-details">
              <span className="user-name">{userProfile?.name}</span>
              <span className="user-plan">{userProfile?.plan} Plan</span>
            </div>
          </div>
        </div>
      </div>

      <div className="portal-navigation">
        <WrfTabs
          value={activeTab}
          onChange={(newVal) => setActiveTab(newVal)}
          items={[
            { label: 'API Keys', value: 'api-keys' },
            { label: 'Analytics', value: 'analytics' },
            { label: 'Real-Time Monitoring', value: 'monitoring' },
            { label: 'Documentation', value: 'documentation' },
            { label: 'SDKs & Tools', value: 'sdks' },
          ]}
        />
      </div>

      <div className="portal-content">
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Compute Credits</h2>
          <ComingSoonPanel title="Fiat purchase unavailable" showBadge={false}
            description="WRF cannot be purchased with fiat. No purchase provider is connected for testnet compute credits." />
        </section>

        <WrfTabPanel value="api-keys" activeValue={activeTab}>
          <div className="panel-header">
            <h2>API Key Management</h2>
            <p>Create and manage API keys for your applications</p>
          </div>
          <ApiKeyManager userId={userProfile?.id} />
        </WrfTabPanel>

        <WrfTabPanel value="analytics" activeValue={activeTab}>
          <div className="panel-header">
            <h2>Usage Analytics</h2>
            <p>Monitor your API usage and performance metrics</p>
          </div>
          <UsageAnalytics userId={userProfile?.id} />
        </WrfTabPanel>

        <WrfTabPanel value="monitoring" activeValue={activeTab}>
          <div className="panel-header">
            <h2>Real-Time API Monitoring</h2>
            <p>
              Live dashboard for API health, performance metrics, and system
              alerts
            </p>
          </div>
          <RealTimeApiDashboard userId={userProfile?.id} />
        </WrfTabPanel>

        <WrfTabPanel value="documentation" activeValue={activeTab}>
          <div className="panel-header">
            <h2>API Documentation</h2>
            <p>Complete reference for WRFCoin APIs</p>
          </div>
          <ApiDocumentation />
        </WrfTabPanel>

        <WrfTabPanel value="sdks" activeValue={activeTab}>
          <div className="panel-header">
            <h2>SDKs & Developer Tools</h2>
            <p>
              Download SDKs and tools for your preferred programming language
            </p>
          </div>
          <SDKDownloads />
        </WrfTabPanel>
      </div>

      <div className="portal-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Resources</h4>
            <ul>
              <li>
                <a href="/docs" target="_blank">
                  Documentation
                </a>
              </li>
              <li>
                <a href="/tutorials" target="_blank">
                  Tutorials
                </a>
              </li>
              <li>
                <a href="/examples" target="_blank">
                  Code Examples
                </a>
              </li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Support</h4>
            <ul>
              <li>
                <a href="https://discord.gg/wrfcoin" target="_blank">
                  Discord Community
                </a>
              </li>
              <li>
                <a href="https://github.com/wrfcoin" target="_blank">
                  GitHub
                </a>
              </li>
              <li>
                <a href="mailto:developers@wrfcoin.org">Email Support</a>
              </li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Legal</h4>
            <ul>
              <li>
                <a href="/terms" target="_blank">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/privacy" target="_blank">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/api-terms" target="_blank">
                  API Terms
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeveloperPortal;
