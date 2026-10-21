import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  CircularProgress,
  Grid,
} from '@mui/material';
import {
  Cloud as CloudIcon,
  CheckCircle as CheckCircleIcon,
  LinkOff as LinkOffIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';

// --- Types ---

export interface CloudPlatform {
  id: string;
  name: string;
  logoText: string;
  logoColor: string;
  connected: boolean;
  availableDateRange: { start: string; end: string } | null;
  recordCount: number | null;
}

export interface CloudConnectorProps {
  platforms: CloudPlatform[];
  /**
   * frontend#353: no backend route performs cloud OAuth or cloud import, so
   * every action renders disabled with this reason. The former Connect
   * waited 1.5 s and then reported the platform as connected.
   */
  unavailableReason: string;
}

// (mock data removed — platforms fetched from API in BatchUploadPage)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _MOCK_PLATFORMS_UNUSED: CloudPlatform[] = [
  {
    id: 'netatmo',
    name: 'Netatmo',
    logoText: 'N',
    logoColor: '#00B4D8',
    connected: true,
    availableDateRange: { start: '2024-03-01', end: '2025-12-31' },
    recordCount: 148_320,
  },
  {
    id: 'weatherlink',
    name: 'WeatherLink',
    logoText: 'WL',
    logoColor: '#2E7D32',
    connected: false,
    availableDateRange: null,
    recordCount: null,
  },
  {
    id: 'ambient',
    name: 'Ambient Weather',
    logoText: 'AW',
    logoColor: '#FF6F00',
    connected: true,
    availableDateRange: { start: '2025-01-15', end: '2025-12-28' },
    recordCount: 87_650,
  },
  {
    id: 'wunderground',
    name: 'Weather Underground',
    logoText: 'WU',
    logoColor: '#1565C0',
    connected: false,
    availableDateRange: null,
    recordCount: null,
  },
  {
    id: 'cwop',
    name: 'CWOP / APRS',
    logoText: 'CW',
    logoColor: '#7B1FA2',
    connected: false,
    availableDateRange: null,
    recordCount: null,
  },
  {
    id: 'ecowitt',
    name: 'Ecowitt',
    logoText: 'EC',
    logoColor: '#43A047',
    connected: false,
    availableDateRange: null,
    recordCount: null,
  },
];

// --- Component ---

const CloudConnector: React.FC<CloudConnectorProps> = ({
  platforms,
  unavailableReason,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: '#1E293B',
        borderRadius: 3,
        border: '1px solid rgba(59,130,246,0.15)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid rgba(248,250,252,0.06)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CloudIcon sx={{ color: '#3B82F6', fontSize: 22 }} />
          <Typography sx={{ color: '#F8FAFC', fontWeight: 700, fontSize: '0.95rem' }}>
            Cloud Platform Connections
          </Typography>
        </Box>
        <Typography sx={{ color: '#64748B', fontSize: '0.78rem', mt: 0.75 }}>
          Connect your weather station cloud accounts to import historical data directly.
          We use read-only OAuth access -- your credentials are never stored.
        </Typography>
      </Box>

      {/* Platform grid */}
      <Box sx={{ p: 3 }}>
        <Grid container spacing={2}>
          {platforms.map((platform) => {
            // Connecting never starts: there is no OAuth route behind it.
            const isConnecting = false;
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={platform.id}>
                <Paper
                  elevation={0}
                  sx={{
                    bgcolor: platform.connected
                      ? 'rgba(16,185,129,0.06)'
                      : 'rgba(15,23,42,0.5)',
                    border: platform.connected
                      ? '1px solid rgba(16,185,129,0.2)'
                      : '1px solid rgba(248,250,252,0.06)',
                    borderRadius: 2.5,
                    p: 2.5,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1.5,
                    transition: 'border-color 0.2s, background-color 0.2s',
                    '&:hover': {
                      borderColor: platform.connected
                        ? 'rgba(16,185,129,0.35)'
                        : 'rgba(59,130,246,0.3)',
                    },
                  }}
                >
                  {/* Logo */}
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: `${platform.logoColor}20`,
                      border: `2px solid ${platform.logoColor}40`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography
                      sx={{
                        color: platform.logoColor,
                        fontSize: '1rem',
                        fontWeight: 800,
                        fontFamily: '"Inter", sans-serif',
                      }}
                    >
                      {platform.logoText}
                    </Typography>
                  </Box>

                  {/* Name & status */}
                  <Typography
                    sx={{
                      color: '#F8FAFC',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      textAlign: 'center',
                    }}
                  >
                    {platform.name}
                  </Typography>

                  {platform.connected ? (
                    <>
                      <Chip
                        icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                        label="Connected"
                        size="small"
                        sx={{
                          height: 22,
                          bgcolor: 'rgba(16,185,129,0.15)',
                          color: '#10B981',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          '& .MuiChip-icon': { color: '#10B981' },
                          '& .MuiChip-label': { px: 0.75 },
                        }}
                      />

                      {/* Available data */}
                      {platform.availableDateRange && (
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography sx={{ color: '#94A3B8', fontSize: '0.68rem' }}>
                            {platform.availableDateRange.start} to {platform.availableDateRange.end}
                          </Typography>
                          <Typography
                            sx={{
                              color: '#F8FAFC',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              fontFamily: '"JetBrains Mono", monospace',
                              mt: 0.25,
                            }}
                          >
                            {platform.recordCount?.toLocaleString()} records
                          </Typography>
                        </Box>
                      )}

                      {/* Action buttons */}
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5, width: '100%' }}>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
                          disabled
                          title={unavailableReason}
                          sx={{
                            flex: 1,
                            bgcolor: '#3B82F6',
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            py: 0.5,
                            '&:hover': { bgcolor: '#2563EB' },
                          }}
                        >
                          Import
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<LinkOffIcon sx={{ fontSize: 14 }} />}
                          disabled
                          title={unavailableReason}
                          sx={{
                            borderColor: 'rgba(248,250,252,0.12)',
                            color: '#94A3B8',
                            textTransform: 'none',
                            fontSize: '0.7rem',
                            py: 0.5,
                            '&:hover': {
                              borderColor: 'rgba(239,68,68,0.4)',
                              color: '#EF4444',
                              bgcolor: 'rgba(239,68,68,0.06)',
                            },
                          }}
                        >
                          Disconnect
                        </Button>
                      </Box>
                    </>
                  ) : (
                    <>
                      <Chip
                        label="Not connected"
                        size="small"
                        sx={{
                          height: 22,
                          bgcolor: 'rgba(248,250,252,0.06)',
                          color: '#64748B',
                          fontSize: '0.7rem',
                          '& .MuiChip-label': { px: 0.75 },
                        }}
                      />

                      <Button
                        variant="outlined"
                        size="small"
                        disabled
                        title={unavailableReason}
                        startIcon={
                          isConnecting ? (
                            <CircularProgress size={14} sx={{ color: '#64748B' }} />
                          ) : (
                            <CloudIcon sx={{ fontSize: 16 }} />
                          )
                        }
                        sx={{
                          mt: 0.5,
                          width: '100%',
                          borderColor: 'rgba(59,130,246,0.3)',
                          color: '#3B82F6',
                          textTransform: 'none',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          '&:hover': {
                            borderColor: '#3B82F6',
                            bgcolor: 'rgba(59,130,246,0.08)',
                          },
                        }}
                      >
                        {isConnecting ? 'Connecting...' : 'Connect'}
                      </Button>
                    </>
                  )}
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Paper>
  );
};

export default CloudConnector;
