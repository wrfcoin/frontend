/** @jest-environment jsdom */
/**
 * S4-S6 public read-only pages: every request must be one the edge admits (infra ac481c06
 * public_onboarding.caddy, via the allowlist fixture), 404 and 429 must degrade honestly, and a page load
 * must stay under the weather_noaa budget (10 req/min/IP).
 */
import React from 'react';
import { jest } from '@jest/globals';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import edge from '../../routes/__fixtures__/public-edge-allowlist.json';

const { PublicGovernanceListPage, PublicGovernanceProposalPage } = await import('../PublicGovernancePage');
const { default: PublicForecastPage } = await import('../PublicForecastPage');
const { default: PublicContributorProfilePage } = await import('../PublicContributorProfilePage');

function edgeAdmits(target) {
  const url = new URL(target, 'https://test.invalid');
  const query = url.search.replace(/^\?/, '');
  return edge.get.some(route =>
    new RegExp(route.path).test(url.pathname) &&
    (route.query === null || route.query.includes(query) ||
      (route.queryPattern !== undefined && new RegExp(route.queryPattern).test(query))));
}

let calls;
function mockFetch(handler) {
  calls = [];
  global.fetch = jest.fn(async (input, init) => {
    const url = new URL(String(input), 'https://test.invalid');
    calls.push({ target: `${url.pathname}${url.search}`, init });
    const { status = 200, body = {}, headers = {} } = handler(url.pathname, url.search) ?? {};
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });
  });
}
const targets = () => calls.map(c => c.target);
const mount = (element, route, initial) =>
  render(<MemoryRouter initialEntries={[initial]}><Routes><Route path={route} element={element} /></Routes></MemoryRouter>);

afterEach(() => { cleanup(); jest.restoreAllMocks(); });

describe('S4 governance', () => {
  it('lists proposals and the treasury with edge-admitted requests only', async () => {
    mockFetch(path => {
      if (path === '/api/governance/proposals') return { body: { success: true, proposals: [{ id: 'p-1', title: 'Raise the cap', status: 'ACTIVE' }] } };
      if (path === '/api/governance/treasury') return { body: { success: true, data: { balance: '12.50000000', totalDeposits: '20', totalWithdrawals: '7.5', transactionCount: 4,
        // figures are shown as WRF only when the node declares their units (app parity, #558)
        amountUnits: { denomination: 'WRF', baseUnitDecimals: 8, baseUnitsPerUnit: '100000000', available: true, fields: { balance: 'display_units', totalDeposits: 'display_units', totalWithdrawals: 'display_units' } } } } };
      return { status: 404 };
    });
    mount(<PublicGovernanceListPage />, '/governance/public', '/governance/public');
    await screen.findByText('Raise the cap');
    await waitFor(() => expect(screen.getByTestId('public-treasury')).toHaveTextContent(/12\.50000000 WRF/));
    expect(targets().sort()).toEqual(['/api/governance/proposals?limit=20&offset=0', '/api/governance/treasury']);
    expect(targets().every(edgeAdmits)).toBe(true);
    expect(calls.every(c => c.init?.credentials === 'omit' && !c.init?.headers)).toBe(true);
    // no page param, no write surfaces
    expect(targets().join()).not.toMatch(/page=|vote|delegat/);
  });

  it('the edge refuses a bare limit and `page`, which the page never sends', () => {
    expect(edgeAdmits('/api/governance/proposals?limit=20')).toBe(false);
    expect(edgeAdmits('/api/governance/proposals?page=1')).toBe(false);
    expect(edgeAdmits('/api/governance/proposals?limit=20&offset=0')).toBe(true);
  });

  it('shows a retry notice on 429 and does not retry by itself', async () => {
    mockFetch(() => ({ status: 429, headers: { 'retry-after': '30' } }));
    mount(<PublicGovernanceListPage />, '/governance/public', '/governance/public');
    await screen.findAllByText(/Too many requests/);
    expect(calls.length).toBe(2);
  });

  it('detail: valid id is requested; 404 says not found; invalid id makes no request', async () => {
    mockFetch(() => ({ status: 404 }));
    mount(<PublicGovernanceProposalPage />, '/governance/public/:proposalId', '/governance/public/abc_12-3');
    await screen.findByText('Proposal not found.');
    expect(targets()).toEqual(['/api/governance/proposals/abc_12-3']);
    expect(edgeAdmits(targets()[0])).toBe(true);
    cleanup();
    mockFetch(() => ({ status: 200 }));
    mount(<PublicGovernanceProposalPage />, '/governance/public/:proposalId', '/governance/public/bad.id%2F..');
    await screen.findByText('Proposal not found.');
    expect(calls).toEqual([]);
  });
});

describe('S5 forecast', () => {
  const body = path => {
    if (path.includes('/weather/current/')) return { body: { status: 'success', current: { data: { temperature: 21, temperatureUnit: 'C', conditions: 'Clear' } } } };
    return { body: { status: 'success', forecast: { periods: [{ name: 'Today', startTime: '2026-10-15T12:00:00Z', temperature: 70, temperatureUnit: 'F', shortForecast: 'Sunny' }] } } };
  };

  it('rounds to 0.1 degree before the call and makes exactly three admitted requests', async () => {
    mockFetch(path => body(path));
    render(<PublicForecastPage />);
    fireEvent.change(screen.getByLabelText(/Latitude/), { target: { value: '-33.86882' } });
    fireEvent.change(screen.getByLabelText(/Longitude/), { target: { value: '151.20935' } });
    fireEvent.click(screen.getByText('Get forecast'));
    await screen.findByText('Current conditions');
    await waitFor(() => expect(calls.length).toBe(3));
    expect(targets().sort()).toEqual([
      '/api/weather/current/-33.9,151.2',
      '/api/weather/forecast/-33.9,151.2?days=14',
      '/api/weather/forecast/-33.9,151.2?type=hourly&days=1',
    ]);
    expect(targets().every(edgeAdmits)).toBe(true);
    expect(screen.getByTestId('forecast-cell').textContent).toContain('-33.9,151.2');
    expect(JSON.stringify(targets())).not.toMatch(/33\.86|151\.20/);
  });

  it('x.x5 boundary rounds away from zero for negatives', async () => {
    mockFetch(path => body(path));
    render(<PublicForecastPage />);
    fireEvent.change(screen.getByLabelText(/Latitude/), { target: { value: '-0.25' } });
    fireEvent.change(screen.getByLabelText(/Longitude/), { target: { value: '0.05' } });
    fireEvent.click(screen.getByText('Get forecast'));
    await waitFor(() => expect(calls.length).toBe(3));
    expect(targets()[0]).toBe('/api/weather/current/-0.3,0.1');
  });

  it('makes no request for an invalid coordinate or before submit', async () => {
    mockFetch(() => ({ status: 200 }));
    render(<PublicForecastPage />);
    expect(calls).toEqual([]);
    fireEvent.change(screen.getByLabelText(/Latitude/), { target: { value: '123' } });
    fireEvent.change(screen.getByLabelText(/Longitude/), { target: { value: '10' } });
    fireEvent.click(screen.getByText('Get forecast'));
    await screen.findByText(/latitude between -90 and 90/);
    expect(calls).toEqual([]);
  });

  it('handles 429 per section without retrying', async () => {
    mockFetch(() => ({ status: 429, headers: { 'retry-after': '45' } }));
    render(<PublicForecastPage />);
    fireEvent.change(screen.getByLabelText(/Latitude/), { target: { value: '40' } });
    fireEvent.change(screen.getByLabelText(/Longitude/), { target: { value: '-74' } });
    fireEvent.click(screen.getByText('Get forecast'));
    await screen.findAllByText(/try again in 45s/);
    expect(calls.length).toBe(3);
  });

  it('handles 404 with an honest message', async () => {
    mockFetch(() => ({ status: 404 }));
    render(<PublicForecastPage />);
    fireEvent.change(screen.getByLabelText(/Latitude/), { target: { value: '40' } });
    fireEvent.change(screen.getByLabelText(/Longitude/), { target: { value: '-74' } });
    fireEvent.click(screen.getByText('Get forecast'));
    await screen.findAllByText(/No forecast is available/);
  });
});

describe('S6 contributor profile', () => {
  const KEY = 'c_0123456789abcdef01234567';

  it('requests exactly /api/operators/<c_key>/profile with no query and no credentials', async () => {
    mockFetch(() => ({ body: { profile: { walletAddress: '0xa1a1…a1a1', displayName: null, totalSubmissions: 12, stationCount: 1, currentStreak: 2, longestStreak: 4, qualityScore: 90, rank: 3, totalRewardsEarned: null } } }));
    mount(<PublicContributorProfilePage />, '/contributor/:key', `/contributor/${KEY}`);
    await screen.findByText('WeatherNode-A1A1');
    expect(targets()).toEqual([`/api/operators/${KEY}/profile`]);
    expect(edgeAdmits(targets()[0])).toBe(true);
    expect(calls[0].init.headers).toBeUndefined();
    expect(calls[0].init.credentials).toBe('omit');
    expect(screen.queryByText(/WRF earned/)).toBeNull();
  });

  it('shows unavailable statistics without inventing zeroes and preserves a reported zero', async () => {
    mockFetch(() => ({ body: { profile: { displayName: 'Fixture contributor', stationCount: 0 } } }));
    mount(<PublicContributorProfilePage />, '/contributor/:key', `/contributor/${KEY}`);
    await screen.findByText('Fixture contributor');
    expect(screen.getAllByText('Not yet available')).toHaveLength(4);
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.queryByText('0d')).toBeNull();
    expect(screen.queryByText('—%')).toBeNull();
  });

  it('a raw address (or any non-c_ key) is not looked up', async () => {
    mockFetch(() => ({ status: 200 }));
    for (const bad of ['0x' + 'a'.repeat(40), 'C_0123456789ABCDEF01234567', 'c_short', `${KEY}/extra`]) {
      mount(<PublicContributorProfilePage />, '/contributor/:key', `/contributor/${encodeURIComponent(bad)}`);
      await screen.findByText('Contributor not found.');
      cleanup();
    }
    expect(calls).toEqual([]);
  });

  it('404 and 429 degrade honestly', async () => {
    mockFetch(() => ({ status: 404 }));
    mount(<PublicContributorProfilePage />, '/contributor/:key', `/contributor/${KEY}`);
    await screen.findByText('Contributor not found.');
    cleanup();
    mockFetch(() => ({ status: 429 }));
    mount(<PublicContributorProfilePage />, '/contributor/:key', `/contributor/${KEY}`);
    await screen.findByText(/Too many requests/);
    expect(calls.length).toBe(1);
  });
});
