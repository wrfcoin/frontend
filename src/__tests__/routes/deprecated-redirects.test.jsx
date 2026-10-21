/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router';
import DeprecatedRedirect from '../../components/common/DeprecatedRedirect';

/**
 * Renders a minimal router with a DeprecatedRedirect route and a target route,
 * then asserts the final location matches the expected target.
 */
function renderRedirect(fromPath, toPath) {
  let currentLocation;

  const LocationCapture = () => {
    const loc = useLocation();
    currentLocation = loc;
    return <div data-testid="target">{loc.pathname}</div>;
  };

  render(
    <MemoryRouter initialEntries={[fromPath]}>
      <Routes>
        <Route path={fromPath} element={<DeprecatedRedirect to={toPath} />} />
        <Route path={toPath} element={<LocationCapture />} />
        <Route path="*" element={<LocationCapture />} />
      </Routes>
    </MemoryRouter>,
  );

  return () => currentLocation;
}

describe('Deprecated route redirects', () => {
  let dispatchedEvents;

  beforeEach(() => {
    dispatchedEvents = [];
    const handler = (e) => dispatchedEvents.push(e.detail);
    window.addEventListener('wrfcoin:deprecated-route', handler);
    return () => window.removeEventListener('wrfcoin:deprecated-route', handler);
  });

  const cases = [
    ['/dashboard/legacy', '/'],
    ['/governance', '/governance/comprehensive'],
    ['/governance/proposals/enhanced', '/governance/comprehensive'],
    ['/governance/foundation', '/governance/comprehensive'],
    ['/governance/eip712', '/resources'],
    ['/bridge/monitor', '/bridge'],
    ['/bridge/analytics', '/bridge'],
    ['/standards', '/resources'],
  ];

  test.each(cases)('%s redirects to %s', async (from, to) => {
    const getLocation = renderRedirect(from, to);
    await waitFor(() => {
      expect(getLocation().pathname).toBe(to);
    });
  });

  test('emits wrfcoin:deprecated-route custom event', async () => {
    renderRedirect('/dashboard/legacy', '/');
    await waitFor(() => {
      expect(dispatchedEvents.length).toBeGreaterThanOrEqual(1);
      expect(dispatchedEvents[0]).toEqual(
        expect.objectContaining({ from: '/dashboard/legacy', to: '/' }),
      );
    });
  });
});
