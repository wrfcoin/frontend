/** @jest-environment jsdom */
/**
 * Stage 1.5 public search: a hash or an address opens its own /explore page; the
 * public edge never admits block-by-height detail, so a height may not read as
 * "no match".
 */
import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
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

function Probe() {
  const location = useLocation();
  return <div data-testid="landed">{location.pathname}</div>;
}

function renderSearchRouted(query: string) {
  render(
    <MemoryRouter initialEntries={[`/search?q=${query}`]}>
      <Routes>
        <Route path="/search" element={<PublicReadOnlySearch />} />
        <Route path="/explore/*" element={<Probe />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PublicReadOnlySearch (Stage 1.5)', () => {
  afterEach(() => cleanup());

  it('a transaction hash opens its /explore/tx page and sends nothing itself', async () => {
    answer(200);
    renderSearchRouted(HASH.toUpperCase());
    expect((await screen.findByTestId('landed')).textContent).toBe(`/explore/tx/0x${HASH}`);
    expect(requests).toEqual([]);
  });

  it('an address opens its /explore/address page', async () => {
    answer(200);
    renderSearchRouted(`wrf${'C'.repeat(40)}`);
    expect((await screen.findByTestId('landed')).textContent).toBe(`/explore/address/0x${'c'.repeat(40)}`);
  });

  it('a block number opens its /explore/block page and sends nothing itself', async () => {
    answer(200);
    renderSearchRouted('24356');
    expect((await screen.findByTestId('landed')).textContent).toBe('/explore/block/24356');
    expect(requests).toEqual([]);
  });

  it('a block number longer than the edge admits sends nothing and points at the Explorer', async () => {
    answer(200);
    renderSearch('12345678901');
    expect(await screen.findByText(/That block number is too large/)).toBeTruthy();
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
