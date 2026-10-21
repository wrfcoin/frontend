import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { EarningsService, StationEarningsUnavailableError } from '../earningsService';
import { STATION_QUALITY_NOT_LIVE, WeatherService } from '../weatherService';

const baseUrls = {
  api: 'https://api.test', weather: 'https://api.test', earnings: 'https://api.test',
  governance: 'https://api.test', wallet: 'https://api.test', compute: 'https://api.test', validator: 'https://api.test',
};

function json(body: unknown) {
  return Promise.resolve(new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  }));
}

afterEach(() => {
  jest.restoreAllMocks();
});

// Shape copied from backend origin/main server/routes/station-detail-routes.ts
// (GET /api/stations/:stationId/earnings): per-observation reward evidence
// from core4 over a recent window, with window totals (not a lifetime sum).
const PROVEN = {
  commitId: 'a1'.repeat(32), rewarded: true, amountBaseUnits: '250000000', amountWrf: '2.5',
  blocker: null, finalized: true, height: 120, blockTimestamp: new Date(Date.now() - 3_600_000).toISOString(),
};
const NOT_FINAL = { ...PROVEN, commitId: 'a2'.repeat(32), amountBaseUnits: '100000000', amountWrf: '1', finalized: false, height: 121 };
const PENDING = {
  commitId: 'b1'.repeat(32), rewarded: false, amountBaseUnits: null, amountWrf: null,
  blocker: 'attestation_pending', finalized: false, height: null, blockTimestamp: null,
};
const UNKNOWN = {
  commitId: 'c1'.repeat(32), rewarded: null, amountBaseUnits: null, amountWrf: null,
  blocker: 'evidence_unavailable', finalized: null, height: null, blockTimestamp: null,
};
function realEarningsBody(rows: Array<Record<string, unknown>>, complete = true) {
  let total = 0n;
  let rewarded = 0;
  for (const row of rows) {
    if (row.rewarded === true && typeof row.amountBaseUnits === 'string') {
      total += BigInt(row.amountBaseUnits);
      rewarded += 1;
    }
  }
  return {
    earnings: rows,
    source: 'core4',
    window: { commits: rows.length, complete, scope: 'recent-observations' },
    totals: {
      rewardedCommits: rewarded,
      unknownCommits: rows.filter((row) => row.rewarded === null).length,
      rewardedBaseUnits: total.toString(),
      rewardedWrf: '-',
      note: 'sum over the recent window only, not a lifetime total',
    },
  };
}

describe('station earnings: the backend\'s real reward-evidence window', () => {
  it('history is the proven rewards; the summary is a recent-window total, never lifetime', async () => {
    global.fetch = jest.fn(() => json(realEarningsBody([PROVEN, NOT_FINAL, PENDING, UNKNOWN], false))) as typeof fetch;
    const earnings = new EarningsService(baseUrls);

    const evidence = await earnings.getStationRewardEvidence('station-1');
    expect(evidence.entries.map((e) => e.rewarded)).toEqual([true, true, false, null]);
    expect(evidence.entries[2]).toMatchObject({ blocker: 'attestation_pending', amountBaseUnits: null });
    expect(evidence.window).toEqual({
      commits: 4, complete: false, rewardedCommits: 2, unknownCommits: 1, rewardedBaseUnits: '350000000',
    });

    const history = await earnings.getStationHistory('station-1');
    expect(history).toEqual([
      { id: PROVEN.commitId, stationId: 'station-1', timestamp: PROVEN.blockTimestamp, amount: '250000000', rewardType: 'Reward' },
      { id: NOT_FINAL.commitId, stationId: 'station-1', timestamp: NOT_FINAL.blockTimestamp, amount: '100000000', rewardType: 'Reward (not yet final)' },
    ]);

    const summary = await earnings.getStationSummary('station-1');
    expect(summary).toMatchObject({ today: '350000000', thisWeek: '350000000', thisMonth: '350000000', allTime: null, currentRate: null });
    expect(summary.window?.rewardedBaseUnits).toBe('350000000');
  });

  it('an amount on a non-rewarded row is ignored; totals that disagree with the rows are refused', async () => {
    global.fetch = jest.fn(() => json(realEarningsBody([{ ...PENDING, amountBaseUnits: '999' }]))) as typeof fetch;
    expect((await new EarningsService(baseUrls).getStationRewardEvidence('s')).entries[0].amountBaseUnits).toBeNull();

    const body = realEarningsBody([PROVEN]);
    body.totals.rewardedBaseUnits = '1';
    global.fetch = jest.fn(() => json(body)) as typeof fetch;
    await expect(new EarningsService(baseUrls).getStationSummary('s')).rejects.toThrow(/do not match/);
  });

  it('rows without a hash commit id or a tri-state rewarded flag are refused', async () => {
    for (const bad of [{ ...PROVEN, commitId: 'e1' }, { ...PROVEN, rewarded: 'yes' }]) {
      global.fetch = jest.fn(() => json(realEarningsBody([bad]))) as typeof fetch;
      await expect(new EarningsService(baseUrls).getStationHistory('s')).rejects.toThrow(/commitId|rewarded/);
    }
  });
});

describe('B1 station read contract', () => {
  it('uses only the four mounted station routes and preserves exact base-unit strings', async () => {
    const requested: string[] = [];
    global.fetch = jest.fn(async (input: string | URL | Request) => {
      const url = String(input);
      requested.push(url);
      if (url.includes('/observations?limit=1')) return json({ observations: [{ timestamp: '2026-09-20T00:00:00Z', temperatureC: 12.5 }], source: 'core4' });
      if (url.endsWith('/quality')) return json({ overall: 91, dimensions: [], advisory: true, source: 'backend-db' });
      if (url.endsWith('/submissions')) return json({ submissions: [{ id: 1, createdAt: '2026-09-20T00:00:00Z', status: 'revealed', chainStatus: 'revealed_attested' }], source: 'backend-db' });
      if (url.includes('/earnings')) return json(realEarningsBody([{ ...PROVEN, amountBaseUnits: '18446744073709551615' }]));
      throw new Error(`unexpected dead route ${url}`);
    }) as typeof fetch;

    const weather = new WeatherService(baseUrls);
    const earnings = new EarningsService(baseUrls);
    await weather.getLatestObservations('station/one');
    await weather.getStationQuality('station/one');
    await weather.getSubmissionLog('station/one');
    const rows = await earnings.getStationHistory('station/one');

    expect(rows[0].amount).toBe('18446744073709551615');
    expect(requested).toEqual([
      'https://api.test/stations/station%2Fone/observations?limit=1',
      'https://api.test/stations/station%2Fone/quality',
      'https://api.test/stations/station%2Fone/submissions',
      'https://api.test/stations/station%2Fone/earnings',
    ]);
    expect(requested.join('\n')).not.toMatch(/\/weather\/stations\/station%2Fone\/(observations|quality|submissions)|\/earnings\/stations|\/rewards\/history/);
  });

  it('turns the backend honest-gap envelope into a typed not-live state', async () => {
    global.fetch = jest.fn(() => json({
      earnings: [], source: null, unavailable: ['earnings'],
      reason: 'no per-station reward ledger is exposed by core4 or persisted by backend',
    })) as typeof fetch;

    await expect(new EarningsService(baseUrls).getStationHistory('station-1'))
      .rejects.toBeInstanceOf(StationEarningsUnavailableError);
  });

  // Body copied from backend origin/main server/routes/weather-routes.js
  // (GET /api/weather/stations without coordinates, anonymous caller) and the
  // row mapping in server/services/station-registration-service.ts.
  it('unwraps the real /weather/stations envelope', async () => {
    global.fetch = jest.fn(() => json({
      stations: [
        { id: 'st-1', stationId: 'st-1', name: 'Ridge', latitude: 46.8, longitude: -121.7, location: 'Ridge, WA', status: 'active', qualityScore: 0.93 },
        { id: 'st-2', stationId: 'st-2', name: 'Valley', latitude: null, longitude: null, location: null, status: 'inactive', qualityScore: null },
      ],
      total: 2,
      hasMore: false,
      nextCursor: null,
      source: 'wrfcoin-contributors',
    })) as typeof fetch;

    const stations = await new WeatherService(baseUrls).getStations();

    expect(stations).toHaveLength(2);
    expect(stations[0]).toMatchObject({ id: 'st-1', name: 'Ridge', status: 'live', latitude: 46.8, longitude: -121.7 });
    expect(stations[1]).toMatchObject({ id: 'st-2', status: 'offline' });
  });

  it('fails loudly instead of guessing when the stations body has no list', async () => {
    global.fetch = jest.fn(() => json({ total: 0, source: 'wrfcoin-contributors' })) as typeof fetch;

    await expect(new WeatherService(baseUrls).getStations())
      .rejects.toThrow('weather stations response has no stations list');
  });

  // station-detail-routes.ts: a quality row whose score is null or not numeric
  // is sent as overall: null / score: null via nullableNumber().
  it('treats a null overall quality score as not live', async () => {
    global.fetch = jest.fn(() => json({
      overall: null, confidence: null, dimensions: [{ key: 'range', label: 'range', score: null }],
      advisory: true, advisoryTier: null, source: 'backend-db',
    })) as typeof fetch;

    await expect(new WeatherService(baseUrls).getStationQuality('station-1'))
      .rejects.toThrow(STATION_QUALITY_NOT_LIVE);
  });

  it('drops null quality dimensions instead of failing the whole card', async () => {
    global.fetch = jest.fn(() => json({
      overall: 0.81, confidence: 0.5,
      dimensions: [{ key: 'range', label: 'range', score: 0.9 }, { key: 'freshness', label: 'freshness', score: null }],
      advisory: true, advisoryTier: null, source: 'backend-db',
    })) as typeof fetch;

    const quality = await new WeatherService(baseUrls).getStationQuality('station-1');

    expect(quality.overall).toBe(0.81);
    expect(quality.dimensions.map(d => d.key)).toEqual(['range']);
  });

  // chainStatus values are core4 contribution_status strings
  // (native-chain launch_api routes/transactions.rs); null means core4 was
  // unreachable and the backend DB row is the only signal.
  it('maps core4 contribution statuses to submission success', async () => {
    global.fetch = jest.fn(() => json({
      submissions: [
        { id: 1, commitmentHash: 'h1', status: 'committed', chainStatus: 'reward_finalized', createdAt: '2026-09-20T00:00:00Z', revealDeadline: null },
        { id: 2, commitmentHash: 'h2', status: 'revealed', chainStatus: 'revealed_attested', createdAt: '2026-09-20T00:00:00Z', revealDeadline: null },
        { id: 3, commitmentHash: 'h3', status: 'revealed', chainStatus: 'revealed_pending_attestation', createdAt: '2026-09-20T00:00:00Z', revealDeadline: null },
        { id: 4, commitmentHash: 'h4', status: 'committed', chainStatus: 'committed_pending_reveal', createdAt: '2026-09-20T00:00:00Z', revealDeadline: null },
        { id: 5, commitmentHash: 'h5', status: 'revealed', chainStatus: null, createdAt: '2026-09-20T00:00:00Z', revealDeadline: null },
      ],
      source: 'backend-db', limit: 50, offset: 0,
    })) as typeof fetch;

    const log = await new WeatherService(baseUrls).getSubmissionLog('station-1');

    expect(log.map(entry => entry.success)).toEqual([true, true, false, false, true]);
    expect(log[2].summary).toBe('revealed_pending_attestation');
  });
});
