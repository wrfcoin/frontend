/** @jest-environment jsdom */
import React, { Suspense } from 'react';
import { jest } from '@jest/globals';
import { act, cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const flags = { demoSurfaces: false };
const features = new Proxy(flags, { get: (target, prop) => prop in target ? target[prop] : true });
await jest.unstable_mockModule('../../config/features', () => ({ FEATURES: features, default: features, isMvpMode: () => false }));
await jest.unstable_mockModule('react-chartjs-2', () => ({ Line: () => null, Bar: () => null, Doughnut: () => null, Pie: () => null, Radar: () => null, Scatter: () => null }));
const muiStyles = await import('../../__mocks__/muiStylesMock.cjs');
await jest.unstable_mockModule('@mui/material/styles', () => ({ ...muiStyles, styled: Component => () => function Styled(props) { return <Component {...props} />; } }));
const { CapabilitiesProvider } = await import('../../contexts/CapabilitiesContext');
const platform = (await import('../platformRoutes')).default;
const network = (await import('../networkRoutes')).default;
function routes(node, out = new Map()) {
  if (!React.isValidElement(node)) return out;
  if (node.props.path && node.props.element) out.set(node.props.path, node.props.element);
  React.Children.forEach(node.props.children, child => routes(child, out));
  return out;
}
const ROUTES = [
  ['platform', '/integrations/enhanced', 'enhanced-integrations', '/integrations/share'],
  ['platform', '/integrations-enhanced', 'integrations-enhanced', '/integrations/share'],
  ['platform', '/integrations/ai-plugins', 'ai-plugins', '/integrations/share'],
  ['platform', '/integrations/ai/*', 'ai-integrations', '/integrations/share'],
  ['network', '/network/topology', 'network-topology', '/network/fees'],
  ['network', '/network/light-clients', 'light-clients', '/network/fees'],
  ['network', '/zk/privacy', 'privacy-proofs', '/zk/proofs'],
  ['network', '/zk/prover', 'zk-prover', '/zk/proofs'],
  ['platform', '/mobile', 'mobile-app', '/resources'],
  ['platform', '/analytics/unified', 'unified-analytics', '/resources'],
];
const LEAVES = [
  ['Integrations/CategoryOptimizer', 'category-optimizer', { integrations: [], categories: [], onCategoriesUpdate: () => {}, onIntegrationMove: () => {} }],
  ['Integrations/IntegrationWizard', 'integration-wizard', { integration: { id: 'test', name: 'Test', type: 'api', fields: [], steps: [], prerequisites: [], configuration: [], apiEndpoints: [], requiredCredentials: [] }, open: false, onComplete: () => {}, onCancel: () => {} }],
  ['DeviceSetupGuide', 'device-setup', {}],
  ['Integrations/AIPluginsHub', 'ai-plugins', {}],
  ['AI/AIMLDashboard', 'ai-ml-dashboard', {}],
  ['NetworkInsights/LightClientPanel', 'light-clients', {}],
  ['NetworkInsights/NetworkTopologyMap', 'network-topology', {}],
  ['ZKVerification/PrivacyProofExplorer', 'privacy-proofs', {}],
  ['ZKVerification/TheProverUI', 'zk-prover', {}],
  ['Mobile/MobileIntegrationsHub', 'mobile-integrations', {}],
  ['UnifiedAnalytics/CostAnalysisDashboard', 'cost-analysis', {}],
];
beforeEach(() => {
  flags.demoSurfaces = false;
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  window.matchMedia = jest.fn(() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return true; } }));
  global.fetch = jest.fn(async () => new Response('{}', { status: 404, headers: { 'content-type': 'application/json' } }));
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => { cleanup(); jest.restoreAllMocks(); });
async function show(element, path = '/') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  // Readiness is real capability data even when illustrative surfaces are off.
  client.setQueryData(['capabilities'], { features: {} });
  await act(async () => { render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path.replace('*', 'dashboard')]}><Suspense fallback={<div data-testid="pending" />}>{flags.demoSurfaces ? <CapabilitiesProvider>{element}</CapabilitiesProvider> : element}</Suspense></MemoryRouter></QueryClientProvider>); });
}
for (const enabled of [false, true]) {
  describe(`remaining demo routes: demoSurfaces=${enabled}, all other flags ON`, () => {
    it.each(ROUTES)('%s %s traverses the real route to %s', async (family, path, id, sibling) => {
      flags.demoSurfaces = enabled;
      const tree = routes(family === 'platform' ? platform() : network({ networkInsightsEnabled: true, validatorOpsEnabled: true, isFeatureEnabled: () => true }));
      expect(tree.has(sibling)).toBe(true);
      expect(tree.has(path)).toBe(true);
      await show(tree.get(path), path);
      if (path === '/network/topology') {
        expect(screen.getByTestId('l2-readiness').textContent).toContain('L2 Prover: not reported');
      }
      expect(await screen.findByTestId(`${id}-${enabled ? 'sample' : 'not-live'}`)).not.toBeNull();
      expect(screen.queryByTestId(`${id}-${enabled ? 'not-live' : 'sample'}`)).toBeNull();
      if (!enabled) expect(global.fetch).not.toHaveBeenCalled();
    });
    it.each(LEAVES)('%s has its own gate, independent of parent containment', async (path, id, props) => {
      flags.demoSurfaces = enabled;
      const Component = (await import(`../../components/${path}`)).default;
      await show(<Component {...props} />);
      expect(await screen.findByTestId(`${id}-${enabled ? 'sample' : 'not-live'}`)).not.toBeNull();
      expect(screen.queryByTestId(`${id}-${enabled ? 'not-live' : 'sample'}`)).toBeNull();
      if (!enabled) expect(global.fetch).not.toHaveBeenCalled();
    });
  });
}
