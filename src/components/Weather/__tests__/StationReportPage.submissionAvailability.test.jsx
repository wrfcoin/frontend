/** @jest-environment jsdom */
// Real public StationReportPage, Query hooks, WeatherService and ApiClient.
// Only build flags, the network and canvas chart rendering are substituted.
import React from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { jest } from '@jest/globals';

await jest.unstable_mockModule('../../../config/features', () => ({
  FEATURES: { publicReadonly: true, fullStudio: false },
}));
await jest.unstable_mockModule('react-chartjs-2', () => ({ Line: () => null, Bar: () => null }));
const { default: StationReportPage } = await import('../StationReportPage');
const { queryKeys } = await import('../../../lib/queryClient');
const { clearAuthToken } = await import('../../../services/authTokenStore');
const STATION = 'st_123456abcdef';
const CLEAN = 'No low-quality or failed submissions were returned for this station.';
const UNAVAILABLE = 'Submission history is unavailable right now. Try again later.';
const LOADING = 'Loading submission history…';
const originalFetch = global.fetch;
let requests;
let client;
let dateNow;
let submissionResponse;
let settlePending;
const json = (status, body) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json' },
});
const submission = (id, chainStatus) => ({
  id, createdAt: '2026-10-03T12:00:00.000Z', status: 'revealed', chainStatus,
});
const responseWith = rows => json(200, { submissions: rows, source: 'backend-db', limit: 50, offset: 0 });

beforeEach(() => {
  clearAuthToken();
  localStorage.clear();
  dateNow = jest.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-03T12:01:00.000Z'));
  requests = [];
  submissionResponse = () => responseWith([]);
  settlePending = undefined;
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  global.fetch = jest.fn(async (input, init) => {
    const path = new URL(String(input), 'https://synthetic.invalid').pathname;
    requests.push({ path, method: init?.method });
    if (path === '/api/weather/stations') return json(200, {
      stations: [{ alias: STATION, name: 'Synthetic station', status: 'registered' }],
      total: 1, hasMore: false, nextCursor: null, source: 'wrfcoin-contributors',
    });
    if (path === `/api/stations/${STATION}/submissions`) return submissionResponse();
    if (path === `/api/stations/${STATION}/observations`) return json(200, { observations: [] });
    if (path === `/api/stations/${STATION}/quality`) return json(200, {
      overall: null, dimensions: [], unavailable: ['quality'],
    });
    throw new Error(`Unexpected transport: ${path}`);
  });
});

afterEach(async () => {
  if (settlePending) await act(async () => settlePending(responseWith([])));
  cleanup();
  client.clear();
  dateNow.mockRestore();
  global.fetch = originalFetch;
});

async function mount() {
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/weather/station/${STATION}`]}>
        <Routes><Route path="/weather/station/:stationId" element={<StationReportPage />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  await screen.findByText('Synthetic station');
  await waitFor(() => expect(requests.some(r => r.path.endsWith('/submissions'))).toBe(true));
  expect(requests.every(r => r.method === 'GET')).toBe(true);
  expect(requests.some(r => /earnings|reward-progress/.test(r.path))).toBe(false);
  expect(screen.queryByText(`ID: ${STATION}`)).toBeNull();
}

it('pending submissions show loading instead of clean or empty history', async () => {
  submissionResponse = () => new Promise(resolve => { settlePending = resolve; });
  await mount();
  expect(screen.getAllByText(LOADING)).toHaveLength(2);
  expect(screen.queryByText(CLEAN)).toBeNull();
  expect(screen.queryByText('No submission history')).toBeNull();
});

it.each([404, 503])('HTTP %s detail failure is unavailable, not a clean station', async status => {
  submissionResponse = () => json(status, { error: { code: 'SERVICE_UNAVAILABLE' } });
  await mount();
  await waitFor(() => expect(client.getQueryState(queryKeys.weather.submissions(STATION))?.status).toBe('error'), { timeout: 4000 });
  expect(screen.getAllByText(UNAVAILABLE)).toHaveLength(2);
  expect(screen.queryByText(CLEAN)).toBeNull();
  expect(screen.queryByText('No submission history')).toBeNull();
});

it('a successful empty response retains the actual no-history state', async () => {
  await mount();
  await screen.findByText('No submission history');
  expect(screen.getByText(CLEAN)).toBeTruthy();
  expect(screen.queryByText(UNAVAILABLE)).toBeNull();
  expect(screen.queryByText(LOADING)).toBeNull();
});

it('a successful clean response shows its real success rate', async () => {
  submissionResponse = () => responseWith([submission(1, 'revealed_attested')]);
  await mount();
  await screen.findByText('100.0%');
  expect(screen.getByText(CLEAN)).toBeTruthy();
});

it('a successful anomalous response keeps the actual anomaly and rate', async () => {
  submissionResponse = () => responseWith([submission(2, 'revealed_pending_attestation')]);
  await mount();
  await screen.findByText('revealed_pending_attestation');
  expect(screen.getByText('0.0%')).toBeTruthy();
  expect(screen.queryByText(CLEAN)).toBeNull();
});

it('an unsuccessful refresh does not turn cached clean rows into current success', async () => {
  submissionResponse = () => responseWith([submission(1, 'revealed_attested')]);
  await mount();
  await screen.findByText('100.0%');
  submissionResponse = () => json(404, { error: { code: 'NOT_FOUND' } });
  await act(async () => client.refetchQueries({ queryKey: queryKeys.weather.submissions(STATION) }));
  expect(client.getQueryData(queryKeys.weather.submissions(STATION))).toHaveLength(1);
  await waitFor(() => expect(screen.getAllByText(UNAVAILABLE)).toHaveLength(2));
  expect(screen.queryByText(CLEAN)).toBeNull();
  expect(screen.queryByText('100.0%')).toBeNull();
});
