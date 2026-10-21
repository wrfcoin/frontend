import { useState, useEffect, useCallback, useRef } from 'react';

const POLL_INTERVAL = 30_000;
const DEFAULT_LIMIT = 50;

/**
 * Polls GET /api/oracle/leaderboard every 30s.
 *
 * NOTE: This endpoint does not yet exist in wrfcoin/backend.
 * It should be added to backend/server/routes/oracle-routes.js and return:
 *   { entries: OracleLeaderboardEntry[], total_oracles: usize }
 *
 * Each OracleLeaderboardEntry:
 *   oracle_id: String
 *   reputation_score: u64   (raw score, max 1_000_000)
 *   reputation_pct: f64     (0.0–100.0, already rounded to 2 dp by backend)
 *   tier: String            ("Bronze" | "Silver" | "Gold" | "Platinum")
 *
 * Until the endpoint exists this hook returns an empty leaderboard without
 * error and stops polling after the first 404 so it does not spam the backend.
 */
export function useOracleLeaderboard(limit = DEFAULT_LIMIT) {
  const [entries, setEntries] = useState([]);
  const [totalOracles, setTotalOracles] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  // Set to false on first 404 to stop future poll attempts
  const endpointExistsRef = useRef(true);

  const fetchLeaderboard = useCallback(() => {
    if (!endpointExistsRef.current) return;

    fetch(`/api/oracle/leaderboard?limit=${limit}`)
      .then(r => {
        if (r.status === 404) {
          // Endpoint not yet implemented — return empty data and stop polling
          endpointExistsRef.current = false;
          setEntries([]);
          setTotalOracles(0);
          setLoading(false);
          setError(null);
          return null;
        }
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        if (data === null) return; // 404 handled above
        const arr = Array.isArray(data)
          ? data
          : (data.entries ?? data.oracles ?? data.leaderboard ?? []);
        const total = data.total_oracles ?? arr.length;
        setEntries(arr);
        setTotalOracles(total);
        setLoading(false);
        setLastUpdated(new Date());
        setError(null);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [limit]);

  useEffect(() => {
    fetchLeaderboard();
    const id = setInterval(fetchLeaderboard, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchLeaderboard]);

  return { entries, totalOracles, loading, error, lastUpdated, refetch: fetchLeaderboard };
}
