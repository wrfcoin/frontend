/**
 * Dynamic feature flag hooks backed by the CapabilitiesContext.
 *
 * These hooks merge the static FEATURES flags from features.ts with live
 * backend capability data from GET /api/capabilities.
 *
 * Must be used inside a <CapabilitiesProvider>.
 */

import { useCapabilitiesContext } from '../contexts/CapabilitiesContext';
import type { FeatureStatusLabel } from '../contexts/CapabilitiesContext';
import type { CapabilityReadinessEntry } from '../types/capabilities';

/**
 * Returns whether a feature is enabled, considering both the static flag
 * and live backend capability status. If the backend reports a feature as
 * 'unavailable', it overrides the static flag to false.
 */
export function useFeatureEnabled(featureName: string): boolean {
  const { isFeatureEnabled } = useCapabilitiesContext();
  return isFeatureEnabled(featureName);
}

/**
 * Returns the resolved enabled state and operational status for a feature.
 */
export function useFeatureStatus(featureName: string): {
  enabled: boolean;
  status: FeatureStatusLabel;
} {
  const { getFeatureStatus } = useCapabilitiesContext();
  return getFeatureStatus(featureName);
}

/**
 * Returns the 5-level readiness mode for a feature, or null if readiness
 * data is not available (backend hasn't responded yet).
 */
export function useFeatureReadiness(featureName: string): CapabilityReadinessEntry | null {
  const { getFeatureReadiness } = useCapabilitiesContext();
  return getFeatureReadiness(featureName);
}
