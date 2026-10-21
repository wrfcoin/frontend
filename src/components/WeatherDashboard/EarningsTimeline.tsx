import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Line } from 'react-chartjs-2';
import { formatBaseUnitsToWrf } from '../../services/apiClient/number';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip as ChartTooltip,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, ChartTooltip);

// --- Types ---

export interface EarningsPoint {
  hour: string;
  wrf: number | null;
  isBonus?: boolean;
  isAchievement?: boolean;
}

export interface EarningsStats {
  today: string | null;
  todayDelta: number | null;
  week: string | null;
  weekDelta: number | null;
  allTime: string | null;
  streakDays: number;
}

interface EarningsTimelineProps {
  dataPoints: EarningsPoint[];
  stats: EarningsStats;
}

// --- Helpers ---

function flameScale(days: number): { size: number; label: string } {
  if (days >= 100) return { size: 32, label: 'INFERNO' };
  if (days >= 50) return { size: 28, label: 'BLAZING' };
  if (days >= 30) return { size: 24, label: 'ON FIRE' };
  if (days >= 14) return { size: 20, label: 'HOT' };
  if (days >= 7) return { size: 18, label: 'WARM' };
  return { size: 16, label: '' };
}

// --- Stat Box Sub-component ---

const StatBox: React.FC<{ label: string; value: string; delta?: number | null; accent?: string }> = ({
  label,
  value,
  delta,
  accent = '#FBBF24',
}) => (
  <Box
    sx={{
      bgcolor: 'rgba(248,250,252,0.03)',
      border: '1px solid rgba(248,250,252,0.06)',
      borderRadius: 2,
      px: 2.5,
      py: 1.5,
      flex: 1,
      minWidth: 130,
    }}
  >
    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, letterSpacing: 0.5 }}>
      {label}
    </Typography>
    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.5 }}>
      <Typography sx={{ color: accent, fontWeight: 800, fontSize: '1.35rem', fontFamily: 'monospace' }}>
        {value}
      </Typography>
      <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 500 }}>
        WRF
      </Typography>
    </Box>
    {delta !== undefined && delta !== null && delta !== 0 && (
      <Typography
        variant="caption"
        sx={{
          color: delta > 0 ? '#22C55E' : '#EF4444',
          fontWeight: 600,
          fontSize: '0.7rem',
        }}
      >
        {delta > 0 ? '+' : ''}{delta}% vs avg
      </Typography>
    )}
  </Box>
);

// --- Component ---

const EarningsTimeline: React.FC<EarningsTimelineProps> = ({ dataPoints, stats }) => {
  const flame = flameScale(stats.streakDays);

  // Build chart
  const chartData = {
    labels: dataPoints.map((p) => p.hour),
    datasets: [
      {
        data: dataPoints.map((p) => p.wrf),
        borderColor: '#FBBF24',
        borderWidth: 2,
        backgroundColor: (ctx: any) => {
          const chart = ctx.chart;
          const { ctx: canvasCtx, chartArea } = chart;
          if (!chartArea) return 'rgba(251,191,36,0.1)';
          const gradient = canvasCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(251,191,36,0.25)');
          gradient.addColorStop(1, 'rgba(251,191,36,0.02)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointRadius: dataPoints.map((p) =>
          p.isBonus || p.isAchievement ? 5 : 0,
        ),
        pointBackgroundColor: dataPoints.map((p) => {
          if (p.isAchievement) return '#A855F7';
          if (p.isBonus) return '#22C55E';
          return '#FBBF24';
        }),
        pointBorderColor: dataPoints.map((p) => {
          if (p.isAchievement) return '#A855F780';
          if (p.isBonus) return '#22C55E80';
          return 'transparent';
        }),
        pointBorderWidth: 3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1E293B',
        titleColor: '#F8FAFC',
        bodyColor: '#CBD5E1',
        borderColor: 'rgba(248,250,252,0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: (ctx: any) => {
            const point = dataPoints[ctx.dataIndex];
            let label = ctx.raw == null ? 'Unavailable' : `${ctx.raw} WRF`;
            if (point.isBonus) label += ' (Quality Bonus)';
            if (point.isAchievement) label += ' (Achievement!)';
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(248,250,252,0.03)' },
        ticks: { color: '#475569', font: { size: 10 }, maxTicksLimit: 12 },
      },
      y: {
        grid: { color: 'rgba(248,250,252,0.03)' },
        ticks: {
          color: '#475569',
          font: { size: 10 },
          callback: (value: any) => `${value} WRF`,
        },
      },
    },
    animation: { duration: 800 } as const,
  };

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
        <Typography variant="subtitle2" sx={{ color: '#F8FAFC', fontWeight: 700, letterSpacing: 0.5 }}>
          EARNINGS TIMELINE
        </Typography>

        {/* Streak display */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            bgcolor: 'rgba(251,191,36,0.08)',
            border: '1px solid rgba(251,191,36,0.2)',
            borderRadius: 2,
            px: 1.5,
            py: 0.5,
          }}
        >
          <Typography sx={{ fontSize: flame.size * 0.6, lineHeight: 1 }}>
            {'\uD83D\uDD25'}
          </Typography>
          <Box>
            <Typography
              sx={{
                color: '#FBBF24',
                fontWeight: 800,
                fontSize: '0.85rem',
                fontFamily: 'monospace',
                lineHeight: 1,
              }}
            >
              {stats.streakDays} DAYS
            </Typography>
            {flame.label && (
              <Typography variant="caption" sx={{ color: '#F59E0B', fontSize: '0.55rem', fontWeight: 700, letterSpacing: 1 }}>
                {flame.label}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      <Box sx={{ p: 2.5 }}>
        {/* Stat Boxes */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: 'wrap' }}>
          <StatBox label="TODAY" value={formatBaseUnitsToWrf(stats.today, 1) ?? '--'} delta={stats.todayDelta} />
          <StatBox label="THIS WEEK" value={formatBaseUnitsToWrf(stats.week, 1) ?? '--'} delta={stats.weekDelta} />
          <StatBox label="ALL TIME" value={formatBaseUnitsToWrf(stats.allTime, 1) ?? '--'} accent="#F8FAFC" />
        </Box>

        {/* Chart Legend */}
        <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22C55E' }} />
            <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.65rem' }}>
              Quality Bonus
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#A855F7' }} />
            <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.65rem' }}>
              Achievement
            </Typography>
          </Box>
        </Box>

        {/* Chart */}
        <Box sx={{ height: 220 }}>
          {dataPoints.length > 0 ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                No contribution history available yet.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default EarningsTimeline;
