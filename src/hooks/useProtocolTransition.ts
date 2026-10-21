/**
 * Protocol transition state.
 *
 * No backend serves a protocol-transition route (backend main mounts no
 * /api/protocol family, and the public edge answers it 404), so nothing is
 * polled and no state is invented: callers see "no transition known"
 * (`transition: null`), which keeps CapabilitiesContext's
 * shouldGateRiskyActions false. Reintroduce a read here only together with a
 * mounted backend contract.
 */

import type { ProtocolTransitionState } from '../types/capabilities';

export function useProtocolTransition(): {
  transition: ProtocolTransitionState | null;
  loading: boolean;
  error: Error | null;
  } {
  return { transition: null, loading: false, error: null };
}
