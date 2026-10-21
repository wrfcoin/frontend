import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  LinearProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CloudDownload as CloudDownloadIcon,
  Timeline as TimelineIcon,
  Memory as MemoryIcon,
  AttachMoney as AttachMoneyIcon,
  Speed as SpeedIcon,
  Storage as StorageIcon,
  Info as InfoIcon,
  Check as CheckIcon,
} from '@mui/icons-material';

const RecipeBuilder = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedRecipe, setSelectedRecipe] = useState('');
  const [computeEstimate, setComputeEstimate] = useState(null);
  const [dataSelection, setDataSelection] = useState({});
  const [qualityMultipliers, setQualityMultipliers] = useState({});

  const recipeCategories = [
    {
      name: 'Temperature Analysis',
      icon: '🌡️',
      recipes: [
        {
          id: 'regional_climate_trend',
          name: 'Regional Climate Trend Analysis',
          description:
            'Long-term temperature trend analysis for climate risk assessment',
          complexity: 'medium',
          baseTime: '12-18 hours',
          baseCost: '$45.80',
          businessValue: 'Insurance risk scoring, agricultural planning',
        },
        {
          id: 'urban_heat_island',
          name: 'Urban Heat Island Analysis',
          description:
            'City-scale temperature differential analysis for urban planning',
          complexity: 'medium',
          baseTime: '18-24 hours',
          baseCost: '$78.90',
          businessValue: 'Urban planning, energy efficiency',
        },
      ],
    },
    {
      name: 'Precipitation Analysis',
      icon: '🌧️',
      recipes: [
        {
          id: 'flood_risk_assessment',
          name: 'Flood Risk Assessment',
          description:
            'Extreme precipitation analysis for flood insurance and planning',
          complexity: 'high',
          baseTime: '1-2 days',
          baseCost: '$167.30',
          businessValue: 'Insurance pricing, urban planning',
        },
      ],
    },
    {
      name: 'Wind Analysis',
      icon: '💨',
      recipes: [
        {
          id: 'wind_energy_assessment',
          name: 'Wind Energy Assessment',
          description:
            'Wind resource analysis for renewable energy development',
          complexity: 'medium',
          baseTime: '18-30 hours',
          baseCost: '$98.40',
          businessValue: 'Renewable energy development',
        },
      ],
    },
  ];

  const dataSourceOptions = {
    temperature: [
      {
        id: 'noaa_stations',
        name: 'NOAA Weather Stations',
        quality: 'gold',
        coverage: 'Regional',
        cost: '$12.50',
      },
      {
        id: 'ecmwf_reanalysis',
        name: 'ECMWF Reanalysis',
        quality: 'gold',
        coverage: 'Global',
        cost: '$8.30',
      },
      {
        id: 'sensor_community',
        name: 'Sensor.Community',
        quality: 'bronze',
        coverage: 'Urban',
        cost: '$3.20',
      },
      {
        id: 'smart_city_sensors',
        name: 'Smart City Sensors',
        quality: 'silver',
        coverage: 'City',
        cost: '$15.80',
      },
    ],
    precipitation: [
      {
        id: 'weather_radar',
        name: 'Weather Radar Networks',
        quality: 'gold',
        coverage: 'Regional',
        cost: '$25.40',
      },
      {
        id: 'rain_gauges',
        name: 'Rain Gauge Networks',
        quality: 'gold',
        coverage: 'Point',
        cost: '$18.70',
      },
      {
        id: 'satellite_precip',
        name: 'Satellite Precipitation',
        quality: 'silver',
        coverage: 'Global',
        cost: '$22.10',
      },
    ],
    wind: [
      {
        id: 'met_towers',
        name: 'Meteorological Towers',
        quality: 'gold',
        coverage: 'Point',
        cost: '$32.60',
      },
      {
        id: 'wind_lidar',
        name: 'Wind Lidar Systems',
        quality: 'gold',
        coverage: 'Vertical Profile',
        cost: '$45.20',
      },
      {
        id: 'reanalysis_wind',
        name: 'Reanalysis Wind Data',
        quality: 'silver',
        coverage: 'Global',
        cost: '$12.40',
      },
    ],
  };

  const computeTiers = {
    low: {
      name: 'Basic Statistical Analysis',
      cpuHours: '5-15',
      memoryGB: '16-32',
      storageGB: '50-150',
      costRange: '$20-60',
      processingTime: '2-6 hours',
      color: '#4CAF50',
    },
    medium: {
      name: 'Advanced Modeling',
      cpuHours: '15-50',
      memoryGB: '32-128',
      storageGB: '150-500',
      gpuHours: '5-25',
      costRange: '$60-200',
      processingTime: '6-24 hours',
      color: '#FF9800',
    },
    high: {
      name: 'Complex Simulation',
      cpuHours: '50-200',
      memoryGB: '128-512',
      storageGB: '500-2000',
      gpuHours: '25-100',
      costRange: '$200-800',
      processingTime: '1-7 days',
      color: '#f44336',
    },
  };

  const qualityMultiplierValues = {
    gold: {
      multiplier: 2.5,
      label: 'Gold Standard',
      description: 'Government agencies, research institutions',
    },
    silver: {
      multiplier: 1.8,
      label: 'Silver Standard',
      description: 'Commercial weather services, quality-controlled networks',
    },
    bronze: {
      multiplier: 1.2,
      label: 'Bronze Standard',
      description: 'Citizen science, IoT networks with validation',
    },
    base: {
      multiplier: 1.0,
      label: 'Base Standard',
      description: 'Standard meteorological observations',
    },
  };

  const calculateComputeEstimate = () => {
    if (!selectedRecipe) return;

    const recipe = recipeCategories
      .flatMap(cat => cat.recipes)
      .find(r => r.id === selectedRecipe);

    if (!recipe) return;

    const baseCost = parseFloat(recipe.baseCost.replace('$', ''));
    const selectedSources = Object.values(dataSelection);
    const sourceCosts = selectedSources.reduce((sum, sourceId) => {
      const allSources = Object.values(dataSourceOptions).flat();
      const source = allSources.find(s => s.id === sourceId);
      return sum + (source ? parseFloat(source.cost.replace('$', '')) : 0);
    }, 0);

    const qualityBonus = Object.values(qualityMultipliers).reduce(
      (max, quality) => {
        return Math.max(max, qualityMultiplierValues[quality]?.multiplier || 1);
      },
      1,
    );

    const totalCost = (baseCost + sourceCosts) * qualityBonus;
    const computeTier = computeTiers[recipe.complexity];

    setComputeEstimate({
      baseCost,
      sourceCosts,
      qualityBonus,
      totalCost,
      computeTier,
      recipe,
    });
  };

  useEffect(() => {
    calculateComputeEstimate();
  }, [selectedRecipe, dataSelection, qualityMultipliers]);

  const steps = [
    'Select Recipe Type',
    'Choose Data Sources',
    'Configure Quality',
    'Review & Estimate',
  ];

  const getRecipeByCategory = categoryName => {
    return recipeCategories.find(cat => cat.name === categoryName);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box textAlign="center" mb={4}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{ fontWeight: 'bold', color: '#1a237e' }}
        >
          NFT Recipe Builder
        </Typography>
        <Typography variant="h6" color="text.secondary" mb={4}>
          Design computational workflows from weather data to valuable NFTs
        </Typography>
      </Box>

      {/* Recipe Builder Stepper */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Stepper activeStep={activeStep} orientation="vertical">
            {/* Step 1: Select Recipe Type */}
            <Step>
              <StepLabel>
                <Typography variant="h6">Select Recipe Type</Typography>
              </StepLabel>
              <StepContent>
                <Grid container spacing={3}>
                  {recipeCategories.map(category => (
                    <Grid item xs={12} md={4} key={category.name}>
                      <Card sx={{ height: '100%' }}>
                        <CardContent>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              mb: 2,
                            }}
                          >
                            <Typography variant="h3" sx={{ mr: 1 }}>
                              {category.icon}
                            </Typography>
                            <Typography
                              variant="h6"
                              sx={{ fontWeight: 'bold' }}
                            >
                              {category.name}
                            </Typography>
                          </Box>

                          {category.recipes.map(recipe => (
                            <Card
                              key={recipe.id}
                              sx={{
                                mb: 2,
                                cursor: 'pointer',
                                border:
                                  selectedRecipe === recipe.id
                                    ? '2px solid #2196F3'
                                    : '1px solid #e0e0e0',
                                '&:hover': { boxShadow: 2 },
                              }}
                              onClick={() => setSelectedRecipe(recipe.id)}
                            >
                              <CardContent sx={{ p: 2 }}>
                                <Typography
                                  variant="subtitle1"
                                  sx={{ fontWeight: 'bold' }}
                                >
                                  {recipe.name}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ mb: 1 }}
                                >
                                  {recipe.description}
                                </Typography>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    gap: 1,
                                    flexWrap: 'wrap',
                                  }}
                                >
                                  <Chip
                                    label={recipe.complexity}
                                    size="small"
                                    color={
                                      recipe.complexity === 'high'
                                        ? 'error'
                                        : 'primary'
                                    }
                                  />
                                  <Chip
                                    label={recipe.baseCost}
                                    size="small"
                                    variant="outlined"
                                  />
                                </Box>
                              </CardContent>
                            </Card>
                          ))}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={() => setActiveStep(1)}
                    disabled={!selectedRecipe}
                  >
                    Continue to Data Sources
                  </Button>
                </Box>
              </StepContent>
            </Step>

            {/* Step 2: Choose Data Sources */}
            <Step>
              <StepLabel>
                <Typography variant="h6">Choose Data Sources</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body1" gutterBottom>
                  Select the data sources for your computational NFT:
                </Typography>

                {Object.entries(dataSourceOptions).map(
                  ([category, sources]) => (
                    <Accordion key={category} sx={{ mb: 2 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography
                          variant="h6"
                          sx={{ textTransform: 'capitalize' }}
                        >
                          {category} Data Sources
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          {sources.map(source => (
                            <Grid item xs={12} md={6} key={source.id}>
                              <Card
                                sx={{
                                  cursor: 'pointer',
                                  border:
                                    dataSelection[category] === source.id
                                      ? '2px solid #2196F3'
                                      : '1px solid #e0e0e0',
                                }}
                                onClick={() => {
                                  setDataSelection(prev => ({
                                    ...prev,
                                    [category]: source.id,
                                  }));
                                  setQualityMultipliers(prev => ({
                                    ...prev,
                                    [category]: source.quality,
                                  }));
                                }}
                              >
                                <CardContent sx={{ p: 2 }}>
                                  <Typography
                                    variant="subtitle1"
                                    sx={{ fontWeight: 'bold' }}
                                  >
                                    {source.name}
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                    <Chip
                                      label={
                                        qualityMultiplierValues[source.quality]
                                          ?.label
                                      }
                                      size="small"
                                      color="primary"
                                    />
                                    <Chip
                                      label={source.coverage}
                                      size="small"
                                      variant="outlined"
                                    />
                                    <Chip
                                      label={source.cost}
                                      size="small"
                                      variant="outlined"
                                    />
                                  </Box>
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  ),
                )}

                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={() => setActiveStep(2)}
                    sx={{ mr: 1 }}
                  >
                    Continue to Quality
                  </Button>
                  <Button onClick={() => setActiveStep(0)}>Back</Button>
                </Box>
              </StepContent>
            </Step>

            {/* Step 3: Configure Quality */}
            <Step>
              <StepLabel>
                <Typography variant="h6">
                  Configure Quality & Multipliers
                </Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body1" gutterBottom>
                  Review quality multipliers for your selected data sources:
                </Typography>

                <TableContainer component={Paper} sx={{ mb: 3 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Data Category</TableCell>
                        <TableCell>Quality Level</TableCell>
                        <TableCell>Multiplier</TableCell>
                        <TableCell>Description</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(qualityMultipliers).map(
                        ([category, quality]) => {
                          const qualityInfo = qualityMultiplierValues[quality];
                          return (
                            <TableRow key={category}>
                              <TableCell
                                sx={{
                                  textTransform: 'capitalize',
                                  fontWeight: 'bold',
                                }}
                              >
                                {category}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={qualityInfo?.label}
                                  color="primary"
                                />
                              </TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>
                                {qualityInfo?.multiplier}x
                              </TableCell>
                              <TableCell>{qualityInfo?.description}</TableCell>
                            </TableRow>
                          );
                        },
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={() => setActiveStep(3)}
                    sx={{ mr: 1 }}
                  >
                    Continue to Review
                  </Button>
                  <Button onClick={() => setActiveStep(1)}>Back</Button>
                </Box>
              </StepContent>
            </Step>

            {/* Step 4: Review & Estimate */}
            <Step>
              <StepLabel>
                <Typography variant="h6">Review & Cost Estimate</Typography>
              </StepLabel>
              <StepContent>
                {computeEstimate && (
                  <Grid container spacing={3}>
                    {/* Cost Breakdown */}
                    <Grid item xs={12} md={6}>
                      <Card>
                        <CardContent>
                          <Typography
                            variant="h6"
                            gutterBottom
                            sx={{ display: 'flex', alignItems: 'center' }}
                          >
                            <AttachMoneyIcon sx={{ mr: 1 }} />
                            Cost Breakdown
                          </Typography>

                          <Table size="small">
                            <TableBody>
                              <TableRow>
                                <TableCell>Base Processing</TableCell>
                                <TableCell align="right">
                                  ${computeEstimate.baseCost.toFixed(2)}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Data Sources</TableCell>
                                <TableCell align="right">
                                  ${computeEstimate.sourceCosts.toFixed(2)}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Quality Bonus</TableCell>
                                <TableCell align="right">
                                  {computeEstimate.qualityBonus.toFixed(1)}x
                                </TableCell>
                              </TableRow>
                              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                <TableCell sx={{ fontWeight: 'bold' }}>
                                  Total Estimated Cost
                                </TableCell>
                                <TableCell
                                  align="right"
                                  sx={{
                                    fontWeight: 'bold',
                                    fontSize: '1.2rem',
                                  }}
                                >
                                  ${computeEstimate.totalCost.toFixed(2)}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Compute Requirements */}
                    <Grid item xs={12} md={6}>
                      <Card>
                        <CardContent>
                          <Typography
                            variant="h6"
                            gutterBottom
                            sx={{ display: 'flex', alignItems: 'center' }}
                          >
                            <SpeedIcon sx={{ mr: 1 }} />
                            Compute Requirements
                          </Typography>

                          <Alert
                            severity="info"
                            sx={{
                              mb: 2,
                              bgcolor: computeEstimate.computeTier.color + '20',
                            }}
                          >
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: 'bold' }}
                            >
                              {computeEstimate.computeTier.name}
                            </Typography>
                            <Typography variant="body2">
                              Processing Time:{' '}
                              {computeEstimate.computeTier.processingTime}
                            </Typography>
                          </Alert>

                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Box sx={{ textAlign: 'center' }}>
                                <MemoryIcon
                                  sx={{ fontSize: 32, color: '#2196F3' }}
                                />
                                <Typography variant="caption" display="block">
                                  CPU Hours
                                </Typography>
                                <Typography variant="h6">
                                  {computeEstimate.computeTier.cpuHours}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ textAlign: 'center' }}>
                                <StorageIcon
                                  sx={{ fontSize: 32, color: '#4CAF50' }}
                                />
                                <Typography variant="caption" display="block">
                                  Memory
                                </Typography>
                                <Typography variant="h6">
                                  {computeEstimate.computeTier.memoryGB} GB
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Expected Output */}
                    <Grid item xs={12}>
                      <Card>
                        <CardContent>
                          <Typography
                            variant="h6"
                            gutterBottom
                            sx={{ display: 'flex', alignItems: 'center' }}
                          >
                            <TimelineIcon sx={{ mr: 1 }} />
                            Expected NFT Output
                          </Typography>

                          <Typography variant="body1" gutterBottom>
                            <strong>Business Value:</strong>{' '}
                            {computeEstimate.recipe.businessValue}
                          </Typography>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                            paragraph
                          >
                            Your computational NFT will include statistical
                            analysis, interactive visualizations, uncertainty
                            quantification, and business-ready insights. The
                            final output will be blockchain-verified with
                            embedded provenance data.
                          </Typography>

                          <Box
                            sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}
                          >
                            <Chip
                              icon={<CheckIcon />}
                              label="Statistical Metrics"
                              variant="outlined"
                            />
                            <Chip
                              icon={<CheckIcon />}
                              label="Interactive Visualizations"
                              variant="outlined"
                            />
                            <Chip
                              icon={<CheckIcon />}
                              label="Uncertainty Analysis"
                              variant="outlined"
                            />
                            <Chip
                              icon={<CheckIcon />}
                              label="Business Applications"
                              variant="outlined"
                            />
                            <Chip
                              icon={<CheckIcon />}
                              label="Blockchain Verified"
                              variant="outlined"
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                )}

                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    size="large"
                    color="success"
                    sx={{ mr: 2 }}
                  >
                    Create Computational NFT
                  </Button>
                  <Button onClick={() => setActiveStep(2)}>Back</Button>
                </Box>
              </StepContent>
            </Step>
          </Stepper>
        </CardContent>
      </Card>
    </Container>
  );
};

export default RecipeBuilder;
