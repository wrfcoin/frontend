import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  CircularProgress,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  NotificationsActive,
  CheckCircle,
  Cancel,
  Help,
  PhoneIphone,
  Security,
  Celebration,
  Refresh,
  ArrowForward,
  ArrowBack,
} from '@mui/icons-material';
import DemoSurfaceGate from '../common/DemoSurfaceGate';

// frontend#352: in the demo build this sample's actions are disabled; none of
// them reached a backend, and several reported success after a timer.
const SAMPLE_ACTION = 'Sample only: no push subscription is created.';

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
// Permission status display config
// ---------------------------------------------------------------------------
const PERMISSION_STATUS = {
  default: {
    label: 'Not requested',
    color: DARK.warning,
    icon: Help,
    description: 'Push permission has not been requested yet.',
  },
  granted: {
    label: 'Granted',
    color: DARK.success,
    icon: CheckCircle,
    description: 'Push notifications are enabled for this browser.',
  },
  denied: {
    label: 'Denied',
    color: DARK.error,
    icon: Cancel,
    description:
      'Push notifications were blocked. Please update your browser settings to allow notifications from this site.',
  },
};

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------
const STEPS = [
  {
    label: 'Check Browser Support',
    description: 'Verify your browser supports push notifications and service workers.',
  },
  {
    label: 'Request Permission',
    description: 'Allow WRFCoin to send you push notifications for important updates.',
  },
  {
    label: 'Confirm Subscription',
    description: 'Register your device with the notification service and verify delivery.',
  },
];

// ---------------------------------------------------------------------------
// PushSetup component
// ---------------------------------------------------------------------------
const PushSetupSample = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [browserSupported, setBrowserSupported] = useState(null);
  const [permissionState, setPermissionState] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default',
  );
  const [swRegistered, setSwRegistered] = useState(false);
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Step 1 -- Check browser support
  const handleCheckSupport = useCallback(() => {
    setLoading(true);
    setError(null);

    // Simulate a brief check
    setTimeout(() => {
      const supported =
        'Notification' in window && 'serviceWorker' in navigator;
      setBrowserSupported(supported);
      setLoading(false);
      if (supported) {
        setActiveStep(1);
      }
    }, 800);
  }, []);

  // Step 2 -- Request permission
  const handleRequestPermission = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (typeof Notification === 'undefined') {
        // Fallback for environments without Notification API (e.g. SSR)
        setPermissionState('granted');
        setLoading(false);
        setActiveStep(2);
        return;
      }

      const result = await Notification.requestPermission();
      setPermissionState(result);
      setLoading(false);

      if (result === 'granted') {
        setActiveStep(2);
      }
    } catch (err) {
      setError('Failed to request notification permission.');
      setLoading(false);
    }
  }, []);

  // Step 3 -- Mock service worker registration + subscription
  const handleRegisterServiceWorker = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate SW registration delay
      await new Promise((r) => setTimeout(r, 1200));
      setSwRegistered(true);

      // Simulate push subscription
      await new Promise((r) => setTimeout(r, 800));
      setSubscriptionActive(true);
      setLoading(false);
    } catch (err) {
      setError('Failed to register service worker.');
      setLoading(false);
    }
  }, []);

  const handleBack = useCallback(() => {
    setActiveStep((prev) => Math.max(0, prev - 1));
  }, []);

  const currentPermission =
    PERMISSION_STATUS[permissionState] || PERMISSION_STATUS.default;
  const PermissionIcon = currentPermission.icon;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: DARK.bg,
        p: { xs: 2, md: 4 },
      }}
    >
      <Box sx={{ maxWidth: 700, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(59,130,246,0.15)',
            }}
          >
            <NotificationsActive sx={{ color: DARK.primary, fontSize: 26 }} />
          </Box>
          <Box>
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, color: DARK.textPrimary }}
            >
              Push Notification Setup
            </Typography>
            <Typography variant="body2" sx={{ color: DARK.textSecondary }}>
              Enable browser push notifications to stay updated in real time.
            </Typography>
          </Box>
        </Box>

        {/* Permission status indicator */}
        <Paper
          sx={{
            backgroundColor: DARK.card,
            border: `1px solid ${DARK.border}`,
            borderRadius: '12px',
            p: 2.5,
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <PermissionIcon sx={{ fontSize: 28, color: currentPermission.color }} />
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: DARK.textPrimary }}
              >
                Permission Status
              </Typography>
              <Chip
                label={currentPermission.label}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  backgroundColor: `${currentPermission.color}18`,
                  color: currentPermission.color,
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: DARK.textMuted }}>
              {currentPermission.description}
            </Typography>
          </Box>
          {subscriptionActive && (
            <Chip
              icon={<CheckCircle sx={{ fontSize: 14, color: DARK.success }} />}
              label="Subscribed"
              size="small"
              sx={{
                height: 24,
                fontSize: '0.72rem',
                fontWeight: 600,
                backgroundColor: 'rgba(16,185,129,0.12)',
                color: DARK.success,
                '& .MuiChip-icon': { color: DARK.success },
              }}
            />
          )}
        </Paper>

        {/* Stepper wizard */}
        <Paper
          sx={{
            backgroundColor: DARK.card,
            border: `1px solid ${DARK.border}`,
            borderRadius: '12px',
            p: 3,
          }}
        >
          <Stepper
            activeStep={activeStep}
            orientation="vertical"
            sx={{
              '& .MuiStepLabel-label': {
                color: DARK.textPrimary,
                fontWeight: 600,
                '&.Mui-active': { color: DARK.primary },
                '&.Mui-completed': { color: DARK.success },
              },
              '& .MuiStepIcon-root': {
                color: DARK.textMuted,
                '&.Mui-active': { color: DARK.primary },
                '&.Mui-completed': { color: DARK.success },
              },
              '& .MuiStepConnector-line': {
                borderColor: DARK.border,
              },
            }}
          >
            {/* Step 1: Check Support */}
            <Step>
              <StepLabel>{STEPS[0].label}</StepLabel>
              <StepContent>
                <Typography
                  variant="body2"
                  sx={{ color: DARK.textSecondary, mb: 2 }}
                >
                  {STEPS[0].description}
                </Typography>

                {browserSupported === false && (
                  <Alert
                    severity="error"
                    sx={{
                      mb: 2,
                      backgroundColor: 'rgba(239,68,68,0.1)',
                      color: DARK.error,
                      border: `1px solid ${DARK.error}`,
                      borderRadius: '8px',
                    }}
                  >
                    Your browser does not support push notifications. Please
                    try Chrome, Firefox, or Edge.
                  </Alert>
                )}

                {browserSupported === true && (
                  <Alert
                    severity="success"
                    sx={{
                      mb: 2,
                      backgroundColor: 'rgba(16,185,129,0.1)',
                      color: DARK.success,
                      border: `1px solid ${DARK.success}`,
                      borderRadius: '8px',
                    }}
                  >
                    Browser supports push notifications and service workers.
                  </Alert>
                )}

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    disabled title={SAMPLE_ACTION}
                    startIcon={
                      loading ? (
                        <CircularProgress size={16} sx={{ color: '#fff' }} />
                      ) : (
                        <PhoneIphone />
                      )
                    }
                    sx={{
                      textTransform: 'none',
                      backgroundColor: DARK.primary,
                      borderRadius: '8px',
                      '&:hover': { backgroundColor: '#2563EB' },
                    }}
                  >
                    {loading ? 'Checking...' : 'Check Browser Support'}
                  </Button>
                </Box>
              </StepContent>
            </Step>

            {/* Step 2: Request Permission */}
            <Step>
              <StepLabel>{STEPS[1].label}</StepLabel>
              <StepContent>
                <Typography
                  variant="body2"
                  sx={{ color: DARK.textSecondary, mb: 2 }}
                >
                  {STEPS[1].description}
                </Typography>

                {permissionState === 'denied' && (
                  <Alert
                    severity="warning"
                    sx={{
                      mb: 2,
                      backgroundColor: 'rgba(245,158,11,0.1)',
                      color: DARK.warning,
                      border: `1px solid ${DARK.warning}`,
                      borderRadius: '8px',
                    }}
                  >
                    Notifications are blocked. Open your browser settings, find
                    this site under "Notifications", and change the setting to
                    "Allow".
                  </Alert>
                )}

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    onClick={handleBack}
                    startIcon={<ArrowBack />}
                    sx={{
                      textTransform: 'none',
                      borderColor: DARK.border,
                      color: DARK.textSecondary,
                      borderRadius: '8px',
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    disabled title={SAMPLE_ACTION}
                    startIcon={
                      loading ? (
                        <CircularProgress size={16} sx={{ color: '#fff' }} />
                      ) : (
                        <Security />
                      )
                    }
                    sx={{
                      textTransform: 'none',
                      backgroundColor: DARK.primary,
                      borderRadius: '8px',
                      '&:hover': { backgroundColor: '#2563EB' },
                    }}
                  >
                    {permissionState === 'granted'
                      ? 'Permission Granted'
                      : loading
                        ? 'Requesting...'
                        : 'Enable Push Notifications'}
                  </Button>
                </Box>
              </StepContent>
            </Step>

            {/* Step 3: Confirm Subscription */}
            <Step>
              <StepLabel>{STEPS[2].label}</StepLabel>
              <StepContent>
                <Typography
                  variant="body2"
                  sx={{ color: DARK.textSecondary, mb: 2 }}
                >
                  {STEPS[2].description}
                </Typography>

                {loading && (
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="caption"
                      sx={{ color: DARK.textMuted, mb: 0.5, display: 'block' }}
                    >
                      {swRegistered
                        ? 'Subscribing to push service...'
                        : 'Registering service worker...'}
                    </Typography>
                    <LinearProgress
                      sx={{
                        borderRadius: 4,
                        backgroundColor: DARK.border,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: DARK.primary,
                        },
                      }}
                    />
                  </Box>
                )}

                {subscriptionActive && (
                  <Alert
                    severity="success"
                    icon={<Celebration sx={{ color: DARK.success }} />}
                    sx={{
                      mb: 2,
                      backgroundColor: 'rgba(16,185,129,0.1)',
                      color: DARK.success,
                      border: `1px solid ${DARK.success}`,
                      borderRadius: '8px',
                    }}
                  >
                    Push notifications are active. You will receive real-time
                    alerts for weather events, earnings, and governance updates.
                  </Alert>
                )}

                {error && (
                  <Alert
                    severity="error"
                    sx={{
                      mb: 2,
                      backgroundColor: 'rgba(239,68,68,0.1)',
                      color: DARK.error,
                      border: `1px solid ${DARK.error}`,
                      borderRadius: '8px',
                    }}
                  >
                    {error}
                  </Alert>
                )}

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    onClick={handleBack}
                    startIcon={<ArrowBack />}
                    sx={{
                      textTransform: 'none',
                      borderColor: DARK.border,
                      color: DARK.textSecondary,
                      borderRadius: '8px',
                    }}
                  >
                    Back
                  </Button>
                  {!subscriptionActive ? (
                    <Button
                      variant="contained"
                      disabled title={SAMPLE_ACTION}
                      startIcon={
                        loading ? (
                          <CircularProgress size={16} sx={{ color: '#fff' }} />
                        ) : (
                          <ArrowForward />
                        )
                      }
                      sx={{
                        textTransform: 'none',
                        backgroundColor: DARK.primary,
                        borderRadius: '8px',
                        '&:hover': { backgroundColor: '#2563EB' },
                      }}
                    >
                      {loading ? 'Registering...' : 'Complete Setup'}
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      startIcon={<Refresh />}
                      onClick={() => {
                        setActiveStep(0);
                        setBrowserSupported(null);
                        setSwRegistered(false);
                        setSubscriptionActive(false);
                        setError(null);
                      }}
                      sx={{
                        textTransform: 'none',
                        borderColor: DARK.border,
                        color: DARK.textSecondary,
                        borderRadius: '8px',
                      }}
                    >
                      Re-run Setup
                    </Button>
                  )}
                </Box>
              </StepContent>
            </Step>
          </Stepper>
        </Paper>
      </Box>
    </Box>
  );
};

// frontend#352: display-only fabricated surface. The default build shows an
// honest not-live state and never mounts the sample.
const PushSetup = () => (
  <DemoSurfaceGate
    title="Push notifications are not live on the testnet"
    description="No backend route stores push subscriptions or sends notifications yet."
    testId="push-setup"
  >
    <PushSetupSample />
  </DemoSurfaceGate>
);

export default PushSetup;
