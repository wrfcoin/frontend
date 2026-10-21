// S3: the own-wallet reads must match the public edge grammar byte for byte (infra
// testnet/edge/public_onboarding.caddy, pinned in public-edge-allowlist.json) and carry the Bearer token.
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { WalletService } from '../walletService';
import { clearAuthToken, setAuthToken } from '../../authTokenStore';

const edge = JSON.parse(readFileSync('src/routes/__fixtures__/public-edge-allowlist.json', 'utf8'));
const urls = {
  api: 'https://edge.test', weather: 'https://edge.test', earnings: 'https://edge.test',
  governance: 'https://edge.test', wallet: 'https://edge.test/api', compute: 'https://edge.test',
  validator: 'https://edge.test',
};
const ADDRESS = `0x${'ab12'.repeat(10)}`;

const admitted = (target, headers) => {
  const url = new URL(target);
  const query = url.search.replace(/^\?/, '');
  return edge.get.some(route => new RegExp(route.path).test(url.pathname)
    && (route.query === null || route.query.includes(query)
      || (route.queryPattern !== undefined && new RegExp(route.queryPattern).test(query)))
    && (!route.requiresBearer || /^Bearer .+/.test(headers.Authorization ?? '')));
};

let calls;
beforeEach(() => {
  calls = [];
  clearAuthToken();
  global.fetch = jest.fn(async (input, init = {}) => {
    calls.push({ url: String(input), headers: { ...(init.headers ?? {}) } });
    const body = String(input).includes('/transactions')
      ? { items: [], creditItems: [] }
      : { address: ADDRESS, balance: '1' };
    return new Response(JSON.stringify(body), { status: 200 });
  });
});

describe('own-wallet reads against the edge grammar', () => {
  it('balance read is the exact path with an empty query and a Bearer header', async () => {
    setAuthToken('tok-123');
    await new WalletService(urls).getBalance(ADDRESS);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(`https://edge.test/api/wallet/${ADDRESS}`);
    expect(calls[0].headers.Authorization).toBe('Bearer tok-123');
    expect(admitted(calls[0].url, calls[0].headers)).toBe(true);
  });

  it('history read is limit then offset, nothing else, with a Bearer header', async () => {
    setAuthToken('tok-123');
    await new WalletService(urls).getWalletHistory(ADDRESS, { limit: 10, offset: 0 });
    expect(calls[0].url).toBe(`https://edge.test/api/wallet/${ADDRESS}/transactions?limit=10&offset=0`);
    expect(calls[0].headers.Authorization).toBe('Bearer tok-123');
    expect(admitted(calls[0].url, calls[0].headers)).toBe(true);
  });

  it('the legacy getTransactions default is also an admitted query', async () => {
    setAuthToken('tok-123');
    await new WalletService(urls).getTransactions(ADDRESS);
    expect(calls[0].url).toBe(`https://edge.test/api/wallet/${ADDRESS}/transactions?limit=20&offset=0`);
    expect(admitted(calls[0].url, calls[0].headers)).toBe(true);
  });

  it('without a token the edge would refuse the call (the grammar check fails closed)', async () => {
    await new WalletService(urls).getBalance(ADDRESS);
    expect(admitted(calls[0].url, calls[0].headers)).toBe(false);
  });

  it.each([[0], [51], [1.5], [-1], [Number.NaN]])('refuses limit %s before any request', async limit => {
    await expect(new WalletService(urls).getWalletHistory(ADDRESS, { limit })).rejects.toThrow(RangeError);
    expect(calls).toHaveLength(0);
  });

  it.each([[-1], [1_000_000], [2.5]])('refuses offset %s before any request', async offset => {
    await expect(new WalletService(urls).getWalletHistory(ADDRESS, { offset })).rejects.toThrow(RangeError);
    expect(calls).toHaveLength(0);
  });

  it('the edge pattern admits the extremes and rejects reordered or extra params', () => {
    const route = edge.get.find(r => r.name === 'public_wallet_transactions');
    const re = new RegExp(route.queryPattern);
    expect(re.test('limit=1&offset=0')).toBe(true);
    expect(re.test('limit=50&offset=999999')).toBe(true);
    expect(re.test('offset=0&limit=10')).toBe(false);
    expect(re.test('limit=10&offset=0&creditLimit=5')).toBe(false);
    expect(re.test('limit=51&offset=0')).toBe(false);
  });
});

describe('history and reward parsing keeps only what the node reports', () => {
  it('reads schema v2 items and credit items with exact base units', async () => {
    global.fetch = jest.fn(async () => new Response(JSON.stringify({
      items: [{ eventId: 'e1', timestamp: '2026-10-15T00:00:00Z', kind: 'transfer', from: ADDRESS,
        amountBaseUnits: '9000000000000000001', direction: 'sent', counterparty: '0xcc' }],
      creditItems: [{ eventId: 'contribution:7', kind: 'weather_reward', settlement: 'paid',
        direction: 'received', amountBaseUnits: '250000000', timestamp: '2026-10-15T01:00:00Z' }],
    }), { status: 200 }));
    const page = await new WalletService(urls).getWalletHistory(ADDRESS);
    expect(page.items[0]).toMatchObject({ amount: '9000000000000000001', direction: 'sent', counterparty: '0xcc' });
    expect(page.creditItems[0]).toMatchObject({ amount: '250000000', type: 'weather_reward', settlement: 'paid' });
  });

  it('an unreported amount or time is null, never a default', async () => {
    global.fetch = jest.fn(async () => new Response(JSON.stringify({
      items: [{ txId: 't1', from: '0xdd', amount: null }],
    }), { status: 200 }));
    const [row] = (await new WalletService(urls).getWalletHistory(ADDRESS)).items;
    expect(row.amount).toBeNull();
    expect(row.timestamp).toBeNull();
    expect(row.direction).toBe('received');
  });

  it('reward totals: reported strings kept exactly, unreported or malformed become null', async () => {
    global.fetch = jest.fn(async () => new Response(JSON.stringify({
      address: ADDRESS, balance: '5', earned_balance_total: '123456789012345678901',
      weatherRewards: '0', weatherRewardsPending: '1.5', weatherRewardsUnavailable: null,
    }), { status: 200 }));
    const wallet = await new WalletService(urls).getBalance(ADDRESS);
    expect(wallet.earnedBalanceTotal).toBe('123456789012345678901');
    expect(wallet.weatherRewards).toBe('0');
    expect(wallet.weatherRewardsPending).toBeNull();
    expect(wallet.weatherRewardsUnavailable).toBeNull();
  });
});

describe('legacy getTransactions compatibility (review findings 1 and 2)', () => {
  const PEER = `0x${'cd34'.repeat(10)}`;
  const respond = body => { global.fetch = jest.fn(async () => new Response(JSON.stringify(body), { status: 200 })); };
  const txs = () => new WalletService(urls).getTransactions(ADDRESS);

  it('keeps explicit legacy confirmed and failed statuses (transactions fallback)', async () => {
    respond({ transactions: [
      { id: 'a', amount: '1', status: 'confirmed', timestamp: 't', from: PEER, to: ADDRESS },
      { id: 'b', amount: '1', status: 'failed', timestamp: 't', from: ADDRESS, to: PEER },
      { id: 'c', amount: '1', status: 'weird', timestamp: 't', from: ADDRESS, to: PEER },
    ] });
    expect((await txs()).map(r => r.status)).toEqual(['confirmed', 'failed', 'weird']);
  });

  it('maps v2 settlement into the legacy vocabulary the feed understands', async () => {
    respond({ items: [
      { eventId: 'e1', amountBaseUnits: '5', settlement: 'included', direction: 'sent', counterparty: PEER, timestamp: 't' },
      { eventId: 'e2', amountBaseUnits: '5', settlement: 'paid', direction: 'received', counterparty: PEER, timestamp: 't' },
      { eventId: 'e3', amountBaseUnits: '5', settlement: null, direction: 'sent', counterparty: PEER, timestamp: 't' },
    ] });
    expect((await txs()).map(r => r.status)).toEqual(['confirmed', 'confirmed', 'pending']);
  });

  it('keeps from/to of v1 items and the legacy transactions fallback', async () => {
    respond({ items: [{ txId: 'x', amount: '7', from: ADDRESS, to: PEER, blockHeight: 9 }] });
    expect(await txs()).toMatchObject([{ id: 'x', from: ADDRESS, to: PEER, status: 'confirmed' }]);
    respond({ transactions: [{ id: 'y', amount: '7', from: PEER, to: ADDRESS }] });
    expect(await txs()).toMatchObject([{ id: 'y', from: PEER, to: ADDRESS, status: 'pending' }]);
  });

  it('derives the counterparty from from/to relative to the owner; self and unknown are explicit', async () => {
    respond({ items: [
      { txId: '1', amount: '1', from: ADDRESS, to: PEER },
      { txId: '2', amount: '1', from: PEER, to: ADDRESS },
      { txId: '3', amount: '1', from: ADDRESS, to: ADDRESS.toUpperCase().replace('0X', '0x') },
      { txId: '4', amount: '1', from: null, to: PEER },
    ] });
    const page = await new WalletService(urls).getWalletHistory(ADDRESS);
    expect(page.items.map(i => [i.direction, i.counterparty])).toEqual([
      ['sent', PEER], ['received', PEER], ['self', null], ['unknown', null],
    ]);
  });
});

describe('window metadata (review finding 4)', () => {
  it('retains completeness, cursor and window start', async () => {
    global.fetch = jest.fn(async () => new Response(JSON.stringify({
      items: [], creditItems: [], complete: false, creditNextCursor: 'abc', windowStartHeight: 120, totalInWindow: 0,
    }), { status: 200 }));
    expect(await new WalletService(urls).getWalletHistory(ADDRESS)).toMatchObject({
      complete: false, creditNextCursor: 'abc', windowStartHeight: 120, totalInWindow: 0,
    });
  });
  it('unreported completeness is null, not true', async () => {
    global.fetch = jest.fn(async () => new Response(JSON.stringify({ items: [] }), { status: 200 }));
    expect((await new WalletService(urls).getWalletHistory(ADDRESS)).complete).toBeNull();
  });
});
