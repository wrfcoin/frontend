/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

await jest.unstable_mockModule('react-chartjs-2', () => ({
  Line: ({ data }) =>
    React.createElement('div', {
      'data-testid': 'line-chart',
      'data-point-count': String((data.datasets[0]?.data ?? []).length),
    }),
}));

await jest.unstable_mockModule('chart.js', () => ({
  Chart: { register: () => {} },
  CategoryScale: class {},
  LinearScale: class {},
  PointElement: class {},
  LineElement: class {},
  Title: class {},
  Tooltip: class {},
  Legend: class {},
  Filler: class {},
}));

const { default: TransactionChart } = await import(
  '../Dashboard/Charts/TransactionChart.jsx'
);

describe('TransactionChart — real-data wiring', () => {
  test('shows empty state when websocketData is undefined', () => {
    render(React.createElement(TransactionChart, { websocketData: undefined }));
    expect(screen.getByText('No transaction data yet')).toBeInTheDocument();
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
  });

  test('shows empty state when websocketData has no transactions', () => {
    render(React.createElement(TransactionChart, { websocketData: {} }));
    expect(screen.getByText('No transaction data yet')).toBeInTheDocument();
  });

  test('shows empty state when transactions array is empty', () => {
    render(
      React.createElement(TransactionChart, {
        websocketData: { transactions: [] },
      }),
    );
    expect(screen.getByText('No transaction data yet')).toBeInTheDocument();
  });

  test('renders chart when real transaction data is present', () => {
    const transactions = [
      { timestamp: Date.now() - 3600000, count: 42 },
      { timestamp: Date.now() - 1800000, count: 38 },
      { timestamp: Date.now(), count: 55 },
    ];
    render(
      React.createElement(TransactionChart, {
        websocketData: { transactions },
      }),
    );
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.queryByText('No transaction data yet')).not.toBeInTheDocument();
  });

  test('time range buttons are rendered', () => {
    render(React.createElement(TransactionChart, { websocketData: undefined }));
    expect(screen.getByText('Day')).toBeInTheDocument();
    expect(screen.getByText('Week')).toBeInTheDocument();
    expect(screen.getByText('Month')).toBeInTheDocument();
  });

  test('switching time range keeps empty state when no data', () => {
    render(React.createElement(TransactionChart, { websocketData: undefined }));
    fireEvent.click(screen.getByText('Week'));
    expect(screen.getByText('No transaction data yet')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Month'));
    expect(screen.getByText('No transaction data yet')).toBeInTheDocument();
  });
});
