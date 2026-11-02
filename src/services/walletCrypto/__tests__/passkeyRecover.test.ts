/**
 * Opening an existing passkey from signatures alone. A software authenticator with a real P-256 key goes
 * through the real creation path, then its two assertions must give back that record exactly. The core4
 * vector cross-checks the recovered key and the address against core4's own output.
 */
import { jest } from '@jest/globals';
import { p256 } from '@noble/curves/nist.js';
import { sha256 } from '@noble/hashes/sha2.js';
import vector from './passkey-vector.json';
import {
  bytesToHex, concat, hexToBytes, passkeyRecordAddress, registerPasskey, signPasskeyTransfer,
} from '../passkey';
import {
  PasskeyRecoveryError, recoverCandidateKeys, recoverPasskeyRecord, requestPasskeyRecoveryAssertion, webAuthnSignedMessage,
  type PasskeyRecoveryAssertion,
} from '../passkeyRecover';

const encoder = new TextEncoder();
const SPKI_HEADER = hexToBytes('3059301306072a8648ce3d020106082a8648ce3d030107034200');
const N = p256.Point.Fn.ORDER;
const b64url = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

interface Tweaks { flags?: number; type?: string; rpId?: string; challenge?: Uint8Array; forceHighS?: boolean; signature?: Uint8Array }

/** A software authenticator with a real key: `create` returns its SPKI, `get` signs what WebAuthn signs. */
function softwareAuthenticator(secret: Uint8Array = p256.utils.randomSecretKey(), id = Uint8Array.of(1, 2, 3, 4), tweaks: Tweaks = {}) {
  let counter = 0;
  const publicKey = p256.getPublicKey(secret, false);
  const get = jest.fn(async ({ publicKey: o }: any) => {
    const clientDataJSON = encoder.encode(JSON.stringify({
      type: tweaks.type ?? 'webauthn.get', challenge: b64url(tweaks.challenge ?? o.challenge), origin: `https://${o.rpId}`,
    }));
    counter += 1;
    const authenticatorData = concat(
      sha256(encoder.encode(tweaks.rpId ?? o.rpId)), Uint8Array.of(tweaks.flags ?? 0x05), Uint8Array.of(0, 0, 0, counter),
    );
    const der = p256.sign(webAuthnSignedMessage(authenticatorData, clientDataJSON), secret, { format: 'der' });
    const low = p256.Signature.fromBytes(der, 'der');
    const signature = tweaks.signature ?? (tweaks.forceHighS ? new p256.Signature(low.r, N - low.s).toBytes('der') : der);
    return { rawId: id.slice().buffer, response: { authenticatorData, clientDataJSON, signature } };
  });
  const create = jest.fn(async () => ({
    rawId: id.slice().buffer,
    response: { getPublicKey: () => concat(SPKI_HEADER, publicKey).buffer },
  }));
  return { get, create, publicKey };
}

async function twoTouches(rpId: string, auth: { get: any }): Promise<[PasskeyRecoveryAssertion, PasskeyRecoveryAssertion]> {
  const first = await requestPasskeyRecoveryAssertion(rpId, undefined, auth);
  return [first, await requestPasskeyRecoveryAssertion(rpId, first.credentialId, auth)];
}

const failure = (fn: () => unknown): string => {
  try { fn(); } catch (e) { if (e instanceof PasskeyRecoveryError) return e.code; throw e; }
  throw new Error('expected a PasskeyRecoveryError');
};

describe('against core4', () => {
  const signed = webAuthnSignedMessage(hexToBytes(vector.authenticator_data), hexToBytes(vector.client_data_json));

  it('core4 SoftwareAuthenticator signature: its public key is one of the two candidates', () => {
    const candidates = recoverCandidateKeys(signed, hexToBytes(vector.signature_der)).map(bytesToHex);
    expect(candidates).toHaveLength(2);
    expect(candidates).toContain(vector.public_key_p256);
  });

  it('the candidate core4 signed with derives the address core4 emitted, with the same function creation uses', () => {
    const xy = recoverCandidateKeys(signed, hexToBytes(vector.signature_der)).find((k) => bytesToHex(k) === vector.public_key_p256)!;
    expect(passkeyRecordAddress({ credentialId: new Uint8Array(1), publicKeyXY: xy, rpId: vector.rp_id })).toBe(vector.from);
  });

  it('the high-s twin of the core4 signature gives the same two candidates', () => {
    const der = hexToBytes(vector.signature_der);
    const low = p256.Signature.fromBytes(der, 'der');
    const twin = new p256.Signature(low.r, N - low.s).toBytes('der');
    expect(recoverCandidateKeys(signed, twin).map(bytesToHex).sort()).toEqual(recoverCandidateKeys(signed, der).map(bytesToHex).sort());
  });
});

describe('against the real creation path', () => {
  it('fixed key on wrfcoin.com: recovers exactly the record registerPasskey stored', async () => {
    const auth = softwareAuthenticator(hexToBytes('c9afa9d845ba75166b5c215767b1d6934e50c3db36e89b127b8a622b120f6721'));
    const created = await registerPasskey('wrfcoin.com', 'label', auth as any);
    const recovered = recoverPasskeyRecord('wrfcoin.com', ...await twoTouches('wrfcoin.com', auth));
    expect(bytesToHex(recovered.publicKeyXY)).toBe(bytesToHex(created.publicKeyXY));
    expect(bytesToHex(recovered.credentialId)).toBe(bytesToHex(created.credentialId));
    expect(recovered.rpId).toBe(created.rpId);
    expect(passkeyRecordAddress(recovered)).toBe(passkeyRecordAddress(created));
    expect(auth.create).toHaveBeenCalledTimes(1); // only the registerPasskey above
  });

  it.each([[false], [true]])('many random keys, high-s %s', async (forceHighS) => {
    for (let i = 0; i < 25; i++) {
      const auth = softwareAuthenticator(undefined, undefined, { forceHighS });
      const created = await registerPasskey('wrfcoin.com', 'label', auth as any);
      const recovered = recoverPasskeyRecord('wrfcoin.com', ...await twoTouches('wrfcoin.com', auth));
      expect(passkeyRecordAddress(recovered)).toBe(passkeyRecordAddress(created));
    }
  });

  it('a recovered record signs a transfer for its own address', async () => {
    const auth = softwareAuthenticator();
    const recovered = recoverPasskeyRecord('wrfcoin.com', ...await twoTouches('wrfcoin.com', auth));
    const from = passkeyRecordAddress(recovered);
    const body = await signPasskeyTransfer(recovered, {
      chainId: '888', networkId: 'testnet', from, to: `0x${'1'.repeat(40)}`, amountBaseUnits: 1n, nonce: 0n,
    }, auth);
    expect(body.passkey_auth.public_key_p256).toBe(bytesToHex(recovered.publicKeyXY));
    expect(p256.verify(
      hexToBytes(body.passkey_auth.signature),
      webAuthnSignedMessage(hexToBytes(body.passkey_auth.authenticator_data), hexToBytes(body.passkey_auth.client_data_json)),
      auth.publicKey,
      { format: 'der', lowS: true },
    )).toBe(true);
  });
});

describe('what it asks the authenticator', () => {
  it('first touch lists nothing, second names the chosen passkey; fresh 32-byte challenges; verification required; never create', async () => {
    const auth = softwareAuthenticator();
    await twoTouches('wrfcoin.com', auth);
    const [first, second] = auth.get.mock.calls.map(([o]: any) => o.publicKey);
    expect(first.rpId).toBe('wrfcoin.com');
    expect(first).not.toHaveProperty('allowCredentials');
    expect(second.allowCredentials).toEqual([{ type: 'public-key', id: Uint8Array.of(1, 2, 3, 4) }]);
    expect(first.userVerification).toBe('required');
    expect(second.userVerification).toBe('required');
    expect(first.challenge).toHaveLength(32);
    expect(bytesToHex(first.challenge)).not.toBe(bytesToHex(second.challenge));
    expect(auth.create).not.toHaveBeenCalled();
  });

  it('a cancelled prompt passes the browser error through', async () => {
    const get = jest.fn(async () => { throw Object.assign(new Error('x'), { name: 'NotAllowedError' }); });
    await expect(requestPasskeyRecoveryAssertion('wrfcoin.com', undefined, { get } as any)).rejects.toMatchObject({ name: 'NotAllowedError' });
  });
});

describe('fails closed', () => {
  const good = softwareAuthenticator();
  const touches = () => twoTouches('wrfcoin.com', good);

  it('different credential IDs', async () => {
    const [first] = await touches();
    const other = softwareAuthenticator(undefined, Uint8Array.of(9, 9));
    const second = await requestPasskeyRecoveryAssertion('wrfcoin.com', undefined, other);
    expect(failure(() => recoverPasskeyRecord('wrfcoin.com', first, second))).toBe('DIFFERENT_CREDENTIAL');
  });

  it('same credential ID but a different key: no candidate verifies both', async () => {
    const [first] = await touches();
    const second = await requestPasskeyRecoveryAssertion('wrfcoin.com', first.credentialId, softwareAuthenticator());
    expect(failure(() => recoverPasskeyRecord('wrfcoin.com', first, second))).toBe('NOT_RECOVERABLE');
  });

  it('the same assertion twice', async () => {
    const [first] = await touches();
    expect(failure(() => recoverPasskeyRecord('wrfcoin.com', first, first))).toBe('NOT_RECOVERABLE');
  });

  it('second signature tampered', async () => {
    const [first, second] = await touches();
    const data = second.authenticatorData.slice(); data[36] ^= 0xff;
    expect(failure(() => recoverPasskeyRecord('wrfcoin.com', first, { ...second, authenticatorData: data }))).toBe('NOT_RECOVERABLE');
  });

  it.each<[string, Tweaks]>([
    ['user not verified', { flags: 0x01 }],
    ['user not present', { flags: 0x04 }],
    ['wrong ceremony', { type: 'webauthn.create' }],
    ['another site', { rpId: 'evil.example' }],
    ['someone else\'s challenge', { challenge: new Uint8Array(32).fill(7) }],
    ['not a P-256 DER signature (64 raw bytes)', { signature: new Uint8Array(64).fill(5) }],
  ])('%s', async (_name, tweaks) => {
    const bad = softwareAuthenticator(undefined, undefined, tweaks);
    const [first, second] = await twoTouches('wrfcoin.com', bad);
    expect(failure(() => recoverPasskeyRecord('wrfcoin.com', first, second))).toBe('NOT_RECOVERABLE');
  });

  it('an RP ID other than the one asked for', async () => {
    const [first, second] = await touches();
    expect(failure(() => recoverPasskeyRecord('www.wrfcoin.com', first, second))).toBe('NOT_RECOVERABLE');
  });
});
