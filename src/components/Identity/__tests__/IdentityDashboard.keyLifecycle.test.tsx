/** @jest-environment jsdom */
//
// frontend#329 — when GET /api/identity/keys fails, the dashboard used to
// render SAMPLE_KEY_LIFECYCLE (invented fingerprints and rotation dates) by
// default. The default build now says the key history is unknown; the sample
// renders only under demo surfaces.
import { jest } from '@jest/globals';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const featuresMock = { demoSurfaces: false, identity: true };

jest.unstable_mockModule('../../../config/features', () => ({
  default: featuresMock,
  FEATURES: featuresMock,
}));
jest.unstable_mockModule('../../../hooks/useCredentialLifecycle', () => ({
  useCredentialLifecycle: () => ({
    credentials: [],
    policies: [],
    policyStatus: {
      canIssueCredential: false,
      canRevokeCredential: false,
      canRegisterKeyEpoch: false,
      canRotateKeyEpoch: false,
      canRevokeKeyEpoch: false,
      canTogglePolicy: false,
      denialReasons: {},
      evaluatedAt: '2026-09-16T00:00:00.000Z',
    },
    loading: false,
    error: null,
    policyDenial: null,
    requestCredential: async () => {},
    revokeCredential: async () => {},
    togglePolicyEnforcement: async () => {},
    refetch: () => {},
  }),
  default: () => ({}),
}));
jest.unstable_mockModule('../CredentialLifecyclePanel', () => ({ default: () => null }));
jest.unstable_mockModule('../GovernancePolicyPanel', () => ({ default: () => null }));

const { default: IdentityDashboard } = await import('../IdentityDashboard');

const SAMPLE_FINGERPRINT_PREFIX = 'z6MkhaXgBZ';

beforeEach(() => {
  featuresMock.demoSurfaces = false;
  global.fetch = jest.fn((url: string) => {
    if (String(url).includes('/api/identity/keys')) {
      return Promise.reject(new Error('identity routes not mounted'));
    }
    return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
  }) as unknown as typeof fetch;
});

describe('IdentityDashboard key lifecycle on fetch failure (frontend#329)', () => {
  it('says the key history is unknown and renders no sample fingerprint by default', async () => {
    render(<IdentityDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/key history is unknown/)).toBeInTheDocument();
    });
    expect(document.body.textContent).not.toContain(SAMPLE_FINGERPRINT_PREFIX);
    expect(document.body.textContent).not.toMatch(/SAMPLE key data|cached/i);
    expect(screen.getByText('Active Epoch: unavailable')).toBeInTheDocument();
  });

  it('renders the sample, labelled as such, only when demo surfaces are on', async () => {
    featuresMock.demoSurfaces = true;
    render(<IdentityDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Showing SAMPLE key data/)).toBeInTheDocument();
    });
    expect(document.body.textContent).toContain(SAMPLE_FINGERPRINT_PREFIX);
  });
});
