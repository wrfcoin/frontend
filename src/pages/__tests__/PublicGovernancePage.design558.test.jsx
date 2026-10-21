/** @jest-environment jsdom */
/**
 * #558: the rebuilt Governance page keeps the three admitted reads, shows the live empty state honestly,
 * declares treasury figures as WRF only when the node declares their units, and pages with the list's
 * own total/hasMore.
 */
import React from 'react';
import { jest } from '@jest/globals';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const { PublicGovernanceListPage, PublicGovernanceProposalPage, VOTE_IN_APP_HREF } = await import('../PublicGovernancePage');

const LIVE_TREASURY = { success: true, data: { balance: '0.00000000', totalDeposits: '0.00000000', totalWithdrawals: '0.00000000', transactionCount: 0,
  amountUnits: { denomination: null, baseUnitDecimals: null, baseUnitsPerUnit: null, available: false, reason: 'treasury_units_not_established', fields: { balance: 'unknown', totalDeposits: 'unknown', totalWithdrawals: 'unknown' } } } };
const LIVE_EMPTY = { success: true, count: 0, total: 0, offset: 0, limit: 20, hasMore: false, proposals: [] };

let calls;
function mockFetch(handler) {
  calls = [];
  global.fetch = jest.fn(async input => {
    const url = new URL(String(input), 'https://test.invalid');
    calls.push(`${url.pathname}${url.search}`);
    const body = handler(url.pathname, url.searchParams);
    return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
  });
}
const mount = () => render(<MemoryRouter initialEntries={['/governance/public']}><Routes><Route path="/governance/public" element={<PublicGovernanceListPage />} /></Routes></MemoryRouter>);
afterEach(() => { cleanup(); jest.restoreAllMocks(); });

it('renders the live state: undeclared treasury units and "No proposals yet", with only the two reads', async () => {
  mockFetch(path => (path === '/api/governance/treasury' ? LIVE_TREASURY : LIVE_EMPTY));
  mount();
  await screen.findByText('No proposals yet');
  await screen.findByText('Balance not declared');
  const treasury = screen.getByTestId('public-treasury');
  expect(treasury).toHaveTextContent('The node has not established the treasury units yet.');
  expect(treasury).not.toHaveTextContent(/0\.00000000 WRF/);
  expect(within(treasury).getAllByText('Not declared').length).toBe(2);
  expect(treasury).toHaveTextContent('Transactions');
  expect(calls.sort()).toEqual(['/api/governance/proposals?limit=20&offset=0', '/api/governance/treasury']);
  expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  expect(screen.getByRole('link', { name: 'Vote in the app' })).toHaveAttribute('href', VOTE_IN_APP_HREF);
});

it('pages with the list\'s total/hasMore and sends only limit=20&offset=N', async () => {
  const page = (offset, n, hasMore) => ({ success: true, count: n, total: 23, offset, limit: 20, hasMore,
    proposals: Array.from({ length: n }, (_, i) => ({ id: `p-${offset + i + 1}`, title: `Proposal ${offset + i + 1}`, status: i === 0 ? 'ACTIVE' : 'PASSED', votesFor: 72, votesAgainst: 21, votesAbstain: 7, proposalType: 'parameter', votingEndTime: '2026-10-25' })) });
  mockFetch((path, params) => (path === '/api/governance/treasury' ? LIVE_TREASURY : Number(params.get('offset')) === 0 ? page(0, 20, true) : page(20, 3, false)));
  mount();
  await screen.findByText('Proposal 1');
  expect(screen.getByText('Showing 1–20 of 23 proposals')).toBeInTheDocument();
  expect(screen.getAllByText('For 72%').length).toBe(20);
  expect(screen.getAllByText('ACTIVE').length).toBeGreaterThan(0);
  expect(screen.getByRole('link', { name: 'Proposal 1' })).toHaveAttribute('href', '/governance/public/p-1');
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  await screen.findByText('Proposal 23');
  expect(screen.getByText('Showing 21–23 of 23 proposals')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  await waitFor(() => expect([...calls].sort()).toEqual(['/api/governance/treasury', '/api/governance/proposals?limit=20&offset=0', '/api/governance/proposals?limit=20&offset=20'].sort()));
  expect(calls.join()).not.toMatch(/page=|vote|delegat/);
});

it('shows declared figures as WRF and leaves vote bars out when votes are not reported', async () => {
  mockFetch(path => (path === '/api/governance/treasury'
    ? { success: true, data: { balance: '125000000000', totalDeposits: '1250.5', totalWithdrawals: '0', transactionCount: 2,
      amountUnits: { denomination: 'WRF', baseUnitDecimals: 8, baseUnitsPerUnit: '100000000', available: true, fields: { balance: 'base_units', totalDeposits: 'display_units', totalWithdrawals: 'unknown' } } } }
    : { success: true, total: 1, hasMore: false, proposals: [{ proposalId: 7, title: 'Only one', status: 'pending' }] }));
  mount();
  await screen.findByText('Balance reported by the node');
  const treasury = screen.getByTestId('public-treasury');
  expect(treasury).toHaveTextContent('1,250.00000000 WRF');
  expect(treasury).toHaveTextContent('1,250.5');
  expect(within(treasury).getAllByText('Not declared').length).toBe(1);
  await screen.findByText('Only one');
  expect(screen.getByRole('link', { name: 'Only one' })).toHaveAttribute('href', '/governance/public/7');
  expect(screen.queryByText(/For \d+%/)).toBeNull();
  expect(screen.getByText('Showing 1–1 of 1 proposals')).toBeInTheDocument();
});

it('the proposal detail renders the voting window as local dates, never raw ISO text', async () => {
  mockFetch(path => (path === '/api/governance/proposals/WIP-12'
    ? { proposal: { id: 'WIP-12', title: 'Raise the share', status: 'ACTIVE', proposer: '0x7d29…0cb2', votingStartTime: '2026-10-14T03:34:10Z', votingEndTime: '2026-10-21T03:34:10.452245Z' } }
    : { proposal: null }));
  render(<MemoryRouter initialEntries={['/governance/public/WIP-12']}><Routes><Route path="/governance/public/:proposalId" element={<PublicGovernanceProposalPage />} /></Routes></MemoryRouter>);
  await screen.findByText('Raise the share');
  const detail = screen.getByTestId('public-governance-proposal');
  expect(detail).toHaveTextContent('Voting starts');
  expect(detail).toHaveTextContent('Voting ends');
  expect(detail.textContent).not.toMatch(/\d{4}-\d{2}-\d{2}T/);
  const times = detail.querySelectorAll('time');
  expect(times).toHaveLength(2);
  expect(times[0]).toHaveAttribute('dateTime', '2026-10-14T03:34:10.000Z');
  expect(times[1]).toHaveAttribute('dateTime', '2026-10-21T03:34:10.452Z');
  // The label is local time, so only its shape is asserted (a year and a clock time, no ISO "T").
  for (const el of times) expect(el.textContent).toMatch(/2026.*\d{1,2}:\d{2}/);
});
