/** @jest-environment jsdom */
/**
 * Address box on /explore (owner demo 2026-10-31): paste a 0x or wrf address, see the balance and
 * the earned total from GET /api/public/balance/<0x addr>, with calm Unavailable / Busy states and
 * never a guessed number.
 */
import React from 'react';
import '@testing-library/jest-dom/jest-globals';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import AddressLookup, { wrfText } from '../AddressLookup';
import {
  lookupPublicAddress,
  normalizeLookupAddress,
  parsePublicAddressBalance,
} from '../../../services/publicAddressBalance';
import { publicReadonlyApi } from '../../../config/publicReadonlyApi';
import edge from '../../../routes/__fixtures__/public-edge-allowlist.json';

const HEX = 'C37F' + 'ab'.repeat(18);
const LOWER = `0x${HEX.toLowerCase()}`;

function backend(body: unknown, status = 200) {
  const calls: Array<{ url: string; init?: Parameters<typeof fetch>[1] }> = [];
  global.fetch = jest.fn(async (input: unknown, init?: Parameters<typeof fetch>[1]) => {
    calls.push({ url: String(input), init });
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
  return calls;
}

function lookUp(value: string) {
  fireEvent.change(screen.getByTestId('address-lookup-input'), { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: /look up/i }));
}

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
});

describe('address helpers', () => {
  it('accepts 0x and wrf forms (any case) and sends lowercase 0x', () => {
    expect(normalizeLookupAddress(`0x${HEX}`)).toBe(LOWER);
    expect(normalizeLookupAddress(`  wrf${HEX}  `)).toBe(LOWER);
    expect(normalizeLookupAddress(`WRF${HEX}`)).toBe(LOWER);
    expect(normalizeLookupAddress(`0X${HEX}`)).toBe(LOWER);
    for (const bad of ['', '0x1234', HEX, `0x${HEX}00`, 'wrf1q84sh2j72ez0ulgupk0jzfmz4j7kzfwj3dk4kv', `0x${'g'.repeat(40)}`]) {
      expect(normalizeLookupAddress(bad)).toBeNull();
    }
  });

  it('parses the four-field answer, keeps exact digits, and reads a missing earned as null', () => {
    expect(parsePublicAddressBalance({ address: LOWER, balance: '37925925888', height: 10114, earned: '37925925888' }, LOWER)).toEqual({
      address: LOWER, balanceUnits: '37925925888', earnedUnits: '37925925888', height: 10114,
    });
    expect(parsePublicAddressBalance({ address: LOWER, balance: '1', height: 1 }, LOWER)?.earnedUnits).toBeNull();
    expect(parsePublicAddressBalance({ address: LOWER, balance: '1', height: 1, earned: null }, LOWER)?.earnedUnits).toBeNull();
  });

  it.each([
    ['another address', { address: '0x' + '1'.repeat(40), balance: '1', height: 1, earned: '1' }],
    ['numeric balance', { address: LOWER, balance: 1, height: 1, earned: '1' }],
    ['numeric earned', { address: LOWER, balance: '1', height: 1, earned: 1 }],
    ['negative earned', { address: LOWER, balance: '1', height: 1, earned: '-1' }],
    ['fractional balance', { address: LOWER, balance: '1.5', height: 1, earned: '1' }],
    ['no height', { address: LOWER, balance: '1', earned: '1' }],
    ['not an object', 'nope'],
  ])('rejects a malformed answer (%s)', (_label, body) => {
    expect(parsePublicAddressBalance(body, LOWER)).toBeNull();
  });

  it('formats base units as WRF with 8 decimals, never via floats', () => {
    expect(wrfText('37925925888')).toBe('379.25925888 WRF');
    expect(wrfText('0')).toBe('0.00000000 WRF');
    expect(wrfText('123456789012345678901')).toBe('1,234,567,890,123.45678901 WRF');
    expect(wrfText(null)).toBeNull();
  });

  it('maps server answers: 404 off, 429 busy, 503 budget busy, other 503 / 502 / junk unavailable', async () => {
    backend({ error: 'Not found' }, 404);
    expect(await lookupPublicAddress(LOWER)).toEqual({ kind: 'off' });
    backend({ success: false, error: { code: 'RATE_LIMITED' } }, 429);
    expect(await lookupPublicAddress(LOWER)).toEqual({ kind: 'busy' });
    backend({ success: false, error: { code: 'UPSTREAM_BUDGET_EXHAUSTED' } }, 503);
    expect(await lookupPublicAddress(LOWER)).toEqual({ kind: 'busy' });
    backend({ success: false, error: { code: 'CORE4_READER_CREDENTIAL_UNCONFIGURED' } }, 503);
    expect(await lookupPublicAddress(LOWER)).toEqual({ kind: 'unavailable' });
    backend({ success: false, error: { code: 'UPSTREAM_ERROR' } }, 502);
    expect(await lookupPublicAddress(LOWER)).toEqual({ kind: 'unavailable' });
    backend({ address: LOWER, balance: 5, height: 1 });
    expect(await lookupPublicAddress(LOWER)).toEqual({ kind: 'unavailable' });
    global.fetch = jest.fn(async () => { throw new TypeError('network down'); }) as typeof fetch;
    expect(await lookupPublicAddress(LOWER)).toEqual({ kind: 'unavailable' });
  });

  it('asks a path the public edge admits (exact path, no query)', () => {
    const target = publicReadonlyApi.balance(LOWER);
    expect(target).toBe(`/api/public/balance/${LOWER}`);
    const route = edge.get.find((r: { name: string }) => r.name === 'public_balance_read') as { path: string; query: string[] };
    expect(route).toBeDefined();
    expect(new RegExp(route.path).test(target)).toBe(true);
    expect(route.query).toEqual(['']);
  });
});

describe('<AddressLookup />', () => {
  it('a payout notification link (/explore?address=0x…) opens with that address looked up', async () => {
    const calls = backend({ address: LOWER, balance: '1', height: 7, earned: '1' });
    globalThis.history.pushState({}, '', `/explore?address=${LOWER}`);
    try {
      render(<AddressLookup />);
      await waitFor(() => expect(screen.getByTestId('address-lookup-result')).toBeInTheDocument());
      expect(calls.some(c => c.url === `/api/public/balance/${LOWER}`)).toBe(true);
    } finally { globalThis.history.pushState({}, '', '/'); }
  });

  it('shows balance and earned total for a wrf address, asking the 0x form with no credential', async () => {
    const calls = backend({ address: LOWER, balance: '1250000000', height: 10114, earned: '37925925888' });
    render(<AddressLookup />);
    lookUp(`wrf${HEX}`);
    await waitFor(() => expect(screen.getByTestId('address-lookup-result')).toBeInTheDocument());
    // One balance read; the only other request is the public notification config (backend#389, no credential).
    const balanceCalls = calls.filter(c => c.url.startsWith('/api/public/balance/'));
    expect(balanceCalls).toHaveLength(1);
    expect(calls.filter(c => !c.url.startsWith('/api/public/balance/')).map(c => c.url)).toEqual(['/api/notifications/config']);
    expect(balanceCalls[0].url).toBe(`/api/public/balance/${LOWER}`);
    for (const call of calls) expect(new Headers(call.init?.headers).get('authorization')).toBeNull();
    expect(screen.getByTestId('address-lookup-balance')).toHaveTextContent('12.50000000 WRF');
    expect(screen.getByTestId('address-lookup-earned')).toHaveTextContent('Earned in total');
    expect(screen.getByTestId('address-lookup-earned')).toHaveTextContent('379.25925888 WRF');
    expect(screen.getByText(/As of block 10,114/)).toBeInTheDocument();
    expect(screen.getByText(LOWER)).toBeInTheDocument();
  });

  it('says Unavailable for the earned total when the server does not send it, and keeps the balance', async () => {
    backend({ address: LOWER, balance: '100000000', height: 7 });
    render(<AddressLookup />);
    lookUp(`0x${HEX}`);
    await waitFor(() => expect(screen.getByTestId('address-lookup-result')).toBeInTheDocument());
    expect(screen.getByTestId('address-lookup-balance')).toHaveTextContent('1.00000000 WRF');
    expect(screen.getByTestId('address-lookup-earned')).toHaveTextContent('Unavailable');
    expect(screen.getByTestId('address-lookup-earned')).not.toHaveTextContent('0.00000000');
  });

  it('refuses a malformed address without asking the server', () => {
    const calls = backend({});
    render(<AddressLookup />);
    lookUp('0x1234');
    expect(screen.getByText('Enter 0x or wrf followed by 40 hex characters.')).toBeInTheDocument();
    expect(calls).toHaveLength(0);
  });

  it('says Unavailable (switched off) when the public read is off (404)', async () => {
    backend({ error: 'Not found' }, 404);
    render(<AddressLookup />);
    lookUp(`0x${HEX}`);
    await waitFor(() => expect(screen.getByTestId('address-lookup-message')).toHaveTextContent('Unavailable'));
    expect(screen.getByTestId('address-lookup-message')).toHaveTextContent('switched off');
    expect(screen.queryByText(/WRF/)).toBeNull();
  });

  it('says Busy on a rate limit', async () => {
    backend({ success: false, error: { code: 'RATE_LIMITED' } }, 429);
    render(<AddressLookup />);
    lookUp(`0x${HEX}`);
    await waitFor(() => expect(screen.getByTestId('address-lookup-message')).toHaveTextContent('Busy'));
  });

  it('says Unavailable when the node cannot answer, never a zero', async () => {
    backend({ success: false, error: { code: 'UPSTREAM_ERROR' } }, 502);
    render(<AddressLookup />);
    lookUp(`0x${HEX}`);
    await waitFor(() => expect(screen.getByTestId('address-lookup-message')).toHaveTextContent('did not answer'));
    expect(screen.queryByText(/0\.00000000/)).toBeNull();
  });
});
