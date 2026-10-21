import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Celebration as CelebrationIcon,
  Dashboard as DashboardIcon,
  Speed as SpeedIcon,
  CalendarMonth as CalendarIcon,
  Sensors as SensorsIcon,
} from '@mui/icons-material';

interface WelcomeToNetworkProps {
  stationName: string;
  /**
   * Backend ingestion status for the freshly registered station. When
   * `'pending'`, the station exists but no data is flowing yet for its
   * provider, so we tell the user instead of implying it's earning.
   * `'unknown'` (default) means the backend didn't report a status.
   */
  ingestionStatus?: 'active' | 'pending' | 'unknown';
  onGoToDashboard: () => void;
}

const FINAL_CONTRIBUTOR_NUMBER = 14832;
const PROJECTED_WEEKLY_WRF = 42.5;

const WelcomeToNetwork: React.FC<WelcomeToNetworkProps> = ({
  stationName,
  ingestionStatus = 'unknown',
  onGoToDashboard,
}) => {
  const [contributorCount, setContributorCount] = useState(0);
  const [earningsVisible, setEarningsVisible] = useState(false);
  const [checklistVisible, setChecklistVisible] = useState(false);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const startTime = performance.now();
    const duration = 2000;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setContributorCount(Math.floor(eased * FINAL_CONTRIBUTOR_NUMBER));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setContributorCount(FINAL_CONTRIBUTOR_NUMBER);
        setTimeout(() => setEarningsVisible(true), 400);
        setTimeout(() => setChecklistVisible(true), 800);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const boostItems = [
    {
      label: 'Add a secondary sensor (+15% earnings)',
      icon: <SensorsIcon sx={{ fontSize: 18 }} />,
    },
    {
      label: 'Enable 1-minute reporting interval (+10%)',
      icon: <SpeedIcon sx={{ fontSize: 18 }} />,
    },
    {
      label: 'Maintain a 7-day reporting streak',
      icon: <CalendarIcon sx={{ fontSize: 18 }} />,
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: '#0F172A',
        p: 3,
      }}
    >
      {/* Animated gradient background */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 30% 20%, rgba(56,189,248,0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(129,140,248,0.12) 0%, transparent 50%)',
          animation: 'welcomeBgPulse 6s ease-in-out infinite alternate',
          '@keyframes welcomeBgPulse': {
            '0%': { opacity: 0.6, transform: 'scale(1)' },
            '100%': { opacity: 1, transform: 'scale(1.05)' },
          },
        }}
      />

      {/* Floating particles */}
      {Array.from({ length: 12 }, (_, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: 4 + (i % 3) * 2,
            height: 4 + (i % 3) * 2,
            borderRadius: '50%',
            background: i % 2 === 0 ? '#38bdf8' : '#818cf8',
            opacity: 0.3,
            left: `${10 + (i * 7) % 80}%`,
            top: `${5 + (i * 11) % 80}%`,
            animation: `particleFloat${i % 3} ${3 + i % 4}s ease-in-out infinite alternate`,
            '@keyframes particleFloat0': {
              '0%': { transform: 'translateY(0) translateX(0)' },
              '100%': { transform: 'translateY(-20px) translateX(10px)' },
            },
            '@keyframes particleFloat1': {
              '0%': { transform: 'translateY(0) translateX(0)' },
              '100%': { transform: 'translateY(15px) translateX(-12px)' },
            },
            '@keyframes particleFloat2': {
              '0%': { transform: 'translateY(0) translateX(0)' },
              '100%': { transform: 'translateY(-10px) translateX(-8px)' },
            },
          }}
        />
      ))}

      <Stack
        spacing={4}
        alignItems="center"
        sx={{ position: 'relative', zIndex: 1, maxWidth: 560, width: '100%' }}
      >
        {/* Celebration icon */}
        <Box
          sx={{
            animation: 'celebrateBounce 1s ease-out',
            '@keyframes celebrateBounce': {
              '0%': { transform: 'scale(0) rotate(-20deg)', opacity: 0 },
              '60%': { transform: 'scale(1.2) rotate(5deg)', opacity: 1 },
              '100%': { transform: 'scale(1) rotate(0deg)', opacity: 1 },
            },
          }}
        >
          <CelebrationIcon sx={{ fontSize: 64, color: '#f59e0b' }} />
        </Box>

        {/* Headline */}
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            textAlign: 'center',
            background: 'linear-gradient(135deg, #38bdf8, #818cf8, #f59e0b)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'headlineFade 0.8s ease-out 0.3s both',
            '@keyframes headlineFade': {
              '0%': { opacity: 0, transform: 'translateY(20px)' },
              '100%': { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        >
          Welcome to the Network!
        </Typography>

        <Typography
          variant="h6"
          sx={{
            color: '#94a3b8',
            textAlign: 'center',
            animation: 'headlineFade 0.8s ease-out 0.5s both',
          }}
        >
          {ingestionStatus === 'pending'
            ? `${stationName} is registered`
            : `${stationName} is now live and contributing data`}
        </Typography>

        {/* Ingestion-pending notice: registered, but no data flowing yet. */}
        {ingestionStatus === 'pending' && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              maxWidth: 480,
              backgroundColor: 'rgba(251,191,36,0.08)',
              border: '1px solid rgba(251,191,36,0.4)',
              borderRadius: 2,
              textAlign: 'center',
            }}
          >
            <Typography variant="body2" sx={{ color: '#fbbf24', fontWeight: 600, mb: 0.5 }}>
              Data isn&apos;t flowing yet
            </Typography>
            <Typography variant="caption" sx={{ color: '#cbd5e1' }}>
              Your station is registered, but ingestion for this provider isn&apos;t
              active yet. We&apos;ll start crediting contributions as soon as your
              data begins arriving.
            </Typography>
          </Paper>
        )}

        {/* Contributor counter */}
        <Box
          sx={{
            textAlign: 'center',
            animation: 'headlineFade 0.8s ease-out 0.7s both',
          }}
        >
          <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
            You are contributor
          </Typography>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              fontFamily: 'monospace',
              color: '#f8fafc',
              letterSpacing: 2,
            }}
          >
            #{contributorCount.toLocaleString()}
          </Typography>
        </Box>

        {/* Projected earnings card */}
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            p: 3,
            backgroundColor: '#1E293B',
            borderRadius: 3,
            border: '1px solid #334155',
            opacity: earningsVisible ? 1 : 0,
            transform: earningsVisible ? 'translateY(0)' : 'translateY(16px)',
            transition: 'all 0.5s ease',
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: '#64748b', mb: 1, textTransform: 'uppercase', letterSpacing: 1 }}
          >
            Projected First-Week Earnings
          </Typography>
          <Stack direction="row" alignItems="baseline" spacing={1}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                background: 'linear-gradient(135deg, #34d399, #38bdf8)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {PROJECTED_WEEKLY_WRF}
            </Typography>
            <Typography variant="h6" sx={{ color: '#94a3b8' }}>
              WRF
            </Typography>
          </Stack>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            Based on average station performance in your region
          </Typography>
        </Paper>

        {/* Boost your earnings checklist */}
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            p: 3,
            backgroundColor: '#1E293B',
            borderRadius: 3,
            border: '1px solid #334155',
            opacity: checklistVisible ? 1 : 0,
            transform: checklistVisible ? 'translateY(0)' : 'translateY(16px)',
            transition: 'all 0.5s ease',
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, color: '#f8fafc', mb: 1.5 }}
          >
            Boost Your Earnings
          </Typography>
          <Stack spacing={1}>
            {boostItems.map((item, i) => (
              <FormControlLabel
                key={i}
                control={
                  <Checkbox
                    sx={{
                      color: '#475569',
                      '&.Mui-checked': { color: '#38bdf8' },
                    }}
                  />
                }
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ color: '#64748b' }}>{item.icon}</Box>
                    <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
                      {item.label}
                    </Typography>
                  </Stack>
                }
              />
            ))}
          </Stack>
        </Paper>

        {/* Go to Dashboard button */}
        <Button
          variant="contained"
          size="large"
          startIcon={<DashboardIcon />}
          onClick={onGoToDashboard}
          sx={{
            mt: 2,
            px: 5,
            py: 1.5,
            borderRadius: 3,
            fontWeight: 700,
            fontSize: 16,
            textTransform: 'none',
            background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
            boxShadow: '0 4px 20px rgba(56,189,248,0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
              boxShadow: '0 6px 28px rgba(56,189,248,0.4)',
            },
            animation: 'headlineFade 0.8s ease-out 1.2s both',
          }}
        >
          Go to Dashboard
        </Button>
      </Stack>
    </Box>
  );
};

export default WelcomeToNetwork;
