/**
 * useApiReliability
 *
 * Extracts API response reliability metadata from HTTP headers and
 * classifies the response freshness for display via WrfApiReliabilityBadge.
 *
 * Header mapping:
 *   X-Request-Id        -> requestId
 *   X-Nonce-Validated   -> nonceValidated (boolean)
 *   Age / X-Response-Age -> responseAge (seconds)
 *   X-Cache-Status      -> fromCache ("HIT" = true)
 *   X-Replay-Status     -> freshness = 'replay' when "replay"
 *   X-Conflict          -> freshness = 'conflict' when present
 *   Otherwise           -> age < maxAge -> 'fresh',
 *                          age < maxAge * 3 -> 'cached',
 *                          else -> 'stale'
 */

import { useMemo } from 'react';
import type { ApiReliabilityInfo, ResponseFreshness } from '../components/DesignSystem/WrfApiReliabilityBadge';

export interface UseApiReliabilityOptions {
  headers?: Headers | Record<string, string>;
  /** Maximum age in seconds before a response is no longer "fresh". Default: 60 */
  maxAge?: number;
}

function getHeader(headers: Headers | Record<string, string>, name: string): string | null {
  if (headers instanceof Headers) {
    return headers.get(name);
  }
  // Case-insensitive lookup for plain objects
  const lowerName = name.toLowerCase();
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === lowerName) {
      return headers[key] ?? null;
    }
  }
  return null;
}

export function useApiReliability(options: UseApiReliabilityOptions = {}): ApiReliabilityInfo {
  const { headers, maxAge = 60 } = options;

  return useMemo<ApiReliabilityInfo>(() => {
    if (!headers) {
      return { freshness: 'fresh' };
    }

    const requestId = getHeader(headers, 'X-Request-Id') ?? undefined;
    const nonceValidatedRaw = getHeader(headers, 'X-Nonce-Validated');
    const nonceValidated =
      nonceValidatedRaw != null ? nonceValidatedRaw === 'true' : undefined;

    const ageRaw = getHeader(headers, 'Age') ?? getHeader(headers, 'X-Response-Age');
    const responseAge = ageRaw != null ? parseInt(ageRaw, 10) : undefined;

    const cacheStatus = getHeader(headers, 'X-Cache-Status');
    const fromCache = cacheStatus != null ? cacheStatus.toUpperCase() === 'HIT' : undefined;

    const replayStatus = getHeader(headers, 'X-Replay-Status');
    const conflictHeader = getHeader(headers, 'X-Conflict');

    let freshness: ResponseFreshness;

    if (replayStatus != null && replayStatus.toLowerCase() === 'replay') {
      freshness = 'replay';
    } else if (conflictHeader != null) {
      freshness = 'conflict';
    } else if (responseAge != null && !isNaN(responseAge)) {
      if (responseAge < maxAge) {
        freshness = 'fresh';
      } else if (responseAge < maxAge * 3) {
        freshness = 'cached';
      } else {
        freshness = 'stale';
      }
    } else {
      freshness = 'fresh';
    }

    return {
      freshness,
      requestId,
      nonceValidated,
      responseAge: responseAge != null && !isNaN(responseAge) ? responseAge : undefined,
      fromCache,
    };
  }, [headers, maxAge]);
}
