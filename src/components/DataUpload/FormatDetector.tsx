import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Switch,
  LinearProgress,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Analytics as AnalyticsIcon,
  CalendarMonth as CalendarIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import ColumnMapper, { ColumnMapping } from './ColumnMapper';

// --- Types ---

export interface DetectedFormat {
  name: string;
  confidence: number;
  recordCount: number;
  dateRange: { start: string; end: string };
  columns: string[];
}

export interface QualityPreview {
  estimatedScore: number;
  gapsDetected: number;
  anomaliesFlagged: number;
}

export interface FormatDetectorProps {
  format: DetectedFormat;
  quality: QualityPreview;
  mappings: ColumnMapping[];
  onMappingsChange: (mappings: ColumnMapping[]) => void;
  useMetric: boolean;
  onUnitToggle: (metric: boolean) => void;
}

// (mock data removed — format/quality data returned by upload API)

// --- Helpers ---

function scoreColor(score: number): string {
  if (score >= 80) return '#10B981';
  if (score >= 60) return '#F59E0B';
  return '#EF4444';
}

// --- Component ---

const FormatDetector: React.FC<FormatDetectorProps> = ({
  format,
  quality,
  mappings,
  onMappingsChange,
  useMetric,
  onUnitToggle,
}) => {
  const confidencePct = Math.round(format.confidence * 100);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Format detection summary */}
      <Paper
        elevation={0}
        sx={{
          bgcolor: '#1E293B',
          borderRadius: 3,
          border: '1px solid rgba(59,130,246,0.15)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: '1px solid rgba(248,250,252,0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AnalyticsIcon sx={{ color: '#3B82F6', fontSize: 22 }} />
            <Typography sx={{ color: '#F8FAFC', fontWeight: 700, fontSize: '0.95rem' }}>
              Format Detection
            </Typography>
          </Box>

          {/* Unit toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ color: useMetric ? '#64748B' : '#F8FAFC', fontSize: '0.75rem', fontWeight: 600 }}>
              Imperial
            </Typography>
            <Switch
              checked={useMetric}
              onChange={(_, checked) => onUnitToggle(checked)}
              size="small"
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': { color: '#3B82F6' },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  bgcolor: 'rgba(59,130,246,0.4)',
                },
                '& .MuiSwitch-track': { bgcolor: 'rgba(248,250,252,0.15)' },
              }}
            />
            <Typography sx={{ color: useMetric ? '#F8FAFC' : '#64748B', fontSize: '0.75rem', fontWeight: 600 }}>
              Metric
            </Typography>
          </Box>
        </Box>

        {/* Summary cards */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 2,
            p: 3,
          }}
        >
          {/* Detected format */}
          <Paper
            elevation={0}
            sx={{
              bgcolor: 'rgba(15,23,42,0.5)',
              borderRadius: 2,
              p: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <StorageIcon sx={{ color: '#94A3B8', fontSize: 16 }} />
              <Typography sx={{ color: '#64748B', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Detected Format
              </Typography>
            </Box>
            <Typography sx={{ color: '#F8FAFC', fontSize: '1rem', fontWeight: 700, mb: 0.5 }}>
              {format.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                icon={
                  confidencePct >= 85
                    ? <CheckCircleIcon sx={{ fontSize: 14 }} />
                    : <WarningIcon sx={{ fontSize: 14 }} />
                }
                label={`${confidencePct}% confidence`}
                size="small"
                sx={{
                  height: 22,
                  bgcolor:
                    confidencePct >= 85
                      ? 'rgba(16,185,129,0.15)'
                      : 'rgba(245,158,11,0.15)',
                  color: confidencePct >= 85 ? '#10B981' : '#F59E0B',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  '& .MuiChip-icon': {
                    color: confidencePct >= 85 ? '#10B981' : '#F59E0B',
                  },
                  '& .MuiChip-label': { px: 0.75 },
                }}
              />
            </Box>
          </Paper>

          {/* Record count */}
          <Paper
            elevation={0}
            sx={{
              bgcolor: 'rgba(15,23,42,0.5)',
              borderRadius: 2,
              p: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <StorageIcon sx={{ color: '#94A3B8', fontSize: 16 }} />
              <Typography sx={{ color: '#64748B', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Records Found
              </Typography>
            </Box>
            <Typography
              sx={{
                color: '#F8FAFC',
                fontSize: '1.3rem',
                fontWeight: 800,
                fontFamily: '"JetBrains Mono", monospace',
              }}
            >
              {format.recordCount.toLocaleString()}
            </Typography>
          </Paper>

          {/* Date range */}
          <Paper
            elevation={0}
            sx={{
              bgcolor: 'rgba(15,23,42,0.5)',
              borderRadius: 2,
              p: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CalendarIcon sx={{ color: '#94A3B8', fontSize: 16 }} />
              <Typography sx={{ color: '#64748B', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Date Range
              </Typography>
            </Box>
            <Typography sx={{ color: '#F8FAFC', fontSize: '0.88rem', fontWeight: 600, fontFamily: '"JetBrains Mono", monospace' }}>
              {format.dateRange.start}
            </Typography>
            <Typography sx={{ color: '#64748B', fontSize: '0.72rem' }}>
              to {format.dateRange.end}
            </Typography>
          </Paper>
        </Box>
      </Paper>

      {/* Column mapping */}
      <ColumnMapper
        mappings={mappings}
        onMappingsChange={onMappingsChange}
        useMetric={useMetric}
      />

      {/* Quality preview */}
      <Paper
        elevation={0}
        sx={{
          bgcolor: '#1E293B',
          borderRadius: 3,
          border: '1px solid rgba(59,130,246,0.15)',
          p: 3,
        }}
      >
        <Typography sx={{ color: '#F8FAFC', fontWeight: 700, fontSize: '0.95rem', mb: 2 }}>
          Data Quality Preview
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
          {/* Estimated score */}
          <Box>
            <Typography sx={{ color: '#64748B', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.75 }}>
              Estimated Quality Score
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <Typography
                sx={{
                  color: scoreColor(quality.estimatedScore),
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  fontFamily: '"JetBrains Mono", monospace',
                }}
              >
                {quality.estimatedScore.toFixed(1)}
              </Typography>
              <Typography sx={{ color: '#64748B', fontSize: '0.75rem' }}>/ 100</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={quality.estimatedScore}
              sx={{
                mt: 1,
                height: 6,
                borderRadius: 3,
                bgcolor: 'rgba(248,250,252,0.06)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  bgcolor: scoreColor(quality.estimatedScore),
                },
              }}
            />
          </Box>

          {/* Gaps */}
          <Box>
            <Typography sx={{ color: '#64748B', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.75 }}>
              Gaps Detected
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                sx={{
                  color: quality.gapsDetected === 0 ? '#10B981' : '#F59E0B',
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  fontFamily: '"JetBrains Mono", monospace',
                }}
              >
                {quality.gapsDetected}
              </Typography>
              {quality.gapsDetected > 0 && (
                <WarningIcon sx={{ color: '#F59E0B', fontSize: 18 }} />
              )}
            </Box>
            <Typography sx={{ color: '#64748B', fontSize: '0.72rem', mt: 0.5 }}>
              {quality.gapsDetected === 0
                ? 'No gaps in data coverage'
                : `${quality.gapsDetected} period(s) with missing data`}
            </Typography>
          </Box>

          {/* Anomalies */}
          <Box>
            <Typography sx={{ color: '#64748B', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.75 }}>
              Anomalies Flagged
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                sx={{
                  color: quality.anomaliesFlagged === 0 ? '#10B981' : '#F59E0B',
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  fontFamily: '"JetBrains Mono", monospace',
                }}
              >
                {quality.anomaliesFlagged}
              </Typography>
              {quality.anomaliesFlagged > 0 && (
                <WarningIcon sx={{ color: '#F59E0B', fontSize: 18 }} />
              )}
            </Box>
            <Typography sx={{ color: '#64748B', fontSize: '0.72rem', mt: 0.5 }}>
              {quality.anomaliesFlagged === 0
                ? 'All readings within expected ranges'
                : `${quality.anomaliesFlagged} reading(s) outside expected ranges`}
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default FormatDetector;
