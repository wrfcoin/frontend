import React from 'react';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import type { ExecutionStatus } from '../../hooks/useExecuteRemediation';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const colors = {
  card: '#1E293B',
  border: '#334155',
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  success: '#10B981',
  error: '#EF4444',
  primary: '#3B82F6',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ActionStatusTrackerProps {
  status: ExecutionStatus;
  result: { incidentId?: string; message: string } | null;
  error: string | null;
  onReset: () => void;
}

const ActionStatusTracker: React.FC<ActionStatusTrackerProps> = ({
  status,
  result,
  error,
  onReset,
}) => {
  if (status === 'idle') {
    return null;
  }

  return (
    <Box
      data-testid="action-status-tracker"
      sx={{
        mt: 2,
        p: 2,
        borderRadius: 1.5,
        bgcolor: colors.card,
        border: `1px solid ${colors.border}`,
      }}
    >
      {/* Executing */}
      {status === 'executing' && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={20} sx={{ color: colors.primary }} />
          <Typography sx={{ fontSize: 13, color: colors.textSecondary }}>
            Executing action...
          </Typography>
        </Box>
      )}

      {/* Confirming (same visual as executing) */}
      {status === 'confirming' && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={20} sx={{ color: colors.primary }} />
          <Typography sx={{ fontSize: 13, color: colors.textSecondary }}>
            Confirming action...
          </Typography>
        </Box>
      )}

      {/* Success */}
      {status === 'success' && result && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <CheckCircleIcon sx={{ fontSize: 20, color: colors.success }} />
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: colors.success }}>
              {result.message}
            </Typography>
          </Box>
          {result.incidentId && (
            <Typography
              sx={{ fontSize: 11, color: colors.textSecondary, mb: 1, fontFamily: 'monospace' }}
            >
              Incident ID: {result.incidentId}
            </Typography>
          )}
          <Button
            size="small"
            onClick={onReset}
            sx={{
              fontSize: 11,
              textTransform: 'none',
              color: colors.primary,
            }}
          >
            Reset
          </Button>
        </Box>
      )}

      {/* Failure */}
      {status === 'failure' && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <ErrorOutlineIcon sx={{ fontSize: 20, color: colors.error }} />
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: colors.error }}>
              {error || 'An error occurred'}
            </Typography>
          </Box>
          <Button
            size="small"
            onClick={onReset}
            sx={{
              fontSize: 11,
              textTransform: 'none',
              color: colors.primary,
            }}
          >
            Reset
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default ActionStatusTracker;
