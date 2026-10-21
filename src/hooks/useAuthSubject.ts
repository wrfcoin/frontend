import { useSyncExternalStore } from 'react';
import { readJwtSubject } from '../services/apiClient/stationRegistrationService';
import { getAuthToken, subscribeAuthToken } from '../services/authTokenStore';

/**
 * The wallet address the current session's JWT names, or null when there is
 * no session. Re-renders on login, refresh, logout and refresh failure
 * (subscribeAuthToken). Governance writes are authenticated by that JWT on
 * the backend (`requireAuth`, voter = token subject), so this is the address
 * a vote or delegation will actually be recorded for.
 */
export function useAuthSubject(): string | null {
  const token = useSyncExternalStore(subscribeAuthToken, getAuthToken, getAuthToken);
  return token ? readJwtSubject(token) : null;
}

/**
 * The live session's subject, read at call time (not from a render). Async
 * account-specific work captures the subject when it starts and compares it
 * with this when it finishes. A mismatch means the session changed (logout,
 * refresh failure, or another account), so the result, including an error,
 * is dropped instead of being shown to the new session.
 */
export function currentAuthSubject(): string | null {
  const token = getAuthToken();
  return token ? readJwtSubject(token) : null;
}

export function isSameSubject(a: string | null, b: string | null): boolean {
  return (a ?? '').toLowerCase() === (b ?? '').toLowerCase();
}
