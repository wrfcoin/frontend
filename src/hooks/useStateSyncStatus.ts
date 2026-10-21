import { useState, useEffect, useCallback, useRef } from 'react';
import { resolveSyncApiBaseUrl } from './syncRuntimeConfig';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProofStatus = 'verified' | 'pending' | 'failed';
export type ReplayStatus = 'enforced' | 'at_risk' | 'rejected';
export type SyncReadiness = 'operational' | 'degraded' | 'unavailable';

export type SyncAction =
  | 'trigger_sync'
  | 'pause_all'
  | 'pause_job'
  | 'resume_job'
  | 'cancel_job'
  | 'clear_blacklist';

export interface SyncFailureCause {
  code: string;
  message: string;
  remediation: string;
  since: string;
  severity: 'warning' | 'critical';
}

export interface SyncOperation {
  id: string;
  height: number;
  stateRootHex: string;
  snapshotRootHex: string;
  signerId: string;
  timestamp: number;
  verified: boolean;
  entryCount: number;
}

export interface RemediationAction {
  id: string;
  label: string;
  description: string;
  action: SyncAction;
  requiresPrivilege: 'sync:operate' | null;
  enabled: boolean;
}

export interface StateSyncStatus {
  readiness: SyncReadiness;
  healthScore: number;
  healthSummary: string;
  failureCauses: SyncFailureCause[];
  snapshotHeight: number | null;
  proofStatus: ProofStatus;
  replayStatus: ReplayStatus;
  replayNonce: number;
  recentSyncOps: SyncOperation[];
  stateRootHex: string | null;
  snapshotRootHex: string | null;
  entryCount: number;
  remediationActions: RemediationAction[];
  canOperate: boolean;
}

export interface UseStateSyncStatusReturn extends StateSyncStatus {
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  remediationBusy: boolean;
  remediationMessage: string | null;
  remediationError: string | null;
  refresh: () => void;
  runRemediation: (
    action: SyncAction,
    options?: { jobId?: string; reason?: string; clearLimit?: number }
  ) => Promise<boolean>;
}

// ---------------------------------------------------------------------------
// API base URL
// ---------------------------------------------------------------------------

const API_BASE =
  resolveSyncApiBaseUrl();

function randomNonce(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getJsonHeaders(): Record<string, string> {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
}

function normalizeStatus(payload: any): StateSyncStatus {
  const data = payload?.data ?? payload ?? {};
  const proof = data.proof ?? {};
  const replay = data.replay ?? {};

  const proofStatus: ProofStatus =
    proof.status === 'verified' || proof.status === 'failed' ? proof.status : 'pending';

  const replayStatus: ReplayStatus =
    replay.status === 'rejected' || replay.status === 'at_risk'
      ? replay.status
      : 'enforced';

  const readiness: SyncReadiness =
    data.readiness === 'operational' || data.readiness === 'unavailable'
      ? data.readiness
      : 'degraded';

  return {
    readiness,
    healthScore: typeof data.healthScore === 'number' ? data.healthScore : 0,
    healthSummary:
      typeof data.healthSummary === 'string'
        ? data.healthSummary
        : 'State-sync status unavailable',
    failureCauses: Array.isArray(data.failureCauses) ? data.failureCauses : [],
    snapshotHeight:
      typeof data.snapshotHeight === 'number' ? data.snapshotHeight : null,
    proofStatus,
    replayStatus,
    replayNonce: typeof data.replayNonce === 'number' ? data.replayNonce : 0,
    recentSyncOps: Array.isArray(data.recentSyncOps) ? data.recentSyncOps : [],
    stateRootHex: typeof data.stateRootHex === 'string' ? data.stateRootHex : null,
    snapshotRootHex:
      typeof data.snapshotRootHex === 'string' ? data.snapshotRootHex : null,
    entryCount: typeof data.entryCount === 'number' ? data.entryCount : 0,
    remediationActions: Array.isArray(data.remediationActions)
      ? data.remediationActions
      : [],
    canOperate: data.canOperate === true,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const POLL_INTERVAL_MS = 20_000;

export function useStateSyncStatus(): UseStateSyncStatusReturn {
  const [status, setStatus] = useState<StateSyncStatus>({
    readiness: 'unavailable',
    healthScore: 0,
    healthSummary: 'State-sync status not yet loaded',
    failureCauses: [],
    snapshotHeight: null,
    proofStatus: 'pending',
    replayStatus: 'enforced',
    replayNonce: 0,
    recentSyncOps: [],
    stateRootHex: null,
    snapshotRootHex: null,
    entryCount: 0,
    remediationActions: [],
    canOperate: false,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [remediationBusy, setRemediationBusy] = useState<boolean>(false);
  const [remediationMessage, setRemediationMessage] = useState<string | null>(null);
  const [remediationError, setRemediationError] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE}/api/network/state-sync/status`, {
        headers: getJsonHeaders(),
      });

      if (!res.ok) {
        throw new Error(`State sync status fetch failed: ${res.status}`);
      }

      const payload = await res.json();
      if (!mountedRef.current) return;

      setStatus(normalizeStatus(payload));
      setLastUpdated(Date.now());
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      const message =
        err instanceof Error ? err.message : 'Failed to fetch state sync status';
      setError(message);
      setStatus(prev => ({
        ...prev,
        readiness: 'unavailable',
        proofStatus: 'failed',
        healthSummary: 'Backend unavailable - state sync telemetry is stale',
      }));
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const runRemediation = useCallback(
    async (
      action: SyncAction,
      options?: { jobId?: string; reason?: string; clearLimit?: number },
    ): Promise<boolean> => {
      setRemediationBusy(true);
      setRemediationError(null);
      setRemediationMessage(null);

      try {
        const payload = {
          action,
          operationNonce: randomNonce(),
          ...(options || {}),
        };

        const res = await fetch(`${API_BASE}/api/network/p2p/actions`, {
          method: 'POST',
          headers: getJsonHeaders(),
          body: JSON.stringify(payload),
        });

        const body = (await res
          .json()
          .catch(() => ({} as Record<string, any>))) as Record<string, any>;
        if (!res.ok) {
          const msg =
            body?.error ||
            body?.message ||
            `Remediation action failed (${res.status})`;
          throw new Error(msg);
        }

        const message =
          typeof body?.message === 'string' ? body.message : 'Action applied';
        setRemediationMessage(message);
        await fetchData();
        return true;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Remediation action failed';
        setRemediationError(message);
        return false;
      } finally {
        setRemediationBusy(false);
      }
    },
    [fetchData],
  );

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();

    intervalRef.current = setInterval(fetchData, POLL_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData]);

  return {
    ...status,
    loading,
    error,
    lastUpdated,
    remediationBusy,
    remediationMessage,
    remediationError,
    refresh,
    runRemediation,
  };
}

export default useStateSyncStatus;
