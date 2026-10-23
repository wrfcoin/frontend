/** @jest-environment jsdom */
/**
 * Self-serve bond grant spec section 4: the public audit list. The page renders exactly what
 * GET /api/faucet/bond-grants returns (owner wallet, peer id, time, bonded, grant tx), shortens ids with a
 * copy button for the full value, reads `bonded: null` as "Not yet available" (never "No"), and has honest
 * empty, not-on-this-network (404/503), error and rate-limit states.
 */
import React from 'react';
import { jest } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { textPrimary, textPrimaryLight, bgSecondary, bgSecondaryLight } from '../../theme/tokens';

const calls = [];
let answer = () => ({ status: 200, body: { grants: [] } });
let explorerBase = null;
let isDark = true;

const actualNetwork = await import('../../config/network');
await jest.unstable_mockModule('../../config/network', () => ({
  ...actualNetwork,
  explorerTxUrl: hash => (explorerBase && hash ? `${explorerBase}/tx/${hash}` : null),
}));
const actualTheme = await import('../../theme/ThemeProvider');
await jest.unstable_mockModule('../../theme/ThemeProvider', () => ({ ...actualTheme, useIsDarkTheme: () => isDark }));

beforeEach(() => {
  calls.length = 0;
  explorerBase = null;
  isDark = true;
  globalThis.fetch = jest.fn(async url => {
    calls.push(String(url));
    const { status, body, headers = {} } = answer(String(url));
    return { ok: status >= 200 && status < 300, status, headers: { get: name => headers[name] ?? null }, json: async () => body };
  });
});
afterEach(cleanup);

const { default: Page } = await import('../PublicBondGrantsPage');
const mount = () => render(<MemoryRouter><Page /></MemoryRouter>);

const OWNER = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa01';
const PEER = '12D3KooWQYhTNQdmr3ArTeUHRYzFg94BKyTkoWBDWez9kSCVe2Xo';
const TX = 'ab'.repeat(32);
const grant = over => ({ ownerAddress: OWNER, peerId: PEER, serverKey: 'cd'.repeat(32), txHash: TX, time: '2026-10-23T05:00:00.000Z', bonded: null, ...over });

test('requests the audit list once and renders one row per grant with shortened ids', async () => {
  answer = () => ({ status: 200, body: { grants: [grant(), grant({ ownerAddress: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb02', bonded: true }), grant({ bonded: false })] } });
  mount();
  await waitFor(() => expect(screen.getAllByTestId('bond-grant-row')).toHaveLength(3));
  expect(calls).toHaveLength(1);
  expect(calls[0].endsWith('/faucet/bond-grants')).toBe(true);
  expect(screen.getByText('3 shown')).toBeInTheDocument();
  const [first, second, third] = screen.getAllByTestId('bond-grant-row');
  expect(within(first).getByText('0xaaaa…aa01')).toBeInTheDocument();
  expect(within(first).getByRole('button', { name: `Copy owner wallet ${OWNER}` })).toBeInTheDocument();
  expect(within(first).getByText('12D3KooW…CVe2Xo')).toBeInTheDocument();
  // Desktop peer column and the stacked phone line both offer Copy (CSS shows one of them per width).
  expect(within(first).getAllByRole('button', { name: `Copy peer id ${PEER}` })).toHaveLength(2);
  expect(within(first).getByText('12D3Ko…e2Xo')).toBeInTheDocument();
  // bonded: null is the faucet saying it cannot tell yet: never "No".
  expect(within(first).getByText('Not yet available')).toBeInTheDocument();
  expect(within(first).queryByText('No')).toBeNull();
  expect(within(second).getByText('Yes')).toBeInTheDocument();
  expect(within(third).getByText('No')).toBeInTheDocument();
  // The server key is in the list but is not a column on this page.
  expect(document.body.textContent).not.toContain('cd'.repeat(32));
});

test('the grant transaction links to the configured explorer, else shows the hash with a copy button', async () => {
  answer = () => ({ status: 200, body: { grants: [grant()] } });
  explorerBase = 'https://explorer.example';
  mount();
  // Desktop cell and phone line (CSS shows one of them per width).
  const links = await screen.findAllByRole('link', { name: 'abababab…ababab' });
  expect(links).toHaveLength(2);
  for (const link of links) {
    expect(link).toHaveAttribute('href', `https://explorer.example/tx/${TX}`);
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  }
  cleanup();
  explorerBase = null;
  mount();
  await waitFor(() => expect(screen.getAllByRole('button', { name: `Copy transaction hash ${TX}` })).toHaveLength(2));
  expect(screen.queryByRole('link', { name: 'abababab…ababab' })).toBeNull();
});

test('malformed fields render a dash instead of being shown or linked', async () => {
  answer = () => ({ status: 200, body: { grants: [grant({ ownerAddress: '<b>x</b>', peerId: '0OIl', txHash: 'javascript:alert(1)', time: 'not a time', bonded: 'yes' })] } });
  explorerBase = 'https://explorer.example';
  mount();
  const row = await screen.findByTestId('bond-grant-row');
  expect(within(row).getAllByText('—').length).toBeGreaterThanOrEqual(3);
  expect(row.querySelector('a')).toBeNull();
  expect(within(row).queryByRole('button')).toBeNull();
  expect(row.textContent).not.toContain('javascript');
  expect(within(row).getByText('Not yet available')).toBeInTheDocument();
});

test('an empty list is the honest empty state, not a table of zeros', async () => {
  answer = () => ({ status: 200, body: { grants: [] } });
  mount();
  await waitFor(() => expect(screen.getByText('No grants yet')).toBeInTheDocument());
  expect(screen.queryByRole('table')).toBeNull();
  expect(screen.getByText('0 shown')).toBeInTheDocument();
});

test.each([[503], [404]])('a %s says the history is not available on this network yet', async status => {
  answer = () => ({ status, body: { error: { code: 'BOND_GRANTS_UNAVAILABLE' } } });
  mount();
  await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/not available on this network yet/));
  expect(screen.queryByRole('table')).toBeNull();
});

test('other failures offer Retry; a 429 says to wait; a body without grants is an error, not empty', async () => {
  answer = () => ({ status: 500, body: {} });
  mount();
  await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/unavailable right now/));
  answer = () => ({ status: 200, body: { grants: [grant()] } });
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  await waitFor(() => expect(screen.getAllByTestId('bond-grant-row')).toHaveLength(1));
  cleanup();
  answer = () => ({ status: 429, body: {}, headers: { 'Retry-After': '30' } });
  mount();
  await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/Too many requests/));
  cleanup();
  answer = () => ({ status: 200, body: { rows: [] } });
  mount();
  await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  expect(screen.queryByText('No grants yet')).toBeNull();
});

test('hands the CSS the light token set in light mode and the dark set otherwise', async () => {
  isDark = false;
  mount();
  let main = screen.getByTestId('public-bond-grants');
  expect(main.style.getPropertyValue('--bga-text')).toBe(textPrimaryLight);
  expect(main.style.getPropertyValue('--bga-bg-secondary')).toBe(bgSecondaryLight);
  cleanup();
  isDark = true;
  mount();
  main = screen.getByTestId('public-bond-grants');
  expect(main.style.getPropertyValue('--bga-text')).toBe(textPrimary);
  expect(main.style.getPropertyValue('--bga-bg-secondary')).toBe(bgSecondary);
});
