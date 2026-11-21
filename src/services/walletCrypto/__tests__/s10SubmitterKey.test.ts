import { jest } from '@jest/globals';
import { ed25519 } from '@noble/curves/ed25519.js';
import { sha3_256 } from '@noble/hashes/sha3.js';
import golden from './s10-submitter-key-888-vectors.json';
import base888 from './s10-888-vectors.json';
import { bytesToHex } from '../firstPartyKeys';
const unhex = (h: string) => Uint8Array.from(h.match(/../g)!, b => parseInt(b, 16));
import type { SubmitterKeyFields } from '../s10Signing';

(globalThis as any).__VITE_ENV__ = { VITE_WRFCOIN_CHAIN_ID: '888' };
const { stationSetSubmitterMessage, stationSecurityMessage, signTyped, isCanonicalSubmitterPubkey } = await import('../s10Signing');

function account(byte = 7) {
  const seed = new Uint8Array(32).fill(byte);
  const publicKey = ed25519.getPublicKey(seed);
  return { publicKey, address: `0x${bytesToHex(sha3_256(publicKey).slice(0, 20))}`, sign: jest.fn((m: Uint8Array) => ed25519.sign(m, seed)) };
}
function fields(v: (typeof golden.vectors)[number]): SubmitterKeyFields {
  return { ...v.fields, networkId: 'testnet', actionNonce: BigInt(v.fields.actionNonce), expiresAtHeight: BigInt(v.fields.expiresAtHeight) } as SubmitterKeyFields;
}
const relay = () => fields(golden.vectors.find(v => v.fields.submitter?.class === 'relay')!);
const device = () => fields(golden.vectors.find(v => v.fields.submitter?.class === 'device')!);
const clear = () => fields(golden.vectors.find(v => v.fields.submitter === null)!);

describe('set_submitter_key preimage (core4 station_owner_set_submitter_message_with_domain)', () => {
  test.each(golden.vectors)('golden $fields.submitter.class', v => {
    expect(bytesToHex(stationSetSubmitterMessage(fields(v)))).toBe(v.preimageHex);
    expect(bytesToHex(account().publicKey)).toBe(v.publicKey);
    expect(ed25519.verify(unhex(v.signatureHex), unhex(v.preimageHex), unhex(v.publicKey))).toBe(true);
  });

  test('web signer reproduces the golden Relay and clear signatures', () => {
    for (const f of [relay(), clear()]) {
      const v = golden.vectors.find(x => x.preimageHex === bytesToHex(stationSetSubmitterMessage(f)))!;
      expect(signTyped('stationSubmitterKey', f, account())).toEqual({ signer_public_key: v.publicKey, signature: v.signatureHex });
    }
  });

  test('same bytes as the core4-matched report_stolen vector with discriminant 5, then the tail', () => {
    // core4 shared-protocol/tests/station_submitter_key.rs:208-226 pins set = base(5) ++ 1 ++ len ++ key ++ class, clear = base(5) ++ 0.
    const stolen = base888.find(v => v.kind === 'stationSecurity' && v.fields.action === 'report_stolen')!;
    const head = stolen.preimageHex.length - 2 * 17; // the action byte, nonce u64, expiry u64
    const base5 = `${stolen.preimageHex.slice(0, head)}05${stolen.preimageHex.slice(head + 2)}`;
    expect(bytesToHex(stationSetSubmitterMessage(clear()))).toBe(`${base5}00`);
    const key = relay().submitter!.pubkey;
    expect(bytesToHex(stationSetSubmitterMessage(relay()))).toBe(`${base5}0140000000${bytesToHex(new TextEncoder().encode(key))}02`);
    expect(bytesToHex(stationSetSubmitterMessage(device()))).toBe(`${base5}0140000000${bytesToHex(new TextEncoder().encode(key))}01`);
  });

  test('the older actions keep their bytes', () => {
    const stolen = base888.find(v => v.kind === 'stationSecurity' && v.fields.action === 'report_stolen')!;
    const f: any = { ...stolen.fields, actionNonce: 7n, expiresAtHeight: 21000n };
    expect(bytesToHex(stationSecurityMessage(f))).toBe(stolen.preimageHex);
  });

  test('every field, the key and the class are bound by the signature', () => {
    const a = account(); const f = relay(); const sig = a.sign(stationSetSubmitterMessage(f));
    const other = bytesToHex(account(10).publicKey);
    for (const changed of [
      { ...f, stationId: 'other' }, { ...f, actionNonce: 8n }, { ...f, expiresAtHeight: 21001n },
      { ...f, submitter: { pubkey: other, class: 'relay' as const } }, device(), clear(),
    ]) expect(ed25519.verify(sig, stationSetSubmitterMessage(changed), a.publicKey)).toBe(false);
  });
});

describe('set_submitter_key refusals before key use', () => {
  test('web refuses to sign a Device approval (phone-only)', () => {
    const a = account(); expect(() => signTyped('stationSubmitterKey', device(), a)).toThrow(); expect(a.sign).not.toHaveBeenCalled();
  });
  test.each([
    ['uppercase', 'AB'.repeat(32)], ['short', 'ab'.repeat(31)], ['non-hex', 'zz'.repeat(32)], ['0x-prefixed', `0x${'ab'.repeat(31)}`],
    ['not a point', `02${'00'.repeat(31)}`], ['empty', ''],
  ])('non-canonical key: %s', (_name, pubkey) => {
    const a = account();
    expect(isCanonicalSubmitterPubkey(pubkey)).toBe(false);
    expect(() => signTyped('stationSubmitterKey', { ...relay(), submitter: { pubkey, class: 'relay' } }, a)).toThrow();
    expect(a.sign).not.toHaveBeenCalled();
  });
  test.each([{ class: 'owner' }, { class: undefined }, {}])('bad submitter shape %p', bad => {
    const a = account();
    expect(() => signTyped('stationSubmitterKey', { ...relay(), submitter: { pubkey: relay().submitter!.pubkey, ...bad } as any }, a)).toThrow();
    expect(() => signTyped('stationSubmitterKey', { ...relay(), submitter: undefined as any }, a)).toThrow();
    expect(a.sign).not.toHaveBeenCalled();
  });
  test.each([{ chainId: '777' }, { networkId: 'mainnet' }, { stationId: 'a b' }, { ownerAddress: account(8).address }, { actionNonce: -1n }, { expiresAtHeight: 1n << 64n }])('invalid fields %p', change => {
    const a = account(); expect(() => signTyped('stationSubmitterKey', { ...relay(), ...change } as SubmitterKeyFields, a)).toThrow(); expect(a.sign).not.toHaveBeenCalled();
  });
  test('the golden submitter key is canonical', () => {
    expect(isCanonicalSubmitterPubkey(relay().submitter!.pubkey)).toBe(true);
  });
});
