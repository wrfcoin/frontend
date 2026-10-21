import { useState, useEffect, useCallback } from 'react';

const STATS_POLL_INTERVAL = 30_000; // 30s

const DEFAULT_STATS = {
  range_proofs_verified: 0,
  confidential_transfers_verified: 0,
  selective_disclosures_verified: 0,
  weather_model_proofs_verified: 0,
  // These fields are returned by /api/zk/stats when available.
  // They will be null until the backend exposes them.
  throughput_tps: null,
  uptime_percent: null,
};

const DEFAULT_CIRCUITS = [];

export function useZkProver(walletAddress) {
  const [circuits, setCircuits] = useState(DEFAULT_CIRCUITS);
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [statsLoading, setStatsLoading] = useState(true);
  const [circuitsLoading, setCircuitsLoading] = useState(true);

  // Proof generation state
  const [proving, setProving] = useState(false);
  const [proofResult, setProofResult] = useState(null); // { proof: hex, valid: bool, durationMs: number }
  const [proofError, setProofError] = useState(null);
  const [proofStage, setProofStage] = useState(null); // 'generating' | 'verifying' | 'done'

  // Fetch circuits once
  useEffect(() => {
    fetch('/api/zk/circuits')
      .then(r => r.json())
      .then(data => { setCircuits(data.circuits || []); setCircuitsLoading(false); })
      .catch(() => setCircuitsLoading(false));
  }, []);

  // Poll stats
  const fetchStats = useCallback(() => {
    fetch('/api/zk/stats')
      .then(r => r.json())
      .then(data => { setStats(data); setStatsLoading(false); })
      .catch(() => setStatsLoading(false));
  }, []);

  useEffect(() => {
    fetchStats();
    const id = setInterval(fetchStats, STATS_POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchStats]);

  // Generate + verify a weather model proof
  const generateWeatherProof = useCallback(async ({ inputHash, outputHash, modelId, timeSecs, samples }) => {
    setProving(true);
    setProofResult(null);
    setProofError(null);
    setProofStage('generating');
    const t0 = Date.now();
    try {
      const genRes = await fetch('/api/zk/weather-model/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input_hash: inputHash,
          output_hash: outputHash,
          model_id: modelId,
          time_secs: timeSecs,
          samples: samples || [],
        }),
      });
      if (!genRes.ok) throw new Error(`Generate failed: ${genRes.status}`);
      const { proof } = await genRes.json();

      setProofStage('verifying');
      const verRes = await fetch('/api/zk/weather-model/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proof,
          input_hash: inputHash,
          output_hash: outputHash,
          model_id: modelId,
          time_secs: timeSecs,
        }),
      });
      if (!verRes.ok) throw new Error(`Verify failed: ${verRes.status}`);
      const { valid } = await verRes.json();
      const durationMs = Date.now() - t0;

      setProofResult({ proof, valid, durationMs });
      setProofStage('done');
      // Refresh stats after a proof
      setTimeout(fetchStats, 1000);
    } catch (err) {
      setProofError(err.message);
      setProofStage(null);
    } finally {
      setProving(false);
    }
  }, [fetchStats]);

  // Compute derived display stats from raw stats
  const totalProofs = Object.values(stats).reduce((sum, v) => sum + (typeof v === 'number' ? v : 0), 0);

  return {
    circuits,
    circuitsLoading,
    stats,
    statsLoading,
    totalProofs,
    proving,
    proofResult,
    proofError,
    proofStage,
    generateWeatherProof,
  };
}
