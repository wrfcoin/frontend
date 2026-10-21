import { useState, useEffect, useCallback, useRef } from 'react';
import { resolveSyncApiBaseUrl } from './syncRuntimeConfig';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PeerStatus = 'syncing' | 'idle' | 'stalled' | 'blacklisted';
export type SyncJobStatus = 'active' | 'paused' | 'completed' | 'failed';
export type SyncReadiness = 'operational' | 'degraded' | 'unavailable';
export type ProofStatus = 'verified' | 'pending' | 'failed';
export type ReplayStatus = 'enforced' | 'at_risk' | 'rejected';

export type SyncAction =
  | 'trigger_sync'
  | 'pause_all'
  | 'pause_job'
  | 'resume_job'
  | 'cancel_job'
  | 'clear_blacklist';

export interface P2PPeer {
  peerId: string;
  address: string;
  syncProgress: number;
  latencyMs: number;
  status: PeerStatus;
  lastSeen: string;
  bytesTransferred: number;
}

export interface SyncJob {
  id: string;
  peerId: string;
  startedAt: string;
  blocksRemaining: number;
  estimatedCompletion: string;
  status: SyncJobStatus;
  failureCode?: string;
  failureMessage?: string;
}

export interface AntiAbuseStatus {
  rateLimitedPeers: number;
  blacklistedPeers: string[];
  totalRequestsBlocked: number;
  windowStart: string;
  rateLimitPerMinute?: number;
  burstLimitPer10Seconds?: number;
}

export interface SyncFailureCause {
  code: string;
  message: string;
  remediation: string;
  since: string;
  severity: 'warning' | 'critical';
}

export interface ProofDetails {
  status: ProofStatus;
  requiredProofType: 'operator_attestation';
  lastVerifiedAt: string | null;
  lastFailureCode: string | null;
  lastFailureMessage: string | null;
}

export interface ReplayDetails {
  status: ReplayStatus;
  nonceWindowSize: number;
  rejectedCount: number;
  lastRejectedNonce: string | null;
  lastRejectedAt: string | null;
  lastRejectedReason: string | null;
}

export interface RemediationAction {
  id: string;
  label: string;
  description: string;
  action: SyncAction;
  requiresPrivilege: 'sync:operate' | null;
  enabled: boolean;
}

export interface UseP2PSyncStatusReturn {
  readiness: SyncReadiness;
  healthScore: number;
  healthSummary: string;
  failureCauses: SyncFailureCause[];
  proof: ProofDetails;
  replay: ReplayDetails;
  peers: P2PPeer[];
  syncJobs: SyncJob[];
  antiAbuse: AntiAbuseStatus;
  canOperate: boolean;
  remediationActions: RemediationAction[];
  loading: boolean;
  error: string | null;
  actionBusy: boolean;
  actionMessage: string | null;
  actionError: string | null;
  refresh: () => void;
  runAction: (
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

// frontend#329: when the orchestration API cannot be read, the hook reports
// exactly that. The previous mock generator invented peers, sync jobs, a
// healthScore of 22 and "last-known safe fallback telemetry" — none of it ever
// came from a backend.
function unavailableState(
  errorMessage: string,
): Omit<UseP2PSyncStatusReturn, 'loading' | 'error' | 'refresh' | 'runAction'> {
  return {
    ...normalizeStatus({ data: {} }),
    readiness: 'unavailable',
    healthScore: 0,
    healthSummary: `P2P orchestration API unavailable (${errorMessage}). No telemetry is shown in its place.`,
    canOperate: false,
  };
}

function normalizeStatus(payload: any): Omit<UseP2PSyncStatusReturn, 'loading' | 'error' | 'refresh' | 'runAction'> {
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
        : 'P2P orchestration status unavailable',
    failureCauses: Array.isArray(data.failureCauses) ? data.failureCauses : [],
    proof: {
      status: proofStatus,
      requiredProofType: 'operator_attestation',
      lastVerifiedAt: proof.lastVerifiedAt ?? null,
      lastFailureCode: proof.lastFailureCode ?? null,
      lastFailureMessage: proof.lastFailureMessage ?? null,
    },
    replay: {
      status: replayStatus,
      nonceWindowSize:
        typeof replay.nonceWindowSize === 'number' ? replay.nonceWindowSize : 0,
      rejectedCount:
        typeof replay.rejectedCount === 'number' ? replay.rejectedCount : 0,
      lastRejectedNonce: replay.lastRejectedNonce ?? null,
      lastRejectedAt: replay.lastRejectedAt ?? null,
      lastRejectedReason: replay.lastRejectedReason ?? null,
    },
    peers: Array.isArray(data.peers) ? data.peers : [],
    syncJobs: Array.isArray(data.syncJobs) ? data.syncJobs : [],
    antiAbuse: {
      rateLimitedPeers:
        typeof data.antiAbuse?.rateLimitedPeers === 'number'
          ? data.antiAbuse.rateLimitedPeers
          : 0,
      blacklistedPeers: Array.isArray(data.antiAbuse?.blacklistedPeers)
        ? data.antiAbuse.blacklistedPeers
        : [],
      totalRequestsBlocked:
        typeof data.antiAbuse?.totalRequestsBlocked === 'number'
          ? data.antiAbuse.totalRequestsBlocked
          : 0,
      windowStart:
        typeof data.antiAbuse?.windowStart === 'string'
          ? data.antiAbuse.windowStart
          : new Date().toISOString(),
      rateLimitPerMinute:
        typeof data.antiAbuse?.rateLimitPerMinute === 'number'
          ? data.antiAbuse.rateLimitPerMinute
          : undefined,
      burstLimitPer10Seconds:
        typeof data.antiAbuse?.burstLimitPer10Seconds === 'number'
          ? data.antiAbuse.burstLimitPer10Seconds
          : undefined,
    },
    canOperate: data.canOperate === true,
    remediationActions: Array.isArray(data.remediationActions)
      ? data.remediationActions
      : [],
    actionBusy: false,
    actionMessage: null,
    actionError: null,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const POLL_INTERVAL_MS = 15_000;

export function useP2PSyncStatus(): UseP2PSyncStatusReturn {
  const [state, setState] = useState<
    Omit<UseP2PSyncStatusReturn, 'loading' | 'error' | 'refresh' | 'runAction'>
  >(() => normalizeStatus({ data: {} }));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE}/api/network/p2p/status`, {
        headers: getJsonHeaders(),
      });

      if (!res.ok) {
        throw new Error(`P2P status fetch failed: ${res.status}`);
      }

      const payload = await res.json();
      if (!mountedRef.current) return;

      const normalized = normalizeStatus(payload);
      setState(prev => ({
        ...normalized,
        actionBusy: prev.actionBusy,
        actionMessage: prev.actionMessage,
        actionError: prev.actionError,
      }));
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      const message =
        err instanceof Error ? err.message : 'P2P orchestration API unavailable';

      setError(message);
      setState(unavailableState(message));
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const runAction = useCallback(
    async (
      action: SyncAction,
      options?: { jobId?: string; reason?: string; clearLimit?: number },
    ): Promise<boolean> => {
      setState(prev => ({
        ...prev,
        actionBusy: true,
        actionError: null,
        actionMessage: null,
      }));

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
            body?.details?.code ||
            body?.message ||
            `Action failed (${res.status})`;
          throw new Error(msg);
        }

        setState(prev => ({
          ...prev,
          actionBusy: false,
          actionError: null,
          actionMessage:
            typeof body?.message === 'string' ? body.message : 'Action applied',
        }));

        await fetchData();
        return true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Action failed';
        setState(prev => ({
          ...prev,
          actionBusy: false,
          actionError: message,
          actionMessage: null,
        }));
        return false;
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
    ...state,
    loading,
    error,
    refresh,
    runAction,
  };
}

export default useP2PSyncStatus;
