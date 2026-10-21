/** @jest-environment jsdom */
import React from 'react';
import { jest } from '@jest/globals';
import { cleanup, render, screen } from '@testing-library/react';
await jest.unstable_mockModule('../../../services/walletProviders/WalletProviderManager.js', () => ({ walletProviderManager: {on(){},off(){},getAvailableProviders(){return [];},connect:async()=>null,disconnect:async()=>{}} }));
const { default: GlobalLeaderboard } = await import('../GlobalLeaderboard');
const json = (status, body) => new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});

// The exact entry shape the backend serves once it adds node-read earnings (S55):
// value + streak:null, no quality or station count, earnings as base units and WRF display string.
const entry = (name, over = {}) => ({
  rank: 1, walletAddress: '0xa1a1…a1a1', profileKey: `key-${name}`, isYou: false, displayName: name,
  value: 90, badgeLevel: 'silver', streak: null, country: 'US', city: 'Chicago',
  earningsBaseUnits: '250000000', earningsWrf: '2.5', ...over,
});
const body = (entries, over = {}) => ({
  success: true, metric: 'submissions', period: '30d', updatedAt: '2026-10-04T00:00:00Z',
  earningsScope: 'lifetime',
  amountUnits: { denomination: 'WRF', baseUnitDecimals: 8, baseUnitsPerUnit: '100000000', available: true,
    fields: { 'entries[].earningsBaseUnits': 'base_units', 'entries[].earningsWrf': 'display_units' } },
  entries, ...over,
});
const serve = (payload) => {
  global.fetch = jest.fn(async (input) => String(input).includes('/leaderboard/contributors')
    ? json(404, { error: 'not mounted' }) : json(200, payload));
};
afterEach(() => { cleanup(); });

function noSummary() {
  expect(screen.queryByText('WRF Distributed')).toBeNull();
  expect(screen.queryByText('Total Contributors')).toBeNull();
}

it('renders the real lifetime WRF amount from the backend row, with absent metrics shown as not available', async () => {
  serve(body([entry('Fixture Alice')]));
  render(<GlobalLeaderboard />);
  expect(await screen.findByText('Fixture Alice')).not.toBeNull();
  expect(screen.getAllByText('2.5 WRF').length).toBeGreaterThan(0);
  expect(screen.getByText('Earnings (lifetime)')).not.toBeNull();
  expect(screen.getByText('WRF Distributed')).not.toBeNull();
  // quality and station count are not sent: never a zero, never a made-up percent
  expect(screen.getAllByText('Not available').length).toBe(2);
  expect(screen.queryByText('0%')).toBeNull();
  expect(screen.queryByText('0 stations')).toBeNull();
});

it('a proven zero earnings amount is a real zero, not unavailable', async () => {
  serve(body([entry('Fixture Zed', { earningsBaseUnits: '0', earningsWrf: '0' })]));
  render(<GlobalLeaderboard />);
  expect(await screen.findByText('Fixture Zed')).not.toBeNull();
  expect(screen.getAllByText('0 WRF').length).toBeGreaterThan(0);
});

it('a row whose earnings the backend could not read keeps the page unavailable', async () => {
  serve(body([entry('Fixture Alice'), entry('Fixture Bob', { earningsBaseUnits: null, earningsWrf: null })]));
  render(<GlobalLeaderboard />);
  expect(await screen.findByText('Not live on the testnet yet')).not.toBeNull();
  noSummary();
});

it('a backend that reports earnings unavailable keeps the page unavailable even if rows carry numbers', async () => {
  serve(body([entry('Fixture Alice')], { unavailable: ['earnings'], amountUnits: { denomination: 'WRF', available: false } }));
  render(<GlobalLeaderboard />);
  expect(await screen.findByText('Not live on the testnet yet')).not.toBeNull();
  noSummary();
});

it('an amount contract that is not WRF is refused', async () => {
  serve(body([entry('Fixture Alice')], { amountUnits: { denomination: 'USD', available: true } }));
  render(<GlobalLeaderboard />);
  expect(await screen.findByText('Not live on the testnet yet')).not.toBeNull();
  noSummary();
});

it('a present but invalid optional metric is not treated as absent', async () => {
  serve(body([entry('Fixture Alice', { quality: 'abc' })]));
  render(<GlobalLeaderboard />);
  expect(await screen.findByText('Not live on the testnet yet')).not.toBeNull();
  noSummary();
});

it('asks the backend for at most 30 rows, the number it can prove node amounts for', async () => {
  serve(body([entry('Fixture Alice')]));
  render(<GlobalLeaderboard />);
  expect(await screen.findByText('Fixture Alice')).not.toBeNull();
  const urls = global.fetch.mock.calls.map(([u]) => String(u));
  expect(urls).toContain('/api/weather/leaderboard?metric=earnings&period=30d&limit=30');
  expect(urls.some((u) => u.includes('limit=100'))).toBe(false);
});

it('says the earnings are lifetime real-station rewards and that the period filter only ranks', async () => {
  serve(body([entry('Fixture Alice')]));
  render(<GlobalLeaderboard />);
  expect(await screen.findByText('Fixture Alice')).not.toBeNull();
  expect(screen.getByText(/lifetime real-station rewards/i)).not.toBeNull();
  expect(screen.getByText(/period filter ranks only/i)).not.toBeNull();
});

// SOL-W2 P2 (frontend#526): amounts are formatted from base units, never through Number().toLocaleString(),
// which rounds to 3 decimals and would show a real 0.00000001 WRF reward as "0".
it('shows a positive sub-0.001 WRF amount at full precision, not as 0, in the card, the table and the metric', async () => {
  serve(body([entry('Fixture Tiny', { earningsBaseUnits: '1', earningsWrf: '0.00000001' })]));
  render(<GlobalLeaderboard />);
  expect(await screen.findByText('Fixture Tiny')).not.toBeNull();
  expect(screen.getAllByText('0.00000001 WRF').length).toBeGreaterThan(0);
  // the podium card shows the bare amount under "WRF Earned"
  expect(screen.getAllByText('0.00000001').length).toBeGreaterThan(0);
  expect(screen.queryByText('0 WRF')).toBeNull();
});

it('keeps a proven zero as 0 next to a positive tiny amount', async () => {
  serve(body([
    entry('Fixture Tiny', { earningsBaseUnits: '1', earningsWrf: '0.00000001' }),
    entry('Fixture Zed', { rank: 2, profileKey: 'key-zed', earningsBaseUnits: '0', earningsWrf: '0' }),
  ]));
  render(<GlobalLeaderboard />);
  expect(await screen.findByText('Fixture Zed')).not.toBeNull();
  expect(screen.getAllByText('0 WRF').length).toBeGreaterThan(0);
  expect(screen.getAllByText('0.00000001 WRF').length).toBeGreaterThan(0);
});

it('sums the overview in exact base units (no float rounding)', async () => {
  serve(body([
    entry('Fixture A', { earningsBaseUnits: '1', earningsWrf: '0.00000001' }),
    entry('Fixture B', { rank: 2, profileKey: 'key-b', earningsBaseUnits: '2', earningsWrf: '0.00000002' }),
    entry('Fixture C', { rank: 3, profileKey: 'key-c', earningsBaseUnits: '9007199254740993', earningsWrf: '90071992.54740993' }),
  ]));
  render(<GlobalLeaderboard />);
  expect((await screen.findAllByText('Fixture A')).length).toBeGreaterThan(0);
  // 1 + 2 + 9007199254740993 base units = 9007199254740996 = 90,071,992.54740996 WRF (beyond float precision)
  expect(screen.getByText('90,071,992.54740996')).not.toBeNull();
});

it('groups large whole amounts and trims trailing zeros without rounding', async () => {
  serve(body([entry('Fixture Big', { earningsBaseUnits: '123456789012', earningsWrf: '1234.56789012' })]));
  render(<GlobalLeaderboard />);
  expect(await screen.findByText('Fixture Big')).not.toBeNull();
  expect(screen.getAllByText('1,234.56789012 WRF').length).toBeGreaterThan(0);
});

it('refuses a base-units amount that disagrees with its display string', async () => {
  serve(body([entry('Fixture Bad', { earningsBaseUnits: '1', earningsWrf: '5' })]));
  render(<GlobalLeaderboard />);
  expect(await screen.findByText('Not live on the testnet yet')).not.toBeNull();
});
