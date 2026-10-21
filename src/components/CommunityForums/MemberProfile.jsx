import React, { useState, useEffect } from 'react';
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
  IconButton,
  LinearProgress,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SensorsIcon from '@mui/icons-material/Sensors';
import StarIcon from '@mui/icons-material/Star';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import VerifiedIcon from '@mui/icons-material/Verified';
import DataUsageIcon from '@mui/icons-material/DataUsage';
import LinkIcon from '@mui/icons-material/Link';
import BuildIcon from '@mui/icons-material/Build';
import InsightsIcon from '@mui/icons-material/Insights';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
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
  orange: '#F97316',
};

const BADGE_ICONS = {
  diamond: <EmojiEventsIcon sx={{ fontSize: 20 }} />,
  streak: <TrendingUpIcon sx={{ fontSize: 20 }} />,
  quality: <VerifiedIcon sx={{ fontSize: 20 }} />,
  helper: <ThumbUpIcon sx={{ fontSize: 20 }} />,
  multi: <SensorsIcon sx={{ fontSize: 20 }} />,
  early: <StarIcon sx={{ fontSize: 20 }} />,
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const ProfileHeader = ({ profile, isFollowing, onToggleFollow }) => (
  <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 2, p: 3, mb: 2 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
      <Box sx={{ display: 'flex', gap: 2.5 }}>
        <Avatar
          sx={{
            bgcolor: profile.avatarColor,
            width: 80,
            height: 80,
            fontSize: '1.8rem',
            fontWeight: 700,
          }}
        >
          {profile.avatar}
        </Avatar>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="h5" sx={{ color: COLORS.text, fontWeight: 700 }}>
              {profile.displayName}
            </Typography>
            <Chip
              icon={<EmojiEventsIcon sx={{ fontSize: 14 }} />}
              label={profile.reputationTier}
              size="small"
              sx={{ bgcolor: '#A78BFA22', color: '#A78BFA', '& .MuiChip-icon': { color: '#A78BFA' } }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: COLORS.primary, fontWeight: 500, mb: 0.5 }}>
            {profile.wrfName}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <StarIcon sx={{ fontSize: 14, color: COLORS.warning }} />
              <Typography variant="body2" sx={{ color: COLORS.warning, fontWeight: 600 }}>
                {profile.reputationScore.toLocaleString()} reputation
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CalendarTodayIcon sx={{ fontSize: 13, color: COLORS.textSecondary }} />
              <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                Joined {profile.joinDate}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <LocationOnIcon sx={{ fontSize: 13, color: COLORS.textSecondary }} />
              <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                {profile.location}
              </Typography>
            </Box>
          </Box>
          {profile.bio && (
            <Typography variant="body2" sx={{ color: COLORS.textSecondary, mt: 1, lineHeight: 1.6, maxWidth: 500 }}>
              {profile.bio}
            </Typography>
          )}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant="outlined"
          startIcon={<MailOutlineIcon />}
          sx={{
            color: COLORS.textSecondary,
            borderColor: COLORS.border,
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': { borderColor: COLORS.primary, color: COLORS.primary },
          }}
        >
          Send Message
        </Button>
        <Button
          variant={isFollowing ? 'outlined' : 'contained'}
          startIcon={isFollowing ? <PersonRemoveIcon /> : <PersonAddIcon />}
          onClick={onToggleFollow}
          sx={{
            bgcolor: isFollowing ? 'transparent' : COLORS.primary,
            color: isFollowing ? COLORS.textSecondary : COLORS.text,
            borderColor: isFollowing ? COLORS.border : COLORS.primary,
            textTransform: 'none',
            fontWeight: 600,
            border: isFollowing ? `1px solid ${COLORS.border}` : undefined,
            '&:hover': isFollowing
              ? { borderColor: COLORS.error, color: COLORS.error }
              : { bgcolor: '#2563EB' },
          }}
        >
          {isFollowing ? 'Unfollow' : 'Follow'}
        </Button>
      </Box>
    </Box>
  </Paper>
);

const ContributionStats = ({ stats }) => {
  const statItems = [
    { label: 'Stations Owned', value: stats.stationsOwned, icon: <SensorsIcon sx={{ fontSize: 20 }} />, color: COLORS.primary },
    { label: 'Data Points', value: stats.dataPointsSubmitted.toLocaleString(), icon: <DataUsageIcon sx={{ fontSize: 20 }} />, color: COLORS.success },
    { label: 'Quality Average', value: `${stats.qualityAverage}%`, icon: <VerifiedIcon sx={{ fontSize: 20 }} />, color: stats.qualityAverage >= 90 ? COLORS.success : COLORS.warning },
    { label: 'Total WRF Earned', value: stats.totalWrfEarned.toLocaleString(), icon: <MonetizationOnIcon sx={{ fontSize: 20 }} />, color: COLORS.warning },
    { label: 'Posts Written', value: stats.postsWritten, icon: <ChatBubbleOutlineIcon sx={{ fontSize: 20 }} />, color: COLORS.purple },
    { label: 'Helpful Votes', value: stats.helpfulVotes.toLocaleString(), icon: <ThumbUpIcon sx={{ fontSize: 20 }} />, color: COLORS.pink },
    { label: 'Replies Given', value: stats.repliesGiven, icon: <ChatBubbleOutlineIcon sx={{ fontSize: 20 }} />, color: COLORS.cyan },
    { label: 'Day Streak', value: `${stats.consecutiveDays} days`, icon: <TrendingUpIcon sx={{ fontSize: 20 }} />, color: COLORS.orange },
  ];

  return (
    <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 2, p: 2.5, mb: 2 }}>
      <Typography variant="subtitle1" sx={{ color: COLORS.text, fontWeight: 600, mb: 2 }}>
        Contribution Stats
      </Typography>
      <Grid container spacing={1.5}>
        {statItems.map((item) => (
          <Grid item xs={6} sm={3} key={item.label}>
            <Paper sx={{ bgcolor: COLORS.bg, borderRadius: 1.5, p: 1.5, textAlign: 'center' }}>
              <Box sx={{ color: item.color, mb: 0.5, display: 'flex', justifyContent: 'center' }}>
                {item.icon}
              </Box>
              <Typography variant="h6" sx={{ color: COLORS.text, fontWeight: 700, fontSize: '1.1rem' }}>
                {item.value}
              </Typography>
              <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                {item.label}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

const BadgesSection = ({ badges }) => (
  <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 2, p: 2.5, mb: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
      <EmojiEventsIcon sx={{ color: COLORS.warning }} />
      <Typography variant="subtitle1" sx={{ color: COLORS.text, fontWeight: 600 }}>
        Badges Earned
      </Typography>
      <Chip label={badges.length} size="small" sx={{ bgcolor: `${COLORS.warning}22`, color: COLORS.warning, height: 20, fontSize: '0.7rem' }} />
    </Box>
    <Grid container spacing={1.5}>
      {badges.map((badge) => (
        <Grid item xs={12} sm={6} key={badge.id}>
          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              alignItems: 'center',
              bgcolor: COLORS.bg,
              borderRadius: 1.5,
              p: 1.5,
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <Avatar sx={{ bgcolor: `${badge.color}22`, color: badge.color, width: 40, height: 40 }}>
              {BADGE_ICONS[badge.icon] || <StarIcon sx={{ fontSize: 20 }} />}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ color: COLORS.text, fontWeight: 600 }}>
                {badge.name}
              </Typography>
              <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                {badge.description}
              </Typography>
              <Typography variant="caption" sx={{ color: COLORS.textSecondary, display: 'block' }}>
                Earned {badge.date}
              </Typography>
            </Box>
          </Box>
        </Grid>
      ))}
    </Grid>
  </Paper>
);

const StationList = ({ stations }) => (
  <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 2, p: 2.5, mb: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
      <SensorsIcon sx={{ color: COLORS.primary }} />
      <Typography variant="subtitle1" sx={{ color: COLORS.text, fontWeight: 600 }}>
        Weather Stations
      </Typography>
    </Box>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {stations.map((station) => (
        <Box
          key={station.id}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: COLORS.bg,
            borderRadius: 1.5,
            p: 1.5,
            cursor: 'pointer',
            '&:hover': { bgcolor: COLORS.cardHover },
            transition: 'all 0.15s',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: station.status === 'online' ? COLORS.success : COLORS.warning,
              }}
            />
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ color: COLORS.text, fontWeight: 600 }}>
                  {station.name}
                </Typography>
                <LinkIcon sx={{ fontSize: 14, color: COLORS.primary }} />
              </Box>
              <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                {station.type}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography
              variant="body2"
              sx={{ color: station.quality >= 93 ? COLORS.success : COLORS.warning, fontWeight: 600 }}
            >
              {station.quality}%
            </Typography>
            <Chip
              label={station.status}
              size="small"
              sx={{
                bgcolor: station.status === 'online' ? `${COLORS.success}22` : `${COLORS.warning}22`,
                color: station.status === 'online' ? COLORS.success : COLORS.warning,
                height: 18,
                fontSize: '0.6rem',
              }}
            />
          </Box>
        </Box>
      ))}
    </Box>
  </Paper>
);

const ActivityFeed = ({ activities }) => (
  <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 2, p: 2.5, mb: 2 }}>
    <Typography variant="subtitle1" sx={{ color: COLORS.text, fontWeight: 600, mb: 2 }}>
      Recent Activity
    </Typography>
    <List disablePadding>
      {activities.map((activity, idx) => (
        <React.Fragment key={activity.id}>
          <ListItem
            disablePadding
            sx={{ py: 1.5, cursor: 'pointer', '&:hover': { bgcolor: COLORS.cardHover }, borderRadius: 1, px: 1 }}
          >
            <Box sx={{ width: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Chip
                  label={activity.type === 'post' ? 'Post' : activity.type === 'reply' ? 'Reply' : 'Reaction'}
                  size="small"
                  sx={{
                    bgcolor:
                      activity.type === 'post'
                        ? `${COLORS.primary}22`
                        : activity.type === 'reply'
                          ? `${COLORS.success}22`
                          : `${COLORS.pink}22`,
                    color:
                      activity.type === 'post'
                        ? COLORS.primary
                        : activity.type === 'reply'
                          ? COLORS.success
                          : COLORS.pink,
                    height: 20,
                    fontSize: '0.65rem',
                  }}
                />
                <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                  {activity.timestamp}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: COLORS.text, fontWeight: 500 }}>
                {activity.title}
              </Typography>
              {activity.context && (
                <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                  in {activity.context}
                </Typography>
              )}
              {(activity.reactions || activity.replies) && (
                <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                  {activity.reactions != null && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <ThumbUpIcon sx={{ fontSize: 12, color: COLORS.textSecondary }} />
                      <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                        {activity.reactions}
                      </Typography>
                    </Box>
                  )}
                  {activity.replies != null && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <ChatBubbleOutlineIcon sx={{ fontSize: 12, color: COLORS.textSecondary }} />
                      <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                        {activity.replies}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </ListItem>
          {idx < activities.length - 1 && <Divider sx={{ borderColor: COLORS.border }} />}
        </React.Fragment>
      ))}
    </List>
  </Paper>
);

const EndorsementSection = ({ endorsements }) => (
  <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 2, p: 2.5 }}>
    <Typography variant="subtitle1" sx={{ color: COLORS.text, fontWeight: 600, mb: 2 }}>
      Skill Endorsements
    </Typography>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {endorsements.map((endorsement) => {
        const skillIcons = {
          'Hardware Setup': <BuildIcon sx={{ fontSize: 18, color: COLORS.warning }} />,
          'Data Analysis': <InsightsIcon sx={{ fontSize: 18, color: COLORS.primary }} />,
          'Forecasting': <WbSunnyIcon sx={{ fontSize: 18, color: COLORS.orange }} />,
        };

        return (
          <Box key={endorsement.skill}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {skillIcons[endorsement.skill] || <StarIcon sx={{ fontSize: 18, color: COLORS.textSecondary }} />}
                <Typography variant="body2" sx={{ color: COLORS.text, fontWeight: 600 }}>
                  {endorsement.skill}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: COLORS.primary, fontWeight: 600 }}>
                {endorsement.count} endorsements
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min((endorsement.count / 50) * 100, 100)}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: COLORS.bg,
                mb: 0.5,
                '& .MuiLinearProgress-bar': { bgcolor: COLORS.primary, borderRadius: 3 },
              }}
            />
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                Endorsed by
              </Typography>
              {endorsement.endorsers.map((name) => (
                <Chip
                  key={name}
                  label={name}
                  size="small"
                  sx={{ bgcolor: `${COLORS.primary}15`, color: COLORS.textSecondary, height: 18, fontSize: '0.6rem' }}
                />
              ))}
            </Box>
          </Box>
        );
      })}
    </Box>
  </Paper>
);

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const MemberProfile = () => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    apiClient.get('/community/members/profile')
      .then((data) => setProfile(data))
      .catch(() => setProfile(null));
  }, []);

  if (!profile) return <Box sx={{ bgcolor: COLORS.bg, minHeight: '100vh', p: 3 }}><Typography sx={{ color: COLORS.textSecondary }}>Loading...</Typography></Box>;

  return (
    <Box sx={{ bgcolor: COLORS.bg, minHeight: '100vh', p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <PersonIcon sx={{ color: COLORS.primary, fontSize: 32 }} />
        <Typography variant="h4" sx={{ color: COLORS.text, fontWeight: 700 }}>
          Member Profile
        </Typography>
      </Box>

      {/* Profile Header */}
      <ProfileHeader
        profile={profile}
        isFollowing={isFollowing}
        onToggleFollow={() => setIsFollowing((prev) => !prev)}
      />

      {/* Contribution Stats */}
      <ContributionStats stats={profile.stats} />

      <Grid container spacing={2}>
        {/* Left Column */}
        <Grid item xs={12} md={7}>
          {/* Activity Feed */}
          <ActivityFeed activities={profile.activityFeed} />
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={5}>
          {/* Badges */}
          <BadgesSection badges={profile.badges} />

          {/* Stations */}
          <StationList stations={profile.stations} />

          {/* Endorsements */}
          <EndorsementSection endorsements={profile.endorsements} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default MemberProfile;
