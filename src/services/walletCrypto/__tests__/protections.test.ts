/** @jest-environment jsdom */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ed25519 } from '@noble/curves/ed25519.js';
import { sha256 } from '@noble/hashes/sha2.js';
import vectors from './chainProtections-vectors.json';

// The relay and the vault are the only side effects: record what would be posted, sign with the vector seed.
const posted: { path: string; body: unknown }[] = [];
const getResponses: Record<string, unknown> = {};
await jest.unstable_mockModule('../../apiClient/client', () => ({
  ApiClient: class {
    async get(path: string) { if (path in getResponses) return getResponses[path]; throw new Error('404'); }
    async post(path: string, body: unknown) { posted.push({ path, body }); return { accepted: true }; }
  },
}));
const seed = new Uint8Array(32).fill(7);
const withOwnerKey = jest.fn(async (_owner: string, password: string, run: (a: unknown) => unknown) => {
  if (password !== 'pw') throw new Error('bad password');
  return run({ publicKey: ed25519.getPublicKey(seed), address: vectors.account, sign: (m: Uint8Array) => ed25519.sign(m, seed) });
});
await jest.unstable_mockModule('../deviceSession', () => ({ withOwnerKey }));
await jest.unstable_mockModule('../../../config/network', () => ({ WRFCOIN_CHAIN_ID: '888' }));

const {
  allowlistDecision, assertSecurityKey, fetchSendAllowlist, hoursToDelayBlocks,
  parseSecurityKeyStatus, parseSendAllowlistRead, KEY_WRONG_SITE_MESSAGE, KEY_CANCELLED_MESSAGE,
} = await import('../protections');
const { cancelSecurityKeyEscape, enableSecurityKey, submitAllowlistAction } = await import('../protectionActions');
const { bytesToHex, hexToBytes } = await import('../passkey');

const owner = vectors.account;
const a3 = `0x${'03'.repeat(20)}`;
const a5 = `0x${'05'.repeat(20)}`;
const rpHash = bytesToHex(sha256(new TextEncoder().encode('localhost')));

const read = (over: Record<string, unknown> = {}) => parseSendAllowlistRead({
  feature_active_next_height: true,
  observed_at_height: 999,
  allowlist: {
    account: owner, next_action_nonce: 4, in_force: true, at_height: 1000, add_delay_blocks: 2244, enabled_at_height: 10,
    allowed: [a5], pending_additions: [{ address: a3, requested_at_height: 900, effective_at_height: 1100 }],
    pending_disable: null, requests_blocked_until_height: null, ...over,
  },
});

const status = (over: Record<string, unknown> = {}) => parseSecurityKeyStatus({
  address: owner, next_height: 1000, feature_active_at_next_height: true, next_nonce: 0, generation: 0, required_to_spend: false,
  keys: [], escape_delay_blocks: null, pending_escape: null, escape_matured: false, ...over,
});

// A fake authenticator: a fixed P-256 public key (the generator point) and canned assertion bytes.
const G = '6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c2964fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5';
const spki = hexToBytes(`3059301306072a8648ce3d020106082a8648ce3d03010703420004${G}`);
const credId = Uint8Array.from([9, 9, 9, 9]);
// r = 1, s = n - 1 (high-s): must come back as s = 1.
const highS = hexToBytes('3026020101022100ffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632550');
const fakeCredentials = () => {
  const calls: { create: unknown[]; get: any[] } = { create: [], get: [] };
  return {
    calls,
    create: async (o: unknown) => { calls.create.push(o); return { rawId: credId, response: { getPublicKey: () => spki } }; },
    get: async (o: any) => {
      calls.get.push(o);
      return { rawId: credId, response: { authenticatorData: Uint8Array.of(1, 2), clientDataJSON: Uint8Array.of(3, 4), signature: highS } };
    },
  };
};

beforeEach(() => { posted.length = 0; for (const k of Object.keys(getResponses)) delete getResponses[k]; withOwnerKey.mockClear(); });

describe('reads', () => {
  it('reads the allowlist through the relay and keeps only well-formed entries', async () => {
    getResponses[`/wallet/${owner}/send-allowlist`] = {
      feature_active_next_height: true, observed_at_height: 5,
      allowlist: { next_action_nonce: 0, in_force: false, at_height: 6, allowed: ['0xNOPE', a5.toUpperCase().replace('0X', '0x')], pending_additions: [{ address: 'x' }] },
    };
    const r = await fetchSendAllowlist(owner);
    expect(r.allowlist.allowed).toEqual([a5]);
    expect(r.allowlist.pending_additions).toEqual([]);
  });

  it('refuses a shape it does not know (the UI then hides the controls)', () => {
    expect(() => parseSendAllowlistRead({ feature_active_next_height: 'yes' })).toThrow();
    expect(() => parseSecurityKeyStatus({ keys: [] })).toThrow();
  });
});

describe('send check before signing', () => {
  const now = 1_000_000;
  it('allows listed addresses and self-sends; blocks the rest', () => {
    expect(allowlistDecision(read(), owner, a5, now)).toEqual({ kind: 'ok' });
    expect(allowlistDecision(read(), owner, owner, now)).toEqual({ kind: 'ok' });
    expect(allowlistDecision(read(), owner, `0x${'0a'.repeat(20)}`, now)).toEqual({ kind: 'blocked' });
  });

  it('a pending addition is refused until its height, with an ETA at 77 s/block', () => {
    expect(allowlistDecision(read(), owner, a3, now)).toEqual({ kind: 'pending', effectiveAtHeight: 1100, etaMs: now + 100 * 77_000 });
    expect(allowlistDecision(read({ at_height: 1100 }), owner, a3, now)).toEqual({ kind: 'ok' });
  });

  it('changes nothing when the list is off, the feature is off, or nothing was read', () => {
    expect(allowlistDecision(read({ in_force: false }), owner, a3, now)).toEqual({ kind: 'ok' });
    expect(allowlistDecision({ ...read(), feature_active_next_height: false }, owner, a3, now)).toEqual({ kind: 'ok' });
    expect(allowlistDecision(null, owner, a3, now)).toEqual({ kind: 'ok' });
  });

  it('delay hours map to blocks inside the chain limits', () => {
    expect(hoursToDelayBlocks(48)).toBe(2245);
    expect(hoursToDelayBlocks(1)).toBe(1122);
    expect(hoursToDelayBlocks(10_000)).toBe(33662);
  });
});

describe('allowlist actions', () => {
  it('signs the request_add core4 expects and relays it', async () => {
    await submitAllowlistAction({ owner, password: 'pw', read: read(), action: { kind: 'request_add', address: a3 } });
    expect(posted).toHaveLength(1);
    expect(posted[0].path).toBe('/wallet/send-allowlist/actions');
    // Nonce 4, RequestAdd 0x03…: byte-identical to core4's own SignedSendAllowlistAction (vector 0).
    expect(JSON.stringify(posted[0].body)).toBe(JSON.stringify(vectors.sendAllowlist[0].signed));
  });

  it('a wrong password posts nothing', async () => {
    await expect(submitAllowlistAction({ owner, password: 'nope', read: read(), action: { kind: 'remove', address: a5 } }))
      .rejects.toThrow('Could not sign');
    expect(posted).toHaveLength(0);
  });
});

describe('security keys', () => {
  it('enable: registers a roaming key, has it co-sign the action, then the phrase signs', async () => {
    const creds = fakeCredentials();
    await enableSecurityKey({ owner, password: 'pw', status: status(), credentials: creds });
    expect((creds.calls.create[0] as any).publicKey.authenticatorSelection).toEqual({ authenticatorAttachment: 'cross-platform', residentKey: 'discouraged', userVerification: 'required' });
    const body = posted[0].body as any;
    expect(posted[0].path).toBe('/wallet/security-key/actions');
    expect(body.action).toEqual({ kind: 'enable', key: { public_key_p256: G, rp_id_hash: rpHash, credential_id: '09090909' }, escape_delay_blocks: 7855 });
    expect(body.nonce).toBe(0);
    expect(body.key_assertions).toHaveLength(1);
    expect(body.key_assertions[0].signature).toBe('3006020101020101');
    expect(body.owner_public_key).toBe(vectors.publicKey);
    // The key's challenge is SHA3-256 of exactly the bytes the phrase key signed.
    const { securityKeyActionMessage, securityKeyActionChallenge } = await import('../chainProtections');
    const msg = securityKeyActionMessage('888', 'testnet', owner, 0n, body.action);
    expect(bytesToHex(new Uint8Array(creds.calls.get[0].publicKey.challenge))).toBe(bytesToHex(securityKeyActionChallenge(msg)));
    expect(ed25519.verify(hexToBytes(body.owner_signature), msg, ed25519.getPublicKey(seed))).toBe(true);
  });

  it('a key registered for another site is not asked (and nothing is posted)', async () => {
    const other = status({ keys: [{ public_key_p256: G, rp_id_hash: '11'.repeat(32), credential_id: '09090909' }], required_to_spend: true });
    await expect(cancelSecurityKeyEscape({ owner, password: 'pw', status: other, credentials: fakeCredentials() })).rejects.toThrow(KEY_WRONG_SITE_MESSAGE);
    expect(posted).toHaveLength(0);
  });

  it('a cancelled touch is reported without unlocking the phrase', async () => {
    const keys = [{ public_key_p256: G, rp_id_hash: rpHash, credential_id: '09090909' }];
    await expect(assertSecurityKey(keys, new Uint8Array(32), { get: async () => { throw new Error('NotAllowedError'); } })).rejects.toThrow(KEY_CANCELLED_MESSAGE);
    expect(withOwnerKey).not.toHaveBeenCalled();
  });
});
