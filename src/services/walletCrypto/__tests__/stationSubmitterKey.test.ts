/** @jest-environment jsdom */
import { jest, beforeAll, afterAll, beforeEach, it, expect } from '@jest/globals';
import { webcrypto } from 'node:crypto';
import { ed25519 } from '@noble/curves/ed25519.js';
import vector from '../../../../contract-fixtures/transparent-transfer-auth-vector-888.json';
import { installWebLocks, createWebLocksStub } from '../../__fixtures__/webLocksStub';
import { saveVault } from '../../walletVault';
import { bytesToHex, deriveAccount } from '../firstPartyKeys';

(globalThis as any).__VITE_ENV__ = { VITE_WRFCOIN_CHAIN_ID: '888' };
const svc = await import('../stationSubmitterKey');
const { stationSetSubmitterMessage } = await import('../s10Signing');
Object.defineProperty(globalThis.crypto, 'subtle', { value: webcrypto.subtle, configurable: true });
let restore: () => void;
beforeAll(() => { restore = installWebLocks(createWebLocksStub()); });
afterAll(() => restore());

const owner = vector.case.from;
const relay = bytesToHex(ed25519.getPublicKey(new Uint8Array(32).fill(9)));
const request = (relayPubkey: string | null) => ({ stationId: 'station-relay-1', ownerAddress: owner, ownerNonce: 4, observedAtHeight: 30000, relayPubkey });
const unhex = (h: string) => Uint8Array.from(h.match(/../g)!, b => parseInt(b, 16));

beforeEach(async () => {
  localStorage.clear();
  await saveVault(vector.signer.mnemonic, owner, 'public test password');
});

it('signs a Relay approval with core4 field names, order and preimage', async () => {
  const payload = await svc.signSubmitterKeyAction(request(relay), 'public test password');
  expect(Object.keys(payload)).toEqual([
    'tx_kind', 'station_id', 'owner_address', 'owner_pubkey', 'action', 'action_nonce', 'expires_at_height',
    'owner_signature', 'submitter_pubkey', 'submitter_class',
  ]);
  expect(payload).toMatchObject({
    tx_kind: 'station_owner_action_v1', station_id: 'station-relay-1', owner_address: owner, action: 'set_submitter_key',
    action_nonce: 4, expires_at_height: 30000 + svc.SUBMITTER_KEY_VALIDITY_BLOCKS, submitter_pubkey: relay, submitter_class: 'relay',
  });
  const message = stationSetSubmitterMessage(svc.submitterKeyFields(request(relay)));
  expect(ed25519.verify(unhex(payload.owner_signature as string), message, unhex(payload.owner_pubkey as string))).toBe(true);
  expect(payload.owner_pubkey).toBe(vector.signer.ed25519_public_key_hex);
}, 30000);

it('a clear omits the submitter fields and signs flag 0', async () => {
  const payload = await svc.signSubmitterKeyAction(request(null), 'public test password');
  expect('submitter_pubkey' in payload || 'submitter_class' in payload).toBe(false);
  const message = stationSetSubmitterMessage(svc.submitterKeyFields(request(null)));
  expect(message[message.length - 1]).toBe(0);
  expect(ed25519.verify(unhex(payload.owner_signature as string), message, unhex(payload.owner_pubkey as string))).toBe(true);
}, 30000);

it('refuses a wrong password, the owner key, an alias, or a vault that is not the owner', async () => {
  await expect(svc.signSubmitterKeyAction(request(relay), 'wrong')).rejects.toThrow('Unable to sign');
  await expect(svc.signSubmitterKeyAction(request(vector.signer.ed25519_public_key_hex), 'public test password')).rejects.toThrow('Unable to sign');
  await expect(svc.signSubmitterKeyAction({ ...request(relay), stationId: 'st_406339c8ab53' }, 'public test password')).rejects.toThrow('raw station id');
  await expect(svc.signSubmitterKeyAction({ ...request(relay), ownerAddress: `0x${'1'.repeat(40)}` }, 'public test password')).rejects.toThrow('not this station');
}, 60000);

it('normalises and explains key input', () => {
  expect(svc.normalizeSubmitterKeyInput(`  0x${relay.toUpperCase()} `)).toBe(relay);
  expect(svc.submitterKeyInputError(relay)).toBeNull();
  expect(svc.submitterKeyInputError('')).toMatch(/Paste/);
  expect(svc.submitterKeyInputError('xyz')).toMatch(/0-9/);
  expect(svc.submitterKeyInputError('ab')).toMatch(/64 hex/);
  expect(svc.submitterKeyInputError(`02${'00'.repeat(31)}`)).toMatch(/not a valid/);
});

it('submits {kind: owner_action, payload} to the alias route and needs accepted_pending_confirmation', async () => {
  const fetchMock = jest.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ success: true, status: 'accepted_pending_confirmation', transactionIds: ['t1'] }), { status: 201, headers: { 'content-type': 'application/json' } }));
  globalThis.fetch = fetchMock;
  const res = await svc.submitSubmitterKeyAction('station-relay-1', { tx_kind: 'station_owner_action_v1' });
  expect(res).toEqual({ status: 'accepted_pending_confirmation', transactionIds: ['t1'] });
  const [url, init] = fetchMock.mock.calls[0];
  expect(String(url)).toMatch(/\/api\/stations\/st_[0-9a-f]{12}\/owner-actions$/);
  expect(JSON.parse(String(init?.body))).toEqual({ kind: 'owner_action', payload: { tx_kind: 'station_owner_action_v1' } });
  deriveAccount(vector.signer.mnemonic).destroy?.();
});
