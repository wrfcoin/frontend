/** @jest-environment jsdom */
/**
 * Demo item 7 (backend PR#72, #1494): forecasts committed on chain, scored against the station's readings
 * and NOAA. One GET to /api/forecast-verification/summary; missing figures read "Unavailable" with the
 * server's reason; the hand-in form posts the kit's commit record without credentials.
 */
import { jest } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

afterEach(cleanup);

const { default: PublicForecastCheckPage, recordFromFiles } = await import('../PublicForecastCheckPage');
const { forecastCheckRecordPath } = await import('../../services/publicReadonlyApi');

const COMMIT = 'ad0083de8fc143356a11b677a7aaad6c0aa12fc91bd77e2b3e0a2cc771ad3048';
const scored = {
  commitId: COMMIT, stationAlias: 'st_7d29a4c1e0b8', modelId: 'persistence-trend/v1', issuedAt: '2026-11-02T06:00:00.000Z',
  validAt: '2026-11-02T12:00:00.000Z', horizonHours: 6, status: 'scored', unavailableReason: null,
  forecast: { temperature_c: 12.5 }, truth: { readings: 4, values: { temperature_c: 12.1 }, provenance: ['real'], heights: { from: 1, to: 9 } },
  scores: { temperature_c: { forecast: 12.5, truth: 12.1, error: 0.4, noaa: { value: 11.2, error: -0.9, leadHours: 7 } } },
  noaa: { source: 'nws:HourlyForecastGenerator', leadHours: 7 }, noaaReason: null, submittedAt: '2026-11-02T13:00:00.000Z', scoredAt: '2026-11-02T13:20:00.000Z',
};
const summary = (over = {}) => ({
  windowDays: 30, status: 'available', reason: null, counts: { pending: 2, scored: 1, unavailable: 1 },
  variables: [
    { variable: 'temperature_c', chain: { n: 1, mae: 0.4, bias: 0.4, rmse: 0.4 }, vsNoaa: { n: 1, chainMae: 0.4, noaaMae: 0.9, chainBias: 0.4, noaaBias: -0.9 }, vsNoaaReason: null },
    { variable: 'pressure_hpa', chain: null, vsNoaa: null, vsNoaaReason: 'NOAA hourly forecasts do not include pressure.' },
    { variable: 'humidity_pct', chain: null, vsNoaa: null, vsNoaaReason: 'No scored forecast has a NOAA forecast for the same station and hour, captured before it was issued.' },
  ],
  stations: [{ stationAlias: 'st_7d29a4c1e0b8', scored: 1, temperature: { n: 1, mae: 0.4, bias: 0.4, rmse: 0.4 } }],
  recent: [scored, { ...scored, commitId: 'b'.repeat(64), status: 'unavailable', unavailableReason: 'no_chain_reading_in_target_hour', scores: null, truth: null }],
  ...over,
});

function reply(status, body) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status, headers: { get: () => null }, json: () => Promise.resolve(body) });
}
const renderPage = () => render(<MemoryRouter><PublicForecastCheckPage /></MemoryRouter>);

describe('forecast check paths and record files', () => {
  it('builds only edge-admitted shapes and reads commit.json + data.json without re-serializing data', () => {
    expect(forecastCheckRecordPath(COMMIT)).toBe(`/forecast-verification/forecasts/${COMMIT}`);
    expect(forecastCheckRecordPath(COMMIT.toUpperCase())).toBeNull();
    const data = '{"values":{"pressure_hpa":1013.0}}\n';
    expect(recordFromFiles(JSON.stringify({ commit_id: COMMIT.toUpperCase(), nonce: 'kit-1', timestamp: 1798000000 }), data))
      .toEqual({ record: { commitId: COMMIT, nonce: 'kit-1', timestamp: 1798000000, data: '{"values":{"pressure_hpa":1013.0}}' } });
    expect(recordFromFiles('{', data).error).toMatch(/commit.json/);
    expect(recordFromFiles(JSON.stringify({ commit_id: 'x' }), data).error).toMatch(/commit_id/);
    expect(recordFromFiles(JSON.stringify({ commit_id: COMMIT, nonce: 'n', timestamp: 1 }), '  ').error).toMatch(/data.json/);
  });
});

describe('PublicForecastCheckPage', () => {
  it('shows the server\'s scores next to NOAA and says "Unavailable" with the reason where NOAA has nothing', async () => {
    globalThis.fetch = jest.fn(() => reply(200, summary()));
    renderPage();
    const table = await screen.findByTestId('forecast-check-variables');
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/forecast-verification/summary', expect.objectContaining({ method: 'GET', credentials: 'omit' }));
    expect(within(table).getByTestId('vs-noaa-temperature_c')).toHaveTextContent('On chain 0.40 °C');
    expect(within(table).getByTestId('vs-noaa-temperature_c')).toHaveTextContent('NOAA 0.90 °C');
    expect(within(table).getByText(/do not include pressure/)).toBeInTheDocument();
    expect(screen.getByTestId('forecast-check-counts')).toHaveTextContent(/Scored \(30 days\)\s*1/);
    expect(within(table).getByTestId('vs-noaa-temperature_c')).toHaveTextContent('over 1 forecast');
    const rows = screen.getAllByTestId('forecast-check-row');
    expect(rows[0]).toHaveTextContent('measured 12.10 °C');
    expect(rows[0]).toHaveTextContent('off by +0.40 °C');
    expect(rows[1]).toHaveTextContent('No station reading landed on chain for the target hour.');
    expect(screen.getAllByRole('link', { name: 'st_7d29a4c1e0b8' })[0]).toHaveAttribute('href', '/weather/station/st_7d29a4c1e0b8');
  });

  it('says nothing has been scored yet instead of inventing numbers', async () => {
    globalThis.fetch = jest.fn(() => reply(200, summary({ status: 'unavailable', reason: 'No forecast has been scored against station readings in this window yet.',
      counts: { pending: 0, scored: 0, unavailable: 0 }, variables: summary().variables.map(v => ({ ...v, chain: null, vsNoaa: null, vsNoaaReason: 'none yet' })), stations: [], recent: [] })));
    renderPage();
    expect(await screen.findByText(/No forecast has been scored/)).toBeInTheDocument();
    expect(screen.getAllByText('Unavailable').length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText('No forecast has been handed in yet.')).toBeInTheDocument();
  });

  it('shows the switched-off state on a 404 and a retry alert when the server fails', async () => {
    globalThis.fetch = jest.fn(() => reply(404, { error: 'Not found' }));
    renderPage();
    expect(await screen.findByText('Forecast check is not switched on yet')).toBeInTheDocument();
    cleanup();
    globalThis.fetch = jest.fn(() => reply(503, {}));
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('unavailable right now');
  });

  it('hands in the kit record with no credentials and explains a refusal in plain words', async () => {
    const calls = [];
    globalThis.fetch = jest.fn((url, init) => {
      calls.push([url, init]);
      if (init?.method === 'POST') return reply(400, { success: false, error: { code: 'COMMIT_MISMATCH', message: 'x' } });
      return reply(200, summary());
    });
    renderPage();
    await screen.findByTestId('forecast-check-variables');
    fireEvent.change(screen.getByLabelText('commit.json'), { target: { value: JSON.stringify({ commit_id: COMMIT, nonce: 'kit-1', timestamp: 1798000000 }) } });
    fireEvent.change(screen.getByLabelText('data.json'), { target: { value: '{"a":1.0}' } });
    fireEvent.click(screen.getByRole('button', { name: 'Hand in forecast' }));
    await waitFor(() => expect(screen.getByText(/do not hash to that commit id/)).toBeInTheDocument());
    const post = calls.find(([, init]) => init?.method === 'POST');
    expect(post[0]).toBe('/api/forecast-verification/forecasts');
    expect(post[1].credentials).toBe('omit');
    expect(post[1].headers.Authorization).toBeUndefined();
    expect(JSON.parse(post[1].body)).toEqual({ commitId: COMMIT, nonce: 'kit-1', timestamp: 1798000000, data: '{"a":1.0}' });
  });
});
