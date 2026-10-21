/** Human labels for the backend's public capability reason vocabulary. */
const REASON_LABELS: Readonly<Record<string, string>> = {
  ok: 'Available',
  not_wired: 'Not available yet',
  unverified: 'Configured, not yet verified',
  simulated: 'Demo data only',
  reachable: 'Reachable, not yet verified',
  degraded: 'Service is partially available',
  unavailable: 'Service is unavailable',
  proof_missing: 'Verification proof is missing',
  evidence_stale: 'Verification evidence is out of date',
  evidence_invalid: 'Verification evidence is invalid',
  provider_failed: 'Readiness could not be checked',
};

export function capabilityReasonLabel(reasonCode: unknown): string {
  return typeof reasonCode === 'string' && Object.prototype.hasOwnProperty.call(REASON_LABELS, reasonCode)
    ? REASON_LABELS[reasonCode]
    : 'Readiness information is unavailable';
}
