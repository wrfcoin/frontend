/**
 * WalletHero Component
 *
 * Displays the primary WRF balance for the connected account with an animated
 * counter. Balance comes from the live WRFCoin backend wallet API via
 * useWalletData — no mock/hardcoded values. Renders explicit
 * disconnected / loading / error / empty states.
 */

import React, { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  WalletMinimal,
} from 'lucide-react';
import { useWalletData } from '../../../hooks/useWalletData';
import { formatBaseUnitsToWrf } from '../../../services/apiClient';
import { NATIVE_SYMBOL, NETWORK_NAME } from '../../../config/network';
import './WalletHero.css';

/**
 * Animated counter for the WRF balance.
 *
 * `balance` is an EXACT base-units string (issue #236). The resting/final value
 * is always rendered from `formatBaseUnitsToWrf`, so no precision is ever lost in
 * what the user sees — even for balances above 2^53. The count-up animation is
 * purely cosmetic and runs on a clamped JS-number approximation; it always snaps
 * to the exact formatted string at the end.
 */
const AnimatedBalance = ({ balance, hidden }) => {
  // Exact, lossless display string (e.g. "90,071,992.55"). null if balance is
  // not interpretable as integer base units.
  const exactDisplay = formatBaseUnitsToWrf(balance, 4) ?? '0.00';

  // Animation target as a (possibly clamped) JS number of WRF coins. Only used to
  // drive the cosmetic count-up; never the final displayed value.
  const targetWrf = (() => {
    const n = Number(balance);
    if (!Number.isFinite(n)) return 0;
    // balance is in base units; 1 WRF = 1e8 base units.
    return n / 1e8;
  })();

  const [displayValue, setDisplayValue] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (hidden) return undefined;

    setDone(false);
    const duration = 800;
    const steps = 30;
    const increment = targetWrf / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= targetWrf) {
        setDisplayValue(targetWrf);
        setDone(true);
        clearInterval(timer);
      } else {
        setDisplayValue(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [targetWrf, hidden]);

  if (hidden) {
    return <span className="balance-hidden">••••••</span>;
  }

  // Once the animation settles, show the exact lossless string; during the
  // count-up, show the cosmetic approximation.
  const text = done
    ? exactDisplay
    : displayValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });

  return (
    <span className="balance-value">
      {text} <span className="balance-symbol">{NATIVE_SYMBOL}</span>
    </span>
  );
};

const WalletHero = () => {
  const { isConnected, balance, isLoading, error, refresh } = useWalletData({
    withTransactions: false,
  });

  const [balanceHidden, setBalanceHidden] = useState(() => {
    const saved = localStorage.getItem('wallet_hide_balance');
    return saved === 'true';
  });

  const toggleBalanceVisibility = () => {
    const newState = !balanceHidden;
    setBalanceHidden(newState);
    localStorage.setItem('wallet_hide_balance', newState.toString());
  };

  return (
    <div className="wallet-card wallet-hero">
      {/* Header */}
      <div className="hero-header">
        <div className="hero-label">
          <span>Total Balance</span>
          <button
            className="visibility-toggle"
            onClick={toggleBalanceVisibility}
            aria-label={balanceHidden ? 'Show balance' : 'Hide balance'}
          >
            {balanceHidden ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <button
          className={`refresh-btn ${isLoading ? 'spinning' : ''}`}
          onClick={refresh}
          disabled={!isConnected || isLoading}
          aria-label="Refresh balance"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Body — disconnected / error / loading / balance */}
      {!isConnected ? (
        <div className="hero-state hero-disconnected">
          <WalletMinimal size={28} />
          <p>Connect a wallet to view your balance.</p>
        </div>
      ) : error ? (
        <div className="hero-state hero-error">
          <AlertCircle size={28} />
          <p>Couldn&apos;t load your balance.</p>
          <button className="hero-retry" onClick={refresh}>
            Retry
          </button>
        </div>
      ) : isLoading && balance === null ? (
        <div className="hero-state hero-loading">
          <RefreshCw size={28} className="spinning" />
          <p>Loading balance…</p>
        </div>
      ) : (
        <>
          <div className="hero-balance">
            <AnimatedBalance balance={balance ?? '0'} hidden={balanceHidden} />
          </div>
          <div className="hero-network">
            {/* No status dot: nothing here measures the network's health. */}
            <span>{NETWORK_NAME}</span>
          </div>
        </>
      )}
    </div>
  );
};

export default WalletHero;
