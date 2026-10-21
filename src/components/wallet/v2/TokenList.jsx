/**
 * TokenList Component
 *
 * Displays the connected account's WRF holding from the live WRFCoin backend
 * wallet API. No mock/hardcoded tokens or fiat values. Renders explicit
 * disconnected / loading / error / empty states.
 */

import React, { useMemo } from 'react';
import { AlertCircle, RefreshCw, WalletMinimal } from 'lucide-react';
import { WrfButton } from '../../DesignSystem';
import TokenRow from './TokenRow';
import { useWalletData } from '../../../hooks/useWalletData';
import { NATIVE_SYMBOL } from '../../../config/network';
import './TokenList.css';

const TokenList = ({ onQuickSwap, onTokenSelect, balanceHidden = false }) => {
  const { isConnected, balance, isLoading, error, refresh } = useWalletData({
    withTransactions: false,
  });

  // The testnet wallet currently holds only the native WRF token. Fiat USD
  // value and 24h change are intentionally omitted (no price oracle on testnet).
  const tokens = useMemo(() => {
    if (balance === null) return [];
    return [
      {
        symbol: NATIVE_SYMBOL,
        name: 'WRFCoin',
        balance,
        iconUrl: null,
      },
    ];
  }, [balance]);

  const renderBody = () => {
    if (!isConnected) {
      return (
        <div className="token-list-empty">
          <WalletMinimal size={32} />
          <p>Connect a wallet to view your assets.</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="token-list-empty">
          <AlertCircle size={32} />
          <p>Couldn&apos;t load your assets.</p>
          <WrfButton variant="ghost" onClick={refresh}>
            Retry
          </WrfButton>
        </div>
      );
    }

    if (isLoading && balance === null) {
      return (
        <div className="token-list-empty">
          <RefreshCw size={32} className="spinning" />
          <p>Loading assets…</p>
        </div>
      );
    }

    if (tokens.length === 0) {
      return (
        <div className="token-list-empty">
          <p>No assets yet</p>
          <span>Receive {NATIVE_SYMBOL} to see your holdings here.</span>
        </div>
      );
    }

    return tokens.map((token) => (
      <TokenRow
        key={token.symbol}
        token={token}
        onQuickSwap={onQuickSwap}
        onSelect={onTokenSelect}
        balanceHidden={balanceHidden}
      />
    ));
  };

  return (
    <div className="token-list">
      {/* Header */}
      <div className="token-list-header">
        <span className="token-list-title">Your Assets</span>
        <button
          className={`sort-btn ${isLoading ? 'spinning' : ''}`}
          onClick={refresh}
          disabled={!isConnected || isLoading}
          aria-label="Refresh assets"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Column Headers */}
      <div className="token-list-columns">
        <span className="col-token">Token</span>
        <span className="col-balance">Balance</span>
        <span className="col-action"></span>
      </div>

      {/* Body */}
      <div className="token-list-body">{renderBody()}</div>
    </div>
  );
};

export default TokenList;
