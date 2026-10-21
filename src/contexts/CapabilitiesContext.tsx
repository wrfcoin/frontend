import React, { createContext, useContext, useMemo } from 'react';
import { useCapabilities, FeatureStatus, FeatureStatusEntry, CapabilitiesResponse } from '../hooks/useCapabilities';
import { useProtocolTransition } from '../hooks/useProtocolTransition';
import { FEATURES } from '../config/features';
import { CAPABILITY_REQUIRED_FEATURES as requiredFeatures } from '../config/capabilityRoutePolicy';
import type { CapabilityReadinessEntry, ProtocolTransitionState } from '../types/capabilities';

type FeatureStatusLabel = FeatureStatus | 'static';

interface FeatureEnabledStatus {
  enabled: boolean;
  status: FeatureStatusLabel;
}

interface CapabilitiesContextValue {
  capabilities: CapabilitiesResponse | null;
  loading: boolean;
  error: Error | null;
  /** Merged map: static FEATURES overridden by backend availability */
  mergedFeatures: Record<string, boolean>;
  /** Get the resolved enabled state for a feature */
  isFeatureEnabled: (featureName: string) => boolean;
  /** Get the resolved status for a feature */
  getFeatureStatus: (featureName: string) => FeatureEnabledStatus;
  /** Get the 5-level readiness mode for a feature */
  getFeatureReadiness: (featureName: string) => CapabilityReadinessEntry | null;
  /** Protocol transition state */
  protocolTransition: ProtocolTransitionState | null;
  /** Whether risky actions should be gated right now */
  shouldGateRiskyActions: boolean;
}

const CapabilitiesContext = createContext<CapabilitiesContextValue | null>(null);
const CAPABILITY_PROMOTABLE_FEATURES = new Set(['validatorOps', 'networkInsights']);
const CAPABILITY_REQUIRED_FEATURES = new Set<string>(requiredFeatures);

function useCapabilitiesContext(): CapabilitiesContextValue {
  const ctx = useContext(CapabilitiesContext);
  if (!ctx) {
    throw new Error('useCapabilitiesContext must be used within a CapabilitiesProvider');
  }
  return ctx;
}

export const CapabilitiesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { capabilities, loading, error } = useCapabilities();
  const { transition: protocolTransition } = useProtocolTransition();

  const mergedFeatures = useMemo(() => {
    const merged: Record<string, boolean> = {};

    // Start with static feature flags
    for (const [key, value] of Object.entries(FEATURES)) {
      merged[key] = value;
    }
    // These static flags used to register pages for absent backend families.
    // Cached operational data must not keep them enabled after a poll error.
    for (const key of CAPABILITY_REQUIRED_FEATURES) {
      const status = capabilities?.features?.[key]?.status;
      merged[key] = Boolean(FEATURES[key as keyof typeof FEATURES]) && !loading && !error &&
        (status === 'operational' || status === 'degraded');
    }

    // The public contributors leaderboard is a read-only view of GET /api/weather/leaderboard. The backend
    // never reports that capability `operational` (no evidence provider is wired, so static inventory tops out
    // at `configured`/`unverified`), and the page already shows "unavailable" + Retry whenever the API cannot
    // prove every row. It therefore mounts on `configured` as well, but still not while loading, on a poll
    // error, or when the backend says `reachable`, `simulated` or `unavailable`.
    const leaderboardStatus = capabilities?.features?.leaderboard?.status;
    merged.leaderboardRead = Boolean(FEATURES.leaderboard) && !loading && !error &&
      (leaderboardStatus === 'operational' || leaderboardStatus === 'degraded' || leaderboardStatus === 'configured');
    const earningsStatus = capabilities?.features?.earningsRead?.status;
    merged.earningsRead = merged.leaderboardRead &&
      (earningsStatus === 'operational' || earningsStatus === 'degraded' || earningsStatus === 'configured');

    // Override with backend data:
    // 1) if backend reports 'unavailable', disable the feature
    // 2) for promotable features, allow backend operational/degraded state to enable them
    if (capabilities?.features) {
      for (const [key, entry] of Object.entries(capabilities.features)) {
        if (CAPABILITY_REQUIRED_FEATURES.has(key)) continue;
        if (entry.status === 'unavailable') {
          merged[key] = false;
        } else if (CAPABILITY_PROMOTABLE_FEATURES.has(key)) {
          merged[key] = true;
        }
      }
    }

    return merged;
  }, [capabilities, loading, error]);

  const shouldGateRiskyActions = useMemo(() => {
    return protocolTransition?.gateRiskyActions ?? false;
  }, [protocolTransition]);

  const value = useMemo<CapabilitiesContextValue>(() => {
    const isFeatureEnabled = (featureName: string): boolean => {
      if (featureName in mergedFeatures) {
        return mergedFeatures[featureName];
      }
      return false;
    };

    const getFeatureStatus = (featureName: string): FeatureEnabledStatus => {
      const backendEntry: FeatureStatusEntry | undefined = capabilities?.features?.[featureName];

      if (backendEntry) {
        return { enabled: mergedFeatures[featureName] ?? false, status: backendEntry.status };
      }

      return { enabled: mergedFeatures[featureName] ?? false, status: 'static' };
    };

    const getFeatureReadiness = (featureName: string): CapabilityReadinessEntry | null => {
      return capabilities?.readiness?.[featureName] ?? null;
    };

    return {
      capabilities,
      loading,
      error,
      mergedFeatures,
      isFeatureEnabled,
      getFeatureStatus,
      getFeatureReadiness,
      protocolTransition: protocolTransition ?? null,
      shouldGateRiskyActions,
    };
  }, [capabilities, loading, error, mergedFeatures, protocolTransition, shouldGateRiskyActions]);

  return (
    <CapabilitiesContext.Provider value={value}>
      {children}
    </CapabilitiesContext.Provider>
  );
};

export { useCapabilitiesContext };
export type { FeatureStatusLabel, FeatureEnabledStatus, CapabilitiesContextValue };
export default CapabilitiesContext;
