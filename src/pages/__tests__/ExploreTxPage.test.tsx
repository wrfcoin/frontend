/** @jest-environment jsdom */
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import ExploreTxPage from '../ExploreTxPage';

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
