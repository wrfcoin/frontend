/**
 * WebSocket Service for Wrfcoin Frontend - TypeScript Implementation
 * Handles real-time blockchain data connections
 */
import { resolveWsUrl } from '../utils/wsUrl.js';
import { devLog } from '../utils/logger';

// Types
type EventListener = (...args: any[]) => void;
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface WebSocketMessage {
  type?: string;
  event?: string;
  channel?: string;
  data?: any;
}

interface WebSocketOptions {
  url?: string;
  channels?: string[];
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
  pingInterval?: number;
}

interface ReconnectInfo {
  attempt: number;
  maxAttempts: number;
}

interface WebSocketClient {
  connect(): void;
  disconnect(): void;
  send(event: string, data?: any): boolean;
  subscribe(channel: string): void;
  unsubscribe(channel: string): void;
  addChannels(channels: string[]): void;
  on(event: string, listener: EventListener): () => void;
  off(event: string, listener: EventListener): void;
  once(event: string, listener: EventListener): void;
  readonly status: ConnectionStatus;
}

// Simple EventEmitter implementation
class EventEmitter {
  private events: Record<string, EventListener[]> = {};

  on(event: string, listener: EventListener): () => void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return () => this.off(event, listener);
  }

  off(event: string, listener: EventListener): void {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }

  emit(event: string, ...args: any[]): void {
    if (!this.events[event]) return;
    this.events[event].forEach(listener => {
      try {
        listener(...args);
      } catch (error) {
        console.error('Event listener error:', error);
      }
    });
  }

  once(event: string, listener: EventListener): void {
    const remove = this.on(event, (...args) => {
      remove();
      listener(...args);
    });
  }
}

// WebSocket connection status
const CONNECTION_STATUS: Record<string, ConnectionStatus> = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error',
};

// Create WebSocket client
const createWsClient = (options: WebSocketOptions = {}): WebSocketClient => {
  const {
    channels = ['blocks'],
    autoReconnect = true,
    maxReconnectAttempts = 5,
    reconnectInterval = 3000,
    pingInterval = 45000,
  } = options;

  // Internal state
  let ws: WebSocket | null = null;
  let status: ConnectionStatus = CONNECTION_STATUS.DISCONNECTED;
  let reconnectAttempts = 0;
  let reconnectTimer: NodeJS.Timeout | null = null;
  let pingTimer: NodeJS.Timeout | null = null;
  let subscriptions = new Set<string>([...channels]);
  const messageQueue: string[] = [];

  // Event emitter for this client
  const emitter = new EventEmitter();

  // Flush queued messages when connection opens
  const flushMessageQueue = (): void => {
    while (messageQueue.length > 0 && ws && ws.readyState === WebSocket.OPEN) {
      const msg = messageQueue.shift();
      if (msg) ws.send(msg);
    }
  };

  // Get WebSocket URL
  const getWsUrl = (): string => resolveWsUrl(options.url);

  // Connect to WebSocket
  const connect = (): void => {
    if (
      ws &&
      (ws.readyState === WebSocket.CONNECTING ||
        ws.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    status = CONNECTION_STATUS.CONNECTING;

    try {
      ws = new WebSocket(getWsUrl());

      ws.onopen = () => {
        devLog('WebSocket connected successfully');
        status = CONNECTION_STATUS.CONNECTED;
        reconnectAttempts = 0;

        // Clear reconnect timer
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }

        // Subscribe to channels
        // core4 websocket.rs ClientMessage uses #[serde(tag = "action")] — must use "action" key
        subscriptions.forEach(channel => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ action: 'subscribe', channel }));
          }
        });

        // Flush any messages queued while disconnected (after subscriptions)
        flushMessageQueue();

        emitter.emit('connected');
        emitter.emit('connect');
      };

      ws.onmessage = event => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          emitter.emit('message', data);

          if (data.channel) {
            emitter.emit(`channel:${data.channel}`, data);
          }
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };

      ws.onclose = event => {
        devLog('WebSocket closed:', event.code, event.reason);
        status = CONNECTION_STATUS.DISCONNECTED;
        ws = null;

        emitter.emit('disconnected');

        // Stop ping
        stopPing();

        // Handle reconnection
        if (autoReconnect && reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          devLog(
            `Reconnecting (${reconnectAttempts}/${maxReconnectAttempts}) in ${reconnectInterval}ms...`,
          );

          reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            connect();
          }, reconnectInterval);

          const reconnectInfo: ReconnectInfo = {
            attempt: reconnectAttempts,
            maxAttempts: maxReconnectAttempts,
          };
          emitter.emit('reconnecting', reconnectInfo);
          emitter.emit('disconnect', event);
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          devLog(
            `Maximum reconnect attempts reached (${maxReconnectAttempts})`,
          );
          emitter.emit('maxReconnectsReached');
        }
      };

      ws.onerror = error => {
        console.error('WebSocket error:', error);
        status = CONNECTION_STATUS.ERROR;
        emitter.emit('error', {
          error,
          reconnectAttempts,
          maxReconnectAttempts,
          url: getWsUrl(),
        });
        // Stop reconnecting if we've hit max attempts
        if (reconnectAttempts >= maxReconnectAttempts) {
          return;
        }
      };
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      status = CONNECTION_STATUS.ERROR;
    }
  };

  // NOTE: Application-level ping removed — core4 WS uses protocol-level Ping/Pong frames
  // (handled natively by the browser WebSocket implementation). Sending { type: 'ping' }
  // would reach the server's ClientMessage deserializer, fail to match, and generate
  // spurious error frames. The browser keeps the TCP connection alive automatically.
  const startPing = (): void => { /* no-op: protocol-level keepalive handled by browser */ };
  const stopPing = (): void => {
    if (pingTimer) {
      clearInterval(pingTimer);
      pingTimer = null;
    }
  };

  // Send message (queues if not connected)
  const send = (event: string, data: any = {}): boolean => {
    const msg = JSON.stringify({ event, data });
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
      return true;
    }
    // Queue message for delivery when connection is restored
    messageQueue.push(msg);
    return false;
  };

  // Subscribe to channel
  // core4 websocket.rs ClientMessage uses #[serde(tag = "action")] — must use "action" key
  const subscribe = (channel: string): void => {
    subscriptions.add(channel);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: 'subscribe', channel }));
    }
  };

  // Unsubscribe from channel
  const unsubscribe = (channel: string): void => {
    subscriptions.delete(channel);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: 'unsubscribe', channel }));
    }
  };

  // Disconnect
  const disconnect = (): void => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    stopPing();

    if (ws) {
      ws.close();
      ws = null;
    }

    status = CONNECTION_STATUS.DISCONNECTED;
  };

  // Get connection status
  const getStatus = (): ConnectionStatus => status;

  // Public API
  return {
    connect,
    disconnect,
    send,
    subscribe,
    unsubscribe,
    addChannels: (channels: string[]): void => {
      // Support for legacy addChannels method
      if (Array.isArray(channels)) {
        channels.forEach(channel => subscribe(channel));
      }
    },
    on: emitter.on.bind(emitter),
    off: emitter.off.bind(emitter),
    once: emitter.once.bind(emitter),
    get status(): ConnectionStatus {
      return getStatus();
    },
  };
};

// Global WebSocket client instance
let globalWsClient: WebSocketClient | null = null;

// Get or create global WebSocket client
export const getWebSocketClient = (
  options: WebSocketOptions = {},
): WebSocketClient => {
  if (!globalWsClient) {
    globalWsClient = createWsClient(options);
  }
  return globalWsClient;
};

// WebSocket Service class for React components
export class WebSocketService {
  private client: WebSocketClient;
  private subscriptions = new Map<string, EventListener>();

  constructor(options: WebSocketOptions = {}) {
    this.client = getWebSocketClient(options);
  }

  subscribe(channel: string, callback: EventListener): void {
    this.client.subscribe(channel);
    this.client.on(`channel:${channel}`, callback);
    this.subscriptions.set(channel, callback);
  }

  unsubscribe(channel: string): void {
    const callback = this.subscriptions.get(channel);
    if (callback) {
      this.client.off(`channel:${channel}`, callback);
      this.client.unsubscribe(channel);
      this.subscriptions.delete(channel);
    }
  }

  send(event: string, data?: any): boolean {
    return this.client.send(event, data);
  }

  on(event: string, callback: EventListener): void {
    this.client.on(event, callback);
  }

  off(event: string, callback: EventListener): void {
    this.client.off(event, callback);
  }

  reconnect(): void {
    this.client.disconnect();
    setTimeout(() => this.client.connect(), 1000);
  }

  get status(): ConnectionStatus {
    return this.client.status;
  }
}

// Create a default instance and add the getWebSocketClient method
const defaultWebSocketService = new WebSocketService();

// Extend the WebSocketService to include the getWebSocketClient method
interface ExtendedWebSocketService extends WebSocketService {
  getWebSocketClient(options?: WebSocketOptions): WebSocketClient;
}

(defaultWebSocketService as ExtendedWebSocketService).getWebSocketClient =
  getWebSocketClient;

// Default export
export default defaultWebSocketService;
