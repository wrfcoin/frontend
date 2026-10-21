/**
 * Achievement Badges Component
 * Display user achievements and progress
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
  Tooltip,
  Tabs,
  Tab,
  Avatar,
  Divider,
  IconButton,
} from '@mui/material';
import {
  EmojiEvents,
  Lock,
  Star,
  TrendingUp,
  Share,
  Close,
  Grade,
  Whatshot,
  Timeline,
} from '@mui/icons-material';

const AchievementsBadges = ({ userAddress }) => {
  const [profile, setProfile] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userAddress) {
      fetchUserProfile();
      fetchAchievements();
    }
  }, [userAddress]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`/api/gamification/profile/${userAddress}`);
      const data = await response.json();
      if (data.success) {
        setProfile(data.data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchAchievements = async () => {
    try {
      const response = await fetch(`/api/gamification/progress/${userAddress}`);
      const data = await response.json();
      if (data.success) {
        setAchievements(data.data.achievements);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      setLoading(false);
    }
  };

  const getRarityColor = rarity => {
    switch (rarity) {
    case 'common':
      return '#8e8e93';
    case 'uncommon':
      return '#34c759';
    case 'rare':
      return '#007aff';
    case 'epic':
      return '#af52de';
    case 'legendary':
      return '#ff9500';
    default:
      return '#8e8e93';
    }
  };

  const getRarityGradient = rarity => {
    switch (rarity) {
    case 'common':
      return 'linear-gradient(45deg, #8e8e93, #aeaeb2)';
    case 'uncommon':
      return 'linear-gradient(45deg, #34c759, #30d158)';
    case 'rare':
      return 'linear-gradient(45deg, #007aff, #5ac8fa)';
    case 'epic':
      return 'linear-gradient(45deg, #af52de, #bf5af2)';
    case 'legendary':
      return 'linear-gradient(45deg, #ff9500, #ffcc02)';
    default:
      return 'linear-gradient(45deg, #8e8e93, #aeaeb2)';
    }
  };

  const formatProgress = progress => {
    if (progress.target === 1) return progress.percentage;
    return `${progress.current}/${progress.target} (${progress.percentage.toFixed(1)}%)`;
  };

  const filterAchievements = category => {
    if (selectedTab === 0) return achievements; // All
    const categories = [
      'voting',
      'proposals',
      'delegation',
      'participation',
      'special',
    ];
    return achievements.filter(a => a.category === categories[selectedTab - 1]);
  };

  const handleAchievementClick = achievement => {
    setSelectedAchievement(achievement);
    setDetailsOpen(true);
  };

  const shareAchievement = achievement => {
    if (navigator.share) {
      navigator.share({
        title: `🏆 Achievement Unlocked: ${achievement.name}`,
        text: achievement.description,
        url: window.location.href,
      });
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="300px"
      >
        <Typography>Loading achievements...</Typography>
      </Box>
    );
  }

  const filteredAchievements = filterAchievements();
  const unlockedAchievements = filteredAchievements.filter(a => a.unlocked);
  const lockedAchievements = filteredAchievements.filter(a => !a.unlocked);

  return (
    <Box>
      {/* User Level and Stats */}
      {profile && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    background: getRarityGradient(
                      profile.level.current.level >= 5 ? 'legendary' : 'rare',
                    ),
                    fontSize: '2rem',
                  }}
                >
                  {profile.level.current.level}
                </Avatar>
              </Grid>
              <Grid item xs>
                <Typography variant="h5" gutterBottom>
                  {profile.level.current.name}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Level {profile.level.current.level} •{' '}
                  {profile.statistics.totalPoints} Points
                </Typography>

                {profile.level.next && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      Progress to {profile.level.next.name}:{' '}
                      {profile.level.progress}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={parseFloat(profile.level.progress)}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                )}
              </Grid>
              <Grid item>
                <Box textAlign="center">
                  <Typography variant="h6">
                    {profile.achievements.total}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Achievements
                  </Typography>
                </Box>
              </Grid>
              <Grid item>
                <Box textAlign="center">
                  <Typography variant="h6">
                    {profile.streaks.activity}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Day Streak
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Category Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={selectedTab}
          onChange={(e, newValue) => setSelectedTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All" icon={<EmojiEvents />} />
          <Tab label="Voting" icon={<Grade />} />
          <Tab label="Proposals" icon={<Timeline />} />
          <Tab label="Delegation" icon={<Share />} />
          <Tab label="Participation" icon={<Whatshot />} />
          <Tab label="Special" icon={<Star />} />
        </Tabs>
      </Box>

      {/* Achievements Grid */}
      <Grid container spacing={3}>
        {/* Unlocked Achievements */}
        {unlockedAchievements.length > 0 && (
          <Grid item xs={12}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <EmojiEvents sx={{ mr: 1 }} />
              Unlocked ({unlockedAchievements.length})
            </Typography>
            <Grid container spacing={2}>
              {unlockedAchievements.map(achievement => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={achievement.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      background: getRarityGradient(achievement.rarity),
                      color: 'white',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        transition: 'transform 0.2s',
                      },
                    }}
                    onClick={() => handleAchievementClick(achievement)}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h3" sx={{ mb: 1 }}>
                        {achievement.icon}
                      </Typography>
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        gutterBottom
                      >
                        {achievement.name}
                      </Typography>
                      <Chip
                        label={achievement.rarity}
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          color: 'white',
                          mb: 1,
                        }}
                      />
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        +{achievement.points} Points
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        )}

        {/* Locked Achievements */}
        {lockedAchievements.length > 0 && (
          <Grid item xs={12}>
            <Divider sx={{ my: 3 }} />
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <Lock sx={{ mr: 1 }} />
              In Progress ({lockedAchievements.length})
            </Typography>
            <Grid container spacing={2}>
              {lockedAchievements.map(achievement => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={achievement.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      opacity: 0.7,
                      '&:hover': {
                        opacity: 1,
                        transform: 'scale(1.02)',
                        transition: 'all 0.2s',
                      },
                    }}
                    onClick={() => handleAchievementClick(achievement)}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <Box
                        sx={{
                          position: 'relative',
                          display: 'inline-block',
                          mb: 1,
                        }}
                      >
                        <Typography
                          variant="h3"
                          sx={{ filter: 'grayscale(100%)' }}
                        >
                          {achievement.icon}
                        </Typography>
                        <Lock
                          sx={{
                            position: 'absolute',
                            top: 0,
                            right: -8,
                            fontSize: '1rem',
                            color: 'text.secondary',
                          }}
                        />
                      </Box>
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        gutterBottom
                      >
                        {achievement.name}
                      </Typography>
                      <Chip
                        label={achievement.rarity}
                        size="small"
                        sx={{ mb: 1 }}
                        style={{
                          backgroundColor: getRarityColor(achievement.rarity),
                          color: 'white',
                        }}
                      />
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        gutterBottom
                      >
                        {formatProgress(achievement.progress)}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={achievement.progress.percentage}
                        sx={{ height: 4, borderRadius: 2 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        )}
      </Grid>

      {/* Achievement Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedAchievement && (
          <>
            <DialogTitle
              sx={{
                background: getRarityGradient(selectedAchievement.rarity),
                color: 'white',
                textAlign: 'center',
              }}
            >
              <IconButton
                sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}
                onClick={() => setDetailsOpen(false)}
              >
                <Close />
              </IconButton>
              <Typography variant="h4" sx={{ mb: 1 }}>
                {selectedAchievement.icon}
              </Typography>
              <Typography variant="h6">{selectedAchievement.name}</Typography>
              <Chip
                label={selectedAchievement.rarity}
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  mt: 1,
                }}
              />
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <Typography variant="body1" paragraph>
                {selectedAchievement.description}
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Reward: {selectedAchievement.points} Points
                </Typography>
                <Typography variant="subtitle2" gutterBottom>
                  Category: {selectedAchievement.category}
                </Typography>
              </Box>

              {!selectedAchievement.unlocked && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Progress: {formatProgress(selectedAchievement.progress)}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={selectedAchievement.progress.percentage}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              {selectedAchievement.unlocked && (
                <Button
                  startIcon={<Share />}
                  onClick={() => shareAchievement(selectedAchievement)}
                >
                  Share
                </Button>
              )}
              <Button onClick={() => setDetailsOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default AchievementsBadges;
