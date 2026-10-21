import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Badge,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard,
  Sensors,
  EmojiEvents,
  Person,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router';
import type { SvgIconComponent } from '@mui/icons-material';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TabConfig {
  key: string;
  label: string;
  icon: SvgIconComponent;
  path: string;
}

interface MobileNavigationProps {
  notificationCount?: number;
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
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  text: '#FFFFFF',
  muted: '#94A3B8',
} as const;

const TABS: TabConfig[] = [
  { key: 'dashboard', label: 'Dashboard', icon: Dashboard, path: '/' },
  { key: 'stations', label: 'Stations', icon: Sensors, path: '/stations' },
  { key: 'rewards', label: 'Rewards', icon: EmojiEvents, path: '/earnings' },
  { key: 'profile', label: 'Profile', icon: Person, path: '/profile' },
];

// ---------------------------------------------------------------------------
// MobileNavigation
// ---------------------------------------------------------------------------

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  notificationCount = 0,
  onTabChange,
}) => {
  const isMobile = useMediaQuery('(max-width:768px)');
  const navigate = useNavigate();
  const location = useLocation();

  // Hide on scroll down, show on scroll up
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      window.requestAnimationFrame(() => {
        const currentY = window.scrollY;
        if (currentY > lastScrollY.current && currentY > 80) {
          setVisible(false);
        } else {
          setVisible(true);
        }
        lastScrollY.current = currentY;
        ticking.current = false;
      });
      ticking.current = true;
    }
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile, handleScroll]);

  // Determine active tab from pathname
  const activeTab = (() => {
    const p = location.pathname;
    if (p === '/') return 'dashboard';
    if (p.startsWith('/stations')) return 'stations';
    if (p.startsWith('/earnings') || p.startsWith('/rewards')) return 'rewards';
    if (p.startsWith('/profile')) return 'profile';
    return '';
  })();

  // Active tab index for indicator positioning
  const activeIndex = TABS.findIndex((t) => t.key === activeTab);

  const handleTabPress = (tab: TabConfig) => {
    navigate(tab.path);
    onTabChange?.(tab.key);
  };

  if (!isMobile) return null;

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1300,
        bgcolor: COLORS.card,
        borderTop: `1px solid ${COLORS.border}`,
        borderRadius: 0,
        pb: 'env(safe-area-inset-bottom, 0px)',
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        willChange: 'transform',
      }}
    >
      {/* Animated active tab indicator */}
      {activeIndex >= 0 && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: `${(activeIndex / TABS.length) * 100}%`,
            width: `${100 / TABS.length}%`,
            height: 3,
            bgcolor: COLORS.primary,
            borderRadius: '0 0 2px 2px',
            transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      )}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          py: 0.5,
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;

          const showBadge = tab.key === 'rewards' && notificationCount > 0;

          const iconElement = showBadge ? (
            <Badge
              badgeContent={notificationCount}
              color="error"
              max={99}
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: 10,
                  height: 16,
                  minWidth: 16,
                  bgcolor: COLORS.error,
                },
              }}
            >
              <Icon sx={{ fontSize: 22 }} />
            </Badge>
          ) : (
            <Icon sx={{ fontSize: 22 }} />
          );

          return (
            <Box
              key={tab.key}
              onClick={() => handleTabPress(tab)}
              role="button"
              tabIndex={0}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleTabPress(tab);
                }
              }}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                py: 0.75,
                cursor: 'pointer',
                minHeight: 52,
                minWidth: 44,
                color: isActive ? COLORS.primary : COLORS.muted,
                transition: 'color 0.2s ease, transform 0.15s ease',
                userSelect: 'none',
                WebkitTapHighlightColor: 'transparent',
                '&:active': {
                  transform: 'scale(0.92)',
                },
              }}
            >
              <Box
                sx={{
                  transform: isActive ? 'scale(1.1)' : 'scale(1)',
                  transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {iconElement}
              </Box>
              <Typography
                variant="caption"
                sx={{
                  fontSize: 10,
                  fontWeight: isActive ? 700 : 500,
                  mt: 0.25,
                  lineHeight: 1,
                  color: 'inherit',
                }}
              >
                {tab.label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
};

export default MobileNavigation;
