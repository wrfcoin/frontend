import React from 'react';
import { jest } from '@jest/globals';
import { cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';

// The advanced bridge body is explicitly illustrative after frontend#499.
await jest.unstable_mockModule('../../../config/features', () => ({ FEATURES: { demoSurfaces: true }, default: { demoSurfaces: true } }));
let reasonCode = 'unverified';
let readinessMode = 'unavailable';
await jest.unstable_mockModule('../../../config/featureHooks', () => ({ useFeatureReadiness: () => null }));
await jest.unstable_mockModule('../../../contexts/CapabilitiesContext', () => ({
  useCapabilitiesContext: () => ({
    getFeatureReadiness: () => ({ mode: readinessMode, reason: 'RAW_REASON', reasonCode }),
    protocolTransition: null, shouldGateRiskyActions: false,
  }),
}));
await jest.unstable_mockModule('../../../hooks/useCapabilities', () => ({
  useCapabilities: () => ({ loading: false, error: null, capabilities: { features: {
    l2Prover: { status: 'configured', reasonCode },
  } } }),
}));
await jest.unstable_mockModule('../../../hooks/useBridgeTrustMode', () => ({ useBridgeTrustMode: () => ({ trustState: null, loading: false }) }));
await jest.unstable_mockModule('../../../hooks/useBridgeFinalityStatus', () => ({ useBridgeFinalityStatus: () => ({ data: null, isLoading: false, error: null }) }));
await jest.unstable_mockModule('../../StoreConsistencyBanner', () => ({ StoreConsistencyBanner: () => null }));
const styles = await import('../../../__mocks__/muiStylesMock.cjs');
await jest.unstable_mockModule('@mui/material/styles', () => ({ ...styles, styled: (Component: React.ElementType) => () => (props: object) => <Component {...props} /> }));

const { WrfCapabilityReadinessBadge } = await import('../WrfCapabilityReadinessBadge');
const { usePreflightChecks } = await import('../../../hooks/usePreflightChecks');
const { default: L2ReadinessPanel } = await import('../../NetworkInsights/L2ReadinessPanel');
const { default: BridgeTransactionTracker } = await import('../../BridgeAdvanced/BridgeTransactionTracker');
afterEach(cleanup);
beforeEach(() => { reasonCode = 'unverified'; readinessMode = 'unavailable'; });

const cases = [
  ['ok', 'Available'], ['not_wired', 'Not available yet'],
  ['unverified', 'Configured, not yet verified'], ['simulated', 'Demo data only'],
  ['reachable', 'Reachable, not yet verified'], ['degraded', 'Service is partially available'],
  ['unavailable', 'Service is unavailable'], ['proof_missing', 'Verification proof is missing'],
  ['evidence_stale', 'Verification evidence is out of date'], ['evidence_invalid', 'Verification evidence is invalid'],
  ['provider_failed', 'Readiness could not be checked'], ['unknown_code', 'Readiness information is unavailable'],
  ['__proto__', 'Readiness information is unavailable'],
];
it.each(cases)('renders the human label for %s using reasonCode', (code, text) => {
  render(<WrfCapabilityReadinessBadge readiness={{ capabilityId: 'test', mode: 'unavailable',
    reason: 'RAW_REASON', reasonCode: code, updatedAt: '2026-10-03T00:00:00Z', signals: {} }} />);
  expect(screen.getByText(text)).toBeInTheDocument();
  expect(screen.queryByText('RAW_REASON')).not.toBeInTheDocument();
});
it('uses the same human reason in the compact tooltip', async () => {
  render(<WrfCapabilityReadinessBadge compact readiness={{ capabilityId: 'test', mode: 'unavailable',
    reason: 'RAW_REASON', reasonCode, updatedAt: '2026-10-03T00:00:00Z', signals: {} }} />);
  fireEvent.mouseOver(screen.getByText('Unavailable'));
  expect(await screen.findByRole('tooltip')).toHaveTextContent('Configured, not yet verified');
});
it('uses the human label in preflight failures', () => {
  const { result } = renderHook(() => usePreflightChecks({ requiredCapabilities: ['test'] }));
  expect(result.current).toEqual([{ label: 'test readiness', passed: false, reason: 'Configured, not yet verified' }]);
});
it('preserves a passing preflight mode independently of its reason label', () => {
  readinessMode = 'local-manager'; reasonCode = 'unknown_code';
  const { result } = renderHook(() => usePreflightChecks({ requiredCapabilities: ['test'] }));
  expect(result.current).toEqual([{ label: 'test readiness', passed: true }]);
});
it('preserves the empty badge state when no readiness entry exists', () => {
  const { container } = render(<WrfCapabilityReadinessBadge />);
  expect(container).toBeEmptyDOMElement();
});
it.each([['network', L2ReadinessPanel], ['bridge', BridgeTransactionTracker]])(
  '%s tooltip reads feature.reasonCode from the public payload', async (_name, Component) => {
    render(<Component />);
    fireEvent.mouseOver(screen.getByText('L2 Prover: configured'));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Configured, not yet verified');
  },
);
