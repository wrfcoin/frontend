import DemoSurfaceGate from '../common/DemoSurfaceGate';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  Alert,
  Button,
  type SelectChangeEvent,
} from '@mui/material';
import { apiClient } from '../../services/apiClient';
import { Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';

import QualityRadar, { type DimensionScore } from './QualityRadar';
import QualityTimeline, {
  type QualityTimePoint,
  type TimelineEvent,
} from './QualityTimeline';
import DimensionBreakdown, {
  type DimensionData,
} from './DimensionBreakdown';
import QualityAlerts, { type QualityAlert } from './QualityAlerts';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
);

// --- Types ---

interface StationProfile {
  id: string;
  name: string;
  location: string;
  overallScore: number;
  dimensions: DimensionScore;
  previousDimensions: DimensionScore;
  history: QualityTimePoint[];
  events: TimelineEvent[];
  dimensionBreakdown: DimensionData[];
  alerts: QualityAlert[];
  sparkline: number[];
}

// (mock station data removed — stations fetched from API)

// (STATION_2 removed — data fetched from API)
const _STATION_2_REMOVED: StationProfile = {
  id: 'WX-042',
  name: 'Airport Met Station',
  location: 'Denver, CO',
  overallScore: 95,
  dimensions: { range: 98, temporal: 94, spatial: 93, crossParameter: 96 },
  previousDimensions: { range: 97, temporal: 93, spatial: 94, crossParameter: 95 },
  history: [],
  events: [
    { date: getDateDaysAgo(20), label: 'Annual calibration', type: 'calibration' as const },
  ],
  dimensionBreakdown: [
    {
      key: 'range',
      label: 'Range Validation',
      score: 98,
      previousScore: 97,
      description: 'All readings fall within physically plausible limits with excellent margins.',
      subChecks: [
        { name: 'Temperature range', passed: true, detail: 'All readings within bounds' },
        { name: 'Humidity range', passed: true, detail: '100% compliance' },
        { name: 'Pressure range', passed: true, detail: 'All readings within bounds' },
        { name: 'Wind speed range', passed: true, detail: '100% compliance' },
        { name: 'UV Index range', passed: true, detail: 'All readings within 0-15' },
      ],
      tips: ['Excellent range validation. No action needed.'],
    },
    {
      key: 'temporal',
      label: 'Temporal Consistency',
      score: 94,
      previousScore: 93,
      description: 'Sequential readings change at expected atmospheric rates with high consistency.',
      subChecks: [
        { name: 'Temperature rate', passed: true, detail: 'Max 2.1C/hr' },
        { name: 'Pressure rate', passed: true, detail: 'Max 1.5 hPa/hr' },
        { name: 'Humidity rate', passed: true, detail: 'Max 18%/hr' },
        { name: 'No data gaps >15 min', passed: true, detail: 'Zero gaps' },
        { name: 'Timestamp order', passed: true, detail: 'All ordered' },
      ],
      tips: ['Outstanding temporal consistency. Maintain current configuration.'],
    },
    {
      key: 'spatial',
      label: 'Spatial Consensus',
      score: 93,
      previousScore: 94,
      description: 'Readings agree closely with nearby stations in the Denver metro area.',
      subChecks: [
        { name: 'Temperature agreement', passed: true, detail: 'Avg deviation: 0.8C' },
        { name: 'Pressure agreement', passed: true, detail: 'Avg deviation: 0.4 hPa' },
        { name: 'Humidity agreement', passed: true, detail: 'Avg deviation: 5.2%' },
        { name: 'Wind direction', passed: true, detail: 'Avg deviation: 18 deg' },
      ],
      tips: ['Strong spatial consensus. Airport location provides unobstructed readings.'],
    },
    {
      key: 'crossParameter',
      label: 'Cross-Parameter Validation',
      score: 96,
      previousScore: 95,
      description: 'Physical relationships between parameters are consistently logical.',
      subChecks: [
        { name: 'Dew point <= Temperature', passed: true, detail: 'All valid' },
        { name: 'Wind chill consistency', passed: true, detail: 'Consistent' },
        { name: 'Solar vs time-of-day', passed: true, detail: 'Correct' },
        { name: 'Pressure-weather correlation', passed: true, detail: 'Excellent' },
      ],
      tips: ['Top-tier cross-parameter validation. Continue current sensor maintenance.'],
    },
  ],
  alerts: [
    {
      id: 'b1',
      timestamp: getDateDaysAgo(3),
      severity: 'info',
      dimension: 'Cross-Parameter',
      title: 'Quality score improved',
      description: 'Overall quality score increased from 93 to 95 after annual calibration.',
      suggestedAction: 'No action needed. Continue regular maintenance schedule.',
      acknowledged: true,
    },
  ],
  sparkline: [],
} as unknown as StationProfile;

// (STATION_3 generator removed — data fetched from API)

// (STATION_3 removed — data fetched from API)
const _STATION_3_REMOVED: StationProfile = {
  id: 'WX-187',
  name: 'Rooftop Sensor Unit',
  location: 'Phoenix, AZ',
  overallScore: 58,
  dimensions: { range: 72, temporal: 45, spatial: 52, crossParameter: 63 },
  previousDimensions: { range: 68, temporal: 50, spatial: 55, crossParameter: 60 },
  history: [],
  events: [
    { date: getDateDaysAgo(60), label: 'Initial install', type: 'maintenance' as const },
    { date: getDateDaysAgo(30), label: 'Power outage', type: 'outage' as const },
    { date: getDateDaysAgo(15), label: 'Firmware v1.2', type: 'firmware_update' as const },
  ],
  dimensionBreakdown: [
    {
      key: 'range',
      label: 'Range Validation',
      score: 72,
      previousScore: 68,
      description: 'Several readings exceed physical limits, primarily from the UV and temperature sensors affected by rooftop heat.',
      subChecks: [
        { name: 'Temperature range', passed: false, detail: '14 readings >55C (rooftop heat radiation)' },
        { name: 'Humidity range', passed: true, detail: 'Within bounds' },
        { name: 'Pressure range', passed: true, detail: 'Within bounds' },
        { name: 'UV Index range', passed: false, detail: 'Frequent readings >15 from reflected radiation' },
        { name: 'Wind speed range', passed: true, detail: 'Within bounds' },
      ],
      tips: [
        'Rooftop placement causes elevated temperature readings. Add a proper radiation shield.',
        'UV sensor is picking up reflected radiation from the roof surface. Reposition or add a baffle.',
      ],
    },
    {
      key: 'temporal',
      label: 'Temporal Consistency',
      score: 45,
      previousScore: 50,
      description: 'Frequent data gaps and rapid sensor fluctuations indicate hardware reliability issues.',
      subChecks: [
        { name: 'Temperature rate', passed: false, detail: 'Max 12C/hr due to rooftop thermal cycling' },
        { name: 'Pressure rate', passed: true, detail: 'Max 3.2 hPa/hr' },
        { name: 'No data gaps >15 min', passed: false, detail: '18 gaps in last 30 days (power issues)' },
        { name: 'Timestamp order', passed: false, detail: '3 out-of-order timestamps detected' },
      ],
      tips: [
        'Install a UPS or solar-battery backup to eliminate power-related data gaps.',
        'Out-of-order timestamps suggest RTC drift. Replace the coin cell battery on the controller board.',
        'Thermal cycling is extreme on this rooftop. Insulate sensor housing or relocate.',
      ],
    },
    {
      key: 'spatial',
      label: 'Spatial Consensus',
      score: 52,
      previousScore: 55,
      description: 'Readings deviate significantly from nearby stations due to rooftop microclimate effects.',
      subChecks: [
        { name: 'Temperature agreement', passed: false, detail: 'Avg deviation: 6.4C (rooftop heat island)' },
        { name: 'Humidity agreement', passed: false, detail: 'Avg deviation: 22% (dry rooftop environment)' },
        { name: 'Wind direction', passed: false, detail: 'Avg deviation: 78 deg (building turbulence)' },
        { name: 'Precipitation', passed: true, detail: 'Avg deviation: 1.1mm/hr' },
      ],
      tips: [
        'Rooftop placement creates a microclimate that differs substantially from street-level conditions.',
        'Consider relocating to a ground-level position with a standard mounting height of 1.5m for temperature.',
      ],
    },
    {
      key: 'crossParameter',
      label: 'Cross-Parameter Validation',
      score: 63,
      previousScore: 60,
      description: 'Heat-related parameter inconsistencies from rooftop environment.',
      subChecks: [
        { name: 'Dew point <= Temperature', passed: true, detail: 'Valid' },
        { name: 'Heat index plausibility', passed: false, detail: 'Impossible heat index values from inflated temperature' },
        { name: 'Solar vs time-of-day', passed: false, detail: 'Reflected radiation causes elevated nighttime readings' },
        { name: 'Humidity-precipitation', passed: true, detail: 'Reasonable correlation' },
      ],
      tips: [
        'Heat index calculations are invalid because the temperature sensor reads too high. Fix temperature first.',
        'Solar radiation reflections from the roof affect night readings. Add a light baffle.',
      ],
    },
  ],
  alerts: [
    {
      id: 'c1',
      timestamp: getDateDaysAgo(0, 1),
      severity: 'critical',
      dimension: 'Temporal Consistency',
      title: '18 data gaps in last 30 days',
      description: 'Frequent power interruptions are causing unacceptable data gaps. Station reliability is at 62%.',
      suggestedAction: 'Install a UPS with minimum 4-hour battery backup. Check power cable connections for loose contacts.',
      acknowledged: false,
    },
    {
      id: 'c2',
      timestamp: getDateDaysAgo(0, 5),
      severity: 'critical',
      dimension: 'Spatial Consensus',
      title: 'Temperature 6.4C above regional average',
      description: 'Rooftop heat island effect is severely impacting temperature accuracy.',
      suggestedAction: 'Relocate temperature sensor away from the roof surface. Use a professional-grade aspirated radiation shield.',
      acknowledged: false,
    },
    {
      id: 'c3',
      timestamp: getDateDaysAgo(1),
      severity: 'warning',
      dimension: 'Range Validation',
      title: 'UV Index consistently exceeds physical limits',
      description: 'Reflected solar radiation from the light-colored roof is inflating UV readings.',
      suggestedAction: 'Add a UV sensor baffle or relocate the sensor to avoid reflected radiation.',
      acknowledged: false,
    },
    {
      id: 'c4',
      timestamp: getDateDaysAgo(2),
      severity: 'warning',
      dimension: 'Temporal Consistency',
      title: 'Clock drift detected',
      description: '3 out-of-order timestamps in the last week indicate RTC battery failure.',
      suggestedAction: 'Replace the CR2032 battery on the station controller board.',
      acknowledged: false,
    },
  ],
  sparkline: [],
} as unknown as StationProfile;

function getDateDaysAgo(n: number, hours = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

// (STATIONS populated via API — see DataQualityDashboard component)
const EMPTY_STATIONS: StationProfile[] = [];

// --- Helpers ---

function getScoreColor(score: number): string {
  if (score > 80) return '#10B981';
  if (score >= 60) return '#F59E0B';
  return '#EF4444';
}

function getScoreLabel(score: number): string {
  if (score >= 95) return 'Exceptional';
  if (score >= 85) return 'Strong';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  return 'Needs Attention';
}

// --- Sub-components ---

interface GaugeProps {
  score: number;
}

const ScoreGauge: React.FC<GaugeProps> = ({ score }) => {
  const color = getScoreColor(score);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <Box sx={{ position: 'relative', width: 140, height: 140, mx: 'auto' }}>
      <svg
        width="140"
        height="140"
        viewBox="0 0 120 120"
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Background circle */}
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="rgba(248,250,252,0.06)"
          strokeWidth="8"
        />
        {/* Score arc */}
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}
      >
        <Typography
          sx={{
            color,
            fontWeight: 800,
            fontSize: '2.2rem',
            lineHeight: 1,
            fontFamily: 'monospace',
          }}
        >
          {score}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.65rem' }}
        >
          {getScoreLabel(score)}
        </Typography>
      </Box>
    </Box>
  );
};

interface SparklineChartProps {
  data: number[];
}

const SparklineChart: React.FC<SparklineChartProps> = ({ data }) => {
  const chartData = useMemo(
    () => ({
      labels: data.map((_, i) => `${i}`),
      datasets: [
        {
          data,
          borderColor: '#3B82F6',
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.4,
          fill: true,
          backgroundColor: 'rgba(59,130,246,0.08)',
        },
      ],
    }),
    [data],
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { display: false },
        y: { display: false, min: 0, max: 100 },
      },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
      animation: { duration: 400 },
    }),
    [],
  );

  return (
    <Box sx={{ height: 48, width: '100%' }}>
      <Line data={chartData} options={options} />
    </Box>
  );
};

// --- Main Component ---

const DataQualityDashboardSample: React.FC = () => {
  const [stations, setStations] = useState<StationProfile[]>(EMPTY_STATIONS);
  const [stationsLoading, setStationsLoading] = useState(true);
  const [stationsError, setStationsError] = useState<string | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<string>('');

  const fetchStations = useCallback(async () => {
    setStationsLoading(true);
    setStationsError(null);
    try {
      const data = await apiClient.get<StationProfile[]>('/quality/stations');
      if (data && data.length > 0) {
        setStations(data);
        setSelectedStationId(data[0].id);
      }
    } catch (err) {
      setStationsError(err instanceof Error ? err.message : 'Failed to load quality data');
    } finally {
      setStationsLoading(false);
    }
  }, []);

  useEffect(() => { fetchStations(); }, [fetchStations]);

  const station = useMemo(
    () => stations.find((s) => s.id === selectedStationId) ?? stations[0] ?? null,
    [stations, selectedStationId],
  );

  const handleStationChange = (event: SelectChangeEvent<string>) => {
    setSelectedStationId(event.target.value);
  };

  const unacknowledgedCount = useMemo(
    () => (station?.alerts ?? []).filter((a) => !a.acknowledged).length,
    [station],
  );

  if (stationsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8, bgcolor: '#0F172A', minHeight: '100vh' }}>
        <CircularProgress sx={{ color: '#3B82F6' }} />
      </Box>
    );
  }

  if (stationsError || !station) {
    return (
      <Box sx={{ bgcolor: '#0F172A', minHeight: '100vh', p: 3 }}>
        <Alert severity="error" action={<Button size="small" onClick={fetchStations}>Retry</Button>}>
          {stationsError ?? 'No station data available'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#0F172A',
        p: { xs: 2, md: 3 },
      }}
    >
      {/* Top Bar */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{ color: '#F8FAFC', fontWeight: 800, mb: 0.25 }}
          >
            Data Quality Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            Monitor and improve your weather station data quality
          </Typography>
        </Box>

        {/* Station Selector */}
        <Select
          value={selectedStationId}
          onChange={handleStationChange}
          size="small"
          sx={{
            minWidth: 240,
            bgcolor: '#1E293B',
            color: '#F8FAFC',
            borderRadius: 2,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(248,250,252,0.10)',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(59,130,246,0.40)',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#3B82F6',
            },
            '& .MuiSelect-icon': { color: '#64748B' },
          }}
          MenuProps={{
            PaperProps: {
              sx: {
                bgcolor: '#1E293B',
                border: '1px solid rgba(248,250,252,0.10)',
                '& .MuiMenuItem-root': {
                  color: '#CBD5E1',
                  '&:hover': { bgcolor: 'rgba(59,130,246,0.10)' },
                  '&.Mui-selected': {
                    bgcolor: 'rgba(59,130,246,0.15)',
                    color: '#3B82F6',
                  },
                },
              },
            },
          }}
        >
          {stations.map((s) => (
            <MenuItem key={s.id} value={s.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: getScoreColor(s.overallScore),
                  }}
                />
                <Typography sx={{ fontSize: '0.85rem' }}>
                  {s.name} ({s.id})
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </Box>

      {/* Summary Row */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {/* Overall Score Gauge */}
        <Grid size={{ xs: 12, md: 4, lg: 3 }}>
          <Paper
            elevation={0}
            sx={{
              bgcolor: '#1E293B',
              borderRadius: 3,
              border: '1px solid rgba(248,250,252,0.06)',
              p: 2.5,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                color: '#F8FAFC',
                fontWeight: 700,
                letterSpacing: 0.5,
                mb: 2,
                alignSelf: 'flex-start',
              }}
            >
              OVERALL QUALITY
            </Typography>
            <ScoreGauge score={station.overallScore} />
            <Typography
              variant="caption"
              sx={{ color: '#64748B', mt: 1.5, textAlign: 'center' }}
            >
              {station.name} &middot; {station.location}
            </Typography>
          </Paper>
        </Grid>

        {/* Radar Chart */}
        <Grid size={{ xs: 12, md: 4, lg: 5 }}>
          <QualityRadar
            scores={station.dimensions}
            previousScores={station.previousDimensions}
            stationName={station.name}
          />
        </Grid>

        {/* 30-Day Sparkline + Quick Stats */}
        <Grid size={{ xs: 12, md: 4, lg: 4 }}>
          <Paper
            elevation={0}
            sx={{
              bgcolor: '#1E293B',
              borderRadius: 3,
              border: '1px solid rgba(248,250,252,0.06)',
              p: 2.5,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                color: '#F8FAFC',
                fontWeight: 700,
                letterSpacing: 0.5,
                mb: 1.5,
              }}
            >
              30-DAY TREND
            </Typography>

            <SparklineChart data={station.sparkline} />

            {/* Quick stats grid */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 1.5,
                mt: 2,
              }}
            >
              {[
                {
                  label: 'Range',
                  value: station.dimensions.range,
                  prev: station.previousDimensions.range,
                },
                {
                  label: 'Temporal',
                  value: station.dimensions.temporal,
                  prev: station.previousDimensions.temporal,
                },
                {
                  label: 'Spatial',
                  value: station.dimensions.spatial,
                  prev: station.previousDimensions.spatial,
                },
                {
                  label: 'Cross-Param',
                  value: station.dimensions.crossParameter,
                  prev: station.previousDimensions.crossParameter,
                },
              ].map(({ label, value, prev }) => {
                const diff = value - prev;
                const diffColor =
                  diff > 0 ? '#10B981' : diff < 0 ? '#EF4444' : '#64748B';
                return (
                  <Box
                    key={label}
                    sx={{
                      bgcolor: 'rgba(248,250,252,0.03)',
                      borderRadius: 1.5,
                      px: 1.5,
                      py: 1,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#64748B',
                        fontSize: '0.6rem',
                        fontWeight: 600,
                        letterSpacing: 0.3,
                      }}
                    >
                      {label.toUpperCase()}
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 0.75,
                      }}
                    >
                      <Typography
                        sx={{
                          color: getScoreColor(value),
                          fontWeight: 800,
                          fontSize: '1.1rem',
                          fontFamily: 'monospace',
                        }}
                      >
                        {value}
                      </Typography>
                      <Typography
                        sx={{
                          color: diffColor,
                          fontSize: '0.65rem',
                          fontWeight: 700,
                        }}
                      >
                        {diff > 0 ? '+' : ''}
                        {diff}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>

            {/* Active alerts count */}
            {unacknowledgedCount > 0 && (
              <Box
                sx={{
                  mt: 'auto',
                  pt: 1.5,
                  borderTop: '1px solid rgba(248,250,252,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: '#EF4444',
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.5 },
                    },
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{ color: '#EF4444', fontWeight: 600, fontSize: '0.7rem' }}
                >
                  {unacknowledgedCount} active alert{unacknowledgedCount > 1 ? 's' : ''} require attention
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Timeline */}
      <Box sx={{ mb: 2 }}>
        <QualityTimeline
          history={station.history}
          events={station.events}
          threshold={70}
        />
      </Box>

      {/* Bottom Row: Breakdown + Alerts */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <DimensionBreakdown dimensions={station.dimensionBreakdown} />
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <QualityAlerts alerts={station.alerts} />
        </Grid>
      </Grid>
    </Box>
  );
};

const DataQualityDashboard: React.FC<React.ComponentProps<typeof DataQualityDashboardSample>> = (props) => (
  <DemoSurfaceGate
    testId="data-quality"
    title="Data quality dashboard is not live on this testnet"
    description="This preview contains illustrative data or simulated actions, not verified testnet results."
  >
    <DataQualityDashboardSample {...props} />
  </DemoSurfaceGate>
);

export default DataQualityDashboard;
