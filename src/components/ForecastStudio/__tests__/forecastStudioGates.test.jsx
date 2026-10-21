/** @jest-environment jsdom */
//
// frontend#330 — ForecastEditor charted a 72-hour model output and
// ForecastHistory a predicted-vs-observed series, both generated with
// Math.random() in the browser. Each now goes through DemoSurfaceGate
// (matching the sibling ForecastPreview, PR #289).
import { jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const featuresMock = { demoSurfaces: false };
jest.unstable_mockModule('../../../config/features', () => ({ default: featuresMock, FEATURES: featuresMock }));
jest.unstable_mockModule('react-chartjs-2', () => ({
  Line: () => React.createElement('div', { 'data-testid': 'line-chart' }),
  Bar: () => React.createElement('div', { 'data-testid': 'bar-chart' }),
}));
jest.unstable_mockModule('chart.js', () => ({
  Chart: { register: () => {} },
  CategoryScale: class {}, LinearScale: class {}, BarElement: class {}, PointElement: class {}, LineElement: class {},
  ArcElement: class {}, Filler: class {}, Tooltip: class {}, Legend: class {}, Title: class {}, TimeScale: class {},
}));

const { default: ForecastEditor } = await import('../ForecastEditor');
const { default: ForecastHistory } = await import('../ForecastHistory');

describe('Forecast Studio panels — demo mode OFF (default)', () => {
  beforeEach(() => { featuresMock.demoSurfaces = false; });
  it('ForecastEditor renders the not-live notice and no generated chart', () => {
    render(<ForecastEditor forecastData={null} onForecastChange={() => {}} />);
    expect(screen.getByTestId('forecast-editor-not-live')).toBeInTheDocument();
    expect(screen.getByText('Model guidance is not live on the testnet yet')).toBeInTheDocument();
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
  });
  it('ForecastHistory renders the not-live notice and no generated series', () => {
    render(<ForecastHistory />);
    expect(screen.getByTestId('forecast-history-not-live')).toBeInTheDocument();
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Sample data/);
  });
});

describe('Forecast Studio panels — demo mode ON', () => {
  beforeEach(() => { featuresMock.demoSurfaces = true; });
  it('ForecastHistory renders the sample only under the badge', () => {
    render(<ForecastHistory />);
    expect(screen.getByTestId('forecast-history-sample-badge')).toBeInTheDocument();
    expect(screen.queryByTestId('forecast-history-not-live')).not.toBeInTheDocument();
  });
});
