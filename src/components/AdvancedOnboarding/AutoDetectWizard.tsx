import DemoSurfaceGate from '../common/DemoSurfaceGate';
import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import TextField from '@mui/material/TextField';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SearchIcon from '@mui/icons-material/Search';
import WifiIcon from '@mui/icons-material/Wifi';
import CloudIcon from '@mui/icons-material/Cloud';
import LinkIcon from '@mui/icons-material/Link';
import { colors, spacing, borderRadius, shadows } from '../ui/tokens';
import { WrfCard, WrfStatCard, WrfButton, WrfBadge } from '../ui';
import { apiClient } from '../../services/apiClient';

const PLATFORMS = [
  { name: 'Netatmo', icon: '🌡️', color: '#4FC1E9', type: 'OAuth' },
  { name: 'Davis WeatherLink', icon: '🌤️', color: '#FF6B6B', type: 'API Key' },
  { name: 'Ambient Weather', icon: '☁️', color: '#48CFAD', type: 'API Key' },
  { name: 'Ecowitt', icon: '🌧️', color: '#A0D468', type: 'Local' },
  { name: 'Helium Network', icon: '📡', color: '#967ADC', type: 'LoRaWAN' },
  { name: 'The Things Network', icon: '🔗', color: '#5D9CEC', type: 'LoRaWAN' },
  { name: 'PurpleAir', icon: '💨', color: '#AC92EC', type: 'API Key' },
  { name: 'AcuRite', icon: '🌬️', color: '#EC87C0', type: 'Cloud' },
];

interface DiscoveredDevice {
  id: number;
  name: string;
  platform: string;
  model: string;
  location: string;
  channels: number;
  quality: number;
  status: 'ready' | 'needs_config';
}

function normalizeDiscoveredDevice(raw: Record<string, unknown>, idx: number): DiscoveredDevice {
  return {
    id: Number(raw.id ?? raw.station_id ?? raw.device_id ?? idx + 1),
    name: String(raw.name ?? raw.station_name ?? `Device ${idx + 1}`),
    platform: String(raw.platform ?? raw.manufacturer ?? raw.type ?? 'Unknown'),
    model: String(raw.model ?? raw.device_model ?? 'Unknown Model'),
    location: String(raw.location ?? raw.ip_address ?? 'Local Network'),
    channels: Number(raw.channels ?? raw.channel_count ?? 0),
    quality: Number(raw.quality ?? raw.quality_score ?? 0),
    status: raw.status === 'ready' ? 'ready' : 'needs_config',
  };
}

const AutoDetectWizardSample = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [scanPhase, setScanPhase] = useState<'idle' | 'local' | 'cloud' | 'lora' | 'done'>('idle');
  const [scanProgress, setScanProgress] = useState(0);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [apiValid, setApiValid] = useState<boolean | null>(null);
  const [validating, setValidating] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState<number[]>([]);
  const [discovered, setDiscovered] = useState<DiscoveredDevice[]>([]);

  useEffect(() => {
    if (scanPhase === 'idle') return;
    const phases = ['local', 'cloud', 'lora', 'done'] as const;
    const idx = phases.indexOf(scanPhase as any);
    if (idx === -1) return;
    const interval = setInterval(() => {
      setScanProgress(p => {
        const target = ((idx + 1) / 3) * 100;
        if (p >= target) {
          clearInterval(interval);
          if (scanPhase !== 'done') {
            const next = phases[idx + 1];
            if (next) setTimeout(() => setScanPhase(next), 500);
          }
          return target;
        }
        return p + 2;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [scanPhase]);

  // Fetch real devices from IoT discovery API when scanning begins
  useEffect(() => {
    if (scanPhase !== 'local') return;
    setDiscovered([]);
    const platform = encodeURIComponent(selectedPlatform ?? '');
    apiClient.get<unknown>(`/iot/devices/discover?platform=${platform}`)
      .then((data) => {
        const raw = Array.isArray(data)
          ? data
          : ((data as { devices?: unknown[] }).devices ?? []);
        setDiscovered(
          (raw as Record<string, unknown>[]).map((item, i) =>
            normalizeDiscoveredDevice(item, i),
          ),
        );
      })
      .catch(() => setDiscovered([]));
  }, [scanPhase, selectedPlatform]);

  const handleApiKeyChange = (val: string) => {
    setApiKey(val);
    setApiValid(null);
  };

  const handleValidateApiKey = () => {
    if (!apiKey || !selectedPlatform) return;
    setValidating(true);
    apiClient.post<unknown>('/iot/platforms/authenticate', { platform: selectedPlatform, apiKey })
      .then(() => setApiValid(true))
      .catch(() => setApiValid(false))
      .finally(() => setValidating(false));
  };

  const steps = ['Select Platform', 'Authenticate', 'Discover Devices', 'Connect'];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.bg.primary, color: colors.text.primary, p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Auto-Detect Wizard</Typography>
      <Typography sx={{ color: colors.text.secondary, mb: 3 }}>Automatically discover and connect your weather stations</Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4, '& .MuiStepLabel-label': { color: colors.text.secondary }, '& .MuiStepLabel-label.Mui-active': { color: colors.text.primary }, '& .MuiStepIcon-root': { color: colors.bg.tertiary }, '& .MuiStepIcon-root.Mui-active': { color: colors.brand.primary }, '& .MuiStepIcon-root.Mui-completed': { color: colors.success.main } }}>
        {steps.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
      </Stepper>

      {activeStep === 0 && (
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>Select Your Platform</Typography>
          <Grid container spacing={2}>
            {PLATFORMS.map(p => (
              <Grid size={{ xs: 6, sm: 4, md: 3 }} key={p.name}>
                <WrfCard variant={selectedPlatform === p.name ? 'elevated' : 'outlined'}
                  sx={{ cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s', border: selectedPlatform === p.name ? `2px solid ${colors.brand.primary}` : undefined, '&:hover': { borderColor: colors.brand.primary } }}
                  onClick={() => setSelectedPlatform(p.name)}>
                  <Box sx={{ p: 2 }}>
                    <Typography sx={{ fontSize: '2rem', mb: 1 }}>{p.icon}</Typography>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</Typography>
                    <WrfBadge status="syncing" size="sm">{p.type}</WrfBadge>
                  </Box>
                </WrfCard>
              </Grid>
            ))}
          </Grid>
          <Box sx={{ mt: 3, textAlign: 'right' }}>
            <WrfButton variant="primary" disabled={!selectedPlatform} onClick={() => setActiveStep(1)}>Next: Authenticate</WrfButton>
          </Box>
        </>
      )}

      {activeStep === 1 && (
        <WrfCard variant="elevated" sx={{ p: 3, maxWidth: 500, mx: 'auto' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Authenticate with {selectedPlatform}</Typography>
          <Typography sx={{ color: colors.text.secondary, mb: 3, fontSize: '0.9rem' }}>
            {PLATFORMS.find(p => p.name === selectedPlatform)?.type === 'OAuth'
              ? `Click below to sign in with your ${selectedPlatform} account`
              : `Enter your ${selectedPlatform} API key to connect`}
          </Typography>
          {PLATFORMS.find(p => p.name === selectedPlatform)?.type === 'OAuth' ? (
            <WrfButton variant="primary" onClick={() => { setApiValid(true); setTimeout(() => setActiveStep(2), 500); }} sx={{ width: '100%' }}>
              Sign in with {selectedPlatform}
            </WrfButton>
          ) : (
            <>
              <TextField fullWidth variant="outlined" label="API Key" value={apiKey} onChange={e => handleApiKeyChange(e.target.value)} placeholder="Enter your API key..."
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { bgcolor: colors.bg.secondary, color: colors.text.primary, '& fieldset': { borderColor: apiValid === true ? colors.success.main : apiValid === false ? colors.error.main : colors.border.default } }, '& .MuiInputLabel-root': { color: colors.text.muted } }}
                InputProps={{ endAdornment: apiValid ? <CheckCircleIcon sx={{ color: colors.success.main }} /> : null }}
              />
              {apiValid === true && <Typography sx={{ color: colors.success.main, fontSize: '0.85rem', mb: 2 }}>API key validated successfully</Typography>}
              {apiValid === false && <Typography sx={{ color: colors.error.main, fontSize: '0.85rem', mb: 2 }}>Invalid API key — check your credentials</Typography>}
              <WrfButton variant="ghost" disabled={!apiKey || validating} onClick={handleValidateApiKey} sx={{ width: '100%', mb: 2 }}>
                {validating ? 'Validating…' : 'Validate Key'}
              </WrfButton>
            </>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <WrfButton variant="ghost" onClick={() => setActiveStep(0)}>Back</WrfButton>
            <WrfButton variant="primary" disabled={!apiValid} onClick={() => { setActiveStep(2); setScanPhase('local'); }}>Discover Devices</WrfButton>
          </Box>
        </WrfCard>
      )}

      {activeStep === 2 && (
        <>
          <WrfCard variant="elevated" sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Discovering Devices</Typography>
            <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
              {[
                { label: 'Local Network', phase: 'local', icon: <WifiIcon /> },
                { label: 'Cloud APIs', phase: 'cloud', icon: <CloudIcon /> },
                { label: 'LoRaWAN', phase: 'lora', icon: <LinkIcon /> },
              ].map(s => (
                <Box key={s.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ color: scanPhase === s.phase ? colors.brand.primary : scanPhase === 'done' || ['local', 'cloud', 'lora'].indexOf(scanPhase) > ['local', 'cloud', 'lora'].indexOf(s.phase) ? colors.success.main : colors.text.muted }}>{s.icon}</Box>
                  <Typography sx={{ fontSize: '0.85rem', color: colors.text.secondary }}>{s.label}</Typography>
                  {(['local', 'cloud', 'lora'].indexOf(scanPhase) > ['local', 'cloud', 'lora'].indexOf(s.phase) || scanPhase === 'done') && <CheckCircleIcon sx={{ fontSize: 16, color: colors.success.main }} />}
                </Box>
              ))}
            </Box>
            <LinearProgress variant="determinate" value={scanProgress} sx={{ height: 6, borderRadius: 3, bgcolor: colors.bg.tertiary, '& .MuiLinearProgress-bar': { bgcolor: colors.brand.primary } }} />
          </WrfCard>

          {scanPhase === 'done' && (
            <>
              <Typography variant="h6" sx={{ mb: 2 }}>{discovered.length} Devices Found</Typography>
              <Grid container spacing={2}>
                {discovered.map(d => (
                  <Grid size={{ xs: 12, md: 4 }} key={d.id}>
                    <WrfCard variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography sx={{ fontWeight: 600 }}>{d.name}</Typography>
                        <WrfBadge status={d.status === 'ready' ? 'online' : 'degraded'}>{d.status === 'ready' ? 'Ready' : 'Needs Config'}</WrfBadge>
                      </Box>
                      <Typography sx={{ color: colors.text.secondary, fontSize: '0.85rem' }}>{d.platform} • {d.model}</Typography>
                      <Typography sx={{ color: colors.text.muted, fontSize: '0.8rem', mb: 1 }}>{d.location}</Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '0.85rem' }}>{d.channels} channels • Quality: {d.quality}/100</Typography>
                        <WrfButton variant={connectedDevices.includes(d.id) ? 'ghost' : 'primary'} size="sm"
                          onClick={() => !connectedDevices.includes(d.id) && setConnectedDevices(prev => [...prev, d.id])}>
                          {connectedDevices.includes(d.id) ? 'Connected ✓' : 'Connect'}
                        </WrfButton>
                      </Box>
                    </WrfCard>
                  </Grid>
                ))}
              </Grid>
              <Box sx={{ mt: 3, textAlign: 'right' }}>
                <WrfButton variant="primary" disabled={connectedDevices.length === 0} onClick={() => setActiveStep(3)}>
                  Continue ({connectedDevices.length} connected)
                </WrfButton>
              </Box>
            </>
          )}
        </>
      )}

      {activeStep === 3 && (
        <WrfCard variant="elevated" sx={{ textAlign: 'center', p: 4 }}>
          <CheckCircleIcon sx={{ fontSize: 64, color: colors.success.main, mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Setup Complete!</Typography>
          <Typography sx={{ color: colors.text.secondary, mb: 3 }}>{connectedDevices.length} device{connectedDevices.length > 1 ? 's' : ''} connected and earning WRF tokens</Typography>
          <Grid container spacing={3} sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <WrfStatCard value={`${connectedDevices.length}`} label="Devices" icon={SearchIcon} color={colors.brand.primary} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <WrfStatCard value={`${connectedDevices.reduce((sum, id) => sum + (discovered.find(d => d.id === id)?.channels || 0), 0)}`} label="Channels" icon={CheckCircleIcon} color={colors.success.main} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <WrfStatCard value="~450 WRF" label="Est. Weekly" icon={SearchIcon} color={colors.warning.main} />
            </Grid>
          </Grid>
          <WrfButton variant="primary" onClick={() => { setActiveStep(0); setScanPhase('idle'); setScanProgress(0); setConnectedDevices([]); setSelectedPlatform(null); setApiKey(''); setApiValid(null); }}>
            Add More Devices
          </WrfButton>
        </WrfCard>
      )}
    </Box>
  );
};

export default function AutoDetectWizard() {
  return <DemoSurfaceGate testId="iot-detection" title="IoT device discovery is unavailable"
    description="The IoT authentication and device discovery protocol is not served. The preview is illustrative.">
    <AutoDetectWizardSample />
  </DemoSurfaceGate>;
}
