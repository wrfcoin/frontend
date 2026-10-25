import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const featuresMock = { passkeyWallet: false };
await jest.unstable_mockModule('../../../config/features', () => ({ default: featuresMock, FEATURES: featuresMock }));
const { submitPasskeyTransfer, getPasskeyNonce, saveStoredPasskey, loadStoredPasskey, clearStoredPasskey } = await import('../passkeySend');

const FROM = '0xca0e0f30e971631615883cba3976053463c3f63e';
const body = { from: FROM, to: '0x1111111111111111111111111111111111111111', amount: '1000', nonce: '5', passkey_auth: { signature: '30' } } as any;
const json = (status: number, payload: unknown) => new Response(JSON.stringify(payload), { status, headers: { 'content-type': 'application/json' } });

describe('passkey send transport', () => {
  beforeEach(() => { featuresMock.passkeyWallet = false; (global as any).fetch = jest.fn(); localStorage.clear(); });

  it('fails closed with the flag OFF and never touches the network', async () => {
    await expect(submitPasskeyTransfer(body)).rejects.toThrow('PASSKEY_WALLET_UNAVAILABLE');
    await expect(getPasskeyNonce(FROM)).rejects.toThrow('PASSKEY_WALLET_UNAVAILABLE');
    expect((global as any).fetch).not.toHaveBeenCalled();
  });

  it('posts the signed body to /api/wallet/send-passkey with no Authorization header', async () => {
    featuresMock.passkeyWallet = true;
    (global as any).fetch.mockResolvedValueOnce(json(202, { hash: 'tx-1', status: 'submitted', settled: false }));
    await expect(submitPasskeyTransfer(body)).resolves.toEqual({ txHash: 'tx-1', status: 'submitted' });
    const [url, init] = (global as any).fetch.mock.calls[0];
    expect(String(url)).toMatch(/\/api\/wallet\/send-passkey$/);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual(body);
    expect(JSON.stringify(init.headers ?? {})).not.toMatch(/authorization/i);
  });

  it('surfaces the node refusal code (feature not yet active)', async () => {
    featuresMock.passkeyWallet = true;
    (global as any).fetch.mockResolvedValueOnce(json(503, { error: { code: 'FEATURE_NOT_ACTIVE', message: 'not active' } }));
    await expect(submitPasskeyTransfer(body)).rejects.toThrow('PASSKEY_NOT_ACTIVE');
  });

  it('reads the nonce from the no-login nonce route', async () => {
    featuresMock.passkeyWallet = true;
    (global as any).fetch.mockResolvedValueOnce(json(200, { address: FROM, nonce: '7' }));
    await expect(getPasskeyNonce(FROM)).resolves.toBe('7');
    expect(String((global as any).fetch.mock.calls[0][0])).toMatch(new RegExp(`/api/wallet/send-passkey/nonce/${FROM}$`));
  });

  it('stores only public credential material and round-trips it', () => {
    const rec = { credentialId: new Uint8Array([1, 2, 3]), publicKeyXY: new Uint8Array(64).fill(9), rpId: 'wallet.test' };
    saveStoredPasskey(rec);
    expect(loadStoredPasskey()).toEqual(rec);
    clearStoredPasskey();
    expect(loadStoredPasskey()).toBeNull();
  });
});
