import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import CapabilitiesContext from '../contexts/CapabilitiesContext';
import { getAuthToken } from '../services/authTokenStore';
import { earningsQuery, validateRoleBoard } from '../utils/roleEarnings';

export function useRoleEarningsEnabled() {
  const capabilities = useContext(CapabilitiesContext);
  return Boolean(capabilities && !capabilities.loading && !capabilities.error &&
    capabilities.isFeatureEnabled('leaderboardRead') && capabilities.isFeatureEnabled('earningsRead'));
}

export function useRoleEarnings(role, period, enabled) {
  const key = `${role}:${period}:${enabled}`;
  const generation = useRef(0);
  const controller = useRef(null);
  const [result, setResult] = useState(null);
  const refetch = useCallback(async () => {
    controller.current?.abort();
    const id = ++generation.current;
    if (!enabled) { setResult(null); return; }
    const request = new AbortController();
    controller.current = request;
    setResult({ key, loading: true, data: null, unavailable: false });
    const current = () => id === generation.current && !request.signal.aborted;
    try {
      const token = getAuthToken();
      const response = await fetch(earningsQuery(role, period), {
        signal: request.signal,
        ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
      });
      if (!response.ok) throw new Error('Role payments unavailable');
      const data = validateRoleBoard(await response.json(), role, period);
      if (current()) setResult({ key, loading: false, data, unavailable: false });
    } catch {
      if (current()) setResult({ key, loading: false, data: null, unavailable: true });
    }
  }, [key, role, period, enabled]);
  useEffect(() => {
    void refetch();
    return () => { controller.current?.abort(); ++generation.current; };
  }, [refetch]);
  // Hide prior rows in the switch render itself, before the effect runs.
  return { ...(result?.key === key ? result : { loading: enabled, data: null, unavailable: false }), refetch };
}
