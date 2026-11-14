/** @jest-environment jsdom */
/**
 * Owner decision 2026-11-01: the public network status page. One GET to /api/public/network-status; a section
 * the node could not answer says so, never a zero; no keys, addresses or hosts are ever shown.
 */
import { jest } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

afterEach(cleanup);

const { default: Page, duration, verdict } = await import('../PublicNetworkStatusPage');

const snapshot = (over = {}) => ({
  network: { status: 'ok', chainId: '888', networkId: 'testnet', syncStatus: 'synced', peerCount: 2 },
  blocks: {
    status: 'ok', targetBlockSeconds: 77, tipHeight: 25000, lastBlockAt: '2026-11-14T11:59:20.000Z', lastBlockAgeSeconds: 40,
    lastHour: { produced: 47, expected: 46 }, lastDay: { produced: 1100, expected: 1122, atLeast: false },
    longestGapSeconds: { value: 154, overBlocks: 100 },
  },
  producers: {
    status: 'ok', windowBlocks: 64, total: 3, online: 2,
    members: [
      { label: 'n5-node-a', online: true, blocksInWindow: 40, lastHeight: 25000 },
      { label: 'mango-mini', online: true, blocksInWindow: 24, lastHeight: 24999 },
      { label: 'producer-standby', online: false, blocksInWindow: 0, lastHeight: null },
    ],
  },
  nodePay: { status: 'ok', currentEpoch: 21, lastPaidEpoch: 19, epochsScanned: [21, 20, 19, 18, 17, 16, 15, 14] },
  upgrades: { status: 'ok', activeFeatures: 30, signedNotice: null, pending: [{ feature: 'governance_proposals', activationHeight: 27000, blocksRemaining: 2000 }] },
  checkedAt: '2026-11-14T12:00:00.000Z',
  ...over,
});

function mockFetch(status, body) {
  globalThis.fetch = jest.fn(async () => ({ ok: status >= 200 && status < 300, status, headers: { get: () => null }, json: async () => body }));
}
const renderPage = () => render(<MemoryRouter><Page /></MemoryRouter>);

test('shows the verdict, block pace, producers online, peers, node pay and scheduled upgrades', async () => {
  mockFetch(200, snapshot());
  renderPage();
  const verdictBox = await screen.findByTestId('status-verdict');
  expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  expect(String(globalThis.fetch.mock.calls[0][0])).toMatch(/\/api\/public\/network-status$/);
  expect(verdictBox).toHaveTextContent('Making blocks');
  expect(screen.getByTestId('status-height')).toHaveTextContent('25,000');
  expect(screen.getByTestId('status-age')).toHaveTextContent(/4\d s ago/);
  expect(screen.getByTestId('status-hour')).toHaveTextContent('47of ~46 expected · 102%');
  expect(screen.getByTestId('status-day')).toHaveTextContent('1,100of ~1,122 expected · 98%');
  expect(screen.getByTestId('status-producers')).toHaveTextContent('2 of 3');
  expect(screen.getByTestId('status-peers')).toHaveTextContent('2node synced');
  expect(screen.getByTestId('status-nodepay')).toHaveTextContent('Epoch 19 paidnow epoch 21');
  expect(screen.getByTestId('status-gap')).toHaveTextContent('2 min 34 s');
  const list = screen.getByTestId('status-producer-list');
  expect(within(list).getByText('producer-standby')).toBeInTheDocument();
  expect(within(list).getByText('Not seen')).toBeInTheDocument();
  const up = screen.getByTestId('status-upgrades');
  expect(up).toHaveTextContent('Governance proposals');
  expect(up).toHaveTextContent('27,000');
  expect(up).toHaveTextContent('~42 h 47 min');
});

test('a section the node did not answer reads unavailable, never zero', async () => {
  mockFetch(200, snapshot({ producers: { status: 'unavailable' }, nodePay: { status: 'unavailable' }, upgrades: { status: 'unavailable' }, network: { status: 'unavailable' } }));
  renderPage();
  await screen.findByTestId('status-verdict');
  expect(screen.getByTestId('status-producers')).toHaveTextContent('Unavailable');
  expect(screen.getByTestId('status-peers')).toHaveTextContent('Unavailable');
  expect(screen.getByTestId('status-nodepay')).toHaveTextContent('Unavailable');
  expect(screen.getByText(/The upgrade schedule unavailable/)).toBeInTheDocument();
  expect(screen.queryByText('0 of 3')).not.toBeInTheDocument();
});

test('an hour the backend could not count is unavailable; a long day count is shown as at least', async () => {
  mockFetch(200, snapshot({ blocks: { ...snapshot().blocks, lastHour: { produced: null, expected: 46 }, lastDay: { produced: 4001, expected: 1122, atLeast: true } } }));
  renderPage();
  await screen.findByTestId('status-verdict');
  expect(screen.getByTestId('status-hour')).toHaveTextContent('Unavailable');
  expect(screen.getByTestId('status-day')).toHaveTextContent('4,001+');
});

test('a stalled chain says so', async () => {
  mockFetch(200, snapshot({ blocks: { ...snapshot().blocks, lastBlockAgeSeconds: 3 * 3600 } }));
  renderPage();
  expect(await screen.findByTestId('status-verdict')).toHaveTextContent('Not making blocks');
  expect(screen.getByTestId('status-verdict')).toHaveTextContent('3 h');
});

test('no paid epoch among the scanned ones is said plainly', async () => {
  mockFetch(200, snapshot({ nodePay: { status: 'ok', currentEpoch: 21, lastPaidEpoch: null, epochsScanned: [21, 20, 19, 18, 17, 16, 15, 14] } }));
  renderPage();
  await screen.findByTestId('status-verdict');
  expect(screen.getByTestId('status-nodepay')).toHaveTextContent('None recentlyno paid epoch in the last 8; now epoch 21');
});

test('404 (read switched off) shows "not switched on yet"', async () => {
  mockFetch(404, { error: 'Not found' });
  renderPage();
  expect(await screen.findByText('Not switched on yet')).toBeInTheDocument();
});

test('an upstream error offers a retry', async () => {
  mockFetch(502, { success: false });
  renderPage();
  expect(await screen.findByRole('alert')).toHaveTextContent('network status is unavailable');
});

test('duration and verdict helpers', () => {
  expect(duration(40)).toBe('40 s');
  expect(duration(154)).toBe('2 min 34 s');
  expect(duration(600)).toBe('10 min');
  expect(duration(3 * 3600 + 300)).toBe('3 h 5 min');
  expect(duration(5 * 86400)).toBe('5 days');
  expect(verdict(200, 77).tone).toBe('ok');
  expect(verdict(400, 77).tone).toBe('warn');
  expect(verdict(1200, 77).tone).toBe('bad');
  expect(verdict(NaN, 77).tone).toBe('unknown');
});
