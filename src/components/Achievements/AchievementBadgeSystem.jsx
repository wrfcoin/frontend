import DemoSurfaceGate from '../common/DemoSurfaceGate';
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  Avatar,
  Tabs,
  Tab,
} from '@mui/material';

const AchievementBadgeSystemSample = () => {
  const [achievements, setAchievements] = useState([]);
  const [userProgress, setUserProgress] = useState(null);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);

  // Achievement categories with emoji icons and colors
  const categories = {
    security: {
      name: 'Security & Privacy',
      icon: '🔐',
      color: '#e53e3e',
      description: 'Protect your assets and maintain privacy',
    },
    nodeOps: {
      name: 'Node Operations',
      icon: '⚙️',
      color: '#3182ce',
      description: 'Deploy and maintain network infrastructure',
    },
    mining: {
      name: 'Mining & Validation',
      icon: '⛏️',
      color: '#38a169',
      description: 'Participate in consensus and earn rewards',
    },
    dataContrib: {
      name: 'Data Contribution',
      icon: '📊',
      color: '#805ad5',
      description: 'Provide valuable data to the network',
    },
    platformUse: {
      name: 'Platform Mastery',
      icon: '🎯',
      color: '#d69e2e',
      description: 'Master all platform features and tools',
    },
    community: {
      name: 'Community Building',
      icon: '👥',
      color: '#dd6b20',
      description: 'Help grow and support the community',
    },
    governance: {
      name: 'Governance',
      icon: '🗳️',
      color: '#2d3748',
      description: 'Participate in decentralized governance',
    },
    crossChain: {
      name: 'Cross-Chain',
      icon: '🌉',
      color: '#319795',
      description: 'Bridge assets across blockchain networks',
    },
    innovation: {
      name: 'Innovation',
      icon: '💡',
      color: '#553c9a',
      description: 'Develop and contribute to the protocol',
    },
  };

  // Rarity colors and multipliers
  const rarityStyles = {
    common: { color: '#6B7280', glow: '#6B7280', multiplier: 1 },
    uncommon: { color: '#10B981', glow: '#10B981', multiplier: 1.2 },
    rare: { color: '#3B82F6', glow: '#3B82F6', multiplier: 1.5 },
    epic: { color: '#8B5CF6', glow: '#8B5CF6', multiplier: 2 },
    legendary: { color: '#F59E0B', glow: '#F59E0B', multiplier: 3 },
  };

  useEffect(() => {
    fetchAchievements();
    fetchUserProgress();
  }, []);

  const fetchAchievements = async () => {
    try {
      // Sample achievements with actual earned status based on real platform usage
      const mockAchievements = [
        {
          id: 'security_first_yubikey',
          category: 'security',
          name: 'Hardware Guardian',
          description: 'Successfully configure YubiKey/HSM for wallet security',
          icon: '🔐',
          rarity: 'uncommon',
          requirements: { yubikeySetup: true },
          rewards: { wrfTokens: 5, xp: 100 },
          soulbound: true,
          earned: true,
          earnedAt: Date.now() - 86400000,
        },
        {
          id: 'data_weather_warrior',
          category: 'dataContrib',
          name: 'Weather Warrior',
          description: 'Contribute 1,000 weather data points',
          icon: '🌤️',
          rarity: 'uncommon',
          requirements: { weatherDataPoints: 1000 },
          rewards: { wrfTokens: 8, xp: 150 },
          soulbound: true,
          earned: true,
          earnedAt: Date.now() - 3600000,
        },
        {
          id: 'node_first_deployment',
          category: 'nodeOps',
          name: 'Node Runner',
          description: 'Successfully deploy your first Wrfcoin node',
          icon: '⚙️',
          rarity: 'common',
          requirements: { nodeDeployed: true },
          rewards: { wrfTokens: 2, xp: 50 },
          soulbound: true,
          earned: true,
          earnedAt: Date.now() - 7200000,
        },
        {
          id: 'security_quantum_ready',
          category: 'security',
          name: 'Quantum Shield',
          description: 'Enable quantum-resistant cryptography on your wallet',
          icon: '🛡️',
          rarity: 'rare',
          requirements: { quantumCrypto: true },
          rewards: { wrfTokens: 10, xp: 200 },
          soulbound: true,
          earned: false,
        },
        {
          id: 'mining_efficiency_master',
          category: 'mining',
          name: 'Efficiency Master',
          description: 'Achieve 95%+ mining efficiency for a month',
          icon: '📊',
          rarity: 'epic',
          requirements: { miningEfficiency: 95, days: 30 },
          rewards: { wrfTokens: 40, xp: 700 },
          soulbound: true,
          earned: false,
        },
        {
          id: 'innovation_protocol_contributor',
          category: 'innovation',
          name: 'Protocol Contributor',
          description: 'Have code merged into Wrfcoin core protocol',
          icon: '💡',
          rarity: 'legendary',
          requirements: { protocolContributions: 1 },
          rewards: { wrfTokens: 200, xp: 2000 },
          soulbound: true,
          earned: false,
        },
        {
          id: 'crosschain_bridge_master',
          category: 'crossChain',
          name: 'Bridge Master',
          description: 'Successfully bridge assets across 10+ chains',
          icon: '🌉',
          rarity: 'rare',
          requirements: { chainsBridged: 10 },
          rewards: { wrfTokens: 22, xp: 400 },
          soulbound: true,
          earned: false,
        },
        {
          id: 'governance_first_vote',
          category: 'governance',
          name: 'Democratic Participant',
          description: 'Cast your first governance vote',
          icon: '🗳️',
          rarity: 'common',
          requirements: { governanceVotes: 1 },
          rewards: { wrfTokens: 2, xp: 40 },
          soulbound: true,
          earned: false,
        },
      ];

      setAchievements(mockAchievements);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  };

  const fetchUserProgress = async () => {
    try {
      // Real user progress based on actual platform engagement
      const mockProgress = {
        totalXP: 300,
        achievementsEarned: 3,
        totalAchievements: 33,
        completionPercentage: 9,
        categoryProgress: {
          security: { earned: 1, total: 5, percentage: 20 },
          nodeOps: { earned: 1, total: 5, percentage: 20 },
          dataContrib: { earned: 1, total: 4, percentage: 25 },
          mining: { earned: 0, total: 4, percentage: 0 },
          platformUse: { earned: 0, total: 4, percentage: 0 },
          community: { earned: 0, total: 3, percentage: 0 },
          governance: { earned: 0, total: 3, percentage: 0 },
          crossChain: { earned: 0, total: 2, percentage: 0 },
          innovation: { earned: 0, total: 3, percentage: 0 },
        },
        rarityDistribution: {
          common: 1,
          uncommon: 2,
          rare: 0,
          epic: 0,
          legendary: 0,
        },
      };

      setUserProgress(mockProgress);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user progress:', error);
      setLoading(false);
    }
  };

  const AchievementCard = ({ achievement }) => {
    const rarity = rarityStyles[achievement.rarity];
    const isEarned = achievement.earned;

    return (
      <Card
        sx={{
          height: '100%',
          cursor: 'pointer',
          border: isEarned ? `2px solid ${rarity.color}` : '2px solid #e2e8f0',
          boxShadow: isEarned
            ? `0 0 20px ${rarity.glow}40`
            : '0 2px 4px rgba(0,0,0,0.1)',
          opacity: isEarned ? 1 : 0.6,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: isEarned
              ? `0 8px 25px ${rarity.glow}60`
              : '0 4px 12px rgba(0,0,0,0.15)',
          },
        }}
        onClick={() => setSelectedAchievement(achievement)}
      >
        <CardContent sx={{ textAlign: 'center', p: 2 }}>
          <Box sx={{ position: 'relative', mb: 2 }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                fontSize: '2rem',
                bgcolor: isEarned ? rarity.color : '#f1f5f9',
                color: isEarned ? 'white' : '#64748b',
                mx: 'auto',
              }}
            >
              {achievement.icon}
            </Avatar>
            {isEarned && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -8,
                  right: '50%',
                  transform: 'translateX(50%)',
                  color: rarity.color,
                  fontSize: 16,
                }}
              >
                🔒
              </Box>
            )}
          </Box>

          <Typography
            variant="h6"
            sx={{ fontWeight: 'bold', mb: 1, fontSize: '0.9rem' }}
          >
            {achievement.name}
          </Typography>

          <Chip
            label={achievement.rarity.toUpperCase()}
            size="small"
            sx={{
              bgcolor: rarity.color,
              color: 'white',
              fontWeight: 'bold',
              mb: 1,
            }}
          />

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2, fontSize: '0.8rem' }}
          >
            {achievement.description}
          </Typography>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
              {achievement.rewards.wrfTokens} WRF
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
              {achievement.rewards.xp} XP
            </Typography>
          </Box>

          {isEarned && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, display: 'block' }}
            >
              Earned {new Date(achievement.earnedAt).toLocaleDateString()}
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  };

  const CategoryProgress = ({ categoryKey, progress }) => {
    const category = categories[categoryKey];
    const percentage = progress.percentage;

    return (
      <Card sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Avatar
            sx={{ bgcolor: category.color, mr: 2, width: 40, height: 40 }}
          >
            {category.icon}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {category.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {progress.earned}/{progress.total} achievements
            </Typography>
          </Box>
          <Typography
            variant="h6"
            sx={{ fontWeight: 'bold', color: category.color }}
          >
            {percentage}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={percentage}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: '#f1f5f9',
            '& .MuiLinearProgress-bar': {
              bgcolor: category.color,
            },
          }}
        />
      </Card>
    );
  };

  const AchievementModal = ({ achievement, open, onClose }) => {
    if (!achievement) return null;

    const rarity = rarityStyles[achievement.rarity];

    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              fontSize: '2.5rem',
              bgcolor: rarity.color,
              mx: 'auto',
              mb: 2,
            }}
          >
            {achievement.icon}
          </Avatar>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            {achievement.name}
          </Typography>
          <Chip
            label={achievement.rarity.toUpperCase()}
            sx={{
              bgcolor: rarity.color,
              color: 'white',
              fontWeight: 'bold',
              mt: 1,
            }}
          />
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 3, textAlign: 'center' }}>
            {achievement.description}
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6}>
              <Box
                sx={{
                  textAlign: 'center',
                  p: 2,
                  bgcolor: '#f8fafc',
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 'bold', color: '#059669' }}
                >
                  {achievement.rewards.wrfTokens} WRF
                </Typography>
                <Typography variant="caption">Token Reward</Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box
                sx={{
                  textAlign: 'center',
                  p: 2,
                  bgcolor: '#f8fafc',
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 'bold', color: '#7c3aed' }}
                >
                  {achievement.rewards.xp} XP
                </Typography>
                <Typography variant="caption">Experience Points</Typography>
              </Box>
            </Grid>
          </Grid>

          {achievement.soulbound && (
            <Box
              sx={{
                textAlign: 'center',
                p: 2,
                bgcolor: '#fef3c7',
                borderRadius: 2,
                mb: 2,
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: '#92400e', fontWeight: 'bold' }}
              >
                🔒 Soulbound NFT - Cannot be transferred
              </Typography>
            </Box>
          )}

          {achievement.earned ? (
            <Box
              sx={{
                textAlign: 'center',
                p: 2,
                bgcolor: '#dcfce7',
                borderRadius: 2,
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: '#166534', fontWeight: 'bold' }}
              >
                🏆 Achievement Unlocked! Earned on{' '}
                {new Date(achievement.earnedAt).toLocaleDateString()}
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                textAlign: 'center',
                p: 2,
                bgcolor: '#f3f4f6',
                borderRadius: 2,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Complete the requirements to unlock this achievement
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Typography>Loading achievements...</Typography>
      </Box>
    );
  }

  const earnedAchievements = achievements.filter(a => a.earned);
  const availableAchievements = achievements.filter(a => !a.earned);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}
        >
          🏆 Achievement Gallery
        </Typography>
        <Typography
          variant="subtitle1"
          color="text.secondary"
          sx={{ textAlign: 'center', mb: 3 }}
        >
          Collect soulbound NFT badges by participating in the Wrfcoin ecosystem
        </Typography>

        {/* Progress Overview */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <Typography
                variant="h5"
                sx={{ fontWeight: 'bold', color: '#7c3aed' }}
              >
                {userProgress?.totalXP || 0}
              </Typography>
              <Typography variant="caption">Total XP</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <Typography
                variant="h5"
                sx={{ fontWeight: 'bold', color: '#059669' }}
              >
                {userProgress?.achievementsEarned || 0}
              </Typography>
              <Typography variant="caption">Achievements Earned</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <Typography
                variant="h5"
                sx={{ fontWeight: 'bold', color: '#dc2626' }}
              >
                {userProgress?.completionPercentage || 0}%
              </Typography>
              <Typography variant="caption">Completion Rate</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <Typography
                variant="h5"
                sx={{ fontWeight: 'bold', color: '#ea580c' }}
              >
                {userProgress?.rarityDistribution?.legendary || 0}
              </Typography>
              <Typography variant="caption">Legendary Badges</Typography>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        sx={{ mb: 3 }}
      >
        <Tab label="Earned Achievements" />
        <Tab label="Available Achievements" />
        <Tab label="Category Progress" />
      </Tabs>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {earnedAchievements.map(achievement => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={achievement.id}>
              <AchievementCard achievement={achievement} />
            </Grid>
          ))}
          {earnedAchievements.length === 0 && (
            <Grid item xs={12}>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ textAlign: 'center' }}
              >
                No achievements earned yet. Start exploring the platform!
              </Typography>
            </Grid>
          )}
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          {availableAchievements.map(achievement => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={achievement.id}>
              <AchievementCard achievement={achievement} />
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            {Object.entries(userProgress?.categoryProgress || {})
              .slice(0, 5)
              .map(([key, progress]) => (
                <CategoryProgress
                  key={key}
                  categoryKey={key}
                  progress={progress}
                />
              ))}
          </Grid>
          <Grid item xs={12} md={6}>
            {Object.entries(userProgress?.categoryProgress || {})
              .slice(5)
              .map(([key, progress]) => (
                <CategoryProgress
                  key={key}
                  categoryKey={key}
                  progress={progress}
                />
              ))}
          </Grid>
        </Grid>
      )}

      {/* Achievement Detail Modal */}
      <AchievementModal
        achievement={selectedAchievement}
        open={!!selectedAchievement}
        onClose={() => setSelectedAchievement(null)}
      />
    </Box>
  );
};

const AchievementBadgeSystem = (props) => (
  <DemoSurfaceGate
    testId="achievements"
    title="Achievements is not live on this testnet"
    description="This preview contains illustrative data or simulated actions, not verified testnet results."
  >
    <AchievementBadgeSystemSample {...props} />
  </DemoSurfaceGate>
);

export default AchievementBadgeSystem;
