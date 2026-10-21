import React, { useState, useMemo } from 'react';
import {
  Alert as MuiAlert,
  Box,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import { useActiveAlerts } from '../hooks/useActiveAlerts';
import { useExecuteRemediation } from '../hooks/useExecuteRemediation';
import AlertCard from '../components/alerts/AlertCard';
import RemediationActionPanel from '../components/alerts/RemediationActionPanel';
import ActionStatusTracker from '../components/alerts/ActionStatusTracker';
import type { RemediationAlert } from '../hooks/useActiveAlerts';

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
  bg: '#0F172A',
  card: '#1E293B',
  border: '#334155',
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  primary: '#3B82F6',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function decodeJwtRole(): string {
  try {
    const token = localStorage.getItem('token');
    if (!token) return 'user';
    const payload = token.split('.')[1];
    if (!payload) return 'user';
    const decoded = JSON.parse(atob(payload));
    return decoded.role || 'user';
  } catch {
    return 'user';
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AlertRemediationDashboard: React.FC = () => {
  const { alerts, loading, error } = useActiveAlerts();
  const { status, result, error: execError, execute, reset } = useExecuteRemediation();
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  const userRole = useMemo(() => decodeJwtRole(), []);

  const selectedAlert: RemediationAlert | undefined = useMemo(
    () => alerts.find((a) => a.id === selectedAlertId),
    [alerts, selectedAlertId],
  );

  const handleSelect = (id: string) => {
    setSelectedAlertId(id);
    reset();
  };

  const handleExecute = (action: string, reason: string) => {
    if (selectedAlertId) {
      execute(selectedAlertId, action, reason);
    }
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: colors.text, mb: 0.5 }}>
          Alert Remediation
        </Typography>
        <Typography sx={{ fontSize: 14, color: colors.textSecondary }}>
          Monitor active alerts and execute remediation actions
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left column - Alert list */}
        <Grid size={{ xs: 12, md: 5, lg: 4 }}>
          <Paper
            elevation={0}
            sx={{
              bgcolor: colors.bg,
              borderRadius: 2,
              border: `1px solid ${colors.border}`,
              p: 2,
              minHeight: 400,
            }}
          >
            <Typography
              sx={{ fontSize: 13, fontWeight: 600, color: colors.text, mb: 1.5 }}
            >
              {loading ? 'Loading active alerts' : error ? 'Active Alerts: unavailable' : `Active Alerts (${alerts.filter((a) => a.status === 'firing').length})`}
            </Typography>

            {/* Loading state */}
            {loading && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  py: 6,
                }}
              >
                <CircularProgress size={28} sx={{ color: colors.primary }} />
              </Box>
            )}

            {/* Error state */}
            {error && !loading && (
              <MuiAlert
                severity="error"
                sx={{
                  bgcolor: '#EF444422',
                  color: '#EF4444',
                  '& .MuiAlert-icon': { color: '#EF4444' },
                }}
              >
                {error}
              </MuiAlert>
            )}

            {/* Empty state */}
            {!loading && !error && alerts.length === 0 && (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography sx={{ fontSize: 13, color: colors.textSecondary }}>
                  No active alerts
                </Typography>
              </Box>
            )}

            {/* Alert cards */}
            {!loading &&
              !error &&
              alerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  selected={alert.id === selectedAlertId}
                  onSelect={handleSelect}
                />
              ))}
          </Paper>
        </Grid>

        {/* Right column - Detail panel */}
        <Grid size={{ xs: 12, md: 7, lg: 8 }}>
          {selectedAlert ? (
            <Paper
              elevation={0}
              sx={{
                bgcolor: colors.bg,
                borderRadius: 2,
                border: `1px solid ${colors.border}`,
                p: 2,
                minHeight: 400,
              }}
            >
              {/* Alert detail header */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  mb: 2,
                  pb: 2,
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <Box
                  sx={{
                    width: 4,
                    height: 32,
                    borderRadius: 1,
                    bgcolor:
                      SEVERITY_COLORS[selectedAlert.severity] ||
                      colors.textSecondary,
                  }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{ fontSize: 16, fontWeight: 700, color: colors.text }}
                  >
                    {selectedAlert.alertName}
                  </Typography>
                  <Typography
                    sx={{ fontSize: 12, color: colors.textSecondary }}
                  >
                    {selectedAlert.summary}
                  </Typography>
                </Box>
                <Chip
                  label={selectedAlert.severity}
                  size="small"
                  sx={{
                    bgcolor: `${SEVERITY_COLORS[selectedAlert.severity]}22`,
                    color: SEVERITY_COLORS[selectedAlert.severity],
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                />
              </Box>

              {/* Playbook description */}
              {selectedAlert.playbook?.description && (
                <Typography
                  sx={{
                    fontSize: 12,
                    color: colors.textSecondary,
                    mb: 2,
                    fontStyle: 'italic',
                  }}
                >
                  {selectedAlert.playbook.description}
                </Typography>
              )}

              {/* Remediation actions */}
              <RemediationActionPanel
                alertId={selectedAlert.id}
                alertName={selectedAlert.alertName}
                actions={selectedAlert.playbook?.actions || []}
                userRole={userRole}
                onExecute={handleExecute}
              />

              {/* Execution status */}
              <ActionStatusTracker
                status={status}
                result={result}
                error={execError}
                onReset={reset}
              />
            </Paper>
          ) : (
            <Paper
              elevation={0}
              sx={{
                bgcolor: colors.bg,
                borderRadius: 2,
                border: `1px solid ${colors.border}`,
                p: 2,
                minHeight: 400,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography sx={{ fontSize: 13, color: colors.textSecondary }}>
                Select an alert to view remediation options
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default AlertRemediationDashboard;
