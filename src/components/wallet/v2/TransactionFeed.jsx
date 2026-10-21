/**
 * TransactionFeed Component
 *
 * Displays the connected account's recent transactions from the live WRFCoin
 * backend wallet API. No mock/hardcoded Ethereum transactions. Network labels
 * reference WRFCoin testnet; tx-hash links only render when a block explorer
 * is configured (VITE_EXPLORER_URL). Renders explicit disconnected / loading /
 * error / empty states.
 */

import React, { useState, useMemo } from 'react';
import {
  Send,
  ArrowDownToLine,
  ArrowUpDown,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  WalletMinimal,
} from 'lucide-react';
import { useWalletData } from '../../../hooks/useWalletData';
import { NETWORK_NAME, NATIVE_SYMBOL, explorerTxUrl } from '../../../config/network';
import './TransactionFeed.css';

// Transaction type configurations
const txTypeConfig = {
  send: {
    icon: Send,
    label: 'Sent',
    color: 'var(--accent-red, #EF4444)',
    prefix: '-',
  },
  receive: {
    icon: ArrowDownToLine,
    label: 'Received',
    color: 'var(--accent-green, #22C55E)',
    prefix: '+',
  },
  swap: {
    icon: ArrowUpDown,
    label: 'Swapped',
    color: 'var(--accent-purple, #A855F7)',
    prefix: '',
  },
};

// Status configurations
const statusConfig = {
  pending: {
    icon: Loader2,
    label: 'Pending',
    color: 'var(--accent-amber, #F59E0B)',
    className: 'status-pending',
  },
  confirmed: {
    icon: CheckCircle2,
    label: 'Confirmed',
    color: 'var(--accent-green, #22C55E)',
    className: 'status-confirmed',
  },
  failed: {
    icon: XCircle,
    label: 'Failed',
    color: 'var(--accent-red, #EF4444)',
    className: 'status-failed',
  },
};

// Relative time formatter
const formatRelativeTime = (date) => {
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const shortenAddress = (address) => {
  if (!address) return '';
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}…${address.slice(-6)}`;
};

// Transaction Item Component
const TransactionItem = ({ transaction, expanded, onToggle }) => {
  const config = txTypeConfig[transaction.type] || txTypeConfig.receive;
  const status = statusConfig[transaction.status] || statusConfig.confirmed;
  const Icon = config.icon;
  const StatusIcon = status.icon;
  const txUrl = transaction.hash ? explorerTxUrl(transaction.hash) : null;

  return (
    <div className={`transaction-item ${expanded ? 'expanded' : ''}`}>
      <div
        className="transaction-main"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => e.key === 'Enter' && onToggle()}
      >
        {/* Icon */}
        <div className="tx-icon" style={{ '--tx-color': config.color }}>
          <Icon size={20} />
        </div>

        {/* Info */}
        <div className="tx-info">
          <div className="tx-header">
            <span className="tx-label">{config.label}</span>
            <span className={`tx-status ${status.className}`}>
              <StatusIcon
                size={14}
                className={transaction.status === 'pending' ? 'spinning' : ''}
              />
              <span>{status.label}</span>
            </span>
          </div>
          <div className="tx-address">
            <span>
              {transaction.type === 'send' ? 'To: ' : 'From: '}
              {shortenAddress(transaction.address)}
            </span>
          </div>
        </div>

        {/* Amount & Time */}
        <div className="tx-amount-section">
          <span className="tx-amount" style={{ color: config.color }}>
            {config.prefix}
            {transaction.amount} {transaction.symbol}
          </span>
          <span className="tx-time">
            <Clock size={12} />
            {formatRelativeTime(transaction.timestamp)}
          </span>
        </div>

        {/* Expand Icon */}
        <div className="tx-expand">
          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="transaction-details">
          {transaction.fullAddress && (
            <div className="detail-row">
              <span className="detail-label">
                {transaction.type === 'send' ? 'Recipient' : 'Sender'}
              </span>
              <span className="detail-value address">
                {transaction.fullAddress}
              </span>
            </div>
          )}

          <div className="detail-row">
            <span className="detail-label">Network</span>
            <span className="detail-value">{NETWORK_NAME}</span>
          </div>

          {transaction.gasFee != null && (
            <div className="detail-row">
              <span className="detail-label">Fee</span>
              <span className="detail-value">
                {transaction.gasFee} {NATIVE_SYMBOL}
              </span>
            </div>
          )}

          {transaction.error && (
            <div className="detail-row error">
              <span className="detail-label">Error</span>
              <span className="detail-value">{transaction.error}</span>
            </div>
          )}

          {transaction.hash && (
            <div className="detail-row">
              <span className="detail-label">Transaction Hash</span>
              {txUrl ? (
                <a
                  href={txUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="detail-link"
                >
                  {shortenAddress(transaction.hash)}
                  <ExternalLink size={14} />
                </a>
              ) : (
                <span className="detail-value address">
                  {shortenAddress(transaction.hash)}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const TransactionFeed = ({ maxVisible = 5, onViewAll }) => {
  const { isConnected, transactions, isLoading, error, refresh } =
    useWalletData({ withTransactions: true });
  const [expandedId, setExpandedId] = useState(null);

  const visibleTransactions = useMemo(
    () => transactions.slice(0, maxVisible),
    [transactions, maxVisible],
  );

  const pendingCount = useMemo(
    () => transactions.filter((tx) => tx.status === 'pending').length,
    [transactions],
  );

  const toggleExpanded = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const renderBody = () => {
    if (!isConnected) {
      return (
        <div className="feed-empty">
          <WalletMinimal size={40} className="empty-icon" />
          <p>Connect a wallet to view activity</p>
          <span>Your transactions will appear here once connected.</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="feed-empty">
          <AlertCircle size={40} className="empty-icon" />
          <p>Couldn&apos;t load transactions</p>
          <button className="view-all-btn" onClick={refresh}>
            <span>Retry</span>
          </button>
        </div>
      );
    }

    if (isLoading && transactions.length === 0) {
      return (
        <div className="feed-empty">
          <Loader2 size={40} className="empty-icon spinning" />
          <p>Loading activity…</p>
        </div>
      );
    }

    if (visibleTransactions.length === 0) {
      return (
        <div className="feed-empty">
          <Clock size={40} className="empty-icon" />
          <p>No transactions yet</p>
          <span>Send or receive {NATIVE_SYMBOL} to see your activity here.</span>
        </div>
      );
    }

    return visibleTransactions.map((tx) => (
      <TransactionItem
        key={tx.id}
        transaction={tx}
        expanded={expandedId === tx.id}
        onToggle={() => toggleExpanded(tx.id)}
      />
    ));
  };

  return (
    <div className="transaction-feed">
      {/* Header */}
      <div className="feed-header">
        <span className="feed-title">Recent Activity</span>
        {pendingCount > 0 && (
          <span className="pending-badge">
            <Loader2 size={14} className="spinning" />
            {pendingCount} pending
          </span>
        )}
      </div>

      {/* Body */}
      <div className="feed-body">{renderBody()}</div>

      {/* View All Link */}
      {isConnected && !error && transactions.length > maxVisible && (
        <button className="view-all-btn" onClick={onViewAll}>
          <span>View All Transactions</span>
          <ExternalLink size={16} />
        </button>
      )}
    </div>
  );
};

export default TransactionFeed;
