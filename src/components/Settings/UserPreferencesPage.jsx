import React, { useState } from 'react';
import { devLog } from '../../utils/logger';

const UserPreferencesPage = () => {
  const [theme, setTheme] = useState('system');
  const [language, setLanguage] = useState('en');
  const [notifications, setNotifications] = useState(true);
  const [dashboardLayout, setDashboardLayout] = useState('default');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [soundNotifications, setSoundNotifications] = useState(true);
  const [compactView, setCompactView] = useState(false);

  const handleSavePreferences = () => {
    devLog('Saving preferences:', {
      theme,
      language,
      notifications,
      dashboardLayout,
    });
    // In a real implementation, this would save to backend
  };

  return (
    <div className="settings-section">
      <h2>
        <i className="fas fa-user-cog"></i> User Preferences
      </h2>
      <p className="settings-description">
        Customize your UI experience and personal preferences for optimal
        usability.
      </p>

      <div className="settings-form">
        <div className="settings-section-divider">
          <h3>Appearance</h3>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Theme</label>
            <select value={theme} onChange={e => setTheme(e.target.value)}>
              <option value="system">System Default</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="contrast">High Contrast</option>
            </select>
            <div className="form-hint">
              Choose how the application looks. System default will match your
              device settings.
            </div>
          </div>

          <div className="form-group">
            <label>Dashboard Layout</label>
            <select
              value={dashboardLayout}
              onChange={e => setDashboardLayout(e.target.value)}
            >
              <option value="default">Standard Layout</option>
              <option value="compact">Compact Layout</option>
              <option value="expanded">Expanded Layout</option>
              <option value="minimal">Minimal (Advanced Users)</option>
            </select>
            <div className="form-hint">
              Customize how information is presented on your dashboard.
            </div>
          </div>
        </div>

        <div className="settings-section-divider">
          <h3>Language & Region</h3>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Language</label>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="zh">Chinese</option>
              <option value="ja">Japanese</option>
              <option value="ko">Korean</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={compactView}
                onChange={e => setCompactView(e.target.checked)}
              />
              <span>Compact View</span>
            </label>
            <div className="form-hint">Show more information in less space</div>
          </div>
        </div>

        <div className="settings-section-divider">
          <h3>Data & Updates</h3>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={e => setAutoRefresh(e.target.checked)}
              />
              <span>Auto Refresh Data</span>
            </label>
            <div className="form-hint">Automatically update dashboard data</div>
          </div>

          {autoRefresh && (
            <div className="form-group">
              <label>Refresh Interval</label>
              <select
                value={refreshInterval}
                onChange={e => setRefreshInterval(parseInt(e.target.value))}
              >
                <option value={10}>10 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={60}>1 minute</option>
                <option value={300}>5 minutes</option>
              </select>
            </div>
          )}
        </div>

        <div className="settings-section-divider">
          <h3>Notifications</h3>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notifications}
                onChange={e => setNotifications(e.target.checked)}
              />
              <span>Enable Desktop Notifications</span>
            </label>
            <div className="form-hint">
              Receive alerts about important blockchain events, transactions,
              and system updates.
            </div>
          </div>

          <div className="form-group">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={soundNotifications}
                onChange={e => setSoundNotifications(e.target.checked)}
              />
              <span>Sound Notifications</span>
            </label>
            <div className="form-hint">
              Play sounds for important notifications
            </div>
          </div>
        </div>
      </div>

      <div className="settings-action-buttons">
        <button className="save-button" onClick={handleSavePreferences}>
          <i className="fas fa-save"></i> Save Preferences
        </button>
      </div>
    </div>
  );
};

export default UserPreferencesPage;
