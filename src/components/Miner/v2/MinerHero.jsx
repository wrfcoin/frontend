/**
 * MinerHero - Main processing speed and earnings display
 * Features animated counter and mini stat cards backed by real API data.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Zap, Clock, Coins, Users } from 'lucide-react';
import { miningAPI } from '../../../services/api';

function formatUptime(seconds) {
  const n = Number(seconds);
  if (!n || n <= 0) return '—';
  const h = Math.floor(n / 3600);
  const m = Math.floor((n % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function safeFloat(val, fallback = 0) {
  const n = parseFloat(val);
  return isFinite(n) ? n : fallback;
}

// frontend#355: labels come from the real node-stats poll, not a browser
// Start/Stop state. The former counter only moved after a local-only "Start"
// click and showed 0.0 otherwise.
const NODE_STATUS_CHIP = {
  online: { text: 'Node online', style: undefined },
  unreachable: { text: 'Node unreachable', style: { background: 'rgba(251, 191, 36, 0.15)', color: '#FBBF24' } },
  unknown: { text: 'Status unknown', style: { background: 'rgba(148, 163, 184, 0.15)', color: '#94A3B8' } },
};

const MinerHero = ({ nodeStatus = 'unknown' }) => {
  const [miningStats, setMiningStats] = useState(null);
  const [statsError, setStatsError] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const data = await miningAPI.getNodeStats();
      setMiningStats(data ?? null);
      setStatsError(false);
    } catch {
      setStatsError(true);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const id = setInterval(fetchStats, 30_000);
    return () => clearInterval(id);
  }, [fetchStats]);

  // Only a rate the node actually reports is shown; otherwise "—", never 0.
  const hashrate = miningStats ? safeFloat(miningStats.hashRate, null) : null;
  const statusChip = NODE_STATUS_CHIP[nodeStatus] ?? NODE_STATUS_CHIP.unknown;
  const earningsRaw = miningStats ? safeFloat(miningStats.earnings, null) : null;
  const statsDisplay = {
    dataVerified: miningStats?.blocksFound != null ? String(miningStats.blocksFound) : '—',
    earnings: earningsRaw !== null ? `${earningsRaw.toFixed(2)} WRF` : '—',
    uptime: miningStats ? formatUptime(miningStats.uptime) : '—',
    activeStations: '—',
  };

  return (
    <div className="miner-card hero">
      <div className="hero-metrics">
        {/* Main Hashrate Display */}
        <div className="hashrate-display">
          <div className="hashrate-label">Processing Speed</div>
          <div className="hashrate-value" data-testid="hashrate-value">
            {hashrate === null ? '—' : hashrate.toFixed(1)}
            <span className="hashrate-unit">obs/min</span>
          </div>
          <div className="hashrate-change" style={statusChip.style} data-testid="hero-node-status">
            {statusChip.text}
          </div>
        </div>

        {/* Mini Stats Row */}
        <div className="hero-stats-row">
          <div className="hero-stat">
            <div className="hero-stat-label">
              <Zap size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              Data Verified
            </div>
            <div className="hero-stat-value" data-testid="stat-data-verified">
              {statsDisplay.dataVerified}
            </div>
          </div>

          <div className="hero-stat">
            <div className="hero-stat-label">
              <Coins size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              Earnings
            </div>
            <div className="hero-stat-value earnings" data-testid="stat-earnings">
              {statsDisplay.earnings}
            </div>
          </div>

          <div className="hero-stat">
            <div className="hero-stat-label">
              <Clock size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              Uptime
            </div>
            <div className="hero-stat-value" data-testid="stat-uptime">
              {statsDisplay.uptime}
            </div>
          </div>

          <div className="hero-stat">
            <div className="hero-stat-label">
              <Users size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              Active Stations
            </div>
            <div className="hero-stat-value">{statsDisplay.activeStations}</div>
          </div>
        </div>

        {statsError && (
          <div data-testid="stats-error" style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '8px', textAlign: 'center' }}>
            Stats unavailable
          </div>
        )}
      </div>
    </div>
  );
};

export default MinerHero;
