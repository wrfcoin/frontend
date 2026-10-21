/**
 * WrfCapabilityReadinessBadge
 *
 * Displays the 5-level runtime readiness mode for a platform capability.
 * Follows the TransactionTrustBadge pattern: config map per mode,
 * MUI Chip with icon and Tooltip, compact/expanded layouts.
 *
 * Usage:
 *   <WrfCapabilityReadinessBadge featureName="validatorOps" compact />
 *   <WrfCapabilityReadinessBadge readiness={entry} />
 */

import React from 'react';
import { Box, Chip, Tooltip, Typography } from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import StorageIcon from '@mui/icons-material/Storage';
import ScienceIcon from '@mui/icons-material/Science';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import BlockIcon from '@mui/icons-material/Block';
import type { SxProps, Theme } from '@mui/material/styles';
import type { CapabilityMode, CapabilityReadinessEntry } from '../../types/capabilities';
import { useFeatureReadiness } from '../../config/featureHooks';
import { capabilityReasonLabel } from '../../lib/capabilityReasons';

export interface WrfCapabilityReadinessBadgeProps {
  /** Feature name to look up readiness from context */
  featureName?: string;
  /** Direct readiness entry (overrides featureName lookup) */
  readiness?: CapabilityReadinessEntry;
  /** Compact mode shows just the chip; expanded shows chip + reason */
  compact?: boolean;
  sx?: SxProps<Theme>;
}

interface ModeConfig {
  label: string;
  chipColor: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  icon: React.ReactElement;
  description: string;
}

const MODE_CONFIG: Record<CapabilityMode, ModeConfig> = {
  'production-verified': {
    label: 'Production',
    chipColor: 'success',
    icon: <VerifiedIcon fontSize="small" />,
    description: 'Fully operational with production-grade verification',
  },
  'local-manager': {
    label: 'Local',
    chipColor: 'info',
    icon: <StorageIcon fontSize="small" />,
    description: 'Running with local state management; limited redundancy',
  },
  simulated: {
    label: 'Simulated',
    chipColor: 'warning',
    icon: <ScienceIcon fontSize="small" />,
    description: 'Operating in simulation mode; not production-verified',
  },
  degraded: {
    label: 'Degraded',
    chipColor: 'warning',
    icon: <WarningAmberIcon fontSize="small" />,
    description: 'Service experiencing issues; some operations may fail',
  },
  unavailable: {
    label: 'Unavailable',
    chipColor: 'error',
    icon: <BlockIcon fontSize="small" />,
    description: 'Service is not reachable or has been disabled',
  },
};

export const WrfCapabilityReadinessBadge = React.forwardRef<
  HTMLDivElement,
  WrfCapabilityReadinessBadgeProps
>(function WrfCapabilityReadinessBadge(
  { featureName, readiness: readinessProp, compact = false, sx },
  ref,
) {
  const contextReadiness = useFeatureReadiness(featureName ?? '');
  const readiness = readinessProp ?? contextReadiness;

  if (!readiness) {
    return null;
  }

  const config = MODE_CONFIG[readiness.mode];
  const reasonLabel = capabilityReasonLabel(readiness.reasonCode);

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
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.85 }}>
              {reasonLabel}
            </Typography>
          </Box>
        }
        arrow
      >
        <Box component="span" sx={[{ display: 'inline-flex' }, ...(Array.isArray(sx) ? sx : [sx])] as SxProps<Theme>}>
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
      <Typography variant="caption" color="text.secondary">
        {reasonLabel}
      </Typography>
    </Box>
  );
});
