import React from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import AddressLookup from '../components/explorer/AddressLookup';
import { palette } from '../components/DesignSystem/tokens';

/**
 * /explore/address/:address: one address on the public site, where the wallet links its own
 * address (VITE_EXPLORER_URL=self). Same public read as the /explore address box (balance and
 * earned total, GET /api/public/balance/:address). An address's transaction list stays private to
 * its wallet: it is shown on the Wallet page after sign-in, not here.
 */
export default function ExploreAddressPage() {
  const { address = '' } = useParams();
  return (
    <Box sx={{ maxWidth: 880, mx: 'auto', px: { xs: 2, sm: 3 }, py: 3 }} data-testid="explore-address-page">
      <Typography component="h1" sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' }, fontWeight: 700, m: 0, mb: 2, color: palette.text.primary }}>
        Address
      </Typography>
      {/* key: a new address in the path starts a fresh lookup. */}
      <AddressLookup key={address} initialAddress={address} />
      <Typography sx={{ fontSize: '0.8125rem', color: palette.text.muted }}>
        The list of an address&apos;s transactions is shown only to its own wallet, on the Wallet page.
        Recent blocks are on the <RouterLink to="/explore">explorer</RouterLink>.
      </Typography>
    </Box>
  );
}
