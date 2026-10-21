/**
 * PoolStatusSection - Mining pool aggregate stats from real API.
 * Shows totalHashRate, miner count, last block, payout, and fee.
 * Per-pool connection rows are not available from the API — shows empty state.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { miningAPI } from '../../../services/api';
import { Server } from 'lucide-react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLORS = {
  purple: '#A855F7',
  green: '#4ADE80',
  red: '#F87171',
  amber: '#FBBF24',
  dimText: 'rgba(232, 232, 240, 0.5)',
  text: '#E8E8F0',
};

// ---------------------------------------------------------------------------
// Stat pill
// ---------------------------------------------------------------------------

const PoolStatPill: React.FC<{ label: string; value: string; testId?: string }> = ({ label, value, testId }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 80,
  }}>
    <div style={{
      fontFamily: '\'JetBrains Mono\', monospace',
      fontSize: '0.625rem',
      color: COLORS.dimText,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    }}>
      {label}
    </div>
    <div
      data-testid={testId}
      style={{
        fontFamily: '\'JetBrains Mono\', monospace',
        fontSize: '0.875rem',
        fontWeight: 600,
        color: COLORS.text,
      }}
    >
      {value}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface PoolInfo {
  totalHashRate: string;
  miners: number;
  lastBlock: number;
  payout: string;
  fee: number;
}

function safeStr(val: unknown, fallback = '—'): string {
  if (val == null || val === '') return fallback;
  const s = String(val);
  return s.trim() === '' ? fallback : s;
}

function safeNum(val: unknown, fallback = '—'): string {
  const n = Number(val);
  return isFinite(n) ? n.toLocaleString() : fallback;
}

const PoolStatusSection: React.FC = () => {
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchPoolInfo = useCallback(async () => {
    try {
      const info = await miningAPI.getPoolInfo();
      setPoolInfo(info ?? null);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPoolInfo();
    const id = setInterval(fetchPoolInfo, 30_000);
    return () => clearInterval(id);
  }, [fetchPoolInfo]);

  if (loading) {
    return (
      <div data-testid="pool-loading" className="miner-card" style={{ padding: 20, textAlign: 'center', color: COLORS.dimText, fontSize: '0.85rem' }}>
        Loading pool info…
      </div>
    );
  }

  if (error) {
    return (
      <div
        data-testid="pool-error"
        style={{
          padding: '12px 16px',
          borderRadius: '8px',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          color: COLORS.red,
          fontSize: '0.85rem',
          marginBottom: '12px',
        }}
      >
        Could not load pool data
      </div>
    );
  }

  if (!poolInfo) {
    return (
      <div
        data-testid="pool-empty"
        className="miner-card"
        style={{ padding: 32, textAlign: 'center', color: COLORS.dimText, fontSize: '0.875rem' }}
      >
        <Server size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
        <div>No pool data available.</div>
        <div style={{ fontSize: '0.75rem', marginTop: 6 }}>Connect a mining pool to see stats here.</div>
      </div>
    );
  }

  return (
    <div>
      {/* Aggregate pool stats card */}
      <div className="miner-card" data-testid="pool-stats-card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: COLORS.green,
            boxShadow: `0 0 8px ${COLORS.green}`,
          }} />
          <span style={{ fontWeight: 600, color: COLORS.text, fontSize: '0.9375rem' }}>WRFCoin Pool</span>
          <span style={{
            padding: '2px 8px',
            background: 'rgba(168, 85, 247, 0.15)',
            borderRadius: 4,
            fontSize: '0.625rem',
            color: COLORS.purple,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontWeight: 600,
          }}>
            Primary
          </span>
        </div>

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <PoolStatPill label="Total Hashrate" value={safeStr(poolInfo.totalHashRate)} testId="pool-hashrate" />
          <PoolStatPill label="Miners" value={safeNum(poolInfo.miners)} testId="pool-miners" />
          <PoolStatPill label="Last Block" value={poolInfo.lastBlock ? `#${poolInfo.lastBlock.toLocaleString()}` : '—'} testId="pool-last-block" />
          <PoolStatPill label="Payout" value={safeStr(poolInfo.payout)} testId="pool-payout" />
          <PoolStatPill label="Fee" value={poolInfo.fee != null ? `${poolInfo.fee}%` : '—'} testId="pool-fee" />
        </div>
      </div>

      {/* Note: per-pool connection detail (latency, workers, accept rate) is not available from the API */}
      <div style={{
        padding: '10px 14px',
        borderRadius: '8px',
        background: 'rgba(168, 85, 247, 0.04)',
        border: '1px solid rgba(168, 85, 247, 0.12)',
        color: COLORS.dimText,
        fontSize: '0.75rem',
        marginBottom: 16,
      }}>
        Per-pool connection stats (latency, workers) not yet available via API.
      </div>

      {/* frontend#355 (codex round 11 on #390): the former "Add Pool Connection"
          button had only hover handlers. Pools are not configured from the
          browser; contribution runs on the station collector. */}
      <div data-testid="pool-config-note" style={{ color: COLORS.dimText, fontSize: '0.75rem', marginBottom: 8 }}>
        Pool connections are not configured from the browser. Contribution runs on your station collector.
      </div>

      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default PoolStatusSection;
