import { useState, useEffect } from 'react';
import axios from 'axios';
import type { RemediationAction } from './useActiveAlerts';
import { resolveSyncApiBaseUrl } from './syncRuntimeConfig';

const API_BASE = resolveSyncApiBaseUrl();

export interface UseRemediationActionsResult {
  actions: RemediationAction[];
  loading: boolean;
  error: string | null;
}

/**
 * Fetches available remediation actions for a given alert.
 * Uses a cancellation pattern to avoid stale responses when alertId changes.
 */
export function useRemediationActions(
  alertId: string | null,
): UseRemediationActionsResult {
  const [actions, setActions] = useState<RemediationAction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!alertId) {
      setActions([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetchActions = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get<{ success: boolean; data: RemediationAction[] }>(
          `${API_BASE}/api/alerts/${alertId}/actions`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          },
        );
        if (!cancelled) {
          setActions(response.data.data);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError('Remediation API unavailable');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchActions();

    return () => {
      cancelled = true;
    };
  }, [alertId]);

  return { actions, loading, error };
}

export default useRemediationActions;
