import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  Thermostat as TempIcon,
  Air as WindIcon,
  Compress as PressureIcon,
  Water as HumidityIcon,
  WbSunny as UVIcon,
  LocationOn as LocationIcon,
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Speed as QualityIcon,
} from '@mui/icons-material';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

import {
  useLatestObservations,
  useStationQuality,
  useSubmissionLog,
  useWeatherStations,
} from '../../hooks/api/useWeatherQueries';
import {
  useWeatherEarnings,
  useWeatherEarningsHistory,
} from '../../hooks/api/useEarningsQueries';
import {
  buildWeatherStationViewModel,
  filterObservationsByRange,
  stationStatusPresentation,
} from '../../lib/weatherViewModels';
import FirstEarnCelebration from './FirstEarnCelebration';
import StationOwnershipCard from '../station/StationOwnershipCard';
import { useStationOwner } from '../../hooks/api/useStationOwnerQueries';
import { formatBaseUnitsToWrf } from '../../services/apiClient/number';
import { buildStationReportEarningsChartData } from './stationReportPrecision';
import { FEATURES } from '../../config/features';
import {
  isPublicStationProjection,
  projectStationDetail,
} from '../../utils/publicStationProjection';
import { useIsDarkTheme } from '../../theme/ThemeProvider';
import { stationChartOptions } from './stationChartTheme';

// Same inputs the public map projects with (EnhancedWeatherMap), read at
// render like the map does.
const stationProjectionFlags = () => ({
  publicReadonly: FEATURES.publicReadonly ? 'true' : undefined,
  fullStudio: FEATURES.fullStudio ? 'true' : undefined,
});

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

type TimeRange = '24h' | '7d' | '30d' | '1y' | 'all';

// Surfaces, text and borders follow the body theme through the design-system variables (dark values are
// the fallbacks, so dark renders unchanged); the accents are icon colours and stay literal.
const palette = {
  bg: 'var(--wrf-ds-bg-primary, #0F172A)',
  card: 'var(--wrf-ds-bg-secondary, #1E293B)',
  inset: 'var(--wrf-ds-bg-inset, rgba(15, 23, 42, 0.5647))',
  text: 'var(--wrf-ds-text-primary, #F8FAFC)',
  textSecondary: 'var(--wrf-ds-text-secondary, #94A3B8)',
  primary: '#38BDF8',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  border: 'var(--wrf-ds-border, #334155)',
  borderSoft: 'var(--wrf-ds-border-soft, rgba(51, 65, 85, 0.4392))',
};

const formatValue = (
  value: string | number | null | undefined,
  digits = 1,
  suffix = '',
) => {
  if (value === null || value === undefined) return '--';
  if (typeof value === 'string') {
    return `${formatBaseUnitsToWrf(value, digits) ?? '--'}${suffix}`;
  }
  return Number.isFinite(value) ? `${value.toFixed(digits)}${suffix}` : '--';
};

// A positive rate below the display precision reads "< 0.0001 WRF/day", never "0.0000".
const RATE_DISPLAY_DIGITS = 4;
const formatRatePerDay = (baseUnits: string | null | undefined) => {
  if (baseUnits === null || baseUnits === undefined) return '--';
  const shown = formatBaseUnitsToWrf(baseUnits, RATE_DISPLAY_DIGITS);
  if (shown === null || shown === undefined) return '--';
  if (BigInt(baseUnits) > 0n && Number(shown.replace(/,/g, '')) === 0) return '< 0.0001 WRF/day';
  return `${shown} WRF/day`;
};

const filterByRange = <T extends { timestamp: string }>(rows: T[], range: TimeRange) => {
  if (range === 'all') {
    return [...rows].sort(
      (left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime(),
    );
  }

  const now = Date.now();
  const thresholds = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '1y': 365 * 24 * 60 * 60 * 1000,
  } as const;

  return rows
    .filter((row) => now - new Date(row.timestamp).getTime() <= thresholds[range])
    .sort((left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime());
};

const MetricCard = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <Card sx={{ bgcolor: palette.inset, border: `1px solid ${palette.border}` }}>
    <CardContent sx={{ p: 2.25 }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box sx={{ color: palette.primary }}>{icon}</Box>
        <Box>
          <Typography variant="body2" sx={{ color: palette.textSecondary }}>
            {label}
          </Typography>
          <Typography variant="h6" component="p" sx={{ color: palette.text, fontWeight: 700 }}>
            {value}
          </Typography>
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

/** Status chip text on the light card: the 700-800 shade of each status colour, which holds 4.5:1 on the tinted chip. */
const LIGHT_STATUS_TEXT: Record<string, string> = {
  '#22C55E': '#166534', '#F59E0B': '#92400E', '#94A3B8': '#475569', '#EAB308': '#854D0E', '#EF4444': '#991B1B',
};

const StationReportPage: React.FC = () => {
  const { stationId } = useParams();
  const isDark = useIsDarkTheme();
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');

  const stationsQuery = useWeatherStations();
  const station = useMemo(
    () => stationsQuery.data?.find((candidate) => candidate.id === stationId),
    [stationId, stationsQuery.data],
  );

  const publicProjection = isPublicStationProjection(stationProjectionFlags());
  // Per-station reads wait until the station list confirms the id, so an
  // unknown or mistyped id costs one list read, not a burst against the
  // public edge's 30/min station-read limiter.
  const knownStationId = station ? stationId : undefined;
  // The public edge never admits /api/stations/<id>/earnings (infra#983), and
  // backend station-detail-routes.ts answers it `unavailable` anyway, so the
  // public build does not ask.
  const earningsStationId = publicProjection ? undefined : knownStationId;
  const observationsQuery = useLatestObservations(knownStationId);
  const qualityQuery = useStationQuality(knownStationId);
  const submissionsQuery = useSubmissionLog(knownStationId);
  const earningsSummaryQuery = useWeatherEarnings(earningsStationId);
  const earningsHistoryQuery = useWeatherEarningsHistory(earningsStationId);
  // "My first WRF earned" is the owner's moment (frontend#387). The public
  // read-only build never asks; elsewhere only a backend-confirmed owner sees it.
  const stationOwner = useStationOwner(stationId, !publicProjection);
  const celebrationWallet = publicProjection ? null : stationOwner;

  const stationView = useMemo(() => {
    if (!station) return null;
    return projectStationDetail(
      buildWeatherStationViewModel({
        station,
        observations: observationsQuery.data ?? [],
        quality: qualityQuery.data ?? null,
        earnings: earningsSummaryQuery.data ?? null,
        submissions: submissionsQuery.data ?? [],
      }),
      stationProjectionFlags(),
    );
  }, [
    earningsSummaryQuery.data,
    observationsQuery.data,
    qualityQuery.data,
    station,
    submissionsQuery.data,
  ]);

  const filteredObservations = useMemo(
    () => filterObservationsByRange(observationsQuery.data ?? [], timeRange),
    [observationsQuery.data, timeRange],
  );
  // backend#1232: lifetime is the node-proven total for the reward address. 'station' means this
  // station alone holds that address; 'address' is a shared total and is labelled as such.
  const stationLifetime = earningsSummaryQuery.data?.lifetime ?? null;
  const stationRate = earningsSummaryQuery.data?.rate ?? null;
  const allTimeLabel = stationLifetime?.scope === 'address'
    ? (stationLifetime.stationsSharingAddress === null
      ? 'All time (shared address)'
      : `All time (shared address, ${stationLifetime.stationsSharingAddress} stations)`)
    : 'All time';
  const filteredEarnings = useMemo(
    () => filterByRange(earningsHistoryQuery.data ?? [], timeRange),
    [earningsHistoryQuery.data, timeRange],
  );

  // Missing data and an unsuccessful refresh are not a clean submission list.
  // Error takes precedence even when Query retains rows from an earlier read.
  const submissionStatus = submissionsQuery.isError
    ? 'Submission history is unavailable right now. Try again later.'
    : submissionsQuery.isPending
      ? 'Loading submission history…'
      : null;

  const anomalies = useMemo(
    () =>
      (submissionsQuery.data ?? []).filter(
        (entry) => !entry.success || (entry.qualityScore != null && entry.qualityScore < 70),
      ),
    [submissionsQuery.data],
  );

  const observationChartData = useMemo(
    () => ({
      labels: filteredObservations.map((entry) =>
        new Date(entry.timestamp).toLocaleString([], {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      ),
      datasets: [
        {
          label: 'Temperature (°F)',
          data: filteredObservations.map((entry) =>
            entry.temperatureC == null ? null : (entry.temperatureC * 9) / 5 + 32,
          ),
          borderColor: '#38BDF8',
          backgroundColor: 'rgba(56,189,248,0.16)',
          fill: true,
          tension: 0.3,
        },
        {
          label: 'Humidity (%)',
          data: filteredObservations.map((entry) => entry.humidityPct ?? null),
          borderColor: '#22C55E',
          backgroundColor: 'rgba(34,197,94,0.08)',
          fill: false,
          tension: 0.3,
        },
      ],
    }),
    [filteredObservations],
  );

  const earningsChartData = useMemo(
    () => {
      const chart = buildStationReportEarningsChartData(filteredEarnings);
      return {
        ...chart,
        datasets: [
          {
            label: 'Reward history (WRF)',
            data: chart.data,
            backgroundColor: 'rgba(56,189,248,0.45)',
            borderColor: '#38BDF8',
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      };
    },
    [filteredEarnings],
  );

  // Literal colours per theme: Chart.js paints on a canvas, which cannot read the `var()` strings
  // the rest of this page hands to CSS (see stationChartTheme.ts).
  const chartOptions = useMemo(() => stationChartOptions(isDark), [isDark]);

  if (!stationId) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Missing station ID.</Alert>
      </Box>
    );
  }

  if (stationsQuery.isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress aria-label="Loading station" />
      </Box>
    );
  }

  if (stationsQuery.isError) {
    // A failed list read is not evidence that the station does not exist.
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Station data is unavailable right now. Try again later.</Alert>
      </Box>
    );
  }

  if (!station || !stationView) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Station not found.</Alert>
      </Box>
    );
  }

  // Public grid values are shown at grid precision, not padded to look exact.
  const coordinateDecimals = publicProjection ? 1 : 4;

  return (
    <Box sx={{ bgcolor: palette.bg, minHeight: '100vh', p: 3 }}>
      {celebrationWallet && (
        <FirstEarnCelebration
          stationId={stationId}
          stationName={stationView.name}
          history={earningsHistoryQuery.data ?? []}
          walletAddress={celebrationWallet}
        />
      )}
      <Card sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="h5" component="h1" sx={{ color: palette.text, fontWeight: 800 }}>
                  {stationView.name}
                </Typography>
                <Chip
                  label={stationStatusPresentation(stationView.status).label}
                  size="small"
                  sx={{
                    bgcolor: `${stationStatusPresentation(stationView.status).color}1f`,
                    color: isDark
                      ? stationStatusPresentation(stationView.status).color
                      : (LIGHT_STATUS_TEXT[stationStatusPresentation(stationView.status).color] ?? stationStatusPresentation(stationView.status).color),
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                />
              </Stack>
              <Stack direction="row" spacing={3} flexWrap="wrap">
                {/* Owner ruling 07:15Z: the public build shows the name only. */}
                {!publicProjection && (
                  <Typography variant="body2" sx={{ color: palette.textSecondary, fontFamily: 'monospace' }}>
                    ID: {stationView.id}
                  </Typography>
                )}
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <LocationIcon sx={{ fontSize: 16, color: palette.textSecondary }} />
                  <Typography variant="body2" sx={{ color: palette.textSecondary }}>
                    {stationView.location ?? 'Location unavailable'}
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: palette.textSecondary }}>
                  Last update: {stationView.lastUpdateLabel}
                </Typography>
              </Stack>
            </Box>

            <Box sx={{ minWidth: 220 }}>
              <Typography variant="body2" sx={{ color: palette.textSecondary, mb: 1 }}>
                Coordinates
              </Typography>
              <Typography variant="body1" sx={{ color: palette.text, fontFamily: 'monospace', fontWeight: 600 }}>
                {stationView.latitude == null || stationView.longitude == null
                  ? 'Unavailable'
                  : `${stationView.latitude.toFixed(coordinateDecimals)}, ${stationView.longitude.toFixed(coordinateDecimals)}`}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(5, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        <MetricCard icon={<TempIcon />} label="Temperature" value={formatValue(stationView.temperatureF, 1, '°F')} />
        <MetricCard icon={<HumidityIcon />} label="Humidity" value={formatValue(stationView.humidity, 0, '%')} />
        <MetricCard icon={<PressureIcon />} label="Pressure" value={formatValue(stationView.pressure, 1, ' hPa')} />
        <MetricCard icon={<WindIcon />} label="Wind" value={formatValue(stationView.windSpeedMph, 1, ' mph')} />
        <MetricCard icon={<UVIcon />} label="UV Index" value={formatValue(stationView.uvIndex, 1)} />
      </Box>

      <Card sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <TrendingUpIcon sx={{ color: palette.primary }} />
              <Typography variant="h6" component="h2" sx={{ color: palette.text, fontWeight: 700 }}>
                Observation History
              </Typography>
            </Stack>
            <Select
              inputProps={{ 'aria-label': 'Observation history range' }}
              size="small"
              value={timeRange}
              onChange={(event) => setTimeRange(event.target.value as TimeRange)}
              sx={{
                minWidth: 100,
                color: palette.text,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: palette.border },
              }}
            >
              {['24h', '7d', '30d', '1y', 'all'].map((range) => (
                <MenuItem key={range} value={range}>
                  {range}
                </MenuItem>
              ))}
            </Select>
          </Stack>

          {observationsQuery.isPending ? (
            <Typography role="status" sx={{ color: palette.textSecondary }}>Loading observation history…</Typography>
          ) : filteredObservations.length > 0 && !observationsQuery.isError ? (
            <Box sx={{ height: 300 }}>
              <Line data={observationChartData} options={chartOptions} aria-label={`Observation history chart, ${timeRange}`} />
            </Box>
          ) : (
            observationsQuery.isError ? (
              <Alert severity="warning">Observation history is unavailable right now. Try again later.</Alert>
            ) : (
              <Alert severity="info">No observation history is available for this station yet.</Alert>
            )
          )}
        </CardContent>
      </Card>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3, mb: 3 }}>
        <Card sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <QualityIcon sx={{ color: palette.success }} />
              <Typography variant="h6" component="h2" sx={{ color: palette.text, fontWeight: 700 }}>
                Data Quality
              </Typography>
            </Stack>

            <Typography variant="h3" component="p" sx={{ color: palette.text, fontWeight: 800, mb: 0.5 }}>
              {stationView.quality == null ? '--' : stationView.quality.toFixed(0)}
            </Typography>
            <Typography variant="body2" sx={{ color: palette.textSecondary, mb: 2 }}>
              Overall quality score
            </Typography>

            {(qualityQuery.data?.dimensions ?? []).length > 0 && !qualityQuery.isError ? (
              <Stack spacing={1.5}>
                {qualityQuery.data?.dimensions.map((dimension) => (
                  <Box key={dimension.key}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.4 }}>
                      <Typography variant="caption" sx={{ color: palette.textSecondary }}>
                        {dimension.label}
                      </Typography>
                      <Typography variant="caption" sx={{ color: palette.text, fontWeight: 700 }}>
                        {dimension.score.toFixed(0)}
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      aria-label={dimension.label}
                      value={dimension.score}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: palette.borderSoft,
                        '& .MuiLinearProgress-bar': {
                          bgcolor: dimension.color || palette.primary,
                          borderRadius: 3,
                        },
                      }}
                    />
                  </Box>
                ))}
              </Stack>
            ) : (
              qualityQuery.isError ? (
                <Alert severity="warning">Quality data is unavailable right now. Try again later.</Alert>
              ) : (
                <Alert severity="info">Quality dimensions are not available for this station yet.</Alert>
              )
            )}

            <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${palette.border}` }}>
              <Typography variant="body2" sx={{ color: palette.textSecondary }}>
                Submission success rate
              </Typography>
              <Typography variant="h6" component="p" sx={{ color: palette.text, fontWeight: 700 }}>
                {submissionStatus ?? (stationView.validationRate == null
                  ? 'No submission history'
                  : `${stationView.validationRate.toFixed(1)}%`)}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <WarningIcon sx={{ color: palette.warning }} />
              <Typography variant="h6" component="h2" sx={{ color: palette.text, fontWeight: 700 }}>
                Submission Anomalies
              </Typography>
            </Stack>

            {submissionStatus ? (
              <Alert severity={submissionsQuery.isError ? 'warning' : 'info'}>{submissionStatus}</Alert>
            ) : anomalies.length > 0 ? (
              <TableContainer tabIndex={0} role="region" aria-label="Submission anomalies">
                <Table size="small">
                  {/* Head text comes from the theme's table-head token (slate-300 on the dark slate-700 head). */}
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ borderBottomColor: palette.border }}>Time</TableCell>
                      <TableCell sx={{ borderBottomColor: palette.border }}>Summary</TableCell>
                      <TableCell sx={{ borderBottomColor: palette.border }}>Quality</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {anomalies.slice(0, 8).map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell sx={{ color: palette.text, borderBottomColor: palette.border }}>
                          {new Date(entry.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell sx={{ color: palette.text, borderBottomColor: palette.border }}>
                          {entry.summary}
                        </TableCell>
                        <TableCell sx={{ color: palette.text, borderBottomColor: palette.border }}>
                          {entry.qualityScore == null ? '--' : entry.qualityScore.toFixed(0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="success">No low-quality or failed submissions were returned for this station.</Alert>
            )}
          </CardContent>
        </Card>
      </Box>

      {publicProjection && knownStationId && (
        <Card sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 3, color: palette.text }}>
          <CardContent sx={{ p: 3 }}>
            <StationOwnershipCard stationId={knownStationId} />
          </CardContent>
        </Card>
      )}

      <Card sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <TrophyIcon sx={{ color: palette.warning }} />
            <Typography variant="h6" component="h2" sx={{ color: palette.text, fontWeight: 700 }}>
              Earnings
            </Typography>
          </Stack>

          {publicProjection ? (
            <Alert severity="info">
              Per-station earnings are not published on the public testnet site.
            </Alert>
          ) : (
            <>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                  gap: 2,
                  mb: 3,
                }}
              >
                <MetricCard icon={<TrophyIcon />} label="Today" value={formatValue(earningsSummaryQuery.data?.today, 2, ' WRF')} />
                <MetricCard icon={<TrendingUpIcon />} label="This week" value={formatValue(earningsSummaryQuery.data?.thisWeek, 2, ' WRF')} />
                <MetricCard icon={<EmojiEventsIcon />} label={allTimeLabel} value={formatValue(stationLifetime?.baseUnits, 2, ' WRF')} />
                <MetricCard icon={<TrendingUpIcon />} label="Rate per day (recent window)" value={formatRatePerDay(stationRate?.baseUnitsPerDay)} />
              </Box>

              {filteredEarnings.length > 0 ? (
                <Box sx={{ height: 260 }}>
                  <Bar data={earningsChartData} options={chartOptions} aria-label="Earnings history chart" />
                </Box>
              ) : (
                <Alert severity="info">No earnings history is available for this station yet.</Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

const EmojiEventsIcon = TrophyIcon;

export default StationReportPage;
