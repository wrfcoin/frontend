import { useState, useEffect, useCallback } from 'react';
import { getWebSocketClient } from '../services/websocketService';

// Types
type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface WebSocketMessage {
  event: string;
  data: any;
  timestamp: number;
}

interface UseWebSocketOptions {
  channels?: string[];
  onMessage?: (event: string, data: any) => void;
}

interface UseWebSocketReturn {
  status: ConnectionStatus;
  data: WebSocketMessage | null;
  reconnect: () => void;
  disconnect: () => void;
  sendMessage: (event: string, data?: any) => boolean;
  isConnected: boolean;
}

/**
 * Custom hook for WebSocket communication
 * This hook uses the global WebSocket client from websocketService.ts
 */
const useWebSocket = (
  options: UseWebSocketOptions | string = {},
): UseWebSocketReturn => {
  const { channels = ['blocks'], onMessage = null } =
    typeof options === 'string' ? { channels: [options] } : options;

  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [client, setClient] = useState<ReturnType<
    typeof getWebSocketClient
  > | null>(null);

  // Handle messages
  const handleMessage = useCallback(
    (event: string, data: any) => {
      setLastMessage({ event, data, timestamp: Date.now() });

      if (onMessage && typeof onMessage === 'function') {
        onMessage(event, data);
      }
    },
    [onMessage],
  );

  // Set up WebSocket connection
  useEffect(() => {
    // Get the global WebSocket client
    const wsClient = getWebSocketClient();
    setClient(wsClient);

    // Set initial status
    setStatus(wsClient.status);

    // Set up event listeners
    const connectHandler = () => setStatus('connected');
    const disconnectHandler = () => setStatus('disconnected');
    const errorHandler = () => setStatus('error');
    const messageHandler = (data: any) => {
      if (data && data.event) {
        handleMessage(data.event, data.data);
      }
    };

    // Register event handlers
    const unsubscribeConnect = wsClient.on('connect', connectHandler);
    const unsubscribeDisconnect = wsClient.on('disconnect', disconnectHandler);
    const unsubscribeError = wsClient.on('error', errorHandler);
    const unsubscribeMessage = wsClient.on('message', messageHandler);

    // Subscribe to channels
    if (Array.isArray(channels)) {
      wsClient.addChannels(channels);
    } else if (channels) {
      wsClient.addChannels([channels]);
    }

    // Clean up on unmount
    return () => {
      if (unsubscribeConnect && typeof unsubscribeConnect === 'function') {
        unsubscribeConnect();
      }
      if (
        unsubscribeDisconnect &&
        typeof unsubscribeDisconnect === 'function'
      ) {
        unsubscribeDisconnect();
      }
      if (unsubscribeError && typeof unsubscribeError === 'function') {
        unsubscribeError();
      }
      if (unsubscribeMessage && typeof unsubscribeMessage === 'function') {
        unsubscribeMessage();
      }
    };
  }, [channels, handleMessage]);

  // Function to manually reconnect
  const reconnect = useCallback(() => {
    if (client) {
      client.disconnect();
      setTimeout(() => client.connect(), 1000);
      setStatus('connecting');
    }
  }, [client]);

  // Function to disconnect
  const disconnect = useCallback(() => {
    if (client) {
      client.disconnect();
      setStatus('disconnected');
    }
  }, [client]);

  // Function to send a message
  const sendMessage = useCallback(
    (event: string, data?: any): boolean => {
      if (client && status === 'connected') {
        return client.send(event, data);
      }
      return false;
    },
    [client, status],
  );

  return {
    status,
    data: lastMessage,
    reconnect,
    disconnect,
    sendMessage,
    isConnected: status === 'connected',
  };
};

export default useWebSocket;
