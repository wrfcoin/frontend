import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Slide,
  LinearProgress,
} from '@mui/material';
import {
  WifiOff,
  Wifi,
  AccessTime,
  Sync,
} from '@mui/icons-material';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SyncStatus = 'idle' | 'syncing' | 'synced';

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

const LAST_ONLINE_KEY = 'wrfcoin_last_online';
const BACK_ONLINE_DISPLAY_MS = 3000;
const SYNC_DISPLAY_MS = 2000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatAge = (ms: number): string => {
  if (ms < 60000) return 'just now';
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

// ---------------------------------------------------------------------------
// OfflineIndicator
// ---------------------------------------------------------------------------

const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [showBackOnline, setShowBackOnline] = useState(false);
  const [lastSyncAge, setLastSyncAge] = useState('');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const wasOffline = useRef(false);
  const backOnlineTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ageInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateLastOnline = useCallback(() => {
    try {
      localStorage.setItem(LAST_ONLINE_KEY, String(Date.now()));
    } catch {
      // localStorage unavailable
    }
  }, []);

  const refreshAge = useCallback(() => {
    try {
      const ts = localStorage.getItem(LAST_ONLINE_KEY);
      if (ts) {
        setLastSyncAge(formatAge(Date.now() - parseInt(ts, 10)));
      } else {
        setLastSyncAge('unknown');
      }
    } catch {
      setLastSyncAge('unknown');
    }
  }, []);

  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      updateLastOnline();

      if (wasOffline.current) {
        // Show syncing state briefly when coming back online
        setSyncStatus('syncing');
        setShowBackOnline(true);

        setTimeout(() => {
          setSyncStatus('synced');
        }, SYNC_DISPLAY_MS);

        backOnlineTimer.current = setTimeout(() => {
          setShowBackOnline(false);
          setSyncStatus('idle');
        }, BACK_ONLINE_DISPLAY_MS + SYNC_DISPLAY_MS);
      }
      wasOffline.current = false;

      if (ageInterval.current) {
        clearInterval(ageInterval.current);
        ageInterval.current = null;
      }
    };

    const goOffline = () => {
      setIsOnline(false);
      wasOffline.current = true;
      setSyncStatus('idle');
      refreshAge();
      ageInterval.current = setInterval(refreshAge, 30000);
    };

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    if (navigator.onLine) {
      updateLastOnline();
    } else {
      goOffline();
    }

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      if (backOnlineTimer.current) clearTimeout(backOnlineTimer.current);
      if (ageInterval.current) clearInterval(ageInterval.current);
    };
  }, [updateLastOnline, refreshAge]);

  const showBanner = !isOnline || showBackOnline;
  const bannerColor = isOnline ? COLORS.success : COLORS.warning;
  const BannerIcon = isOnline ? Wifi : WifiOff;

  if (!showBanner) return null;

  return (
    <Slide direction="down" in={showBanner} mountOnEnter unmountOnExit>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1500,
          bgcolor: bannerColor,
          px: 2,
          py: 0.75,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: 36,
          pt: 'calc(6px + env(safe-area-inset-top, 0px))',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            width: '100%',
          }}
        >
          <BannerIcon sx={{ color: COLORS.bg, fontSize: 18 }} />

          {isOnline ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="body2"
                sx={{ color: COLORS.bg, fontWeight: 600, fontSize: 13 }}
              >
                Back online
              </Typography>
              {syncStatus === 'syncing' && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Sync
                    sx={{
                      color: COLORS.bg,
                      fontSize: 14,
                      animation: 'spin 1s linear infinite',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' },
                      },
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{ color: COLORS.bg, fontSize: 12 }}
                  >
                    Syncing...
                  </Typography>
                </Box>
              )}
              {syncStatus === 'synced' && (
                <Typography
                  variant="caption"
                  sx={{ color: COLORS.bg, fontSize: 12, opacity: 0.85 }}
                >
                  Data synced
                </Typography>
              )}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="body2"
                sx={{ color: COLORS.bg, fontWeight: 600, fontSize: 13 }}
              >
                You're offline - showing cached data
              </Typography>
              {lastSyncAge && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    ml: 0.5,
                    opacity: 0.85,
                  }}
                >
                  <AccessTime sx={{ color: COLORS.bg, fontSize: 14 }} />
                  <Typography
                    variant="caption"
                    sx={{ color: COLORS.bg, fontSize: 12, whiteSpace: 'nowrap' }}
                  >
                    Last synced {lastSyncAge}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>

        {/* Sync progress bar shown while offline */}
        {!isOnline && (
          <LinearProgress
            variant="indeterminate"
            sx={{
              width: '100%',
              mt: 0.5,
              height: 2,
              bgcolor: 'rgba(15, 23, 42, 0.2)',
              '& .MuiLinearProgress-bar': {
                bgcolor: COLORS.bg,
                opacity: 0.4,
              },
            }}
          />
        )}
      </Box>
    </Slide>
  );
};

export default OfflineIndicator;
