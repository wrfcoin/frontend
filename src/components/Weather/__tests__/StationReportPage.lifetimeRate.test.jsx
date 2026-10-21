/** @jest-environment jsdom */
// backend#1232: the station page shows lifetime (labelled by scope) and the per-day rate from the
// backend's own fields, or "--" when unproven. Bodies are the exact producer output
// (fixtures/stationEarningsProducerBodies.json, dumped from the backend route).
import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { jest } from '@jest/globals';
import { readFileSync } from 'node:fs';

await jest.unstable_mockModule('../../../config/features', () => ({
  FEATURES: { publicReadonly: false, fullStudio: true },
}));
await jest.unstable_mockModule('react-chartjs-2', () => ({ Line: () => null, Bar: () => null }));
const { default: StationReportPage } = await import('../StationReportPage');
const { clearAuthToken } = await import('../../../services/authTokenStore');
const bodies = JSON.parse(readFileSync(new URL('../../../services/apiClient/__tests__/fixtures/stationEarningsProducerBodies.json', import.meta.url), 'utf8'));
const STATION = 'st_123456abcdef';
const originalFetch = global.fetch;
let client;
let earnings;
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

beforeEach(() => {
  clearAuthToken();
  localStorage.clear();
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  global.fetch = jest.fn(async input => {
    const path = new URL(String(input), 'https://synthetic.invalid').pathname;
    if (path === '/api/weather/stations') return json(200, {
      stations: [{ alias: STATION, name: 'Synthetic station', status: 'registered' }], total: 1, hasMore: false, nextCursor: null,
    });
    if (path === `/api/stations/${STATION}/earnings`) return earnings();
    if (path === `/api/stations/${STATION}/observations`) return json(200, { observations: [] });
    if (path === `/api/stations/${STATION}/quality`) return json(200, { overall: null, dimensions: [], unavailable: ['quality'] });
    if (path === `/api/stations/${STATION}/submissions`) return json(200, { submissions: [], source: 'backend-db', limit: 50, offset: 0 });
    return json(404, {});
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

describe('StationReportPage lifetime and rate', () => {
  it('sole holder: All time and the per-day rate from the backend', async () => {
    earnings = () => json(200, bodies.stationSole);
    await mount();
    await waitFor(() => expect(screen.getByText('All time')).toBeTruthy());
    await waitFor(() => expect(screen.getByText(/^1,?234,?567,?890\.12 WRF$/)).toBeTruthy());
    expect(screen.getByText('Rate per day (recent window)')).toBeTruthy();
    expect(screen.getByText('24.0000 WRF/day')).toBeTruthy();
  });

  it('shared address: the card says so and names the sharing count', async () => {
    earnings = () => json(200, bodies.addressShared);
    await mount();
    await waitFor(() => expect(screen.getByText('All time (shared address, 3 stations)')).toBeTruthy());
    expect(screen.getByText('5.00 WRF')).toBeTruthy();
  });

  it('shared address, anonymous body without the count: labelled without N', async () => {
    const { stationsSharingAddress: _n, ...anon } = bodies.addressShared.lifetime;
    earnings = () => json(200, { ...bodies.addressShared, lifetime: anon });
    await mount();
    await waitFor(() => expect(screen.getByText('All time (shared address)')).toBeTruthy());
    expect(screen.queryByText(/stations\)/)).toBeNull();
  });

  it('a positive rate below the display precision reads "< 0.0001 WRF/day"', async () => {
    earnings = () => json(200, { ...bodies.stationSole, rate: { ...bodies.stationSole.rate, baseUnitsPerDay: '3', wrfPerDay: '0.00000003' } });
    await mount();
    await waitFor(() => expect(screen.getByText('< 0.0001 WRF/day')).toBeTruthy());
    expect(screen.queryByText(/0\.0000/)).toBeNull();
  });

  it('unproven lifetime and rate show "--", never 0', async () => {
    earnings = () => json(200, bodies.lifetimeUnprovenRateNull);
    await mount();
    await waitFor(() => expect(screen.getByText('Rate per day (recent window)')).toBeTruthy());
    const valueOf = label => screen.getByText(label).parentElement.textContent;
    expect(valueOf('All time')).toContain('--');
    expect(valueOf('Rate per day (recent window)')).toContain('--');
    expect(valueOf('All time')).not.toMatch(/WRF/);
    expect(valueOf('Rate per day (recent window)')).not.toMatch(/WRF/);
  });

  it('the 200-with-unavailable stub keeps every earnings card at "--"', async () => {
    earnings = () => json(200, { earnings: [], source: null, unavailable: ['earnings'], reason: 'core4 is unavailable, so no reward evidence can be read' });
    await mount();
    await waitFor(() => expect(screen.getByText('Rate per day (recent window)')).toBeTruthy());
    const valueOf = label => screen.getByText(label).parentElement.textContent;
    expect(valueOf('All time')).not.toMatch(/WRF/);
    expect(valueOf('Rate per day (recent window)')).not.toMatch(/WRF/);
  });
});
