/**
 * WrfRiskyActionConfirmation
 *
 * Modal dialog for confirming risky/sensitive operations with preflight
 * checks, severity-based delays, and optional reason input.
 *
 * Severity behavior:
 *   low     — confirm immediately, no reason required
 *   medium  — confirm immediately, reason optional
 *   high    — 3s delay, reason required
 *   critical — 5s delay, must type action name, reason required
 *
 * Usage:
 *   <WrfRiskyActionConfirmation
 *     open={showConfirm}
 *     title="Pause All Sync"
 *     description="This will halt all P2P sync orchestration."
 *     severity="high"
 *     preflightChecks={checks}
 *     onConfirm={(reason) => handlePause(reason)}
 *     onCancel={() => setShowConfirm(false)}
 *   />
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import type { SxProps, Theme } from '@mui/material/styles';
import { WrfModal } from './WrfModal';
import { WrfButton } from './WrfButton';
import { WrfAlert } from './WrfAlert';

export type ActionSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface PreflightCheck {
  label: string;
  passed: boolean;
  reason?: string;
}

export interface WrfRiskyActionConfirmationProps {
  open: boolean;
  /** Title of the action being confirmed */
  title: string;
  /** Description of what the action will do and its consequences */
  description: string;
  /** Severity level — drives visual treatment and required interaction */
  severity: ActionSeverity;
  /** Preflight checks to display as a pass/fail checklist */
  preflightChecks?: PreflightCheck[];
  /** Whether to require a typed reason before allowing confirmation */
  requireReason?: boolean;
  /** Placeholder for the reason input */
  reasonPlaceholder?: string;
  /** For critical severity: the exact text the user must type to confirm */
  confirmText?: string;
  /** Callback when confirmed */
  onConfirm: (reason?: string) => void;
  /** Callback when cancelled */
  onCancel: () => void;
  /** Whether confirmation is in progress */
  loading?: boolean;
  /** Extra warning text shown when a protocol transition is active */
  transitionWarning?: string;
  sx?: SxProps<Theme>;
}

const SEVERITY_CONFIG: Record<
  ActionSeverity,
  {
    color: 'info' | 'warning' | 'error';
    delayMs: number;
    reasonRequired: boolean;
    confirmTextRequired: boolean;
  }
> = {
  low: { color: 'info', delayMs: 0, reasonRequired: false, confirmTextRequired: false },
  medium: { color: 'warning', delayMs: 0, reasonRequired: false, confirmTextRequired: false },
  high: { color: 'error', delayMs: 3000, reasonRequired: true, confirmTextRequired: false },
  critical: { color: 'error', delayMs: 5000, reasonRequired: true, confirmTextRequired: true },
};

export const WrfRiskyActionConfirmation = React.forwardRef<
  HTMLDivElement,
  WrfRiskyActionConfirmationProps
>(function WrfRiskyActionConfirmation(
  {
    open,
    title,
    description,
    severity,
    preflightChecks,
    requireReason,
    reasonPlaceholder = 'Reason for this action...',
    confirmText,
    onConfirm,
    onCancel,
    loading = false,
    transitionWarning,
    sx,
  },
  ref,
) {
  const config = SEVERITY_CONFIG[severity];
  const needsReason = requireReason ?? config.reasonRequired;
  const needsConfirmText = config.confirmTextRequired && confirmText;

  const [reason, setReason] = useState('');
  const [typedConfirm, setTypedConfirm] = useState('');
  const [delayRemaining, setDelayRemaining] = useState(0);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setReason('');
      setTypedConfirm('');
      setDelayRemaining(config.delayMs);
    }
  }, [open, config.delayMs]);

  // Countdown timer for severity delay
  useEffect(() => {
    if (!open || delayRemaining <= 0) return;

    const interval = setInterval(() => {
      setDelayRemaining((prev) => {
        const next = prev - 1000;
        return next <= 0 ? 0 : next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, delayRemaining]);

  const preflightsPassed = useMemo(() => {
    if (!preflightChecks || preflightChecks.length === 0) return true;
    return preflightChecks.every((c) => c.passed);
  }, [preflightChecks]);

  const canConfirm = useMemo(() => {
    if (delayRemaining > 0) return false;
    if (!preflightsPassed) return false;
    if (needsReason && reason.trim().length === 0) return false;
    if (needsConfirmText && typedConfirm !== confirmText) return false;
    return true;
  }, [delayRemaining, preflightsPassed, needsReason, reason, needsConfirmText, typedConfirm, confirmText]);

  const handleConfirm = useCallback(() => {
    if (!canConfirm) return;
    onConfirm(reason.trim() || undefined);
  }, [canConfirm, onConfirm, reason]);

  const delaySecs = Math.ceil(delayRemaining / 1000);

  const actions = (
    <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'flex-end' }}>
      <WrfButton variant="ghost" onClick={onCancel} disabled={loading}>
        Cancel
      </WrfButton>
      <WrfButton
        variant="danger"
        onClick={handleConfirm}
        disabled={!canConfirm}
        loading={loading}
      >
        {delaySecs > 0 ? `Confirm (${delaySecs}s)` : 'Confirm'}
      </WrfButton>
    </Box>
  );

  return (
    <WrfModal
      ref={ref}
      open={open}
      onClose={(_e, _reason) => onCancel()}
      title={title}
      actions={actions}
      maxWidth="sm"
      fullWidth
      sx={sx}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Action description */}
        <WrfAlert severity={config.color}>
          {description}
        </WrfAlert>

        {/* Protocol transition warning */}
        {transitionWarning && (
          <WrfAlert severity="warning" title="Protocol Transition Active">
            {transitionWarning}
          </WrfAlert>
        )}

        {/* Preflight checks */}
        {preflightChecks && preflightChecks.length > 0 && (
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
        )}

        {/* Reason input */}
        {(needsReason || requireReason) && (
          <TextField
            label={needsReason ? 'Reason (required)' : 'Reason (optional)'}
            placeholder={reasonPlaceholder}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            multiline
            minRows={2}
            maxRows={4}
            fullWidth
            size="small"
            required={needsReason}
          />
        )}

        {/* Confirm text input for critical actions */}
        {needsConfirmText && confirmText && (
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Type <strong>{confirmText}</strong> to confirm:
            </Typography>
            <TextField
              value={typedConfirm}
              onChange={(e) => setTypedConfirm(e.target.value)}
              fullWidth
              size="small"
              placeholder={confirmText}
              error={typedConfirm.length > 0 && typedConfirm !== confirmText}
            />
          </Box>
        )}
      </Box>
    </WrfModal>
  );
});
