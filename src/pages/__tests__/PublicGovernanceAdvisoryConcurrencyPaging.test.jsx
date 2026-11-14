/** @jest-environment jsdom */
/**
 * F3/F4 (review 2026-11-14): on the advisory card only one propose/vote runs at a time (a second action
 * can't take over the 12-word password prompt and strand the first), the prompt names the proposal, and
 * advisory proposals past the first 20 can be paged to. Only the network and the vault unlock are faked.
 */
import React from 'react';
import { jest } from '@jest/globals';
import { cleanup, configure, fireEvent, render, screen, waitFor } from '@testing-library/react';

// Several fetch + render rounds per test: a full parallel jest run can exceed the 1 s default wait.
configure({ asyncUtilTimeout: 5000 });
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ed25519 } from '@noble/curves/ed25519.js';

// Object.assign, not `globalThis.__VITE_ENV__ = …`: in a JS file a top-level property assignment on
// globalThis declares a global with this literal's narrow type for the whole tests type-check.
Object.assign(globalThis, { __VITE_ENV__: { VITE_WRFCOIN_CHAIN_ID: '888', VITE_ENABLE_ADVISORY_VOTING: 'true' } });

const passkeyMod = await import('../../services/walletCrypto/passkey');
const { passkeyRecordAddress, bytesToHex, base64urlNoPad } = { ...passkeyMod, base64urlNoPad: b => Buffer.from(b).toString('base64url') };

const RECORD = { credentialId: new Uint8Array([1, 2, 3]), publicKeyXY: new Uint8Array(64).fill(7), rpId: 'wrfcoin.com' };
const PASSKEY_ADDR = passkeyRecordAddress(RECORD).toLowerCase();
const SEED = new Uint8Array(32).fill(0x42);
const ED_PUB = ed25519.getPublicKey(SEED);
const PHRASE_ADDR = '0xa307fb31c7585b6ccb5dc3ddc844e22b14b7aa0d'; // the vector account of seed 0x42

const saved = { passkey: PASSKEY_ADDR, phrase: PHRASE_ADDR };
jest.unstable_mockModule('../../components/wallet/WalletSwitcher', () => ({
  readSavedWallets: () => ({ ...saved }),
  shortAddress: a => `${a.slice(0, 6)}…${a.slice(-4)}`,
  PASSKEY_WALLET_PATH: '/wallet/passkey',
  PHRASE_WALLET_PATH: '/wallet',
  default: () => null,
}));
jest.unstable_mockModule('../../services/walletCrypto/passkeySend', () => ({ loadStoredPasskey: () => RECORD }));
const passwords = [];
jest.unstable_mockModule('../../services/walletCrypto/deviceSession', () => ({
  withOwnerKey: async (owner, password, run) => {
    passwords.push(password);
    if (password !== 'right') throw new Error('bad password');
    return run({ publicKey: ED_PUB, sign: m => ed25519.sign(m, SEED), address: owner });
  },
}));

const { PublicGovernanceListPage } = await import('../PublicGovernancePage');
const { ANOTHER_ACTION_RUNNING } = await import('../../components/governance/AdvisoryActions');

const proposal = (n, extra = {}) => ({
  id: `adv-${String(n).padStart(16, '0')}`, kind: 'advisory', proposer: '0x' + 'ab'.repeat(20), title: `Fake proposal ${n}`,
  summary: 'Text.', created_at_block: 100, voting_deadline: 1220, status: 'active', yes_votes: 0, no_votes: 0, eligible_count: 3, ...extra,
});

let calls;
let posted;
let all;
let failOffsets;
function mockFetch(proposals) {
  calls = []; posted = []; all = proposals; failOffsets = new Set();
  global.fetch = jest.fn(async (input, init = {}) => {
    const url = new URL(String(input), 'https://test.invalid');
    const method = (init.method || 'GET').toUpperCase();
    calls.push(`${method} ${url.pathname}${url.search}`);
    let body;
    if (url.pathname === '/api/governance/advisory/proposals') {
      const limit = Number(url.searchParams.get('limit'));
      const offset = Number(url.searchParams.get('offset'));
      if (failOffsets.has(offset)) return new Response('{}', { status: 503, headers: { 'content-type': 'application/json' } });
      const page = all.slice(offset, offset + limit);
      body = { success: true, featureActive: true, total: all.length, hasMore: offset + page.length < all.length, proposals: page };
    } else if (url.pathname.endsWith('/nonce')) body = { success: true, nonce: 3 };
    else if (url.pathname.endsWith('/eligibility')) body = { success: true, canVote: true, eligible: true, votingOpen: true, voted: null, reason: null, nextNonce: 5 };
    else if (url.pathname === '/api/governance/advisory/actions') {
      posted.push(JSON.parse(init.body));
      return new Response(JSON.stringify({ success: true, txId: 'ff'.repeat(32), status: 'submitted' }), { status: 202, headers: { 'content-type': 'application/json' } });
    } else body = { success: true, count: 0, total: 0, offset: 0, limit: 20, hasMore: false, proposals: [] };
    return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
  });
}

const mount = () => render(
  <MemoryRouter initialEntries={['/governance/public']}>
    <Routes><Route path="/governance/public" element={<PublicGovernanceListPage credentials={{ get: jest.fn() }} />} /></Routes>
  </MemoryRouter>,
);
afterEach(() => { cleanup(); jest.restoreAllMocks(); passwords.length = 0; });

describe('F3: one advisory action at a time', () => {
  it('while vote A waits for the password, every other action is off; the prompt names A; cancel frees them', async () => {
    mockFetch([proposal(1), proposal(2)]);
    mount();
    fireEvent.click(await screen.findByTestId('advisory-signer-phrase'));
    const fors = screen.getAllByTestId('advisory-vote-for');
    fireEvent.click(fors[0]);
    const prompt = await screen.findByTestId('advisory-password');
    expect(prompt).toHaveTextContent('Sign your vote for “Fake proposal 1”');
    // Proposal B's buttons, the wallet choice and the propose form can't start a second action.
    expect(screen.getAllByTestId('advisory-vote-for')[1]).toBeDisabled();
    expect(screen.getAllByTestId('advisory-vote-against')[1]).toBeDisabled();
    expect(screen.getByTestId('advisory-signer-passkey')).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(await screen.findByTestId('advisory-vote-note')).toHaveTextContent('Nothing was sent');
    await waitFor(() => expect(screen.getAllByTestId('advisory-vote-for')[1]).toBeEnabled());
    expect(screen.queryByTestId('advisory-password')).toBeNull();
    expect(posted).toHaveLength(0);
  });

  it('after A is signed, B can be voted and its prompt names B', async () => {
    mockFetch([proposal(1), proposal(2)]);
    mount();
    fireEvent.click(await screen.findByTestId('advisory-signer-phrase'));
    fireEvent.click(screen.getAllByTestId('advisory-vote-for')[0]);
    await screen.findByTestId('advisory-password');
    fireEvent.change(screen.getByLabelText('Wallet password'), { target: { value: 'right' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign and send' }));
    await screen.findByText(/Sent\. It counts once it is in a block/);
    await waitFor(() => expect(screen.getAllByTestId('advisory-vote-against')[1]).toBeEnabled());
    fireEvent.click(screen.getAllByTestId('advisory-vote-against')[1]);
    expect(await screen.findByTestId('advisory-password')).toHaveTextContent('Sign your vote against “Fake proposal 2”');
    fireEvent.change(screen.getByLabelText('Wallet password'), { target: { value: 'right' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign and send' }));
    await waitFor(() => expect(posted).toHaveLength(2));
    expect(posted.map(b => b.action.vote.proposal_id)).toEqual([proposal(1).id, proposal(2).id]);
    expect(posted.map(b => b.action.vote.approve)).toEqual([true, false]);
  });

  it('the refusal text for a second action is plain words', () => {
    expect(ANOTHER_ACTION_RUNNING).toMatch(/other vote or proposal/);
  });
});

describe('F4: advisory proposals past the first 20', () => {
  it('Next and Previous page the advisory list on its own offset', async () => {
    mockFetch(Array.from({ length: 45 }, (_, i) => proposal(i + 1)));
    mount();
    await screen.findByText('Fake proposal 1');
    expect(screen.getAllByTestId('advisory-proposal')).toHaveLength(20);
    expect(screen.getByTestId('advisory-pager')).toHaveTextContent('Showing 1–20 of 45 advisory proposals');
    expect(screen.getByTestId('advisory-prev')).toBeDisabled();
    fireEvent.click(screen.getByTestId('advisory-next'));
    await screen.findByText('Fake proposal 21');
    expect(calls).toContain('GET /api/governance/advisory/proposals?limit=20&offset=20');
    expect(screen.queryByText('Fake proposal 1')).toBeNull();
    fireEvent.click(screen.getByTestId('advisory-next'));
    await screen.findByText('Fake proposal 45');
    expect(screen.getAllByTestId('advisory-proposal')).toHaveLength(5);
    expect(screen.getByTestId('advisory-pager')).toHaveTextContent('Showing 41–45 of 45');
    expect(screen.getByTestId('advisory-next')).toBeDisabled();
    // The vote buttons are there on a later page too.
    expect(screen.getAllByTestId('advisory-vote-for')).toHaveLength(5);
    fireEvent.click(screen.getByTestId('advisory-prev'));
    await screen.findByText('Fake proposal 21');
  });

  it('a page that fails keeps the last page with a retry', async () => {
    mockFetch(Array.from({ length: 25 }, (_, i) => proposal(i + 1)));
    mount();
    await screen.findByText('Fake proposal 1');
    failOffsets.add(20);
    fireEvent.click(screen.getByTestId('advisory-next'));
    expect(await screen.findByText(/Could not load that page/)).toBeInTheDocument();
    expect(screen.getByText('Fake proposal 1')).toBeInTheDocument();
    failOffsets.clear();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await screen.findByText('Fake proposal 21');
  });

  it('20 or fewer: no pager', async () => {
    mockFetch([proposal(1)]);
    mount();
    await screen.findByText('Fake proposal 1');
    expect(screen.queryByTestId('advisory-pager')).toBeNull();
  });
});
