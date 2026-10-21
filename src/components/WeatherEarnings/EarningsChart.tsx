import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Alert, Box, Typography, Paper, ToggleButtonGroup, ToggleButton, Switch, FormControlLabel, Skeleton } from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { useWeatherEarningsHistory } from '../../hooks/api/useEarningsQueries';
import type { EarningsHistoryEntry } from '../../services/apiClient';
import { formatBaseUnitsToWrf, toBaseUnits, toWrfNumberForChart } from '../../services/apiClient/number';
import { FEATURES } from '../../config/features';

// A per-day average or moving average needs a known daily coverage; the backend serves a recent
// observation window with no proof of it (frontend#437), so these are demo-surface only.
const SHOW_AVERAGES = FEATURES.demoSurfaces;

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler, ChartTooltip, Legend);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DailyEarning {
  date: string;
  label: string;
  amount: string;
  cumulative: string;
}

type TimeRange = '7d' | '30d' | '90d' | '1y';

interface EarningsChartProps {
  stationId: string;
  periodView: string;
}

// Testnet WRF has no monetary value: amounts are shown in WRF only.

// Local calendar day, matching the local-midnight buckets below. A UTC key dropped every reward
// stamped between local midnight and the UTC date change (e.g. 17:00-24:00 in UTC-7) from the chart.
function formatDayKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function buildDailyData(days: number, entries: EarningsHistoryEntry[]): DailyEarning[] {
  const now = new Date();
  const byDay = new Map<string, bigint>();
  // The window starts at the oldest displayed day's local midnight. A constant `days * 24h` cutoff
  // dropped that day's early rewards whenever a DST change made it longer than 24 hours.
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  entries.forEach((entry) => {
    const timestamp = new Date(entry.timestamp);
    if (Number.isNaN(timestamp.getTime())) return;
    if (timestamp.getTime() > now.getTime() || timestamp.getTime() < start.getTime()) return;
    const key = formatDayKey(timestamp);
    const units = toBaseUnits(entry.amount);
    if (units === null) return;
    byDay.set(key, (byDay.get(key) ?? 0n) + units);
  });

  const data: DailyEarning[] = [];
  let cumulative = 0n;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const amount = byDay.get(formatDayKey(d)) ?? 0n;
    cumulative += amount;
    const month = d.toLocaleString('default', { month: 'short' });
    const day = d.getDate();

    data.push({
      date: formatDayKey(d),
      label: `${month} ${day}`,
      amount: amount.toString(),
      cumulative: cumulative.toString(),
    });
  }
  return data;
}

function computeMovingAverage(data: DailyEarning[], window: number): (number | null)[] {
  return data.map((_, i) => {
    if (i < window - 1) return null;
    let sum = 0n;
    for (let j = i - window + 1; j <= i; j++) {
      sum += BigInt(data[j].amount);
    }
    return toWrfNumberForChart(sum / BigInt(window));
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const EarningsChart: React.FC<EarningsChartProps> = ({ stationId, periodView }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [showMovingAvg, setShowMovingAvg] = useState(SHOW_AVERAGES);
  const historyQuery = useWeatherEarningsHistory(stationId);

  const daysMap: Record<TimeRange, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
  const days = daysMap[timeRange];

  useEffect(() => {
    if (periodView === 'daily') setTimeRange('30d');
    if (periodView === 'weekly') setTimeRange('90d');
    if (periodView === 'monthly') setTimeRange('1y');
  }, [periodView]);

  const dailyData = useMemo(
    () => buildDailyData(days, historyQuery.data ?? []),
    [days, historyQuery.data],
  );
  const movingAvg = useMemo(() => computeMovingAverage(dailyData, Math.min(7, days)), [dailyData, days]);

  const unit = 'WRF';

  const handleTimeRangeChange = useCallback((_: React.MouseEvent<HTMLElement>, value: TimeRange | null) => {
    if (value) setTimeRange(value);
  }, []);

  const handleMovingAvgToggle = useCallback(() => {
    setShowMovingAvg((prev) => !prev);
  }, []);

  // Chart.js data for the combined bar + line chart
  const chartData = useMemo(() => {
    const labels = dailyData.map((d) => d.label);
    // Sample labels for readability on large datasets
    const step = days > 90 ? Math.ceil(days / 30) : days > 30 ? 3 : 1;
    const displayLabels = labels.map((l, i) => (i % step === 0 ? l : ''));

    return {
      labels: displayLabels,
      datasets: [
        {
          type: 'bar' as const,
          label: `Daily Earnings (${unit})`,
          data: dailyData.map((d) => {
            const amount = toWrfNumberForChart(d.amount);
            return amount;
          }),
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: '#3B82F6',
          borderWidth: 1,
          borderRadius: 3,
          yAxisID: 'yLeft',
          order: 2,
        },
        {
          type: 'line' as const,
          label: `Cumulative (${unit})`,
          data: dailyData.map((d) => {
            const cumulative = toWrfNumberForChart(d.cumulative);
            return cumulative;
          }),
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          fill: true,
          tension: 0.3,
          yAxisID: 'yRight',
          order: 1,
        },
        ...(SHOW_AVERAGES && showMovingAvg
          ? [
            {
              type: 'line' as const,
              label: `${Math.min(7, days)}d Moving Avg (${unit})`,
              data: movingAvg,
              borderColor: '#F59E0B',
              borderWidth: 2,
              borderDash: [6, 3],
              pointRadius: 0,
              pointHoverRadius: 3,
              fill: false,
              tension: 0.4,
              yAxisID: 'yLeft',
              order: 0,
            },
          ]
          : []),
      ],
    };
  }, [dailyData, movingAvg, unit, showMovingAvg, days]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          position: 'top' as const,
          labels: {
            color: '#94A3B8',
            usePointStyle: true,
            pointStyleWidth: 12,
            padding: 16,
            font: { size: 11 },
          },
        },
        tooltip: {
          backgroundColor: '#1E293B',
          titleColor: '#E2E8F0',
          bodyColor: '#94A3B8',
          borderColor: '#334155',
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          callbacks: {
            label: (ctx: { dataset: { label: string }; parsed: { y: number } }) => {
              const val = ctx.parsed.y;
              if (val == null) return '';
              return `${ctx.dataset.label}: ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} WRF`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(51, 65, 85, 0.4)' },
          ticks: { color: '#64748B', font: { size: 10 }, maxRotation: 45 },
        },
        yLeft: {
          position: 'left' as const,
          grid: { color: 'rgba(51, 65, 85, 0.4)' },
          ticks: {
            color: '#3B82F6',
            font: { size: 10 },
            callback: (value: number | string) => `${value}`,
          },
          title: { display: true, text: `Daily (${unit})`, color: '#3B82F6', font: { size: 11 } },
        },
        yRight: {
          position: 'right' as const,
          grid: { drawOnChartArea: false },
          ticks: {
            color: '#10B981',
            font: { size: 10 },
            callback: (value: number | string) => `${value}`,
          },
          title: { display: true, text: `Cumulative (${unit})`, color: '#10B981', font: { size: 11 } },
        },
      },
    }),
    [unit],
  );

  // Compute totals for header
  const totalForPeriod = dailyData.reduce((s, d) => s + BigInt(d.amount), 0n);
  const avgDaily = dailyData.length > 0 ? totalForPeriod / BigInt(dailyData.length) : 0n;
  const formatHeaderAmount = (units: bigint): string => formatBaseUnitsToWrf(units, 2) ?? '—';

  if (historyQuery.isLoading) {
    return (
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: '#1E293B', border: '1px solid #334155' }}>
        <Skeleton variant="text" width={180} sx={{ bgcolor: '#334155' }} />
        <Skeleton variant="rounded" height={350} sx={{ bgcolor: '#334155', mt: 2 }} />
      </Paper>
    );
  }

  if (historyQuery.isError) {
    return (
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: '#1E293B', border: '1px solid #334155' }}>
        <Alert severity="error" sx={{ bgcolor: 'rgba(239,68,68,0.12)', color: '#FECACA' }}>
          Unable to load station earnings history.
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: '#1E293B', border: '1px solid #334155' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, mb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 700 }}>
            Earnings Over Time
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, mt: 0.5 }}>
            <Typography variant="body2" sx={{ color: '#94A3B8' }}>
              Total: <Box component="span" sx={{ color: '#10B981', fontWeight: 600 }}>{formatHeaderAmount(totalForPeriod)} {unit}</Box>
            </Typography>
            {SHOW_AVERAGES && (
              <Typography variant="body2" sx={{ color: '#94A3B8' }}>
                Avg/day: <Box component="span" sx={{ color: '#3B82F6', fontWeight: 600 }}>{formatHeaderAmount(avgDaily)} {unit}</Box>
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          {SHOW_AVERAGES && (
            <FormControlLabel
              control={<Switch size="small" checked={showMovingAvg} onChange={handleMovingAvgToggle} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#F59E0B' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#F59E0B' } }} />}
              label={<Typography variant="caption" sx={{ color: '#94A3B8' }}>Avg</Typography>}
            />
          )}
        </Box>
      </Box>

      {/* Time Range Selector */}
      <Box sx={{ mb: 2 }}>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={timeRange}
          onChange={handleTimeRangeChange}
          sx={{
            '.MuiToggleButton-root': {
              color: '#94A3B8',
              borderColor: '#334155',
              textTransform: 'none',
              px: 2,
              py: 0.5,
              fontSize: '0.75rem',
              '&.Mui-selected': { bgcolor: 'rgba(59,130,246,0.15)', color: '#3B82F6', borderColor: '#3B82F6' },
              '&.Mui-selected:hover': { bgcolor: 'rgba(59,130,246,0.25)' },
            },
          }}
        >
          <ToggleButton value="7d">7D</ToggleButton>
          <ToggleButton value="30d">30D</ToggleButton>
          <ToggleButton value="90d">90D</ToggleButton>
          <ToggleButton value="1y">1Y</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Chart */}
      <Box sx={{ height: 350, position: 'relative' }}>
        <Line data={chartData as any} options={chartOptions as any} />
      </Box>
    </Paper>
  );
};

export default EarningsChart;
