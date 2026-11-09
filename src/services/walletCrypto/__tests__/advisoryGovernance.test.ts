import { describe, it, expect } from '@jest/globals';
import { ed25519 } from '@noble/curves/ed25519.js';
import vectors from './advisoryGovernance-vectors.json';
import { bytesToHex, hexToBytes, type PasskeyAuthJson } from '../passkey';
import {
  advisoryActionMessage,
  advisoryPasskeyChallenge,
  advisoryTextProblem,
  signedEd25519Action,
  signedPasskeyAction,
  type AdvisoryAction,
} from '../advisoryGovernance';

/** Vectors written by core4 itself (core4#146 shared-protocol, CLI build_transaction shape). */
type Case = (typeof vectors.cases)[number];
const seed = hexToBytes(vectors.ed25519_private_key_seed_hex);
const publicKey = ed25519.getPublicKey(seed);

function actionOf(c: Case): AdvisoryAction {
  const a = c.signed.action as { propose?: { title: string; summary: string }; vote?: { proposal_id: string; approve: boolean } };
  return a.propose
    ? { kind: 'propose', title: a.propose.title, summary: a.propose.summary }
    : { kind: 'vote', proposalId: a.vote!.proposal_id, approve: a.vote!.approve };
}

describe('advisory governance signing matches core4', () => {
  vectors.cases.forEach(c => {
    it(`${c.name}: message and passkey challenge bytes`, () => {
      const message = advisoryActionMessage(c.chain_id, c.network_id, c.account, actionOf(c), BigInt(c.signed.nonce));
      expect(bytesToHex(message)).toBe(c.message_hex);
      expect(bytesToHex(advisoryPasskeyChallenge(message))).toBe(c.passkey_challenge_hex);
    });
  });

  vectors.cases.filter(c => c.name.startsWith('ed25519')).forEach(c => {
    it(`${c.name}: the 12-word wallet produces the exact signed JSON (and data string) core4 built`, () => {
      const body = signedEd25519Action({
        chainId: c.chain_id, networkId: c.network_id, account: c.account, action: actionOf(c), nonce: BigInt(c.signed.nonce),
        publicKey, sign: m => ed25519.sign(m, seed),
      });
      expect(body).toEqual(c.signed);
      expect(JSON.stringify(body)).toBe(c.data);
    });
  });

  vectors.cases.filter(c => c.name.startsWith('passkey')).forEach(c => {
    it(`${c.name}: the passkey wallet's JSON is the data string core4 built`, () => {
      // assertPasskey (buildPasskeyAuth) emits the members in serde order; rebuild the fixture's in that order.
      const p = (c.signed as unknown as { passkey: PasskeyAuthJson }).passkey;
      const passkey: PasskeyAuthJson = {
        public_key_p256: p.public_key_p256, rp_id_hash: p.rp_id_hash, authenticator_data: p.authenticator_data,
        client_data_json: p.client_data_json, signature: p.signature,
      };
      const body = signedPasskeyAction(c.account, actionOf(c), BigInt(c.signed.nonce), passkey);
      expect(JSON.stringify(body)).toBe(c.data);
      expect(body).not.toHaveProperty('public_key');
      expect(body).not.toHaveProperty('signature');
    });
  });

  it('text rules mirror core4 (bytes, one-line title, controls, bidi)', () => {
    expect(advisoryTextProblem('title', 'a'.repeat(160))).toBeNull();
    expect(advisoryTextProblem('title', 'a'.repeat(161))).toMatch(/161 bytes/);
    expect(advisoryTextProblem('title', '€'.repeat(54))).toMatch(/162 bytes/);
    expect(advisoryTextProblem('title', '  ')).toMatch(/empty/);
    expect(advisoryTextProblem('title', 'a\nb')).toMatch(/one line/);
    expect(advisoryTextProblem('summary', 'a\nb')).toBeNull();
    expect(advisoryTextProblem('summary', 'a‮b')).toMatch(/U\+202E/);
    expect(advisoryTextProblem('summary', 'a\u0007b')).toMatch(/U\+0007/);
    expect(advisoryTextProblem('title', 'Café, 東京, 🌧')).toBeNull();
  });
});
