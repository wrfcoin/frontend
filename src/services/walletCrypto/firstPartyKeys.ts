import { ed25519 } from '@noble/curves/ed25519.js';
import { hmac } from '@noble/hashes/hmac.js';
import { pbkdf2 } from '@noble/hashes/pbkdf2.js';
import { sha512 } from '@noble/hashes/sha2.js';
import { sha3_256 } from '@noble/hashes/sha3.js';

const textEncoder = new TextEncoder();

export const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');

export interface FirstPartyAccount {
  publicKey: Uint8Array;
  address: string;
  sign(message: Uint8Array): Uint8Array;
  destroy?(): void;
}

export function deriveAccount(mnemonic: string, passphrase = ''): FirstPartyAccount {
  const normalizedMnemonic = mnemonic.trim().replace(/\s+/g, ' ').normalize('NFKD');
  const salt = `mnemonic${passphrase.normalize('NFKD')}`;
  const bip39Seed = pbkdf2(
    sha512,
    textEncoder.encode(normalizedMnemonic),
    textEncoder.encode(salt),
    { c: 2048, dkLen: 64 },
  );
  const slip10 = hmac(sha512, textEncoder.encode('ed25519 seed'), bip39Seed);
  const secretKey = slip10.slice(0, 32);
  const publicKey = ed25519.getPublicKey(secretKey);
  const address = `0x${bytesToHex(sha3_256(publicKey).slice(0, 20))}`;
  bip39Seed.fill(0);
  slip10.fill(0);
  let destroyed = false;

  return {
    publicKey,
    address,
    sign: (message: Uint8Array) => {
      if (destroyed) throw new Error('Signer was released');
      return ed25519.sign(message, secretKey);
    },
    destroy: () => { secretKey.fill(0); destroyed = true; },
  };
}
