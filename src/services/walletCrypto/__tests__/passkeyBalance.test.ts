import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const { getPasskeyPublicBalance } = await import('../passkeyBalance');

const ADDR = '0xCA0E0F30E971631615883CBA3976053463C3F63E';
const LOWER = ADDR.toLowerCase();
const json = (status: number, payload: unknown) => new Response(JSON.stringify(payload), { status, headers: { 'content-type': 'application/json' } });

describe('passkey public balance read', () => {
  beforeEach(() => { (global as any).fetch = jest.fn(); });

  it('reads /api/public/balance/<lowercase address> with no Authorization header and keeps the exact digits', async () => {
    (global as any).fetch.mockResolvedValueOnce(json(200, { address: LOWER, balance: '123456789012345678901', height: 4242 }));
    await expect(getPasskeyPublicBalance(ADDR)).resolves.toEqual({ units: '123456789012345678901', height: 4242 });
    const [url, init] = (global as any).fetch.mock.calls[0];
    expect(String(url)).toMatch(new RegExp(`/api/public/balance/${LOWER}$`));
    expect(JSON.stringify(init.headers ?? {})).not.toMatch(/authorization/i);
  });

  it('accepts the chain zero for an unfunded account', async () => {
    (global as any).fetch.mockResolvedValueOnce(json(200, { address: LOWER, balance: '0', height: 1 }));
    await expect(getPasskeyPublicBalance(ADDR)).resolves.toEqual({ units: '0', height: 1 });
  });

  it.each([
    ['the route is switched off (404)', 404, { error: 'Not found' }],
    ['rate-limited (429)', 429, { success: false, error: { code: 'RATE_LIMIT_EXCEEDED' } }],
    ['the node could not answer (502)', 502, { success: false, error: { code: 'UPSTREAM_ERROR' } }],
    ['the node timed out (504)', 504, { success: false, error: { code: 'UPSTREAM_TIMEOUT' } }],
  ])('throws when %s, so nothing is shown as a balance', async (_label, status, payload) => {
    (global as any).fetch.mockResolvedValue(json(status, payload));
    await expect(getPasskeyPublicBalance(ADDR)).rejects.toThrow();
  });

  it.each([
    ['no balance', { address: LOWER, height: 3 }],
    ['a numeric balance', { address: LOWER, balance: 5, height: 3 }],
    ['a fractional balance', { address: LOWER, balance: '1.5', height: 3 }],
    ['a negative balance', { address: LOWER, balance: '-1', height: 3 }],
    ['no height', { address: LOWER, balance: '5' }],
    ['another address', { address: '0x' + '1'.repeat(40), balance: '5', height: 3 }],
  ])('rejects an answer with %s', async (_label, payload) => {
    (global as any).fetch.mockResolvedValueOnce(json(200, payload));
    await expect(getPasskeyPublicBalance(ADDR)).rejects.toThrow('PASSKEY_BALANCE_INVALID');
  });

  it('never asks the server about a malformed address', async () => {
    await expect(getPasskeyPublicBalance('0x1234')).rejects.toThrow('PASSKEY_BALANCE_BAD_ADDRESS');
    expect((global as any).fetch).not.toHaveBeenCalled();
  });
});
