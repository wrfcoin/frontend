import { useState, useEffect, useCallback } from 'react';
import { getAuthToken } from '../services/authTokenStore';

// `earnings` is the chain-backed lifetime real_paid ranking (backend#1456); it is the default.
const VALID_METRICS = ['earnings', 'submissions', 'quality_score', 'streak'];

// A ranking is only shown when every row carries a proven base-unit amount. The backend answers 503 with
// unavailable:['earnings'] when it cannot prove them all; a 200 that says so, or carries a null amount, is
// treated the same. A partial list is never exposed (frontend#510 rule).
const BASE_UNITS_RE = /^\d{1,39}$/;
function earningsIncomplete(json) {
  if (Array.isArray(json?.unavailable) && json.unavailable.includes('earnings')) return true;
  if (json?.amountUnits && json.amountUnits.available === false) return true;
  const rows = Array.isArray(json?.entries) ? json.entries : [];
  return rows.some(r => !r || typeof r.earningsBaseUnits !== 'string' || !BASE_UNITS_RE.test(r.earningsBaseUnits));
}
const VALID_PERIODS = ['7d', '30d', 'all'];

// Must match the `LeaderboardRegion` enum on the backend
// (server/routes/leaderboard-regions.ts, introduced by backend#695).
// `Global` is treated as "no region filter" and is not sent to the API.
export const LEADERBOARD_REGIONS = [
  'Global',
  'North America',
  'Europe',
  'Asia',
  'Oceania',
  'Africa',
  'South America',
  'Antarctica',
];

/**
 * Fetches GET /api/weather/leaderboard with optional geographic filters.
 *
 * @param {{
 *   metric?: string,
 *   period?: string,
 *   limit?: number,
 *   region?: string,        // one of LEADERBOARD_REGIONS; 'Global' skips the param
 *   country?: string,       // ISO-3166-1 alpha-2
 *   near?: { lat: number, lng: number } | null,
 *   radiusKm?: number,      // only sent when `near` is set
 * }} options
 */
export function useWeatherLeaderboard({
  metric = 'earnings',
  period = '7d',
  limit = 25,
  region,
  country,
  near,
  radiusKm,
} = {}) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unavailable, setUnavailable] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);

  const safeMetric = VALID_METRICS.includes(metric) ? metric : 'earnings';
  const safePeriod = VALID_PERIODS.includes(period) ? period : '7d';
  const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);

  const safeRegion =
    region && region !== 'Global' && LEADERBOARD_REGIONS.includes(region) ? region : null;
  const safeCountry = country ? String(country).toUpperCase() : null;
  const hasNear =
    near && Number.isFinite(near.lat) && Number.isFinite(near.lng);
  const nearLat = hasNear ? near.lat : null;
  const nearLng = hasNear ? near.lng : null;
  const safeRadius =
    hasNear && Number.isFinite(radiusKm)
      ? Math.min(Math.max(Number(radiusKm), 1), 5000)
      : null;

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUnavailable(false);
    try {
      const params = new URLSearchParams({
        metric: safeMetric,
        period: safePeriod,
        limit: String(safeLimit),
      });
      // The chain registry has no country: the backend rejects geo filters on earnings (400).
      const geo = safeMetric !== 'earnings';
      if (geo && safeRegion) params.set('region', safeRegion);
      if (geo && safeCountry) params.set('country', safeCountry);
      if (geo && hasNear) {
        params.set('near', `${nearLat},${nearLng}`);
        if (safeRadius) params.set('radius_km', String(safeRadius));
      }
      // backend#1361: a signed-in wallet gets its OWN row marked (`isYou`, full address); everyone else
      // gets short addresses. The token is optional and only ever sent to this same-origin route.
      const token = getAuthToken();
      const res = await fetch(`/api/weather/leaderboard?${params}`, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
      if (safeMetric === 'earnings' && res.status === 503) {
        setEntries([]);
        setUnavailable(true);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (safeMetric === 'earnings' && earningsIncomplete(json)) {
        setEntries([]);
        setUnavailable(true);
        return;
      }
      setEntries(json.entries ?? []);
      setUpdatedAt(json.updatedAt ? new Date(json.updatedAt) : new Date());
    } catch (err) {
      setError(err.message);
      // A failed read must not leave the previous metric's rows on screen under this one.
      setEntries([]);
      if (safeMetric === 'earnings') setUnavailable(true);
    } finally {
      setLoading(false);
    }
  }, [safeMetric, safePeriod, safeLimit, safeRegion, safeCountry, hasNear, nearLat, nearLng, safeRadius]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { entries, loading, error, unavailable, updatedAt, refetch: fetch_ };
}
