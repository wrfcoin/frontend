/**
 * Composable preflight check hook for risky action confirmation.
 *
 * Checks capability readiness modes and protocol transition state
 * to produce a list of pass/fail results displayed in the
 * WrfRiskyActionConfirmation modal.
 */

import { useMemo } from 'react';
import { useCapabilitiesContext } from '../contexts/CapabilitiesContext';
import type { CapabilityMode } from '../types/capabilities';
import { capabilityReasonLabel } from '../lib/capabilityReasons';

export interface PreflightCheckResult {
  label: string;
  passed: boolean;
  reason?: string;
}

interface UsePreflightChecksOptions {
  /** Capability keys that must be in an acceptable readiness mode */
  requiredCapabilities?: string[];
  /** Acceptable readiness modes (defaults to production-verified and local-manager) */
  requiredReadinessMode?: CapabilityMode[];
  /** If true, a failing check is added when a protocol transition gates risky actions */
  blockDuringTransition?: boolean;
}

const DEFAULT_ACCEPTABLE_MODES: CapabilityMode[] = [
  'production-verified',
  'local-manager',
];

export function usePreflightChecks(options: UsePreflightChecksOptions): PreflightCheckResult[] {
  const { getFeatureReadiness, protocolTransition, shouldGateRiskyActions } =
    useCapabilitiesContext();

  return useMemo(() => {
    const checks: PreflightCheckResult[] = [];
    const acceptable = options.requiredReadinessMode ?? DEFAULT_ACCEPTABLE_MODES;

    // Check each required capability's readiness mode
    for (const cap of options.requiredCapabilities ?? []) {
      const readiness = getFeatureReadiness(cap);
      if (!readiness) {
        checks.push({
          label: `${cap} readiness`,
          passed: false,
          reason: 'Capability data not available',
        });
      } else if (acceptable.includes(readiness.mode)) {
        checks.push({
          label: `${cap} readiness`,
          passed: true,
        });
      } else {
        checks.push({
          label: `${cap} readiness`,
          passed: false,
          reason: capabilityReasonLabel(readiness.reasonCode),
        });
      }
    }

    // Check protocol transition state
    if (options.blockDuringTransition && shouldGateRiskyActions && protocolTransition) {
      checks.push({
        label: 'Protocol transition',
        passed: false,
        reason: protocolTransition.message,
      });
    } else if (options.blockDuringTransition) {
      checks.push({
        label: 'Protocol transition',
        passed: true,
      });
    }

    return checks;
  }, [
    options.requiredCapabilities,
    options.requiredReadinessMode,
    options.blockDuringTransition,
    getFeatureReadiness,
    protocolTransition,
    shouldGateRiskyActions,
  ]);
}
