/** @jest-environment jsdom */
/**
 * frontend#356 — the real /governance/delegation, /governance/analytics,
 * /governance/quadratic and /governance/conviction pages. Figures come from
 * mounted routes; nothing fabricated renders by default; failures show as
 * failures. Only fetch and feature flags are faked.
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

const { default: DelegationManager } = await import('../DelegationManager');
const { default: ProposalAnalytics } = await import('../ProposalAnalytics');
const { default: QuadraticVotingPanel } = await import('../QuadraticVotingPanel');
const { default: ConvictionVotingPanel } = await import('../ConvictionVotingPanel');
const { setAuthToken, clearAuthToken } = await import('../../../services/authTokenStore');

const ME = '0x1111111111111111111111111111111111111111';
const OTHER = '0x2222222222222222222222222222222222222222';
const FORMER_CONSTANTS = [
  'ClimateDAO', 'WeatherNode', 'DataValidator', 'StormTracker', 'SensorNet42', 'CarbonDAO',
  'TechDev', 'GrantsLead', 'WeatherNerd', 'Gini', '25,000', '8,500', '3,200',
];

function jwtFor(sub) {
  const b64 = value => btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub })}.sig`;
}
const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

let requests;
let routes;

beforeEach(() => {
  requests = [];
  routes = {
    '/api/governance/voting-power': () =>
      json(200, { success: true, data: { address: ME, delegatedPower: 40, participationBonus: 10, totalPower: 50 } }),
    [`/api/governance/delegations/delegator/${ME}`]: () => json(200, { success: true, count: 0, delegations: [] }),
    '/api/governance/analytics/delegates': () =>
      json(200, { success: true, count: 1, delegates: [{ address: OTHER, totalDelegated: '12.00000000', delegatorCount: 2 }] }),
    '/api/governance/delegate': () =>
      json(201, { success: true, delegation: { delegator: ME, delegate: OTHER, amount: '5' } }),
    '/api/governance/analytics/dashboard': () =>
      json(200, { success: true, data: { totalProposals: 7, totalVotes: 19, activeProposals: 2, recentProposals: [] } }),
    '/api/governance/analytics/participation': () =>
      json(200, { success: true, data: { totalProposals: 7, totalVotes: 19, uniqueVoters: 5, avgVotesPerProposal: '2.71' } }),
    '/api/governance/analytics/treasury': () =>
      json(200, { success: true, data: { balance: '100.00000000', totalInflow: '150.00000000', totalOutflow: '50.00000000', transactionCount: 4 } }),
  };
  global.fetch = jest.fn(async (input, init = {}) => {
    const url = new URL(String(input), 'https://test.invalid');
    const headers = new Headers(init.headers);
    requests.push({ method: init.method ?? 'GET', path: url.pathname, auth: headers.get('authorization'), body: init.body ? JSON.parse(init.body) : undefined });
    const handler = routes[url.pathname];
    return handler ? handler() : json(404, { success: false, error: 'not mounted' });
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

async function renderPage(element) {
  await act(async () => {
    render(<MemoryRouter>{element}</MemoryRouter>);
  });
}

const bodyText = () => document.body.textContent ?? '';

describe('DelegationManager', () => {
  it('signed out: no invented power or delegates, and nothing can be submitted', async () => {
    await renderPage(<DelegationManager />);
    expect(screen.getByTestId('delegation-sign-in')).not.toBeNull();
    await screen.findByText(OTHER);
    for (const literal of FORMER_CONSTANTS) expect(bodyText()).not.toContain(literal);
    expect(screen.getByRole('button', { name: 'Delegate' }).disabled).toBe(true);
    expect(screen.queryByRole('button', { name: /Revoke/ })).toBeNull();
  });

  it('signed in: real power, honest empty state, and one authenticated POST', async () => {
    setAuthToken(jwtFor(ME));
    await renderPage(<DelegationManager />);
    await waitFor(() => expect(screen.getByTestId('delegation-Total voting power').textContent).toBe('50'));
    expect(screen.getByTestId('delegation-empty').textContent).toBe('No delegations yet.');
    fireEvent.change(screen.getByLabelText('Delegate address'), { target: { value: OTHER } });
    fireEvent.change(screen.getByLabelText('Amount (optional)'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Delegate' }));
    await screen.findByTestId('delegation-recorded');
    const sent = requests.filter(r => r.method === 'POST' && r.path === '/api/governance/delegate');
    expect(sent).toHaveLength(1);
    expect(sent[0].auth).toBe(`Bearer ${jwtFor(ME)}`);
    expect(sent[0].body).toEqual({ delegate: OTHER, amount: 5 });
  });

  it('refuses self-delegation before any request', async () => {
    setAuthToken(jwtFor(ME));
    await renderPage(<DelegationManager />);
    fireEvent.change(screen.getByLabelText('Delegate address'), { target: { value: ME } });
    expect(screen.getByTestId('delegation-disabled-reason').textContent).toMatch(/cannot delegate to yourself/);
    expect(screen.getByRole('button', { name: 'Delegate' }).disabled).toBe(true);
  });

  it('voting-power 503 and delegation 401 are shown as failures', async () => {
    routes['/api/governance/voting-power'] = () => json(503, { success: false, error: 'db down' });
    routes['/api/governance/delegate'] = () => json(401, { success: false, error: 'Authentication required' });
    setAuthToken(jwtFor(ME));
    await renderPage(<DelegationManager />);
    await screen.findByText(/Voting power unavailable/);
    fireEvent.change(screen.getByLabelText('Delegate address'), { target: { value: OTHER } });
    fireEvent.click(screen.getByRole('button', { name: 'Delegate' }));
    expect((await screen.findByTestId('delegation-error')).textContent).toMatch(/Delegation not recorded/);
  });
});

// Codex round 15 on #391: DelegationManager binds power, delegations and the
// delegation outcome to the session that started them.
describe('DelegationManager across an account switch', () => {
  const B = '0x3333333333333333333333333333333333333333';
  function deferred() {
    let resolve;
    const promise = new Promise(r => { resolve = r; });
    return { promise, resolve };
  }

  it('B\'s power is not overwritten by A\'s slower response', async () => {
    const slowA = deferred();
    const base = routes['/api/governance/voting-power'];
    routes['/api/governance/voting-power'] = () => {
      const last = requests[requests.length - 1];
      return last.auth === `Bearer ${jwtFor(ME)}` ? slowA.promise : base();
    };
    routes[`/api/governance/delegations/delegator/${B}`] = () => json(200, { success: true, count: 0, delegations: [] });
    setAuthToken(jwtFor(ME));
    await renderPage(<DelegationManager />);
    routes['/api/governance/voting-power'] = () =>
      json(200, { success: true, data: { address: B, delegatedPower: 0, participationBonus: 0, totalPower: 0 } });
    await act(async () => { setAuthToken(jwtFor(B)); });
    await waitFor(() => expect(screen.getByTestId('delegation-Total voting power').textContent).toBe('0'));
    await act(async () => {
      slowA.resolve(json(200, { success: true, data: { address: ME, delegatedPower: 40, participationBonus: 10, totalPower: 50 } }));
    });
    await new Promise(r => setTimeout(r, 20));
    expect(screen.getByTestId('delegation-Total voting power').textContent).toBe('0');
  });

  it('A\'s delegation outcome landing after the switch is not shown to B, and the form is reset', async () => {
    const pending = deferred();
    routes['/api/governance/delegate'] = () => pending.promise;
    routes[`/api/governance/delegations/delegator/${B}`] = () => json(200, { success: true, count: 0, delegations: [] });
    setAuthToken(jwtFor(ME));
    await renderPage(<DelegationManager />);
    fireEvent.change(screen.getByLabelText('Delegate address'), { target: { value: OTHER } });
    fireEvent.click(screen.getByRole('button', { name: 'Delegate' }));
    await act(async () => { setAuthToken(jwtFor(B)); });
    expect(screen.getByLabelText('Delegate address').value).toBe('');
    await act(async () => {
      pending.resolve(json(201, { success: true, delegation: { delegator: ME, delegate: OTHER, amount: '0' } }));
    });
    await new Promise(r => setTimeout(r, 20));
    expect(screen.queryByTestId('delegation-recorded')).toBeNull();
    expect(screen.queryByTestId('delegation-error')).toBeNull();
    expect(screen.getByRole('button', { name: 'Delegate' }).textContent).toBe('Delegate');
  });
});

describe('ProposalAnalytics', () => {
  it('renders only served figures and none of the former constants', async () => {
    await renderPage(<ProposalAnalytics />);
    await waitFor(() => expect(screen.getByTestId('analytics-total-proposals').textContent).toBe('7'));
    expect(screen.getByTestId('analytics-total-votes').textContent).toBe('19');
    expect(screen.getByTestId('analytics-unique-voters').textContent).toBe('5');
    expect(screen.getByTestId('analytics-treasury-balance').textContent).toBe('100.00000000');
    expect(await screen.findByText(OTHER)).not.toBeNull();
    for (const literal of FORMER_CONSTANTS) expect(bodyText()).not.toContain(literal);
  });

  it('a failing route fails its own section only', async () => {
    routes['/api/governance/analytics/treasury'] = () => json(503, { success: false, error: 'db down' });
    await renderPage(<ProposalAnalytics />);
    expect((await screen.findByTestId('analytics-treasury-error')).textContent).toMatch(/Unavailable/);
    await waitFor(() => expect(screen.getByTestId('analytics-total-proposals').textContent).toBe('7'));
  });
});

describe('Quadratic and conviction voting', () => {
  it.each([
    ['governance-quadratic', () => <QuadraticVotingPanel />],
    ['governance-conviction', () => <ConvictionVotingPanel />],
  ])('%s default build: not-live, no sample, no unmounted-route reads', async (testId, make) => {
    await renderPage(make());
    expect(screen.getByTestId(`${testId}-not-live`)).not.toBeNull();
    expect(bodyText()).not.toContain('Quantum-Resistant Wallet Integration');
    expect(requests.filter(r => /quadratic|conviction/.test(r.path))).toHaveLength(0);
  });

  it('demo build: conviction sample stake/unstake cannot act', async () => {
    featureFlags.demoSurfaces = true;
    routes['/api/governance/conviction-proposals'] = () => json(200, [{
      id: 'CV-1', title: 'Sample proposal', status: 'active', requestedFunding: 1000,
      currentConviction: 10, threshold: 100, yourStake: 5,
      convictionHistory: [{ day: 0, value: 0 }, { day: 1, value: 10 }],
    }]);
    await renderPage(<ConvictionVotingPanel />);
    const sample = screen.getByTestId('governance-conviction-sample');
    const buttons = await within(sample).findAllByRole('button', { name: /Stake|Unstake/ });
    expect(buttons.length).toBeGreaterThanOrEqual(2);
    for (const button of buttons) expect(button.disabled).toBe(true);
  });
});
