import React from 'react';
import { Box, Typography, Paper, LinearProgress, Button } from '@mui/material';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';

ChartJS.register(ArcElement, Tooltip);

// --- Types ---

export interface QualityDimension {
  key: string;
  label: string;
  score: number;
  color: string;
}

export interface QualityData {
  overall: number;
  dimensions: QualityDimension[];
}

interface QualityMonitorProps {
  quality: QualityData;
  onViewBreakdown?: () => void;
}

// --- Helpers ---

function getQualityMessage(score: number): { text: string; color: string } {
  if (score >= 95) return { text: 'Exceptional \u2014 Top-tier data quality', color: '#22C55E' };
  if (score >= 85) return { text: 'Strong \u2014 Excellent contributor', color: '#3B82F6' };
  if (score >= 70) return { text: 'Good \u2014 Room for improvement', color: '#FACC15' };
  if (score >= 50) return { text: 'Fair \u2014 Check sensor calibration', color: '#F97316' };
  return { text: 'Needs Attention \u2014 Review station setup', color: '#EF4444' };
}

function getScoreGrade(score: number): string {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'A-';
  if (score >= 80) return 'B+';
  if (score >= 75) return 'B';
  if (score >= 70) return 'B-';
  if (score >= 60) return 'C';
  return 'D';
}

// --- Component ---

const QualityMonitor: React.FC<QualityMonitorProps> = ({ quality, onViewBreakdown }) => {
  const message = getQualityMessage(quality.overall);
  const grade = getScoreGrade(quality.overall);

  // Build donut chart: 4 dimension segments + remaining gap to 400
  const dimensionTotal = quality.dimensions.reduce((s, d) => s + d.score, 0);
  const gap = Math.max(0, 400 - dimensionTotal);

  const chartData = {
    labels: [...quality.dimensions.map((d) => d.label), ''],
    datasets: [
      {
        data: [...quality.dimensions.map((d) => d.score), gap],
        backgroundColor: [
          ...quality.dimensions.map((d) => d.color),
          'rgba(248,250,252,0.04)',
        ],
        borderWidth: 0,
        cutout: '78%',
        borderRadius: 4,
        spacing: 3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (ctx: any) => {
            if (ctx.dataIndex >= quality.dimensions.length) return '';
            return `${ctx.label}: ${ctx.raw}/100`;
          },
        },
      },
    },
    animation: { animateRotate: true, duration: 1200 } as const,
  };

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
        }}
      >
        <Typography variant="subtitle2" sx={{ color: '#F8FAFC', fontWeight: 700, letterSpacing: 0.5 }}>
          QUALITY MONITOR
        </Typography>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2.5, gap: 2.5 }}>
        {/* Donut Chart with center text */}
        <Box sx={{ position: 'relative', width: '100%', height: 200, mx: 'auto' }}>
          <Doughnut data={chartData} options={chartOptions} />
          {/* Center overlay */}
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
                color: message.color,
                fontWeight: 800,
                fontSize: '2rem',
                lineHeight: 1,
                fontFamily: 'monospace',
              }}
            >
              {quality.overall}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
              {grade}
            </Typography>
          </Box>
        </Box>

        {/* Dimension Breakdowns */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {quality.dimensions.length === 0 && (
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Quality metrics are currently unavailable for this station.
            </Typography>
          )}
          {quality.dimensions.map((dim) => (
            <Box key={dim.key}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: dim.color }}
                  />
                  <Typography variant="caption" sx={{ color: '#CBD5E1', fontWeight: 500 }}>
                    {dim.label}
                  </Typography>
                </Box>
                <Typography
                  variant="caption"
                  sx={{ color: dim.color, fontWeight: 700, fontFamily: 'monospace' }}
                >
                  {dim.score}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={dim.score}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  bgcolor: 'rgba(248,250,252,0.06)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: dim.color,
                    borderRadius: 2,
                  },
                }}
              />
            </Box>
          ))}
        </Box>

        {/* Contextual message */}
        <Box
          sx={{
            bgcolor: `${message.color}10`,
            border: `1px solid ${message.color}25`,
            borderRadius: 2,
            px: 2,
            py: 1,
            textAlign: 'center',
          }}
        >
          <Typography variant="caption" sx={{ color: message.color, fontWeight: 600 }}>
            {message.text}
          </Typography>
        </Box>

        {/* Breakdown link */}
        {onViewBreakdown && (
          <Button
            onClick={onViewBreakdown}
            size="small"
            sx={{
              color: '#60A5FA',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.75rem',
              alignSelf: 'center',
              '&:hover': { bgcolor: 'rgba(96,165,250,0.08)' },
            }}
          >
            View detailed breakdown
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default QualityMonitor;
