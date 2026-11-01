/** @jest-environment node */
/**
 * Session keys (core4 feature session_keys): the bytes this wallet signs must
 * equal core4's `wallet_client_golden_vectors` byte-for-byte
 * (contract-fixtures/session-key-golden-vectors.json), the device-key
 * challenge gate must refuse anything but a session_key login for this owner
 * and key, and the local limits check must mirror core4's.
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ed25519 } from '@noble/curves/ed25519.js';
import { bytesToHex } from '../firstPartyKeys';
import {
  ANY_TARGET,
  checkDeviceSend,
  defaultGrant,
  hexToBytes,
  registerActionBody,
  revokeActionBody,
  sessionKeyRegisterMessage,
  sessionKeyRevokeMessage,
  sessionKeyTransferMessage,
  type SessionKeyGrant,
  type SessionKeyList,
  type SessionKeyRecord,
} from '../sessionKeys';
import { SESSION_KEY_WALLET_LOGIN_DOMAIN, assertSessionKeyLoginChallenge } from '../loginChallenge';
import { DeviceKeyUnsupportedError, getOrCreateDeviceKey, loadDeviceKey, forgetDeviceKey, keyAddress, memoryDeviceKeyStorage, setDeviceKeyStorage } from '../deviceKeyStore';
import { WalletAuthService } from '../../walletAuthService';
import { getAuthToken, clearAuthToken } from '../../authTokenStore';

const GOLDEN = JSON.parse(readFileSync(resolve(process.cwd(), 'contract-fixtures/session-key-golden-vectors.json'), 'utf8'));
const G = GOLDEN.inputs;
const E = GOLDEN.expected;
const ownerSeed = hexToBytes(G.owner_seed_hex);
const sessionSeed = hexToBytes(G.session_seed_hex);
const ownerPub = bytesToHex(ed25519.getPublicKey(ownerSeed));
const sessionPub = bytesToHex(ed25519.getPublicKey(sessionSeed));
const ownerAddress = keyAddress(ownerPub);
const grant: SessionKeyGrant = {
  publicKey: sessionPub,
  scope: {
    allowedMethods: G.grant.allowed_methods,
    allowedTargets: G.grant.allowed_targets,
    maxValuePerUse: BigInt(G.grant.max_value_per_use),
    maxTotalValue: BigInt(G.grant.max_total_value),
    window: { blocks: G.grant.window.blocks, maxValue: BigInt(G.grant.window.max_value) },
  },
  validFrom: G.grant.valid_from,
  validUntil: G.grant.valid_until,
  maxUses: G.grant.max_uses,
};

describe('golden vectors (core4 wallet_client_golden_vectors)', () => {
  it('derives the keys and owner address', () => {
    expect(ownerPub).toBe(E.owner_public_key);
    expect(sessionPub).toBe(E.session_public_key);
    expect(ownerAddress).toBe(E.owner_address);
  });

  it('register preimage, both signatures and the exact JSON body', () => {
    const base = { chainId: G.chain_id, owner: ownerAddress, registrationNonce: G.registration_nonce, grant };
    const preimage = sessionKeyRegisterMessage(base);
    expect(bytesToHex(preimage)).toBe(E.register_preimage);
    const body = registerActionBody({
      ...base,
      ownerPublicKey: ownerPub,
      ownerSign: m => ed25519.sign(m, ownerSeed),
      sessionSignature: ed25519.sign(preimage, sessionSeed),
    });
    expect(JSON.parse(JSON.stringify(body))).toEqual(GOLDEN.register_body);
    // Byte-exact: core4's REGISTER_BODY_JSON string, as serde writes it (addresses as 20-number arrays).
    expect(JSON.stringify(body)).toBe(E.register_body_json);
  });

  it('transfer preimage and signature', () => {
    const preimage = sessionKeyTransferMessage({
      chainId: G.chain_id, networkId: G.network_id, from: ownerAddress, to: G.transfer.to,
      amountBaseUnits: BigInt(G.transfer.amount), nonce: BigInt(G.transfer.nonce), sessionPublicKey: sessionPub,
    });
    expect(bytesToHex(preimage)).toBe(E.transfer_preimage);
    expect(bytesToHex(ed25519.sign(preimage, sessionSeed))).toBe(E.transfer_signature);
  });

  it('revoke preimage', () => {
    const args = { chainId: G.chain_id, owner: ownerAddress, sessionKey: keyAddress(sessionPub), registrationNonce: G.revoke.registration_nonce };
    expect(bytesToHex(sessionKeyRevokeMessage(args))).toBe(E.revoke_preimage);
    const body = revokeActionBody({ ...args, ownerPublicKey: ownerPub, ownerSign: m => ed25519.sign(m, ownerSeed) });
    expect(body.action.Revoke.session_key).toHaveLength(20);
    expect(ed25519.verify(hexToBytes(body.action.Revoke.owner_signature), hexToBytes(E.revoke_preimage), hexToBytes(ownerPub))).toBe(true);
  });
});

describe('default grant', () => {
  it('is 10 WRF a send, 10 WRF a day, 300 WRF in all, transfer + wallet_login, 90 days, anyone', () => {
    const g = defaultGrant({ publicKey: sessionPub, nextHeight: 5000, recipients: 'anyone' });
    expect(g.scope.allowedMethods).toEqual(['transfer', 'wallet_login']);
    expect(g.scope.allowedTargets).toEqual([ANY_TARGET]);
    expect(g.scope.maxValuePerUse).toBe(1_000_000_000n);
    expect(g.scope.window).toEqual({ blocks: 1122, maxValue: 1_000_000_000n });
    expect(g.scope.maxTotalValue).toBe(30_000_000_000n);
    expect(g.validFrom).toBe(5000);
    expect(g.validUntil).toBe(5000 + 90 * 1122);
    expect(g.maxUses).toBeNull();
  });

  it('an allowlist lists those addresses only, and an empty one is refused', () => {
    const a = `0x${'12'.repeat(20)}`;
    expect(defaultGrant({ publicKey: sessionPub, nextHeight: 1, recipients: [a.toUpperCase().replace('0X', '0x'), a] }).scope.allowedTargets).toEqual([a]);
    expect(() => defaultGrant({ publicKey: sessionPub, nextHeight: 1, recipients: [] })).toThrow();
    expect(() => defaultGrant({ publicKey: sessionPub, nextHeight: 1, recipients: ['0x12'] })).toThrow();
  });
});

describe('checkDeviceSend mirrors core4 check_transfer', () => {
  const to = `0x${'0b'.repeat(20)}`;
  const record = (over: Partial<SessionKeyRecord> = {}): SessionKeyRecord => ({
    session_key: keyAddress(sessionPub), public_key: sessionPub, registration_nonce: 0, status: 'active',
    allowed_methods: ['transfer', 'wallet_login'], any_target: true, allowed_targets: [],
    max_value_per_use: '1000000000', max_total_value: '30000000000', total_remaining: '30000000000',
    window: { blocks: 1122, max_value: '1000000000', remaining: '400000000', window_ends_at_height: 1200 },
    valid_from: 100, valid_until: 101080, max_uses: null, uses_so_far: 0, cumulative_value_used: '0', revoked: false, ...over,
  });
  const list = (r: SessionKeyRecord, featureActive = true): SessionKeyList => ({
    owner: ownerAddress, feature_active: featureActive, next_height: 500, next_registration_nonce: 1, chain_id: '888', session_keys: [r],
  });

  it('allows a send inside every limit', () => {
    expect(checkDeviceSend(list(record()), sessionPub, to, 400_000_000n)).toEqual({ ok: true });
  });
  it.each([
    ['over what is left today', record(), 400_000_001n, 'daily'],
    ['over the per-send limit', record({ window: null }), 1_000_000_001n, 'per-send'],
    ['over the lifetime remainder', record({ window: null, total_remaining: '5' }), 6n, 'total'],
    ['a recipient outside the allowlist', record({ any_target: false, allowed_targets: [`0x${'aa'.repeat(20)}`] }), 1n, 'recipient'],
    ['a revoked key', record({ status: 'revoked' }), 1n, 'inactive'],
    ['a key without transfer', record({ allowed_methods: ['wallet_login'] }), 1n, 'inactive'],
  ])('refuses %s', (_label, r, amount, reason) => {
    expect(checkDeviceSend(list(r), sessionPub, to, amount)).toEqual({ ok: false, reason });
  });
  it('refuses when the feature is off, or this browser has no listed key', () => {
    expect(checkDeviceSend(list(record(), false), sessionPub, to, 1n)).toEqual({ ok: false, reason: 'feature-off' });
    expect(checkDeviceSend(list(record()), 'ab'.repeat(32), to, 1n)).toEqual({ ok: false, reason: 'no-key' });
    expect(checkDeviceSend(list(record()), null, to, 1n)).toEqual({ ok: false, reason: 'no-key' });
  });
});

const ORIGIN = 'https://wrfcoin.com';
const EXPECT = { origin: ORIGIN, chainId: '888', network: 'testnet' };
const ISSUED = new Date(Date.now() - 1000).toISOString();
const EXPIRES = new Date(Date.now() + 300_000).toISOString();
/** Exactly backend buildSessionKeyWalletLoginMessage. */
function challenge(o: { owner?: string; key?: string; nonce?: string; domain?: string; scheme?: string } = {}) {
  return `${o.domain ?? SESSION_KEY_WALLET_LOGIN_DOMAIN}\nwrfcoin.com wants you to sign in with your WRFCoin account using a device key:\n${o.owner ?? ownerAddress}\n\nSign in to WRFCoin Testnet.\n\nURI: ${ORIGIN}\nVersion: 1\nScheme: ${o.scheme ?? 'session_key'}\nChain ID: 888\nNetwork: testnet\nSession Key: ${o.key ?? sessionPub}\nNonce: ${o.nonce ?? 'nonce-12345678'}\nIssued At: ${ISSUED}\nExpiration Time: ${EXPIRES}`;
}

describe('session-key login challenge gate', () => {
  const expected = { ...EXPECT, address: ownerAddress, sessionPublicKey: sessionPub, nonce: 'nonce-12345678' };
  it('accepts the backend challenge for this owner and key', () => {
    expect(assertSessionKeyLoginChallenge(challenge(), expected)).toBe(challenge());
  });
  it.each([
    ['another owner', { owner: `0x${'99'.repeat(20)}` }],
    ['another device key', { key: 'ab'.repeat(32) }],
    ['the ed25519 domain', { domain: 'wrfcoin_wallet_login_ed25519_v1' }],
    ['another scheme', { scheme: 'ed25519' }],
    ['another nonce', { nonce: 'other-nonce-123' }],
  ])('refuses %s', (_label, o) => {
    expect(() => assertSessionKeyLoginChallenge(challenge(o), expected)).toThrow(/Refusing/);
  });
  it('refuses a transfer preimage handed over as a "challenge"', () => {
    const transfer = new TextDecoder().decode(hexToBytes(E.transfer_preimage));
    expect(() => assertSessionKeyLoginChallenge(transfer, expected)).toThrow(/Refusing/);
  });
});

describe('WalletAuthService.loginWithSessionKey', () => {
  const jwt = `x.${Buffer.from(JSON.stringify({ sub: ownerAddress, wallet_scheme: 'session_key' })).toString('base64url')}.y`;
  beforeEach(() => { clearAuthToken(); });

  it('requests a session_key challenge, signs it with the device key, and posts scheme session_key', async () => {
    const sign = jest.fn(async (m: Uint8Array) => ed25519.sign(m, sessionSeed));
    global.fetch = jest.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: { nonce: 'nonce-12345678', message: challenge(), scheme: 'session_key' } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: { jwt, refreshToken: 'r', expiresIn: 900 } })));
    const session = await new WalletAuthService('/api').loginWithSessionKey(ownerAddress, sessionPub, sign, EXPECT);
    expect(session.address).toBe(ownerAddress);
    expect(getAuthToken()).toBe(jwt);
    const calls = (global.fetch as jest.Mock<typeof fetch>).mock.calls as unknown as [string, RequestInit][];
    expect(calls[0][0]).toBe(`/api/auth/nonce/${ownerAddress}?scheme=session_key&session_public_key=${sessionPub}`);
    const posted = JSON.parse(String(calls[1][1].body));
    expect(posted).toEqual({ scheme: 'session_key', address: ownerAddress, pubkey: sessionPub, nonce: 'nonce-12345678', signature: expect.stringMatching(/^[0-9a-f]{128}$/) });
    expect(ed25519.verify(hexToBytes(posted.signature), new TextEncoder().encode(challenge()), hexToBytes(sessionPub))).toBe(true);
  });

  it('never signs a challenge for another key', async () => {
    const sign = jest.fn(async (m: Uint8Array) => ed25519.sign(m, sessionSeed));
    global.fetch = jest.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: { nonce: 'nonce-12345678', message: challenge({ key: 'ab'.repeat(32) }), scheme: 'session_key' } })));
    await expect(new WalletAuthService('/api').loginWithSessionKey(ownerAddress, sessionPub, sign, EXPECT)).rejects.toThrow(/Refusing/);
    expect(sign).not.toHaveBeenCalled();
    expect(getAuthToken()).toBe('');
  });
});

describe('device key store', () => {
  beforeEach(() => setDeviceKeyStorage(memoryDeviceKeyStorage()));

  it('creates one key per owner, prefers a non-extractable WebCrypto Ed25519 key, and its signatures verify', async () => {
    const key = await getOrCreateDeviceKey(ownerAddress);
    expect(key.publicKeyHex).toMatch(/^[0-9a-f]{64}$/);
    expect(key.address).toBe(keyAddress(key.publicKeyHex));
    // Node 24 has WebCrypto Ed25519, so this is the non-extractable path.
    expect(key.kind).toBe('webcrypto');
    const again = await getOrCreateDeviceKey(ownerAddress.toUpperCase().replace('0X', '0x'));
    expect(again.publicKeyHex).toBe(key.publicKeyHex);
    const msg = new TextEncoder().encode('hello');
    expect(ed25519.verify(await key.sign(msg), msg, hexToBytes(key.publicKeyHex))).toBe(true);
    await forgetDeviceKey(ownerAddress);
    expect(await loadDeviceKey(ownerAddress)).toBeNull();
  });

  it('the private key cannot be exported, in any format', async () => {
    const stored: { privateKey?: CryptoKey }[] = [];
    const mem = memoryDeviceKeyStorage();
    setDeviceKeyStorage({ ...mem, put: async r => { stored.push(r); await mem.put(r); } });
    await getOrCreateDeviceKey(ownerAddress);
    const privateKey = stored[0].privateKey as CryptoKey;
    expect(privateKey.extractable).toBe(false);
    expect(privateKey.usages).toEqual(['sign']);
    for (const format of ['pkcs8', 'jwk', 'raw'] as const) {
      await expect(crypto.subtle.exportKey(format, privateKey)).rejects.toThrow();
    }
    // Nothing but the CryptoKey handle and the public key is stored: no seed, no key bytes.
    expect(Object.keys(stored[0]).sort()).toEqual(['createdAt', 'kind', 'owner', 'privateKey', 'publicKeyHex']);
  });

  it('without WebCrypto Ed25519 there is no device key at all (no software fallback), and nothing is stored', async () => {
    const spy = jest.spyOn(crypto.subtle, 'generateKey').mockRejectedValueOnce(new Error('Ed25519 unsupported') as never);
    await expect(getOrCreateDeviceKey(ownerAddress)).rejects.toBeInstanceOf(DeviceKeyUnsupportedError);
    spy.mockRestore();
    expect(await loadDeviceKey(ownerAddress)).toBeNull();
  });

  it('refuses a stored record whose key is extractable or not a CryptoKey', async () => {
    const extractable = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])) as CryptoKeyPair;
    const pub = bytesToHex(new Uint8Array(await crypto.subtle.exportKey('raw', extractable.publicKey)));
    const mem = memoryDeviceKeyStorage();
    setDeviceKeyStorage(mem);
    await mem.put({ owner: ownerAddress, publicKeyHex: pub, kind: 'webcrypto', createdAt: 1, privateKey: extractable.privateKey });
    expect(await loadDeviceKey(ownerAddress)).toBeNull();
    await mem.put({ owner: ownerAddress, publicKeyHex: pub, kind: 'software' as 'webcrypto', createdAt: 1, seed: new Uint8Array(32) } as never);
    expect(await loadDeviceKey(ownerAddress)).toBeNull();
  });
});
