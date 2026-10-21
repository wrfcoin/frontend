import React, { useRef, useEffect, useState } from 'react';
import { Box, Typography, Paper, IconButton, Collapse } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { formatBaseUnitsToWrf, toBaseUnits } from '../../services/apiClient/number';

// --- Types ---

export interface LogEntry {
  id: string;
  timestamp: string;
  success: boolean;
  summary: string;
  qualityScore: number;
  wrfEarned?: string;
}

interface SubmissionLogProps {
  entries: LogEntry[];
  defaultExpanded?: boolean;
}

// --- Component ---

const SubmissionLog: React.FC<SubmissionLogProps> = ({ entries, defaultExpanded = false }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (expanded && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [expanded, entries.length]);

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
      {/* Header - always visible */}
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          px: 2.5,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          '&:hover': { bgcolor: 'rgba(248,250,252,0.02)' },
          transition: 'background 0.15s ease',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="subtitle2" sx={{ color: '#F8FAFC', fontWeight: 700, letterSpacing: 0.5 }}>
            SUBMISSION LOG
          </Typography>
          <Box
            sx={{
              bgcolor: 'rgba(96,165,250,0.1)',
              border: '1px solid rgba(96,165,250,0.2)',
              borderRadius: 1,
              px: 1,
              py: 0.15,
            }}
          >
            <Typography variant="caption" sx={{ color: '#60A5FA', fontWeight: 700, fontSize: '0.65rem' }}>
              {entries.length} ENTRIES
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" sx={{ color: '#64748B' }}>
          {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      </Box>

      {/* Collapsible Log Body */}
      <Collapse in={expanded}>
        <Box
          ref={scrollRef}
          sx={{
            maxHeight: 320,
            overflowY: 'auto',
            bgcolor: '#0B1120',
            fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
            fontSize: '0.72rem',
            lineHeight: 1.7,
            px: 2,
            py: 1,
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: 'rgba(248,250,252,0.08)',
              borderRadius: 3,
            },
          }}
        >
          {entries.length === 0 && (
            <Typography sx={{ color: '#64748B', fontFamily: 'inherit', fontSize: 'inherit', py: 1 }}>
              No submissions available yet for this station.
            </Typography>
          )}
          {entries.map((entry) => {
            const earnedUnits = toBaseUnits(entry.wrfEarned);
            const hasEarned = earnedUnits !== null && earnedUnits > 0n;
            return (
              <Box
                key={entry.id}
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  py: 0.35,
                  borderBottom: '1px solid rgba(248,250,252,0.02)',
                  '&:last-child': { borderBottom: 'none' },
                }}
              >
              {/* Timestamp */}
              <Typography
                  component="span"
                  sx={{ color: '#475569', fontFamily: 'inherit', fontSize: 'inherit', flexShrink: 0, width: 65 }}
                >
                {entry.timestamp}
              </Typography>

              {/* Status icon */}
              <Typography
                  component="span"
                  sx={{
                    color: entry.success ? '#22C55E' : '#EF4444',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    flexShrink: 0,
                    width: 16,
                  }}
                >
                {entry.success ? '\u2713' : '\u2717'}
              </Typography>

              {/* Summary */}
              <Typography
                  component="span"
                  sx={{
                    color: entry.success ? '#CBD5E1' : '#F87171',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                {entry.summary}
              </Typography>

              {/* Quality Score */}
              {entry.success && (
                  <Typography
                    component="span"
                    sx={{
                      color: entry.qualityScore >= 90 ? '#22C55E' : entry.qualityScore >= 75 ? '#FACC15' : '#F97316',
                      fontFamily: 'inherit',
                      fontSize: 'inherit',
                      flexShrink: 0,
                      width: 55,
                      textAlign: 'right',
                    }}
                  >
                  Q:{entry.qualityScore}
                </Typography>
                )}

              {/* WRF Earned */}
              <Typography
                  component="span"
                  sx={{
                    color: hasEarned ? '#FBBF24' : '#334155',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    flexShrink: 0,
                    width: 70,
                    textAlign: 'right',
                  }}
                >
                {hasEarned ? `+${formatBaseUnitsToWrf(entry.wrfEarned, 4)} WRF` : '--'}
              </Typography>
            </Box>
            );
          })}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default SubmissionLog;
