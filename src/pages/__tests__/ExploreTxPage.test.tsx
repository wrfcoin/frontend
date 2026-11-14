/** @jest-environment jsdom */
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import ExploreTxPage, { TX_POLL_MAX, TX_POLL_MS } from '../ExploreTxPage';

const HASH = `0x${'ab'.repeat(32)}`;
let requests: string[] = [];

function answer(status: number, body: unknown = {}) {
  requests = [];
  global.fetch = jest.fn(async (input: Parameters<typeof fetch>[0]) => {
    requests.push(String(input));
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
}

function renderAt(hash: string) {
  render(
    <MemoryRouter initialEntries={[`/explore/tx/${hash}`]}>
      <Routes>
        <Route path="/explore/tx/:hash" element={<ExploreTxPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('/explore/tx/:hash', () => {
  afterEach(() => cleanup());

  it('shows a confirmed transaction: type, block and time, nothing about who or how much', async () => {
    answer(200, { success: true, data: { hash: HASH, status: 'included', blockHeight: 4321, txType: 'ForecastCommit', timestamp: '2026-11-08T10:00:00.000Z', windowLimited: true } });
    renderAt('AB'.repeat(32));
    expect((await screen.findByTestId('explore-tx-status')).textContent).toBe('Confirmed');
    expect(screen.getByTestId('explore-tx-type').textContent).toContain('Forecast (sealed)');
    expect(screen.getByTestId('explore-tx-block').textContent).toContain('4,321');
    expect(screen.getByTestId('explore-tx-block-link').getAttribute('href')).toBe('/explore/block/4321');
    expect(screen.getByTestId('explore-tx-hash').textContent).toBe(HASH);
    expect(requests).toEqual([`/api/blockchain/transactions/${HASH}`]);
  });

  it('says a pending transaction is waiting for a block', async () => {
    answer(200, { success: true, data: { hash: HASH, status: 'pending', blockHeight: null, txType: 'Transfer', timestamp: null } });
    renderAt(HASH);
    expect((await screen.findByTestId('explore-tx-status')).textContent).toBe('Waiting');
    expect(screen.getByTestId('explore-tx-block').textContent).toContain('Not in a block yet');
  });

  it('"unknown" reads as not found on this node, with no detail fields', async () => {
    answer(200, { success: true, data: { hash: HASH, status: 'unknown', blockHeight: null, txType: null, timestamp: null } });
    renderAt(HASH);
    expect((await screen.findByTestId('explore-tx-status')).textContent).toBe('Not found');
    expect(screen.queryByTestId('explore-tx-type')).toBeNull();
  });

  it('a 501 from an older backend reads as switched off, not as not found', async () => {
    answer(501, { success: false, error: { code: 'NOT_IMPLEMENTED' } });
    renderAt(HASH);
    expect((await screen.findByTestId('explore-tx-message')).textContent).toContain('not switched on');
  });

  it('a malformed hash sends nothing', async () => {
    answer(200);
    renderAt('nothex');
    expect((await screen.findByTestId('explore-tx-message')).textContent).toContain('Not a transaction hash');
    expect(requests).toEqual([]);
  });
});

describe('F8: a waiting transaction page looks again', () => {
  const pending = { success: true, data: { hash: HASH, status: 'pending', blockHeight: null, txType: 'Transfer', timestamp: null } };
  const included = { success: true, data: { hash: HASH, status: 'included', blockHeight: 99, txType: 'Transfer', timestamp: '2026-11-08T10:00:00.000Z' } };

  /** Answers each lookup from `bodies` in turn (the last one repeats). */
  function sequence(bodies: Array<{ status: number; body: unknown }>) {
    requests = [];
    let i = 0;
    global.fetch = jest.fn(async (input: Parameters<typeof fetch>[0]) => {
      requests.push(String(input));
      const next = bodies[Math.min(i, bodies.length - 1)];
      i += 1;
      return new Response(JSON.stringify(next.body), { status: next.status, headers: { 'content-type': 'application/json' } });
    }) as typeof fetch;
  }

  afterEach(() => { cleanup(); jest.useRealTimers(); });

  it('Refresh shows the transaction once it is in a block', async () => {
    sequence([{ status: 200, body: pending }, { status: 200, body: included }]);
    renderAt(HASH);
    expect((await screen.findByTestId('explore-tx-status')).textContent).toBe('Waiting');
    fireEvent.click(screen.getByTestId('explore-tx-refresh'));
    expect(await screen.findByText('Confirmed')).toBeInTheDocument();
    expect(requests).toHaveLength(2);
    // Nothing more to wait for: no Refresh once included.
    expect(screen.queryByTestId('explore-tx-refresh')).toBeNull();
  });

  it('a busy answer has a Refresh that repeats the lookup', async () => {
    sequence([{ status: 429, body: { success: false } }, { status: 200, body: included }]);
    renderAt(HASH);
    expect((await screen.findByTestId('explore-tx-message')).textContent).toContain('Too many lookups');
    fireEvent.click(screen.getByTestId('explore-tx-refresh'));
    expect(await screen.findByText('Confirmed')).toBeInTheDocument();
  });

  it(`polls every ${TX_POLL_MS / 1000} s while waiting, at most ${TX_POLL_MAX} times, and stops once included`, async () => {
    jest.useFakeTimers();
    sequence([{ status: 200, body: pending }]);
    renderAt(HASH);
    await act(async () => { await jest.advanceTimersByTimeAsync(0); });
    expect(screen.getByTestId('explore-tx-status').textContent).toBe('Waiting');
    expect(requests).toHaveLength(1);
    for (let n = 1; n <= TX_POLL_MAX + 2; n += 1) {
      await act(async () => { await jest.advanceTimersByTimeAsync(TX_POLL_MS); });
    }
    expect(requests).toHaveLength(1 + TX_POLL_MAX);
    expect(screen.getByTestId('explore-tx-poll-note').textContent).toContain('Press Refresh');
  });

  it('stops polling as soon as the transaction is included', async () => {
    jest.useFakeTimers();
    sequence([{ status: 200, body: pending }, { status: 200, body: included }]);
    renderAt(HASH);
    await act(async () => { await jest.advanceTimersByTimeAsync(0); });
    await act(async () => { await jest.advanceTimersByTimeAsync(TX_POLL_MS); });
    expect(screen.getByTestId('explore-tx-status').textContent).toBe('Confirmed');
    await act(async () => { await jest.advanceTimersByTimeAsync(TX_POLL_MS * 3); });
    expect(requests).toHaveLength(2);
  });
});
