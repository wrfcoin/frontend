/** @jest-environment jsdom */
/**
 * frontend#356 — the real /governance/comprehensive dashboard. Every enabled
 * vote/delegate control issues exactly one real request and failures show as
 * failures. Fabricated tabs render no invented proposals, delegates or
 * amounts. Only fetch and feature flags are faked.
 */
import React from 'react';
import { jest } from '@jest/globals';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const featureFlags = { demoSurfaces: false, fullStudio: true, publicReadonly: false, governanceAdvanced: true };

await jest.unstable_mockModule('../../../config/features', () => ({
  FEATURES: featureFlags,
  default: featureFlags,
  isMvpMode: () => false,
}));

const { default: ComprehensiveGovernanceDashboard } = await import('../ComprehensiveGovernanceDashboard');
const { setAuthToken, clearAuthToken } = await import('../../../services/authTokenStore');

const VOTER = '0x1111111111111111111111111111111111111111';
const DELEGATE = '0x2222222222222222222222222222222222222222';
const FABRICATED = [
  'ClimateDAO', 'WeatherNode', 'Implement Enhanced Climate Data Validation',
  'Treasury Allocation for Cross-Chain Infrastructure', '0 vWRF',
];

function jwtFor(sub) {
  const b64 = value => btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub })}.sig`;
}

let requests;
let voteResponse;
let delegateResponse;
let powerFor;

const OTHER = '0x3333333333333333333333333333333333333333';

function deferred() {
  let resolve;
  const promise = new Promise(r => { resolve = r; });
  return { promise, resolve };
}

function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

beforeEach(() => {
  requests = [];
  powerFor = {};
  voteResponse = () => json(200, { success: true, vote: { proposalId: 'prop-001', voterAddress: VOTER, support: true } });
  delegateResponse = () => json(201, { success: true, delegation: { delegator: VOTER, delegate: DELEGATE, amount: '0' } });
  global.fetch = jest.fn(async (input, init = {}) => {
    const url = new URL(String(input), 'https://test.invalid');
    const headers = new Headers(init.headers);
    requests.push({
      method: init.method ?? 'GET',
      path: url.pathname,
      search: url.search,
      auth: headers.get('authorization'),
      body: init.body ? JSON.parse(init.body) : undefined,
    });
    if (url.pathname === '/api/governance/proposals') {
      return json(200, {
        success: true,
        count: 1,
        proposals: [{
          id: 'prop-001', status: 'Active', yes_votes: 3, no_votes: 1,
          proposer: '0xabc', votes_by_voter: {},
        }],
      });
    }
    if (url.pathname === '/api/governance/proposals/prop-001/vote') return voteResponse();
    if (url.pathname === '/api/governance/voting-power') {
      const address = url.searchParams.get('address');
      if (powerFor[address]) return powerFor[address]();
      return json(200, { success: true, data: { address: VOTER, delegatedPower: 40, participationBonus: 10, totalPower: 50 } });
    }
    if (url.pathname === `/api/governance/delegations/delegator/${OTHER}`) {
      return json(200, { success: true, count: 0, delegations: [] });
    }
    if (url.pathname === `/api/governance/delegations/delegator/${VOTER}`) {
      return json(200, { success: true, count: 0, delegations: [] });
    }
    if (url.pathname === '/api/governance/delegate') return delegateResponse();
    return json(404, { success: false, error: 'not mounted' });
  });
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  clearAuthToken();
  jest.restoreAllMocks();
  featureFlags.demoSurfaces = false;
});

async function renderDashboard() {
  await act(async () => {
    render(
      <MemoryRouter initialEntries={['/governance/comprehensive']}>
        <ComprehensiveGovernanceDashboard />
      </MemoryRouter>,
    );
  });
  return screen.findByTestId('proposal-prop-001');
}

const posts = path => requests.filter(r => r.method === 'POST' && r.path === path);
const card = () => screen.getByTestId('proposal-prop-001');
const voteButton = name => within(card()).getByRole('button', { name });

describe('Overview: For/Against votes', () => {
  it('signed out: For/Against are disabled with a reason and issue nothing', async () => {
    await renderDashboard();
    expect(voteButton('For').disabled).toBe(true);
    expect(voteButton('Against').disabled).toBe(true);
    expect(screen.getByTestId('vote-disabled-reason-prop-001').textContent).toMatch(/Sign in with a wallet to vote/);
    fireEvent.click(voteButton('For'));
    expect(posts('/api/governance/proposals/prop-001/vote')).toHaveLength(0);
    expect(within(card()).queryByRole('button', { name: 'Abstain' })).toBeNull();
  });

  it('signed in: For issues exactly one authenticated POST and reports acceptance', async () => {
    setAuthToken(jwtFor(VOTER));
    await renderDashboard();
    fireEvent.click(voteButton('For'));
    await screen.findByTestId('vote-recorded-prop-001');
    const sent = posts('/api/governance/proposals/prop-001/vote');
    expect(sent).toHaveLength(1);
    expect(sent[0].auth).toBe(`Bearer ${jwtFor(VOTER)}`);
    expect(sent[0].body).toMatchObject({ voteType: 'FOR', support: true });
  });

  it('Against sends AGAINST', async () => {
    setAuthToken(jwtFor(VOTER));
    await renderDashboard();
    fireEvent.click(voteButton('Against'));
    await screen.findByTestId('vote-recorded-prop-001');
    expect(posts('/api/governance/proposals/prop-001/vote')[0].body).toMatchObject({ voteType: 'AGAINST', support: false });
  });

  it.each([
    [401, { success: false, error: 'Authentication required' }],
    [503, { success: false, error: 'core4 unavailable' }],
  ])('a %s is shown as a failure, never as success', async (status, body) => {
    voteResponse = () => json(status, body);
    setAuthToken(jwtFor(VOTER));
    await renderDashboard();
    fireEvent.click(voteButton('For'));
    const error = await screen.findByTestId('vote-error-prop-001');
    expect(error.textContent).toMatch(/Vote not recorded/);
    expect(screen.queryByTestId('vote-recorded-prop-001')).toBeNull();
    expect(posts('/api/governance/proposals/prop-001/vote')).toHaveLength(1);
  });

  it('logout while mounted disables voting at once', async () => {
    setAuthToken(jwtFor(VOTER));
    await renderDashboard();
    expect(voteButton('For').disabled).toBe(false);
    await act(async () => {
      clearAuthToken();
    });
    expect(voteButton('For').disabled).toBe(true);
    expect(screen.getByTestId('summary-Your Voting Power').textContent).toBe('—');
  });

  it('shows the tally the source reports', async () => {
    await renderDashboard();
    expect(card().textContent).toContain('For 3 (75.0%)');
    expect(card().textContent).toContain('Against 1 (25.0%)');
  });
});

describe('Overview: delegation', () => {
  it('signed out: no invented power, delegate disabled, no unmounted route read', async () => {
    await renderDashboard();
    const panel = screen.getByTestId('delegate-panel');
    expect(within(panel).getByTestId('delegate-sign-in')).not.toBeNull();
    expect(within(panel).getByRole('button', { name: 'Delegate' }).disabled).toBe(true);
    expect(within(panel).queryByRole('button', { name: /Self-Delegate/ })).toBeNull();
    expect(screen.getByTestId('summary-Your Voting Power').textContent).toBe('—');
    expect(requests.some(r => r.path === '/api/governance/delegate/me')).toBe(false);
  });

  it('signed in: real voting power; Delegate issues one authenticated POST', async () => {
    setAuthToken(jwtFor(VOTER));
    await renderDashboard();
    await waitFor(() => expect(screen.getByTestId('summary-Your Voting Power').textContent).toBe('50'));
    const panel = screen.getByTestId('delegate-panel');
    fireEvent.change(within(panel).getByLabelText('Delegate address'), { target: { value: DELEGATE } });
    fireEvent.click(within(panel).getByRole('button', { name: 'Delegate' }));
    await screen.findByTestId('delegate-recorded');
    const sent = posts('/api/governance/delegate');
    expect(sent).toHaveLength(1);
    expect(sent[0].auth).toBe(`Bearer ${jwtFor(VOTER)}`);
    expect(sent[0].body).toEqual({ delegate: DELEGATE });
  });

  it('a delegation failure is shown as a failure', async () => {
    delegateResponse = () => json(401, { success: false, error: 'Authentication required' });
    setAuthToken(jwtFor(VOTER));
    await renderDashboard();
    const panel = screen.getByTestId('delegate-panel');
    fireEvent.change(within(panel).getByLabelText('Delegate address'), { target: { value: DELEGATE } });
    fireEvent.click(within(panel).getByRole('button', { name: 'Delegate' }));
    expect((await screen.findByTestId('delegate-error')).textContent).toMatch(/Delegation not recorded/);
    expect(screen.queryByTestId('delegate-recorded')).toBeNull();
  });
});

describe('Foundation tab', () => {
  it('default build: honest not-live state and no invented proposals or delegates', async () => {
    await renderDashboard();
    fireEvent.click(screen.getByRole('tab', { name: /Foundation/ }));
    expect(await screen.findByTestId('governance-foundation-not-live')).not.toBeNull();
    const page = document.body.textContent ?? '';
    for (const literal of FABRICATED) expect(page).not.toContain(literal);
  });

  it('demo build: sample under its badge, and its vote buttons cannot act', async () => {
    featureFlags.demoSurfaces = true;
    await renderDashboard();
    fireEvent.click(screen.getByRole('tab', { name: /Foundation/ }));
    const sample = await screen.findByTestId('governance-foundation-sample');
    expect(within(sample).getByTestId('governance-foundation-sample-badge')).not.toBeNull();
    const voteButtons = await within(sample).findAllByRole('button', { name: /Vote (For|Against)/ });
    expect(voteButtons.length).toBeGreaterThan(0);
    for (const button of voteButtons) expect(button.disabled).toBe(true);
    expect(sample.textContent).toContain('Sample only: votes and proposals are not submitted anywhere.');
  });
});

// Codex round 15 on #391: account-specific results are bound to the session
// that started them. A completion that lands after the subject changed
// (success or error) is not shown to the new account.
describe('delayed responses across an account switch', () => {
  async function switchTo(sub) {
    await act(async () => {
      setAuthToken(jwtFor(sub));
    });
  }

  it('A\'s vote succeeding after the switch to B is not shown to B', async () => {
    const pending = deferred();
    voteResponse = () => pending.promise;
    setAuthToken(jwtFor(VOTER));
    await renderDashboard();
    fireEvent.click(voteButton('For'));
    await switchTo(OTHER);
    await act(async () => {
      pending.resolve(json(200, { success: true, vote: { proposalId: 'prop-001', voterAddress: VOTER } }));
    });
    await new Promise(r => setTimeout(r, 20));
    expect(screen.queryByTestId('vote-recorded-prop-001')).toBeNull();
    expect(voteButton('For').disabled).toBe(false);
    expect(voteButton('Against').disabled).toBe(false);
  });

  it('A\'s vote failing after the switch to B is not shown to B either', async () => {
    const pending = deferred();
    voteResponse = () => pending.promise;
    setAuthToken(jwtFor(VOTER));
    await renderDashboard();
    fireEvent.click(voteButton('For'));
    await switchTo(OTHER);
    await act(async () => {
      pending.resolve(json(503, { success: false, error: 'core4 unavailable' }));
    });
    await new Promise(r => setTimeout(r, 20));
    expect(screen.queryByTestId('vote-error-prop-001')).toBeNull();
  });

  it('B\'s power is not overwritten by A\'s slower response', async () => {
    const slowA = deferred();
    powerFor[VOTER] = () => slowA.promise;
    powerFor[OTHER] = () =>
      json(200, { success: true, data: { address: OTHER, delegatedPower: 0, participationBonus: 0, totalPower: 0 } });
    setAuthToken(jwtFor(VOTER));
    await renderDashboard();
    await switchTo(OTHER);
    await waitFor(() => expect(screen.getByTestId('summary-Your Voting Power').textContent).toBe('0'));
    await act(async () => {
      slowA.resolve(json(200, { success: true, data: { address: VOTER, delegatedPower: 40, participationBonus: 10, totalPower: 50 } }));
    });
    await new Promise(r => setTimeout(r, 20));
    expect(screen.getByTestId('summary-Your Voting Power').textContent).toBe('0');
  });

  it('A\'s delegation outcome landing after the switch is not shown to B', async () => {
    const pending = deferred();
    delegateResponse = () => pending.promise;
    setAuthToken(jwtFor(VOTER));
    await renderDashboard();
    const panel = screen.getByTestId('delegate-panel');
    fireEvent.change(within(panel).getByLabelText('Delegate address'), { target: { value: DELEGATE } });
    fireEvent.click(within(panel).getByRole('button', { name: 'Delegate' }));
    await switchTo(OTHER);
    await act(async () => {
      pending.resolve(json(201, { success: true, delegation: { delegator: VOTER, delegate: DELEGATE, amount: '0' } }));
    });
    await new Promise(r => setTimeout(r, 20));
    expect(screen.queryByTestId('delegate-recorded')).toBeNull();
    expect(screen.queryByTestId('delegate-error')).toBeNull();
    const fresh = screen.getByTestId('delegate-panel');
    expect(within(fresh).getByLabelText('Delegate address').value).toBe('');
    expect(within(fresh).getByRole('button', { name: 'Delegate' }).textContent).toBe('Delegate');
  });
});

