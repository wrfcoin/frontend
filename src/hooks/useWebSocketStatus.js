/**
 * Custom hook for WebSocket status monitoring
 * Provides real-time connection status and statistics
 */

import { useState, useEffect, useRef } from 'react';

export const useWebSocketStatus = wsClient => {
  const [status, setStatus] = useState('disconnected');
  const [connectionTime, setConnectionTime] = useState(null);
  const [messageCount, setMessageCount] = useState(0);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [lastError, setLastError] = useState(null);
  const statsRef = useRef({
    totalMessages: 0,
    totalReconnects: 0,
    uptime: 0,
  });

  useEffect(() => {
    if (!wsClient) {
      setStatus('disconnected');
      return;
    }

    const handleOpen = () => {
      setStatus('connected');
      setConnectionTime(new Date());
      setRetryAttempt(0);
      setLastError(null);
      statsRef.current.totalReconnects += 1;
    };

    const handleClose = () => {
      setStatus('disconnected');
      setConnectionTime(null);
    };

    const handleError = event => {
      setStatus('error');
      setLastError(event.detail || 'Connection error');
    };

    const handleMessage = event => {
      setMessageCount(prev => prev + 1);
      statsRef.current.totalMessages += 1;
    };

    const handleReconnecting = event => {
      setStatus('reconnecting');
      setRetryAttempt(event.detail?.attempt || 0);
    };

    // Set initial state
    if (wsClient.readyState === WebSocket.CONNECTING) {
      setStatus('connecting');
    } else if (wsClient.readyState === WebSocket.OPEN) {
      setStatus('connected');
      setConnectionTime(new Date());
    } else {
      setStatus('disconnected');
    }

    // Add event listeners
    wsClient.addEventListener('open', handleOpen);
    wsClient.addEventListener('close', handleClose);
    wsClient.addEventListener('error', handleError);
    wsClient.addEventListener('message', handleMessage);
    wsClient.addEventListener('reconnecting', handleReconnecting);

    return () => {
      wsClient.removeEventListener('open', handleOpen);
      wsClient.removeEventListener('close', handleClose);
      wsClient.removeEventListener('error', handleError);
      wsClient.removeEventListener('message', handleMessage);
      wsClient.removeEventListener('reconnecting', handleReconnecting);
    };
  }, [wsClient]);

  // Calculate uptime
  const uptime = connectionTime
    ? Math.floor((new Date() - connectionTime) / 1000)
    : 0;

  return {
    status,
    connectionTime,
    messageCount,
    retryAttempt,
    lastError,
    uptime,
    stats: {
      ...statsRef.current,
      uptime,
    },
    isConnected: status === 'connected',
    isConnecting: status === 'connecting' || status === 'reconnecting',
  };
};

export default useWebSocketStatus;
