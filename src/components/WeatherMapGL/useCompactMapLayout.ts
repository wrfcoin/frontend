import { useEffect, useState } from 'react';

/**
 * Phone-width layout for the weather map (frontend#560). Under 768 px the
 * legend and layer panels covered almost the whole map, so they start
 * collapsed there and open on tap; at 768 px and above nothing changes.
 *
 * Reads `matchMedia` when the browser provides it and falls back to the
 * desktop layout otherwise (jsdom, SSR), so tests and non-browser renders
 * keep the long-standing default.
 */
export const COMPACT_MAP_QUERY = '(max-width: 767px)';

type CompactQuery = ReturnType<typeof window.matchMedia>;
type CompactQueryEvent = { matches: boolean };

function mediaQueryList(): CompactQuery | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
  return window.matchMedia(COMPACT_MAP_QUERY);
}

export function useCompactMapLayout(): boolean {
  const [compact, setCompact] = useState<boolean>(() => mediaQueryList()?.matches ?? false);

  useEffect(() => {
    const query = mediaQueryList();
    if (!query) return undefined;
    const onChange = (event: CompactQueryEvent) => setCompact(event.matches);
    setCompact(query.matches);
    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', onChange);
      return () => query.removeEventListener('change', onChange);
    }
    // Older WebKit exposes only the deprecated pair.
    query.addListener(onChange);
    return () => query.removeListener(onChange);
  }, []);

  return compact;
}

export default useCompactMapLayout;
