import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';
import FEATURES from '../../config/features';
import DemoSurfaceGate from '../common/DemoSurfaceGate';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Chip,
  Grid,
  Divider,
  Tooltip,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import StarIcon from '@mui/icons-material/Star';
import VerifiedIcon from '@mui/icons-material/Verified';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import BarChartIcon from '@mui/icons-material/BarChart';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import SensorsIcon from '@mui/icons-material/Sensors';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import ShareIcon from '@mui/icons-material/Share';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import GroupsIcon from '@mui/icons-material/Groups';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import DiamondIcon from '@mui/icons-material/Diamond';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import BoltIcon from '@mui/icons-material/Bolt';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import PublicIcon from '@mui/icons-material/Public';
import NightsStayIcon from '@mui/icons-material/NightsStay';

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
  cyan: '#06B6D4',
};

const REPUTATION_TIERS = {
  Diamond: { color: '#B9F2FF', icon: DiamondIcon, label: 'Diamond' },
  Platinum: { color: '#E5E4E2', icon: WorkspacePremiumIcon, label: 'Platinum' },
  Gold: { color: '#FFD700', icon: EmojiEventsIcon, label: 'Gold' },
  Silver: { color: '#C0C0C0', icon: MilitaryTechIcon, label: 'Silver' },
  Bronze: { color: '#CD7F32', icon: StarIcon, label: 'Bronze' },
};



// Generate heatmap data (365 days)
const generateHeatmapData = () => {
  const data = [];
  const today = new Date(2026, 1, 14); // Feb 14, 2026
  for (let i = 364; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    // More activity on recent days, some gaps for realism
    const isInactive = Math.random() < 0.05;
    const level = isInactive ? 0 : Math.floor(Math.random() * 4) + 1;
    data.push({
      date: date.toISOString().split('T')[0],
      level,
      count: level === 0 ? 0 : level * 350 + Math.floor(Math.random() * 200),
    });
  }
  return data;
};

// frontend#329: sample only. The default build renders the honest "not
// available" panel instead — no contributor-activity route is mounted, so
// there is nothing real to draw.
const HEATMAP_DATA = FEATURES.demoSurfaces ? generateHeatmapData() : [];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const ProfileHeader = ({ profile }) => {
  const tierConfig = REPUTATION_TIERS[profile.reputationTier] || REPUTATION_TIERS.Bronze;
  const TierIcon = tierConfig.icon;

  return (
    <Paper
      sx={{
        bgcolor: DARK.card,
        border: `1px solid ${DARK.border}`,
        borderRadius: 3,
        p: 3,
        mb: 3,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, flexWrap: 'wrap' }}>
        <Avatar
          sx={{
            width: 80,
            height: 80,
            bgcolor: profile.avatarColor,
            fontSize: '1.8rem',
            fontWeight: 700,
            border: `3px solid ${tierConfig.color}`,
            boxShadow: `0 0 24px ${tierConfig.color}33`,
          }}
        >
          {profile.avatar}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
            <Typography variant="h4" sx={{ color: DARK.text, fontWeight: 700 }}>
              {profile.name}
            </Typography>
            <Chip
              icon={<TierIcon sx={{ fontSize: 16, color: `${tierConfig.color} !important` }} />}
              label={tierConfig.label}
              size="small"
              sx={{
                bgcolor: `${tierConfig.color}22`,
                color: tierConfig.color,
                fontWeight: 700,
                height: 26,
                fontSize: '0.75rem',
              }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: DARK.textSecondary, mb: 1 }}>
            {profile.bio}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip
              icon={<CalendarTodayIcon sx={{ fontSize: 14, color: `${DARK.textSecondary} !important` }} />}
              label={`Member since ${profile.memberSince}`}
              size="small"
              sx={{ bgcolor: `${DARK.border}44`, color: DARK.textSecondary, height: 24, fontSize: '0.7rem' }}
            />
            <Chip
              icon={<PublicIcon sx={{ fontSize: 14, color: `${DARK.textSecondary} !important` }} />}
              label={profile.location}
              size="small"
              sx={{ bgcolor: `${DARK.border}44`, color: DARK.textSecondary, height: 24, fontSize: '0.7rem' }}
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Share Profile">
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
          <Tooltip title="Copy Address">
            <IconButton
              sx={{
                color: DARK.textSecondary,
                border: `1px solid ${DARK.border}`,
                borderRadius: 2,
                '&:hover': { color: DARK.primary, borderColor: DARK.primary },
              }}
            >
              <ContentCopyIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Paper>
  );
};

const StatsGrid = ({ profile }) => {
  const stats = [
    { label: 'Total Stations', value: profile.totalStations, icon: SensorsIcon, color: DARK.primary },
    { label: 'Total Readings', value: profile.totalReadings.toLocaleString(), icon: BarChartIcon, color: DARK.cyan },
    { label: 'Avg Quality', value: `${profile.avgQualityScore}%`, icon: VerifiedIcon, color: DARK.success },
    { label: 'WRF Earned', value: profile.totalWrfEarned.toLocaleString(), icon: MonetizationOnIcon, color: DARK.warning },
    { label: 'Global Rank', value: `#${profile.globalRank}`, icon: LeaderboardIcon, color: DARK.gold },
    { label: 'Streak', value: `${profile.consistencyStreak}d`, icon: WhatshotIcon, color: DARK.error },
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Grid item xs={6} sm={4} md={2} key={stat.label}>
            <Paper
              sx={{
                bgcolor: DARK.card,
                border: `1px solid ${DARK.border}`,
                borderRadius: 3,
                p: 2,
                textAlign: 'center',
                transition: 'all 0.2s',
                '&:hover': { borderColor: stat.color, transform: 'translateY(-2px)' },
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  bgcolor: `${stat.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 1,
                }}
              >
                <Icon sx={{ color: stat.color, fontSize: 20 }} />
              </Box>
              <Typography variant="h6" sx={{ color: DARK.text, fontWeight: 700, fontSize: '1.1rem' }}>
                {stat.value}
              </Typography>
              <Typography variant="caption" sx={{ color: DARK.textSecondary }}>
                {stat.label}
              </Typography>
            </Paper>
          </Grid>
        );
      })}
    </Grid>
  );
};

const AchievementBadge = ({ achievement }) => (
  <Tooltip
    title={
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{achievement.name}</Typography>
        <Typography variant="caption">{achievement.description}</Typography>
        {!achievement.earned && (
          <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic', color: '#F59E0B' }}>
            Not yet earned
          </Typography>
        )}
      </Box>
    }
    arrow
  >
    <Paper
      sx={{
        bgcolor: achievement.earned ? `${achievement.color}12` : `${DARK.border}22`,
        border: `1px solid ${achievement.earned ? `${achievement.color}44` : DARK.border}`,
        borderRadius: 3,
        p: 2,
        textAlign: 'center',
        opacity: achievement.earned ? 1 : 0.4,
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          opacity: 1,
          borderColor: achievement.color,
          transform: 'translateY(-2px)',
        },
      }}
    >
      {React.createElement(achievement.icon, {
        sx: { color: achievement.earned ? achievement.color : DARK.textSecondary, fontSize: 28, mb: 0.5 },
      })}
      <Typography variant="caption" sx={{ color: achievement.earned ? DARK.text : DARK.textSecondary, display: 'block', fontWeight: 600, fontSize: '0.65rem', lineHeight: 1.3 }}>
        {achievement.name}
      </Typography>
    </Paper>
  </Tooltip>
);

const ContributionHeatmap = () => {
  const CELL_SIZE = 12;
  const GAP = 2;
  const weeks = 53;
  const days = 7;

  const levelColors = [
    DARK.border + '44',
    `${DARK.success}33`,
    `${DARK.success}66`,
    `${DARK.success}99`,
    DARK.success,
  ];

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (!FEATURES.demoSurfaces) {
    return (
      <Paper
        data-testid="contribution-activity-not-live"
        sx={{ bgcolor: DARK.card, border: `1px solid ${DARK.border}`, borderRadius: 3, p: 3, mb: 3 }}
      >
        <Typography variant="subtitle1" sx={{ color: DARK.text, fontWeight: 600, mb: 0.5 }}>
          Contribution Activity
        </Typography>
        <Typography variant="body2" sx={{ color: DARK.textSecondary }}>
          Not available yet — the contributor activity history is not served by the testnet API, so no
          calendar is drawn in its place.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ bgcolor: DARK.card, border: `1px solid ${DARK.border}`, borderRadius: 3, p: 3, mb: 3, overflow: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        {/*
          HEATMAP_DATA is generated by Math.random() at module load, against a
          frozen fake "today" of 2026-02-14. The rest of this page is live (five
          API calls), which is exactly why this panel needs saying out loud:
          a live page lends its credibility to the one invented panel on it.

          Labelled rather than gated, because gating would hide the genuinely
          live profile around it. Remove the label with the data (frontend#214).
        */}
        <Typography variant="subtitle1" sx={{ color: DARK.text, fontWeight: 600 }}>
          Contribution Activity
          <Typography
            component="span"
            variant="caption"
            sx={{ ml: 1, px: 1, py: 0.25, borderRadius: 1, bgcolor: '#78350F', color: '#FDE68A', fontWeight: 700 }}
          >
            SAMPLE DATA
          </Typography>
        </Typography>
        <Typography variant="caption" sx={{ color: DARK.textSecondary }}>
          {HEATMAP_DATA.filter((d) => d.level > 0).length} active days &mdash; illustrative, not this contributor&apos;s record
        </Typography>
      </Box>

      <Box sx={{ overflowX: 'auto' }}>
        <svg width={weeks * (CELL_SIZE + GAP) + 40} height={days * (CELL_SIZE + GAP) + 30}>
          {/* Month labels */}
          {Array.from({ length: 12 }, (_, monthIdx) => {
            const weekOffset = Math.floor((monthIdx / 12) * weeks);
            return (
              <text
                key={monthIdx}
                x={weekOffset * (CELL_SIZE + GAP) + 30}
                y={10}
                fill={DARK.textSecondary}
                fontSize="9"
                fontFamily="sans-serif"
              >
                {monthLabels[monthIdx]}
              </text>
            );
          })}

          {/* Day labels */}
          {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((day, idx) => (
            <text
              key={idx}
              x={0}
              y={idx * (CELL_SIZE + GAP) + 26}
              fill={DARK.textSecondary}
              fontSize="9"
              fontFamily="sans-serif"
              dominantBaseline="middle"
            >
              {day}
            </text>
          ))}

          {/* Cells */}
          {HEATMAP_DATA.map((day, idx) => {
            const week = Math.floor(idx / 7);
            const dayOfWeek = idx % 7;

            return (
              <Tooltip key={day.date} title={`${day.date}: ${day.count.toLocaleString()} readings`}>
                <rect
                  x={week * (CELL_SIZE + GAP) + 30}
                  y={dayOfWeek * (CELL_SIZE + GAP) + 16}
                  width={CELL_SIZE}
                  height={CELL_SIZE}
                  rx={2}
                  fill={levelColors[day.level]}
                  style={{ cursor: 'pointer' }}
                />
              </Tooltip>
            );
          })}
        </svg>
      </Box>

      {/* Legend */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, mt: 1 }}>
        <Typography variant="caption" sx={{ color: DARK.textSecondary, mr: 0.5 }}>Less</Typography>
        {levelColors.map((color, idx) => (
          <Box
            key={idx}
            sx={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              borderRadius: 0.5,
              bgcolor: color,
            }}
          />
        ))}
        <Typography variant="caption" sx={{ color: DARK.textSecondary, ml: 0.5 }}>More</Typography>
      </Box>
    </Paper>
  );
};

const StationMiniCard = ({ station }) => (
  <Paper
    sx={{
      bgcolor: DARK.cardHover,
      border: `1px solid ${DARK.border}`,
      borderRadius: 2,
      p: 2,
      cursor: 'pointer',
      transition: 'all 0.2s',
      '&:hover': { borderColor: DARK.primary },
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
      <Typography variant="body2" sx={{ color: DARK.text, fontWeight: 600 }}>
        {station.name}
      </Typography>
      <Chip
        label={station.status}
        size="small"
        sx={{
          height: 20,
          fontSize: '0.65rem',
          fontWeight: 600,
          bgcolor: station.status === 'online' ? `${DARK.success}22` : `${DARK.error}22`,
          color: station.status === 'online' ? DARK.success : DARK.error,
        }}
      />
    </Box>
    <Typography variant="caption" sx={{ color: DARK.textSecondary, display: 'block', mb: 1 }}>
      {station.location}
    </Typography>
    <Box sx={{ display: 'flex', gap: 2 }}>
      <Box>
        <Typography variant="caption" sx={{ color: DARK.textSecondary }}>Quality</Typography>
        <Typography variant="body2" sx={{ color: DARK.success, fontWeight: 700, fontSize: '0.85rem' }}>
          {station.quality}%
        </Typography>
      </Box>
      <Box>
        <Typography variant="caption" sx={{ color: DARK.textSecondary }}>Readings</Typography>
        <Typography variant="body2" sx={{ color: DARK.text, fontWeight: 600, fontSize: '0.85rem' }}>
          {station.readings.toLocaleString()}
        </Typography>
      </Box>
    </Box>
  </Paper>
);

const activityTypeConfig = {
  data: { icon: CloudUploadIcon, color: DARK.primary },
  achievement: { icon: EmojiEventsIcon, color: DARK.gold },
  earnings: { icon: MonetizationOnIcon, color: DARK.success },
  social: { icon: GroupsIcon, color: DARK.purple },
  station: { icon: SensorsIcon, color: DARK.warning },
  quality: { icon: VerifiedIcon, color: DARK.cyan },
  streak: { icon: WhatshotIcon, color: DARK.error },
  rank: { icon: LeaderboardIcon, color: DARK.pink },
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const ContributorProfile = ({ userId }) => {
  const { address: paramAddress } = useParams();
  const [profile, setProfile] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [stations, setStations] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activityPage, setActivityPage] = useState(1);

  const id = userId ?? paramAddress ?? 'me';

  useEffect(() => {
    Promise.all([
      apiClient.get(`/leaderboard/profile/${id}`),
      apiClient.get(`/leaderboard/profile/${id}/achievements`),
      apiClient.get(`/leaderboard/profile/${id}/stations`),
      apiClient.get(`/leaderboard/profile/${id}/activity`),
    ]).then(([p, a, s, act]) => {
      setProfile(p.profile ?? p);
      setAchievements(Array.isArray(a) ? a : (a.achievements ?? []));
      setStations(Array.isArray(s) ? s : (s.stations ?? []));
      setActivity(Array.isArray(act) ? act : (act.activity ?? []));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const visibleActivities = activity.slice(0, activityPage * 10);
  const hasMoreActivities = visibleActivities.length < activity.length;

  if (loading || !profile) return null;

  return (
    <Box sx={{ bgcolor: DARK.bg, minHeight: '100vh', p: 3 }}>
      {/* Profile Header */}
      <ProfileHeader profile={profile} />

      {/* Stats Grid */}
      <StatsGrid profile={profile} />

      {/* Achievement Badges */}
      <Paper sx={{ bgcolor: DARK.card, border: `1px solid ${DARK.border}`, borderRadius: 3, p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <EmojiEventsIcon sx={{ color: DARK.gold, fontSize: 22 }} />
          <Typography variant="subtitle1" sx={{ color: DARK.text, fontWeight: 600 }}>
            Achievements
          </Typography>
          <Chip
            label={`${achievements.filter((a) => a.earned).length}/${achievements.length}`}
            size="small"
            sx={{ bgcolor: `${DARK.success}22`, color: DARK.success, height: 22, fontSize: '0.7rem', fontWeight: 600 }}
          />
        </Box>
        <Grid container spacing={1.5}>
          {achievements.map((achievement) => (
            <Grid item xs={4} sm={3} md={2} key={achievement.id}>
              <AchievementBadge achievement={achievement} />
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Contribution Heatmap */}
      <ContributionHeatmap />

      <Grid container spacing={3}>
        {/* Station List */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ bgcolor: DARK.card, border: `1px solid ${DARK.border}`, borderRadius: 3, p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <SensorsIcon sx={{ color: DARK.primary, fontSize: 22 }} />
              <Typography variant="subtitle1" sx={{ color: DARK.text, fontWeight: 600 }}>
                Stations
              </Typography>
              <Chip
                label={stations.length}
                size="small"
                sx={{ bgcolor: `${DARK.primary}22`, color: DARK.primary, height: 22, fontSize: '0.7rem', fontWeight: 600 }}
              />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {stations.map((station) => (
                <StationMiniCard key={station.id} station={station} />
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Recent Activity Feed */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ bgcolor: DARK.card, border: `1px solid ${DARK.border}`, borderRadius: 3, p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <BarChartIcon sx={{ color: DARK.cyan, fontSize: 22 }} />
              <Typography variant="subtitle1" sx={{ color: DARK.text, fontWeight: 600 }}>
                Recent Activity
              </Typography>
            </Box>
            <List disablePadding>
              {visibleActivities.map((activity, idx) => {
                const config = activityTypeConfig[activity.type] || activityTypeConfig.data;
                const Icon = config.icon;
                return (
                  <React.Fragment key={activity.id}>
                    <ListItem
                      disablePadding
                      sx={{ py: 1.5, px: 1, borderRadius: 1, '&:hover': { bgcolor: DARK.cardHover } }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Box
                          sx={{
                            width: 30,
                            height: 30,
                            borderRadius: '50%',
                            bgcolor: `${config.color}15`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Icon sx={{ color: config.color, fontSize: 16 }} />
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ color: DARK.text, fontSize: '0.8rem', lineHeight: 1.4 }}>
                            {activity.action}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" sx={{ color: DARK.textSecondary }}>
                            {activity.time}
                          </Typography>
                        }
                      />
                    </ListItem>
                    {idx < visibleActivities.length - 1 && (
                      <Divider sx={{ borderColor: `${DARK.border}66` }} />
                    )}
                  </React.Fragment>
                );
              })}
            </List>
            {hasMoreActivities && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button
                  onClick={() => setActivityPage((p) => p + 1)}
                  sx={{
                    color: DARK.primary,
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': { bgcolor: `${DARK.primary}11` },
                  }}
                >
                  Show More
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

// The ungated page, for unit tests of its own behaviour.
export { ContributorProfile };

// frontend#415: the backend has no /api/leaderboard/profile/:id routes (nothing
// mounts /api/leaderboard), so every request failed and the page rendered
// nothing. The default build shows the honest not-live state instead and never
// mounts the component, so it never requests those routes.
export default function ContributorProfileGate(props) {
  return (
    <DemoSurfaceGate
      testId="contributor-profile"
      title="Contributor profiles are not live"
      description="The backend has no contributor profile, achievements, stations or activity routes yet."
    >
      <ContributorProfile {...props} />
    </DemoSurfaceGate>
  );
}
