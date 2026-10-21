import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import type { WeatherStation } from '../../services/apiClient/types';

// --- Types ---

export interface Station {
  id: string;
  name: string;
  status: WeatherStation['status'];
}

interface StationStatusBarProps {
  stations: Station[];
  activeStationId: string;
  onStationSelect: (id: string) => void;
}

// --- Helpers ---

const STATUS_CONFIG = {
  live: { label: 'LIVE', color: '#22C55E', bgAlpha: '1a' },
  sleeping: { label: 'SLEEPING', color: '#FACC15', bgAlpha: '1a' },
  offline: { label: 'OFFLINE', color: '#EF4444', bgAlpha: '1a' },
  maintenance: { label: 'MAINT', color: '#F97316', bgAlpha: '1a' },
  // frontend#415: freshness states; neutral for "registered" and unknown.
  stale: { label: 'STALE', color: '#F59E0B', bgAlpha: '1a' },
  registered: { label: 'REGISTERED', color: '#94A3B8', bgAlpha: '1a' },
  unknown: { label: 'UNKNOWN', color: '#94A3B8', bgAlpha: '1a' },
} as const;

const pulseKeyframes = `
@keyframes stationPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
`;

// --- Component ---

const StationStatusBar: React.FC<StationStatusBarProps> = ({
  stations,
  activeStationId,
  onStationSelect,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1.5,
        overflowX: 'auto',
        '&::-webkit-scrollbar': { height: 4 },
        '&::-webkit-scrollbar-thumb': {
          bgcolor: 'rgba(248,250,252,0.1)',
          borderRadius: 2,
        },
      }}
    >
      <style>{pulseKeyframes}</style>

      <Typography
        variant="caption"
        sx={{ color: '#94A3B8', fontWeight: 600, letterSpacing: 1, mr: 0.5, flexShrink: 0 }}
      >
        STATIONS
      </Typography>

      {stations.length === 0 && (
        <Typography variant="caption" sx={{ color: '#64748B' }}>
          No stations available
        </Typography>
      )}

      {stations.map((station) => {
        const cfg = STATUS_CONFIG[station.status];
        const isActive = station.id === activeStationId;

        return (
          <Chip
            key={station.id}
            onClick={() => onStationSelect(station.id)}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: cfg.color,
                    ...(station.status === 'live' && {
                      animation: 'stationPulse 2s ease-in-out infinite',
                    }),
                  }}
                />
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#F8FAFC', fontSize: '0.75rem' }}>
                  {station.name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.6rem',
                    letterSpacing: 0.5,
                    color: cfg.color,
                  }}
                >
                  {cfg.label}
                </Typography>
              </Box>
            }
            sx={{
              bgcolor: isActive
                ? `${cfg.color}${cfg.bgAlpha}`
                : 'rgba(248,250,252,0.04)',
              border: isActive
                ? `1.5px solid ${cfg.color}40`
                : '1.5px solid rgba(248,250,252,0.08)',
              borderRadius: '20px',
              cursor: 'pointer',
              height: 36,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: `${cfg.color}${cfg.bgAlpha}`,
                borderColor: `${cfg.color}40`,
              },
              '& .MuiChip-label': { px: 1.5 },
            }}
          />
        );
      })}
    </Box>
  );
};

export default StationStatusBar;
