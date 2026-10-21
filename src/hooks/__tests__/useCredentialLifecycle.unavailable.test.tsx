/** @jest-environment jsdom */
import { jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useCredentialLifecycle } from '../useCredentialLifecycle';

const originalFetch = global.fetch;
const credential = { id: 'server-credential', did: 'did:synthetic', type: 'Synthetic', status: 'active', issuedAt: '', issuer: 'server' };
const policy = { id: 'server-policy', name: 'Server policy', scope: 'credential_issuance', enforced: true };
const response = (data: unknown, status = 200) => ({ ok: status === 200, status, json: async () => data });
const denied = { canIssueCredential: false, canRevokeCredential: false, canTogglePolicy: false };

beforeEach(() => {
  global.fetch = jest.fn(async () => response({}, 404)) as unknown as typeof fetch;
});
afterEach(() => { global.fetch = originalFetch; });

it.each(['404', 'network', 'malformed'])('reports unavailable with no invented credentials or policies on %s', async mode => {
  if (mode === 'network') global.fetch = jest.fn(async () => { throw new Error('offline'); }) as unknown as typeof fetch;
  if (mode === 'malformed') global.fetch = jest.fn(async () => response({ unexpected: true })) as unknown as typeof fetch;
  const { result } = renderHook(() => useCredentialLifecycle());
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.credentials).toEqual([]);
  expect(result.current.policies).toEqual([]);
  expect(result.current.policyStatus).toMatchObject(denied);
  expect(result.current.error).toMatch(/unavailable/i);
  expect(result.current.error).not.toMatch(/cached|sample/i);
});

async function loadedHook() {
  global.fetch = jest.fn(async (url: unknown) => response(String(url).endsWith('credentials') ? [credential] : String(url).endsWith('governance-policies') ? [policy] : { canIssueCredential: true, canRevokeCredential: true, canTogglePolicy: true })) as unknown as typeof fetch;
  const hook = renderHook(() => useCredentialLifecycle());
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  expect(hook.result.current.credentials[0].id).toBe('server-credential');
  expect(hook.result.current.policies[0].id).toBe('server-policy');
  return hook;
}

it.each(['request', 'revoke', 'toggle'])('a refused %s does not locally invent success', async operation => {
  const { result } = await loadedHook();
  const previousCredentials = result.current.credentials;
  const previousPolicies = result.current.policies;
  global.fetch = jest.fn(async () => response({}, 404)) as unknown as typeof fetch;
  await act(async () => {
    if (operation === 'request') await result.current.requestCredential({ did: 'did:synthetic', credentialType: 'Synthetic', purpose: 'test' });
    if (operation === 'revoke') await result.current.revokeCredential('server-credential');
    if (operation === 'toggle') await result.current.togglePolicyEnforcement('server-policy');
  });
  expect(result.current.credentials).toEqual(previousCredentials);
  expect(result.current.policies).toEqual(previousPolicies);
  expect(result.current.error).toMatch(/unavailable/i);
});

it('a failed refresh removes prior credentials, policies and permissions', async () => {
  const { result } = await loadedHook();
  global.fetch = jest.fn(async () => response({}, 404)) as unknown as typeof fetch;
  await act(async () => { result.current.refetch(); });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.credentials).toEqual([]);
  expect(result.current.policies).toEqual([]);
  expect(result.current.policyStatus).toMatchObject(denied);
});
