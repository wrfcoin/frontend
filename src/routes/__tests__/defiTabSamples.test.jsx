import React, { Suspense } from 'react';
import { jest } from '@jest/globals';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const flags = { demoSurfaces: false };
const features = new Proxy(flags, { get: (target, key) => key in target ? target[key] : true });
const get = jest.fn(async () => { throw new Error('Synthetic unavailable source'); });
await jest.unstable_mockModule('../../config/features', () => ({ FEATURES: features, default: features }));
await jest.unstable_mockModule('../../services/apiClient', () => ({
  apiClient: { get }, governanceService: {}, validatorService: {},
}));
await jest.unstable_mockModule('react-chartjs-2', () => ({ Line: () => null, Bar: () => null, Doughnut: () => null }));
const { default: Swap } = await import('../../components/DeFi/SwapInterface');
const { default: Farming } = await import('../../components/DeFi/YieldFarmingPanel');
// Finish linking the actual lazy page before route/tab assertions.
await import('../../components/DeFi/DeFiPortfolio');
const { default: defiRoutes } = await import('../defiRoutes');
function routes(node, out = new Map()) {
  if (!React.isValidElement(node)) return out;
  if (node.props.path && node.props.element) out.set(node.props.path, node.props.element);
  React.Children.forEach(node.props.children, child => routes(child, out));
  return out;
}
const cases = [
  ['Swap', Swap, 'defi-swap', 'Recent Swaps'],
  ['Yield Farming', Farming, 'defi-farming', 'Total Deposited'],
];
beforeEach(() => { flags.demoSurfaces = false; get.mockClear(); });
afterEach(cleanup);
async function show(tab, Component, viaRoute) {
  const tree = routes(defiRoutes());
  expect(tree.has('/defi')).toBe(true);
  expect(tree.has('/bridge')).toBe(true);
  await act(async () => { render(<MemoryRouter initialEntries={['/defi']}><Suspense fallback={null}>
    {viaRoute ? tree.get('/defi') : <Component />}
  </Suspense></MemoryRouter>); });
  if (viaRoute) {
    const button = await screen.findByRole('tab', { name: tab });
    await act(async () => { fireEvent.click(button); });
  }
}
for (const viaRoute of [false, true]) {
  it.each(cases)(`%s has no claimed balances/quotes/yield while demos are off (route=${viaRoute})`, async (tab, Component, id, heading) => {
    await show(tab, Component, viaRoute);
    expect(screen.getByTestId(`${id}-not-live`)).toBeInTheDocument();
    expect(screen.queryByText(heading)).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(get.mock.calls.filter(([path]) => path !== '/defi/portfolio')).toHaveLength(0);
  });
  it.each(cases)(`%s retains the real sample body only with demos on (route=${viaRoute})`, async (tab, Component, _id, heading) => {
    flags.demoSurfaces = true;
    await show(tab, Component, viaRoute);
    expect(screen.getByText(heading)).toBeInTheDocument();
    expect(get.mock.calls.filter(([path]) => path !== '/defi/portfolio').length).toBeGreaterThan(0);
  });
}
it.each(cases)('%s is labelled as sample data when enabled', async (tab, Component, id) => {
  flags.demoSurfaces = true;
  await show(tab, Component, false);
  expect(screen.getByTestId(`${id}-sample-badge`)).toHaveTextContent('Sample data');
});
