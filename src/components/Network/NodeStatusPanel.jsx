/**
 * NodeStatusPanel Component
 *
 * Grid of validator cards showing real status,
 * effectiveness, uptime, and participation metrics.
 */

import React, { useMemo } from 'react';
import Alert from '@mui/material/Alert';
import {
  Server,
  Gauge,
  Activity,
  ShieldCheck,
  Clock,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useValidators } from '../../hooks/api/useValidatorQueries';
import './NodeStatusPanel.css';

const ResourceBar = ({ label, value, max, color, icon: Icon }) => {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div className="resource-bar">
      <div className="resource-header">
        <div className="resource-label">
          <Icon size={12} />
          <span>{label}</span>
        </div>
        <span className="resource-value font-mono">{value.toFixed(1)}%</span>
      </div>
      <div className="resource-track">
        <div
          className="resource-fill"
          style={{
            width: `${percentage}%`,
            '--bar-color': color,
          }}
        />
      </div>
    </div>
  );
};

const getStatusColor = (status) => {
  switch (status) {
  case 'active': return '#22C55E';
  case 'syncing': return '#3B82F6';
  case 'warning': return '#F59E0B';
  case 'offline': return '#EF4444';
  default: return '#64748B';
  }
};

const getStatusLabel = (status) => {
  switch (status) {
  case 'active': return 'Active';
  case 'syncing': return 'Syncing';
  case 'warning': return 'Warning';
  case 'offline': return 'Offline';
  default: return 'Unknown';
  }
};

const getNodeStatus = (status) => {
  if (status === 'online') return 'active';
  if (status === 'degraded') return 'warning';
  if (status === 'syncing') return 'syncing';
  return 'offline';
};

const getErrorMessage = (error, fallback) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

const NodeCard = ({ node }) => {
  const statusColor = getStatusColor(node.status);

  return (
    <div className={`node-card ${node.status}`}>
      <div className="node-header">
        <div className="node-info">
          <div className="node-icon">
            <Server size={18} />
          </div>
          <div className="node-details">
            <span className="node-name">{node.name}</span>
            <span className="node-id font-mono">{node.id}</span>
          </div>
        </div>
        <div className="node-status" style={{ '--status-color': statusColor }}>
          <span className="status-dot" />
          <span className="status-label">{getStatusLabel(node.status)}</span>
        </div>
      </div>

      <div className="node-resources">
        <ResourceBar
          label="Effectiveness"
          value={node.effectiveness}
          max={100}
          color="#A855F7"
          icon={Gauge}
        />
        <ResourceBar
          label="Uptime"
          value={node.uptime}
          max={100}
          color="#3B82F6"
          icon={Activity}
        />
        <ResourceBar
          label="Participation"
          value={node.participation}
          max={100}
          color="#22C55E"
          icon={ShieldCheck}
        />
      </div>

      <div className="node-stats">
        <div className="node-stat">
          <Clock size={14} />
          <span className="stat-label">Uptime</span>
          <span className="stat-value font-mono">{node.uptimeLabel}</span>
        </div>
        <div className="node-stat">
          <CheckCircle2 size={14} />
          <span className="stat-label">Attestations</span>
          <span className="stat-value font-mono">{node.attestations.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

const NodeStatusPanel = () => {
  const validatorsQuery = useValidators();
  const nodes = useMemo(
    () =>
      (validatorsQuery.data || []).map((validator) => {
        const totalChecks = validator.attestations + validator.missedSlots;
        const participation =
          totalChecks > 0
            ? (validator.attestations / totalChecks) * 100
            : validator.status === 'offline'
              ? 0
              : validator.effectiveness;

        return {
          id: validator.id,
          name: validator.name,
          status: getNodeStatus(validator.status),
          effectiveness: Number(validator.effectiveness.toFixed(1)),
          uptime: Number(validator.uptime.toFixed(1)),
          participation: Number(participation.toFixed(1)),
          uptimeLabel: `${validator.uptime.toFixed(2)}%`,
          attestations: validator.attestations,
        };
      }),
    [validatorsQuery.data],
  );
  const activeNodes = nodes.filter((node) => node.status === 'active').length;
  const totalAttestations = nodes.reduce((sum, node) => sum + node.attestations, 0);

  if (validatorsQuery.isLoading) {
    return (
      <div className="node-status-panel dashboard-card">
        <div className="panel-title">
          <Server size={18} />
          <h3>Node Status</h3>
        </div>
        <Alert severity="info">Loading validator status...</Alert>
      </div>
    );
  }

  if (validatorsQuery.isError) {
    return (
      <div className="node-status-panel dashboard-card">
        <div className="panel-title">
          <Server size={18} />
          <h3>Node Status</h3>
        </div>
        <Alert severity="error">
          {getErrorMessage(validatorsQuery.error, 'Unable to load validator status.')}
        </Alert>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="node-status-panel dashboard-card">
        <div className="panel-title">
          <Server size={18} />
          <h3>Node Status</h3>
        </div>
        <Alert severity="info">No validators are currently available.</Alert>
      </div>
    );
  }

  return (
    <div className="node-status-panel dashboard-card">
      <div className="panel-header">
        <div className="panel-title">
          <Server size={18} />
          <h3>Node Status</h3>
        </div>
        <div className="panel-meta">
          <span className="active-count">
            <span className="count-value font-mono">{activeNodes}</span>
            <span className="count-label">/ {nodes.length} Active</span>
          </span>
          <span className="last-update">
            <RefreshCw size={12} />
            Live validator API
          </span>
        </div>
      </div>

      <div className="panel-summary">
        <div className="summary-stat">
          <span className="summary-value font-mono">{totalAttestations.toLocaleString()}</span>
          <span className="summary-label">Total Attestations</span>
        </div>
      </div>

      <div className="nodes-grid">
        {nodes.map((node) => (
          <NodeCard key={node.id} node={node} />
        ))}
      </div>
    </div>
  );
};

export default NodeStatusPanel;
