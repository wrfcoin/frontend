import React from 'react';
import { Alert, Box, Link, Typography } from '@mui/material';
import { Link as RouterLink, Navigate, useSearchParams } from 'react-router';
import { normalizeTxHash } from '../../services/publicTransaction';
import { normalizeLookupAddress } from '../../services/publicAddressBalance';

const BLOCK_HEIGHT = /^\d+$/;

/**
 * Public search: a transaction hash opens /explore/tx/:hash and an address opens
 * /explore/address/:address. Those pages do the read-only lookups; this page only routes.
 */
export default function PublicReadOnlySearch() {
  const [params] = useSearchParams();
  const query = (params.get('q') ?? '').trim();
  const txHash = normalizeTxHash(query);
  const address = normalizeLookupAddress(query);
  const isBlockHeight = BLOCK_HEIGHT.test(query);

  if (txHash) return <Navigate to={`/explore/tx/${txHash}`} replace />;
  if (address) return <Navigate to={`/explore/address/${address}`} replace />;

  return (
    <Box sx={{ p: 3 }} data-testid="public-readonly-search">
      <Typography variant="h4" component="h1" fontWeight={700}>Search the testnet</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Search by 64-character transaction hash or by address (0x or wrf followed by 40 hex characters).
      </Typography>
      {!query && <Alert severity="info">Enter a transaction hash or an address in the search box.</Alert>}
      {isBlockHeight && (
        <Alert severity="info">
          Looking up a single block is not available on the public site. Recent blocks are listed in
          the{' '}
          <Link component={RouterLink} to="/explore">
            Block Explorer
          </Link>
          .
        </Alert>
      )}
      {query && !isBlockHeight && (
        <Alert severity="info">That query is not a supported public identifier.</Alert>
      )}
    </Box>
  );
}
