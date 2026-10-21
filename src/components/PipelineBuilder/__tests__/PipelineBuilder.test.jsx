/** @jest-environment jsdom */
//
// frontend#294 — the Data Pipeline Builder shipped three fabricated saved
// pipelines with invented run history ("147 runs / avg 45s", last-run
// timestamps) and an execution monitor that draws random throughput, for a
// backend feature that is not mounted (capability `pipelines` = unavailable).
//
//   1. Demo mode OFF (default): the list is empty and says the feature is
//      not live; no fabricated pipeline or run count appears. The editor
//      itself stays usable.
//   2. Demo mode ON: the sample pipelines render only beneath the banner and
//      "Sample data" badge.
import { jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const featuresMock = { demoSurfaces: false, pipelines: true };

jest.unstable_mockModule('../../../config/features', () => ({
  default: featuresMock,
  FEATURES: featuresMock,
}));
jest.unstable_mockModule('../../../services/apiClient', () => ({
  apiClient: { get: () => Promise.reject(new Error('no pipeline route on the testnet API')) },
}));
jest.unstable_mockModule('../NodeEditor', () => ({
  default: () => React.createElement('div', { 'data-testid': 'node-editor' }),
}));
jest.unstable_mockModule('../PipelineMonitor', () => ({
  default: () => React.createElement('div', { 'data-testid': 'pipeline-monitor' }),
}));

const { default: PipelineBuilder } = await import('../PipelineBuilder');

const FABRICATED = ['Temperature Anomaly Detector', 'Multi-Station Averaging', '147 runs / avg 45s', '312 runs / avg 28s'];

beforeEach(() => {
  featuresMock.demoSurfaces = false;
});

describe('PipelineBuilder — demo mode OFF (default)', () => {
  it('starts with an empty, honestly labelled pipeline list and no fabricated run history', () => {
    render(<PipelineBuilder />);

    expect(screen.getByText('Pipeline execution is not live on the testnet yet')).toBeInTheDocument();
    expect(screen.getByTestId('pipeline-list-not-live')).toBeInTheDocument();
    expect(screen.getByText('No pipelines yet')).toBeInTheDocument();
    expect(screen.getByText('0 pipelines')).toBeInTheDocument();
    for (const text of FABRICATED) {
      expect(screen.queryByText(text)).not.toBeInTheDocument();
    }
    expect(document.body.textContent).not.toMatch(/runs \/ avg|Sample data/);
    expect(screen.queryByTestId('pipeline-sample-banner')).not.toBeInTheDocument();
  });
});

describe('PipelineBuilder — demo mode ON (explicit opt-in)', () => {
  beforeEach(() => {
    featuresMock.demoSurfaces = true;
  });

  it('renders the sample pipelines only under the banner and badge', () => {
    render(<PipelineBuilder />);

    expect(screen.getByTestId('pipeline-sample-banner')).toBeInTheDocument();
    expect(screen.getByTestId('pipeline-list-sample-badge')).toBeInTheDocument();
    expect(screen.getByText('Temperature Anomaly Detector')).toBeInTheDocument();
    expect(screen.getByText('147 runs / avg 45s')).toBeInTheDocument();
    expect(screen.queryByTestId('pipeline-list-not-live')).not.toBeInTheDocument();
  });
});
