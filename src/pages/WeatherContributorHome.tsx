import React, { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  LinearProgress,
  Button,
  Divider,
  Skeleton,
} from '@mui/material';
import {
  Cloud,
  TrendingUp,
  Upload,
  Map,
  BarChart3,
  Activity,
  Wifi,
  Award,
  ArrowRight,
  Radio,
} from 'lucide-react';

import {
  useWeatherStationSnapshots,
  useWeatherStations,
} from '../hooks/api/useWeatherQueries';
import {
  isAuthRequiredError,
  isBackendUnavailableError,
  useBackendHealth,
} from '../hooks/api/useBackendHealth';
import {
  averageDefined,
  buildWeatherStationViewModel,
  stationStatusPresentation,
  sumDefined,
} from '../lib/weatherViewModels';
import { formatExactAmount } from '../services/apiClient/amountPrecision';
import BackendUnavailableBanner from '../components/RealTime/BackendUnavailableBanner';
import PublicViewerNotice from '../components/common/PublicViewerNotice';
import { blockchainAPI } from '../services/api';

/**
 * Live network strip fed by GET /api/blockchain/status — the one chain-status
 * read the public edge admits (infra#924). Renders nothing on failure rather
 * than an error: this is a bonus honesty signal on the landing page, not a
 * blocking data dependency (sonnet-r1 stage-1 guidance).
 */
function NetworkStatusStrip() {
  const { data, isLoading } = useQuery({
    queryKey: ['public', 'blockchain-status'],
    queryFn: () => blockchainAPI.getInfo(),
    staleTime: 15_000,
    retry: 1,
  });

  if (isLoading || !data || data.blockHeight == null) {
    return null;
  }

  return (
    <Chip
      icon={<Radio size={14} />}
      label={`Testnet live — block ${data.blockHeight.toLocaleString()}`}
      size="small"
      color="success"
      variant="outlined"
      sx={{ mb: 2 }}
    />
  );
}

const statusColor = (status: string) => stationStatusPresentation(status).color;

const qualityColor = (score: number) => {
  if (score >= 90) return '#4caf50';
  if (score >= 75) return '#ff9800';
  return '#f44336';
};

const LoadingGrid = () => (
  <Grid container spacing={2} sx={{ mb: 4 }}>
    {[0, 1, 2, 3].map((index) => (
      <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
        <Paper sx={{ p: 2 }}>
          <Skeleton variant="text" width="50%" />
          <Skeleton variant="text" width="35%" height={42} />
          <Skeleton variant="text" width="70%" />
        </Paper>
      </Grid>
    ))}
  </Grid>
);

const pageShellSx = { maxWidth: 1200, mx: 'auto', p: 3 };

export default function WeatherContributorHome() {
  const navigate = useNavigate();
  const backendHealthQuery = useBackendHealth();
  const stationsQuery = useWeatherStations();
  const snapshotsQuery = useWeatherStationSnapshots(stationsQuery.data);

  const stations = useMemo(() => {
    const baseSnapshots =
      snapshotsQuery.data ??
      (stationsQuery.data ?? []).map((station) => ({
        station,
        observations: [],
        quality: null,
        earnings: null,
        submissions: [],
      }));

    return baseSnapshots.map(buildWeatherStationViewModel);
  }, [snapshotsQuery.data, stationsQuery.data]);

  const onlineCount = stations.filter((station) => station.status === 'online').length;
  const overallQuality = averageDefined(stations.map((station) => station.quality)) ?? 0;
  const validationRate = averageDefined(stations.map((station) => station.validationRate)) ?? 0;
  const todayEarnings = sumDefined(stations.map((station) => station.earningsToday));
  const weekEarnings = sumDefined(stations.map((station) => station.earningsThisWeek));
  const lifetimeEarnings = sumDefined(stations.map((station) => station.earningsAllTime));
  const freshestStation = stations
    .filter((station) => station.temperatureF != null)
    .sort(
      (left, right) =>
        new Date(right.lastUpdatedAt ?? 0).getTime() - new Date(left.lastUpdatedAt ?? 0).getTime(),
    )[0];
  const dataError = stationsQuery.error || snapshotsQuery.error;
  const healthError = backendHealthQuery.error;
  // Real outage (network down, timeout, 5xx) vs. the edge simply not
  // admitting these paths yet (a 404) are different situations for an
  // anonymous public visitor. Only the former is a genuine backend problem —
  // the dev-facing BackendUnavailableBanner (docker compose ps / localhost
  // instructions) is for that case only.
  const isRealOutage =
    (backendHealthQuery.isError && isBackendUnavailableError(healthError)) ||
    (Boolean(dataError) && isBackendUnavailableError(dataError));
  // frontend#299: an unauthenticated visitor used to see the raw backend
  // string ("Bearer Token Required") here. A 401/403 means "sign in", so it
  // gets the sign-in notice with the real next action, never the error text.
  const isAuthRequired =
    !isRealOutage &&
    ((stationsQuery.isError && isAuthRequiredError(stationsQuery.error)) ||
      (snapshotsQuery.isError && isAuthRequiredError(snapshotsQuery.error)));
  const isEdgeNotAdmitted =
    !isRealOutage &&
    !isAuthRequired &&
    (backendHealthQuery.isError || stationsQuery.isError || snapshotsQuery.isError);

  if (isRealOutage) {
    return (
      <Box sx={pageShellSx}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Weather Contributor Hub
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Live fleet status, quality, and station performance from the weather API.
        </Typography>
        <BackendUnavailableBanner
          error={healthError || dataError}
          sx={{ mb: 4 }}
        />
      </Box>
    );
  }

  if (isAuthRequired) {
    return (
      <Box sx={pageShellSx}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Weather Contributor Hub
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Live fleet status, quality, and station performance from the weather API.
        </Typography>
        <NetworkStatusStrip />
        <PublicViewerNotice
          reason="wallet"
          title="Sign in to see your station fleet"
          description="Station status, quality and earnings are tied to the wallet that registered the stations. Get started to connect a wallet or register your first station."
          sx={{ mb: 2 }}
        />
        <Button variant="contained" onClick={() => navigate('/onboarding')} data-testid="home-sign-in-cta">
          Get started
        </Button>
      </Box>
    );
  }

  if (isEdgeNotAdmitted) {
    return (
      <Box sx={pageShellSx}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Weather Contributor Hub
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Live fleet status, quality, and station performance from the weather API.
        </Typography>
        <NetworkStatusStrip />
        <PublicViewerNotice reason="not-live" sx={{ mb: 4 }} />
      </Box>
    );
  }

  return (
    <Box sx={pageShellSx}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Weather Contributor Hub
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Live fleet status, quality, and station performance from the weather API.
      </Typography>
      <NetworkStatusStrip />

      {(backendHealthQuery.isLoading || stationsQuery.isLoading || snapshotsQuery.isLoading) && <LoadingGrid />}

      {!stationsQuery.isLoading && stations.length === 0 && (
        <Alert severity="info" sx={{ mb: 4 }}>
          No stations connected yet. Register your first station to unlock live quality and earnings data.
        </Alert>
      )}

      {stations.length > 0 && (
        <>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Wifi size={24} color="#4caf50" />
                <Typography variant="h5" fontWeight={600} sx={{ mt: 1 }}>
                  {onlineCount}/{stations.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Stations Online
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <BarChart3 size={24} color={qualityColor(overallQuality)} />
                <Typography variant="h5" fontWeight={600} sx={{ mt: 1 }}>
                  {overallQuality.toFixed(0)}/100
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average Quality
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <TrendingUp size={24} color="#2196f3" />
                <Typography variant="h5" fontWeight={600} sx={{ mt: 1 }}>
                  {formatExactAmount(todayEarnings, 2)} WRF
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Earned Today
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Activity size={24} color="#9c27b0" />
                <Typography variant="h5" fontWeight={600} sx={{ mt: 1 }}>
                  {validationRate.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Submission Success
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight={600}>
                    <Cloud size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                    Station Fleet
                  </Typography>
                  <Button size="small" onClick={() => navigate('/fleet')} endIcon={<ArrowRight size={16} />}>
                    Manage Fleet
                  </Button>
                </Box>

                {stations.map((station) => (
                  <Box
                    key={station.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      py: 1.5,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                    onClick={() => navigate(`/weather/station/${encodeURIComponent(station.id)}`)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          bgcolor: statusColor(station.status),
                        }}
                      />
                      <Box>
                        <Typography variant="body1" fontWeight={500}>
                          {station.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Last: {station.lastUpdateLabel}
                          {station.location ? ` • ${station.location}` : ''}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Chip
                        label={station.quality == null ? '--' : Math.round(station.quality)}
                        size="small"
                        sx={{
                          bgcolor: qualityColor(station.quality ?? 0),
                          color: '#fff',
                          fontWeight: 600,
                        }}
                      />
                      <Chip label={stationStatusPresentation(station.status).label} size="small" variant="outlined" />
                    </Box>
                  </Box>
                ))}

                <Button
                  fullWidth
                  variant="outlined"
                  sx={{ mt: 2 }}
                  onClick={() => navigate('/weather/onboarding')}
                >
                  + Register New Station
                </Button>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight={600}>
                    <TrendingUp size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                    Earnings Snapshot
                  </Typography>
                  <Button size="small" onClick={() => navigate('/earnings')} endIcon={<ArrowRight size={16} />}>
                    Details
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    This week
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {formatExactAmount(weekEarnings, 2)} WRF
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Lifetime total
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {formatExactAmount(lifetimeEarnings, 2)} WRF
                  </Typography>
                </Box>
                <Divider sx={{ my: 1.5 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Freshest sensor
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {freshestStation
                      ? `${freshestStation.temperatureF?.toFixed(1) ?? '--'}°F`
                      : 'No live readings'}
                  </Typography>
                </Box>
              </Paper>

              <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight={600}>
                    <BarChart3 size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                    Data Quality
                  </Typography>
                  <Button size="small" onClick={() => navigate('/quality')} endIcon={<ArrowRight size={16} />}>
                    Dashboard
                  </Button>
                </Box>
                <Box sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">Average score</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {overallQuality.toFixed(0)}/100
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={overallQuality}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'grey.800',
                      '& .MuiLinearProgress-bar': { bgcolor: qualityColor(overallQuality) },
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Validation rate
                  </Typography>
                  <Chip
                    label={`${validationRate.toFixed(1)}%`}
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                </Box>
              </Paper>

              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Quick Actions
                </Typography>
                <Grid container spacing={1}>
                  <Grid size={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      startIcon={<Upload size={16} />}
                      onClick={() => navigate('/data/upload')}
                      sx={{ justifyContent: 'flex-start', py: 1 }}
                    >
                      Upload Data
                    </Button>
                  </Grid>
                  <Grid size={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      startIcon={<Map size={16} />}
                      onClick={() => navigate('/map')}
                      sx={{ justifyContent: 'flex-start', py: 1 }}
                    >
                      Network Map
                    </Button>
                  </Grid>
                  <Grid size={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      startIcon={<Award size={16} />}
                      onClick={() => navigate('/weather/dashboard')}
                      sx={{ justifyContent: 'flex-start', py: 1 }}
                    >
                      Full Dashboard
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
