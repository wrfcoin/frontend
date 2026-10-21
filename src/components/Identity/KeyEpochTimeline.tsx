import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Stack,
  Tooltip,
  Paper,
  Alert,
} from '@mui/material';
import {
  CheckCircle as ActiveIcon,
  Cancel as RevokedIcon,
  Schedule as ExpiredIcon,
  VpnKey as KeyIcon,
} from '@mui/icons-material';

// --- Types ---

export type KeyEpochStatus = 'active' | 'expired' | 'revoked';

export interface KeyEpochEntry {
  epoch: number;
  keyFingerprint: string;
  activatedAt: string; // ISO date
  revokedAt?: string | null; // ISO date or null
  status: KeyEpochStatus;
  signingRole: string;
}

interface KeyEpochTimelineProps {
  epochs: KeyEpochEntry[];
  /** Color palette to inherit from parent dashboard */
  palette?: {
    bg: string;
    card: string;
    text: string;
    textSecondary: string;
    primary: string;
    success: string;
    warning: string;
    error: string;
    border: string;
  };
  /** ISO timestamp of the last policy evaluation. */
  policyEvaluatedAt?: string;
  /** Whether key epoch mutations are currently permitted. */
  canMutateEpochs?: boolean;
  /** Denial reason if key epoch mutations are restricted. */
  epochDenialReason?: string;
}

// --- Default palette (matches IdentityDashboard) ---

const defaultPalette = {
  bg: '#0F172A',
  card: '#1E293B',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  primary: '#3B82F6',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  border: '#334155',
};

// --- Helpers ---

const STATUS_CONFIG: Record<KeyEpochStatus, { color: string; icon: React.ReactElement; label: string }> = {
  active: {
    color: defaultPalette.success,
    icon: <ActiveIcon sx={{ fontSize: 14 }} />,
    label: 'Active',
  },
  expired: {
    color: defaultPalette.warning,
    icon: <ExpiredIcon sx={{ fontSize: 14 }} />,
    label: 'Expired',
  },
  revoked: {
    color: defaultPalette.error,
    icon: <RevokedIcon sx={{ fontSize: 14 }} />,
    label: 'Revoked',
  },
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function truncateFingerprint(fp: string, len: number = 16): string {
  if (fp.length <= len) return fp;
  return `${fp.slice(0, len)}...`;
}

// --- Component ---

const KeyEpochTimeline: React.FC<KeyEpochTimelineProps> = ({
  epochs,
  palette: paletteProp,
  policyEvaluatedAt,
  canMutateEpochs = true,
  epochDenialReason,
}) => {
  const p = paletteProp || defaultPalette;

  if (epochs.length === 0) {
    return (
      <Box sx={{ py: 3, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: p.textSecondary }}>
          No key epoch history available.
        </Typography>
      </Box>
    );
  }

  // Sort descending by epoch (newest first)
  const sorted = [...epochs].sort((a, b) => b.epoch - a.epoch);

  // Group active epochs by role for summary display
  const activeByRole: Record<string, KeyEpochEntry> = {};
  for (const e of epochs) {
    if (e.status === 'active' && (!activeByRole[e.signingRole] || e.epoch > activeByRole[e.signingRole].epoch)) {
      activeByRole[e.signingRole] = e;
    }
  }

  return (
    <Box>
      {/* Policy status banner */}
      {!canMutateEpochs && epochDenialReason && (
        <Alert
          severity="warning"
          sx={{
            mb: 2,
            bgcolor: `${p.warning}15`,
            color: p.textSecondary,
            border: `1px solid ${p.warning}33`,
            '& .MuiAlert-icon': { color: p.warning },
            fontSize: '0.8rem',
          }}
        >
          {epochDenialReason}
        </Alert>
      )}

      {/* Active epoch by role summary */}
      {Object.keys(activeByRole).length > 0 && (
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
          {Object.entries(activeByRole).map(([role, entry]) => (
            <Tooltip key={role} title={`Active since ${formatDateTime(entry.activatedAt)}`}>
              <Chip
                size="small"
                label={`${role}: Epoch ${entry.epoch}`}
                sx={{
                  bgcolor: `${p.success}1a`,
                  color: p.success,
                  border: `1px solid ${p.success}33`,
                  fontWeight: 600,
                  fontSize: '0.7rem',
                }}
              />
            </Tooltip>
          ))}
          {policyEvaluatedAt && (
            <Tooltip title={`Policy last evaluated: ${formatDateTime(policyEvaluatedAt)}`}>
              <Chip
                size="small"
                label={`Policy: ${formatDate(policyEvaluatedAt)}`}
                sx={{
                  bgcolor: `${p.primary}1a`,
                  color: p.primary,
                  border: `1px solid ${p.primary}33`,
                  fontWeight: 600,
                  fontSize: '0.65rem',
                }}
              />
            </Tooltip>
          )}
        </Stack>
      )}

    <Box sx={{ position: 'relative', pl: 3 }}>
      {/* Vertical timeline line */}
      <Box
          sx={{
            position: 'absolute',
            left: 11,
            top: 8,
            bottom: 8,
            width: 2,
            bgcolor: p.border,
            borderRadius: 1,
          }}
        />

      <Stack spacing={2}>
        {sorted.map((entry, idx) => {
            const statusCfg = STATUS_CONFIG[entry.status];
            const isFirst = idx === 0;

            return (
              <Box key={`${entry.signingRole}-${entry.epoch}`} sx={{ position: 'relative' }}>
              {/* Timeline dot */}
              <Box
                  sx={{
                    position: 'absolute',
                    left: -21,
                    top: 14,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: statusCfg.color,
                    border: `2px solid ${p.card}`,
                    boxShadow: isFirst ? `0 0 0 3px ${statusCfg.color}33` : 'none',
                    zIndex: 1,
                  }}
                />

              <Paper
                  sx={{
                    bgcolor: `${p.bg}80`,
                    border: `1px solid ${isFirst ? statusCfg.color + '55' : p.border}`,
                    borderRadius: 2,
                    p: 2,
                    transition: 'border-color 0.2s',
                    '&:hover': { borderColor: p.primary },
                  }}
                >
                {/* Header row: epoch + status */}
                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    flexWrap="wrap"
                    gap={1}
                    sx={{ mb: 1 }}
                  >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography
                        variant="subtitle2"
                        sx={{ color: p.text, fontWeight: 700, fontFamily: 'monospace' }}
                      >
                      Epoch {entry.epoch}
                    </Typography>
                    <Chip
                        label={entry.signingRole}
                        size="small"
                        sx={{
                          bgcolor: `${p.primary}15`,
                          color: p.primary,
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          height: 20,
                        }}
                      />
                  </Stack>
                  <Chip
                      icon={statusCfg.icon}
                      label={statusCfg.label}
                      size="small"
                      sx={{
                        bgcolor: `${statusCfg.color}1a`,
                        color: statusCfg.color,
                        border: `1px solid ${statusCfg.color}33`,
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        '& .MuiChip-icon': { color: statusCfg.color },
                      }}
                    />
                </Stack>

                {/* Key fingerprint */}
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
                  <KeyIcon sx={{ fontSize: 14, color: p.textSecondary }} />
                  <Tooltip title={entry.keyFingerprint} placement="top">
                    <Typography
                        variant="caption"
                        sx={{
                          color: p.textSecondary,
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          cursor: 'default',
                        }}
                      >
                      {truncateFingerprint(entry.keyFingerprint, 24)}
                    </Typography>
                  </Tooltip>
                </Stack>

                {/* Validity window */}
                <Stack direction="row" spacing={3} flexWrap="wrap">
                  <Tooltip title={formatDateTime(entry.activatedAt)} placement="top">
                    <Typography variant="caption" sx={{ color: p.textSecondary }}>
                      Activated: {formatDate(entry.activatedAt)}
                    </Typography>
                  </Tooltip>
                  {entry.revokedAt && (
                      <Tooltip title={formatDateTime(entry.revokedAt)} placement="top">
                      <Typography variant="caption" sx={{ color: p.error }}>
                        Revoked: {formatDate(entry.revokedAt)}
                      </Typography>
                    </Tooltip>
                    )}
                  {!entry.revokedAt && entry.status === 'active' && (
                      <Typography variant="caption" sx={{ color: p.success }}>
                      Currently valid
                    </Typography>
                    )}
                </Stack>
              </Paper>
            </Box>
            );
          })}
      </Stack>
    </Box>
    </Box>
  );
};

export default KeyEpochTimeline;
