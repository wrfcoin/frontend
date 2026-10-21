import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
} from '@mui/material';
import {
  Thermostat,
  WaterDrop,
  Sensors,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip as ChartTooltip,
} from 'chart.js';

import type { SeasonData } from './ClimateReportDashboard';

ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTooltip);

// --- Types ---

interface SeasonalSummaryProps {
  data: SeasonData[];
}

// --- Helpers ---

const SEASON_ICONS: Record<string, string> = {
  Spring: '\u{1F331}',
  Summer: '\u{2600}\u{FE0F}',
  Autumn: '\u{1F342}',
  Winter: '\u{2744}\u{FE0F}',
};

const SEASON_COLORS: Record<string, string> = {
  Spring: '#10B981',
  Summer: '#F59E0B',
  Autumn: '#EF4444',
  Winter: '#3B82F6',
};

function tempDepartureColor(departure: number): string {
  if (departure > 0.5) return '#EF4444';
  if (departure < -0.5) return '#10B981';
  return '#94A3B8';
}

function precipDepartureColor(departure: number): string {
  if (departure > 10) return '#3B82F6';
  if (departure < -10) return '#F59E0B';
  return '#94A3B8';
}

function formatDeparture(value: number, unit: string): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}${unit}`;
}

// --- Percentile Mini Chart ---

interface PercentileChartProps {
  percentile: number;
  season: string;
}

const PercentileChart: React.FC<PercentileChartProps> = ({ percentile, season }) => {
  // Build a simple histogram distribution showing where this season falls
  const bins = [5, 10, 18, 25, 30, 25, 18, 12, 7, 4];
  const highlightIdx = Math.min(Math.floor(percentile / 10), 9);

  const data = {
    labels: bins.map((_, i) => `${i * 10}`),
    datasets: [
      {
        data: bins,
        backgroundColor: bins.map((_, i) =>
          i === highlightIdx ? SEASON_COLORS[season] : 'rgba(148, 163, 184, 0.25)',
        ),
        borderRadius: 2,
        barPercentage: 0.9,
        categoryPercentage: 0.9,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { tooltip: { enabled: false }, legend: { display: false } },
    scales: {
      x: { display: false },
      y: { display: false },
    },
  };

  return (
    <Box sx={{ height: 48, width: '100%', mt: 1 }}>
      <Bar data={data} options={options} />
    </Box>
  );
};

// --- Season Card ---

interface SeasonCardProps {
  season: SeasonData;
}

const SeasonCard: React.FC<SeasonCardProps> = ({ season }) => {
  const tempDeparture = season.avgTemp - season.tempNormal;
  const precipDeparture = season.totalPrecip - season.precipNormal;

  return (
    <Paper
      sx={{
        bgcolor: '#0F172A',
        borderRadius: 2,
        p: 2.5,
        border: `1px solid ${SEASON_COLORS[season.season]}33`,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: 22 }}>{SEASON_ICONS[season.season]}</Typography>
          <Typography
            sx={{
              color: SEASON_COLORS[season.season],
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: 18,
            }}
          >
            {season.season}
          </Typography>
        </Box>
        <Chip
          icon={<Sensors sx={{ color: '#94A3B8 !important', fontSize: 14 }} />}
          label={season.stationCount}
          size="small"
          sx={{
            bgcolor: 'rgba(148, 163, 184, 0.1)',
            color: '#94A3B8',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 12,
          }}
        />
      </Box>

      {/* Temperature */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Thermostat sx={{ color: '#EF4444', fontSize: 18 }} />
          <Typography
            sx={{
              color: '#F8FAFC',
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 700,
              fontSize: 20,
            }}
          >
            {season.avgTemp.toFixed(1)}&deg;C
          </Typography>
          <Chip
            size="small"
            icon={
              tempDeparture > 0
                ? <ArrowUpward sx={{ fontSize: 12, color: `${tempDepartureColor(tempDeparture)} !important` }} />
                : <ArrowDownward sx={{ fontSize: 12, color: `${tempDepartureColor(tempDeparture)} !important` }} />
            }
            label={formatDeparture(tempDeparture, '\u00B0C')}
            sx={{
              bgcolor: `${tempDepartureColor(tempDeparture)}22`,
              color: tempDepartureColor(tempDeparture),
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11,
              height: 22,
            }}
          />
        </Box>
        <Typography sx={{ color: '#64748B', fontSize: 11, fontFamily: 'Inter, sans-serif' }}>
          Normal: {season.tempNormal.toFixed(1)}&deg;C
        </Typography>
      </Box>

      {/* Precipitation */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <WaterDrop sx={{ color: '#3B82F6', fontSize: 18 }} />
          <Typography
            sx={{
              color: '#F8FAFC',
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 700,
              fontSize: 20,
            }}
          >
            {season.totalPrecip} mm
          </Typography>
          <Chip
            size="small"
            icon={
              precipDeparture > 0
                ? <ArrowUpward sx={{ fontSize: 12, color: `${precipDepartureColor(precipDeparture)} !important` }} />
                : <ArrowDownward sx={{ fontSize: 12, color: `${precipDepartureColor(precipDeparture)} !important` }} />
            }
            label={formatDeparture(precipDeparture, ' mm')}
            sx={{
              bgcolor: `${precipDepartureColor(precipDeparture)}22`,
              color: precipDepartureColor(precipDeparture),
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11,
              height: 22,
            }}
          />
        </Box>
        <Typography sx={{ color: '#64748B', fontSize: 11, fontFamily: 'Inter, sans-serif' }}>
          Normal: {season.precipNormal} mm
        </Typography>
      </Box>

      {/* Notable Extremes */}
      <Box
        sx={{
          bgcolor: 'rgba(148, 163, 184, 0.06)',
          borderRadius: 1,
          p: 1.5,
          mb: 2,
          flexGrow: 1,
        }}
      >
        <Typography
          sx={{ color: '#94A3B8', fontSize: 11, fontFamily: 'Inter, sans-serif', fontWeight: 600, mb: 1 }}
        >
          Notable Extremes
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ color: '#64748B', fontSize: 11, fontFamily: 'Inter, sans-serif' }}>
              Hottest day
            </Typography>
            <Typography sx={{ color: '#EF4444', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>
              {season.hottestDay.value}&deg;C ({season.hottestDay.date})
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ color: '#64748B', fontSize: 11, fontFamily: 'Inter, sans-serif' }}>
              Coldest night
            </Typography>
            <Typography sx={{ color: '#3B82F6', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>
              {season.coldestNight.value}&deg;C ({season.coldestNight.date})
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ color: '#64748B', fontSize: 11, fontFamily: 'Inter, sans-serif' }}>
              Heaviest rain
            </Typography>
            <Typography sx={{ color: '#3B82F6', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>
              {season.heaviestRainfall.value} mm ({season.heaviestRainfall.date})
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Percentile Distribution */}
      <Box>
        <Typography sx={{ color: '#94A3B8', fontSize: 11, fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
          Historical Percentile: {season.percentile}th
        </Typography>
        <PercentileChart percentile={season.percentile} season={season.season} />
      </Box>
    </Paper>
  );
};

// --- Main Component ---

const SeasonalSummary: React.FC<SeasonalSummaryProps> = ({ data }) => {
  return (
    <Box>
      <Typography
        sx={{
          color: '#F8FAFC',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 700,
          fontSize: 20,
          mb: 2,
        }}
      >
        Seasonal Summary (2024)
      </Typography>
      <Grid container spacing={2.5}>
        {data.map(season => (
          <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={season.season}>
            <SeasonCard season={season} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default SeasonalSummary;
