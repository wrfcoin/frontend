import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { jest } from '@jest/globals';

const flags = new Proxy({}, { get: () => true });
let response = { capabilities: null, loading: true, error: null };
await jest.unstable_mockModule('../../config/features', () => ({ FEATURES: flags, default: flags }));
await jest.unstable_mockModule('../../hooks/useCapabilities', () => ({ useCapabilities: () => response }));
await jest.unstable_mockModule('../../hooks/useProtocolTransition', () => ({ useProtocolTransition: () => ({ transition: null }) }));
const { CapabilitiesProvider, useCapabilitiesContext } = await import('../../contexts/CapabilitiesContext');
const { appRouteElements } = await import('../appRouteTree');

const paths = ['/identity', '/identity/names', '/fleet', '/network/fees', '/community',
  '/notifications/preferences', '/notifications/push-setup', '/leaderboard', '/leaderboard/cooperatives'];
const families = ['identity', 'fleet', 'feeMarket', 'community', 'notifications', 'leaderboard'];
function collect(node, result = []) {
  React.Children.forEach(node, child => {
    if (!React.isValidElement(child)) return;
    if (child.props.path) result.push(child.props.path);
    collect(child.props.children, result);
  });
  return result;
}
function Probe() {
  const { isFeatureEnabled, getFeatureStatus } = useCapabilitiesContext();
  const registered = collect(appRouteElements({ isFeatureEnabled, validatorOpsEnabled: false, networkInsightsEnabled: false }));
  return <><output data-testid="paths">{JSON.stringify(registered)}</output>
    <output data-testid="enabled">{JSON.stringify(families.map(key => [isFeatureEnabled(key), getFeatureStatus(key).enabled]))}</output></>;
}
function mount() {
  render(<CapabilitiesProvider><Probe /></CapabilitiesProvider>);
  const registered = JSON.parse(screen.getByTestId('paths').textContent);
  expect(registered).toContain('/settings');
  expect(registered).toContain('/explore');
  return registered;
}
afterEach(cleanup);
it.each(['unavailable', 'operational', 'degraded'])('registers capability families according to %s despite static flags ON', status => {
  response = { loading: false, error: null, capabilities: { features: Object.fromEntries(families.map(key => [key, { status }])) } };
  const registered = mount();
  for (const path of paths) expect(registered.includes(path)).toBe(status !== 'unavailable');
});
it.each(['loading', 'error', 'missing'])('fails closed while %s, including cached capabilities on error', state => {
  response = {
    capabilities: state === 'error' ? { features: Object.fromEntries(families.map(key => [key, { status: 'operational' }])) } : null,
    loading: state === 'loading', error: state === 'error' ? new Error('offline') : null,
  };
  const registered = mount();
  for (const path of paths) expect(registered.includes(path)).toBe(false);
  expect(JSON.parse(screen.getByTestId('enabled').textContent)).toEqual(families.map(() => [false, false]));
});
it('keeps operational leaderboard routes while refusing unavailable community cooperatives', () => {
  response = { loading: false, error: null, capabilities: { features: {
    leaderboard: { status: 'operational' }, community: { status: 'unavailable' },
  } } };
  const registered = mount();
  expect(registered).toContain('/leaderboard');
  expect(registered).toContain('/leaderboard/contributors');
  expect(registered).not.toContain('/leaderboard/cooperatives');
  expect(registered).not.toContain('/community');
});
