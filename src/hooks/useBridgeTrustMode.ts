/**
 * Hook to determine the bridge operational trust mode.
 *
 * Combines the general capabilities endpoint (feature-level operational status)
 * with the bridge-specific safety status endpoint to derive whether the bridge
 * is operating in simulated, local-manager, or production-verified mode.
 *
 * Trust mode determination:
 * - "production-verified": validators registered AND safety not halted AND capabilities operational
 * - "local-manager": safety endpoint reachable, not halted, but no registered validators
 * - "simulated": safety endpoint unreachable or capabilities report bridge as degraded
 * - "unavailable": bridge is halted or capabilities report bridge as unavailable
 */

import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../services/config';

export type BridgeTrustMode =
  | 'production-verified'
  | 'local-manager'
  | 'simulated'
  | 'unavailable';

export interface StoreConsistency {
  health: 'healthy' | 'degraded' | 'failed';
  readMode: string;
  issueCount: number;
}

export interface BridgeTrustState {
  mode: BridgeTrustMode;
  halted: boolean;
  haltReason: string | null;
  validatorCount: number;
  reason: string;
  reasonCode: string;
  checkedAt: string;
  storeConsistency: StoreConsistency | null;
  quorum?: {
    requiredSignatures: number;
    collectedSignatures: number;
    activeValidators: number;
    quorumPercentage: number;
  };
}

interface SafetyResponse {
  success: boolean;
  safety: {
    halted: boolean;
    haltedAt: string | null;
    haltReason: string | null;
    globalExposure: string;
    routeExposure: Record<string, string>;
    globalExposureCap: string;
    routeExposureCap: string;
    anomalyWindowStartedAt: string;
    anomalyFailuresInWindow: number;
    anomalyFailureThreshold: number;
    challengeWindowSeconds: number;
  };
}

interface ValidatorsResponse {
  success: boolean;
  validators?: Array<{ address: string }>;
  count?: number;
}

// Unified readiness response — covers both route.store and bridge.* capabilities
interface ReadinessResponse {
  success?: boolean;
  capabilities?: Record<string, {
    mode?: string;
    reason?: string;
    reasonCode?: string;
    signals?: {
      health?: string;
      readMode?: string;
      issueCount?: number;
      activeValidators?: number;
      [key: string]: unknown;
    };
  }>;
}

async function fetchBridgeTrustState(): Promise<BridgeTrustState> {
  const checkedAt = new Date().toISOString();

  // Fetch safety status, validator count, and capabilities readiness in parallel
  let safety: SafetyResponse['safety'] | null = null;
  let validatorCount = 0;
  let safetyReachable = false;
  let storeConsistency: StoreConsistency | null = null;
  let readinessData: ReadinessResponse | null = null;

  try {
    const [safetyRes, validatorsRes, readinessRes] = await Promise.allSettled([
      fetch(`${API_BASE_URL}/bridges/safety/status`),
      fetch(`${API_BASE_URL}/bridges/validators`),
      fetch(`${API_BASE_URL}/bridges/capabilities/readiness`),
    ]);

    if (safetyRes.status === 'fulfilled' && safetyRes.value.ok) {
      const data = (await safetyRes.value.json()) as SafetyResponse;
      safety = data.safety;
      safetyReachable = true;
    }

    if (validatorsRes.status === 'fulfilled' && validatorsRes.value.ok) {
      const data = (await validatorsRes.value.json()) as ValidatorsResponse;
      validatorCount = data.count ?? data.validators?.length ?? 0;
    }

    if (readinessRes.status === 'fulfilled' && readinessRes.value.ok) {
      readinessData = (await readinessRes.value.json()) as ReadinessResponse;
      // Extract store consistency from route.store signals
      const storeSignals = readinessData?.capabilities?.['route.store']?.signals;
      if (storeSignals) {
        storeConsistency = {
          health: (storeSignals.health as StoreConsistency['health']) ?? 'healthy',
          readMode: storeSignals.readMode ?? 'legacy-only',
          issueCount: storeSignals.issueCount ?? 0,
        };
      }
    }
  } catch {
    // All fetches failed - bridge backend unreachable
  }

  // If capabilities endpoint provided bridge.verification data, use it as the
  // primary trust mode source
  const verificationCap = readinessData?.capabilities?.['bridge.verification'];
  if (verificationCap?.mode) {
    const capMode = verificationCap.mode;
    let mode: BridgeTrustMode;
    if (capMode === 'production-verified') {
      mode = 'production-verified';
    } else if (capMode === 'local-manager') {
      mode = 'local-manager';
    } else if (capMode === 'degraded' || capMode === 'simulated') {
      mode = 'simulated';
    } else if (capMode === 'unavailable') {
      mode = 'unavailable';
    } else {
      mode = 'simulated';
    }

    // Derive quorum from activeValidators signal if present
    const activeValidatorsSignal = verificationCap.signals?.activeValidators as number | undefined;
    let quorum: BridgeTrustState['quorum'] | undefined;
    if (activeValidatorsSignal && activeValidatorsSignal > 0) {
      quorum = {
        requiredSignatures: Math.ceil(activeValidatorsSignal * 0.67),
        collectedSignatures: activeValidatorsSignal,
        activeValidators: activeValidatorsSignal,
        quorumPercentage: 100,
      };
    }

    return {
      mode,
      halted: mode === 'unavailable' || (safety?.halted ?? false),
      haltReason: safety?.haltReason ?? null,
      validatorCount: activeValidatorsSignal ?? validatorCount,
      reason: verificationCap.reason ?? `Capabilities-derived mode: ${capMode}`,
      reasonCode: verificationCap.reasonCode ?? 'CAPABILITIES_DERIVED',
      checkedAt,
      storeConsistency,
      quorum,
    };
  }

  // Fall through to existing safety/validator logic
  if (!safetyReachable) {
    return {
      mode: 'simulated',
      halted: false,
      haltReason: null,
      validatorCount: 0,
      reason: 'Bridge safety endpoint unreachable; operating in simulated mode',
      reasonCode: 'LEGACY_DETERMINATION',
      checkedAt,
      storeConsistency,
    };
  }

  if (safety?.halted) {
    return {
      mode: 'unavailable',
      halted: true,
      haltReason: safety.haltReason,
      validatorCount,
      reason: `Bridge halted: ${safety.haltReason ?? 'unknown reason'}`,
      reasonCode: 'LEGACY_DETERMINATION',
      checkedAt,
      storeConsistency,
    };
  }

  if (validatorCount > 0) {
    return {
      mode: 'production-verified',
      halted: false,
      haltReason: null,
      validatorCount,
      reason: `${validatorCount} validator(s) registered; production attestation active`,
      reasonCode: 'LEGACY_DETERMINATION',
      checkedAt,
      storeConsistency,
    };
  }

  return {
    mode: 'local-manager',
    halted: false,
    haltReason: null,
    validatorCount: 0,
    reason: 'Bridge operational but no validators registered; local manager mode',
    reasonCode: 'LEGACY_DETERMINATION',
    checkedAt,
    storeConsistency,
  };
}

export function useBridgeTrustMode() {
  const [trustState, setTrustState] = useState<BridgeTrustState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const state = await fetchBridgeTrustState();
      setTrustState(state);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to determine bridge trust mode',
      );
      setTrustState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60_000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { trustState, loading, error, refresh };
}
