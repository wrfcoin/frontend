/** @jest-environment jsdom */
//
// frontend#304 — the Distributed Storage page showed IPFS/Filecoin/Arweave as
// "online" with capacity, health and cost figures, contradicting the confirmed
// credential blocker (storage-providers#65 / infra#944: no funded storage
// credentials exist). Every provider figure is a hard-coded literal, and a
// timer randomised the health number.
//
//   1. Demo mode OFF (default): the honest not-live state renders; no
//      provider is shown as online and no capacity/health figure appears.
//   2. Demo mode ON: the sample dashboard renders only beneath the
//      "Simulated preview" banner.
import { jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const featuresMock = { demoSurfaces: false, storage: true };

jest.unstable_mockModule('../../../config/features', () => ({
  default: featuresMock,
  FEATURES: featuresMock,
}));

const { default: DistributedStorageInterface } = await import('../DistributedStorageInterface');
const { default: InfrastructureCapacityDashboard } = await import(
  '../../Dashboard/InfrastructureCapacityDashboard'
);

const FABRICATED = ['1.5 PB', '856.2 TB', '96.8', '347.2 TB', '$0.012/GB/month'];

beforeEach(() => {
  featuresMock.demoSurfaces = false;
  global.fetch = jest.fn(() => Promise.resolve({ ok: false, json: async () => ({}) }));
});

describe('DistributedStorageInterface — demo mode OFF (default)', () => {
  it('renders the honest not-live state and no provider figures', () => {
    render(<DistributedStorageInterface />);

    expect(screen.getByText('Distributed storage is not live on the testnet yet')).toBeInTheDocument();
    for (const text of FABRICATED) {
      expect(screen.queryByText(text)).not.toBeInTheDocument();
    }
    expect(document.body.textContent).not.toMatch(/online/i);
    expect(screen.queryByTestId('storage-sample-banner')).not.toBeInTheDocument();
  });
});

describe('DistributedStorageInterface — demo mode ON (explicit opt-in)', () => {
  beforeEach(() => {
    featuresMock.demoSurfaces = true;
  });

  it('renders the sample dashboard only under the simulated-preview banner', () => {
    render(<DistributedStorageInterface />);

    expect(screen.getByTestId('storage-sample-banner')).toBeInTheDocument();
    expect(screen.getByText('Simulated preview — no storage provider is connected')).toBeInTheDocument();
    expect(screen.getByText('1.5 PB')).toBeInTheDocument();
  });
});

describe('InfrastructureCapacityDashboard — demo mode OFF (default)', () => {
  it('renders the honest not-live state instead of the provider catalogue', () => {
    render(<InfrastructureCapacityDashboard />);

    expect(
      screen.getByText('Infrastructure capacity reporting is not live on the testnet yet'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Wrfcoin Native Storage')).not.toBeInTheDocument();
    expect(screen.queryByTestId('infra-sample-banner')).not.toBeInTheDocument();
  });
});
