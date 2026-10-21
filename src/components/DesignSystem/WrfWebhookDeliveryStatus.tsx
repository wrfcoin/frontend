/**
 * WrfWebhookDeliveryStatus
 *
 * Displays the delivery state of webhook entries in compact or expanded mode.
 * Follows the WrfCapabilityReadinessBadge pattern: config map per state,
 * MUI Chip with icon, compact summary vs. expanded list.
 *
 * Usage:
 *   <WrfWebhookDeliveryStatus deliveries={entries} compact />
 *   <WrfWebhookDeliveryStatus deliveries={entries} />
 */

import React from 'react';
import { Box, Chip, List, ListItem, Tooltip, Typography } from '@mui/material';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import type { SxProps, Theme } from '@mui/material/styles';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WebhookState = 'pending' | 'delivered' | 'failed' | 'retrying';

export interface WebhookDeliveryEntry {
  id: string;
  event: string;
  state: WebhookState;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: string;
  nextRetryAt?: string;
  statusCode?: number;
  error?: string;
}

export interface WrfWebhookDeliveryStatusProps {
  deliveries: WebhookDeliveryEntry[];
  compact?: boolean;
  sx?: SxProps<Theme>;
}

// ---------------------------------------------------------------------------
// Config map
// ---------------------------------------------------------------------------

interface StateConfig {
  chipColor: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  icon: React.ReactElement;
  label: string;
}

const STATE_CONFIG: Record<WebhookState, StateConfig> = {
  pending: {
    chipColor: 'warning',
    icon: <HourglassEmptyIcon fontSize="small" />,
    label: 'Pending',
  },
  delivered: {
    chipColor: 'success',
    icon: <CheckCircleIcon fontSize="small" />,
    label: 'Delivered',
  },
  failed: {
    chipColor: 'error',
    icon: <CancelIcon fontSize="small" />,
    label: 'Failed',
  },
  retrying: {
    chipColor: 'info',
    icon: <AutorenewIcon fontSize="small" />,
    label: 'Retrying',
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const WrfWebhookDeliveryStatus = React.forwardRef<
  HTMLDivElement,
  WrfWebhookDeliveryStatusProps
>(function WrfWebhookDeliveryStatus({ deliveries, compact = false, sx }, ref) {
  if (deliveries.length === 0) {
    return null;
  }

  if (compact) {
    const counts: Record<WebhookState, number> = {
      pending: 0,
      delivered: 0,
      failed: 0,
      retrying: 0,
    };

    for (const entry of deliveries) {
      counts[entry.state] = (counts[entry.state] || 0) + 1;
    }

    const parts: string[] = [];
    if (counts.delivered > 0) parts.push(`${counts.delivered} delivered`);
    if (counts.retrying > 0) parts.push(`${counts.retrying} retrying`);
    if (counts.pending > 0) parts.push(`${counts.pending} pending`);
    if (counts.failed > 0) parts.push(`${counts.failed} failed`);

    return (
      <Box
        ref={ref}
        component="span"
        sx={[{ display: 'inline-flex' }, ...(Array.isArray(sx) ? sx : [sx])] as SxProps<Theme>}
      >
        <Typography variant="body2" color="text.secondary">
          {parts.join(', ')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      ref={ref}
      sx={[
        { display: 'flex', flexDirection: 'column', gap: 0.5 },
        ...(Array.isArray(sx) ? sx : [sx]),
      ] as SxProps<Theme>}
    >
      <List disablePadding dense>
        {deliveries.map((entry) => {
          const config = STATE_CONFIG[entry.state];

          const stateChip = (
            <Chip
              size="small"
              icon={config.icon}
              label={config.label}
              color={config.chipColor}
              variant="outlined"
              sx={{ fontWeight: 600, fontSize: '0.75rem' }}
            />
          );

          const chipWithTooltip =
            entry.state === 'failed' && entry.error ? (
              <Tooltip title={entry.error} arrow>
                {stateChip}
              </Tooltip>
            ) : (
              stateChip
            );

          return (
            <ListItem
              key={entry.id}
              disableGutters
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                py: 0.75,
              }}
            >
              <Typography variant="body2" sx={{ minWidth: 120, fontWeight: 500 }} noWrap>
                {entry.event}
              </Typography>

              {chipWithTooltip}

              <Typography
                variant="caption"
                sx={{ fontFamily: 'monospace', minWidth: 40, textAlign: 'center' }}
                color="text.secondary"
              >
                {entry.attempts}/{entry.maxAttempts}
              </Typography>

              {entry.lastAttemptAt && (
                <Typography variant="caption" color="text.secondary" noWrap>
                  {entry.lastAttemptAt}
                </Typography>
              )}

              {entry.state === 'retrying' && entry.nextRetryAt && (
                <Typography variant="caption" color="info.main" noWrap>
                  next: {entry.nextRetryAt}
                </Typography>
              )}
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
});
