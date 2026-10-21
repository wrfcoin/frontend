/** @jest-environment jsdom */
//
// frontend#327 — the Integrations hub's partner cards and detail views render
// random "live" stats, a fake VRF number, fake iExec job results and a fake
// IPFS hash. The hub is gated once, at its root.
import { jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';

const featuresMock = { demoSurfaces: false };
jest.unstable_mockModule('../../../config/features', () => ({ default: featuresMock, FEATURES: featuresMock }));

const { default: IntegrationsHub } = await import('../IntegrationsHub');

describe('IntegrationsHub — demo mode OFF (default)', () => {
  it('renders the not-live notice and none of the partner cards', () => {
    featuresMock.demoSurfaces = false;
    render(<MemoryRouter><IntegrationsHub /></MemoryRouter>);
    expect(screen.getByTestId('integrations-hub-not-live')).toBeInTheDocument();
    expect(screen.getByText('Third-party integrations are not live on the testnet yet')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Chainlink|Pyth|iExec|AIOZ|Sample data/);
  });
});
