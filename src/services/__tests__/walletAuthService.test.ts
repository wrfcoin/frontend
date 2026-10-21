import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { createHash, createPublicKey, verify as nodeVerify } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { clearAuthToken, getAuthToken } from '../authTokenStore';
import {
  ED25519_WALLET_LOGIN_DOMAIN,
  WalletAuthService,
  buildWalletLoginMessage,
  clearWalletAuthSession,
} from '../walletAuthService';
import { bytesToHex, deriveAccount } from '../walletCrypto/firstPartyKeys';
import { transparentTransferMessage } from '../walletCrypto/transferPayload';
import { resolveEd25519LoginExpectations } from '../walletCrypto/loginChallenge';

// Challenge timestamps relative to now: the client refuses expired challenges.
const ISSUED_AT = new Date(Date.now() - 1_000).toISOString();
const EXPIRES_AT = new Date(Date.now() + 5 * 60_000).toISOString();
const PAST_ISSUED_AT = new Date(Date.now() - 10 * 60_000).toISOString();
const PAST_EXPIRES_AT = new Date(Date.now() - 5 * 60_000).toISOString();

const address = '0x1111111111111111111111111111111111111111';

// core4#3234 key-scheme vector, shared with backend#1208 and mobile.
const vector = JSON.parse(
  readFileSync(resolve(process.cwd(), 'contract-fixtures/wallet-key-scheme-vector.json'), 'utf8'),
) as { mnemonic: string; ed25519_public_key_hex: string; address: string };
const VECTOR_SUB = '0x3f995ceb27e8177077dbed8b1e4f696af74da492';
const ORIGIN = 'https://wrfcoin-testnet.taila1c049.ts.net';
const EXPECT = { address: VECTOR_SUB, origin: ORIGIN, chainId: '777', network: 'testnet' };

// core4 golden transfer-authorization preimage
// (shared-protocol/tests/fixtures/golden/signing_preimage_v2.json).
const transferVector = JSON.parse(
  readFileSync(resolve(process.cwd(), 'contract-fixtures/transparent-transfer-auth-vector.json'), 'utf8'),
) as { case: { preimage_hex: string } };
const goldenPreimage = Buffer.from(transferVector.case.preimage_hex, 'hex');

// A transfer preimage for the VECTOR key that survives a UTF-8 string round
// trip (every byte < 0x80), i.e. one a malicious backend can deliver as a JSON
// "message" and have signed byte-for-byte. Amount 547599908735 base units
// (5475.999 WRF) encodes as 7f7f7f7f7f000000 (backend#1208 review, finding 2).
const utf8TransferPreimage = transparentTransferMessage({
  chainId: '777',
  networkId: 'testnet',
  from: VECTOR_SUB,
  to: '0x1111111111111111111111111111111111111111',
  amountBaseUnits: 547599908735n,
  nonce: 1n,
});

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(status < 400 ? { success: true, data } : data), { status });
}

function ed25519Challenge(
  chainAddress: string,
  nonce = 'ed-nonce-1',
  { origin = ORIGIN, chainId = '777', network = 'testnet' } = {},
): string {
  return `${ED25519_WALLET_LOGIN_DOMAIN}\n${new URL(origin).host} wants you to sign in with your WRFCoin ed25519 account:\n${chainAddress}\n\nSign in to WRFCoin Testnet.\n\nURI: ${origin}\nVersion: 1\nScheme: ed25519\nChain ID: ${chainId}\nNetwork: ${network}\nNonce: ${nonce}\nIssued At: ${ISSUED_AT}\nExpiration Time: ${EXPIRES_AT}`;
}

function b64url(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function decodeJwtPayload(jwt: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString('utf8'));
}

/**
 * Independent re-implementation of the backend#1208 ed25519 login checks
 * (node:crypto, not the frontend's @noble code): the address must be
 * 0x + hex(SHA3-256(pubkey)[..20]), the signature must verify over the UTF-8
 * bytes of the issued challenge, and the JWT sub is the derived lowercase
 * address with wallet_scheme ed25519.
 */
function fakeEd25519Backend(issuedMessage: string, nonce = 'ed-nonce-1') {
  return async (url: string, init?: RequestInit): Promise<Response> => {
    if (url.startsWith('/api/auth/nonce/')) {
      return jsonResponse({
        nonce,
        message: issuedMessage,
        issuedAt: ISSUED_AT,
        expirationTime: EXPIRES_AT,
        scheme: 'ed25519',
        network: 'testnet',
      });
    }
    if (url === '/api/auth/wallet-login') {
      const body = JSON.parse(String(init?.body));
      if (body.scheme !== 'ed25519' || typeof body.pubkey !== 'string') {
        return jsonResponse({ error: 'invalid wallet signature' }, 401);
      }
      const pubkey = Buffer.from(body.pubkey.replace(/^0x/i, ''), 'hex');
      const derived = `0x${createHash('sha3-256').update(pubkey).digest('hex').slice(0, 40)}`;
      if (derived !== String(body.address).toLowerCase() || body.nonce !== nonce) {
        return jsonResponse({ error: 'address does not match the ed25519 public key' }, 401);
      }
      const key = createPublicKey({
        key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), pubkey]),
        format: 'der',
        type: 'spki',
      });
      const ok = nodeVerify(
        null,
        Buffer.from(issuedMessage, 'utf8'),
        key,
        Buffer.from(String(body.signature).replace(/^0x/i, ''), 'hex'),
      );
      if (!ok) {
        return jsonResponse({ error: 'invalid wallet signature' }, 401);
      }
      return jsonResponse({
        jwt: `${b64url({ alg: 'HS256' })}.${b64url({ sub: derived, wallet_scheme: 'ed25519' })}.sig`,
        refreshToken: 'ed-refresh-1',
        expiresIn: 900,
      });
    }
    if (url === '/api/auth/refresh') {
      return jsonResponse({
        jwt: `${b64url({ alg: 'HS256' })}.${b64url({ sub: VECTOR_SUB, wallet_scheme: 'ed25519' })}.sig2`,
        refreshToken: 'ed-refresh-2',
        expiresIn: 900,
      });
    }
    throw new Error(`unexpected fetch ${url}`);
  };
}

describe('WalletAuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    clearWalletAuthSession();
    clearAuthToken();
    global.fetch = jest.fn<typeof fetch>();
  });

  afterEach(() => {
    jest.useRealTimers();
    clearWalletAuthSession();
  });

  it('signs the exact domain-bound challenge returned by the backend', async () => {
    const service = new WalletAuthService('/api');
    const signMessage = jest.fn<(message: string) => Promise<string>>().mockResolvedValue('0xsigned');
    const domainBoundMessage = `wrfcoin-testnet.taila1c049.ts.net wants you to sign in with your Ethereum account:\n${address}\n\nSign in to WRFCoin Testnet.\n\nURI: https://wrfcoin-testnet.taila1c049.ts.net\nVersion: 1\nChain ID: 777\nNonce: abc123\nIssued At: 2026-08-17T00:00:00.000Z\nExpiration Time: 2026-08-17T00:05:00.000Z`;

    (global.fetch as jest.Mock<typeof fetch>)
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: { nonce: 'abc123', message: domainBoundMessage },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              jwt: 'access.jwt.token',
              refreshToken: 'refresh-token',
              expiresIn: 900,
            },
          }),
          { status: 200 },
        ),
      );

    const result = await service.loginWithSigner(address, signMessage);

    expect(signMessage).toHaveBeenCalledWith(domainBoundMessage);
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      `/api/auth/nonce/${address}`,
      expect.objectContaining({ method: 'GET' }),
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      '/api/auth/wallet-login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          address,
          signature: '0xsigned',
          nonce: 'abc123',
        }),
      }),
    );
    expect(result).toMatchObject({
      address,
      jwt: 'access.jwt.token',
      refreshToken: 'refresh-token',
      expiresIn: 900,
    });
    expect(getAuthToken()).toBe('access.jwt.token');
  });

  it('retains the legacy nonce message only for a frontend-first rollout', async () => {
    const service = new WalletAuthService('/api');
    const signMessage = jest.fn<(message: string) => Promise<string>>().mockResolvedValue('0xsigned');

    (global.fetch as jest.Mock<typeof fetch>)
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ success: true, data: { nonce: 'legacy-nonce' } }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              jwt: 'access.jwt.token',
              refreshToken: 'refresh-token',
              expiresIn: 900,
            },
          }),
          { status: 200 },
        ),
      );

    await service.loginWithSigner(address, signMessage);

    expect(signMessage).toHaveBeenCalledWith(
      'WRFCoin wallet login nonce: legacy-nonce',
    );
  });

  it('silently refreshes before expiry and rotates the refresh token', async () => {
    jest.useFakeTimers();
    const service = new WalletAuthService('/api');
    const signMessage = jest.fn<(message: string) => Promise<string>>().mockResolvedValue('0xsigned');

    (global.fetch as jest.Mock<typeof fetch>)
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ success: true, data: { nonce: 'abc123' } }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              jwt: 'initial.jwt.token',
              refreshToken: 'refresh-token-1',
              expiresIn: 2,
            },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              jwt: 'refreshed.jwt.token',
              refreshToken: 'refresh-token-2',
              expiresIn: 900,
            },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              jwt: 'manual-refresh.jwt.token',
              refreshToken: 'refresh-token-3',
              expiresIn: 900,
            },
          }),
          { status: 200 },
        ),
      );

    await service.loginWithSigner(address, signMessage);
    expect(getAuthToken()).toBe('initial.jwt.token');

    await jest.advanceTimersByTimeAsync(1_600);

    expect(global.fetch).toHaveBeenNthCalledWith(
      3,
      '/api/auth/refresh',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ refreshToken: 'refresh-token-1' }),
      }),
    );
    expect(getAuthToken()).toBe('refreshed.jwt.token');

    await service.refreshAccessToken();
    expect(global.fetch).toHaveBeenLastCalledWith(
      '/api/auth/refresh',
      expect.objectContaining({
        body: JSON.stringify({ refreshToken: 'refresh-token-2' }),
      }),
    );
  });

  it('clears the access token when silent refresh fails', async () => {
    jest.useFakeTimers();
    const service = new WalletAuthService('/api');
    const signMessage = jest.fn<(message: string) => Promise<string>>().mockResolvedValue('0xsigned');

    (global.fetch as jest.Mock<typeof fetch>)
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ success: true, data: { nonce: 'abc123' } }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              jwt: 'initial.jwt.token',
              refreshToken: 'refresh-token-1',
              expiresIn: 2,
            },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'invalid refresh token' }), {
          status: 401,
        }),
      );

    await service.loginWithSigner(address, signMessage);
    expect(getAuthToken()).toBe('initial.jwt.token');

    await jest.advanceTimersByTimeAsync(1_600);

    expect(getAuthToken()).toBe('');
    await expect(service.refreshAccessToken()).rejects.toThrow(
      'refreshToken',
    );
  });

  it('builds the exact backend login message', () => {
    expect(buildWalletLoginMessage('nonce-1')).toBe(
      'WRFCoin wallet login nonce: nonce-1',
    );
  });

  it('rejects non-EVM addresses before calling the API', async () => {
    const service = new WalletAuthService('/api');

    await expect(
      service.loginWithSigner('wrf1not-evm', jest.fn<(message: string) => Promise<string>>()),
    ).rejects.toThrow('valid EVM address');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  describe('ed25519 first-party login (backend#1205)', () => {
    const account = deriveAccount(vector.mnemonic);
    const pubkeyHex = bytesToHex(account.publicKey);
    const signWithVector = jest.fn((message: string) =>
      bytesToHex(account.sign(new TextEncoder().encode(message))),
    );

    it('logs the vector wallet in as sub 0x3f99…a492 and posts scheme + pubkey', async () => {
      expect(account.address).toBe(VECTOR_SUB);
      expect(pubkeyHex).toBe(vector.ed25519_public_key_hex);
      const issued = ed25519Challenge(VECTOR_SUB);
      (global.fetch as jest.Mock<typeof fetch>).mockImplementation(fakeEd25519Backend(issued) as never);
      const service = new WalletAuthService('/api');

      // A checksum-cased address from the UI is lowercased end to end.
      const result = await service.loginWithEd25519(
        VECTOR_SUB.toUpperCase().replace('0X', '0x'),
        pubkeyHex,
        signWithVector,
        EXPECT,
      );

      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        `/api/auth/nonce/${VECTOR_SUB}?scheme=ed25519`,
        expect.objectContaining({ method: 'GET' }),
      );
      expect(signWithVector).toHaveBeenCalledTimes(1);
      expect(signWithVector).toHaveBeenCalledWith(issued);
      const loginCall = (global.fetch as jest.Mock<typeof fetch>).mock.calls[1] as [string, RequestInit];
      expect(loginCall[0]).toBe('/api/auth/wallet-login');
      const posted = JSON.parse(String(loginCall[1].body));
      expect(posted).toEqual({
        scheme: 'ed25519',
        address: VECTOR_SUB,
        pubkey: vector.ed25519_public_key_hex,
        signature: expect.stringMatching(/^[0-9a-f]{128}$/),
        nonce: 'ed-nonce-1',
      });
      expect(result.address).toBe(VECTOR_SUB);
      expect(decodeJwtPayload(getAuthToken())).toEqual({
        sub: VECTOR_SUB,
        wallet_scheme: 'ed25519',
      });

      // refresh keeps the lowercase chain address
      const refreshed = await service.refreshAccessToken();
      expect(refreshed.address).toBe(VECTOR_SUB);
      expect(decodeJwtPayload(getAuthToken()).sub).toBe(VECTOR_SUB);
    });

    it.each([
      ['no message (legacy backend)', { nonce: 'n1', scheme: 'ed25519' }],
      ['an EVM challenge (no scheme)', { nonce: 'n1', message: `x wants you to sign in with your Ethereum account:\n${VECTOR_SUB}` }],
      ['a scheme-tagged message without the ed25519 login domain', { nonce: 'n1', scheme: 'ed25519', message: 'wrfcoin_transparent_transfer_auth_v2 attacker-chosen bytes' }],
    ])('never falls back to a locally built message: refuses %s', async (_label, challenge) => {
      (global.fetch as jest.Mock<typeof fetch>).mockResolvedValueOnce(jsonResponse(challenge) as never);
      const service = new WalletAuthService('/api');

      await expect(
        service.loginWithEd25519(VECTOR_SUB, pubkeyHex, signWithVector, EXPECT),
      ).rejects.toThrow(/challenge|message/);

      expect(signWithVector).not.toHaveBeenCalled();
      expect(signWithVector).not.toHaveBeenCalledWith(buildWalletLoginMessage('n1'));
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(getAuthToken()).toBe('');
    });

    it('refuses a public key that does not derive the wallet address before any request', async () => {
      const service = new WalletAuthService('/api');

      await expect(
        service.loginWithEd25519(address, pubkeyHex, signWithVector, EXPECT),
      ).rejects.toThrow('does not match');
      expect(global.fetch).not.toHaveBeenCalled();
      expect(signWithVector).not.toHaveBeenCalled();
    });

    // backend#1208 security review, finding 2: validate before signing.
    const withoutPrefix = ed25519Challenge(VECTOR_SUB).split('\n').slice(1).join('\n');
    it.each([
      ['the core4 golden transfer preimage (latin1 string)', goldenPreimage.toString('latin1')],
      ['a UTF-8-clean transfer preimage for this key', new TextDecoder('utf-8', { fatal: true }).decode(utf8TransferPreimage)],
      ['a transfer preimage behind the login domain line', `${ED25519_WALLET_LOGIN_DOMAIN}\n${new TextDecoder().decode(utf8TransferPreimage)}`],
      ['a challenge without the domain prefix', withoutPrefix],
      ['a challenge with a different domain line', ed25519Challenge(VECTOR_SUB).replace('login_ed25519_v1', 'login_ed25519_v0')],
      ['a challenge for a different address', ed25519Challenge('0x1111111111111111111111111111111111111111')],
      ['a challenge for a different origin', ed25519Challenge(VECTOR_SUB, 'ed-nonce-1', { origin: 'https://evil.example' })],
      ['a challenge whose URI: line differs from its (matching) host line', ed25519Challenge(VECTOR_SUB).replace(`URI: ${ORIGIN}`, `URI: ${ORIGIN.replace('https:', 'http:')}`)],
      ['a challenge for a different chain', ed25519Challenge(VECTOR_SUB, 'ed-nonce-1', { chainId: '1' })],
      ['a challenge for a different network', ed25519Challenge(VECTOR_SUB, 'ed-nonce-1', { network: 'mainnet' })],
      ['a challenge carrying a different nonce than issued', ed25519Challenge(VECTOR_SUB, 'other-nonce-2')],
      ['an expired challenge (Expiration Time in the past)', ed25519Challenge(VECTOR_SUB).replace(ISSUED_AT, PAST_ISSUED_AT).replace(EXPIRES_AT, PAST_EXPIRES_AT)],
      ['a valid challenge with trailing bytes', `${ed25519Challenge(VECTOR_SUB)}\n${new TextDecoder().decode(utf8TransferPreimage)}`],
    ])('refuses to sign %s', async (_label, message) => {
      (global.fetch as jest.Mock<typeof fetch>).mockResolvedValueOnce(
        jsonResponse({ nonce: 'ed-nonce-1', scheme: 'ed25519', network: 'testnet', message }) as never,
      );
      const service = new WalletAuthService('/api');

      await expect(
        service.loginWithEd25519(VECTOR_SUB, pubkeyHex, signWithVector, EXPECT),
      ).rejects.toThrow('Refusing to sign wallet login challenge');

      expect(signWithVector).not.toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(getAuthToken()).toBe('');
    });

    it('the UTF-8-clean transfer preimage really would round-trip (probe is meaningful)', () => {
      const asString = new TextDecoder('utf-8', { fatal: true }).decode(utf8TransferPreimage);
      expect(Buffer.from(new TextEncoder().encode(asString))).toEqual(Buffer.from(utf8TransferPreimage));
      expect(Buffer.from(utf8TransferPreimage).includes(Buffer.from('7f7f7f7f7f000000', 'hex'))).toBe(true);
    });

    it('resolves expectations only from build config: unset network or origin fails closed', () => {
      const full = {
        VITE_WALLET_AUTH_ORIGIN: ORIGIN,
        VITE_WRFCOIN_CHAIN_ID: '777',
        VITE_WRFCOIN_NETWORK_ID: 'testnet',
      };
      expect(resolveEd25519LoginExpectations(VECTOR_SUB, {}, full)).toEqual(EXPECT);
      // network must never default (e.g. to 'testnet')
      expect(() =>
        resolveEd25519LoginExpectations(VECTOR_SUB, {}, { ...full, VITE_WRFCOIN_NETWORK_ID: undefined }),
      ).toThrow('network is not configured');
      expect(() =>
        resolveEd25519LoginExpectations(VECTOR_SUB, {}, { ...full, VITE_WRFCOIN_NETWORK_ID: '' }),
      ).toThrow('network is not configured');
      // origin must come from config, never window.location.origin
      expect(window.location.origin).toBeTruthy();
      expect(() =>
        resolveEd25519LoginExpectations(VECTOR_SUB, {}, { ...full, VITE_WALLET_AUTH_ORIGIN: undefined }),
      ).toThrow('origin is not configured');
      expect(() =>
        resolveEd25519LoginExpectations(VECTOR_SUB, {}, { ...full, VITE_WALLET_AUTH_ORIGIN: '' }),
      ).toThrow('origin is not configured');
    });

    it('fails closed when the chain/network expectations are not configured', async () => {
      const service = new WalletAuthService('/api');

      // No explicit expectations and no VITE_* chain/network in the test env.
      await expect(
        service.loginWithEd25519(VECTOR_SUB, pubkeyHex, signWithVector),
      ).rejects.toThrow('not configured');
      expect(global.fetch).not.toHaveBeenCalled();
      expect(signWithVector).not.toHaveBeenCalled();
    });
  });
});
