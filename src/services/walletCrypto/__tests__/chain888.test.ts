import type { S10Fields } from '../s10Signing';
import { jest } from '@jest/globals';
import { ed25519 } from '@noble/curves/ed25519.js';
import { sha3_256 } from '@noble/hashes/sha3.js';
import { webcrypto } from 'node:crypto';
import vector from '../../../../contract-fixtures/transparent-transfer-auth-vector-888.json';
import vectors from './s10-888-vectors.json';
import { bytesToHex, deriveAccount } from '../firstPartyKeys';
import { transparentTransferMessage, buildSignedTransfer } from '../transferPayload';
import { saveVault } from '../../walletVault';
import { installWebLocks, createWebLocksStub } from '../../__fixtures__/webLocksStub';

(globalThis as any).__VITE_ENV__ = { VITE_WRFCOIN_CHAIN_ID: '888' };
const { signVaultTransfer, previewVaultTransfer, validatePreview } = await import('../vaultTransfer');
const s10 = await import('../s10Signing');
const p = { from: vector.case.from, to: vector.case.to, amountBaseUnits: '150000000', nonce: '7', chainId: '888', networkId: 'testnet' } as const;
Object.defineProperty(globalThis.crypto, 'subtle', { value: webcrypto.subtle, configurable: true });
let restore: () => void;
beforeAll(() => { restore = installWebLocks(createWebLocksStub()); });
afterAll(() => restore());

test('888 transfer preimage and signature match independent Python vector', async () => {
  const fields = { ...p, amountBaseUnits: 150000000n, nonce: 7n };
  const account = deriveAccount(vector.signer.mnemonic);
  expect(bytesToHex(transparentTransferMessage(fields))).toBe(vector.case.preimage_hex);
  expect(buildSignedTransfer(fields, account).auth_signature).toBe(vector.case.signature_hex);
  localStorage.clear();
  await saveVault(vector.signer.mnemonic, p.from, 'public test password');
  expect((await signVaultTransfer(p, 'public test password')).auth_signature).toBe(vector.case.signature_hex);
  account.destroy?.();
}, 30000);
test('preview uses configured 888 and refuses a stale 777 preview before unlock', async () => {
  globalThis.fetch = jest.fn<typeof fetch>().mockResolvedValue(new Response('{"nonce":"7"}', {status: 200}));
  expect(await previewVaultTransfer(p.from, p.to, '1.5')).toEqual(p);
  expect(() => validatePreview({...p, chainId: '777'})).toThrow('Wrong signing network');
  await expect(signVaultTransfer({...p, chainId: '777'}, 'wrong')).rejects.toThrow('Wrong signing network');
});
test.each(vectors)('888 $kind $fields.action independent vector', v => {
  const f: any = Object.fromEntries(Object.entries(v.fields).map(([k, val]) => [k, ['actionNonce', 'transferNonce', 'expiresAtHeight'].includes(k) ? BigInt(val as string) : val]));
  const seed = new Uint8Array(32).fill(v.kind === 'stationAccept' ? 8 : 7);
  const publicKey = ed25519.getPublicKey(seed);
  const a = {publicKey, address: `0x${bytesToHex(sha3_256(publicKey).slice(0,20))}`, sign: jest.fn((m: Uint8Array) => ed25519.sign(m, seed))};
  const message = v.kind === 'stationSecurity' ? s10.stationSecurityMessage(f) : v.kind === 'stationTransfer' ? s10.stationTransferMessage(f) : s10.stationAcceptMessage(f);
  expect(bytesToHex(message)).toBe(v.preimageHex);
  expect(s10.signTyped(v.kind as keyof S10Fields, f, a).signature).toBe(v.signatureHex);
  a.sign.mockClear();
  expect(() => s10.signTyped(v.kind as keyof S10Fields, {...f, chainId: '777'}, a)).toThrow();
  expect(a.sign).not.toHaveBeenCalled();
});
test('unset configured chain refuses previews and station signing before I/O or key use', async () => {
  jest.resetModules();
  (globalThis as any).__VITE_ENV__ = {};
  const vault = await import('../vaultTransfer');
  const station = await import('../s10Signing');
  globalThis.fetch = jest.fn<typeof fetch>();
  await expect(vault.previewVaultTransfer(p.from, p.to, '1')).rejects.toThrow('not configured');
  expect(() => vault.validatePreview(p)).toThrow('Wrong signing network');
  expect(() => station.stationSecurityMessage(vectors[0].fields as any)).toThrow();
  expect(globalThis.fetch).not.toHaveBeenCalled();
});
