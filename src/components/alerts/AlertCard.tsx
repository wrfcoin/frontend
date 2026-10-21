import React from 'react';
import { Box, Chip, Paper, Typography } from '@mui/material';
import type { RemediationAlert } from '../../hooks/useActiveAlerts';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEVERITY_COLORS: Record<string, string> = {
  SEV1: '#EF4444',
  SEV2: '#F59E0B',
  SEV3: '#3B82F6',
  SEV4: '#94A3B8',
};

const colors = {
  card: '#1E293B',
  cardHover: '#253347',
  border: '#334155',
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AlertCardProps {
  alert: RemediationAlert;
  selected: boolean;
  onSelect: (id: string) => void;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert, selected, onSelect }) => {
  const sevColor = SEVERITY_COLORS[alert.severity] || colors.textSecondary;

  return (
    <Paper
      data-testid="alert-card"
      elevation={0}
      onClick={() => onSelect(alert.id)}
      sx={{
        bgcolor: selected ? colors.cardHover : colors.card,
        borderRadius: 2,
        border: `1px solid ${selected ? sevColor : colors.border}`,
        borderLeft: `4px solid ${sevColor}`,
        cursor: 'pointer',
        p: 2,
        mb: 1.5,
        transition: 'background-color 0.15s ease, border-color 0.15s ease',
        '&:hover': { bgcolor: colors.cardHover },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 0.5,
        }}
      >
        <Typography
          variant="h6"
          sx={{ fontSize: 14, fontWeight: 600, color: colors.text }}
        >
          {alert.alertName}
        </Typography>
        <Chip
          label={alert.severity}
          size="small"
          sx={{
            bgcolor: `${sevColor}22`,
            color: sevColor,
            fontWeight: 700,
            fontSize: 11,
            height: 22,
          }}
        />
      </Box>

      <Typography
        sx={{ fontSize: 12, color: colors.textSecondary, mb: 0.75 }}
      >
        {alert.summary}
      </Typography>

      <Typography
        sx={{ fontSize: 11, color: colors.textSecondary, fontStyle: 'italic' }}
      >
        Started {relativeTime(alert.startedAt)}
      </Typography>
    </Paper>
  );
};

export default AlertCard;
