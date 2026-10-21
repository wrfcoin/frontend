/**
 * useBridgeFinalityStatus Hook
 *
 * Polls the bridge finality API for a given transaction hash and returns
 * the current finality status, derived trust state, loading, and error info.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL } from '../services/config';
import type { BridgeFinalityStatus, BridgeTransactionFinalityInfo } from '../types/bridge';
import { buildFinalityInfo } from '../types/bridge';

const POLL_INTERVAL_MS = 10_000; // 10 seconds

interface UseBridgeFinalityStatusOptions {
  /** Polling interval in milliseconds. Defaults to 10000 (10s). */
  pollInterval?: number;
  /** Whether polling is enabled. Defaults to true. */
  enabled?: boolean;
}

interface UseBridgeFinalityStatusReturn {
  /** The full finality info including derived trust state and progress. Null until first successful fetch. */
  data: BridgeTransactionFinalityInfo | null;
  /** True during the initial load (no data yet). */
  isLoading: boolean;
  /** Error message from the most recent failed fetch, or null. */
  error: string | null;
  /** Manually trigger a refetch. */
  refetch: () => void;
}

/**
 * Fetches and polls bridge finality status for a specific transaction.
 *
 * @param txHash - The transaction hash to monitor. Pass empty string or undefined to disable.
 * @param options - Optional configuration for polling behavior.
 */
export function useBridgeFinalityStatus(
  txHash: string | undefined,
  options: UseBridgeFinalityStatusOptions = {},
): UseBridgeFinalityStatusReturn {
  const { pollInterval = POLL_INTERVAL_MS, enabled = true } = options;

  const [data, setData] = useState<BridgeTransactionFinalityInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const fetchFinalityStatus = useCallback(async () => {
    if (!txHash) {
      return;
    }

    // Only show loading on first fetch (when no data exists yet)
    if (!data) {
      setIsLoading(true);
    }

    try {
      const endpointCandidates = [
        `${API_BASE_URL}/bridge/finality/${txHash}`,
        `${API_BASE_URL}/bridges/finality/${txHash}`,
      ];
      let response: Response | null = null;
      let networkError: Error | null = null;

      for (const endpoint of endpointCandidates) {
        try {
          const candidate = await fetch(endpoint);
          if (candidate.ok) {
            response = candidate;
            break;
          }

          // Non-404 errors should be surfaced immediately.
          if (candidate.status !== 404) {
            response = candidate;
            break;
          }
        } catch (err) {
          networkError = err instanceof Error ? err : new Error('Failed to fetch finality status');
        }
      }

      if (!isMountedRef.current) {
        return;
      }

      if (!response) {
        if (networkError) {
          throw networkError;
        }
        setError('Transaction not found or not being monitored');
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        if (response.status === 404) {
          setError('Transaction not found or not being monitored');
        } else {
          setError(`Failed to fetch finality status (HTTP ${response.status})`);
        }
        setIsLoading(false);
        return;
      }

      const body = await response.json();
      const rawStatus: BridgeFinalityStatus = body?.data ?? body;
      const finalityInfo = buildFinalityInfo(rawStatus);

      if (isMountedRef.current) {
        setData(finalityInfo);
        setError(null);
        setIsLoading(false);

        // Stop polling once finalized
        if (finalityInfo.trustState === 'finalized' && intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch finality status');
        setIsLoading(false);
      }
    }
  }, [txHash, data]);

  const refetch = useCallback(() => {
    fetchFinalityStatus();
  }, [fetchFinalityStatus]);

  // Set up polling
  useEffect(() => {
    isMountedRef.current = true;

    if (!txHash || !enabled) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    // Fetch immediately
    fetchFinalityStatus();

    // Set up interval for subsequent fetches
    intervalRef.current = setInterval(fetchFinalityStatus, pollInterval);

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [txHash, enabled, pollInterval]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}

export default useBridgeFinalityStatus;
