import DemoSurfaceGate from '../common/DemoSurfaceGate';
/**
 * Gamification Dashboard - Main component integrating all gamification features
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Tab,
  Tabs,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  LinearProgress,
  Button,
  Alert,
} from '@mui/material';
import {
  EmojiEvents,
  Leaderboard,
  TrendingUp,
  Star,
  Whatshot,
} from '@mui/icons-material';
import AchievementsBadges from './AchievementsBadges';
import LeaderboardDashboard from './LeaderboardDashboard';
import AchievementBadgeSystem from '../Achievements/AchievementBadgeSystem';
import { WeatherStreakBadge } from '../nft/WeatherStreakNFT';
import { ProofOfMemeDashboard } from '../social/ProofOfMemeDashboard';

const GamificationDashboardSample = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const [recentAchievements, setRecentAchievements] = useState([]);
  const userAddress = '0x1234567890123456789012345678901234567890'; // Demo address

  useEffect(() => {
    fetchUserProfile();
    fetchRecentAchievements();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`/api/gamification/profile/${userAddress}`);
      const data = await response.json();
      if (data.success) {
        setUserProfile(data.data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchRecentAchievements = async () => {
    try {
      const response = await fetch(
        '/api/gamification/recent-achievements?limit=5',
      );
      const data = await response.json();
      if (data.success) {
        setRecentAchievements(data.data);
      }
    } catch (error) {
      console.error('Error fetching recent achievements:', error);
    }
  };

  const simulateVote = async () => {
    try {
      const response = await fetch('/api/gamification/activity/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress,
          proposalId: `prop_${Date.now()}`,
          votingPower: '1,250 WRF',
        }),
      });

      if (response.ok) {
        fetchUserProfile();
      }
    } catch (error) {
      console.error('Error recording vote:', error);
    }
  };

  const simulateProposal = async () => {
    try {
      const response = await fetch('/api/gamification/activity/proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress,
          proposalId: `user_prop_${Date.now()}`,
        }),
      });

      if (response.ok) {
        fetchUserProfile();
      }
    } catch (error) {
      console.error('Error recording proposal:', error);
    }
  };

  const tabs = [
    { label: 'Overview', icon: <TrendingUp /> },
    { label: 'Achievements', icon: <EmojiEvents /> },
    { label: 'Badge System', icon: <Star /> },
    { label: 'Leaderboard', icon: <Leaderboard /> },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Governance Gamification
      </Typography>

      <Tabs
        value={selectedTab}
        onChange={(e, newValue) => setSelectedTab(newValue)}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
      >
        {tabs.map((tab, index) => (
          <Tab
            key={index}
            label={tab.label}
            icon={tab.icon}
            iconPosition="start"
          />
        ))}
      </Tabs>

      {selectedTab === 0 && (
        <Box>
          {/* User Profile Overview */}
          {userProfile && userProfile.level && userProfile.level.current && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={3} alignItems="center">
                  <Grid item>
                    <Avatar
                      sx={{
                        width: 80,
                        height: 80,
                        background:
                          userProfile.level.current.level >= 5
                            ? 'linear-gradient(45deg, #ff9500, #ffcc02)'
                            : 'linear-gradient(45deg, #007aff, #5ac8fa)',
                        fontSize: '2rem',
                        fontWeight: 'bold',
                      }}
                    >
                      {userProfile.level.current.level}
                    </Avatar>
                  </Grid>
                  <Grid item xs>
                    <Typography variant="h5" gutterBottom>
                      {userProfile.level.current.name}
                    </Typography>
                    <Typography
                      variant="body1"
                      color="textSecondary"
                      gutterBottom
                    >
                      Level {userProfile.level.current.level} •{' '}
                      {userProfile.statistics.totalPoints} Points
                    </Typography>

                    {userProfile.level.next && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" gutterBottom>
                          Progress to {userProfile.level.next.name}:{' '}
                          {userProfile.level.progress}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={parseFloat(userProfile.level.progress)}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    )}
                  </Grid>
                  <Grid item>
                    <Grid container spacing={2} textAlign="center">
                      <Grid item>
                        <Typography variant="h6">
                          {userProfile.achievements.total}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Achievements
                        </Typography>
                      </Grid>
                      <Grid item>
                        <Typography variant="h6">
                          {userProfile.streaks.activity}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Day Streak
                        </Typography>
                      </Grid>
                      <Grid item>
                        <Typography variant="h6">
                          {userProfile.statistics.participationScore.toFixed(1)}
                          %
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Participation
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <EmojiEvents color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h6">
                    {userProfile?.statistics.totalVotes || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Votes Cast
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Star color="warning" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h6">
                    {userProfile?.statistics.totalProposals || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Proposals Created
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Whatshot color="error" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h6">
                    {userProfile?.streaks.voting || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Voting Streak
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <TrendingUp color="success" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h6">
                    x{userProfile?.streaks.bonusMultiplier || 1}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Bonus Multiplier
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Demo Actions */}
          <Alert severity="info" sx={{ mb: 3 }}>
            Try out the gamification system by simulating governance activities:
          </Alert>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item>
              <Button
                variant="contained"
                onClick={simulateVote}
                startIcon={<EmojiEvents />}
              >
                Simulate Vote
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="outlined"
                onClick={simulateProposal}
                startIcon={<Star />}
              >
                Simulate Proposal
              </Button>
            </Grid>
          </Grid>

          {/* Weather Streak */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Whatshot color="error" /> Weather Data Streak
              </Typography>
              <WeatherStreakBadge walletAddress={userAddress} />
            </CardContent>
          </Card>

          {/* Proof-of-Meme compact card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                🎭 Proof-of-Meme Multiplier
              </Typography>
              <ProofOfMemeDashboard walletAddress={userAddress} compact />
            </CardContent>
          </Card>

          {/* Recent Achievements */}
          {Array.isArray(recentAchievements) && recentAchievements.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Community Achievements
                </Typography>
                {recentAchievements.filter(item => item?.achievement).map((item, index) => (
                  <Box
                    key={index}
                    sx={{ display: 'flex', alignItems: 'center', mb: 2 }}
                  >
                    <Typography variant="h4" sx={{ mr: 2 }}>
                      {item.achievement?.icon || '🏆'}
                    </Typography>
                    <Box>
                      <Typography variant="subtitle1">
                        {item.achievement?.name || 'Achievement'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Unlocked by {(item.userAddress || '').slice(0, 6)}...
                        {(item.userAddress || '').slice(-4)}
                      </Typography>
                    </Box>
                    <Box sx={{ ml: 'auto' }}>
                      <Chip
                        label={item.achievement?.rarity || 'common'}
                        size="small"
                        color={
                          item.achievement?.rarity === 'legendary'
                            ? 'warning'
                            : 'primary'
                        }
                      />
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {selectedTab === 1 && <AchievementsBadges userAddress={userAddress} />}

      {selectedTab === 2 && <AchievementBadgeSystem />}

      {selectedTab === 3 && <LeaderboardDashboard />}
    </Box>
  );
};

const GamificationDashboard = (props) => (
  <DemoSurfaceGate
    testId="gamification"
    title="Gamification is not live on this testnet"
    description="This preview contains illustrative data or simulated actions, not verified testnet results."
  >
    <GamificationDashboardSample {...props} />
  </DemoSurfaceGate>
);

export default GamificationDashboard;
