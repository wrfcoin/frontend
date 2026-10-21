/** @jest-environment jsdom */
//
// frontend#352: containment of the display-only second-wave surfaces, checked
// through the ROUTE TREE rather than by importing each component on its own.
//
// displaySurfaces352.truth.test.jsx renders every gated component directly. That
// shows each file is honest when it is rendered, but not that the route a user
// actually navigates to mounts the gated file. This test walks the real route
// modules (the technique from fabricatedSurfaceReachability.test.jsx), takes the
// element a route declares, and renders it:
//
//   * demoSurfaces OFF, every other flag ON: each route is still declared, and
//     rendering its element shows the `<testId>-not-live` notice and no sample.
//   * demoSurfaces ON: the same element renders the `<testId>-sample`.
//
// Every other flag is ON deliberately. With a flag off, a family never enters the
// tree, so an absence assertion would pass vacuously (#268). The NON-VACUITY
// guard also asserts that sibling real routes of each family are present, so an
// empty tree cannot pass. If the not-live notice is found while demoSurfaces is
// ON, the test fails, so the notice cannot come from some unrelated wrapper.
import React, { Suspense } from 'react';
import { jest } from '@jest/globals';
import { act, cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const flags = { demoSurfaces: false };
const FEATURES_PROXY = new Proxy(flags, {
  get: (target, prop) => (prop in target ? target[prop] : true),
});
await jest.unstable_mockModule('../../config/features', () => ({
  FEATURES: FEATURES_PROXY,
  default: FEATURES_PROXY,
  isMvpMode: () => false,
}));
await jest.unstable_mockModule('react-chartjs-2', () => ({
  Line: () => null, Bar: () => null, Doughnut: () => null, Pie: () => null, Radar: () => null, Scatter: () => null,
}));

const MODULES = {
  weatherRoutes: (await import('../weatherRoutes')).default,
  networkRoutes: (await import('../networkRoutes')).default,
  platformRoutes: (await import('../platformRoutes')).default,
  settingsRoutes: (await import('../settingsRoutes')).default,
};
const buildTree = name => (name === 'networkRoutes'
  ? MODULES.networkRoutes({ validatorOpsEnabled: true, networkInsightsEnabled: true, isFeatureEnabled: () => true })
  : MODULES[name]({ isFeatureEnabled: () => true }));

function collectRoutes(node, out = new Map()) {
  if (!React.isValidElement(node)) return out;
  if (typeof node.props.path === 'string' && node.props.element) out.set(node.props.path, node.props.element);
  React.Children.forEach(node.props.children, child => collectRoutes(child, out));
  return out;
}

// One row per route that directly mounts a #352 surface. `siblings` are real,
// non-#352 routes of the same family (the non-vacuity guard).
const DIRECT = [
  ['weatherRoutes', '/collaboration', 'collaboration', ['/weather/dashboard']],
  ['networkRoutes', '/debug/transactions', 'transaction-inspector', ['/debug/traces']],
  ['networkRoutes', '/debug/state', 'state-debugger', ['/debug/traces']],
  ['networkRoutes', '/validators/slashing', 'slashing-monitor', ['/validators', '/validators/staking']],
  ['networkRoutes', '/validators/compare', 'validator-compare', ['/validators', '/validators/blocks']],
  ['platformRoutes', '/integrations/sonm', 'sonm', ['/integrations', '/integrations/helium']],
  ['platformRoutes', '/integrations/luftdaten', 'luftdaten', ['/integrations', '/integrations/golem']],
  ['settingsRoutes', '/notifications/push-setup', 'push-setup', ['/notifications/preferences', '/settings']],
  ['settingsRoutes', '/accessibility/screen-reader', 'screen-reader-audit', ['/accessibility', '/accessibility/shortcuts']],
  ['settingsRoutes', '/language/translations', 'translation-manager', ['/language']],
  ['settingsRoutes', '/language', 'language-preview', ['/language/translations']],
];

// Routes whose element is a PARENT that composes #352 children. The route is
// traversed and its element rendered. `rendered` lists the children the parent
// shows by default; those must show not-live. `composes` lists the children that
// sit behind a tab or another control; those are checked by the parent-import
// assertion below and by the direct-render truth test.
const FAMILY = [
  ['weatherRoutes', '/carbon/reporting', ['/weather/dashboard']],
  ['platformRoutes', '/integrations/story-protocol', ['/integrations', '/integrations/filecoin']],
  ['platformRoutes', '/developer', ['/integrations']],
  ['settingsRoutes', '/settings', ['/settings/preferences', '/settings/privacy']],
];

beforeEach(() => {
  global.fetch = jest.fn(async () => new Response('{}', { status: 404, headers: { 'content-type': 'application/json' } }));
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
  flags.demoSurfaces = false;
});

async function renderRouteElement(element) {
  await act(async () => {
    render(<MemoryRouter><Suspense fallback={<div data-testid="suspense-fallback" />}>{element}</Suspense></MemoryRouter>);
  });
}

describe('#352 route traversal: demoSurfaces OFF (default), every other flag ON', () => {
  it.each(DIRECT)('%s %s is declared, and its element shows %s-not-live', async (mod, path, testId, siblings) => {
    const routes = collectRoutes(buildTree(mod));
    for (const sibling of siblings) expect(routes.has(sibling)).toBe(true); // non-vacuity
    expect(routes.has(path)).toBe(true);
    await renderRouteElement(routes.get(path));
    expect(await screen.findByTestId(`${testId}-not-live`)).not.toBeNull();
    expect(screen.queryByTestId(`${testId}-sample`)).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it.each(FAMILY)('%s %s (family parent) is declared and renders no #352 sample', async (mod, path, siblings) => {
    const routes = collectRoutes(buildTree(mod));
    for (const sibling of siblings) expect(routes.has(sibling)).toBe(true); // non-vacuity
    expect(routes.has(path)).toBe(true);
    await renderRouteElement(routes.get(path));
    expect(screen.queryByTestId('suspense-fallback')).toBeNull(); // the parent really rendered
    expect(document.querySelectorAll('[data-testid$="-sample"]').length).toBe(0);
  });

  it('WorkspaceEditor has no importer besides the CollaborativeAnalysis barrel re-export, so no route mounts it', async () => {
    const fs = await import('node:fs');
    const index = fs.readFileSync(new URL('../../components/CollaborativeAnalysis/index.ts', import.meta.url), 'utf8');
    const page = fs.readFileSync(new URL('../../components/CollaborativeAnalysis/CollaborativeAnalysis.jsx', import.meta.url), 'utf8');
    expect(index).toMatch(/export \{ default as WorkspaceEditor \} from '\.\/WorkspaceEditor'/);
    expect(page).not.toMatch(/WorkspaceEditor/);
  });

  it('CarbonTrackingDashboard is declared lazily in platformRoutes but no route mounts it (unreachable)', async () => {
    const routes = collectRoutes(buildTree('platformRoutes'));
    expect(routes.size).toBeGreaterThan(20); // non-vacuity
    const src = (await import('node:fs')).readFileSync(new URL('../platformRoutes.jsx', import.meta.url), 'utf8');
    expect(src).toMatch(/const CarbonTrackingDashboard = lazy/);
    expect(src).not.toMatch(/<CarbonTrackingDashboard\b/);
  });
});

describe('#352 route traversal: demoSurfaces ON (control, so the OFF case is not vacuous)', () => {
  it.each(DIRECT)('%s %s renders %s-sample and no not-live notice', async (mod, path, testId) => {
    flags.demoSurfaces = true;
    const routes = collectRoutes(buildTree(mod));
    await renderRouteElement(routes.get(path));
    expect(await screen.findByTestId(`${testId}-sample`)).not.toBeNull();
    expect(screen.queryByTestId(`${testId}-not-live`)).toBeNull();
  });
});

describe('#352 family parents compose the GATED children (not a private ungated copy)', () => {
  const read = async rel => (await import('node:fs')).readFileSync(new URL(`../../${rel}`, import.meta.url), 'utf8');
  it.each([
    ['components/CarbonReporting/CarbonReportDashboard.jsx', './ScopeBreakdown', 'components/CarbonReporting/ScopeBreakdown', 'carbon-scope-breakdown'],
    ['components/CarbonReporting/CarbonReportDashboard.jsx', './CreditVerification', 'components/CarbonReporting/CreditVerification', 'carbon-credit-verification'],
    ['components/Integrations/StoryProtocol/StoryProtocolIntegration.jsx', './IPKit', 'components/Integrations/StoryProtocol/IPKit', 'story-ipkit'],
    ['components/Integrations/StoryProtocol/StoryProtocolIntegration.jsx', './NFTOracle', 'components/Integrations/StoryProtocol/NFTOracle', 'story-nft-oracle'],
    ['components/Integrations/StoryProtocol/StoryProtocolIntegration.jsx', './ProtocolContracts', 'components/Integrations/StoryProtocol/ProtocolContracts', 'story-protocol-contracts'],
    ['pages/DeveloperPortal.jsx', '../components/developer/ApiDocumentation', 'components/developer/ApiDocumentation', 'api-documentation'],
    ['pages/DeveloperPortal.jsx', '../components/developer/SDKDownloads', 'components/developer/SDKDownloads', 'sdk-downloads'],
    ['components/Settings/Settings.jsx', './CrossChainConfigPage', 'components/Settings/CrossChainConfigPage', 'cross-chain-config'],
    ['components/Settings/Settings.jsx', './ModuleManagementPage', 'components/Settings/ModuleManagementPage', 'module-management'],
  ])('%s default-imports %s, whose default export renders %s-not-live by default', async (parent, spec, childPath, testId) => {
    const src = await read(parent);
    const escaped = spec.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
    expect(src).toMatch(new RegExp(`import \\w+ from '${escaped}'`));
    const Child = (await import(`../../${childPath}`)).default;
    await renderRouteElement(<Child />);
    expect(screen.getByTestId(`${testId}-not-live`)).not.toBeNull();
    expect(screen.queryByTestId(`${testId}-sample`)).toBeNull();
  });
});
