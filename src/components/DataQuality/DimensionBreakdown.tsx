import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Chip,
} from '@mui/material';

// --- Types ---

export interface SubCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface DimensionData {
  key: string;
  label: string;
  score: number;
  previousScore: number;
  description: string;
  subChecks: SubCheck[];
  tips: string[];
}

interface DimensionBreakdownProps {
  dimensions: DimensionData[];
}

// (mock data removed — dimensions provided via props from DataQualityDashboard)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _REMOVED_MOCK_DIMENSIONS_DO_NOT_USE: DimensionData[] = [
  {
    key: 'range',
    label: 'Range Validation',
    score: 94,
    previousScore: 91,
    description:
      'Verifies that all reported values fall within physically plausible limits. Temperature, humidity, pressure, wind speed, and precipitation are each checked against known extremes.',
    subChecks: [
      { name: 'Temperature range (-89.2C to 70.7C)', passed: true, detail: 'All readings within bounds' },
      { name: 'Humidity range (0-100%)', passed: true, detail: '100% compliance' },
      { name: 'Pressure range (870-1084 hPa)', passed: true, detail: 'All readings within bounds' },
      { name: 'Wind speed range (0-113 m/s)', passed: true, detail: '100% compliance' },
      { name: 'Precipitation non-negative', passed: true, detail: 'No negative values detected' },
      { name: 'UV Index range (0-15)', passed: false, detail: '2 readings exceeded 15.0; flagged as suspect' },
    ],
    tips: [
      'UV sensor may need recalibration -- consider shading test to verify zero-offset.',
      'Your range validation is excellent overall; maintain current sensor upkeep schedule.',
    ],
  },
  {
    key: 'temporal',
    label: 'Temporal Consistency',
    score: 78,
    previousScore: 85,
    description:
      'Assesses whether sequential readings change at rates consistent with real atmospheric behavior. Large jumps in short periods may indicate sensor malfunction or data corruption.',
    subChecks: [
      { name: 'Temperature rate (<5C/hr)', passed: true, detail: 'Max observed: 3.2C/hr' },
      { name: 'Pressure rate (<10 hPa/hr)', passed: true, detail: 'Max observed: 2.1 hPa/hr' },
      { name: 'Humidity rate (<30%/hr)', passed: false, detail: 'Spike to 45%/hr on Feb 8; likely condensation event' },
      { name: 'Wind speed rate (<25 m/s change/hr)', passed: true, detail: 'Max observed: 12.4 m/s/hr' },
      { name: 'No data gaps >15 min', passed: false, detail: '3 gaps detected (max 47 min on Feb 10)' },
      { name: 'Monotonic timestamp order', passed: true, detail: 'All timestamps properly ordered' },
    ],
    tips: [
      'Your temporal consistency dropped -- check sensor cable connections for intermittent contact.',
      'Data gaps on Feb 10 suggest power interruption. Consider a UPS for your weather station.',
      'Humidity spike may be caused by condensation on the sensor; ensure adequate ventilation.',
    ],
  },
  {
    key: 'spatial',
    label: 'Spatial Consensus',
    score: 86,
    previousScore: 88,
    description:
      'Compares your readings against nearby weather stations. Significant deviations from regional consensus may indicate localized interference or sensor drift.',
    subChecks: [
      { name: 'Temperature within 3C of neighbors', passed: true, detail: 'Avg deviation: 1.2C' },
      { name: 'Pressure within 5 hPa of neighbors', passed: true, detail: 'Avg deviation: 0.8 hPa' },
      { name: 'Humidity within 15% of neighbors', passed: true, detail: 'Avg deviation: 8.3%' },
      { name: 'Wind direction alignment (within 45 deg)', passed: false, detail: 'Avg deviation: 52 deg -- possible obstruction' },
      { name: 'Precipitation agreement (within 2mm/hr)', passed: true, detail: 'Avg deviation: 0.6mm/hr' },
    ],
    tips: [
      'Wind direction deviates from neighbors -- check for new obstructions (buildings, trees) near the anemometer.',
      'Elevate your wind sensor if possible; nearby structures can create turbulent eddies.',
    ],
  },
  {
    key: 'crossParameter',
    label: 'Cross-Parameter Validation',
    score: 91,
    previousScore: 89,
    description:
      'Validates logical relationships between different weather parameters. For example, dew point must not exceed temperature, and high pressure should correlate with clear skies.',
    subChecks: [
      { name: 'Dew point <= Temperature', passed: true, detail: 'All readings valid' },
      { name: 'Wind chill consistency', passed: true, detail: 'Formulas produce consistent results' },
      { name: 'Heat index plausibility', passed: true, detail: 'No impossible heat index values' },
      { name: 'Pressure-weather correlation', passed: true, detail: 'Falling pressure aligns with precipitation events' },
      { name: 'Solar radiation vs time-of-day', passed: false, detail: 'Nonzero radiation at 2:14 AM on Feb 7 -- possible sensor error' },
      { name: 'Humidity-precipitation correlation', passed: true, detail: 'High humidity precedes precipitation as expected' },
    ],
    tips: [
      'Night-time solar radiation reading suggests a light leak or faulty photodiode. Cover the sensor at night for a verification test.',
      'Your cross-parameter validation improved from last period -- great consistency.',
    ],
  },
];

// --- Helpers ---

function getScoreColor(score: number): string {
  if (score > 80) return '#10B981';
  if (score >= 60) return '#F59E0B';
  return '#EF4444';
}

function getTrendArrow(current: number, previous: number): { symbol: string; color: string } {
  const diff = current - previous;
  if (diff > 2) return { symbol: '\u25B2', color: '#10B981' }; // up arrow
  if (diff < -2) return { symbol: '\u25BC', color: '#EF4444' }; // down arrow
  return { symbol: '\u25C6', color: '#64748B' }; // diamond = stable
}

function getSeverityColor(passed: boolean): string {
  return passed ? '#10B981' : '#EF4444';
}

// --- Component ---

const DimensionBreakdown: React.FC<DimensionBreakdownProps> = ({ dimensions }) => {
  const [expandedKey, setExpandedKey] = useState<string | false>(false);

  const handleChange = (key: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedKey(isExpanded ? key : false);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: '#1E293B',
        borderRadius: 3,
        border: '1px solid rgba(248,250,252,0.06)',
        overflow: 'hidden',
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
        <Typography
          variant="subtitle2"
          sx={{ color: '#F8FAFC', fontWeight: 700, letterSpacing: 0.5 }}
        >
          DIMENSION BREAKDOWN
        </Typography>
      </Box>

      {/* Accordion List */}
      <Box sx={{ p: 1 }}>
        {dimensions.map((dim) => {
          const color = getScoreColor(dim.score);
          const trend = getTrendArrow(dim.score, dim.previousScore);
          const passedCount = dim.subChecks.filter((c) => c.passed).length;
          const totalCount = dim.subChecks.length;

          return (
            <Accordion
              key={dim.key}
              expanded={expandedKey === dim.key}
              onChange={handleChange(dim.key)}
              disableGutters
              elevation={0}
              sx={{
                bgcolor: 'transparent',
                '&:before': { display: 'none' },
                '&.Mui-expanded': { margin: 0 },
              }}
            >
              <AccordionSummary
                expandIcon={
                  <Typography sx={{ color: '#64748B', fontSize: '0.75rem' }}>
                    {expandedKey === dim.key ? '\u25B4' : '\u25BE'}
                  </Typography>
                }
                sx={{
                  px: 2,
                  py: 0.5,
                  borderRadius: 2,
                  '&:hover': { bgcolor: 'rgba(248,250,252,0.03)' },
                  '& .MuiAccordionSummary-content': {
                    alignItems: 'center',
                    gap: 1.5,
                    my: 1,
                  },
                }}
              >
                {/* Score badge */}
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    bgcolor: `${color}15`,
                    border: `1px solid ${color}30`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Typography
                    sx={{
                      color,
                      fontWeight: 800,
                      fontSize: '1rem',
                      lineHeight: 1,
                      fontFamily: 'monospace',
                    }}
                  >
                    {dim.score}
                  </Typography>
                </Box>

                {/* Label and sub-info */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Typography
                      sx={{
                        color: '#F8FAFC',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                      }}
                    >
                      {dim.label}
                    </Typography>
                    <Typography
                      sx={{
                        color: trend.color,
                        fontSize: '0.7rem',
                        fontWeight: 700,
                      }}
                      title={`Previous: ${dim.previousScore}`}
                    >
                      {trend.symbol} {Math.abs(dim.score - dim.previousScore)}
                    </Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{ color: '#64748B', fontSize: '0.7rem' }}
                  >
                    {passedCount}/{totalCount} checks passing
                  </Typography>
                </Box>

                {/* Progress bar */}
                <Box sx={{ width: 80, flexShrink: 0 }}>
                  <LinearProgress
                    variant="determinate"
                    value={dim.score}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      bgcolor: 'rgba(248,250,252,0.06)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: color,
                        borderRadius: 2,
                      },
                    }}
                  />
                </Box>
              </AccordionSummary>

              <AccordionDetails sx={{ px: 2, pb: 2 }}>
                {/* Description */}
                <Typography
                  variant="body2"
                  sx={{ color: '#94A3B8', fontSize: '0.78rem', mb: 2, lineHeight: 1.6 }}
                >
                  {dim.description}
                </Typography>

                {/* Sub-checks */}
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#64748B',
                      fontWeight: 700,
                      letterSpacing: 0.5,
                      mb: 1,
                      display: 'block',
                      fontSize: '0.65rem',
                    }}
                  >
                    SUB-CHECKS
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    {dim.subChecks.map((check, i) => (
                      <Box
                        key={i}
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 1,
                          px: 1.5,
                          py: 0.75,
                          borderRadius: 1.5,
                          bgcolor: check.passed
                            ? 'rgba(16,185,129,0.05)'
                            : 'rgba(239,68,68,0.05)',
                          border: `1px solid ${
                            check.passed
                              ? 'rgba(16,185,129,0.12)'
                              : 'rgba(239,68,68,0.12)'
                          }`,
                        }}
                      >
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            bgcolor: `${getSeverityColor(check.passed)}20`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            mt: 0.25,
                          }}
                        >
                          <Typography
                            sx={{
                              color: getSeverityColor(check.passed),
                              fontSize: '0.6rem',
                              fontWeight: 800,
                              lineHeight: 1,
                            }}
                          >
                            {check.passed ? '\u2713' : '\u2717'}
                          </Typography>
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            sx={{
                              color: '#CBD5E1',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}
                          >
                            {check.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: '#64748B', fontSize: '0.68rem' }}
                          >
                            {check.detail}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>

                {/* Tips */}
                {dim.tips.length > 0 && (
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#64748B',
                        fontWeight: 700,
                        letterSpacing: 0.5,
                        mb: 1,
                        display: 'block',
                        fontSize: '0.65rem',
                      }}
                    >
                      RECOMMENDATIONS
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                      {dim.tips.map((tip, i) => (
                        <Box
                          key={i}
                          sx={{
                            display: 'flex',
                            gap: 1,
                            px: 1.5,
                            py: 0.75,
                            borderRadius: 1.5,
                            bgcolor: 'rgba(59,130,246,0.06)',
                            border: '1px solid rgba(59,130,246,0.12)',
                          }}
                        >
                          <Chip
                            label="TIP"
                            size="small"
                            sx={{
                              bgcolor: 'rgba(59,130,246,0.15)',
                              color: '#3B82F6',
                              fontWeight: 700,
                              fontSize: '0.55rem',
                              height: 18,
                              '& .MuiChip-label': { px: 0.75 },
                            }}
                          />
                          <Typography
                            sx={{ color: '#94A3B8', fontSize: '0.75rem', lineHeight: 1.5 }}
                          >
                            {tip}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    </Paper>
  );
};

export default DimensionBreakdown;
