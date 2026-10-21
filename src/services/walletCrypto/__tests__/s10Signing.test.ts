import { jest } from '@jest/globals';
import { ed25519 } from '@noble/curves/ed25519.js';
import { sha3_256 } from '@noble/hashes/sha3.js';
import vectors from './s10-mobile-vectors.json';
import { bytesToHex } from '../firstPartyKeys';
import { transparentTransferMessage } from '../transferPayload';
import type { S10Fields, TransferFields, SecurityFields } from '../s10Signing';
(globalThis as any).__VITE_ENV__ = { VITE_WRFCOIN_CHAIN_ID: '777' };
const { governanceVoteMessage, stationSecurityMessage, stationTransferMessage, stationAcceptMessage, signTyped } = await import('../s10Signing');

function account(byte = 7) {
  const seed = new Uint8Array(32).fill(byte);
  const publicKey = ed25519.getPublicKey(seed);
  return { publicKey, address: `0x${bytesToHex(sha3_256(publicKey).slice(0, 20))}`, sign: jest.fn((m: Uint8Array) => ed25519.sign(m, seed)) };
}
function fields(v: (typeof vectors)[number]): any {
  return Object.fromEntries(Object.entries(v.fields).map(([k, val]) => [k, ['actionNonce', 'transferNonce', 'expiresAtHeight'].includes(k) ? BigInt(val as string) : val]));
}
const transfer = () => fields(vectors.find(v => v.kind === 'stationTransfer')!) as TransferFields;
const security = () => fields(vectors.find(v => v.kind === 'stationSecurity')!) as SecurityFields;

describe('S10 mobile-derived golden vectors', () => {
  test.each(vectors)('$kind $fields.action $fields.approve', v => {
    const f = fields(v);
    const msg = v.kind === 'vote' ? governanceVoteMessage(f) : v.kind === 'stationSecurity' ? stationSecurityMessage(f) : v.kind === 'stationTransfer' ? stationTransferMessage(f) : stationAcceptMessage(f);
    expect(bytesToHex(msg)).toBe(v.preimageHex);
    const a = account(v.kind === 'stationAccept' ? 8 : 7);
    expect(bytesToHex(a.publicKey)).toBe(v.publicKey);
    expect(signTyped(v.kind as keyof S10Fields, f, a)).toEqual({ signer_public_key: v.publicKey, signature: v.signatureHex });
  });
  test('every station field is bound by the signature', () => {
    const f = transfer(); const a = account(); const msg = stationTransferMessage(f);
    const signature = a.sign(msg);
    for (const changed of [
      {...f, stationId: 'other'}, {...f, transferNonce: 8n}, {...f, expiresAtHeight: 21001n},
      {...f, fromOwnerAddress: account(9).address},
      {...f, toOwnerAddress: account(9).address, toOwnerPubkey: bytesToHex(account(9).publicKey)},
    ]) expect(ed25519.verify(signature, stationTransferMessage(changed), a.publicKey)).toBe(false);
    expect(ed25519.verify(signature, stationAcceptMessage(f), a.publicKey)).toBe(false);
  });
});

describe('S10 signing refusal before key use', () => {
  test.each(['message', 'signMessage', 'toString', '__proto__', 'wrfcoin_transparent_transfer_auth_v2'])('unknown kind %s', kind => {
    const a = account(); expect(() => signTyped(kind as keyof S10Fields, {} as any, a)).toThrow(); expect(a.sign).not.toHaveBeenCalled();
  });
  test.each(['wrfcoin_test', 'wrfcoin.test', 'wrfcoin/test', 'permissionless-v1|x', new Uint8Array([1]), 'hello'])('raw input refused: %s', input => {
    const a = account(); expect(() => signTyped('vote', input as any, a)).toThrow(); expect(a.sign).not.toHaveBeenCalled();
  });
  test.each([-1n, 1n << 64n, 7, NaN, '7'])('invalid u64 %s', n => {
    const a = account(); expect(() => signTyped('stationSecurity', {...security(), actionNonce: n as bigint}, a)).toThrow(); expect(a.sign).not.toHaveBeenCalled();
  });
  test('max u64 does not wrap', () => {
    expect(bytesToHex(stationSecurityMessage({...security(), actionNonce: (1n << 64n) - 1n}))).toContain('ffffffffffffffff');
  });
  test.each([{action: 'toString'}, {action: {toString: (): string => 'report_stolen'}}, {chainId: '1'}, {networkId: 'mainnet'}, {stationId: 'a b'}, {stationId: ''}, {ownerAddress: account(8).address}])('invalid security fields %p', change => {
    const a = account(); expect(() => signTyped('stationSecurity', {...security(), ...change} as SecurityFields, a)).toThrow(); expect(a.sign).not.toHaveBeenCalled();
  });
  test('rejects wrong recipient key, sender and account binding', () => {
    const a = account();
    expect(() => signTyped('stationTransfer', {...transfer(), toOwnerPubkey: bytesToHex(a.publicKey)}, a)).toThrow();
    expect(() => signTyped('stationTransfer', transfer(), account(8))).toThrow();
    expect(() => signTyped('vote', {proposalId: 'ok', approve: true}, {...a, address: account(8).address})).toThrow();
    expect(a.sign).not.toHaveBeenCalled();
  });
  test('accept rejects altered offer, forged sender and wrong recipient', () => {
    const f = fields(vectors.find(v => v.kind === 'stationAccept')!);
    const a = account(8);
    for (const change of [{transferNonce: 8n}, {senderSignature: '00'.repeat(64)}, {senderPublicKey: bytesToHex(a.publicKey)}]) {
      expect(() => signTyped('stationAccept', {...f, ...change}, a)).toThrow();
    }
    expect(() => signTyped('stationAccept', f, account())).toThrow();
    expect(a.sign).not.toHaveBeenCalled();
  });
  test.each([{proposalId: 'x|reject'}, {proposalId: 'x.y'}, {proposalId: ''}, {approve: 'false'}])('invalid vote %p', change => {
    const a = account(); expect(() => signTyped('vote', {proposalId: 'ok', approve: true, ...change} as any, a)).toThrow(); expect(a.sign).not.toHaveBeenCalled();
  });
});

test('core4 transparent-transfer preimage cannot reach the S10 signer as bytes or text', () => {
  const a = account();
  const bytes = transparentTransferMessage({ chainId: '777', networkId: 'testnet', from: a.address, to: account(8).address, amountBaseUnits: 1n, nonce: 0n });
  for (const kind of ['vote', 'stationSecurity', 'stationTransfer', 'stationAccept'] as const) {
    for (const value of [bytes, new TextDecoder().decode(bytes)]) {
      expect(() => signTyped(kind, value as any, a)).toThrow();
    }
  }
  expect(a.sign).not.toHaveBeenCalled();
});
