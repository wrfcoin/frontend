import React, { useState } from 'react';
import { Box, Typography, Paper, Stack } from '@mui/material';
import {
  SettingsInputAntenna as AntennaIcon,
  QrCodeScanner as QrIcon,
  Keyboard as KeyboardIcon,
} from '@mui/icons-material';
import AutoDetectFlow from './AutoDetectFlow';
import ScanConnectFlow from './ScanConnectFlow';
import ManualSetupFlow, { type ManualSetupResult } from './ManualSetupFlow';
import WelcomeToNetwork from './WelcomeToNetwork';
import type { IngestionStatus } from '../../services/apiClient';

type WizardPath = 'choose' | 'auto-detect' | 'scan-connect' | 'manual' | 'welcome';

interface PathCard {
  id: WizardPath;
  icon: React.ReactNode;
  title: string;
  description: string;
  bestFor: string;
}

interface SensorOnboardingWizardProps {
  onComplete?: () => void;
}

const PATH_CARDS: PathCard[] = [
  {
    id: 'auto-detect',
    icon: <AntennaIcon sx={{ fontSize: 40 }} />,
    title: 'Auto-Detect',
    description: 'We\'ll search your local network and known cloud APIs for weather stations.',
    bestFor: 'Best for WiFi-connected stations',
  },
  {
    id: 'scan-connect',
    icon: <QrIcon sx={{ fontSize: 40 }} />,
    title: 'Scan & Connect',
    description: 'Scan the QR code printed on your device to instantly pair it.',
    bestFor: 'Best for newer IoT devices',
  },
  {
    id: 'manual',
    icon: <KeyboardIcon sx={{ fontSize: 40 }} />,
    title: 'Manual Setup',
    description: 'Enter your station details, API keys, or LoRaWAN credentials manually.',
    bestFor: 'Best for custom or API-based setups',
  },
];

const SensorOnboardingWizard: React.FC<SensorOnboardingWizardProps> = ({ onComplete }) => {
  const [activePath, setActivePath] = useState<WizardPath>('choose');
  const [connectedStationName, setConnectedStationName] = useState('');
  const [ingestionStatus, setIngestionStatus] = useState<IngestionStatus>('unknown');

  const handleStationConnected = (_station: any, name: string) => {
    setConnectedStationName(name);
    setIngestionStatus('unknown');
    setActivePath('welcome');
  };

  const handleScanComplete = (name: string) => {
    setConnectedStationName(name);
    setIngestionStatus('unknown');
    setActivePath('welcome');
  };

  // Manual flow now returns a real registration result, including the backend
  // ingestion status (so we can warn the user when data isn't flowing yet).
  const handleManualComplete = (result: ManualSetupResult) => {
    setConnectedStationName(result.stationName);
    setIngestionStatus(result.ingestionStatus);
    setActivePath('welcome');
  };

  const handleGoToDashboard = () => {
    onComplete?.();
  };

  // Auto-Detect flow
  if (activePath === 'auto-detect') {
    return (
      <AutoDetectFlow
        onStationConnected={handleStationConnected}
        onBack={() => setActivePath('choose')}
      />
    );
  }

  // Scan & Connect flow
  if (activePath === 'scan-connect') {
    return (
      <ScanConnectFlow
        onComplete={handleScanComplete}
        onBack={() => setActivePath('choose')}
      />
    );
  }

  // Manual flow
  if (activePath === 'manual') {
    return (
      <ManualSetupFlow
        onComplete={handleManualComplete}
        onBack={() => setActivePath('choose')}
      />
    );
  }

  // Welcome screen
  if (activePath === 'welcome') {
    return (
      <WelcomeToNetwork
        stationName={connectedStationName}
        ingestionStatus={ingestionStatus}
        onGoToDashboard={handleGoToDashboard}
      />
    );
  }

  // Path chooser (default)
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#0F172A',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <Box sx={{ maxWidth: 800, width: '100%', textAlign: 'center' }}>
        {/* Title */}
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            mb: 1,
            background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Connect Your Station
        </Typography>
        <Typography
          variant="h6"
          sx={{ color: '#94a3b8', mb: 6, fontWeight: 400 }}
        >
          Go from zero to earning in minutes. How would you like to get started?
        </Typography>

        {/* Path cards */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={3}
          justifyContent="center"
        >
          {PATH_CARDS.map((card, index) => (
            <Paper
              key={card.id}
              elevation={0}
              onClick={() => setActivePath(card.id)}
              sx={{
                flex: 1,
                p: 4,
                cursor: 'pointer',
                backgroundColor: '#1E293B',
                borderRadius: 3,
                border: '2px solid #334155',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                animation: `cardFadeIn 0.5s ease-out ${index * 0.1}s both`,
                '@keyframes cardFadeIn': {
                  '0%': { opacity: 0, transform: 'translateY(24px)' },
                  '100%': { opacity: 1, transform: 'translateY(0)' },
                },
                '&:hover': {
                  borderColor: '#38bdf8',
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 32px rgba(56,189,248,0.15)',
                  backgroundColor: '#1e3a5f',
                },
              }}
            >
              {/* Icon */}
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: 3,
                  mx: 'auto',
                  mb: 2.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, rgba(56,189,248,0.12), rgba(129,140,248,0.12))',
                  color: '#38bdf8',
                }}
              >
                {card.icon}
              </Box>

              {/* Title */}
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: '#f8fafc', mb: 1 }}
              >
                {card.title}
              </Typography>

              {/* Description */}
              <Typography
                variant="body2"
                sx={{ color: '#94a3b8', mb: 2, minHeight: 40 }}
              >
                {card.description}
              </Typography>

              {/* Best for tag */}
              <Typography
                variant="caption"
                sx={{
                  display: 'inline-block',
                  px: 2,
                  py: 0.5,
                  borderRadius: 5,
                  backgroundColor: 'rgba(56,189,248,0.08)',
                  color: '#38bdf8',
                  fontWeight: 600,
                }}
              >
                {card.bestFor}
              </Typography>
            </Paper>
          ))}
        </Stack>
      </Box>
    </Box>
  );
};

export default SensorOnboardingWizard;
