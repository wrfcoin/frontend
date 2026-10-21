import React from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { useCapabilities } from '../../hooks/useCapabilities';
import WrfBadge from '../ui/WrfBadge';
import { capabilityReasonLabel } from '../../lib/capabilityReasons';

const signals = [
  { key: 'l2Prover', label: 'L2 Prover' },
  { key: 'l2Verifier', label: 'L2 Verifier' },
  { key: 'l1Finality', label: 'L1 Finality' },
] as const;

/** Capability evidence is independent of the illustrative node layout. */
const L2ReadinessPanel: React.FC = () => {
  const { capabilities, loading, error } = useCapabilities();
  return (
    <Box data-testid="l2-readiness" sx={{ p: 2 }}>
      <Typography variant="h6">L2 readiness</Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
        {signals.map(signal => {
          const entry = capabilities?.features?.[signal.key];
          const reported = !loading && !error ? entry : undefined;
          const label = loading ? 'checking' : error ? 'not verified' : reported?.status ?? 'not reported';
          const status = loading ? 'syncing' : reported?.status === 'operational' ? 'online'
            : reported?.status === 'degraded' ? 'degraded'
              : reported?.status === 'unavailable' ? 'offline' : 'pending';
          return (
            <Tooltip key={signal.key} title={capabilityReasonLabel(reported?.reasonCode)} arrow>
              <Box sx={{ display: 'inline-flex' }}>
                <WrfBadge status={status} label={`${signal.label}: ${label}`} size="sm" />
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
};

export default L2ReadinessPanel;
