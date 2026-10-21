import React, { useMemo } from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

// --- Types ---

export interface DimensionScore {
  range: number;
  temporal: number;
  spatial: number;
  crossParameter: number;
}

interface QualityRadarProps {
  scores: DimensionScore;
  previousScores?: DimensionScore;
  stationName?: string;
}

// --- Helpers ---

const DIMENSION_LABELS = [
  'Range Validation',
  'Temporal Consistency',
  'Spatial Consensus',
  'Cross-Parameter',
];

function getColorForScore(score: number): string {
  if (score > 80) return '#10B981';
  if (score >= 60) return '#F59E0B';
  return '#EF4444';
}

function getLabel(score: number): string {
  if (score > 80) return 'Good';
  if (score >= 60) return 'Fair';
  return 'Low';
}

function scoresToArray(s: DimensionScore): number[] {
  return [s.range, s.temporal, s.spatial, s.crossParameter];
}

// --- Component ---

const QualityRadar: React.FC<QualityRadarProps> = ({
  scores,
  previousScores,
  stationName,
}) => {
  const currentArr = useMemo(() => scoresToArray(scores), [scores]);
  const previousArr = useMemo(
    () => (previousScores ? scoresToArray(previousScores) : null),
    [previousScores],
  );

  const data = useMemo(
    () => ({
      labels: DIMENSION_LABELS,
      datasets: [
        {
          label: 'Current',
          data: currentArr,
          backgroundColor: 'rgba(59,130,246,0.20)',
          borderColor: '#3B82F6',
          borderWidth: 2,
          pointBackgroundColor: currentArr.map(getColorForScore),
          pointBorderColor: currentArr.map(getColorForScore),
          pointRadius: 5,
          pointHoverRadius: 7,
        },
        ...(previousArr
          ? [
            {
              label: 'Previous Period',
              data: previousArr,
              backgroundColor: 'rgba(148,163,184,0.08)',
              borderColor: 'rgba(148,163,184,0.40)',
              borderWidth: 1,
              borderDash: [4, 4] as number[],
              pointBackgroundColor: 'rgba(148,163,184,0.40)',
              pointBorderColor: 'rgba(148,163,184,0.40)',
              pointRadius: 3,
              pointHoverRadius: 5,
            },
          ]
          : []),
      ],
    }),
    [currentArr, previousArr],
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          beginAtZero: true,
          min: 0,
          max: 100,
          ticks: {
            stepSize: 20,
            color: '#64748B',
            backdropColor: 'transparent',
            font: { size: 10 },
          },
          grid: {
            color: 'rgba(148,163,184,0.12)',
            circular: true,
          },
          angleLines: {
            color: 'rgba(148,163,184,0.12)',
          },
          pointLabels: {
            color: '#CBD5E1',
            font: { size: 12, weight: 600 as const },
            padding: 12,
          },
        },
      },
      plugins: {
        legend: {
          display: !!previousArr,
          position: 'bottom' as const,
          labels: {
            color: '#94A3B8',
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 16,
            font: { size: 11 },
          },
        },
        tooltip: {
          backgroundColor: '#1E293B',
          titleColor: '#F8FAFC',
          bodyColor: '#CBD5E1',
          borderColor: 'rgba(248,250,252,0.10)',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: (ctx: any) => `${ctx.dataset.label}: ${ctx.raw}/100`,
          },
        },
      },
      animation: {
        duration: 800,
      },
    }),
    [previousArr],
  );

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: '#1E293B',
        borderRadius: 3,
        border: '1px solid rgba(248,250,252,0.06)',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          borderBottom: '1px solid rgba(248,250,252,0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{ color: '#F8FAFC', fontWeight: 700, letterSpacing: 0.5 }}
        >
          QUALITY DIMENSIONS
        </Typography>
        {stationName && (
          <Typography variant="caption" sx={{ color: '#64748B' }}>
            {stationName}
          </Typography>
        )}
      </Box>

      {/* Chart */}
      <Box sx={{ flex: 1, p: 2, minHeight: 280 }}>
        <Radar data={data} options={options} />
      </Box>

      {/* Dimension Summary Chips */}
      <Box
        sx={{
          px: 2.5,
          pb: 2,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          justifyContent: 'center',
        }}
      >
        {DIMENSION_LABELS.map((label, i) => {
          const score = currentArr[i];
          const color = getColorForScore(score);
          const statusLabel = getLabel(score);
          return (
            <Chip
              key={label}
              label={`${label}: ${score}`}
              size="small"
              sx={{
                bgcolor: `${color}18`,
                color,
                border: `1px solid ${color}30`,
                fontWeight: 600,
                fontSize: '0.7rem',
                '& .MuiChip-label': { px: 1.5 },
              }}
              title={`${label}: ${score}/100 - ${statusLabel}`}
            />
          );
        })}
      </Box>
    </Paper>
  );
};

export default QualityRadar;
