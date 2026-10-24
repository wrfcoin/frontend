import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { clearAuthToken, setAuthToken } from '../../authTokenStore';
import { shouldAttachBearer } from '../authScope';
import { ApiClient } from '../client';
import { EarningsService } from '../earningsService';

const ADDRESS = `0x${'ab'.repeat(20)}`;
const TOKEN = 'session-token';

function authorizationOf(call) {
  const headers = call[1].headers;
  return headers.Authorization;
}

describe('Bearer scope', () => {
  beforeEach(() => {
    global.fetch = jest.fn(async () => new Response(JSON.stringify({ success: true, data: {} }), { status: 200 }));
    setAuthToken(TOKEN);
  });

  afterEach(() => {
    clearAuthToken();
  });

  it('sends no Authorization on a public read', async () => {
    const client = new ApiClient({ baseUrl: 'https://api.example.com/api' });
    await client.get('/weather/stations');
    await client.get('/blockchain/status');
    await client.get('/weather/stations/st_0123456789ab/ownership');

    expect(global.fetch).toHaveBeenCalledTimes(3);
    for (const call of global.fetch.mock.calls) {
      expect(authorizationOf(call)).toBeUndefined();
    }
  });

  it.each([
    ['GET', `/wallet/${ADDRESS}`],
    ['GET', `/wallet/${ADDRESS}?x=1`],
    ['GET', `/wallet/${ADDRESS}/transactions?limit=10&offset=0`],
    ['GET', `/wallet/${ADDRESS}/nonce`],
    ['POST', '/wallet/send'],
    ['GET', '/weather/stations/mobile'],
    ['POST', '/weather/stations'],
    ['POST', '/stations'],
    ['POST', '/weather/stations/verify-key'],
    ['POST', '/stations/verify-key'],
    ['GET', '/weather/stations/st_0123456789ab/reward-progress'],
    ['GET', '/stations/st_0123456789ab/earnings'],
    ['GET', '/weather/stations/st_0123456789ab/earnings'],
    ['GET', '/mining/node-stats'],
    ['POST', '/governance/proposals'],
    ['POST', '/governance/proposals/p-1/vote'],
    ['POST', '/governance/delegate'],
    ['POST', '/compute/tasks'],
  ])('sends the Bearer token on %s %s', async (method, path) => {
    const client = new ApiClient({ baseUrl: 'https://api.example.com/api' });
    if (method === 'GET') await client.get(path);
    else await client.post(path, {});

    expect(authorizationOf(global.fetch.mock.calls[0])).toBe(`Bearer ${TOKEN}`);
  });

  it('sends the token on the station earnings read so the owner keeps the lifetime total', async () => {
    const earnings = new EarningsService({ earnings: 'https://api.example.com/api' });
    await earnings.getStationRewardEvidence('st_0123456789ab').catch(() => undefined);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch.mock.calls[0][0]).toBe('https://api.example.com/api/stations/st_0123456789ab/earnings');
    expect(authorizationOf(global.fetch.mock.calls[0])).toBe(`Bearer ${TOKEN}`);
  });

  it('attaches the token for a service base URL that already carries /wallet', async () => {
    const client = new ApiClient({ baseUrl: 'https://api.example.com/api/wallet' });
    await client.get(`/${ADDRESS}/nonce`);
    await client.post('/send', {});

    for (const call of global.fetch.mock.calls) {
      expect(authorizationOf(call)).toBe(`Bearer ${TOKEN}`);
    }
  });

  it.each([
    ['GET', '/api/wallet/0x123'],
    ['GET', `/api/wallet/${ADDRESS}x`],
    ['GET', `/api/wallet/${ADDRESS}/transactions/extra`],
    ['GET', `/api/walletx/${ADDRESS}`],
    ['GET', `/api/x/wallet/${ADDRESS}`],
    ['GET', `/api/wallet/${ADDRESS}/other`],
    ['POST', '/api/wallet/sendx'],
    ['GET', '/api/wallet/send'],
    ['GET', '/api/weather/stations'],
    ['GET', '/api/weather/stations/mobile/challenge'],
    ['GET', '/api/weather/stations/mobilex'],
    ['POST', '/api/weather/stations/mobile'],
    ['GET', '/api/governance/proposals'],
    ['POST', '/api/compute/tasksx'],
    ['GET', '/api/stations/st_0123456789ab/earnings/extra'],
    ['GET', '/api/stations/a/b/earnings'],
    ['POST', '/api/stations/st_0123456789ab/earnings'],
    ['GET', '/api/mining/node-statsx'],
  ])('does not attach the token to %s %s', (method, path) => {
    expect(shouldAttachBearer(method, `https://api.example.com${path}`)).toBe(false);
    expect(shouldAttachBearer(method, path)).toBe(false);
  });

  it('does not match an allowlisted path hidden in a query or fragment', () => {
    expect(shouldAttachBearer('GET', `/api/weather/stations?next=/api/wallet/${ADDRESS}`)).toBe(false);
    expect(shouldAttachBearer('GET', `/api/weather/stations#/api/wallet/${ADDRESS}`)).toBe(false);
  });
});
