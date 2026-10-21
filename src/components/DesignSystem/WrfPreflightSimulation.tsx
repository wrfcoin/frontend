/**
 * WrfPreflightSimulation
 *
 * Two-phase preflight simulation modal for risky operations.
 *
 * Phase 1 (Simulation Preview):
 *   Displays expected state transitions, preflight check results, risk
 *   factors, and an optional confidence meter. The user reviews the
 *   simulated outcome before proceeding.
 *
 * Phase 2 (Confirmation):
 *   Delegates to WrfRiskyActionConfirmation which enforces severity-based
 *   delays, optional reason input, and confirm-text requirements.
 *
 * Usage:
 *   <WrfPreflightSimulation
 *     open={showSim}
 *     title="Rebalance Liquidity Pool"
 *     stateTransitions={transitions}
 *     preflightChecks={checks}
 *     riskFactors={risks}
 *     confidence={0.87}
 *     severity="high"
 *     onConfirm={(reason) => handleRebalance(reason)}
 *     onCancel={() => setShowSim(false)}
 *   />
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Stack,
  Divider,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import RemoveIcon from '@mui/icons-material/Remove';
import WarningIcon from '@mui/icons-material/Warning';
import type { SxProps, Theme } from '@mui/material/styles';
import { WrfModal } from './WrfModal';
import { WrfButton } from './WrfButton';
import { WrfAlert } from './WrfAlert';
import {
  WrfRiskyActionConfirmation,
  type ActionSeverity,
  type PreflightCheck,
} from './WrfRiskyActionConfirmation';

/* ------------------------------------------------------------------ */
/*  Public types                                                       */
/* ------------------------------------------------------------------ */

export type PreflightCheckResult = PreflightCheck;

export interface StateTransition {
  field: string;
  currentValue: string;
  expectedValue: string;
  direction: 'increase' | 'decrease' | 'unchanged';
}

export interface RiskFactor {
  label: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface WrfPreflightSimulationProps {
  open: boolean;
  title: string;
  stateTransitions: StateTransition[];
  preflightChecks: PreflightCheckResult[];
  riskFactors?: RiskFactor[];
  confidence?: number;
  severity: ActionSeverity;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
  loading?: boolean;
  transitionWarning?: string;
  sx?: SxProps<Theme>;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

type Phase = 'preview' | 'confirm';

const DIRECTION_ICON: Record<
  StateTransition['direction'],
  { Icon: typeof ArrowUpwardIcon; color: string }
> = {
  increase: { Icon: ArrowUpwardIcon, color: 'success.main' },
  decrease: { Icon: ArrowDownwardIcon, color: 'error.main' },
  unchanged: { Icon: RemoveIcon, color: 'text.disabled' },
};

const RISK_SEVERITY_MAP: Record<RiskFactor['severity'], 'info' | 'warning' | 'error'> = {
  low: 'info',
  medium: 'warning',
  high: 'error',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const WrfPreflightSimulation = React.forwardRef<
  HTMLDivElement,
  WrfPreflightSimulationProps
>(function WrfPreflightSimulation(
  {
    open,
    title,
    stateTransitions,
    preflightChecks,
    riskFactors,
    confidence,
    severity,
    onConfirm,
    onCancel,
    loading = false,
    transitionWarning,
    sx,
  },
  ref,
) {
  const [phase, setPhase] = useState<Phase>('preview');

  // Reset to preview whenever the modal opens
  useEffect(() => {
    if (open) {
      setPhase('preview');
    }
  }, [open]);

  const allChecksPassed = useMemo(
    () => preflightChecks.every((c) => c.passed),
    [preflightChecks],
  );

  const confidencePercent =
    confidence !== undefined ? Math.round(Math.min(Math.max(confidence, 0), 1) * 100) : undefined;

  /* ---- Phase 2: delegate to WrfRiskyActionConfirmation ----------- */
  if (phase === 'confirm') {
    return (
      <WrfRiskyActionConfirmation
        ref={ref}
        open={open}
        title={`Confirm: ${title}`}
        description={`You reviewed the simulation for "${title}". Confirm to execute this action.`}
        severity={severity}
        preflightChecks={preflightChecks}
        onConfirm={onConfirm}
        onCancel={() => setPhase('preview')}
        loading={loading}
        transitionWarning={transitionWarning}
        sx={sx}
      />
    );
  }

  /* ---- Phase 1: simulation preview ------------------------------- */
  const previewActions = (
    <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'flex-end' }}>
      <WrfButton variant="outline" onClick={onCancel} disabled={loading}>
        Cancel
      </WrfButton>
      <WrfButton
        variant="primary"
        onClick={() => setPhase('confirm')}
        disabled={!allChecksPassed}
      >
        Proceed to Confirm
      </WrfButton>
    </Box>
  );

  return (
    <WrfModal
      ref={ref}
      open={open}
      onClose={(_e, _reason) => onCancel()}
      title={title}
      actions={previewActions}
      maxWidth="sm"
      fullWidth
      sx={sx}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* -- Expected Changes ------------------------------------ */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            Expected Changes
          </Typography>
          <List dense disablePadding>
            {stateTransitions.map((transition, idx) => {
              const { Icon, color } = DIRECTION_ICON[transition.direction];
              return (
                <ListItem key={idx} disableGutters sx={{ py: 0.25 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Icon fontSize="small" sx={{ color }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={transition.field}
                    secondary={`${transition.currentValue} \u2192 ${transition.expectedValue}`}
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              );
            })}
          </List>
        </Box>

        <Divider />

        {/* -- Preflight Checks ------------------------------------ */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            Preflight Checks
          </Typography>
          <List dense disablePadding>
            {preflightChecks.map((check, idx) => (
              <ListItem key={idx} disableGutters sx={{ py: 0.25 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  {check.passed ? (
                    <CheckCircleIcon fontSize="small" color="success" />
                  ) : (
                    <CancelIcon fontSize="small" color="error" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={check.label}
                  secondary={!check.passed ? check.reason : undefined}
                  primaryTypographyProps={{ variant: 'body2' }}
                  secondaryTypographyProps={{ variant: 'caption', color: 'error' }}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* -- Risk Factors ---------------------------------------- */}
        {riskFactors && riskFactors.length > 0 && (
          <>
            <Divider />
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                Risk Factors
              </Typography>
              <Stack spacing={1}>
                {riskFactors.map((risk, idx) => (
                  <WrfAlert
                    key={idx}
                    severity={RISK_SEVERITY_MAP[risk.severity]}
                    icon={<WarningIcon fontSize="small" />}
                    title={risk.label}
                  >
                    {risk.description}
                  </WrfAlert>
                ))}
              </Stack>
            </Box>
          </>
        )}

        {/* -- Confidence Meter ------------------------------------ */}
        {confidencePercent !== undefined && (
          <>
            <Divider />
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="subtitle2">Simulation Confidence</Typography>
                <Typography variant="subtitle2">{confidencePercent}%</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={confidencePercent}
                color={confidencePercent >= 80 ? 'success' : confidencePercent >= 50 ? 'warning' : 'error'}
                sx={{ height: 8, borderRadius: 1 }}
              />
            </Box>
          </>
        )}
      </Box>
    </WrfModal>
  );
});
