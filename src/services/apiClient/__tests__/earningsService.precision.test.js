import { afterEach, describe, expect, it, jest } from '@jest/globals';

import { EarningsService } from '../earningsService';

const baseUrls = {
  api: 'https://api.test',
  weather: 'https://api.test',
  earnings: 'https://api.test',
  governance: 'https://api.test',
  wallet: 'https://api.test',
  compute: 'https://api.test',
  validator: 'https://api.test',
};

// The backend's real station-earnings row (backend station-detail-routes.ts).
const row = (overrides = {}) => ({
  commitId: 'ab'.repeat(32),
  rewarded: true,
  amountBaseUnits: '300000000',
  amountWrf: '3',
  blocker: null,
  finalized: true,
  height: 42,
  blockTimestamp: '2026-09-30T12:00:00.000Z',
  ...overrides,
});

// The backend's envelope: window and totals are exact summaries of the rows (station-detail-routes.ts).
function envelope(rows, { window = {}, totals = {} } = {}) {
  let sum = 0n;
  let rewarded = 0;
  for (const r of rows) {
    if (r.rewarded === true && typeof r.amountBaseUnits === 'string') {
      sum += BigInt(r.amountBaseUnits);
      rewarded += 1;
    }
  }
  return {
    earnings: rows,
    source: 'core4',
    window: { commits: rows.length, complete: true, scope: 'recent-observations', ...window },
    totals: {
      rewardedCommits: rewarded,
      unknownCommits: rows.filter((r) => r.rewarded === null).length,
      rewardedBaseUnits: sum.toString(),
      rewardedWrf: '-',
      note: 'sum over the recent window only, not a lifetime total',
      ...totals,
    },
  };
}

function respond(body) {
  global.fetch = jest.fn().mockResolvedValue(
    new Response(body, { status: 200, headers: { 'Content-Type': 'application/json' } }),
  );
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('EarningsService lossless mounted-consumer boundary', () => {
  it('preserves safe, u64, and u128 reward strings without numeric conversion', async () => {
    const u64 = '18446744073709551615';
    const u128 = '340282366920938463463374607431768211455';
    respond(JSON.stringify(envelope([
      row({ commitId: 'a1'.repeat(32), amountBaseUnits: '150000000' }),
      row({ commitId: 'a2'.repeat(32), amountBaseUnits: u64 }),
      row({ commitId: 'a3'.repeat(32), amountBaseUnits: u128 }),
    ])));

    const history = await new EarningsService(baseUrls).getStationHistory('station-1');

    expect(history.map((entry) => entry.amount)).toEqual(['150000000', u64, u128]);
    expect(global.fetch).toHaveBeenCalled();
  });

  it('rejects unsafe bare JSON integers before a consumer can see rounded digits', async () => {
    respond(`{"earnings":[${JSON.stringify(row()).slice(0, -1)},"height":340282366920938463463374607431768211455}]}`);

    await expect(new EarningsService(baseUrls).getStationHistory('station-1')).rejects.toThrow(
      /unsafe bare numeric JSON value/i,
    );
  });

  it.each([
    ['malformed', { amountBaseUnits: 'not-an-amount' }],
    ['negative', { amountBaseUnits: '-5' }],
    ['fractional', { amountBaseUnits: '1.5' }],
  ])('rejects %s exact reward input instead of substituting zero', async (_label, overrides) => {
    respond(JSON.stringify({ earnings: [row(overrides)] }));

    await expect(new EarningsService(baseUrls).getStationHistory('station-1')).rejects.toThrow(
      /amountBaseUnits/i,
    );
  });

  // frontend#442 review (SOL-C): every summary the backend supplies must be well-typed and agree
  // with the rows; a contradictory or malformed one is refused, never shown as a success.
  const unknownRow = row({ commitId: 'b2'.repeat(32), rewarded: null, amountBaseUnits: null, amountWrf: null, blocker: 'evidence_unavailable', finalized: null, height: null, blockTimestamp: null });
  const rows = () => [row({ commitId: 'b1'.repeat(32), amountBaseUnits: '200000000' }), unknownRow];
  it.each([
    ['a numeric rewardedBaseUnits', { totals: { rewardedBaseUnits: 1 } }, /totals/],
    ['a numeric rewardedBaseUnits even when it equals the sum', { totals: { rewardedBaseUnits: 200000000 } }, /totals/],
    ['a contradictory rewardedBaseUnits string', { totals: { rewardedBaseUnits: '1' } }, /totals/],
    ['a rewardedBaseUnits that is not an integer string', { totals: { rewardedBaseUnits: '2e8' } }, /totals/],
    ['a contradictory rewardedCommits', { totals: { rewardedCommits: 99 } }, /totals/],
    ['a contradictory unknownCommits', { totals: { unknownCommits: 99 } }, /totals/],
    ['a non-integer unknownCommits', { totals: { unknownCommits: '1' } }, /totals/],
    ['a contradictory window.commits', { window: { commits: 99 } }, /window/],
    ['a non-boolean window.complete', { window: { complete: 'yes' } }, /window/],
    ['another window scope', { window: { scope: 'lifetime' } }, /window/],
  ])('refuses %s', async (_label, override, message) => {
    respond(JSON.stringify(envelope(rows(), override)));
    await expect(new EarningsService(baseUrls).getStationSummary('station-1')).rejects.toThrow(message);
  });

  it.each([['totals', 'totals'], ['window', 'window']])('refuses a response without %s', async (_label, key) => {
    const body = envelope(rows());
    delete body[key];
    respond(JSON.stringify(body));
    await expect(new EarningsService(baseUrls).getStationSummary('station-1')).rejects.toThrow(/window\/totals are missing/);
  });

  it('accepts the exact envelope: one proven reward, one unreadable observation', async () => {
    respond(JSON.stringify(envelope(rows(), { window: { complete: false } })));
    const summary = await new EarningsService(baseUrls).getStationSummary('station-1');
    expect(summary.window).toEqual({ commits: 2, complete: false, rewardedCommits: 1, unknownCommits: 1, rewardedBaseUnits: '200000000' });
  });

  it('there is no per-period bonus breakdown on this testnet: it reports unavailable, never invented', async () => {
    global.fetch = jest.fn();
    await expect(new EarningsService(baseUrls).getStationEarnings('station-1')).rejects.toThrow(
      /not available on this testnet/i,
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
