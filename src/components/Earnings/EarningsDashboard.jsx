/**
 * EarningsDashboard Component
 *
 * Two-column earnings overview with bar chart trend
 * and source breakdown with progress bars.
 */

import React, { useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { Bar } from 'react-chartjs-2';
import CountUp from 'react-countup';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import Alert from '@mui/material/Alert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import { useWeatherStations } from '../../hooks/api/useWeatherQueries';
import { isBackendUnavailableError, useBackendHealth } from '../../hooks/api/useBackendHealth';
import { earningsService } from '../../services/apiClient';
import { queryKeys } from '../../lib/queryClient';
import PublicViewerNotice from '../common/PublicViewerNotice';
import './EarningsDashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

const timeRanges = [
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
  { id: '90d', label: '90 Days' },
  { id: '6m', label: '6 Months' },
  { id: '1y', label: '1 Year' },
];

const DAY_MS = 24 * 60 * 60 * 1000;
const RANGE_DAYS = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '6m': 183,
  '1y': 365,
};
const SOURCE_COLORS = ['#0EA5E9', '#22C55E', '#F59E0B', '#A855F7', '#EC4899', '#64748B'];

const SourceBar = ({ source }) => (
  <div className="source-item">
    <div className="source-header">
      <div className="source-info">
        <span className="source-dot" style={{ background: source.color }} />
        <span className="source-name">{source.name}</span>
      </div>
      <span className="source-amount font-mono">
        {source.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} WRF
      </span>
    </div>
    <div className="source-bar">
      <div
        className="source-bar-fill"
        style={{
          width: `${source.percentage}%`,
          background: source.color,
        }}
      />
    </div>
    <span className="source-percentage">{source.percentage.toFixed(1)}%</span>
  </div>
);

const sumAmounts = (entries) => entries.reduce((sum, entry) => sum + entry.amount, 0);

const getErrorMessage = (error, fallback) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

const buildChartBuckets = (entries, timeRange) => {
  const now = new Date();

  if (timeRange === '7d') {
    return Array.from({ length: 7 }, (_, index) => {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      start.setDate(now.getDate() - (6 - index));
      const end = new Date(start);
      end.setDate(start.getDate() + 1);
      return {
        label: start.toLocaleDateString(undefined, { weekday: 'short' }),
        amount: sumAmounts(
          entries.filter((entry) => {
            const timestamp = new Date(entry.timestamp).getTime();
            return timestamp >= start.getTime() && timestamp < end.getTime();
          }),
        ),
      };
    });
  }

  if (timeRange === '30d') {
    return Array.from({ length: 5 }, (_, index) => {
      const start = new Date(now.getTime() - (4 - index) * 7 * DAY_MS);
      const end = new Date(start.getTime() + 7 * DAY_MS);
      return {
        label: `Wk ${index + 1}`,
        amount: sumAmounts(
          entries.filter((entry) => {
            const timestamp = new Date(entry.timestamp).getTime();
            return timestamp >= start.getTime() && timestamp < end.getTime();
          }),
        ),
      };
    });
  }

  const bucketCount = timeRange === '90d' ? 3 : timeRange === '6m' ? 6 : 12;
  return Array.from({ length: bucketCount }, (_, index) => {
    const start = new Date(now.getFullYear(), now.getMonth() - (bucketCount - 1 - index), 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    return {
      label: start.toLocaleDateString(undefined, { month: 'short' }),
      amount: sumAmounts(
        entries.filter((entry) => {
          const timestamp = new Date(entry.timestamp).getTime();
          return timestamp >= start.getTime() && timestamp < end.getTime();
        }),
      ),
    };
  });
};

const buildSources = (entries) => {
  const totals = entries.reduce((acc, entry) => {
    const key = entry.rewardType || 'Reward';
    acc[key] = (acc[key] || 0) + entry.amount;
    return acc;
  }, {});
  const total = Object.values(totals).reduce((sum, amount) => sum + amount, 0);

  return Object.entries(totals)
    .sort(([, left], [, right]) => right - left)
    .map(([name, amount], index) => ({
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
      color: SOURCE_COLORS[index % SOURCE_COLORS.length],
    }));
};

const EarningsDashboard = () => {
  const [timeRange, setTimeRange] = useState('6m');
  const [anchorEl, setAnchorEl] = useState(null);
  const backendHealthQuery = useBackendHealth();
  const stationsQuery = useWeatherStations();
  const stationIds = useMemo(
    () => (stationsQuery.data || []).map((station) => station.id),
    [stationsQuery.data],
  );

  const historyQueries = useQueries({
    queries: stationIds.map((stationId) => ({
      queryKey: queryKeys.earnings.history(stationId),
      queryFn: () => earningsService.getStationHistory(stationId),
      staleTime: 30_000,
      enabled: stationIds.length > 0,
    })),
  });

  const historyEntries = useMemo(
    () => historyQueries.flatMap((query) => query.data || []),
    [historyQueries],
  );
  const rangeDays = RANGE_DAYS[timeRange];
  const currentEntries = useMemo(
    () => {
      const now = Date.now();
      return historyEntries.filter((entry) => now - new Date(entry.timestamp).getTime() <= rangeDays * DAY_MS);
    },
    [historyEntries, rangeDays],
  );
  const previousEntries = useMemo(
    () => {
      const now = Date.now();
      return historyEntries.filter((entry) => {
        const age = now - new Date(entry.timestamp).getTime();
        return age > rangeDays * DAY_MS && age <= rangeDays * DAY_MS * 2;
      });
    },
    [historyEntries, rangeDays],
  );
  const total = sumAmounts(currentEntries);
  const previousPeriod = sumAmounts(previousEntries);
  const change = previousPeriod > 0 ? ((total - previousPeriod) / previousPeriod) * 100 : total > 0 ? 100 : 0;
  const isPositiveChange = change >= 0;
  const sources = useMemo(() => buildSources(currentEntries), [currentEntries]);
  const chartBuckets = useMemo(() => buildChartBuckets(currentEntries, timeRange), [currentEntries, timeRange]);
  const historyError = historyQueries.find((query) => query.isError)?.error || null;
  const historyNotLive = historyError?.name === 'StationEarningsUnavailableError';
  const combinedError = backendHealthQuery.error || stationsQuery.error || historyError;
  const isLoading =
    backendHealthQuery.isLoading ||
    stationsQuery.isLoading ||
    historyQueries.some((query) => query.isLoading);
  const disconnected =
    backendHealthQuery.isError ||
    Boolean((stationsQuery.error || historyError) && isBackendUnavailableError(stationsQuery.error || historyError));

  const chartData = useMemo(() => ({
    labels: chartBuckets.map((bucket) => bucket.label),
    datasets: [
      {
        label: 'Earnings',
        data: chartBuckets.map((bucket) => bucket.amount),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        hoverBackgroundColor: 'rgba(59, 130, 246, 0.9)',
        borderRadius: 6,
        borderSkipped: false,
        barThickness: 28,
      },
    ],
  }), [chartBuckets]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#F8FAFC',
        bodyColor: '#94A3B8',
        borderColor: 'rgba(51, 65, 85, 0.5)',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context) => `${context.raw.toLocaleString(undefined, { minimumFractionDigits: 2 })} WRF`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#64748B',
          font: {
            size: 11,
          },
        },
        border: {
          display: false,
        },
      },
      y: {
        grid: {
          color: 'rgba(51, 65, 85, 0.3)',
          drawBorder: false,
        },
        ticks: {
          color: '#64748B',
          font: {
            size: 11,
            family: 'JetBrains Mono, monospace',
          },
          callback: (value) => `${value}`,
        },
        border: {
          display: false,
        },
      },
    },
  };

  if (disconnected) {
    return (
      <div className="earnings-dashboard dashboard-card">
        <Alert severity="error">
          Cannot load live earnings while the backend is unreachable.
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="earnings-dashboard dashboard-card">
        <Skeleton variant="text" width="35%" height={28} />
        <Skeleton variant="text" width="50%" height={48} />
        <div className="earnings-content">
          <Skeleton variant="rounded" height={160} />
          <Skeleton variant="rounded" height={160} />
        </div>
      </div>
    );
  }

  if (stationsQuery.isError || historyError) {
    if (historyNotLive) {
      return (
        <div className="earnings-dashboard dashboard-card">
          <PublicViewerNotice reason="not-live" />
        </div>
      );
    }
    return (
      <div className="earnings-dashboard dashboard-card">
        <Alert severity="error">
          {getErrorMessage(combinedError, 'Unable to load earnings data.')}
        </Alert>
      </div>
    );
  }

  if (stationIds.length === 0) {
    return (
      <div className="earnings-dashboard dashboard-card">
        <Alert severity="info">
          No stations connected yet. Earnings will appear once a weather station starts submitting data.
        </Alert>
      </div>
    );
  }

  return (
    <div className="earnings-dashboard dashboard-card">
      <div className="earnings-header">
        <div className="earnings-title">
          <h3>Total Earnings</h3>
          <div className="time-range-dropdown">
            <button
              className="dropdown-trigger"
              onClick={(event) => setAnchorEl(event.currentTarget)}
            >
              {timeRanges.find((range) => range.id === timeRange)?.label}
              <ChevronDown size={14} />
            </button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
            >
              {timeRanges.map((range) => (
                <MenuItem
                  key={range.id}
                  selected={timeRange === range.id}
                  onClick={() => {
                    setTimeRange(range.id);
                    setAnchorEl(null);
                  }}
                >
                  {range.label}
                </MenuItem>
              ))}
            </Menu>
          </div>
        </div>

        <div className="earnings-summary">
          <div className="total-amount">
            <span className="amount-value font-mono">
              <CountUp
                end={total}
                duration={1.5}
                decimals={2}
                separator=","
              />
            </span>
            <span className="amount-currency">WRF</span>
          </div>

          <div className={`earnings-change ${isPositiveChange ? 'positive' : 'negative'}`}>
            {isPositiveChange ? (
              <TrendingUp size={16} />
            ) : (
              <TrendingDown size={16} />
            )}
            <span>{isPositiveChange ? '+' : ''}{change.toFixed(1)}%</span>
            <span className="change-label">vs last period</span>
          </div>
        </div>
      </div>

      <div className="earnings-content">
        <div className="earnings-chart-section">
          <div className="chart-header">
            <Calendar size={14} />
            <span>Live Trend</span>
          </div>
          <div className="chart-container">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="earnings-sources-section">
          <div className="sources-header">
            <span>Earnings by Source</span>
          </div>
          <div className="sources-list">
            {sources.length > 0 ? (
              sources.map((source) => (
                <SourceBar key={source.id} source={source} />
              ))
            ) : (
              <Alert severity="info">No earnings recorded for this period yet.</Alert>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarningsDashboard;
