/** @jest-environment jsdom */
/**
 * Owner decision 2026-11-01: the public network status page. One GET to /api/public/network-status; a section
 * the node could not answer says so, never a zero; no keys, addresses or hosts are ever shown.
 */
import { jest } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

afterEach(() => {
  cleanup();
  jest.useRealTimers();
});

const { default: Page, duration, verdict, snapshotBlockAge, MAX_ARRIVAL_DELAY_S } = await import('../PublicNetworkStatusPage');

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
      { label: 'Producer A', online: true, blocksInWindow: 40, lastHeight: 25000 },
      { label: 'producer 2', online: true, blocksInWindow: 24, lastHeight: 24999 },
      { label: 'producer 3', online: false, blocksInWindow: 0, lastHeight: null },
    ],
  },
  nodePay: { status: 'ok', currentEpoch: 21, lastPaidEpoch: 19, epochsScanned: [21, 20, 19] },
  upgrades: { status: 'ok', activeFeatures: 30, signedNotice: null, pending: [{ feature: 'governance_proposals', activationHeight: 27000, blocksRemaining: 2000 }] },
  checkedAt: '2026-11-14T12:00:00.000Z',
  ...over,
});

function mockFetch(status, body) {
  globalThis.fetch = jest.fn(async () => ({ ok: status >= 200 && status < 300, status, headers: { get: () => null }, json: async () => body }));
}
const renderPage = () => render(<MemoryRouter><Page /></MemoryRouter>);

const RECEIVED = Date.parse('2026-11-14T12:00:00.000Z');
const ok = body => ({ ok: true, status: 200, headers: { get: () => null }, json: async () => body });
const status = code => ({ ok: false, status: code, headers: { get: () => null }, json: async () => ({ success: false }) });
/** fetch answers from a queue of replies (a function reply may throw); the last one repeats. */
function fetchSequence(...replies) {
  let i = 0;
  globalThis.fetch = jest.fn(async () => {
    const r = replies[Math.min(i, replies.length - 1)];
    i += 1;
    return typeof r === 'function' ? r() : r;
  });
}
async function advance(ms) {
  await act(async () => { await jest.advanceTimersByTimeAsync(ms); });
}
async function startWithFakeTimers() {
  jest.useFakeTimers({ now: RECEIVED, doNotFake: ['queueMicrotask'] });
  renderPage();
  await advance(0);
}

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
  expect(within(list).getByText('producer 3')).toBeInTheDocument();
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

test('success then 502: the last reading is kept, marked stale, and no outage is claimed', async () => {
  fetchSequence(ok(snapshot()), status(502));
  await startWithFakeTimers();
  expect(screen.getByTestId('status-verdict')).toHaveTextContent('Making blocks');
  await advance(60_000);
  expect(screen.getByTestId('status-stale')).toHaveTextContent('Could not refresh');
  expect(screen.getByTestId('status-stale').querySelector('time')).toHaveAttribute('dateTime', '2026-11-14T12:00:00.000Z');
  expect(screen.getByTestId('status-verdict')).toHaveTextContent('Status unknown right now');
  // Twenty minutes of failed refreshes later: still no "Not making blocks", and the age is not advanced.
  await advance(20 * 60_000);
  expect(screen.getByTestId('status-verdict')).not.toHaveTextContent('Not making blocks');
  expect(screen.getByTestId('status-verdict')).not.toHaveTextContent('Slower than usual');
  expect(screen.getByTestId('status-age')).toHaveTextContent('40 s ago');
  expect(screen.getByTestId('status-age')).toHaveTextContent('at last reading');
});

test('success then a network failure: stale, not an outage', async () => {
  fetchSequence(ok(snapshot()), () => { throw new TypeError('Failed to fetch'); });
  await startWithFakeTimers();
  await advance(60_000);
  expect(screen.getByTestId('status-stale')).toBeInTheDocument();
  await advance(20 * 60_000);
  expect(screen.getByTestId('status-verdict')).toHaveTextContent('Status unknown right now');
  expect(screen.getByTestId('status-height')).toHaveTextContent('25,000');
});

test('success then 404: "Not switched on yet", the old numbers are gone', async () => {
  fetchSequence(ok(snapshot()), status(404));
  await startWithFakeTimers();
  expect(screen.getByTestId('status-verdict')).toBeInTheDocument();
  await advance(60_000);
  expect(screen.getByText('Not switched on yet')).toBeInTheDocument();
  expect(screen.queryByTestId('status-verdict')).not.toBeInTheDocument();
  expect(screen.queryByTestId('status-tiles')).not.toBeInTheDocument();
});

test('a later successful refresh clears the stale state', async () => {
  fetchSequence(ok(snapshot()), status(502), ok(snapshot({ checkedAt: '2026-11-14T12:02:00.000Z' })));
  await startWithFakeTimers();
  await advance(60_000);
  expect(screen.getByTestId('status-stale')).toBeInTheDocument();
  await advance(60_000);
  expect(screen.queryByTestId('status-stale')).not.toBeInTheDocument();
  expect(screen.getByTestId('status-verdict')).toHaveTextContent('Making blocks');
});

test('block age counts from the snapshot checkedAt, not from when it arrived', async () => {
  // Built 50 s before it arrived (cached), the block was 200 s old then: 250 s now, past 3 x 77 = 231.
  const cached = snapshot({ checkedAt: new Date(RECEIVED - 50_000).toISOString(), blocks: { ...snapshot().blocks, lastBlockAgeSeconds: 200 } });
  fetchSequence(ok(cached));
  await startWithFakeTimers();
  expect(screen.getByTestId('status-age')).toHaveTextContent('4 min 10 s ago');
  expect(screen.getByTestId('status-verdict')).toHaveTextContent('Slower than usual');
  // The same snapshot again a minute later keeps counting from checkedAt (310 s), it does not restart.
  await advance(60_000);
  expect(screen.getByTestId('status-age')).toHaveTextContent('5 min 10 s ago');
});

test('snapshotBlockAge: bounded arrival delay and lastBlockAt fallback', () => {
  const d = snapshot();
  const checked = Date.parse(d.checkedAt);
  expect(snapshotBlockAge(d, checked + 50_000, checked + 50_000)).toBe(90);
  expect(snapshotBlockAge(d, checked + 50_000, checked + 60_000)).toBe(100);
  // A viewer clock behind the server: arrival delay is 0, never negative.
  expect(snapshotBlockAge(d, checked - 600_000, checked - 600_000)).toBe(40);
  // A viewer clock far ahead: arrival delay is capped.
  expect(snapshotBlockAge(d, checked + 86_400_000, checked + 86_400_000)).toBe(40 + MAX_ARRIVAL_DELAY_S);
  const noAge = snapshot({ blocks: { ...d.blocks, lastBlockAgeSeconds: null } });
  expect(snapshotBlockAge(noAge, checked, checked)).toBe(40);
  expect(snapshotBlockAge(snapshot({ blocks: { status: 'unavailable' } }), checked, checked)).toBeNaN();
});

test('node pay with an unread newer epoch says partly checked, not "none recently"', async () => {
  mockFetch(200, snapshot({ nodePay: { status: 'partial', currentEpoch: 21, lastPaidEpoch: null, epochsScanned: [21, 19], epochsUnread: [20] } }));
  renderPage();
  await screen.findByTestId('status-verdict');
  expect(screen.getByTestId('status-nodepay')).toHaveTextContent('Partly checkedcould not read epoch 20; now epoch 21');
  expect(screen.getByTestId('status-nodepay')).not.toHaveTextContent('None recently');
});
