/**
 * RecentTransactions Component
 *
 * Compact transaction list backed by the connected wallet's backend
 * transaction feed.
 */

import React, { useState } from 'react';
import Alert from '@mui/material/Alert';
import {
  ArrowUpRight,
  ArrowDownLeft,
  ArrowUpDown,
  Landmark,
  Pickaxe,
  Gift,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Clock,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import useWalletData from '../../hooks/useWalletData';
import { formatTransactionAmount } from './transactionAmount';
import './RecentTransactions.css';

const transactionTypes = {
  send: {
    icon: ArrowUpRight,
    label: 'Sent',
    color: '#EF4444',
    prefix: '-',
  },
  receive: {
    icon: ArrowDownLeft,
    label: 'Received',
    color: '#22C55E',
    prefix: '+',
  },
  swap: {
    icon: ArrowUpDown,
    label: 'Swap',
    color: '#8B5CF6',
    prefix: '',
  },
  bridge: {
    icon: Landmark,
    label: 'Bridge',
    color: '#F97316',
    prefix: '',
  },
  mining: {
    icon: Pickaxe,
    label: 'Mining Reward',
    color: '#A855F7',
    prefix: '+',
  },
  reward: {
    icon: Gift,
    label: 'Reward',
    color: '#22C55E',
    prefix: '+',
  },
};

const explorerBaseUrl = (import.meta.env?.VITE_EXPLORER_URL || '').replace(/\/$/, '');

const formatRelativeTime = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (!Number.isFinite(date.getTime())) return 'Unknown time';
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const TransactionHash = ({ hash }) => {
  if (!hash) {
    return <span className="detail-value">Unavailable</span>;
  }

  if (!explorerBaseUrl) {
    return <span className="detail-value hash">{hash}</span>;
  }

  return (
    <a
      href={`${explorerBaseUrl}/tx/${hash}`}
      className="detail-value hash"
      target="_blank"
      rel="noopener noreferrer"
    >
      {hash}
      <ExternalLink size={12} />
    </a>
  );
};

const TransactionItem = ({ transaction, isExpanded, onToggle }) => {
  const config = transactionTypes[transaction.type] || transactionTypes.receive;
  const Icon = config.icon;
  const displayAmount = formatTransactionAmount(transaction.amount, config.prefix, transaction.symbol || 'WRF');
  const StatusIcon = transaction.status === 'confirmed' ? CheckCircle2 : Loader2;
  const hash = transaction.hash || transaction.id;

  return (
    <div className={`transaction-item ${isExpanded ? 'expanded' : ''}`}>
      <div className="transaction-main" onClick={onToggle}>
        <div className="transaction-icon" style={{ '--tx-color': config.color }}>
          <Icon size={16} />
        </div>

        <div className="transaction-info">
          <span className="transaction-type">{config.label}</span>
          <span className="transaction-time">
            <Clock size={12} />
            {formatRelativeTime(transaction.timestamp)}
          </span>
        </div>

        <div className="transaction-amount" style={{ color: config.color }}>
          <span className="amount-value font-mono">{displayAmount}</span>
          <span className={`transaction-status ${transaction.status}`}>
            <StatusIcon size={12} className={transaction.status === 'pending' ? 'spinning' : ''} />
          </span>
        </div>

        <button className="expand-btn">
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {isExpanded && (
        <div className="transaction-details">
          <div className="detail-row">
            <span className="detail-label">Transaction Hash</span>
            <TransactionHash hash={hash} />
          </div>

          {transaction.address && (
            <div className="detail-row">
              <span className="detail-label">Counterparty</span>
              <span className="detail-value font-mono">{transaction.address}</span>
            </div>
          )}

          {transaction.gasFee !== undefined && (
            <div className="detail-row">
              <span className="detail-label">Fee</span>
              <span className="detail-value font-mono">{transaction.gasFee} WRF</span>
            </div>
          )}

          <div className="detail-row">
            <span className="detail-label">Confirmations</span>
            <span className="detail-value">
              <span className={`confirmation-badge ${(transaction.confirmations || 0) >= 1 ? 'confirmed' : 'pending'}`}>
                {transaction.confirmations ?? 0}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const RecentTransactions = ({ limit = 5 }) => {
  const [expandedId, setExpandedId] = useState(null);
  const {
    account,
    isConnected,
    transactions,
    isLoading,
    error,
  } = useWalletData({ withTransactions: true });

  const handleToggle = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const visibleTransactions = transactions.slice(0, limit);

  const renderState = () => {
    if (!isConnected || !account) {
      return <Alert severity="info">Connect a wallet to load live recent activity.</Alert>;
    }

    if (error) {
      return <Alert severity="error">Unable to load wallet transactions: {error.message}</Alert>;
    }

    if (isLoading) {
      return <Alert severity="info">Loading wallet transactions...</Alert>;
    }

    if (visibleTransactions.length === 0) {
      return (
        <div className="no-transactions">
          <p>No recent transactions</p>
        </div>
      );
    }

    return null;
  };

  const state = renderState();

  return (
    <div className="recent-transactions dashboard-card">
      <div className="transactions-header">
        <h4>Recent Activity</h4>
        <a href="/transactions" className="view-all-link">
          View All
        </a>
      </div>

      {state || (
        <div className="transactions-list">
          {visibleTransactions.map((tx) => (
            <TransactionItem
              key={tx.id}
              transaction={tx}
              isExpanded={expandedId === tx.id}
              onToggle={() => handleToggle(tx.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentTransactions;
