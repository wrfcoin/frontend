import React, { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import type { RemediationAction } from '../../hooks/useActiveAlerts';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RISK_COLORS: Record<string, string> = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#EF4444',
};

const colors = {
  card: '#1E293B',
  cardHover: '#253347',
  border: '#334155',
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  primary: '#3B82F6',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface RemediationActionPanelProps {
  alertId: string;
  alertName: string;
  actions: RemediationAction[];
  userRole: string;
  onExecute: (action: string, reason: string) => void;
}

const RemediationActionPanel: React.FC<RemediationActionPanelProps> = ({
  alertId,
  alertName,
  actions,
  userRole,
  onExecute,
}) => {
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState(false);

  const handleExecuteClick = (action: RemediationAction) => {
    if (action.requiresReason) {
      setPendingAction(action.action);
      setReason('');
      setReasonError(false);
      setReasonDialogOpen(true);
    } else {
      onExecute(action.action, '');
    }
  };

  const handleConfirm = () => {
    if (!reason.trim()) {
      setReasonError(true);
      return;
    }
    if (pendingAction) {
      onExecute(pendingAction, reason.trim());
    }
    setReasonDialogOpen(false);
    setPendingAction(null);
    setReason('');
  };

  const handleCancel = () => {
    setReasonDialogOpen(false);
    setPendingAction(null);
    setReason('');
    setReasonError(false);
  };

  return (
    <Box data-testid="remediation-action-panel">
      <Typography
        sx={{ fontSize: 13, fontWeight: 600, color: colors.text, mb: 1.5 }}
      >
        Available Actions for {alertName}
      </Typography>

      {actions.length === 0 && (
        <Typography sx={{ fontSize: 12, color: colors.textSecondary }}>
          No actions available for this alert.
        </Typography>
      )}

      {actions.map((action) => {
        const riskColor = RISK_COLORS[action.riskLevel] || colors.textSecondary;
        const onCooldown = action.cooldownRemaining > 0;

        return (
          <Box
            key={action.action}
            data-testid="action-row"
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1.5,
              mb: 1,
              borderRadius: 1.5,
              bgcolor: colors.card,
              border: `1px solid ${colors.border}`,
            }}
          >
            <Box sx={{ flex: 1, mr: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography
                  sx={{ fontSize: 13, fontWeight: 600, color: colors.text }}
                >
                  {action.action}
                </Typography>
                <Chip
                  label={action.riskLevel}
                  size="small"
                  sx={{
                    bgcolor: `${riskColor}22`,
                    color: riskColor,
                    fontWeight: 600,
                    fontSize: 10,
                    height: 20,
                  }}
                />
              </Box>
              <Typography sx={{ fontSize: 11, color: colors.textSecondary }}>
                {action.description}
              </Typography>
              {onCooldown && (
                <Typography
                  sx={{ fontSize: 10, color: '#F59E0B', mt: 0.5, fontStyle: 'italic' }}
                >
                  Cooldown: {action.cooldownRemaining}s remaining
                </Typography>
              )}
            </Box>

            {userRole === 'admin' && (
              <Button
                size="small"
                variant="outlined"
                disabled={!action.enabled || onCooldown}
                onClick={() => handleExecuteClick(action)}
                sx={{
                  minWidth: 80,
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'none',
                  color: colors.primary,
                  borderColor: colors.primary,
                  '&:hover': {
                    borderColor: colors.primary,
                    bgcolor: `${colors.primary}18`,
                  },
                  '&.Mui-disabled': {
                    color: colors.textSecondary,
                    borderColor: colors.border,
                  },
                }}
              >
                Execute
              </Button>
            )}
          </Box>
        );
      })}

      {/* Reason Dialog */}
      <Dialog
        open={reasonDialogOpen}
        onClose={handleCancel}
        PaperProps={{
          sx: { bgcolor: '#0F172A', color: colors.text, minWidth: 360 },
        }}
      >
        <DialogTitle sx={{ fontSize: 16, fontWeight: 600 }}>
          Provide a reason
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 12, color: colors.textSecondary, mb: 1.5 }}>
            This action requires a reason for the audit trail.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={3}
            placeholder="Enter reason for executing this action..."
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (e.target.value.trim()) setReasonError(false);
            }}
            error={reasonError}
            helperText={reasonError ? 'Reason is required' : ''}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: colors.text,
                fontSize: 13,
                '& fieldset': { borderColor: colors.border },
                '&:hover fieldset': { borderColor: colors.primary },
                '&.Mui-focused fieldset': { borderColor: colors.primary },
              },
              '& .MuiFormHelperText-root': { color: '#EF4444' },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleCancel}
            sx={{ color: colors.textSecondary, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            sx={{
              bgcolor: colors.primary,
              textTransform: 'none',
              '&:hover': { bgcolor: '#2563EB' },
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RemediationActionPanel;
