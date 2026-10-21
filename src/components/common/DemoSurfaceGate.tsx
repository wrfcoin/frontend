// frontend#324 (and the rest of the #300 Phase 2 rollout) — the one gate
// every fabricated-but-illustrative panel goes through.
//
// Default build (`FEATURES.demoSurfaces` off): render the existing honest
// not-live pattern and nothing else; the sample component is never mounted,
// so its generators never run. Demo build (`VITE_ENABLE_DEMO_SURFACES=true`):
// render the sample beneath a "Sample data" chip and an explanatory line.
//
// Deliberately NOT tied to `useCapabilitiesContext()`: the panels using this
// have no capability entry of their own (validators, topology, execution
// traces, bridges) and their parent features are seeded `operational` because
// a sibling route is mounted, so a capability check could not distinguish
// them. `features.ts` reads `import.meta.env` at module scope — tests mock it.
import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import FEATURES from '../../config/features';
import PublicViewerNotice from './PublicViewerNotice';

export interface DemoSurfaceGateProps {
  /** Short, specific not-live title, e.g. "Validator set is not live on the testnet yet". */
  title: string;
  /** Why there is no real source yet (one or two sentences). */
  description: string;
  /** Stable id for tests: `<id>-not-live` and `<id>-sample-badge`. */
  testId: string;
  /** Rendered in both states (e.g. a Back button) so the user is never stranded. */
  action?: React.ReactNode;
  /** The illustrative sample. Mounted only when demo surfaces are on. */
  children: React.ReactNode;
}

export const SAMPLE_BADGE_SX = {
  bgcolor: 'rgba(245, 158, 11, 0.16)',
  color: '#F59E0B',
  fontWeight: 600,
  height: 22,
} as const;

const DemoSurfaceGate: React.FC<DemoSurfaceGateProps> = ({ title, description, testId, action, children }) => {
  if (!FEATURES.demoSurfaces) {
    return (
      <Box data-testid={`${testId}-not-live`} sx={{ p: 2 }}>
        <PublicViewerNotice reason="not-live" title={title} description={description} />
        {action ? <Box sx={{ mt: 2 }}>{action}</Box> : null}
      </Box>
    );
  }

  return (
    <Box data-testid={`${testId}-sample`}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, pt: 2, flexWrap: 'wrap' }}>
        <Chip label="Sample data" size="small" data-testid={`${testId}-sample-badge`} sx={SAMPLE_BADGE_SX} />
        <Typography variant="caption" color="text.secondary">
          Illustrative — shown because demo surfaces are on. {description}
        </Typography>
        {action ? <Box sx={{ ml: 'auto' }}>{action}</Box> : null}
      </Box>
      {children}
    </Box>
  );
};

export default DemoSurfaceGate;
