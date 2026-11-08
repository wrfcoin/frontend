/**
 * Where wallet setup returns after the 12-word wallet is unlocked. Passed in router state (never a URL
 * parameter) and checked against a fixed list, so it cannot send anyone to another site or an arbitrary path.
 */
export const UNLOCK_RETURN_PATHS = ['/connect-station', '/wallet'] as const;
export type UnlockReturnPath = typeof UNLOCK_RETURN_PATHS[number];

export const UNLOCK_RETURN_STATE = {
  connectStation: { returnTo: '/connect-station' as UnlockReturnPath },
  wallet: { returnTo: '/wallet' as UnlockReturnPath },
} as const;

/** The allowed return path in `state`, or null. */
export function unlockReturnPath(state: unknown): UnlockReturnPath | null {
  const value = (state as { returnTo?: unknown } | null | undefined)?.returnTo;
  return (UNLOCK_RETURN_PATHS as readonly unknown[]).includes(value) ? value as UnlockReturnPath : null;
}
