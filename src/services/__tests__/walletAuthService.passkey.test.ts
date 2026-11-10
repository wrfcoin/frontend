import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { sha3_256 } from '@noble/hashes/sha3.js';
import { clearAuthToken, getAuthToken } from '../authTokenStore';
import {
  PASSKEY_WALLET_LOGIN_DOMAIN,
  WalletAuthService,
  clearWalletAuthSession,
  passkeyLoginMessage,
  type PasskeyAssert,
} from '../walletAuthService';
import { bytesToHex, passkeyRecordAddress, type PasskeyCredentialRecord } from '../walletCrypto/passkey';
import { onBeforeWalletLogin } from '../walletSessionSwitch';

// Byte vector produced by the backend's buildPasskeyWalletLoginMessage (backend passkey login PR) for these
// fields, so the two sides frame the login message identically.
const VECTOR_FIELDS = {
  origin: 'https://wrfcoin.com', chainId: '888', network: 'testnet',
  address: '0x1212121212121212121212121212121212121212', nonce: 'ab'.repeat(32),
  issuedAt: '2026-11-09T12:00:00.000Z', expirationTime: '2026-11-09T12:05:00.000Z',
};
const VECTOR_MESSAGE_HEX = '777266636f696e5f77616c6c65745f6c6f67696e5f706173736b65795f76311300000068747470733a2f2f777266636f696e2e636f6d0300000038383807000000746573746e65742a000000307831323132313231323132313231323132313231323132313231323132313231323132313231323132400000006162616261626162616261626162616261626162616261626162616261626162616261626162616261626162616261626162616261626162616261626162616218000000323032362d31312d30395431323a30303a30302e3030305a18000000323032362d31312d30395431323a30353a30302e3030305a';
const VECTOR_CHALLENGE_HEX = 'bf5daead2f05fee595873066a9175e24bfe5dd7f4265dcd440382388926a2080';

const EXPECT = { origin: 'https://wrfcoin.com', chainId: '888', network: 'testnet' };
const RECORD: PasskeyCredentialRecord = {
  credentialId: Uint8Array.of(1, 2, 3),
  publicKeyXY: Uint8Array.from({ length: 64 }, (_, i) => i + 1),
  rpId: 'wrfcoin.com',
};
const ADDRESS = passkeyRecordAddress(RECORD).toLowerCase();
const NONCE = 'cd'.repeat(32);
const FAKE_AUTH = {
  public_key_p256: bytesToHex(RECORD.publicKeyXY), rp_id_hash: '00'.repeat(32),
  authenticator_data: '00', client_data_json: '00', signature: '00',
};

function jwtFor(sub: string): string {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'HS256' })}.${b64({ sub })}.sig`;
}
const ok = (data: unknown) => new Response(JSON.stringify({ success: true, data }), { status: 200 });

function nonceData(over: Record<string, unknown> = {}) {
  const issuedAt = new Date(Date.now() - 1_000).toISOString();
  const expirationTime = new Date(Date.now() + 5 * 60_000).toISOString();
  const base = { nonce: NONCE, issuedAt, expirationTime, scheme: 'passkey', network: 'testnet', chainId: 888, origin: EXPECT.origin };
  const merged = { ...base, ...over } as Record<string, unknown>;
  if (!('message' in over)) {
    merged.message = bytesToHex(passkeyLoginMessage({
      ...EXPECT, address: ADDRESS, nonce: NONCE, issuedAt: String(merged.issuedAt), expirationTime: String(merged.expirationTime),
    }));
  }
  return merged;
}

describe('passkey wallet login (client)', () => {
  beforeEach(() => {
    clearWalletAuthSession();
    clearAuthToken();
    global.fetch = jest.fn<typeof fetch>();
  });
  afterEach(() => clearWalletAuthSession());

  it('frames the login message exactly as the backend does', () => {
    const message = passkeyLoginMessage(VECTOR_FIELDS);
    expect(bytesToHex(message)).toBe(VECTOR_MESSAGE_HEX);
    expect(bytesToHex(sha3_256(message))).toBe(VECTOR_CHALLENGE_HEX);
    expect(new TextDecoder().decode(message.subarray(0, PASSKEY_WALLET_LOGIN_DOMAIN.length))).toBe(PASSKEY_WALLET_LOGIN_DOMAIN);
  });

  it('one session, one wallet: the other wallet is locked after the passkey prompt and before the login is posted', async () => {
    const order: string[] = [];
    (global.fetch as jest.Mock<typeof fetch>)
      .mockImplementationOnce(async () => { order.push('nonce'); return ok(nonceData()); })
      .mockImplementationOnce(async () => { order.push('login'); return ok({ jwt: jwtFor(ADDRESS), refreshToken: 'r', expiresIn: 900 }); });
    const assert = jest.fn<PasskeyAssert>(async () => { order.push('prompt'); return FAKE_AUTH; });
    const remove = onBeforeWalletLogin(address => { order.push(`lock-others:${address}`); });
    try {
      await new WalletAuthService('/api').loginWithPasskey(RECORD, EXPECT, assert);
    } finally {
      remove();
    }
    expect(order).toEqual(['nonce', 'prompt', `lock-others:${ADDRESS}`, 'login']);
  });

  it('a cancelled passkey prompt locks nothing and posts nothing', async () => {
    (global.fetch as jest.Mock<typeof fetch>).mockResolvedValueOnce(ok(nonceData()));
    const lock = jest.fn<(address: string) => void>();
    const remove = onBeforeWalletLogin(lock);
    const assert = jest.fn<PasskeyAssert>(async () => { throw new Error('cancelled'); });
    try {
      await expect(new WalletAuthService('/api').loginWithPasskey(RECORD, EXPECT, assert)).rejects.toThrow('cancelled');
    } finally {
      remove();
    }
    expect(lock).not.toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('asks for a passkey nonce, signs SHA3 of the rebuilt message, and posts passkey_auth', async () => {
    const data = nonceData();
    (global.fetch as jest.Mock<typeof fetch>)
      .mockResolvedValueOnce(ok(data))
      .mockResolvedValueOnce(ok({ jwt: jwtFor(ADDRESS), refreshToken: 'r', expiresIn: 900 }));
    const assert = jest.fn<PasskeyAssert>(async () => FAKE_AUTH);
    const result = await new WalletAuthService('/api').loginWithPasskey(RECORD, EXPECT, assert);

    expect(global.fetch).toHaveBeenNthCalledWith(1, `/api/auth/nonce/${ADDRESS}?scheme=passkey`, expect.objectContaining({ method: 'GET' }));
    const challenge = assert.mock.calls[0][1];
    expect(bytesToHex(challenge)).toBe(bytesToHex(sha3_256(new Uint8Array(Buffer.from(String(data.message), 'hex')))));
    const [, init] = (global.fetch as jest.Mock<typeof fetch>).mock.calls[1];
    expect(JSON.parse(String((init as { body?: unknown }).body))).toEqual({ scheme: 'passkey', address: ADDRESS, nonce: NONCE, passkey_auth: FAKE_AUTH });
    expect(result.address).toBe(ADDRESS);
    expect(getAuthToken()).toBe(jwtFor(ADDRESS));
  });

  it.each([
    ['wrong scheme', { scheme: 'ed25519' }],
    ['wrong network', { network: 'mainnet' }],
    ['wrong chain', { chainId: 777 }],
    ['wrong origin', { origin: 'https://evil.example' }],
    ['message that does not match the fields', { message: 'ff' }],
    ['expired window', { issuedAt: new Date(Date.now() - 20 * 60_000).toISOString(), expirationTime: new Date(Date.now() - 15 * 60_000).toISOString() }],
    ['window longer than 10 minutes', { expirationTime: new Date(Date.now() + 60 * 60_000).toISOString() }],
  ])('refuses a challenge with %s and never prompts for the passkey', async (_label, over) => {
    (global.fetch as jest.Mock<typeof fetch>).mockResolvedValueOnce(ok(nonceData(over)));
    const assert = jest.fn<PasskeyAssert>(async () => FAKE_AUTH);
    await expect(new WalletAuthService('/api').loginWithPasskey(RECORD, EXPECT, assert)).rejects.toThrow('not a valid passkey challenge');
    expect(assert).not.toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
