import { getWebSocketClient } from '../services/websocketService';
import { devLog } from './logger';

// Event types for NFT execution
export const NFT_EXECUTION_EVENTS = {
  START: 'NFT_EXECUTION_START',
  PROGRESS: 'NFT_EXECUTION_PROGRESS',
  COMPLETE: 'NFT_EXECUTION_COMPLETE',
  ERROR: 'NFT_EXECUTION_ERROR',
  STATUS_UPDATE: 'NFT_EXECUTION_STATUS_UPDATE',
};

class ComputationalWebSocket {
  constructor() {
    this.client = null;
    this.eventHandlers = {};
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000; // in milliseconds
  }

  connect() {
    if (this.client && this.isConnected) {
      return;
    }

    // Create a new WebSocket client
    this.client = getWebSocketClient({
      channels: ['computational'],
      autoReconnect: true,
      maxReconnectAttempts: this.maxReconnectAttempts,
      reconnectInterval: this.reconnectDelay,
    });

    // Set up event handlers
    this.client.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      devLog('Computational WebSocket connection established');
    });

    this.client.on('message', data => {
      try {
        // Check if it's a computational event we care about
        if (
          data.event &&
          Object.values(NFT_EXECUTION_EVENTS).includes(data.event)
        ) {
          this.dispatchEvent(data.event, data.data);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    this.client.on('disconnect', () => {
      this.isConnected = false;
      devLog('Computational WebSocket connection closed');
    });

    this.client.on('error', error => {
      console.error('WebSocket error:', error);
    });

    this.client.on('reconnecting', info => {
      this.reconnectAttempts = info.attempt;
      devLog(
        `WebSocket connection closed. Attempting to reconnect (${info.attempt}/${info.maxAttempts || 'unlimited'})...`,
      );
    });
  }

  disconnect() {
    if (this.client) {
      this.client.disconnect();
      this.client = null;
      this.isConnected = false;
    }
  }

  on(eventName, handler) {
    if (!this.eventHandlers[eventName]) {
      this.eventHandlers[eventName] = [];
    }

    this.eventHandlers[eventName].push(handler);
    return this;
  }

  off(eventName, handler) {
    if (!this.eventHandlers[eventName]) {
      return this;
    }

    if (!handler) {
      delete this.eventHandlers[eventName];
      return this;
    }

    this.eventHandlers[eventName] = this.eventHandlers[eventName].filter(
      h => h !== handler,
    );
    return this;
  }

  dispatchEvent(eventName, data) {
    if (!this.eventHandlers[eventName]) {
      return;
    }

    this.eventHandlers[eventName].forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(
          `Error in WebSocket event handler for ${eventName}:`,
          error,
        );
      }
    });
  }

  // Helper for executing NFTs
  executeNFT(nftId, parameters) {
    if (!this.isConnected) {
      throw new Error('WebSocket not connected. Cannot execute NFT.');
    }

    this.client.send('execute_nft', {
      nftId,
      parameters,
    });
  }

  // Helper for cancelling NFT execution
  cancelExecution(nftId, executionId) {
    if (!this.isConnected) {
      throw new Error('WebSocket not connected. Cannot cancel execution.');
    }

    this.client.send('cancel_execution', {
      nftId,
      executionId,
    });
  }
}

// Create a singleton instance
const computationalWebSocket = new ComputationalWebSocket();

export default computationalWebSocket;
