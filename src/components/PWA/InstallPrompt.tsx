import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Slide,
  useMediaQuery,
} from '@mui/material';
import {
  GetApp,
  Close,
  OfflineBolt,
  Speed,
  Notifications,
  CloudDownload,
} from '@mui/icons-material';
import type { SvgIconComponent } from '@mui/icons-material';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

interface Benefit {
  icon: SvgIconComponent;
  label: string;
}

type InstallState = 'idle' | 'available' | 'installed' | 'dismissed';

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

const DISMISS_KEY = 'wrfcoin_install_dismissed';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const BENEFITS: Benefit[] = [
  { icon: OfflineBolt, label: 'Access weather data offline' },
  { icon: Speed, label: 'Faster loading' },
  { icon: Notifications, label: 'Push notifications' },
];

// ---------------------------------------------------------------------------
// InstallPrompt
// ---------------------------------------------------------------------------

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installState, setInstallState] = useState<InstallState>('idle');
  const [visible, setVisible] = useState(false);
  const isMobile = useMediaQuery('(max-width:768px)');

  const isDismissed = useCallback((): boolean => {
    try {
      const dismissed = localStorage.getItem(DISMISS_KEY);
      if (!dismissed) return false;
      const ts = parseInt(dismissed, 10);
      if (Date.now() - ts < DISMISS_DURATION_MS) return true;
      localStorage.removeItem(DISMISS_KEY);
      return false;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    // Detect if already installed (standalone mode)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setInstallState('installed');
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setInstallState('available');
      if (!isDismissed()) {
        setVisible(true);
      }
    };

    const installedHandler = () => {
      setInstallState('installed');
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, [isDismissed]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallState('installed');
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    setInstallState('dismissed');
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // localStorage unavailable
    }
  };

  if (!isMobile || !visible) return null;

  return (
    <Slide direction="up" in={visible} mountOnEnter unmountOnExit>
      <Paper
        elevation={16}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1400,
          bgcolor: COLORS.card,
          borderTop: `1px solid ${COLORS.border}`,
          borderRadius: '16px 16px 0 0',
          p: 2.5,
          pb: 'calc(20px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Close button */}
        <IconButton
          onClick={handleDismiss}
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: COLORS.muted,
            '&:hover': { color: COLORS.text },
          }}
          aria-label="Dismiss install prompt"
        >
          <Close fontSize="small" />
        </IconButton>

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '10px',
              bgcolor: COLORS.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <CloudDownload sx={{ color: COLORS.text, fontSize: 24 }} />
          </Box>
          <Box>
            <Typography
              variant="subtitle1"
              sx={{ color: COLORS.text, fontWeight: 700, lineHeight: 1.2 }}
            >
              Add WRFCoin to Home Screen
            </Typography>
            <Typography variant="caption" sx={{ color: COLORS.muted }}>
              Install the app for the best experience
            </Typography>
          </Box>
        </Box>

        {/* Benefits */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 2 }}>
          {BENEFITS.map(({ icon: Icon, label }) => (
            <Box
              key={label}
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <Icon sx={{ color: COLORS.success, fontSize: 18 }} />
              <Typography variant="body2" sx={{ color: COLORS.muted, fontSize: 13 }}>
                {label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Install button */}
        <Button
          variant="contained"
          fullWidth
          startIcon={<GetApp />}
          onClick={handleInstall}
          sx={{
            bgcolor: COLORS.primary,
            color: COLORS.text,
            fontWeight: 600,
            textTransform: 'none',
            borderRadius: '10px',
            py: 1.25,
            fontSize: '0.95rem',
            minHeight: 44,
            '&:hover': { bgcolor: '#2563EB' },
          }}
        >
          Install App
        </Button>
      </Paper>
    </Slide>
  );
};

export default InstallPrompt;
