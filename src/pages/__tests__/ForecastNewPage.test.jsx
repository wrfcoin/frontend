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
  expect(screen.getByText('Practice score. Nothing is paid for it.')).toBeInTheDocument();
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

// Practice scores (backend switch WEBSITE_FORECAST_SCORE_ENABLED): whole numbers in hundredths, skill in millionths.
const mineRow = (id, practiceScore, over = {}) => ({
  commitId: id.repeat(64), stationAlias: ALIAS, variable: 'temperature_c', value: 18.1, leadHours: 6,
  issuedAt: '2026-11-07T12:00:00.000Z', validAt: '2026-11-07T18:00:00.000Z', status: 'revealed', failure: null,
  commitTxHash: 'b'.repeat(64), revealTxHash: 'c'.repeat(64), committedAtHeight: 4100, revealedAtHeight: 4101, score: null, practiceScore, ...over,
});
const base = { paid: false, note: 'Practice score. Nothing is paid for it.', unit: 'temp_c_centi', skillMax: 1_000_000 };
const scoredScore = over => ({
  ...base, status: 'scored', reason: null, text: 'scored', validAt: '2026-11-07T18:00:40.000Z', forecast: 1810, truth: 1900, truthObservedAt: '2026-11-07T18:02:00.000Z',
  error: 90, baseline: { error: 180, kind: 'persistence_spread' }, skill: 500_000, copied: false, beatBaseline: true, nws: null, ...over,
});

it('shows a scored forecast in plain words: measured, off by, baseline, beat it, and that nothing is paid', async () => {
  api({ mine: [mineRow('a', scoredScore({ validAt: '2026-11-09T18:00:40.000Z', nws: { source: 'NOAA National Weather Service forecast', forecast: 1840, error: 60, skill: 666_667, leadHours: 6, result: 'nws_beat_you' } }))] });
  setAuthToken(tokenFor(A));
  renderPage();
  const panel = await screen.findByTestId('practice-score');
  expect(panel).toHaveTextContent('Practice score 50 / 100');
  expect(panel).toHaveTextContent('Beat the baseline: yes');
  expect(panel).toHaveTextContent(/You said 18\.1 °C\. The station measured 19\.0 °C/);
  expect(panel).toHaveTextContent('You were off by 0.9 °C.');
  expect(panel).toHaveTextContent('Baseline to beat: 1.8 °C (how much this station usually changes in 6 hours). Your miss was smaller.');
  expect(screen.getByTestId('practice-nws')).toHaveTextContent('NOAA’s forecast beat you for that hour (off by 0.6 °C).');
  expect(panel).toHaveTextContent('Practice score. Nothing is paid for it.');
  // No amount, and nothing that reads as a promise of pay later.
  expect(panel).not.toHaveTextContent(/WRF|earn|reward|pay starts|switched on|yet|soon/i);
  expect(panel).not.toHaveAttribute('role');
  // The card's target time is the one the score used (the chain's), once there is one.
  expect(screen.getByText(/target/)).toHaveTextContent(/target Nov 9, 2026/);
  // The older "measured … off by" cell is replaced, not shown twice.
  expect(screen.queryByText(/After the target time/)).toBeNull();
});

it('says no when the baseline was not beaten, explains a copy, and reads pressure in hPa', async () => {
  api({ mine: [
    mineRow('a', scoredScore({ error: 250, truth: 2060, skill: 0, beatBaseline: false, baseline: { error: 207, kind: 'climatology_spread' }, nws: { source: 'n', forecast: 2000, error: 300, skill: 0, leadHours: 6, result: 'you_beat_nws' } })),
    mineRow('b', scoredScore({ copied: true, skill: 0, beatBaseline: false })),
    mineRow('c', scoredScore({ unit: 'pressure_pa', forecast: 101330, truth: 101325, error: 5, baseline: { error: 0, kind: 'climatology_spread' }, skill: 0, beatBaseline: false }), { variable: 'pressure_hpa', value: 1013.3 }),
  ] });
  setAuthToken(tokenFor(A));
  renderPage();
  const [missed, copied, flat] = await screen.findAllByTestId('practice-score');
  expect(missed).toHaveTextContent('Practice score 0 / 100');
  expect(missed).toHaveTextContent('Beat the baseline: no');
  expect(missed).toHaveTextContent('Baseline to beat: 2.07 °C (how much this station varied over the day before). Your miss was not smaller.');
  expect(missed).toHaveTextContent('You beat NOAA’s forecast for that hour (off by 3.0 °C).');
  expect(copied).toHaveTextContent(/Scored 0: your forecast was the same as the station’s last reading or its 24-hour average/);
  expect(flat).toHaveTextContent('You said 1013.3 hPa. The station measured 1013.25 hPa');
  expect(flat).toHaveTextContent('You were off by 0.05 hPa.');
  expect(flat).toHaveTextContent('The station changed too little in the day before to score against, so there was nothing to beat.');
  expect(flat).not.toHaveTextContent('Baseline to beat');
});

it('pending and unscored are said plainly; a forecast not yet revealed shows no score panel', async () => {
  api({ mine: [
    mineRow('a', { ...base, status: 'pending', reason: null, text: 'pending until 2026-11-07T18:20:00.000Z', pendingUntil: '2026-11-07T18:20:00.000Z', giveUpAt: '2026-11-08T18:00:00.000Z' }),
    mineRow('b', { ...base, status: 'pending', reason: 'waiting_for_reading', text: 'pending: waiting for a station reading', pendingUntil: '2026-11-07T18:20:00.000Z', giveUpAt: '2026-11-08T18:00:00.000Z' }),
    mineRow('c', { ...base, status: 'unscored', reason: 'no_reading', text: 'unscored: no reading', forecast: 1810, truth: null }),
    mineRow('d', { ...base, status: 'unscored', reason: 'no_baseline', text: 'unscored: not enough earlier readings for a baseline', forecast: 1810, truth: 1900 }),
    mineRow('e', null, { status: 'committed' }),
  ] });
  setAuthToken(tokenFor(A));
  renderPage();
  const panels = await screen.findAllByTestId('practice-score');
  expect(panels.length).toBe(4);
  expect(panels[0]).toHaveTextContent(/Practice score: not yet.*Scored after .*once the station’s readings are confirmed on chain\./);
  expect(panels[1]).toHaveTextContent(/Waiting for a confirmed station reading close to the target time\. We keep looking until/);
  for (const p of panels) expect(p).not.toHaveAttribute('role');
  expect(panels[2]).toHaveTextContent('Not scored');
  expect(panels[2]).toHaveTextContent('The station had no confirmed reading within 15 minutes of the target time, so there is nothing to score against.');
  expect(panels[3]).toHaveTextContent('The station had too few readings in the day before your forecast to set a baseline.');
});

it('formats hundredths without floating-point surprises and rounds skill down', async () => {
  const { fmtHundredths, skillOutOf100 } = await import('../ForecastPracticeScore');
  expect([fmtHundredths(1810, '°C'), fmtHundredths(-5, '°C'), fmtHundredths(-1234, ''), fmtHundredths(0, 'hPa'), fmtHundredths(101325, 'hPa'), fmtHundredths(1.5, '°C')])
    .toEqual(['18.1 °C', '−0.05 °C', '−12.34', '0.0 hPa', '1013.25 hPa', '—']);
  expect([skillOutOf100(999_999), skillOutOf100(1_000_000), skillOutOf100(10_000), skillOutOf100(9_999), skillOutOf100(1), skillOutOf100(0), skillOutOf100(null), skillOutOf100(-1)])
    .toEqual(['99', '100', '1', 'under 1', 'under 1', '0', null, null]);
});

it('a tiny win reads "under 1", a tie with NOAA is said, and a pending score with no time still says something', async () => {
  api({ mine: [
    mineRow('a', scoredScore({ error: 179, truth: 1989, skill: 5_555, beatBaseline: true, nws: { source: 'n', forecast: 1810, error: 179, skill: 5_555, leadHours: 6, result: 'tie' } })),
    mineRow('b', { ...base, status: 'pending', reason: null, text: 'pending until the target time', pendingUntil: null, giveUpAt: null }),
    mineRow('c', { ...base, status: 'pending', reason: 'node_unavailable', text: 'pending: the chain node could not be read; trying again', pendingUntil: '2026-11-07T18:35:00.000Z', giveUpAt: '2026-11-08T18:00:00.000Z' }),
    mineRow('d', { ...base, status: 'unscored', reason: 'node_unavailable', text: 'unscored: the chain node could not be read' }),
    mineRow('e', { ...base, status: 'unscored', reason: 'out_of_range', text: 'unscored: the forecast value is outside the scored range' }),
    mineRow('f', { ...base, status: 'unscored', reason: 'constructor', text: 'x' }),
  ] });
  setAuthToken(tokenFor(A));
  renderPage();
  const [tiny, noTime, nodeDown, nodeGaveUp, range, unknown] = await screen.findAllByTestId('practice-score');
  expect(tiny).toHaveTextContent('Practice score under 1 / 100');
  expect(tiny).toHaveTextContent('Beat the baseline: yes');
  expect(tiny).toHaveTextContent('You tied NOAA’s forecast for that hour (off by 1.79 °C).');
  expect(noTime).toHaveTextContent('Scored after the target time.');
  expect(nodeDown).toHaveTextContent('The chain could not be read just now. We will try again.');
  expect(nodeDown).not.toHaveTextContent(/station reading/);
  expect(nodeGaveUp).toHaveTextContent('The chain could not be read for a day after the target time, so this forecast was not scored.');
  expect(range).toHaveTextContent('The forecast value is outside the range that is scored.');
  expect(unknown).toHaveTextContent(/no confirmed reading within 15 minutes/);
});

it('keeps the older score cell when practice scores are on but there is no panel for this forecast', async () => {
  api({ mine: [
    mineRow('a', null, { score: { status: 'scored', forecast: 18.1, truth: 17.6, error: 0.5 } }),
    mineRow('b', { ...base, status: 'something-new', unit: 'constructor', baseline: { error: 1, kind: 'toString' } }),
    mineRow('c', scoredScore({ unit: 'constructor', baseline: { error: 180, kind: 'toString' } })),
  ] });
  setAuthToken(tokenFor(A));
  renderPage();
  expect(await screen.findByText(/measured 17.6 °C · off by \+0.5/)).toBeInTheDocument();
  expect(screen.getAllByText('Practice score', { selector: 'dt' }).length).toBe(2); // the older cell's label, for the two rows without a panel
  // Unknown unit or baseline kind from the server: plain numbers, no borrowed object property.
  const [odd] = screen.getAllByTestId('practice-score');
  expect(odd).toHaveTextContent('You said 18.1. The station measured 19.0');
  expect(odd).toHaveTextContent('Baseline to beat: 1.8. Your miss was smaller.');
  expect(odd).not.toHaveTextContent(/function|native code|undefined/);
});
