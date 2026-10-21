// @cohesion: hand-written; bridge/cross-chain domain is not in @wrfcoin/generated-types.
// Canonical Rust source: core4/shared-protocol/src/bridge.rs (not yet ts-rs-exported).
// Revisit after core4 bridge types are exported via ts-rs.
// reviewed 2026-06-18: generated-types covers weather/sensor/physics only — no bridge types published.

/**
 * Bridge Transaction Trust State Types
 *
 * TypeScript interfaces for cross-chain bridge finality monitoring.
 * Mirrors the backend FinalityStatus from backend/shared/bridge-finality-monitor.ts
 */

/**
 * Supported blockchain networks for bridge operations.
 * Matches the backend FINALITY_CONFIRMATIONS keys.
 */
export type SupportedChain =
  | 'ethereum'
  | 'polygon'
  | 'bsc'
  | 'avalanche'
  | 'optimism'
  | 'arbitrum'
  | 'base'
  | 'cosmos'
  | 'osmosis'
  | 'polkadot'
  | 'kusama'
  | 'near'
  | 'solana'
  | 'bitcoin';

/**
 * Trust states for a bridge transaction's lifecycle.
 *
 * - pending: Transaction submitted but not yet included in a block
 * - confirming: Transaction is in a block, accumulating confirmations
 * - challenge-window: Sufficient confirmations reached; waiting for dispute period (L2 rollups)
 * - finalized: Transaction is fully confirmed and irreversible
 * - disputed: A reorg was detected or the transaction is under dispute
 * - halted: Bridge monitoring has been paused or the transaction is stuck
 */
export type BridgeTransactionTrustState =
  | 'pending'
  | 'confirming'
  | 'challenge-window'
  | 'finalized'
  | 'disputed'
  | 'halted';

/**
 * Reorg risk level for the transaction.
 */
export type ReorgRisk = 'low' | 'medium' | 'high';

export interface ValidatorQuorumSummary {
  requiredSignatures: number;
  collectedSignatures: number;
  registeredValidators: number;
  activeValidators: number;
  quorumReached: boolean;
  quorumPercentage: number;
  participationRate: number;
}

export interface EvidenceAvailability {
  merkleProof: boolean;
  signatures: boolean;
  oracleAttestation: boolean;
  relayerAttestation: boolean;
}

export interface ValidatorAttestationEvidence {
  evidenceIds: string[];
  quorum: ValidatorQuorumSummary;
  evidenceAvailable: EvidenceAvailability;
}

/**
 * Finality status returned by the backend GET /api/bridge/finality/:txHash endpoint.
 * Mirrors backend/shared/bridge-finality-monitor.ts FinalityStatus interface.
 */
export interface BridgeFinalityStatus {
  transactionHash: string;
  chain: SupportedChain;
  currentConfirmations: number;
  requiredConfirmations: number;
  finalized: boolean;
  estimatedFinalityTime?: string; // ISO 8601 date string from API
  reorgRisk: ReorgRisk;
  validatorAttestation?: ValidatorAttestationEvidence | null;
  trustMode?: string;
  trustReason?: string;
  l1FinalityStatus?: {
    ready: boolean;
    reason: string;
    estimatedReadyTime?: string;
  };
}

/**
 * Extended finality status that includes derived trust state for UI rendering.
 */
export interface BridgeTransactionFinalityInfo extends BridgeFinalityStatus {
  trustState: BridgeTransactionTrustState;
  progressPercent: number;
  estimatedSecondsRemaining: number | null;
}

/**
 * Derive the trust state from raw finality status.
 */
export function deriveTrustState(status: BridgeFinalityStatus): BridgeTransactionTrustState {
  if (status.finalized) {
    return 'finalized';
  }

  if (status.reorgRisk === 'high' && status.currentConfirmations > 0) {
    return 'disputed';
  }

  if (status.currentConfirmations === 0) {
    return 'pending';
  }

  // For L2 rollups (optimism, arbitrum, base), treat high-confirmation
  // transactions as being in a challenge window
  const l2Chains: SupportedChain[] = ['optimism', 'arbitrum', 'base'];
  if (
    l2Chains.includes(status.chain) &&
    status.currentConfirmations >= status.requiredConfirmations * 0.8
  ) {
    return 'challenge-window';
  }

  return 'confirming';
}

/**
 * Build the full finality info object from a raw API response.
 */
export function buildFinalityInfo(status: BridgeFinalityStatus): BridgeTransactionFinalityInfo {
  const trustState = deriveTrustState(status);
  const progressPercent = Math.min(
    100,
    Math.round((status.currentConfirmations / status.requiredConfirmations) * 100),
  );

  let estimatedSecondsRemaining: number | null = null;
  if (status.estimatedFinalityTime) {
    const remaining = new Date(status.estimatedFinalityTime).getTime() - Date.now();
    estimatedSecondsRemaining = remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  }

  return {
    ...status,
    trustState,
    progressPercent,
    estimatedSecondsRemaining,
  };
}
