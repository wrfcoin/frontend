import DemoSurfaceGate from '../common/DemoSurfaceGate';
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import {
  Box,
  Typography,
  Paper,
  Button,
  Avatar,
  Chip,
  Grid,
  Divider,
  Tooltip,
  IconButton,
  Switch,
  FormControlLabel,
  Slider,
  TextField,
  InputAdornment,
} from '@mui/material';
import PlaceIcon from '@mui/icons-material/Place';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import SensorsIcon from '@mui/icons-material/Sensors';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VerifiedIcon from '@mui/icons-material/Verified';
import FilterListIcon from '@mui/icons-material/FilterList';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import NearMeIcon from '@mui/icons-material/NearMe';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import AirIcon from '@mui/icons-material/Air';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

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
  cyan: '#06B6D4',
};

const RADIUS_OPTIONS = [
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
  { label: '25 km', value: 25 },
  { label: '50 km', value: 50 },
  { label: '100 km', value: 100 },
];

const DEFAULT_COORDS = { lat: 40.7128, lng: -74.006 }; // New York

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const nearbyStations = [
  { id: 'ns-01', name: 'Central Park Observatory', owner: 'NYCWeather.wrf', avatar: 'NY', avatarColor: '#3B82F6', distance: 1.2, quality: 97.3, status: 'online', lastReading: '2 min ago', temp: 4.1, humidity: 58, wind: 12.3, lat: 40.7829, lng: -73.9654, cooperative: 'NYC Data Network' },
  { id: 'ns-02', name: 'Brooklyn Heights Monitor', owner: 'BrooklynWx.wrf', avatar: 'BW', avatarColor: '#10B981', distance: 3.8, quality: 94.1, status: 'online', lastReading: '5 min ago', temp: 4.5, humidity: 56, wind: 10.8, lat: 40.6958, lng: -73.9936, cooperative: null },
  { id: 'ns-03', name: 'Hudson River Station', owner: 'RiverWatch.wrf', avatar: 'RW', avatarColor: '#F59E0B', distance: 4.5, quality: 95.8, status: 'online', lastReading: '1 min ago', temp: 3.8, humidity: 62, wind: 15.1, lat: 40.7484, lng: -74.0085, cooperative: 'NYC Data Network' },
  { id: 'ns-04', name: 'Jersey City Elevated', owner: 'GardenState.wrf', avatar: 'GS', avatarColor: '#8B5CF6', distance: 6.2, quality: 91.4, status: 'offline', lastReading: '3 hrs ago', temp: null, humidity: null, wind: null, lat: 40.7178, lng: -74.0431, cooperative: null },
  { id: 'ns-05', name: 'Queens College Array', owner: 'QueensBoro.wrf', avatar: 'QB', avatarColor: '#EF4444', distance: 8.7, quality: 96.5, status: 'online', lastReading: '3 min ago', temp: 4.0, humidity: 59, wind: 11.5, lat: 40.7362, lng: -73.8198, cooperative: 'Queens Cooperative' },
  { id: 'ns-06', name: 'Statue of Liberty Point', owner: 'LibertyWx.wrf', avatar: 'LW', avatarColor: '#06B6D4', distance: 9.1, quality: 98.2, status: 'online', lastReading: '1 min ago', temp: 3.5, humidity: 68, wind: 18.9, lat: 40.6892, lng: -74.0445, cooperative: 'Harbor Watch' },
  { id: 'ns-07', name: 'Bronx Botanical Garden', owner: 'BotanicalWx.wrf', avatar: 'BG', avatarColor: '#EC4899', distance: 12.4, quality: 93.7, status: 'online', lastReading: '8 min ago', temp: 3.7, humidity: 61, wind: 9.2, lat: 40.8631, lng: -73.8785, cooperative: null },
  { id: 'ns-08', name: 'Newark Airport Auxiliary', owner: 'EWRAux.wrf', avatar: 'EA', avatarColor: '#F97316', distance: 15.3, quality: 99.1, status: 'online', lastReading: '30 sec ago', temp: 4.2, humidity: 55, wind: 14.7, lat: 40.6895, lng: -74.1745, cooperative: 'Aviation Weather Group' },
  { id: 'ns-09', name: 'Long Island Sound', owner: 'SoundWatch.wrf', avatar: 'SW', avatarColor: '#14B8A6', distance: 22.8, quality: 95.0, status: 'online', lastReading: '4 min ago', temp: 3.1, humidity: 72, wind: 21.3, lat: 40.8750, lng: -73.7100, cooperative: null },
  { id: 'ns-10', name: 'Yonkers Ridge', owner: 'YonkersMet.wrf', avatar: 'YM', avatarColor: '#6366F1', distance: 25.1, quality: 92.3, status: 'offline', lastReading: '1 day ago', temp: null, humidity: null, wind: null, lat: 40.9312, lng: -73.8988, cooperative: null },
  { id: 'ns-11', name: 'Sandy Hook Marine', owner: 'CoastalNJ.wrf', avatar: 'CN', avatarColor: '#0891B2', distance: 34.6, quality: 97.8, status: 'online', lastReading: '2 min ago', temp: 3.9, humidity: 75, wind: 24.1, lat: 40.4529, lng: -73.9934, cooperative: 'Harbor Watch' },
  { id: 'ns-12', name: 'Westchester County', owner: 'WestchesterWx.wrf', avatar: 'WC', avatarColor: '#A855F7', distance: 38.2, quality: 94.6, status: 'online', lastReading: '6 min ago', temp: 3.3, humidity: 60, wind: 8.5, lat: 41.0340, lng: -73.7629, cooperative: 'Suburban Network' },
  { id: 'ns-13', name: 'Stamford Harbor', owner: 'CTCoastal.wrf', avatar: 'CC', avatarColor: '#059669', distance: 48.9, quality: 96.1, status: 'online', lastReading: '3 min ago', temp: 2.8, humidity: 65, wind: 16.7, lat: 41.0534, lng: -73.5387, cooperative: null },
  { id: 'ns-14', name: 'Coney Island Beach', owner: 'BeachWx.wrf', avatar: 'CI', avatarColor: '#DC2626', distance: 12.1, quality: 90.2, status: 'online', lastReading: '12 min ago', temp: 4.4, humidity: 70, wind: 19.5, lat: 40.5755, lng: -73.9707, cooperative: null },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const MapPlaceholder = ({ stations, userCoords, radius }) => {
  // Render a stylized grid that represents a map view
  const filteredStations = stations.filter((s) => s.distance <= radius);
  const gridSize = 400;

  // Normalize positions relative to user location
  const getPosition = (station) => {
    const maxDist = radius;
    const dx = ((station.lng - userCoords.lng) / (maxDist * 0.015)) * (gridSize / 2);
    const dy = -((station.lat - userCoords.lat) / (maxDist * 0.01)) * (gridSize / 2);
    return {
      x: Math.max(20, Math.min(gridSize - 20, gridSize / 2 + dx)),
      y: Math.max(20, Math.min(gridSize - 20, gridSize / 2 + dy)),
    };
  };

  return (
    <Paper
      sx={{
        bgcolor: '#0B1120',
        border: `1px solid ${DARK.border}`,
        borderRadius: 3,
        p: 2,
        position: 'relative',
        overflow: 'hidden',
        mb: 3,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PlaceIcon sx={{ color: DARK.primary, fontSize: 20 }} />
          <Typography variant="subtitle2" sx={{ color: DARK.text, fontWeight: 600 }}>
            Station Map
          </Typography>
          <Chip
            label={`${filteredStations.length} stations within ${radius}km`}
            size="small"
            sx={{ bgcolor: `${DARK.primary}22`, color: DARK.primary, height: 22, fontSize: '0.7rem' }}
          />
        </Box>
      </Box>

      {/* Map Grid */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: gridSize,
          background: `
            radial-gradient(circle at center, ${DARK.primary}08 0%, transparent 70%),
            linear-gradient(${DARK.border}22 1px, transparent 1px),
            linear-gradient(90deg, ${DARK.border}22 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 40px 40px, 40px 40px',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        {/* Radius circle */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: gridSize * 0.8,
            height: gridSize * 0.8,
            borderRadius: '50%',
            border: `1px dashed ${DARK.primary}33`,
          }}
        />

        {/* User location */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
          }}
        >
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              bgcolor: DARK.primary,
              border: `3px solid ${DARK.text}`,
              boxShadow: `0 0 20px ${DARK.primary}66`,
              animation: 'userPulse 2s ease-in-out infinite',
              '@keyframes userPulse': {
                '0%, 100%': { boxShadow: `0 0 20px ${DARK.primary}66` },
                '50%': { boxShadow: `0 0 30px ${DARK.primary}AA` },
              },
            }}
          />
        </Box>

        {/* Station markers */}
        {filteredStations.map((station) => {
          const pos = getPosition(station);
          return (
            <Tooltip
              key={station.id}
              title={
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{station.name}</Typography>
                  <Typography variant="caption">{station.distance} km away</Typography>
                  <Typography variant="caption" sx={{ display: 'block' }}>Quality: {station.quality}%</Typography>
                </Box>
              }
              arrow
            >
              <Box
                sx={{
                  position: 'absolute',
                  left: pos.x,
                  top: pos.y,
                  transform: 'translate(-50%, -50%)',
                  cursor: 'pointer',
                  zIndex: 5,
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'translate(-50%, -50%) scale(1.3)', zIndex: 20 },
                }}
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: station.status === 'online' ? DARK.success : DARK.error,
                    border: `2px solid ${DARK.card}`,
                    boxShadow: `0 0 8px ${station.status === 'online' ? DARK.success : DARK.error}44`,
                  }}
                />
              </Box>
            </Tooltip>
          );
        })}
      </Box>

      {/* Map Legend */}
      <Box sx={{ display: 'flex', gap: 3, mt: 2, justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: DARK.primary, border: `2px solid ${DARK.text}` }} />
          <Typography variant="caption" sx={{ color: DARK.textSecondary }}>You</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: DARK.success }} />
          <Typography variant="caption" sx={{ color: DARK.textSecondary }}>Online</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: DARK.error }} />
          <Typography variant="caption" sx={{ color: DARK.textSecondary }}>Offline</Typography>
        </Box>
      </Box>
    </Paper>
  );
};

const StationCard = ({ station, onRequestJoin }) => (
  <Paper
    sx={{
      bgcolor: DARK.card,
      border: `1px solid ${DARK.border}`,
      borderRadius: 3,
      p: 2.5,
      cursor: 'pointer',
      transition: 'all 0.2s',
      '&:hover': { borderColor: DARK.primary, bgcolor: DARK.cardHover },
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
      <Avatar
        sx={{
          width: 42,
          height: 42,
          bgcolor: station.avatarColor,
          fontSize: '0.85rem',
          fontWeight: 700,
        }}
      >
        {station.avatar}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* Name & Status */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="subtitle2" sx={{ color: DARK.text, fontWeight: 600 }}>
            {station.name}
          </Typography>
          <Chip
            icon={station.status === 'online'
              ? <WifiIcon sx={{ fontSize: 12, color: `${DARK.success} !important` }} />
              : <WifiOffIcon sx={{ fontSize: 12, color: `${DARK.error} !important` }} />
            }
            label={station.status}
            size="small"
            sx={{
              height: 22,
              fontSize: '0.65rem',
              fontWeight: 600,
              bgcolor: station.status === 'online' ? `${DARK.success}22` : `${DARK.error}22`,
              color: station.status === 'online' ? DARK.success : DARK.error,
            }}
          />
        </Box>

        {/* Owner & Distance */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Typography variant="caption" sx={{ color: DARK.primary }}>
            {station.owner}
          </Typography>
          <Chip
            icon={<NearMeIcon sx={{ fontSize: 12, color: `${DARK.textSecondary} !important` }} />}
            label={`${station.distance} km`}
            size="small"
            sx={{ bgcolor: `${DARK.border}44`, color: DARK.textSecondary, height: 20, fontSize: '0.65rem' }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AccessTimeIcon sx={{ fontSize: 12, color: DARK.textSecondary }} />
            <Typography variant="caption" sx={{ color: DARK.textSecondary }}>
              {station.lastReading}
            </Typography>
          </Box>
        </Box>

        {/* Metrics Row */}
        <Box sx={{ display: 'flex', gap: 2, mb: 1.5, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <VerifiedIcon sx={{ fontSize: 14, color: DARK.success }} />
            <Typography variant="caption" sx={{ color: DARK.text, fontWeight: 600 }}>
              {station.quality}%
            </Typography>
          </Box>
          {station.status === 'online' && station.temp !== null && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ThermostatIcon sx={{ fontSize: 14, color: DARK.error }} />
                <Typography variant="caption" sx={{ color: DARK.textSecondary }}>
                  {station.temp}C
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <WaterDropIcon sx={{ fontSize: 14, color: DARK.primary }} />
                <Typography variant="caption" sx={{ color: DARK.textSecondary }}>
                  {station.humidity}%
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AirIcon sx={{ fontSize: 14, color: DARK.cyan }} />
                <Typography variant="caption" sx={{ color: DARK.textSecondary }}>
                  {station.wind} km/h
                </Typography>
              </Box>
            </>
          )}
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {station.cooperative ? (
            <Chip
              label={station.cooperative}
              size="small"
              sx={{ bgcolor: `${DARK.purple}22`, color: DARK.purple, height: 22, fontSize: '0.65rem' }}
            />
          ) : (
            <Button
              size="small"
              startIcon={<GroupAddIcon sx={{ fontSize: 14 }} />}
              onClick={(e) => { e.stopPropagation(); onRequestJoin(station.id); }}
              sx={{
                color: DARK.primary,
                textTransform: 'none',
                fontSize: '0.75rem',
                fontWeight: 600,
                px: 1.5,
                border: `1px solid ${DARK.primary}44`,
                borderRadius: 2,
                '&:hover': { bgcolor: `${DARK.primary}11`, borderColor: DARK.primary },
              }}
            >
              Request to Join Cooperative
            </Button>
          )}
          <Box sx={{ flex: 1 }} />
          <Tooltip title="View Station">
            <IconButton size="small" sx={{ color: DARK.textSecondary, '&:hover': { color: DARK.primary } }}>
              <OpenInNewIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  </Paper>
);

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const NearbyStations = () => {
  const [nearbyStations, setNearbyStations] = useState([]);
  const [radius, setRadius] = useState(25);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [minQuality, setMinQuality] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [userCoords, setUserCoords] = useState(DEFAULT_COORDS);
  const [locationStatus, setLocationStatus] = useState('default'); // 'default', 'located', 'error'
  const [joinRequested, setJoinRequested] = useState([]);

  useEffect(() => {
    apiClient.get(`/weather/stations/nearby?lat=${userCoords.lat}&lng=${userCoords.lng}&radius=${radius}`)
      .then((data) => setNearbyStations(Array.isArray(data) ? data : (data.stations ?? [])))
      .catch(() => setNearbyStations([]));
  }, [userCoords, radius]);

  const handleLocate = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationStatus('located');
        },
        () => {
          setLocationStatus('error');
        },
      );
    } else {
      setLocationStatus('error');
    }
  }, []);

  const handleRequestJoin = useCallback((stationId) => {
    setJoinRequested((prev) => [...prev, stationId]);
  }, []);

  const filteredStations = useMemo(() => {
    let list = nearbyStations.filter((s) => s.distance <= radius);

    if (onlineOnly) {
      list = list.filter((s) => s.status === 'online');
    }

    if (minQuality > 0) {
      list = list.filter((s) => s.quality >= minQuality);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.owner.toLowerCase().includes(q),
      );
    }

    return list.sort((a, b) => a.distance - b.distance);
  }, [radius, onlineOnly, minQuality, searchQuery]);

  const onlineCount = filteredStations.filter((s) => s.status === 'online').length;

  return (
    <Box sx={{ bgcolor: DARK.bg, minHeight: '100vh', p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              bgcolor: `${DARK.primary}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <NearMeIcon sx={{ color: DARK.primary, fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ color: DARK.text, fontWeight: 700 }}>
              Nearby Stations
            </Typography>
            <Typography variant="body2" sx={{ color: DARK.textSecondary }}>
              Discover weather stations in your area
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<MyLocationIcon />}
            onClick={handleLocate}
            sx={{
              color: locationStatus === 'located' ? DARK.success : DARK.textSecondary,
              borderColor: locationStatus === 'located' ? DARK.success : DARK.border,
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              '&:hover': { borderColor: DARK.primary, color: DARK.primary },
            }}
          >
            {locationStatus === 'located' ? 'Located' : locationStatus === 'error' ? 'Location Error' : 'Use My Location'}
          </Button>
          <Tooltip title="Refresh">
            <IconButton
              sx={{
                color: DARK.textSecondary,
                border: `1px solid ${DARK.border}`,
                borderRadius: 2,
                '&:hover': { color: DARK.primary, borderColor: DARK.primary },
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ bgcolor: DARK.card, border: `1px solid ${DARK.border}`, borderRadius: 3, p: 2.5, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <FilterListIcon sx={{ color: DARK.textSecondary, fontSize: 20 }} />
          <Typography variant="subtitle2" sx={{ color: DARK.text, fontWeight: 600 }}>
            Filters
          </Typography>
        </Box>

        <Grid container spacing={3} alignItems="center">
          {/* Radius */}
          <Grid item xs={12} sm={4}>
            <Typography variant="caption" sx={{ color: DARK.textSecondary, mb: 0.5, display: 'block' }}>
              Search Radius
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {RADIUS_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  size="small"
                  onClick={() => setRadius(opt.value)}
                  sx={{
                    color: radius === opt.value ? DARK.text : DARK.textSecondary,
                    bgcolor: radius === opt.value ? DARK.primary : 'transparent',
                    border: `1px solid ${radius === opt.value ? DARK.primary : DARK.border}`,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    px: 1.5,
                    minWidth: 'auto',
                    '&:hover': {
                      bgcolor: radius === opt.value ? '#2563EB' : DARK.cardHover,
                    },
                  }}
                >
                  {opt.label}
                </Button>
              ))}
            </Box>
          </Grid>

          {/* Min Quality */}
          <Grid item xs={12} sm={4}>
            <Typography variant="caption" sx={{ color: DARK.textSecondary, mb: 0.5, display: 'block' }}>
              Minimum Quality Score: {minQuality > 0 ? `${minQuality}%` : 'Any'}
            </Typography>
            <Slider
              value={minQuality}
              onChange={(_, val) => setMinQuality(val)}
              min={0}
              max={99}
              step={5}
              sx={{
                color: DARK.primary,
                '& .MuiSlider-track': { bgcolor: DARK.primary },
                '& .MuiSlider-thumb': { bgcolor: DARK.primary },
                '& .MuiSlider-rail': { bgcolor: DARK.border },
              }}
            />
          </Grid>

          {/* Online Only Toggle */}
          <Grid item xs={12} sm={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={onlineOnly}
                  onChange={(e) => setOnlineOnly(e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: DARK.success },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: DARK.success },
                  }}
                />
              }
              label={
                <Typography variant="caption" sx={{ color: DARK.textSecondary }}>
                  Online Only
                </Typography>
              }
            />
          </Grid>

          {/* Search */}
          <Grid item xs={12} sm={2}>
            <TextField
              size="small"
              placeholder="Search..."
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: DARK.textSecondary, fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: DARK.bg,
                  color: DARK.text,
                  borderRadius: 2,
                  fontSize: '0.8rem',
                  '& fieldset': { borderColor: DARK.border },
                  '&:hover fieldset': { borderColor: DARK.primary },
                  '&.Mui-focused fieldset': { borderColor: DARK.primary },
                },
                '& .MuiInputBase-input::placeholder': { color: DARK.textSecondary },
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Summary */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Chip
          icon={<SensorsIcon sx={{ fontSize: 16, color: `${DARK.primary} !important` }} />}
          label={`${filteredStations.length} stations found`}
          sx={{ bgcolor: `${DARK.primary}22`, color: DARK.primary, fontWeight: 600 }}
        />
        <Chip
          icon={<WifiIcon sx={{ fontSize: 16, color: `${DARK.success} !important` }} />}
          label={`${onlineCount} online`}
          sx={{ bgcolor: `${DARK.success}22`, color: DARK.success, fontWeight: 600 }}
        />
        <Chip
          icon={<PlaceIcon sx={{ fontSize: 16, color: `${DARK.textSecondary} !important` }} />}
          label={locationStatus === 'located'
            ? `${userCoords.lat.toFixed(4)}, ${userCoords.lng.toFixed(4)}`
            : 'New York, NY (default)'
          }
          sx={{ bgcolor: `${DARK.border}44`, color: DARK.textSecondary }}
        />
      </Box>

      {/* Map */}
      <MapPlaceholder stations={nearbyStations} userCoords={userCoords} radius={radius} />

      {/* Station List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {filteredStations.map((station) => (
          <StationCard
            key={station.id}
            station={{
              ...station,
              cooperative: joinRequested.includes(station.id) ? 'Request Sent' : station.cooperative,
            }}
            onRequestJoin={handleRequestJoin}
          />
        ))}

        {filteredStations.length === 0 && (
          <Paper sx={{ bgcolor: DARK.card, border: `1px solid ${DARK.border}`, borderRadius: 3, p: 6, textAlign: 'center' }}>
            <SensorsIcon sx={{ color: DARK.textSecondary, fontSize: 48, mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" sx={{ color: DARK.text, mb: 1 }}>
              No Stations Found
            </Typography>
            <Typography variant="body2" sx={{ color: DARK.textSecondary }}>
              Try increasing the search radius or adjusting your filters.
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default function NearbyStationsGate(props) {
  return <DemoSurfaceGate testId="nearby-stations" title="Nearby station comparison is not live" description="Real station locations do not establish the sample comparison metrics shown here."><NearbyStations {...props} /></DemoSurfaceGate>;
}
