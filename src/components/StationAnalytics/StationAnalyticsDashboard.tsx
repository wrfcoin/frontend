// StationAnalyticsDashboard - Main dashboard for station deep analytics
import React, { useEffect, useState, useMemo } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import SpeedIcon from '@mui/icons-material/Speed';
import AirIcon from '@mui/icons-material/Air';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import InsightsIcon from '@mui/icons-material/Insights';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import RefreshIcon from '@mui/icons-material/Refresh';
import WrfCard from '../ui/WrfCard';
import WrfStatCard from '../ui/WrfStatCard';
import WrfButton from '../ui/WrfButton';
import WrfBadge from '../ui/WrfBadge';
import { colors, spacing, borderRadius, shadows } from '../ui/tokens';
import {
  useLatestObservations,
  useStationQuality,
  useSubmissionLog,
  useWeatherStations,
} from '../../hooks/api/useWeatherQueries';
import type { StationObservation, StationSubmissionLogEntry, WeatherStation } from '../../services/apiClient';
import { formatExactAmount } from '../../services/apiClient/amountPrecision';

// ---------- Types ----------

type Timeframe = '7d' | '30d' | '90d' | '1y';

interface ActivityItem {
  id: string;
  type: 'reading' | 'alert' | 'achievement' | 'maintenance';
  message: string;
  timestamp: string;
}

interface QuickLink {
  label: string;
  icon: React.ElementType;
  path: string;
}

interface AnalyticsStats {
  tempF: number | null;
  humidityPct: number | null;
  pressureHpa: number | null;
  windMph: number | null;
  qualityPct: number | null;
  readings: number;
  readingsTrend: number;
}

const TIMEFRAME_DAYS: Record<Timeframe, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '1y': 365,
};

const QUICK_LINKS: QuickLink[] = [
  { label: 'Seasonal Patterns', icon: InsightsIcon, path: '/station/seasonal' },
  { label: 'Contribution Calendar', icon: CalendarMonthIcon, path: '/station/contributions' },
  { label: 'Environmental Correlations', icon: BubbleChartIcon, path: '/station/environmental' },
  { label: 'Station Benchmark', icon: LeaderboardIcon, path: '/station/benchmarks' },
  { label: 'Peer Comparison', icon: CompareArrowsIcon, path: '/station/peers' },
];

// ---------- Helpers ----------

const timeAgo = (iso: string): string => {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const celsiusToFahrenheit = (value: number | undefined): number | null => {
  if (typeof value !== 'number') return null;
  return Number(((value * 9) / 5 + 32).toFixed(1));
};

const metersPerSecondToMph = (value: number | undefined): number | null => {
  if (typeof value !== 'number') return null;
  return Number((value * 2.236936).toFixed(1));
};

const formatNumber = (value: number | null, suffix = '', digits = 1): string => {
  if (value == null) return 'No data';
  return `${value.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: Number.isInteger(value) ? 0 : digits,
  })}${suffix}`;
};

const formatStationLocation = (station: WeatherStation | undefined): string => {
  if (!station) return 'No station selected';
  const coords =
    station.latitude != null && station.longitude != null
      ? ` (${station.latitude.toFixed(4)}, ${station.longitude.toFixed(4)})`
      : '';
  return `${station.location || 'Location unavailable'}${coords}`;
};

const countSubmissionsInWindow = (
  submissions: StationSubmissionLogEntry[],
  fromMs: number,
  toMs: number,
): number =>
  submissions.filter((entry) => {
    const timestamp = new Date(entry.timestamp).getTime();
    return Number.isFinite(timestamp) && timestamp >= fromMs && timestamp < toMs;
  }).length;

export function formatStationReward(value: unknown): string {
  return `${formatExactAmount(value, 4)} WRF`;
}

export const buildSubmissionActivity = (submissions: StationSubmissionLogEntry[]): ActivityItem[] =>
  [...submissions]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8)
    .map((entry) => ({
      id: entry.id,
      type: entry.success ? 'reading' : 'alert',
      message: `${entry.summary}${entry.qualityScore != null ? ` (${entry.qualityScore.toFixed(1)}% quality)` : ''}${entry.wrfEarned != null ? `, ${formatStationReward(entry.wrfEarned)}` : ''}`,
      timestamp: entry.timestamp,
    }));

const latestObservation = (observations: StationObservation[] | undefined): StationObservation | null =>
  [...(observations ?? [])].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )[0] ?? null;

const activityTypeColor: Record<string, string> = {
  reading: colors.brand.primary,
  alert: colors.warning.main,
  achievement: colors.success.main,
  maintenance: colors.text.muted,
};

// ---------- Sub-components ----------

const TimeframeSelector: React.FC<{ value: Timeframe; onChange: (v: Timeframe) => void }> = ({ value, onChange }) => {
  const options: Timeframe[] = ['7d', '30d', '90d', '1y'];
  return (
    <Box sx={{ display: 'flex', gap: '4px', backgroundColor: colors.bg.primary, borderRadius: `${borderRadius.md}px`, padding: '3px' }}>
      {options.map((opt) => (
        <Box
          key={opt}
          onClick={() => onChange(opt)}
          sx={{
            padding: '6px 14px',
            borderRadius: `${borderRadius.sm}px`,
            fontSize: '0.8rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            color: value === opt ? colors.text.primary : colors.text.muted,
            backgroundColor: value === opt ? colors.bg.tertiary : 'transparent',
            '&:hover': {
              color: colors.text.primary,
              backgroundColor: value !== opt ? 'rgba(51, 65, 85, 0.4)' : undefined,
            },
          }}
        >
          {opt}
        </Box>
      ))}
    </Box>
  );
};

const FreshnessIndicator: React.FC<{ lastUpdated: string }> = ({ lastUpdated }) => {
  const ms = Date.now() - new Date(lastUpdated).getTime();
  const minutes = Math.floor(ms / 60_000);
  const isFresh = minutes < 10;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <WrfBadge status={isFresh ? 'online' : 'degraded'} label={isFresh ? 'Live' : 'Stale'} size="sm" pulse={isFresh} />
      <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted }}>
        Updated {timeAgo(lastUpdated)}
      </Typography>
    </Box>
  );
};

// ---------- Main Component ----------

const StationAnalyticsDashboard: React.FC = () => {
  const [timeframe, setTimeframe] = useState<Timeframe>('7d');
  const [selectedStationId, setSelectedStationId] = useState('');

  const stationsQuery = useWeatherStations();
  const stations = stationsQuery.data ?? [];

  useEffect(() => {
    if (!selectedStationId && stations.length > 0) {
      setSelectedStationId(stations[0].id);
    }
  }, [selectedStationId, stations]);

  useEffect(() => {
    if (selectedStationId && stations.length > 0 && !stations.some((station) => station.id === selectedStationId)) {
      setSelectedStationId(stations[0].id);
    }
  }, [selectedStationId, stations]);

  const station = useMemo(
    () => stations.find((stationItem) => stationItem.id === selectedStationId),
    [selectedStationId, stations],
  );

  const observationsQuery = useLatestObservations(selectedStationId || undefined);
  const qualityQuery = useStationQuality(selectedStationId || undefined);
  const submissionsQuery = useSubmissionLog(selectedStationId || undefined);

  const observation = useMemo(
    () => latestObservation(observationsQuery.data),
    [observationsQuery.data],
  );

  const stats = useMemo<AnalyticsStats>(() => {
    const now = Date.now();
    const days = TIMEFRAME_DAYS[timeframe];
    const windowMs = days * 24 * 60 * 60 * 1000;
    const currentCount = countSubmissionsInWindow(submissionsQuery.data ?? [], now - windowMs, now);
    const previousCount = countSubmissionsInWindow(submissionsQuery.data ?? [], now - 2 * windowMs, now - windowMs);
    const readingsTrend = previousCount > 0
      ? Number((((currentCount - previousCount) / previousCount) * 100).toFixed(1))
      : 0;

    return {
      tempF: celsiusToFahrenheit(observation?.temperatureC),
      humidityPct: observation?.humidityPct ?? null,
      pressureHpa: observation?.pressureHpa ?? null,
      windMph: metersPerSecondToMph(observation?.windSpeedMs),
      qualityPct: qualityQuery.data?.overall ?? null,
      readings: currentCount,
      readingsTrend,
    };
  }, [observation, qualityQuery.data, submissionsQuery.data, timeframe]);

  const activityFeed = useMemo(
    () => buildSubmissionActivity(submissionsQuery.data ?? []),
    [submissionsQuery.data],
  );

  const lastUpdated = observation?.timestamp || station?.lastUpdatedAt || new Date(0).toISOString();

  const handleStationChange = (event: SelectChangeEvent<string>) => {
    setSelectedStationId(event.target.value);
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify({ station: selectedStationId, timeframe, stats, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedStationId || 'station'}-analytics-${timeframe}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const headers = 'Metric,Value,Trend';
    const rows = [
      `Temperature,${formatNumber(stats.tempF, 'F')},n/a`,
      `Humidity,${formatNumber(stats.humidityPct, '%', 0)},n/a`,
      `Pressure,${formatNumber(stats.pressureHpa, ' hPa')},n/a`,
      `Wind Speed,${formatNumber(stats.windMph, ' mph')},n/a`,
      `Quality Score,${formatNumber(stats.qualityPct, '%')},n/a`,
      `Total Readings,${stats.readings},${stats.readingsTrend}%`,
    ];
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedStationId || 'station'}-analytics-${timeframe}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasStationDataError = observationsQuery.isError || qualityQuery.isError || submissionsQuery.isError;

  if (stationsQuery.isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: colors.bg.primary, padding: `${spacing.xl}px` }}>
        <Skeleton variant="rounded" height={76} sx={{ bgcolor: colors.bg.secondary, mb: `${spacing.xl}px` }} />
        <Grid container spacing={2}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Grid key={index} size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <Skeleton variant="rounded" height={150} sx={{ bgcolor: colors.bg.secondary }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (stationsQuery.isError) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: colors.bg.primary, padding: `${spacing.xl}px` }}>
        <Alert severity="error">Unable to load weather stations for analytics.</Alert>
      </Box>
    );
  }

  if (stations.length === 0) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: colors.bg.primary, padding: `${spacing.xl}px` }}>
        <Alert severity="info">No weather stations are available for analytics yet.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: colors.bg.primary, padding: `${spacing.xl}px` }}>
      {/* ---- Header ---- */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: `${spacing.md}px`, marginBottom: `${spacing.xl}px` }}>
        <Box>
          <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: colors.text.primary, lineHeight: 1.3 }}>
            {station?.name || 'Weather Station'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.md}px`, marginTop: `${spacing.xs}px`, flexWrap: 'wrap' }}>
            <Typography sx={{ fontSize: '0.875rem', color: colors.text.secondary }}>
              {station?.id || selectedStationId}
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: colors.text.muted }}>
              {formatStationLocation(station)}
            </Typography>
          </Box>
          <Box sx={{ marginTop: `${spacing.sm}px` }}>
            <FreshnessIndicator lastUpdated={lastUpdated} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px`, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel sx={{ color: colors.text.muted }}>Station</InputLabel>
            <Select
              value={selectedStationId}
              label="Station"
              onChange={handleStationChange}
              sx={{
                color: colors.text.primary,
                backgroundColor: colors.bg.secondary,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border.default },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.brand.primary },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.brand.primary },
                '& .MuiSvgIcon-root': { color: colors.text.muted },
              }}
            >
              {stations.map((stationOption) => (
                <MenuItem key={stationOption.id} value={stationOption.id}>
                  {stationOption.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TimeframeSelector value={timeframe} onChange={setTimeframe} />
          <Tooltip title="Refresh data">
            <IconButton
              onClick={() => {
                observationsQuery.refetch();
                qualityQuery.refetch();
                submissionsQuery.refetch();
              }}
              sx={{ color: colors.text.secondary, '&:hover': { color: colors.text.primary } }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {hasStationDataError && (
        <Alert severity="warning" sx={{ marginBottom: `${spacing.lg}px` }}>
          Some station analytics endpoints are unavailable; showing the live fields returned by the backend.
        </Alert>
      )}

      {/* ---- Stat Cards Row ---- */}
      <Grid container spacing={2} sx={{ marginBottom: `${spacing.xl}px` }}>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <WrfStatCard
            label="Avg Temperature"
            value={formatNumber(stats.tempF, '\u00B0F')}
            trendLabel="latest reading"
            icon={ThermostatIcon}
            color={colors.error.main}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <WrfStatCard
            label="Avg Humidity"
            value={formatNumber(stats.humidityPct, '%', 0)}
            trendLabel="latest reading"
            icon={WaterDropIcon}
            color={colors.brand.primary}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <WrfStatCard
            label="Pressure"
            value={formatNumber(stats.pressureHpa, '', 1)}
            trendLabel="hPa"
            icon={SpeedIcon}
            color={colors.success.main}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <WrfStatCard
            label="Wind Speed"
            value={formatNumber(stats.windMph, ' mph')}
            trendLabel="latest reading"
            icon={AirIcon}
            color={colors.warning.main}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <WrfStatCard
            label="Quality Score"
            value={formatNumber(stats.qualityPct, '%')}
            trendLabel="backend score"
            icon={InsightsIcon}
            color="#8B5CF6"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <WrfStatCard
            label="Total Readings"
            value={stats.readings.toLocaleString()}
            trend={stats.readingsTrend}
            trendLabel={`vs prev ${timeframe}`}
            icon={CalendarMonthIcon}
            color="#06B6D4"
          />
        </Grid>
      </Grid>

      {/* ---- Quick Links + Activity Feed ---- */}
      <Grid container spacing={3}>
        {/* Quick Links */}
        <Grid size={{ xs: 12, md: 5, lg: 4 }}>
          <WrfCard title="Deep Analytics" subtitle="Explore detailed station analysis modules">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${spacing.sm}px` }}>
              {QUICK_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <Box
                    key={link.path}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: `${spacing.md}px`,
                      padding: `${spacing.sm + 2}px ${spacing.md}px`,
                      borderRadius: `${borderRadius.md}px`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(59, 130, 246, 0.06)',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 36,
                        height: 36,
                        borderRadius: `${borderRadius.md}px`,
                        backgroundColor: `${colors.brand.primary}12`,
                        flexShrink: 0,
                      }}
                    >
                      <Icon sx={{ fontSize: 18, color: colors.brand.primary }} />
                    </Box>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: colors.text.primary }}>
                      {link.label}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </WrfCard>

          {/* Export Buttons */}
          <WrfCard title="Export Data" sx={{ marginTop: `${spacing.md}px` }}>
            <Box sx={{ display: 'flex', gap: `${spacing.sm}px`, flexWrap: 'wrap' }}>
              <WrfButton
                variant="secondary"
                size="sm"
                startIcon={<FileDownloadIcon sx={{ fontSize: 16 }} />}
                onClick={handleExportCSV}
              >
                Export CSV
              </WrfButton>
              <WrfButton
                variant="secondary"
                size="sm"
                startIcon={<FileDownloadIcon sx={{ fontSize: 16 }} />}
                onClick={handleExportJSON}
              >
                Export JSON
              </WrfButton>
            </Box>
          </WrfCard>
        </Grid>

        {/* Activity Feed */}
        <Grid size={{ xs: 12, md: 7, lg: 8 }}>
          <WrfCard title="Recent Activity" subtitle="Latest events and data submissions">
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {activityFeed.length === 0 && (
                <Typography sx={{ fontSize: '0.875rem', color: colors.text.muted, padding: `${spacing.sm + 2}px 0` }}>
                  No submissions have been reported by the backend for this station yet.
                </Typography>
              )}
              {activityFeed.map((item, idx) => (
                <React.Fragment key={item.id}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: `${spacing.md}px`,
                      padding: `${spacing.sm + 2}px 0`,
                    }}
                  >
                    {/* Colored dot */}
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: activityTypeColor[item.type] || colors.text.muted,
                        flexShrink: 0,
                        marginTop: '6px',
                      }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: '0.875rem', color: colors.text.primary, lineHeight: 1.5 }}>
                        {item.message}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted, marginTop: '2px' }}>
                        {timeAgo(item.timestamp)}
                      </Typography>
                    </Box>
                  </Box>
                  {idx < activityFeed.length - 1 && (
                    <Divider sx={{ borderColor: colors.border.default, opacity: 0.5 }} />
                  )}
                </React.Fragment>
              ))}
            </Box>
          </WrfCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StationAnalyticsDashboard;
