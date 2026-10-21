import React, { useEffect, useState } from 'react';
import { Alert, Box, CircularProgress, Link, Typography } from '@mui/material';
import { Link as RouterLink, useSearchParams } from 'react-router';
import { publicReadonlyApi } from '../../config/publicReadonlyApi';

const BLOCK_HEIGHT = /^\d+$/;

function endpointFor(query: string): string | null {
  if (/^(?:0x)?[0-9a-fA-F]{64}$/.test(query)) {
    return publicReadonlyApi.transaction(query);
  }
  return null;
}

type Failure = 'unavailable' | 'not-found' | 'error';

// 501 is the backend's honest "no core4 API for this yet"; only a 404 means
// the testnet looked and found nothing.
function failureFor(status: number): Failure {
  if (status === 501) return 'unavailable';
  if (status === 404) return 'not-found';
  return 'error';
}

const FAILURE_TEXT: Record<Failure, string> = {
  unavailable: 'Transaction lookup is not available on this testnet yet.',
  'not-found': 'No transaction with that hash was found on the testnet.',
  error: 'The testnet API did not answer. Try again later.',
};

export default function PublicReadOnlySearch() {
  const [params] = useSearchParams();
  const query = (params.get('q') ?? '').trim();
  const endpoint = endpointFor(query);
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const isBlockHeight = BLOCK_HEIGHT.test(query);

  useEffect(() => {
    setResult(null);
    setFailure(null);
    if (!endpoint) return;
    const controller = new globalThis.AbortController();
    setLoading(true);
    fetch(endpoint, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) {
          setFailure(failureFor(response.status));
          return;
        }
        setResult(await response.json());
      })
      .catch(requestError => {
        if (requestError?.name !== 'AbortError') setFailure('error');
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [endpoint]);

  return (
    <Box sx={{ p: 3 }} data-testid="public-readonly-search">
      <Typography variant="h4" fontWeight={700}>Search the testnet</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Search by 64-character transaction hash. This page performs read-only chain queries.
      </Typography>
      {!query && <Alert severity="info">Enter a transaction hash in the search box.</Alert>}
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
      {query && !endpoint && !isBlockHeight && (
        <Alert severity="info">That query is not a supported public identifier.</Alert>
      )}
      {loading && <CircularProgress aria-label="Searching" />}
      {failure && <Alert severity="warning">{FAILURE_TEXT[failure]}</Alert>}
      {result !== null && (
        <Box component="pre" sx={{ p: 2, overflow: 'auto', bgcolor: 'background.paper' }}>
          {JSON.stringify(result, null, 2)}
        </Box>
      )}
    </Box>
  );
}
