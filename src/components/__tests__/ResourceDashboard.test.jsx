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
  Card: ({ children }) => React.createElement('div', null, children),
  CardContent: ({ children }) => React.createElement('div', null, children),
  Switch: ({ checked, onChange }) =>
    React.createElement('input', { type: 'checkbox', checked: !!checked, onChange: onChange ?? (() => {}) }),
  Slider: () => React.createElement('input', { type: 'range' }),
  Divider: () => React.createElement('hr'),
  Chip: ({ label }) => React.createElement('span', { 'data-testid': 'chip' }, label),
  Tooltip: ({ children }) => children,
  Button: ({ children, onClick }) => React.createElement('button', { onClick }, children),
  LinearProgress: ({ value }) =>
    React.createElement('div', { role: 'progressbar', 'data-value': String(value ?? 0) }),
}));

await jest.unstable_mockModule('@mui/icons-material', () => ({
  Memory: () => React.createElement('span'),
  Speed: () => React.createElement('span'),
  Bolt: () => React.createElement('span'),
  TrendingUp: () => React.createElement('span'),
  Timer: () => React.createElement('span'),
  Storage: () => React.createElement('span'),
}));

await jest.unstable_mockModule('react-chartjs-2', () => ({
  Bar: ({ data }) =>
    React.createElement('div', {
      'data-testid': 'bar-chart',
      'data-values': JSON.stringify(data.datasets[0]?.data ?? []),
    }),
  Doughnut: ({ data }) =>
    React.createElement('div', {
      'data-testid': 'doughnut-chart',
      'data-labels': JSON.stringify(data.labels ?? []),
    }),
}));

await jest.unstable_mockModule('chart.js', () => ({
  Chart: { register: () => {} },
  CategoryScale: class {},
  LinearScale: class {},
  BarElement: class {},
  ArcElement: class {},
  Tooltip: class {},
  Legend: class {},
}));

await jest.unstable_mockModule('../../config/features', () => ({ default: { demoSurfaces: true }, FEATURES: { demoSurfaces: true } }));
jest.useFakeTimers({ now: Date.UTC(2026, 9, 3, 12), doNotFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
afterAll(() => jest.useRealTimers());

const { default: ResourceDashboard } = await import(
  '../ComputeMarketplace/ResourceDashboard.jsx'
);

describe('ResourceDashboard — no Math.random in earnings', () => {
  test('renders without crashing', () => {
    render(React.createElement(ResourceDashboard));
    expect(document.body).toBeTruthy();
    expect(screen.getByText('Sample data')).toBeInTheDocument();
  });

  test('daily earnings chart is deterministic across two renders', () => {
    const { unmount } = render(React.createElement(ResourceDashboard));
    const firstBarEl = screen.getAllByTestId('bar-chart')[0];
    const values1 = JSON.parse(firstBarEl?.getAttribute('data-values') ?? '[]');
    unmount();

    render(React.createElement(ResourceDashboard));
    const secondBarEl = screen.getAllByTestId('bar-chart')[0];
    const values2 = JSON.parse(secondBarEl?.getAttribute('data-values') ?? '[]');

    expect(values1).toEqual(values2);
    expect(values1.length).toBe(14);
  });

  test('daily earnings values never vary between week and weekend (deterministic base)', () => {
    render(React.createElement(ResourceDashboard));
    const barEl = screen.getAllByTestId('bar-chart')[0];
    const values = JSON.parse(barEl?.getAttribute('data-values') ?? '[]');
    // All values should be exact deterministic numbers (no Math.random jitter)
    // Weekday base=14, weekend base=8; no random offset means each value === its base
    const uniqueValues = new Set(values);
    // We expect at most 2 distinct values (14 for weekdays, 8 for weekends)
    expect(uniqueValues.size).toBeLessThanOrEqual(2);
  });
});
