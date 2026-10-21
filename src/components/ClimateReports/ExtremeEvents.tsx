import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
} from '@mui/material';
import {
  Whatshot,
  AcUnit,
  Thunderstorm,
  Air,
  LocalFireDepartment,
  SevereCold,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';

import type { AnnualRecord } from './ClimateReportDashboard';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ChartTooltip, Legend);

// --- Types ---

interface ExtremeEventsProps {
  data: AnnualRecord[];
}

// --- Helpers ---

function linearSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const sumX = (n * (n - 1)) / 2;
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
  const sumY = values.reduce((s, v) => s + v, 0);
  const sumXY = values.reduce((s, v, i) => s + i * v, 0);
  return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
}

function findRecordYears(data: AnnualRecord[], getValue: (r: AnnualRecord) => number, findMax: boolean): Set<number> {
  const records = new Set<number>();
  let currentRecord = findMax ? -Infinity : Infinity;
  for (const d of data) {
    const v = getValue(d);
    if ((findMax && v > currentRecord) || (!findMax && v < currentRecord)) {
      currentRecord = v;
      records.add(d.year);
    }
  }
  return records;
}

// --- Extreme Event Bar Chart ---

interface ExtremeChartProps {
  title: string;
  icon: React.ReactNode;
  data: AnnualRecord[];
  getValue: (r: AnnualRecord) => number;
  color: string;
  unit: string;
  trendUp: boolean;
}

const ExtremeChart: React.FC<ExtremeChartProps> = ({
  title,
  icon,
  data,
  getValue,
  color,
  unit,
  trendUp,
}) => {
  const values = useMemo(() => data.map(d => getValue(d)), [data, getValue]);
  const slope = useMemo(() => linearSlope(values), [values]);
  const slopePerDecade = slope * 10;
  const recordYears = useMemo(
    () => findRecordYears(data, getValue, trendUp),
    [data, getValue, trendUp],
  );

  const trendLine = useMemo(() => {
    const reg = values.map((_, i) => {
      const n = values.length;
      const sumX = (n * (n - 1)) / 2;
      const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
      const sumY = values.reduce((s, v) => s + v, 0);
      const sumXY = values.reduce((s, v, idx) => s + idx * v, 0);
      const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const b = (sumY - m * sumX) / n;
      return m * i + b;
    });
    return reg;
  }, [values]);

  const chartData = {
    labels: data.map(d => d.year.toString()),
    datasets: [
      {
        type: 'bar' as const,
        label: title,
        data: values,
        backgroundColor: data.map(d =>
          recordYears.has(d.year) ? '#F59E0B' : `${color}CC`,
        ),
        borderColor: data.map(d =>
          recordYears.has(d.year) ? '#F59E0B' : color,
        ),
        borderWidth: 1,
        borderRadius: 2,
      },
      {
        type: 'line' as const,
        label: 'Trend',
        data: trendLine,
        borderColor: '#F8FAFC',
        borderWidth: 1.5,
        borderDash: [6, 3],
        pointRadius: 0,
        fill: false,
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
          afterLabel: (ctx: { dataIndex: number }) => {
            const year = data[ctx.dataIndex]?.year;
            return recordYears.has(year) ? 'RECORD' : '';
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#64748B', font: { family: 'JetBrains Mono, monospace', size: 10 }, maxRotation: 45 },
        grid: { color: '#1E293B' },
      },
      y: {
        ticks: {
          color: '#64748B',
          font: { family: 'JetBrains Mono, monospace', size: 10 },
          callback: (v: string | number) => `${v}${unit}`,
        },
        grid: { color: '#1E293B' },
        beginAtZero: true,
      },
    },
  };

  return (
    <Paper sx={{ bgcolor: '#0F172A', borderRadius: 2, p: 2.5, border: '1px solid #1E293B', height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon}
          <Typography sx={{ color: '#F8FAFC', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 14 }}>
            {title}
          </Typography>
        </Box>
        <Chip
          icon={
            slopePerDecade > 0
              ? <TrendingUp sx={{ fontSize: 14, color: (trendUp ? '#EF4444' : '#10B981') + ' !important' }} />
              : <TrendingDown sx={{ fontSize: 14, color: (trendUp ? '#10B981' : '#EF4444') + ' !important' }} />
          }
          label={`${slopePerDecade > 0 ? '+' : ''}${slopePerDecade.toFixed(1)} ${unit}/decade`}
          size="small"
          sx={{
            bgcolor: 'rgba(148, 163, 184, 0.1)',
            color: '#94A3B8',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
          }}
        />
      </Box>
      <Box sx={{ height: 220 }}>
        <Bar data={chartData as any} options={options as any} />
      </Box>
      <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 12, height: 12, bgcolor: '#F59E0B', borderRadius: 0.5 }} />
        <Typography sx={{ color: '#64748B', fontSize: 10, fontFamily: 'Inter, sans-serif' }}>
          Record-breaking year
        </Typography>
      </Box>
    </Paper>
  );
};

// --- Climate Change Indicators ---

interface IndicatorChartProps {
  title: string;
  data: AnnualRecord[];
  getValue: (r: AnnualRecord) => number;
  color: string;
  unit: string;
}

const IndicatorChart: React.FC<IndicatorChartProps> = ({ title, data, getValue, color, unit }) => {
  const chartData = {
    labels: data.map(d => d.year.toString()),
    datasets: [
      {
        label: title,
        data: data.map(d => getValue(d)),
        borderColor: color,
        backgroundColor: `${color}33`,
        pointRadius: 2,
        pointHoverRadius: 5,
        tension: 0.3,
        borderWidth: 2,
        fill: true,
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
    <Paper sx={{ bgcolor: '#0F172A', borderRadius: 2, p: 2.5, border: '1px solid #1E293B', height: '100%' }}>
      <Typography sx={{ color: '#F8FAFC', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 14, mb: 2 }}>
        {title}
      </Typography>
      <Box sx={{ height: 200 }}>
        <Line data={chartData} options={options as any} />
      </Box>
    </Paper>
  );
};

// --- SPI Chart (special: red/blue bars) ---

interface SPIChartProps {
  data: AnnualRecord[];
}

const SPIChart: React.FC<SPIChartProps> = ({ data }) => {
  const chartData = {
    labels: data.map(d => d.year.toString()),
    datasets: [
      {
        label: 'SPI Index',
        data: data.map(d => d.spiIndex),
        backgroundColor: data.map(d =>
          d.spiIndex >= 0 ? 'rgba(59, 130, 246, 0.7)' : 'rgba(239, 68, 68, 0.7)',
        ),
        borderColor: data.map(d =>
          d.spiIndex >= 0 ? '#3B82F6' : '#EF4444',
        ),
        borderWidth: 1,
        borderRadius: 2,
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
      },
    },
    scales: {
      x: {
        ticks: { color: '#64748B', font: { family: 'JetBrains Mono, monospace', size: 10 } },
        grid: { color: '#1E293B' },
      },
      y: {
        ticks: { color: '#64748B', font: { family: 'JetBrains Mono, monospace', size: 10 } },
        grid: { color: '#1E293B' },
      },
    },
  };

  return (
    <Paper sx={{ bgcolor: '#0F172A', borderRadius: 2, p: 2.5, border: '1px solid #1E293B', height: '100%' }}>
      <Typography sx={{ color: '#F8FAFC', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 14, mb: 1 }}>
        Standardized Precipitation Index (SPI)
      </Typography>
      <Typography sx={{ color: '#64748B', fontSize: 11, fontFamily: 'Inter, sans-serif', mb: 2 }}>
        Blue = wet conditions, Red = drought conditions
      </Typography>
      <Box sx={{ height: 200 }}>
        <Bar data={chartData} options={options as any} />
      </Box>
    </Paper>
  );
};

// --- Main Component ---

const ExtremeEvents: React.FC<ExtremeEventsProps> = ({ data }) => {
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
        Extreme Weather Frequency Analysis
      </Typography>

      <Grid container spacing={2.5}>
        {/* Days above 35C */}
        <Grid size={{ xs: 12, md: 6 }}>
          <ExtremeChart
            title="Days Above 35\u00B0C"
            icon={<Whatshot sx={{ color: '#EF4444', fontSize: 20 }} />}
            data={data}
            getValue={(r) => r.daysAbove35}
            color="#EF4444"
            unit=" days"
            trendUp={true}
          />
        </Grid>

        {/* Days below -10C */}
        <Grid size={{ xs: 12, md: 6 }}>
          <ExtremeChart
            title="Days Below -10\u00B0C"
            icon={<AcUnit sx={{ color: '#3B82F6', fontSize: 20 }} />}
            data={data}
            getValue={(r) => r.daysBelow10}
            color="#3B82F6"
            unit=" days"
            trendUp={false}
          />
        </Grid>

        {/* Heavy precipitation days */}
        <Grid size={{ xs: 12, md: 6 }}>
          <ExtremeChart
            title="Days with >50mm Precipitation"
            icon={<Thunderstorm sx={{ color: '#8B5CF6', fontSize: 20 }} />}
            data={data}
            getValue={(r) => r.daysHeavyPrecip}
            color="#8B5CF6"
            unit=" days"
            trendUp={true}
          />
        </Grid>

        {/* High wind days */}
        <Grid size={{ xs: 12, md: 6 }}>
          <ExtremeChart
            title="Days with >80km/h Wind"
            icon={<Air sx={{ color: '#06B6D4', fontSize: 20 }} />}
            data={data}
            getValue={(r) => r.daysHighWind}
            color="#06B6D4"
            unit=" days"
            trendUp={true}
          />
        </Grid>
      </Grid>

      {/* Climate Change Indicators */}
      <Typography
        sx={{
          color: '#F8FAFC',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 700,
          fontSize: 18,
          mt: 4,
          mb: 2,
        }}
      >
        Climate Change Indicators
      </Typography>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 4 }}>
          <IndicatorChart
            title="Heating Degree Days"
            data={data}
            getValue={(r) => r.heatingDegreeDays}
            color="#3B82F6"
            unit=""
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <IndicatorChart
            title="Cooling Degree Days"
            data={data}
            getValue={(r) => r.coolingDegreeDays}
            color="#EF4444"
            unit=""
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <SPIChart data={data} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ExtremeEvents;
