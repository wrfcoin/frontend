import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  LinearProgress,
  Chip,
  Button,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  CloudDone as CloudDoneIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';

// --- Types ---

export interface ImportStats {
  totalRecords: number;
  processedRecords: number;
  validatedPassed: number;
  validatedFlagged: number;
  estimatedSecondsRemaining: number;
}

export interface ImportResult {
  recordsImported: number;
  qualityScore: number;
  achievementsCredited: string[];
  dateRange: { start: string; end: string };
  duplicatesSkipped: number;
}

export type ImportState = 'importing' | 'complete' | 'error';

export interface ImportProgressProps {
  state: ImportState;
  stats: ImportStats;
  result: ImportResult | null;
  onDone?: () => void;
}

// (mock data removed — import stats/result returned by upload API)

// --- Helpers ---

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

// --- Animated Checkmark ---

const AnimatedCheckmark: React.FC = () => (
  <Box
    sx={{
      width: 72,
      height: 72,
      borderRadius: '50%',
      bgcolor: 'rgba(16,185,129,0.15)',
      border: '3px solid #10B981',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'checkPop 0.4s ease-out',
      '@keyframes checkPop': {
        '0%': { transform: 'scale(0)', opacity: 0 },
        '60%': { transform: 'scale(1.15)' },
        '100%': { transform: 'scale(1)', opacity: 1 },
      },
    }}
  >
    <CheckCircleIcon sx={{ color: '#10B981', fontSize: 40 }} />
  </Box>
);

// --- Component ---

const ImportProgress: React.FC<ImportProgressProps> = ({
  state,
  stats,
  result,
  onDone,
}) => {
  const percent =
    stats.totalRecords > 0
      ? Math.round((stats.processedRecords / stats.totalRecords) * 100)
      : 0;

  // Pulse animation for the "you can close this page" text
  const [showCloseTip, setShowCloseTip] = useState(false);
  const tipTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (state === 'importing') {
      tipTimer.current = setTimeout(() => setShowCloseTip(true), 3000);
    }
    return () => {
      if (tipTimer.current) clearTimeout(tipTimer.current);
    };
  }, [state]);

  // --- Importing view ---
  if (state === 'importing') {
    return (
      <Paper
        elevation={0}
        sx={{
          bgcolor: '#1E293B',
          borderRadius: 3,
          border: '1px solid rgba(59,130,246,0.15)',
          p: 4,
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <CloudDoneIcon sx={{ color: '#3B82F6', fontSize: 24 }} />
          <Typography sx={{ color: '#F8FAFC', fontWeight: 700, fontSize: '1.05rem' }}>
            Importing Historical Data...
          </Typography>
        </Box>

        {/* Progress bar */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
            <Typography sx={{ color: '#94A3B8', fontSize: '0.78rem' }}>
              Progress
            </Typography>
            <Typography
              sx={{
                color: '#F8FAFC',
                fontSize: '0.85rem',
                fontWeight: 700,
                fontFamily: '"JetBrains Mono", monospace',
              }}
            >
              {percent}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={percent}
            sx={{
              height: 10,
              borderRadius: 5,
              bgcolor: 'rgba(59,130,246,0.12)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 5,
                background: 'linear-gradient(90deg, #3B82F6, #10B981)',
              },
            }}
          />
        </Box>

        {/* Stats row */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 2,
            mb: 3,
            p: 2,
            bgcolor: 'rgba(15,23,42,0.5)',
            borderRadius: 2,
          }}
        >
          <Box>
            <Typography sx={{ color: '#64748B', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.25 }}>
              Processed
            </Typography>
            <Typography sx={{ color: '#F8FAFC', fontSize: '0.95rem', fontWeight: 700, fontFamily: '"JetBrains Mono", monospace' }}>
              {formatNumber(stats.processedRecords)}{' '}
              <Typography component="span" sx={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 400 }}>
                / {formatNumber(stats.totalRecords)}
              </Typography>
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ color: '#64748B', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.25 }}>
              Validated
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <Typography sx={{ color: '#10B981', fontSize: '0.95rem', fontWeight: 700, fontFamily: '"JetBrains Mono", monospace' }}>
                {formatNumber(stats.validatedPassed)} passed
              </Typography>
              {stats.validatedFlagged > 0 && (
                <Typography sx={{ color: '#F59E0B', fontSize: '0.78rem', fontFamily: '"JetBrains Mono", monospace' }}>
                  / {formatNumber(stats.validatedFlagged)} flagged
                </Typography>
              )}
            </Box>
          </Box>
          <Box>
            <Typography sx={{ color: '#64748B', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.25 }}>
              Est. Remaining
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <ScheduleIcon sx={{ color: '#94A3B8', fontSize: 16 }} />
              <Typography sx={{ color: '#F8FAFC', fontSize: '0.95rem', fontWeight: 700, fontFamily: '"JetBrains Mono", monospace' }}>
                {formatTime(stats.estimatedSecondsRemaining)}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Close tip */}
        {showCloseTip && (
          <Box
            sx={{
              textAlign: 'center',
              py: 1,
              animation: 'fadeIn 0.5s ease-in',
              '@keyframes fadeIn': {
                from: { opacity: 0 },
                to: { opacity: 1 },
              },
            }}
          >
            <Typography sx={{ color: '#64748B', fontSize: '0.78rem' }}>
              You can close this page -- the import will continue in the background.
            </Typography>
          </Box>
        )}
      </Paper>
    );
  }

  // --- Error view ---
  if (state === 'error') {
    return (
      <Paper
        elevation={0}
        sx={{
          bgcolor: '#1E293B',
          borderRadius: 3,
          border: '1px solid rgba(239,68,68,0.3)',
          p: 4,
          textAlign: 'center',
        }}
      >
        <WarningIcon sx={{ color: '#EF4444', fontSize: 48, mb: 2 }} />
        <Typography sx={{ color: '#F8FAFC', fontWeight: 700, fontSize: '1.05rem', mb: 1 }}>
          Import Failed
        </Typography>
        <Typography sx={{ color: '#94A3B8', fontSize: '0.82rem', mb: 3 }}>
          An error occurred while importing your data. Please check your file and try again.
        </Typography>
        <Button
          variant="contained"
          onClick={onDone}
          sx={{
            bgcolor: '#3B82F6',
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': { bgcolor: '#2563EB' },
          }}
        >
          Try Again
        </Button>
      </Paper>
    );
  }

  // --- Complete view ---
  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: '#1E293B',
        borderRadius: 3,
        border: '1px solid rgba(16,185,129,0.25)',
        p: 4,
      }}
    >
      {/* Success header */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
        <AnimatedCheckmark />
        <Typography sx={{ color: '#F8FAFC', fontWeight: 700, fontSize: '1.2rem', mt: 2 }}>
          Import Complete
        </Typography>
        <Typography sx={{ color: '#94A3B8', fontSize: '0.82rem', mt: 0.5 }}>
          Your historical data has been processed and credited to your station.
        </Typography>
      </Box>

      {/* Summary stats */}
      {result && (
        <>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 2,
              mb: 3,
            }}
          >
            <Paper
              elevation={0}
              sx={{
                bgcolor: 'rgba(15,23,42,0.5)',
                borderRadius: 2,
                p: 2,
                textAlign: 'center',
              }}
            >
              <Typography sx={{ color: '#64748B', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.5 }}>
                Records Imported
              </Typography>
              <Typography sx={{ color: '#10B981', fontSize: '1.3rem', fontWeight: 800, fontFamily: '"JetBrains Mono", monospace' }}>
                {formatNumber(result.recordsImported)}
              </Typography>
            </Paper>
            <Paper
              elevation={0}
              sx={{
                bgcolor: 'rgba(15,23,42,0.5)',
                borderRadius: 2,
                p: 2,
                textAlign: 'center',
              }}
            >
              <Typography sx={{ color: '#64748B', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.5 }}>
                Quality Score
              </Typography>
              <Typography
                sx={{
                  color: result.qualityScore >= 80 ? '#10B981' : result.qualityScore >= 60 ? '#F59E0B' : '#EF4444',
                  fontSize: '1.3rem',
                  fontWeight: 800,
                  fontFamily: '"JetBrains Mono", monospace',
                }}
              >
                {result.qualityScore.toFixed(1)}
              </Typography>
            </Paper>
            <Paper
              elevation={0}
              sx={{
                bgcolor: 'rgba(15,23,42,0.5)',
                borderRadius: 2,
                p: 2,
                textAlign: 'center',
              }}
            >
              <Typography sx={{ color: '#64748B', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.5 }}>
                Date Range
              </Typography>
              <Typography sx={{ color: '#F8FAFC', fontSize: '0.82rem', fontWeight: 600, fontFamily: '"JetBrains Mono", monospace' }}>
                {result.dateRange.start}
              </Typography>
              <Typography sx={{ color: '#64748B', fontSize: '0.72rem' }}>to {result.dateRange.end}</Typography>
            </Paper>
          </Box>

          {/* Duplicates note */}
          {result.duplicatesSkipped > 0 && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 1,
                bgcolor: 'rgba(245,158,11,0.08)',
                borderRadius: 2,
                mb: 3,
              }}
            >
              <WarningIcon sx={{ color: '#F59E0B', fontSize: 16 }} />
              <Typography sx={{ color: '#F59E0B', fontSize: '0.75rem' }}>
                {formatNumber(result.duplicatesSkipped)} duplicate records were skipped.
              </Typography>
            </Box>
          )}

          {/* Achievement credits */}
          {result.achievementsCredited.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <TrophyIcon sx={{ color: '#F59E0B', fontSize: 20 }} />
                <Typography sx={{ color: '#F8FAFC', fontWeight: 600, fontSize: '0.88rem' }}>
                  Achievement Progress Credited
                </Typography>
              </Box>
              {result.achievementsCredited.map((ach, i) => (
                <Box
                  key={i}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    py: 0.75,
                    px: 1.5,
                    borderLeft: '3px solid #F59E0B',
                    bgcolor: 'rgba(245,158,11,0.06)',
                    borderRadius: '0 8px 8px 0',
                    mb: 0.75,
                  }}
                >
                  <CheckCircleIcon sx={{ color: '#10B981', fontSize: 16 }} />
                  <Typography sx={{ color: '#F8FAFC', fontSize: '0.78rem' }}>{ach}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </>
      )}

      {/* Action */}
      <Box sx={{ textAlign: 'center' }}>
        <Button
          variant="contained"
          onClick={onDone}
          sx={{
            bgcolor: '#10B981',
            textTransform: 'none',
            fontWeight: 600,
            px: 4,
            '&:hover': { bgcolor: '#059669' },
          }}
        >
          Back to Dashboard
        </Button>
      </Box>
    </Paper>
  );
};

export default ImportProgress;
