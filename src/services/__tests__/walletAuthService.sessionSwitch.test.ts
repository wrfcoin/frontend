// One session, one wallet, at the auth service: the order of a passkey login, what a failure leaves behind,
// and late answers for the old wallet (a refresh or a device sign-in in flight) never undoing a switch.
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

const state = { active: true, identity: '0x' + 'aa'.repeat(20) };
const order: string[] = [];
const disconnect = jest.fn(async () => { order.push('lock'); state.active = false; return true; });
await jest.unstable_mockModule('../walletProviders/WalletProviderManager.js', () => ({
  walletProviderManager: {
    disconnect,
    getActiveProvider: () => (state.active ? {} : null),
    getLoginIdentity: () => (state.active ? { address: state.identity } : null),
  },
}));
const { clearAuthToken, getAuthToken, setAuthToken } = await import('../authTokenStore');
const { StaleWalletSessionError, WalletAuthService, passkeyLoginMessage } = await import('../walletAuthService');
const { bytesToHex, passkeyRecordAddress } = await import('../walletCrypto/passkey');

const ON = { VITE_ENABLE_PASSKEY_WALLET: 'true', VITE_ENABLE_MULTI_WALLET: 'true' };
const setEnv = (env: Record<string, string> | undefined) => { (globalThis as { __VITE_ENV__?: unknown }).__VITE_ENV__ = env; };
const EXPECT = { origin: 'https://wrfcoin.com', chainId: '888', network: 'testnet' };
const RECORD = { credentialId: Uint8Array.of(1, 2, 3), publicKeyXY: Uint8Array.from({ length: 64 }, (_, i) => i + 1), rpId: 'wrfcoin.com' };
const PASSKEY_ADDRESS = passkeyRecordAddress(RECORD).toLowerCase();
const NONCE = 'cd'.repeat(32);
const FAKE_AUTH = { public_key_p256: bytesToHex(RECORD.publicKeyXY), rp_id_hash: '00'.repeat(32), authenticator_data: '00', client_data_json: '00', signature: '00' };
const jwtFor = (sub: string) => { const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url'); return `${b64({ alg: 'HS256' })}.${b64({ sub })}.sig`; };
const ok = (data: unknown) => new Response(JSON.stringify({ success: true, data }), { status: 200 });
function nonceData() {
  const issuedAt = new Date(Date.now() - 1_000).toISOString();
  const expirationTime = new Date(Date.now() + 5 * 60_000).toISOString();
  return {
    nonce: NONCE, issuedAt, expirationTime, scheme: 'passkey', network: 'testnet', chainId: 888, origin: EXPECT.origin,
    message: bytesToHex(passkeyLoginMessage({ ...EXPECT, address: PASSKEY_ADDRESS, nonce: NONCE, issuedAt, expirationTime })),
  };
}
const fetchMock = () => global.fetch as jest.Mock<typeof fetch>;
const OLD = jwtFor(state.identity);

beforeEach(() => {
  order.length = 0; disconnect.mockClear(); state.active = true;
  clearAuthToken(); setEnv(ON);
  global.fetch = jest.fn<typeof fetch>();
});
afterEach(() => { setEnv(undefined); clearAuthToken(); });

describe('passkey login in a multi-wallet build', () => {
  it('order: nonce, passkey prompt, lock the other wallet and drop its session, then the login post', async () => {
    setAuthToken(OLD);
    fetchMock()
      .mockImplementationOnce(async () => { order.push('nonce'); return ok(nonceData()); })
      .mockImplementationOnce(async () => { order.push(`login(token:${getAuthToken() ? 'old' : 'none'})`); return ok({ jwt: jwtFor(PASSKEY_ADDRESS), refreshToken: 'r', expiresIn: 900 }); });
    const service = new WalletAuthService('/api');
    await service.loginWithPasskey(RECORD, EXPECT, async () => { order.push('prompt'); return FAKE_AUTH; });
    expect(order).toEqual(['nonce', 'prompt', 'lock', 'login(token:none)']);
    expect(getAuthToken()).toBe(jwtFor(PASSKEY_ADDRESS));
    service.clearSession();
  });

  it('a cancelled prompt locks nothing, posts nothing and keeps the old session', async () => {
    setAuthToken(OLD);
    fetchMock().mockResolvedValueOnce(ok(nonceData()));
    await expect(new WalletAuthService('/api').loginWithPasskey(RECORD, EXPECT, async () => { throw new Error('cancelled'); })).rejects.toThrow('cancelled');
    expect(disconnect).not.toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(getAuthToken()).toBe(OLD);
    expect(state.active).toBe(true);
  });

  it('a login post that fails after the prompt leaves nobody signed in (fail-safe), never the old wallet', async () => {
    setAuthToken(OLD);
    fetchMock().mockResolvedValueOnce(ok(nonceData())).mockResolvedValue(new Response(JSON.stringify({ error: 'down' }), { status: 503 }));
    await expect(new WalletAuthService('/api').loginWithPasskey(RECORD, EXPECT, async () => FAKE_AUTH)).rejects.toBeTruthy();
    expect(getAuthToken()).toBe('');
    expect(state.active).toBe(false);
  });

  it('flag off: the other wallet is not locked and its session is only replaced by the new token', async () => {
    setEnv({ VITE_ENABLE_PASSKEY_WALLET: 'true' });
    setAuthToken(OLD);
    fetchMock()
      .mockResolvedValueOnce(ok(nonceData()))
      .mockImplementationOnce(async () => { order.push(`login(token:${getAuthToken() ? 'old' : 'none'})`); return ok({ jwt: jwtFor(PASSKEY_ADDRESS), refreshToken: 'r', expiresIn: 900 }); });
    const service = new WalletAuthService('/api');
    await service.loginWithPasskey(RECORD, EXPECT, async () => FAKE_AUTH);
    expect(disconnect).not.toHaveBeenCalled();
    expect(order).toEqual(['login(token:old)']);
    service.clearSession();
  });
});

describe('late answers for the old wallet', () => {
  const login = async (service: InstanceType<typeof WalletAuthService>, sub: string) => {
    fetchMock().mockResolvedValueOnce(ok({ jwt: jwtFor(sub), refreshToken: `r-${sub}`, expiresIn: 900 }));
    await service.loginWithSignature({ address: sub, signature: '0xsig', nonce: 'n' });
  };

  it('a refresh in flight when the session ends does not bring the old wallet back', async () => {
    const service = new WalletAuthService('/api');
    await login(service, state.identity);
    let answer: (r: Response) => void = () => {};
    fetchMock().mockImplementationOnce(() => new Promise<Response>(resolve => { answer = resolve; }));
    const refresh = service.refreshAccessToken();
    service.clearSession(); // sign-out, or the switch to another wallet
    setAuthToken(jwtFor(PASSKEY_ADDRESS)); // the other wallet's session
    answer(ok({ jwt: jwtFor(state.identity), refreshToken: 'r2', expiresIn: 900 }));
    await expect(refresh).rejects.toBeInstanceOf(StaleWalletSessionError);
    expect(getAuthToken()).toBe(jwtFor(PASSKEY_ADDRESS));
  });

  it('a login post in flight when the session ends is not stored', async () => {
    const service = new WalletAuthService('/api');
    let answer: (r: Response) => void = () => {};
    fetchMock().mockImplementationOnce(() => new Promise<Response>(resolve => { answer = resolve; }));
    const late = service.loginWithSignature({ address: state.identity, signature: '0xsig', nonce: 'n' });
    service.clearSession();
    answer(ok({ jwt: jwtFor(state.identity), refreshToken: 'r', expiresIn: 900 }));
    await expect(late).rejects.toBeInstanceOf(StaleWalletSessionError);
    expect(getAuthToken()).toBe('');
  });

  it('a login that REPLACES another wallet\'s session (no sign-out in between) also ends the old one: its refresh in flight is not stored', async () => {
    const service = new WalletAuthService('/api');
    await login(service, state.identity);
    let answer: (r: Response) => void = () => {};
    fetchMock().mockImplementationOnce(() => new Promise<Response>(resolve => { answer = resolve; }));
    const refresh = service.refreshAccessToken();
    await login(service, PASSKEY_ADDRESS); // replaces the session without clearSession
    answer(ok({ jwt: jwtFor(state.identity), refreshToken: 'r2', expiresIn: 900 }));
    await expect(refresh).rejects.toBeInstanceOf(StaleWalletSessionError);
    expect(getAuthToken()).toBe(jwtFor(PASSKEY_ADDRESS));
    service.clearSession();
  });

  it('the same wallet signing in again does not end its own session: its refresh in flight is still stored', async () => {
    const service = new WalletAuthService('/api');
    await login(service, state.identity);
    let answer: (r: Response) => void = () => {};
    fetchMock().mockImplementationOnce(() => new Promise<Response>(resolve => { answer = resolve; }));
    const refresh = service.refreshAccessToken();
    await login(service, state.identity);
    answer(ok({ jwt: jwtFor(state.identity), refreshToken: 'r2', expiresIn: 900 }));
    await expect(refresh).resolves.toBeTruthy();
    service.clearSession();
  });

  it('sign-out while a passkey login post is in flight wins: nobody ends signed in', async () => {
    state.active = false;
    const service = new WalletAuthService('/api');
    let answer: (r: Response) => void = () => {};
    fetchMock().mockResolvedValueOnce(ok(nonceData())).mockImplementationOnce(() => new Promise<Response>(resolve => { answer = resolve; }));
    const pending = service.loginWithPasskey(RECORD, EXPECT, async () => FAKE_AUTH);
    await new Promise(resolve => setTimeout(resolve, 0)); // the post is now in flight
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(global.fetch).toHaveBeenCalledTimes(2);
    service.clearSession(); // Sign out in the taskbar
    answer(ok({ jwt: jwtFor(PASSKEY_ADDRESS), refreshToken: 'r', expiresIn: 900 }));
    await expect(pending).rejects.toBeInstanceOf(StaleWalletSessionError);
    expect(getAuthToken()).toBe('');
  });

  it('sign-out while an EVM signer login is in flight wins too', async () => {
    const service = new WalletAuthService('/api');
    const evm = '0x' + '22'.repeat(20);
    let answer: (r: Response) => void = () => {};
    fetchMock().mockResolvedValueOnce(ok({ nonce: 'n1' })).mockImplementationOnce(() => new Promise<Response>(resolve => { answer = resolve; }));
    const pending = service.loginWithSigner(evm, async () => '0xsig');
    await new Promise(resolve => setTimeout(resolve, 0));
    await new Promise(resolve => setTimeout(resolve, 0));
    service.clearSession();
    answer(ok({ jwt: jwtFor(evm), refreshToken: 'r', expiresIn: 900 }));
    await expect(pending).rejects.toBeInstanceOf(StaleWalletSessionError);
    expect(getAuthToken()).toBe('');
  });

  it('flag off: a late answer is stored as before', async () => {
    setEnv(undefined);
    const service = new WalletAuthService('/api');
    let answer: (r: Response) => void = () => {};
    fetchMock().mockImplementationOnce(() => new Promise<Response>(resolve => { answer = resolve; }));
    const late = service.loginWithSignature({ address: state.identity, signature: '0xsig', nonce: 'n' });
    service.clearSession();
    answer(ok({ jwt: jwtFor(state.identity), refreshToken: 'r', expiresIn: 900 }));
    await expect(late).resolves.toBeTruthy();
    expect(getAuthToken()).toBe(jwtFor(state.identity));
    service.clearSession();
  });
});
