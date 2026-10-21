import { useQuery } from '@tanstack/react-query';
import ApiError, { ApiErrorCode } from '../../utils/apiError';
import { queryKeys } from '../../lib/queryClient';
import { apiClient } from '../../services/apiClient';

export interface BackendHealthResult {
  ok: true;
  path: '/health' | '/api/health';
  payload: unknown;
}

const HEALTH_PATHS = ['/health', '/api/health'] as const;

async function fetchBackendHealth(): Promise<BackendHealthResult> {
  let lastError: unknown;

  for (const path of HEALTH_PATHS) {
    try {
      const payload = await apiClient.get<unknown>(path);
      return { ok: true, path, payload };
    } catch (error) {
      lastError = error;
      const apiError = ApiError.fromError(error);
      if (apiError.status !== 404 && !apiError.isRecoverable()) {
        throw apiError;
      }
    }
  }

  throw ApiError.fromError(lastError, 'Unable to reach backend health endpoint.');
}

export function isBackendUnavailableError(error: unknown): boolean {
  const apiError = ApiError.fromError(error);
  return (
    apiError.status === 0 ||
    apiError.code === ApiErrorCode.NETWORK_ERROR ||
    apiError.code === ApiErrorCode.TIMEOUT ||
    apiError.code === ApiErrorCode.SERVICE_UNAVAILABLE ||
    apiError.isRecoverable()
  );
}

/**
 * frontend#299 — a 401/403 from an authenticated read is neither an outage
 * nor "the edge has not admitted this path": it means the visitor has to sign
 * in. Callers render the sign-in notice instead of the raw backend string
 * ("Bearer Token Required").
 */
export function isAuthRequiredError(error: unknown): boolean {
  const apiError = ApiError.fromError(error);
  return (
    apiError.code === ApiErrorCode.UNAUTHORIZED ||
    apiError.code === ApiErrorCode.FORBIDDEN ||
    apiError.status === 401 ||
    apiError.status === 403
  );
}

export function getBackendUnavailableMessage(error: unknown): string | null {
  if (!error) {
    return null;
  }

  const apiError = ApiError.fromError(error);
  if (apiError.code === ApiErrorCode.SERVICE_UNAVAILABLE && apiError.message.includes('API base URL')) {
    return apiError.message;
  }
  if (isBackendUnavailableError(apiError)) {
    return apiError.getUserMessage();
  }
  return apiError.message || null;
}

export function useBackendHealth() {
  return useQuery({
    queryKey: queryKeys.backend.health,
    queryFn: fetchBackendHealth,
    staleTime: 30_000,
    refetchInterval: 30_000,
    retry: 1,
  });
}

export default useBackendHealth;
