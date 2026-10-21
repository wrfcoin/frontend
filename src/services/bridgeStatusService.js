/**
 * Bridge Status Service
 * Real-time monitoring of bridge protocols using global WebSocket service
 */

import { getWebSocketClient } from './websocketService';
import { devLog } from '../utils/logger';

class BridgeStatusService {
  constructor() {
    this._wsClient = null;
    this._unsubConnected = null;
    this._unsubMessage = null;
    this._unsubError = null;
    this.subscribers = new Set();
    this.bridgeStatus = new Map();
    this.isConnected = false;
  }

  // Initialize connection via global WebSocket service
  async connect() {
    try {
      const wsClient = getWebSocketClient();
      this._wsClient = wsClient;
      wsClient.subscribe('bridge-status');

      this._unsubConnected = wsClient.on('connected', () => {
        devLog('Bridge status connected via global WebSocket');
        this.isConnected = true;
        this.requestBridgeStatus();
      });

      this._unsubMessage = wsClient.on('message', (data) => {
        this.handleStatusUpdate(data);
      });

      this._unsubError = wsClient.on('error', () => {
        console.warn('Bridge status WebSocket error');
      });

      wsClient.connect();

      if (wsClient.status === 'connected') {
        this.isConnected = true;
        this.requestBridgeStatus();
      }
    } catch (error) {
      console.error('Failed to establish bridge status connection:', error);
      this.startHttpPolling();
    }
  }

  // HTTP polling fallback
  startHttpPolling() {
    this.pollInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/bridge/status');
        if (response.ok) {
          const data = await response.json();
          this.handleStatusUpdate(data);
        }
      } catch (error) {
        console.warn('Bridge status polling failed:', error);
      }
    }, 5000); // Poll every 5 seconds
  }

  // Handle real-time status updates
  handleStatusUpdate(data) {
    if (data.type === 'bridge_status') {
      this.bridgeStatus.set(data.bridgeId, {
        ...data.status,
        lastUpdate: Date.now(),
      });
      this.notifySubscribers(data.bridgeId, data.status);
    } else if (data.type === 'all_bridges') {
      data.bridges.forEach(bridge => {
        this.bridgeStatus.set(bridge.id, {
          ...bridge,
          lastUpdate: Date.now(),
        });
      });
      this.notifySubscribers('all', data.bridges);
    }
  }

  // Request current bridge status
  requestBridgeStatus() {
    if (this._wsClient) {
      this._wsClient.send('get_bridge_status', { bridges: ['all'] });
    }
  }

  // Subscribe to bridge status updates
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  // Notify all subscribers of updates
  notifySubscribers(bridgeId, status) {
    this.subscribers.forEach(callback => {
      try {
        callback(bridgeId, status);
      } catch (error) {
        console.error('Subscriber callback error:', error);
      }
    });
  }

  // Get current status for a specific bridge
  // frontend#329: no invented status. A bridge the WebSocket / poll has not
  // reported is `null` — callers render "unavailable", never a placeholder.
  getBridgeStatus(bridgeId) {
    return this.bridgeStatus.get(bridgeId) || null;
  }

  // Get all bridge statuses
  getAllBridgeStatuses() {
    const statuses = {};
    const bridgeIds = [
      'axelar',
      'layerzero',
      'wormhole',
      'chainlink-ccip',
      'chainflip',
      'celer-cbridge',
      'thorchain',
      'near-rainbow',
      'optimism',
      'base',
      'cosmos-ibc',
      'interledger',
      'polkadot-xcmp',
    ];

    bridgeIds.forEach(id => {
      statuses[id] = this.getBridgeStatus(id);
    });

    return statuses;
  }


  // Calculate optimal route based on cost, speed, and reliability
  calculateOptimalRoute(routes) {
    return routes
      .map(route => ({
        ...route,
        score: this.calculateRouteScore(route),
      }))
      .sort((a, b) => b.score - a.score);
  }

  calculateRouteScore(route) {
    const status = this.getBridgeStatus(route.bridge);
    if (!status || !status.avgTransactionTime || !status.currentFee || typeof status.uptime !== 'number') {
      return 0;
    }

    // Weight factors
    const speedWeight = 0.3;
    const costWeight = 0.4;
    const reliabilityWeight = 0.3;

    // Calculate scores (0-100)
    const speedScore = Math.max(
      0,
      100 - parseFloat(status.avgTransactionTime.split(' ')[0]) * 10,
    );
    const costScore = Math.max(
      0,
      100 - parseFloat(status.currentFee.replace('%', '')) * 1000,
    );
    const reliabilityScore = status.uptime;

    return (
      speedScore * speedWeight +
      costScore * costWeight +
      reliabilityScore * reliabilityWeight
    );
  }

  // Get real-time fee estimate
  async getFeeEstimate(bridgeId, amount, sourceChain, destChain) {
    try {
      const response = await fetch('/api/bridge/fee-estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bridgeId, amount, sourceChain, destChain }),
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Failed to fetch real-time fee estimate:', error);
    }

    // Fallback: only from a status the service really received; otherwise the
    // estimate is unknown (frontend#329 — no invented fee).
    const status = this.getBridgeStatus(bridgeId);
    if (!status || !status.currentFee || !status.gasEstimate) {
      return null;
    }
    const baseFee = parseFloat(status.currentFee.replace('%', '')) / 100;
    const feeAmount = parseFloat(amount) * baseFee;

    return {
      bridgeFee: feeAmount.toFixed(6),
      gasFee: status.gasEstimate,
      totalFee: (
        feeAmount + parseFloat(status.gasEstimate.replace('$', ''))
      ).toFixed(2),
      estimatedTime: status.avgTransactionTime,
    };
  }

  // Disconnect and cleanup
  disconnect() {
    // Clean up global WebSocket service subscriptions
    [this._unsubConnected, this._unsubMessage, this._unsubError].forEach(unsub => {
      if (typeof unsub === 'function') unsub();
    });
    this._wsClient = null;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.subscribers.clear();
    this.bridgeStatus.clear();
    this.isConnected = false;
  }
}

// Export singleton instance
export default new BridgeStatusService();
