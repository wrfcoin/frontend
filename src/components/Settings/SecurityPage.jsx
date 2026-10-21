import React, { useState } from 'react';
import './Settings.css';
import { devLog } from '../../utils/logger';

const SecurityPage = () => {
  const [settings, setSettings] = useState({
    automaticUpdates: true,
    requirePasswordForSending: true,
    walletLockTimeout: 30,
    twoFactorAuth: false,
    minTransactionFee: 0.001,
    encryptWallet: true,
    hideTotalBalance: false,
    showAdvancedOptions: false,
    allowThirdPartyApps: false,
    apiWhitelist: '',
    securityLevel: 'medium',
    backupFrequency: 'weekly',
  });

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]:
        type === 'checkbox'
          ? checked
          : type === 'number'
            ? Number(value)
            : value,
    });
  };

  const handleSubmit = e => {
    e.preventDefault();
    // Save security settings - in a real app, this would connect to an API
    devLog('Saving security settings:', settings);
    alert('Security settings saved!');
  };

  const handleReset = () => {
    setSettings({
      automaticUpdates: true,
      requirePasswordForSending: true,
      walletLockTimeout: 30,
      twoFactorAuth: false,
      minTransactionFee: 0.001,
      encryptWallet: true,
      hideTotalBalance: false,
      showAdvancedOptions: false,
      allowThirdPartyApps: false,
      apiWhitelist: '',
      securityLevel: 'medium',
      backupFrequency: 'weekly',
    });
  };

  const handlePasswordChange = () => {
    const currentPassword = prompt('Enter your current password:');
    if (currentPassword) {
      const newPassword = prompt('Enter your new password:');
      if (newPassword) {
        const confirmPassword = prompt('Confirm your new password:');
        if (newPassword === confirmPassword) {
          alert('Password changed successfully!');
        } else {
          alert('Passwords do not match!');
        }
      }
    }
  };

  const handleBackupWallet = () => {
    alert(
      'Wallet backup initiated. Follow the prompts to save your wallet file.',
    );
    // In a real app, this would trigger a wallet backup process
  };

  return (
    <div className="settings-content">
      <div className="settings-section">
        <h2>
          <i className="bi bi-shield-lock-fill"></i> Security Settings
        </h2>
        <p className="settings-description">
          Configure security options to protect your wallet and node. These
          settings ensure your funds and data remain secure from unauthorized
          access.
        </p>

        <form className="settings-form" onSubmit={handleSubmit}>
          <div className="settings-section-divider">
            <h3>General Security</h3>
          </div>

          <div className="form-group">
            <label htmlFor="securityLevel">Security Level</label>
            <select
              id="securityLevel"
              name="securityLevel"
              value={settings.securityLevel}
              onChange={handleChange}
            >
              <option value="low">Low - Convenient but less secure</option>
              <option value="medium">Medium - Balanced security</option>
              <option value="high">High - Maximum security</option>
            </select>
            <div className="form-hint">
              Adjusts multiple security settings based on your preference
            </div>
          </div>

          <div className="settings-section-divider">
            <h3>Wallet Security</h3>
          </div>

          <div className="form-group">
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="encryptWallet"
                name="encryptWallet"
                checked={settings.encryptWallet}
                onChange={handleChange}
              />
              <label htmlFor="encryptWallet">Encrypt Wallet</label>
            </div>
            <div className="form-hint">
              Protects your wallet with AES-256 encryption
            </div>
          </div>

          <div className="form-group">
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="requirePasswordForSending"
                name="requirePasswordForSending"
                checked={settings.requirePasswordForSending}
                onChange={handleChange}
              />
              <label htmlFor="requirePasswordForSending">
                Require Password for Sending Transactions
              </label>
            </div>
            <div className="form-hint">
              Adds an extra security layer when sending funds
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="walletLockTimeout">
                Wallet Auto-Lock (minutes)
              </label>
              <input
                type="number"
                id="walletLockTimeout"
                name="walletLockTimeout"
                min="0"
                max="1440"
                value={settings.walletLockTimeout}
                onChange={handleChange}
              />
              <div className="form-hint">Set to 0 to disable auto-lock</div>
            </div>

            <div className="form-group">
              <label htmlFor="minTransactionFee">Minimum Transaction Fee</label>
              <input
                type="number"
                id="minTransactionFee"
                name="minTransactionFee"
                min="0.00001"
                step="0.0001"
                value={settings.minTransactionFee}
                onChange={handleChange}
              />
              <div className="form-hint">
                Minimum fee required for transactions
              </div>
            </div>
          </div>

          <div className="form-group">
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="twoFactorAuth"
                name="twoFactorAuth"
                checked={settings.twoFactorAuth}
                onChange={handleChange}
              />
              <label htmlFor="twoFactorAuth">
                Enable Two-Factor Authentication
              </label>
            </div>
            <div className="form-hint">
              Requires a second verification step when accessing your wallet
            </div>
          </div>

          <div className="form-group">
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="hideTotalBalance"
                name="hideTotalBalance"
                checked={settings.hideTotalBalance}
                onChange={handleChange}
              />
              <label htmlFor="hideTotalBalance">Hide Total Balance</label>
            </div>
            <div className="form-hint">
              Hides your balance from view until requested
            </div>
          </div>

          <div className="settings-section-divider">
            <h3>Backup & Recovery</h3>
          </div>

          <div className="form-group">
            <label htmlFor="backupFrequency">Wallet Backup Frequency</label>
            <select
              id="backupFrequency"
              name="backupFrequency"
              value={settings.backupFrequency}
              onChange={handleChange}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="manual">Manual Only</option>
            </select>
            <div className="form-hint">
              How often your wallet is automatically backed up
            </div>
          </div>

          <div className="security-action-card">
            <h4>Important Security Actions</h4>
            <div className="security-buttons">
              <button
                type="button"
                className="security-action-button primary-action"
                onClick={handleBackupWallet}
              >
                <i className="bi bi-cloud-download"></i> Backup Wallet Now
              </button>
              <button
                type="button"
                className="security-action-button"
                onClick={handlePasswordChange}
              >
                <i className="bi bi-key"></i> Change Password
              </button>
            </div>
          </div>

          <div className="settings-section-divider">
            <h3>Software & Updates</h3>
          </div>

          <div className="form-group">
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="automaticUpdates"
                name="automaticUpdates"
                checked={settings.automaticUpdates}
                onChange={handleChange}
              />
              <label htmlFor="automaticUpdates">
                Automatic Software Updates
              </label>
            </div>
            <div className="form-hint">
              Keep Wrfcoin Core up to date with security patches
            </div>
          </div>

          <div className="form-group">
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="showAdvancedOptions"
                name="showAdvancedOptions"
                checked={settings.showAdvancedOptions}
                onChange={handleChange}
              />
              <label htmlFor="showAdvancedOptions">Show Advanced Options</label>
            </div>
            <div className="form-hint">
              Display additional security configuration options
            </div>
          </div>

          {settings.showAdvancedOptions && (
            <div className="advanced-settings-container">
              <div className="settings-section-divider">
                <h3>Advanced Security Options</h3>
              </div>

              <div className="form-group">
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    id="allowThirdPartyApps"
                    name="allowThirdPartyApps"
                    checked={settings.allowThirdPartyApps}
                    onChange={handleChange}
                  />
                  <label htmlFor="allowThirdPartyApps">
                    Allow Third-Party Applications
                  </label>
                </div>
                <div className="form-hint">
                  Enable integration with external applications (potential
                  security risk)
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="apiWhitelist">
                  API Access Whitelist (IP addresses)
                </label>
                <textarea
                  id="apiWhitelist"
                  name="apiWhitelist"
                  value={settings.apiWhitelist}
                  onChange={handleChange}
                  placeholder="127.0.0.1, 192.168.1.100"
                  rows="3"
                />
                <div className="form-hint">
                  Restrict API access to specific IP addresses (comma-separated)
                </div>
              </div>
            </div>
          )}

          <div className="settings-action-buttons">
            <button type="submit" className="save-button">
              <i className="bi bi-shield-check"></i> Save Security Settings
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

export default SecurityPage;
