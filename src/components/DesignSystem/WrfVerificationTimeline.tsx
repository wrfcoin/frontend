/**
 * WrfVerificationTimeline
 *
 * Displays a vertical (or compact horizontal) timeline of verification steps
 * for on-chain credential and carbon-credit verification flows.
 *
 * Follows the WrfCapabilityReadinessBadge pattern: status config map,
 * MUI primitives, CVD-safe colors from design system tokens.
 *
 * Usage:
 *   <WrfVerificationTimeline steps={steps} />
 *   <WrfVerificationTimeline steps={steps} compact confidence={87} />
 */

import React, { forwardRef } from 'react';
import {
  Box,
  Typography,
  Chip,
  Tooltip,
  LinearProgress,
  Stack,
  type SxProps,
  type Theme,
} from '@mui/material';
import CheckCircle from '@mui/icons-material/CheckCircle';
import HourglassTop from '@mui/icons-material/HourglassTop';
import RadioButtonUnchecked from '@mui/icons-material/RadioButtonUnchecked';
import Cancel from '@mui/icons-material/Cancel';
import SkipNext from '@mui/icons-material/SkipNext';
import { colors, spacing } from '../ui/tokens';
import type {
  VerificationTimelineStep,
  VerificationStepStatus,
} from '../../types/verification';

// ---------------------------------------------------------------------------
// Status config map
// ---------------------------------------------------------------------------

interface StatusConfig {
  color: string;
  chipColor: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  icon: React.ReactElement;
  label: string;
}

const STATUS_CONFIG: Record<VerificationStepStatus, StatusConfig> = {
  completed: {
    color: colors.success.main,
    chipColor: 'success',
    icon: <CheckCircle fontSize="small" />,
    label: 'Completed',
  },
  active: {
    color: colors.brand.primary,
    chipColor: 'primary',
    icon: <HourglassTop fontSize="small" />,
    label: 'Active',
  },
  pending: {
    color: colors.text.muted,
    chipColor: 'default',
    icon: <RadioButtonUnchecked fontSize="small" />,
    label: 'Pending',
  },
  failed: {
    color: colors.error.main,
    chipColor: 'error',
    icon: <Cancel fontSize="small" />,
    label: 'Failed',
  },
  skipped: {
    color: colors.text.muted,
    chipColor: 'default',
    icon: <SkipNext fontSize="small" />,
    label: 'Skipped',
  },
};

// ---------------------------------------------------------------------------
// Pulse animation keyframes for active status
// ---------------------------------------------------------------------------

const pulseKeyframes = {
  '@keyframes wrfTimelinePulse': {
    '0%': { boxShadow: '0 0 0 0 rgba(59, 130, 246, 0.5)' },
    '70%': { boxShadow: '0 0 0 6px rgba(59, 130, 246, 0)' },
    '100%': { boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)' },
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncateHash(value: string): string {
  if (value.length <= 14) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  if (diffMs < 0) return 'just now';
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const remSec = sec % 60;
  return remSec > 0 ? `${min}m ${remSec}s` : `${min}m`;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface WrfVerificationTimelineProps {
  steps: VerificationTimelineStep[];
  compact?: boolean;
  confidence?: number;
  title?: string;
  sx?: SxProps<Theme>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const WrfVerificationTimeline = forwardRef<
  HTMLDivElement,
  WrfVerificationTimelineProps
>(function WrfVerificationTimeline(
  { steps, compact = false, confidence, title, sx },
  ref,
) {
  // ---- Compact mode: horizontal chip summary ----
  if (compact) {
    return (
      <Box
        ref={ref}
        sx={[
          { display: 'flex', flexDirection: 'column', gap: 1 },
          ...(Array.isArray(sx) ? sx : [sx]),
        ] as SxProps<Theme>}
      >
        {title && (
          <Typography variant="caption" sx={{ fontWeight: 600, color: colors.text.secondary }}>
            {title}
          </Typography>
        )}
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          {steps.map((step) => {
            const cfg = STATUS_CONFIG[step.status];
            return (
              <Tooltip key={step.name} title={`${step.label}: ${cfg.label}`} arrow>
                <Chip
                  size="small"
                  icon={cfg.icon}
                  label={step.label}
                  color={cfg.chipColor}
                  variant="outlined"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    ...(step.status === 'skipped' && {
                      textDecoration: 'line-through',
                    }),
                  }}
                />
              </Tooltip>
            );
          })}
        </Stack>
      </Box>
    );
  }

  // ---- Full vertical timeline ----
  return (
    <Box
      ref={ref}
      sx={[
        {
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          ...pulseKeyframes,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ] as SxProps<Theme>}
    >
      {title && (
        <Typography
          variant="body2"
          sx={{ fontWeight: 600, color: colors.text.primary, mb: spacing.sm / 8 }}
        >
          {title}
        </Typography>
      )}

      {steps.map((step, index) => {
        const cfg = STATUS_CONFIG[step.status];
        const isLast = index === steps.length - 1;

        return (
          <Box key={step.name} sx={{ display: 'flex', gap: 1.5, minHeight: isLast ? 'auto' : 56 }}>
            {/* Dot + connector */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: 24,
                flexShrink: 0,
              }}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: cfg.color,
                  mt: '4px',
                  flexShrink: 0,
                  ...(step.status === 'active' && {
                    animation: 'wrfTimelinePulse 1.8s ease-in-out infinite',
                  }),
                }}
              />
              {!isLast && (
                <Box
                  sx={{
                    width: 2,
                    flex: 1,
                    backgroundColor: colors.border.default,
                    mt: 0.5,
                    mb: 0.5,
                  }}
                />
              )}
            </Box>

            {/* Step content */}
            <Box sx={{ pb: isLast ? 0 : 1.5, flex: 1 }}>
              {/* Label row */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: step.status === 'skipped' ? colors.text.muted : colors.text.primary,
                    ...(step.status === 'skipped' && { textDecoration: 'line-through' }),
                  }}
                >
                  {step.label}
                </Typography>
                <Chip
                  size="small"
                  icon={cfg.icon}
                  label={cfg.label}
                  color={cfg.chipColor}
                  variant="outlined"
                  sx={{ fontWeight: 600, fontSize: '0.7rem', height: 22 }}
                />
                {step.timestamp && (
                  <Tooltip title={new Date(step.timestamp).toLocaleString()} arrow>
                    <Typography variant="caption" sx={{ color: colors.text.muted }}>
                      {formatRelativeTime(step.timestamp)}
                    </Typography>
                  </Tooltip>
                )}
                {step.duration != null && (
                  <Typography variant="caption" sx={{ color: colors.text.muted }}>
                    ({formatDuration(step.duration)})
                  </Typography>
                )}
              </Box>

              {/* Details */}
              {step.details && (
                <Typography variant="caption" sx={{ color: colors.text.secondary, display: 'block', mt: 0.25 }}>
                  {step.details}
                </Typography>
              )}

              {/* Evidence */}
              {step.status === 'completed' && step.evidence && step.evidence.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, mt: 0.5 }}>
                  {step.evidence.map((ev, evIdx) => (
                    <Box key={evIdx} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {ev.label && (
                        <Typography variant="caption" sx={{ color: colors.text.muted }}>
                          {ev.label}:
                        </Typography>
                      )}
                      <Tooltip title={ev.value} arrow>
                        {ev.explorerUrl ? (
                          <Typography
                            component="a"
                            href={ev.explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="caption"
                            sx={{
                              color: colors.brand.primary,
                              fontFamily: 'monospace',
                              textDecoration: 'none',
                              '&:hover': { textDecoration: 'underline' },
                            }}
                          >
                            {truncateHash(ev.value)}
                          </Typography>
                        ) : (
                          <Typography
                            variant="caption"
                            sx={{ color: colors.text.secondary, fontFamily: 'monospace' }}
                          >
                            {truncateHash(ev.value)}
                          </Typography>
                        )}
                      </Tooltip>
                    </Box>
                  ))}
                </Box>
              )}

              {/* Degraded mode: completed but no evidence */}
              {step.status === 'completed' && (!step.evidence || step.evidence.length === 0) && (
                <Box
                  sx={{
                    mt: 0.5,
                    px: 1,
                    py: 0.5,
                    border: '1px dashed',
                    borderColor: colors.border.default,
                    borderRadius: 1,
                    display: 'inline-block',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ fontStyle: 'italic', color: colors.text.muted }}
                  >
                    Evidence unavailable
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        );
      })}

      {/* Confidence bar */}
      {confidence != null && (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: colors.text.secondary, fontWeight: 600 }}>
              Confidence
            </Typography>
            <Typography variant="caption" sx={{ color: colors.text.secondary, fontWeight: 600 }}>
              {confidence}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(100, Math.max(0, confidence))}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: colors.bg.secondary,
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                backgroundColor:
                  confidence >= 80
                    ? colors.success.main
                    : confidence >= 50
                      ? colors.warning.main
                      : colors.error.main,
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
});
