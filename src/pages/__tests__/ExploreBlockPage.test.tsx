/** @jest-environment jsdom */
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import ExploreBlockPage from '../ExploreBlockPage';
import { parseBlockHeight, parsePublicBlock } from '../../services/publicBlock';

const COMMIT = 'ab'.repeat(32);
const HASH = 'cd'.repeat(32);
let requests: string[] = [];

function answer(status: number, body: unknown = {}) {
  requests = [];
  global.fetch = jest.fn(async (input: Parameters<typeof fetch>[0]) => {
    requests.push(String(input));
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
}

function renderAt(height: string) {
  render(
    <MemoryRouter initialEntries={[`/explore/block/${height}`]}>
      <Routes>
        <Route path="/explore/block/:height" element={<ExploreBlockPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

// The backend#65 anonymous projection of a reward block.
const block = {
  height: 19044,
  hash: HASH,
  previousHash: 'ef'.repeat(32),
  timestamp: 1_794_000_000,
  transactionCount: 4,
  transactions: [
    { type: 'ContributionReveal', payload: { commit_id: COMMIT } },
    { type: 'OracleAttestation', payload: { commit_id: COMMIT, oracle_id: 'oracle-1', approved: true } },
    { type: 'OracleAttestation', payload: { commit_id: COMMIT, oracle_id: 'oracle-2', approved: true } },
    { type: null },
  ],
  metadata: {
    rewards_minted_total: '400000000',
    reward_entries_summary: { count: 3, total_amount: '300000000' },
    attester_settlements_summary: { count: 2, total_amount: '50000000' },
    producer_settlement: { amount: '50000000', height: 19044 },
    low_quality_streak_summary: { count: 1 },
  },
};

describe('/explore/block/:height', () => {
  afterEach(() => cleanup());

  it('shows the header, what is in the block, proof links and reward totals', async () => {
    answer(200, block);
    renderAt('19044');
    expect(await screen.findByTestId('explore-block-result')).toBeTruthy();
    expect(requests).toEqual(['/api/blockchain/blocks/19044']);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Block 19,044');
    expect(screen.getByTestId('explore-block-txcount').textContent).toContain('4');
    expect(screen.getByTestId('explore-block-hash').textContent).toContain(HASH);
    const types = screen.getByTestId('explore-block-types').textContent ?? '';
    expect(types).toContain('Station reading reveal: 1');
    expect(types).toContain('Reading check: 2');
    expect(screen.getByTestId('explore-block-proofs').querySelector('a')?.getAttribute('href')).toContain(COMMIT);
    expect(screen.getByTestId('explore-block-reward-stations').textContent).toContain('3.00 WRF to 3 readings');
    expect(screen.getByTestId('explore-block-reward-attesters').textContent).toContain('0.50 WRF to 2 checks');
    expect(screen.getByTestId('explore-block-reward-producer').textContent).toContain('0.50 WRF');
    expect(screen.getByTestId('explore-block-prev').getAttribute('href')).toBe('/explore/block/19043');
    expect(screen.getByTestId('explore-block-next').getAttribute('href')).toBe('/explore/block/19045');
    expect(screen.getByText(/does not show who was paid/)).toBeTruthy();
  });

  it('an empty block says so, with rewards as none', async () => {
    answer(200, { height: 7, hash: HASH, timestamp: 1_794_000_000, transactionCount: 0, transactions: [], metadata: {} });
    renderAt('7');
    expect(await screen.findByText(/No transactions/)).toBeTruthy();
    expect(screen.getByTestId('explore-block-reward-stations').textContent).toContain('None in this block');
    expect(screen.queryByTestId('explore-block-proofs')).toBeNull();
  });

  it('404 reads as not found, 429 as busy, anything else as unavailable', async () => {
    answer(404, { error: true });
    renderAt('99999999');
    expect((await screen.findByTestId('explore-block-message')).textContent).toContain('Not found');
    cleanup();
    answer(429);
    renderAt('5');
    expect((await screen.findByTestId('explore-block-message')).textContent).toContain('Busy');
    cleanup();
    answer(200, { height: 6 }); // wrong block
    renderAt('5');
    expect((await screen.findByTestId('explore-block-message')).textContent).toContain('Unavailable');
  });

  it('a bad height is refused without a request', async () => {
    answer(200, block);
    renderAt('12a');
    expect((await screen.findByTestId('explore-block-message')).textContent).toContain('Not a block number');
    expect(requests).toEqual([]);
  });
});

describe('publicBlock parsing', () => {
  it('reads heights as the edge admits them (1 to 10 digits)', () => {
    expect(parseBlockHeight('0')).toBe(0);
    expect(parseBlockHeight(' 19044 ')).toBe(19044);
    expect(parseBlockHeight('9999999999')).toBe(9999999999);
    for (const bad of ['', '-1', '1.5', '0x10', '12345678901', 'latest']) expect(parseBlockHeight(bad)).toBeNull();
  });

  it('keeps only what the page shows, even if a server sends more', () => {
    const v = parsePublicBlock({
      ...block,
      transactions: [{ type: 'ContributionReveal', sender: '0x' + 'a'.repeat(40), payload: { commit_id: COMMIT, station_id: 'PRIVATE' } }],
      metadata: { ...block.metadata, producer_settlement: { amount: '1', height: 1, payout_address: '0x' + 'b'.repeat(40) } },
    }, 19044);
    expect(JSON.stringify(v)).not.toMatch(/0x[ab]{40}|PRIVATE|sender|payout/);
    expect(v?.rewards.producerBaseUnits).toBe('1');
  });
});
