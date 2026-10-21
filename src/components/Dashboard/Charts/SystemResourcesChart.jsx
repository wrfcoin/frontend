import React from 'react';
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
} from 'chart.js';
import { Paper, Box, Typography, Divider, Stack } from '@mui/material';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

const SystemResourcesChart = ({ data }) => {
  // Default time labels (last 24 hours in 2-hour intervals)
  const defaultLabels = [
    '00:00',
    '02:00',
    '04:00',
    '06:00',
    '08:00',
    '10:00',
    '12:00',
    '14:00',
    '16:00',
    '18:00',
    '20:00',
    '22:00',
  ];

  // Default mock data
  const defaultCpuData = [45, 52, 49, 60, 55, 58, 62, 60, 58, 65, 60, 55];
  const defaultRamData = [70, 72, 75, 78, 80, 82, 84, 83, 81, 85, 82, 80];

  // Use provided data or fallback to defaults
  const chartLabels = data?.labels || defaultLabels;
  const cpuData = data?.cpu || defaultCpuData;
  const ramData = data?.ram || defaultRamData;

  // Current CPU and RAM values (last values in the arrays)
  const currentCpuValue = cpuData[cpuData.length - 1];
  const currentRamValue = ramData[ramData.length - 1];

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'CPU Usage (%)',
        data: cpuData,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: 'RAM Usage (%)',
        data: ramData,
        borderColor: 'rgba(153, 102, 255, 1)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        tension: 0.4,
        yAxisID: 'y',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
          borderDash: [5, 5],
        },
        ticks: {
          color: '#666',
        },
      },
      y: {
        position: 'left',
        min: 0,
        max: 100,
        title: {
          display: true,
          text: 'Usage (%)',
          color: '#666',
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
          borderDash: [5, 5],
        },
        ticks: {
          color: '#666',
        },
      },
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          boxWidth: 6,
          boxHeight: 6,
          padding: 20,
          color: '#666',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
      },
    },
  };

  return (
    <Paper elevation={0} sx={{ p: 2, borderRadius: 2 }}>
      <div style={{ marginBottom: '10px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3 style={{ margin: 0 }}>System Resources (Last 24 Hours)</h3>
            <p style={{ color: '#666', margin: '5px 0 0 0' }}>
              Real-time resource monitoring
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div
              style={{
                backgroundColor: 'rgba(75, 192, 192, 0.15)',
                padding: '5px 12px',
                borderRadius: '4px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '12px', color: 'rgba(75, 192, 192, 1)' }}>
                CPU
              </div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: 'rgba(75, 192, 192, 1)',
                }}
              >
                {currentCpuValue}%
              </div>
            </div>
            <div
              style={{
                backgroundColor: 'rgba(153, 102, 255, 0.15)',
                padding: '5px 12px',
                borderRadius: '4px',
                textAlign: 'center',
              }}
            >
              <div
                style={{ fontSize: '12px', color: 'rgba(153, 102, 255, 1)' }}
              >
                RAM
              </div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: 'rgba(153, 102, 255, 1)',
                }}
              >
                {currentRamValue}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <Box sx={{ height: 300, position: 'relative' }}>
        <Line data={chartData} options={options} />
      </Box>
    </Paper>
  );
};

export default SystemResourcesChart;
