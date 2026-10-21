import React, { useState, useEffect } from 'react';
import {
  Box,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Backdrop,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Typography,
  IconButton,
  Stack,
  Chip,
  alpha,
  Slide,
  Zoom,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Analytics as AnalyticsIcon,
  AccountBalanceWallet as WalletIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  QrCode as QrCodeIcon,
  TrendingUp as TrendingUpIcon,
  Help as HelpIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Sensors as SensorsIcon,
  AttachMoney as MoneyIcon,
  Security as SecurityIcon,
  Cloud as CloudIcon,
  Psychology as AIIcon,
  Storage as StorageIcon,
  SwapHoriz as BridgeIcon,
  Assessment as ReportsIcon,
} from '@mui/icons-material';
import FEATURES from '../../config/features';

interface QuickAction {
  key: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  badge?: number;
  disabled?: boolean;
  category: 'primary' | 'secondary' | 'utility';
  description?: string;
}

interface MobileQuickActionsProps {
  onActionSelect: (action: string, data?: any) => void;
  currentContext?: 'dashboard' | 'earnings' | 'sensors' | 'wallet' | 'settings';
  notifications?: {
    pending: number;
    alerts: number;
  };
  compact?: boolean;
}

const MobileQuickActions: React.FC<MobileQuickActionsProps> = ({
  onActionSelect,
  currentContext = 'dashboard',
  notifications = { pending: 0, alerts: 0 },
  compact = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [recentActions, setRecentActions] = useState<string[]>([]);

  // Load recent actions from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('mobile-recent-actions');
    if (stored) {
      try {
        setRecentActions(JSON.parse(stored));
      } catch (e) {
        console.warn('Failed to parse recent actions');
      }
    }
  }, []);

  // Define all available actions
  const availableActions: QuickAction[] = [
    // Primary actions
    {
      key: 'refresh',
      label: 'Refresh Data',
      icon: <RefreshIcon />,
      color: theme.palette.primary.main,
      category: 'primary',
      description: 'Update all data and metrics',
    },
    {
      key: 'wallet',
      label: 'Wallet',
      icon: <WalletIcon />,
      color: theme.palette.success.main,
      category: 'primary',
      description: 'Manage your WRF tokens',
    },
    {
      key: 'analytics',
      label: 'Analytics',
      icon: <AnalyticsIcon />,
      color: theme.palette.info.main,
      category: 'primary',
      description: 'View detailed analytics',
    },
    {
      key: 'earnings',
      label: 'Earnings',
      icon: <MoneyIcon />,
      color: theme.palette.warning.main,
      category: 'primary',
      description: 'Check earnings and rewards',
    },

    // Secondary actions
    {
      key: 'sensors',
      label: 'IoT Sensors',
      icon: <SensorsIcon />,
      color: theme.palette.secondary.main,
      category: 'secondary',
      description: 'Manage sensor networks',
    },
    {
      key: 'ai-ml',
      label: 'AI/ML',
      icon: <AIIcon />,
      color: theme.palette.error.main,
      category: 'secondary',
      description: 'AI and ML services',
    },
    {
      key: 'storage',
      label: 'Storage',
      icon: <StorageIcon />,
      color: theme.palette.info.main,
      category: 'secondary',
      description: 'Distributed storage',
    },
    {
      key: 'bridge',
      label: 'Cross-Chain',
      icon: <BridgeIcon />,
      color: theme.palette.primary.main,
      category: 'secondary',
      description: 'Cross-chain bridges',
    },
    {
      key: 'security',
      label: 'Security',
      icon: <SecurityIcon />,
      color: theme.palette.error.main,
      category: 'secondary',
      description: 'Security dashboard',
    },

    // Utility actions
    {
      key: 'notifications',
      label: 'Notifications',
      icon: <NotificationsIcon />,
      color: theme.palette.warning.main,
      badge: notifications.alerts,
      category: 'utility',
      description: 'View notifications',
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: <SettingsIcon />,
      color: theme.palette.grey[600],
      category: 'utility',
      description: 'App settings',
    },
    {
      key: 'reports',
      label: 'Reports',
      icon: <ReportsIcon />,
      color: theme.palette.info.main,
      category: 'utility',
      description: 'Generate reports',
    },
    {
      key: 'share',
      label: 'Share',
      icon: <ShareIcon />,
      color: theme.palette.secondary.main,
      category: 'utility',
      description: 'Share data',
    },
    {
      key: 'help',
      label: 'Help',
      icon: <HelpIcon />,
      color: theme.palette.grey[600],
      category: 'utility',
      description: 'Get help',
    },
  ];
  const allActions = availableActions.filter(
    action => FEATURES.contractSurfaces || action.key !== 'bridge',
  );

  // Get context-aware actions
  const getContextAwareActions = (): QuickAction[] => {
    const baseActions = allActions.filter(action => {
      switch (currentContext) {
      case 'earnings':
        return [
          'refresh',
          'analytics',
          'wallet',
          'reports',
          'share',
        ].includes(action.key);
      case 'sensors':
        return [
          'refresh',
          'sensors',
          'analytics',
          'settings',
          'help',
        ].includes(action.key);
      case 'wallet':
        return [
          'refresh',
          'bridge',
          'security',
          'analytics',
          'share',
        ].includes(action.key);
      case 'settings':
        return [
          'refresh',
          'notifications',
          'help',
          'reports',
          'share',
        ].includes(action.key);
      default:
        return (
          action.category === 'primary' || recentActions.includes(action.key)
        );
      }
    });

    // Add recent actions that aren't already included
    const recentActionsFiltered = allActions.filter(
      action =>
        recentActions.includes(action.key) &&
        !baseActions.find(a => a.key === action.key),
    );

    return [...baseActions, ...recentActionsFiltered.slice(0, 3)];
  };

  const contextAwareActions = getContextAwareActions();

  const handleActionClick = (actionKey: string) => {
    // Add to recent actions
    const newRecent = [
      actionKey,
      ...recentActions.filter(a => a !== actionKey),
    ].slice(0, 5);
    setRecentActions(newRecent);
    localStorage.setItem('mobile-recent-actions', JSON.stringify(newRecent));

    // Close menus
    setSpeedDialOpen(false);
    setContextMenuOpen(false);

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }

    // Trigger action
    onActionSelect(actionKey);
  };

  // Speed dial actions
  const speedDialActions = contextAwareActions.slice(0, 6).map(action => ({
    key: action.key,
    icon: action.badge ? (
      <Badge badgeContent={action.badge} color="error">
        {action.icon}
      </Badge>
    ) : (
      action.icon
    ),
    name: action.label,
    tooltipTitle: action.description,
    onClick: () => handleActionClick(action.key),
    FabProps: {
      sx: {
        bgcolor: alpha(action.color, 0.1),
        color: action.color,
        '&:hover': {
          bgcolor: alpha(action.color, 0.2),
        },
      },
    },
  }));

  // Context menu for more actions
  const ContextMenu: React.FC = () => (
    <Slide direction="up" in={contextMenuOpen} mountOnEnter unmountOnExit>
      <Card
        sx={{
          position: 'fixed',
          bottom: 16,
          left: 16,
          right: 16,
          zIndex: 1300,
          maxHeight: '50vh',
          overflow: 'auto',
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            mb={2}
          >
            <Typography
              variant="h6"
              sx={{ fontSize: '1.1rem', fontWeight: 600 }}
            >
              Quick Actions
            </Typography>
            <IconButton size="small" onClick={() => setContextMenuOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>

          {/* Primary Actions */}
          <Typography variant="subtitle2" color="text.secondary" mb={1}>
            Primary
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 1,
              mb: 2,
            }}
          >
            {allActions
              .filter(action => action.category === 'primary')
              .map(action => (
                <Tooltip
                  key={action.key}
                  title={action.description}
                  placement="top"
                >
                  <IconButton
                    onClick={() => handleActionClick(action.key)}
                    sx={{
                      flexDirection: 'column',
                      gap: 0.5,
                      p: 1,
                      borderRadius: 2,
                      bgcolor: alpha(action.color, 0.1),
                      color: action.color,
                      '&:hover': {
                        bgcolor: alpha(action.color, 0.2),
                      },
                    }}
                  >
                    {action.badge ? (
                      <Badge badgeContent={action.badge} color="error">
                        {action.icon}
                      </Badge>
                    ) : (
                      action.icon
                    )}
                    <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                      {action.label}
                    </Typography>
                  </IconButton>
                </Tooltip>
              ))}
          </Box>

          {/* Secondary Actions */}
          <Typography variant="subtitle2" color="text.secondary" mb={1}>
            Services
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 1,
              mb: 2,
            }}
          >
            {allActions
              .filter(action => action.category === 'secondary')
              .map(action => (
                <Tooltip
                  key={action.key}
                  title={action.description}
                  placement="top"
                >
                  <IconButton
                    onClick={() => handleActionClick(action.key)}
                    sx={{
                      flexDirection: 'column',
                      gap: 0.5,
                      p: 1,
                      borderRadius: 2,
                      bgcolor: alpha(action.color, 0.1),
                      color: action.color,
                      '&:hover': {
                        bgcolor: alpha(action.color, 0.2),
                      },
                    }}
                  >
                    {action.badge ? (
                      <Badge badgeContent={action.badge} color="error">
                        {action.icon}
                      </Badge>
                    ) : (
                      action.icon
                    )}
                    <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                      {action.label}
                    </Typography>
                  </IconButton>
                </Tooltip>
              ))}
          </Box>

          {/* Utility Actions */}
          <Typography variant="subtitle2" color="text.secondary" mb={1}>
            Utilities
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 1,
            }}
          >
            {allActions
              .filter(action => action.category === 'utility')
              .map(action => (
                <Tooltip
                  key={action.key}
                  title={action.description}
                  placement="top"
                >
                  <IconButton
                    onClick={() => handleActionClick(action.key)}
                    sx={{
                      flexDirection: 'column',
                      gap: 0.5,
                      p: 1,
                      borderRadius: 2,
                      bgcolor: alpha(action.color, 0.1),
                      color: action.color,
                      '&:hover': {
                        bgcolor: alpha(action.color, 0.2),
                      },
                    }}
                  >
                    {action.badge ? (
                      <Badge badgeContent={action.badge} color="error">
                        {action.icon}
                      </Badge>
                    ) : (
                      action.icon
                    )}
                    <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                      {action.label}
                    </Typography>
                  </IconButton>
                </Tooltip>
              ))}
          </Box>

          {/* Recent actions */}
          {recentActions.length > 0 && (
            <>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                mt={2}
                mb={1}
              >
                Recent
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                {recentActions.slice(0, 5).map(actionKey => {
                  const action = allActions.find(a => a.key === actionKey);
                  if (!action) return null;

                  return (
                    <Chip
                      key={actionKey}
                      icon={action.icon as React.ReactElement}
                      label={action.label}
                      size="small"
                      onClick={() => handleActionClick(actionKey)}
                      sx={{
                        bgcolor: alpha(action.color, 0.1),
                        color: action.color,
                        '&:hover': {
                          bgcolor: alpha(action.color, 0.2),
                        },
                      }}
                    />
                  );
                })}
              </Stack>
            </>
          )}
        </CardContent>
      </Card>
    </Slide>
  );

  if (!isMobile || compact) {
    // Desktop or compact mode - show minimal floating actions
    return (
      <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
        <Stack spacing={1}>
          <Zoom in={true} style={{ transitionDelay: '200ms' }}>
            <Fab
              size="small"
              color="primary"
              onClick={() => handleActionClick('refresh')}
            >
              <RefreshIcon />
            </Fab>
          </Zoom>

          <Zoom in={true} style={{ transitionDelay: '400ms' }}>
            <Fab
              size="small"
              sx={{ bgcolor: theme.palette.success.main }}
              onClick={() => handleActionClick('wallet')}
            >
              <WalletIcon />
            </Fab>
          </Zoom>
        </Stack>
      </Box>
    );
  }

  return (
    <>
      {/* Speed Dial for quick actions */}
      <SpeedDial
        ariaLabel="Quick Actions"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          '& .MuiSpeedDial-fab': {
            bgcolor: theme.palette.primary.main,
            '&:hover': {
              bgcolor: theme.palette.primary.dark,
            },
          },
        }}
        icon={<SpeedDialIcon icon={<MenuIcon />} openIcon={<CloseIcon />} />}
        onClose={() => setSpeedDialOpen(false)}
        onOpen={() => setSpeedDialOpen(true)}
        open={speedDialOpen}
        direction="up"
      >
        {speedDialActions.map(action => (
          <SpeedDialAction
            key={action.key}
            icon={action.icon}
            tooltipTitle={action.tooltipTitle}
            onClick={action.onClick}
            FabProps={action.FabProps}
          />
        ))}

        {/* More actions button */}
        <SpeedDialAction
          icon={<AddIcon />}
          tooltipTitle="More Actions"
          onClick={() => {
            setSpeedDialOpen(false);
            setContextMenuOpen(true);
          }}
          FabProps={{
            sx: {
              bgcolor: alpha(theme.palette.grey[600], 0.1),
              color: theme.palette.grey[600],
              '&:hover': {
                bgcolor: alpha(theme.palette.grey[600], 0.2),
              },
            },
          }}
        />
      </SpeedDial>

      {/* Context menu overlay */}
      <ContextMenu />

      {/* Backdrop for context menu */}
      <Backdrop
        open={contextMenuOpen}
        onClick={() => setContextMenuOpen(false)}
        sx={{ zIndex: 1200 }}
      />
    </>
  );
};

export default MobileQuickActions;
