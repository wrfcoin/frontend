// GlobeStationDetail - Station detail panel with multi-metric charts
import React, { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import CloseIcon from '@mui/icons-material/Close';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import SpeedIcon from '@mui/icons-material/Speed';
import AirIcon from '@mui/icons-material/Air';
import PlaceIcon from '@mui/icons-material/Place';
import TerrainIcon from '@mui/icons-material/Terrain';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import NavigationIcon from '@mui/icons-material/Navigation';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip as ChartTooltip,
  Filler,
} from 'chart.js';
import { colors, spacing, borderRadius, shadows } from '../ui/tokens';
import { WrfCard, WrfButton, WrfBadge } from '../ui';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTooltip, Filler);

interface StationData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  elevation: number;
  status: 'active' | 'degraded' | 'offline';
  qualityScore: number;
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection?: number;
  earningsToday: number;
  earnings7d: number;
  earningsMonthly: number;
  lastSeen: string;
  sparkline: number[];
}

interface GlobeStationDetailProps {
  station: StationData;
  onClose: () => void;
}

// Quality score arc gauge
const QualityGauge: React.FC<{ score: number }> = ({ score }) => {
  const radius = 40;
  const strokeWidth = 8;
  const center = 50;
  const circumference = Math.PI * radius;
  const arcLength = (score / 100) * circumference;
  const gaugeColor =
    score >= 85
      ? colors.success.main
      : score >= 60
        ? colors.warning.main
        : colors.error.main;

  return (
    <svg viewBox="0 0 100 60" width="100%" height="auto" style={{ maxWidth: 140 }}>
      <defs>
        <linearGradient id="gauge-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={colors.error.main} />
          <stop offset="50%" stopColor={colors.warning.main} />
          <stop offset="100%" stopColor={colors.success.main} />
        </linearGradient>
      </defs>
      <path
        d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
        fill="none"
        stroke={colors.border.default}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
        fill="none"
        stroke={gaugeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${arcLength} ${circumference}`}
        style={{ filter: `drop-shadow(0 0 3px ${gaugeColor}44)` }}
      />
      <text
        x={center}
        y={center - 8}
        textAnchor="middle"
        fill={colors.text.primary}
        fontSize="18"
        fontWeight="700"
        fontFamily="sans-serif"
      >
        {score}
      </text>
      <text
        x={center}
        y={center + 4}
        textAnchor="middle"
        fill={colors.text.muted}
        fontSize="7"
        fontFamily="sans-serif"
      >
        / 100
      </text>
    </svg>
  );
};

// Mini stat box
const MiniStat: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
  subValue?: string;
}> = ({ icon: IconComp, label, value, color, subValue }) => (
  <Box
    sx={{
      bgcolor: colors.bg.tertiary,
      borderRadius: `${borderRadius.md}px`,
      p: `${spacing.sm}px`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '2px',
    }}
  >
    <IconComp sx={{ fontSize: 16, color }} />
    <Typography sx={{ fontSize: '0.9375rem', fontWeight: 700, color: colors.text.primary, lineHeight: 1.2 }}>
      {value}
    </Typography>
    {subValue && (
      <Typography sx={{ fontSize: '0.5625rem', color: colors.text.muted, lineHeight: 1 }}>
        {subValue}
      </Typography>
    )}
    <Typography sx={{ fontSize: '0.625rem', color: colors.text.muted, lineHeight: 1 }}>
      {label}
    </Typography>
  </Box>
);

const getRelativeTime = (isoString: string): string => {
  const now = new Date('2026-02-14T14:00:00Z');
  const then = new Date(isoString);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs} hr ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

// Generate synthetic humidity and wind sparklines from temperature data
const deriveSeries = (sparkline: number[], baseValue: number, variance: number, invert: boolean): number[] => {
  return sparkline.map((t, i) => {
    const normalized = (t - sparkline[0]) / (Math.max(...sparkline) - Math.min(...sparkline) + 1);
    const offset = invert ? -normalized * variance : normalized * variance;
    const noise = Math.sin(i * 0.7) * variance * 0.2;
    return Math.round(baseValue + offset + noise);
  });
};

type ChartTab = 'temperature' | 'humidity' | 'wind';

const CHART_TABS: { key: ChartTab; label: string; unit: string; color: string }[] = [
  { key: 'temperature', label: 'Temp', unit: '\u00B0C', color: colors.error.light },
  { key: 'humidity', label: 'Humidity', unit: '%', color: colors.brand.primary },
  { key: 'wind', label: 'Wind', unit: 'km/h', color: colors.warning.main },
];

const GlobeStationDetail: React.FC<GlobeStationDetailProps> = ({ station, onClose }) => {
  const [activeChart, setActiveChart] = useState<ChartTab>('temperature');

  const badgeStatus = station.status === 'active'
    ? 'online'
    : station.status === 'degraded'
      ? 'degraded'
      : 'offline';

  const labels = useMemo(
    () => Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`),
    [],
  );

  const humiditySeries = useMemo(
    () => deriveSeries(station.sparkline, station.humidity, 15, true),
    [station.sparkline, station.humidity],
  );

  const windSeries = useMemo(
    () => deriveSeries(station.sparkline, station.windSpeed, 8, false),
    [station.sparkline, station.windSpeed],
  );

  const chartDatasets: Record<ChartTab, { data: number[]; borderColor: string; backgroundColor: string }> = useMemo(() => ({
    temperature: {
      data: station.sparkline,
      borderColor: colors.error.light,
      backgroundColor: `${colors.error.light}20`,
    },
    humidity: {
      data: humiditySeries,
      borderColor: colors.brand.primary,
      backgroundColor: `${colors.brand.primary}20`,
    },
    wind: {
      data: windSeries,
      borderColor: colors.warning.main,
      backgroundColor: `${colors.warning.main}20`,
    },
  }), [station.sparkline, humiditySeries, windSeries]);

  const activeDataset = chartDatasets[activeChart];
  const activeTabConfig = CHART_TABS.find((t) => t.key === activeChart)!;

  const chartData = useMemo(() => ({
    labels,
    datasets: [
      {
        data: activeDataset.data,
        borderColor: activeDataset.borderColor,
        backgroundColor: activeDataset.backgroundColor,
        borderWidth: 1.5,
        pointRadius: 0,
        pointHoverRadius: 3,
        fill: true,
        tension: 0.4,
      },
    ],
  }), [labels, activeDataset]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: colors.bg.secondary,
          titleColor: colors.text.primary,
          bodyColor: colors.text.secondary,
          borderColor: colors.border.default,
          borderWidth: 1,
          padding: 8,
          displayColors: false,
          callbacks: {
            label: (ctx: any) => `${ctx.parsed.y}${activeTabConfig.unit}`,
          },
        },
      },
      scales: {
        x: {
          display: true,
          ticks: {
            color: colors.text.muted,
            font: { size: 8 },
            maxTicksLimit: 6,
          },
          grid: { display: false },
        },
        y: {
          display: true,
          ticks: {
            color: colors.text.muted,
            font: { size: 8 },
            maxTicksLimit: 4,
          },
          grid: {
            color: `${colors.border.default}40`,
          },
        },
      },
    }),
    [activeTabConfig.unit],
  );

  const windDirLabel = station.windDirection !== undefined
    ? ['N','NE','E','SE','S','SW','W','NW'][Math.round(station.windDirection / 45) % 8]
    : '';

  return (
    <WrfCard
      title={station.name}
      action={
        <IconButton onClick={onClose} size="small" sx={{ color: colors.text.muted }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      }
      sx={{
        position: 'sticky',
        top: spacing.lg,
      }}
    >
      {/* Status and ID */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: `${spacing.md}px` }}>
        <WrfBadge status={badgeStatus} pulse={station.status === 'active'} />
        <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted, fontFamily: 'monospace' }}>
          {station.id}
        </Typography>
      </Box>

      {/* Location info */}
      <Box sx={{ display: 'flex', gap: `${spacing.md}px`, mb: `${spacing.md}px` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <PlaceIcon sx={{ fontSize: 14, color: colors.text.muted }} />
          <Typography sx={{ fontSize: '0.75rem', color: colors.text.secondary }}>
            {station.lat.toFixed(1)}, {station.lng.toFixed(1)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <TerrainIcon sx={{ fontSize: 14, color: colors.text.muted }} />
          <Typography sx={{ fontSize: '0.75rem', color: colors.text.secondary }}>
            {station.elevation}m
          </Typography>
        </Box>
      </Box>

      {/* Quality Score Gauge */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mb: `${spacing.md}px`,
          py: `${spacing.sm}px`,
          bgcolor: colors.bg.tertiary,
          borderRadius: `${borderRadius.md}px`,
        }}
      >
        <Typography sx={{ fontSize: '0.6875rem', color: colors.text.muted, mb: `${spacing.xs}px`, fontWeight: 500 }}>
          DATA QUALITY SCORE
        </Typography>
        <QualityGauge score={station.qualityScore} />
      </Box>

      {/* Current readings - 2x2 grid */}
      <Grid container spacing={1} sx={{ mb: `${spacing.md}px` }}>
        <Grid size={{ xs: 6 }}>
          <MiniStat
            icon={ThermostatIcon}
            label="Temperature"
            value={`${station.temperature}\u00B0C`}
            color={colors.error.light}
          />
        </Grid>
        <Grid size={{ xs: 6 }}>
          <MiniStat
            icon={WaterDropIcon}
            label="Humidity"
            value={`${station.humidity}%`}
            color={colors.brand.primary}
          />
        </Grid>
        <Grid size={{ xs: 6 }}>
          <MiniStat
            icon={SpeedIcon}
            label="Pressure"
            value={`${station.pressure} hPa`}
            color={colors.success.main}
          />
        </Grid>
        <Grid size={{ xs: 6 }}>
          <MiniStat
            icon={AirIcon}
            label="Wind"
            value={`${station.windSpeed} km/h`}
            color={colors.warning.main}
            subValue={windDirLabel ? `${windDirLabel} (${station.windDirection}\u00B0)` : undefined}
          />
        </Grid>
      </Grid>

      {/* Multi-metric chart with tabs */}
      <Box sx={{ mb: `${spacing.md}px` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: `${spacing.xs}px` }}>
          <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted, fontWeight: 500 }}>
            24-HOUR TREND
          </Typography>
        </Box>
        <Tabs
          value={activeChart}
          onChange={(_e, val: ChartTab) => setActiveChart(val)}
          variant="fullWidth"
          sx={{
            minHeight: 28,
            mb: `${spacing.xs}px`,
            '& .MuiTab-root': {
              minHeight: 28,
              py: 0.5,
              fontSize: '0.6875rem',
              fontWeight: 600,
              color: colors.text.muted,
              textTransform: 'none',
              '&.Mui-selected': {
                color: colors.text.primary,
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: activeTabConfig.color,
              height: 2,
            },
          }}
        >
          {CHART_TABS.map((tab) => (
            <Tab
              key={tab.key}
              value={tab.key}
              label={tab.label}
              sx={{
                '&.Mui-selected': {
                  color: `${tab.color} !important`,
                },
              }}
            />
          ))}
        </Tabs>
        <Box sx={{ height: 100, bgcolor: colors.bg.tertiary, borderRadius: `${borderRadius.md}px`, p: `${spacing.sm}px` }}>
          <Line data={chartData} options={chartOptions} />
        </Box>
      </Box>

      {/* Wind compass indicator */}
      {station.windDirection !== undefined && station.status !== 'offline' && (
        <Box
          sx={{
            mb: `${spacing.md}px`,
            p: `${spacing.sm}px`,
            bgcolor: colors.bg.tertiary,
            borderRadius: `${borderRadius.md}px`,
            display: 'flex',
            alignItems: 'center',
            gap: `${spacing.md}px`,
          }}
        >
          <Box sx={{ flexShrink: 0 }}>
            <svg width="44" height="44" viewBox="0 0 44 44">
              <circle cx="22" cy="22" r="20" fill="none" stroke={colors.border.default} strokeWidth="1" />
              {/* Cardinal direction labels */}
              <text x="22" y="8" textAnchor="middle" fill={colors.text.muted} fontSize="6" fontFamily="sans-serif">N</text>
              <text x="22" y="42" textAnchor="middle" fill={colors.text.muted} fontSize="6" fontFamily="sans-serif">S</text>
              <text x="4" y="24" textAnchor="middle" fill={colors.text.muted} fontSize="6" fontFamily="sans-serif">W</text>
              <text x="40" y="24" textAnchor="middle" fill={colors.text.muted} fontSize="6" fontFamily="sans-serif">E</text>
              {/* Wind direction arrow */}
              <line
                x1="22"
                y1="22"
                x2={22 + Math.sin((station.windDirection * Math.PI) / 180) * 14}
                y2={22 - Math.cos((station.windDirection * Math.PI) / 180) * 14}
                stroke={colors.warning.main}
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="22" cy="22" r="2.5" fill={colors.warning.main} />
            </svg>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.75rem', color: colors.text.secondary, fontWeight: 500 }}>
              Wind Direction
            </Typography>
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: colors.text.primary }}>
              {station.windDirection}&deg; ({windDirLabel})
            </Typography>
            <Typography sx={{ fontSize: '0.6875rem', color: colors.text.muted }}>
              Sustained {station.windSpeed} km/h
            </Typography>
          </Box>
        </Box>
      )}

      {/* Earnings summary */}
      <Box
        sx={{
          mb: `${spacing.md}px`,
          p: `${spacing.sm}px`,
          bgcolor: colors.bg.tertiary,
          borderRadius: `${borderRadius.md}px`,
        }}
      >
        <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted, mb: `${spacing.sm}px`, fontWeight: 500 }}>
          WRF EARNINGS
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: colors.success.main }}>
              {station.earningsToday.toFixed(1)}
            </Typography>
            <Typography sx={{ fontSize: '0.625rem', color: colors.text.muted }}>Today</Typography>
          </Box>
          <Box sx={{ width: 1, bgcolor: colors.border.default, mx: `${spacing.sm}px` }} />
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: colors.text.primary }}>
              {station.earnings7d.toFixed(1)}
            </Typography>
            <Typography sx={{ fontSize: '0.625rem', color: colors.text.muted }}>7-Day</Typography>
          </Box>
          <Box sx={{ width: 1, bgcolor: colors.border.default, mx: `${spacing.sm}px` }} />
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: colors.text.secondary }}>
              ~{station.earningsMonthly}
            </Typography>
            <Typography sx={{ fontSize: '0.625rem', color: colors.text.muted }}>Mo. Proj.</Typography>
          </Box>
        </Box>
      </Box>

      {/* Last seen */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: `${spacing.md}px`,
          p: `${spacing.sm}px`,
          bgcolor: colors.bg.tertiary,
          borderRadius: `${borderRadius.md}px`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <AccessTimeIcon sx={{ fontSize: 14, color: colors.text.muted }} />
          <Typography sx={{ fontSize: '0.75rem', color: colors.text.secondary }}>
            Last data received
          </Typography>
        </Box>
        <Typography
          sx={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: station.status === 'offline' ? colors.error.main : colors.text.primary,
          }}
        >
          {getRelativeTime(station.lastSeen)}
        </Typography>
      </Box>

      {/* Action buttons */}
      <Box sx={{ display: 'flex', gap: `${spacing.sm}px` }}>
        <WrfButton variant="primary" size="sm" sx={{ flex: 1 }}>
          View Full Report
        </WrfButton>
        <WrfButton
          variant={station.status === 'offline' ? 'primary' : 'danger'}
          size="sm"
          sx={{ flex: 1 }}
        >
          {station.status === 'offline' ? 'Connect' : 'Disconnect'}
        </WrfButton>
      </Box>
    </WrfCard>
  );
};

export default GlobeStationDetail;
