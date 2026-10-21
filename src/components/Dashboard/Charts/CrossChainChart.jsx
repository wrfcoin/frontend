import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

const CrossChainChart = ({ data }) => {
  const [timeRange, setTimeRange] = useState('week');

  // Default data if not provided
  const defaultData = {
    ethereum: [42, 35, 48, 39, 42, 38, 45],
    solana: [28, 31, 24, 29, 34, 30, 32],
    polkadot: [15, 18, 12, 16, 14, 19, 17],
    other: [5, 6, 8, 4, 7, 5, 6],
  };

  const networks = data ? Object.keys(data) : Object.keys(defaultData);
  const chartData = data || defaultData;

  // Generate labels based on time range
  let labels = [];
  if (timeRange === 'day') {
    labels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:59'];
  } else if (timeRange === 'week') {
    labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  } else if (timeRange === 'month') {
    labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
  }

  const barData = {
    labels,
    datasets: networks.map((network, index) => {
      const colors = [
        { bg: 'rgba(54, 162, 235, 0.6)', border: 'rgba(54, 162, 235, 1)' },
        { bg: 'rgba(75, 192, 192, 0.6)', border: 'rgba(75, 192, 192, 1)' },
        { bg: 'rgba(153, 102, 255, 0.6)', border: 'rgba(153, 102, 255, 1)' },
        { bg: 'rgba(255, 159, 64, 0.6)', border: 'rgba(255, 159, 64, 1)' },
      ];

      return {
        label: network.charAt(0).toUpperCase() + network.slice(1),
        data:
          timeRange === 'month'
            ? chartData[network].slice(0, 4)
            : chartData[network],
        backgroundColor: colors[index % colors.length].bg,
        borderColor: colors[index % colors.length].border,
        borderWidth: 1,
      };
    }),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          color: '#666',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(200, 200, 200, 0.1)',
        },
        ticks: {
          color: '#666',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#666',
        },
      },
    },
  };

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3>Cross-Chain Transaction Rate</h3>
        <div className="chart-controls">
          <button
            className={`chart-control-btn ${timeRange === 'day' ? 'active' : ''}`}
            onClick={() => setTimeRange('day')}
          >
            Day
          </button>
          <button
            className={`chart-control-btn ${timeRange === 'week' ? 'active' : ''}`}
            onClick={() => setTimeRange('week')}
          >
            Week
          </button>
          <button
            className={`chart-control-btn ${timeRange === 'month' ? 'active' : ''}`}
            onClick={() => setTimeRange('month')}
          >
            Month
          </button>
        </div>
      </div>
      <div className="chart-wrapper">
        <Bar data={barData} options={options} height={300} />
      </div>
    </div>
  );
};

export default CrossChainChart;
