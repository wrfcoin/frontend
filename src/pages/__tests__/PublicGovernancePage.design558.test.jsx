/** @jest-environment jsdom */
/**
 * #558: the rebuilt Governance page reads only the proposal list and one proposal, shows the live empty
 * state honestly, and pages with the list's own total/hasMore.
 */
import React from 'react';
import { jest } from '@jest/globals';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const { PublicGovernanceListPage, PublicGovernanceProposalPage } = await import('../PublicGovernancePage');

const LIVE_EMPTY = { success: true, count: 0, total: 0, offset: 0, limit: 20, hasMore: false, proposals: [] };

let calls;
// Advisory reads answer "feature off, nothing yet" unless a test routes them itself.
const ADVISORY_OFF = { success: true, featureActive: false, total: 0, hasMore: false, proposals: [] };
function mockFetch(handler, { advisory = false } = {}) {
  calls = [];
  global.fetch = jest.fn(async input => {
    const url = new URL(String(input), 'https://test.invalid');
    calls.push(`${url.pathname}${url.search}`);
    const body = !advisory && url.pathname.includes('/advisory/') ? ADVISORY_OFF : handler(url.pathname, url.searchParams);
    return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
  });
}
const mount = () => render(<MemoryRouter initialEntries={['/governance/public']}><Routes><Route path="/governance/public" element={<PublicGovernanceListPage />} /></Routes></MemoryRouter>);
afterEach(() => { cleanup(); jest.restoreAllMocks(); });

it('renders the live state honestly: nothing to submit or vote on, no treasury, one read', async () => {
  mockFetch(() => LIVE_EMPTY);
  mount();
  await screen.findByText('No proposals yet');
  const page = screen.getByTestId('public-governance');
  expect(page).toHaveTextContent('Submitting proposals isn\'t available on testnet yet.');
  expect(page).toHaveTextContent('Submitting proposals and voting aren\'t available on testnet yet.');
  expect(page.textContent).not.toMatch(/submitted from the WRFCoin app|Vote in the app|Get the WRFCoin app|Voting happens/);
  expect(page.textContent).not.toMatch(/treasury/i);
  expect(screen.queryByTestId('public-treasury')).toBeNull();
  expect(screen.queryByRole('link', { name: /vote/i })).toBeNull();
  expect([...calls].sort()).toEqual(['/api/governance/advisory/proposals?limit=20&offset=0', '/api/governance/proposals?limit=20&offset=0']);
  expect(screen.queryByTestId('advisory-proposals')).toBeNull();
  expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
});

it('pages with the list\'s total/hasMore and sends only limit=20&offset=N', async () => {
  const page = (offset, n, hasMore) => ({ success: true, count: n, total: 23, offset, limit: 20, hasMore,
    proposals: Array.from({ length: n }, (_, i) => ({ id: `p-${offset + i + 1}`, title: `Proposal ${offset + i + 1}`, status: i === 0 ? 'ACTIVE' : 'PASSED', votesFor: 72, votesAgainst: 28, votesAbstain: 7, proposalType: 'parameter', votingEndTime: '2026-10-25' })) });
  mockFetch((path, params) => (Number(params.get('offset')) === 0 ? page(0, 20, true) : page(20, 3, false)));
  mount();
  await screen.findByText('Proposal 1');
  expect(screen.getByText('Showing 1–20 of 23 proposals')).toBeInTheDocument();
  expect(screen.getAllByText('For 72%').length).toBe(20);
  expect(screen.queryByText(/Abstain/)).toBeNull();
  expect(screen.getAllByText('ACTIVE').length).toBeGreaterThan(0);
  expect(screen.getByRole('link', { name: 'Proposal 1' })).toHaveAttribute('href', '/governance/public/p-1');
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  await screen.findByText('Proposal 23');
  expect(screen.getByText('Showing 21–23 of 23 proposals')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  await waitFor(() => expect([...calls].filter(c => !c.includes('/advisory/')).sort()).toEqual(['/api/governance/proposals?limit=20&offset=0', '/api/governance/proposals?limit=20&offset=20']));
  expect(calls.join()).not.toMatch(/page=|vote|delegat/);
});

it('leaves vote bars out when votes are not reported', async () => {
  mockFetch(() => ({ success: true, total: 1, hasMore: false, proposals: [{ proposalId: 7, title: 'Only one', status: 'pending' }] }));
  mount();
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

describe('advisory proposals (core4 advisory_governance)', () => {
  const ADVISORY = (featureActive, proposals) => ({ success: true, featureActive, total: proposals.length, hasMore: false, proposals });
  const welcome = {
    id: 'adv-0123456789abcdef', kind: 'advisory', proposer: 'ab'.repeat(20),
    title: 'Welcome to governance', summary: 'The first advisory proposal.\nIt changes nothing.',
    created_at_block: 100, voting_deadline: 1220, status: 'passed', yes_votes: 3, no_votes: 1,
    eligible_count: 12, finalized_at_block: 1220,
  };
  const route = advisory => (path => (path === '/api/governance/advisory/proposals' ? advisory : LIVE_EMPTY));

  it('stays hidden while the chain has not turned the feature on', async () => {
    mockFetch(route(ADVISORY(false, [])), { advisory: true });
    mount();
    await screen.findByText('No proposals yet');
    await waitFor(() => expect(calls.length).toBe(2));
    expect(screen.queryByTestId('advisory-proposals')).toBeNull();
    expect(screen.getByTestId('public-governance')).toHaveTextContent('Submitting proposals and voting aren\'t available on testnet yet.');
  });

  it('shows advisory proposals as plain text, says nothing is executed, counts wallets not people', async () => {
    mockFetch(route(ADVISORY(true, [welcome, { ...welcome, id: 'adv-fedcba9876543210', title: '<b>not html</b>', status: 'active', finalized_at_block: null, yes_votes: 0, no_votes: 0 }])), { advisory: true });
    mount();
    const section = await screen.findByTestId('advisory-proposals');
    expect(section).toHaveTextContent('Welcome to governance');
    expect(section).toHaveTextContent('Passed (advisory)');
    expect(section).toHaveTextContent('For 3 · Against 1');
    expect(section).toHaveTextContent('12 wallets could vote');
    expect(section).toHaveTextContent('decided at block 1220');
    expect(section).toHaveTextContent('voting ends at block 1220');
    expect(section).toHaveTextContent('nothing it says is carried out');
    expect(section).toHaveTextContent('results count wallets');
    expect(section.querySelector('b')).toBeNull();
    expect(section).toHaveTextContent('<b>not html</b>');
    expect(section.textContent).not.toMatch(/\blaw\b/i);
    expect(screen.getByTestId('public-governance')).toHaveTextContent('Wallets can sign advisory text proposals');
    expect(screen.getAllByTestId('advisory-proposal')).toHaveLength(2);
  });

  it('an older node (404) leaves the page exactly as before', async () => {
    calls = [];
    global.fetch = jest.fn(async input => {
      const url = new URL(String(input), 'https://test.invalid');
      calls.push(`${url.pathname}${url.search}`);
      const advisory = url.pathname.includes('/advisory/');
      return new Response(JSON.stringify(advisory ? {} : LIVE_EMPTY), { status: advisory ? 404 : 200, headers: { 'content-type': 'application/json' } });
    });
    mount();
    await screen.findByText('No proposals yet');
    await waitFor(() => expect(calls.length).toBe(2));
    expect(screen.queryByTestId('advisory-proposals')).toBeNull();
  });
});
