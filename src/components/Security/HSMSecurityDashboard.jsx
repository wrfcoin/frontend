import React from 'react';
import { Alert, Box, Typography } from '@mui/material';

// The backend HSM signer was retired (owner ruling 2026-10-03, backend#1445).
// No HSM, key-management, compliance, multi-signature or audit-log route is
// served, so this page states that and shows no device, key or compliance data.
const HSMSecurityDashboard = () => (
  <Box sx={{ p: 3 }} data-testid="hsm-retired">
    <Typography variant="h5" gutterBottom>HSM Security</Typography>
    <Alert severity="info">
      The hardware security module service has been retired. Hardware key
      management, compliance and multi-signature status are not available.
    </Alert>
  </Box>
);

export default HSMSecurityDashboard;
