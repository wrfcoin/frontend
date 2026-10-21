/** @jest-environment jsdom */
import { jest, beforeAll, afterAll, beforeEach, it, expect } from '@jest/globals';
import { webcrypto } from 'node:crypto';
import vector from '../../../../contract-fixtures/transparent-transfer-auth-vector-777.json';
import { installWebLocks, createWebLocksStub } from '../../__fixtures__/webLocksStub';
import { saveVault } from '../../walletVault';
import { deriveAccount } from '../firstPartyKeys';

(globalThis as any).__VITE_ENV__ = { VITE_WRFCOIN_CHAIN_ID: '777' };
const features = { walletSend: true };
await jest.unstable_mockModule('../../../config/features', () => ({ FEATURES: features }));
const { signVaultTransfer, submitVaultTransfer, validatePreview, previewVaultTransfer } = await import('../vaultTransfer');
Object.defineProperty(globalThis.crypto, 'subtle', { value: webcrypto.subtle, configurable: true });
let restore: () => void;
beforeAll(() => { restore = installWebLocks(createWebLocksStub()); });
afterAll(() => restore());
const p = { from: vector.case.from, to: vector.case.to, amountBaseUnits: '150000000', nonce: '7', chainId: '777', networkId: 'testnet' } as const;
beforeEach(async () => {
  localStorage.clear(); sessionStorage.clear(); features.walletSend = true;
  await saveVault(vector.signer.mnemonic, p.from, 'public test password');
});
it('re-prompts via vault decryption on every signature and matches the CLI/mobile golden vector', async () => {
  const before = localStorage.getItem('wrfcoin_wallet_vault_v1');
  const body = await signVaultTransfer(p, 'public test password');
  expect(body.auth_signature).toBe(vector.case.signature_hex);
  expect(body.auth_pubkey).toBe(vector.signer.ed25519_public_key_hex);
  await expect(signVaultTransfer(p, 'wrong')).rejects.toThrow('Unable to sign');
  expect((await signVaultTransfer(p, 'public test password')).auth_signature).toBe(body.auth_signature);
  expect(localStorage.getItem('wrfcoin_wallet_vault_v1')).toBe(before);
  expect(sessionStorage.length).toBe(0);
}, 30000);
it.each([
  { chainId: '778' }, { networkId: 'mainnet' }, { amountBaseUnits: '0' },
  { amountBaseUnits: '9007199254740992' }, { nonce: '-1' }, { nonce: '18446744073709551616' },
  { to: '0xABC' }, { to: p.to + '/x' },
])('rejects invalid typed fields %j', change => {
  expect(() => validatePreview({ ...p, ...change } as never)).toThrow();
});
it('released signers cannot sign again', () => {
  const account = deriveAccount(vector.signer.mnemonic);
  account.destroy!();
  expect(() => account.sign(new Uint8Array([1]))).toThrow('released');
});
it('reads only the exact same-origin nonce and submits only the signed body once', async () => {
  const fetch = jest.fn<typeof globalThis.fetch>();
  globalThis.fetch = fetch;
  fetch.mockResolvedValueOnce(new Response('{"nonce":"7"}', { status: 200 }));
  expect(await previewVaultTransfer(p.from, p.to, '1.50000000')).toEqual(p);
  fetch.mockResolvedValueOnce(new Response('{"nonce":"7"}', { status: 200 }));
  fetch.mockResolvedValueOnce(new Response('{"hash":"test-submission","settled":false}', { status: 202 }));
  expect(await submitVaultTransfer(p, 'public test password')).toEqual({ txHash: 'test-submission', status: 'submitted' });
  expect(fetch.mock.calls.map(([url]) => url)).toEqual([`/api/wallet/${p.from}/nonce`, `/api/wallet/${p.from}/nonce`, '/api/wallet/send']);
  expect(JSON.parse(fetch.mock.calls[2][1]!.body as string)).toEqual({ from: p.from, to: p.to, amount: p.amountBaseUnits, nonce: p.nonce,
    auth_pubkey: vector.signer.ed25519_public_key_hex, auth_signature: vector.case.signature_hex });
}, 30000);
it('changed nonce (rechecked after the KDF, before submit) and gate-off never post', async () => {
  const fetch = jest.fn<typeof globalThis.fetch>(); globalThis.fetch = fetch;
  fetch.mockResolvedValueOnce(new Response('{"nonce":"8"}', { status: 200 }));
  await expect(submitVaultTransfer(p, 'public test password')).rejects.toThrow('Nonce changed');
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch.mock.calls.map(([url]) => url)).not.toContain('/api/wallet/send');
  features.walletSend = false;
  await expect(submitVaultTransfer(p, 'public test password')).rejects.toThrow('UNAVAILABLE');
  expect(fetch).toHaveBeenCalledTimes(1);
  features.walletSend = true;
});
it('reads the nonce AFTER the KDF unlock, not before it', async () => {
  const events: string[] = [];
  const fetch = jest.fn<typeof globalThis.fetch>(async (url) => {
    events.push(String(url)); return new Response('{"nonce":"7","hash":"h"}', { status: 200 });
  });
  globalThis.fetch = fetch;
  const realDerive = webcrypto.subtle.deriveKey.bind(webcrypto.subtle);
  const derive = jest.spyOn(webcrypto.subtle, 'deriveKey').mockImplementation((async (...args: unknown[]) => {
    events.push('kdf'); return (realDerive as any)(...args);
  }) as any);
  await submitVaultTransfer(p, 'public test password');
  derive.mockRestore();
  expect(events).toEqual(['kdf', `/api/wallet/${p.from}/nonce`, '/api/wallet/send']);
}, 30000);
it('submits the immutable values the user confirmed even if the caller mutates its object mid-flight', async () => {
  const fetch = jest.fn<typeof globalThis.fetch>(async (url) =>
    new Response(String(url).endsWith('/send') ? '{"hash":"h"}' : '{"nonce":"7"}', { status: 200 }));
  globalThis.fetch = fetch;
  const mutable = { ...p } as { -readonly [K in keyof typeof p]: string };
  const pending = submitVaultTransfer(mutable as any, 'public test password');
  mutable.to = '0x' + '9'.repeat(40); mutable.amountBaseUnits = '999999999';
  await pending;
  const sent = JSON.parse(fetch.mock.calls.find(([u]) => String(u) === '/api/wallet/send')![1]!.body as string);
  expect(sent.to).toBe(p.to); expect(sent.amount).toBe(p.amountBaseUnits);
}, 30000);
it('known legacy destination cannot preview, sign a forged preview, or submit; no nonce read or POST occurs', async () => {
  const fetch = jest.fn<typeof globalThis.fetch>(); globalThis.fetch = fetch;
  const legacy = '0x465230af3383c16d024c5f4b87ed2d1b595be148';
  const forged = { ...p, to: legacy };
  await expect(previewVaultTransfer(p.from, legacy, '1')).rejects.toThrow('Ordinary Send is blocked');
  // A wrong password is intentional: recipient refusal must precede vault access.
  await expect(signVaultTransfer(forged, 'wrong')).rejects.toThrow('Ordinary Send is blocked');
  await expect(submitVaultTransfer(forged, 'wrong')).rejects.toThrow('Ordinary Send is blocked');
  expect(fetch).not.toHaveBeenCalled();
});

it('POST /api/wallet/send carries exactly Content-Type: application/json (edge 404s anything else)', async () => {
  const fetch = jest.fn<typeof globalThis.fetch>(async (url) =>
    new Response(String(url).endsWith('/send') ? '{"hash":"h"}' : '{"nonce":"7"}', { status: 200 }));
  globalThis.fetch = fetch;
  await submitVaultTransfer(p, 'public test password');
  const call = fetch.mock.calls.find(([u]) => String(u) === '/api/wallet/send')!;
  expect(call[1]!.method).toBe('POST');
  const headers = new Headers(call[1]!.headers);
  expect(headers.get('content-type')).toBe('application/json');
  expect(headers.get('content-type')).not.toMatch(/charset/i);
}, 30000);
it('mixed-case own address is lowercased: nonce URL is canonical and signing matches lowercase', async () => {
  const fetch = jest.fn<typeof globalThis.fetch>(async () => new Response('{"nonce":"7"}', { status: 200 }));
  globalThis.fetch = fetch;
  const mixed = '0x' + p.from.slice(2).split('').map((c, i) => (i % 2 ? c.toUpperCase() : c)).join('');
  expect(mixed).not.toBe(p.from);
  const preview = await previewVaultTransfer(mixed, p.to, '1.50000000');
  expect(preview).toEqual(p);
  expect(String(fetch.mock.calls[0][0])).toMatch(/^\/api\/wallet\/0x[0-9a-f]{40}\/nonce$/);
  expect(await signVaultTransfer(preview, 'public test password'))
    .toEqual(await signVaultTransfer(p, 'public test password'));
}, 30000);
