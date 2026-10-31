/**
 * Dismissal state for the testnet disclaimer banner (#559), shared by TestnetNotice (the banner) and the
 * taskbar chip that keeps the disclaimer one click away once the banner is gone.
 *
 * Dismissal is remembered on this device in localStorage, keyed by the wording version, so a reworded
 * notice shows again. Storage can be unavailable (private mode, blocked site data, quota); every access
 * is wrapped and the in-memory value keeps the page working for the current visit.
 */
export const DISCLAIMER_URL = '/testnet-disclaimer.html';
export const DISMISSAL_KEY = 'wrfcoin-testnet-disclaimer-dismissed';
/** Bump when the banner wording changes in a way visitors must see again. */
export const WORDING_VERSION = '2';

let memory = null; // null = not read yet; otherwise the last known value ('' when not dismissed)
const listeners = new Set();

function read() {
  try {
    return globalThis.localStorage?.getItem(DISMISSAL_KEY) ?? '';
  } catch {
    return memory ?? '';
  }
}

export function isDismissed() {
  if (memory === null) memory = read();
  return memory === WORDING_VERSION;
}

export function dismiss() {
  memory = WORDING_VERSION;
  try {
    globalThis.localStorage?.setItem(DISMISSAL_KEY, WORDING_VERSION);
  } catch {
    // Storage unavailable: the in-memory value still hides the banner for this visit.
  }
  listeners.forEach(fn => fn());
}

/** Test/support hook: forget the cached value so the next read consults storage again. */
export function resetDismissalCache() {
  memory = null;
  listeners.forEach(fn => fn());
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
