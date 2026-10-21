// Run with the backend's tsx from the frontend worktree; arg is a detached backend checkout.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { ed25519 } from '@noble/curves/ed25519.js';
import { sha3_256 } from '@noble/hashes/sha3.js';
import { signTyped, type S10Fields } from '../../../src/services/walletCrypto/s10Signing';
import { bytesToHex } from '../../../src/services/walletCrypto/firstPartyKeys';

async function main() {
const root = process.argv[2];
const { verifiedGovernanceVote } = await import(pathToFileURL(`${root}/server/utils/governance-vote-signature.ts`).href);
const { validateOwnerActionBody } = await import(pathToFileURL(`${root}/server/routes/station-owner-routes.ts`).href);
process.env.WRFCOIN_GOVERNANCE_CHAIN_ID = '777';
process.env.WRFCOIN_GOVERNANCE_NETWORK_ID = 'testnet';
process.env.WRFCOIN_GOVERNANCE_SIGNING_VERSION = '1';
const vectors = JSON.parse(readFileSync('src/services/walletCrypto/__tests__/s10-mobile-vectors.json', 'utf8'));
const web: any[] = [];
for (const v of vectors) {
  const fields: any = Object.fromEntries(Object.entries(v.fields).map(([k, value]) => [k, ['transferNonce', 'actionNonce', 'expiresAtHeight'].includes(k) ? BigInt(value as string) : value]));
  const seed = new Uint8Array(32).fill(v.kind === 'stationAccept' ? 8 : 7);
  const publicKey = ed25519.getPublicKey(seed);
  const address = `0x${bytesToHex(sha3_256(publicKey).slice(0, 20))}`;
  const signed = signTyped(v.kind as keyof S10Fields, fields, {publicKey, address, sign: m => ed25519.sign(m, seed)});
  assert.equal(signed.signature, v.signatureHex);
  if (v.kind === 'vote') {
    const user = {role: 'wallet', wallet_scheme: 'ed25519', sub: address};
    const body = {support: fields.approve, ...signed};
    assert.equal(verifiedGovernanceVote(user, fields.proposalId, body).payload.approve, fields.approve);
    assert.throws(() => verifiedGovernanceVote(user, fields.proposalId, {...body, support: !fields.approve}));
  } else if (v.kind === 'stationSecurity') {
    const payload = {tx_kind: 'station_owner_action_v1', station_id: fields.stationId, owner_address: fields.ownerAddress, owner_pubkey: signed.signer_public_key, action: fields.action, action_nonce: Number(fields.actionNonce), expires_at_height: Number(fields.expiresAtHeight), owner_signature: signed.signature};
    const result = validateOwnerActionBody({kind: 'owner_action', payload}, fields.stationId);
    assert.equal(result.txKind, payload.tx_kind);
    web.push(payload);
  } else if (v.kind === 'stationAccept') {
    const payload = {tx_kind: 'station_owner_transfer_v1', station_id: fields.stationId, from_owner_address: fields.fromOwnerAddress, from_owner_pubkey: fields.senderPublicKey, to_owner_address: fields.toOwnerAddress, to_owner_pubkey: fields.toOwnerPubkey, transfer_nonce: Number(fields.transferNonce), expires_at_height: Number(fields.expiresAtHeight), from_owner_signature: fields.senderSignature, to_owner_signature: signed.signature};
    assert.equal(validateOwnerActionBody({kind: 'transfer', payload}, fields.stationId).txKind, payload.tx_kind);
    web.push(payload);
  }
}
writeFileSync('/tmp/sol-s10-web-payloads.json', JSON.stringify(web, null, 2));
console.log('BACKEND_S10_PASS: 2 votes verified, 2 mutated votes rejected, 4 security actions and 1 dual-signed transfer admitted by body validator. Station crypto verification belongs to core4.');
}
main().catch(e => { console.error(e); process.exitCode = 1; });
