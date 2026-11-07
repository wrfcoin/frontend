/** @jest-environment jsdom */
/**
 * Website forecast (/forecast/new; design 2026-11-05): closed server shows a notice and no form; signed out asks
 * for a 12-word wallet; a signed-in 12-word wallet gets a suggested value, signs only a verified draft, and sees
 * the commit plus "reveals in the next block". A draft that does not match what was typed is never signed.
 */
import { jest } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Object.assign, not an assignment: a JS expando here would widen the global's type for every test file.
Object.assign(globalThis, { __VITE_ENV__: { VITE_WRFCOIN_CHAIN_ID: '888' } });
const MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const { deriveAccount } = await import('../../services/walletCrypto/firstPartyKeys');
const account = deriveAccount(MNEMONIC);
const A = account.address;
let vault = { address: A };
const unlock = jest.fn();
await jest.unstable_mockModule('../../services/walletVault', () => ({ readVault: () => vault }));
await jest.unstable_mockModule('../../services/walletCrypto/deviceSession', () => ({
  withOwnerKey: async (owner, password, run) => { unlock(owner, password); return run(account); },
}));
const { setAuthToken, clearAuthToken } = await import('../../services/authTokenStore');
const { forecastCommitId, stationAliasOf } = await import('../../services/walletCrypto/forecastCommit');
const { default: ForecastNewPage } = await import('../ForecastNewPage');

const b64 = obj => globalThis.btoa(JSON.stringify(obj)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const tokenFor = address => `${b64({ alg: 'HS256' })}.${b64({ sub: address, address, role: 'wallet' })}.sig`;
const STATION = 'PWS-TEST-0001';
const ALIAS = stationAliasOf(STATION);
const T = 1_794_000_000;

function draft(value = 12.3, station = STATION) {
  const data = `{"horizon_hours":6,"issued_at":${T},"model_id":"website-manual/v1","station_id":"${station}","valid_at":${T + 6 * 3600},"values":{"temperature_c":${value}}}`;
  const nonce = 'web-abc';
  return { forecaster: A, stationAlias: stationAliasOf(station), stationId: station, variable: 'temperature_c', leadHours: 6, value, data, nonce, timestamp: T, commitId: forecastCommitId(data, nonce, station, T), issuedAt: T, validAt: T + 21600 };
}
const reply = (status, body) => Promise.resolve({ ok: status >= 200 && status < 300, status, headers: { get: () => null }, json: () => Promise.resolve(body) });

function api({ status = 200, draftBody = draft(), mine = [] } = {}) {
  const calls = [];
  globalThis.fetch = jest.fn((url, init = {}) => {
    const path = String(url).replace(/^.*\/api/, '');
    calls.push({ path, method: init.method ?? 'GET', body: init.body ? JSON.parse(init.body) : null });
    if (path === '/forecasts/status') return status === 200 ? reply(200, { enabled: true, leads: [1, 6, 12, 24], variables: ['temperature_c', 'pressure_hpa'] }) : reply(404, { error: 'Not found' });
    if (path === '/weather/stations') return reply(200, { stations: [{ alias: ALIAS, name: 'Harbor station', status: 'live' }] });
    if (path.startsWith(`/stations/${ALIAS}/observations`)) return reply(200, { observations: [{ timestamp: '2026-11-07T12:00:00.000Z', temperatureC: 12.34, pressureHpa: 1013.2 }] });
    if (path === '/forecasts/mine') return reply(200, { forecasts: mine });
    if (path === '/forecasts/draft') return reply(200, draftBody);
    if (path === '/forecasts/submit') return reply(202, { commitId: draftBody.commitId, status: 'committed', commitTxHash: 'f'.repeat(64), stationAlias: ALIAS, issuedAt: T, validAt: T + 21600 });
    return reply(404, {});
  });
  return calls;
}
const renderPage = () => render(<MemoryRouter initialEntries={['/forecast/new']}><ForecastNewPage /></MemoryRouter>);

afterEach(() => { cleanup(); clearAuthToken(); unlock.mockReset(); vault = { address: A }; });

it('server switch off: calm notice, no form, nothing else requested', async () => {
  const calls = api({ status: 404 });
  setAuthToken(tokenFor(A));
  renderPage();
  expect(await screen.findByText(/Website forecasts are not open yet/)).toBeInTheDocument();
  expect(screen.queryByRole('form', { name: 'New forecast' })).toBeNull();
  expect(calls.map(c => c.path)).toEqual(['/forecasts/status']);
});

it('signed out: asks for a 12-word wallet', async () => {
  api();
  renderPage();
  expect(await screen.findByText(/Sign in with a 12-word wallet/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Create a 12-word wallet' })).toHaveAttribute('href', '/onboarding');
});

it('signed in without this wallet in the browser: explains, cannot sign', async () => {
  api();
  vault = null;
  setAuthToken(tokenFor(A));
  renderPage();
  expect(await screen.findByText(/This browser has no 12-word wallet/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Sign and submit' })).toBeDisabled();
});

it('suggests the last reading, signs the verified draft and shows the commit', async () => {
  const calls = api();
  setAuthToken(tokenFor(A));
  renderPage();
  const input = await screen.findByLabelText(/Your forecast/);
  await waitFor(() => expect(input).toHaveValue('12.3'));
  fireEvent.change(screen.getByLabelText('Wallet password'), { target: { value: 'pw' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign and submit' }));
  expect(await screen.findByTestId('forecast-submitted')).toHaveTextContent(/reveals it in the next block, even if you close this tab/);
  expect(unlock).toHaveBeenCalledWith(A, 'pw');
  const draftCall = calls.find(c => c.path === '/forecasts/draft');
  expect(draftCall.body).toEqual({ stationAlias: ALIAS, variable: 'temperature_c', leadHours: 6, value: 12.3 });
  const submit = calls.find(c => c.path === '/forecasts/submit');
  expect(submit.body.commitId).toBe(draft().commitId);
  expect(submit.body.authSignature).toMatch(/^[0-9a-f]{128}$/);
  expect(screen.getByText(/Practice score, not paid yet/)).toBeInTheDocument();
});

it('never signs a draft whose value differs from what was typed', async () => {
  const calls = api({ draftBody: draft(19.9) });
  setAuthToken(tokenFor(A));
  renderPage();
  const input = await screen.findByLabelText(/Your forecast/);
  await waitFor(() => expect(input).toHaveValue('12.3'));
  fireEvent.change(screen.getByLabelText('Wallet password'), { target: { value: 'pw' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign and submit' }));
  expect(await screen.findByText(/Not signed: the server's draft did not match/)).toBeInTheDocument();
  expect(unlock).not.toHaveBeenCalled();
  expect(calls.some(c => c.path === '/forecasts/submit')).toBe(false);
});

it('lists my forecasts with status and practice score', async () => {
  api({ mine: [{
    commitId: 'a'.repeat(64), stationAlias: ALIAS, variable: 'temperature_c', value: 12.3, leadHours: 6,
    issuedAt: '2026-11-07T12:00:00.000Z', validAt: '2026-11-07T18:00:00.000Z', status: 'revealed', failure: null,
    commitTxHash: 'b'.repeat(64), revealTxHash: 'c'.repeat(64), committedAtHeight: 4100, revealedAtHeight: 4101,
    score: { status: 'scored', forecast: 12.3, truth: 11.8, error: 0.5 },
  }] });
  setAuthToken(tokenFor(A));
  renderPage();
  expect(await screen.findByText('Revealed on chain')).toBeInTheDocument();
  expect(screen.getByText(/measured 11.8 °C · off by \+0.5/)).toBeInTheDocument();
  expect(screen.getByText(/block 4,101/)).toBeInTheDocument();
});

it('shows a failed row in plain words, never the raw code', async () => {
  api({ mine: [{
    commitId: 'd'.repeat(64), stationAlias: ALIAS, variable: 'pressure_hpa', value: 1013.2, leadHours: 1,
    issuedAt: '2026-11-07T12:00:00.000Z', validAt: '2026-11-07T13:00:00.000Z', status: 'failed', failure: 'commit_refused:FORECAST_QUOTA_EXCEEDED',
    commitTxHash: null, revealTxHash: null, committedAtHeight: null, revealedAtHeight: null, score: null,
  }] });
  setAuthToken(tokenFor(A));
  renderPage();
  expect(await screen.findByText('Didn\'t reach the chain; you can try again.')).toBeInTheDocument();
  expect(screen.queryByText(/FORECAST_QUOTA_EXCEEDED/)).toBeNull();
});
