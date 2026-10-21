import { useState, useEffect, useCallback } from 'react';

const POLL_INTERVAL = 60_000;

export function useSlashingEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchEvents = useCallback(() => {
    // Fetch slashing events: event_type=slashing filters to only SlashingApplied records.
    // The API returns { items: [...], total, offset, limit, ... }
    // Each item has: event_id, event_type, block_height, commit_id, participant,
    //   quality_band, quality_score, slashed_amount, low_quality_streak, etc.
    fetch('/api/quality/events?event_type=slashing&limit=200')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        // Response is { items: [...], total, offset, limit, ... }
        const arr = Array.isArray(data) ? data : (data.items || data.events || []);
        // Sort by block_height descending (most recent first)
        arr.sort((a, b) => (b.block_height ?? 0) - (a.block_height ?? 0));
        setEvents(arr);
        setLoading(false);
        setLastUpdated(new Date());
        setError(null);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchEvents();
    const id = setInterval(fetchEvents, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchEvents]);

  // Derived stats
  // slashed_amount is u128 in Rust but serialized as a JSON number (or null)
  const totalSlashed = events.reduce((sum, e) => sum + (e.slashed_amount ?? 0), 0);
  const uniqueOracles = new Set(events.map(e => e.participant)).size;

  // Group by quality_band (the main categorisation the backend exposes)
  const byQualityBand = events.reduce((acc, e) => {
    const band = e.quality_band ?? 'unknown';
    acc[band] = (acc[band] ?? 0) + 1;
    return acc;
  }, {});

  // Keep a violation_type alias using event_type + quality_band for display
  const byViolationType = events.reduce((acc, e) => {
    const label = violationLabel(e);
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {});

  return {
    events,
    loading,
    error,
    lastUpdated,
    totalSlashed,
    uniqueOracles,
    byQualityBand,
    byViolationType,
    refetch: fetchEvents,
  };
}

/**
 * Maps an event's event_type + quality_band to a human-readable violation label.
 * The API exposes event_type as "challenge" | "slashing" and quality_band as
 * "high" | "borderline" | "warning_only" | "low".
 */
export function violationLabel(event) {
  const band = event.quality_band ?? '';
  switch (band) {
  case 'low': return 'Low Quality (DATA-004)';
  case 'warning_only': return 'Warning-Only Quality';
  case 'borderline': return 'Borderline Quality';
  case 'high': return 'High Quality';
  default: return event.event_type ?? 'Unknown';
  }
}
