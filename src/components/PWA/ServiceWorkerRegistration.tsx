import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Snackbar,
} from '@mui/material';
import {
  SystemUpdateAlt,
  Close,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SWStatus = 'idle' | 'registering' | 'registered' | 'update-available' | 'error';

interface ServiceWorkerRegistrationProps {
  swUrl?: string;
  onRegistered?: (registration: ServiceWorkerRegistration) => void;
  onUpdateAvailable?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
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

const SW_CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

// ---------------------------------------------------------------------------
// ServiceWorkerRegistration
// ---------------------------------------------------------------------------

const ServiceWorkerRegistrationComponent: React.FC<ServiceWorkerRegistrationProps> = ({
  swUrl = '/service-worker.js',
  onRegistered,
  onUpdateAvailable,
  onError,
}) => {
  const [status, setStatus] = useState<SWStatus>('idle');
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [showUpdateSnackbar, setShowUpdateSnackbar] = useState(false);

  const registerSW = useCallback(async (): Promise<void> => {
    if (!('serviceWorker' in navigator)) return;

    setStatus('registering');

    try {
      const reg = await navigator.serviceWorker.register(swUrl, {
        scope: '/',
      });

      setRegistration(reg);
      setStatus('registered');
      onRegistered?.(reg);

      // Check for updates on the existing registration
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            // New content available, show update notification
            setStatus('update-available');
            setShowUpdateSnackbar(true);
            onUpdateAvailable?.(reg);
          }
        });
      });

      // Periodically check for updates
      setInterval(() => {
        reg.update().catch(() => {
          // Silently fail update checks
        });
      }, SW_CHECK_INTERVAL_MS);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('SW registration failed');
      setStatus('error');
      onError?.(error);
    }
  }, [swUrl, onRegistered, onUpdateAvailable, onError]);

  useEffect(() => {
    registerSW();

    // Handle controller change (new SW activated)
    const handleControllerChange = () => {
      window.location.reload();
    };

    navigator.serviceWorker?.addEventListener(
      'controllerchange',
      handleControllerChange,
    );

    return () => {
      navigator.serviceWorker?.removeEventListener(
        'controllerchange',
        handleControllerChange,
      );
    };
  }, [registerSW]);

  const handleUpdate = () => {
    if (!registration?.waiting) return;

    // Tell the waiting SW to skip waiting and activate
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    setShowUpdateSnackbar(false);
  };

  const handleDismissUpdate = () => {
    setShowUpdateSnackbar(false);
  };

  return (
    <Snackbar
      open={showUpdateSnackbar}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Paper
        elevation={8}
        sx={{
          bgcolor: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 2,
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          maxWidth: 400,
        }}
      >
        <SystemUpdateAlt sx={{ color: COLORS.primary, fontSize: 24 }} />
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="body2"
            sx={{ color: COLORS.text, fontWeight: 600 }}
          >
            Update available
          </Typography>
          <Typography variant="caption" sx={{ color: COLORS.muted }}>
            A new version of WRFCoin is ready
          </Typography>
        </Box>
        <Button
          size="small"
          variant="contained"
          onClick={handleUpdate}
          sx={{
            bgcolor: COLORS.primary,
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 1.5,
            minWidth: 70,
            '&:hover': { bgcolor: '#2563EB' },
          }}
        >
          Update
        </Button>
        <IconButton
          size="small"
          onClick={handleDismissUpdate}
          sx={{ color: COLORS.muted }}
          aria-label="Dismiss update notification"
        >
          <Close fontSize="small" />
        </IconButton>
      </Paper>
    </Snackbar>
  );
};

export default ServiceWorkerRegistrationComponent;
