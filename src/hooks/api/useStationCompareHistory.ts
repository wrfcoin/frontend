import { useSyncExternalStore } from 'react';
import { useQuery } from '@tanstack/react-query';
import { stationCompareService } from '../../services/apiClient';
import { readJwtSubject } from '../../services/apiClient/stationRegistrationService';
import { getAuthToken, subscribeAuthToken } from '../../services/authTokenStore';
import type { StationCompareHistoryView } from '../../utils/stationCompareHistory';
import type { StationSiteCheckView } from '../../utils/stationSiteCheck';

/**
 * The 30-day comparison for the station's owner (Epic 8), or null when there is nothing to show.
 *
 * The request is sent only when `isOwner` is true (the page already knows the signed-in wallet
 * owns the station) and a wallet session exists. A visitor, and a wallet looking at someone
 * else's station, make no request at all, so nobody spends the route's rate limit on a refusal.
 *
 * The backend still decides: 401 without a login, 403 for another wallet, 404 while the feature
 * is off. All of those, and any failure, mean "show nothing".
 *
 * The answer is bound to the live session: the token is read through subscribeAuthToken, the
 * query is keyed on the JWT subject, and nothing is kept once no component is showing it, so a
 * logout or an account switch cannot leave one owner's numbers on screen for someone else.
 */
export function useStationCompareHistory(stationId: string | undefined, isOwner: boolean): StationCompareHistoryView | null {
  const token = useSyncExternalStore(subscribeAuthToken, getAuthToken, getAuthToken);
  const subject = token ? readJwtSubject(token) : null;
  const query = useQuery({
    queryKey: ['weather', 'compare-history', stationId ?? '', subject ?? ''] as const,
    queryFn: async (): Promise<StationCompareHistoryView | null> => {
      if (!stationId || !subject) return null;
      try {
        return await stationCompareService.getStationCompareHistory(stationId);
      } catch {
        return null;
      }
    },
    enabled: isOwner && Boolean(stationId) && Boolean(subject),
    retry: false,
    staleTime: 10 * 60_000,
    gcTime: 0,
  });
  if (!isOwner || !stationId || !subject) return null;
  return query.data ?? null;
}

/**
 * The owner's "has this station moved?" hint (Epic 8), or null when there is nothing to show.
 * Same rules as useStationCompareHistory: the request is sent only when `isOwner` is true and a wallet
 * session exists; 401, 403, 404 or any failure means null; the answer is keyed on the session's wallet
 * and not kept once unobserved.
 */
export function useStationSiteCheck(stationId: string | undefined, isOwner: boolean): StationSiteCheckView | null {
  const token = useSyncExternalStore(subscribeAuthToken, getAuthToken, getAuthToken);
  const subject = token ? readJwtSubject(token) : null;
  const query = useQuery({
    queryKey: ['weather', 'site-check', stationId ?? '', subject ?? ''] as const,
    queryFn: async (): Promise<StationSiteCheckView | null> => {
      if (!stationId || !subject) return null;
      try {
        return await stationCompareService.getStationSiteCheck(stationId);
      } catch {
        return null;
      }
    },
    enabled: isOwner && Boolean(stationId) && Boolean(subject),
    retry: false,
    staleTime: 10 * 60_000,
    gcTime: 0,
  });
  if (!isOwner || !stationId || !subject) return null;
  return query.data ?? null;
}
