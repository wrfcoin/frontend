/**
 * Enhanced Integrations Hub Page
 * Accessible via /integrations-enhanced route
 */
import React from 'react';
import { Container, Box } from '@mui/material';
import IntegrationsHubEnhanced from '../components/Integrations/IntegrationsHubEnhanced';

const IntegrationsEnhancedPage = () => {
  return (
    <Container maxWidth={false} sx={{ py: 3 }}>
      <Box sx={{ minHeight: '80vh' }}>
        <IntegrationsHubEnhanced />
      </Box>
    </Container>
  );
};

export default IntegrationsEnhancedPage;
