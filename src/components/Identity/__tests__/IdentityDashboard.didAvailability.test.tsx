/** @jest-environment jsdom */
import { jest } from '@jest/globals';
import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { Credential, GovernancePolicy, IssuanceFormData } from '../../../hooks/useCredentialLifecycle';
jest.unstable_mockModule('../../../config/features', () => ({ default: { demoSurfaces: false, identity: true } }));
jest.unstable_mockModule('../CredentialLifecyclePanel', () => ({ default: ({ credentials, onRequestCredential, onRevokeCredential }: { credentials: Credential[]; onRequestCredential: (form: IssuanceFormData) => Promise<void>; onRevokeCredential: (id: string) => Promise<void> }) => <div>Credential management body{credentials.map(c => <span key={c.id}>{c.id}</span>)}<button onClick={() => onRequestCredential({ did: 'did:wrf:synthetic', credentialType: 'Synthetic', purpose: 'Synthetic' })}>Request synthetic credential</button><button onClick={() => onRevokeCredential('synthetic-loaded-credential')}>Revoke synthetic credential</button></div> }));
jest.unstable_mockModule('../GovernancePolicyPanel', () => ({ default: ({ policies, onToggleEnforcement }: { policies: GovernancePolicy[]; onToggleEnforcement: (id: string) => Promise<void> }) => <div>Governance management body{policies.map(p => <span key={p.id}>{p.id}</span>)}<button onClick={() => onToggleEnforcement('synthetic-loaded-policy')}>Toggle synthetic policy</button></div> }));
const { default: IdentityDashboard } = await import('../IdentityDashboard');
const empty = { id: 'did:wrf:synthetic', controller: 'did:wrf:synthetic', created: '2026-09-01', updated: '2026-09-02', verificationMethods: [], credentials: [], services: [] };
const populated = { ...empty,
  verificationMethods: [{ id: 'did:wrf:synthetic#key', type: 'Ed25519VerificationKey2020', controller: empty.id, publicKeyMultibase: 'synthetic-key', purpose: ['authentication'], created: '2026-09-01' }],
  credentials: [{ id: 'synthetic-credential', type: 'TestCredential', issuer: 'Synthetic', issuanceDate: '2026-09-01', expirationDate: '2027-09-01', status: 'valid', credentialSubject: 'Synthetic' }],
  services: [{ id: '#service', type: 'SyntheticService', serviceEndpoint: 'https://example.invalid/service' }] };
let didResponse: { ok: boolean; status: number; json: () => Promise<unknown> } | null;
let credentialOk: boolean;
let loadedLifecycle: boolean;
const response = (data: unknown, ok = true) => ({ ok, status: ok ? 200 : 404, json: async () => data });
beforeEach(() => {
  credentialOk = true;
  loadedLifecycle = false;
  didResponse = response({}, false);
  global.fetch = jest.fn((url: unknown) => {
    const path = String(url);
    if (path.endsWith('/identity/did')) return didResponse ? Promise.resolve(didResponse) : new Promise(() => {});
    if (path.endsWith('/identity/credentials')) return Promise.resolve(response(loadedLifecycle ? [{ id: 'synthetic-loaded-credential', type: 'Synthetic', status: 'active' }] : [], credentialOk));
    if (path.endsWith('/identity/governance-policies')) return Promise.resolve(response(loadedLifecycle ? [{ id: 'synthetic-loaded-policy', name: 'Synthetic', enforced: true }] : []));
    if (path.endsWith('/identity/policy-status')) return Promise.resolve(response({}));
    return Promise.resolve(response({}, false));
  }) as unknown as typeof fetch;
});
const noInventedZeros = () => {
  expect(screen.queryByText('0 keys registered')).not.toBeInTheDocument();
  expect(screen.queryByText('0 active of 0')).not.toBeInTheDocument();
  expect(screen.queryByText('0 endpoints linked')).not.toBeInTheDocument();
};
it('keeps DID summaries and tables unavailable after HTTP404', async () => {
  render(<IdentityDashboard />);
  await screen.findByText(/DID fetch failed: 404/);
  noInventedZeros();
  expect(screen.queryByText('Verification Methods')).not.toBeInTheDocument();
  expect(screen.queryByText('Verifiable Credentials')).not.toBeInTheDocument();
  expect(screen.queryByText('Service Endpoints')).not.toBeInTheDocument();
  expect(screen.getByText('DID details unavailable.')).toBeInTheDocument();
});
it.each([{}, null, { ...empty, credentials: null }])('rejects incomplete DID response %j before summaries', async data => {
  didResponse = response(data);
  render(<IdentityDashboard />);
  await screen.findByText('DID details unavailable.');
  noInventedZeros();
});
it('does not turn a pending DID read into zero counts', () => {
  didResponse = null;
  render(<IdentityDashboard />);
  noInventedZeros();
  expect(screen.queryByText('Verification Methods')).not.toBeInTheDocument();
});
it('shows real populated counts when the DID read succeeds', async () => {
  didResponse = response(populated);
  render(<IdentityDashboard />);
  expect(await screen.findByText('1 keys registered')).toBeInTheDocument();
  expect(screen.getByText('1 active of 1')).toBeInTheDocument();
  expect(screen.getByText('1 endpoints linked')).toBeInTheDocument();
});
it('shows actual zero counts for a complete empty DID document', async () => {
  didResponse = response(empty);
  render(<IdentityDashboard />);
  expect(await screen.findByText('0 keys registered')).toBeInTheDocument();
  expect(screen.getByText('0 active of 0')).toBeInTheDocument();
  expect(screen.getByText('0 endpoints linked')).toBeInTheDocument();
});
it('recovers from unavailable through the existing Retry action', async () => {
  render(<IdentityDashboard />);
  const warning = await screen.findByText(/DID fetch failed: 404/);
  noInventedZeros();
  didResponse = response(populated);
  fireEvent.click(within(warning.closest('[role="alert"]') as HTMLElement).getByRole('button', { name: 'Retry' }));
  expect(await screen.findByText('1 keys registered')).toBeInTheDocument();
  expect(screen.queryByText('DID details unavailable.')).not.toBeInTheDocument();
});
it('does not mount credential and governance bodies after their required read fails', async () => {
  credentialOk = false;
  didResponse = response(populated);
  render(<IdentityDashboard />);
  await screen.findByText(/Credentials could not be read/);
  await waitFor(() => expect(screen.queryByText('Credential management body')).not.toBeInTheDocument());
  expect(screen.queryByText('Governance management body')).not.toBeInTheDocument();
  expect(screen.getByText('1 keys registered')).toBeInTheDocument();
});

it.each([
  ['Request synthetic credential', 'Credential request was not accepted'],
  ['Revoke synthetic credential', 'Credential revocation was not accepted'],
  ['Toggle synthetic policy', 'Policy update was not accepted'],
])('preserves loaded panels after failed mutation: %s', async (button, message) => {
  loadedLifecycle = true;
  didResponse = response(populated);
  render(<IdentityDashboard />);
  await screen.findByText('synthetic-loaded-credential');
  expect(screen.getByText('synthetic-loaded-policy')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: button }));
  await screen.findByText(new RegExp(message));
  expect(screen.getByText('synthetic-loaded-credential')).toBeInTheDocument();
  expect(screen.getByText('synthetic-loaded-policy')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: button })).toBeInTheDocument();
});
