/** @jest-environment jsdom */
/**
 * backend#251: the weekly forecast competition page reads only /api/competitions and
 * /api/competitions/current|<ISO week>, shows the backend's points and rule text verbatim, never a full
 * address for a visitor, the caller's own row when outside the top, an honest empty state, and
 * "not available on this network yet" on a 503.
 */
import React from 'react';
import { jest } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

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

const { default: Page, timeLeft } = await import('../PublicCompetitionsPage');
const KEY = 'c_0123456789abcdef01234567';
const FULL = '0x00000000000000000000000000000000000000a1';
const RULE = {
  id: 'scored-forecasts-v1',
  points: 'One point for each of your forecasts that the chain scored and decided a reward for during the week.',
  ties: 'Equal points: whoever reached the total first ranks higher.',
  prizes: 'Points only. No WRF is paid and nothing is staked.',
  week: 'Weeks run Monday 00:00 UTC to the next Monday 00:00 UTC, by block time.',
};
const row = over => ({ rank: 1, profileKey: KEY, shortAddress: '0x0000…00a1', address: null, isYou: false, points: '12', forecasts: '12', firstAt: '2026-10-26T01:00:00.000000Z', lastAt: '2026-10-30T06:00:00.000000Z', ...over });
const standings = (week, rows, over = {}) => ({
  success: true,
  competition: { week, from: week === '2026-W44' ? '2026-10-26T00:00:00.000Z' : '2026-10-19T00:00:00.000Z', until: week === '2026-W44' ? '2099-11-02T00:00:00.000Z' : '2026-10-26T00:00:00.000Z', title: 't', status: week === '2026-W44' ? 'open' : 'final', rule: RULE, final: week === '2026-W44' ? null : { finalizedAt: '2026-10-26T02:00:00.000000Z', throughHeight: '44100', throughHash: 'ab'.repeat(32) } },
  asOf: { height: '44370', hash: 'cd'.repeat(32), time: '2026-10-31T07:00:00.000000Z', checkedAt: '2026-10-31T07:00:05.000Z' },
  coverage: { fromHeight: '1', throughHeight: '44370', complete: true, skippedRecords: '0' },
  entrants: rows.length, forecasts: String(rows.reduce((n, r) => n + Number(r.forecasts), 0)), rows, you: null, limit: 50, ...over,
});
const list = {
  success: true, current: '2026-W44',
  weeks: [
    { week: '2026-W44', from: '2026-10-26T00:00:00.000Z', until: '2026-11-02T00:00:00.000Z', title: 't', status: 'open', entrants: 2, forecasts: '19', leaders: [row()] },
    { week: '2026-W43', from: '2026-10-19T00:00:00.000Z', until: '2026-10-26T00:00:00.000Z', title: 't', status: 'final', entrants: 1, forecasts: '4', leaders: [row({ shortAddress: '0x0000…00b2', profileKey: 'c_bbbbbbbbbbbbbbbbbbbbbbbb', points: '4' })] },
  ],
};
const mount = () => render(<MemoryRouter><Page /></MemoryRouter>);

test('reads the list and this week; rows show points, short addresses and link to the forecaster; rule text verbatim', async () => {
  answer = url => ({ status: 200, body: url.endsWith('/competitions') ? list : standings('2026-W44', [row(), row({ rank: 2, profileKey: 'c_aaaaaaaaaaaaaaaaaaaaaaaa', shortAddress: '0x0000…00b2', points: '7', forecasts: '7' })]) });
  mount();
  await waitFor(() => expect(screen.getAllByTestId('competition-row')).toHaveLength(2));
  expect(calls.map(c => c.replace(/^.*\/api/, '/api')).sort()).toEqual(['/api/competitions', '/api/competitions/current']);
  expect(screen.getByRole('link', { name: '0x0000…00a1' })).toHaveAttribute('href', `/forecasters/${KEY}`);
  expect(screen.getByTestId('competition-summary').textContent).toContain('Ends in');
  expect(screen.getByTestId('competition-summary').textContent).toContain('19');
  expect(screen.getByTestId('competition-rules').textContent).toContain('Points only. No WRF is paid and nothing is staked.');
  expect(screen.getByRole('tab', { name: 'This week' })).toHaveAttribute('aria-selected', 'true');
  expect(document.body.textContent).not.toContain(FULL);
  expect(document.body.textContent).toContain('Live as of block 44,370');
});

test('picking a past week reads /api/competitions/<week> and shows it as final', async () => {
  answer = url => ({ status: 200, body: url.endsWith('/competitions') ? list : url.endsWith('/2026-W43') ? standings('2026-W43', [row({ points: '4', forecasts: '4' })]) : standings('2026-W44', [row()]) });
  mount();
  await waitFor(() => expect(screen.getAllByTestId('competition-row')).toHaveLength(1));
  fireEvent.click(screen.getByRole('tab', { name: 'Week 43' }));
  await waitFor(() => expect(screen.getByText(/Final, read through block 44,100/)).toBeInTheDocument());
  expect(calls.some(c => c.endsWith('/api/competitions/2026-W43'))).toBe(true);
  expect(screen.getByTestId('competition-summary').textContent).toContain('Final');
  // The past-weeks list names each week's winner by short address.
  const past = screen.getByRole('region', { name: 'Past weeks' });
  expect(within(past).getByText('Winner')).toBeInTheDocument();
  expect(within(past).getByText('0x0000…00b2')).toBeInTheDocument();
});

test('the signed-in caller outside the shown rows still sees their own row', async () => {
  answer = url => ({ status: 200, body: url.endsWith('/competitions') ? list : standings('2026-W44', [row()], { you: row({ rank: 9, address: FULL, isYou: true, points: '1', forecasts: '1', profileKey: 'c_cccccccccccccccccccccccc' }) }) });
  mount();
  await waitFor(() => expect(screen.getAllByTestId('competition-row')).toHaveLength(2));
  expect(screen.getByText('You')).toBeInTheDocument();
  expect(screen.getByText('#9')).toBeInTheDocument();
});

test('no points yet: honest empty state', async () => {
  answer = url => ({ status: 200, body: url.endsWith('/competitions') ? { ...list, weeks: [list.weeks[0]] } : standings('2026-W44', []) });
  mount();
  expect(await screen.findByText('No points yet this week')).toBeInTheDocument();
});

test('503 (index or competitions off): not available on this network yet', async () => {
  answer = () => ({ status: 503, body: { status: 'unavailable', error: { code: 'COMPETITIONS_DISABLED' } } });
  mount();
  expect(await screen.findByRole('alert')).toHaveTextContent('Forecast competitions are not available on this network yet');
});

test('timeLeft formats days, hours and minutes; past is null', () => {
  const now = Date.parse('2026-10-31T10:00:00Z');
  expect(timeLeft('2026-11-02T00:00:00Z', now)).toBe('1 day 14 h');
  expect(timeLeft('2026-10-31T12:30:00Z', now)).toBe('2 h 30 min');
  expect(timeLeft('2026-10-31T10:05:00Z', now)).toBe('5 min');
  expect(timeLeft('2026-10-31T09:00:00Z', now)).toBeNull();
});

test('week dates are UTC days (Monday to Sunday), whatever the viewer time zone', async () => {
  answer = url => ({ status: 200, body: url.endsWith('/competitions') ? list : standings('2026-W44', [row()], { competition: { ...standings('2026-W44', []).competition, until: '2026-11-02T00:00:00.000Z' } }) });
  mount();
  await waitFor(() => expect(screen.getAllByTestId('competition-row')).toHaveLength(1));
  const summary = screen.getByTestId('competition-summary').textContent;
  expect(summary).toMatch(/Oct 26/);
  expect(summary).toMatch(/Nov 1/);
});

test('every path the page requests is admitted by the public edge allowlist (GET, no query)', async () => {
  const { default: edge } = await import('../../routes/__fixtures__/public-edge-allowlist.json', { with: { type: 'json' } });
  answer = url => ({ status: 200, body: url.endsWith('/competitions') ? list : url.endsWith('/2026-W43') ? standings('2026-W43', [row()]) : standings('2026-W44', [row()]) });
  mount();
  await waitFor(() => expect(screen.getAllByTestId('competition-row')).toHaveLength(1));
  fireEvent.click(screen.getByRole('tab', { name: 'Week 43' }));
  await waitFor(() => expect(calls.some(c => c.endsWith('/2026-W43'))).toBe(true));
  for (const call of calls) {
    const path = call.replace(/^.*?\/api\//, '/api/');
    expect(path).not.toContain('?');
    expect(edge.get.some(r => new RegExp(r.path).test(path) && r.query.includes(''))).toBe(true);
  }
});
