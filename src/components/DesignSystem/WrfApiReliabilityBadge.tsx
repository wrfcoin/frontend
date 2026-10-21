/**
 * WrfApiReliabilityBadge
 *
 * Displays the freshness / reliability state of an API response.
 * Follows the WrfCapabilityReadinessBadge pattern: config map per freshness
 * level, MUI Chip with icon and Tooltip, compact/expanded layouts.
 *
 * Usage:
 *   <WrfApiReliabilityBadge reliability={info} compact />
 *   <WrfApiReliabilityBadge reliability={info} />
 */

import React from 'react';
import { Box, Chip, Tooltip, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HistoryIcon from '@mui/icons-material/History';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ReplayIcon from '@mui/icons-material/Replay';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import type { SxProps, Theme } from '@mui/material/styles';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ResponseFreshness = 'fresh' | 'cached' | 'stale' | 'replay' | 'conflict';

export interface ApiReliabilityInfo {
  freshness: ResponseFreshness;
  nonce?: string;
  nonceValidated?: boolean;
  requestId?: string;
  responseAge?: number;
  fromCache?: boolean;
}

export interface WrfApiReliabilityBadgeProps {
  reliability: ApiReliabilityInfo;
  compact?: boolean;
  sx?: SxProps<Theme>;
}

// ---------------------------------------------------------------------------
// Config map
// ---------------------------------------------------------------------------

interface FreshnessConfig {
  label: string;
  chipColor: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  icon: React.ReactElement;
  description: string;
}

const FRESHNESS_CONFIG: Record<ResponseFreshness, FreshnessConfig> = {
  fresh: {
    label: 'Fresh',
    chipColor: 'success',
    icon: <CheckCircleIcon fontSize="small" />,
    description: 'Response is current and verified',
  },
  cached: {
    label: 'Cached',
    chipColor: 'info',
    icon: <HistoryIcon fontSize="small" />,
    description: 'Served from cache; may be slightly delayed',
  },
  stale: {
    label: 'Stale',
    chipColor: 'warning',
    icon: <WarningAmberIcon fontSize="small" />,
    description: 'Response is older than expected; refresh recommended',
  },
  replay: {
    label: 'Replay',
    chipColor: 'error',
    icon: <ReplayIcon fontSize="small" />,
    description: 'Potential replay detected; verify nonce',
  },
  conflict: {
    label: 'Conflict',
    chipColor: 'error',
    icon: <ErrorOutlineIcon fontSize="small" />,
    description: 'Request conflict; operation may have already executed',
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const WrfApiReliabilityBadge = React.forwardRef<
  HTMLDivElement,
  WrfApiReliabilityBadgeProps
>(function WrfApiReliabilityBadge({ reliability, compact = false, sx }, ref) {
  const config = FRESHNESS_CONFIG[reliability.freshness];

  const chip = (
    <Chip
      size="small"
      icon={config.icon}
      label={config.label}
      color={config.chipColor}
      variant="outlined"
      sx={{ fontWeight: 600, fontSize: '0.75rem' }}
    />
  );

  if (compact) {
    return (
      <Tooltip
        ref={ref}
        title={
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {config.description}
            </Typography>
            {reliability.requestId && (
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.85 }}>
                Request ID: {reliability.requestId}
              </Typography>
            )}
            {reliability.nonce && (
              <Typography variant="caption" sx={{ display: 'block', mt: 0.25, opacity: 0.85 }}>
                Nonce: {reliability.nonce}
                {reliability.nonceValidated != null && (
                  <> ({reliability.nonceValidated ? 'validated' : 'not validated'})</>
                )}
              </Typography>
            )}
            {reliability.responseAge != null && (
              <Typography variant="caption" sx={{ display: 'block', mt: 0.25, opacity: 0.85 }}>
                Age: {reliability.responseAge}s
              </Typography>
            )}
          </Box>
        }
        arrow
      >
        <Box
          component="span"
          sx={[{ display: 'inline-flex' }, ...(Array.isArray(sx) ? sx : [sx])] as SxProps<Theme>}
        >
          {chip}
        </Box>
      </Tooltip>
    );
  }

  return (
    <Box
      ref={ref}
      sx={[
        {
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ] as SxProps<Theme>}
    >
      {chip}
      {reliability.requestId && (
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
          Request ID: {reliability.requestId}
        </Typography>
      )}
      {reliability.nonce && (
        <Typography variant="caption" color="text.secondary">
          Nonce: {reliability.nonce}
          {reliability.nonceValidated != null && (
            <Typography
              component="span"
              variant="caption"
              color={reliability.nonceValidated ? 'success.main' : 'warning.main'}
              sx={{ ml: 0.5 }}
            >
              ({reliability.nonceValidated ? 'validated' : 'not validated'})
            </Typography>
          )}
        </Typography>
      )}
      {reliability.responseAge != null && (
        <Typography variant="caption" color="text.secondary">
          Response age: {reliability.responseAge}s
        </Typography>
      )}
    </Box>
  );
});
