import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { clearAuthToken, setAuthToken } from '../../authTokenStore';
import { StationRegistrationService } from '../stationRegistrationService';

// The live edge proxies GET /api/weather/stations/mine and POST .../ownership-proof ONLY with an
// `Authorization: Bearer` header (infra public_onboarding.caddy @station_mine, @station_ownership_proof);
// without one they 404. The service calls themselves must carry the session token.
const TOKEN = 'session-token';
const authOf = call => call[1].headers.Authorization;
const BASE = 'https://api.example.com/api';
const svcOf = () => new StationRegistrationService({ weather: BASE, api: BASE, wallet: BASE });

describe('station owner calls carry the wallet session', () => {
  beforeEach(() => { setAuthToken(TOKEN); });
  afterEach(() => { clearAuthToken(); });

  it('"Your stations" (GET /weather/stations/mine) sends the Bearer token', async () => {
    global.fetch = jest.fn(async () => new Response(JSON.stringify({ success: true, truncated: false, stations: [] }), { status: 200 }));
    const svc = svcOf();
    await svc.getMyStations();
    expect(global.fetch.mock.calls[0][0]).toBe('https://api.example.com/api/weather/stations/mine');
    expect(authOf(global.fetch.mock.calls[0])).toBe(`Bearer ${TOKEN}`);
  });

  it('signing for a station (POST .../ownership-proof) sends the Bearer token', async () => {
    global.fetch = jest.fn(async () => new Response(JSON.stringify({ success: true }), { status: 200 }));
    await svcOf().submitStationOwnershipProof('st_0123456789ab', { owner_pubkey: 'aa', owner_signature: 'bb' });
    expect(global.fetch.mock.calls[0][0]).toBe(`${BASE}/weather/stations/st_0123456789ab/ownership-proof`);
    expect(authOf(global.fetch.mock.calls[0])).toBe(`Bearer ${TOKEN}`);
  });
});
