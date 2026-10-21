import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  Chip,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Wifi as WifiIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import OnboardingProgress from './OnboardingProgress';

interface DiscoveredStation {
  id: string;
  name: string;
  platform: string;
  location: string;
  channels: string[];
  signalStrength: number;
}

interface AutoDetectFlowProps {
  onStationConnected: (station: DiscoveredStation, stationName: string) => void;
  onBack: () => void;
}

type FlowPhase = 'scanning' | 'results' | 'connecting' | 'calibrating' | 'done';

/** Normalise a raw station object from the discover API to the DiscoveredStation shape. */
function normalizeStation(raw: Record<string, unknown>, idx: number): DiscoveredStation {
  const channels = Array.isArray(raw.channels)
    ? (raw.channels as string[])
    : Array.isArray(raw.sensors)
      ? (raw.sensors as string[])
      : Array.isArray(raw.measurements)
        ? (raw.measurements as string[])
        : [];
  return {
    id: String(raw.id ?? raw.station_id ?? raw.device_id ?? `disc-${idx}`),
    name: String(raw.name ?? raw.station_name ?? raw.model ?? 'Unknown Station'),
    platform: String(raw.platform ?? raw.manufacturer ?? raw.type ?? 'Unknown'),
    location: String(raw.location ?? raw.ip_address ?? raw.address ?? 'Local Network'),
    channels,
    signalStrength: Number(raw.signal_strength ?? raw.rssi ?? raw.signal ?? 0),
  };
}

const AutoDetectFlow: React.FC<AutoDetectFlowProps> = ({ onStationConnected, onBack }) => {
  const [phase, setPhase] = useState<FlowPhase>('scanning');
  const [discoveredStations, setDiscoveredStations] = useState<DiscoveredStation[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [selectedStation, setSelectedStation] = useState<DiscoveredStation | null>(null);
  const [connectionProgress, setConnectionProgress] = useState(0);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [statusData, setStatusData] = useState<Record<string, unknown> | null>(null);
  const cancelledRef = useRef(false);

  // Scanning phase — call real discover API with animated progress
  useEffect(() => {
    if (phase !== 'scanning') return;

    cancelledRef.current = false;
    let animFrame: ReturnType<typeof setInterval> | null = null;
    const start = Date.now();
    const minDuration = 4000; // keep animation for at least 4s for UX

    // Animate progress to 90% while waiting for response
    animFrame = setInterval(() => {
      const elapsed = Date.now() - start;
      setScanProgress(Math.min((elapsed / minDuration) * 90, 90));
    }, 50);

    fetch('/api/weather/stations/discover')
      .then(r => {
        if (r.status === 404 || r.status === 501) return [];
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: unknown) => {
        const raw: unknown[] = Array.isArray(data)
          ? data
          : (data as { stations?: unknown[]; devices?: unknown[] }).stations ??
            (data as { devices?: unknown[] }).devices ??
            [];
        return raw.map((item, i) =>
          normalizeStation(item as Record<string, unknown>, i),
        );
      })
      .catch(() => [] as DiscoveredStation[])
      .then((stations: DiscoveredStation[]) => {
        if (cancelledRef.current) return;
        if (animFrame) clearInterval(animFrame);

        // Ensure we show the animation for at least minDuration
        const remaining = minDuration - (Date.now() - start);
        const finish = () => {
          if (cancelledRef.current) return;
          setScanProgress(100);
          setDiscoveredStations(stations);
          setPhase('results');
        };

        if (remaining > 0) {
          setTimeout(finish, remaining);
        } else {
          finish();
        }
      });

    return () => {
      cancelledRef.current = true;
      if (animFrame) clearInterval(animFrame);
    };
  }, [phase]);

  // Connection handshake animation
  const handleConnect = useCallback((station: DiscoveredStation) => {
    setSelectedStation(station);
    setPhase('connecting');
    setConnectionProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 2;
      setConnectionProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        cancelledRef.current = false;
        setCalibrationProgress(0);
        setStatusData(null);
        setPhase('calibrating');
      }
    }, 30);
  }, []);

  // Calibration phase — poll GET /api/weather/stations/{id}/status for up to 60s
  useEffect(() => {
    if (phase !== 'calibrating' || !selectedStation) return;

    let elapsed = 0;
    const timeout = 60_000;
    const pollInterval = 5_000;

    const poll = async () => {
      if (cancelledRef.current) return;
      try {
        const r = await fetch(`/api/weather/stations/${selectedStation.id}/status`);
        if (r.ok) {
          const data = await r.json();
          if (!cancelledRef.current && data.last_reading) {
            setStatusData(data.last_reading as Record<string, unknown>);
            setCalibrationProgress(100);
            setPhase('done');
            return;
          }
        }
      } catch {
        // network hiccup — keep polling
      }

      elapsed += pollInterval;
      if (!cancelledRef.current) {
        setCalibrationProgress(Math.min((elapsed / timeout) * 100, 99));
      }

      if (elapsed >= timeout) {
        if (!cancelledRef.current) setPhase('done');
      } else {
        setTimeout(poll, pollInterval);
      }
    };

    setTimeout(poll, pollInterval);
    return () => {
      cancelledRef.current = true;
    };
  }, [phase, selectedStation]);

  // Radar sweep animation for scanning
  const renderRadarSweep = () => (
    <Box
      sx={{
        position: 'relative',
        width: 280,
        height: 280,
        mx: 'auto',
        mb: 4,
      }}
    >
      {/* Concentric rings */}
      {[1, 2, 3].map(ring => (
        <Box
          key={ring}
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: ring * 90,
            height: ring * 90,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            border: '1px solid rgba(56,189,248,0.15)',
          }}
        />
      ))}

      {/* Center dot */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 12,
          height: 12,
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: '#38bdf8',
          boxShadow: '0 0 12px rgba(56,189,248,0.6)',
          zIndex: 2,
        }}
      />

      {/* Sweep line */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '50%',
          height: 2,
          transformOrigin: '0 50%',
          background: 'linear-gradient(90deg, #38bdf8, transparent)',
          animation: 'radarSweep 2s linear infinite',
          '@keyframes radarSweep': {
            '0%': { transform: 'rotate(0deg)' },
            '100%': { transform: 'rotate(360deg)' },
          },
          zIndex: 1,
        }}
      />

      {/* Sweep cone */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 280,
          height: 280,
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          animation: 'radarSweep 2s linear infinite',
          background:
            'conic-gradient(from 0deg, rgba(56,189,248,0.12) 0deg, transparent 40deg, transparent 360deg)',
          zIndex: 0,
        }}
      />

      {/* Discovered station dots */}
      {discoveredStations.map((station, i) => {
        const angles = [-30, 45, 150, -120, 80];
        const distances = [0.5, 0.7, 0.35, 0.6, 0.45];
        const angle = ((angles[i % angles.length]) * Math.PI) / 180;
        const dist = (distances[i % distances.length]) * 120;
        const x = Math.cos(angle) * dist;
        const y = Math.sin(angle) * dist;

        return (
          <Box
            key={station.id}
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#34d399',
              boxShadow: '0 0 8px rgba(52,211,153,0.6)',
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
              animation: 'stationPing 1.5s ease-out',
              '@keyframes stationPing': {
                '0%': { transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(0)`, opacity: 0 },
                '50%': { transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(2)`, opacity: 0.5 },
                '100%': { transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(1)`, opacity: 1 },
              },
              zIndex: 3,
            }}
          />
        );
      })}
    </Box>
  );

  // Station card
  const renderStationCard = (station: DiscoveredStation, index: number) => (
    <Paper
      key={station.id}
      elevation={0}
      sx={{
        p: 2.5,
        backgroundColor: '#1E293B',
        borderRadius: 2,
        border: '1px solid #334155',
        animation: `slideInRight 0.4s ease-out ${index * 0.15}s both`,
        '@keyframes slideInRight': {
          '0%': { opacity: 0, transform: 'translateX(40px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
        '&:hover': {
          borderColor: '#38bdf8',
          backgroundColor: '#1e3a5f',
        },
        transition: 'border-color 0.2s, background-color 0.2s',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <WifiIcon sx={{ fontSize: 18, color: '#38bdf8' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f8fafc' }}>
              {station.name}
            </Typography>
          </Stack>
          <Typography variant="body2" sx={{ color: '#94a3b8', mb: 0.5 }}>
            {station.platform}
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            {station.location}
          </Typography>
          {station.channels.length > 0 && (
            <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ mt: 1.5 }}>
              {station.channels.map(ch => (
                <Chip
                  key={ch}
                  label={ch}
                  size="small"
                  icon={<CheckCircleIcon sx={{ fontSize: '14px !important', color: '#34d399 !important' }} />}
                  sx={{
                    backgroundColor: 'rgba(52,211,153,0.1)',
                    color: '#34d399',
                    fontSize: 11,
                    height: 24,
                    '& .MuiChip-icon': { ml: 0.5 },
                  }}
                />
              ))}
            </Stack>
          )}
        </Box>
        <Button
          variant="contained"
          size="small"
          onClick={() => handleConnect(station)}
          sx={{
            ml: 2,
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
            '&:hover': { background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' },
          }}
        >
          Connect
        </Button>
      </Stack>
    </Paper>
  );

  // Connection handshake
  const renderConnectionHandshake = () => (
    <Box sx={{ textAlign: 'center', py: 6 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          mb: 4,
        }}
      >
        {/* Your device */}
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: 2,
            backgroundColor: '#1E293B',
            border: '2px solid #38bdf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <WifiIcon sx={{ color: '#38bdf8', fontSize: 28 }} />
        </Box>

        {/* Pulsing connection line */}
        <Box
          sx={{
            width: 120,
            height: 4,
            borderRadius: 2,
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#334155',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: `${connectionProgress}%`,
              borderRadius: 2,
              background: 'linear-gradient(90deg, #38bdf8, #f59e0b)',
              transition: 'width 0.1s linear',
              boxShadow: '0 0 10px rgba(245,158,11,0.5)',
            }}
          />
        </Box>

        {/* Station */}
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: 2,
            backgroundColor: '#1E293B',
            border: `2px solid ${connectionProgress > 50 ? '#f59e0b' : '#334155'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'border-color 0.3s',
          }}
        >
          <Typography sx={{ fontSize: 28 }}>&#x1F4E1;</Typography>
        </Box>
      </Box>

      <Typography variant="h6" sx={{ color: '#f8fafc', fontWeight: 700 }}>
        Connecting to {selectedStation?.name}...
      </Typography>
      <Typography variant="body2" sx={{ color: '#64748b', mt: 1 }}>
        Establishing secure handshake
      </Typography>
    </Box>
  );

  // Calibration / status-verification ring
  const renderCalibration = () => (
    <Box sx={{ textAlign: 'center', py: 6 }}>
      <Box sx={{ position: 'relative', display: 'inline-flex', mb: 4 }}>
        <CircularProgress
          variant="determinate"
          value={calibrationProgress}
          size={140}
          thickness={3}
          sx={{
            color: '#38bdf8',
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
              filter: 'drop-shadow(0 0 6px rgba(56,189,248,0.4))',
            },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#f8fafc' }}>
            {Math.floor(calibrationProgress)}%
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            Verifying
          </Typography>
        </Box>
      </Box>

      <Typography variant="h6" sx={{ color: '#f8fafc', fontWeight: 700 }}>
        Waiting for first data…
      </Typography>
      <Typography variant="body2" sx={{ color: '#94a3b8', mt: 1, maxWidth: 360, mx: 'auto' }}>
        Checking that {selectedStation?.name} is transmitting weather readings
      </Typography>
    </Box>
  );

  const stepIndex =
    phase === 'scanning' ? 0 :
      phase === 'results' ? 1 :
        phase === 'connecting' ? 2 :
          phase === 'calibrating' ? 3 : 4;

  return (
    <Box sx={{ minHeight: '100vh', background: '#0F172A', p: 3 }}>
      <Box sx={{ maxWidth: 640, mx: 'auto' }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
          <IconButton onClick={onBack} sx={{ color: '#94a3b8' }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#f8fafc' }}>
            Auto-Detect Stations
          </Typography>
        </Stack>

        {/* Progress */}
        <Box sx={{ mb: 4 }}>
          <OnboardingProgress
            currentStep={stepIndex}
            totalSteps={4}
            labels={['Scan', 'Select', 'Connect', 'Verify']}
          />
        </Box>

        {/* Scanning / results phase */}
        {(phase === 'scanning' || phase === 'results') && (
          <>
            {renderRadarSweep()}

            {phase === 'scanning' && (
              <Typography
                variant="body1"
                sx={{ textAlign: 'center', color: '#94a3b8', mb: 3 }}
              >
                Scanning local network and cloud APIs…
              </Typography>
            )}

            {discoveredStations.length > 0 && (
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ color: '#64748b', mb: 2, textTransform: 'uppercase', letterSpacing: 1 }}
                >
                  {discoveredStations.length} Station{discoveredStations.length !== 1 ? 's' : ''} Found
                </Typography>
                <Stack spacing={2}>
                  {discoveredStations.map((station, i) => renderStationCard(station, i))}
                </Stack>
              </Box>
            )}

            {phase === 'results' && discoveredStations.length === 0 && (
              <Paper
                elevation={0}
                sx={{ p: 4, backgroundColor: '#1E293B', borderRadius: 2, textAlign: 'center' }}
              >
                <Typography variant="h6" sx={{ color: '#f8fafc', mb: 1 }}>
                  No stations found on local network
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
                  Try Manual Setup, or check your station is powered on and connected to WiFi.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                  <Button
                    variant="outlined"
                    onClick={onBack}
                    sx={{ textTransform: 'none', color: '#94a3b8', borderColor: '#334155' }}
                  >
                    Back to Options
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setPhase('scanning')}
                    sx={{ textTransform: 'none', color: '#38bdf8', borderColor: '#38bdf8' }}
                  >
                    Scan Again
                  </Button>
                </Stack>
              </Paper>
            )}
          </>
        )}

        {/* Connection handshake */}
        {phase === 'connecting' && renderConnectionHandshake()}

        {/* Calibration / status verification */}
        {phase === 'calibrating' && renderCalibration()}

        {/* Done */}
        {phase === 'done' && selectedStation && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <CheckCircleIcon sx={{ fontSize: 72, color: '#34d399', mb: 2 }} />
            <Typography variant="h5" sx={{ color: '#f8fafc', fontWeight: 700, mb: 1 }}>
              Station Connected!
            </Typography>
            {statusData ? (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  backgroundColor: '#1E293B',
                  borderRadius: 2,
                  border: '1px solid #334155',
                  mb: 4,
                  mx: 'auto',
                  maxWidth: 320,
                  textAlign: 'left',
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: '#64748b',
                    mb: 1.5,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    fontSize: 11,
                  }}
                >
                  First Reading
                </Typography>
                {Object.entries(statusData)
                  .slice(0, 4)
                  .map(([key, val]) => (
                    <Stack
                      key={key}
                      direction="row"
                      justifyContent="space-between"
                      sx={{ mb: 0.5 }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ color: '#94a3b8', textTransform: 'capitalize' }}
                      >
                        {key.replace(/_/g, ' ')}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#f8fafc', fontWeight: 600 }}>
                        {String(val)}
                      </Typography>
                    </Stack>
                  ))}
              </Paper>
            ) : (
              <Typography variant="body1" sx={{ color: '#94a3b8', mb: 4 }}>
                {selectedStation.name} is connected. First data will arrive shortly.
              </Typography>
            )}
            <Button
              variant="contained"
              size="large"
              onClick={() => onStationConnected(selectedStation, selectedStation.name)}
              sx={{
                px: 5,
                py: 1.5,
                borderRadius: 3,
                fontWeight: 700,
                textTransform: 'none',
                background: 'linear-gradient(135deg, #34d399, #38bdf8)',
                '&:hover': { background: 'linear-gradient(135deg, #10b981, #0ea5e9)' },
              }}
            >
              Continue to Welcome
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default AutoDetectFlow;
