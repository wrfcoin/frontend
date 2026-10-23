/** @jest-environment jsdom */
/**
 * core4#3604 A4: one forecaster's track record. Only a c_ key makes a request (a raw 0x address never does); totals,
 * recent decisions and the 30-day series come from the API; skill, by-variable and by-lead are shown as
 * "Not yet available" with the backend's reason, never as a number the chain did not give.
 */
import React from 'react';
import { jest } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const calls = [];
let answer = () => ({ status: 200, body: {} });
beforeEach(() => {
  calls.length = 0;
  globalThis.fetch = jest.fn(async (url) => {
    calls.push(String(url));
    const { status, body } = answer(String(url));
    return { ok: status >= 200 && status < 300, status, headers: { get: () => null }, json: async () => body };
  });
});
afterEach(cleanup);

const { default: Page } = await import('../PublicForecasterPage');
const KEY = 'c_0123456789abcdef01234567';
const FULL = '0x00000000000000000000000000000000000000a1';
const REASON = 'The node does not expose revealed forecast receipts in block reads.';
const record = over => ({
  success: true, status: 'available', coverage: { fromHeight: '1', throughHeight: '44370', complete: true, skippedRecords: '0' },
  asOf: { height: '44370', hash: 'ab'.repeat(32), time: '2026-10-18T07:00:00.000000Z', checkedAt: '2026-10-18T07:00:05.000Z' },
  profileKey: KEY, shortAddress: '0x0000…00a1', address: null, isYou: false,
  totals: { forecasts: '3', byProvenance: { real: '3', synthetic: '0', unclassified: '0' }, firstActiveAt: '2026-09-20T00:00:00.000000Z', lastActiveAt: '2026-10-18T06:00:00.000000Z', meanSkill: { status: 'not_yet_available', reason: REASON }, paid: { status: 'not_yet_available', reason: 'p' } },
  skill: { status: 'not_yet_available', reason: REASON }, byVariable: [], byLead: [],
  series: [{ day: '2026-10-16', forecasts: '1', meanSkill: null }, { day: '2026-10-18', forecasts: '2', meanSkill: null }],
  recent: [
    { commitId: 'f00dcafe0123456789abcdef0123456789abcdef0123456789abcdef01234567', blockHeight: '44300', lastHeight: '44302', timesSeen: '3', decidedAt: '2026-10-18T06:00:00.000000Z', stationId: 'WS-ALPHA', provenanceClass: 'real', skill: null, rmse: null, mae: null, bias: null, horizonHours: null, variables: null, receipt: 'not_exposed' },
    { commitId: 'c2', blockHeight: '44100', lastHeight: '44100', timesSeen: '1', decidedAt: '2026-10-16T06:00:00.000000Z', stationId: 'WS-BETA', provenanceClass: 'real', skill: null, rmse: null, mae: null, bias: null, horizonHours: null, variables: null, receipt: 'not_exposed' },
  ],
  ...over,
});
const mount = segment => render(
  <MemoryRouter initialEntries={[`/forecasters/${segment}`]}>
    <Routes><Route path="/forecasters/:profileKey" element={<Page />} /></Routes>
  </MemoryRouter>,
);

test('renders totals, recent decisions and the honest skill placeholders from the API body', async () => {
  answer = () => ({ status: 200, body: record() });
  mount(KEY);
  await waitFor(() => expect(screen.getAllByTestId('forecast-row')).toHaveLength(2));
  expect(calls).toEqual([expect.stringMatching(new RegExp(`/forecasters/${KEY}$`))]);
  expect(screen.getByTestId('forecaster-totals').textContent).toContain('3');
  expect(screen.getByText(/Real stations 3/)).toBeInTheDocument();
  expect(screen.getByText('f00dcafe…234567')).toBeInTheDocument();
  expect(screen.getByText('WS-ALPHA')).toBeInTheDocument();
  expect(screen.getAllByText('Not yet available').length).toBeGreaterThanOrEqual(3);
  expect(screen.getByText(/Skill by variable: not yet available/)).toBeInTheDocument();
  expect(screen.getByText(/Skill by lead time: not yet available/)).toBeInTheDocument();
  expect(screen.getByText(new RegExp(REASON.slice(0, 40)))).toBeInTheDocument();
  expect(screen.getByTestId('forecaster-series')).toBeInTheDocument();
  expect(document.body.textContent).not.toContain(FULL);
  expect(screen.queryByRole('link', { name: 'Open your wallet activity' })).toBeNull();
  expect(screen.getByRole('link', { name: '← All forecasters' })).toHaveAttribute('href', '/forecasters');
});

test('the wallet\'s own record shows the full address, You, and a link to the wallet activity', async () => {
  // Reached by the c_ key (the signed-in wallet's own login makes the backend return the full address).
  answer = () => ({ status: 200, body: record({ address: FULL, isYou: true }) });
  mount(KEY);
  await waitFor(() => expect(screen.getByText('You')).toBeInTheDocument());
  expect(screen.getByRole('button', { name: `Copy address ${FULL}` })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Open your wallet activity' })).toHaveAttribute('href', '/wallet');
});

test('a wallet with no forecasts gets the empty state and the guide', async () => {
  answer = () => ({ status: 200, body: record({ totals: { forecasts: '0', byProvenance: { real: '0', synthetic: '0', unclassified: '0' }, firstActiveAt: null, lastActiveAt: null, meanSkill: { status: 'not_yet_available', reason: REASON } }, series: [], recent: [] }) });
  mount(KEY);
  await waitFor(() => expect(screen.getByText('No forecasts yet')).toBeInTheDocument());
  expect(screen.getByRole('button', { name: 'Learn how' })).toBeInTheDocument();
  expect(screen.getByText('No forecasts in the last 30 days.')).toBeInTheDocument();
});

test.each(['nonsense', '0x12', 'c_tooshort', FULL, FULL.toUpperCase().replace('0X', '0x')])('a malformed segment or raw address %s makes no request and says not found', async segment => {
  mount(segment);
  expect(screen.getByText('Forecaster not found')).toBeInTheDocument();
  expect(calls).toHaveLength(0);
});

test('a 404 is not found; a 503 is "not available on this network yet"', async () => {
  answer = () => ({ status: 404, body: { error: { code: 'FORECASTER_NOT_FOUND' } } });
  mount(KEY);
  await waitFor(() => expect(screen.getByText('Forecaster not found')).toBeInTheDocument());
  cleanup();
  answer = () => ({ status: 503, body: { status: 'unavailable' } });
  mount(KEY);
  await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/not available on this network yet/));
});
