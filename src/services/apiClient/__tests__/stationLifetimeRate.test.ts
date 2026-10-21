import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { EarningsService, StationEarningsUnavailableError } from '../earningsService';
import bodies from './fixtures/stationEarningsProducerBodies.json';

// Bodies are the EXACT output of backend GET /api/stations/:id/earnings
// (server/routes/station-detail-routes.ts, backend#1232 lifetime + rate), dumped from the route
// under test, not hand-written: stationSole (sole holder, 4 rewarded commits 1h apart),
// addressShared (3 stations share the owner address), lifetimeUnprovenRateNull (node 503, 1 commit).
const baseUrls = {
  api: 'https://api.test', weather: 'https://api.test', earnings: 'https://api.test',
  governance: 'https://api.test', wallet: 'https://api.test', compute: 'https://api.test', validator: 'https://api.test',
};
const respond = (body: unknown) => {
  global.fetch = jest.fn<typeof fetch>().mockResolvedValue(
    new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } }),
  );
};
afterEach(() => { jest.restoreAllMocks(); });
const summary = () => new EarningsService(baseUrls).getStationSummary('st_123456abcdef');

describe('station summary reads the backend lifetime and rate', () => {
  it('sole holder: allTime and lifetime carry the exact 8-decimal base units; rate is per day', async () => {
    respond(bodies.stationSole);
    const s = await summary();
    expect(s.allTime).toBe('123456789012345678');
    expect(s.lifetime).toEqual({ scope: 'station', stationsSharingAddress: null, baseUnits: '123456789012345678' });
    expect(s.rate).toEqual({ baseUnitsPerDay: '2400000024', windowCommits: 4, windowSeconds: 10800 });
    expect(s.currentRate).toBeNull(); // the legacy per-hour slot is never reused for a per-day value
  });

  it('shared address: the total is labelled scope address and is NOT presented as this station\'s allTime', async () => {
    respond(bodies.addressShared);
    const s = await summary();
    expect(s.allTime).toBeNull();
    expect(s.lifetime).toEqual({ scope: 'address', stationsSharingAddress: 3, baseUnits: '500000000' });
  });

  it('anonymous shared address: the body omits the count and it reads as scope address with a null count', async () => {
    const { stationsSharingAddress: _n, ...anon } = bodies.addressShared.lifetime as Record<string, unknown>;
    respond({ ...bodies.addressShared, lifetime: anon });
    const s = await summary();
    expect(s.lifetime).toEqual({ scope: 'address', stationsSharingAddress: null, baseUnits: '500000000' });
    expect(s.allTime).toBeNull();
  });

  it('a 200 with lifetime/rate unproven stays unavailable (null), never 0', async () => {
    respond(bodies.lifetimeUnprovenRateNull);
    const s = await summary();
    expect(s.lifetime).toBeNull();
    expect(s.rate).toBeNull();
    expect(s.allTime).toBeNull();
    expect(bodies.lifetimeUnprovenRateNull.fieldsUnavailable).toEqual(['lifetime', 'rate']);
  });

  it('the pre-#1232 body (no lifetime/rate keys) still reads, with both unavailable', async () => {
    const { lifetime: _l, rate: _r, fieldsUnavailable: _f, ...legacy } = bodies.stationSole as Record<string, unknown>;
    respond(legacy);
    const s = await summary();
    expect(s.lifetime).toBeNull();
    expect(s.rate).toBeNull();
    expect(s.window?.rewardedCommits).toBe(4);
  });

  it.each([
    ['float baseUnits', { scope: 'station', baseUnits: 12.5 }],
    ['decimal string', { scope: 'station', baseUnits: '12.5' }],
    ['negative', { scope: 'station', baseUnits: '-1' }],
    ['unknown scope', { scope: 'global', baseUnits: '1' }],
    ['address scope claiming one sharer', { scope: 'address', stationsSharingAddress: 1, baseUnits: '1' }],
  ])('refuses a malformed lifetime (%s) as unavailable', async (_n, lifetime) => {
    respond({ ...bodies.stationSole, lifetime });
    expect((await summary()).lifetime).toBeNull();
  });

  it.each([
    ['incomplete window', { ...bodies.stationSole.rate, complete: false }],
    ['zero span', { ...bodies.stationSole.rate, windowSeconds: 0 }],
    ['float rate', { ...bodies.stationSole.rate, baseUnitsPerDay: '1.5' }],
  ])('refuses a malformed rate (%s) as unavailable', async (_n, rate) => {
    respond({ ...bodies.stationSole, rate });
    expect((await summary()).rate).toBeNull();
  });

  it('the earnings-unavailable stub (200 with unavailable) still throws StationEarningsUnavailableError', async () => {
    respond({ earnings: [], source: null, unavailable: ['earnings'], reason: 'core4 is unavailable, so no reward evidence can be read' });
    await expect(summary()).rejects.toBeInstanceOf(StationEarningsUnavailableError);
  });

  it('history rows are unchanged by the additive fields', async () => {
    respond(bodies.stationSole);
    const history = await new EarningsService(baseUrls).getStationHistory('st_123456abcdef');
    expect(history).toHaveLength(4);
    expect(history[0].amount).toBe('100000001');
  });
});
