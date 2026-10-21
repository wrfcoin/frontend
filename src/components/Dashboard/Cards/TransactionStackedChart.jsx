import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const TransactionStackedChart = ({ title }) => {
  // Mock data - in a real app, this would come from props or API
  const data = [
    {
      month: 'Jan',
      regular: 5800,
      computational: 2400,
      privacy: 1400,
      governance: 980,
      crossChain: 1200,
    },
    {
      month: 'Feb',
      regular: 6300,
      computational: 2600,
      privacy: 1600,
      governance: 1120,
      crossChain: 1500,
    },
    {
      month: 'Mar',
      regular: 6800,
      computational: 2900,
      privacy: 1800,
      governance: 1350,
      crossChain: 1700,
    },
    {
      month: 'Apr',
      regular: 7200,
      computational: 3300,
      privacy: 2100,
      governance: 1580,
      crossChain: 1950,
    },
    {
      month: 'May',
      regular: 7800,
      computational: 3700,
      privacy: 2400,
      governance: 1780,
      crossChain: 2300,
    },
    {
      month: 'Jun',
      regular: 8500,
      computational: 4100,
      privacy: 2800,
      governance: 2100,
      crossChain: 2600,
    },
  ];

  // Calculate total transactions for display
  const totalTransactions = data.reduce((acc, curr) => {
    return (
      acc +
      curr.regular +
      curr.computational +
      curr.privacy +
      curr.governance +
      curr.crossChain
    );
  }, 0);

  const cardStyle = {
    background: '#fff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    minHeight: '400px',
    height: '100%',
    width: '100%',
  };

  const titleStyle = {
    fontSize: '14px',
    color: '#666',
    fontWeight: 'normal',
    margin: 0,
  };

  const valueStyle = {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#2e7d32',
    margin: '10px 0',
  };

  const chartContainerStyle = {
    width: '100%',
    height: '300px',
    marginTop: '10px',
    flex: '1',
  };

  return (
    <div style={cardStyle}>
      <div style={titleStyle}>{title}</div>
      <div style={valueStyle}>{totalTransactions.toLocaleString()}</div>

      <div style={chartContainerStyle}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="regular"
              stackId="1"
              stroke="#8884d8"
              fill="#8884d8"
              name="Regular"
            />
            <Area
              type="monotone"
              dataKey="computational"
              stackId="1"
              stroke="#4caf50"
              fill="#4caf50"
              name="Computational"
            />
            <Area
              type="monotone"
              dataKey="privacy"
              stackId="1"
              stroke="#ff9800"
              fill="#ff9800"
              name="Privacy"
            />
            <Area
              type="monotone"
              dataKey="governance"
              stackId="1"
              stroke="#2196f3"
              fill="#2196f3"
              name="Governance"
            />
            <Area
              type="monotone"
              dataKey="crossChain"
              stackId="1"
              stroke="#f44336"
              fill="#f44336"
              name="Cross-Chain"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TransactionStackedChart;
