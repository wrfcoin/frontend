/**
 * WebAuthn `create()` options for a new passkey account: the default lets the browser choose the
 * authenticator; the security-key choice asks for a roaming key (YubiKey). Both keep ES256, a
 * discoverable credential and required user verification.
 */
import { jest } from '@jest/globals';
import { passkeyCreationOptions, registerPasskey, hexToBytes } from '../passkey';

const fixedRandom = (bytes: Uint8Array) => bytes.fill(1);
const SPKI = hexToBytes(`3059301306072a8648ce3d020106082a8648ce3d030107034200${'04'}${'11'.repeat(64)}`);

describe('passkeyCreationOptions', () => {
  it('default: no attachment and no hints, so the browser offers everything it has', () => {
    const o = passkeyCreationOptions('wallet.example', 'label', 'any', fixedRandom);
    expect(o.authenticatorSelection).toEqual({ residentKey: 'required', userVerification: 'required' });
    expect(o).not.toHaveProperty('hints');
    expect(o.pubKeyCredParams).toEqual([{ type: 'public-key', alg: -7 }]);
    expect(o.rp).toEqual({ id: 'wallet.example', name: 'WRFCoin' });
    expect(o.attestation).toBe('none');
    expect(o.challenge).toHaveLength(32);
    expect(o.user.id).toHaveLength(16);
  });

  it('omitting the choice is the default', () => {
    expect(passkeyCreationOptions('a', 'b', undefined, fixedRandom)).toEqual(passkeyCreationOptions('a', 'b', 'any', fixedRandom));
  });

  it('security key: cross-platform plus the security-key hint, everything else unchanged', () => {
    const base = passkeyCreationOptions('wallet.example', 'label', 'any', fixedRandom);
    const key = passkeyCreationOptions('wallet.example', 'label', 'security-key', fixedRandom);
    expect(key.authenticatorSelection).toEqual({
      authenticatorAttachment: 'cross-platform', residentKey: 'required', userVerification: 'required',
    });
    expect(key).toHaveProperty('hints', ['security-key']);
    const { authenticatorSelection: _a, hints: _h, ...rest } = key as typeof key & { hints?: string[] };
    const { authenticatorSelection: _b, ...baseRest } = base;
    expect(rest).toEqual(baseRest);
  });
});

describe('registerPasskey', () => {
  const created = { rawId: new Uint8Array([1, 2, 3]).buffer, response: { getPublicKey: () => SPKI.buffer } };

  it.each([
    ['any' as const, undefined, undefined],
    ['security-key' as const, 'cross-platform', ['security-key']],
  ])('passes the %s choice through to credentials.create', async (choice, attachment, hints) => {
    const create = jest.fn(async (_options: any) => created);
    const record = await registerPasskey('wallet.example', 'label', { create, get: jest.fn() as any }, choice);
    const publicKey = create.mock.calls[0][0].publicKey;
    expect(publicKey.authenticatorSelection.authenticatorAttachment).toBe(attachment);
    expect(publicKey.hints).toEqual(hints);
    expect(publicKey.pubKeyCredParams).toEqual([{ type: 'public-key', alg: -7 }]);
    expect(publicKey.authenticatorSelection.residentKey).toBe('required');
    expect(publicKey.authenticatorSelection.userVerification).toBe('required');
    expect(record.rpId).toBe('wallet.example');
    expect(record.publicKeyXY).toEqual(new Uint8Array(64).fill(0x11));
  });

  it('defaults to letting the browser choose', async () => {
    const create = jest.fn(async (_options: any) => created);
    await registerPasskey('wallet.example', 'label', { create, get: jest.fn() as any });
    expect(create.mock.calls[0][0].publicKey.authenticatorSelection).toEqual({ residentKey: 'required', userVerification: 'required' });
  });
});
