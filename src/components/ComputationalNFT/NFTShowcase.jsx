/**
 * NFTShowcase — computational NFT landing surface.
 *
 * frontend#293: this page used to present three invented case studies
 * ("Miami Climate Risk Assessment", "Arizona Solar Farm Carbon Credits",
 * "Singapore Urban Air Quality") attributed to real third-party networks the
 * platform does not integrate with, plus platform-wide stats (89,562 IoT
 * devices, 167 countries, 50,000 TPS…) that no backend produces. Following
 * the Phase 1 direction on frontend#300 (wire real data first, gate second,
 * label last):
 *
 *  - The "Featured Computational NFTs" section now lists REAL NFTs from
 *    GET /api/nft (backend nft-routes.js → core4 /nft/list), with an honest
 *    empty state when none are minted and the not-live state when the API
 *    is unreachable.
 *  - The only platform-wide number shown is the real minted count from the
 *    same response's pagination.total.
 *  - The invented case studies survive only under the demo-surface policy
 *    (FEATURES.demoSurfaces, default off), beneath a banner, each card
 *    labelled "Illustrative example", with their "data sources" explicitly
 *    marked as not integrated. The animated "creation demo" is a sample
 *    walkthrough in that mode only.
 */

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Paper,
} from '@mui/material';
import {
  Verified as VerifiedIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import FEATURES from '../../config/features';
import PublicViewerNotice from '../common/PublicViewerNotice';
import { fetchNftListPage } from '../../services/nftApi';
import { getAuthToken, subscribeAuthToken } from '../../services/authTokenStore';

// ---------------------------------------------------------------------------
// Sample content (demo-surface policy only — see header)
// ---------------------------------------------------------------------------

const DEMO_STEPS = [
  'Data Collection',
  'Computational Analysis',
  'NFT Generation',
  'Blockchain Recording',
  'Market Validation',
];

const SAMPLE_CASE_STUDIES = [
  {
    id: 'sample-climate-analysis',
    title: 'Coastal Climate Risk Assessment',
    description: 'Illustrative: hurricane-risk analysis over a multi-year weather archive',
    dataPoints: 450000,
    computeTime: '12.3s',
    accuracy: 99.2,
    category: 'Risk Assessment',
    networks: ['TTN', 'FOAM', 'Weather Underground'],
  },
  {
    id: 'sample-carbon-credits',
    title: 'Solar Farm Carbon Credits',
    description: 'Illustrative: carbon-reduction accounting for a utility-scale installation',
    dataPoints: 876543,
    computeTime: '8.7s',
    accuracy: 98.9,
    category: 'Carbon Credits',
    networks: ['Helium', 'Bacalhau', 'Energy Web'],
  },
  {
    id: 'sample-urban-air',
    title: 'Urban Air Quality',
    description: 'Illustrative: air-quality analysis from a smart-city sensor grid',
    dataPoints: 1200000,
    computeTime: '15.1s',
    accuracy: 99.5,
    category: 'Smart City',
    networks: ['SenseCAP', 'AWS IoT', 'Government APIs'],
  },
];

const SAMPLE_BADGE_SX = { height: 20, fontSize: 10, bgcolor: 'rgba(148,163,184,0.25)' };

const nftTitle = (nft) => nft.name || nft.title || nft.metadata?.name || `NFT #${nft.id ?? nft.tokenId ?? '?'}`;
const nftDescription = (nft) => nft.description || nft.metadata?.description || '';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const NFTShowcase = () => {
  const showSample = FEATURES.demoSurfaces;

  const [live, setLive] = useState({ status: 'loading', nfts: [], total: 0 });
  const [currentDemo, setCurrentDemo] = useState(null);
  const [demoProgress, setDemoProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // frontend#394: GET /api/nft through the raw-envelope helper. ApiClient
  // unwrapped `{ success, data, pagination }` to the bare list, so this read
  // `res.data` / `res.pagination.total` from nothing and always showed 0. The
  // route applies requireAuth, so the listing follows the session: no session
  // means no request, and a response for an earlier token is dropped.
  const token = useSyncExternalStore(subscribeAuthToken, getAuthToken, getAuthToken);

  useEffect(() => {
    if (!token) {
      setLive({ status: 'signed-out', nfts: [], total: 0 });
      return undefined;
    }
    let cancelled = false;
    setLive({ status: 'loading', nfts: [], total: 0 });
    (async () => {
      try {
        const page = await fetchNftListPage(6, token);
        if (cancelled) return;
        setLive({ status: 'ready', nfts: page.nfts, total: page.total });
      } catch {
        if (!cancelled) setLive({ status: 'unavailable', nfts: [], total: 0 });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    let interval;
    if (isPlaying && currentDemo) {
      interval = setInterval(() => {
        setDemoProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 100;
          }
          return prev + 2;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentDemo]);

  const startDemo = (id) => {
    setCurrentDemo(id);
    setDemoProgress(0);
    setIsPlaying(true);
  };

  const activeStep = Math.min(DEMO_STEPS.length - 1, Math.floor(demoProgress / 20));

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {showSample && (
        <Paper
          data-testid="nft-sample-banner"
          sx={{ bgcolor: '#F59E0B22', border: '1px solid #F59E0B', borderRadius: 2, p: 2, mb: 3 }}
        >
          <Typography variant="body1" sx={{ fontWeight: 700 }}>
            Simulated preview — the example case studies below are illustrative
          </Typography>
          <Typography variant="body2" color="text.secondary">
            They are not customer projects and their listed data sources are not integrated with this
            platform. Only the &ldquo;Minted on the testnet&rdquo; section reflects real chain state.
          </Typography>
        </Paper>
      )}

      {/* Hero */}
      <Box textAlign="center" mb={6}>
        <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#1a237e' }}>
          Computational NFTs
        </Typography>
        <Typography variant="h5" color="text.secondary" mb={4}>
          Transform Real Environmental Data into Valuable Digital Assets
        </Typography>

        {/* The one real platform number: minted count from GET /api/nft */}
        <Card sx={{ display: 'inline-block', px: 4, py: 2 }} data-testid="nft-live-count">
          <Typography variant="body2" color="text.secondary">
            Computational NFTs minted on the testnet
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            {live.status === 'ready' ? live.total.toLocaleString() : live.status === 'loading' ? '…' : '—'}
          </Typography>
          {live.status === 'signed-out' && (
            <Typography variant="caption" color="text.secondary">
              Sign in to see minted NFTs
            </Typography>
          )}
          {live.status === 'unavailable' && (
            <Typography variant="caption" color="text.secondary">
              NFT service not reachable from this build
            </Typography>
          )}
        </Card>
      </Box>

      {/* Minted on the testnet — real data */}
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Minted on the testnet
      </Typography>
      {live.status === 'loading' && <LinearProgress sx={{ mb: 4 }} />}
      {live.status === 'signed-out' && (
        <Box mb={6}>
          <PublicViewerNotice
            reason="wallet"
            title="Sign in to see minted NFTs"
            description="The NFT service answers signed-in sessions only."
          />
        </Box>
      )}
      {live.status === 'unavailable' && (
        <Box mb={6}>
          <PublicViewerNotice
            reason="not-live"
            title="NFT listing unavailable"
            description="The computational NFT service is not reachable from this build, so no minted NFTs can be shown."
          />
        </Box>
      )}
      {live.status === 'ready' && live.nfts.length === 0 && (
        <Box mb={6}>
          <PublicViewerNotice
            reason="not-live"
            title="No computational NFTs have been minted on the testnet yet"
            description="When contributors mint computational NFTs from real weather data, they will be listed here."
          />
        </Box>
      )}
      {live.status === 'ready' && live.nfts.length > 0 && (
        <Grid container spacing={4} mb={6} data-testid="nft-live-list">
          {live.nfts.map((nft, i) => (
            <Grid item xs={12} md={4} key={nft.id ?? nft.tokenId ?? i}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    {nftTitle(nft)}
                  </Typography>
                  {nftDescription(nft) && (
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      {nftDescription(nft)}
                    </Typography>
                  )}
                  {nft.category && <Chip label={nft.category} size="small" sx={{ mr: 1 }} />}
                  {nft.owner && (
                    <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                      Owner: {String(nft.owner).slice(0, 10)}…
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Sample case studies — demo-surface policy only */}
      {showSample && (
        <>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
            Example case studies
            <Chip label="Illustrative" size="small" sx={{ ...SAMPLE_BADGE_SX, ml: 2 }} />
          </Typography>
          <Grid container spacing={4} mb={6}>
            {SAMPLE_CASE_STUDIES.map((nft) => (
              <Grid item xs={12} md={4} key={nft.id}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {nft.title}
                      </Typography>
                      <Chip
                        label="Illustrative example"
                        size="small"
                        data-testid="nft-sample-card-badge"
                        sx={SAMPLE_BADGE_SX}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      {nft.description}
                    </Typography>
                    <Chip label={nft.category} size="small" sx={{ mb: 2 }} />
                    <Grid container spacing={1}>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary">Data points</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{nft.dataPoints.toLocaleString()}</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary">Compute time</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{nft.computeTime}</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary">Accuracy</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{nft.accuracy}%</Typography>
                      </Grid>
                    </Grid>
                    <Typography variant="caption" color="text.secondary" display="block" mt={2} mb={1}>
                      Illustrative sources (not integrated): {nft.networks.join(', ')}
                    </Typography>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<PlayArrowIcon />}
                      onClick={() => startDemo(nft.id)}
                      sx={{ mt: 1 }}
                    >
                      Run sample walkthrough
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Dialog open={Boolean(currentDemo)} onClose={() => setCurrentDemo(null)} maxWidth="md" fullWidth>
            <DialogTitle>
              Sample walkthrough
              <Chip label="Illustrative" size="small" sx={{ ...SAMPLE_BADGE_SX, ml: 2 }} />
            </DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" mb={2}>
                This animation illustrates the intended creation flow. It does not collect data, run
                computation, or record anything on chain.
              </Typography>
              <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
                {DEMO_STEPS.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
              <LinearProgress variant="determinate" value={demoProgress} />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setIsPlaying((p) => !p)}>{isPlaying ? 'Pause' : 'Resume'}</Button>
              <Button onClick={() => setCurrentDemo(null)}>Close</Button>
            </DialogActions>
          </Dialog>
        </>
      )}

      {/* Call to action — no fabricated claims, no dead buttons */}
      <Card sx={{ textAlign: 'center', py: 6 }}>
        <CardContent>
          <VerifiedIcon sx={{ color: '#4CAF50', fontSize: 40, mb: 1 }} />
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
            Computational NFTs are minted from verified weather submissions
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Minting is driven by real contributions recorded on the WRFCoin chain. There is no
            self-service creation flow on the testnet yet.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default NFTShowcase;
