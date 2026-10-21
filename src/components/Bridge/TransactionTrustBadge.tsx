/**
 * TransactionTrustBadge Component
 *
 * Displays the trust/finality state of a bridge transaction with:
 * - Color-coded status chip
 * - Confirmation progress bar
 * - Estimated time remaining
 * - Reorg risk indicator
 */

import React from 'react';
import { Box, Typography, LinearProgress, Chip, Tooltip } from '@mui/material';
import {
  CheckCircle,
  HourglassEmpty,
  Sync,
  Warning,
  Error as ErrorIcon,
  PauseCircle,
} from '@mui/icons-material';
import type {
  BridgeTransactionTrustState,
  BridgeTransactionFinalityInfo,
  ReorgRisk,
} from '../../types/bridge';

interface TransactionTrustBadgeProps {
  /** The finality info object from useBridgeFinalityStatus. */
  finalityInfo: BridgeTransactionFinalityInfo;
  /** Whether to show the full detail layout or just the compact badge. Defaults to false. */
  compact?: boolean;
}

/**
 * Configuration for each trust state's visual appearance.
 */
const TRUST_STATE_CONFIG: Record<
  BridgeTransactionTrustState,
  {
    label: string;
    color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
    icon: React.ReactElement;
    description: string;
  }
> = {
  pending: {
    label: 'Pending',
    color: 'default',
    icon: <HourglassEmpty fontSize="small" />,
    description: 'Transaction submitted, waiting for block inclusion',
  },
  confirming: {
    label: 'Confirming',
    color: 'info',
    icon: <Sync fontSize="small" />,
    description: 'Transaction included in a block, accumulating confirmations',
  },
  'challenge-window': {
    label: 'Challenge Window',
    color: 'warning',
    icon: <HourglassEmpty fontSize="small" />,
    description: 'Awaiting L2 challenge period before finalization',
  },
  finalized: {
    label: 'Finalized',
    color: 'success',
    icon: <CheckCircle fontSize="small" />,
    description: 'Transaction is fully confirmed and irreversible',
  },
  disputed: {
    label: 'Disputed',
    color: 'error',
    icon: <ErrorIcon fontSize="small" />,
    description: 'A chain reorganization was detected affecting this transaction',
  },
  halted: {
    label: 'Halted',
    color: 'warning',
    icon: <PauseCircle fontSize="small" />,
    description: 'Bridge monitoring is paused or the transaction is stuck',
  },
};

/**
 * Configuration for reorg risk indicator colors.
 */
const REORG_RISK_CONFIG: Record<ReorgRisk, { label: string; color: string }> = {
  low: { label: 'Low', color: '#4caf50' },
  medium: { label: 'Medium', color: '#ff9800' },
  high: { label: 'High', color: '#f44336' },
};

/**
 * Format seconds into a human-readable time string.
 */
function formatTimeRemaining(seconds: number | null): string {
  if (seconds === null || seconds <= 0) {
    return '--';
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  return `${remainingSeconds}s`;
}

/**
 * Progress bar color based on trust state.
 */
function getProgressColor(
  trustState: BridgeTransactionTrustState,
): 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | 'inherit' {
  switch (trustState) {
  case 'finalized':
    return 'success';
  case 'disputed':
    return 'error';
  case 'challenge-window':
    return 'warning';
  case 'confirming':
    return 'info';
  default:
    return 'primary';
  }
}

function shortenEvidenceId(evidenceId: string): string {
  if (evidenceId.length <= 26) {
    return evidenceId;
  }
  return `${evidenceId.slice(0, 16)}...${evidenceId.slice(-6)}`;
}

export const TransactionTrustBadge: React.FC<TransactionTrustBadgeProps> = ({
  finalityInfo,
  compact = false,
}) => {
  const stateConfig = TRUST_STATE_CONFIG[finalityInfo.trustState];
  const riskConfig = REORG_RISK_CONFIG[finalityInfo.reorgRisk];
  const validatorAttestation = finalityInfo.validatorAttestation ?? null;
  const quorum = validatorAttestation?.quorum ?? null;

  if (compact) {
    const compactTitle = quorum
      ? `${stateConfig.description}. Quorum ${quorum.collectedSignatures}/${quorum.requiredSignatures}.`
      : stateConfig.description;
    return (
      <Tooltip title={compactTitle}>
        <Chip
          icon={stateConfig.icon}
          label={stateConfig.label}
          color={stateConfig.color}
          size="small"
          variant="outlined"
        />
      </Tooltip>
    );
  }

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 1,
        bgcolor: 'grey.50',
        border: '1px solid',
        borderColor: 'grey.200',
      }}
    >
      {/* Trust State Badge */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Tooltip title={stateConfig.description}>
          <Chip
            icon={stateConfig.icon}
            label={stateConfig.label}
            color={stateConfig.color}
            size="small"
          />
        </Tooltip>
        <Typography variant="caption" color="text.secondary">
          {finalityInfo.chain}
        </Typography>
      </Box>

      {/* Confirmation Progress */}
      <Box mb={1.5}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
          <Typography variant="caption" color="text.secondary">
            Confirmations
          </Typography>
          <Typography variant="caption" fontWeight="medium">
            {finalityInfo.currentConfirmations} / {finalityInfo.requiredConfirmations}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={finalityInfo.progressPercent}
          color={getProgressColor(finalityInfo.trustState)}
          sx={{ height: 6, borderRadius: 1 }}
        />
      </Box>

      {/* Estimated Time and Reorg Risk */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="caption" color="text.secondary">
            Est. remaining
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {finalityInfo.trustState === 'finalized'
              ? 'Complete'
              : formatTimeRemaining(finalityInfo.estimatedSecondsRemaining)}
          </Typography>
        </Box>
        <Tooltip title={`Reorg risk: ${riskConfig.label}`}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Warning
              sx={{
                fontSize: 14,
                color: riskConfig.color,
              }}
            />
            <Typography
              variant="caption"
              sx={{ color: riskConfig.color, fontWeight: 'medium' }}
            >
              {riskConfig.label} risk
            </Typography>
          </Box>
        </Tooltip>
      </Box>

      {validatorAttestation && quorum && (
        <Box
          mt={1.5}
          pt={1.5}
          sx={{
            borderTop: '1px solid',
            borderTopColor: 'grey.200',
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.75}>
            <Typography variant="caption" color="text.secondary">
              Validator quorum
            </Typography>
            <Chip
              size="small"
              color={quorum.quorumReached ? 'success' : 'warning'}
              label={`${quorum.collectedSignatures}/${quorum.requiredSignatures}`}
            />
          </Box>
          {validatorAttestation.evidenceIds.length > 0 && (
            <Box display="flex" flexWrap="wrap" gap={0.5}>
              {validatorAttestation.evidenceIds.slice(0, 2).map(evidenceId => (
                <Tooltip key={evidenceId} title={evidenceId}>
                  <Chip
                    size="small"
                    variant="outlined"
                    label={shortenEvidenceId(evidenceId)}
                    sx={{ fontFamily: 'monospace', maxWidth: 220 }}
                  />
                </Tooltip>
              ))}
              {validatorAttestation.evidenceIds.length > 2 && (
                <Chip
                  size="small"
                  variant="outlined"
                  label={`+${validatorAttestation.evidenceIds.length - 2} more`}
                />
              )}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default TransactionTrustBadge;
