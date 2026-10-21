import React from 'react';
import { jest } from '@jest/globals';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { board, header, profile, row, unsupported } from '../../utils/__fixtures__/roleEarningsFixtures';

const state = { leaderboard: 'configured', earnings: 'configured', loading: false, error: null };
await jest.unstable_mockModule('../../hooks/useCapabilities', () => ({ useCapabilities: () => ({
  capabilities: { features: { leaderboard: { status: state.leaderboard }, earningsRead: { status: state.earnings } } },
  loading: state.loading, error: state.error,
}) }));
await jest.unstable_mockModule('../../hooks/useProtocolTransition', () => ({ useProtocolTransition: () => ({ transition: null }) }));
await jest.unstable_mockModule('../../config/features', () => ({ FEATURES: { leaderboard: true, leaderboardRegions: false } }));
await jest.unstable_mockModule('../../contexts/WalletContext.jsx', () => ({ useOptionalWallet: () => null }));
await jest.unstable_mockModule('../../hooks/useWalletConnection', () => ({ useWalletConnection: () => ({ account: null }) }));
await jest.unstable_mockModule('react-router-dom', () => ({
  Link: ({ to, children, ...rest }) => <a href={to} {...rest}>{children}</a>,
  useParams: () => ({ address: row().profileKey }),
}));
await jest.unstable_mockModule('../../utils/earnShareCard', () => ({ downloadOrShareEarnCard: jest.fn() }));
const { CapabilitiesProvider } = await import('../../contexts/CapabilitiesContext');
const { default: Page } = await import('../ContributorLeaderboardPage');
const { default: Recap } = await import('../WeatherRecapPage');
const { default: GlobalLeaderboard } = await import('../../components/Leaderboard/GlobalLeaderboard');
const { earningsQuery, EARNING_ROLES, EARNING_PERIODS } = await import('../../utils/roleEarnings');
const response = (body, status = 200) => ({ ok: status === 200, status, json: async () => body });
const legacy = () => response({ entries: [], updatedAt: '2026-10-11T12:01:00Z' });
const serve = handler => { global.fetch = jest.fn((url, options) => String(url).startsWith('/api/earnings/') ? handler(String(url), options) : Promise.resolve(legacy())); };
const mount = component => render(<CapabilitiesProvider>{component ?? <Page />}</CapabilitiesProvider>);
const roleSection = () => screen.getByRole('region', { name: 'Payments by role' });
const selectRole = name => fireEvent.click(within(roleSection()).getByRole('tab', { name }));
beforeEach(() => {
  Object.assign(state, { leaderboard: 'configured', earnings: 'configured', loading: false, error: null });
  globalThis.__VITE_ENV__ = { VITE_PUBLIC_READONLY_PATHS: 'true' };
  serve(async () => response(board()));
});
afterEach(() => { cleanup(); jest.restoreAllMocks(); });

test('mounted public page fetches exact B2 grammar and lossless amounts, profile links use the opaque key only', async () => {
  serve(async () => response(board('producer', 'all', { rows: [row({ displayName: 'N5 node' }), row({ rank: 2, profileKey: 'c_abcdef0123456789abcdef01', displayName: 'Operator-abcdef01', paidBaseUnits: '1', paidDisplay: '0.00000001' })] })));
  const view = mount();
  expect(await within(roleSection()).findByText('N5 node')).toBeTruthy();
  expect(within(roleSection()).getByText('90,071,992.54740993 WRF')).toBeTruthy();
  expect(within(roleSection()).getByText('0.00000001 WRF')).toBeTruthy();
  expect(global.fetch.mock.calls.filter(([url]) => String(url).startsWith('/api/earnings/')).map(([url]) => url))
    .toEqual(['/api/earnings/leaderboard?role=producer&period=all&limit=30']);
  expect(within(roleSection()).getAllByRole('tab')).toHaveLength(8);
  // S6: public profile links go to /contributor/<c_ key>; never /impact, never an address.
  expect([...roleSection().querySelectorAll('a')].map(a => a.getAttribute('href'))).toEqual([
    '/contributor/c_0123456789abcdef01234567',
    '/contributor/c_abcdef0123456789abcdef01',
  ]);
  expect(view.container.innerHTML).not.toMatch(/0x[0-9a-f]{40}/i);
});

test('all role/period/limit queries match ordered admitted grammar, no extra filters', () => {
  for (const { key: role } of EARNING_ROLES) for (const { key: period } of EARNING_PERIODS) for (const limit of [1, 30]) {
    const query = earningsQuery(role, period, limit);
    expect(query).toBe(`/api/earnings/leaderboard?role=${role}&period=${period}&limit=${limit}`);
    expect(query).toMatch(/^\/api\/earnings\/leaderboard\?role=(contribution|attester|producer|node|forecast)&period=(all|7d|30d)&limit=([1-9]|[12][0-9]|30)$/);
  }
  expect(() => earningsQuery('faucet', 'all')).toThrow();
  expect(() => earningsQuery('producer', '24h')).toThrow();
  expect(() => earningsQuery('producer', 'all', 31)).toThrow();
});

test.each(['N5 node', 'Mango', 'Workstation', 'Operator-01234567'])('displays backend label %s', async label => {
  serve(async () => response(board('producer', 'all', { rows: [row({ displayName: label })] })));
  mount(); expect(await within(roleSection()).findByText(label)).toBeTruthy();
});

test('unapproved label remains neutral; no hostname, badge or wallet inference', async () => {
  serve(async () => response(board('producer', 'all', { rows: [row({ displayName: 'arbitrary-private-host' })] })));
  mount(); expect(await within(roleSection()).findByText('Unknown operator')).toBeTruthy();
  expect(roleSection().textContent).not.toMatch(/arbitrary-private-host|Mango|Workstation/);
});

test('operator preview permits only the opaque profile key link', async () => {
  globalThis.__VITE_ENV__ = { VITE_ENABLE_FULL_STUDIO: 'true' };
  mount();
  expect(await within(roleSection()).findByRole('link', { name: 'Operator-01234567' })).toHaveAttribute('href', `/impact/${row().profileKey}`);
});

test.each(['unavailable', 'reachable', 'simulated', undefined])('earnings capability %s hides role tabs and prevents new fetch', async status => {
  state.earnings = status; mount();
  await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  expect(screen.queryByRole('region', { name: 'Payments by role' })).toBeNull();
  expect(global.fetch.mock.calls.some(([url]) => String(url).startsWith('/api/earnings/'))).toBe(false);
});

test.each(['operational', 'degraded', 'configured'])('accepts read-ready earnings capability %s', async status => {
  state.earnings = status; mount(); expect(await within(roleSection()).findByText('90,071,992.54740993 WRF')).toBeTruthy();
});

test.each(['leaderboard-off', 'loading', 'poll-error'])('existing leaderboardRead remains required: %s', async mode => {
  if (mode === 'leaderboard-off') state.leaderboard = 'unavailable';
  if (mode === 'loading') state.loading = true;
  if (mode === 'poll-error') state.error = new Error('capability failed');
  mount(); await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  expect(screen.queryByRole('region', { name: 'Payments by role' })).toBeNull();
  expect(global.fetch.mock.calls.some(([url]) => String(url).startsWith('/api/earnings/'))).toBe(false);
});

test('unsupported nodes show exact notice and no ranking/zero payment', async () => {
  serve(async url => response(url.includes('role=node') ? unsupported() : board()));
  mount(); await within(roleSection()).findByText('90,071,992.54740993 WRF'); selectRole('Nodes');
  expect(await within(roleSection()).findByText('Node payments are not implemented yet')).toBeTruthy();
  expect(within(roleSection()).queryByRole('table')).toBeNull();
  expect(roleSection().textContent).not.toContain('0 WRF');
});

test('forecast is unavailable under merged B2; only complete zero-observed coverage can claim empty payments', async () => {
  let proven = false;
  serve(async url => response(url.includes('role=forecast') ? board('forecast', 'all', proven ? { rows: [] } : { status: 'unavailable', complete: false, effectiveScope: null, coverage: null, asOf: null, finalityPolicy: null, rows: [], paidBaseUnits: null }) : board()));
  mount(); await within(roleSection()).findByText('90,071,992.54740993 WRF'); selectRole('Forecasting');
  await within(roleSection()).findByRole('button', { name: 'Retry role payments' });
  expect(within(roleSection()).queryByText('No forecast payments observed')).toBeNull();
  proven = true; fireEvent.click(within(roleSection()).getByRole('button', { name: 'Retry role payments' }));
  expect(await within(roleSection()).findByText('No forecast payments observed')).toBeTruthy();
});

test.each(['incomplete', 'bad-row', 'scope', 'units', 'mismatched-display', 'http-503'])('no partial ranking on %s; Retry restores complete response', async failure => {
  let ready = false;
  serve(async () => {
    if (ready) return response(board());
    const data = board();
    if (failure === 'incomplete') data.coverage.complete = false;
    if (failure === 'bad-row') data.rows.push(row({ rank: 2, paidBaseUnits: null }));
    if (failure === 'scope') data.effectiveScope = '7d';
    if (failure === 'units') data.units.scale = '1000';
    if (failure === 'mismatched-display') data.rows[0].paidDisplay = '1.00000000';
    return response(data, failure === 'http-503' ? 503 : 200);
  });
  mount(); await within(roleSection()).findByRole('button', { name: 'Retry role payments' });
  expect(within(roleSection()).queryByRole('table')).toBeNull();
  expect(within(roleSection()).queryByText('90,071,992.54740993 WRF')).toBeNull();
  ready = true; fireEvent.click(within(roleSection()).getByRole('button', { name: 'Retry role payments' }));
  expect(await within(roleSection()).findByText('90,071,992.54740993 WRF')).toBeTruthy();
});

test.each(['role', 'period'])('%s switch ignores stale fetch even if transport ignores AbortSignal', async mode => {
  let resolveOld; let oldSignal;
  serve((url, options) => {
    if (url === earningsQuery('producer', 'all')) { oldSignal = options.signal; return new Promise(resolve => { resolveOld = resolve; }); }
    return Promise.resolve(response(mode === 'role' ? board('attester', 'all', { rows: [row({ displayName: 'Mango' })] }) : board('producer', '7d', { rows: [row({ displayName: 'Workstation' })] })));
  });
  mount(); await waitFor(() => expect(resolveOld).toBeDefined());
  if (mode === 'role') selectRole('Oracles & attesters');
  else fireEvent.click(within(roleSection()).getByRole('tab', { name: '7 days' }));
  const newName = mode === 'role' ? 'Mango' : 'Workstation';
  expect(await within(roleSection()).findByText(newName)).toBeTruthy();
  expect(oldSignal.aborted).toBe(true);
  await act(async () => { resolveOld(response(board('producer', 'all', { rows: [row({ displayName: 'N5 node' })] }))); });
  expect(within(roleSection()).queryByText('N5 node')).toBeNull();
  expect(within(roleSection()).getByText(newName)).toBeTruthy();
});

test('capability OFF unmounts role rows and aborts outstanding request', async () => {
  let signal; serve((_url, options) => { signal = options.signal; return new Promise(() => {}); });
  const view = mount(); await waitFor(() => expect(signal).toBeDefined());
  state.earnings = 'unavailable'; view.rerender(<CapabilitiesProvider><Page /></CapabilitiesProvider>);
  expect(screen.queryByRole('region', { name: 'Payments by role' })).toBeNull(); expect(signal.aborted).toBe(true);
});

test('mounted chain-only WeatherRecap fetches public role totals without private legacy amount or made-up weather stats', async () => {
  global.fetch = jest.fn(async () => response({ success: true, profile: profile() }));
  mount(<Recap />);
  const section = await screen.findByRole('region', { name: 'Role payment totals' });
  expect(global.fetch.mock.calls[0][0]).toBe(`/api/operators/${row().profileKey}/profile`);
  expect(within(section).getByText('90,071,992.54740993 WRF', { exact: false })).toBeTruthy();
  expect(within(section).getByText('0 WRF')).toBeTruthy();
  expect(within(section).getByText('Node payments are not implemented yet')).toBeTruthy();
  expect(within(section).getAllByText('Payments unavailable')).toHaveLength(2);
  expect(screen.queryByText('Readings submitted')).toBeNull();
  expect(screen.queryByText('WRF earned')).toBeNull();
  expect(screen.queryByText('Download / share PNG')).toBeNull();
  expect(screen.queryByText('No forecast payments observed')).toBeNull();
});

test('null or incomplete profile totals stay withheld; legacy DB values cannot fill them', async () => {
  const data = profile({ weatherStatisticsAvailable: true, totalSubmissions: 1, stationCount: 1, currentStreak: 1, longestStreak: 1, qualityScore: 90, totalRewardsEarned: null });
  data.roleEarnings.roles.producer.paidBaseUnits = null;
  data.roleEarnings.roles.attester.coverage = { ...header().coverage, complete: false };
  global.fetch = jest.fn(async () => response({ success: true, profile: data }));
  mount(<Recap />);
  const section = await screen.findByRole('region', { name: 'Role payment totals' });
  expect(within(section).getAllByText('Payments unavailable')).toHaveLength(4);
  expect(within(section).queryByText('0 WRF')).toBeNull(); expect(screen.queryByText('WRF earned')).toBeNull();
});

test('role totals hidden when capability is OFF, including cached role payload', async () => {
  state.earnings = 'unavailable'; global.fetch = jest.fn(async () => response({ success: true, profile: profile() }));
  mount(<Recap />); await screen.findByText('Weather statistics are unavailable for this operator.');
  expect(screen.queryByRole('region', { name: 'Role payment totals' })).toBeNull();
});

test('internal GlobalLeaderboard reads the same role contract even when its legacy weather read fails', async () => {
  global.fetch = jest.fn(async url => String(url).startsWith('/api/earnings/') ? response(board()) :
    new Response(JSON.stringify({ error: 'unavailable' }), { status: 503, headers: { 'content-type': 'application/json' } }));
  mount(<GlobalLeaderboard />);
  expect(await within(roleSection()).findByText('90,071,992.54740993 WRF')).toBeTruthy();
  expect(global.fetch.mock.calls.some(([url]) => url === earningsQuery('producer', 'all'))).toBe(true);
});
