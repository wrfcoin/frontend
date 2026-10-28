/**
 * @jest-environment jsdom
 */
import React from 'react';
import { jest } from '@jest/globals';

// Timing budget, not a behavior limit: measured 0.4-0.6 s per test in isolation on origin/main (2026-10-28),
// but 6.5 s for the NotificationCenter test that timed out in a full-suite run (frontend-archive#553), over Jest's 5000 ms default.
jest.setTimeout(30000);

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function routeFixture(path, testId) {
  return React.createElement('mock-route', {
    path,
    element: React.createElement('div', { 'data-testid': testId }),
  });
}

function hasRouteMatch(pattern, pathname) {
  if (!pattern || pattern === '*') {
    return true;
  }

  if (pattern === '/') {
    return pathname === '/' || pathname === '';
  }

  if (pattern.endsWith('/*')) {
    const base = pattern.slice(0, -2);
    return pathname === base || pathname.startsWith(`${base}/`);
  }

  return pathname === pattern;
}

function makeShellFeatureMock(testId) {
  return () => <div data-testid={testId} />;
}

function byTestId(container, testId) {
  return container.querySelector(`[data-testid="${testId}"]`);
}

function hasNotFoundPage(container) {
  return Array.from(container.querySelectorAll('h2')).some(node =>
    /page not found/i.test(node.textContent || ''),
  );
}

const PUBLIC_PATHS = new Set([
  '/',
  '/terms',
  '/privacy',
  '/api-terms',
  '/security',
  '/downloads',
]);
const HIDDEN_PATH_PREFIXES = new Set([
  '/onboarding',
  '/identity',
  '/resources',
  '/miner',
  '/settings',
  '/language',
  '/notifications',
  '/integrations',
  '/wallet',
  '/forecast',
  '/realtime',
  '/alerts',
  '/resilience',
  '/analytics',
  '/nfts',
  '/governance',
  '/defi',
  '/bridge',
  '/smart-contracts',
  '/accessibility',
  '/quality',
  '/fleet',
  '/earnings',
]);

const OPERATOR_PREVIEW_TEST_PREFIXES = ['/wallet'];

function isOperatorPreviewPath(path) {
  return OPERATOR_PREVIEW_TEST_PREFIXES.some(
    prefix => path === prefix || path.startsWith(`${prefix}/`),
  );
}

function isHiddenPath(path) {
  const normalized = path === '/' ? '/' : path.replace(/\/+$/, '');

  return Array.from(HIDDEN_PATH_PREFIXES).some(hiddenPath => {
    const normalizedHiddenPath = hiddenPath === '/' ? '/' : hiddenPath.replace(/\/+$/, '');
    return (
      normalized === normalizedHiddenPath ||
      normalized.startsWith(`${normalizedHiddenPath}/`)
    );
  });
}

const SHARED_FEATURES = {};
const cleanupFns = [];
let consoleErrorSpy;

beforeEach(() => {
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  window.history.replaceState({}, '', '/');
  window._wsClient = null;

  for (const cleanup of cleanupFns.splice(0)) {
    cleanup();
  }

  expect(consoleErrorSpy).not.toHaveBeenCalled();
  consoleErrorSpy.mockRestore();
  jest.restoreAllMocks();
});

async function renderAppWithStudioFlag(
  rawValue,
  initialPath,
  operatorPreviewRaw,
  demoSurfacesOn = false,
  { realNotifications = false } = {},
) {
  const captureReferralFromLocation = jest.fn();
  const getWebSocketClient = jest.fn(() => ({
    on: jest.fn(),
    disconnect: jest.fn(),
  }));
  const initialize = jest.fn();
  const prefetchNextPageData = jest.fn();
  // Resolve through the importer so full-studio renders get the mocked lazy
  // shell components (and the mocked PerformanceOptimizer below).
  const retryDynamicImport = jest.fn(async importer => importer());

  const toggleMode = jest.fn();

  let renderedState;
  await jest.isolateModulesAsync(async () => {
    jest.resetModules();

    const isPublicPath = (path, isFullStudioEnabled, _readonly, isOperatorPreviewEnabled) => {
      if (path === '*') {
        return true;
      }

      if (!path) {
        return false;
      }

      const normalized = path === '/' ? '/' : path.replace(/\/+$/, '');

      if (PUBLIC_PATHS.has(normalized)) {
        return true;
      }

      // Mirrors the real policy for the operator-preview family under test:
      // /wallet needs full studio AND operator preview (frontend#348).
      if (isOperatorPreviewPath(normalized)) {
        return Boolean(isFullStudioEnabled && isOperatorPreviewEnabled);
      }

      if (isHiddenPath(normalized)) {
        return false;
      }
      return isFullStudioEnabled;
    };
    const filterPublic = (items, isFullStudioEnabled, isOperatorPreviewEnabled) =>
      items.filter(item =>
        isPublicPath(item.path, isFullStudioEnabled, false, isOperatorPreviewEnabled),
      );
    const filterPublicDeep = (items, isFullStudioEnabled, isOperatorPreviewEnabled) =>
      filterPublic(items, isFullStudioEnabled, isOperatorPreviewEnabled);

    jest.unstable_mockModule('../config/contractSurfacePolicy', () => ({
      __esModule: true,
      isContractSurfacesEnabled: () => false,
      isFullStudioEnabled: () => rawValue === 'true',
      isOperatorPreviewEnabled: () => operatorPreviewRaw === 'true',
      isPublicReadonlyEnabled: () => false,
      isPublicTestnetPath: isPublicPath,
      filterPublicNavigation: filterPublic,
      filterPublicRouteNavigation: filterPublicDeep,
      filterPublicSurfaces: filterPublicDeep,
      isContractSurfacePath: () => false,
      filterContractSurfaceNavigation: filterPublic,
    }));

    jest.unstable_mockModule('../config/featureHooks', () => ({
      __esModule: true,
      useFeatureEnabled: () => true,
      useFeatureStatus: () => 'disabled',
      useFeatureReadiness: () => ({ mode: 'unavailable' }),
    }));

    jest.unstable_mockModule('../config/features', () => {
      const features = {
        contractSurfaces: false,
        demoSurfaces: demoSurfacesOn === true,
        crossChain: false,
        defi: false,
        staking: false,
        smartContracts: false,
        carbonReporting: false,
        bridgeAdvanced: false,
        carbon: false,
        liquidStaking: false,
        referrals: false,
        leaderboard: false,
        advancedOnboarding: false,
        aiIntegration: false,
        privacy: false,
        sharding: false,
        iot: false,
        messaging: false,
        storage: false,
        cortex: false,
        standards: false,
        developer: false,
        analytics: false,
        integrations: false,
        infrastructure: false,
        mobile: false,
        gamification: false,
        incentives: false,
        system: false,
        oracle: false,
        partners: false,
        achievements: false,
        identity: false,
        feeMarket: false,
        liquidStaking: false,
        smartContracts: false,
        fleet: false,
        forecast: false,
        explorerMap: false,
        pipelines: false,
        aiMarketplace: false,
        collaboration: false,
        computeMarketplace: false,
        community: false,
        forecastStudio: false,
        // Operator-only (owner ruling 2026-09-26): same gate as /wallet.
        walletSend: rawValue === 'true' && operatorPreviewRaw === 'true',
      };

      // One shared object, mutated per render: ESM modules that stay cached
      // across isolateModulesAsync (e.g. the real NotificationCenter) keep
      // their binding to it and so see this render's flags.
      for (const key of Object.keys(SHARED_FEATURES)) delete SHARED_FEATURES[key];
      Object.assign(SHARED_FEATURES, features);

      return {
        __esModule: true,
        isMvpMode: () => rawValue === 'true',
        FEATURES: SHARED_FEATURES,
        default: SHARED_FEATURES,
      };
    });

    jest.unstable_mockModule('../contexts/SocialAuthContext', () => ({
      __esModule: true,
      SocialAuthProvider: ({ children }) => <>{children}</>,
    }));

    jest.unstable_mockModule('../contexts/CapabilitiesContext', () => ({
      __esModule: true,
      CapabilitiesProvider: ({ children }) => <>{children}</>,
      useCapabilitiesContext: () => ({ isFeatureEnabled: () => true }),
    }));

    jest.unstable_mockModule('../contexts/IntegrationsContext', () => ({
      __esModule: true,
      IntegrationsProvider: ({ children }) => <>{children}</>,
    }));

    jest.unstable_mockModule('../theme/ThemeProvider', () => ({
      __esModule: true,
      WrfThemeProvider: ({ children }) => <>{children}</>,
      useThemeMode: () => ({ isDark: false, toggleMode }),
    }));

    jest.unstable_mockModule('@tanstack/react-query', () => ({
      __esModule: true,
      QueryClientProvider: ({ children }) => <>{children}</>,
    }));

    jest.unstable_mockModule('../lib/queryClient', () => ({
      __esModule: true,
      default: {},
    }));

    jest.unstable_mockModule('../services/PerformanceOptimizer', () => ({
      __esModule: true,
      default: { initialize, prefetchNextPageData },
    }));

    jest.unstable_mockModule('../utils/retryDynamicImport.js', () => ({
      __esModule: true,
      retryDynamicImport,
    }));

    jest.unstable_mockModule('../services/websocketService', () => ({
      __esModule: true,
      getWebSocketClient,
    }));

    jest.unstable_mockModule('../hooks/useReferrals', () => ({
      __esModule: true,
      captureReferralFromLocation,
    }));

    await jest.unstable_mockModule('react-router-dom', () => {
      const Route = ({ path, element }) =>
        React.createElement('mock-route', { path, element });
      Route.__isMockRoute = true;

      const flattenRoutes = (nodes, routes = []) => {
        React.Children.forEach(nodes, child => {
          if (child == null) {
            return;
          }

          if (React.isValidElement(child)) {
            if (child.type === 'mock-route' || child.type?.__isMockRoute) {
              routes.push(child);

              if (child.props.children) {
                flattenRoutes(child.props.children, routes);
              }

              return;
            }

            if (child.type === React.Fragment) {
              flattenRoutes(child.props.children, routes);
              return;
            }

            if (child.props?.children) {
              flattenRoutes(child.props.children, routes);
            }
          }
        });

        return routes;
      };

      return {
        __esModule: true,
        Link: ({ children, to }) => React.createElement('a', { href: to }, children),
        BrowserRouter: ({ children }) =>
          React.createElement(React.Fragment, null, children),
        Routes: ({ children }) => {
          const pathname = window.location.pathname || '/';
          const routes = flattenRoutes(children, []);
          const matched = routes.find(({ props }) =>
            hasRouteMatch(props?.path ?? '*', pathname),
          );

          return matched?.props?.element ?? null;
        },
        Route,
        Navigate: ({ to }) => {
          window.history.pushState({}, '', to);
          return null;
        },
        useLocation: () => ({ pathname: window.location.pathname }),
        useNavigate: () => to => {
          window.history.pushState({}, '', to);
        },
      };
    });

    jest.unstable_mockModule('../components/Loading/ProgressiveLoader', () => ({
      __esModule: true,
      default: ({ onComplete }) => {
        queueMicrotask(() => onComplete?.());
        return <div data-testid="progressive-loader" />;
      },
    }));

    jest.unstable_mockModule('../components/Loading/LoadingSpinner', () => ({
      __esModule: true,
      default: () => <div data-testid="loading-spinner" />,
    }));

    jest.unstable_mockModule('../components/WebSocket/WebSocketStatusIndicator', () => ({
      __esModule: true,
      default: makeShellFeatureMock('ws-status-indicator'),
    }));

    jest.unstable_mockModule('../components/RealTime/ConnectionStatus', () => ({
      __esModule: true,
      default: makeShellFeatureMock('ws-banner'),
    }));

    // realNotifications: route the shell import to the real NotificationCenter
    // (and its DemoSurfaceGate) so the shell test sees what a user sees. It is
    // registered explicitly because an earlier test's mock would otherwise
    // persist in the ESM registry.
    jest.unstable_mockModule('../components/Notifications', async () => {
      if (!realNotifications) {
        return { __esModule: true, default: makeShellFeatureMock('notification-center') };
      }
      const real = await import('../components/Notifications/NotificationCenter');
      return { __esModule: true, default: real.default };
    });

    jest.unstable_mockModule('../components/RealTime/LiveDataTicker', () => ({
      __esModule: true,
      default: makeShellFeatureMock('live-data-ticker'),
    }));

    jest.unstable_mockModule('../components/Navigation/StartMenu', () => ({
      __esModule: true,
      default: () => <div data-testid="start-menu" />,
    }));

    jest.unstable_mockModule('../components/DesignSystem', () => ({
      __esModule: true,
      WrfProtocolTransitionBanner: () => <div data-testid="protocol-banner" />,
    }));

    jest.unstable_mockModule('../components/common/NotFound', () => ({
      __esModule: true,
      default: () => <h2>Page Not Found</h2>,
    }));

    jest.unstable_mockModule('../components/common/ErrorBoundary', () => ({
      __esModule: true,
      default: ({ children }) => <>{children}</>,
    }));

    jest.unstable_mockModule('../routes', () => ({
      __esModule: true,
      dashboardRoutes: () => routeFixture('/', 'landing-route'),
      walletRoutes: () => routeFixture('/wallet', 'wallet-route'),
      miningRoutes: () => routeFixture('/mining', 'mining-route'),
      nftRoutes: () => routeFixture('/nft/browse', 'nft-route'),
      governanceRoutes: () => routeFixture('/governance', 'governance-route'),
      weatherRoutes: () => routeFixture('/weather/dashboard', 'weather-route'),
      networkRoutes: () => routeFixture('/network', 'network-route'),
      settingsRoutes: () => routeFixture('/settings', 'settings-route'),
      defiRoutes: () => routeFixture('/earnings', 'defi-route'),
      identityRoutes: () => routeFixture('/identity', 'identity-route'),
      communityRoutes: () => routeFixture('/community', 'community-route'),
      platformRoutes: () => routeFixture('/resources', 'platform-route'),
      earnRoutes: () => routeFixture('/rewards', 'earn-route'),
    }));

    jest.unstable_mockModule('../routes/index', () => ({
      __esModule: true,
      dashboardRoutes: () => routeFixture('/', 'landing-route'),
      walletRoutes: () => routeFixture('/wallet', 'wallet-route'),
      miningRoutes: () => routeFixture('/mining', 'mining-route'),
      nftRoutes: () => routeFixture('/nft/browse', 'nft-route'),
      governanceRoutes: () => routeFixture('/governance', 'governance-route'),
      weatherRoutes: () => routeFixture('/weather/dashboard', 'weather-route'),
      networkRoutes: () => routeFixture('/network', 'network-route'),
      settingsRoutes: () => routeFixture('/settings', 'settings-route'),
      defiRoutes: () => routeFixture('/earnings', 'defi-route'),
      identityRoutes: () => routeFixture('/identity', 'identity-route'),
      communityRoutes: () => routeFixture('/community', 'community-route'),
      platformRoutes: () => routeFixture('/resources', 'platform-route'),
      earnRoutes: () => routeFixture('/rewards', 'earn-route'),
    }));

    if (realNotifications) {
      // Resolve the lazy shell chunk up front so assertions see the mounted
      // component (or its deliberate absence), not a pending Suspense.
      await import('../components/Notifications');
    }
    const { default: App } = await import('../App');
    const { FEATURES: features } = await import('../config/features');
    const { act } = await import('react');
    const { createRoot } = await import('react-dom/client');
    const mountPoint = document.createElement('div');
    document.body.appendChild(mountPoint);

    const root = createRoot(mountPoint);

    window.history.pushState({}, '', initialPath);

    await act(async () => {
      root.render(<App />);
      await Promise.resolve();
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    if (realNotifications) {
      for (let tick = 0; tick < 5; tick += 1) {
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 0));
        });
      }
    }

    cleanupFns.push(() => {
      act(() => root.unmount());
      mountPoint.remove();
    });

    renderedState = {
      captureReferralFromLocation,
      getWebSocketClient,
      retryDynamicImport,
      prefetchNextPageData,
      initialize,
      hasNotFoundPage: () => hasNotFoundPage(mountPoint),
      queryByTestId: testId => byTestId(mountPoint, testId),
      queryProtocolBanner: () => byTestId(mountPoint, 'protocol-banner'),
      features,
    };
  });
  return renderedState;
}

describe('App shell containment (full-studio policy)', () => {
  const disallowedValues = [
    undefined,
    '',
    'false',
    'TRUE',
    ' true',
    'true ',
    '1',
    true,
    'not-a-boolean',
  ];

  it.each(disallowedValues)('omits shell hidden features for %p', async rawValue => {
    const {
      captureReferralFromLocation,
      getWebSocketClient,
      retryDynamicImport,
      prefetchNextPageData,
      hasNotFoundPage,
      queryByTestId,
    } = await renderAppWithStudioFlag(rawValue, '/tabs/example');

    // /tabs/* itself no longer exists in any mode (frontend#306); the path
    // is kept as an arbitrary non-public route to exercise the shell gate.
    expect(queryByTestId('ws-status-indicator')).toBeNull();
    expect(queryByTestId('ws-banner')).toBeNull();
    expect(queryByTestId('notification-center')).toBeNull();
    expect(queryByTestId('live-data-ticker')).toBeNull();
    expect(queryByTestId('protocol-banner')).toBeDefined();

    expect(captureReferralFromLocation).not.toHaveBeenCalled();
    expect(getWebSocketClient).not.toHaveBeenCalled();
    expect(retryDynamicImport).not.toHaveBeenCalled();
    expect(prefetchNextPageData).not.toHaveBeenCalled();
  });

  // frontend#348: an operator-preview build always says so on every page.
  it('renders no operator-preview banner when the preview flag is unset', async () => {
    const { queryByTestId } = await renderAppWithStudioFlag(undefined, '/');
    expect(queryByTestId('operator-preview-banner')).toBeNull();
  });

  it('renders the persistent operator-preview banner when the flag is on', async () => {
    const { queryByTestId } = await renderAppWithStudioFlag(undefined, '/', 'true');
    const banner = queryByTestId('operator-preview-banner');
    expect(banner).not.toBeNull();
    expect(banner.textContent).toBe('Internal preview — not the public testnet site');
  });

  // One render per test (frontend#377): every render re-evaluates the whole
  // App graph (isolateModulesAsync + resetModules), so rendering all routes
  // inside one test put ~18 renders against a single 5 s budget and timed
  // out under full-suite load. Same assertions, one route per test.
  it('only exposes minimal public routes when full-studio is omitted', async () => {
    const { queryByTestId, hasNotFoundPage } = await renderAppWithStudioFlag(
      undefined,
      '/',
    );

    expect(queryByTestId('landing-route')).toBeDefined();
    expect(queryByTestId('wallet-route')).toBeNull();
    expect(hasNotFoundPage()).toBe(false);
  });

  const disallowedRoutes = [
    '/earnings',
    '/earnings/history',
    '/resources',
    '/resources/wiki',
    '/wallet',
    '/wallet/abc',
    '/onboarding',
    '/onboarding/qr',
    '/identity',
    '/identity/names',
    '/wallet/onboarding',
    '/settings/modules',
    '/language/translations',
    '/notifications/preferences',
    '/integrations/ai',
    '/forecast/studio',
    '/realtime/activity',
  ];

  it.each(disallowedRoutes)(
    'does not expose %s when full-studio is omitted',
    async route => {
      const disallowedRoute = await renderAppWithStudioFlag(undefined, route);

      expect(disallowedRoute.queryByTestId('defi-route')).toBeNull();
      expect(disallowedRoute.queryByTestId('earn-route')).toBeNull();
      expect(disallowedRoute.queryByTestId('wallet-route')).toBeNull();
      expect(disallowedRoute.hasNotFoundPage()).toBe(true);
    },
  );
});

// frontend#345/#346, owner ruling 2026-09-26: web send is operator-only.
describe('App shell containment (operator-only wallet send)', () => {
  it.each([
    ['public build', undefined, undefined],
    ['full studio without operator preview', 'true', undefined],
    ['operator preview without full studio', undefined, 'true'],
  ])('%s: /wallet is a 404 and walletSend is off', async (_label, studio, preview) => {
    const { queryByTestId, hasNotFoundPage, features } = await renderAppWithStudioFlag(
      studio,
      '/wallet',
      preview,
    );

    expect(queryByTestId('wallet-route')).toBeNull();
    expect(hasNotFoundPage()).toBe(true);
    expect(features.walletSend).toBe(false);
  });

  it('operator preview build: /wallet renders and walletSend is on', async () => {
    const { queryByTestId, hasNotFoundPage, features } = await renderAppWithStudioFlag(
      'true',
      '/wallet',
      'true',
    );

    expect(queryByTestId('wallet-route')).not.toBeNull();
    expect(hasNotFoundPage()).toBe(false);
    expect(queryByTestId('operator-preview-banner')).not.toBeNull();
    expect(features.walletSend).toBe(true);
  });
});

// frontend#427 review P2-1: NotificationCenter is App-shell chrome in
// full-studio / operator-preview builds, not a routed page. It renders the
// real NotificationCenter module here (not a mock), so this is what a user
// sees on a normal page: with demo surfaces off there must be no not-live
// notice and no bell; with them on, only the fixed bell + sample chip, never
// the in-flow "Sample data" strip.
describe('App shell NotificationCenter (demo-surface gated chrome)', () => {
  it.each([
    ['full studio', 'true', undefined],
    ['operator preview', 'true', 'true'],
  ])('%s, demoSurfaces off: no notification notice or chrome on a normal page', async (_label, studio, preview) => {
    const { queryByTestId } = await renderAppWithStudioFlag(studio, '/', preview, false, {
      realNotifications: true,
    });
    expect(queryByTestId('landing-route')).not.toBeNull();
    expect(queryByTestId('ws-banner')).not.toBeNull();
    expect(queryByTestId('notification-center-not-live')).toBeNull();
    expect(queryByTestId('notification-center-shell')).toBeNull();
  });

  it('operator preview, demoSurfaces on: fixed bell with a sample chip, no in-flow strip', async () => {
    const { queryByTestId } = await renderAppWithStudioFlag('true', '/', 'true', true, {
      realNotifications: true,
    });
    expect(queryByTestId('landing-route')).not.toBeNull();
    const shell = queryByTestId('notification-center-shell');
    expect(shell).not.toBeNull();
    expect(shell.querySelector('[data-testid="notification-center-sample-badge"]')).not.toBeNull();
    expect(queryByTestId('notification-center-sample')).toBeNull();
    expect(queryByTestId('notification-center-not-live')).toBeNull();
  });
});

export {};
