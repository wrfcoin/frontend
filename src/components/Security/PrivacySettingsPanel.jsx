// Stub Privacy Settings Panel for SecurityDashboard
import React from 'react';

const PrivacySettingsPanel = ({ settings = {}, onSettingsChange = () => {} }) => {
  return (
    <div style={{
      padding: '20px',
      background: '#1a1a2e',
      borderRadius: '8px',
      color: '#fff',
    }}>
      <h3 style={{ margin: '0 0 16px 0' }}>Privacy Settings</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Privacy Level</span>
          <select
            value={settings.privacyLevel || 'standard'}
            onChange={(e) => onSettingsChange({ privacyLevel: e.target.value })}
            style={{ padding: '8px', background: '#333', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
          >
            <option value="minimal">Minimal</option>
            <option value="standard">Standard</option>
            <option value="enhanced">Enhanced</option>
            <option value="maximum">Maximum</option>
          </select>
        </label>
        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Anonymous Transactions</span>
          <input
            type="checkbox"
            checked={settings.anonymousTransactions || false}
            onChange={(e) => onSettingsChange({ anonymousTransactions: e.target.checked })}
          />
        </label>
        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Hide Balances</span>
          <input
            type="checkbox"
            checked={settings.hideBalances || false}
            onChange={(e) => onSettingsChange({ hideBalances: e.target.checked })}
          />
        </label>
      </div>
    </div>
  );
};

export default PrivacySettingsPanel;
