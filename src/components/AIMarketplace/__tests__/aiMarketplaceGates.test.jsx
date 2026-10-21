/** @jest-environment jsdom */
//
// frontend#325 — ModelBenchmark, ModelDetail and ModelLeaderboard drew RMSE,
// skill and bias figures generated in the browser (the model list itself is
// fetched and starts empty). Each panel now goes through DemoSurfaceGate.
import { jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const featuresMock = { demoSurfaces: false };
jest.unstable_mockModule('../../../config/features', () => ({ default: featuresMock, FEATURES: featuresMock }));
jest.unstable_mockModule('../../../services/apiClient', () => ({
  apiClient: { get: () => Promise.reject(new Error('no ai-marketplace route')) },
}));
jest.unstable_mockModule('react-chartjs-2', () => ({
  Bar: () => React.createElement('div', { 'data-testid': 'bar-chart' }),
  Line: () => React.createElement('div', { 'data-testid': 'line-chart' }),
  Radar: () => React.createElement('div', { 'data-testid': 'radar-chart' }),
  Doughnut: () => React.createElement('div', { 'data-testid': 'doughnut-chart' }),
  Scatter: () => React.createElement('div', { 'data-testid': 'scatter-chart' }),
}));
jest.unstable_mockModule('chart.js', () => ({
  Chart: { register: () => {} },
  CategoryScale: class {}, LinearScale: class {}, BarElement: class {}, PointElement: class {}, LineElement: class {},
  ArcElement: class {}, Filler: class {}, Tooltip: class {}, Legend: class {}, Title: class {}, SubTitle: class {},
  RadialLinearScale: class {}, TimeScale: class {}, LogarithmicScale: class {},
}));

const { default: ModelBenchmark } = await import('../ModelBenchmark');
const { default: ModelDetail } = await import('../ModelDetail');
const { default: ModelLeaderboard } = await import('../ModelLeaderboard');

const model = { id: 'm1', name: 'Test Model', version: '1.0', category: 'forecast', author: 'x', downloads: 0, rating: 0, tags: [] };

const PANELS = [
  ['model-benchmark', 'Model benchmarks are not live on the testnet yet', () => <ModelBenchmark allModels={[model]} selectedModels={[]} onModelsChange={() => {}} onDeploy={() => {}} />],
  ['model-detail', 'Model details are not live on the testnet yet', () => <ModelDetail model={model} onBack={() => {}} onDeploy={() => {}} onCompare={() => {}} />],
  ['model-leaderboard', 'Model leaderboard is not live on the testnet yet', () => <ModelLeaderboard onSelectModel={() => {}} onChallenge={() => {}} />],
];

describe('AI Marketplace panels — demo mode OFF (default)', () => {
  beforeEach(() => { featuresMock.demoSurfaces = false; });
  it.each(PANELS)('%s renders the not-live notice and no generated figures', (testId, title, make) => {
    const { unmount } = render(make());
    expect(screen.getByTestId(`${testId}-not-live`)).toBeInTheDocument();
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Sample data|\d+\.\d{2}/);
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
    unmount();
  });
  it('ModelDetail keeps its Back control', () => {
    const onBack = jest.fn();
    render(<ModelDetail model={model} onBack={onBack} onDeploy={() => {}} onCompare={() => {}} />);
    screen.getByRole('button', { name: 'Back' }).click();
    expect(onBack).toHaveBeenCalled();
  });
});

describe('AI Marketplace panels — demo mode ON', () => {
  beforeEach(() => { featuresMock.demoSurfaces = true; });
  it('ModelLeaderboard renders the sample only under the badge', () => {
    render(<ModelLeaderboard onSelectModel={() => {}} onChallenge={() => {}} />);
    expect(screen.getByTestId('model-leaderboard-sample-badge')).toBeInTheDocument();
    expect(screen.queryByTestId('model-leaderboard-not-live')).not.toBeInTheDocument();
  });
});
