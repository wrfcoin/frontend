/**
 * MiningChart Component
 *
 * Dual-axis performance chart showing
 * hash rate and earnings over time.
 */

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Alert from '@mui/material/Alert';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import {
  Pickaxe,
  TrendingUp,
  Activity,
  Zap,
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import './MiningChart.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const EMPTY_DATA = { labels: [], hashRate: [], earnings: [] };

const normalizeSeries = (series = []) => {
  if (!Array.isArray(series)) return EMPTY_DATA;
  return {
    labels: series.map((point, index) => String(point.label || point.timestamp || point.time || index + 1)),
    hashRate: series.map((point) => Number(point.hashRate ?? point.hash_rate ?? point.hashrate ?? 0)),
    earnings: series.map((point) => Number(point.earnings ?? point.rewardRate ?? point.reward_rate ?? 0)),
  };
};

const normalizeMiningData = (response) => {
  const source = response.mining || response.performance || response;
  const normalizeRange = value => {
    if (!value) return EMPTY_DATA;
    if (Array.isArray(value)) return normalizeSeries(value);
    return value;
  };
  return {
    '24h': normalizeRange(source['24h'] || source.last24h || source.hourly || source.points24h || source.series),
    '7d': normalizeRange(source['7d'] || source.last7d || source.daily || source.points7d),
    '30d': normalizeRange(source['30d'] || source.last30d || source.monthly || source.points30d),
  };
};

const fetchMiningData = async () => {
  const response = await apiClient.getWithFallback([
    '/mining/stats',
    '/dashboard/mining',
    '/mining/performance',
  ]);
  return normalizeMiningData(response);
};

const StatCard = ({ icon: Icon, label, value, unit, change, color }) => (
  <div className="mining-stat-card" style={{ '--stat-color': color }}>
    <div className="stat-icon">
      <Icon size={18} />
    </div>
    <div className="stat-content">
      <span className="stat-label">{label}</span>
      <div className="stat-value-row">
        <span className="stat-value font-mono">
          {value}
          <span className="stat-unit">{unit}</span>
        </span>
        {change && (
          <span className={`stat-change ${change >= 0 ? 'positive' : 'negative'}`}>
            {change >= 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
    </div>
  </div>
);

const MiningChart = ({ miningData }) => {
  const [timeRange, setTimeRange] = useState('24h');
  const miningQuery = useQuery({
    queryKey: ['dashboard', 'mining-performance'],
    queryFn: fetchMiningData,
    enabled: miningData === undefined,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const data = useMemo(() => {
    const liveMiningData = miningData === undefined ? miningQuery.data : miningData;
    if (!liveMiningData) return EMPTY_DATA;
    const key = timeRange === '24h' ? '24h' : timeRange === '7d' ? '7d' : '30d';
    return liveMiningData[key] ?? EMPTY_DATA;
  }, [miningData, miningQuery.data, timeRange]);

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Hash Rate (MH/s)',
        data: data.hashRate,
        borderColor: '#A855F7',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        fill: true,
        yAxisID: 'y',
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#A855F7',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        borderWidth: 2,
      },
      {
        label: 'Earnings (WRF/hr)',
        data: data.earnings,
        borderColor: '#22C55E',
        backgroundColor: 'transparent',
        fill: false,
        yAxisID: 'y1',
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#22C55E',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        borderWidth: 2,
        borderDash: [5, 5],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          color: '#94A3B8',
          font: {
            size: 11,
          },
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
          boxHeight: 8,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#F8FAFC',
        bodyColor: '#94A3B8',
        borderColor: 'rgba(51, 65, 85, 0.5)',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: (context) => {
            if (context.datasetIndex === 0) {
              return `Hash Rate: ${context.raw.toFixed(1)} MH/s`;
            }
            return `Earnings: ${context.raw.toFixed(3)} WRF/hr`;
          },
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
            size: 10,
          },
          maxTicksLimit: 8,
        },
        border: {
          display: false,
        },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        grid: {
          color: 'rgba(51, 65, 85, 0.3)',
          drawBorder: false,
        },
        ticks: {
          color: '#A855F7',
          font: {
            size: 10,
            family: 'JetBrains Mono, monospace',
          },
          callback: (value) => `${value} MH/s`,
        },
        border: {
          display: false,
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          display: false,
        },
        ticks: {
          color: '#22C55E',
          font: {
            size: 10,
            family: 'JetBrains Mono, monospace',
          },
          callback: (value) => `${value.toFixed(1)} WRF`,
        },
        border: {
          display: false,
        },
      },
    },
  };

  const hasData = data.hashRate.length > 0;

  const currentHashRate = hasData ? data.hashRate[data.hashRate.length - 1] : null;
  const avgHashRate = hasData ? data.hashRate.reduce((a, b) => a + b, 0) / data.hashRate.length : null;
  const totalEarnings = hasData ? data.earnings.reduce((a, b) => a + b, 0) : null;
  const hashRateChange = hasData && data.hashRate[0] !== 0
    ? ((currentHashRate - data.hashRate[0]) / data.hashRate[0] * 100).toFixed(1)
    : null;

  return (
    <div className="mining-chart dashboard-card">
      <div className="mining-header">
        <div className="mining-title">
          <Pickaxe size={18} />
          <h3>Mining Performance</h3>
        </div>

        <div className="time-range-tabs">
          {['24h', '7d', '30d'].map(range => (
            <button
              key={range}
              className={`range-tab ${timeRange === range ? 'active' : ''}`}
              onClick={() => setTimeRange(range)}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="mining-stats">
        <StatCard
          icon={Activity}
          label="Current Hash Rate"
          value={currentHashRate !== null ? currentHashRate.toFixed(1) : '--'}
          unit=" MH/s"
          change={hashRateChange !== null ? parseFloat(hashRateChange) : undefined}
          color="#A855F7"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Hash Rate"
          value={avgHashRate !== null ? avgHashRate.toFixed(1) : '--'}
          unit=" MH/s"
          color="#8B5CF6"
        />
        <StatCard
          icon={Zap}
          label="Total Earnings"
          value={totalEarnings !== null ? totalEarnings.toFixed(2) : '--'}
          unit=" WRF"
          color="#22C55E"
        />
      </div>

      <div className="chart-area">
        {miningQuery.isLoading ? (
          <Alert severity="info">Loading live mining telemetry...</Alert>
        ) : miningQuery.isError ? (
          <Alert severity="error">Unable to load mining telemetry: {miningQuery.error.message}</Alert>
        ) : hasData ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <div style={{ height: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
            <span>No mining data yet</span>
            <span style={{ fontSize: '0.8em', marginTop: '4px' }}>Hash rate and earnings will appear once the mining feed connects.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MiningChart;
