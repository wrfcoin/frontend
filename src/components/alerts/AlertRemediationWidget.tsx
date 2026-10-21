import React from 'react';
import { Badge, Box, CircularProgress, Typography } from '@mui/material';
import { Link } from 'react-router';
import { useActiveAlerts } from '../../hooks/useActiveAlerts';
import type { RemediationAlert } from '../../hooks/useActiveAlerts';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEVERITY_PRIORITY: Record<string, number> = {
  SEV1: 0,
  SEV2: 1,
  SEV3: 2,
  SEV4: 3,
};

const SEVERITY_COLORS: Record<string, string> = {
  SEV1: '#EF4444',
  SEV2: '#F59E0B',
  SEV3: '#3B82F6',
  SEV4: '#94A3B8',
};

const colors = {
  card: '#1E293B',
  border: '#334155',
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  primary: '#3B82F6',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTopSeverity(alerts: RemediationAlert[]): string | null {
  const firing = alerts.filter((a) => a.status === 'firing');
  if (firing.length === 0) return null;

  firing.sort(
    (a, b) =>
      (SEVERITY_PRIORITY[a.severity] ?? 99) -
      (SEVERITY_PRIORITY[b.severity] ?? 99),
  );

  return firing[0].severity;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AlertRemediationWidget: React.FC = () => {
  const { alerts, loading, error } = useActiveAlerts();

  const firingAlerts = alerts.filter((a) => a.status === 'firing');
  const firingCount = firingAlerts.length;
  const topSeverity = getTopSeverity(alerts);
  const topColor = topSeverity
    ? SEVERITY_COLORS[topSeverity] || colors.textSecondary
    : colors.textSecondary;

  return (
    <Box
      data-testid="alert-remediation-widget"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1.5,
        px: 1.5,
        py: 0.75,
        borderRadius: 1.5,
        bgcolor: colors.card,
        border: `1px solid ${colors.border}`,
      }}
    >
      {loading && (
        <CircularProgress size={14} sx={{ color: colors.textSecondary }} />
      )}

      {error && !loading && (
        <Typography sx={{ fontSize: 11, color: '#EF4444' }}>
          Remediation API unavailable
        </Typography>
      )}

      {!loading && !error && (
        <>
          {/* Severity indicator dot */}
          {firingCount > 0 && (
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: topColor,
                boxShadow: `0 0 6px ${topColor}`,
              }}
            />
          )}

          {/* Badge with firing count */}
          <Badge
            badgeContent={firingCount}
            color="error"
            max={99}
            sx={{
              '& .MuiBadge-badge': {
                fontSize: 10,
                minWidth: 16,
                height: 16,
                bgcolor: firingCount > 0 ? topColor : colors.textSecondary,
              },
            }}
          >
            <Typography sx={{ fontSize: 12, fontWeight: 500, color: colors.text }}>
              Alerts
            </Typography>
          </Badge>

          {/* View All link */}
          <Link
            to="/alerts/remediation"
            style={{ textDecoration: 'none' }}
          >
            <Typography
              sx={{
                fontSize: 11,
                color: colors.primary,
                fontWeight: 500,
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              View All
            </Typography>
          </Link>
        </>
      )}
    </Box>
  );
};

export default AlertRemediationWidget;
