/** @jest-environment jsdom */
//
// frontend#324 — the /explore dag/network/topology tabs (and /debug/traces)
// drew invented validators ("WRF Validator Alpha", "StormNode Capital"),
// bridge health, execution traces and a peer topology generated in-component.
// Each panel now goes through DemoSurfaceGate: honest not-live by default,
// sample only under demo surfaces.
import { jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const featuresMock = { demoSurfaces: false };
jest.unstable_mockModule('../../../config/features', () => ({
  default: featuresMock,
  FEATURES: featuresMock,
  useFeatureEnabled: () => true,
}));
jest.unstable_mockModule('react-chartjs-2', () => ({
  Bar: () => React.createElement('div', { 'data-testid': 'bar-chart' }),
  Line: () => React.createElement('div', { 'data-testid': 'line-chart' }),
  Doughnut: () => React.createElement('div', { 'data-testid': 'doughnut-chart' }),
}));
jest.unstable_mockModule('chart.js', () => ({
  Chart: { register: () => {} },
  CategoryScale: class {}, LinearScale: class {}, BarElement: class {}, PointElement: class {},
  LineElement: class {}, ArcElement: class {}, Filler: class {}, Tooltip: class {}, Legend: class {},
  Title: class {}, SubTitle: class {}, TimeScale: class {}, RadialLinearScale: class {}, LogarithmicScale: class {},
}));

const { default: BridgeHealthGraph } = await import('../../BlockExplorerDAG/BridgeHealthGraph');
const { default: ValidatorGrid } = await import('../../BlockExplorerDAG/ValidatorGrid');
const { default: ExecutionTraceViewer } = await import('../../BlockExplorerDAG/ExecutionTraceViewer');
const { default: NetworkTopology } = await import('../../DAGExplorer/NetworkTopology');
const { default: ValidatorPanel } = await import('../../DAGExplorer/ValidatorPanel');
const { default: TransactionTrace } = await import('../../DAGExplorer/TransactionTrace');
const { default: DebugTraceViewer } = await import('../../ExecutionDebugger/ExecutionTraceViewer');

const transaction = {
  hash: '0xabc', from: '0x1', to: '0x2', value: '0', gasUsed: 21000, status: 'success', timestamp: Date.now(),
} as any;

const PANELS: Array<[string, string, () => React.ReactElement, RegExp]> = [
  ['bridge-health', 'Bridge health is not live on the testnet yet', () => <BridgeHealthGraph />, /Axelar|LayerZero|99\.\d/],
  ['validator-grid', 'Validator set is not live on the testnet yet', () => <ValidatorGrid />, /WRF Validator Alpha|StormNode/],
  ['execution-trace', 'Execution traces are not live on the testnet yet', () => <ExecutionTraceViewer transaction={transaction} onBack={() => {}} />, /CALLDATALOAD/],
  ['network-topology', 'Network topology is not live on the testnet yet', () => <NetworkTopology />, /WRF Validator Alpha|StormNode/],
  ['validator-panel', 'Validator set is not live on the testnet yet', () => <ValidatorPanel />, /WRF Validator Alpha|StormNode/],
  ['transaction-trace', 'Execution traces are not live on the testnet yet', () => <TransactionTrace transaction={transaction} onBack={() => {}} />, /CALLDATALOAD/],
  ['debug-trace', 'Execution traces are not live on the testnet yet', () => <DebugTraceViewer />, /0x[0-9a-f]{4}/i],
];

describe('explorer DAG panels — demo mode OFF (default)', () => {
  beforeEach(() => {
    featuresMock.demoSurfaces = false;
  });

  it.each(PANELS)('%s renders the not-live notice and none of its invented content', (testId, title, make, fabricated) => {
    const { unmount } = render(make());
    expect(screen.getByTestId(`${testId}-not-live`)).toBeInTheDocument();
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(fabricated);
    expect(document.body.textContent).not.toMatch(/Sample data/);
    unmount();
  });

  it('trace panels keep a Back control so the user is not stranded', () => {
    const onBack = jest.fn();
    render(<TransactionTrace transaction={transaction} onBack={onBack} />);
    screen.getByRole('button', { name: 'Back' }).click();
    expect(onBack).toHaveBeenCalled();
  });
});

describe('explorer DAG panels — demo mode ON (explicit opt-in)', () => {
  beforeEach(() => {
    featuresMock.demoSurfaces = true;
  });

  it.each([PANELS[1], PANELS[4]])('%s renders the sample only under the badge', (testId, _title, make, fabricated) => {
    const { unmount } = render(make());
    expect(screen.getByTestId(`${testId}-sample-badge`)).toBeInTheDocument();
    expect(document.body.textContent).toMatch(fabricated);
    expect(screen.queryByTestId(`${testId}-not-live`)).not.toBeInTheDocument();
    unmount();
  });
});
