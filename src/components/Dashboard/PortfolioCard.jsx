/**
 * PortfolioCard Component
 *
 * Displays live connected-wallet balance data. It intentionally avoids fiat
 * conversion and portfolio-history charts until backend-priced portfolio data
 * is available.
 */

import React, { useState } from 'react';
import CountUp from 'react-countup';
import Alert from '@mui/material/Alert';
import {
  Eye,
  EyeOff,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import useWalletData from '../../hooks/useWalletData';
import './PortfolioCard.css';

const HoldingItem = ({ amount }) => (
  <div className="holding-item">
    <div className="holding-info">
      <div className="holding-dot" style={{ background: '#3B82F6' }} />
      <div className="holding-details">
        <span className="holding-symbol">WRF</span>
        <span className="holding-name">WRFCoin</span>
      </div>
    </div>
    <div className="holding-values">
      <span className="holding-value font-mono">
        {amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} WRF
      </span>
      <span className="holding-percent">100%</span>
    </div>
    <div className="holding-bar">
      <div className="holding-bar-fill" style={{ width: '100%', background: '#3B82F6' }} />
    </div>
  </div>
);

const PortfolioCard = () => {
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const {
    account,
    isConnected,
    balance,
    isLoading,
    error,
    refresh,
  } = useWalletData({ withTransactions: false });

  const numericBalance = Number.isFinite(balance) ? balance : 0;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  const renderStatus = () => {
    if (!isConnected || !account) {
      return (
        <Alert severity="info">
          Connect a wallet to load live WRFCoin balance data.
        </Alert>
      );
    }

    if (error) {
      return (
        <Alert severity="error">
          Unable to load wallet balance: {error.message}
        </Alert>
      );
    }

    if (isLoading) {
      return <Alert severity="info">Loading live wallet balance...</Alert>;
    }

    return null;
  };

  const status = renderStatus();

  return (
    <div className="portfolio-card dashboard-card">
      <div className="portfolio-header">
        <div className="portfolio-title">
          <h3>WRFCoin Balance</h3>
          <div className="portfolio-actions">
            <button
              className="icon-btn"
              onClick={() => setIsBalanceHidden(!isBalanceHidden)}
              title={isBalanceHidden ? 'Show balance' : 'Hide balance'}
            >
              {isBalanceHidden ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            <button
              className={`icon-btn ${isRefreshing ? 'spinning' : ''}`}
              onClick={handleRefresh}
              title="Refresh"
              disabled={!account || isRefreshing}
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        <div className="portfolio-value-section">
          <div className="portfolio-main-value">
            {isBalanceHidden ? (
              <span className="hidden-value">********</span>
            ) : (
              <span className="value-amount font-mono">
                <CountUp
                  end={numericBalance}
                  duration={1}
                  decimals={2}
                  separator=","
                  preserveValue
                />
                {' WRF'}
              </span>
            )}
          </div>

          {account && (
            <div className="portfolio-change">
              <Wallet size={16} />
              <span className="change-amount font-mono">{account}</span>
            </div>
          )}
        </div>
      </div>

      {status ? (
        <div className="portfolio-chart">{status}</div>
      ) : (
        <>
          <div className="portfolio-chart">
            <Alert severity="info">
              Portfolio history and fiat valuation are not exposed by the backend yet.
            </Alert>
          </div>

          <div className="holdings-section">
            <div className="holdings-header">
              <h4>Holdings</h4>
            </div>

            <div className="holdings-list">
              <HoldingItem amount={numericBalance} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PortfolioCard;
