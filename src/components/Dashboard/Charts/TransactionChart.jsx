import React, { useState } from 'react';
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

const EMPTY_CHART = {
  labels: [],
  datasets: [
    {
      label: 'Transactions Per Second (TPS)',
      data: [],
      borderColor: 'rgba(75, 192, 192, 1)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.4,
      fill: true,
    },
  ],
};

/**
 * Aggregates real transaction data from websocketData.transactions into
 * time-bucketed TPS values for the selected time range.
 */
const buildChartData = (transactions, timeRange) => {
  if (!Array.isArray(transactions) || transactions.length === 0) return null;

  const now = Date.now();
  let buckets;
  let labels;

  if (timeRange === 'day') {
    labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    buckets = new Array(24).fill(0);
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    transactions.forEach(tx => {
      const ts = new Date(tx.timestamp ?? tx.createdAt ?? 0).getTime();
      if (ts >= oneDayAgo) {
        const hour = new Date(ts).getHours();
        buckets[hour]++;
      }
    });
  } else if (timeRange === 'week') {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    labels = days;
    buckets = new Array(7).fill(0);
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    transactions.forEach(tx => {
      const ts = new Date(tx.timestamp ?? tx.createdAt ?? 0).getTime();
      if (ts >= oneWeekAgo) {
        const day = (new Date(ts).getDay() + 6) % 7; // 0=Mon
        buckets[day]++;
      }
    });
  } else {
    labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    buckets = new Array(4).fill(0);
    const oneMonthAgo = now - 28 * 24 * 60 * 60 * 1000;
    transactions.forEach(tx => {
      const ts = new Date(tx.timestamp ?? tx.createdAt ?? 0).getTime();
      if (ts >= oneMonthAgo) {
        const weekIndex = Math.min(
          3,
          Math.floor((ts - oneMonthAgo) / (7 * 24 * 60 * 60 * 1000)),
        );
        buckets[weekIndex]++;
      }
    });
  }

  return {
    labels,
    datasets: [
      {
        ...EMPTY_CHART.datasets[0],
        data: buckets,
      },
    ],
  };
};

const TransactionChart = ({ websocketData }) => {
  const [timeRange, setTimeRange] = useState('day');
  const chartData = buildChartData(websocketData?.transactions, timeRange);
  const hasData = chartData !== null;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { usePointStyle: true, color: '#666' },
      },
      tooltip: { backgroundColor: 'rgba(0, 0, 0, 0.7)' },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(200, 200, 200, 0.1)' },
        ticks: { color: '#666' },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#666', maxRotation: 0, autoSkip: true },
      },
    },
    layout: { padding: 0 },
  };

  return (
    <div className="chart-container">
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <h3 style={{ margin: '0' }}>Transactions Per Second (TPS)</h3>
      </div>
      <div
        className="chart-wrapper"
        style={{ width: '100%', position: 'relative' }}
      >
        <div
          className="chart-controls"
          style={{
            position: 'absolute',
            top: '0',
            right: '10px',
            zIndex: 10,
            background: 'rgba(42, 42, 42, 0.7)',
            borderRadius: '4px',
            padding: '3px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        >
          {['day', 'week', 'month'].map(range => (
            <button
              key={range}
              className={`chart-control-btn ${timeRange === range ? 'active' : ''}`}
              onClick={() => setTimeRange(range)}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>

        {hasData ? (
          <Line data={chartData} options={options} height={300} width="100%" />
        ) : (
          <div
            style={{
              height: '300px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '1rem' }}>No transaction data yet</span>
            <span style={{ fontSize: '0.875rem' }}>
              TPS data will appear here once the WebSocket feed connects.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionChart;
