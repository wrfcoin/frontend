import React, { useState, useEffect } from 'react';
import DemoSurfaceGate from '../common/DemoSurfaceGate';

// frontend#353: an animated walkthrough of computational-NFT creation with
// invented metrics. No backend route creates or processes these NFTs. The
// former "run" button advanced steps and a processing bar on timers, as if
// work were happening. The default build shows an honest not-live state. The
// demo build shows the static walkthrough with the run button disabled.
const SAMPLE_ACTION = 'Sample only: nothing is created or processed.';
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
  Chip,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon,
  CloudDownload as CloudDownloadIcon,
  Analytics as AnalyticsIcon,
  Token as TokenIcon,
  Public as PublicIcon,
} from '@mui/icons-material';

const EnterpriseDemoSample = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [demoRunning, setDemoRunning] = useState(false);
  const [metrics, setMetrics] = useState({
    dataPoints: 3004073,
    computePower: 12.4,
    accuracy: 98.7,
    countries: 167,
    processing: 0,
  });

  const enterpriseUseCases = [
    {
      title: 'Insurance Risk Assessment',
      icon: <BusinessIcon />,
      description: 'Transform climate risk into tradeable digital assets',
      benefits: [
        '45% reduction in risk assessment costs',
        'Real-time policy adjustments',
        'New revenue from risk portfolio trading',
        'Transparent regulatory compliance',
      ],
      roi: '250% ROI in first year',
      color: '#2196F3',
    },
    {
      title: 'Carbon Credit Verification',
      icon: <SecurityIcon />,
      description: 'World\'s most trusted carbon credit system',
      benefits: [
        'Eliminate double-counting fraud',
        'Real-time verification prevents manipulation',
        'Dynamic pricing based on actual impact',
        'Global trading platform interoperability',
      ],
      roi: '180% ROI in 18 months',
      color: '#4CAF50',
    },
    {
      title: 'Research Data Monetization',
      icon: <AnalyticsIcon />,
      description: 'Convert research datasets into valuable assets',
      benefits: [
        'Generate revenue from research data',
        'Increase citation impact',
        'Global verified data sharing',
        'Transparent peer review system',
      ],
      roi: '320% ROI in 2 years',
      color: '#FF9800',
    },
  ];

  const demoSteps = [
    {
      label: 'Real Data Collection',
      description:
        'Gathering authentic environmental data from global IoT networks',
      content: (
        <Box>
          <Typography variant="body2" gutterBottom>
            Collecting data from {metrics.dataPoints.toLocaleString()} real
            environmental sensors across {metrics.countries} countries.
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color="success" />
              </ListItemIcon>
              <ListItemText primary="The Things Network: 89,562 devices" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color="success" />
              </ListItemIcon>
              <ListItemText primary="FOAM Protocol: 4,829 location beacons" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color="success" />
              </ListItemIcon>
              <ListItemText primary="Helium Network: 150 hotspots" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color="success" />
              </ListItemIcon>
              <ListItemText primary="Bacalhau Compute: 847 nodes" />
            </ListItem>
          </List>
        </Box>
      ),
    },
    {
      label: 'Computational Analysis',
      description: 'Processing with 12.4 TFLOPS of distributed computing power',
      content: (
        <Box>
          <Typography variant="body2" gutterBottom>
            Running advanced climate analysis using distributed computing
            networks.
          </Typography>
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="caption">Processing Progress</Typography>
            <LinearProgress
              variant="determinate"
              value={metrics.processing}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Card sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                <Typography
                  variant="h4"
                  color="primary"
                  sx={{ fontWeight: 'bold' }}
                >
                  {metrics.computePower}
                </Typography>
                <Typography variant="caption">
                  TFLOPS Processing Power
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                <Typography
                  variant="h4"
                  color="secondary"
                  sx={{ fontWeight: 'bold' }}
                >
                  {metrics.accuracy}%
                </Typography>
                <Typography variant="caption">Data Accuracy</Typography>
              </Card>
            </Grid>
          </Grid>
        </Box>
      ),
    },
    {
      label: 'NFT Generation',
      description: 'Creating computational NFT with embedded analysis',
      content: (
        <Box>
          <Alert severity="info" sx={{ mb: 2 }}>
            Sample walkthrough: no NFT is generated. This step shows what a
            computational NFT would contain.
          </Alert>
          <Typography variant="body2" gutterBottom>
            Your NFT includes:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <TokenIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="Cryptographic verification of data authenticity" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <AnalyticsIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="Embedded climate analysis and insights" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <SecurityIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="Immutable blockchain provenance record" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <PublicIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="Global trading and verification capabilities" />
            </ListItem>
          </List>
        </Box>
      ),
    },
    {
      label: 'Enterprise Integration',
      description: 'Ready for enterprise systems and trading platforms',
      content: (
        <Box>
          <Typography variant="body2" gutterBottom sx={{ mb: 2 }}>
            Your computational NFT is now ready for enterprise integration:
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 2, textAlign: 'center' }}>
                <BusinessIcon sx={{ fontSize: 40, color: '#2196F3', mb: 1 }} />
                <Typography variant="h6" gutterBottom>
                  Insurance APIs
                </Typography>
                <Typography variant="caption">
                  Direct integration with risk assessment systems
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 2, textAlign: 'center' }}>
                <TrendingUpIcon
                  sx={{ fontSize: 40, color: '#4CAF50', mb: 1 }}
                />
                <Typography variant="h6" gutterBottom>
                  Trading Platforms
                </Typography>
                <Typography variant="caption">
                  Ready for carbon credit and asset markets
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 2, textAlign: 'center' }}>
                <SpeedIcon sx={{ fontSize: 40, color: '#FF9800', mb: 1 }} />
                <Typography variant="h6" gutterBottom>
                  Real-time Updates
                </Typography>
                <Typography variant="caption">
                  Dynamic NFT updates with new environmental data
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Box>
      ),
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box textAlign="center" mb={6}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{ fontWeight: 'bold', color: '#1a237e' }}
        >
          Enterprise Computational NFT Demo
        </Typography>
        <Typography variant="h6" color="text.secondary" mb={4}>
          Transform Real Environmental Data into Enterprise-Grade Digital Assets
        </Typography>

        <Alert severity="info" sx={{ mb: 4, textAlign: 'left' }}>
          <Typography variant="body2">
            <strong>Live Demo Status:</strong> This demonstration uses authentic
            environmental data from real IoT networks including The Things
            Network, FOAM Protocol, Helium, and Bacalhau distributed computing.
          </Typography>
        </Alert>
      </Box>

      {/* Enterprise Use Cases */}
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Enterprise Use Cases
      </Typography>

      <Grid container spacing={4} mb={6}>
        {enterpriseUseCases.map((useCase, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card sx={{ height: '100%', position: 'relative' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ color: useCase.color, mr: 1 }}>{useCase.icon}</Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {useCase.title}
                  </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" mb={2}>
                  {useCase.description}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Typography
                  variant="subtitle2"
                  gutterBottom
                  sx={{ fontWeight: 'bold' }}
                >
                  Key Benefits:
                </Typography>
                <List dense>
                  {useCase.benefits.map((benefit, idx) => (
                    <ListItem key={idx} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckCircleIcon
                          sx={{ fontSize: 16, color: useCase.color }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={benefit}
                        primaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                </List>

                <Chip
                  label={useCase.roi}
                  sx={{
                    mt: 2,
                    bgcolor: useCase.color + '20',
                    color: useCase.color,
                    fontWeight: 'bold',
                  }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Interactive Demo */}
      <Card sx={{ mb: 6 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 4,
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              Live Computational NFT Creation
            </Typography>
            <Button
              variant="contained"
              disabled
              title={SAMPLE_ACTION}
              startIcon={<CloudDownloadIcon />}
              size="large"
            >
              {demoRunning ? 'Running Demo...' : 'Start Full Demo'}
            </Button>
          </Box>

          <Stepper activeStep={activeStep} orientation="vertical">
            {demoSteps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {step.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>
                </StepLabel>
                <StepContent>
                  {step.content}
                  {index < demoSteps.length - 1 && (
                    <Box sx={{ mt: 2, mb: 1 }}>
                      <Button
                        variant="contained"
                        disabled
                        title={SAMPLE_ACTION}
                        sx={{ mr: 1 }}
                      >
                        Continue
                      </Button>
                      <Button disabled title={SAMPLE_ACTION}>
                        Reset Demo
                      </Button>
                    </Box>
                  )}
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* Enterprise Metrics */}
      <Card
        sx={{
          bgcolor: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
          color: 'white',
        }}
      >
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
            Enterprise-Grade Performance
          </Typography>
          <Grid container spacing={4} sx={{ mt: 2 }}>
            <Grid item xs={12} md={3}>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                50K
              </Typography>
              <Typography variant="body1">TPS Processing</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                99.9%
              </Typography>
              <Typography variant="body1">Uptime SLA</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                $2.5B
              </Typography>
              <Typography variant="body1">Market Addressable</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                45%
              </Typography>
              <Typography variant="body1">Cost Reduction</Typography>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4 }}>
            <Button
              variant="contained"
              size="large"
              sx={{
                bgcolor: 'white',
                color: '#2196F3',
                mr: 2,
                '&:hover': { bgcolor: '#f5f5f5' },
              }}
            >
              Schedule Enterprise Demo
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{
                borderColor: 'white',
                color: 'white',
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              Download Technical Specs
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

const EnterpriseDemo = () => (
  <DemoSurfaceGate
    title="Enterprise computational NFTs are not live on the testnet"
    description="No testnet endpoint creates or processes computational NFTs yet."
    testId="nft-enterprise-demo"
  >
    <EnterpriseDemoSample />
  </DemoSurfaceGate>
);

export default EnterpriseDemo;
