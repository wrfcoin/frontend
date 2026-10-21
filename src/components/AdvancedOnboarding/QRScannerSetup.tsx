import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import SettingsInputAntennaIcon from '@mui/icons-material/SettingsInputAntenna';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import CelebrationIcon from '@mui/icons-material/Celebration';
import { colors, spacing, borderRadius, shadows } from '../ui/tokens';
import { WrfCard, WrfStatCard, WrfButton, WrfBadge } from '../ui';
import { apiClient } from '../../services/apiClient';

// MOCK_DEVICE removed — device info fetched from API on scan completion

interface DeviceInfo {
  model: string;
  platform: string;
  serial: string;
  firmware: string;
  channels: { name: string; compatible: boolean; unit: string }[];
}

const QRScannerSetup = () => {
  const [phase, setPhase] = useState<'select' | 'scanning' | 'found' | 'connecting' | 'connected'>('select');
  const [scanProgress, setScanProgress] = useState(0);
  const [connectProgress, setConnectProgress] = useState(0);
  const [device, setDevice] = useState<DeviceInfo | null>(null);

  useEffect(() => {
    if (phase === 'scanning') {
      setScanProgress(0);
      const interval = setInterval(() => {
        setScanProgress(p => {
          if (p >= 100) {
            clearInterval(interval);
            // Fetch discovered device info from API
            apiClient.get<DeviceInfo>('/onboarding/scan/device')
              .then((data) => { if (data) setDevice(data); })
              .catch(() => {})
              .finally(() => setPhase('found'));
            return 100;
          }
          return p + 4;
        });
      }, 80);
      return () => clearInterval(interval);
    }
    if (phase === 'connecting') {
      setConnectProgress(0);
      const interval = setInterval(() => {
        setConnectProgress(p => {
          if (p >= 100) { clearInterval(interval); setPhase('connected'); return 100; }
          return p + 2;
        });
      }, 60);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [phase]);

  const compatibleCount = device?.channels.filter(c => c.compatible).length ?? 0;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.bg.primary, color: colors.text.primary, p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Device Onboarding</Typography>
      <Typography sx={{ color: colors.text.secondary, mb: 3 }}>Connect your weather station to start earning WRF tokens</Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard value="3" label="Devices Found" icon={SettingsInputAntennaIcon} color={colors.brand.primary} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard value={`${compatibleCount}`} label="Compatible Channels" icon={CheckCircleIcon} color={colors.success.main} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard value="1" label="Connected" icon={SettingsInputAntennaIcon} color={colors.success.main} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard value="47s" label="Avg Setup Time" icon={QrCode2Icon} color={colors.warning.main} />
        </Grid>
      </Grid>

      {phase === 'select' && (
        <Grid container spacing={3}>
          {[
            { icon: <SettingsInputAntennaIcon sx={{ fontSize: 48 }} />, title: 'Auto-Detect', desc: 'We\'ll search your local network and known cloud APIs for your stations', best: 'WiFi-connected stations (Netatmo, Ecowitt, Ambient Weather)', action: () => setPhase('scanning') },
            { icon: <QrCode2Icon sx={{ fontSize: 48 }} />, title: 'Scan QR Code', desc: 'Scan the QR code on your device or its packaging', best: 'Newer IoT devices with WRFCoin partnership labels', action: () => setPhase('scanning') },
            { icon: <KeyboardIcon sx={{ fontSize: 48 }} />, title: 'Manual Setup', desc: 'Enter your station details and API credentials manually', best: 'Custom setups, API-only integrations, LoRaWAN gateways', action: () => setPhase('scanning') },
          ].map((path) => (
            <Grid size={{ xs: 12, md: 4 }} key={path.title}>
              <WrfCard variant="outlined" sx={{ textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', '&:hover': { borderColor: colors.brand.primary, boxShadow: shadows.glow(colors.brand.primary) } }} onClick={path.action}>
                <Box sx={{ p: 3 }}>
                  <Box sx={{ color: colors.brand.primary, mb: 2 }}>{path.icon}</Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>{path.title}</Typography>
                  <Typography sx={{ color: colors.text.secondary, mb: 2, fontSize: '0.9rem' }}>{path.desc}</Typography>
                  <Typography sx={{ color: colors.text.muted, fontSize: '0.8rem' }}>Best for: {path.best}</Typography>
                </Box>
              </WrfCard>
            </Grid>
          ))}
        </Grid>
      )}

      {phase === 'scanning' && (
        <WrfCard variant="elevated" sx={{ textAlign: 'center', p: 4 }}>
          <Box sx={{ position: 'relative', width: 200, height: 200, mx: 'auto', mb: 3 }}>
            <svg viewBox="0 0 200 200" width="200" height="200">
              {[80, 60, 40, 20].map((r, i) => (
                <circle key={i} cx="100" cy="100" r={r} fill="none" stroke={colors.brand.primary} strokeWidth="1" opacity={0.2 + i * 0.1}>
                  <animate attributeName="r" from={r - 10} to={r + 10} dur={`${2 + i * 0.5}s`} repeatCount="indefinite" />
                  <animate attributeName="opacity" from={0.4} to={0.05} dur={`${2 + i * 0.5}s`} repeatCount="indefinite" />
                </circle>
              ))}
              <line x1="100" y1="100" x2="100" y2="20" stroke={colors.success.main} strokeWidth="2" opacity="0.8">
                <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="3s" repeatCount="indefinite" />
              </line>
              <circle cx="100" cy="100" r="6" fill={colors.brand.primary} />
            </svg>
          </Box>
          <Typography variant="h6" sx={{ mb: 1 }}>Scanning for devices...</Typography>
          <Typography sx={{ color: colors.text.secondary, mb: 2 }}>Checking local network, cloud APIs, and LoRaWAN gateways</Typography>
          <LinearProgress variant="determinate" value={scanProgress} sx={{ height: 6, borderRadius: 3, bgcolor: colors.bg.tertiary, '& .MuiLinearProgress-bar': { bgcolor: colors.brand.primary } }} />
          <Typography sx={{ color: colors.text.muted, mt: 1, fontSize: '0.8rem' }}>{scanProgress}% complete</Typography>
        </WrfCard>
      )}

      {phase === 'found' && (
        <WrfCard variant="elevated" sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleIcon sx={{ color: colors.success.main }} /> Device Found
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ p: 2, bgcolor: colors.bg.secondary, borderRadius: borderRadius.lg, border: `1px solid ${colors.border.default}` }}>
                <Typography sx={{ fontWeight: 600, mb: 1 }}>{device?.model ?? '--'}</Typography>
                <Typography sx={{ color: colors.text.secondary, fontSize: '0.85rem' }}>Platform: {device?.platform ?? '--'}</Typography>
                <Typography sx={{ color: colors.text.secondary, fontSize: '0.85rem' }}>Serial: {device?.serial ?? '--'}</Typography>
                <Typography sx={{ color: colors.text.secondary, fontSize: '0.85rem' }}>Firmware: {device?.firmware ?? '--'}</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>Data Channels</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {(device?.channels ?? []).map(ch => (
                  <Chip key={ch.name} icon={ch.compatible ? <CheckCircleIcon sx={{ fontSize: 16 }} /> : undefined}
                    label={`${ch.name}${ch.unit ? ` (${ch.unit})` : ''}`}
                    size="small"
                    sx={{ bgcolor: ch.compatible ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.15)', color: ch.compatible ? colors.success.main : colors.text.muted, border: `1px solid ${ch.compatible ? colors.success.dark : colors.border.default}` }}
                  />
                ))}
              </Box>
              <Typography sx={{ color: colors.text.muted, fontSize: '0.8rem', mt: 1 }}>{compatibleCount} of {device?.channels.length ?? 0} channels compatible with WRFCoin</Typography>
            </Grid>
          </Grid>
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <WrfButton variant="primary" onClick={() => setPhase('connecting')} sx={{ px: 6, py: 1.5, fontSize: '1rem' }}>
              Connect Device
            </WrfButton>
          </Box>
        </WrfCard>
      )}

      {phase === 'connecting' && (
        <WrfCard variant="elevated" sx={{ textAlign: 'center', p: 4 }}>
          <Box sx={{ width: 120, height: 60, mx: 'auto', mb: 3 }}>
            <svg viewBox="0 0 120 60" width="120" height="60">
              <circle cx="20" cy="30" r="10" fill={colors.brand.primary}>
                <animate attributeName="r" values="8;12;8" dur="1.5s" repeatCount="indefinite" />
              </circle>
              <circle cx="100" cy="30" r="10" fill={colors.success.main}>
                <animate attributeName="r" values="8;12;8" dur="1.5s" repeatCount="indefinite" />
              </circle>
              <line x1="30" y1="30" x2="90" y2="30" stroke={colors.warning.main} strokeWidth="3" strokeDasharray="8,4">
                <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="0.5s" repeatCount="indefinite" />
              </line>
            </svg>
          </Box>
          <Typography variant="h6" sx={{ mb: 1 }}>Connecting...</Typography>
          <Typography sx={{ color: colors.text.secondary, mb: 2 }}>Establishing secure handshake with {device?.model ?? 'your device'}</Typography>
          <LinearProgress variant="determinate" value={connectProgress} sx={{ height: 6, borderRadius: 3, bgcolor: colors.bg.tertiary, '& .MuiLinearProgress-bar': { bgcolor: colors.success.main } }} />
        </WrfCard>
      )}

      {phase === 'connected' && (
        <WrfCard variant="elevated" sx={{ textAlign: 'center', p: 4, border: `2px solid ${colors.warning.main}`, boxShadow: shadows.glow(colors.warning.main) }}>
          <CelebrationIcon sx={{ fontSize: 64, color: colors.warning.main, mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Welcome to the Network!</Typography>
          <Typography sx={{ color: colors.text.secondary, mb: 3 }}>Your {device?.model ?? 'device'} is now connected and earning</Typography>
          <Box sx={{ display: 'inline-block', p: 2, bgcolor: colors.bg.secondary, borderRadius: borderRadius.lg, mb: 3 }}>
            <Typography sx={{ fontSize: '0.85rem', color: colors.text.muted }}>You are contributor</Typography>
            <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: colors.warning.main }}>#14,832</Typography>
            <Typography sx={{ fontSize: '0.85rem', color: colors.text.muted }}>in the WRFCoin Weather Network</Typography>
          </Box>
          <Grid container spacing={2} sx={{ maxWidth: 600, mx: 'auto' }}>
            <Grid size={{ xs: 6 }}>
              <Box sx={{ p: 2, bgcolor: colors.bg.secondary, borderRadius: borderRadius.md }}>
                <Typography sx={{ color: colors.text.muted, fontSize: '0.8rem' }}>Projected First Week</Typography>
                <Typography sx={{ fontWeight: 700, fontSize: '1.2rem', color: colors.success.main }}>~312 WRF</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Box sx={{ p: 2, bgcolor: colors.bg.secondary, borderRadius: borderRadius.md }}>
                <Typography sx={{ color: colors.text.muted, fontSize: '0.8rem' }}>Active Channels</Typography>
                <Typography sx={{ fontWeight: 700, fontSize: '1.2rem' }}>{compatibleCount}</Typography>
              </Box>
            </Grid>
          </Grid>
          <Box sx={{ mt: 3 }}>
            <Typography sx={{ fontWeight: 600, mb: 1 }}>Boost Your Earnings</Typography>
            {[
              { text: 'Add a second sensor (+15% earnings)', done: false },
              { text: 'Enable 1-minute reporting intervals (+10%)', done: false },
              { text: 'Maintain 7-day streak for Consistency Champion Bronze', done: false },
            ].map((tip, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', mb: 0.5 }}>
                <Box sx={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${colors.border.default}`, bgcolor: tip.done ? colors.success.main : 'transparent' }} />
                <Typography sx={{ color: colors.text.secondary, fontSize: '0.85rem' }}>{tip.text}</Typography>
              </Box>
            ))}
          </Box>
          <WrfButton variant="primary" onClick={() => setPhase('select')} sx={{ mt: 3 }}>Add Another Device</WrfButton>
        </WrfCard>
      )}
    </Box>
  );
};

export default QRScannerSetup;
