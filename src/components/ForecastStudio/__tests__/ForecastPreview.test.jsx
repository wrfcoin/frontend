/** @jest-environment jsdom */
//
// frontend#286 — ForecastPreview must not render fabricated temperature/
// precipitation series as if they were real data.
//
// Two scenarios, tested separately:
//   1. No real forecast is loaded (API blocked/404) and demo mode is OFF —
//      the default for a real/public visitor. No Math.random() series may
//      render; the honest not-live state must render instead.
//   2. Demo mode is explicitly ON — the synthetic series may render, but
//      only with a visible "Sample data" badge marking it as fabricated.
//
// `FEATURES` and `apiClient` are mocked once, at module scope, as shared
// mutable objects/functions whose behavior each test configures. Calling
// jest.resetModules() between tests here would create a second copy of the
// React/react-dom module graph (the classic ESM "Cannot read properties of
// null (reading 'useState')" failure), so this file deliberately avoids it.
import { jest } from '@jest/globals';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockGet = jest.fn();
const featuresMock = { demoSurfaces: false };

jest.unstable_mockModule('../../../services/apiClient', () => ({
  apiClient: { get: mockGet },
}));

jest.unstable_mockModule('../../../config/features', () => ({
  default: featuresMock,
  FEATURES: featuresMock,
}));

jest.unstable_mockModule('react-chartjs-2', () => ({
  Line: ({ data }) =>
    React.createElement('div', {
      'data-testid': 'temp-line-chart',
      'data-point-count': String((data.datasets[0]?.data ?? []).length),
    }),
  Bar: ({ data }) =>
    React.createElement('div', {
      'data-testid': 'precip-bar-chart',
      'data-point-count': String((data.datasets[0]?.data ?? []).length),
    }),
}));

jest.unstable_mockModule('chart.js', () => ({
  Chart: { register: () => {} },
  CategoryScale: class {},
  LinearScale: class {},
  PointElement: class {},
  LineElement: class {},
  BarElement: class {},
  Title: class {},
  Tooltip: class {},
  Legend: class {},
  Filler: class {},
}));

const { default: ForecastPreview } = await import('../ForecastPreview');

function realForecastPayload() {
  return {
    forecast: {
      title: 'Real Forecast',
      issuedBy: 'Real Forecaster',
      issuedAt: 'Now',
      region: 'Real Region',
      regionDescription: 'A real region.',
      eventTags: [],
      validStart: 'Now',
      validEnd: 'Later',
      models: ['GFS'],
      parameters: [],
      narrativeSections: [],
    },
  };
}

beforeEach(() => {
  mockGet.mockReset();
  featuresMock.demoSurfaces = false;
});

describe('ForecastPreview — demo mode OFF (default, public visitor)', () => {
  it('renders the honest not-live state and no synthetic series when the API is blocked', async () => {
    mockGet.mockRejectedValue(new Error('network blocked'));

    render(<ForecastPreview />);

    await waitFor(() => {
      expect(screen.getByText('No forecast preview available')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('temp-line-chart')).not.toBeInTheDocument();
    expect(screen.queryByTestId('precip-bar-chart')).not.toBeInTheDocument();
    expect(screen.queryByTestId('forecast-sample-data-badge')).not.toBeInTheDocument();
  });

  it('renders a real forecast but replaces the fabricated charts with an honest notice', async () => {
    mockGet.mockResolvedValue(realForecastPayload());

    render(<ForecastPreview />);

    await waitFor(() => {
      expect(screen.getByText('Real Forecast')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('temp-line-chart')).not.toBeInTheDocument();
    expect(screen.queryByTestId('precip-bar-chart')).not.toBeInTheDocument();
    expect(screen.getByText('Temperature series unavailable')).toBeInTheDocument();
    expect(screen.getByText('Precipitation series unavailable')).toBeInTheDocument();
    // Real forecast metadata, not the demo fallback — no badge expected.
    expect(screen.queryByTestId('forecast-sample-data-badge')).not.toBeInTheDocument();
  });
});

describe('ForecastPreview — demo mode ON', () => {
  beforeEach(() => {
    featuresMock.demoSurfaces = true;
  });

  it('renders the synthetic series with a visible sample-data badge when no real forecast is loaded', async () => {
    mockGet.mockRejectedValue(new Error('network blocked'));

    render(<ForecastPreview />);

    await waitFor(() => {
      expect(screen.getByTestId('temp-line-chart')).toBeInTheDocument();
    });

    expect(screen.getByTestId('precip-bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('forecast-sample-data-badge')).toBeInTheDocument();
    expect(screen.getByTestId('temp-chart-sample-data-badge')).toBeInTheDocument();
    expect(screen.getByTestId('precip-chart-sample-data-badge')).toBeInTheDocument();
  });

  it('renders the synthetic series with a badge even alongside a real forecast', async () => {
    mockGet.mockResolvedValue(realForecastPayload());

    render(<ForecastPreview />);

    await waitFor(() => {
      expect(screen.getByText('Real Forecast')).toBeInTheDocument();
    });

    expect(screen.getByTestId('temp-line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('precip-bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('temp-chart-sample-data-badge')).toBeInTheDocument();
    expect(screen.getByTestId('precip-chart-sample-data-badge')).toBeInTheDocument();
    // This is a real forecast, not the hard-coded fallback object.
    expect(screen.queryByTestId('forecast-sample-data-badge')).not.toBeInTheDocument();
  });
});
