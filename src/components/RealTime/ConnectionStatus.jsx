import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Collapse,
  IconButton,
  LinearProgress,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Close as CloseIcon,
  FiberManualRecord as DotIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Wifi as WifiIcon,
  Cable as SSEIcon,
  Api as ApiIcon,
  Dns as ServerIcon,
  Refresh as ReconnectIcon,
} from '@mui/icons-material';
import useWebSocket from '../../hooks/useWebSocket';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const colors = {
  bg: '#0F172A',
  card: '#1E293B',
  cardHover: '#253347',
  border: '#334155',
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
};

const STATUS_COLORS = {
  connected: colors.success,
  degraded: colors.warning,
  disconnected: colors.error,
  connecting: colors.warning,
  unknown: colors.textSecondary,
};

const STATUS_LABELS = {
  connected: 'Connected',
  degraded: 'Degraded',
  disconnected: 'Disconnected',
  connecting: 'Connecting...',
  unknown: 'Not monitored',
};

const CONNECTION_ICONS = {
  websocket: WifiIcon,
  sse: SSEIcon,
  api: ApiIcon,
  rpc: ServerIcon,
};

// ---------------------------------------------------------------------------
// #214: this component used to FABRICATE its data — Math.random latency, a 3s
// dice-roll that flipped statuses, and hardcoded healthy endpoints — while
// mounted app-wide as the connection banner. A health indicator that guesses
// is the same defect class as a mock that silently stops intercepting: it
// reports confidence it has not earned.
//
// It now reports exactly one real signal — the global WebSocket client's
// status from useWebSocket() — and says "Not monitored" for every channel it
// has no probe for (SSE, REST, RPC). No latency is shown for any channel
// because none is measured. When real per-channel telemetry exists, pass it
// via the `connections` prop; entries are rendered exactly as given.
// ---------------------------------------------------------------------------

/** Channels this component knows about but has no live probe for. */
const UNMONITORED_CONNECTIONS = [
  { id: 'sse', name: 'SSE Stream', icon: 'sse', status: 'unknown', latency: null, endpoint: 'no probe wired' },
  { id: 'api', name: 'REST API', icon: 'api', status: 'unknown', latency: null, endpoint: 'no probe wired' },
  { id: 'rpc', name: 'Blockchain RPC', icon: 'rpc', status: 'unknown', latency: null, endpoint: 'no probe wired' },
];

/** Map the useWebSocket hook status onto this component's vocabulary. */
const mapWsStatus = (status) => {
  if (status === 'connected' || status === 'connecting') return status;
  return 'disconnected'; // hook's 'disconnected' and 'error' both mean "not connected"
};

// ---------------------------------------------------------------------------
// ConnectionStatus Component
// ---------------------------------------------------------------------------

const ConnectionStatus = ({ compact = false, mode = 'full', connections: connectionsProp }) => {
  const { status: wsStatus, reconnect } = useWebSocket({ channels: [] });
  const [expanded, setExpanded] = useState(false);
  // Banner mode state
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [bannerSeverity, setBannerSeverity] = useState('warning');
  const [disconnectedSince, setDisconnectedSince] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const successTimerRef = useRef(null);

  const connections = connectionsProp || [
    {
      id: 'websocket',
      name: 'WebSocket',
      icon: 'websocket',
      status: mapWsStatus(wsStatus),
      latency: null, // not measured — never invented
      endpoint: 'backend event stream',
    },
    ...UNMONITORED_CONNECTIONS,
  ];

  // Health is computed from MONITORED entries only; "Not monitored" never
  // counts as healthy. With nothing monitored at all, health is unknown.
  const monitored = connections.filter((c) => c.status !== 'unknown');
  const overallHealth = (() => {
    if (monitored.length === 0) return 'unknown';
    const statuses = monitored.map((c) => c.status);
    if (statuses.every((s) => s === 'connected')) return 'operational';
    if (statuses.some((s) => s === 'disconnected')) return 'offline';
    return 'degraded';
  })();

  const healthColor =
    overallHealth === 'operational'
      ? colors.success
      : overallHealth === 'degraded'
        ? colors.warning
        : overallHealth === 'unknown'
          ? colors.textSecondary
          : colors.error;

  const healthLabel =
    overallHealth === 'operational'
      ? `Connected (${monitored.length} of ${connections.length} channels monitored)`
      : overallHealth === 'degraded'
        ? 'Degraded'
        : overallHealth === 'unknown'
          ? 'Connection status unknown'
          : 'Disconnected';

  // ---- Banner mode state management (driven by the real signal only) ----
  const hasDisconnected = monitored.some((c) => c.status === 'disconnected');
  const isReconnecting = monitored.some((c) => c.status === 'connecting');
  const allConnected = monitored.length > 0 && monitored.every((c) => c.status === 'connected');

  // Track when disconnection first occurred
  useEffect(() => {
    if (hasDisconnected && !disconnectedSince) {
      setDisconnectedSince(Date.now());
    } else if (!hasDisconnected && !isReconnecting) {
      setDisconnectedSince(null);
    }
  }, [hasDisconnected, isReconnecting, disconnectedSince]);

  // Show banner after 5 seconds of disconnect; manage severity transitions
  useEffect(() => {
    if (mode !== 'banner') return undefined;

    if (hasDisconnected && disconnectedSince) {
      const elapsed = Date.now() - disconnectedSince;
      if (elapsed >= 5000) {
        setBannerSeverity('warning');
        setBannerDismissed(false);
        setShowBanner(true);
      } else {
        const timer = setTimeout(() => {
          setBannerSeverity('warning');
          setBannerDismissed(false);
          setShowBanner(true);
        }, 5000 - elapsed);
        return () => clearTimeout(timer);
      }
    } else if (isReconnecting && showBanner) {
      setBannerSeverity('info');
    } else if (allConnected && showBanner) {
      // Briefly show success then auto-hide
      setBannerSeverity('success');
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => {
        setShowBanner(false);
        setBannerDismissed(false);
      }, 3000);
    }

    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, [mode, hasDisconnected, isReconnecting, allConnected, disconnectedSince, showBanner]);

  // Manual reconnect asks the REAL client to reconnect — it does not repaint
  // local state to "connecting" and hope.
  const handleReconnect = useCallback(() => {
    if (typeof reconnect === 'function') reconnect();
  }, [reconnect]);

  // ---- Banner mode rendering ----
  if (mode === 'banner') {
    const bannerTitle =
      bannerSeverity === 'warning'
        ? 'Connection Lost'
        : bannerSeverity === 'info'
          ? 'Reconnecting...'
          : 'Connected';

    const bannerBody =
      bannerSeverity === 'warning'
        ? 'Live updates are unavailable. The connection retries automatically.'
        : bannerSeverity === 'info'
          ? 'Restoring connection...'
          : 'Connection restored.';

    return (
      <Collapse in={showBanner && !bannerDismissed}>
        <Alert
          severity={bannerSeverity}
          action={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {bannerSeverity !== 'success' && (
                <Button
                  color="inherit"
                  size="small"
                  onClick={handleReconnect}
                  startIcon={<ReconnectIcon />}
                >
                  Reconnect Now
                </Button>
              )}
              <IconButton
                color="inherit"
                size="small"
                onClick={() => setBannerDismissed(true)}
                aria-label="close"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          }
          sx={{ width: '100%', borderRadius: 0 }}
        >
          <AlertTitle>{bannerTitle}</AlertTitle>
          <Typography component="span" variant="body2">
            {bannerBody}
          </Typography>
          {bannerSeverity === 'info' && (
            <LinearProgress
              sx={{ mt: 1, borderRadius: 1 }}
            />
          )}
        </Alert>
      </Collapse>
    );
  }

  // ---- Compact mode ----
  if (compact) {
    return (
      <Tooltip title={healthLabel} placement="bottom">
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            cursor: 'default',
            px: 1,
            py: 0.25,
            borderRadius: 1,
            '&:hover': { bgcolor: colors.border + '44' },
          }}
        >
          <DotIcon sx={{ fontSize: 10, color: healthColor }} />
          <Typography sx={{ fontSize: 11, color: healthColor, fontWeight: 500 }}>
            {overallHealth === 'operational'
              ? 'Connected'
              : overallHealth === 'degraded'
                ? 'Degraded'
                : overallHealth === 'unknown'
                  ? 'Unknown'
                  : 'Offline'}
          </Typography>
        </Box>
      </Tooltip>
    );
  }

  // ---- Full mode ----
  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: colors.card,
        borderRadius: 2,
        border: `1px solid ${colors.border}`,
        overflow: 'hidden',
      }}
    >
      {/* Header (clickable) */}
      <Box
        onClick={() => setExpanded((prev) => !prev)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          cursor: 'pointer',
          transition: 'background-color 0.15s ease',
          '&:hover': { bgcolor: colors.cardHover },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: healthColor,
              boxShadow: `0 0 6px ${healthColor}`,
            }}
          />
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: colors.text }}>
            {healthLabel}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Mini connection dots */}
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {connections.map((conn) => (
              <Tooltip key={conn.id} title={`${conn.name}: ${STATUS_LABELS[conn.status]}`}>
                <DotIcon
                  sx={{
                    fontSize: 8,
                    color: STATUS_COLORS[conn.status] || colors.textSecondary,
                  }}
                />
              </Tooltip>
            ))}
          </Box>
          <IconButton size="small" sx={{ color: colors.textSecondary, width: 24, height: 24 }}>
            {expanded ? <CollapseIcon sx={{ fontSize: 16 }} /> : <ExpandIcon sx={{ fontSize: 16 }} />}
          </IconButton>
        </Box>
      </Box>

      {/* Expanded details */}
      <Collapse in={expanded}>
        <Box sx={{ borderTop: `1px solid ${colors.border}` }}>
          {connections.map((conn) => {
            const IconComp = CONNECTION_ICONS[conn.icon] || WifiIcon;
            const statusColor = STATUS_COLORS[conn.status] || colors.textSecondary;
            const isDisconnected = conn.status === 'disconnected';
            const isConnecting = conn.status === 'connecting';

            return (
              <Box
                key={conn.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 2,
                  py: 1.25,
                  borderBottom: `1px solid ${colors.border}`,
                  '&:last-child': { borderBottom: 'none' },
                }}
              >
                {/* Left: icon + name */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                  <IconComp sx={{ fontSize: 16, color: statusColor }} />
                  <Box>
                    <Typography sx={{ fontSize: 12, fontWeight: 500, color: colors.text }}>
                      {conn.name}
                    </Typography>
                    <Typography sx={{ fontSize: 10, color: colors.textSecondary, fontFamily: 'monospace' }}>
                      {conn.endpoint}
                    </Typography>
                  </Box>
                </Box>

                {/* Right: status + latency */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {/* Latency — shown only when actually measured */}
                  {Number.isFinite(conn.latency) && !isDisconnected && !isConnecting && (
                    <Typography
                      sx={{
                        fontSize: 11,
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        color:
                          conn.latency < 50
                            ? colors.success
                            : conn.latency < 150
                              ? colors.warning
                              : colors.error,
                        minWidth: 50,
                        textAlign: 'right',
                      }}
                    >
                      {conn.latency}ms
                    </Typography>
                  )}

                  {/* Reconnect action for a real, disconnected channel */}
                  {isDisconnected && (
                    <Button
                      size="small"
                      onClick={handleReconnect}
                      startIcon={<ReconnectIcon sx={{ fontSize: 12 }} />}
                      sx={{ fontSize: 10, color: colors.warning, minWidth: 90 }}
                    >
                      Reconnect
                    </Button>
                  )}

                  {/* Connecting progress */}
                  {isConnecting && (
                    <Box sx={{ width: 60 }}>
                      <LinearProgress
                        sx={{
                          height: 3,
                          borderRadius: 2,
                          bgcolor: colors.border,
                          '& .MuiLinearProgress-bar': { bgcolor: colors.warning },
                        }}
                      />
                    </Box>
                  )}

                  {/* Status dot */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      minWidth: 80,
                      justifyContent: 'flex-end',
                    }}
                  >
                    <DotIcon sx={{ fontSize: 8, color: statusColor }} />
                    <Typography sx={{ fontSize: 10, color: statusColor, fontWeight: 500 }}>
                      {STATUS_LABELS[conn.status]}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default ConnectionStatus;
