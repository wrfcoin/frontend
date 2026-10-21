import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  TextField,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import OnboardingProgress from './OnboardingProgress';

interface RegisteredStation {
  id: string;
  name: string;
}

interface ScanConnectFlowProps {
  onComplete: (name: string) => void;
  onBack: () => void;
}

type Phase = 'entry' | 'registering' | 'verifying' | 'done' | 'error';

const ScanConnectFlow: React.FC<ScanConnectFlowProps> = ({ onComplete, onBack }) => {
  const [phase, setPhase] = useState<Phase>('entry');
  const [deviceId, setDeviceId] = useState('');
  const [deviceIdError, setDeviceIdError] = useState('');
  const [registeredStation, setRegisteredStation] = useState<RegisteredStation | null>(null);
  const [statusData, setStatusData] = useState<Record<string, unknown> | null>(null);
  const [verifyProgress, setVerifyProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const cancelledRef = useRef(false);

  const handleRegister = async () => {
    const trimmed = deviceId.trim();
    if (!trimmed) {
      setDeviceIdError('Please enter a device ID');
      return;
    }
    setDeviceIdError('');
    setPhase('registering');

    try {
      const r = await fetch('/api/weather/stations/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: trimmed }),
      });

      if (r.status === 404) {
        setErrorMessage('Station not found — try Manual Setup.');
        setPhase('error');
        return;
      }

      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        if (r.status === 409) {
          setErrorMessage(
            'This station is already registered. Check your dashboard to manage it.',
          );
        } else if (!navigator.onLine) {
          setErrorMessage('Network unreachable — check your connection and try again.');
        } else {
          setErrorMessage((body as { message?: string }).message ?? `Registration failed (${r.status}).`);
        }
        setPhase('error');
        return;
      }

      const data = await r.json();
      const station: RegisteredStation = {
        id: (data.id ?? data.station_id ?? trimmed) as string,
        name: (data.name ?? data.station_name ?? `Station ${trimmed}`) as string,
      };
      setRegisteredStation(station);
      cancelledRef.current = false;
      setPhase('verifying');
    } catch {
      setErrorMessage(
        !navigator.onLine
          ? 'Network unreachable — check your connection and try again.'
          : 'Unable to connect to the server. Try again shortly.',
      );
      setPhase('error');
    }
  };

  // Poll GET /api/weather/stations/{id}/status for up to 60s after registration
  useEffect(() => {
    if (phase !== 'verifying' || !registeredStation) return;

    let elapsed = 0;
    const timeout = 60_000;
    const pollInterval = 5_000;

    const poll = async () => {
      if (cancelledRef.current) return;
      try {
        const r = await fetch(`/api/weather/stations/${registeredStation.id}/status`);
        if (r.ok) {
          const data = await r.json();
          if (!cancelledRef.current && data.last_reading) {
            setStatusData(data.last_reading as Record<string, unknown>);
            setVerifyProgress(100);
            setPhase('done');
            return;
          }
        }
      } catch {
        // network hiccup — keep polling
      }

      elapsed += pollInterval;
      if (!cancelledRef.current) {
        setVerifyProgress(Math.min((elapsed / timeout) * 100, 99));
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
  }, [phase, registeredStation]);

  const stepIndex =
    phase === 'entry' ? 0 :
      phase === 'registering' ? 1 :
        phase === 'verifying' ? 2 : 3;

  return (
    <Box sx={{ minHeight: '100vh', background: '#0F172A', p: 3 }}>
      <Box sx={{ maxWidth: 560, mx: 'auto' }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
          <IconButton onClick={onBack} sx={{ color: '#94a3b8' }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#f8fafc' }}>
            Scan & Connect
          </Typography>
        </Stack>

        {/* Progress */}
        <Box sx={{ mb: 4 }}>
          <OnboardingProgress
            currentStep={stepIndex}
            totalSteps={3}
            labels={['Enter ID', 'Register', 'Verify']}
          />
        </Box>

        {/* Entry phase */}
        {phase === 'entry' && (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              backgroundColor: '#1E293B',
              borderRadius: 3,
              border: '1px solid #334155',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#f8fafc', mb: 1 }}>
              Enter your station's device ID
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
              Find the serial number or MAC address on the label on the back or bottom of your
              station.
            </Typography>
            <TextField
              fullWidth
              label="Device ID (serial number or MAC address)"
              value={deviceId}
              onChange={e => {
                setDeviceId(e.target.value);
                setDeviceIdError('');
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') handleRegister();
              }}
              error={Boolean(deviceIdError)}
              helperText={deviceIdError}
              placeholder="e.g. A1B2C3D4E5F6 or WS-2902-12345"
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  color: '#f8fafc',
                  '& fieldset': { borderColor: '#334155' },
                  '&:hover fieldset': { borderColor: '#38bdf8' },
                  '&.Mui-focused fieldset': { borderColor: '#38bdf8' },
                },
                '& .MuiInputLabel-root': { color: '#64748b' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#38bdf8' },
                '& .MuiFormHelperText-root': { color: '#f87171' },
              }}
            />
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleRegister}
              sx={{
                py: 1.5,
                borderRadius: 2,
                fontWeight: 700,
                textTransform: 'none',
                background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
                '&:hover': { background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' },
              }}
            >
              Connect Station
            </Button>
          </Paper>
        )}

        {/* Registering phase */}
        {phase === 'registering' && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#38bdf8', mb: 3 }} size={56} />
            <Typography variant="h6" sx={{ color: '#f8fafc', fontWeight: 700 }}>
              Registering your station…
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', mt: 1 }}>
              Pairing device {deviceId}
            </Typography>
          </Box>
        )}

        {/* Verifying phase */}
        {phase === 'verifying' && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Box sx={{ position: 'relative', display: 'inline-flex', mb: 4 }}>
              <CircularProgress
                variant="determinate"
                value={verifyProgress}
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
                  {Math.floor(verifyProgress)}%
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Verifying
                </Typography>
              </Box>
            </Box>
            <Typography variant="h6" sx={{ color: '#f8fafc', fontWeight: 700 }}>
              Waiting for first data…
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: '#94a3b8', mt: 1, maxWidth: 360, mx: 'auto' }}
            >
              Checking that {registeredStation?.name} is transmitting weather readings
            </Typography>
          </Box>
        )}

        {/* Done phase */}
        {phase === 'done' && (
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
                {registeredStation?.name} is registered. First data will arrive shortly.
              </Typography>
            )}
            <Button
              variant="contained"
              size="large"
              onClick={() => onComplete(registeredStation?.name ?? deviceId)}
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

        {/* Error phase */}
        {phase === 'error' && (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              backgroundColor: '#1E293B',
              borderRadius: 3,
              border: '1px solid #334155',
              textAlign: 'center',
            }}
          >
            <Typography variant="h6" sx={{ color: '#f8fafc', mb: 1 }}>
              Couldn't connect station
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
              {errorMessage}
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="center"
            >
              <Button
                variant="outlined"
                onClick={() => {
                  setPhase('entry');
                  setErrorMessage('');
                }}
                sx={{ textTransform: 'none', borderColor: '#334155', color: '#94a3b8' }}
              >
                Try Again
              </Button>
              <Button
                variant="outlined"
                onClick={onBack}
                sx={{ textTransform: 'none', borderColor: '#38bdf8', color: '#38bdf8' }}
              >
                Back to Options
              </Button>
            </Stack>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default ScanConnectFlow;
