/**
 * MiningStatsSection - Real-time weather processing statistics
 * Stats sourced from miningAPI.getNodeStats(); shows — where data is unavailable.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Zap, Target, Coins, Wifi } from 'lucide-react';
import { miningAPI } from '../../../services/api';

function safeFloat(val, fallback = null) {
  const n = parseFloat(val);
  return isFinite(n) ? n : fallback;
}

function formatUptime(seconds) {
  const n = Number(seconds);
  if (!n || n <= 0) return '—';
  const h = Math.floor(n / 3600);
  const m = Math.floor((n % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const StatCard = ({ icon: Icon, label, value, subValue, color = '#A855F7', testId }) => (
  <div className="miner-card" style={{ padding: '20px' }} data-testid={testId}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <div style={{
          fontSize: '0.75rem',
          fontWeight: '500',
          color: 'rgba(232, 232, 240, 0.6)',
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          {label}
        </div>
        <div
          data-testid={testId ? `${testId}-value` : undefined}
          style={{
            fontFamily: '\'Orbitron\', sans-serif',
            fontSize: '1.75rem',
            fontWeight: '700',
            color: '#E8E8F0',
            lineHeight: '1',
          }}
        >
          {value}
        </div>
        {subValue && (
          <div style={{
            fontSize: '0.75rem',
            color: 'rgba(232, 232, 240, 0.5)',
            marginTop: '6px',
          }}>
            {subValue}
          </div>
        )}
      </div>
      <div style={{
        width: '44px',
        height: '44px',
        borderRadius: '12px',
        background: `${color}15`,
        border: `1px solid ${color}30`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color,
      }}>
        <Icon size={22} />
      </div>
    </div>
  </div>
);

const MiningStatsSection = () => {
  const [nodeStats, setNodeStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const data = await miningAPI.getNodeStats();
      setNodeStats(data ?? null);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const id = setInterval(fetchStats, 30_000);
    return () => clearInterval(id);
  }, [fetchStats]);

  const blocksFound = nodeStats?.blocksFound != null ? String(nodeStats.blocksFound) : '—';
  const earningsRaw = nodeStats ? safeFloat(nodeStats.earnings) : null;
  const earningsDisplay = earningsRaw !== null ? `${earningsRaw.toFixed(2)} WRF` : '—';
  const uptimeDisplay = nodeStats ? formatUptime(nodeStats.uptime) : '—';
  const hashrateRaw = nodeStats ? safeFloat(nodeStats.hashRate) : null;
  const hashrateDisplay = hashrateRaw !== null ? `${hashrateRaw.toFixed(1)} obs/min` : '—';

  if (loading) {
    return (
      <div data-testid="mining-stats-loading" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="miner-card" style={{ padding: '20px', opacity: 0.4 }}>
            <div style={{ height: '80px', background: 'rgba(168,85,247,0.08)', borderRadius: '8px' }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div
          data-testid="mining-stats-error"
          style={{
            padding: '10px 14px',
            marginBottom: '12px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#F87171',
            fontSize: '0.8rem',
          }}
        >
          Could not load mining stats
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <StatCard
          icon={Zap}
          label="Data Verified"
          value={blocksFound}
          subValue={null}
          color="#A855F7"
          testId="stat-data-verified"
        />

        <StatCard
          icon={Target}
          label="Valid Submissions"
          value="—"
          subValue="not available"
          color="#22C55E"
          testId="stat-submissions"
        />

        <StatCard
          icon={Coins}
          label="Total Rewards"
          value={earningsDisplay}
          subValue={uptimeDisplay !== '—' ? `Uptime: ${uptimeDisplay}` : null}
          color="#F59E0B"
          testId="stat-rewards"
        />

        <StatCard
          icon={Wifi}
          label="Network Rate"
          value={hashrateDisplay}
          subValue={null}
          color="#0EA5E9"
          testId="stat-network-rate"
        />

        {/* Responsive styles */}
        <style>{`
          @media (max-width: 1023px) {
            .miner-section .section-content > div:first-child {
              grid-template-columns: repeat(2, 1fr) !important;
            }
          }
          @media (max-width: 640px) {
            .miner-section .section-content > div:first-child {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default MiningStatsSection;
