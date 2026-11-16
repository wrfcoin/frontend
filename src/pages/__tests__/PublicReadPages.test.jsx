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
  it('lists proposals with edge-admitted requests only', async () => {
    mockFetch(path => {
      if (path === '/api/governance/proposals') return { body: { success: true, proposals: [{ id: 'p-1', title: 'Raise the cap', status: 'ACTIVE' }] } };
      return { status: 404 };
    });
    mount(<PublicGovernanceListPage />, '/governance/public', '/governance/public');
    await screen.findByText('Raise the cap');
    await waitFor(() => expect(targets().length).toBe(2));
    expect([...targets()].sort()).toEqual(['/api/governance/advisory/proposals?limit=20&offset=0', '/api/governance/proposals?limit=20&offset=0']);
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
    // One proposal-list read and one advisory read; neither is retried.
    await waitFor(() => expect(calls.length).toBe(2));
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

describe('S4 governance: advisory proposal detail', () => {
  const ADV_ID = 'adv-a75dae543f5f9e16';
  const ADV = {
    id: ADV_ID, kind: 'advisory', proposer: '0x' + 'cd'.repeat(20), title: 'Welcome new station owners',
    summary: 'First line.\nSecond line.', created_at_block: 27010, voting_deadline: 27130, status: 'active',
    yes_votes: 3, no_votes: 1, eligible_count: 14,
  };

  it('reads the advisory route (edge-admitted, no query) and shows the proposal', async () => {
    mockFetch(path => (path === `/api/governance/advisory/proposals/${ADV_ID}`
      ? { body: { success: true, observedAtHeight: 27020, proposal: ADV, limits: null } } : { status: 404 }));
    mount(<PublicGovernanceProposalPage />, '/governance/public/:proposalId', `/governance/public/${ADV_ID}`);
    await screen.findByRole('heading', { name: 'Welcome new station owners' });
    // Build flag off here: one read, never the old /proposals/<id> route.
    expect(targets()).toEqual([`/api/governance/advisory/proposals/${ADV_ID}`]);
    expect(targets().every(edgeAdmits)).toBe(true);
    expect(calls.every(c => c.init?.credentials === 'omit' && !c.init?.headers)).toBe(true);
    const card = screen.getByTestId('advisory-proposal-detail');
    expect(card).toHaveTextContent('Voting');
    expect(card).toHaveTextContent('For 3 · Against 1');
    expect(card).toHaveTextContent('14 wallets');
    expect(card).toHaveTextContent('at block 27130');
    expect(card).toHaveTextContent(ADV_ID);
    expect(card.textContent).toContain('First line.\nSecond line.');
    expect(screen.queryByText('Proposal not found.')).toBeNull();
    expect(screen.queryByTestId('advisory-vote-for')).toBeNull();
  });

  it('a decided proposal shows its result and block', async () => {
    mockFetch(() => ({ body: { success: true, proposal: { ...ADV, status: 'passed', finalized_at_block: 27131 } } }));
    mount(<PublicGovernanceProposalPage />, '/governance/public/:proposalId', `/governance/public/${ADV_ID}`);
    const card = await screen.findByTestId('advisory-proposal-detail');
    expect(card).toHaveTextContent('Passed (advisory)');
    expect(card).toHaveTextContent('block 27131');
    expect(card).not.toHaveTextContent('Voting ends');
  });

  it('404, or a null proposal, says not found', async () => {
    mockFetch(() => ({ status: 404, body: { success: false } }));
    mount(<PublicGovernanceProposalPage />, '/governance/public/:proposalId', `/governance/public/${ADV_ID}`);
    await screen.findByText('Proposal not found.');
    expect(targets()).toEqual([`/api/governance/advisory/proposals/${ADV_ID}`]);
    cleanup();
    mockFetch(() => ({ body: { success: true, proposal: null } }));
    mount(<PublicGovernanceProposalPage />, '/governance/public/:proposalId', `/governance/public/${ADV_ID}`);
    await screen.findByText('Proposal not found.');
  });

  it('a malformed adv- id is not found without any request (the edge would refuse it)', async () => {
    for (const bad of ['adv-A75DAE543F5F9E16', 'adv-123', 'adv-a75dae543f5f9e16x']) {
      mockFetch(() => ({ status: 200 }));
      mount(<PublicGovernanceProposalPage />, '/governance/public/:proposalId', `/governance/public/${bad}`);
      await screen.findByText('Proposal not found.');
      expect(calls).toEqual([]);
      cleanup();
    }
  });

  it('a server error shows a retry that reads again; 429 says too many requests', async () => {
    let fail = true;
    mockFetch(() => (fail ? { status: 502 } : { body: { success: true, proposal: ADV } }));
    mount(<PublicGovernanceProposalPage />, '/governance/public/:proposalId', `/governance/public/${ADV_ID}`);
    await screen.findByText('Proposal unavailable right now.');
    expect(screen.queryByText('Proposal not found.')).toBeNull();
    fail = false;
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await screen.findByRole('heading', { name: 'Welcome new station owners' });
    expect(targets()).toEqual([`/api/governance/advisory/proposals/${ADV_ID}`, `/api/governance/advisory/proposals/${ADV_ID}`]);
    cleanup();
    mockFetch(() => ({ status: 429, headers: { 'retry-after': '30' } }));
    mount(<PublicGovernanceProposalPage />, '/governance/public/:proposalId', `/governance/public/${ADV_ID}`);
    await screen.findByText(/Too many requests/);
    expect(calls.length).toBe(1);
  });

  it('the list links each advisory proposal to its detail page', async () => {
    mockFetch(path => (path === '/api/governance/advisory/proposals'
      ? { body: { success: true, featureActive: true, total: 1, hasMore: false, proposals: [ADV] } }
      : { body: { success: true, proposals: [] } }));
    mount(<PublicGovernanceListPage />, '/governance/public', '/governance/public');
    const link = await screen.findByRole('link', { name: 'Welcome new station owners' });
    expect(link).toHaveAttribute('href', `/governance/public/${ADV_ID}`);
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
