import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
} from 'react';
import { resolveWsUrl } from '../utils/wsUrl.js';
import { devLog } from '../utils/logger';
import { apiClient } from '../services/apiClient';

/**
 * Mining Context for unified state management across all mining components
 *
 * Manages:
 * - Mining operation state (start/pause/restart)
 * - Real-time statistics and performance data
 * - Configuration settings
 * - Hardware detection and monitoring
 * - Error handling and alerts
 */

export const NODE_STATS_POLL_MS = 15_000;

// Initial state
const initialState = {
  // Mining operation state
  mining: {
    isActive: false,
    isMining: false,
    method: null, // 'cpu', 'gpu', 'subscription', 'one-click'
    startTime: null,
    uptime: 0,
    status: 'idle', // 'idle', 'starting', 'mining', 'paused', 'stopping', 'error'
  },

  // Real-time statistics
  statistics: {
    hashrate: {
      current: 0,
      average: 0,
      peak: 0,
      variance: 0,
    },
    blocks: {
      found: 0,
      accepted: 0,
      rejected: 0,
    },
    rewards: {
      total: 0,
      pending: 0,
      confirmed: 0,
    },
    workers: {
      active: 0,
      total: 0,
      efficiency: [],
    },
    pool: {
      connected: false,
      latency: 0,
      shareAcceptance: 0,
      rejectRate: 0,
    },
  },

  // Real node statistics from GET /api/mining/node-stats (core4-backed):
  // block height, sync status, difficulty, uptime, version. `loadState`
  // is 'unavailable' when the route cannot be read — nothing is invented.
  node: {
    stats: null,
    loadState: 'idle', // 'idle' | 'loading' | 'loaded' | 'unavailable'
    error: null,
    updatedAt: null,
  },

  // Performance monitoring. GET /api/mining/hardware answers 501 (no
  // hardware telemetry from the core4 launch API), so these values are only
  // ever real when a mining WebSocket reports them; `telemetryAvailable`
  // stays false until then (frontend#329 — the former simulator is gone).
  performance: {
    telemetryAvailable: false,
    cpu: {
      usage: 0,
      temperature: 0,
      threads: 0,
    },
    memory: {
      used: 0,
      total: 0,
      utilization: 0,
    },
    gpu: {
      usage: 0,
      temperature: 0,
      memory: { used: 0, total: 0 },
      power: 0,
    },
    network: {
      latency: 0,
      upload: 0,
      download: 0,
    },
  },

  // Configuration
  configuration: {
    wallet: {
      address: '',
      isValid: false,
    },
    hardware: {
      cpu: {
        enabled: true,
        threads: 4,
        priority: 'normal',
      },
      gpu: {
        enabled: true,
        devices: [],
        selectedDevices: [],
        powerLimit: 80,
        temperatureLimit: 80,
        fanSpeed: 'auto',
      },
    },
    pools: {
      primary: {
        url: 'stratum+tcp://pool.wrfcoin.network:3333',
        port: 3333,
        worker: 'worker1',
        password: 'x',
      },
      backup: [],
      failover: {
        enabled: true,
        timeout: 60000,
        retryInterval: 30000,
      },
    },
    algorithm: {
      primary: 'sha256d',
      fallback: 'scrypt',
      autoSwitching: false,
    },
    optimization: {
      autoOptimization: true,
      performanceThreshold: 90,
      thermalThrottling: true,
    },
  },

  // Hardware detection
  hardware: {
    detected: false,
    cpu: {
      cores: 0,
      threads: 0,
      model: '',
      frequency: 0,
    },
    gpu: {
      devices: [],
      totalMemory: 0,
    },
    memory: {
      total: 0,
      available: 0,
    },
  },

  // Error handling and alerts
  alerts: {
    active: [],
    history: [],
    thresholds: {
      cpu: { warning: 70, critical: 85 },
      memory: { warning: 80, critical: 90 },
      gpu: { warning: 75, critical: 85 },
      temperature: { warning: 70, critical: 80 },
    },
  },

  // Connection status
  connection: {
    api: false,
    websocket: false,
    pool: false,
    lastUpdate: null,
  },
};

// Action types
const actionTypes = {
  // Mining operations
  SET_MINING_STATUS: 'SET_MINING_STATUS',
  UPDATE_UPTIME: 'UPDATE_UPTIME',

  // Statistics updates
  UPDATE_STATISTICS: 'UPDATE_STATISTICS',
  UPDATE_HASHRATE: 'UPDATE_HASHRATE',
  UPDATE_BLOCKS: 'UPDATE_BLOCKS',
  UPDATE_REWARDS: 'UPDATE_REWARDS',
  UPDATE_WORKERS: 'UPDATE_WORKERS',
  UPDATE_POOL_STATUS: 'UPDATE_POOL_STATUS',

  // Performance monitoring
  UPDATE_PERFORMANCE: 'UPDATE_PERFORMANCE',
  UPDATE_CPU_METRICS: 'UPDATE_CPU_METRICS',
  UPDATE_GPU_METRICS: 'UPDATE_GPU_METRICS',
  UPDATE_MEMORY_METRICS: 'UPDATE_MEMORY_METRICS',
  UPDATE_NETWORK_METRICS: 'UPDATE_NETWORK_METRICS',

  // Configuration
  UPDATE_CONFIGURATION: 'UPDATE_CONFIGURATION',
  SET_WALLET_ADDRESS: 'SET_WALLET_ADDRESS',
  UPDATE_HARDWARE_CONFIG: 'UPDATE_HARDWARE_CONFIG',
  UPDATE_POOL_CONFIG: 'UPDATE_POOL_CONFIG',
  UPDATE_ALGORITHM_CONFIG: 'UPDATE_ALGORITHM_CONFIG',

  // Hardware detection
  SET_HARDWARE_DETECTED: 'SET_HARDWARE_DETECTED',
  UPDATE_HARDWARE_INFO: 'UPDATE_HARDWARE_INFO',

  // Alerts and errors
  ADD_ALERT: 'ADD_ALERT',
  REMOVE_ALERT: 'REMOVE_ALERT',
  UPDATE_ALERT_THRESHOLDS: 'UPDATE_ALERT_THRESHOLDS',

  // Connection status
  UPDATE_CONNECTION_STATUS: 'UPDATE_CONNECTION_STATUS',
  SET_NODE_STATS: 'SET_NODE_STATS',
};

// Reducer function
const miningReducer = (state, action) => {
  switch (action.type) {
  case actionTypes.SET_MINING_STATUS:
    return {
      ...state,
      mining: {
        ...state.mining,
        ...action.payload,
      },
    };

  case actionTypes.UPDATE_UPTIME:
    return {
      ...state,
      mining: {
        ...state.mining,
        uptime: state.mining.startTime
          ? Math.floor((Date.now() - state.mining.startTime) / 1000)
          : 0,
      },
    };

  case actionTypes.UPDATE_STATISTICS:
    return {
      ...state,
      statistics: {
        ...state.statistics,
        ...action.payload,
      },
    };

  case actionTypes.UPDATE_HASHRATE:
    return {
      ...state,
      statistics: {
        ...state.statistics,
        hashrate: {
          ...state.statistics.hashrate,
          ...action.payload,
        },
      },
    };

  case actionTypes.UPDATE_PERFORMANCE:
    return {
      ...state,
      performance: {
        ...state.performance,
        ...action.payload,
        telemetryAvailable: true,
      },
    };

  case actionTypes.UPDATE_CONFIGURATION:
    return {
      ...state,
      configuration: {
        ...state.configuration,
        ...action.payload,
      },
    };

  case actionTypes.SET_WALLET_ADDRESS:
    return {
      ...state,
      configuration: {
        ...state.configuration,
        wallet: {
          address: action.payload.address,
          isValid: action.payload.isValid,
        },
      },
    };

  case actionTypes.UPDATE_HARDWARE_CONFIG:
    return {
      ...state,
      configuration: {
        ...state.configuration,
        hardware: {
          ...state.configuration.hardware,
          ...action.payload,
        },
      },
    };

  case actionTypes.SET_HARDWARE_DETECTED:
    return {
      ...state,
      hardware: {
        ...state.hardware,
        detected: true,
        ...action.payload,
      },
    };

  case actionTypes.ADD_ALERT:
    return {
      ...state,
      alerts: {
        ...state.alerts,
        active: [...state.alerts.active, action.payload],
        history: [...state.alerts.history, action.payload],
      },
    };

  case actionTypes.REMOVE_ALERT:
    return {
      ...state,
      alerts: {
        ...state.alerts,
        active: state.alerts.active.filter(
          alert => alert.id !== action.payload.id,
        ),
      },
    };

  case actionTypes.SET_NODE_STATS:
    return {
      ...state,
      node: { ...state.node, ...action.payload },
    };

  case actionTypes.UPDATE_CONNECTION_STATUS:
    return {
      ...state,
      connection: {
        ...state.connection,
        ...action.payload,
        lastUpdate: Date.now(),
      },
    };

  default:
    return state;
  }
};

// Create context
const MiningContext = createContext();

// Context provider component
export const MiningProvider = ({ children }) => {
  const [state, dispatch] = useReducer(miningReducer, initialState);
  const wsRef = useRef(null);
  const intervalRef = useRef(null);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const miningWsUrl = import.meta.env.VITE_MINING_WS_URL
          ? resolveWsUrl(import.meta.env.VITE_MINING_WS_URL)
          : (import.meta.env.DEV
            ? 'ws://localhost:4002/mining'
            : `wss://${location.host}/ws/mining`);
        wsRef.current = new WebSocket(miningWsUrl);

        wsRef.current.onopen = () => {
          devLog('Connected to mining WebSocket');
          dispatch({
            type: actionTypes.UPDATE_CONNECTION_STATUS,
            payload: { websocket: true },
          });
        };

        wsRef.current.onmessage = event => {
          try {
            const data = JSON.parse(event.data);

            switch (data.type) {
            case 'statistics':
              dispatch({
                type: actionTypes.UPDATE_STATISTICS,
                payload: data.payload,
              });
              break;

            case 'performance':
              dispatch({
                type: actionTypes.UPDATE_PERFORMANCE,
                payload: data.payload,
              });
              break;

            case 'mining_status':
              dispatch({
                type: actionTypes.SET_MINING_STATUS,
                payload: data.payload,
              });
              break;

            case 'alert':
              dispatch({
                type: actionTypes.ADD_ALERT,
                payload: data.payload,
              });
              break;

            default:
              devLog('Unknown WebSocket message type:', data.type);
            }
          } catch (error) {
            console.warn('Error parsing WebSocket message:', error);
          }
        };

        wsRef.current.onclose = () => {
          devLog(
            'Mining WebSocket connection closed, attempting to reconnect...',
          );
          dispatch({
            type: actionTypes.UPDATE_CONNECTION_STATUS,
            payload: { websocket: false },
          });
          setTimeout(connectWebSocket, 5000);
        };

        wsRef.current.onerror = error => {
          console.warn('Mining WebSocket error:', error);
          dispatch({
            type: actionTypes.UPDATE_CONNECTION_STATUS,
            payload: { websocket: false },
          });
        };
      } catch (error) {
        // frontend#329: no simulated fallback. Without the WebSocket the
        // hashrate/hardware panels stay at their unavailable state.
        console.warn('Failed to connect to mining WebSocket:', error);
      }
    };

    // Start WebSocket connection
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Real node statistics, polled from the mounted /api/mining/node-stats
  // route (core4 mining/sync/resources/network reads). Replaces the former
  // random-value simulator (frontend#329).
  useEffect(() => {
    let active = true;
    const fetchNodeStats = async () => {
      dispatch({ type: actionTypes.SET_NODE_STATS, payload: { loadState: 'loading' } });
      try {
        const body = await apiClient.get('/mining/node-stats');
        if (!active) return;
        const stats = body && typeof body === 'object' && body.data && typeof body.data === 'object' ? body.data : null;
        if (!stats) throw new Error('node-stats response had no data');
        dispatch({
          type: actionTypes.SET_NODE_STATS,
          payload: { stats, loadState: 'loaded', error: null, updatedAt: new Date().toISOString() },
        });
      } catch (error) {
        if (!active) return;
        dispatch({
          type: actionTypes.SET_NODE_STATS,
          payload: {
            stats: null,
            loadState: 'unavailable',
            error: error instanceof Error ? error.message : String(error),
          },
        });
      }
    };
    fetchNodeStats();
    intervalRef.current = setInterval(fetchNodeStats, NODE_STATS_POLL_MS);
    return () => {
      active = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Update uptime when mining is active
  useEffect(() => {
    let uptimeInterval;

    if (state.mining.isMining && state.mining.startTime) {
      uptimeInterval = setInterval(() => {
        dispatch({ type: actionTypes.UPDATE_UPTIME });
      }, 1000);
    }

    return () => {
      if (uptimeInterval) clearInterval(uptimeInterval);
    };
  }, [state.mining.isMining, state.mining.startTime]);


  // Action creators
  const actions = {
    // No start/stop/pause/resume here (frontend#355): contribution runs on
    // the station collector, and nothing in the browser controls it.

    // Configuration updates
    updateConfiguration: config => {
      dispatch({
        type: actionTypes.UPDATE_CONFIGURATION,
        payload: config,
      });
    },

    setWalletAddress: address => {
      const isValid = address && address.length >= 26; // Basic validation
      dispatch({
        type: actionTypes.SET_WALLET_ADDRESS,
        payload: { address, isValid },
      });
    },

    updateHardwareConfig: hardwareConfig => {
      dispatch({
        type: actionTypes.UPDATE_HARDWARE_CONFIG,
        payload: hardwareConfig,
      });
    },

    // Hardware detection
    setHardwareDetected: hardwareInfo => {
      dispatch({
        type: actionTypes.SET_HARDWARE_DETECTED,
        payload: hardwareInfo,
      });
    },

    // Alerts
    addAlert: alert => {
      const alertWithId = {
        ...alert,
        id: `alert_${Date.now()}`,
        timestamp: new Date(),
      };
      dispatch({
        type: actionTypes.ADD_ALERT,
        payload: alertWithId,
      });
    },

    removeAlert: alertId => {
      dispatch({
        type: actionTypes.REMOVE_ALERT,
        payload: { id: alertId },
      });
    },

    // Connection status
    updateConnectionStatus: status => {
      dispatch({
        type: actionTypes.UPDATE_CONNECTION_STATUS,
        payload: status,
      });
    },
  };

  const value = {
    state,
    actions,
    dispatch,
  };

  return (
    <MiningContext.Provider value={value}>{children}</MiningContext.Provider>
  );
};

// Custom hook to use mining context
export const useMining = () => {
  const context = useContext(MiningContext);
  if (!context) {
    throw new Error('useMining must be used within a MiningProvider');
  }
  return context;
};

export { actionTypes };
export default MiningContext;
