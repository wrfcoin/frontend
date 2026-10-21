import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Grid,
} from '@mui/material';
import { TrendingUp, AcUnit, WaterDrop, Grass } from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';

import type { AnnualRecord } from './ClimateReportDashboard';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, ChartTooltip, Legend);

// --- Types ---

interface TrendAnalysisProps {
  data: AnnualRecord[];
}

type TimeRange = '10y' | '30y' | '50y' | 'all';

// --- Helpers ---

function filterByRange(data: AnnualRecord[], range: TimeRange): AnnualRecord[] {
  if (range === 'all') return data;
  const years = range === '10y' ? 10 : range === '30y' ? 30 : 50;
  const cutoff = data[data.length - 1].year - years;
  return data.filter(d => d.year > cutoff);
}

function linearRegression(data: { x: number; y: number }[]): { slope: number; intercept: number } {
  const n = data.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  const sumX = data.reduce((s, d) => s + d.x, 0);
  const sumY = data.reduce((s, d) => s + d.y, 0);
  const sumXY = data.reduce((s, d) => s + d.x * d.y, 0);
  const sumX2 = data.reduce((s, d) => s + d.x * d.x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function stdDev(values: number[]): number {
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const sq = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(sq);
}

// --- Time Range Selector ---

interface RangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

const RangeSelector: React.FC<RangeSelectorProps> = ({ value, onChange }) => (
  <ToggleButtonGroup
    value={value}
    exclusive
    onChange={(_, v) => v && onChange(v)}
    size="small"
    sx={{
      '& .MuiToggleButton-root': {
        color: '#94A3B8',
        borderColor: '#334155',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 12,
        px: 1.5,
        py: 0.5,
        textTransform: 'none',
        '&.Mui-selected': {
          bgcolor: '#3B82F6',
          color: '#F8FAFC',
          '&:hover': { bgcolor: '#2563EB' },
        },
      },
    }}
  >
    <ToggleButton value="10y">10y</ToggleButton>
    <ToggleButton value="30y">30y</ToggleButton>
    <ToggleButton value="50y">50y</ToggleButton>
    <ToggleButton value="all">All</ToggleButton>
  </ToggleButtonGroup>
);

// --- Warming Stripes ---

interface WarmingStripesProps {
  data: AnnualRecord[];
}

const WarmingStripes: React.FC<WarmingStripesProps> = ({ data }) => {
  const temps = data.map(d => d.avgTemp);
  const minT = Math.min(...temps);
  const maxT = Math.max(...temps);
  const range = maxT - minT || 1;

  function tempToColor(temp: number): string {
    const ratio = (temp - minT) / range;
    // Blue (#3B82F6) to Red (#EF4444) gradient
    const r = Math.round(59 + (239 - 59) * ratio);
    const g = Math.round(130 + (68 - 130) * ratio);
    const b = Math.round(246 + (68 - 246) * ratio);
    return `rgb(${r}, ${g}, ${b})`;
  }

  return (
    <Box>
      <Typography
        sx={{
          color: '#94A3B8',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 600,
          fontSize: 13,
          mb: 1,
        }}
      >
        Warming Stripes (a la Ed Hawkins)
      </Typography>
      <Box
        sx={{
          display: 'flex',
          height: 60,
          borderRadius: 1,
          overflow: 'hidden',
          gap: '1px',
        }}
      >
        {data.map(d => (
          <Box
            key={d.year}
            title={`${d.year}: ${d.avgTemp.toFixed(1)}\u00B0C`}
            sx={{
              flex: 1,
              bgcolor: tempToColor(d.avgTemp),
              transition: 'opacity 0.15s',
              '&:hover': { opacity: 0.7 },
            }}
          />
        ))}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
        <Typography sx={{ color: '#64748B', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}>
          {data[0]?.year}
        </Typography>
        <Typography sx={{ color: '#64748B', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}>
          {data[data.length - 1]?.year}
        </Typography>
      </Box>
    </Box>
  );
};

// --- Chart Section ---

interface ChartSectionProps {
  title: string;
  icon: React.ReactNode;
  slopeLabel: string;
  data: AnnualRecord[];
  range: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  getValue: (r: AnnualRecord) => number;
  color: string;
  unit: string;
}

const ChartSection: React.FC<ChartSectionProps> = ({
  title,
  icon,
  slopeLabel,
  data,
  range,
  onRangeChange,
  getValue,
  color,
  unit,
}) => {
  const filtered = useMemo(() => filterByRange(data, range), [data, range]);

  const regression = useMemo(() => {
    const points = filtered.map(d => ({ x: d.year, y: getValue(d) }));
    return linearRegression(points);
  }, [filtered, getValue]);

  const residuals = useMemo(() => {
    const values = filtered.map(d => getValue(d));
    const predicted = filtered.map(d => regression.slope * d.year + regression.intercept);
    const res = values.map((v, i) => v - predicted[i]);
    return stdDev(res);
  }, [filtered, regression, getValue]);

  const slopePerDecade = regression.slope * 10;

  const chartData = {
    labels: filtered.map(d => d.year.toString()),
    datasets: [
      {
        label: title,
        data: filtered.map(d => getValue(d)),
        borderColor: color,
        backgroundColor: `${color}33`,
        pointRadius: 2,
        pointHoverRadius: 5,
        tension: 0.3,
        borderWidth: 2,
        fill: false,
      },
      {
        label: 'Trend',
        data: filtered.map(d => regression.slope * d.year + regression.intercept),
        borderColor: '#F8FAFC',
        borderWidth: 1.5,
        borderDash: [6, 3],
        pointRadius: 0,
        fill: false,
      },
      {
        label: 'Upper CI',
        data: filtered.map(d => regression.slope * d.year + regression.intercept + residuals),
        borderColor: 'transparent',
        backgroundColor: `${color}15`,
        pointRadius: 0,
        fill: '+1',
      },
      {
        label: 'Lower CI',
        data: filtered.map(d => regression.slope * d.year + regression.intercept - residuals),
        borderColor: 'transparent',
        backgroundColor: `${color}15`,
        pointRadius: 0,
        fill: '-1',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1E293B',
        titleColor: '#F8FAFC',
        bodyColor: '#94A3B8',
        titleFont: { family: 'Inter, sans-serif' as const },
        bodyFont: { family: 'JetBrains Mono, monospace' as const },
        borderColor: '#334155',
        borderWidth: 1,
        callbacks: {
          label: (ctx: { dataset: { label?: string }; parsed: { y: number } }) => {
            if (ctx.dataset.label === 'Upper CI' || ctx.dataset.label === 'Lower CI') return '';
            return `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)}${unit}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#64748B', font: { family: 'JetBrains Mono, monospace', size: 10 } },
        grid: { color: '#1E293B' },
      },
      y: {
        ticks: {
          color: '#64748B',
          font: { family: 'JetBrains Mono, monospace', size: 10 },
          callback: (v: string | number) => `${v}${unit}`,
        },
        grid: { color: '#1E293B' },
      },
    },
  };

  return (
    <Paper sx={{ bgcolor: '#0F172A', borderRadius: 2, p: 2.5, border: '1px solid #1E293B' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon}
          <Typography sx={{ color: '#F8FAFC', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 16 }}>
            {title}
          </Typography>
          <Typography
            sx={{
              color: slopePerDecade > 0 ? '#EF4444' : '#3B82F6',
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 600,
              fontSize: 13,
              ml: 1,
            }}
          >
            {slopePerDecade > 0 ? '+' : ''}{slopePerDecade.toFixed(2)} {slopeLabel}
          </Typography>
        </Box>
        <RangeSelector value={range} onChange={onRangeChange} />
      </Box>
      <Box sx={{ height: 260 }}>
        <Line data={chartData} options={options as any} />
      </Box>
    </Paper>
  );
};

// --- Main Component ---

const TrendAnalysis: React.FC<TrendAnalysisProps> = ({ data }) => {
  const [tempRange, setTempRange] = useState<TimeRange>('all');
  const [precipRange, setPrecipRange] = useState<TimeRange>('all');
  const [frostRange, setFrostRange] = useState<TimeRange>('all');

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
        Long-Term Climate Trends
      </Typography>

      <Grid container spacing={2.5}>
        {/* Temperature Trend */}
        <Grid size={{ xs: 12 }}>
          <ChartSection
            title="Annual Average Temperature"
            icon={<TrendingUp sx={{ color: '#EF4444', fontSize: 20 }} />}
            slopeLabel={'\u00B0C/decade'}
            data={data}
            range={tempRange}
            onRangeChange={setTempRange}
            getValue={(r) => r.avgTemp}
            color="#EF4444"
            unit={'\u00B0C'}
          />
        </Grid>

        {/* Warming Stripes */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ bgcolor: '#0F172A', borderRadius: 2, p: 2.5, border: '1px solid #1E293B' }}>
            <WarmingStripes data={data} />
          </Paper>
        </Grid>

        {/* Precipitation Trend */}
        <Grid size={{ xs: 12 }}>
          <ChartSection
            title="Annual Total Precipitation"
            icon={<WaterDrop sx={{ color: '#3B82F6', fontSize: 20 }} />}
            slopeLabel="mm/decade"
            data={data}
            range={precipRange}
            onRangeChange={setPrecipRange}
            getValue={(r) => r.totalPrecip}
            color="#3B82F6"
            unit=" mm"
          />
        </Grid>

        {/* Growing Season Length */}
        <Grid size={{ xs: 12 }}>
          <ChartSection
            title="Growing Season Length (Frost-Free Days)"
            icon={<Grass sx={{ color: '#10B981', fontSize: 20 }} />}
            slopeLabel="days/decade"
            data={data}
            range={frostRange}
            onRangeChange={setFrostRange}
            getValue={(r) => r.frostFreeDays}
            color="#10B981"
            unit=" days"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default TrendAnalysis;
