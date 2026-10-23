// Taskbar title for a path no menu entry names: "/forecasters/c_0123…" -> "Forecasters > c_0123…".
// Word segments are capitalised; anything else (opaque c_ keys, 0x addresses, station and proposal ids)
// is shown verbatim, because case is part of those identifiers.
const WORD_SEGMENT = /^[a-z]+(?:-[a-z]+)*$/;

export function pathTitle(path) {
  return String(path ?? '')
    .replace(/^\/+/, '')
    .split('/')
    .filter(Boolean)
    .map(part => (WORD_SEGMENT.test(part) ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(' > ');
}
