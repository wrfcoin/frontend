import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Chip,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
} from '@mui/material';
import PageTitle from '../components/common/PageTitle';

const EnhancedIncentives = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [governanceData] = useState({
    totalTreasuryValue: '$142.5M',
    governanceProposals: 47,
    votingPower: '234.7M WRF',
    delegationRate: '38.7%',
    activeCommittees: 3,
    crossChainNetworks: 13,
  });
  const [gamificationStats] = useState({
    totalParticipants: 12847,
    activeValidators: 1834,
    reputationScore: 94.2,
    achievementsUnlocked: 156,
    leaderboardRank: 42,
    performanceScore: 89.4,
  });
  const [rewardDistribution] = useState({
    totalDistributed: '892.4K WRF',
    validatorRewards: '456.2K WRF',
    governanceRewards: '234.8K WRF',
    crossChainRewards: '201.4K WRF',
    monthlyGrowth: '+18.4%',
    proximityRewards: '178.2K WRF',
  });

  const StatCard = ({ bgcolor, title, value, subtitle }) => (
    <Card sx={{ bgcolor, color: 'white', height: '100%' }}>
      <CardContent sx={{ textAlign: 'center' }}>
        <Typography variant="h6">{title}</Typography>
        <Typography variant="h4" sx={{ mb: 0 }}>{value}</Typography>
        <Typography variant="caption">{subtitle}</Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ maxWidth: 'lg', mx: 'auto', px: 3, mt: 4 }}>
      <PageTitle
        title="Advanced Incentive & Governance System"
        subtitle="Comprehensive reward distribution with governance integration and gamification"
      />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)} variant="scrollable" scrollButtons="auto">
          <Tab label="Overview" />
          <Tab label="Proximity Rewards" />
          <Tab label="Governance" />
          <Tab label="Gamification" />
          <Tab label="Reward Distribution" />
        </Tabs>
      </Box>

      {/* Overview Tab */}
      {activeTab === 0 && (
        <Box>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, md: 3 }}>
              <StatCard bgcolor="primary.main" title="Total Treasury" value={governanceData.totalTreasuryValue} subtitle="Governance controlled" />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <StatCard bgcolor="success.main" title="Distributed Rewards" value={rewardDistribution.totalDistributed} subtitle={`${rewardDistribution.monthlyGrowth} this month`} />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <StatCard bgcolor="info.main" title="Active Participants" value={gamificationStats.totalParticipants.toLocaleString()} subtitle="Across all networks" />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <StatCard bgcolor="warning.main" title="Governance Proposals" value={governanceData.governanceProposals} subtitle="Community driven" />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, lg: 8 }}>
              <Card sx={{ mb: 4 }}>
                <CardHeader title={<Typography variant="h6">System Highlights</Typography>} />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="subtitle2" gutterBottom>Advanced Governance</Typography>
                      <List dense disablePadding>
                        <ListItem disableGutters><ListItemText primary="Quadratic Voting System" /></ListItem>
                        <ListItem disableGutters><ListItemText primary={`Multi-Committee Structure (${governanceData.activeCommittees} active)`} /></ListItem>
                        <ListItem disableGutters><ListItemText primary={`Cross-Chain Coordination (${governanceData.crossChainNetworks} networks)`} /></ListItem>
                        <ListItem disableGutters><ListItemText primary={`Treasury Management (${governanceData.totalTreasuryValue})`} /></ListItem>
                      </List>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="subtitle2" gutterBottom>Gamification Features</Typography>
                      <List dense disablePadding>
                        <ListItem disableGutters><ListItemText primary={`Achievement System (${gamificationStats.achievementsUnlocked} unlocked)`} /></ListItem>
                        <ListItem disableGutters><ListItemText primary={`Reputation Scoring (${gamificationStats.reputationScore}/100)`} /></ListItem>
                        <ListItem disableGutters><ListItemText primary={`Leaderboards (Rank #${gamificationStats.leaderboardRank})`} /></ListItem>
                        <ListItem disableGutters><ListItemText primary={`Performance Bonuses (${gamificationStats.performanceScore}%)`} /></ListItem>
                      </List>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, lg: 4 }}>
              <Card sx={{ mb: 4 }}>
                <CardHeader title={<Typography variant="h6">Recent Activity</Typography>} />
                <CardContent>
                  <Box sx={{ mb: 1 }}>
                    <Chip label="Governance" size="small" color="primary" sx={{ mr: 1 }} />
                    <Typography variant="body2" component="span">ZK Rollup proposal approved</Typography>
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Chip label="Reward" size="small" color="success" sx={{ mr: 1 }} />
                    <Typography variant="body2" component="span">Cross-chain rewards distributed</Typography>
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Chip label="Achievement" size="small" color="info" sx={{ mr: 1 }} />
                    <Typography variant="body2" component="span">New validator milestones reached</Typography>
                  </Box>
                  <Box>
                    <Chip label="Treasury" size="small" color="warning" sx={{ mr: 1 }} />
                    <Typography variant="body2" component="span">Q2 budget allocation completed</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Proximity Rewards Tab */}
      {activeTab === 1 && (
        <Box>
          <Card sx={{ mb: 4 }}>
            <CardHeader title={<Typography variant="h6">Proximity-Based Incentive System</Typography>} />
            <CardContent>
              <Typography variant="subtitle1" sx={{ mb: 3 }}>
                Geographic distribution rewards for computational tasks with enhanced governance integration.
              </Typography>

              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography variant="h5" color="primary">{rewardDistribution.proximityRewards}</Typography>
                    <Typography variant="caption">Proximity Rewards Distributed</Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography variant="h5" color="success.main">85%</Typography>
                    <Typography variant="caption">Geographic Coverage Efficiency</Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography variant="h5" color="info.main">3.2x</Typography>
                    <Typography variant="caption">Average Reward Multiplier</Typography>
                  </Box>
                </Grid>
              </Grid>

              <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>Geographic Tiers</Typography>
                  <List disablePadding>
                    {[
                      { label: 'LOCAL', color: 'success', range: '0-50km', mult: '2.5x multiplier' },
                      { label: 'REGIONAL', color: 'info', range: '50-500km', mult: '2.0x multiplier' },
                      { label: 'DISTANT', color: 'warning', range: '500-2000km', mult: '1.5x multiplier' },
                      { label: 'REMOTE', color: 'error', range: '2000km+', mult: '1.2x multiplier' },
                    ].map(tier => (
                      <ListItem key={tier.label} divider sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box>
                          <Chip label={tier.label} size="small" color={tier.color} sx={{ mr: 1 }} />
                          {tier.range}
                        </Box>
                        <Typography variant="body2">{tier.mult}</Typography>
                      </ListItem>
                    ))}
                  </List>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>Active Computational Tasks</Typography>
                  <List disablePadding>
                    {[
                      { name: 'Weather Model NYC', priority: 'HIGH', color: 'error', reward: '100 WRF', region: 'NAM' },
                      { name: 'Climate Model EU', priority: 'MEDIUM', color: 'warning', reward: '200 WRF', region: 'EUR' },
                      { name: 'Air Quality Tokyo', priority: 'HIGH', color: 'error', reward: '150 WRF', region: 'ASIA' },
                    ].map(task => (
                      <ListItem key={task.name} divider>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" fontWeight="bold">{task.name}</Typography>
                              <Chip label={task.priority} size="small" color={task.color} />
                            </Box>
                          }
                          secondary={`Base Reward: ${task.reward} | Region: ${task.region}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Governance Tab */}
      {activeTab === 2 && (
        <Box>
          <Card sx={{ mb: 4 }}>
            <CardHeader title={<Typography variant="h6">Governance Overview</Typography>} />
            <CardContent>
              <Grid container spacing={2} sx={{ mb: 4 }}>
                {[
                  { label: 'Total Voting Power', value: governanceData.votingPower, color: 'primary' },
                  { label: 'Delegation Rate', value: governanceData.delegationRate, color: 'success.main' },
                  { label: 'Active Committees', value: governanceData.activeCommittees, color: 'info.main' },
                  { label: 'Total Proposals', value: governanceData.governanceProposals, color: 'warning.main' },
                ].map(stat => (
                  <Grid key={stat.label} size={{ xs: 12, md: 3 }}>
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                      <Typography variant="h5" color={stat.color}>{stat.value}</Typography>
                      <Typography variant="caption">{stat.label}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>Voting Systems</Typography>
                  <List disablePadding>
                    {[
                      { name: 'Quadratic Voting', status: 'Active', color: 'success' },
                      { name: 'Conviction Voting', status: 'Active', color: 'success' },
                      { name: 'Reputation-Based', status: 'Active', color: 'success' },
                      { name: 'Delegation Support', status: governanceData.delegationRate, color: 'info' },
                    ].map(item => (
                      <ListItem key={item.name} divider sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">{item.name}</Typography>
                        <Chip label={item.status} size="small" color={item.color} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>Committee Structure</Typography>
                  <List disablePadding>
                    {[
                      { name: 'Technical Committee', info: '7 members', color: 'primary' },
                      { name: 'Economic Committee', info: '5 members', color: 'primary' },
                      { name: 'Community Committee', info: '9 members', color: 'primary' },
                      { name: 'Cross-Chain Coordination', info: `${governanceData.crossChainNetworks} networks`, color: 'success' },
                    ].map(item => (
                      <ListItem key={item.name} divider sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">{item.name}</Typography>
                        <Chip label={item.info} size="small" color={item.color} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Gamification Tab */}
      {activeTab === 3 && (
        <Box>
          <Card sx={{ mb: 4 }}>
            <CardHeader title={<Typography variant="h6">Gamification & Achievements</Typography>} />
            <CardContent>
              <Grid container spacing={2} sx={{ mb: 4 }}>
                {[
                  { label: 'Reputation Score', value: `${gamificationStats.reputationScore}/100`, color: 'success' },
                  { label: 'Global Rank', value: `#${gamificationStats.leaderboardRank}`, color: 'warning' },
                  { label: 'Achievements', value: gamificationStats.achievementsUnlocked, color: 'info' },
                  { label: 'Active Validators', value: gamificationStats.activeValidators.toLocaleString(), color: 'primary' },
                ].map(stat => (
                  <Grid key={stat.label} size={{ xs: 12, md: 3 }}>
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                      <Chip
                        label={stat.value}
                        color={stat.color}
                        sx={{ fontSize: '1.5rem', p: 3, mb: 2 }}
                      />
                      <Typography variant="body2">{stat.label}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>Recent Achievements</Typography>
                  <List disablePadding>
                    {[
                      { icon: 'Governance Guardian', time: '2 days ago', desc: 'Participated in 50+ governance proposals' },
                      { icon: 'Lightning Validator', time: '1 week ago', desc: '99.9% uptime for 30 consecutive days' },
                      { icon: 'Cross-Chain Pioneer', time: '2 weeks ago', desc: 'Successfully bridged assets across 10+ chains' },
                    ].map(ach => (
                      <ListItem key={ach.icon} divider>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" fontWeight="bold">{ach.icon}</Typography>
                              <Typography variant="caption" color="text.secondary">{ach.time}</Typography>
                            </Box>
                          }
                          secondary={ach.desc}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>Performance Metrics</Typography>
                  {[
                    { label: 'Reliability', value: 94, color: 'success' },
                    { label: 'Community Engagement', value: 87, color: 'info' },
                    { label: 'Technical Expertise', value: 92, color: 'warning' },
                    { label: 'Innovation Score', value: 89, color: 'primary' },
                  ].map(metric => (
                    <Box key={metric.label} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">{metric.label}</Typography>
                        <Typography variant="body2">{metric.value}%</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={metric.value}
                        color={metric.color}
                        sx={{ height: 8, borderRadius: 1 }}
                      />
                    </Box>
                  ))}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Reward Distribution Tab */}
      {activeTab === 4 && (
        <Box>
          <Card sx={{ mb: 4 }}>
            <CardHeader title={<Typography variant="h6">Advanced Reward Distribution</Typography>} />
            <CardContent>
              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography variant="h5" color="success.main">{rewardDistribution.totalDistributed}</Typography>
                    <Typography variant="caption">Total Distributed</Typography>
                    <Box><Chip label={rewardDistribution.monthlyGrowth} size="small" color="success" /></Box>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography variant="h5" color="primary">{rewardDistribution.validatorRewards}</Typography>
                    <Typography variant="caption">Validator Rewards</Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography variant="h5" color="info.main">{rewardDistribution.governanceRewards}</Typography>
                    <Typography variant="caption">Governance Rewards</Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography variant="h5" color="warning.main">{rewardDistribution.crossChainRewards}</Typography>
                    <Typography variant="caption">Cross-Chain Rewards</Typography>
                  </Box>
                </Grid>
              </Grid>

              <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>Reward Categories</Typography>
                  <List disablePadding>
                    {[
                      { name: 'Block Production', pct: '51.1%', color: 'primary' },
                      { name: 'Governance Participation', pct: '26.3%', color: 'success' },
                      { name: 'Cross-Chain Operations', pct: '22.6%', color: 'info' },
                    ].map(cat => (
                      <ListItem key={cat.name} divider sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">{cat.name}</Typography>
                        <Chip label={cat.pct} size="small" color={cat.color} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>Distribution Mechanisms</Typography>
                  <List disablePadding>
                    {[
                      { name: 'Proximity-Based', pct: 85, color: 'success', desc: 'Geographic optimization rewards' },
                      { name: 'Performance-Based', pct: 92, color: 'primary', desc: 'Reliability and uptime bonuses' },
                      { name: 'Governance-Based', pct: 78, color: 'info', desc: 'Community participation rewards' },
                    ].map(mech => (
                      <ListItem key={mech.name} divider sx={{ display: 'block' }}>
                        <Typography variant="body2" fontWeight="bold">{mech.name}</Typography>
                        <LinearProgress
                          variant="determinate"
                          value={mech.pct}
                          color={mech.color}
                          sx={{ height: 6, borderRadius: 1, my: 1 }}
                        />
                        <Typography variant="caption" color="text.secondary">{mech.desc}</Typography>
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default EnhancedIncentives;
