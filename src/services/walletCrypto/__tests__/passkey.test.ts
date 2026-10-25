/**
 * Passkey (WebAuthn P-256) wallet crypto, checked against vectors emitted by core4's own
 * `SoftwareAuthenticator` (shared-protocol accounts::passkey::test_support) with
 * chain "CHAIN" / network "NET": address, pinned message bytes, challenge, and a conforming
 * low-s assertion. See passkey-vector.json.
 */
import { jest } from '@jest/globals';
import { p256 } from '@noble/curves/nist.js';
import { sha256 } from '@noble/hashes/sha2.js';
import vector from './passkey-vector.json';
import {
  derToLowS,
  hexToBytes,
  passkeyAddress,
  passkeyTransferChallenge,
  passkeyTransferMessage,
  publicKeyXYFromSpki,
  buildPasskeyAuth,
  signPasskeyTransfer,
  bytesToHex,
} from '../passkey';

const xy = hexToBytes(vector.public_key_p256);
const rpIdHash = hexToBytes(vector.rp_id_hash);
const fields = {
  chainId: vector.chain_id, networkId: vector.network_id, from: vector.from, to: vector.to,
  amountBaseUnits: BigInt(vector.amount), nonce: BigInt(vector.nonce),
};
const N = p256.Point.Fn.ORDER;

/** The high-s twin of a DER signature (what an authenticator may legitimately emit). */
function highSTwin(der: Uint8Array): Uint8Array {
  const sig = p256.Signature.fromBytes(der, 'der');
  return new p256.Signature(sig.r, N - sig.s).toBytes('der');
}

test('address derivation matches core4 passkey_account_address', () => {
  expect(passkeyAddress(rpIdHash, xy)).toBe(vector.from);
});

test('transfer message bytes and challenge match core4', () => {
  const message = passkeyTransferMessage(fields);
  expect(bytesToHex(message)).toBe(vector.message_hex);
  expect(bytesToHex(passkeyTransferChallenge(message))).toBe(vector.challenge_hex);
});

test('a conforming low-s DER signature passes through unchanged', () => {
  const der = hexToBytes(vector.signature_der);
  expect(bytesToHex(derToLowS(der))).toBe(vector.signature_der);
});

test('a high-s signature is normalised back to the low-s form', () => {
  const der = hexToBytes(vector.signature_der);
  const twin = highSTwin(der);
  expect(bytesToHex(twin)).not.toBe(vector.signature_der);
  expect(bytesToHex(derToLowS(twin))).toBe(vector.signature_der);
});

test('the vector signature verifies over authenticatorData || sha256(clientDataJSON)', () => {
  const signed = new Uint8Array([...hexToBytes(vector.authenticator_data), ...sha256(hexToBytes(vector.client_data_json))]);
  const point = new Uint8Array([4, ...xy]);
  expect(p256.verify(hexToBytes(vector.signature_der), signed, point, { format: 'der', lowS: true })).toBe(true);
});

test('buildPasskeyAuth emits the wire form core4 deserialises (all hex, low-s)', () => {
  const auth = buildPasskeyAuth({
    publicKeyXY: xy, rpIdHash,
    authenticatorData: hexToBytes(vector.authenticator_data),
    clientDataJSON: hexToBytes(vector.client_data_json),
    signatureDer: highSTwin(hexToBytes(vector.signature_der)),
  });
  expect(auth).toEqual({
    public_key_p256: vector.public_key_p256, rp_id_hash: vector.rp_id_hash,
    authenticator_data: vector.authenticator_data, client_data_json: vector.client_data_json,
    signature: vector.signature_der,
  });
});

test('signPasskeyTransfer asks the authenticator for the core4 challenge and returns the request body', async () => {
  const get = jest.fn(async (opts: any) => ({
    response: {
      authenticatorData: hexToBytes(vector.authenticator_data).buffer,
      clientDataJSON: hexToBytes(vector.client_data_json).buffer,
      signature: highSTwin(hexToBytes(vector.signature_der)).buffer,
    },
  }));
  const body = await signPasskeyTransfer(
    { credentialId: new Uint8Array([1, 2, 3]), publicKeyXY: xy, rpId: vector.rp_id },
    fields,
    { get } as any,
  );
  const opts = (get.mock.calls[0] as any[])[0];
  expect(bytesToHex(new Uint8Array(opts.publicKey.challenge))).toBe(vector.challenge_hex);
  expect(opts.publicKey.rpId).toBe(vector.rp_id);
  expect(opts.publicKey.userVerification).toBe('required');
  expect(body).toEqual({
    from: vector.from, to: vector.to, amount: String(vector.amount), nonce: String(vector.nonce),
    passkey_auth: {
      public_key_p256: vector.public_key_p256, rp_id_hash: vector.rp_id_hash,
      authenticator_data: vector.authenticator_data, client_data_json: vector.client_data_json,
      signature: vector.signature_der,
    },
  });
});

test('signPasskeyTransfer refuses a sender that is not the credential account', async () => {
  await expect(signPasskeyTransfer(
    { credentialId: new Uint8Array([1]), publicKeyXY: xy, rpId: vector.rp_id },
    { ...fields, from: '0x2222222222222222222222222222222222222222' },
    { get: jest.fn() } as any,
  )).rejects.toThrow(/does not match/);
});

test('publicKeyXYFromSpki extracts X‖Y from a P-256 SubjectPublicKeyInfo', () => {
  const spkiPrefix = hexToBytes('3059301306072a8648ce3d020106082a8648ce3d030107034200');
  const spki = new Uint8Array([...spkiPrefix, 4, ...xy]);
  expect(bytesToHex(publicKeyXYFromSpki(spki))).toBe(vector.public_key_p256);
  expect(() => publicKeyXYFromSpki(spki.slice(0, 60))).toThrow();
});
