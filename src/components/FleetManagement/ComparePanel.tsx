import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import type { FleetStation } from './StationCard';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  ChartTooltip,
  Legend,
);

// --- Types ---

interface ComparePanelProps {
  stations: FleetStation[];
  onClose: () => void;
  onRemoveStation: (id: string) => void;
}

// --- Helpers ---

const COMPARE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#A855F7'];

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumX2 += x[i] * x[i];
    sumY2 += y[i] * y[i];
  }

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY),
  );

  if (denominator === 0) return 0;
  return numerator / denominator;
}

function generateTimeLabels(): string[] {
  const labels: string[] = [];
  const now = new Date();
  for (let i = 59; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 60_000);
    if (i % 10 === 0) {
      labels.push(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
    } else {
      labels.push('');
    }
  }
  return labels;
}

// --- Component ---

const ComparePanel: React.FC<ComparePanelProps> = ({ stations, onClose, onRemoveStation }) => {
  const timeLabels = useMemo(() => generateTimeLabels(), []);

  // Synchronized temperature chart data
  const tempChartData = useMemo(() => ({
    labels: timeLabels,
    datasets: stations.map((station, i) => ({
      label: station.name,
      data: station.lastHourTemps,
      borderColor: COMPARE_COLORS[i % COMPARE_COLORS.length],
      backgroundColor: `${COMPARE_COLORS[i % COMPARE_COLORS.length]}20`,
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 4,
      tension: 0.3,
      fill: false,
    })),
  }), [stations, timeLabels]);

  const tempChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: '#94A3B8',
          font: { size: 11, family: '"Inter", sans-serif' },
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: '#1E293B',
        titleColor: '#F8FAFC',
        bodyColor: '#CBD5E1',
        borderColor: 'rgba(248,250,252,0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        bodyFont: { family: '"JetBrains Mono", monospace', size: 11 },
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: ${ctx.raw?.toFixed(1) ?? '--'}°C`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(248,250,252,0.03)' },
        ticks: { color: '#475569', font: { size: 10 }, maxRotation: 0 },
      },
      y: {
        grid: { color: 'rgba(248,250,252,0.03)' },
        ticks: {
          color: '#475569',
          font: { size: 10, family: '"JetBrains Mono", monospace' },
          callback: (value: any) => `${value}°C`,
        },
      },
    },
    animation: { duration: 600 } as const,
  }), []);

  // Quality comparison bar chart
  const qualityChartData = useMemo(() => ({
    labels: stations.map((s) => s.name),
    datasets: [
      {
        label: 'Quality Score',
        data: stations.map((s) => s.qualityScore),
        backgroundColor: stations.map((_, i) => `${COMPARE_COLORS[i % COMPARE_COLORS.length]}80`),
        borderColor: stations.map((_, i) => COMPARE_COLORS[i % COMPARE_COLORS.length]),
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  }), [stations]);

  const qualityChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1E293B',
        titleColor: '#F8FAFC',
        bodyColor: '#CBD5E1',
        borderColor: 'rgba(248,250,252,0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        bodyFont: { family: '"JetBrains Mono", monospace', size: 11 },
      },
    },
    scales: {
      x: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(248,250,252,0.03)' },
        ticks: { color: '#475569', font: { size: 10 } },
      },
      y: {
        grid: { display: false },
        ticks: {
          color: '#CBD5E1',
          font: { size: 11, family: '"Inter", sans-serif' },
        },
      },
    },
  }), []);

  // Correlation matrix
  const correlations = useMemo(() => {
    const pairs: { a: string; b: string; r: number }[] = [];
    for (let i = 0; i < stations.length; i++) {
      for (let j = i + 1; j < stations.length; j++) {
        const r = pearsonCorrelation(
          stations[i].lastHourTemps,
          stations[j].lastHourTemps,
        );
        pairs.push({
          a: stations[i].name,
          b: stations[j].name,
          r,
        });
      }
    }
    return pairs;
  }, [stations]);

  // Earnings benchmark
  const maxEarnings = Math.max(...stations.map((s) => s.earningsToday), 1);

  if (stations.length < 2) {
    return (
      <Paper
        elevation={0}
        sx={{
          bgcolor: '#1E293B',
          borderRadius: 3,
          border: '1px solid rgba(248,250,252,0.06)',
          p: 4,
          textAlign: 'center',
        }}
      >
        <Typography sx={{ color: '#64748B', fontSize: '0.9rem' }}>
          Select at least 2 stations to compare (up to 4).
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: '#1E293B',
        borderRadius: 3,
        border: '1px solid rgba(248,250,252,0.06)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          borderBottom: '1px solid rgba(248,250,252,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography
            variant="subtitle2"
            sx={{ color: '#F8FAFC', fontWeight: 700, letterSpacing: 0.5 }}
          >
            STATION COMPARISON
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            {stations.map((s, i) => (
              <Chip
                key={s.id}
                label={s.name}
                size="small"
                onDelete={() => onRemoveStation(s.id)}
                sx={{
                  height: 24,
                  bgcolor: `${COMPARE_COLORS[i % COMPARE_COLORS.length]}20`,
                  color: COMPARE_COLORS[i % COMPARE_COLORS.length],
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  border: `1px solid ${COMPARE_COLORS[i % COMPARE_COLORS.length]}40`,
                  '& .MuiChip-label': { px: 1 },
                  '& .MuiChip-deleteIcon': {
                    color: `${COMPARE_COLORS[i % COMPARE_COLORS.length]}80`,
                    fontSize: 16,
                    '&:hover': { color: COMPARE_COLORS[i % COMPARE_COLORS.length] },
                  },
                }}
              />
            ))}
          </Box>
        </Box>
        <Tooltip title="Close comparison">
          <IconButton
            size="small"
            onClick={onClose}
            sx={{ color: '#64748B', '&:hover': { color: '#F8FAFC' } }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* Temperature time-series */}
        <Box>
          <Typography
            variant="caption"
            sx={{ color: '#94A3B8', fontWeight: 600, letterSpacing: 0.5, mb: 1, display: 'block' }}
          >
            TEMPERATURE (LAST HOUR)
          </Typography>
          <Box sx={{ height: 220 }}>
            <Line data={tempChartData} options={tempChartOptions} />
          </Box>
        </Box>

        {/* Quality + Earnings side by side */}
        <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap' }}>
          {/* Quality bars */}
          <Box sx={{ flex: 1, minWidth: 280 }}>
            <Typography
              variant="caption"
              sx={{ color: '#94A3B8', fontWeight: 600, letterSpacing: 0.5, mb: 1, display: 'block' }}
            >
              QUALITY SCORE
            </Typography>
            <Box sx={{ height: 28 * stations.length + 40 }}>
              <Bar data={qualityChartData} options={qualityChartOptions} />
            </Box>
          </Box>

          {/* Earnings benchmark */}
          <Box sx={{ flex: 1, minWidth: 280 }}>
            <Typography
              variant="caption"
              sx={{ color: '#94A3B8', fontWeight: 600, letterSpacing: 0.5, mb: 1, display: 'block' }}
            >
              EARNINGS TODAY (WRF)
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {stations.map((s, i) => {
                const pct = (s.earningsToday / maxEarnings) * 100;
                return (
                  <Box key={s.id}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                      <Typography
                        variant="caption"
                        sx={{ color: '#CBD5E1', fontSize: '0.72rem', fontWeight: 600 }}
                      >
                        {s.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#FBBF24',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          fontFamily: '"JetBrains Mono", monospace',
                        }}
                      >
                        {s.earningsToday.toFixed(1)}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        height: 8,
                        bgcolor: 'rgba(248,250,252,0.04)',
                        borderRadius: 4,
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          height: '100%',
                          width: `${pct}%`,
                          bgcolor: COMPARE_COLORS[i % COMPARE_COLORS.length],
                          borderRadius: 4,
                          transition: 'width 0.5s ease',
                        }}
                      />
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>

        {/* Correlation pairs */}
        {correlations.length > 0 && (
          <Box>
            <Typography
              variant="caption"
              sx={{ color: '#94A3B8', fontWeight: 600, letterSpacing: 0.5, mb: 1, display: 'block' }}
            >
              TEMPERATURE CORRELATION
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              {correlations.map((pair, i) => {
                const absR = Math.abs(pair.r);
                const color =
                  absR >= 0.8 ? '#10B981' : absR >= 0.5 ? '#F59E0B' : '#EF4444';
                const label =
                  absR >= 0.8 ? 'Strong' : absR >= 0.5 ? 'Moderate' : 'Weak';

                return (
                  <Box
                    key={i}
                    sx={{
                      bgcolor: 'rgba(248,250,252,0.03)',
                      border: '1px solid rgba(248,250,252,0.06)',
                      borderRadius: 2,
                      px: 2,
                      py: 1.25,
                      flex: '1 1 auto',
                      minWidth: 200,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ color: '#64748B', fontSize: '0.65rem', display: 'block' }}
                    >
                      {pair.a} vs {pair.b}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.25 }}>
                      <Typography
                        sx={{
                          color,
                          fontWeight: 800,
                          fontSize: '1.1rem',
                          fontFamily: '"JetBrains Mono", monospace',
                        }}
                      >
                        r = {pair.r.toFixed(3)}
                      </Typography>
                      <Chip
                        label={label}
                        size="small"
                        sx={{
                          height: 18,
                          bgcolor: `${color}15`,
                          color,
                          fontWeight: 700,
                          fontSize: '0.55rem',
                          border: `1px solid ${color}30`,
                          '& .MuiChip-label': { px: 0.75 },
                        }}
                      />
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default ComparePanel;
