import DemoSurfaceGate from '../common/DemoSurfaceGate';
import React, { useState, useEffect } from 'react';
import {
  Box,
  useTheme,
  useMediaQuery,
  Container,
  Typography,
  Alert,
  Snackbar,
  Fade,
} from '@mui/material';
import { usePWA } from '../../utils/pwaUtils';

// Import all mobile components
import MobileNavigation from './MobileNavigation';
import MobileSensorDashboard from './MobileSensorDashboard';
import MobileEarnings from './MobileEarnings';
import MobileQuickActions from './MobileQuickActions';
import MobileHSMSecurityDashboard from './MobileHSMSecurityDashboard';
import MobileIntegrationsHub from './MobileIntegrationsHub';
import MobileCarbonCreditDashboard from './MobileCarbonCreditDashboard';
import MobileAIMLDashboard from './MobileAIMLDashboard';
import MobileDistributedStorage from './MobileDistributedStorage';

// Web components for previously-placeholder routes
import UnifiedAnalyticsDashboard from '../UnifiedAnalytics/UnifiedAnalyticsDashboard';
import DeFiPortfolio from '../DeFi/DeFiPortfolio';
import ComprehensiveGovernanceDashboard from '../Governance/ComprehensiveGovernanceDashboard';
import ComputeMarketplace from '../ComputeMarketplace';
import SystemMonitor from '../System/SystemMonitor';
import AdvancedPerformanceDashboard from '../AdvancedPerformanceDashboard';
import { devLog } from '../../utils/logger';
import {
  isFullStudioEnabled,
  isOperatorPreviewEnabled,
  isPublicTestnetPath,
} from '../../config/contractSurfacePolicy';

interface MobileAppProps {
  initialPath?: string;
  userProfile?: {
    name: string;
    avatar?: string;
    role: string;
  };
}

const MobileAppSample: React.FC<MobileAppProps> = ({
  initialPath = '/dashboard',
  userProfile = {
    name: 'Weather Station Operator',
    role: 'Station Manager',
  },
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const allowShellHiddenFeatures = isFullStudioEnabled(
    import.meta.env?.VITE_ENABLE_FULL_STUDIO,
  );
  const allowOperatorPreview = isOperatorPreviewEnabled(
    import.meta.env?.VITE_ENABLE_OPERATOR_PREVIEW,
  );

  // PWA hooks
  const {
    canInstall,
    isInstalled,
    isOnline,
    install,
    requestNotifications,
    showNotification,
  } = usePWA();

  useEffect(() => {
    // Show PWA install prompt if available
    if (canInstall && !isInstalled) {
      showSnackbar('Install WRFCoin app for the best mobile experience!');
    }

    // Handle offline/online status
    if (!isOnline) {
      showSnackbar('You are offline. Some features may be limited.');
    }
  }, [canInstall, isInstalled, isOnline]);

  useEffect(() => {
    // Request notification permission on first load
    if ('Notification' in window && Notification.permission === 'default') {
      requestNotifications();
    }
  }, []);

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const handleNavigation = (path: string) => {
    if (!isPublicTestnetPath(path, allowShellHiddenFeatures, false, allowOperatorPreview)) {
      return;
    }

    setCurrentPath(path);

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(5);
    }

    // Log navigation for analytics
    devLog('Navigated to:', path);
  };

  const handleQuickActions = () => {
    setQuickActionsOpen(true);
  };

  const handleQuickAction = (action: string) => {
    devLog('Quick action:', action);

    // Handle specific quick actions
    switch (action) {
    case 'refresh-sensors':
      showSnackbar('Refreshing sensor data...');
      break;
    case 'check-earnings':
      handleNavigation('/earnings');
      break;
    case 'sync-data':
      showSnackbar('Syncing data...');
      break;
    case 'emergency-alert':
      showNotification({
        title: 'Emergency Alert',
        body: 'Emergency protocols activated',
        requireInteraction: true,
      });
      break;
    default:
      showSnackbar(`Action: ${action}`);
    }

    setQuickActionsOpen(false);

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(25);
    }
  };

  const renderCurrentPage = () => {
    if (!isPublicTestnetPath(currentPath, allowShellHiddenFeatures, false, allowOperatorPreview)) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Page Not Found
          </Typography>
        </Box>
      );
    }

    switch (currentPath) {
    case '/dashboard':
      return (
        <Box>
            <Typography
            variant="h5"
            gutterBottom
            sx={{ p: 2, pb: 1, fontWeight: 600 }}
          >
              WRFCoin Dashboard
            </Typography>
            <Container maxWidth="sm" sx={{ px: 1 }}>
              <MobileSensorDashboard compact />
              <Box sx={{ mt: 2 }}>
                <MobileEarnings compact />
              </Box>
            </Container>
          </Box>
      );

    case '/sensors':
      return <MobileSensorDashboard />;

    case '/earnings':
      return <MobileEarnings />;

    case '/carbon':
      return <MobileCarbonCreditDashboard />;

    case '/ai':
      return <MobileAIMLDashboard />;

    case '/storage':
      return <MobileDistributedStorage />;

    case '/security':
      return <MobileHSMSecurityDashboard />;

    case '/integrations':
      return <MobileIntegrationsHub />;

    case '/analytics':
      return <UnifiedAnalyticsDashboard />;

    case '/trading':
      return <DeFiPortfolio />;

    case '/governance':
      return <ComprehensiveGovernanceDashboard />;

    case '/compute':
      return <ComputeMarketplace />;

    case '/monitoring':
      return <SystemMonitor />;

    case '/performance':
      return <AdvancedPerformanceDashboard />;

    default:
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              Page Not Found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              The requested page could not be found.
            </Typography>
          </Box>
      );
    }
  };

  if (!isMobile) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Mobile Interface
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          This mobile interface is optimized for mobile devices. Please use a
          mobile device or resize your browser window to view the mobile
          experience.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: theme.palette.background.default,
        pb: 8, // Account for bottom navigation
      }}
    >
      {/* Offline Status Bar */}
      {!isOnline && (
        <Alert severity="warning" sx={{ borderRadius: 0 }}>
          You're offline. Data may not be up to date.
        </Alert>
      )}

      {/* PWA Install Banner */}
      {canInstall && !isInstalled && (
        <Alert
          severity="info"
          action={
            <Typography
              variant="button"
              component="span"
              sx={{ cursor: 'pointer', textDecoration: 'underline' }}
              onClick={install}
            >
              Install
            </Typography>
          }
          sx={{ borderRadius: 0 }}
        >
          Install WRFCoin for a better experience
        </Alert>
      )}

      {/* Main Content */}
      <Fade in={true} timeout={300}>
        <Box>{renderCurrentPage()}</Box>
      </Fade>

      {/* Quick Actions Modal */}
      <MobileQuickActions
        onActionSelect={(action: string) => {
          handleQuickAction(action);
          setQuickActionsOpen(false);
        }}
        currentContext={currentPath.replace('/', '') as 'dashboard' | 'earnings' | 'sensors' | 'wallet' | 'settings' | undefined}
      />

      {/* Mobile Navigation */}
      <MobileNavigation
        currentPath={currentPath}
        onNavigate={handleNavigation}
        onQuickAction={handleQuickActions}
        userProfile={userProfile}
        notifications={notifications.length}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ mt: 2 }}
      />
    </Box>
  );
};

const MobileApp: React.FC<React.ComponentProps<typeof MobileAppSample>> = (props) => (
  <DemoSurfaceGate
    testId="mobile-app"
    title="Mobile application preview is not live on this testnet"
    description="This preview contains illustrative data or simulated actions, not verified testnet results."
  >
    <MobileAppSample {...props} />
  </DemoSurfaceGate>
);

export default MobileApp;
