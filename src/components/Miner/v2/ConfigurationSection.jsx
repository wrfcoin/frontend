/**
 * ConfigurationSection - Mining configuration settings
 * Wallet address, algorithm selection, and hardware settings
 *
 * frontend#354/#355 (codex round 8 on #390): none of these settings exist
 * for this chain. There is no browser miner, no algorithm or intensity knob,
 * and Save had no handler. The form, with its seeded wallet address, is a
 * sample. The default build explains that contribution is configured on the
 * station collector, and never mounts the form.
 */

import React from 'react';
import { Wallet, Cpu, Zap, Shield, Save, RefreshCw } from 'lucide-react';
import DemoSurfaceGate from '../../common/DemoSurfaceGate';

const ConfigurationSample = () => {
  const config = {
    walletAddress: 'wrf1q84sh2j72ez0ulgupk0jzfmz4j7kzfwj3dk4kv',
    algorithm: 'equihash',
    intensity: 80,
    powerLimit: 85,
    fanSpeed: 'auto',
    startOnBoot: false,
    lowPriorityMode: true,
  };


  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    background: 'rgba(15, 15, 25, 0.6)',
    border: '1px solid rgba(168, 85, 247, 0.2)',
    borderRadius: '10px',
    color: '#E8E8F0',
    fontSize: '0.875rem',
    fontFamily: '\'JetBrains Mono\', monospace',
    outline: 'none',
    transition: 'all 0.2s ease',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: '500',
    color: 'rgba(232, 232, 240, 0.6)',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
      <p id="miner-configuration-unavailable" style={{ gridColumn: '1 / -1', margin: 0 }}>
        Configuration controls are unavailable: this chain has no browser processing settings. Configure your station collector instead.
      </p>
      {/* Wallet Configuration */}
      <div className="miner-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Wallet size={18} style={{ color: '#A855F7' }} />
          <span style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#E8E8F0' }}>Wallet Configuration</span>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Wallet Address</label>
          <input
            type="text"
            value={config.walletAddress}
            disabled
            aria-describedby="miner-configuration-unavailable"
            placeholder="Enter your WRF wallet address"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Mining Algorithm</label>
          <select
            value={config.algorithm}
            disabled
            aria-describedby="miner-configuration-unavailable"
            style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
          >
            <option value="equihash">Equihash (Default)</option>
            <option value="sha256d">SHA-256d</option>
            <option value="cryptonight">CryptoNight</option>
            <option value="ethash">Ethash</option>
          </select>
        </div>
      </div>

      {/* Hardware Settings */}
      <div className="miner-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Cpu size={18} style={{ color: '#A855F7' }} />
          <span style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#E8E8F0' }}>Hardware Settings</span>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Mining Intensity: {config.intensity}%</label>
          <input
            type="range"
            min="10"
            max="100"
            value={config.intensity}
            disabled
            aria-describedby="miner-configuration-unavailable"
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              background: `linear-gradient(to right, #A855F7 ${config.intensity}%, rgba(168, 85, 247, 0.2) ${config.intensity}%)`,
              appearance: 'none',
              cursor: 'pointer',
            }}
          />
        </div>

        <div>
          <label style={labelStyle}>Power Limit: {config.powerLimit}%</label>
          <input
            type="range"
            min="50"
            max="100"
            value={config.powerLimit}
            disabled
            aria-describedby="miner-configuration-unavailable"
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              background: `linear-gradient(to right, #F59E0B ${config.powerLimit - 50}%, rgba(245, 158, 11, 0.2) ${config.powerLimit - 50}%)`,
              appearance: 'none',
              cursor: 'pointer',
            }}
          />
        </div>
      </div>

      {/* Advanced Options */}
      <div className="miner-card" style={{ padding: '24px', gridColumn: 'span 2' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Shield size={18} style={{ color: '#A855F7' }} />
          <span style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#E8E8F0' }}>Advanced Options</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 16px',
            background: config.startOnBoot ? 'rgba(168, 85, 247, 0.1)' : 'rgba(15, 15, 25, 0.4)',
            border: `1px solid ${config.startOnBoot ? 'rgba(168, 85, 247, 0.3)' : 'rgba(168, 85, 247, 0.1)'}`,
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}>
            <input
              type="checkbox"
              checked={config.startOnBoot}
              disabled
              aria-describedby="miner-configuration-unavailable"
              style={{ display: 'none' }}
            />
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '6px',
              border: `2px solid ${config.startOnBoot ? '#A855F7' : 'rgba(168, 85, 247, 0.3)'}`,
              background: config.startOnBoot ? '#A855F7' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {config.startOnBoot && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <span style={{ fontSize: '0.875rem', color: '#E8E8F0' }}>Start on System Boot</span>
          </label>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 16px',
            background: config.lowPriorityMode ? 'rgba(168, 85, 247, 0.1)' : 'rgba(15, 15, 25, 0.4)',
            border: `1px solid ${config.lowPriorityMode ? 'rgba(168, 85, 247, 0.3)' : 'rgba(168, 85, 247, 0.1)'}`,
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}>
            <input
              type="checkbox"
              checked={config.lowPriorityMode}
              disabled
              aria-describedby="miner-configuration-unavailable"
              style={{ display: 'none' }}
            />
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '6px',
              border: `2px solid ${config.lowPriorityMode ? '#A855F7' : 'rgba(168, 85, 247, 0.3)'}`,
              background: config.lowPriorityMode ? '#A855F7' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {config.lowPriorityMode && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <span style={{ fontSize: '0.875rem', color: '#E8E8F0' }}>Low Priority Mode</span>
          </label>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" disabled aria-describedby="miner-configuration-unavailable" style={{
              flex: 1,
              padding: '14px 16px',
              background: 'linear-gradient(135deg, #A855F7 0%, #9333EA 100%)',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}>
              <Save size={16} />
              Save
            </button>
            <button type="button" disabled aria-label="Refresh configuration" aria-describedby="miner-configuration-unavailable" style={{
              padding: '14px 16px',
              background: 'rgba(168, 85, 247, 0.1)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '10px',
              color: '#A855F7',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 767px) {
          .miner-section .section-content > div {
            grid-template-columns: 1fr !important;
          }
          .miner-section .section-content > div > div:last-child {
            grid-column: span 1 !important;
          }
          .miner-section .section-content > div > div:last-child > div {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

const ConfigurationSection = () => (
  <DemoSurfaceGate
    title="Processing is configured on your station collector"
    description="The browser has no processing settings on this chain: contribution, payout wallet and schedule are set when a station collector is connected."
    testId="miner-configuration"
  >
    <ConfigurationSample />
  </DemoSurfaceGate>
);

export default ConfigurationSection;
