import React, { useState, useEffect } from 'react';
import { useMemo } from 'react';
import {
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme,
  useMediaQuery,
  Divider,
  Avatar,
  Stack,
  IconButton,
  Badge,
  SwipeableDrawer,
  alpha,
  ButtonBase,
} from '@mui/material';
import {
  Sensors as SensorsIcon,
  AccountBalance as EarningsIcon,
  AccountBalance,
  Psychology as AIIcon,
  Storage as StorageIcon,
  Security as SecurityIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Person as ProfileIcon,
  Nature as CarbonIcon,
  Hub as IntegrationsIcon,
  Analytics as AnalyticsIcon,
  Bolt as QuickActionsIcon,
  Home as HomeIcon,
  TrendingUp as TrendingUpIcon,
  CloudQueue as CloudIcon,
  Timeline as TimelineIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import {
  filterPublicSurfaces,
  isFullStudioEnabled,
  isOperatorPreviewEnabled,
} from '../../config/contractSurfacePolicy';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
  category: 'main' | 'secondary' | 'tools';
}

type BottomNavigationItem = NavigationItem & {
  badge?: number;
};

interface MobileNavigationProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onQuickAction?: () => void;
  userProfile?: {
    name: string;
    avatar?: string;
    role: string;
  };
  notifications?: number;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentPath,
  onNavigate,
  onQuickAction,
  userProfile,
  notifications = 0,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const showFullStudioFeatures = isFullStudioEnabled(
    import.meta.env?.VITE_ENABLE_FULL_STUDIO,
  );
  const showOperatorPreview = isOperatorPreviewEnabled(
    import.meta.env?.VITE_ENABLE_OPERATOR_PREVIEW,
  );

  // All navigation items for drawer
  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <HomeIcon />,
      path: '/dashboard',
      category: 'main',
    },
    {
      id: 'sensors',
      label: 'IoT Sensors',
      icon: <SensorsIcon />,
      path: '/sensors',
      category: 'main',
    },
    {
      id: 'earnings',
      label: 'Weather Earnings',
      icon: <EarningsIcon />,
      path: '/earnings',
      category: 'main',
    },
    {
      id: 'carbon',
      label: 'Carbon Credits',
      icon: <CarbonIcon />,
      path: '/carbon',
      category: 'main',
    },
    {
      id: 'ai',
      label: 'AI/ML Models',
      icon: <AIIcon />,
      path: '/ai',
      category: 'main',
    },
    {
      id: 'storage',
      label: 'Distributed Storage',
      icon: <StorageIcon />,
      path: '/storage',
      category: 'main',
    },
    {
      id: 'security',
      label: 'HSM Security',
      icon: <SecurityIcon />,
      path: '/security',
      category: 'main',
    },
    {
      id: 'integrations',
      label: 'Integrations Hub',
      icon: <IntegrationsIcon />,
      path: '/integrations',
      category: 'main',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <AnalyticsIcon />,
      path: '/analytics',
      category: 'secondary',
    },
    {
      id: 'trading',
      label: 'Trading',
      icon: <TrendingUpIcon />,
      path: '/trading',
      category: 'secondary',
    },
    {
      id: 'governance',
      label: 'Governance',
      icon: <AccountBalance />,
      path: '/governance',
      category: 'secondary',
    },
    {
      id: 'compute',
      label: 'Compute Networks',
      icon: <CloudIcon />,
      path: '/compute',
      category: 'secondary',
    },
    {
      id: 'monitoring',
      label: 'Monitoring',
      icon: <TimelineIcon />,
      path: '/monitoring',
      category: 'tools',
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: <SpeedIcon />,
      path: '/performance',
      category: 'tools',
    },
  ];
  const allNavItems = filterPublicSurfaces(
    navigationItems,
    showFullStudioFeatures,
    showOperatorPreview,
  ) as BottomNavigationItem[];

  const groupedNavItems = useMemo(
    () => ({
      main: allNavItems.filter(
        item => item.category === 'main',
      ) as BottomNavigationItem[],
      secondary: allNavItems.filter(
        item => item.category === 'secondary',
      ) as BottomNavigationItem[],
      tools: allNavItems.filter(
        item => item.category === 'tools',
      ) as BottomNavigationItem[],
    }),
    [allNavItems],
  );

  const bottomNavItems = useMemo<BottomNavigationItem[]>(() =>
    groupedNavItems.main.length
      ? groupedNavItems.main
      : [
          {
            id: 'more',
            label: 'More',
            icon: <MenuIcon />,
            path: '/more',
            category: 'main',
          } as BottomNavigationItem,
      ],
  [groupedNavItems],
  );

  useEffect(() => {
    // Update selected tab based on current path
    const currentIndex = bottomNavItems.findIndex(
      item => item.path === currentPath,
    );
    if (currentIndex !== -1) {
      setSelectedTab(currentIndex);
    } else {
      setSelectedTab(Math.max(0, bottomNavItems.length - 1));
    }
  }, [bottomNavItems, currentPath]);

  const handleNavigationChange = (
    _event: React.SyntheticEvent,
    newValue: number,
  ) => {
    setSelectedTab(newValue);
    const selectedItem = bottomNavItems[newValue];

    if (selectedItem.id === 'more') {
      setDrawerOpen(true);
    } else {
      onNavigate(selectedItem.path);
    }

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(5);
    }
  };

  const handleDrawerItemClick = (item: NavigationItem) => {
    onNavigate(item.path);
    setDrawerOpen(false);

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  // Navigation Drawer
  const NavigationDrawer: React.FC = () => (
    <SwipeableDrawer
      anchor="right"
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      onOpen={() => setDrawerOpen(true)}
      sx={{
        '& .MuiDrawer-paper': {
          width: 280,
          maxWidth: '85vw',
        },
      }}
    >
      <Box sx={{ overflow: 'auto', height: '100%' }}>
        {/* Header */}
        <Box sx={{ p: 2, bgcolor: theme.palette.primary.main, color: 'white' }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar
                src={userProfile?.avatar}
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: alpha(theme.palette.common.white, 0.2),
                }}
              >
                {userProfile?.name?.charAt(0) || 'U'}
              </Avatar>
              <Stack>
                <Typography variant="subtitle1" fontWeight={600}>
                  {userProfile?.name || 'User'}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {userProfile?.role || 'Weather Station Operator'}
                </Typography>
              </Stack>
            </Stack>

            <IconButton
              onClick={() => setDrawerOpen(false)}
              sx={{ color: 'white' }}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        </Box>

        {/* Quick Actions */}
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Stack direction="row" spacing={1}>
            <ButtonBase
              onClick={onQuickAction}
              sx={{
                flex: 1,
                p: 1.5,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.2),
                },
              }}
            >
              <Stack alignItems="center" spacing={0.5}>
                <QuickActionsIcon />
                <Typography variant="caption" fontWeight={600}>
                  Quick Actions
                </Typography>
              </Stack>
            </ButtonBase>

            <ButtonBase
              sx={{
                flex: 1,
                p: 1.5,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.info.main, 0.1),
                color: theme.palette.info.main,
                '&:hover': {
                  bgcolor: alpha(theme.palette.info.main, 0.2),
                },
              }}
            >
              <Stack alignItems="center" spacing={0.5}>
                <Badge badgeContent={notifications} color="error">
                  <NotificationsIcon />
                </Badge>
                <Typography variant="caption" fontWeight={600}>
                  Notifications
                </Typography>
              </Stack>
            </ButtonBase>

            <ButtonBase
              sx={{
                flex: 1,
                p: 1.5,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.grey[600], 0.1),
                color: theme.palette.grey[600],
                '&:hover': {
                  bgcolor: alpha(theme.palette.grey[600], 0.2),
                },
              }}
            >
              <Stack alignItems="center" spacing={0.5}>
                <SettingsIcon />
                <Typography variant="caption" fontWeight={600}>
                  Settings
                </Typography>
              </Stack>
            </ButtonBase>
          </Stack>
        </Box>

        {/* Main Navigation */}
        <Box sx={{ p: 1 }}>
          <Typography
            variant="subtitle2"
            sx={{ px: 2, py: 1, color: 'text.secondary', fontSize: '0.75rem' }}
          >
            MAIN FEATURES
          </Typography>
          <List dense>
            {groupedNavItems.main.map(item => (
              <ListItem
                key={item.id}
                component={ButtonBase}
                onClick={() => handleDrawerItemClick(item)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  mx: 0.5,
                  bgcolor:
                    currentPath === item.path
                      ? alpha(theme.palette.primary.main, 0.1)
                      : 'transparent',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color:
                      currentPath === item.path
                        ? theme.palette.primary.main
                        : 'inherit',
                  }}
                >
                  {item.badge ? (
                    <Badge badgeContent={item.badge} color="error">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: currentPath === item.path ? 600 : 400,
                    color:
                      currentPath === item.path
                        ? theme.palette.primary.main
                        : 'inherit',
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        <Divider />

        {/* Secondary Features */}
        <Box sx={{ p: 1 }}>
          <Typography
            variant="subtitle2"
            sx={{ px: 2, py: 1, color: 'text.secondary', fontSize: '0.75rem' }}
          >
            ADVANCED FEATURES
          </Typography>
          <List dense>
            {groupedNavItems.secondary.map(item => (
              <ListItem
                key={item.id}
                component={ButtonBase}
                onClick={() => handleDrawerItemClick(item)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  mx: 0.5,
                  bgcolor:
                    currentPath === item.path
                      ? alpha(theme.palette.primary.main, 0.1)
                      : 'transparent',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color:
                      currentPath === item.path
                        ? theme.palette.primary.main
                        : 'inherit',
                  }}
                >
                  {item.badge ? (
                    <Badge badgeContent={item.badge} color="error">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: currentPath === item.path ? 600 : 400,
                    color:
                      currentPath === item.path
                        ? theme.palette.primary.main
                        : 'inherit',
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        <Divider />

        {/* Tools */}
        <Box sx={{ p: 1, pb: 3 }}>
          <Typography
            variant="subtitle2"
            sx={{ px: 2, py: 1, color: 'text.secondary', fontSize: '0.75rem' }}
          >
            TOOLS & MONITORING
          </Typography>
          <List dense>
            {groupedNavItems.tools.map(item => (
              <ListItem
                key={item.id}
                component={ButtonBase}
                onClick={() => handleDrawerItemClick(item)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  mx: 0.5,
                  bgcolor:
                    currentPath === item.path
                      ? alpha(theme.palette.primary.main, 0.1)
                      : 'transparent',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color:
                      currentPath === item.path
                        ? theme.palette.primary.main
                        : 'inherit',
                  }}
                >
                  {item.badge ? (
                    <Badge badgeContent={item.badge} color="error">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: currentPath === item.path ? 600 : 400,
                    color:
                      currentPath === item.path
                        ? theme.palette.primary.main
                        : 'inherit',
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Box>
    </SwipeableDrawer>
  );

  if (!isMobile) {
    return null; // Don't render mobile navigation on desktop
  }

  return (
    <>
      {/* Bottom Navigation */}
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
        elevation={8}
      >
        <BottomNavigation
          value={selectedTab}
          onChange={handleNavigationChange}
          sx={{
            height: 64,
            '& .MuiBottomNavigationAction-root': {
              minWidth: 0,
              maxWidth: 'none',
              flex: 1,
              fontSize: '0.75rem',
              '&.Mui-selected': {
                color: theme.palette.primary.main,
              },
            },
          }}
        >
      {bottomNavItems.map((item, index) => (
            <BottomNavigationAction
              key={item.id}
              label={item.label}
              icon={
                item.badge ? (
                  <Badge badgeContent={item.badge} color="error">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )
              }
            />
          ))}
        </BottomNavigation>
      </Paper>

      <NavigationDrawer />

      {/* Spacer to prevent content from being hidden behind navigation */}
      <Box sx={{ height: 64 }} />
    </>
  );
};

export default MobileNavigation;
