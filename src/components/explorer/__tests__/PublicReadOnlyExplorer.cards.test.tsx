/** @jest-environment jsdom */
/**
 * frontend#561: the public explorer shows blocks as readable cards (height,
 * local time, tx count, short hash + copy, permalink) and never fabricates a
 * field the API did not send.
 */
import React from 'react';
import '@testing-library/jest-dom/jest-globals';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import PublicReadOnlyExplorer, {
  parseBlockDate,
  relativeTime,
  shortHash,
  toExplorerBlock,
} from '../PublicReadOnlyExplorer';

const HASH_A = '0x' + 'ab'.repeat(32);
const PREV_A = '0x' + 'cd'.repeat(32);

function backend(body: unknown, status = 200) {
  const calls: string[] = [];
  global.fetch = jest.fn(async (input: unknown) => {
    calls.push(String(input));
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
  return calls;
}

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
});

describe('helpers', () => {
  it('shortens a hash and keeps a short one intact', () => {
    expect(shortHash(HASH_A)).toBe('0xabababab…ababab');
    expect(shortHash('abc123')).toBe('abc123');
    expect(shortHash(null)).toBe('unavailable');
  });

  it('parses RFC3339 strings, epoch seconds and millis, and rejects junk', () => {
    expect(parseBlockDate('2026-10-19T00:58:00Z')?.toISOString()).toBe('2026-10-19T00:58:00.000Z');
    expect(parseBlockDate(1_760_000_000)?.getTime()).toBe(1_760_000_000_000);
    expect(parseBlockDate(1_760_000_000_000)?.getTime()).toBe(1_760_000_000_000);
    expect(parseBlockDate('not a date')).toBeNull();
    expect(parseBlockDate(null)).toBeNull();
  });

  it('describes age in minutes, hours and days', () => {
    const now = Date.parse('2026-10-19T01:00:00Z');
    expect(relativeTime(new Date(now - 10_000), now)).toBe('just now');
    expect(relativeTime(new Date(now - 4 * 60_000), now)).toBe('4 min ago');
    expect(relativeTime(new Date(now - 3 * 3_600_000), now)).toBe('3 h ago');
    expect(relativeTime(new Date(now - 5 * 86_400_000), now)).toBe('5 d ago');
    expect(relativeTime(null, now)).toBeNull();
  });

  it('normalises a backend row and leaves unknown fields null', () => {
    expect(toExplorerBlock({ height: 7, hash: HASH_A, previousHash: PREV_A, timestamp: '2026-10-19T00:58:00Z', transactions: 3 })).toEqual({
      height: 7, hash: HASH_A, previousHash: PREV_A, timestamp: '2026-10-19T00:58:00Z', transactions: 3,
    });
    expect(toExplorerBlock({ number: '12', blockHash: HASH_A, tx_count: '0' })).toEqual({
      height: 12, hash: HASH_A, previousHash: null, timestamp: null, transactions: 0,
    });
    expect(toExplorerBlock({})).toEqual({ height: null, hash: null, previousHash: null, timestamp: null, transactions: null });
  });
});

describe('PublicReadOnlyExplorer', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/explore');
  });

  it('reads the public blocks route once and renders one card per block', async () => {
    const calls = backend({
      blocks: [
        { height: 44812, hash: HASH_A, previousHash: PREV_A, timestamp: '2026-10-19T00:58:00Z', transactions: 3 },
        { height: 44811, hash: '0x' + 'ef'.repeat(32), previousHash: '0x' + '01'.repeat(32), timestamp: '2026-10-19T00:56:43Z', transactions: 0 },
      ],
    });
    render(<PublicReadOnlyExplorer />);
    expect(screen.getByTestId('explorer-loading')).toBeInTheDocument();

    const cards = await screen.findAllByTestId('explorer-block-card');
    expect(cards).toHaveLength(2);
    expect(calls).toEqual(['/api/blockchain/blocks?limit=25']);

    expect(screen.getByRole('heading', { level: 1, name: 'Block Explorer' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Block 44,812' })).toBeInTheDocument();
    expect(screen.getByText('3 txs')).toBeInTheDocument();
    expect(screen.getByText('0 txs')).toBeInTheDocument();
    expect(screen.getByText('0xabababab…ababab')).toBeInTheDocument();
    expect(screen.getByText('0xabababab…ababab').closest('code')).toHaveAttribute('title', HASH_A);
    // Local time is rendered as a <time> carrying the ISO instant.
    expect(cards[0].querySelector('time')).toHaveAttribute('datetime', '2026-10-19T00:58:00.000Z');
    // Permalink anchors.
    expect(cards[0]).toHaveAttribute('id', 'block-44812');
    expect(screen.getByRole('link', { name: '/explore#block-44812' })).toHaveAttribute('href', '#block-44812');
    // Stats row.
    expect(screen.getByText('Latest height')).toBeInTheDocument();
    expect(screen.getByText('44,812')).toBeInTheDocument();
    expect(screen.getByText('Transactions in 2 blocks')).toBeInTheDocument();
  });

  it('copies the full hash to the clipboard and confirms', async () => {
    backend({ blocks: [{ height: 1, hash: HASH_A, timestamp: '2026-10-19T00:58:00Z', transactions: 1 }] });
    const writeText = jest.fn(async (_text: string) => undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<PublicReadOnlyExplorer />);
    const copy = await screen.findByRole('button', { name: 'Copy block hash' });
    fireEvent.click(copy);
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(HASH_A));
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument();
    expect(screen.getByText('1 tx')).toBeInTheDocument();
  });

  it('shows "unavailable" for fields the API did not send, never a placeholder', async () => {
    backend({ blocks: [{ height: 5 }] });
    render(<PublicReadOnlyExplorer />);
    const card = await screen.findByTestId('explorer-block-card');
    expect(card.textContent).toContain('Block 5');
    expect(card.textContent).toContain('txs unavailable');
    expect(card.querySelector('time')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Copy block hash' })).not.toBeInTheDocument();
    expect(card.textContent?.match(/unavailable/g)?.length).toBeGreaterThanOrEqual(3);
  });

  it('renders the error state when the edge does not answer, and retries on demand', async () => {
    const calls = backend({ error: 'down' }, 503);
    render(<PublicReadOnlyExplorer />);
    expect(await screen.findByText('Live block data is unavailable')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(calls).toHaveLength(2));
  });

  it('renders the empty state for an empty list', async () => {
    backend({ blocks: [] });
    render(<PublicReadOnlyExplorer />);
    expect(await screen.findByText('No blocks were returned')).toBeInTheDocument();
    expect(screen.queryAllByTestId('explorer-block-card')).toHaveLength(0);
  });
});
