/**
 * AdvancedPanel Component (Placeholder)
 *
 * Phase 2 component - Advanced wallet features.
 * Will include: Multi-wallet, hardware wallet, cross-chain, security.
 */

import React from 'react';
import { Wallet, HardDrive, Link2, Shield } from 'lucide-react';

const AdvancedPanel = () => {
  const features = [
    { icon: Wallet, label: 'Multi-Wallet', description: 'Manage multiple wallets' },
    { icon: HardDrive, label: 'Hardware Wallet', description: 'Connect Ledger or Trezor' },
    { icon: Link2, label: 'Cross-Chain', description: 'Bridge assets across chains' },
    { icon: Shield, label: 'Security', description: '2FA and advanced settings' },
  ];

  return (
    <div className="wallet-card advanced-panel">
      <div className="advanced-grid">
        {features.map((feature) => (
          <div key={feature.label} className="advanced-feature">
            <div className="feature-icon">
              <feature.icon size={20} />
            </div>
            <div className="feature-info">
              <span className="feature-label">{feature.label}</span>
              <span className="feature-desc">{feature.description}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="coming-soon-text">Full functionality coming in Phase 2</p>
      <style>{`
        .advanced-panel {
          padding: 20px;
        }
        .advanced-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .advanced-feature {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          background: var(--bg-primary, #0F172A);
          border: 1px solid var(--border-default, rgba(51, 65, 85, 0.5));
          border-radius: 12px;
          cursor: not-allowed;
          opacity: 0.6;
          transition: all 0.2s ease-out;
        }
        .advanced-feature:hover {
          opacity: 0.8;
        }
        .feature-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: var(--bg-tertiary, rgba(51, 65, 85, 0.5));
          color: var(--text-secondary, #94A3B8);
        }
        .feature-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .feature-label {
          font-size: 0.9375rem;
          font-weight: 500;
          color: var(--text-primary, #F8FAFC);
        }
        .feature-desc {
          font-size: 0.75rem;
          color: var(--text-muted, #64748B);
        }
        .coming-soon-text {
          text-align: center;
          font-size: 0.75rem;
          color: var(--text-muted, #64748B);
          margin: 16px 0 0;
        }
        @media (max-width: 767px) {
          .advanced-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default AdvancedPanel;
