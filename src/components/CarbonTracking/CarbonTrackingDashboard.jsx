// Carbon Tracking Dashboard Component
// Location: frontend/src/components/CarbonTracking/CarbonTrackingDashboard.jsx
// Priority: STRATEGIC - Quick win innovative feature UI

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Avatar,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import SpaIcon from '@mui/icons-material/Spa';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import ComputerIcon from '@mui/icons-material/Computer';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import FlightIcon from '@mui/icons-material/Flight';
import HomeIcon from '@mui/icons-material/Home';
import RecyclingIcon from '@mui/icons-material/Recycling';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { devLog } from '../../utils/logger';
import DemoSurfaceGate from '../common/DemoSurfaceGate';

// frontend#352: in the demo build this sample's controls are disabled; none of
// them reach a backend.
const SAMPLE_ACTION = 'Sample only: nothing here is backed by a carbon service.';

const CarbonTrackingDashboardSample = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [footprintData, setFootprintData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [carbonScore, setCarbonScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  // Mock user ID - in real app, this would come from auth context
  const userId = 'user_123';

  useEffect(() => {
    loadDashboardData();
  }, [period]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load footprint data
      const footprintResponse = await fetch(
        `/api/carbon/footprint/${userId}?period=${period}`,
      );
      if (footprintResponse.ok) {
        const footprintResult = await footprintResponse.json();
        setFootprintData(footprintResult.data);
      }

      // Load recommendations
      const recommendationsResponse = await fetch(
        `/api/carbon/recommendations/${userId}`,
      );
      if (recommendationsResponse.ok) {
        const recommendationsResult = await recommendationsResponse.json();
        setRecommendations(recommendationsResult.data.recommendations);
      }

      // Load carbon score
      const scoreResponse = await fetch(`/api/carbon/score/${userId}`);
      if (scoreResponse.ok) {
        const scoreResult = await scoreResponse.json();
        setCarbonScore(scoreResult.data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = activityType => {
    const icons = {
      transportation: <DirectionsCarIcon />,
      energy: <ElectricBoltIcon />,
      food: <RestaurantIcon />,
      digital: <ComputerIcon />,
      consumption: <RecyclingIcon />,
      waste: <RecyclingIcon />,
    };
    return icons[activityType] || <SpaIcon />;
  };

  const getGradeColor = grade => {
    const colors = {
      'A+': '#4CAF50',
      A: '#66BB6A',
      'B+': '#8BC34A',
      B: '#CDDC39',
      'C+': '#FDD835',
      C: '#FFB74D',
      'D+': '#FF8A65',
      D: '#E57373',
      F: '#EF5350',
    };
    return colors[grade] || '#9E9E9E';
  };

  const getTrendIcon = trend => {
    switch (trend) {
    case 'increasing':
      return <TrendingUpIcon color="error" />;
    case 'decreasing':
      return <TrendingDownIcon color="success" />;
    default:
      return <RemoveIcon color="warning" />;
    }
  };

  const formatEmissions = value => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}t`;
    }
    return `${value.toFixed(1)}kg`;
  };

  const COLORS = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEAA7',
    '#DDA0DD',
    '#98D8C8',
  ];

  const pieData = footprintData
    ? Object.entries(footprintData.breakdown).map(([key, value], index) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: value.emissions,
      percentage: value.percentage,
      color: COLORS[index % COLORS.length],
    }))
    : [];

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Carbon Footprint Dashboard
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
      >
        <SpaIcon color="success" />
        Carbon Footprint Dashboard
      </Typography>

      {/* Period Selector */}
      <Box sx={{ mb: 3 }}>
        {['week', 'month', 'quarter', 'year'].map(p => (
          <Button
            key={p}
            variant={period === p ? 'contained' : 'outlined'}
            onClick={() => setPeriod(p)}
            sx={{ mr: 1, mb: 1 }}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </Button>
        ))}
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Emissions
                  </Typography>
                  <Typography variant="h4">
                    {footprintData
                      ? formatEmissions(footprintData.totalEmissions)
                      : '0kg'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    CO₂e this {period}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <SpaIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Daily Average
                  </Typography>
                  <Typography variant="h4">
                    {footprintData
                      ? formatEmissions(footprintData.averageDaily)
                      : '0kg'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {footprintData && getTrendIcon(footprintData.trend)}
                    <Typography variant="body2" color="textSecondary">
                      {footprintData?.trendPercentage.toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  <TrendingDownIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Carbon Score
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h4">
                      {carbonScore?.score.toFixed(0) || 'N/A'}
                    </Typography>
                    <Chip
                      label={carbonScore?.grade || 'N/A'}
                      sx={{
                        bgcolor: carbonScore
                          ? getGradeColor(carbonScore.grade)
                          : '#9E9E9E',
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    />
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    Environmental Rating
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <SpaIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Recommendations
                  </Typography>
                  <Typography variant="h4">{recommendations.length}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Action items
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <TrendingDownIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Overview" />
          <Tab label="Breakdown" />
          <Tab label="Recommendations" />
          <Tab label="Track Activity" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Emissions Breakdown Pie Chart */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Emissions by Category
                </Typography>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) =>
                          `${name}: ${percentage.toFixed(1)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={value => [
                          formatEmissions(value),
                          'Emissions',
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Alert severity="info">
                    No emission data available for this period
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Benchmarks Comparison */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Comparison to Benchmarks
                </Typography>
                {footprintData && (
                  <Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">
                        Your Annual Footprint:{' '}
                        {formatEmissions(
                          footprintData.totalEmissions * (365 / 30),
                        )}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(
                          ((footprintData.totalEmissions * (365 / 30)) /
                            footprintData.benchmarks.globalAverage) *
                            100,
                          100,
                        )}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">
                        Global Average:{' '}
                        {formatEmissions(
                          footprintData.benchmarks.globalAverage,
                        )}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={100}
                        color="warning"
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">
                        2030 Target:{' '}
                        {formatEmissions(footprintData.benchmarks.target)}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={100}
                        color="success"
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Carbon Score Details */}
          {carbonScore && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Carbon Score Analysis
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Strengths
                      </Typography>
                      {carbonScore.strengths.map((strength, index) => (
                        <Chip
                          key={index}
                          label={strength}
                          color="success"
                          variant="outlined"
                          sx={{ mr: 1, mb: 1 }}
                        />
                      ))}
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Areas for Improvement
                      </Typography>
                      {carbonScore.improvements.map((improvement, index) => (
                        <Chip
                          key={index}
                          label={improvement}
                          color="warning"
                          variant="outlined"
                          sx={{ mr: 1, mb: 1 }}
                        />
                      ))}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          {/* Detailed Breakdown Table */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Detailed Emissions Breakdown
                </Typography>
                {footprintData && (
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Category</TableCell>
                          <TableCell align="right">
                            Emissions (kg CO₂e)
                          </TableCell>
                          <TableCell align="right">Percentage</TableCell>
                          <TableCell align="right">Activities</TableCell>
                          <TableCell align="right">Avg per Activity</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(footprintData.breakdown).map(
                          ([category, data]) => (
                            <TableRow key={category}>
                              <TableCell>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                  }}
                                >
                                  {getActivityIcon(category)}
                                  {category.charAt(0).toUpperCase() +
                                    category.slice(1)}
                                </Box>
                              </TableCell>
                              <TableCell align="right">
                                {data.emissions.toFixed(2)}
                              </TableCell>
                              <TableCell align="right">
                                {data.percentage.toFixed(1)}%
                              </TableCell>
                              <TableCell align="right">
                                {data.activities}
                              </TableCell>
                              <TableCell align="right">
                                {data.activities > 0
                                  ? (data.emissions / data.activities).toFixed(
                                    2,
                                  )
                                  : '0.00'}
                              </TableCell>
                            </TableRow>
                          ),
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={3}>
          {/* Recommendations */}
          {recommendations.map((recommendation, index) => (
            <Grid item xs={12} md={6} key={recommendation.id}>
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6">{recommendation.title}</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        label={recommendation.difficulty}
                        size="small"
                        color={
                          recommendation.difficulty === 'easy'
                            ? 'success'
                            : recommendation.difficulty === 'medium'
                              ? 'warning'
                              : 'error'
                        }
                      />
                      <Chip
                        label={recommendation.cost}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Box>

                  <Typography variant="body2" color="textSecondary" paragraph>
                    {recommendation.description}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="body2"
                      color="primary"
                      fontWeight="bold"
                    >
                      Potential Reduction:{' '}
                      {formatEmissions(recommendation.potentialReduction)}/year
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {recommendation.personalizedReason}
                    </Typography>
                  </Box>

                  <Typography variant="subtitle2" gutterBottom>
                    Action Steps:
                  </Typography>
                  <Box component="ul" sx={{ pl: 2, m: 0 }}>
                    {recommendation.actionSteps.map((step, stepIndex) => (
                      <Typography
                        component="li"
                        variant="body2"
                        key={stepIndex}
                      >
                        {step}
                      </Typography>
                    ))}
                  </Box>

                  <Box
                    sx={{
                      mt: 2,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography variant="body2" color="textSecondary">
                      Timeframe: {recommendation.timeframe}
                    </Typography>
                    <Button disabled title={SAMPLE_ACTION} variant="outlined" size="small">
                      Learn More
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {recommendations.length === 0 && (
            <Grid item xs={12}>
              <Alert severity="info">
                No recommendations available. Track more activities to get
                personalized suggestions!
              </Alert>
            </Grid>
          )}
        </Grid>
      )}

      {activeTab === 3 && (
        <Grid container spacing={3}>
          {/* Quick Track Activities */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Track Activities
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<DirectionsCarIcon />}
                      disabled
                      title={SAMPLE_ACTION}
                      sx={{ height: 60 }}
                    >
                      Car Trip (10km)
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<FlightIcon />}
                      disabled
                      title={SAMPLE_ACTION}
                      sx={{ height: 60 }}
                    >
                      Flight (500km)
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<ElectricBoltIcon />}
                      disabled
                      title={SAMPLE_ACTION}
                      sx={{ height: 60 }}
                    >
                      Home Energy (30kWh)
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<RestaurantIcon />}
                      disabled
                      title={SAMPLE_ACTION}
                      sx={{ height: 60 }}
                    >
                      Beef Meal (200g)
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

// frontend#352: display-only fabricated surface. The default build shows an
// honest not-live state and never mounts the sample.
const CarbonTrackingDashboard = () => (
  <DemoSurfaceGate
    title="Carbon tracking is not live on the testnet"
    description="No testnet endpoint serves carbon footprints, scores or recommendations (no /api/carbon is mounted)."
    testId="carbon-tracking"
  >
    <CarbonTrackingDashboardSample />
  </DemoSurfaceGate>
);

export default CarbonTrackingDashboard;
