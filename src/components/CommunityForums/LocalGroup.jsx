import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Avatar,
  Chip,
  Grid,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GroupsIcon from '@mui/icons-material/Groups';
import SensorsIcon from '@mui/icons-material/Sensors';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import EventIcon from '@mui/icons-material/Event';
import ChatIcon from '@mui/icons-material/Chat';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import AirIcon from '@mui/icons-material/Air';
import PublicIcon from '@mui/icons-material/Public';
import PersonIcon from '@mui/icons-material/Person';
import StarIcon from '@mui/icons-material/Star';
import { apiClient } from '../../services/apiClient';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLORS = {
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
  { value: 10, label: '10 km' },
  { value: 25, label: '25 km' },
  { value: 50, label: '50 km' },
  { value: 100, label: '100 km' },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const GroupCard = ({ group }) => (
  <Card sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 2, '&:hover': { borderColor: group.color }, transition: 'all 0.2s' }}>
    <CardContent sx={{ p: 2.5 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: `${group.color}22`, color: group.color, width: 44, height: 44 }}>
            <LocationOnIcon />
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ color: COLORS.text, fontWeight: 700 }}>
              {group.name}
            </Typography>
            <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
              {group.region}
            </Typography>
          </Box>
        </Box>
        <Chip
          label={`${group.forecastAccuracy}% accuracy`}
          size="small"
          sx={{ bgcolor: group.forecastAccuracy >= 90 ? `${COLORS.success}22` : `${COLORS.warning}22`, color: group.forecastAccuracy >= 90 ? COLORS.success : COLORS.warning }}
        />
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <GroupsIcon sx={{ fontSize: 16, color: COLORS.textSecondary }} />
          <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>{group.members} members</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <SensorsIcon sx={{ fontSize: 16, color: COLORS.textSecondary }} />
          <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>{group.activeStations} stations</Typography>
        </Box>
      </Box>

      {/* Recent Observation */}
      <Paper sx={{ bgcolor: COLORS.bg, borderRadius: 1.5, p: 1.5, mb: 2 }}>
        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Latest Observation
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mt: 0.5, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ThermostatIcon sx={{ fontSize: 14, color: COLORS.error }} />
            <Typography variant="body2" sx={{ color: COLORS.text }}>{group.recentObs.temp}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <WaterDropIcon sx={{ fontSize: 14, color: COLORS.primary }} />
            <Typography variant="body2" sx={{ color: COLORS.text }}>{group.recentObs.humidity}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AirIcon sx={{ fontSize: 14, color: COLORS.cyan }} />
            <Typography variant="body2" sx={{ color: COLORS.text }}>{group.recentObs.wind}</Typography>
          </Box>
        </Box>
        <Chip
          label={group.recentObs.condition}
          size="small"
          sx={{ mt: 1, bgcolor: `${group.color}22`, color: group.color, height: 22, fontSize: '0.7rem' }}
        />
      </Paper>

      {/* Chat Preview */}
      <Paper sx={{ bgcolor: COLORS.bg, borderRadius: 1.5, p: 1.5, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
          <ChatIcon sx={{ fontSize: 14, color: COLORS.textSecondary }} />
          <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Group Chat
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Typography variant="body2" sx={{ color: COLORS.primary, fontWeight: 600, whiteSpace: 'nowrap' }}>
            {group.latestChat.user}:
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {group.latestChat.message}
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ color: `${COLORS.textSecondary}88`, mt: 0.5, display: 'block' }}>
          {group.latestChat.time}
        </Typography>
      </Paper>

      {/* Upcoming Event */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <EventIcon sx={{ fontSize: 16, color: COLORS.purple }} />
        <Typography variant="body2" sx={{ color: COLORS.text }}>
          {group.upcomingEvent.name}
        </Typography>
        <Chip label={group.upcomingEvent.date} size="small" sx={{ bgcolor: `${COLORS.purple}22`, color: COLORS.purple, height: 20, fontSize: '0.65rem' }} />
        <Chip
          label={group.upcomingEvent.type}
          size="small"
          sx={{
            bgcolor: group.upcomingEvent.type === 'virtual' ? `${COLORS.primary}22` : `${COLORS.success}22`,
            color: group.upcomingEvent.type === 'virtual' ? COLORS.primary : COLORS.success,
            height: 20,
            fontSize: '0.65rem',
          }}
        />
      </Box>

      {/* Leaderboard */}
      <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, mb: 1, display: 'block' }}>
        Top Contributors
      </Typography>
      {group.topContributors.map((contributor, idx) => (
        <Box key={contributor.name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ color: idx === 0 ? COLORS.warning : COLORS.textSecondary, fontWeight: 600, width: 16 }}>
              #{idx + 1}
            </Typography>
            <Avatar sx={{ bgcolor: group.color, width: 24, height: 24, fontSize: '0.6rem' }}>
              {contributor.avatar}
            </Avatar>
            <Typography variant="body2" sx={{ color: COLORS.text }}>
              {contributor.name}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: COLORS.warning, fontWeight: 600 }}>
            {contributor.score.toLocaleString()} pts
          </Typography>
        </Box>
      ))}

      {/* Join Button */}
      <Button
        fullWidth
        variant="outlined"
        sx={{ mt: 2, color: group.color, borderColor: group.color, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: `${group.color}11`, borderColor: group.color } }}
      >
        Join Group
      </Button>
    </CardContent>
  </Card>
);

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const LocalGroup = () => {
  const [radius, setRadius] = useState(50);
  const [sortBy, setSortBy] = useState('members');
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    apiClient.get('/community/local-groups')
      .then((data) => setGroups(Array.isArray(data) ? data : (data.groups ?? [])))
      .catch(() => setGroups([]));
  }, []);

  const sortedGroups = useMemo(() => {
    const sorted = [...groups];
    switch (sortBy) {
    case 'accuracy':
      return sorted.sort((a, b) => b.forecastAccuracy - a.forecastAccuracy);
    case 'stations':
      return sorted.sort((a, b) => b.activeStations - a.activeStations);
    case 'members':
    default:
      return sorted.sort((a, b) => b.members - a.members);
    }
  }, [sortBy, groups]);

  return (
    <Box sx={{ bgcolor: COLORS.bg, minHeight: '100vh', p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <LocationOnIcon sx={{ color: COLORS.primary, fontSize: 32 }} />
          <Typography variant="h4" sx={{ color: COLORS.text, fontWeight: 700 }}>
            Local Weather Groups
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<MyLocationIcon />}
            sx={{ color: COLORS.primary, borderColor: COLORS.primary, textTransform: 'none', fontWeight: 600 }}
          >
            Find Groups Near Me
          </Button>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <Select
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              sx={{
                color: COLORS.text,
                bgcolor: COLORS.card,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.border },
                '& .MuiSvgIcon-root': { color: COLORS.textSecondary },
              }}
            >
              {RADIUS_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              sx={{
                color: COLORS.text,
                bgcolor: COLORS.card,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.border },
                '& .MuiSvgIcon-root': { color: COLORS.textSecondary },
              }}
            >
              <MenuItem value="members">Most Members</MenuItem>
              <MenuItem value="accuracy">Best Accuracy</MenuItem>
              <MenuItem value="stations">Most Stations</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Map Placeholder */}
      <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 2, p: 2, mb: 3 }}>
        <Box
          sx={{
            bgcolor: COLORS.bg,
            borderRadius: 2,
            height: 160,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <PublicIcon sx={{ position: 'absolute', fontSize: 140, color: `${COLORS.border}44` }} />
          {sortedGroups.map((group, idx) => {
            const positions = [
              { left: '22%', top: '28%' },
              { left: '12%', top: '40%' },
              { left: '68%', top: '32%' },
              { left: '82%', top: '38%' },
              { left: '30%', top: '35%' },
              { left: '90%', top: '60%' },
              { left: '60%', top: '30%' },
              { left: '78%', top: '55%' },
            ];
            const pos = positions[idx] || { left: '50%', top: '50%' };
            return (
              <Tooltip key={group.id} title={`${group.name} (${group.members} members)`}>
                <Box
                  sx={{
                    position: 'absolute',
                    ...pos,
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    bgcolor: group.color,
                    border: `2px solid ${COLORS.text}`,
                    cursor: 'pointer',
                    zIndex: 1,
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'scale(1.5)' },
                  }}
                />
              </Tooltip>
            );
          })}
        </Box>
      </Paper>

      {/* Group Grid */}
      <Grid container spacing={2}>
        {sortedGroups.map((group) => (
          <Grid item xs={12} sm={6} lg={4} xl={3} key={group.id}>
            <GroupCard group={group} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default LocalGroup;
