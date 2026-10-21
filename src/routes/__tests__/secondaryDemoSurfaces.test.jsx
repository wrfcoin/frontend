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
const community = (await import('../communityRoutes')).default;
const weather = (await import('../weatherRoutes')).default;
const settings = (await import('../settingsRoutes')).default;
function routes(node, out = new Map()) {
  if (!React.isValidElement(node)) return out;
  if (node.props.path && node.props.element) out.set(node.props.path, node.props.element);
  React.Children.forEach(node.props.children, child => routes(child, out));
  return out;
}
const ROUTES = [
  ['community','/achievements','achievements','/referrals'],
  ['community','/gamification','gamification','/referrals'],
  ['weather','/quality','data-quality','/map'],
  ['weather','/climate/reports','climate-reports','/map'],
  ['platform','/resources','resources','/integrations/share'],
  ['settings','/accessibility/shortcuts','keyboard-shortcuts','/settings'],
];
const LEAVES = [
  ['Achievements/AchievementBadgeSystem','achievements',{}],
  ['DataQuality/QualityAlerts','quality-alerts',{alerts:[]}],
  ['DataQuality/QualityTimeline','quality-timeline',{history:[]}],
  ['ClimateReports/ClimateReportDashboard','climate-reports',{}],
  ['Resources/MaterialDocs','material-docs',{docId:'introduction'}],
  ['AccessibilityHub/KeyboardShortcutsOverlay','keyboard-shortcuts',{}],
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
  await act(async () => { render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path.replace('*', 'dashboard')]}><Suspense fallback={<div data-testid="pending" />}>{flags.demoSurfaces ? <CapabilitiesProvider>{element}</CapabilitiesProvider> : element}</Suspense></MemoryRouter></QueryClientProvider>); });
}
for (const enabled of [false, true]) {
  describe(`secondary demo routes: demoSurfaces=${enabled}, all other flags ON`, () => {
    it.each(ROUTES)('%s %s traverses the real route to %s', async (family, path, id, sibling) => {
      flags.demoSurfaces = enabled;
      const tree = routes(({ platform, community, weather, settings })[family]({ isFeatureEnabled: () => true }));
      expect(tree.has(sibling)).toBe(true);
      expect(tree.has(path)).toBe(true);
      await show(tree.get(path), path);
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
