import React, { useState } from 'react';
import './Settings.css';
import { devLog } from '../../utils/logger';

const PrivacyPage = () => {
  const [settings, setSettings] = useState({
    enableTor: false,
    enableIpMasking: true,
    enablePrivateTransactions: false,
    enableDnsLookupProtection: true,
    shareTelemetry: false,
    shareNodeStatistics: true,
    enableMixedTransactions: false,
    blockchainAnonymity: 'standard',
    socialRecoveryContacts: '',
    privacyMode: 'balanced',
  });

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = e => {
    e.preventDefault();
    // Save privacy settings - in a real app, this would connect to an API
    devLog('Saving privacy settings:', settings);
    alert('Privacy settings saved!');
  };

  const handleReset = () => {
    setSettings({
      enableTor: false,
      enableIpMasking: true,
      enablePrivateTransactions: false,
      enableDnsLookupProtection: true,
      shareTelemetry: false,
      shareNodeStatistics: true,
      enableMixedTransactions: false,
      blockchainAnonymity: 'standard',
      socialRecoveryContacts: '',
      privacyMode: 'balanced',
    });
  };

  return (
    <div className="settings-content">
      <div className="settings-section">
        <h2>
          <i className="bi bi-shield-lock"></i> Privacy Settings
        </h2>
        <p className="settings-description">
          Configure your privacy preferences for the Wrfcoin Core node. These
          settings determine how your node interacts with the network and
          protects your identity.
        </p>

        <form className="settings-form" onSubmit={handleSubmit}>
          <div className="settings-section-divider">
            <h3>Privacy Mode</h3>
          </div>

          <div className="form-group">
            <label htmlFor="privacyMode">Privacy Mode</label>
            <select
              id="privacyMode"
              name="privacyMode"
              value={settings.privacyMode}
              onChange={handleChange}
            >
              <option value="standard">
                Standard - Default privacy settings
              </option>
              <option value="balanced">
                Balanced - Enhanced privacy with good performance
              </option>
              <option value="maximum">
                Maximum - Strongest privacy protections
              </option>
            </select>
            <div className="form-hint">
              Adjusts multiple settings based on your privacy needs
            </div>
          </div>

          <div className="settings-section-divider">
            <h3>Network Traffic Privacy</h3>
          </div>

          <div className="form-group">
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="enableTor"
                name="enableTor"
                checked={settings.enableTor}
                onChange={handleChange}
              />
              <label htmlFor="enableTor">Route All Traffic Through Tor</label>
            </div>
            <div className="form-hint">
              Routes all network traffic through the Tor network for enhanced
              anonymity
            </div>
          </div>

          <div className="form-group">
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="enableIpMasking"
                name="enableIpMasking"
                checked={settings.enableIpMasking}
                onChange={handleChange}
              />
              <label htmlFor="enableIpMasking">Enable IP Address Masking</label>
            </div>
            <div className="form-hint">
              Hides your real IP address from other network participants
            </div>
          </div>

          <div className="form-group">
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="enableDnsLookupProtection"
                name="enableDnsLookupProtection"
                checked={settings.enableDnsLookupProtection}
                onChange={handleChange}
              />
              <label htmlFor="enableDnsLookupProtection">
                DNS Lookup Privacy Protection
              </label>
            </div>
            <div className="form-hint">
              Prevents DNS leaks that could reveal your browsing activities
            </div>
          </div>

          <div className="settings-section-divider">
            <h3>Transaction Privacy</h3>
          </div>

          <div className="form-group">
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="enablePrivateTransactions"
                name="enablePrivateTransactions"
                checked={settings.enablePrivateTransactions}
                onChange={handleChange}
              />
              <label htmlFor="enablePrivateTransactions">
                Enable Private Transactions
              </label>
            </div>
            <div className="form-hint">
              Private transactions may incur additional fees
            </div>
          </div>

          <div className="form-group">
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="enableMixedTransactions"
                name="enableMixedTransactions"
                checked={settings.enableMixedTransactions}
                onChange={handleChange}
              />
              <label htmlFor="enableMixedTransactions">
                Enable Coin Mixing for Transactions
              </label>
            </div>
            <div className="form-hint">
              Mixes your coins with other users' to increase privacy
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="blockchainAnonymity">
              Blockchain Anonymity Level
            </label>
            <select
              id="blockchainAnonymity"
              name="blockchainAnonymity"
              value={settings.blockchainAnonymity}
              onChange={handleChange}
            >
              <option value="standard">Standard</option>
              <option value="enhanced">Enhanced (slower)</option>
              <option value="maximum">Maximum (much slower)</option>
            </select>
            <div className="form-hint">
              Higher levels provide more privacy but reduce performance
            </div>
          </div>

          <div className="settings-section-divider">
            <h3>Telemetry & Data Sharing</h3>
          </div>

          <div className="form-group">
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="shareTelemetry"
                name="shareTelemetry"
                checked={settings.shareTelemetry}
                onChange={handleChange}
              />
              <label htmlFor="shareTelemetry">Share Telemetry Data</label>
            </div>
            <div className="form-hint">
              Helps improve Wrfcoin Core but shares usage data
            </div>
          </div>

          <div className="form-group">
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="shareNodeStatistics"
                name="shareNodeStatistics"
                checked={settings.shareNodeStatistics}
                onChange={handleChange}
              />
              <label htmlFor="shareNodeStatistics">Share Node Statistics</label>
            </div>
            <div className="form-hint">
              Helps the network but reveals node performance data
            </div>
          </div>

          <div className="settings-section-divider">
            <h3>Recovery Options</h3>
          </div>

          <div className="form-group">
            <label htmlFor="socialRecoveryContacts">
              Social Recovery Trusted Contacts
            </label>
            <textarea
              id="socialRecoveryContacts"
              name="socialRecoveryContacts"
              value={settings.socialRecoveryContacts}
              onChange={handleChange}
              placeholder="Enter trusted wallet addresses or email addresses (one per line)"
              rows="4"
            />
            <div className="form-hint">
              Used only for wallet recovery, stored encrypted on your device
            </div>
          </div>

          <div className="privacy-notice">
            <h3>Privacy Notice</h3>
            <p>
              Wrfcoin Core takes your privacy seriously. All settings are stored
              locally and never shared with third parties. Private transactions
              are secured using zero-knowledge proofs. For maximum privacy, we
              recommend enabling Tor routing and private transactions.
            </p>
          </div>

          <div className="settings-action-buttons">
            <button type="submit" className="save-button">
              <i className="bi bi-shield-check"></i> Save Privacy Settings
            </button>
            <button
              type="button"
              className="cancel-button"
              onClick={handleReset}
            >
              <i className="bi bi-arrow-counterclockwise"></i> Reset to Defaults
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PrivacyPage;
