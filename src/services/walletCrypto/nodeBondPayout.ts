/**
 * Approving a passkey wallet as the payout account of a node bond. Ports the core4 node contract
 * preimage (shared-protocol `crypto::chain_binding::domain_preimage_bound` at V2 and
 * `consensus::node_share_contracts`), reads the unsigned NodeBondLifecycle packet the node CLI writes,
 * and fills in `payout_passkey` from one WebAuthn assertion. Nothing here talks to a server.
 *
 * Wire layout (every length is u64 little-endian):
 *   preimage_v2(tag, body) = len‖tag ‖ len‖chain_id ‖ len‖network_id ‖ u32le(2) ‖ len‖body
 *   node_contract_digest   = SHA3-256(preimage_v2)
 */
import { sha3_256 } from '@noble/hashes/sha3.js';
import { assertPasskey, bytesToHex, concat, hexToBytes, passkeyRecordAddress, u64le, type PasskeyAuthJson, type PasskeyCredentialRecord } from './passkey';

const encoder = new TextEncoder();

export const NODE_BOND_AUTHORIZATION_TAG = 'wrfcoin.node_bond_authorization.v1';
export const NODE_BOND_PAYOUT_PASSKEY_TAG = 'wrfcoin.node_bond_payout_passkey.v1';
const SIGNING_PROTOCOL_V2 = 2;

export const NODE_BOND_ACTIONS = ['Deposit', 'Update', 'Exit', 'Withdraw'] as const;
export type NodeBondAction = typeof NODE_BOND_ACTIONS[number];

export interface ChainIdentity {
  chainId: string;
  networkId: string;
}

/** core4 `NodeBondAuthorization`, field for field. */
export interface NodeBondAuthorization {
  genesisHash: Uint8Array;
  deploymentId: Uint8Array;
  ownerAccount: Uint8Array;
  escrowAccount: Uint8Array;
  payoutAccount: Uint8Array;
  serverKey: Uint8Array;
  consumerKey: Uint8Array;
  serviceAlias: string;
  action: NodeBondAction;
  amountUnits: bigint;
  expectedNonce: bigint;
  effectiveEpoch: bigint;
}

const u32le = (n: number): Uint8Array => { const b = new Uint8Array(4); new DataView(b.buffer).setUint32(0, n, true); return b; };
/** `push_length_prefixed`: u64 LE length, then the bytes. */
export const lengthPrefixed = (bytes: Uint8Array): Uint8Array => concat(u64le(BigInt(bytes.length)), bytes);

/** `domain_preimage_bound(tag, identity, V2, body)`. */
export function domainPreimageV2(tag: string, identity: ChainIdentity, canonicalBody: Uint8Array): Uint8Array {
  return concat(
    lengthPrefixed(encoder.encode(tag)),
    lengthPrefixed(encoder.encode(identity.chainId)),
    lengthPrefixed(encoder.encode(identity.networkId)),
    u32le(SIGNING_PROTOCOL_V2),
    lengthPrefixed(canonicalBody),
  );
}

/** `node_contract_digest`: SHA3-256 of the V2 preimage. */
export const nodeContractDigest = (tag: string, identity: ChainIdentity, canonicalBody: Uint8Array): Uint8Array =>
  sha3_256(domainPreimageV2(tag, identity, canonicalBody));

/** `NodeBondAuthorization::canonical_body`. */
export function nodeBondAuthorizationBody(a: NodeBondAuthorization): Uint8Array {
  return concat(
    lengthPrefixed(a.genesisHash),
    lengthPrefixed(a.deploymentId),
    lengthPrefixed(a.ownerAccount),
    lengthPrefixed(a.escrowAccount),
    lengthPrefixed(a.payoutAccount),
    lengthPrefixed(a.serverKey),
    lengthPrefixed(a.consumerKey),
    lengthPrefixed(encoder.encode(a.serviceAlias)),
    u32le(NODE_BOND_ACTIONS.indexOf(a.action)),
    u64le(a.amountUnits),
    u64le(a.expectedNonce),
    u64le(a.effectiveEpoch),
  );
}

/** `authorization_preimage_hash`: the digest every role approval of this bond binds. */
export const nodeBondAuthorizationHash = (a: NodeBondAuthorization, identity: ChainIdentity): Uint8Array =>
  nodeContractDigest(NODE_BOND_AUTHORIZATION_TAG, identity, nodeBondAuthorizationBody(a));

/** Canonical body of the payout passkey subject: the authorization hash, length-prefixed. */
export const nodeBondPayoutPasskeyBody = (authorizationHash: Uint8Array): Uint8Array => lengthPrefixed(authorizationHash);

/** The 32-byte WebAuthn challenge for approving `a`'s payout account with a passkey. */
export const nodeBondPayoutPasskeyChallenge = (a: NodeBondAuthorization, identity: ChainIdentity): Uint8Array =>
  nodeContractDigest(NODE_BOND_PAYOUT_PASSKEY_TAG, identity, nodeBondPayoutPasskeyBody(nodeBondAuthorizationHash(a, identity)));

// ---------------------------------------------------------------------------------------------------
// Packet handling

/** Why a packet was refused, in words for the page. */
export class BondPacketError extends Error {}

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type JsonObject = { [key: string]: Json };

const isObject = (v: unknown): v is JsonObject => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Where the lifecycle sits in the file, so the download keeps the same shape. */
type Container = 'transaction' | 'dry-run' | 'lifecycle';

export interface ParsedBondPacket {
  container: Container;
  /** The whole file as read. */
  document: JsonObject;
  /** The NodeBondLifecycle object (parsed from `data` when the file is a transaction). */
  lifecycle: JsonObject;
  authorization: NodeBondAuthorization;
}

/** Serde writes `[u8; N]` and `Address` as arrays of numbers; hex (with or without 0x) is accepted too. */
function bytesField(value: Json | undefined, length: number, name: string): Uint8Array {
  if (Array.isArray(value)) {
    if (value.length !== length || !value.every(b => typeof b === 'number' && Number.isInteger(b) && b >= 0 && b <= 255)) {
      throw new BondPacketError(`The ${name} field is not ${length} bytes.`);
    }
    return Uint8Array.from(value as number[]);
  }
  if (typeof value === 'string') {
    const hex = value.replace(/^0x/i, '');
    if (hex.length === length * 2) {
      try { return hexToBytes(hex); } catch { /* fall through */ }
    }
  }
  throw new BondPacketError(`The ${name} field is missing or not ${length} bytes.`);
}

function u64Field(value: Json | undefined, name: string): bigint {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) return BigInt(value);
  if (typeof value === 'string' && /^\d{1,20}$/.test(value)) {
    const v = BigInt(value);
    if (v <= 0xffffffffffffffffn) return v;
  }
  throw new BondPacketError(`The ${name} field is not a whole number.`);
}

/** JavaScript numbers lose precision past 2^53; refuse a file this page could not write back exactly. */
function assertExactNumbers(value: unknown): void {
  if (typeof value === 'number' && !Number.isSafeInteger(value)) {
    throw new BondPacketError('This file has a number this page cannot keep exactly, so it was not opened.');
  }
  if (Array.isArray(value)) value.forEach(assertExactNumbers);
  else if (isObject(value)) Object.values(value).forEach(assertExactNumbers);
}

function parseJson(text: string, what: string): Json {
  try { return JSON.parse(text) as Json; } catch { throw new BondPacketError(`${what} is not valid JSON.`); }
}

function readAuthorization(lifecycle: JsonObject): NodeBondAuthorization {
  const signed = lifecycle.signed;
  const a = isObject(signed) ? signed.authorization : undefined;
  if (!isObject(a)) throw new BondPacketError('This is not a node bond packet: it has no signed.authorization.');
  const action = a.action;
  if (typeof action !== 'string' || !(NODE_BOND_ACTIONS as readonly string[]).includes(action)) {
    throw new BondPacketError('The bond action is not one this page knows.');
  }
  const alias = a.service_alias;
  if (typeof alias !== 'string' || alias.length === 0) throw new BondPacketError('The service alias is missing.');
  return {
    genesisHash: bytesField(a.genesis_hash, 32, 'genesis hash'),
    deploymentId: bytesField(a.deployment_id, 32, 'deployment id'),
    ownerAccount: bytesField(a.owner_account, 20, 'owner account'),
    escrowAccount: bytesField(a.escrow_account, 20, 'escrow account'),
    payoutAccount: bytesField(a.payout_account, 20, 'payout account'),
    serverKey: bytesField(a.server_key, 32, 'server key'),
    consumerKey: bytesField(a.consumer_key, 32, 'consumer key'),
    serviceAlias: alias,
    action: action as NodeBondAction,
    amountUnits: u64Field(a.amount_units, 'amount'),
    expectedNonce: u64Field(a.expected_nonce, 'nonce'),
    effectiveEpoch: u64Field(a.effective_epoch, 'effective epoch'),
  };
}

/**
 * Read the file the node CLI writes: a whole transaction (lifecycle JSON in `data`), the dry-run output
 * (`{ "transaction": … }`), or a bare NodeBondLifecycle object.
 */
export function parseBondPacket(text: string): ParsedBondPacket {
  const document = parseJson(text.trim(), 'The file');
  if (!isObject(document)) throw new BondPacketError('This is not a node bond packet.');
  assertExactNumbers(document);
  let container: Container;
  let lifecycle: Json;
  if (isObject(document.transaction) && typeof document.transaction.data === 'string') {
    container = 'dry-run';
    lifecycle = parseJson(document.transaction.data, 'The transaction data');
  } else if (typeof document.data === 'string') {
    container = 'transaction';
    lifecycle = parseJson(document.data, 'The transaction data');
  } else {
    container = 'lifecycle';
    lifecycle = document;
  }
  if (!isObject(lifecycle)) throw new BondPacketError('This is not a node bond packet.');
  assertExactNumbers(lifecycle);
  return { container, document, lifecycle, authorization: readAuthorization(lifecycle) };
}

export const accountHex = (bytes: Uint8Array): string => `0x${bytesToHex(bytes)}`;

/** Why this passkey may not approve the packet, or null when it may. */
export function approvalRefusal(packet: ParsedBondPacket, passkeyAddress: string): string | null {
  const a = packet.authorization;
  if (a.action !== 'Deposit' && a.action !== 'Update') {
    return `This is a bond ${a.action.toLowerCase()}. Only a deposit or an update names a payout account, so there is nothing to approve.`;
  }
  if (accountHex(a.payoutAccount) !== passkeyAddress.toLowerCase()) {
    return 'The payout account in this file is not this passkey wallet, so it cannot be approved here.';
  }
  return null;
}

/**
 * The same file with the passkey approval in place: `payout_passkey` set, and the ed25519 payout key and
 * signature cleared (the chain takes exactly one of the two). The other approvals are left as they are.
 */
export function withPayoutPasskey(packet: ParsedBondPacket, auth: PasskeyAuthJson): string {
  const lifecycle: JsonObject = { ...packet.lifecycle, payout_key: null, payout_signature: [], payout_passkey: { ...auth } };
  const data = JSON.stringify(lifecycle);
  if (packet.container === 'lifecycle') return JSON.stringify(lifecycle);
  if (packet.container === 'transaction') return JSON.stringify({ ...packet.document, data });
  const tx = packet.document.transaction as JsonObject;
  return JSON.stringify({ ...packet.document, transaction: { ...tx, data } });
}

/** Run the passkey over this packet's challenge after checking it names this wallet. */
export async function approveBondPayout(
  packet: ParsedBondPacket,
  record: PasskeyCredentialRecord,
  identity: ChainIdentity,
  credentials?: Parameters<typeof assertPasskey>[2],
): Promise<{ json: string; auth: PasskeyAuthJson }> {
  const refusal = approvalRefusal(packet, passkeyRecordAddress(record));
  if (refusal) throw new BondPacketError(refusal);
  const challenge = nodeBondPayoutPasskeyChallenge(packet.authorization, identity);
  const auth = await assertPasskey(record, challenge, credentials);
  return { json: withPayoutPasskey(packet, auth), auth };
}
