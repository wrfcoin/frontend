// @cohesion: hand-written; capability-readiness domain is not in @wrfcoin/generated-types.
// Canonical source: backend/shared/types/capability-readiness.ts (TypeScript, not Rust/ts-rs).
// No generated equivalent — revisit if capability-readiness moves to a Rust crate.
// reviewed 2026-06-18: no overlap with generated-types (weather/sensor/physics domain).

/**
 * Frontend type definitions for the runtime capability readiness model
 * and protocol transition state.
 *
 * Mirrors the backend types from backend/shared/types/capability-readiness.ts.
 */

export type CapabilityMode =
  | 'unavailable'
  | 'simulated'
  | 'local-manager'
  | 'production-verified'
  | 'degraded';

export interface CapabilityReadinessEntry {
  capabilityId: string;
  mode: CapabilityMode;
  reason: string;
  reasonCode: string;
  updatedAt: string;
  signals: Record<string, unknown>;
}

export type TransitionPhase =
  | 'none'
  | 'planned'
  | 'simulation'
  | 'timelock'
  | 'compatibility-window'
  | 'finalization'
  | 'rollback';

export interface ProtocolTransitionProposal {
  id: string;
  title: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  targetModule: string;
  targetVersion: string;
  proposer: string;
}

export interface ProtocolTransitionTiming {
  phaseStartedAt: string;
  estimatedPhaseEndAt?: string;
  remainingSeconds?: number;
}

export interface ProtocolTransitionState {
  active: boolean;
  phase: TransitionPhase;
  proposal?: ProtocolTransitionProposal;
  timing?: ProtocolTransitionTiming;
  affectedModules: string[];
  message: string;
  gateRiskyActions: boolean;
  timestamp: string;
}
