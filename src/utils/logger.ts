/**
 * Frontend Logger Utility for WRFCoin Platform
 *
 * Environment-aware logging with namespace support.
 * - Development: all levels output to console
 * - Production: only warn and error output
 *
 * Usage:
 *   import { createLogger } from '@/utils/logger';
 *   const log = createLogger('api');
 *   log.error('Request failed:', error);
 *   log.info('Cache hit for key:', key);
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
import { sanitizeWalletMetadata } from './walletPrivacy.ts';

// Drop-in replacement for console.log that is a no-op in production builds.
// Vite replaces import.meta.env.PROD with `true` at build time, letting the
// minifier tree-shake the console.log branch entirely.
const _isProd =
  typeof import.meta !== 'undefined' && (import.meta as any).env?.PROD === true;
export const devLog: (...args: unknown[]) => void = _isProd
  ? () => {}
  : (...args: unknown[]) => { console.log(...args); };

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getMinLevel(): number {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.PROD) {
    return LOG_LEVELS.warn;
  }
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
    return LOG_LEVELS.warn;
  }
  return LOG_LEVELS.debug;
}

export interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

export function createLogger(namespace: string): Logger {
  const minLevel = getMinLevel();
  const prefix = `[${namespace}]`;
  const sanitize = (args: unknown[]) =>
    args.map(arg => (typeof arg === 'object' ? sanitizeWalletMetadata(arg) : arg));

  return {
    debug(...args: unknown[]) {
      if (minLevel <= LOG_LEVELS.debug) {
        console.debug(prefix, ...sanitize(args));
      }
    },
    info(...args: unknown[]) {
      if (minLevel <= LOG_LEVELS.info) {
        console.info(prefix, ...sanitize(args));
      }
    },
    warn(...args: unknown[]) {
      if (minLevel <= LOG_LEVELS.warn) {
        console.warn(prefix, ...sanitize(args));
      }
    },
    error(...args: unknown[]) {
      if (minLevel <= LOG_LEVELS.error) {
        console.error(prefix, ...sanitize(args));
      }
    },
  };
}
