import { useState, useEffect, useRef } from 'react';

/** Milestone thresholds in days (must match WeatherStreakNFT.sol). */
export const STREAK_MILESTONES = [7, 30, 90];

/**
 * Poll the backend for the wallet's weather-data contribution streak.
 *
 * @param {string|null} walletAddress  — checksummed wallet address
 * @param {number}      pollMs         — polling interval in milliseconds (default 60 s)
 * @returns {{
 *   currentStreak: number,
 *   longestStreak: number,
 *   nextMilestone: number|null,
 *   milestoneReached: number|null,
 *   loading: boolean,
 *   error: string|null,
 * }}
 */
export function useWeatherStreak(walletAddress, pollMs = 60_000) {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!walletAddress) return;

    const fetchStreak = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/weather/streak/${walletAddress}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setCurrentStreak(data.currentStreak ?? 0);
        setLongestStreak(data.longestStreak ?? 0);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStreak();
    intervalRef.current = setInterval(fetchStreak, pollMs);
    return () => clearInterval(intervalRef.current);
  }, [walletAddress, pollMs]);

  // Compute derived values
  const nextMilestone = STREAK_MILESTONES.find(m => m > currentStreak) ?? null;
  const milestoneReached = [...STREAK_MILESTONES].reverse().find(m => currentStreak >= m) ?? null;

  return { currentStreak, longestStreak, nextMilestone, milestoneReached, loading, error };
}
