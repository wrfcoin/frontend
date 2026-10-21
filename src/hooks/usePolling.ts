import { useEffect, useRef, useCallback } from 'react';

interface UsePollingOptions {
  enabled?: boolean;
  pauseWhenHidden?: boolean;
}

export function usePolling(
  fetchFn: () => Promise<void>,
  intervalMs: number,
  options: UsePollingOptions = {},
): { refresh: () => void } {
  const { enabled = true, pauseWhenHidden = true } = options;
  const fetchRef = useRef(fetchFn);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  fetchRef.current = fetchFn;

  const refresh = useCallback(() => {
    fetchRef.current();
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const start = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => fetchRef.current(), intervalMs);
    };

    const stop = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    // Initial fetch
    fetchRef.current();
    start();

    if (pauseWhenHidden && typeof document !== 'undefined' && 'hidden' in document) {
      const handleVisibility = () => {
        if (document.hidden) {
          stop();
        } else {
          fetchRef.current();
          start();
        }
      };
      document.addEventListener('visibilitychange', handleVisibility);
      return () => {
        stop();
        document.removeEventListener('visibilitychange', handleVisibility);
      };
    }

    return () => stop();
  }, [intervalMs, enabled, pauseWhenHidden]);

  return { refresh };
}
