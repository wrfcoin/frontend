/** @jest-environment jsdom */
/**
 * core4#3604 A4: the public forecasters leaderboard reads only /api/forecasters?period&limit, shows the
 * backend's figures verbatim (counts, delta, "Not yet available" for skill), never a full address for a
 * visitor, an honest empty state, and "not available on this network yet" on a 503.
 */
import React from 'react';
import { jest } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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

const { default: Page } = await import('../PublicForecastersPage');
const KEY = 'c_0123456789abcdef01234567';
const FULL = '0x00000000000000000000000000000000000000a1';
const row = over => ({
  rank: 1, profileKey: KEY, shortAddress: '0x0000…00a1', address: null, isYou: false, forecasts: '12', forecastsPrevious: '9',
  forecastsDelta: '3', firstActiveAt: '2026-10-01T00:00:00.000000Z', lastActiveAt: '2026-10-18T06:00:00.000000Z',
  skill: { status: 'not_yet_available', reason: 'The node does not expose receipts.' }, paid: { status: 'not_yet_available', reason: 'x' }, ...over,
});
const body = (rows, over = {}) => ({
  success: true, period: '7d', status: 'available', coverage: { fromHeight: '1', throughHeight: '44370', complete: true, skippedRecords: '0' },
  asOf: { height: '44370', hash: 'ab'.repeat(32), time: '2026-10-18T07:00:00.000000Z', checkedAt: '2026-10-18T07:00:05.000Z' },
  network: { forecasters: '2', forecasts: '19', rewardsMintedCount: '19', rewardsMintedBaseUnits: '123456789012', rewardsMintedDisplay: '1234.56789012', rewardsWithReceiptCount: '0', rewardsBaselineCount: '19', blocks: '7000', blocksWithoutCounters: '0', meanSkill: { status: 'not_yet_available', reason: 'r' } },
  rows, ...over,
});
const mount = () => render(<MemoryRouter><Page /></MemoryRouter>);

test('requests the 7-day window first, renders rows with short addresses, delta and honest skill', async () => {
  answer = () => ({ status: 200, body: body([row(), row({ rank: 2, profileKey: 'c_aaaaaaaaaaaaaaaaaaaaaaaa', shortAddress: '0x0000…00b2', forecasts: '7', forecastsDelta: '-2' })]) });
  mount();
  await waitFor(() => expect(screen.getAllByTestId('forecaster-row')).toHaveLength(2));
  expect(calls[0]).toMatch(/\/forecasters\?period=7d&limit=25$/);
  expect(screen.getByRole('link', { name: '0x0000…00a1' })).toHaveAttribute('href', `/forecasters/${KEY}`);
  expect(screen.getByText('▲ 3')).toBeInTheDocument();
  expect(screen.getByText('▼ 2')).toBeInTheDocument();
  expect(screen.getAllByText('Not yet available').length).toBeGreaterThanOrEqual(3); // network mean skill + two rows
  expect(screen.getByTestId('forecasters-network').textContent).toContain('1,234');
  expect(screen.getByTestId('forecasters-network').textContent).toContain('.56789012 WRF');
  expect(document.body.textContent).not.toContain(FULL);
  expect(document.body.textContent).not.toContain('0.1');
});

test('the 30-day tab refetches with period=30d; the wallet\'s own row shows the full address and You', async () => {
  answer = url => ({ status: 200, body: body(url.includes('period=30d') ? [row({ address: FULL, isYou: true, forecasts: '40' })] : [row()], { period: url.includes('30d') ? '30d' : '7d' }) });
  mount();
  await waitFor(() => expect(screen.getAllByTestId('forecaster-row')).toHaveLength(1));
  fireEvent.click(screen.getByRole('tab', { name: '30 days' }));
  await waitFor(() => expect(calls.some(c => c.endsWith('/forecasters?period=30d&limit=25'))).toBe(true));
  await waitFor(() => expect(screen.getByText('You')).toBeInTheDocument());
  expect(screen.getByRole('link', { name: FULL })).toHaveAttribute('href', `/forecasters/${KEY}`);
  expect(screen.getByRole('button', { name: `Copy address ${FULL}` })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: '30 days' })).toHaveAttribute('aria-selected', 'true');
});

test('no rows is an honest empty state with the guide, not a zero leaderboard', async () => {
  answer = () => ({ status: 200, body: body([], { network: { forecasters: '0', forecasts: '0', rewardsMintedBaseUnits: '0' } }) });
  mount();
  await waitFor(() => expect(screen.getByText('No forecasts yet')).toBeInTheDocument());
  expect(screen.getByRole('button', { name: 'Learn how' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Learn how to forecast' })).toHaveAttribute('href', expect.stringContaining('testnet/forecasting.md'));
  expect(screen.queryAllByTestId('forecaster-row')).toHaveLength(0);
});

test('a 503 says the index is not running on this network; other failures offer Retry; a 429 is a rate limit', async () => {
  answer = () => ({ status: 503, body: { status: 'unavailable', error: { code: 'FORECASTERS_DISABLED' } } });
  mount();
  await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/not available on this network yet/));
  expect(screen.queryByTestId('forecasters-network')).toBeNull();
  answer = () => ({ status: 500, body: {} });
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/unavailable right now/));
  answer = () => ({ status: 429, body: {} });
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/Too many requests/));
  expect(calls).toHaveLength(3);
});

test('a row never links by a raw address, even the wallet\'s own row without a profile key', async () => {
  answer = () => ({ status: 200, body: body([row({ profileKey: null, address: FULL, isYou: true })]) });
  mount();
  await waitFor(() => expect(screen.getAllByText(/0x0000…00a1|0x0{38}a1/).length).toBeGreaterThan(0));
  expect(document.querySelector(`a[href*="${FULL}"]`)).toBeNull();
  expect(document.querySelector('a[href^="/forecasters/0x"]')).toBeNull();
});
