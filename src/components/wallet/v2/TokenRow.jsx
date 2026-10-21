/**
 * TokenRow Component
 *
 * Individual token display with balance, USD value, price change,
 * and inline quick-swap trigger.
 */

import React from 'react';
import { ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-react';

// Token icons mapping (placeholder - replace with actual token icons)
const tokenIcons = {
  WRF: '/assets/tokens/wrf.svg',
  ETH: '/assets/tokens/eth.svg',
  USDC: '/assets/tokens/usdc.svg',
  USDT: '/assets/tokens/usdt.svg',
  BTC: '/assets/tokens/btc.svg',
  MATIC: '/assets/tokens/matic.svg',
};

// Fallback icon component
const TokenIconFallback = ({ symbol }) => (
  <div className="token-icon-fallback">
    {symbol.slice(0, 2)}
  </div>
);

const TokenRow = ({
  token,
  onQuickSwap,
  onSelect,
  balanceHidden = false,
}) => {
  const {
    symbol,
    name,
    balance,
    usdValue,
    change24h,
    iconUrl,
  } = token;

  const hasUsdValue = typeof usdValue === 'number' && Number.isFinite(usdValue);
  const hasChange = typeof change24h === 'number' && Number.isFinite(change24h);
  const isPositive = hasChange && change24h >= 0;

  const formatBalance = (value) => {
    if (balanceHidden) return '••••••';
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(2)}K`;
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  };

  const formatUsdValue = (value) => {
    if (balanceHidden) return '••••••';
    return `$${value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handleQuickSwap = (e) => {
    e.stopPropagation();
    onQuickSwap?.(token);
  };

  return (
    <div
      className="token-row"
      onClick={() => onSelect?.(token)}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === 'Enter' && onSelect?.(token)}
    >
      {/* Token Icon & Info */}
      <div className="token-info">
        <div className="token-icon-wrapper">
          {iconUrl || tokenIcons[symbol] ? (
            <img
              src={iconUrl || tokenIcons[symbol]}
              alt={symbol}
              className="token-icon-img"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <TokenIconFallback symbol={symbol} />
        </div>
        <div className="token-details">
          <span className="token-name">{name}</span>
          <span className="token-symbol">{symbol}</span>
        </div>
      </div>

      {/* Balance & Value */}
      <div className="token-balance-section">
        <span className="token-balance">{formatBalance(balance)}</span>
        {hasUsdValue && (
          <span className="token-usd">{formatUsdValue(usdValue)}</span>
        )}
      </div>

      {/* Price Change (only when price data is available) */}
      {hasChange && (
        <div className={`token-change ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>{isPositive ? '+' : ''}{change24h.toFixed(2)}%</span>
        </div>
      )}

      {/* Quick Swap Trigger */}
      <button
        className="quick-swap-btn"
        onClick={handleQuickSwap}
        aria-label={`Quick swap ${symbol}`}
        title={`Swap ${symbol}`}
      >
        <ArrowUpDown size={18} />
      </button>
    </div>
  );
};

export default TokenRow;
