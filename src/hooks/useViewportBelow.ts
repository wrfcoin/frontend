import { useEffect, useState } from 'react';

/**
 * True while the viewport is narrower than `maxWidthPx`. Reads `matchMedia`
 * when the browser provides it and reports the wide layout otherwise (jsdom,
 * SSR), so tests and non-browser renders keep the desktop default.
 */
export function useViewportBelow(maxWidthPx: number): boolean {
  const query = `(max-width: ${maxWidthPx - 1}px)`;
  const read = () =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches
      : false;
  const [below, setBelow] = useState<boolean>(read);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const list = window.matchMedia(query);
    const onChange = (event: { matches: boolean }) => setBelow(event.matches);
    setBelow(list.matches);
    if (typeof list.addEventListener === 'function') {
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    }
    list.addListener(onChange);
    return () => list.removeListener(onChange);
  }, [query]);

  return below;
}

export default useViewportBelow;
