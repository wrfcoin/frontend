import React from 'react';
import { Alert, AlertTitle, Box, Typography } from '@mui/material';
import { flagSentence, type StationSiteCheckView } from '../../utils/stationSiteCheck';

/**
 * "Has this station moved?" (Epic 8). A private note to the wallet that owns the station, shown
 * only when the backend raised a flag. It asks; it does not accuse. Nobody else sees it and it
 * changes nothing about rewards.
 */

export default function StationSiteCheckCard({ view }: { view: Extract<StationSiteCheckView, { status: 'ok' }> }) {
  if (view.flags.length === 0) return null;
  return (
    <Alert severity="info" data-testid="station-site-check">
      <AlertTitle>Has this station moved?</AlertTitle>
      <Typography variant="body2" sx={{ mb: 1 }}>
        In the last few days this station&apos;s readings have looked like a different spot.
      </Typography>
      <Box component="ul" sx={{ pl: 2.5, my: 0 }}>
        {view.flags.map(flag => (
          <li key={flag.kind} data-testid={`station-site-check-${flag.kind}`}>
            <Typography variant="body2">{flagSentence(flag, view.referenceStation)}</Typography>
          </li>
        ))}
      </Box>
      <Typography variant="body2" sx={{ mt: 1 }}>
        If you moved it, check that its registered location is still right. If you only changed or recalibrated a
        sensor, or moved it into sun or shade, there is nothing to do.
      </Typography>
      <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
        Shown only to you. It is a hint from comparing your readings with National Weather Service station{' '}
        {view.referenceStation}, and it does not change rewards.
      </Typography>
    </Alert>
  );
}
