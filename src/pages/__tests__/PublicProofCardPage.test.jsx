/** @jest-environment jsdom */
/**
 * backend#229: the public proof card for one station reading. One GET to /api/proofs/<commit id>[?h=],
 * every field from that answer; null fields read "Unavailable", an unlocated block is said, never guessed.
 */
import { jest } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

afterEach(cleanup);

const { default: PublicProofCardPage } = await import('../PublicProofCardPage');
const { proofCardPath, proofPagePath } = await import('../../services/publicReadonlyApi');

const COMMIT = 'c0'.repeat(32);
const BLOCK_HASH = 'ab'.repeat(32);

const card = (over = {}) => ({
  commitId: COMMIT,
  stationAlias: 'st_0123456789ab',
  status: 'reward_finalized',
  reading: { observedAt: '2026-10-31T11:43:20.000Z', temperatureC: 4.5, humidityPct: 81, pressureHpa: 1012.3, windSpeedMs: 3.1,
    precipitationMm: 0, dewpointC: 1.4, provenanceClass: 'real' },
  inclusion: { status: 'included', block: { height: 4890, hash: BLOCK_HASH, timestamp: '2026-10-31T12:00:00.000Z', producerPubkey: '01'.repeat(32), finalized: true } },
  attestation: { approvals: 2, hasQuorum: true, quorum: 2 },
  reward: { status: 'paid', amountBaseUnits: '250000000', finalized: true, rewarded: true, blocker: null, block: { height: 4900, hash: 'cd'.repeat(32), finalized: true } },
  chain: { networkId: 'testnet', chainId: '888', genesisHash: 'ee'.repeat(32), height: 5000, finalizedHeight: 4990 },
  ...over,
});

function reply(status, body) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status, headers: { get: () => null }, json: () => Promise.resolve(body) });
}

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes><Route path="/proof/:commitId" element={<PublicProofCardPage />} /></Routes>
    </MemoryRouter>,
  );
}

describe('proof card paths', () => {
  it('builds only the edge-admitted shapes', () => {
    expect(proofCardPath(COMMIT)).toBe(`/proofs/${COMMIT}`);
    expect(proofCardPath(COMMIT, 4890)).toBe(`/proofs/${COMMIT}?h=4890`);
    expect(proofCardPath(COMMIT, '0')).toBe(`/proofs/${COMMIT}`);
    expect(proofCardPath(COMMIT, '12x')).toBe(`/proofs/${COMMIT}`);
    expect(proofCardPath(COMMIT.toUpperCase())).toBeNull();
    expect(proofCardPath(`0x${COMMIT}`)).toBeNull();
    expect(proofPagePath(COMMIT, 4890)).toBe(`/proof/${COMMIT}?h=4890`);
  });
});

describe('PublicProofCardPage', () => {

  it('shows the reading, the block it landed in and the reward, all from the one public read', async () => {
    globalThis.fetch = jest.fn(() => reply(200, card()));
    renderAt(`/proof/${COMMIT}?h=4890`);
    expect(await screen.findByTestId('proof-inclusion')).toHaveTextContent('In block 4,890');
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch.mock.calls[0][0]).toMatch(new RegExp(`/api/proofs/${COMMIT}\\?h=4890$`));
    expect(globalThis.fetch.mock.calls[0][1]).toMatchObject({ method: 'GET', credentials: 'omit' });
    const values = screen.getByTestId('proof-values');
    expect(values).toHaveTextContent('4.5 °C');
    expect(values).toHaveTextContent('81 %');
    expect(values).toHaveTextContent('1012.3 hPa');
    const block = screen.getByTestId('proof-block');
    expect(block).toHaveTextContent('abababababab'.slice(0, 10));
    expect(block).toHaveTextContent('Yes');
    const reward = screen.getByTestId('proof-reward');
    expect(reward).toHaveTextContent('Paid');
    expect(reward).toHaveTextContent('2.50000000 WRF');
    expect(reward).toHaveTextContent('4,900');
    expect(screen.getByText('Confirmed by 2 attesters of 2 needed')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Station st_0123456789ab' })).toHaveAttribute('href', '/weather/station/st_0123456789ab');
    expect(within(screen.getByTestId('proof-share')).getByText(new RegExp(`/proof/${COMMIT}\\?h=4890$`))).toBeInTheDocument();
  });

  it('says Unavailable for fields the server could not read, never a made-up value', async () => {
    globalThis.fetch = jest.fn(() => reply(200, card({
      inclusion: { status: 'included', block: { height: 4890, hash: null, timestamp: null, producerPubkey: null, finalized: null } },
      attestation: null,
      reward: { status: null, amountBaseUnits: null, finalized: false, rewarded: false, blocker: null, block: null },
    })));
    renderAt(`/proof/${COMMIT}`);
    const block = await screen.findByTestId('proof-block');
    expect(within(block).getAllByText('Unavailable')).toHaveLength(4);
    expect(screen.getByTestId('proof-reward')).toHaveTextContent('Unavailable');
  });

  it('says the block was not located instead of guessing one', async () => {
    globalThis.fetch = jest.fn(() => reply(200, card({ reading: null, inclusion: { status: 'not_located', block: null } })));
    renderAt(`/proof/${COMMIT}`);
    expect(await screen.findByTestId('proof-inclusion')).toHaveTextContent('Block not located');
    expect(screen.queryByTestId('proof-values')).toBeNull();
    expect(screen.queryByTestId('proof-block')).toBeNull();
  });

  it('does not ask the server for a malformed id, and shows not found', async () => {
    globalThis.fetch = jest.fn();
    renderAt('/proof/not-a-commit');
    expect(screen.getByText('No proof card for this link')).toBeInTheDocument();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('shows the not-found state for a 404 and a retryable alert for a node failure', async () => {
    globalThis.fetch = jest.fn(() => reply(404, { error: 'Not found' }));
    const { unmount } = renderAt(`/proof/${COMMIT}`);
    expect(await screen.findByText('No proof card for this link')).toBeInTheDocument();
    unmount();
    globalThis.fetch = jest.fn(() => reply(502, {}));
    renderAt(`/proof/${COMMIT}`);
    expect(await screen.findByRole('alert')).toHaveTextContent('the chain node could not answer');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument());
  });
});
