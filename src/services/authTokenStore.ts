/**
 * In-memory auth token store.
 *
 * Tokens are held in a module-scoped variable instead of localStorage or
 * sessionStorage, preventing XSS from reading them via `document.cookie`,
 * `localStorage.getItem`, or `sessionStorage.getItem`.
 *
 * The store is intentionally volatile — tokens are lost on page refresh.
 * The auth flow should re-authenticate via httpOnly cookie or refresh token.
 */

let _token: string = '';
const _listeners = new Set<() => void>();

function _write(token: string): void {
  if (token === _token) return;
  _token = token;
  for (const listener of Array.from(_listeners)) listener();
}

/**
 * Be told whenever the token changes (login, refresh, logout, refresh
 * failure). Returns the unsubscribe function; shaped for useSyncExternalStore.
 */
export function subscribeAuthToken(listener: () => void): () => void {
  _listeners.add(listener);
  return () => {
    _listeners.delete(listener);
  };
}

/** Set the current auth token (called after login or token refresh). */
export function setAuthToken(token: string): void {
  _write(token || '');
}

/** Read the current auth token for API requests. */
export function getAuthToken(): string {
  return _token;
}

/** Clear the auth token (called on logout). */
export function clearAuthToken(): void {
  _write('');
}

/**
 * Migrate tokens from localStorage/sessionStorage into the in-memory store,
 * then remove them from storage. Call once at app startup during the
 * transition period.
 */
export function migrateFromStorage(): void {
  const TOKEN_KEYS = [
    'wrfcoin_auth_token',
    'wrf_auth_token',
    'token',
  ];
  try {
    for (const key of TOKEN_KEYS) {
      const fromSession = sessionStorage.getItem(key);
      if (fromSession) {
        if (!_token) _write(fromSession);
        sessionStorage.removeItem(key);
      }
      const fromLocal = localStorage.getItem(key);
      if (fromLocal) {
        if (!_token) _write(fromLocal);
        localStorage.removeItem(key);
      }
    }
  } catch {
    // Storage unavailable (SSR, sandboxed iframe, etc.)
  }
}
