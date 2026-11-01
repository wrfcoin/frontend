/**
 * Node bond payout approval by passkey. The NodeBondAuthorization body, the V2 framing and the
 * NodeBondPossession subject are pinned against core4's own golden file (node-bond-golden.json, copied
 * from shared-protocol/tests/fixtures/golden/node_share_contracts_v1.jsonc). The payout passkey subject
 * challenge, every intermediate and an example approval are pinned against core4's
 * passkey_bond_payout_vectors.json from core4#108 (shared-protocol/tests/fixtures/, head 577ce29,
 * copied unchanged).
 */
import { jest } from '@jest/globals';
import { p256 } from '@noble/curves/nist.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { sha3_256 } from '@noble/hashes/sha3.js';
import golden from './node-bond-golden.json';
import pkVectors from './passkey_bond_payout_vectors.json';
import { bytesToHex, hexToBytes, passkeyRecordAddress, type PasskeyCredentialRecord } from '../passkey';
import {
  BondPacketError,
  NODE_BOND_PAYOUT_PASSKEY_TAG,
  accountHex,
  nodeBondPayoutPasskeyBody,
  approvalRefusal,
  approveBondPayout,
  domainPreimageV2,
  lengthPrefixed,
  nodeBondAuthorizationBody,
  nodeBondAuthorizationHash,
  nodeBondPayoutPasskeyChallenge,
  parseBondPacket,
  type NodeBondAuthorization,
} from '../nodeBondPayout';

const identity = { chainId: golden.chain_id, networkId: golden.network_id };
const authCase = golden.cases.find(c => c.kind === 'NodeBondAuthorization')!;
const possessionCase = golden.cases.find(c => c.kind === 'NodeBondPossession')!;
const input = authCase.input as Record<string, any>;

const authorization: NodeBondAuthorization = {
  genesisHash: Uint8Array.from(input.genesis_hash),
  deploymentId: Uint8Array.from(input.deployment_id),
  ownerAccount: Uint8Array.from(input.owner_account),
  escrowAccount: Uint8Array.from(input.escrow_account),
  payoutAccount: Uint8Array.from(input.payout_account),
  serverKey: Uint8Array.from(input.server_key),
  consumerKey: Uint8Array.from(input.consumer_key),
  serviceAlias: input.service_alias,
  action: input.action,
  amountUnits: BigInt(input.amount_units),
  expectedNonce: BigInt(input.expected_nonce),
  effectiveEpoch: BigInt(input.effective_epoch),
};

describe('core4 golden vectors', () => {
  test('NodeBondAuthorization canonical body matches core4', () => {
    expect(bytesToHex(nodeBondAuthorizationBody(authorization))).toBe(authCase.canonical_body_hex);
  });

  test('NodeBondAuthorization V2 preimage matches core4', () => {
    expect(bytesToHex(domainPreimageV2(authCase.tag, identity, nodeBondAuthorizationBody(authorization)))).toBe(authCase.preimage_v2_hex);
  });

  test('the authorization hash is SHA3-256 of that preimage', () => {
    expect(bytesToHex(nodeBondAuthorizationHash(authorization, identity))).toBe(bytesToHex(sha3_256(hexToBytes(authCase.preimage_v2_hex))));
  });

  test('a hash-only subject (NodeBondPossession, Server) frames like core4', () => {
    const p = possessionCase.input as Record<string, any>;
    const body = new Uint8Array([...lengthPrefixed(Uint8Array.from(p.authorization_preimage_hash)), 0, 0, 0, 0]);
    expect(bytesToHex(body)).toBe(possessionCase.canonical_body_hex);
    expect(bytesToHex(domainPreimageV2(possessionCase.tag, identity, body))).toBe(possessionCase.preimage_v2_hex);
  });
});

test('payout passkey challenge: own tag over the length-prefixed authorization hash', () => {
  const hash = nodeBondAuthorizationHash(authorization, identity);
  const expected = sha3_256(domainPreimageV2(NODE_BOND_PAYOUT_PASSKEY_TAG, identity, lengthPrefixed(hash)));
  expect(bytesToHex(nodeBondPayoutPasskeyChallenge(authorization, identity))).toBe(bytesToHex(expected));
  // Bound to the chain: another network gives another challenge.
  expect(bytesToHex(nodeBondPayoutPasskeyChallenge(authorization, { ...identity, networkId: 'mainnet' }))).not.toBe(bytesToHex(expected));
  // Bound to every field: the epoch changes it.
  expect(bytesToHex(nodeBondPayoutPasskeyChallenge({ ...authorization, effectiveEpoch: 13n }, identity))).not.toBe(bytesToHex(expected));
});

// ---------------------------------------------------------------------------------------------------
// Packets

const priv = p256.utils.randomSecretKey();
const xy = p256.getPublicKey(priv, false).slice(1);
const record: PasskeyCredentialRecord = { credentialId: new Uint8Array([1, 2, 3]), publicKeyXY: xy, rpId: 'wrfcoin.com' };
const myAddress = passkeyRecordAddress(record);
const myAccount = Array.from(hexToBytes(myAddress.slice(2)));

function lifecycle(overrides: Record<string, unknown> = {}) {
  return {
    signed: {
      authorization: { ...input, payout_account: myAccount, ...overrides },
      owner_signature: [], server_signature: [], consumer_signature: [],
    },
    owner_key: Array(32).fill(9),
    governance_key: Array(32).fill(8),
    governance_signature: [],
    payout_key: null,
    payout_signature: [],
  };
}
const transaction = (data: object) => ({ id: 'abc', tx_type: 'NodeBondLifecycle', nonce: 11, fee: 1000000, data: JSON.stringify(data) });

describe('parseBondPacket', () => {
  test('reads a whole transaction, the dry-run output and a bare lifecycle', () => {
    for (const [text, container] of [
      [JSON.stringify(transaction(lifecycle())), 'transaction'],
      [JSON.stringify({ dry_run: true, transaction: transaction(lifecycle()) }), 'dry-run'],
      [JSON.stringify(lifecycle()), 'lifecycle'],
    ] as const) {
      const p = parseBondPacket(text);
      expect(p.container).toBe(container);
      expect(p.authorization.serviceAlias).toBe('snapshot-golden.example');
      expect(p.authorization.effectiveEpoch).toBe(12n);
    }
  });

  test('accepts hex byte fields', () => {
    const p = parseBondPacket(JSON.stringify(lifecycle({ deployment_id: `0x${'02'.repeat(32)}` })));
    expect(bytesToHex(p.authorization.deploymentId)).toBe('02'.repeat(32));
  });

  test.each([
    ['not json', '{', /not valid JSON/],
    ['no authorization', '{"signed":{}}', /no signed.authorization/],
    ['bad action', JSON.stringify(lifecycle({ action: 'Steal' })), /action/],
    ['short account', JSON.stringify(lifecycle({ payout_account: [1, 2] })), /payout account/],
    ['unsafe number', JSON.stringify(lifecycle()).replace('"amount_units":250000000000', '"amount_units":18446744073709551615'), /cannot keep exactly/],
  ])('refuses %s', (_name, text, message) => {
    expect(() => parseBondPacket(text)).toThrow(BondPacketError);
    expect(() => parseBondPacket(text)).toThrow(message);
  });
});

describe('approvalRefusal', () => {
  test('allows a deposit or update paying this wallet', () => {
    expect(approvalRefusal(parseBondPacket(JSON.stringify(lifecycle())), myAddress)).toBeNull();
    expect(approvalRefusal(parseBondPacket(JSON.stringify(lifecycle({ action: 'Update' }))), myAddress.toUpperCase().replace('0X', '0x'))).toBeNull();
  });
  test('refuses another payout account', () => {
    expect(approvalRefusal(parseBondPacket(JSON.stringify(lifecycle({ payout_account: Array(20).fill(5) }))), myAddress)).toMatch(/not this passkey wallet/);
  });
  test('refuses exit and withdraw', () => {
    expect(approvalRefusal(parseBondPacket(JSON.stringify(lifecycle({ action: 'Exit' }))), myAddress)).toMatch(/bond exit/);
    expect(approvalRefusal(parseBondPacket(JSON.stringify(lifecycle({ action: 'Withdraw' }))), myAddress)).toMatch(/bond withdraw/);
  });
});

describe('approveBondPayout', () => {
  /** A WebAuthn get() that really signs authenticatorData ‖ SHA-256(clientDataJSON) with `priv`. */
  function authenticator() {
    const seen: Uint8Array[] = [];
    const get = jest.fn(async (options: any) => {
      const challenge = options.publicKey.challenge as Uint8Array;
      seen.push(challenge);
      const clientDataJSON = new TextEncoder().encode(JSON.stringify({ type: 'webauthn.get', challenge: Buffer.from(challenge).toString('base64url'), origin: 'https://wrfcoin.com' }));
      const authenticatorData = new Uint8Array([...sha256(new TextEncoder().encode('wrfcoin.com')), 0x05, 0, 0, 0, 1]);
      const signed = new Uint8Array([...authenticatorData, ...sha256(clientDataJSON)]);
      const signature = p256.sign(signed, priv, { format: 'der' });
      return { response: { authenticatorData, clientDataJSON, signature } };
    });
    return { get, seen };
  }

  test('signs the payout challenge and writes payout_passkey into the same file shape', async () => {
    const creds = authenticator();
    const packet = parseBondPacket(JSON.stringify({ dry_run: true, transaction: transaction({ ...lifecycle(), payout_key: Array(32).fill(4), payout_signature: [1, 2] }) }));
    const { json, auth } = await approveBondPayout(packet, record, identity, creds);
    expect(bytesToHex(creds.seen[0])).toBe(bytesToHex(nodeBondPayoutPasskeyChallenge(packet.authorization, identity)));
    const out = JSON.parse(json);
    expect(out.dry_run).toBe(true);
    expect(out.transaction.id).toBe('abc');
    const data = JSON.parse(out.transaction.data);
    expect(data.payout_passkey).toEqual(auth);
    expect(data.payout_key).toBeNull();
    expect(data.payout_signature).toEqual([]);
    expect(data.signed).toEqual(packet.lifecycle.signed);
    expect(auth.public_key_p256).toBe(bytesToHex(xy));
    expect(auth.rp_id_hash).toBe(bytesToHex(sha256(new TextEncoder().encode('wrfcoin.com'))));
    // The signature verifies over authenticatorData ‖ SHA-256(clientDataJSON), low-s.
    const msg = new Uint8Array([...hexToBytes(auth.authenticator_data), ...sha256(hexToBytes(auth.client_data_json))]);
    expect(p256.verify(hexToBytes(auth.signature), msg, p256.getPublicKey(priv, false), { format: 'der', lowS: true })).toBe(true);
  });

  test('never prompts the passkey for a packet that pays someone else', async () => {
    const creds = authenticator();
    const packet = parseBondPacket(JSON.stringify(lifecycle({ payout_account: Array(20).fill(5) })));
    await expect(approveBondPayout(packet, record, identity, creds)).rejects.toThrow(/not this passkey wallet/);
    expect(creds.get).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------------------------------
// core4 passkey_bond_payout golden vectors (shared-protocol/tests/fixtures/passkey_bond_payout_vectors.json)

describe('core4 passkey_bond_payout vectors', () => {
  const pk = pkVectors.passkey_address;
  const vectorRecord: PasskeyCredentialRecord = { credentialId: new Uint8Array([1]), publicKeyXY: hexToBytes(pk.public_key_p256_xy_hex), rpId: pk.rp_id };

  test('the vector passkey address matches this wallet code', () => {
    expect(bytesToHex(sha256(new TextEncoder().encode(pk.rp_id)))).toBe(pk.rp_id_hash_hex);
    expect(passkeyRecordAddress(vectorRecord)).toBe(pk.address_hex);
  });

  describe.each(pkVectors.cases.map(c => [c.name, c] as const))('%s', (_name, c) => {
    const id = { chainId: c.chain_id, networkId: c.network_id };
    const packet = parseBondPacket(JSON.stringify({ id: null, tx_type: 'NodeBondLifecycle', data: c.unsigned_lifecycle_json }));
    const a = packet.authorization;

    test('the exact tx.data string parses to the same lifecycle object', () => {
      expect(packet.lifecycle).toEqual(c.unsigned_lifecycle);
      expect(accountHex(a.payoutAccount)).toBe(c.payout_account_hex);
    });

    test('every intermediate matches core4', () => {
      const authBody = nodeBondAuthorizationBody(a);
      expect(bytesToHex(authBody)).toBe(c.authorization_canonical_body_hex);
      expect(bytesToHex(domainPreimageV2(pkVectors.authorization_domain_tag, id, authBody))).toBe(c.authorization_v2_preimage_hex);
      const authHash = nodeBondAuthorizationHash(a, id);
      expect(bytesToHex(authHash)).toBe(c.authorization_preimage_hash_hex);
      const approvalBody = nodeBondPayoutPasskeyBody(authHash);
      expect(bytesToHex(approvalBody)).toBe(c.approval_canonical_body_hex);
      expect(bytesToHex(domainPreimageV2(pkVectors.approval_domain_tag, id, approvalBody))).toBe(c.approval_v2_preimage_hex);
      expect(NODE_BOND_PAYOUT_PASSKEY_TAG).toBe(pkVectors.approval_domain_tag);
    });

    test('challenge matches core4 (hex and base64url)', () => {
      const challenge = nodeBondPayoutPasskeyChallenge(a, id);
      expect(bytesToHex(challenge)).toBe(c.challenge_hex);
      expect(Buffer.from(challenge).toString('base64url')).toBe(c.challenge_base64url);
    });

    test('the page output carries exactly the example payout_passkey that core4 verifies', async () => {
      const ex = c.example_payout_passkey;
      const get = jest.fn(async (options: any) => {
        expect(bytesToHex(options.publicKey.challenge)).toBe(c.challenge_hex);
        return { response: { authenticatorData: hexToBytes(ex.authenticator_data), clientDataJSON: hexToBytes(ex.client_data_json), signature: hexToBytes(ex.signature) } };
      });
      const { json } = await approveBondPayout(packet, vectorRecord, id, { get });
      const data = JSON.parse(JSON.parse(json).data);
      expect(data.payout_passkey).toEqual(ex);
      expect(Object.keys(data.payout_passkey).sort()).toEqual(Object.keys(ex).sort());
      expect(data.payout_key).toBeNull();
      expect(data.payout_signature).toEqual([]);
      expect(data.signed).toEqual(c.unsigned_lifecycle.signed);
      expect(JSON.parse(new TextDecoder().decode(hexToBytes(ex.client_data_json))).challenge).toBe(c.challenge_base64url);
    });
  });
});
