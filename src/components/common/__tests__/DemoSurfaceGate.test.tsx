/** @jest-environment jsdom */
import { jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const featuresMock = { demoSurfaces: false };
jest.unstable_mockModule('../../../config/features', () => ({
  default: featuresMock,
  FEATURES: featuresMock,
}));

const { default: DemoSurfaceGate } = await import('../DemoSurfaceGate');

const Sample = () => <div data-testid="sample-body">fabricated 99.8%</div>;

describe('DemoSurfaceGate', () => {
  beforeEach(() => {
    featuresMock.demoSurfaces = false;
  });

  it('renders the not-live notice and never mounts the sample by default', () => {
    render(
      <DemoSurfaceGate title="Validator set is not live on the testnet yet" description="No validator route is mounted." testId="validators" action={<button>Back</button>}>
        <Sample />
      </DemoSurfaceGate>,
    );
    expect(screen.getByTestId('validators-not-live')).toBeInTheDocument();
    expect(screen.getByText('Validator set is not live on the testnet yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    expect(screen.queryByTestId('sample-body')).not.toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Sample data|99\.8/);
  });

  it('renders the sample beneath the badge only when demo surfaces are on', () => {
    featuresMock.demoSurfaces = true;
    render(
      <DemoSurfaceGate title="t" description="d" testId="validators">
        <Sample />
      </DemoSurfaceGate>,
    );
    expect(screen.getByTestId('validators-sample-badge')).toBeInTheDocument();
    expect(screen.getByTestId('sample-body')).toBeInTheDocument();
    expect(screen.queryByTestId('validators-not-live')).not.toBeInTheDocument();
  });
});
