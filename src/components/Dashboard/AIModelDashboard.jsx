import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SpeedIcon from '@mui/icons-material/Speed';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const AIModelDashboard = () => {
  const [modelData, setModelData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => {
      setModelData(getAIModelData());
      setLoading(false);
    }, 1000);
  }, []);

  const getAIModelData = () => ({
    totalModels: 8924,
    dailyPredictions: 456789,
    averageAccuracy: 94.7,
    inferenceCapacity: 156000,
    categories: [
      {
        name: 'Climate Prediction',
        models: 2847,
        accuracy: 97.2,
        dailyOutput: 45000,
        specializations: [
          'Temperature trends',
          'Precipitation patterns',
          'Extreme weather events',
        ],
      },
      {
        name: 'Air Quality Analysis',
        models: 1923,
        accuracy: 94.8,
        dailyOutput: 78000,
        specializations: [
          'PM2.5 prediction',
          'Ozone forecasting',
          'Pollution source identification',
        ],
      },
      {
        name: 'Carbon Monitoring',
        models: 1234,
        accuracy: 96.1,
        dailyOutput: 23000,
        specializations: [
          'Emissions tracking',
          'Carbon sequestration',
          'Offset verification',
        ],
      },
      {
        name: 'Ocean Health',
        models: 847,
        accuracy: 91.4,
        dailyOutput: 12000,
        specializations: [
          'Temperature monitoring',
          'pH tracking',
          'Marine ecosystem health',
        ],
      },
      {
        name: 'Forest Analytics',
        models: 612,
        accuracy: 93.6,
        dailyOutput: 8000,
        specializations: [
          'Deforestation detection',
          'Biodiversity assessment',
          'Fire risk prediction',
        ],
      },
      {
        name: 'Energy Optimization',
        models: 456,
        accuracy: 89.7,
        dailyOutput: 15000,
        specializations: [
          'Renewable forecasting',
          'Grid optimization',
          'Demand prediction',
        ],
      },
      {
        name: 'Agricultural Intelligence',
        models: 1005,
        accuracy: 92.3,
        dailyOutput: 34000,
        specializations: [
          'Crop yield prediction',
          'Soil health analysis',
          'Pest detection',
        ],
      },
    ],
    topModels: [
      {
        name: 'CLIMATE-MASTER-v3',
        accuracy: 98.7,
        type: 'Temperature prediction specialist',
      },
      {
        name: 'AIR-QUALITY-PRO-v2',
        accuracy: 97.4,
        type: 'PM2.5 forecasting leader',
      },
      {
        name: 'CARBON-TRACKER-MAX',
        accuracy: 97.1,
        type: 'Emission calculation expert',
      },
      {
        name: 'OCEAN-HEALTH-AI-v4',
        accuracy: 96.8,
        type: 'Marine ecosystem monitor',
      },
      {
        name: 'FOREST-WATCH-v3',
        accuracy: 96.2,
        type: 'Deforestation detection specialist',
      },
      {
        name: 'ENERGY-OPTIMIZER-v2',
        accuracy: 95.9,
        type: 'Grid efficiency maximizer',
      },
    ],
    networkUtilization: [
      {
        network: 'Bittensor',
        subnets: 847,
        utilization: 78,
        focus: 'Climate & air quality',
      },
      {
        network: 'Golem',
        nodes: 8923,
        utilization: 67,
        focus: 'Heavy computation workloads',
      },
      {
        network: 'Akash',
        containers: 5847,
        utilization: 82,
        focus: 'Real-time inference APIs',
      },
      {
        network: 'Bacalhau',
        jobs: 3456,
        utilization: 54,
        focus: 'Large dataset processing',
      },
      {
        network: 'SONM',
        nodes: 6789,
        utilization: 71,
        focus: 'Parallel model training',
      },
      {
        network: 'Arweave',
        storage: '89.7 TB',
        utilization: 45,
        focus: 'Model & result archival',
      },
    ],
  });

  const getAccuracyColor = accuracy => {
    if (accuracy >= 95) return 'success';
    if (accuracy >= 90) return 'primary';
    return 'warning';
  };

  const getUtilizationColor = utilization => {
    if (utilization >= 80) return 'error';
    if (utilization >= 60) return 'warning';
    return 'success';
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Loading AI Model Dashboard...
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h5"
        gutterBottom
        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
      >
        <SmartToyIcon color="primary" />
        Environmental AI Model Dashboard
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total AI Models
              </Typography>
              <Typography variant="h4" component="div">
                {modelData.totalModels.toLocaleString()}
              </Typography>
              <Typography variant="body2">
                Environmental & Climate Analysis
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Daily Predictions
              </Typography>
              <Typography variant="h4" component="div">
                {modelData.dailyPredictions.toLocaleString()}
              </Typography>
              <Typography variant="body2">Environmental forecasts</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Average Accuracy
              </Typography>
              <Typography variant="h4" component="div">
                {modelData.averageAccuracy}%
              </Typography>
              <Typography variant="body2">
                Across all model categories
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Inference Capacity
              </Typography>
              <Typography variant="h4" component="div">
                {modelData.inferenceCapacity.toLocaleString()}
              </Typography>
              <Typography variant="body2">Requests per minute</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Model Categories */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <TrendingUpIcon color="primary" />
            AI Model Categories & Performance
          </Typography>
          <Grid container spacing={2}>
            {modelData.categories.map((category, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        width: '100%',
                        alignItems: 'center',
                        pr: 2,
                      }}
                    >
                      <Typography variant="subtitle1">
                        {category.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip
                          size="small"
                          label={`${category.models} models`}
                          color="primary"
                        />
                        <Chip
                          size="small"
                          label={`${category.accuracy}% accuracy`}
                          color={getAccuracyColor(category.accuracy)}
                        />
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      gutterBottom
                    >
                      Daily Output: {category.dailyOutput.toLocaleString()}{' '}
                      predictions
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2" gutterBottom>
                      Specializations:
                    </Typography>
                    {category.specializations.map((spec, i) => (
                      <Chip
                        key={i}
                        label={spec}
                        size="small"
                        variant="outlined"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </AccordionDetails>
                </Accordion>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Top Performing Models */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <CheckCircleIcon color="success" />
            Top Performing Models
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Model Name</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Accuracy</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Specialization</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {modelData.topModels.map((model, index) => (
                  <TableRow key={index}>
                    <TableCell>{model.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={`${model.accuracy}%`}
                        color={getAccuracyColor(model.accuracy)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{model.type}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Network Utilization */}
      <Card>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <SpeedIcon color="primary" />
            AI Network Resource Utilization
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Network</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Resources</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Utilization</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Focus Area</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {modelData.networkUtilization.map((network, index) => (
                  <TableRow key={index}>
                    <TableCell>{network.network}</TableCell>
                    <TableCell>
                      {network.subnets && `${network.subnets} subnets`}
                      {network.nodes &&
                        `${network.nodes.toLocaleString()} nodes`}
                      {network.containers &&
                        `${network.containers.toLocaleString()} containers`}
                      {network.jobs && `${network.jobs.toLocaleString()} jobs`}
                      {network.storage && network.storage}
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <LinearProgress
                          variant="determinate"
                          value={network.utilization}
                          color={getUtilizationColor(network.utilization)}
                          sx={{ width: 60 }}
                        />
                        <Typography variant="body2">
                          {network.utilization}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{network.focus}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AIModelDashboard;
