import { useEffect, useState, useCallback, Suspense } from 'react';
import { SocialAuthProvider } from './contexts/SocialAuthContext';
import {
  BrowserRouter as Router,
  Routes,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import './utils/errorHandler';
import { retryDynamicImport } from './utils/retryDynamicImport.js';

// Progressive loading components
import LoadingSpinner from './components/Loading/LoadingSpinner';
import ProgressiveLoader from './components/Loading/ProgressiveLoader';
import WebSocketStatusIndicator from './components/WebSocket/WebSocketStatusIndicator';

// Layout & shell components
import ErrorBoundary from './components/common/ErrorBoundary';
import TestnetNotice from './components/common/TestnetNotice';
import { IntegrationsProvider } from './contexts/IntegrationsContext';
import { CapabilitiesProvider, useCapabilitiesContext } from './contexts/CapabilitiesContext';
import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from './lib/queryClient';
import { useFeatureEnabled, useFeatureReadiness } from './config/featureHooks';
import { WrfProtocolTransitionBanner } from './components/DesignSystem';
import SearchBar from './components/Search/SearchBar';
import ExpandableSidebar from './components/Sidebar/ExpandableSidebar';
import StartMenu from './components/Navigation/StartMenu';
import { MiningProvider } from './contexts/MiningContext';
import { WrfThemeProvider, useThemeMode } from './theme/ThemeProvider';

// Lazy-loaded shell components
import lazy from './routes/lazyImport';
const NotificationCenter = lazy(() => import('./components/Notifications'));
const LiveDataTicker = lazy(() => import('./components/RealTime/LiveDataTicker'));
const ConnectionStatus = lazy(() => import('./components/RealTime/ConnectionStatus'));


// Import global styles
import './styles/theme.css';
import './App.css';
import './styles/common-layout.css';
import { devLog } from './utils/logger';
import { getWebSocketClient } from './services/websocketService';
import { captureReferralFromLocation } from './hooks/useReferrals';
import {
  isFullStudioEnabled,
  isOperatorPreviewEnabled,
  isPublicReadonlyEnabled,
} from './config/contractSurfacePolicy';
import { filterPublicRouteNodes } from './routes/publicRouteFilter';
import { appRouteElements } from './routes/appRouteTree';

function AppContent() {
  const allowShellHiddenFeatures = isFullStudioEnabled(
    import.meta.env?.VITE_ENABLE_FULL_STUDIO,
  );
  const allowPublicReadonlyPaths = isPublicReadonlyEnabled(
    import.meta.env?.VITE_PUBLIC_READONLY_PATHS,
  );
  // frontend#348: internal/staging builds only; never set for the public build.
  const allowOperatorPreview = isOperatorPreviewEnabled(
    import.meta.env?.VITE_ENABLE_OPERATOR_PREVIEW,
  );
  const { isDark, toggleMode } = useThemeMode();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState(null);
  const [wsClient, setWsClient] = useState(null);
  const [appLoaded, setAppLoaded] = useState(false);
  const location = useLocation();
  const { isFeatureEnabled } = useCapabilitiesContext();
  const navigate = useNavigate();
  const validatorOpsReadiness = useFeatureReadiness('validatorOps');
  const validatorOpsStaticEnabled = useFeatureEnabled('validatorOps');
  const networkInsightsReadiness = useFeatureReadiness('networkInsights');
  const networkInsightsStaticEnabled = useFeatureEnabled('networkInsights');
  const validatorOpsEnabled = validatorOpsReadiness
    ? validatorOpsReadiness.mode !== 'unavailable'
    : validatorOpsStaticEnabled;
  const networkInsightsEnabled = networkInsightsReadiness
    ? networkInsightsReadiness.mode !== 'unavailable'
    : networkInsightsStaticEnabled;

  const publicRouteElements = filterPublicRouteNodes(
    appRouteElements({ validatorOpsEnabled, networkInsightsEnabled, isFeatureEnabled }),
    allowShellHiddenFeatures,
    allowPublicReadonlyPaths,
    allowOperatorPreview,
  );

  // Capture referral attribution only in explicitly enabled full-studio mode.
  useEffect(() => {
    if (!allowShellHiddenFeatures) {
      return;
    }

    captureReferralFromLocation();
  }, [allowShellHiddenFeatures]);

  // Initialize performance optimizations after app loads
  useEffect(() => {
    if (appLoaded && allowShellHiddenFeatures) {
      retryDynamicImport(() => import('./services/PerformanceOptimizer'), {
        retries: 2,
        retryDelayMs: 250,
      })
        .then(module => {
          module.default.initialize();
          module.default.prefetchNextPageData(location.pathname);
        })
        .catch(error => {
          console.warn('Performance optimizer initialization skipped:', error);
        });
    }
  }, [allowShellHiddenFeatures, location.pathname, appLoaded]);

  // Determine active route for highlighting in sidebar
  const isActive = useCallback(
    path => {
      return (
        location.pathname === path ||
        (path !== '/' && location.pathname.startsWith(path))
      );
    },
    [location],
  );

  // Function to toggle the expandable menu and handle navigation
  const toggleExpandMenu = (menuName, path = null) => {
    if (expandedMenu === menuName) {
      setExpandedMenu(null);
    } else {
      setExpandedMenu(menuName);
    }
  };

  // Close expanded menu when navigating to a different route
  useEffect(() => {
    setExpandedMenu(null);
  }, [location.pathname]);

  useEffect(() => {
    let savedSidebarState = false;
    try {
      savedSidebarState = localStorage.getItem('sidebarCollapsed') === 'true';
    } catch (error) {
      console.warn('Failed to load sidebar preference:', error);
    }
    setSidebarCollapsed(savedSidebarState);
  }, []);

  // Initialize backend services after app loads
  useEffect(() => {
    if (appLoaded && allowShellHiddenFeatures) {
      const initBackend = async () => {
        try {
          // websocketService is statically imported above; use directly
          const wsClient = getWebSocketClient({
            url: import.meta.env?.VITE_WEBSOCKET_URL || '',
            channels: ['blocks', 'governance'],
            autoReconnect: true,
            maxReconnectAttempts: 5,
          });

          wsClient.on('message', data => {
            devLog('WS Message:', JSON.stringify(data));
          });

          window._wsClient = wsClient;
          setWsClient(wsClient);
        } catch (error) {
          console.warn('WebSocket initialization deferred:', error);
        }
      };

      initBackend();
    }

    return () => {
      if (window._wsClient) {
        try {
          window._wsClient.disconnect();
          window._wsClient = null;
        } catch (error) {
          console.warn('Error during WebSocket cleanup:', error);
        }
      }
    };
  }, [allowShellHiddenFeatures, appLoaded]);

  const toggleDarkMode = () => {
    toggleMode();
  };

  // Show progressive loader until app is ready
  if (!appLoaded) {
    return <ProgressiveLoader onComplete={() => setAppLoaded(true)} />;
  }

  return (
    <div className="app-container start-menu-layout">
      {allowShellHiddenFeatures && (
        <>
          {/* WebSocket Status Indicator */}
          <Suspense fallback={null}>
            <WebSocketStatusIndicator
              wsClient={wsClient}
              position="top-right"
              showDetails={true}
              autoHide={false}
            />
          </Suspense>

          {/* WebSocket Disconnect Banner */}
          <Suspense fallback={null}>
            <ConnectionStatus mode="banner" />
          </Suspense>

          {/* Notification Center: sample-only chrome. The compact shell
              variant renders nothing unless demo surfaces are on, then only
              the fixed bell with a sample chip; never an in-flow notice that
              would push every page down (frontend#427 review P2-1). */}
          <Suspense fallback={null}>
            <NotificationCenter shell />
          </Suspense>

          {/* Live Data Ticker */}
          <Suspense fallback={null}>
            <LiveDataTicker />
          </Suspense>
        </>
      )}

      {/* Start Menu Component - always visible on all routes */}
      <StartMenu darkMode={isDark} toggleDarkMode={toggleDarkMode} isFeatureEnabled={isFeatureEnabled} />

      <div className="main-content" tabIndex={0} role="region" aria-label="Page content">
        {allowOperatorPreview && (
          <div
            data-testid="operator-preview-banner"
            role="status"
            style={{
              padding: '6px 12px',
              background: '#7a1f1f',
              color: '#fff',
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            Internal preview — not the public testnet site
          </div>
        )}
        <WrfProtocolTransitionBanner dismissible />
        <Suspense fallback={<LoadingSpinner message="Loading page..." />}>
          <Routes>
            {publicRouteElements}
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <WrfThemeProvider>
        <QueryClientProvider client={queryClient}>
          <SocialAuthProvider>
            <CapabilitiesProvider>
              <IntegrationsProvider>
                <Router
                  future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true,
                  }}
                >
                  <div className="app-shell">
                    <TestnetNotice />
                    <AppContent />
                  </div>
                </Router>
              </IntegrationsProvider>
            </CapabilitiesProvider>
          </SocialAuthProvider>
        </QueryClientProvider>
      </WrfThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
