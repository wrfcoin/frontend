import React, { useEffect, useMemo, useState } from 'react';
import CountUp from 'react-countup';
import {
  Activity,
  Cloud,
  Database,
  Trophy,
  Info,
} from 'lucide-react';

import {
  useWeatherStationSnapshots,
  useWeatherStations,
} from '../../hooks/api/useWeatherQueries';
import {
  averageDefined,
  buildWeatherStationViewModel,
  sumDefined,
} from '../../lib/weatherViewModels';
import { formatExactAmount } from '../../services/apiClient/amountPrecision';
import './ImpactScore.css';

const CircularRing = ({ progress, color, size, strokeWidth, delay = 0 }) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, delay);
    return () => clearTimeout(timer);
  }, [progress, delay]);

  return (
    <svg width={size} height={size} className="ring-svg">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(51, 65, 85, 0.3)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        style={{
          transform: 'rotate(-90deg)',
          transformOrigin: 'center',
          transition: 'stroke-dashoffset 1.5s ease-out',
        }}
        className="progress-ring"
      />
    </svg>
  );
};

const TierBadge = ({ tier, nextTier, progress }) => {
  const tierColors = {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    platinum: '#E5E4E2',
    diamond: '#B9F2FF',
  };

  return (
    <div className="tier-badge">
      <div className="tier-icon" style={{ color: tierColors[tier.toLowerCase()] }}>
        <Trophy size={24} />
      </div>
      <div className="tier-info">
        <span className="current-tier">{tier} Tier</span>
        {nextTier && (
          <div className="next-tier">
            <span>{progress}% to {nextTier}</span>
            <div className="tier-progress-bar">
              <div
                className="tier-progress-fill"
                style={{
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${tierColors[tier.toLowerCase()]}, ${tierColors[nextTier.toLowerCase()]})`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MetricCard = ({ icon: Icon, value, label, suffix = '', color, decimals = 0 }) => (
  <div className="impact-metric-card">
    <div className="metric-icon" style={{ color }}>
      <Icon size={18} />
    </div>
    <div className="metric-content">
      <span className="metric-value font-mono">
        {typeof value === 'number'
          ? <CountUp end={value} duration={2} separator="," decimals={decimals} />
          : formatExactAmount(value, decimals)}
        {suffix && <span className="metric-suffix">{suffix}</span>}
      </span>
      <span className="metric-label">{label}</span>
    </div>
  </div>
);

function resolveTier(score) {
  if (score >= 95) return ['Diamond', null, 100];
  if (score >= 85) return ['Platinum', 'Diamond', Math.round(((score - 85) / 10) * 100)];
  if (score >= 70) return ['Gold', 'Platinum', Math.round(((score - 70) / 15) * 100)];
  if (score >= 55) return ['Silver', 'Gold', Math.round(((score - 55) / 15) * 100)];
  return ['Bronze', 'Silver', Math.round((score / 55) * 100)];
}

const ImpactScore = () => {
  const [showInfo, setShowInfo] = useState(false);

  const stationsQuery = useWeatherStations();
  const snapshotsQuery = useWeatherStationSnapshots(stationsQuery.data);

  const stationViews = useMemo(() => {
    const baseSnapshots =
      snapshotsQuery.data ??
      (stationsQuery.data ?? []).map((station) => ({
        station,
        observations: [],
        quality: null,
        earnings: null,
        submissions: [],
      }));

    return baseSnapshots.map(buildWeatherStationViewModel);
  }, [snapshotsQuery.data, stationsQuery.data]);

  const onlineCount = stationViews.filter((station) => station.status === 'online').length;
  const coverageScore = stationViews.length > 0 ? (onlineCount / stationViews.length) * 100 : 0;
  const qualityScore = averageDefined(stationViews.map((station) => station.quality)) ?? 0;
  const reliabilityScore = averageDefined(stationViews.map((station) => station.validationRate)) ?? 0;
  const overallScore = Math.round((coverageScore + qualityScore + reliabilityScore) / 3);
  const [tier, nextTier, tierProgress] = resolveTier(overallScore);

  const impactData = {
    coverage: { score: Math.round(coverageScore), label: 'Coverage', color: '#22C55E' },
    quality: { score: Math.round(qualityScore), label: 'Data Quality', color: '#3B82F6' },
    reliability: { score: Math.round(reliabilityScore), label: 'Reliability', color: '#8B5CF6' },
    overallScore,
    tier,
    nextTier,
    tierProgress,
    metrics: {
      stationsOnline: onlineCount,
      liveReadings: stationViews.reduce((sum, station) => sum + station.observationCount, 0),
      lifetimeRewards: sumDefined(stationViews.map((station) => station.earningsAllTime)),
      averageQuality: Math.round(qualityScore),
    },
  };

  const ringSize = 180;
  const strokeWidths = [14, 12, 10];
  const rings = [
    { ...impactData.coverage, radius: ringSize },
    { ...impactData.quality, radius: ringSize - 28 },
    { ...impactData.reliability, radius: ringSize - 52 },
  ];

  return (
    <div className="impact-score dashboard-card">
      <div className="impact-header">
        <h3>Network Impact</h3>
        <button
          className="info-btn"
          onClick={() => setShowInfo(!showInfo)}
          title="Learn more"
        >
          <Info size={16} />
        </button>
      </div>

      {showInfo && (
        <div className="info-tooltip">
          <p>
            This score is derived from live weather network coverage, current quality signals,
            and recent submission reliability. It avoids fixed mock environmental claims.
          </p>
        </div>
      )}

      {(stationsQuery.isLoading || snapshotsQuery.isLoading) && (
        <div className="info-tooltip">
          <p>Loading live impact metrics...</p>
        </div>
      )}

      {!stationsQuery.isLoading && stationViews.length === 0 && (
        <div className="info-tooltip">
          <p>No live station data is available yet.</p>
        </div>
      )}

      <div className="rings-container">
        <div className="rings-wrapper">
          {rings.map((ring, index) => (
            <div
              key={ring.label}
              className="ring-layer"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <CircularRing
                progress={ring.score}
                color={ring.color}
                size={ring.radius}
                strokeWidth={strokeWidths[index]}
                delay={index * 200}
              />
            </div>
          ))}

          <div className="ring-center">
            <span className="overall-score font-mono">
              <CountUp end={impactData.overallScore} duration={2} />
            </span>
            <span className="overall-label">Impact Score</span>
          </div>
        </div>

        <div className="ring-legend">
          {rings.map((ring) => (
            <div key={ring.label} className="legend-item">
              <span className="legend-dot" style={{ background: ring.color }} />
              <span className="legend-label">{ring.label}</span>
              <span className="legend-value font-mono">{ring.score}%</span>
            </div>
          ))}
        </div>
      </div>

      <TierBadge tier={impactData.tier} nextTier={impactData.nextTier} progress={impactData.tierProgress} />

      <div className="impact-metrics-grid">
        <MetricCard
          icon={Cloud}
          value={impactData.metrics.stationsOnline}
          label="Stations Online"
          color="#22C55E"
        />
        <MetricCard
          icon={Database}
          value={impactData.metrics.liveReadings}
          label="Live Readings"
          color="#3B82F6"
        />
        <MetricCard
          icon={Trophy}
          value={impactData.metrics.lifetimeRewards}
          label="Lifetime Rewards"
          suffix=" WRF"
          decimals={1}
          color="#F59E0B"
        />
        <MetricCard
          icon={Activity}
          value={impactData.metrics.averageQuality}
          label="Average Quality"
          suffix="%"
          color="#8B5CF6"
        />
      </div>
    </div>
  );
};

export default ImpactScore;
