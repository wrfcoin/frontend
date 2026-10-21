/**
 * Leaderboard Dashboard Component
 * Rankings and competitive elements for governance participation
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Avatar,
  Chip,
  Grid,
  Paper,
  IconButton,
  Tooltip,
  Button,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  EmojiEvents,
  TrendingUp,
  HowToVote,
  Gavel,
  Whatshot,
  Star,
  Search,
  Refresh,
  MilitaryTech as Crown, // Crown icon doesn't exist in MUI
  WorkspacePremium,
} from '@mui/icons-material';

const LeaderboardDashboard = () => {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const categories = [
    { key: 'points', label: 'Points', icon: <EmojiEvents /> },
    { key: 'votes', label: 'Votes', icon: <HowToVote /> },
    { key: 'proposals', label: 'Proposals', icon: <Gavel /> },
    { key: 'streak', label: 'Streak', icon: <Whatshot /> },
    { key: 'achievements', label: 'Achievements', icon: <Star /> },
    { key: 'participation', label: 'Participation', icon: <TrendingUp /> },
  ];

  useEffect(() => {
    fetchLeaderboard();
    fetchStats();
  }, [selectedCategory]);

  const fetchLeaderboard = async () => {
    try {
      const category = categories[selectedCategory].key;
      const response = await fetch(
        `/api/gamification/leaderboard?category=${category}&limit=20`,
      );
      const data = await response.json();

      if (data.success) {
        setLeaderboard(data.data.leaderboard);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/gamification/stats/overview');
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getRankIcon = rank => {
    switch (rank) {
    case 1:
      return <Crown sx={{ color: '#ffd700' }} />;
    case 2:
      return <WorkspacePremium sx={{ color: '#c0c0c0' }} />;
    case 3:
      return <WorkspacePremium sx={{ color: '#cd7f32' }} />;
    default:
      return rank;
    }
  };

  const getRankColor = rank => {
    switch (rank) {
    case 1:
      return '#ffd700';
    case 2:
      return '#c0c0c0';
    case 3:
      return '#cd7f32';
    default:
      return 'inherit';
    }
  };

  const formatAddress = address => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatScore = (score, category) => {
    switch (category) {
    case 'points':
      return score.toLocaleString();
    case 'votes':
    case 'proposals':
    case 'achievements':
      return score;
    case 'streak':
      return `${score} days`;
    case 'participation':
      return `${score.toFixed(1)}%`;
    default:
      return score;
    }
  };

  const filteredLeaderboard = leaderboard.filter(entry =>
    entry.address.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Governance Leaderboard
      </Typography>

      {/* Stats Overview */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {stats.users.total}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Participants
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {stats.users.participationRate}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Participation Rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {stats.activity.totalVotes.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Votes Cast
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  {stats.activity.avgPointsPerUser}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Avg Points per User
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Category Tabs */}
      <Card sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={selectedCategory}
            onChange={(e, newValue) => setSelectedCategory(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            {categories.map((category, index) => (
              <Tab
                key={category.key}
                label={category.label}
                icon={category.icon}
                iconPosition="start"
                sx={{ minHeight: 64 }}
              />
            ))}
          </Tabs>
        </Box>

        {/* Search and Controls */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <TextField
            placeholder="Search by address..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />
          <Button
            startIcon={<Refresh />}
            onClick={fetchLeaderboard}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Card>

      {/* Leaderboard Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width={80}>Rank</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Level</TableCell>
                <TableCell align="right">Score</TableCell>
                <TableCell align="right">Total Points</TableCell>
                <TableCell align="right">Achievements</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLeaderboard.map(entry => (
                <TableRow
                  key={entry.address}
                  sx={{
                    backgroundColor:
                      entry.rank <= 3
                        ? `rgba(${
                          entry.rank === 1
                            ? '255, 215, 0'
                            : entry.rank === 2
                              ? '192, 192, 192'
                              : '205, 127, 50'
                        }, 0.1)`
                        : 'inherit',
                  }}
                >
                  <TableCell>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        color: getRankColor(entry.rank),
                      }}
                    >
                      {getRankIcon(entry.rank)}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        {entry.address.slice(2, 4).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">
                          {formatAddress(entry.address)}
                        </Typography>
                        {entry.rank <= 3 && (
                          <Chip
                            label={
                              entry.rank === 1
                                ? 'Champion'
                                : entry.rank === 2
                                  ? 'Runner-up'
                                  : '3rd Place'
                            }
                            size="small"
                            color={
                              entry.rank === 1
                                ? 'warning'
                                : entry.rank === 2
                                  ? 'default'
                                  : 'default'
                            }
                            sx={{ mt: 0.5 }}
                          />
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          mr: 1,
                          bgcolor:
                            entry.level.level >= 5
                              ? 'warning.main'
                              : 'primary.main',
                          fontSize: '0.8rem',
                        }}
                      >
                        {entry.level.level}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {entry.level.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Level {entry.level.level}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="h6" fontWeight="bold">
                      {formatScore(
                        entry.score,
                        categories[selectedCategory].key,
                      )}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {entry.totalPoints.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={entry.achievements}
                      color="success"
                      size="small"
                      icon={<Star />}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {filteredLeaderboard.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="textSecondary">
            No results found
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Try adjusting your search or refresh the data
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default LeaderboardDashboard;
