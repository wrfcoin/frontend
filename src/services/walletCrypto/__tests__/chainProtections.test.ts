import { describe, it, expect } from '@jest/globals';
import { ed25519 } from '@noble/curves/ed25519.js';
import vectors from './chainProtections-vectors.json';
import { bytesToHex, hexToBytes } from '../passkey';
import {
  aboutBlocks,
  formatCountdown,
  securityKeyActionChallenge,
  securityKeyActionMessage,
  securityKeySpendChallenge,
  sendAllowlistActionMessage,
  signedSendAllowlistAction,
  type SecurityKeyActionBody,
  type SendAllowlistAction,
} from '../chainProtections';

const seed = hexToBytes(vectors.seedHex);
const publicKey = ed25519.getPublicKey(seed);
const account = vectors.account;
const a3 = `0x${'03'.repeat(20)}`;
const a5 = `0x${'05'.repeat(20)}`;

// Same order core4's generator printed them in.
const allowlistActions: [SendAllowlistAction, bigint][] = [
  [{ kind: 'request_add', address: a3 }, 4n],
  [{ kind: 'enable', addDelayBlocks: 2244, allowed: [a3, a5] }, 0n],
  [{ kind: 'cancel_add', address: a3 }, 5n],
  [{ kind: 'remove', address: a5 }, 6n],
  [{ kind: 'raise_delay', addDelayBlocks: 4488 }, 7n],
  [{ kind: 'request_disable' }, 8n],
  [{ kind: 'cancel_disable' }, 9n],
];

describe('send allowlist preimages match core4', () => {
  it('the seed derives the vector account', () => {
    expect(bytesToHex(publicKey)).toBe(vectors.publicKey);
  });

  allowlistActions.forEach(([action, nonce], i) => {
    it(`${action.kind} @ nonce ${nonce}: message bytes and signed JSON`, () => {
      const v = vectors.sendAllowlist[i];
      expect(bytesToHex(sendAllowlistActionMessage('888', account, action, nonce))).toBe(v.message);
      const signed = signedSendAllowlistAction({
        chainId: '888', account, action, actionNonce: nonce, publicKey, sign: m => ed25519.sign(m, seed),
      });
      // Byte-identical to serde_json of core4's SignedSendAllowlistAction (field order included).
      expect(JSON.stringify(signed)).toBe(JSON.stringify(v.signed));
    });
  });

  it('is bound to the chain id', () => {
    const [action, nonce] = allowlistActions[0];
    expect(bytesToHex(sendAllowlistActionMessage('777', account, action, nonce))).not.toBe(vectors.sendAllowlist[0].message);
  });
});

describe('security key preimages match core4', () => {
  vectors.securityKey.forEach((v, i) => {
    const body = v.body as SecurityKeyActionBody;
    it(`${body.kind} @ nonce ${i}: message, challenge, owner signature`, () => {
      const message = securityKeyActionMessage('888', 'testnet', account, BigInt(i), body);
      expect(bytesToHex(message)).toBe(v.message);
      expect(bytesToHex(securityKeyActionChallenge(message))).toBe(v.challenge);
      expect(bytesToHex(ed25519.sign(message, seed))).toBe(v.ownerSignature);
    });
  });

  it('spend challenge binds the account and the debit preimage', () => {
    const debit = new TextEncoder().encode(vectors.spendChallenge.debitMessageUtf8);
    expect(bytesToHex(securityKeySpendChallenge(account, debit))).toBe(vectors.spendChallenge.challenge);
  });

  it('refuses a malformed key instead of signing it', () => {
    expect(() => securityKeyActionMessage('888', 'testnet', account, 0n, {
      kind: 'add_key', key: { public_key_p256: 'ab', rp_id_hash: '11'.repeat(32), credential_id: '09' },
    })).toThrow('Malformed security key');
  });
});

describe('block times', () => {
  it('turns the owner delays into words at 77 s/block', () => {
    expect(aboutBlocks(2244)).toBe('about 48 hours');
    expect(aboutBlocks(1122)).toBe('about 24 hours');
    expect(aboutBlocks(7855)).toBe('about 7 days');
    expect(aboutBlocks(33662)).toBe('about 30 days');
  });

  it('formats a countdown', () => {
    expect(formatCountdown(((47 * 60 + 59) * 60 + 5) * 1000)).toBe('1 d 23 h 59 m 5 s');
    expect(formatCountdown(65_000)).toBe('1 m 5 s');
    expect(formatCountdown(-5)).toBe('0 m 0 s');
  });
});
