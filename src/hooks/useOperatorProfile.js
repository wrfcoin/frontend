import { useState, useEffect, useCallback, useRef } from 'react';
import { getAuthToken } from '../services/authTokenStore';

/**
 * Fetch a contributor's operator profile from GET /api/operators/:walletAddress/profile.
 * Public endpoint, no auth required.
 *
 * @param {string|null} walletAddress
 */
export function useOperatorProfile(walletAddress) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const runFetch = useCallback(async (signal) => {
    if (!walletAddress) return;
    setLoading(true);
    setError(null);
    try {
      // Optional wallet token: lets the server tell this page it is the caller's own (`isYou`, profileKey).
      const token = getAuthToken();
      const res = await fetch(`/api/operators/${walletAddress}/profile`, {
        signal,
        ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
      });
      if (signal?.aborted) return;
      if (res.status === 404) {
        setProfile(null);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (signal?.aborted) return;
      setProfile(json.profile ?? null);
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    // Clear prior profile so a stale in-flight response cannot render
    // another wallet's data into the new wallet's view.
    setProfile(null);
    setError(null);

    if (abortRef.current) abortRef.current.abort();
    if (!walletAddress) return undefined;

    const controller = new AbortController();
    abortRef.current = controller;
    runFetch(controller.signal);
    return () => controller.abort();
  }, [walletAddress, runFetch]);

  const refetch = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    return runFetch(controller.signal);
  }, [runFetch]);

  return { profile, loading, error, refetch };
}
