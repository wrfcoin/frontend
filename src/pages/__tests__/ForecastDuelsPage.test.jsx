/** @jest-environment jsdom */
/**
 * backend#228/#1424 (demo item 10): free-play forecast duels on the web. Public board and duel reads carry
 * no credential; opening/accepting/linking are wallet calls; the verdict is the server's (from the chain),
 * and nothing anywhere mentions a stake.
 */
import { jest } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const { setAuthToken, clearAuthToken } = await import('../../services/authTokenStore');
const { default: ForecastDuelsPage, targetHourOptions } = await import('../ForecastDuelsPage');
const { default: ForecastDuelPage } = await import('../ForecastDuelPage');

afterEach(() => { cleanup(); clearAuthToken(); });

const A = '0x' + 'a1'.repeat(20);
const B = '0x' + 'b2'.repeat(20);
const ID = '6f1d2c4e-8a8b-4c1e-9d6a-1f2e3d4c5b6a';
const b64 = obj => globalThis.btoa(JSON.stringify(obj)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const tokenFor = address => `${b64({ alg: 'HS256' })}.${b64({ sub: address, address, role: 'wallet' })}.sig`;
const entry = (address, over = {}) => ({ address, commitId: null, linkedAt: null, recordVerified: false, modelId: null, forecast: null,
  chainReward: null, chainRewardFinalized: false, status: 'no_entry', invalidReason: null, ...over });
const duel = (over = {}) => ({
  id: ID, stationAlias: 'st_7d29a4c1e0b8', targetAt: '2026-11-03T18:00:00.000Z', lockAt: '2026-11-03T12:00:00.000Z', resolveBy: '2026-11-05T18:00:00.000Z',
  status: 'open', phase: 'open', mode: 'free_play', stakes: null, creator: entry(A, { commitId: 'c'.repeat(64), status: 'linked' }), opponent: null,
  invitedOpponent: null, outcome: null, judge: 'The chain', createdAt: '2026-11-02T10:00:00.000Z', matchedAt: null, resolvedAt: null, ...over,
});
function reply(status, body) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status, headers: { get: () => null }, json: () => Promise.resolve(body) });
}
const renderAt = path => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route path="/duels" element={<ForecastDuelsPage />} />
      <Route path="/duels/:id" element={<ForecastDuelPage />} />
    </Routes>
  </MemoryRouter>,
);

describe('ForecastDuelsPage', () => {
  it('offers target hours only inside the server window (7 h to 7 days, on the hour)', () => {
    const now = Date.parse('2026-11-02T10:20:00Z');
    const options = targetHourOptions(now);
    expect(options[0]).toBe('2026-11-02T18:00:00.000Z');
    expect(options.every(o => Date.parse(o) % 3_600_000 === 0)).toBe(true);
  });

  it('shows the public board with no credential and asks a signed-out visitor to sign in', async () => {
    globalThis.fetch = jest.fn(() => reply(200, { open: [duel()], live: [], finished: [] }));
    renderAt('/duels');
    const card = await screen.findByTestId('duel-card');
    const [url, init] = globalThis.fetch.mock.calls[0];
    expect(url).toBe('/api/duels');
    expect(init.credentials).toBe('omit');
    expect(within(card).getByText('Waiting for an opponent')).toBeInTheDocument();
    expect(within(card).getByText('Open seat')).toBeInTheDocument();
    expect(screen.getByText(/Free play: no stakes/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open your wallet' })).toHaveAttribute('href', '/wallet');
    expect(document.body.textContent).not.toMatch(/stake amount|escrow/i);
  });

  it('opens a duel as the signed-in wallet and refuses an unknown station in plain words', async () => {
    setAuthToken(tokenFor(A));
    globalThis.fetch = jest.fn((url, init) => (init?.method === 'POST'
      ? reply(404, { success: false, error: { code: 'UNKNOWN_STATION', message: 'x' } })
      : reply(200, { open: [], live: [], finished: [] })));
    renderAt('/duels');
    await screen.findByText('No open duels right now. Open one above.');
    fireEvent.change(screen.getByLabelText('Station alias'), { target: { value: 'st_7d29a4c1e0b8' } });
    fireEvent.click(screen.getByRole('button', { name: 'Open duel' }));
    await waitFor(() => expect(screen.getByText(/No station has that alias/)).toBeInTheDocument());
    const post = globalThis.fetch.mock.calls.find(([, i]) => i?.method === 'POST');
    expect(post[0]).toBe('/api/duels');
    expect(post[1].headers.Authorization).toBe(`Bearer ${tokenFor(A)}`);
    const body = JSON.parse(post[1].body);
    expect(body.stationAlias).toBe('st_7d29a4c1e0b8');
    expect(Date.parse(body.targetAt) % 3_600_000).toBe(0);
    expect(body).not.toHaveProperty('stakeAmount');
  });
});

describe('ForecastDuelPage', () => {
  it('lets another signed-in wallet accept, and shows the chain verdict once decided', async () => {
    setAuthToken(tokenFor(B));
    globalThis.fetch = jest.fn((url, init) => (init?.method === 'POST' ? reply(200, { duel: duel({ status: 'matched', phase: 'committing', opponent: entry(B) }) }) : reply(200, { duel: duel() })));
    renderAt(`/duels/${ID}`);
    fireEvent.click(await screen.findByRole('button', { name: 'Accept this duel' }));
    await waitFor(() => expect(globalThis.fetch.mock.calls.some(([u, i]) => u === `/api/duels/${ID}/accept` && i.method === 'POST')).toBe(true));
    cleanup();
    globalThis.fetch = jest.fn(() => reply(200, { duel: duel({
      status: 'resolved', phase: 'resolved',
      creator: entry(A, { commitId: 'c'.repeat(64), recordVerified: true, forecast: { temperature_c: 4.5 }, chainReward: '100000', chainRewardFinalized: true }),
      opponent: entry(B, { commitId: 'd'.repeat(64), recordVerified: true, forecast: { temperature_c: 6.25 }, chainReward: '100000', chainRewardFinalized: true }),
      outcome: { result: 'draw', winner: null, reason: 'equal_chain_reward', note: 'The chain paid both forecasts the same amount. Without an oracle receipt every forecast earns the 0.1 baseline, so this is a draw.' },
    }) }));
    renderAt(`/duels/${ID}`);
    expect(await screen.findByTestId('duel-outcome')).toHaveTextContent('Draw. The chain paid both forecasts the same amount');
    const sides = screen.getAllByTestId('duel-side');
    expect(sides[0]).toHaveTextContent('4.5 °C');
    expect(sides[1]).toHaveTextContent('You');
    expect(sides[1]).toHaveTextContent('0.00100000 WRF');
  });

  it('a malformed id makes no request; a 404 says no duel', async () => {
    globalThis.fetch = jest.fn(() => reply(404, {}));
    renderAt('/duels/not-a-uuid');
    expect(screen.getByText('No duel here')).toBeInTheDocument();
    expect(globalThis.fetch).not.toHaveBeenCalled();
    cleanup();
    renderAt(`/duels/${ID}`);
    expect(await screen.findByText('No duel here')).toBeInTheDocument();
  });
});
