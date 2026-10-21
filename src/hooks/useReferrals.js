import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react';

import { getAuthToken, subscribeAuthToken } from '../services/authTokenStore';
import { readJwtSubject } from '../services/walletJwtSubject';
import { captureReferralFromLocation, getPendingReferral, applyPendingReferralForWallet } from '../services/referralAttribution';
export { captureReferralFromLocation, getPendingReferral } from '../services/referralAttribution';

/**
 * Generate and retrieve a referral code for a wallet, plus fetch stats.
 *
 * @param {string|null} walletAddress
 */
export function useReferrals(walletAddress) {
  const [referralCode, setReferralCode] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);
  const token = useSyncExternalStore(subscribeAuthToken, getAuthToken, getAuthToken);
  const walletRef = useRef(walletAddress);
  walletRef.current = walletAddress;
  const hasWalletSession = Boolean(walletAddress && token && readJwtSubject(token)?.toLowerCase() === walletAddress.toLowerCase());

  const writeHeaders = useCallback(() => {
    const currentToken = getAuthToken();
    if (!walletAddress || walletRef.current !== walletAddress ||
        !currentToken || readJwtSubject(currentToken)?.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new Error('Sign in with the connected wallet to use referrals.');
    }
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${currentToken}` };
  }, [walletAddress]);

  const stillCurrent = useCallback((requestToken) =>
    walletRef.current === walletAddress && getAuthToken() === requestToken,
  [walletAddress]);

  useEffect(() => { captureReferralFromLocation(); }, []);

  const fetchStats = useCallback(async (signal) => {
    if (!walletAddress) return;
    try {
      const res = await fetch(`/api/referrals/stats/${walletAddress}`, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!signal?.aborted && walletRef.current === walletAddress) setStats(json.data);
    } catch (err) {
      if (err.name === 'AbortError' || signal?.aborted || walletRef.current !== walletAddress) return;
      setError(err.message);
    }
  }, [walletAddress]);

  const generateCode = useCallback(async () => {
    if (!walletAddress) return;
    setGenerating(true);
    setError(null);
    const requestToken = getAuthToken();
    try {
      const headers = writeHeaders();
      const res = await fetch('/api/referrals/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ walletAddress }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!stillCurrent(requestToken)) return;
      setReferralCode(json.data.referralCode);
      await fetchStats();
    } catch (err) {
      if (stillCurrent(requestToken)) setError(err.message);
    } finally {
      if (stillCurrent(requestToken)) setGenerating(false);
    }
  }, [walletAddress, fetchStats, writeHeaders, stillCurrent]);

  // Manual callers share the same write slot as the successful-login caller.
  const applyPendingReferral = useCallback(async () => {
    const requestToken = getAuthToken();
    const result = await applyPendingReferralForWallet(walletAddress);
    if (stillCurrent(requestToken)) await fetchStats();
    return result;
  }, [walletAddress, fetchStats, stillCurrent]);

  useEffect(() => {
    // Clear prior wallet's data immediately so a stale in-flight response
    // cannot leak another account's invite code.
    setReferralCode(null);
    setGenerating(false);
    setStats(null);
    setError(null);

    // Abort any in-flight request from the previous wallet.
    if (abortRef.current) abortRef.current.abort();

    if (!walletAddress) {
      setLoading(false);
      return undefined;
    }

    if (!hasWalletSession) setError('Sign in with the connected wallet to use referrals.');

    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    setLoading(true);
    Promise.all([
      // Public stats do not require authentication; only gate the write.
      hasWalletSession ? fetch('/api/referrals/generate', {
        method: 'POST',
        headers: writeHeaders(),
        body: JSON.stringify({ walletAddress }),
        signal,
      })
        .then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then(json => {
          if (signal.aborted) return;
          if (json.data?.referralCode) setReferralCode(json.data.referralCode);
        }) : Promise.resolve(),
      fetchStats(signal),
    ])
      .catch(err => {
        if (err.name === 'AbortError') return;
        setError(err.message);
      })
      .finally(() => {
        if (!signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [walletAddress, token, hasWalletSession, fetchStats, writeHeaders]);

  return { referralCode, stats, loading, generating, error, generateCode, applyPendingReferral, pendingReferral: getPendingReferral(), refetch: fetchStats };
}
