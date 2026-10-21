// @cohesion: hand-written; verification timeline UI domain is not in @wrfcoin/generated-types.
// Note: ValidationReading in @wrfcoin/generated-types is physics range-check input,
// not a credential/issuance verification timeline — different concept.
// reviewed 2026-06-18: ValidationReading confirmed unrelated; no migration possible.

export type VerificationStepName =
  | 'issuance'
  | 'attestation'
  | 'validation'
  | 'revocation'
  | 'dispute'
  | 'finality';

export type VerificationStepStatus =
  | 'completed'
  | 'active'
  | 'pending'
  | 'failed'
  | 'skipped';

export interface VerificationEvidence {
  type: 'hash' | 'signature' | 'block-ref';
  value: string;
  label?: string;
  explorerUrl?: string;
}

export interface VerificationTimelineStep {
  name: VerificationStepName;
  label: string;
  status: VerificationStepStatus;
  timestamp?: string;
  evidence?: VerificationEvidence[];
  details?: string;
  duration?: number;
}
