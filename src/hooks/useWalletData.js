/**
 * useWalletData
 *
 * Fetches live wallet balance + transactions from the WRFCoin backend wallet
 * API for the currently connected account. Exposes explicit loading / error /
 * empty / disconnected states so wallet UI never falls back to mock numbers.
 *
 * Returns the balance as an EXACT base-units string (issue #236) — never a JS
 * number — so u64/u128 balances above 2^53 are not truncated, plus a normalized
 * transaction list keyed to the connected account.
 *
 * The balance is sourced from `walletService.getBalance()`, which parses the API
 * response with the big-integer-preserving JSON parser in `ApiClient`. The legacy
 * axios-based `walletAPI.getWallet` is intentionally NOT used for the balance, as
 * axios runs native `JSON.parse` internally and would round large integers before
 * we ever see them. Transactions still come from `walletAPI.getTransactions`.
 */

import { useCallback, useEffect, useState } from 'react';
import { walletService } from '../services/apiClient';
import { useWallet } from '../contexts/WalletContext.jsx';

/**
 * Normalize a backend transaction into the shape the feed expects.
 * Backend Transaction: { id, from, to, amount, fee, timestamp, confirmations, type }
 */
const normalizeTransaction = (tx, account) => {
  const isSend =
    account && tx.from && tx.from.toLowerCase() === account.toLowerCase();
  const counterparty = isSend ? tx.to : tx.from;
  const status =
    tx.status === 'confirmed' ||
    (typeof tx.confirmations === 'number' && tx.confirmations > 0)
      ? 'confirmed'
      : 'pending';

  return {
    id: tx.id || tx.hash || `${tx.from}-${tx.to}-${tx.timestamp}`,
    type: tx.type === 'reward' ? 'receive' : isSend ? 'send' : 'receive',
    status,
    amount: tx.amount,
    symbol: 'WRF',
    address: counterparty || '',
    fullAddress: counterparty || '',
    // backend timestamps are seconds; tolerate ms by checking magnitude
    timestamp: new Date(
      tx.timestamp > 1e12 ? tx.timestamp : (tx.timestamp || 0) * 1000,
    ),
    hash: tx.id || tx.hash || '',
    gasFee: tx.fee != null ? Number(tx.fee) : undefined,
    confirmations: tx.confirmations,
  };
};

export const useWalletData = ({ withTransactions = true } = {}) => {
  const { account, isConnected } = useWallet();

  // Exact base-units string (e.g. "9000000000000000001") or null. Never a JS
  // number — see issue #236.
  const [balance, setBalance] = useState(null); // string | null
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!account) {
      setBalance(null);
      setTransactions([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Balance via the lossless ApiClient path; transactions via the legacy API.
      const requests = [walletService.getBalance(account)];
      if (withTransactions) {
        requests.push(walletService.getTransactions(account));
      }

      const [walletBalance, txns] = await Promise.all(requests);

      // walletBalance.balance is an exact base-units string. Keep it as a string
      // end-to-end — do NOT coerce with Number(), which would re-truncate.
      const exact = walletBalance?.balance;
      setBalance(typeof exact === 'string' && exact.length > 0 ? exact : '0');

      if (withTransactions) {
        const list = Array.isArray(txns) ? txns : [];
        setTransactions(list.map((tx) => normalizeTransaction(tx, account)));
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load wallet data'));
      setBalance(null);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [account, withTransactions]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    account,
    isConnected,
    balance,
    transactions,
    isLoading,
    error,
    refresh: load,
  };
};

export default useWalletData;
