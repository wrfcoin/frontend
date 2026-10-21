/**
 * TransactionHistorySection Component
 *
 * Full transaction history with filters, search, and export.
 * Data comes from useWalletData — no mock/hardcoded transactions.
 * Renders explicit loading / error / empty / disconnected states.
 */

import React, { useState, useMemo } from 'react';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  WalletMinimal,
} from 'lucide-react';
import { explorerTxUrl } from '../../../config/network';
import { useWalletData } from '../../../hooks/useWalletData';
import './TransactionHistorySection.css';

const txTypeConfig = {
  send: { icon: ArrowUpRight, label: 'Sent', color: 'var(--accent-red, #EF4444)' },
  receive: { icon: ArrowDownLeft, label: 'Received', color: 'var(--accent-green, #22C55E)' },
  weather_reward: { icon: Zap, label: 'Weather Reward', color: 'var(--accent-amber, #F59E0B)' },
};

const statusConfig = {
  confirmed: { icon: CheckCircle, label: 'Confirmed', color: 'var(--accent-green, #22C55E)' },
  pending: { icon: Clock, label: 'Pending', color: 'var(--accent-amber, #F59E0B)' },
  failed: { icon: XCircle, label: 'Failed', color: 'var(--accent-red, #EF4444)' },
};

const formatRelativeTime = (date) => {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const formatAddress = (addr) => {
  if (!addr) return '';
  return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
};

const TransactionHistorySection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { transactions, isLoading, error, refresh, isConnected } = useWalletData({ withTransactions: true });

  const filteredTransactions = useMemo(() => {
    let txs = [...transactions];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      txs = txs.filter(tx =>
        (tx.hash || '').toLowerCase().includes(query) ||
        (tx.symbol || '').toLowerCase().includes(query) ||
        (tx.fullAddress || '').toLowerCase().includes(query),
      );
    }

    if (filterType !== 'all') {
      txs = txs.filter(tx => tx.type === filterType);
    }

    if (filterStatus !== 'all') {
      txs = txs.filter(tx => tx.status === filterStatus);
    }

    return txs.sort((a, b) => b.timestamp - a.timestamp);
  }, [transactions, searchQuery, filterType, filterStatus]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTxs = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleExport = () => {
    const csv = [
      ['Date', 'Type', 'Amount', 'Symbol', 'Status', 'Hash'].join(','),
      ...filteredTransactions.map(tx => [
        tx.timestamp.toISOString(),
        tx.type,
        tx.amount,
        tx.symbol || 'WRF',
        tx.status,
        tx.hash,
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isConnected) {
    return (
      <div className="transaction-history-section">
        <div className="tx-empty">
          <WalletMinimal size={48} />
          <h3>Wallet not connected</h3>
          <p>Connect your wallet to see transaction history.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="transaction-history-section">
        <div className="tx-loading">
          <RefreshCw size={32} className="spinning" />
          <p>Loading transactions…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="transaction-history-section">
        <div className="tx-error">
          <AlertCircle size={32} />
          <h3>Could not load transactions</h3>
          <p>{error.message}</p>
          <button onClick={refresh}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="transaction-history-section">
      {/* Controls */}
      <div className="tx-controls">
        <div className="tx-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by hash, token, or address..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="tx-filters">
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="send">Sent</option>
            <option value="receive">Received</option>
            <option value="weather_reward">Rewards</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <button
            className="export-btn"
            onClick={handleExport}
            disabled={filteredTransactions.length === 0}
          >
            <Download size={18} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Transaction List */}
      <div className="tx-list">
        {paginatedTxs.length === 0 ? (
          <div className="tx-empty">
            <Clock size={48} />
            <h3>No transactions found</h3>
            <p>{searchQuery || filterType !== 'all' || filterStatus !== 'all'
              ? 'Try adjusting your filters or search query.'
              : 'Your on-chain activity will appear here.'}</p>
          </div>
        ) : (
          paginatedTxs.map(tx => {
            const TypeIcon = txTypeConfig[tx.type]?.icon || ArrowDownLeft;
            const StatusIcon = statusConfig[tx.status]?.icon || Clock;

            return (
              <div key={tx.id} className={`tx-row ${tx.status}`}>
                <div className="tx-type">
                  <div
                    className="tx-type-icon"
                    style={{ color: txTypeConfig[tx.type]?.color }}
                  >
                    <TypeIcon size={20} />
                  </div>
                  <div className="tx-type-info">
                    <span className="tx-type-label">
                      {txTypeConfig[tx.type]?.label || tx.type}
                    </span>
                    <span className="tx-time">{formatRelativeTime(tx.timestamp)}</span>
                  </div>
                </div>

                <div className="tx-details">
                  {tx.address && (
                    <span className="tx-address">
                      {tx.type === 'send' ? 'To' : 'From'}: {formatAddress(tx.address)}
                    </span>
                  )}
                </div>

                <div className="tx-amount">
                  <span className={`amount ${tx.type === 'send' ? 'negative' : 'positive'}`}>
                    {tx.type === 'send' ? '-' : '+'}{tx.amount} {tx.symbol || 'WRF'}
                  </span>
                </div>

                <div className="tx-status">
                  <span
                    className={`status-badge ${tx.status}`}
                    style={{ color: statusConfig[tx.status]?.color }}
                  >
                    <StatusIcon size={14} />
                    {statusConfig[tx.status]?.label || tx.status}
                  </span>
                </div>

                <div className="tx-actions">
                  {explorerTxUrl(tx.hash) && (
                    <a
                      href={explorerTxUrl(tx.hash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tx-link"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="tx-pagination">
          <button
            className="page-btn"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={18} />
          </button>
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="page-btn"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionHistorySection;
