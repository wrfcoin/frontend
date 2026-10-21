/**
 * Resolve a safe WebSocket URL.
 *
 * In production builds (import.meta.env.PROD), only wss:// is allowed.
 * In development, ws:// is permitted for local testing.
 *
 * Priority:
 *  1. Explicit `url` parameter (if provided and valid)
 *  2. VITE_WEBSOCKET_URL environment variable
 *  3. Protocol-relative default derived from current page origin
 */
export function resolveWsUrl(url) {
  const env = (import.meta && import.meta.env) || {};
  const isDev = Boolean(env.DEV);
  const envUrl = env.VITE_WEBSOCKET_URL || '';
  const hasLocation = typeof location !== 'undefined';

  // Use explicit URL if given, otherwise fall back to env, then derive from origin
  let resolved = url || envUrl;

  if (!resolved) {
    if (!hasLocation) {
      return '/ws';
    }
    // Derive from page origin: https → wss, http → ws (dev only)
    const proto = location.protocol === 'https:' ? 'wss:' : (isDev ? 'ws:' : 'wss:');
    resolved = `${proto}//${location.host}/ws`;
  }

  if (resolved.startsWith('/')) {
    if (!hasLocation) {
      return resolved;
    }
    const proto = location.protocol === 'https:' ? 'wss:' : (isDev ? 'ws:' : 'wss:');
    resolved = `${proto}//${location.host}${resolved}`;
  }

  // In production, enforce wss://
  if (!isDev && resolved.startsWith('ws://')) {
    resolved = resolved.replace(/^ws:\/\//, 'wss://');
  }

  // In development, allow ws:// only for localhost targets.
  if (isDev && resolved.startsWith('ws://')) {
    try {
      const parsed = new URL(resolved);
      const allowedHosts = new Set(['localhost', '127.0.0.1', '::1']);
      if (!allowedHosts.has(parsed.hostname)) {
        throw new Error(
          `In dev, ws:// is allowed only for localhost. Received ${parsed.hostname}`,
        );
      }
    } catch (error) {
      throw new Error(`Invalid WebSocket URL: ${resolved}`, { cause: error });
    }
  }

  return resolved;
}

export function resolveWsOrigin() {
  const env = (import.meta && import.meta.env) || {};
  if (env.DEV) {
    return 'ws://localhost';
  }
  if (typeof location === 'undefined') {
    return 'wss://localhost';
  }
  return `wss://${location.host}`;
}
