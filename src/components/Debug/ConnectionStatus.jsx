import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Alert,
} from '@mui/material';
import { getWebSocketClient } from '../../services/websocketService';

/**
 * ConnectionStatus Component
 * Displays the status of various backend connections
 * Useful for debugging connection issues
 */
const ConnectionStatus = () => {
  const [wsStatus, setWsStatus] = useState('initializing');
  const [lastPing, setLastPing] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    const wsClient = getWebSocketClient({
      channels: ['blocks'],
      autoReconnect: true,
    });

    wsClient.on('connect', () => {
      setWsStatus('connected');
    });

    wsClient.on('disconnect', () => {
      setWsStatus('disconnected');
    });

    wsClient.on('error', () => {
      setWsStatus('error');
    });

    wsClient.on('PING', (data) => {
      setLastPing(new Date().toLocaleTimeString());
    });

    wsClient.on('message', (data) => {
      setLastMessage(JSON.stringify(data));
    });

    const checkApi = async () => {
      try {
        const response = await fetch('/api/status');
        if (response.ok) {
          setApiStatus('online');
        } else {
          setApiStatus('error');
        }
      } catch (error) {
        setApiStatus('offline');
      }
    };

    checkApi();

    return () => {
      wsClient.disconnect();
    };
  }, []);

  return (
    <Box className="connection-status-panel" sx={{ mb: 4 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>Connection Status</Typography>

      <Card sx={{ mb: 3 }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1">WebSocket Connection</Typography>
              <div className={`status-indicator ${wsStatus === 'connected' ? 'online' : 'offline'}`}></div>
            </Box>
          }
        />
        <CardContent>
          <Box sx={{ mb: 2 }}>
            <strong>Status:</strong> {wsStatus}
          </Box>
          <Box sx={{ mb: 2 }}>
            <strong>Last Ping:</strong> {lastPing || 'N/A'}
          </Box>
          {lastMessage && (
            <Box sx={{ mb: 2 }}>
              <strong>Last Message:</strong>
              <pre style={{ fontSize: '0.875rem', backgroundColor: '#f5f5f5', padding: '0.5rem', marginTop: '0.25rem', borderRadius: '4px', maxHeight: 100, overflowY: 'auto' }}>{lastMessage}</pre>
            </Box>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1">API Connection</Typography>
              <div className={`status-indicator ${apiStatus === 'online' ? 'online' : 'offline'}`}></div>
            </Box>
          }
        />
        <CardContent>
          <Box sx={{ mb: 2 }}>
            <strong>Status:</strong> {apiStatus}
          </Box>
          {apiStatus === 'error' && (
            <Alert severity="warning">
              API is responding but returned an error status
            </Alert>
          )}
          {apiStatus === 'offline' && (
            <Alert severity="error">
              Cannot connect to API server
            </Alert>
          )}
        </CardContent>
      </Card>

      <style jsx>{`
        .status-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
        .status-indicator.online {
          background-color: #28a745;
        }
        .status-indicator.offline {
          background-color: #dc3545;
        }
      `}</style>
    </Box>
  );
};

export default ConnectionStatus;
