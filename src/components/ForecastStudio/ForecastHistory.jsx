import React, { useState, useMemo, useEffect } from 'react';
import DemoSurfaceGate from '../common/DemoSurfaceGate';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Grid,
  Card,
  CardContent,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  History,
  Visibility,
  TrendingUp,
  EmojiEvents,
  BarChart,
  CalendarMonth,
  CheckCircle,
  ErrorOutline,
  Timeline,
  Assessment,
  Star,
  Comment,
  Verified,
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';
import { apiClient } from '../../services/apiClient';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, ChartTooltip, Legend, Filler);

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLORS = {
  bg: '#0F172A',
  card: '#1E293B',
  border: '#334155',
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  text: '#FFFFFF',
  muted: '#94A3B8',
};

const BADGES = [
  { id: 'storm-spotter', name: 'Storm Spotter', description: 'Correctly predicted 5+ severe weather events', color: '#EF4444', earned: true, earnedDate: 'Jan 2026' },
  { id: 'accurate-forecaster', name: 'Accurate Forecaster', description: 'Maintained 0.85+ avg skill score for 30 days', color: '#10B981', earned: true, earnedDate: 'Feb 2026' },
  { id: 'prolific-publisher', name: 'Prolific Publisher', description: 'Published 10+ forecasts in one month', color: '#3B82F6', earned: true, earnedDate: 'Feb 2026' },
  { id: 'community-favorite', name: 'Community Favorite', description: 'Received 100+ comments on a single forecast', color: '#8B5CF6', earned: false, earnedDate: null },
  { id: 'winter-specialist', name: 'Winter Specialist', description: 'Accurately predicted 3+ winter storms', color: '#06B6D4', earned: true, earnedDate: 'Feb 2026' },
];

const SKILL_TREND_MONTHS = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
const SKILL_TREND_VALUES = [0.72, 0.75, 0.78, 0.81, 0.80, 0.84];

const MONTHLY_STATS = [
  { label: 'Total Forecasts', value: '14', icon: BarChart, color: COLORS.primary },
  { label: 'Verified', value: '12', icon: CheckCircle, color: COLORS.success },
  { label: 'Avg Skill', value: '0.84', icon: TrendingUp, color: COLORS.success },
  { label: 'Total Views', value: '34.1K', icon: Visibility, color: COLORS.warning },
];

// ---------------------------------------------------------------------------
// Verification Chart Data
// ---------------------------------------------------------------------------

function generateVerificationData() {
  const hours = [];
  const predicted = [];
  const observed = [];
  for (let h = 0; h <= 48; h += 3) {
    hours.push(h === 0 ? '0h' : `+${h}h`);
    const dayFrac = ((12 + h) % 24 - 6) / 24;
    const diurnal = 8 * Math.sin(dayFrac * Math.PI * 2);
    const base = 30 + diurnal;
    const cooling = h > 12 ? -3 : 0;
    predicted.push(Math.round((base + cooling + (Math.random() - 0.5) * 1.5) * 10) / 10);
    observed.push(Math.round((base + cooling + (Math.random() - 0.5) * 3) * 10) / 10);
  }
  return { hours, predicted, observed };
}

// ---------------------------------------------------------------------------
// ForecastHistory Component
// ---------------------------------------------------------------------------

const ForecastHistorySample = () => {
  const [expandedRow, setExpandedRow] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    apiClient.get('/forecast-studio/history')
      .then((data) => setHistory(Array.isArray(data) ? data : (data.history ?? [])))
      .catch(() => setHistory([]));
  }, []);

  const verificationData = useMemo(() => generateVerificationData(), []);

  const verificationChartConfig = useMemo(() => ({
    labels: verificationData.hours,
    datasets: [
      {
        label: 'Predicted',
        data: verificationData.predicted,
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#3B82F6',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 1,
        fill: false,
        tension: 0.3,
      },
      {
        label: 'Observed',
        data: verificationData.observed,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#10B981',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 1,
        fill: false,
        tension: 0.3,
        borderDash: [4, 4],
      },
    ],
  }), [verificationData]);

  const skillTrendConfig = useMemo(() => ({
    labels: SKILL_TREND_MONTHS,
    datasets: [
      {
        label: 'Avg Skill Score',
        data: SKILL_TREND_VALUES,
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.12)',
        borderWidth: 2.5,
        pointRadius: 5,
        pointBackgroundColor: SKILL_TREND_VALUES.map((v, i) =>
          i === SKILL_TREND_VALUES.length - 1 ? '#3B82F6' : 'rgba(59, 130, 246, 0.6)',
        ),
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        fill: true,
        tension: 0.35,
      },
    ],
  }), []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: { color: COLORS.muted, font: { size: 10 }, maxTicksLimit: 10 },
        grid: { color: COLORS.border, lineWidth: 0.5 },
      },
      y: {
        ticks: { color: COLORS.muted, font: { size: 10 } },
        grid: { color: COLORS.border, lineWidth: 0.5 },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: { color: COLORS.muted, font: { size: 11 }, padding: 12, usePointStyle: true },
      },
      tooltip: {
        backgroundColor: COLORS.card,
        titleColor: COLORS.text,
        bodyColor: COLORS.muted,
        borderColor: COLORS.border,
        borderWidth: 1,
      },
    },
  };

  const skillTrendOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        min: 0.6,
        max: 1.0,
        ticks: { ...chartOptions.scales.y.ticks, stepSize: 0.1, callback: v => v.toFixed(1) },
      },
    },
  };

  const getStatusChip = (status) => {
    if (status === 'Verified') {
      return (
        <Chip
          icon={<Verified sx={{ fontSize: 12, color: `${COLORS.success} !important` }} />}
          label="Verified"
          size="small"
          sx={{ bgcolor: 'rgba(16,185,129,0.15)', color: COLORS.success, fontSize: 10, height: 22 }}
        />
      );
    }
    return (
      <Chip
        icon={<ErrorOutline sx={{ fontSize: 12, color: `${COLORS.error} !important` }} />}
        label="Busted"
        size="small"
        sx={{ bgcolor: 'rgba(239,68,68,0.15)', color: COLORS.error, fontSize: 10, height: 22 }}
      />
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <History sx={{ color: COLORS.primary, fontSize: 22 }} />
        <Typography variant="h6" sx={{ color: COLORS.text, fontWeight: 700, fontSize: 16 }}>
          Verification History
        </Typography>
      </Box>

      {/* Monthly Stats */}
      <Grid container spacing={1.5}>
        {MONTHLY_STATS.map(stat => {
          const Icon = stat.icon;
          return (
            <Grid item xs={6} sm={3} key={stat.label}>
              <Card sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, textAlign: 'center' }}>
                  <Icon sx={{ color: stat.color, fontSize: 20, mb: 0.5 }} />
                  <Typography sx={{ color: COLORS.text, fontWeight: 700, fontSize: 20 }}>
                    {stat.value}
                  </Typography>
                  <Typography sx={{ color: COLORS.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                    {stat.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 2, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Assessment sx={{ color: COLORS.primary, fontSize: 18 }} />
              <Typography sx={{ color: COLORS.text, fontWeight: 600, fontSize: 13 }}>
                Predicted vs Observed Temperature
              </Typography>
            </Box>
            <Box sx={{ height: 200 }}>
              <Line data={verificationChartConfig} options={chartOptions} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 2, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Timeline sx={{ color: COLORS.primary, fontSize: 18 }} />
              <Typography sx={{ color: COLORS.text, fontWeight: 600, fontSize: 13 }}>
                Skill Score Trend
              </Typography>
            </Box>
            <Box sx={{ height: 200 }}>
              <Line data={skillTrendConfig} options={skillTrendOptions} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Published Forecasts Table */}
      <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography sx={{ color: COLORS.text, fontWeight: 600, fontSize: 14 }}>
            Published Forecasts
          </Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Forecast', 'Region', 'Valid Period', 'Status', 'Skill', 'RMSE', 'MAE', 'Bias', 'Views'].map(header => (
                  <TableCell
                    key={header}
                    sx={{
                      color: COLORS.muted,
                      fontSize: 10,
                      fontWeight: 600,
                      borderColor: COLORS.border,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      py: 1,
                      whiteSpace: 'nowrap',
                    }}
                    align={['Skill', 'RMSE', 'MAE', 'Bias', 'Views'].includes(header) ? 'center' : 'left'}
                  >
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map(forecast => (
                <TableRow
                  key={forecast.id}
                  sx={{
                    '&:hover': { bgcolor: 'rgba(59,130,246,0.04)' },
                    cursor: 'pointer',
                  }}
                  onClick={() => setExpandedRow(expandedRow === forecast.id ? null : forecast.id)}
                >
                  <TableCell sx={{ borderColor: COLORS.border, py: 1.25 }}>
                    <Typography sx={{ color: COLORS.text, fontSize: 12, fontWeight: 500, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {forecast.name}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderColor: COLORS.border, py: 1.25 }}>
                    <Typography sx={{ color: COLORS.muted, fontSize: 11 }}>{forecast.region}</Typography>
                  </TableCell>
                  <TableCell sx={{ borderColor: COLORS.border, py: 1.25 }}>
                    <Typography sx={{ color: COLORS.muted, fontSize: 10, fontFamily: 'monospace' }}>
                      {forecast.validStart} to {forecast.validEnd}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderColor: COLORS.border, py: 1.25 }}>
                    {getStatusChip(forecast.status)}
                  </TableCell>
                  <TableCell sx={{ borderColor: COLORS.border, py: 1.25 }} align="center">
                    <Typography
                      sx={{
                        color: forecast.skillScore >= 0.85 ? COLORS.success : forecast.skillScore >= 0.75 ? COLORS.warning : COLORS.error,
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      {forecast.skillScore.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderColor: COLORS.border, py: 1.25 }} align="center">
                    <Typography sx={{ color: forecast.rmse <= 2.5 ? COLORS.success : COLORS.warning, fontSize: 11, fontFamily: 'monospace' }}>
                      {forecast.rmse.toFixed(1)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderColor: COLORS.border, py: 1.25 }} align="center">
                    <Typography sx={{ color: forecast.mae <= 2.0 ? COLORS.success : COLORS.warning, fontSize: 11, fontFamily: 'monospace' }}>
                      {forecast.mae.toFixed(1)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderColor: COLORS.border, py: 1.25 }} align="center">
                    <Typography
                      sx={{
                        color: Math.abs(forecast.bias) <= 0.5 ? COLORS.success : Math.abs(forecast.bias) <= 1.0 ? COLORS.warning : COLORS.error,
                        fontSize: 11,
                        fontFamily: 'monospace',
                      }}
                    >
                      {forecast.bias >= 0 ? '+' : ''}{forecast.bias.toFixed(1)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderColor: COLORS.border, py: 1.25 }} align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      <Visibility sx={{ color: COLORS.muted, fontSize: 12 }} />
                      <Typography sx={{ color: COLORS.muted, fontSize: 11 }}>
                        {forecast.views.toLocaleString()}
                      </Typography>
                      {forecast.comments > 0 && (
                        <>
                          <Comment sx={{ color: COLORS.muted, fontSize: 12, ml: 0.5 }} />
                          <Typography sx={{ color: COLORS.muted, fontSize: 11 }}>
                            {forecast.comments}
                          </Typography>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Skill Score Breakdown (expanded detail) */}
      {expandedRow && (() => {
        const forecast = history.find(f => f.id === expandedRow);
        if (!forecast) return null;
        return (
          <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.primary}`, borderRadius: 2, p: 2 }}>
            <Typography sx={{ color: COLORS.text, fontWeight: 600, fontSize: 14, mb: 1.5 }}>
              Skill Breakdown: {forecast.name}
            </Typography>
            <Grid container spacing={2}>
              {[
                { label: 'RMSE', value: forecast.rmse, unit: 'F', good: 2.5, description: 'Root Mean Square Error measures average prediction error magnitude' },
                { label: 'MAE', value: forecast.mae, unit: 'F', good: 2.0, description: 'Mean Absolute Error shows average deviation from observed values' },
                { label: 'Bias', value: forecast.bias, unit: 'F', good: 0.5, description: 'Systematic tendency to over-predict (positive) or under-predict (negative)', isBias: true },
                { label: 'Skill Score', value: forecast.skillScore, unit: '', good: 0.85, description: 'Overall forecast skill relative to climatology baseline', isScore: true },
              ].map(metric => {
                const isGood = metric.isBias
                  ? Math.abs(metric.value) <= metric.good
                  : metric.isScore
                    ? metric.value >= metric.good
                    : metric.value <= metric.good;
                return (
                  <Grid item xs={6} sm={3} key={metric.label}>
                    <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'rgba(15,23,42,0.5)', borderRadius: 1 }}>
                      <Typography sx={{ color: COLORS.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.5 }}>
                        {metric.label}
                      </Typography>
                      <Typography sx={{ color: isGood ? COLORS.success : COLORS.warning, fontWeight: 700, fontSize: 24 }}>
                        {metric.isBias && metric.value >= 0 ? '+' : ''}
                        {metric.isScore ? metric.value.toFixed(2) : metric.value.toFixed(1)}
                        {metric.unit && <span style={{ fontSize: 12, fontWeight: 400 }}> {metric.unit}</span>}
                      </Typography>
                      <Tooltip title={metric.description}>
                        <Typography sx={{ color: COLORS.muted, fontSize: 10, cursor: 'help' }}>
                          {isGood ? 'Good' : 'Needs improvement'}
                        </Typography>
                      </Tooltip>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>
        );
      })()}

      {/* Badges */}
      <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 2, p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <EmojiEvents sx={{ color: COLORS.warning, fontSize: 20 }} />
          <Typography sx={{ color: COLORS.text, fontWeight: 600, fontSize: 14 }}>
            Badges Earned
          </Typography>
          <Chip
            label={`${BADGES.filter(b => b.earned).length}/${BADGES.length}`}
            size="small"
            sx={{ height: 20, fontSize: 10, bgcolor: 'rgba(245,158,11,0.15)', color: COLORS.warning }}
          />
        </Box>
        <Grid container spacing={1.5}>
          {BADGES.map(badge => (
            <Grid item xs={12} sm={6} md={4} key={badge.id}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 1,
                  border: `1px solid ${badge.earned ? badge.color + '40' : COLORS.border}`,
                  bgcolor: badge.earned ? badge.color + '08' : 'transparent',
                  opacity: badge.earned ? 1 : 0.5,
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    bgcolor: badge.earned ? badge.color + '25' : 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {badge.earned ? (
                    <Star sx={{ color: badge.color, fontSize: 18 }} />
                  ) : (
                    <EmojiEvents sx={{ color: COLORS.muted, fontSize: 18 }} />
                  )}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ color: badge.earned ? COLORS.text : COLORS.muted, fontSize: 12, fontWeight: 600 }}>
                    {badge.name}
                  </Typography>
                  <Typography sx={{ color: COLORS.muted, fontSize: 10, lineHeight: 1.3 }}>
                    {badge.description}
                  </Typography>
                  {badge.earned && badge.earnedDate && (
                    <Typography sx={{ color: badge.color, fontSize: 9, mt: 0.25, fontWeight: 600 }}>
                      Earned {badge.earnedDate}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
};

// frontend#330: ForecastHistorySample charts a series generated in the browser
// (matches the sibling ForecastPreview, already demo-gated by PR #289).
const ForecastHistory = (props) => (
  <DemoSurfaceGate
    title="Forecast history is not live on the testnet yet"
    description="No forecast-verification route is mounted on the testnet API; the predicted-vs-observed series in the preview is generated in the browser."
    testId="forecast-history"
  >
    <ForecastHistorySample {...props} />
  </DemoSurfaceGate>
);

export default ForecastHistory;
