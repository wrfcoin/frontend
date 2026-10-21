import React, { useState, useCallback } from 'react';
import DemoSurfaceGate from '../common/DemoSurfaceGate';
import {
  Box,
  Typography,
  Paper,
  Button,
  Avatar,
  Chip,
  IconButton,
  Grid,
  Divider,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import ShareIcon from '@mui/icons-material/Share';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import AirIcon from '@mui/icons-material/Air';
import SpeedIcon from '@mui/icons-material/Speed';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import BarChartIcon from '@mui/icons-material/BarChart';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import PlaceIcon from '@mui/icons-material/Place';
import CameraAltIcon from '@mui/icons-material/CameraAlt';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DARK = {
  bg: '#0F172A',
  card: '#1E293B',
  cardHover: '#263548',
  border: '#334155',
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  purple: '#8B5CF6',
  pink: '#EC4899',
  gold: '#FFD700',
};

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const FEATURED_STATION = {
  id: 'station-ridge-047',
  name: 'Eagle Ridge Observatory',
  owner: 'AlpineObserver.wrf',
  ownerAvatar: 'AO',
  ownerColor: '#8B5CF6',
  location: 'Boulder, Colorado, USA',
  elevation: '2,195m',
  qualityScore: 98.1,
  readingsToday: 1447,
  uptime: 99.97,
  earningsToday: 42.8,
  temperature: -3.2,
  humidity: 62,
  windSpeed: 14.7,
  windDirection: 'NW',
  pressure: 1018.4,
  whyFeatured:
    'Eagle Ridge Observatory maintained a 98.1% quality score while delivering 1,447 high-precision readings today during a challenging winter storm event. Its exposed alpine positioning provides critical data for mountain weather modeling that few other stations can match.',
  memberSince: 'March 2024',
  totalReadings: '2.4M',
};

const PREVIOUS_WINNERS = [
  { id: 'pw-1', date: 'Feb 13', name: 'Coastal Guardian', owner: 'SeaBreeze.wrf', avatar: 'SB', avatarColor: '#3B82F6', quality: 97.5 },
  { id: 'pw-2', date: 'Feb 12', name: 'Prairie Sentinel', owner: 'PrairieRain.wrf', avatar: 'PR', avatarColor: '#14B8A6', quality: 96.8 },
  { id: 'pw-3', date: 'Feb 11', name: 'Desert Eye', owner: 'DesertHawk.wrf', avatar: 'DH', avatarColor: '#F59E0B', quality: 99.2 },
  { id: 'pw-4', date: 'Feb 10', name: 'Lakeside Monitor', owner: 'LakeEffect.wrf', avatar: 'LE', avatarColor: '#6366F1', quality: 95.9 },
  { id: 'pw-5', date: 'Feb 9', name: 'Summit Watch', owner: 'MountainPeak.wrf', avatar: 'MP', avatarColor: '#7C3AED', quality: 97.1 },
  { id: 'pw-6', date: 'Feb 8', name: 'Harbor View', owner: 'CoastalBreeze.wrf', avatar: 'CB', avatarColor: '#10B981', quality: 96.3 },
  { id: 'pw-7', date: 'Feb 7', name: 'Valley Floor', owner: 'ThunderValley.wrf', avatar: 'TV', avatarColor: '#0891B2', quality: 98.4 },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const QualityGauge = ({ score }) => {
  const getColor = (s) => {
    if (s >= 95) return DARK.success;
    if (s >= 85) return DARK.warning;
    return DARK.error;
  };
  const color = getColor(score);

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Box
        sx={{
          position: 'relative',
          width: 100,
          height: 100,
          mx: 'auto',
          mb: 1,
        }}
      >
        {/* Background circle */}
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={DARK.border}
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${(score / 100) * 264} 264`}
            strokeDashoffset="0"
            transform="rotate(-90 50 50)"
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <Typography variant="h5" sx={{ color, fontWeight: 800, lineHeight: 1 }}>
            {score}
          </Typography>
          <Typography variant="caption" sx={{ color: DARK.textSecondary, fontSize: '0.6rem' }}>
            / 100
          </Typography>
        </Box>
      </Box>
      <Typography variant="caption" sx={{ color: DARK.textSecondary, fontWeight: 600 }}>
        Quality Score
      </Typography>
    </Box>
  );
};

const WeatherReadout = ({ icon: Icon, label, value, unit, color }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: 2,
        bgcolor: `${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon sx={{ color, fontSize: 20 }} />
    </Box>
    <Box sx={{ flex: 1 }}>
      <Typography variant="caption" sx={{ color: DARK.textSecondary }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: DARK.text, fontWeight: 700 }}>
        {value}
        <Typography component="span" variant="caption" sx={{ color: DARK.textSecondary, ml: 0.5 }}>
          {unit}
        </Typography>
      </Typography>
    </Box>
  </Box>
);

const StatBlock = ({ icon: Icon, label, value, color }) => (
  <Box sx={{ textAlign: 'center', flex: '1 1 100px' }}>
    <Box
      sx={{
        width: 40,
        height: 40,
        borderRadius: 2,
        bgcolor: `${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mx: 'auto',
        mb: 1,
      }}
    >
      <Icon sx={{ color, fontSize: 22 }} />
    </Box>
    <Typography variant="h6" sx={{ color: DARK.text, fontWeight: 700, fontSize: '1.1rem' }}>
      {value}
    </Typography>
    <Typography variant="caption" sx={{ color: DARK.textSecondary }}>
      {label}
    </Typography>
  </Box>
);

const PreviousWinnerCard = ({ winner }) => (
  <Paper
    sx={{
      bgcolor: DARK.card,
      border: `1px solid ${DARK.border}`,
      borderRadius: 3,
      p: 2,
      minWidth: 160,
      flex: '0 0 auto',
      cursor: 'pointer',
      transition: 'all 0.2s',
      '&:hover': { borderColor: DARK.primary, bgcolor: DARK.cardHover },
    }}
  >
    <Typography variant="caption" sx={{ color: DARK.textSecondary, fontWeight: 600 }}>
      {winner.date}
    </Typography>
    <Typography variant="body2" sx={{ color: DARK.text, fontWeight: 600, mt: 0.5, mb: 1, lineHeight: 1.3 }}>
      {winner.name}
    </Typography>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Avatar sx={{ width: 22, height: 22, fontSize: '0.6rem', bgcolor: winner.avatarColor }}>
        {winner.avatar}
      </Avatar>
      <Typography variant="caption" sx={{ color: DARK.textSecondary }}>
        {winner.owner}
      </Typography>
    </Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
      <StarIcon sx={{ fontSize: 14, color: DARK.gold }} />
      <Typography variant="caption" sx={{ color: DARK.success, fontWeight: 600 }}>
        {winner.quality}%
      </Typography>
    </Box>
  </Paper>
);

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const StationOfTheDaySample = () => {
  const [carouselOffset, setCarouselOffset] = useState(0);
  const station = FEATURED_STATION;

  const handleScrollLeft = useCallback(() => {
    setCarouselOffset((prev) => Math.max(0, prev - 1));
  }, []);

  const handleScrollRight = useCallback(() => {
    setCarouselOffset((prev) => Math.min(PREVIOUS_WINNERS.length - 4, prev + 1));
  }, []);

  return (
    <Box sx={{ bgcolor: DARK.bg, minHeight: '100vh', p: 3 }}>
      {/* Section Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            bgcolor: `${DARK.gold}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <EmojiEventsIcon sx={{ color: DARK.gold, fontSize: 28 }} />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ color: DARK.text, fontWeight: 700 }}>
            Station of the Day
          </Typography>
          <Typography variant="body2" sx={{ color: DARK.textSecondary }}>
            Recognizing outstanding weather data contributions
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        <Typography variant="body2" sx={{ color: DARK.textSecondary }}>
          February 14, 2026
        </Typography>
      </Box>

      {/* Hero Card */}
      <Paper
        sx={{
          bgcolor: DARK.card,
          borderRadius: 3,
          overflow: 'hidden',
          mb: 3,
          position: 'relative',
          border: '2px solid transparent',
          backgroundImage: `linear-gradient(${DARK.card}, ${DARK.card}), linear-gradient(135deg, ${DARK.gold}44, ${DARK.primary}44, ${DARK.purple}44, ${DARK.gold}44)`,
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
          animation: 'borderGlow 4s ease infinite',
          '@keyframes borderGlow': {
            '0%': { backgroundImage: `linear-gradient(${DARK.card}, ${DARK.card}), linear-gradient(135deg, ${DARK.gold}44, ${DARK.primary}44, ${DARK.purple}44, ${DARK.gold}44)` },
            '33%': { backgroundImage: `linear-gradient(${DARK.card}, ${DARK.card}), linear-gradient(135deg, ${DARK.primary}44, ${DARK.purple}44, ${DARK.gold}44, ${DARK.primary}44)` },
            '66%': { backgroundImage: `linear-gradient(${DARK.card}, ${DARK.card}), linear-gradient(135deg, ${DARK.purple}44, ${DARK.gold}44, ${DARK.primary}44, ${DARK.purple}44)` },
            '100%': { backgroundImage: `linear-gradient(${DARK.card}, ${DARK.card}), linear-gradient(135deg, ${DARK.gold}44, ${DARK.primary}44, ${DARK.purple}44, ${DARK.gold}44)` },
          },
        }}
      >
        <Grid container>
          {/* Station Photo Placeholder */}
          <Grid item xs={12} md={5}>
            <Box
              sx={{
                height: { xs: 220, md: '100%' },
                minHeight: 300,
                bgcolor: `${DARK.primary}10`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                background: `linear-gradient(135deg, ${DARK.primary}15, ${DARK.purple}15)`,
              }}
            >
              <CameraAltIcon sx={{ fontSize: 60, color: DARK.textSecondary, opacity: 0.4, mb: 1 }} />
              <Typography variant="body2" sx={{ color: DARK.textSecondary, opacity: 0.6 }}>
                Station Photo
              </Typography>

              {/* Location badge */}
              <Chip
                icon={<PlaceIcon sx={{ fontSize: 14, color: `${DARK.primary} !important` }} />}
                label={station.location}
                size="small"
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  left: 16,
                  bgcolor: `${DARK.bg}CC`,
                  color: DARK.text,
                  fontSize: '0.75rem',
                  height: 28,
                  backdropFilter: 'blur(4px)',
                }}
              />

              {/* Elevation badge */}
              <Chip
                label={`Elev. ${station.elevation}`}
                size="small"
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  right: 16,
                  bgcolor: `${DARK.bg}CC`,
                  color: DARK.textSecondary,
                  fontSize: '0.7rem',
                  height: 24,
                  backdropFilter: 'blur(4px)',
                }}
              />
            </Box>
          </Grid>

          {/* Station Info */}
          <Grid item xs={12} md={7}>
            <Box sx={{ p: 3 }}>
              {/* Name & Owner */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <StarIcon sx={{ color: DARK.gold, fontSize: 20 }} />
                    <Chip
                      label="Featured Today"
                      size="small"
                      sx={{ bgcolor: `${DARK.gold}22`, color: DARK.gold, height: 22, fontSize: '0.7rem', fontWeight: 700 }}
                    />
                  </Box>
                  <Typography variant="h5" sx={{ color: DARK.text, fontWeight: 700, mb: 0.5 }}>
                    {station.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 24, height: 24, bgcolor: station.ownerColor, fontSize: '0.65rem' }}>
                      {station.ownerAvatar}
                    </Avatar>
                    <Typography variant="body2" sx={{ color: DARK.primary, fontWeight: 600 }}>
                      {station.owner}
                    </Typography>
                    <Typography variant="caption" sx={{ color: DARK.textSecondary }}>
                      Member since {station.memberSince}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title="Share">
                    <IconButton
                      sx={{
                        color: DARK.textSecondary,
                        border: `1px solid ${DARK.border}`,
                        borderRadius: 2,
                        '&:hover': { color: DARK.primary, borderColor: DARK.primary },
                      }}
                    >
                      <ShareIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="View Station">
                    <IconButton
                      sx={{
                        color: DARK.textSecondary,
                        border: `1px solid ${DARK.border}`,
                        borderRadius: 2,
                        '&:hover': { color: DARK.primary, borderColor: DARK.primary },
                      }}
                    >
                      <OpenInNewIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* Key Stats */}
              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <QualityGauge score={station.qualityScore} />
                <Divider orientation="vertical" flexItem sx={{ borderColor: DARK.border, mx: 1 }} />
                <StatBlock icon={BarChartIcon} label="Readings Today" value={station.readingsToday.toLocaleString()} color={DARK.primary} />
                <StatBlock icon={SignalCellularAltIcon} label="Uptime" value={`${station.uptime}%`} color={DARK.success} />
                <StatBlock icon={MonetizationOnIcon} label="Earned Today" value={`${station.earningsToday} WRF`} color={DARK.warning} />
              </Box>

              {/* Why Featured */}
              <Paper
                sx={{
                  bgcolor: `${DARK.gold}08`,
                  border: `1px solid ${DARK.gold}22`,
                  borderRadius: 2,
                  p: 2,
                  mb: 2.5,
                }}
              >
                <Typography variant="subtitle2" sx={{ color: DARK.gold, fontWeight: 700, mb: 0.5 }}>
                  Why This Station?
                </Typography>
                <Typography variant="body2" sx={{ color: DARK.textSecondary, lineHeight: 1.6 }}>
                  {station.whyFeatured}
                </Typography>
              </Paper>

              {/* Mini Weather Readout */}
              <Typography variant="subtitle2" sx={{ color: DARK.text, fontWeight: 600, mb: 1 }}>
                Current Conditions
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6} sm={3}>
                  <WeatherReadout
                    icon={ThermostatIcon}
                    label="Temperature"
                    value={station.temperature}
                    unit="C"
                    color={DARK.error}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <WeatherReadout
                    icon={WaterDropIcon}
                    label="Humidity"
                    value={station.humidity}
                    unit="%"
                    color={DARK.primary}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <WeatherReadout
                    icon={AirIcon}
                    label="Wind"
                    value={`${station.windSpeed} ${station.windDirection}`}
                    unit="km/h"
                    color={DARK.success}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <WeatherReadout
                    icon={SpeedIcon}
                    label="Pressure"
                    value={station.pressure}
                    unit="hPa"
                    color={DARK.purple}
                  />
                </Grid>
              </Grid>

              {/* Actions */}
              <Box sx={{ display: 'flex', gap: 1.5, mt: 2.5 }}>
                <Button
                  variant="contained"
                  startIcon={<OpenInNewIcon />}
                  sx={{
                    bgcolor: DARK.primary,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 2,
                    '&:hover': { bgcolor: '#2563EB' },
                  }}
                >
                  View Station
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ShareIcon />}
                  sx={{
                    color: DARK.textSecondary,
                    borderColor: DARK.border,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 2,
                    '&:hover': { borderColor: DARK.primary, color: DARK.primary },
                  }}
                >
                  Share
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Previous Winners Carousel */}
      <Paper sx={{ bgcolor: DARK.card, border: `1px solid ${DARK.border}`, borderRadius: 3, p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTimeIcon sx={{ color: DARK.textSecondary, fontSize: 20 }} />
            <Typography variant="subtitle1" sx={{ color: DARK.text, fontWeight: 600 }}>
              Previous Winners
            </Typography>
            <Chip
              label="Last 7 Days"
              size="small"
              sx={{ bgcolor: `${DARK.primary}22`, color: DARK.primary, height: 22, fontSize: '0.7rem' }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={handleScrollLeft}
              disabled={carouselOffset === 0}
              sx={{
                color: DARK.textSecondary,
                border: `1px solid ${DARK.border}`,
                borderRadius: 1.5,
                '&:hover': { borderColor: DARK.primary, color: DARK.primary },
                '&.Mui-disabled': { color: `${DARK.textSecondary}44`, borderColor: `${DARK.border}44` },
              }}
            >
              <ArrowBackIosNewIcon sx={{ fontSize: 14 }} />
            </IconButton>
            <IconButton
              size="small"
              onClick={handleScrollRight}
              disabled={carouselOffset >= PREVIOUS_WINNERS.length - 4}
              sx={{
                color: DARK.textSecondary,
                border: `1px solid ${DARK.border}`,
                borderRadius: 1.5,
                '&:hover': { borderColor: DARK.primary, color: DARK.primary },
                '&.Mui-disabled': { color: `${DARK.textSecondary}44`, borderColor: `${DARK.border}44` },
              }}
            >
              <ArrowForwardIosIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ overflow: 'hidden' }}>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              transition: 'transform 0.3s ease',
              transform: `translateX(-${carouselOffset * 180}px)`,
            }}
          >
            {PREVIOUS_WINNERS.map((winner) => (
              <PreviousWinnerCard key={winner.id} winner={winner} />
            ))}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

const StationOfTheDay = () => (
  <DemoSurfaceGate
    title="Station awards unavailable."
    description="No trusted station-award source is connected. Demo awards are illustrative."
    testId="station-of-the-day"
  >
    <StationOfTheDaySample />
  </DemoSurfaceGate>
);

export default StationOfTheDay;
