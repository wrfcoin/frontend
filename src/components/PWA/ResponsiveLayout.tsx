import React, { useState, useEffect } from 'react';
import { Box, useMediaQuery } from '@mui/material';
import MobileNavigation from './MobileNavigation';
import OfflineIndicator from './OfflineIndicator';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Orientation = 'portrait' | 'landscape';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  notificationCount?: number;
  onMenuOpen?: () => void;
  onTabChange?: (tab: string) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLORS = {
  bg: '#0F172A',
  card: '#1E293B',
  border: '#334155',
  primary: '#3B82F6',
  text: '#FFFFFF',
  muted: '#94A3B8',
} as const;

const SIDEBAR_WIDTH = 260;
const MOBILE_BOTTOM_NAV_HEIGHT = 64;

// ---------------------------------------------------------------------------
// Orientation hook
// ---------------------------------------------------------------------------

const useOrientation = (): Orientation => {
  const [orientation, setOrientation] = useState<Orientation>(() => {
    if (typeof window === 'undefined') return 'portrait';
    return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  });

  useEffect(() => {
    const handleChange = () => {
      if (screen.orientation) {
        const type = screen.orientation.type;
        setOrientation(type.startsWith('landscape') ? 'landscape' : 'portrait');
      } else {
        setOrientation(
          window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
        );
      }
    };

    if (screen.orientation) {
      screen.orientation.addEventListener('change', handleChange);
    }
    window.addEventListener('resize', handleChange);

    return () => {
      if (screen.orientation) {
        screen.orientation.removeEventListener('change', handleChange);
      }
      window.removeEventListener('resize', handleChange);
    };
  }, []);

  return orientation;
};

// ---------------------------------------------------------------------------
// ResponsiveLayout
// ---------------------------------------------------------------------------

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  sidebar = null,
  notificationCount = 0,
  onMenuOpen,
  onTabChange,
}) => {
  const isMobile = useMediaQuery('(max-width:768px)');
  const orientation = useOrientation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleMenuOpen = () => {
    setMenuOpen(true);
    onMenuOpen?.();
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: COLORS.bg,
        color: COLORS.text,
        display: 'flex',
        flexDirection: 'column',
        // Safe area insets for notched devices
        pl: 'env(safe-area-inset-left, 0px)',
        pr: 'env(safe-area-inset-right, 0px)',
      }}
    >
      {/* Offline indicator - all viewports */}
      <OfflineIndicator />

      <Box
        sx={{
          display: 'flex',
          flex: 1,
          // In landscape mobile, use horizontal layout
          flexDirection:
            isMobile && orientation === 'landscape' ? 'row' : 'row',
        }}
      >
        {/* Desktop sidebar */}
        {!isMobile && sidebar && (
          <Box
            component="aside"
            sx={{
              width: SIDEBAR_WIDTH,
              flexShrink: 0,
              borderRight: `1px solid ${COLORS.border}`,
              bgcolor: COLORS.card,
              height: '100vh',
              position: 'fixed',
              top: 0,
              left: 0,
              overflowY: 'auto',
              zIndex: 1200,
            }}
          >
            {sidebar}
          </Box>
        )}

        {/* Main content */}
        <Box
          component="main"
          sx={{
            flex: 1,
            minWidth: 0,
            // Desktop: offset for sidebar
            pl: !isMobile && sidebar ? `${SIDEBAR_WIDTH}px` : 0,
            // Mobile: bottom padding for navigation bar + safe area
            pb: isMobile
              ? `calc(${MOBILE_BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px))`
              : 0,
            // Top padding for safe area (notch)
            pt: isMobile ? 'env(safe-area-inset-top, 0px)' : 0,
            transition: 'padding-left 0.3s ease',
          }}
        >
          {children}
        </Box>
      </Box>

      {/* Mobile bottom navigation */}
      {isMobile && (
        <MobileNavigation
          notificationCount={notificationCount}
          onTabChange={onTabChange}
        />
      )}
    </Box>
  );
};

export default ResponsiveLayout;
