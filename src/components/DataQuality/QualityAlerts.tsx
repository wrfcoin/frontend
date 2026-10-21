import DemoSurfaceGate from '../common/DemoSurfaceGate';
import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
} from '@mui/material';

// --- Types ---

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface QualityAlert {
  id: string;
  timestamp: string;
  severity: AlertSeverity;
  dimension: string;
  title: string;
  description: string;
  suggestedAction: string;
  acknowledged: boolean;
}

interface QualityAlertsProps {
  alerts: QualityAlert[];
  onAcknowledge?: (alertId: string) => void;
  onDismiss?: (alertId: string) => void;
}

// --- Mock Data ---

function daysAgo(n: number, hours = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

// (mock data removed — alerts provided via props from DataQualityDashboard)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _MOCK_ALERTS_UNUSED: QualityAlert[] = [
  {
    id: 'a1',
    timestamp: daysAgo(0, 2),
    severity: 'critical',
    dimension: 'Temporal Consistency',
    title: 'Data gap detected (47 minutes)',
    description:
      'No readings received between 03:14 and 04:01 UTC. This exceeds the 15-minute gap threshold and may indicate a power or connectivity interruption.',
    suggestedAction:
      'Check station power supply and network connection. Consider installing a UPS to prevent data gaps during brief outages.',
    acknowledged: false,
  },
  {
    id: 'a2',
    timestamp: daysAgo(0, 6),
    severity: 'warning',
    dimension: 'Spatial Consensus',
    title: 'Wind direction deviation from neighbors',
    description:
      'Average wind direction deviates 52 degrees from nearby stations. This may indicate an obstruction near the anemometer.',
    suggestedAction:
      'Inspect the area around your anemometer for new obstructions such as buildings, fences, or vegetation. Ensure the sensor is mounted at least 10m above ground level.',
    acknowledged: false,
  },
  {
    id: 'a3',
    timestamp: daysAgo(1, 3),
    severity: 'critical',
    dimension: 'Temporal Consistency',
    title: 'Humidity spike (45%/hr)',
    description:
      'Humidity changed by 45% in one hour, exceeding the 30%/hr threshold. This is consistent with condensation forming directly on the sensor.',
    suggestedAction:
      'Check the humidity sensor housing for condensation. Ensure the radiation shield has adequate ventilation. Consider adding desiccant packs.',
    acknowledged: false,
  },
  {
    id: 'a4',
    timestamp: daysAgo(2),
    severity: 'warning',
    dimension: 'Range Validation',
    title: 'UV Index exceeded maximum (15.0)',
    description:
      '2 UV index readings exceeded the physical maximum of 15.0 during the midday period. These values have been flagged as suspect.',
    suggestedAction:
      'Recalibrate the UV sensor. Perform a shading test to verify the zero offset. Replace the diffuser if it shows signs of yellowing or damage.',
    acknowledged: true,
  },
  {
    id: 'a5',
    timestamp: daysAgo(3, 8),
    severity: 'info',
    dimension: 'Cross-Parameter',
    title: 'Night-time solar radiation detected',
    description:
      'Nonzero solar radiation (12 W/m2) was recorded at 02:14 local time. This is physically implausible and likely indicates a sensor issue.',
    suggestedAction:
      'Cover the pyranometer at night to perform a dark-current test. If readings persist, the photodiode may have a light leak and should be replaced.',
    acknowledged: true,
  },
  {
    id: 'a6',
    timestamp: daysAgo(5),
    severity: 'info',
    dimension: 'Cross-Parameter',
    title: 'Cross-parameter validation improved',
    description:
      'Your cross-parameter validation score increased from 89 to 91 since last week. The pressure-weather correlation is now in excellent agreement.',
    suggestedAction:
      'No action needed. Continue maintaining current sensor configuration.',
    acknowledged: true,
  },
  {
    id: 'a7',
    timestamp: daysAgo(7),
    severity: 'warning',
    dimension: 'Spatial Consensus',
    title: 'Temperature offset from regional average',
    description:
      'Station temperature is consistently 2.8C above regional average. This may indicate the sensor is affected by a nearby heat source or insufficient shielding.',
    suggestedAction:
      'Verify the temperature sensor is inside a proper radiation shield. Check for nearby heat sources (HVAC exhaust, asphalt, concrete). Relocate if necessary.',
    acknowledged: true,
  },
];

// --- Helpers ---

const SEVERITY_CONFIG: Record<AlertSeverity, { color: string; bg: string; label: string }> = {
  critical: { color: '#EF4444', bg: 'rgba(239,68,68,0.10)', label: 'Critical' },
  warning: { color: '#F59E0B', bg: 'rgba(245,158,11,0.10)', label: 'Warning' },
  info: { color: '#3B82F6', bg: 'rgba(59,130,246,0.10)', label: 'Info' },
};

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHrs / 24);

  if (diffHrs < 1) return 'Just now';
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}

// --- Component ---

const QualityAlertsSample: React.FC<QualityAlertsProps> = ({
  alerts: initialAlerts,
  onAcknowledge,
  onDismiss,
}) => {
  const [alerts, setAlerts] = useState<QualityAlert[]>(initialAlerts);
  const [filter, setFilter] = useState<AlertSeverity | 'all'>('all');

  const filteredAlerts = useMemo(() => {
    const list = filter === 'all' ? alerts : alerts.filter((a) => a.severity === filter);
    return list.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [alerts, filter]);

  const counts = useMemo(() => {
    const c = { critical: 0, warning: 0, info: 0 };
    alerts.forEach((a) => {
      if (!a.acknowledged) c[a.severity]++;
    });
    return c;
  }, [alerts]);

  const handleAcknowledge = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)),
    );
    onAcknowledge?.(id);
  };

  const handleDismiss = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    onDismiss?.(id);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: '#1E293B',
        borderRadius: 3,
        border: '1px solid rgba(248,250,252,0.06)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          borderBottom: '1px solid rgba(248,250,252,0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography
            variant="subtitle2"
            sx={{ color: '#F8FAFC', fontWeight: 700, letterSpacing: 0.5 }}
          >
            QUALITY ALERTS
          </Typography>
          {/* Unacknowledged counts */}
          {counts.critical > 0 && (
            <Chip
              label={counts.critical}
              size="small"
              sx={{
                bgcolor: 'rgba(239,68,68,0.15)',
                color: '#EF4444',
                fontWeight: 700,
                fontSize: '0.65rem',
                height: 20,
                '& .MuiChip-label': { px: 0.75 },
              }}
            />
          )}
          {counts.warning > 0 && (
            <Chip
              label={counts.warning}
              size="small"
              sx={{
                bgcolor: 'rgba(245,158,11,0.15)',
                color: '#F59E0B',
                fontWeight: 700,
                fontSize: '0.65rem',
                height: 20,
                '& .MuiChip-label': { px: 0.75 },
              }}
            />
          )}
        </Box>

        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={(_, v) => v && setFilter(v)}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              color: '#64748B',
              borderColor: 'rgba(148,163,184,0.15)',
              textTransform: 'none',
              px: 1.25,
              py: 0.25,
              fontSize: '0.68rem',
              fontWeight: 600,
              '&.Mui-selected': {
                color: '#3B82F6',
                bgcolor: 'rgba(59,130,246,0.12)',
                borderColor: 'rgba(59,130,246,0.30)',
              },
            },
          }}
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="critical">Critical</ToggleButton>
          <ToggleButton value="warning">Warning</ToggleButton>
          <ToggleButton value="info">Info</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Alert List */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 1.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {filteredAlerts.length === 0 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              py: 6,
            }}
          >
            <Typography sx={{ color: '#475569', fontSize: '0.85rem' }}>
              No alerts matching the current filter.
            </Typography>
          </Box>
        )}

        {filteredAlerts.map((alert) => {
          const sev = SEVERITY_CONFIG[alert.severity];
          return (
            <Box
              key={alert.id}
              sx={{
                bgcolor: alert.acknowledged ? 'rgba(248,250,252,0.02)' : sev.bg,
                border: `1px solid ${alert.acknowledged ? 'rgba(148,163,184,0.08)' : `${sev.color}20`}`,
                borderRadius: 2,
                px: 2,
                py: 1.5,
                opacity: alert.acknowledged ? 0.7 : 1,
                transition: 'opacity 0.2s ease',
              }}
            >
              {/* Top row: severity + dimension + timestamp */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 0.75,
                  flexWrap: 'wrap',
                }}
              >
                <Chip
                  label={sev.label}
                  size="small"
                  sx={{
                    bgcolor: `${sev.color}20`,
                    color: sev.color,
                    fontWeight: 700,
                    fontSize: '0.6rem',
                    height: 18,
                    '& .MuiChip-label': { px: 0.75 },
                  }}
                />
                <Chip
                  label={alert.dimension}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: 'rgba(148,163,184,0.20)',
                    color: '#94A3B8',
                    fontSize: '0.6rem',
                    height: 18,
                    '& .MuiChip-label': { px: 0.75 },
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: '#475569',
                    fontSize: '0.63rem',
                    ml: 'auto',
                  }}
                >
                  {formatTimestamp(alert.timestamp)}
                </Typography>
              </Box>

              {/* Title */}
              <Typography
                sx={{
                  color: '#F8FAFC',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  mb: 0.5,
                }}
              >
                {alert.title}
              </Typography>

              {/* Description */}
              <Typography
                sx={{
                  color: '#94A3B8',
                  fontSize: '0.73rem',
                  lineHeight: 1.5,
                  mb: 1,
                }}
              >
                {alert.description}
              </Typography>

              {/* Suggested Action */}
              <Box
                sx={{
                  bgcolor: 'rgba(59,130,246,0.06)',
                  border: '1px solid rgba(59,130,246,0.10)',
                  borderRadius: 1.5,
                  px: 1.5,
                  py: 0.75,
                  mb: 1,
                }}
              >
                <Typography
                  sx={{
                    color: '#64748B',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    letterSpacing: 0.3,
                    mb: 0.25,
                  }}
                >
                  SUGGESTED ACTION
                </Typography>
                <Typography sx={{ color: '#94A3B8', fontSize: '0.72rem', lineHeight: 1.5 }}>
                  {alert.suggestedAction}
                </Typography>
              </Box>

              {/* Actions */}
              {!alert.acknowledged && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    onClick={() => handleAcknowledge(alert.id)}
                    sx={{
                      color: '#3B82F6',
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      px: 1.5,
                      py: 0.25,
                      borderRadius: 1,
                      '&:hover': { bgcolor: 'rgba(59,130,246,0.10)' },
                    }}
                  >
                    Acknowledge
                  </Button>
                  <Button
                    size="small"
                    onClick={() => handleDismiss(alert.id)}
                    sx={{
                      color: '#64748B',
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      px: 1.5,
                      py: 0.25,
                      borderRadius: 1,
                      '&:hover': { bgcolor: 'rgba(148,163,184,0.08)' },
                    }}
                  >
                    Dismiss
                  </Button>
                </Box>
              )}
              {alert.acknowledged && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Typography
                    variant="caption"
                    sx={{ color: '#475569', fontSize: '0.65rem', fontStyle: 'italic' }}
                  >
                    Acknowledged
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleDismiss(alert.id)}
                    sx={{
                      color: '#475569',
                      p: 0.25,
                      '&:hover': { color: '#EF4444' },
                    }}
                  >
                    <Typography sx={{ fontSize: '0.7rem' }}>{'\u2715'}</Typography>
                  </IconButton>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
};

const QualityAlerts: React.FC<React.ComponentProps<typeof QualityAlertsSample>> = (props) => (
  <DemoSurfaceGate
    testId="quality-alerts"
    title="Quality alerts is not live on this testnet"
    description="This preview contains illustrative data or simulated actions, not verified testnet results."
  >
    <QualityAlertsSample {...props} />
  </DemoSurfaceGate>
);

export default QualityAlerts;
