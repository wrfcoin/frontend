/**
 * @jest-environment jsdom
 */
// A successful registration records the station under the signed-in wallet in this browser, so that wallet
// is not removed from it later. Public data only; a failed registration records nothing.
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { StationRegistrationService } from '../stationRegistrationService';
import { clearAuthToken, setAuthToken } from '../../authTokenStore';
import { stationBound } from '../../stationBoundWallets';

const url = 'https://api.example.com/api';
const serviceUrls = { api: url, weather: url, earnings: url, governance: url, wallet: url, compute: url, validator: url };
const OWNER = `0x${'ab'.repeat(20)}`;
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
const tokenFor = sub => `${b64({ alg: 'HS256' })}.${b64({ sub })}.sig`;
const request = { name: 'Backyard', latitude: 37.7, longitude: -122.4, provider: 'ambient', apiKey: 'k', appKey: 'a' };

describe('station registration records the owning wallet', () => {
  beforeEach(() => {
    localStorage.clear();
    clearAuthToken();
    global.fetch = jest.fn();
  });

  it('records the station id under the signed-in address', async () => {
    setAuthToken(tokenFor(OWNER));
    global.fetch.mockResolvedValueOnce(new Response(JSON.stringify({ success: true, stationId: 'stn_123' }), { status: 201 }));
    await new StationRegistrationService(serviceUrls).registerStation(request);
    expect(stationBound(OWNER)).toEqual({ bound: true, stationIds: ['stn_123'] });
    // Nothing but the public address and the station id is stored.
    expect(localStorage.getItem('wrfcoin.wallet.station_bound.v1')).toBe(JSON.stringify({ [OWNER]: ['stn_123'] }));
  });

  it('records nothing when the registration fails', async () => {
    setAuthToken(tokenFor(OWNER));
    global.fetch.mockResolvedValue(new Response(JSON.stringify({ error: 'nope' }), { status: 400 }));
    await expect(new StationRegistrationService(serviceUrls).registerStation(request)).rejects.toBeTruthy();
    expect(stationBound(OWNER)).toEqual({ bound: false });
  });
});
