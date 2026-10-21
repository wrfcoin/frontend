import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { resolveSyncApiBaseUrl } from './syncRuntimeConfig';

const API_BASE = resolveSyncApiBaseUrl();
const POLL_INTERVAL_MS = 30_000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RemediationAction {
  action: string;
  riskLevel: 'low' | 'medium' | 'high';
  description: string;
  requiresReason: boolean;
  cooldownRemaining: number;
  enabled: boolean;
}

export interface RemediationAlert {
  id: string;
  alertName: string;
  severity: 'SEV1' | 'SEV2' | 'SEV3' | 'SEV4';
  status: 'firing' | 'resolved';
  summary: string;
  startedAt: string;
  playbook?: {
    actions: RemediationAction[];
    description: string;
  };
}

export interface UseActiveAlertsResult {
  alerts: RemediationAlert[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useActiveAlerts(): UseActiveAlertsResult {
  const [alerts, setAlerts] = useState<RemediationAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get<{ success: boolean; data: RemediationAlert[] }>(
        `${API_BASE}/api/alerts/active`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      setAlerts(response.data.data);
      setError(null);
    } catch {
      setError('Remediation API unavailable');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    intervalRef.current = setInterval(fetchAlerts, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchAlerts]);

  return { alerts, loading, error, refetch: fetchAlerts };
}

export default useActiveAlerts;
