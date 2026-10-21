import DemoSurfaceGate, { SAMPLE_BADGE_SX } from '../common/DemoSurfaceGate';
import FEATURES from '../../config/features';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box,
  IconButton,
  Badge,
  Paper,
  Typography,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  Tooltip,
  Fade,
} from '@mui/material';
import {
  Notifications,
  NotificationsActive,
  Warning,
  AttachMoney,
  HowToVote,
  Settings,
  SwapHoriz,
  Cloud,
  DoneAll,
  Circle,
  OpenInNew,
  Close,
  FilterList,
} from '@mui/icons-material';

// ---------------------------------------------------------------------------
// Dark theme constants
// ---------------------------------------------------------------------------
const DARK = {
  bg: '#0F172A',
  card: '#1E293B',
  cardHover: '#263548',
  border: '#334155',
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
};

// ---------------------------------------------------------------------------
// Category configuration
// ---------------------------------------------------------------------------
const CATEGORIES = {
  all: { label: 'All', icon: FilterList, color: DARK.primary },
  quality_alert: { label: 'Quality', icon: Warning, color: DARK.warning },
  earnings: { label: 'Earnings', icon: AttachMoney, color: DARK.success },
  governance: { label: 'Governance', icon: HowToVote, color: '#8B5CF6' },
  system: { label: 'System', icon: Settings, color: DARK.textSecondary },
  bridge: { label: 'Bridge', icon: SwapHoriz, color: '#F472B6' },
  weather: { label: 'Weather', icon: Cloud, color: '#38BDF8' },
};

// ---------------------------------------------------------------------------
// Mock notifications
// ---------------------------------------------------------------------------
const INITIAL_NOTIFICATIONS = [
  {
    id: 'n1',
    category: 'quality_alert',
    title: 'Data Quality Warning',
    message: 'Station WX-4821 reported temperature readings outside expected range. Quality score dropped to 72/100.',
    timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: 'n2',
    category: 'earnings',
    title: 'Weekly Earnings Distributed',
    message: 'You earned 142.5 WRF tokens this week from 3 weather stations. Payout confirmed on-chain.',
    timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: 'n3',
    category: 'governance',
    title: 'New Proposal: WIP-47',
    message: 'Proposal to increase minimum data quality threshold from 70 to 75 is now open for voting. Ends in 5 days.',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: 'n4',
    category: 'bridge',
    title: 'Bridge Transfer Complete',
    message: '500 WRF tokens bridged from Ethereum to Polygon successfully. Transaction hash: 0xa3f2...c891.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: 'n5',
    category: 'weather',
    title: 'Severe Weather Alert',
    message: 'Thunderstorm advisory issued for stations in the Upper Midwest region. Data collection may be affected.',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
  {
    id: 'n6',
    category: 'system',
    title: 'Scheduled Maintenance',
    message: 'Platform maintenance window scheduled for Feb 15 02:00-04:00 UTC. Services may be briefly unavailable.',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
  {
    id: 'n7',
    category: 'earnings',
    title: 'Quality Bonus Earned',
    message: 'Congratulations! Station WX-1190 achieved a 95+ quality score for 30 consecutive days. Bonus: 25 WRF.',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
  {
    id: 'n8',
    category: 'quality_alert',
    title: 'Sensor Calibration Needed',
    message: 'Humidity sensor on station WX-3304 shows drift exceeding 5%. Recalibration recommended.',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: 'n9',
    category: 'governance',
    title: 'Vote Reminder: WIP-45',
    message: 'Voting on the carbon credit pool expansion closes in 12 hours. Your vote has not been cast yet.',
    timestamp: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: 'n10',
    category: 'weather',
    title: 'New Station Online',
    message: 'Weather station WX-5100 in Duluth, MN is now online and submitting data to the network.',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
];

// ---------------------------------------------------------------------------
// Helper: format relative time
// ---------------------------------------------------------------------------
function formatRelativeTime(isoString) {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

// ---------------------------------------------------------------------------
// Pulse keyframes (injected once)
// ---------------------------------------------------------------------------
const pulseKeyframes = `
@keyframes notif-pulse {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.15); }
  100% { transform: scale(1); }
}
`;

// ---------------------------------------------------------------------------
// NotificationCenter component
// ---------------------------------------------------------------------------
const NotificationCenter = ({ sampleBadge = false }) => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState('all');
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  // Inject keyframes
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = pulseKeyframes;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        open &&
        panelRef.current &&
        !panelRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'all') return notifications;
    return notifications.filter((n) => n.category === activeFilter);
  }, [notifications, activeFilter]);

  const handleMarkAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const handleToggleRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)),
    );
  }, []);

  const handleDismiss = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const getCategoryConfig = (category) =>
    CATEGORIES[category] || CATEGORIES.system;

  return (
    <Box
      data-testid={sampleBadge ? 'notification-center-shell' : undefined}
      sx={{ position: 'fixed', top: 0, left: 0, zIndex: 1100, height: 36, display: 'flex', alignItems: 'center', px: '4px' }}
    >
      {/* Bell button */}
      <Tooltip title="Notifications">
        <IconButton
          ref={buttonRef}
          onClick={() => setOpen((prev) => !prev)}
          sx={{
            color: DARK.textPrimary,
            '&:hover': { backgroundColor: 'rgba(59,130,246,0.12)' },
          }}
        >
          <Badge
            badgeContent={unreadCount}
            max={99}
            sx={{
              '& .MuiBadge-badge': {
                backgroundColor: DARK.error,
                color: '#fff',
                fontSize: '0.7rem',
                fontWeight: 700,
                minWidth: 18,
                height: 18,
                ...(unreadCount > 0
                  ? { animation: 'notif-pulse 2s ease-in-out infinite' }
                  : {}),
              },
            }}
          >
            {unreadCount > 0 ? (
              <NotificationsActive fontSize="medium" />
            ) : (
              <Notifications fontSize="medium" />
            )}
          </Badge>
        </IconButton>
      </Tooltip>
      {sampleBadge ? (
        <Chip
          label="Sample data"
          size="small"
          data-testid="notification-center-sample-badge"
          title="Illustrative notifications, shown because demo surfaces are on."
          sx={SAMPLE_BADGE_SX}
        />
      ) : null}

      {/* Dropdown panel */}
      <Fade in={open} timeout={200}>
        <Paper
          ref={panelRef}
          elevation={12}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            mt: 1,
            width: { xs: '92vw', sm: 420 },
            maxHeight: 560,
            display: open ? 'flex' : 'none',
            flexDirection: 'column',
            backgroundColor: DARK.card,
            border: `1px solid ${DARK.border}`,
            borderRadius: '12px',
            overflow: 'hidden',
            zIndex: 1300,
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              py: 1.5,
              borderBottom: `1px solid ${DARK.border}`,
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, color: DARK.textPrimary }}
            >
              Notifications
              {unreadCount > 0 && (
                <Chip
                  label={`${unreadCount} new`}
                  size="small"
                  sx={{
                    ml: 1,
                    height: 20,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    backgroundColor: 'rgba(59,130,246,0.15)',
                    color: DARK.primary,
                  }}
                />
              )}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {unreadCount > 0 && (
                <Tooltip title="Mark all as read">
                  <IconButton
                    size="small"
                    onClick={handleMarkAllRead}
                    sx={{ color: DARK.textSecondary }}
                  >
                    <DoneAll fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <IconButton
                size="small"
                onClick={() => setOpen(false)}
                sx={{ color: DARK.textSecondary }}
              >
                <Close fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Category filter tabs */}
          <Box sx={{ borderBottom: `1px solid ${DARK.border}` }}>
            <Tabs
              value={activeFilter}
              onChange={(_, val) => setActiveFilter(val)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                minHeight: 36,
                '& .MuiTabs-indicator': {
                  backgroundColor: DARK.primary,
                  height: 2,
                },
                '& .MuiTab-root': {
                  minHeight: 36,
                  minWidth: 'auto',
                  px: 1.5,
                  py: 0.5,
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  color: DARK.textMuted,
                  '&.Mui-selected': { color: DARK.primary },
                },
              }}
            >
              {Object.entries(CATEGORIES).map(([key, cfg]) => (
                <Tab key={key} value={key} label={cfg.label} />
              ))}
            </Tabs>
          </Box>

          {/* Notification list */}
          <List
            sx={{
              flex: 1,
              overflowY: 'auto',
              py: 0,
              '&::-webkit-scrollbar': { width: 6 },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: DARK.border,
                borderRadius: 3,
              },
            }}
          >
            {filteredNotifications.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Notifications
                  sx={{ fontSize: 40, color: DARK.textMuted, mb: 1 }}
                />
                <Typography variant="body2" sx={{ color: DARK.textMuted }}>
                  No notifications in this category
                </Typography>
              </Box>
            ) : (
              filteredNotifications.map((notif) => {
                const cfg = getCategoryConfig(notif.category);
                const CategoryIcon = cfg.icon;
                return (
                  <React.Fragment key={notif.id}>
                    <ListItem
                      alignItems="flex-start"
                      onClick={() => handleToggleRead(notif.id)}
                      sx={{
                        px: 2,
                        py: 1.5,
                        cursor: 'pointer',
                        backgroundColor: notif.read
                          ? 'transparent'
                          : 'rgba(59,130,246,0.06)',
                        '&:hover': { backgroundColor: DARK.cardHover },
                        transition: 'background-color 0.15s',
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: `${cfg.color}18`,
                          }}
                        >
                          <CategoryIcon
                            sx={{ fontSize: 18, color: cfg.color }}
                          />
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        disableTypography
                        primary={
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.75,
                              mb: 0.25,
                            }}
                          >
                            {!notif.read && (
                              <Circle
                                sx={{
                                  fontSize: 8,
                                  color: DARK.primary,
                                  flexShrink: 0,
                                }}
                              />
                            )}
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: notif.read ? 500 : 700,
                                color: DARK.textPrimary,
                                lineHeight: 1.3,
                              }}
                            >
                              {notif.title}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography
                              variant="caption"
                              component="p"
                              sx={{
                                color: DARK.textSecondary,
                                lineHeight: 1.4,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                mb: 0.5,
                              }}
                            >
                              {notif.message}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: DARK.textMuted, fontSize: '0.68rem' }}
                            >
                              {formatRelativeTime(notif.timestamp)}
                            </Typography>
                          </>
                        }
                      />
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDismiss(notif.id);
                        }}
                        sx={{
                          color: DARK.textMuted,
                          mt: 0.5,
                          opacity: 0.5,
                          '&:hover': { opacity: 1, color: DARK.error },
                        }}
                      >
                        <Close sx={{ fontSize: 14 }} />
                      </IconButton>
                    </ListItem>
                    <Divider
                      sx={{ borderColor: DARK.border, opacity: 0.4 }}
                    />
                  </React.Fragment>
                );
              })
            )}
          </List>

          {/* Footer */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              py: 1,
              borderTop: `1px solid ${DARK.border}`,
            }}
          >
            <Button
              size="small"
              onClick={handleMarkAllRead}
              startIcon={<DoneAll sx={{ fontSize: 16 }} />}
              sx={{
                textTransform: 'none',
                fontSize: '0.75rem',
                color: DARK.textSecondary,
                '&:hover': { color: DARK.primary },
              }}
            >
              Mark all as read
            </Button>
            <Button
              size="small"
              endIcon={<OpenInNew sx={{ fontSize: 14 }} />}
              sx={{
                textTransform: 'none',
                fontSize: '0.75rem',
                color: DARK.primary,
                '&:hover': { backgroundColor: 'rgba(59,130,246,0.08)' },
              }}
            >
              View all
            </Button>
          </Box>
        </Paper>
      </Fade>
    </Box>
  );
};

// `shell`: the App-shell (chrome) mount, frontend#427 review P2-1. The in-flow
// DemoSurfaceGate card/strip would push every page down, so the shell variant
// renders nothing unless demo surfaces are on, then only the fixed bell with a
// compact "Sample data" chip. Direct/routed use keeps the standard gate.
export default function NotificationCenterGate({ shell = false, ...props }) {
  if (shell) return FEATURES.demoSurfaces ? <NotificationCenter {...props} sampleBadge /> : null;
  return <DemoSurfaceGate testId="notification-center" title="Notifications are not live" description="No live notification feed is connected; these messages are illustrative."><NotificationCenter {...props} /></DemoSurfaceGate>;
}
