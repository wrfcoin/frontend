import { useSyncExternalStore } from 'react';
import { useQuery } from '@tanstack/react-query';
import { stationRegistrationService } from '../../services/apiClient';
import { readJwtSubject } from '../../services/apiClient/stationRegistrationService';
import { getAuthToken, subscribeAuthToken } from '../../services/authTokenStore';

/**
 * The authenticated wallet's address when it owns `stationId`, else null
 * (frontend#387).
 *
 * Ownership comes from the backend's owner-only projection,
 * GET /api/weather/stations/:stationId/reward-progress: it answers 200 only
 * when the JWT wallet owns the station, 401 without a wallet, and 404 for
 * every other wallet. No token means no request. Any error or validation
 * failure means "not the owner", and the returned owner must be the JWT
 * subject. Never enable this in the Stage 1.5 public read-only build.
 *
 * The answer is bound to the live session. The token is read through
 * subscribeAuthToken, so logout, refresh failure or an account switch
 * re-renders at once. The query is keyed on the JWT subject, and the result
 * is returned only while it still names the current subject. Cached answers
 * are dropped as soon as nothing observes them.
 */
export function useStationOwner(stationId: string | undefined, enabled: boolean): string | null {
  const token = useSyncExternalStore(subscribeAuthToken, getAuthToken, getAuthToken);
  const subject = token ? readJwtSubject(token) : null;
  const query = useQuery({
    queryKey: ['stations', 'owner', stationId || '', subject || ''],
    queryFn: async (): Promise<string | null> => {
      if (!stationId || !subject) return null;
      try {
        const progress = await stationRegistrationService.getStationRewardProgress(stationId);
        return progress.ownerAddress.toLowerCase() === subject.toLowerCase()
          ? progress.ownerAddress
          : null;
      } catch {
        return null;
      }
    },
    enabled: enabled && Boolean(stationId) && Boolean(subject),
    retry: false,
    staleTime: 60_000,
    gcTime: 0,
  });
  const owner = query.data ?? null;
  if (!enabled || !subject || !owner || owner.toLowerCase() !== subject.toLowerCase()) {
    return null;
  }
  return owner;
}
