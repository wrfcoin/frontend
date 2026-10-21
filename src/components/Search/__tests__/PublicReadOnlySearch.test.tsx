/** @jest-environment jsdom */
/**
 * Stage 1.5 public search: say what actually happened. The backend answers
 * transaction lookups with an honest 501 (blockchain-routes.js), and the public
 * edge never admits block-by-height detail, so neither may read as "no match".
 */
import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import PublicReadOnlySearch from '../PublicReadOnlySearch';
import { retryStationQuality } from '../../../hooks/api/useWeatherQueries';
import { STATION_QUALITY_NOT_LIVE } from '../../../services/apiClient/weatherService';

const HASH = 'b'.repeat(64);
let requests: string[] = [];

function answer(status: number, body: unknown = {}) {
  requests = [];
  global.fetch = jest.fn(async (input: Parameters<typeof fetch>[0]) => {
    requests.push(String(input));
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;
}

function renderSearch(query: string) {
  render(
    <MemoryRouter initialEntries={[`/search?q=${query}`]}>
      <Routes>
        <Route path="/search" element={<PublicReadOnlySearch />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PublicReadOnlySearch (Stage 1.5)', () => {
  afterEach(() => cleanup());

  it('a 501 transaction lookup reads as unavailable, not as "no match"', async () => {
    answer(501, { success: false, error: { code: 'NOT_IMPLEMENTED' } });
    renderSearch(HASH);
    expect(await screen.findByText('Transaction lookup is not available on this testnet yet.')).toBeTruthy();
    expect(screen.queryByText(/No transaction with that hash/)).toBeNull();
    expect(requests).toEqual([`/api/blockchain/transactions/${HASH}`]);
  });

  it('only a 404 reads as "not found"', async () => {
    answer(404);
    renderSearch(HASH);
    expect(await screen.findByText('No transaction with that hash was found on the testnet.')).toBeTruthy();
  });

  it('any other failure says the API did not answer', async () => {
    answer(502);
    renderSearch(HASH);
    expect(await screen.findByText('The testnet API did not answer. Try again later.')).toBeTruthy();
  });

  it('a block height sends nothing and points at the Explorer', async () => {
    answer(200);
    renderSearch('24356');
    expect(await screen.findByText(/Looking up a single block is not available on the public site/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Block Explorer' }).getAttribute('href')).toBe('/explore');
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(requests).toEqual([]);
  });

  it('an unsupported query sends nothing', async () => {
    answer(200);
    renderSearch('hello');
    await waitFor(() => expect(screen.getByText('That query is not a supported public identifier.')).toBeTruthy());
    expect(requests).toEqual([]);
  });
});

describe('retryStationQuality', () => {
  it('never retries the backend\'s "no live quality score yet" answer', () => {
    expect(retryStationQuality(0, new Error(STATION_QUALITY_NOT_LIVE))).toBe(false);
  });

  it('retries transport failures up to three times', () => {
    const failure = new Error('network down');
    expect([0, 1, 2, 3].map(count => retryStationQuality(count, failure))).toEqual([true, true, true, false]);
  });
});
