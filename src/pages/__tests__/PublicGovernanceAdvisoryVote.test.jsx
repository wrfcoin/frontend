/** @jest-environment jsdom */
/**
 * Website advisory propose/vote (owner decision 2026-11-09): with the build flag on and the node reporting
 * advisory_governance active, a passkey wallet and a 12-word wallet can each propose and vote. Only the
 * network, the vault unlock and the authenticator are faked; the message/challenge/JSON code is real.
 */
import React from 'react';
import { jest } from '@jest/globals';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ed25519 } from '@noble/curves/ed25519.js';

globalThis.__VITE_ENV__ = { VITE_WRFCOIN_CHAIN_ID: '888', VITE_ENABLE_ADVISORY_VOTING: 'true' };

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
const { advisoryActionMessage, advisoryPasskeyChallenge } = await import('../../services/walletCrypto/advisoryGovernance');

const PROPOSAL_ID = 'adv-0123456789abcdef';
const ACTIVE = {
  id: PROPOSAL_ID, kind: 'advisory', proposer: '0x' + 'ab'.repeat(20), title: 'Plant more stations', summary: 'Text.',
  created_at_block: 100, voting_deadline: 1220, status: 'active', yes_votes: 1, no_votes: 0, eligible_count: 12,
};

let calls;
let posted;
let eligibility;
function mockFetch({ featureActive = true, proposals = [ACTIVE] } = {}) {
  calls = []; posted = [];
  global.fetch = jest.fn(async (input, init = {}) => {
    const url = new URL(String(input), 'https://test.invalid');
    const method = (init.method || 'GET').toUpperCase();
    calls.push(`${method} ${url.pathname}${url.search}`);
    let body;
    if (url.pathname === '/api/governance/advisory/proposals') body = { success: true, featureActive, total: proposals.length, hasMore: false, proposals };
    else if (url.pathname.endsWith('/nonce')) body = { success: true, address: url.pathname.split('/')[5], nonce: 3 };
    else if (url.pathname.endsWith('/eligibility')) body = { success: true, ...eligibility };
    else if (url.pathname === '/api/governance/advisory/actions') {
      posted.push(JSON.parse(init.body));
      return new Response(JSON.stringify({ success: true, txId: 'ff'.repeat(32), proposalId: PROPOSAL_ID, nonce: 3, action: 'propose', status: 'submitted' }), { status: 202, headers: { 'content-type': 'application/json' } });
    } else body = { success: true, count: 0, total: 0, offset: 0, limit: 20, hasMore: false, proposals: [] };
    return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
  });
}

/** A fake authenticator: records the challenge and answers a well-formed (not cryptographically valid) assertion. */
function fakeCredentials() {
  const seen = [];
  return {
    seen,
    get: jest.fn(async ({ publicKey }) => {
      seen.push(publicKey);
      const clientDataJSON = new TextEncoder().encode(JSON.stringify({ type: 'webauthn.get', challenge: base64urlNoPad(publicKey.challenge), origin: 'https://wrfcoin.com' }));
      return { response: { authenticatorData: new Uint8Array(37).fill(5), clientDataJSON, signature: new Uint8Array([0x30, 0x06, 0x02, 0x01, 0x01, 0x02, 0x01, 0x01]) } };
    }),
  };
}

const mount = credentials => render(
  <MemoryRouter initialEntries={['/governance/public']}>
    <Routes><Route path="/governance/public" element={<PublicGovernanceListPage credentials={credentials} />} /></Routes>
  </MemoryRouter>,
);
beforeEach(() => { eligibility = { canVote: true, eligible: true, votingOpen: true, voted: null, reason: null, nextNonce: 5 }; passwords.length = 0; });
afterEach(() => { cleanup(); jest.restoreAllMocks(); });

it('shows the wallet choice, the propose form and vote buttons once the node reports the feature active', async () => {
  mockFetch();
  mount(fakeCredentials());
  await screen.findByTestId('advisory-actions');
  expect(screen.getByTestId('advisory-signer-passkey')).toHaveAttribute('aria-checked', 'true');
  expect(screen.getByTestId('advisory-signer-phrase')).toBeInTheDocument();
  expect(screen.getByTestId('advisory-propose-open')).toBeInTheDocument();
  expect(screen.getByTestId('advisory-vote-for')).toBeInTheDocument();
});

it('hides every control while the node reports the feature inactive', async () => {
  mockFetch({ featureActive: false });
  mount(fakeCredentials());
  await screen.findByTestId('advisory-proposals');
  expect(screen.queryByTestId('advisory-actions')).toBeNull();
  expect(screen.queryByTestId('advisory-vote-for')).toBeNull();
});

it('a passkey wallet proposes: one prompt over SHA3(message), relayed as a passkey-signed action', async () => {
  mockFetch({ proposals: [] });
  const credentials = fakeCredentials();
  mount(credentials);
  fireEvent.click(await screen.findByTestId('advisory-propose-open'));
  expect(screen.getByTestId('advisory-deposit-note')).toHaveTextContent('holds 1 WRF');
  fireEvent.change(screen.getByTestId('advisory-title'), { target: { value: 'Plant more stations' } });
  fireEvent.change(screen.getByTestId('advisory-summary'), { target: { value: 'One line.\nTwo lines.' } });
  fireEvent.click(screen.getByTestId('advisory-propose-submit'));
  await screen.findByTestId('advisory-propose-done');
  expect(calls).toContain(`GET /api/governance/advisory/accounts/${PASSKEY_ADDR}/nonce`);
  const action = { kind: 'propose', title: 'Plant more stations', summary: 'One line.\nTwo lines.' };
  const expected = advisoryPasskeyChallenge(advisoryActionMessage('888', 'testnet', PASSKEY_ADDR, action, 3n));
  expect(bytesToHex(new Uint8Array(credentials.seen[0].challenge))).toBe(bytesToHex(expected));
  expect(credentials.seen[0].userVerification).toBe('required');
  expect(credentials.seen[0].rpId).toBe('wrfcoin.com');
  expect(posted).toHaveLength(1);
  const body = posted[0];
  expect(Object.keys(body)).toEqual(['account', 'action', 'nonce', 'passkey']);
  expect(`0x${Buffer.from(body.account).toString('hex')}`).toBe(PASSKEY_ADDR);
  expect(body.action).toEqual({ propose: { title: 'Plant more stations', summary: 'One line.\nTwo lines.' } });
  expect(body.nonce).toBe(3);
  expect(Object.keys(body.passkey)).toEqual(['public_key_p256', 'rp_id_hash', 'authenticator_data', 'client_data_json', 'signature']);
});

it('a 12-word wallet votes: eligibility first, password once, relayed as an ed25519-signed vote at the node nonce', async () => {
  mockFetch();
  const credentials = fakeCredentials();
  mount(credentials);
  fireEvent.click(await screen.findByTestId('advisory-signer-phrase'));
  fireEvent.click(screen.getByTestId('advisory-vote-against'));
  await screen.findByTestId('advisory-password');
  expect(calls).toContain(`GET /api/governance/advisory/proposals/${PROPOSAL_ID}/eligibility?address=${PHRASE_ADDR}`);
  fireEvent.change(screen.getByLabelText('Wallet password'), { target: { value: 'right' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign and send' }));
  await screen.findByText(/Sent\. It counts once it is in a block/);
  expect(credentials.get).not.toHaveBeenCalled();
  expect(posted).toHaveLength(1);
  const body = posted[0];
  expect(Object.keys(body)).toEqual(['account', 'action', 'nonce', 'public_key', 'signature']);
  expect(body.action).toEqual({ vote: { proposal_id: PROPOSAL_ID, approve: false } });
  expect(body.nonce).toBe(5);
  expect(body.public_key).toBe(bytesToHex(ED_PUB));
  const message = advisoryActionMessage('888', 'testnet', PHRASE_ADDR, { kind: 'vote', proposalId: PROPOSAL_ID, approve: false }, 5n);
  expect(ed25519.verify(passkeyMod.hexToBytes(body.signature), message, ED_PUB)).toBe(true);
});

it('explains an ineligible wallet and signs nothing', async () => {
  eligibility = { canVote: false, eligible: false, votingOpen: true, voted: null, reason: 'this wallet held under 1 WRF spendable when the proposal was created', nextNonce: 0 };
  mockFetch();
  const credentials = fakeCredentials();
  mount(credentials);
  fireEvent.click(await screen.findByTestId('advisory-vote-for'));
  expect(await screen.findByTestId('advisory-vote-note')).toHaveTextContent('held under 1 WRF');
  expect(credentials.get).not.toHaveBeenCalled();
  expect(posted).toHaveLength(0);
});

it('a wrong password sends nothing', async () => {
  mockFetch();
  mount(fakeCredentials());
  fireEvent.click(await screen.findByTestId('advisory-signer-phrase'));
  fireEvent.click(screen.getByTestId('advisory-vote-for'));
  await screen.findByTestId('advisory-password');
  fireEvent.change(screen.getByLabelText('Wallet password'), { target: { value: 'wrong' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign and send' }));
  expect(await screen.findByTestId('advisory-vote-note')).toHaveTextContent('Check your wallet password');
  await waitFor(() => expect(posted).toHaveLength(0));
});
