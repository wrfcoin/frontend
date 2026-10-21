import { useState, useEffect, useRef, useCallback } from 'react';
import { SensorData } from '../services/api';
import { resolveWsUrl } from '../utils/wsUrl.js';
import { devLog } from '../utils/logger';

interface UseIoTWebSocketOptions {
  location?: string;
  platforms?: string[];
  dataTypes?: string[];
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onData?: (data: SensorData) => void;
  onError?: (error: Event) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

interface UseIoTWebSocketReturn {
  data: SensorData[];
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  clearData: () => void;
  sendMessage: (message: any) => void;
}

export const useIoTWebSocket = (
  url: string,
  options: UseIoTWebSocketOptions = {},
): UseIoTWebSocketReturn => {
  const {
    location = 'all',
    platforms = [],
    dataTypes = [],
    autoReconnect = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
    onData,
    onError,
    onConnect,
    onDisconnect,
  } = options;

  const [data, setData] = useState<SensorData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnectRef = useRef(true);

  const buildWebSocketUrl = useCallback(() => {
    const baseUrl = resolveWsUrl(import.meta.env.VITE_IOT_WS_URL || '');
    const params = new URLSearchParams();
    if (location !== 'all') params.append('location', location);
    if (platforms.length > 0) params.append('platforms', platforms.join(','));
    if (dataTypes.length > 0) params.append('dataTypes', dataTypes.join(','));
    return `${baseUrl}${url}${params.toString() ? `?${params.toString()}` : ''}`;
  }, [url, location, platforms, dataTypes]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.warn('WebSocket is already connected');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const wsUrl = buildWebSocketUrl();
      devLog('Connecting to WebSocket:', wsUrl);

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        devLog('WebSocket connected');
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        reconnectAttemptsRef.current = 0;
        onConnect?.();
      };

      wsRef.current.onmessage = event => {
        try {
          const messageData = JSON.parse(event.data);

          if (messageData.type === 'sensor_data') {
            const sensorData: SensorData = messageData.data;
            setData(prev => {
              const newData = [...prev, sensorData];
              // Keep only last 1000 data points
              return newData.slice(-1000);
            });
            onData?.(sensorData);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
          setError('Invalid data received from server');
        }
      };

      wsRef.current.onclose = event => {
        devLog('WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);
        onDisconnect?.();

        // Attempt to reconnect if enabled and not manually closed
        if (
          autoReconnect &&
          shouldReconnectRef.current &&
          reconnectAttemptsRef.current < maxReconnectAttempts &&
          event.code !== 1000 // Don't reconnect if it was a normal closure
        ) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(
            reconnectInterval * Math.pow(2, reconnectAttemptsRef.current - 1),
            30000,
          );

          devLog(
            `Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`,
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            if (shouldReconnectRef.current) {
              connect();
            }
          }, delay);
        }
      };

      wsRef.current.onerror = event => {
        console.error('WebSocket error:', event);
        setError('Connection error occurred');
        setIsConnecting(false);
        onError?.(event);
      };
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setError('Failed to create connection');
      setIsConnecting(false);
    }
  }, [
    buildWebSocketUrl,
    autoReconnect,
    reconnectInterval,
    maxReconnectAttempts,
    onConnect,
    onData,
    onDisconnect,
    onError,
  ]);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const clearData = useCallback(() => {
    setData([]);
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected, cannot send message');
      setError('Not connected - cannot send message');
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Reconnect when dependencies change
  useEffect(() => {
    if (isConnected) {
      disconnect();
      setTimeout(connect, 100); // Small delay to ensure clean reconnection
    }
  }, [location, platforms, dataTypes]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    data,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    clearData,
    sendMessage,
  };
};

export default useIoTWebSocket;
