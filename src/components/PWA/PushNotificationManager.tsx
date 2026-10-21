import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  Button,
  Divider,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  Notifications,
  NotificationsOff,
  NotificationsActive,
  SensorsOff,
  DataUsage,
  LocalFireDepartment,
  EmojiEvents,
  Thunderstorm,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import type { SvgIconComponent } from '@mui/icons-material';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PermissionState = 'default' | 'granted' | 'denied';

interface NotificationPreference {
  key: string;
  label: string;
  description: string;
  icon: SvgIconComponent;
  enabled: boolean;
}

interface PushNotificationManagerProps {
  vapidPublicKey?: string;
  onSubscriptionChange?: (subscription: PushSubscription | null) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLORS = {
  bg: '#0F172A',
  card: '#1E293B',
  cardAlt: '#253347',
  border: '#334155',
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  text: '#FFFFFF',
  muted: '#94A3B8',
} as const;

const PREFERENCES_KEY = 'wrfcoin_notification_prefs';

const DEFAULT_PREFERENCES: NotificationPreference[] = [
  {
    key: 'station_offline',
    label: 'Station offline alerts',
    description: 'Get notified when a station goes offline',
    icon: SensorsOff,
    enabled: true,
  },
  {
    key: 'data_quality',
    label: 'Data quality warnings',
    description: 'Alerts when data quality drops below threshold',
    icon: DataUsage,
    enabled: true,
  },
  {
    key: 'streak_milestone',
    label: 'Streak milestone alerts',
    description: 'Celebrate consecutive days of submissions',
    icon: LocalFireDepartment,
    enabled: true,
  },
  {
    key: 'achievement_unlock',
    label: 'Achievement unlocks',
    description: 'Notifications when you earn new achievements',
    icon: EmojiEvents,
    enabled: true,
  },
  {
    key: 'weather_severe',
    label: 'Severe weather alerts',
    description: 'Critical weather warnings for your area',
    icon: Thunderstorm,
    enabled: true,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const loadPreferences = (): NotificationPreference[] => {
  try {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    if (!stored) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(stored) as Record<string, boolean>;
    return DEFAULT_PREFERENCES.map((pref) => ({
      ...pref,
      enabled: parsed[pref.key] ?? pref.enabled,
    }));
  } catch {
    return DEFAULT_PREFERENCES;
  }
};

const savePreferences = (prefs: NotificationPreference[]) => {
  try {
    const map: Record<string, boolean> = {};
    prefs.forEach((p) => {
      map[p.key] = p.enabled;
    });
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(map));
  } catch {
    // localStorage unavailable
  }
};

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

// ---------------------------------------------------------------------------
// PushNotificationManager
// ---------------------------------------------------------------------------

const PushNotificationManager: React.FC<PushNotificationManagerProps> = ({
  vapidPublicKey,
  onSubscriptionChange,
}) => {
  const [permission, setPermission] = useState<PermissionState>(() => {
    if (typeof Notification === 'undefined') return 'default';
    return Notification.permission as PermissionState;
  });
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreference[]>(loadPreferences);
  const [expanded, setExpanded] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const isSupported =
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window;

  // Check existing subscription on mount
  useEffect(() => {
    if (!isSupported) return;

    const checkSubscription = async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        setSubscription(existing);
      } catch {
        // Push manager not available
      }
    };

    checkSubscription();
  }, [isSupported]);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return;

    setSubscribing(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result as PermissionState);

      if (result === 'granted' && vapidPublicKey) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
        });
        setSubscription(sub);
        onSubscriptionChange?.(sub);
      }
    } catch {
      // Permission request or subscription failed
    } finally {
      setSubscribing(false);
    }
  }, [isSupported, vapidPublicKey, onSubscriptionChange]);

  const unsubscribe = useCallback(async () => {
    if (!subscription) return;

    try {
      await subscription.unsubscribe();
      setSubscription(null);
      onSubscriptionChange?.(null);
    } catch {
      // Unsubscribe failed
    }
  }, [subscription, onSubscriptionChange]);

  const togglePreference = (key: string) => {
    setPreferences((prev) => {
      const updated = prev.map((p) =>
        p.key === key ? { ...p, enabled: !p.enabled } : p,
      );
      savePreferences(updated);
      return updated;
    });
  };

  if (!isSupported) return null;

  const isSubscribed = subscription !== null;
  const isDenied = permission === 'denied';

  return (
    <Paper
      elevation={4}
      sx={{
        bgcolor: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {isSubscribed ? (
            <NotificationsActive sx={{ color: COLORS.success, fontSize: 24 }} />
          ) : isDenied ? (
            <NotificationsOff sx={{ color: COLORS.error, fontSize: 24 }} />
          ) : (
            <Notifications sx={{ color: COLORS.primary, fontSize: 24 }} />
          )}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ color: COLORS.text, fontWeight: 700 }}
            >
              Push Notifications
            </Typography>
            <Typography variant="caption" sx={{ color: COLORS.muted }}>
              {isDenied
                ? 'Notifications blocked in browser settings'
                : isSubscribed
                  ? 'Receiving notifications'
                  : 'Enable to stay updated'}
            </Typography>
          </Box>
        </Box>

        {!isDenied && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isSubscribed ? (
              <Button
                size="small"
                onClick={unsubscribe}
                sx={{
                  color: COLORS.muted,
                  textTransform: 'none',
                  fontSize: 12,
                }}
              >
                Disable
              </Button>
            ) : (
              <Button
                size="small"
                variant="contained"
                onClick={requestPermission}
                disabled={subscribing}
                sx={{
                  bgcolor: COLORS.primary,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 1.5,
                  fontSize: 12,
                  '&:hover': { bgcolor: '#2563EB' },
                }}
              >
                {subscribing ? 'Enabling...' : 'Enable'}
              </Button>
            )}
          </Box>
        )}
      </Box>

      {/* Preferences panel - only show when subscribed */}
      {isSubscribed && (
        <>
          <Divider sx={{ borderColor: COLORS.border }} />

          <Box
            onClick={() => setExpanded(!expanded)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              py: 1,
              cursor: 'pointer',
              '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.05)' },
            }}
          >
            <Typography variant="caption" sx={{ color: COLORS.muted, fontWeight: 600 }}>
              Notification preferences
            </Typography>
            <IconButton size="small" sx={{ color: COLORS.muted }}>
              {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
            </IconButton>
          </Box>

          <Collapse in={expanded}>
            <Box sx={{ px: 2, pb: 2 }}>
              {preferences.map((pref) => {
                const Icon = pref.icon;
                return (
                  <Box
                    key={pref.key}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      py: 1,
                      '&:not(:last-child)': {
                        borderBottom: `1px solid ${COLORS.border}`,
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                      <Icon sx={{ color: pref.enabled ? COLORS.primary : COLORS.muted, fontSize: 20 }} />
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ color: COLORS.text, fontSize: 13, fontWeight: 500 }}
                        >
                          {pref.label}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: COLORS.muted, fontSize: 11 }}
                        >
                          {pref.description}
                        </Typography>
                      </Box>
                    </Box>
                    <Switch
                      checked={pref.enabled}
                      onChange={() => togglePreference(pref.key)}
                      size="small"
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: COLORS.primary,
                          '& + .MuiSwitch-track': {
                            bgcolor: COLORS.primary,
                            opacity: 0.5,
                          },
                        },
                        '& .MuiSwitch-track': {
                          bgcolor: COLORS.border,
                        },
                      }}
                    />
                  </Box>
                );
              })}
            </Box>
          </Collapse>
        </>
      )}
    </Paper>
  );
};

export default PushNotificationManager;
