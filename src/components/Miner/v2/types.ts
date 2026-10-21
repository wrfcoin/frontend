// @cohesion: hand-written; mining hardware dashboard domain is frontend-only.
// No generated equivalent in @wrfcoin/generated-types (which covers weather/environmental
// observation types). HardwareDevice, PoolConnection, PerformanceMetric are UI-layer only.
// reviewed 2026-06-18: no overlap with generated-types.

/**
 * Shared TypeScript interfaces for v2 Mining Dashboard components
 */

export interface TemperatureReading {
  time: number;
  temp: number;
}

export interface HardwareDevice {
  id: string;
  name: string;
  model: string;
  type: 'cpu' | 'gpu' | 'memory';
  usage: number;
  temperature: number;
  maxTemp: number;
  fanSpeed: number;
  fanMax: number;
  isActive: boolean;
  temperatureHistory: TemperatureReading[];
}

export interface PoolWorkers {
  active: number;
  idle: number;
  offline: number;
}

export interface PoolConnection {
  id: number;
  name: string;
  url: string;
  connected: boolean;
  latency: number;
  shares: number;
  acceptRate: number;
  uptime: number;
  workers: PoolWorkers;
  latencyHistory: number[];
  isPrimary: boolean;
  healthScore: number;
}

export interface PerformanceMetric {
  label: string;
  value: string;
  unit: string;
  change: number;
  history: { time: number; value: number }[];
  color: string;
}
