import DemoSurfaceGate from '../common/DemoSurfaceGate';
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import { useNavigate } from 'react-router';
import {
  Box,
  Typography,
  Paper,
  Button,
  Avatar,
  AvatarGroup,
  Chip,
  TextField,
  Grid,
  Divider,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Tabs,
  Tab,
  Badge,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import VerifiedIcon from '@mui/icons-material/Verified';
import BarChartIcon from '@mui/icons-material/BarChart';
import SensorsIcon from '@mui/icons-material/Sensors';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CampaignIcon from '@mui/icons-material/Campaign';
import ChatIcon from '@mui/icons-material/Chat';
import PublicIcon from '@mui/icons-material/Public';
import PieChartIcon from '@mui/icons-material/PieChart';
import SettingsIcon from '@mui/icons-material/Settings';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import StarIcon from '@mui/icons-material/Star';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ForumIcon from '@mui/icons-material/Forum';

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
  gold: '#FFD700',
};

const REGION_OPTIONS = [
  'North America', 'Europe', 'Asia Pacific', 'South America', 'Africa',
  'Middle East', 'Oceania', 'Global',
];

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const cooperatives = [
  {
    id: 'coop-01',
    name: 'NYC Data Network',
    description: 'Collaborative weather data collection covering the greater New York City metropolitan area. Premium data sharing and joint forecasting.',
    region: 'North America',
    members: 24,
    memberCap: 30,
    sharedEarnings: 12450,
    avgQuality: 95.8,
    totalStations: 47,
    founded: 'Jun 2024',
    creator: 'NYCWeather.wrf',
    creatorAvatar: 'NY',
    creatorColor: '#3B82F6',
    featured: true,
    memberAvatars: [
      { name: 'NYCWeather', color: '#3B82F6' },
      { name: 'BrooklynWx', color: '#10B981' },
      { name: 'RiverWatch', color: '#F59E0B' },
      { name: 'QueensBoro', color: '#EF4444' },
      { name: 'HarlemHigh', color: '#8B5CF6' },
    ],
  },
  {
    id: 'coop-02',
    name: 'Alpine Weather Collective',
    description: 'High-altitude weather monitoring cooperative spanning the European Alps. Specialized in mountain and avalanche forecasting data.',
    region: 'Europe',
    members: 15,
    memberCap: 20,
    sharedEarnings: 18720,
    avgQuality: 97.4,
    totalStations: 32,
    founded: 'Mar 2024',
    creator: 'AlpineObserver.wrf',
    creatorAvatar: 'AO',
    creatorColor: '#8B5CF6',
    featured: true,
    memberAvatars: [
      { name: 'AlpineObs', color: '#8B5CF6' },
      { name: 'FjordWx', color: '#2563EB' },
      { name: 'NordicGale', color: '#4F46E5' },
      { name: 'SwissHigh', color: '#EF4444' },
    ],
  },
  {
    id: 'coop-03',
    name: 'Harbor Watch',
    description: 'Coastal and maritime weather monitoring cooperative. Focused on harbor conditions, sea-level data, and marine forecasting.',
    region: 'North America',
    members: 18,
    memberCap: 25,
    sharedEarnings: 9830,
    avgQuality: 96.2,
    totalStations: 28,
    founded: 'Aug 2024',
    creator: 'CoastalNJ.wrf',
    creatorAvatar: 'CN',
    creatorColor: '#0891B2',
    featured: false,
    memberAvatars: [
      { name: 'CoastalNJ', color: '#0891B2' },
      { name: 'LibertyWx', color: '#06B6D4' },
      { name: 'HarborView', color: '#10B981' },
    ],
  },
  {
    id: 'coop-04',
    name: 'Tropical Storm Network',
    description: 'Caribbean and Gulf region cooperative focused on tropical weather systems, hurricane tracking data, and storm surge monitoring.',
    region: 'North America',
    members: 31,
    memberCap: 40,
    sharedEarnings: 22100,
    avgQuality: 93.1,
    totalStations: 65,
    founded: 'Jan 2024',
    creator: 'HurricaneHunter.wrf',
    creatorAvatar: 'HH',
    creatorColor: '#DC2626',
    featured: false,
    memberAvatars: [
      { name: 'HHunter', color: '#DC2626' },
      { name: 'CaribbWx', color: '#0284C7' },
      { name: 'GulfWatch', color: '#059669' },
      { name: 'TropSun', color: '#EAB308' },
      { name: 'IslandObs', color: '#EC4899' },
    ],
  },
  {
    id: 'coop-05',
    name: 'Pacific Rim Alliance',
    description: 'Trans-Pacific weather monitoring cooperative linking stations from Japan, Australia, Philippines, and West Coast USA.',
    region: 'Asia Pacific',
    members: 22,
    memberCap: 35,
    sharedEarnings: 15600,
    avgQuality: 94.7,
    totalStations: 51,
    founded: 'May 2024',
    creator: 'PacificWind.wrf',
    creatorAvatar: 'PW',
    creatorColor: '#3B82F6',
    featured: false,
    memberAvatars: [
      { name: 'PacWind', color: '#3B82F6' },
      { name: 'TokyoWx', color: '#EF4444' },
      { name: 'SydneyObs', color: '#10B981' },
    ],
  },
  {
    id: 'coop-06',
    name: 'Saharan Data Collective',
    description: 'Desert and arid climate monitoring cooperative. Sparse station coverage makes every data point critical for dust storm and heat wave prediction.',
    region: 'Africa',
    members: 8,
    memberCap: 15,
    sharedEarnings: 5200,
    avgQuality: 96.9,
    totalStations: 12,
    founded: 'Sep 2024',
    creator: 'SaharaDust.wrf',
    creatorAvatar: 'SD',
    creatorColor: '#D97706',
    featured: false,
    memberAvatars: [
      { name: 'SaharaDust', color: '#D97706' },
      { name: 'SavannaWx', color: '#65A30D' },
    ],
  },
];

const detailMembers = [
  { id: 'm1', name: 'NYCWeather.wrf', avatar: 'NY', color: '#3B82F6', role: 'admin', stations: 5, quality: 97.3, earnings: 2180 },
  { id: 'm2', name: 'BrooklynWx.wrf', avatar: 'BW', color: '#10B981', role: 'member', stations: 3, quality: 94.1, earnings: 1420 },
  { id: 'm3', name: 'RiverWatch.wrf', avatar: 'RW', color: '#F59E0B', role: 'member', stations: 2, quality: 95.8, earnings: 1190 },
  { id: 'm4', name: 'QueensBoro.wrf', avatar: 'QB', color: '#EF4444', role: 'member', stations: 4, quality: 96.5, earnings: 1650 },
  { id: 'm5', name: 'HarlemHigh.wrf', avatar: 'HH', color: '#8B5CF6', role: 'admin', stations: 2, quality: 93.7, earnings: 980 },
  { id: 'm6', name: 'BronxMetro.wrf', avatar: 'BM', color: '#EC4899', role: 'member', stations: 1, quality: 91.2, earnings: 640 },
  { id: 'm7', name: 'StatenIsle.wrf', avatar: 'SI', color: '#06B6D4', role: 'member', stations: 3, quality: 94.9, earnings: 1340 },
  { id: 'm8', name: 'LongIsland.wrf', avatar: 'LI', color: '#14B8A6', role: 'member', stations: 4, quality: 95.2, earnings: 1510 },
];

const pendingRequests = [
  { id: 'req-1', name: 'NJWeather42.wrf', avatar: 'NJ', color: '#F97316', stations: 2, quality: 92.8, requestedAt: '2 hours ago' },
  { id: 'req-2', name: 'ConnCoastal.wrf', avatar: 'CC', color: '#059669', stations: 3, quality: 95.1, requestedAt: '1 day ago' },
  { id: 'req-3', name: 'HudsonFlats.wrf', avatar: 'HF', color: '#7C3AED', stations: 1, quality: 89.4, requestedAt: '2 days ago' },
];

const announcements = [
  { id: 'ann-1', author: 'NYCWeather.wrf', message: 'Great work everyone! We hit 95.8% average quality this week. Keep up the calibration checks.', time: '3 hours ago' },
  { id: 'ann-2', author: 'HarlemHigh.wrf', message: 'Winter storm approaching this weekend. Let us make sure all stations are operational and batteries are charged.', time: '1 day ago' },
  { id: 'ann-3', author: 'NYCWeather.wrf', message: 'New earnings distribution: we are now splitting 60% individual / 40% cooperative pool. Vote results finalized.', time: '3 days ago' },
  { id: 'ann-4', author: 'BrooklynWx.wrf', message: 'Added two new stations in South Brooklyn. Coverage is improving.', time: '5 days ago' },
];

const forumTopics = [
  { id: 'ft-1', title: 'Best station placement tips for NYC rooftops', author: 'NYCWeather.wrf', replies: 23, views: 412, time: '2 hours ago', pinned: true },
  { id: 'ft-2', title: 'Winter calibration schedule reminder', author: 'HarlemHigh.wrf', replies: 8, views: 156, time: '5 hours ago', pinned: true },
  { id: 'ft-3', title: 'Data quality improvements this quarter', author: 'BrooklynWx.wrf', replies: 15, views: 289, time: '1 day ago', pinned: false },
  { id: 'ft-4', title: 'New member onboarding resources', author: 'NYCWeather.wrf', replies: 31, views: 567, time: '2 days ago', pinned: false },
  { id: 'ft-5', title: 'Station battery backup recommendations?', author: 'QueensBoro.wrf', replies: 12, views: 198, time: '3 days ago', pinned: false },
  { id: 'ft-6', title: 'Sharing our cooperative earnings report', author: 'StatenIsle.wrf', replies: 7, views: 143, time: '4 days ago', pinned: false },
];

// Pie chart data for earnings distribution
const EARNINGS_SLICES = [
  { label: 'Individual Rewards', value: 60, color: DARK.primary },
  { label: 'Cooperative Pool', value: 25, color: DARK.success },
  { label: 'Quality Bonus', value: 10, color: DARK.warning },
  { label: 'Infrastructure Fund', value: 5, color: DARK.purple },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const CooperativeCard = ({ coop, onSelect }) => (
  <Paper
    onClick={() => onSelect(coop.id)}
    sx={{
      bgcolor: DARK.card,
      border: `1px solid ${coop.featured ? `${DARK.gold}44` : DARK.border}`,
      borderRadius: 3,
      p: 3,
      cursor: 'pointer',
      transition: 'all 0.2s',
      '&:hover': { borderColor: DARK.primary, bgcolor: DARK.cardHover, transform: 'translateY(-2px)' },
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ width: 44, height: 44, bgcolor: coop.creatorColor, fontSize: '0.9rem', fontWeight: 700 }}>
          {coop.creatorAvatar}
        </Avatar>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle1" sx={{ color: DARK.text, fontWeight: 700 }}>
              {coop.name}
            </Typography>
            {coop.featured && (
              <StarIcon sx={{ color: DARK.gold, fontSize: 18 }} />
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={coop.region}
              size="small"
              sx={{ bgcolor: `${DARK.primary}22`, color: DARK.primary, height: 20, fontSize: '0.65rem' }}
            />
            <Typography variant="caption" sx={{ color: DARK.textSecondary }}>
              Est. {coop.founded}
            </Typography>
          </Box>
        </Box>
      </Box>
      <Chip
        label={`${coop.members}/${coop.memberCap}`}
        size="small"
        icon={<PersonIcon sx={{ fontSize: 14, color: `${DARK.textSecondary} !important` }} />}
        sx={{
          bgcolor: coop.members >= coop.memberCap ? `${DARK.error}22` : `${DARK.border}44`,
          color: coop.members >= coop.memberCap ? DARK.error : DARK.textSecondary,
          height: 24,
          fontSize: '0.7rem',
          fontWeight: 600,
        }}
      />
    </Box>

    <Typography variant="body2" sx={{ color: DARK.textSecondary, mb: 2, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
      {coop.description}
    </Typography>

    {/* Stats */}
    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
      <Box>
        <Typography variant="caption" sx={{ color: DARK.textSecondary }}>Shared Earnings</Typography>
        <Typography variant="body2" sx={{ color: DARK.success, fontWeight: 700 }}>
          {coop.sharedEarnings.toLocaleString()} WRF
        </Typography>
      </Box>
      <Divider orientation="vertical" flexItem sx={{ borderColor: DARK.border }} />
      <Box>
        <Typography variant="caption" sx={{ color: DARK.textSecondary }}>Avg Quality</Typography>
        <Typography variant="body2" sx={{ color: DARK.warning, fontWeight: 700 }}>
          {coop.avgQuality}%
        </Typography>
      </Box>
      <Divider orientation="vertical" flexItem sx={{ borderColor: DARK.border }} />
      <Box>
        <Typography variant="caption" sx={{ color: DARK.textSecondary }}>Stations</Typography>
        <Typography variant="body2" sx={{ color: DARK.primary, fontWeight: 700 }}>
          {coop.totalStations}
        </Typography>
      </Box>
    </Box>

    {/* Member Avatars */}
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <AvatarGroup
        max={5}
        sx={{
          '& .MuiAvatar-root': { width: 28, height: 28, fontSize: '0.65rem', border: `2px solid ${DARK.card}` },
        }}
      >
        {coop.memberAvatars.map((m) => (
          <Avatar key={m.name} sx={{ bgcolor: m.color }}>{m.name.slice(0, 2)}</Avatar>
        ))}
      </AvatarGroup>
      <Typography variant="caption" sx={{ color: DARK.primary, fontWeight: 600 }}>
        View Details
      </Typography>
    </Box>
  </Paper>
);

const EarningsPieChart = () => {
  const total = EARNINGS_SLICES.reduce((sum, s) => sum + s.value, 0);
  let currentAngle = -90;

  const getArc = (startAngle, endAngle, r) => {
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = 80 + r * Math.cos(startRad);
    const y1 = 80 + r * Math.sin(startRad);
    const x2 = 80 + r * Math.cos(endRad);
    const y2 = 80 + r * Math.sin(endRad);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M 80 80 L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  return (
    <Box sx={{ textAlign: 'center' }}>
      <svg width="160" height="160" viewBox="0 0 160 160">
        {EARNINGS_SLICES.map((slice) => {
          const sliceAngle = (slice.value / total) * 360;
          const startAngle = currentAngle;
          const endAngle = currentAngle + sliceAngle;
          currentAngle = endAngle;
          return (
            <path
              key={slice.label}
              d={getArc(startAngle, endAngle, 70)}
              fill={slice.color}
              stroke={DARK.card}
              strokeWidth="2"
              opacity={0.85}
            />
          );
        })}
        <circle cx="80" cy="80" r="35" fill={DARK.card} />
        <text x="80" y="76" textAnchor="middle" fill={DARK.text} fontSize="14" fontWeight="700">
          12,450
        </text>
        <text x="80" y="92" textAnchor="middle" fill={DARK.textSecondary} fontSize="9">
          WRF Total
        </text>
      </svg>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mt: 1 }}>
        {EARNINGS_SLICES.map((slice) => (
          <Box key={slice.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: slice.color }} />
            <Typography variant="caption" sx={{ color: DARK.textSecondary, fontSize: '0.6rem' }}>
              {slice.label} ({slice.value}%)
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const CooperativeDetailView = ({ coopId, onBack }) => {
  const [coop, setCoop] = useState(null);
  const [detailMembers, setDetailMembers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [forumTopics, setForumTopics] = useState([]);
  const [detailTab, setDetailTab] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      apiClient.get(`/cooperatives/${coopId}`),
      apiClient.get(`/cooperatives/${coopId}/members`),
      apiClient.get(`/cooperatives/${coopId}/requests`),
      apiClient.get(`/cooperatives/${coopId}/announcements`),
      apiClient.get(`/cooperatives/${coopId}/forum`),
    ]).then(([c, m, r, a, f]) => {
      setCoop(c.cooperative ?? c);
      setDetailMembers(Array.isArray(m) ? m : (m.members ?? []));
      setPendingRequests(Array.isArray(r) ? r : (r.requests ?? []));
      setAnnouncements(Array.isArray(a) ? a : (a.announcements ?? []));
      setForumTopics(Array.isArray(f) ? f : (f.topics ?? []));
    }).catch(() => {});
  }, [coopId]);

  if (!coop) return null;

  return (
    <Box>
      {/* Back Button & Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={onBack} sx={{ color: DARK.textSecondary, border: `1px solid ${DARK.border}`, borderRadius: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ color: DARK.text, fontWeight: 700 }}>
            {coop.name}
          </Typography>
          <Typography variant="body2" sx={{ color: DARK.textSecondary }}>
            {coop.description}
          </Typography>
        </Box>
        <Tooltip title="Settings">
          <IconButton sx={{ color: DARK.textSecondary, border: `1px solid ${DARK.border}`, borderRadius: 2 }}>
            <SettingsIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Stats Row */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {[
          { label: 'Members', value: `${coop.members}/${coop.memberCap}`, icon: PersonIcon, color: DARK.primary },
          { label: 'Shared Earnings', value: `${coop.sharedEarnings.toLocaleString()} WRF`, icon: MonetizationOnIcon, color: DARK.success },
          { label: 'Avg Quality', value: `${coop.avgQuality}%`, icon: VerifiedIcon, color: DARK.warning },
          { label: 'Total Stations', value: coop.totalStations, icon: SensorsIcon, color: DARK.cyan },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Paper
              key={stat.label}
              sx={{ bgcolor: DARK.card, border: `1px solid ${DARK.border}`, borderRadius: 3, p: 2, flex: '1 1 160px', minWidth: 140 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Icon sx={{ color: stat.color, fontSize: 18 }} />
                <Typography variant="caption" sx={{ color: DARK.textSecondary }}>{stat.label}</Typography>
              </Box>
              <Typography variant="h6" sx={{ color: DARK.text, fontWeight: 700 }}>{stat.value}</Typography>
            </Paper>
          );
        })}
      </Box>

      {/* Tabs */}
      <Paper sx={{ bgcolor: DARK.card, border: `1px solid ${DARK.border}`, borderRadius: 3, mb: 3 }}>
        <Tabs
          value={detailTab}
          onChange={(_, val) => setDetailTab(val)}
          sx={{
            px: 2,
            '& .MuiTab-root': { color: DARK.textSecondary, textTransform: 'none', fontWeight: 500, fontSize: '0.9rem' },
            '& .Mui-selected': { color: DARK.primary, fontWeight: 600 },
            '& .MuiTabs-indicator': { bgcolor: DARK.primary },
          }}
        >
          <Tab icon={<PersonIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Members" />
          <Tab
            icon={
              <Badge badgeContent={pendingRequests.length} color="error" sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 16, minWidth: 16 } }}>
                <GroupsIcon sx={{ fontSize: 18 }} />
              </Badge>
            }
            iconPosition="start"
            label="Requests"
          />
          <Tab icon={<CampaignIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Announcements" />
          <Tab icon={<PieChartIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Earnings" />
          <Tab icon={<ForumIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Forum" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {detailTab === 0 && (
        <Paper sx={{ bgcolor: DARK.card, border: `1px solid ${DARK.border}`, borderRadius: 3, overflow: 'hidden' }}>
          <List disablePadding>
            {detailMembers.map((member, idx) => (
              <React.Fragment key={member.id}>
                <ListItem
                  sx={{
                    py: 2,
                    px: 3,
                    '&:hover': { bgcolor: DARK.cardHover },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: member.color, fontSize: '0.8rem', fontWeight: 700 }}>
                      {member.avatar}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ color: DARK.text, fontWeight: 600 }}>
                          {member.name}
                        </Typography>
                        <Chip
                          icon={member.role === 'admin'
                            ? <AdminPanelSettingsIcon sx={{ fontSize: 12, color: `${DARK.warning} !important` }} />
                            : <PersonIcon sx={{ fontSize: 12, color: `${DARK.textSecondary} !important` }} />
                          }
                          label={member.role}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.6rem',
                            fontWeight: 600,
                            bgcolor: member.role === 'admin' ? `${DARK.warning}22` : `${DARK.border}44`,
                            color: member.role === 'admin' ? DARK.warning : DARK.textSecondary,
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                        <Typography variant="caption" sx={{ color: DARK.textSecondary }}>
                          {member.stations} stations
                        </Typography>
                        <Typography variant="caption" sx={{ color: DARK.success }}>
                          {member.quality}% quality
                        </Typography>
                        <Typography variant="caption" sx={{ color: DARK.warning }}>
                          {member.earnings.toLocaleString()} WRF
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="View Profile">
                      <IconButton size="small" sx={{ color: DARK.textSecondary }}>
                        <OpenInNewIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
                {idx < detailMembers.length - 1 && <Divider sx={{ borderColor: DARK.border }} />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {detailTab === 1 && (
        <Paper sx={{ bgcolor: DARK.card, border: `1px solid ${DARK.border}`, borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ color: DARK.text, fontWeight: 600, mb: 2 }}>
              Pending Join Requests ({pendingRequests.length})
            </Typography>
          </Box>
          <List disablePadding>
            {pendingRequests.map((req, idx) => (
              <React.Fragment key={req.id}>
                <ListItem sx={{ py: 2, px: 3 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: req.color, fontSize: '0.8rem', fontWeight: 700 }}>
                      {req.avatar}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ color: DARK.text, fontWeight: 600 }}>
                        {req.name}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                        <Typography variant="caption" sx={{ color: DARK.textSecondary }}>
                          {req.stations} stations
                        </Typography>
                        <Typography variant="caption" sx={{ color: req.quality >= 90 ? DARK.success : DARK.warning }}>
                          {req.quality}% quality
                        </Typography>
                        <Typography variant="caption" sx={{ color: DARK.textSecondary }}>
                          Requested {req.requestedAt}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Approve">
                        <IconButton
                          size="small"
                          sx={{
                            color: DARK.success,
                            border: `1px solid ${DARK.success}44`,
                            borderRadius: 1.5,
                            '&:hover': { bgcolor: `${DARK.success}22` },
                          }}
                        >
                          <CheckIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Deny">
                        <IconButton
                          size="small"
                          sx={{
                            color: DARK.error,
                            border: `1px solid ${DARK.error}44`,
                            borderRadius: 1.5,
                            '&:hover': { bgcolor: `${DARK.error}22` },
                          }}
                        >
                          <CloseIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
                {idx < pendingRequests.length - 1 && <Divider sx={{ borderColor: DARK.border }} />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {detailTab === 2 && (
        <Paper sx={{ bgcolor: DARK.card, border: `1px solid ${DARK.border}`, borderRadius: 3, p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CampaignIcon sx={{ color: DARK.warning, fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ color: DARK.text, fontWeight: 600 }}>
              Announcements & Chat
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {announcements.map((ann) => (
              <Paper
                key={ann.id}
                sx={{
                  bgcolor: DARK.cardHover,
                  border: `1px solid ${DARK.border}`,
                  borderRadius: 2,
                  p: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="body2" sx={{ color: DARK.primary, fontWeight: 600 }}>
                    {ann.author}
                  </Typography>
                  <Typography variant="caption" sx={{ color: DARK.textSecondary }}>
                    {ann.time}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: DARK.text, lineHeight: 1.5 }}>
                  {ann.message}
                </Typography>
              </Paper>
            ))}
          </Box>
          <TextField
            fullWidth
            placeholder="Write a message to the cooperative..."
            size="small"
            sx={{
              mt: 2,
              '& .MuiOutlinedInput-root': {
                bgcolor: DARK.bg,
                color: DARK.text,
                borderRadius: 2,
                '& fieldset': { borderColor: DARK.border },
                '&:hover fieldset': { borderColor: DARK.primary },
                '&.Mui-focused fieldset': { borderColor: DARK.primary },
              },
              '& .MuiInputBase-input::placeholder': { color: DARK.textSecondary },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton sx={{ color: DARK.primary }}>
                    <ChatIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Paper>
      )}

      {detailTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ bgcolor: DARK.card, border: `1px solid ${DARK.border}`, borderRadius: 3, p: 3 }}>
              <Typography variant="subtitle2" sx={{ color: DARK.text, fontWeight: 600, mb: 2 }}>
                Earnings Distribution
              </Typography>
              <EarningsPieChart />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ bgcolor: DARK.card, border: `1px solid ${DARK.border}`, borderRadius: 3, p: 3 }}>
              <Typography variant="subtitle2" sx={{ color: DARK.text, fontWeight: 600, mb: 2 }}>
                Performance Metrics
              </Typography>
              {[
                { label: 'Data Coverage', value: 87, color: DARK.primary },
                { label: 'Average Quality', value: 95.8, color: DARK.success },
                { label: 'Uptime Reliability', value: 99.2, color: DARK.cyan },
                { label: 'Member Participation', value: 82, color: DARK.warning },
              ].map((metric) => (
                <Box key={metric.label} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ color: DARK.textSecondary }}>{metric.label}</Typography>
                    <Typography variant="caption" sx={{ color: metric.color, fontWeight: 700 }}>{metric.value}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={metric.value}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: `${metric.color}15`,
                      '& .MuiLinearProgress-bar': { bgcolor: metric.color, borderRadius: 3 },
                    }}
                  />
                </Box>
              ))}
            </Paper>
          </Grid>
        </Grid>
      )}

      {detailTab === 4 && (
        <Box>
          <Paper sx={{ bgcolor: DARK.card, border: `1px solid ${DARK.border}`, borderRadius: 3, p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <ForumIcon sx={{ color: DARK.primary, fontSize: 22 }} />
                <Typography variant="subtitle1" sx={{ color: DARK.text, fontWeight: 700 }}>
                  {coop.name} Forum
                </Typography>
                <Chip
                  label={`${forumTopics.length} topics`}
                  size="small"
                  sx={{ bgcolor: `${DARK.primary}22`, color: DARK.primary, height: 22, fontSize: '0.7rem', fontWeight: 600 }}
                />
              </Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                onClick={() => navigate(`/community?tab=cooperatives&coop=${coopId}`)}
                sx={{
                  color: DARK.primary,
                  borderColor: DARK.primary,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2,
                  fontSize: '0.8rem',
                  '&:hover': { bgcolor: `${DARK.primary}15`, borderColor: DARK.primary },
                }}
              >
                Open Full Forum
              </Button>
            </Box>
            <Typography variant="body2" sx={{ color: DARK.textSecondary, mb: 1 }}>
              Discuss topics, share insights, and collaborate with other {coop.name} members.
            </Typography>
          </Paper>

          <Paper sx={{ bgcolor: DARK.card, border: `1px solid ${DARK.border}`, borderRadius: 3, overflow: 'hidden' }}>
            <List disablePadding>
              {forumTopics.map((topic, idx) => (
                <React.Fragment key={topic.id}>
                  <ListItem
                    sx={{
                      py: 2,
                      px: 3,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: DARK.cardHover },
                    }}
                    onClick={() => navigate(`/community?tab=cooperatives&coop=${coopId}`)}
                  >
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        {topic.pinned && (
                          <Chip
                            label="Pinned"
                            size="small"
                            sx={{
                              bgcolor: `${DARK.warning}22`,
                              color: DARK.warning,
                              height: 18,
                              fontSize: '0.6rem',
                              fontWeight: 700,
                            }}
                          />
                        )}
                        <Typography variant="body2" sx={{ color: DARK.text, fontWeight: 600 }}>
                          {topic.title}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                        <Typography variant="caption" sx={{ color: DARK.primary }}>
                          {topic.author}
                        </Typography>
                        <Typography variant="caption" sx={{ color: DARK.textSecondary }}>
                          {topic.replies} replies
                        </Typography>
                        <Typography variant="caption" sx={{ color: DARK.textSecondary }}>
                          {topic.views} views
                        </Typography>
                        <Typography variant="caption" sx={{ color: DARK.textSecondary }}>
                          {topic.time}
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton size="small" sx={{ color: DARK.textSecondary }}>
                      <OpenInNewIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </ListItem>
                  {idx < forumTopics.length - 1 && <Divider sx={{ borderColor: DARK.border }} />}
                </React.Fragment>
              ))}
            </List>
          </Paper>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              onClick={() => navigate(`/community?tab=cooperatives&coop=${coopId}`)}
              sx={{
                color: DARK.primary,
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { bgcolor: `${DARK.primary}15` },
              }}
            >
              View all discussions on Community Forums →
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

const CreateCooperativeDialog = ({ open, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    region: '',
    memberCap: 20,
  });

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: DARK.card,
          border: `1px solid ${DARK.border}`,
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle sx={{ color: DARK.text, fontWeight: 700, borderBottom: `1px solid ${DARK.border}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GroupsIcon sx={{ color: DARK.primary }} />
          Create New Cooperative
        </Box>
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          <TextField
            label="Cooperative Name"
            fullWidth
            value={formData.name}
            onChange={handleChange('name')}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: DARK.bg,
                color: DARK.text,
                borderRadius: 2,
                '& fieldset': { borderColor: DARK.border },
                '&:hover fieldset': { borderColor: DARK.primary },
                '&.Mui-focused fieldset': { borderColor: DARK.primary },
              },
              '& .MuiInputLabel-root': { color: DARK.textSecondary },
              '& .MuiInputLabel-root.Mui-focused': { color: DARK.primary },
            }}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={handleChange('description')}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: DARK.bg,
                color: DARK.text,
                borderRadius: 2,
                '& fieldset': { borderColor: DARK.border },
                '&:hover fieldset': { borderColor: DARK.primary },
                '&.Mui-focused fieldset': { borderColor: DARK.primary },
              },
              '& .MuiInputLabel-root': { color: DARK.textSecondary },
              '& .MuiInputLabel-root.Mui-focused': { color: DARK.primary },
            }}
          />
          <FormControl fullWidth>
            <InputLabel sx={{ color: DARK.textSecondary, '&.Mui-focused': { color: DARK.primary } }}>
              Region
            </InputLabel>
            <Select
              value={formData.region}
              label="Region"
              onChange={handleChange('region')}
              sx={{
                bgcolor: DARK.bg,
                color: DARK.text,
                borderRadius: 2,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: DARK.border },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: DARK.primary },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: DARK.primary },
                '& .MuiSvgIcon-root': { color: DARK.textSecondary },
              }}
            >
              {REGION_OPTIONS.map((r) => (
                <MenuItem key={r} value={r}>{r}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Member Cap"
            fullWidth
            type="number"
            value={formData.memberCap}
            onChange={handleChange('memberCap')}
            inputProps={{ min: 5, max: 100 }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: DARK.bg,
                color: DARK.text,
                borderRadius: 2,
                '& fieldset': { borderColor: DARK.border },
                '&:hover fieldset': { borderColor: DARK.primary },
                '&.Mui-focused fieldset': { borderColor: DARK.primary },
              },
              '& .MuiInputLabel-root': { color: DARK.textSecondary },
              '& .MuiInputLabel-root.Mui-focused': { color: DARK.primary },
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${DARK.border}` }}>
        <Button
          onClick={onClose}
          sx={{ color: DARK.textSecondary, textTransform: 'none', '&:hover': { bgcolor: DARK.cardHover } }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onClose}
          disabled={!formData.name || !formData.region}
          sx={{
            bgcolor: DARK.primary,
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
            '&:hover': { bgcolor: '#2563EB' },
            '&.Mui-disabled': { bgcolor: `${DARK.primary}44`, color: `${DARK.text}44` },
          }}
        >
          Create Cooperative
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const CooperativeHub = () => {
  const [cooperatives, setCooperatives] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCoop, setSelectedCoop] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [regionFilter, setRegionFilter] = useState('All');

  useEffect(() => {
    apiClient.get('/cooperatives')
      .then((data) => setCooperatives(Array.isArray(data) ? data : (data.cooperatives ?? [])))
      .catch(() => setCooperatives([]));
  }, []);

  const filteredCoops = useMemo(() => {
    let list = [...cooperatives];

    if (regionFilter !== 'All') {
      list = list.filter((c) => c.region === regionFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q),
      );
    }

    return list;
  }, [searchQuery, regionFilter]);

  if (selectedCoop) {
    return (
      <Box sx={{ bgcolor: DARK.bg, minHeight: '100vh', p: 3 }}>
        <CooperativeDetailView coopId={selectedCoop} onBack={() => setSelectedCoop(null)} />
      </Box>
    );
  }

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
              bgcolor: `${DARK.purple}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <GroupsIcon sx={{ color: DARK.purple, fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ color: DARK.text, fontWeight: 700 }}>
              Cooperative Hub
            </Typography>
            <Typography variant="body2" sx={{ color: DARK.textSecondary }}>
              Join or create local forecast cooperatives to pool data and share earnings
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
          sx={{
            bgcolor: DARK.primary,
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
            px: 3,
            '&:hover': { bgcolor: '#2563EB' },
          }}
        >
          Create Cooperative
        </Button>
      </Box>

      {/* Overview Stats */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {[
          { label: 'Active Cooperatives', value: cooperatives.length, icon: GroupsIcon, color: DARK.purple },
          { label: 'Total Members', value: cooperatives.reduce((s, c) => s + c.members, 0), icon: PersonIcon, color: DARK.primary },
          { label: 'Combined Earnings', value: `${(cooperatives.reduce((s, c) => s + c.sharedEarnings, 0) / 1000).toFixed(1)}K WRF`, icon: MonetizationOnIcon, color: DARK.success },
          { label: 'Avg Quality', value: `${(cooperatives.reduce((s, c) => s + c.avgQuality, 0) / cooperatives.length).toFixed(1)}%`, icon: VerifiedIcon, color: DARK.warning },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Paper
              key={stat.label}
              sx={{ bgcolor: DARK.card, border: `1px solid ${DARK.border}`, borderRadius: 3, p: 2, flex: '1 1 180px', minWidth: 160 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Icon sx={{ color: stat.color, fontSize: 18 }} />
                <Typography variant="caption" sx={{ color: DARK.textSecondary }}>{stat.label}</Typography>
              </Box>
              <Typography variant="h6" sx={{ color: DARK.text, fontWeight: 700 }}>{stat.value}</Typography>
            </Paper>
          );
        })}
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel sx={{ color: DARK.textSecondary, '&.Mui-focused': { color: DARK.primary } }}>
            Region
          </InputLabel>
          <Select
            value={regionFilter}
            label="Region"
            onChange={(e) => setRegionFilter(e.target.value)}
            sx={{
              color: DARK.text,
              bgcolor: DARK.card,
              borderRadius: 2,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: DARK.border },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: DARK.primary },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: DARK.primary },
              '& .MuiSvgIcon-root': { color: DARK.textSecondary },
            }}
          >
            <MenuItem value="All">All Regions</MenuItem>
            {REGION_OPTIONS.map((r) => (
              <MenuItem key={r} value={r}>{r}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ flex: 1 }} />

        <TextField
          size="small"
          placeholder="Search cooperatives..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: DARK.textSecondary }} />
              </InputAdornment>
            ),
          }}
          sx={{
            width: 260,
            '& .MuiOutlinedInput-root': {
              bgcolor: DARK.card,
              color: DARK.text,
              borderRadius: 2,
              '& fieldset': { borderColor: DARK.border },
              '&:hover fieldset': { borderColor: DARK.primary },
              '&.Mui-focused fieldset': { borderColor: DARK.primary },
            },
            '& .MuiInputBase-input::placeholder': { color: DARK.textSecondary },
          }}
        />
      </Box>

      {/* Cooperatives Grid */}
      <Grid container spacing={3}>
        {filteredCoops.map((coop) => (
          <Grid item xs={12} md={6} key={coop.id}>
            <CooperativeCard coop={coop} onSelect={setSelectedCoop} />
          </Grid>
        ))}

        {filteredCoops.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ bgcolor: DARK.card, border: `1px solid ${DARK.border}`, borderRadius: 3, p: 6, textAlign: 'center' }}>
              <GroupsIcon sx={{ color: DARK.textSecondary, fontSize: 48, mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" sx={{ color: DARK.text, mb: 1 }}>
                No Cooperatives Found
              </Typography>
              <Typography variant="body2" sx={{ color: DARK.textSecondary, mb: 2 }}>
                No cooperatives match your search. Why not create one?
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialogOpen(true)}
                sx={{
                  bgcolor: DARK.primary,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2,
                  '&:hover': { bgcolor: '#2563EB' },
                }}
              >
                Create Cooperative
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Create Dialog */}
      <CreateCooperativeDialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} />
    </Box>
  );
};

export default function CooperativeHubGate(props) {
  return <DemoSurfaceGate testId="cooperative-hub" title="Cooperatives are not live" description="Cooperative membership, contributions and shared rewards are sample data."><CooperativeHub {...props} /></DemoSurfaceGate>;
}
