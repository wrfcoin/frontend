import React, { useState, useEffect, useRef } from 'react';
import './WebSocketStatusIndicator.css';

const WebSocketStatusIndicator = ({
  wsClient = null,
  position = 'top-right',
  showDetails = false,
  autoHide = false,
}) => {
  const [status, setStatus] = useState('disconnected');
  const [isVisible, setIsVisible] = useState(true);
  const [connectionTime, setConnectionTime] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  const [messageCount, setMessageCount] = useState(0);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const animationRef = useRef(null);
  const hideTimeoutRef = useRef(null);

  const normalizeStatus = input => {
    if (input === 'connected') return 'connected';
    if (input === 'connecting') return 'connecting';
    if (input === 'reconnecting') return 'reconnecting';
    if (input === 'error') return 'error';
    return 'disconnected';
  };

  // Status configurations
  const statusConfig = {
    connecting: {
      color: '#ffa726',
      label: 'Connecting',
      icon: '⟳',
      pulse: true,
      animation: 'spin',
    },
    connected: {
      color: '#4caf50',
      label: 'Connected',
      icon: '●',
      pulse: true,
      animation: 'pulse',
    },
    disconnected: {
      color: '#f44336',
      label: 'Disconnected',
      icon: '●',
      pulse: false,
      animation: 'none',
    },
    reconnecting: {
      color: '#ff9800',
      label: 'Reconnecting',
      icon: '⟳',
      pulse: true,
      animation: 'spin',
    },
    error: {
      color: '#d32f2f',
      label: 'Error',
      icon: '⚠',
      pulse: true,
      animation: 'shake',
    },
  };

  // Monitor WebSocket status
  useEffect(() => {
    if (!wsClient) {
      setStatus('disconnected');
      return;
    }

    const handleOpen = () => {
      setStatus('connected');
      setConnectionTime(new Date());
      setRetryAttempt(0);

      if (autoHide) {
        hideTimeoutRef.current = setTimeout(() => {
          setIsVisible(false);
        }, 3000);
      }
    };

    const handleClose = () => {
      setStatus('disconnected');
      setConnectionTime(null);
      setIsVisible(true);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };

    const handleError = () => {
      setStatus('error');
      setIsVisible(true);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };

    const handleMessage = data => {
      setLastMessage(new Date());
      setMessageCount(prev => prev + 1);

      // Brief activity flash
      if (animationRef.current) {
        animationRef.current.classList.add('message-flash');
        setTimeout(() => {
          if (animationRef.current) {
            animationRef.current.classList.remove('message-flash');
          }
        }, 200);
      }
    };

    const handleReconnecting = () => {
      setStatus('reconnecting');
      setRetryAttempt(prev => prev + 1);
      setIsVisible(true);
    };

    const cleanupFns = [];
    const hasEmitterApi =
      typeof wsClient.on === 'function' && typeof wsClient.off === 'function';
    const hasDomEventApi =
      typeof wsClient.addEventListener === 'function' &&
      typeof wsClient.removeEventListener === 'function';

    // Check initial state (supports both wrapper clients and raw WebSocket)
    if (typeof wsClient.status === 'string') {
      const mappedStatus = normalizeStatus(wsClient.status);
      setStatus(mappedStatus);
      if (mappedStatus === 'connected') {
        setConnectionTime(new Date());
      }
    } else if (typeof wsClient.readyState === 'number') {
      if (wsClient.readyState === WebSocket.CONNECTING) {
        setStatus('connecting');
      } else if (wsClient.readyState === WebSocket.OPEN) {
        setStatus('connected');
        setConnectionTime(new Date());
      } else if (wsClient.readyState === WebSocket.CLOSED) {
        setStatus('disconnected');
      }
    }

    if (hasEmitterApi) {
      cleanupFns.push(wsClient.on('connect', handleOpen));
      cleanupFns.push(wsClient.on('connected', handleOpen));
      cleanupFns.push(wsClient.on('disconnect', handleClose));
      cleanupFns.push(wsClient.on('disconnected', handleClose));
      cleanupFns.push(wsClient.on('error', handleError));
      cleanupFns.push(wsClient.on('message', handleMessage));
      cleanupFns.push(wsClient.on('reconnecting', handleReconnecting));
    } else if (hasDomEventApi) {
      wsClient.addEventListener('open', handleOpen);
      wsClient.addEventListener('close', handleClose);
      wsClient.addEventListener('error', handleError);
      wsClient.addEventListener('message', handleMessage);
      wsClient.addEventListener('reconnecting', handleReconnecting);
    }

    return () => {
      if (hasDomEventApi) {
        wsClient.removeEventListener('open', handleOpen);
        wsClient.removeEventListener('close', handleClose);
        wsClient.removeEventListener('error', handleError);
        wsClient.removeEventListener('message', handleMessage);
        wsClient.removeEventListener('reconnecting', handleReconnecting);
      }
      cleanupFns.forEach(unsub => {
        if (typeof unsub === 'function') {
          unsub();
        }
      });

      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [wsClient, autoHide]);

  // Auto-show on status change
  useEffect(() => {
    if (status !== 'connected') {
      setIsVisible(true);
    }
  }, [status]);

  const currentConfig = statusConfig[status] || statusConfig.disconnected;
  const uptime = connectionTime
    ? Math.floor((new Date() - connectionTime) / 1000)
    : 0;

  const formatUptime = seconds => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const handleClick = () => {
    if (showDetails) {
      setIsVisible(!isVisible);
    }
  };

  if (!isVisible && autoHide && status === 'connected') {
    return (
      <div
        className={`ws-status-mini ${position}`}
        onClick={() => setIsVisible(true)}
        title="WebSocket Connected - Click to show details"
      >
        <div
          className="ws-status-dot connected"
          style={{ backgroundColor: currentConfig.color }}
        />
      </div>
    );
  }

  return (
    <div
      className={`ws-status-indicator ${position} ${isVisible ? 'visible' : 'hidden'}`}
    >
      <div className="ws-status-main" onClick={handleClick} ref={animationRef}>
        <div
          className={`ws-status-icon ${currentConfig.animation}`}
          style={{ color: currentConfig.color }}
        >
          {currentConfig.icon}
        </div>

        <div className="ws-status-info">
          <div className="ws-status-label">WebSocket {currentConfig.label}</div>

          {showDetails && (
            <div className="ws-status-details">
              {status === 'connected' && (
                <>
                  <div className="ws-detail">
                    Uptime: {formatUptime(uptime)}
                  </div>
                  <div className="ws-detail">Messages: {messageCount}</div>
                  {lastMessage && (
                    <div className="ws-detail">
                      Last: {lastMessage.toLocaleTimeString()}
                    </div>
                  )}
                </>
              )}

              {status === 'reconnecting' && retryAttempt > 0 && (
                <div className="ws-detail">Attempt: {retryAttempt}</div>
              )}

              {status === 'error' && (
                <div className="ws-detail">Connection failed</div>
              )}
            </div>
          )}
        </div>

        {currentConfig.pulse && (
          <div
            className="ws-status-pulse"
            style={{ backgroundColor: currentConfig.color }}
          />
        )}
      </div>

      {showDetails && isVisible && (
        <button
          className="ws-status-close"
          onClick={() => setIsVisible(false)}
          title="Hide WebSocket status"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default WebSocketStatusIndicator;
