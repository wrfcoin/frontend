/**
 * NetworkHealth Component
 *
 * Circular gauge showing validator-derived network health from the backend.
 */

import React, { useEffect, useMemo, useState } from 'react';
import CountUp from 'react-countup';
import Alert from '@mui/material/Alert';
import {
  Activity,
  Wifi,
  Clock,
  Zap,
  Server,
  Shield,
} from 'lucide-react';
import { useValidators } from '../../hooks/api/useValidatorQueries';
import './NetworkHealth.css';

const HealthGauge = ({ value, maxValue = 100 }) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const percentage = (value / maxValue) * 100;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(percentage);
    }, 200);
    return () => clearTimeout(timer);
  }, [percentage]);

  const getColor = (pct) => {
    if (pct >= 90) return '#22C55E';
    if (pct >= 70) return '#F59E0B';
    return '#EF4444';
  };

  const color = getColor(animatedValue);
  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (animatedValue / 100) * circumference;

  return (
    <div className="health-gauge">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle
          cx="80"
          cy="80"
          r="70"
          fill="none"
          stroke="rgba(51, 65, 85, 0.3)"
          strokeWidth="10"
          strokeLinecap="round"
          transform="rotate(-90 80 80)"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * 0.25}
        />
        <circle
          cx="80"
          cy="80"
          r="70"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          transform="rotate(-90 80 80)"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset + circumference * 0.25}
          style={{
            transition: 'stroke-dashoffset 1.5s ease-out, stroke 0.5s ease',
            filter: `drop-shadow(0 0 8px ${color})`,
          }}
        />
      </svg>
      <div className="gauge-center">
        <span className="gauge-value font-mono" style={{ color }}>
          <CountUp end={value} duration={1.5} decimals={1} />
        </span>
        <span className="gauge-label">Health Score</span>
      </div>
    </div>
  );
};

const MetricCard = ({ icon: Icon, label, value, unit, status }) => (
  <div className={`metric-card ${status || ''}`}>
    <div className="metric-icon">
      <Icon size={16} />
    </div>
    <div className="metric-details">
      <span className="metric-label">{label}</span>
      <span className="metric-value font-mono">
        {value}
        {unit && <span className="metric-unit">{unit}</span>}
      </span>
    </div>
  </div>
);

const average = (values) => {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const getErrorMessage = (error, fallback) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

const NetworkHealth = () => {
  const validatorsQuery = useValidators();
  const healthData = useMemo(() => {
    const validators = validatorsQuery.data || [];
    const activeValidators = validators.filter((validator) => validator.status === 'online');
    const avgUptime = average(validators.map((validator) => validator.uptime));
    const avgEffectiveness = average(validators.map((validator) => validator.effectiveness));
    const totalAttestations = validators.reduce((sum, validator) => sum + validator.attestations, 0);
    const totalMissed = validators.reduce((sum, validator) => sum + validator.missedSlots, 0);
    const participation =
      totalAttestations + totalMissed > 0
        ? (totalAttestations / (totalAttestations + totalMissed)) * 100
        : avgEffectiveness;
    const score = validators.length > 0
      ? average([avgUptime, avgEffectiveness, participation])
      : 0;

    return {
      score,
      validators,
      metrics: {
        uptime: { value: avgUptime.toFixed(2), unit: '%', status: avgUptime >= 99 ? 'excellent' : avgUptime >= 95 ? 'good' : 'warning' },
        latency: { value: '--', unit: 'ms', status: '' },
        tps: { value: '--', unit: '', status: '' },
        nodes: { value: activeValidators.length, unit: `/${validators.length}`, status: activeValidators.length === validators.length ? 'excellent' : 'warning' },
        security: { value: score >= 90 ? 'A' : score >= 70 ? 'B' : 'Review', unit: '', status: score >= 90 ? 'excellent' : score >= 70 ? 'good' : 'warning' },
      },
    };
  }, [validatorsQuery.data]);

  const renderState = () => {
    if (validatorsQuery.isLoading) {
      return <Alert severity="info">Loading validator-backed network health...</Alert>;
    }

    if (validatorsQuery.isError) {
      return (
        <Alert severity="error">
          {getErrorMessage(validatorsQuery.error, 'Unable to load validator network health.')}
        </Alert>
      );
    }

    if (healthData.validators.length === 0) {
      return <Alert severity="info">No validator health data is currently available.</Alert>;
    }

    return null;
  };

  const state = renderState();

  return (
    <div className="network-health dashboard-card">
      <div className="health-header">
        <Activity size={18} />
        <h3>Network Health</h3>
        <span className="live-badge">
          <span className="live-dot" />
          Backend
        </span>
      </div>

      {state ? (
        <div className="health-content">{state}</div>
      ) : (
        <>
          <div className="health-content">
            <HealthGauge value={healthData.score} />

            <div className="health-metrics">
              <MetricCard
                icon={Clock}
                label="Uptime"
                value={healthData.metrics.uptime.value}
                unit={healthData.metrics.uptime.unit}
                status={healthData.metrics.uptime.status}
              />
              <MetricCard
                icon={Wifi}
                label="Latency"
                value={healthData.metrics.latency.value}
                unit={healthData.metrics.latency.unit}
                status={healthData.metrics.latency.status}
              />
              <MetricCard
                icon={Zap}
                label="TPS"
                value={healthData.metrics.tps.value}
                status={healthData.metrics.tps.status}
              />
              <MetricCard
                icon={Server}
                label="Nodes"
                value={healthData.metrics.nodes.value}
                unit={healthData.metrics.nodes.unit}
                status={healthData.metrics.nodes.status}
              />
              <MetricCard
                icon={Shield}
                label="Security"
                value={healthData.metrics.security.value}
                status={healthData.metrics.security.status}
              />
            </div>
          </div>

          <div className="health-status">
            <span className={`status-icon ${healthData.score >= 90 ? 'excellent' : 'warning'}`}>
              <Shield size={16} />
            </span>
            <span className="status-text">Validator telemetry loaded from backend</span>
          </div>
        </>
      )}
    </div>
  );
};

export default NetworkHealth;
