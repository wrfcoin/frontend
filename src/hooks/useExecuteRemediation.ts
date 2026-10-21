import { useState, useCallback } from 'react';
import axios from 'axios';
import { resolveSyncApiBaseUrl } from './syncRuntimeConfig';

const API_BASE = resolveSyncApiBaseUrl();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ExecutionStatus =
  | 'idle'
  | 'confirming'
  | 'executing'
  | 'success'
  | 'failure';

export interface ExecutionResult {
  incidentId?: string;
  message: string;
}

export interface UseExecuteRemediationResult {
  status: ExecutionStatus;
  result: ExecutionResult | null;
  error: string | null;
  execute: (alertId: string, action: string, reason: string) => Promise<void>;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useExecuteRemediation(): UseExecuteRemediationResult {
  const [status, setStatus] = useState<ExecutionStatus>('idle');
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (alertId: string, action: string, reason: string) => {
      setStatus('executing');
      setResult(null);
      setError(null);

      try {
        const token = localStorage.getItem('token');
        const response = await axios.post(
          `${API_BASE}/api/alerts/${alertId}/remediate`,
          { action, reason },
          {
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          },
        );

        setStatus('success');
        setResult({
          incidentId: response.data.data.incidentId,
          message: response.data.data.message || 'Remediation executed successfully',
        });
      } catch (err: unknown) {
        setStatus('failure');
        if (axios.isAxiosError(err) && err.response?.data?.error?.message) {
          setError(err.response.data.error.message);
        } else {
          setError('Remediation request failed');
        }
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
    setError(null);
  }, []);

  return { status, result, error, execute, reset };
}

export default useExecuteRemediation;
