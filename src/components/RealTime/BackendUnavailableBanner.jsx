import React from 'react';
import { Alert, AlertTitle, Box, Typography } from '@mui/material';
import { WifiOff } from 'lucide-react';
import { getBackendUnavailableMessage } from '../../hooks/api/useBackendHealth';

const commandBlockSx = {
  mt: 1.5,
  px: 1.5,
  py: 1.25,
  borderRadius: 1,
  bgcolor: 'rgba(15, 23, 42, 0.72)',
  border: '1px solid rgba(248, 250, 252, 0.08)',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: '0.8125rem',
  whiteSpace: 'pre-wrap',
};

export default function BackendUnavailableBanner({
  error,
  title = 'Cannot connect to WRFCoin backend (localhost:4001).',
  sx,
}) {
  const detail = getBackendUnavailableMessage(error);

  return (
    <Alert
      severity="error"
      icon={<WifiOff size={18} />}
      sx={{
        alignItems: 'flex-start',
        bgcolor: 'rgba(239, 68, 68, 0.12)',
        color: '#FECACA',
        border: '1px solid rgba(239, 68, 68, 0.28)',
        '& .MuiAlert-message': {
          width: '100%',
        },
        ...sx,
      }}
    >
      <AlertTitle sx={{ fontWeight: 700 }}>{title}</AlertTitle>
      <Typography variant="body2" sx={{ color: 'inherit' }}>
        Is the backend running?
      </Typography>
      <Box component="pre" sx={commandBlockSx}>
        docker compose ps{'\n'}curl http://localhost:4001/health{'\n\n'}cd backend && npm run dev
      </Box>
      {detail ? (
        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'inherit', opacity: 0.85 }}>
          Last error: {detail}
        </Typography>
      ) : null}
    </Alert>
  );
}
