import React, { Suspense } from 'react';
import { jest } from '@jest/globals';
import { act, cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const flags = { demoSurfaces: false };
const features = new Proxy(flags, { get: (target, key) => key in target ? target[key] : true });
const get = jest.fn(async () => []);
await jest.unstable_mockModule('../../config/features', () => ({ FEATURES: features, default: features }));
await jest.unstable_mockModule('../../services/apiClient', () => ({ apiClient: { get } }));
await jest.unstable_mockModule('../../hooks/useCapabilities', () => ({ useCapabilities: () => ({ loading: false, error: null, capabilities: { features: {} } }) }));
await jest.unstable_mockModule('../../hooks/useBridgeTrustMode', () => ({ useBridgeTrustMode: () => ({ trustState: null, loading: false }) }));
await jest.unstable_mockModule('../../hooks/useBridgeFinalityStatus', () => ({ useBridgeFinalityStatus: () => ({ data: null, isLoading: false, error: null }) }));
await jest.unstable_mockModule('../../components/StoreConsistencyBanner', () => ({ StoreConsistencyBanner: () => null }));
await jest.unstable_mockModule('react-chartjs-2', () => ({ Line: () => null, Bar: () => null, Doughnut: () => null }));
const styles = await import('../../__mocks__/muiStylesMock.cjs');
await jest.unstable_mockModule('@mui/material/styles', () => ({ ...styles, styled: Component => () => props => <Component {...props} /> }));

const cases = [
  ['/bridge/tracker', 'BridgeTransactionTracker', 'bridge-transfers', 'Bridge Transaction Tracker'],
  ['/bridge/liquidity', 'LiquidityDepthChart', 'bridge-liquidity', 'Liquidity Depth Analysis'],
  ['/bridge/portfolio', 'CrossChainPortfolio', 'bridge-portfolio', 'Cross-Chain Portfolio'],
  ['/bridge/security', 'BridgeSecurityAudit', 'bridge-security', 'Bridge Security Audit'],
  ['/bridge/optimizer', 'BridgeRouteOptimizer', 'bridge-optimizer', 'Bridge Route Optimizer'],
];
const components = new Map();
// Real shared UI modules link sequentially under Jest ESM.
for (const [, name] of cases) components.set(name, (await import(`../../components/BridgeAdvanced/${name}`)).default);
const { default: defiRoutes } = await import('../defiRoutes');
function routes(node, out = new Map()) {
  if (!React.isValidElement(node)) return out;
  if (node.props.path && node.props.element) out.set(node.props.path, node.props.element);
  React.Children.forEach(node.props.children, child => routes(child, out));
  return out;
}
beforeEach(() => { flags.demoSurfaces = false; get.mockClear(); });
afterEach(cleanup);
async function show(name, path, viaRoute) {
  const tree = routes(defiRoutes());
  expect(tree.has('/bridge')).toBe(true);
  expect(tree.has(path)).toBe(true);
  const Component = components.get(name);
  await act(async () => { render(<MemoryRouter initialEntries={[path]}><Suspense fallback={null}>
    {viaRoute ? tree.get(path) : <Component />}
  </Suspense></MemoryRouter>); });
}
for (const viaRoute of [false, true]) {
  it.each(cases)(`%s hides invented figures with demos off (route=${viaRoute})`, async (path, name, id, heading) => {
    await show(name, path, viaRoute);
    expect(screen.getByTestId(`${id}-not-live`)).toBeInTheDocument();
    expect(screen.queryByText(heading)).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(get).not.toHaveBeenCalled();
  });
  it.each(cases)(`%s keeps the real sample body with demos on (route=${viaRoute})`, async (path, name, _id, heading) => {
    flags.demoSurfaces = true;
    await show(name, path, viaRoute);
    expect(screen.getByText(heading)).toBeInTheDocument();
    if (name === 'BridgeRouteOptimizer') expect(get).toHaveBeenCalledWith(expect.stringContaining('/bridge/routes?'));
  });
}
it.each(cases)('%s labels its sample when explicitly enabled', async (path, name, id) => {
  flags.demoSurfaces = true;
  await show(name, path, false);
  expect(screen.getByTestId(`${id}-sample-badge`)).toHaveTextContent('Sample data');
});
