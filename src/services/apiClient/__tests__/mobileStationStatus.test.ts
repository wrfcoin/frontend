/** @jest-environment jsdom */
// W28: the web reads the signed-in wallet's own phone station from GET /weather/stations/mobile. Only the
// backend's own NOT_REGISTERED means "no phone station"; an edge or gateway 404 is an error, never that.
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { StationRegistrationService, normalizeMobileStationStatus } from '../stationRegistrationService';

const BASE = { api: 'http://api.test', weather: 'http://weather.test/api', earnings: '', governance: '', wallet: 'http://api.test', compute: '', validator: '' };
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function serviceAnswering(response: () => Response) {
  const calls: string[] = [];
  globalThis.fetch = jest.fn(async (url: RequestInfo | URL) => { calls.push(String(url)); return response(); }) as typeof fetch;
  return { service: new StationRegistrationService(BASE), calls };
}

describe('getMobileStationStatus (W28)', () => {
  const realFetch = globalThis.fetch;
  afterEach(() => { globalThis.fetch = realFetch; });

  it('returns the station id, phase and update time, and never the cell', async () => {
    const { service, calls } = serviceAnswering(() => json(200, {
      success: true, stationId: 'mob-0123abcd', status: 'submitted', cell: { latE1: 0, lonE1: 100 },
      createdAt: '2026-10-01T00:00:00.000Z', updatedAt: '2026-10-02T00:00:00.000Z',
    }));
    const status = await service.getMobileStationStatus();
    expect(status).toEqual({ stationId: 'mob-0123abcd', phase: 'submitted', updatedAt: '2026-10-02T00:00:00.000Z' });
    expect(JSON.stringify(status)).not.toMatch(/cell|latE1|lonE1/);
    expect(calls).toEqual(['http://weather.test/api/weather/stations/mobile']);
  });

  it('the backend NOT_REGISTERED 404 means no phone station (null)', async () => {
    const { service } = serviceAnswering(() =>
      json(404, { error: { code: 'NOT_REGISTERED', message: 'No mobile station is registered for this wallet' } }));
    await expect(service.getMobileStationStatus()).resolves.toBeNull();
  });

  it.each([
    ['an edge 404 with a plain body', () => new Response('Not found', { status: 404 })],
    ['a 404 with another code', () => json(404, { error: { code: 'NOT_FOUND', message: 'x' } })],
    ['401 without a wallet session', () => json(401, { error: { code: 'UNAUTHORIZED', message: 'x' } })],
  ])('%s is an error, never "not registered"', async (_label, response) => {
    const { service } = serviceAnswering(response);
    await expect(service.getMobileStationStatus()).rejects.toBeTruthy();
  });
});

describe('normalizeMobileStationStatus', () => {
  it.each([
    [{ stationId: 'mob-1', status: 'active' }],
    [{ stationId: 'mob-1', status: 'none' }],
    [{ stationId: '../x', status: 'on_chain' }],
    [{ stationId: 'x'.repeat(65), status: 'on_chain' }],
    [{ status: 'on_chain' }],
    [null],
  ])('refuses %p', (body) => {
    expect(() => normalizeMobileStationStatus(body)).toThrow();
  });

  it('drops an unparseable update time instead of showing it', () => {
    expect(normalizeMobileStationStatus({ stationId: 'mob-1', status: 'db_only', updatedAt: 'soon' }).updatedAt).toBeNull();
  });
});
