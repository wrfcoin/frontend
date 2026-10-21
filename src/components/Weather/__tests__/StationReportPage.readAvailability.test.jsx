/** @jest-environment jsdom */
// Observation and quality reads (frontend#522 follow-up): a failed read is
// unavailable, never an empty history or an absent-quality claim.
// Real public StationReportPage, Query hooks, WeatherService and ApiClient.
// Only build flags, the network and canvas chart rendering are substituted.
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { jest } from '@jest/globals';

await jest.unstable_mockModule('../../../config/features', () => ({
  FEATURES: { publicReadonly: true, fullStudio: false },
}));
await jest.unstable_mockModule('react-chartjs-2', () => ({
  // Expose the real filtered row values without rendering a canvas.
  Line: ({ data }) => <output aria-label="Observation temperatures">{data.datasets[0].data.join(', ')}</output>,
  Bar: () => null,
}));
const { default: StationReportPage } = await import('../StationReportPage');
const { clearAuthToken } = await import('../../../services/authTokenStore');
const STATION = 'st_123456abcdef';
const OBS_UNAVAILABLE = 'Observation history is unavailable right now. Try again later.';
const OBS_EMPTY = 'No observation history is available for this station yet.';
const QUALITY_UNAVAILABLE = 'Quality data is unavailable right now. Try again later.';
const QUALITY_EMPTY = 'Quality dimensions are not available for this station yet.';
const originalFetch = global.fetch;
let client;
let observations;
let quality;
const json = (status, body) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json' },
});
const down = () => json(503, { error: { code: 'STATION_DATA_UNAVAILABLE', message: 'station data temporarily unavailable' } });

beforeEach(() => {
  clearAuthToken();
  localStorage.clear();
  observations = () => json(200, { observations: [] });
  quality = () => json(200, { overall: null, dimensions: [], unavailable: ['quality'] });
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  global.fetch = jest.fn(async input => {
    const path = new URL(String(input), 'https://synthetic.invalid').pathname;
    if (path === '/api/weather/stations') return json(200, {
      stations: [{ alias: STATION, name: 'Synthetic station', status: 'registered' }],
      total: 1, hasMore: false, nextCursor: null, source: 'wrfcoin-contributors',
    });
    if (path === `/api/stations/${STATION}/submissions`) return json(200, { submissions: [], source: 'backend-db', limit: 50, offset: 0 });
    if (path === `/api/stations/${STATION}/observations`) return observations();
    if (path === `/api/stations/${STATION}/quality`) return quality();
    throw new Error(`Unexpected transport: ${path}`);
  });
});
afterEach(() => { cleanup(); client.clear(); global.fetch = originalFetch; });

async function mount() {
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/weather/station/${STATION}`]}>
        <Routes><Route path="/weather/station/:stationId" element={<StationReportPage />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  await screen.findByText('Synthetic station');
}

// Bodies copied from backend server/routes/station-detail-routes.ts (main d299f4e6).
const PRODUCER = {
  unavailable200: () => json(200, { observations: [], source: 'backend-db', core4Unavailable: 'CORE4_UNREACHABLE', unavailable: ['observations'] }),
  dataUnavailable503: down,
  contractMismatch502: () => json(502, { error: { code: 'CORE4_CONTRACT_MISMATCH', message: 'core4 station observations response did not match the expected shape' } }),
  lookupUnavailable503: () => json(503, { error: { code: 'STATION_LOOKUP_UNAVAILABLE', message: 'station lookup unavailable' } }),
  realEmptyCore4: () => json(200, {
    observations: [], source: 'core4', order: 'descending-height',
    cursor: { nextAfter: null, nextOffset: null, hasMore: null, chainHeight: 5 },
    tail: { fromHeight: 0, toHeight: 5, complete: true },
  }),
  dbRowsWhileCore4Down: () => json(200, {
    // Keep this row inside the default seven-day window as the suite ages.
    observations: [{ timestamp: new Date().toISOString(), temperature: 18.5, humidity: 60 }],
    source: 'backend-db', core4Unavailable: 'CORE4_UNREACHABLE',
  }),
};

// Transport failures are retried with backoff by the hook before it reports an error.
it.each(['unavailable200', 'dataUnavailable503', 'contractMismatch502', 'lookupUnavailable503'])(
  'producer answer %s is unavailable, not an empty history', async name => {
    observations = PRODUCER[name];
    await mount();
    await screen.findByText(OBS_UNAVAILABLE, {}, { timeout: 12000 });
    expect(screen.queryByText(OBS_EMPTY)).toBeNull();
  }, 20000);

it('a real empty core4 window (no unavailable key) keeps the no-history text', async () => {
  observations = PRODUCER.realEmptyCore4;
  await mount();
  await screen.findByText(OBS_EMPTY);
  expect(screen.queryByText(OBS_UNAVAILABLE)).toBeNull();
});

it('database rows served while core4 is down are real data, not unavailable', async () => {
  observations = PRODUCER.dbRowsWhileCore4Down;
  await mount();
  // Cache success can precede React's render; wait for the row in the chart.
  await screen.findByText('65.3', { selector: 'output' });
  expect(screen.queryByText(OBS_UNAVAILABLE)).toBeNull();
  expect(screen.queryByText(OBS_EMPTY)).toBeNull();
});

it('pending observations show loading until the database rows render', async () => {
  let resolveObservations;
  const pending = new Promise(resolve => { resolveObservations = resolve; });
  observations = () => pending;
  await mount();
  await screen.findByText('Loading observation history…');
  expect(screen.queryByText(OBS_EMPTY)).toBeNull();
  expect(screen.queryByText(OBS_UNAVAILABLE)).toBeNull();

  resolveObservations(PRODUCER.dbRowsWhileCore4Down());
  await screen.findByText('65.3', { selector: 'output' });
  expect(screen.queryByText('Loading observation history…')).toBeNull();
  expect(screen.queryByText(OBS_EMPTY)).toBeNull();
  expect(screen.queryByText(OBS_UNAVAILABLE)).toBeNull();
});

it('a 503 quality read is unavailable, not an absent-dimensions claim', async () => {
  quality = down;
  await mount();
  // The hook retries transport failures with backoff before it reports error.
  await screen.findByText(QUALITY_UNAVAILABLE, {}, { timeout: 12000 });
  expect(screen.queryByText(QUALITY_EMPTY)).toBeNull();
}, 20000);

it('a backend-declared not-live quality read is unavailable', async () => {
  await mount();
  await screen.findByText(QUALITY_UNAVAILABLE);
  expect(screen.queryByText(QUALITY_EMPTY)).toBeNull();
});

it('a successful empty observations read and a real quality read keep their real states', async () => {
  quality = () => json(200, { overall: 82, dimensions: [{ key: 'c', label: 'Completeness', score: 91 }] });
  await mount();
  await screen.findByText(OBS_EMPTY);
  await screen.findByText('Completeness');
  expect(screen.queryByText(OBS_UNAVAILABLE)).toBeNull();
  expect(screen.queryByText(QUALITY_UNAVAILABLE)).toBeNull();
});
