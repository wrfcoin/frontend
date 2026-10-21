import { describe, expect, it } from '@jest/globals';
import { ed25519 } from '@noble/curves/ed25519.js';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import vector from '../../../../contract-fixtures/wallet-key-scheme-vector.json';
import transferVector from '../../../../contract-fixtures/transparent-transfer-auth-vector.json';
import transferVector777 from '../../../../contract-fixtures/transparent-transfer-auth-vector-777.json';
import { bytesToHex, deriveAccount } from '../firstPartyKeys';
import { buildSignedTransfer, transparentTransferMessage } from '../transferPayload';

const hexToBytes = (hex: string): Uint8Array =>
  Uint8Array.from(hex.match(/.{2}/g) ?? [], byte => Number.parseInt(byte, 16));

describe('first-party wallet key scheme', () => {
  it('pins the shared fixture bytes copied from the CLI contract', () => {
    const bytes = readFileSync(new URL('../../../../contract-fixtures/wallet-key-scheme-vector.json', import.meta.url));
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(
      'b232464dea5cab623a481fb5eddbb2ec6a0cf04c6e8b80e590fe531f844b27d4',
    );
  });

  it('matches the shared cross-wallet vector', () => {
    const account = deriveAccount(vector.mnemonic, vector.passphrase);

    expect(bytesToHex(account.publicKey)).toBe(vector.ed25519_public_key_hex);
    expect(account.address).toBe(vector.address);
  });

  it('produces a verifiable login signature rather than a fabricated token', () => {
    const account = deriveAccount(vector.mnemonic);
    const message = new TextEncoder().encode('wrfcoin-login:challenge-123');
    const signature = account.sign(message);

    expect(bytesToHex(signature)).toHaveLength(128);
    expect(ed25519.verify(signature, message, account.publicKey)).toBe(true);
    expect(ed25519.verify(signature, new TextEncoder().encode('wrong challenge'), account.publicKey)).toBe(false);
  });

  it('signs the canonical transparent-transfer payload and binds every field', () => {
    const account = deriveAccount(vector.mnemonic);
    const input = {
      from: vector.address,
      to: '0x1111111111111111111111111111111111111111',
      amountBaseUnits: 125000000n,
      nonce: 7n,
      chainId: 'wrfcoin-main',
      networkId: 'mainnet',
    };
    const body = buildSignedTransfer(input, account);
    const message = transparentTransferMessage(input);

    expect(body).toMatchObject({
      from: vector.address,
      amount: '125000000',
      nonce: '7',
      auth_pubkey: vector.ed25519_public_key_hex,
    });
    expect(ed25519.verify(hexToBytes(body.auth_signature), message, account.publicKey)).toBe(true);
    expect(ed25519.verify(
      hexToBytes(body.auth_signature),
      transparentTransferMessage({ ...input, nonce: 8n }),
      account.publicKey,
    )).toBe(false);
  });

  it('rebuilds the byte-identical core4 authorization preimage in base units', () => {
    const bytes = readFileSync(new URL('../../../../contract-fixtures/transparent-transfer-auth-vector.json', import.meta.url));
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(
      'ebbc584576df327dcc3cdf7433b563f59c60471db2266847d3eaefb29b341886',
    );
    expect(transferVector.amount_unit).toBe('integer base units');
    const fixture = transferVector.case;
    expect(bytesToHex(transparentTransferMessage({
      chainId: fixture.chain_id,
      networkId: fixture.network_id,
      from: fixture.from,
      to: fixture.to,
      amountBaseUnits: BigInt(fixture.amount),
      nonce: BigInt(fixture.nonce),
    }))).toBe(fixture.preimage_hex);
  });

  // core4#3260: the live testnet folds chain_id "777" / network_id "testnet".
  // core4 produces these bytes and verifies the signature with authorize_debit.
  it('signs the live chain-777 transfer vector byte for byte', () => {
    const bytes = readFileSync(new URL('../../../../contract-fixtures/transparent-transfer-auth-vector-777.json', import.meta.url));
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(
      '9a37d7f71d316aaf863ec1612e4fe3a7cb43cf0f9b300717565958b4a08a20c8',
    );
    expect(transferVector777.domain_tag).toBe('wrfcoin_transparent_transfer_auth_v2');
    expect(transferVector777.amount_unit).toBe('integer base units (1 WRF = 100000000)');
    const fixture = transferVector777.case;
    expect(fixture.chain_id).toBe('777');
    expect(fixture.network_id).toBe('testnet');

    const account = deriveAccount(transferVector777.signer.mnemonic);
    expect(bytesToHex(account.publicKey)).toBe(transferVector777.signer.ed25519_public_key_hex);
    expect(account.address).toBe(fixture.from);

    const input = {
      chainId: fixture.chain_id,
      networkId: fixture.network_id,
      from: fixture.from,
      to: fixture.to,
      amountBaseUnits: BigInt(fixture.amount),
      nonce: BigInt(fixture.nonce),
    };
    expect(bytesToHex(transparentTransferMessage(input))).toBe(fixture.preimage_hex);
    const body = buildSignedTransfer(input, account);
    expect(body.amount).toBe(String(fixture.amount));
    expect(body.auth_pubkey).toBe(transferVector777.signer.ed25519_public_key_hex);
    expect(body.auth_signature).toBe(fixture.signature_hex);
  });
});
