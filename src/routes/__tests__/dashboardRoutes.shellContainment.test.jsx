/** @jest-environment jsdom */
import React from 'react';
import { readFileSync } from 'node:fs';
import { cleanup } from '@testing-library/react';
import { jest } from '@jest/globals';

function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*(?:\r?\n|$)/g, '')
    .trim();
}

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
});

function getLandingPathFromRoute(routes) {
  const routeChildren = React.Children.toArray(routes?.props?.children ?? []);
  const homeRoute = routeChildren.find(
    route =>
      React.isValidElement(route) &&
      route.props?.path === '/',
  );

  if (!homeRoute) {
    throw new Error('missing root / route in dashboardRoutes');
  }

  return homeRoute;
}

async function mountDashboardRoutes(isFullStudioEnabledRaw) {
  let homeRoute;

  await jest.isolateModulesAsync(async () => {
    jest.resetModules();

    jest.unstable_mockModule('../../config/features', () => ({
      __esModule: true,
      default: new Proxy({}, { get: () => false }),
    }));

    jest.unstable_mockModule('../../config/contractSurfacePolicy', () => ({
      __esModule: true,
      isFullStudioEnabled: () => isFullStudioEnabledRaw === 'true',
      isContractSurfacesEnabled: () => false,
      isPublicTestnetPath: () => true,
      filterPublicNavigation: items => items,
      filterPublicRouteNavigation: items => items,
      filterPublicSurfaces: items => items,
      isContractSurfacePath: () => false,
      filterContractSurfaceNavigation: items => items,
    }));

    jest.unstable_mockModule('../../pages/WeatherContributorHome', () => ({
      __esModule: true,
      default: function WeatherContributorHome() {
        return <div data-testid="weather-home" />;
      },
    }));

    jest.unstable_mockModule('../../pages/PublicTestnetLandingPage', () => ({
      __esModule: true,
      default: function PublicTestnetLandingPage() {
        return <div data-testid="public-landing" />;
      },
    }));

    jest.unstable_mockModule('../../components/common/PageWrapper', () => ({
      __esModule: true,
      default: ({ children }) => <div data-testid="page-wrapper">{children}</div>,
    }));

    const { default: dashboardRoutes } = await import('../dashboardRoutes');
    const routes = dashboardRoutes();

    homeRoute = getLandingPathFromRoute(routes);
  });

  return homeRoute;
}

describe('dashboard route policy', () => {
  it.each([undefined, '', 'false', 'TRUE', ' true', 'true ', '1'])(
    'renders PublicTestnetLandingPage for omitted/malformed policy value %p',
    async value => {
      const homeRoute = await mountDashboardRoutes(value);
      expect(homeRoute.props.element.props.children.type.name).toBe(
        'PublicTestnetLandingPage',
      );
    },
  );

  it('renders WeatherContributorHome only when policy is exact true', async () => {
    const homeRoute = await mountDashboardRoutes('true');
    const child = homeRoute.props.element.props.children;
    expect(child.type).toEqual(
      expect.objectContaining({
        $$typeof: Symbol.for('react.lazy'),
      }),
    );
  });

  it('source keeps PublicTestnetLandingPage static and links-restricted', () => {
    const source = stripComments(readFileSync(new URL('../../pages/PublicTestnetLandingPage.jsx', import.meta.url), 'utf8'));

    expect(source).not.toMatch(/fetch\s*\(|localStorage|sessionStorage|WebSocket|getWebSocketClient/);
    // Links come from the policy-filtered public nav list (S0), not literals.
    expect(source).toMatch(/getPublicNavEntries\(/);
    const nav = readFileSync(new URL('../../config/publicNavigation.ts', import.meta.url), 'utf8');
    for (const path of ['/security', '/terms', '/privacy', '/api-terms']) {
      expect(nav).toContain(`path: '${path}'`);
    }
  });
});
