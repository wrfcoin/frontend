/** @jest-environment jsdom */
/**
 * backend#249 (demo item 8): friend challenges on the web. The wallet login token is the only credential;
 * signed out, nothing is requested except the public board by code. Counts are the server's, points only.
 */
import { jest } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const { setAuthToken, clearAuthToken } = await import('../../services/authTokenStore');
const { tokenWallet } = await import('../../services/walletApi');
const { default: FriendChallengesPage } = await import('../FriendChallengesPage');
const { default: FriendChallengeBoardPage } = await import('../FriendChallengeBoardPage');

afterEach(() => { cleanup(); clearAuthToken(); });

const A = '0x' + 'a1'.repeat(20);
const B = '0x' + 'b2'.repeat(20);
const b64 = obj => globalThis.btoa(JSON.stringify(obj)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const tokenFor = address => `${b64({ alg: 'HS256' })}.${b64({ sub: address, address, role: 'wallet' })}.sig`;

const challenge = (over = {}) => ({
  id: 'c1', title: 'Coast race', description: 'Who logs more', format: 'headToHead', status: 'live', inviteCode: 'ABCD-2345',
  targetScore: 50, startsAt: '2026-11-02T00:00:00.000Z', endsAt: '2026-11-09T00:00:00.000Z', completedAt: null,
  lastUpdatedAt: '2026-11-02T12:00:00.000Z', metricLabel: 'readings on chain',
  scoring: { source: 'chain', note: 'x', countedAt: '2026-11-02T12:00:00.000Z' },
  participants: [
    { id: B, name: 'Collector B2B2', score: 7, teamName: '', subtitle: 'Joined by invite code', stations: 1 },
    { id: A, name: 'Collector A1A1', score: 3, teamName: '', subtitle: 'Challenge host', stations: 0 },
  ],
  ...over,
});
function reply(status, body) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status, headers: { get: () => null }, json: () => Promise.resolve(body) });
}
const renderAt = path => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route path="/challenges" element={<FriendChallengesPage />} />
      <Route path="/challenges/:code" element={<FriendChallengeBoardPage />} />
    </Routes>
  </MemoryRouter>,
);

describe('wallet token', () => {
  it('reads the wallet from the token for display only', () => {
    expect(tokenWallet(tokenFor(A))).toBe(A);
    expect(tokenWallet('not-a-jwt')).toBeNull();
    expect(tokenWallet(`${b64({})}.${b64({ address: 'unknown' })}.x`)).toBeNull();
  });
});

describe('FriendChallengesPage', () => {
  it('signed out: asks for the wallet, sends nothing, and offers the public board by code', async () => {
    globalThis.fetch = jest.fn();
    renderAt('/challenges');
    expect(screen.getByText(/Sign in with your wallet/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open your wallet' })).toHaveAttribute('href', '/wallet');
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(screen.getByText(/Points only: nothing is paid/)).toBeInTheDocument();
  });

  it('signed in: lists the wallet\'s challenges with the server\'s counts and marks you', async () => {
    setAuthToken(tokenFor(A));
    globalThis.fetch = jest.fn(() => reply(200, { challenges: [challenge()] }));
    renderAt('/challenges');
    const card = await screen.findByTestId('challenge-card');
    const [, init] = globalThis.fetch.mock.calls[0];
    expect(globalThis.fetch.mock.calls[0][0]).toBe('/api/challenges');
    expect(init.headers.Authorization).toBe(`Bearer ${tokenFor(A)}`);
    const players = within(card).getAllByTestId('challenge-player');
    expect(players[0]).toHaveTextContent('Collector B2B2');
    expect(players[0]).toHaveTextContent('7');
    expect(players[1]).toHaveTextContent('You');
    expect(players[1]).toHaveTextContent('no station linked to this wallet');
    expect(card).toHaveTextContent('ABCD-2345');
    expect(card).not.toHaveTextContent(/WRF\b/);
  });

  it('creates a challenge with the phone form fields and shows a refusal in plain words', async () => {
    setAuthToken(tokenFor(A));
    const calls = [];
    globalThis.fetch = jest.fn((url, init) => {
      calls.push([url, init]);
      if (url === '/api/challenges' && init.method === 'POST') return reply(201, { challenges: [challenge({ status: 'pending', participants: [challenge().participants[1]] })] });
      if (url === '/api/challenges/join') return reply(409, { success: false, error: { code: 'CHALLENGE_FULL', message: 'x' } });
      return reply(200, { challenges: [] });
    });
    renderAt('/challenges');
    expect(await screen.findByText('No challenges yet')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Coast race' } });
    fireEvent.click(screen.getByRole('button', { name: 'Start challenge' }));
    await screen.findByText(/Challenge created/);
    const post = calls.find(([u, i]) => u === '/api/challenges' && i.method === 'POST');
    expect(JSON.parse(post[1].body)).toEqual({ title: 'Coast race', description: '', format: 'headToHead', targetScore: 50, durationHours: 168 });
    fireEvent.change(screen.getAllByLabelText('Invite code')[0], { target: { value: 'wxyz-2345' } });
    fireEvent.click(screen.getByRole('button', { name: 'Join challenge' }));
    await waitFor(() => expect(screen.getByText('This challenge is already full.')).toBeInTheDocument());
    expect(JSON.parse(calls.find(([u]) => u === '/api/challenges/join')[1].body)).toEqual({ inviteCode: 'WXYZ-2345' });
  });
});

describe('FriendChallengeBoardPage', () => {
  it('reads the public board by code with no credential, and offers Join to a signed-in wallet not in it', async () => {
    globalThis.fetch = jest.fn(() => reply(200, { challenge: challenge() }));
    renderAt('/challenges/abcd-2345');
    await screen.findByTestId('challenge-card');
    const [url, init] = globalThis.fetch.mock.calls[0];
    expect(url).toBe('/api/challenges/code/ABCD-2345');
    expect(init.credentials).toBe('omit');
    expect(init.headers).toBeUndefined();
    expect(screen.getByRole('link', { name: 'Sign in with your wallet to join' })).toBeInTheDocument();
    cleanup();
    setAuthToken(tokenFor('0x' + 'c3'.repeat(20)));
    renderAt('/challenges/ABCD-2345');
    expect(await screen.findByRole('button', { name: 'Join this challenge' })).toBeInTheDocument();
  });

  it('a malformed code makes no request; a 404 says no challenge', async () => {
    globalThis.fetch = jest.fn(() => reply(404, { error: 'Not found' }));
    renderAt('/challenges/nope');
    expect(screen.getByText('No challenge for this code')).toBeInTheDocument();
    expect(globalThis.fetch).not.toHaveBeenCalled();
    cleanup();
    renderAt('/challenges/ABCD-2345');
    expect(await screen.findByText('No challenge for this code')).toBeInTheDocument();
  });
});
