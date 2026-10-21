/**
 * WalletOverviewSection Component
 *
 * Balance and address come from useWalletData — no hardcoded values.
 * Renders explicit disconnected / loading / error states.
 */

import React, { useState } from 'react';
import {
  Wallet,
  Send,
  ArrowDownToLine,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  AlertCircle,
  WalletMinimal,
} from 'lucide-react';
import { explorerAddressUrl } from '../../../config/network';
import { useWalletData } from '../../../hooks/useWalletData';
import { formatBaseUnitsToWrf } from '../../../services/apiClient';
import './WalletOverviewSection.css';

const WalletOverviewSection = ({ onSend, onReceive }) => {
  const [copied, setCopied] = useState(false);
  const { account, isConnected, balance, isLoading, error, refresh } = useWalletData({ withTransactions: false });

  const copyAddress = async () => {
    if (!account) return;
    await navigator.clipboard.writeText(account);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 10)}...${addr.substring(addr.length - 8)}`;
  };

  if (!isConnected) {
    return (
      <div className="wallet-overview-section">
        <div className="overview-disconnected">
          <WalletMinimal size={40} />
          <p>Connect your wallet to see your balance.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="wallet-overview-section">
        <div className="overview-loading">
          <RefreshCw size={24} className="spinning" />
          <p>Loading wallet data…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wallet-overview-section">
        <div className="overview-error">
          <AlertCircle size={24} />
          <p>Could not load wallet data.</p>
          <button className="refresh-btn" onClick={refresh} aria-label="Retry">
            <RefreshCw size={18} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-overview-section">
      {/* Main Balance Card */}
      <div className="overview-balance-card">
        <div className="balance-header">
          <div className="balance-label">
            <Wallet size={20} />
            <span>Available Balance</span>
          </div>
          <button
            className="refresh-btn"
            onClick={refresh}
            aria-label="Refresh balance"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        <div className="balance-amount">
          <span className="balance-value">
            {/* balance is an EXACT base-units string (issue #236); format it to WRF
                without the 1e8 inflation the raw toLocaleString() produced (#245). */}
            {balance !== null
              ? (formatBaseUnitsToWrf(balance, 4) ?? '—')
              : '—'}
          </span>
          <span className="balance-symbol">WRF</span>
        </div>

        {/* Address Display */}
        <div className="wallet-address-row">
          <span className="address-text">{formatAddress(account)}</span>
          <button className="copy-btn" onClick={copyAddress} aria-label="Copy address">
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
          {explorerAddressUrl(account) && (
            <a
              href={explorerAddressUrl(account)}
              target="_blank"
              rel="noopener noreferrer"
              className="explorer-link"
              aria-label="View on explorer"
            >
              <ExternalLink size={16} />
            </a>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="overview-quick-actions">
        {typeof onSend === 'function' && (
          <button className="action-btn primary" onClick={onSend}>
            <Send size={20} />
            <span>Send</span>
          </button>
        )}
        <button className="action-btn secondary" onClick={onReceive}>
          <ArrowDownToLine size={20} />
          <span>Receive</span>
        </button>
      </div>
    </div>
  );
};

export default WalletOverviewSection;
