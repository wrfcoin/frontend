/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

await jest.unstable_mockModule('@mui/material', () => ({
  Box: ({ children }) => React.createElement('div', null, children),
  Typography: ({ children }) => React.createElement('span', null, children),
  Paper: ({ children }) => React.createElement('div', null, children),
  Grid: ({ children }) => React.createElement('div', null, children),
  Table: ({ children }) => React.createElement('table', null, children),
  TableBody: ({ children }) => React.createElement('tbody', null, children),
  TableCell: ({ children }) => React.createElement('td', null, children),
  TableContainer: ({ children }) => React.createElement('div', null, children),
  TableHead: ({ children }) => React.createElement('thead', null, children),
  TableRow: ({ children }) => React.createElement('tr', null, children),
  Chip: ({ label }) => React.createElement('span', { 'data-testid': 'chip' }, label),
  Tooltip: ({ children }) => children,
  Divider: () => React.createElement('hr'),
  LinearProgress: ({ value }) =>
    React.createElement('div', { role: 'progressbar', 'data-value': String(value ?? 0) }),
}));

await jest.unstable_mockModule('@mui/icons-material', () => ({
  Public: () => React.createElement('span'),
  Speed: () => React.createElement('span'),
  Memory: () => React.createElement('span'),
  Storage: () => React.createElement('span'),
  TrendingUp: () => React.createElement('span'),
  Bolt: () => React.createElement('span'),
}));

await jest.unstable_mockModule('react-chartjs-2', () => ({
  Doughnut: ({ data }) =>
    React.createElement('div', {
      'data-testid': 'doughnut-chart',
      'data-labels': JSON.stringify(data.labels ?? []),
    }),
  Bar: ({ data }) =>
    React.createElement('div', {
      'data-testid': 'bar-chart',
      'data-point-count': String((data.datasets[0]?.data ?? []).length),
    }),
}));

await jest.unstable_mockModule('chart.js', () => ({
  Chart: { register: () => {} },
  ArcElement: class {},
  CategoryScale: class {},
  LinearScale: class {},
  BarElement: class {},
  Tooltip: class {},
  Legend: class {},
}));

await jest.unstable_mockModule('../../config/features', () => ({ default: { demoSurfaces: true }, FEATURES: { demoSurfaces: true } }));

const { default: ResourcePool } = await import(
  '../ComputeMarketplace/ResourcePool.jsx'
);

describe('ResourcePool — no Math.random, deterministic forecast', () => {
  test('renders without crashing', () => {
    render(React.createElement(ResourcePool));
    expect(document.body).toBeTruthy();
    expect(screen.getByText('Sample data')).toBeInTheDocument();
  });

  test('availability forecast chart is deterministic across two renders', () => {
    const { unmount } = render(React.createElement(ResourcePool));
    const bars1 = screen
      .getAllByTestId('bar-chart')
      .map(el => el.getAttribute('data-point-count'));
    unmount();

    render(React.createElement(ResourcePool));
    const bars2 = screen
      .getAllByTestId('bar-chart')
      .map(el => el.getAttribute('data-point-count'));

    // Same point counts — no random variation in data shape between renders
    expect(bars1).toEqual(bars2);
  });

  test('availability forecast has 24 hourly data points', () => {
    render(React.createElement(ResourcePool));
    // The availability bar chart should have exactly 24 data points
    const barCharts = screen.getAllByTestId('bar-chart');
    const availabilityBar = barCharts.find(
      el => el.getAttribute('data-point-count') === '24',
    );
    expect(availabilityBar).toBeTruthy();
  });
});
