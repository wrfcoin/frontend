import React, { useState, useEffect } from 'react';
import AIModelDashboard from './AIModelDashboard';
import FEATURES from '../../config/features';
import PublicViewerNotice from '../common/PublicViewerNotice';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Storage as StorageIcon,
  Computer as ComputeIcon,
  Sensors as SensorsIcon,
  Cloud as CloudIcon,
  Memory as MemoryIcon,
  Speed as SpeedIcon,
  Refresh as RefreshIcon,
  AccountTree as CrossChainIcon,
} from '@mui/icons-material';

// frontend#304: the provider, compute, IoT, AI/ML and cross-chain tables in
// this dashboard are hard-coded catalogues with invented node counts,
// capacities and reliability figures; the only fetch (/api/flux/status) has
// no mounted backend route. Sample tables render only under the demo-surface
// policy; otherwise the honest not-live state renders.
const SHOW_SAMPLE = () => FEATURES.demoSurfaces;

const InfrastructureCapacityDashboardSample = () => {
  const [tabValue, setTabValue] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [fluxData, setFluxData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch live Flux data
  useEffect(() => {
    fetchFluxData();
  }, []);

  const fetchFluxData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/flux/status');
      if (response.ok) {
        const data = await response.json();
        setFluxData(data);
      }
    } catch (error) {
      console.error('Failed to fetch Flux data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cross-chain protocol networks data
  const crossChainNetworks = [
    {
      protocol: 'LayerZero',
      type: 'Omnichain Protocol',
      supportedChains: 70,
      totalValueLocked: '$8.2B',
      monthlyTransactions: '2.1M',
      bridgeReliability: '99.9%',
      avgConfirmationTime: '2.3 min',
      status: 'Active',
    },
    {
      protocol: 'Axelar',
      type: 'Universal Interoperability',
      supportedChains: 55,
      totalValueLocked: '$1.8B',
      monthlyTransactions: '890K',
      bridgeReliability: '99.7%',
      avgConfirmationTime: '4.7 min',
      status: 'Active',
    },
    {
      protocol: 'Wormhole',
      type: 'Cross-Chain Messaging',
      supportedChains: 30,
      totalValueLocked: '$2.4B',
      monthlyTransactions: '1.5M',
      bridgeReliability: '99.8%',
      avgConfirmationTime: '3.1 min',
      status: 'Active',
    },
    {
      protocol: 'Chainlink CCIP',
      type: 'Cross-Chain Protocol',
      supportedChains: 12,
      totalValueLocked: '$950M',
      monthlyTransactions: '450K',
      bridgeReliability: '99.9%',
      avgConfirmationTime: '1.8 min',
      status: 'Active',
    },
    {
      protocol: 'Cosmos IBC',
      type: 'Inter-Blockchain Communication',
      supportedChains: 50,
      totalValueLocked: '$1.2B',
      monthlyTransactions: '780K',
      bridgeReliability: '99.6%',
      avgConfirmationTime: '5.2 min',
      status: 'Active',
    },
  ];

  // Real data from our integrated networks
  const fileStorageProviders = [
    {
      provider: 'Wrfcoin Native Storage',
      network: 'Wrfcoin Blockchain',
      nodes: 1247,
      totalCapacity: '2.4 TB',
      availableCapacity: '1.8 TB',
      utilizationRate: '25.0%',
      reliability: '98.2%',
      regions: 23,
      status: 'Testing',
      avgLatency: '89ms',
      rewardMultiplier: '3.5x',
      nativeProvider: true,
      description: 'Enhanced rewards for Wrfcoin users providing storage',
    },
    {
      provider: 'Storj',
      network: 'Storj DCS',
      nodes: 89,
      totalCapacity: '847 TB',
      availableCapacity: '612 TB',
      utilizationRate: '27.7%',
      reliability: '99.8%',
      regions: 45,
      status: 'Active',
      avgLatency: '245ms',
    },
    {
      provider: 'Arweave',
      network: 'Arweave Permaweb',
      nodes: 156,
      totalCapacity: '∞ (Permanent)',
      availableCapacity: '∞',
      utilizationRate: '12.4%',
      reliability: '99.9%',
      regions: 'Global',
      status: 'Active',
      avgLatency: '892ms',
    },
    {
      provider: 'IPFS',
      network: 'IPFS Network',
      nodes: 3247,
      totalCapacity: '2.4 PB',
      availableCapacity: '1.8 PB',
      utilizationRate: '25.0%',
      reliability: '98.7%',
      regions: 78,
      status: 'Active',
      avgLatency: '156ms',
    },
    {
      provider: 'Walrus Protocol',
      network: 'Sui Blockchain',
      nodes: 64,
      totalCapacity: '128 TB',
      availableCapacity: '89 TB',
      utilizationRate: '30.5%',
      reliability: '99.4%',
      regions: 12,
      status: 'Active',
      avgLatency: '134ms',
    },
    {
      provider: 'BigchainDB',
      network: 'BigchainDB Network',
      nodes: 23,
      totalCapacity: '456 TB',
      availableCapacity: '298 TB',
      utilizationRate: '34.6%',
      reliability: '98.9%',
      regions: 8,
      status: 'Active',
      avgLatency: '298ms',
    },
    {
      provider: 'Filecoin',
      network: 'Filecoin Network',
      nodes: 4156,
      totalCapacity: '24.6 PB',
      availableCapacity: '6.6 PB',
      utilizationRate: '73.1%',
      reliability: '99.3%',
      regions: 'Global',
      status: 'Active',
      avgLatency: '1.2s',
    },
    {
      provider: 'Sia Foundation',
      network: 'Sia Network',
      nodes: 2847,
      totalCapacity: '8.9 PB',
      availableCapacity: '5.5 PB',
      utilizationRate: '38.7%',
      reliability: '97.8%',
      regions: 'Global',
      status: 'Active',
      avgLatency: '850ms',
    },
  ];

  const computeProviders = [
    {
      provider: 'Wrfcoin Native Compute',
      network: 'Wrfcoin Blockchain',
      nodes: 2847,
      totalTFLOPS: 24.7,
      availableTFLOPS: 18.9,
      cpuCores: 113880,
      gpuCount: 456,
      memoryGB: 569600,
      utilizationRate: '23.5%',
      reliability: '98.4%',
      status: 'Testing',
      jobsCompleted: 8947,
      rewardMultiplier: '2.8x',
      nativeProvider: true,
      description: 'Enhanced rewards for Wrfcoin users providing compute power',
    },
    {
      provider: 'TatauCloud',
      network: 'TatauCloud Compute',
      nodes: 8400,
      totalTFLOPS: 145,
      availableTFLOPS: 89,
      cpuCores: 336000,
      gpuCount: 8400,
      memoryGB: 1344000,
      utilizationRate: '38.6%',
      reliability: '98.9%',
      status: 'Active',
      jobsCompleted: 15634,
    },
    {
      provider: 'Bacalhau',
      network: 'Bacalhau Compute',
      nodes: 847,
      totalTFLOPS: 12.4,
      availableTFLOPS: 8.9,
      cpuCores: 33880,
      gpuCount: 456,
      memoryGB: 169600,
      utilizationRate: '28.2%',
      reliability: '98.7%',
      status: 'Active',
      jobsCompleted: 28394,
    },
    {
      provider: 'Render Network',
      network: 'RNDR',
      nodes: 127,
      totalTFLOPS: 14.2,
      availableTFLOPS: 11.7,
      cpuCores: 5080,
      gpuCount: 127,
      memoryGB: 20320,
      utilizationRate: '17.6%',
      reliability: '99.1%',
      status: 'Active',
      jobsCompleted: 12847,
    },
    {
      provider: 'Golem',
      network: 'Golem Network',
      nodes: 289,
      totalTFLOPS: 8.9,
      availableTFLOPS: 6.4,
      cpuCores: 11560,
      gpuCount: 89,
      memoryGB: 46240,
      utilizationRate: '28.1%',
      reliability: '97.8%',
      status: 'Active',
      jobsCompleted: 19283,
    },
    {
      provider: 'Akash Network',
      network: 'Akash',
      nodes: 67,
      totalTFLOPS: 4.7,
      availableTFLOPS: 3.2,
      cpuCores: 2680,
      gpuCount: 34,
      memoryGB: 10720,
      utilizationRate: '31.9%',
      reliability: '98.3%',
      status: 'Active',
      jobsCompleted: 8947,
    },
    {
      provider: 'SONM',
      network: 'SONM Fog Computing',
      nodes: 234,
      totalTFLOPS: 6.8,
      availableTFLOPS: 4.9,
      cpuCores: 9360,
      gpuCount: 67,
      memoryGB: 37440,
      utilizationRate: '27.9%',
      reliability: '97.2%',
      status: 'Active',
      jobsCompleted: 15672,
    },
    {
      provider: 'iExec',
      network: 'iExec RLC Network',
      nodes: 2847,
      totalTFLOPS: 34.7,
      availableTFLOPS: 26.4,
      cpuCores: 113880,
      gpuCount: 1847,
      memoryGB: 455520,
      utilizationRate: '23.9%',
      reliability: '98.8%',
      status: 'Active',
      jobsCompleted: 89234,
    },
    {
      provider: 'Internet Computer Protocol',
      network: 'ICP',
      nodes: 486,
      totalTFLOPS: 18.7,
      availableTFLOPS: 14.2,
      cpuCores: 19440,
      gpuCount: 0,
      memoryGB: 155520,
      utilizationRate: '24.1%',
      reliability: '99.7%',
      status: 'Active',
      jobsCompleted: 156892,
    },
    {
      provider: 'Flux Network',
      network: 'Flux Mainnet',
      nodes: fluxData?.activeNodes || 2847,
      totalTFLOPS: fluxData?.totalTFLOPS || 78.5,
      availableTFLOPS: fluxData?.availableTFLOPS || 52.3,
      cpuCores: 45680,
      gpuCount: fluxData?.gpuNodes || 456,
      memoryGB: 182000,
      utilizationRate: '34.4%',
      reliability: fluxData?.uptime ? `${fluxData.uptime}%` : '99.7%',
      status: 'Active',
      jobsCompleted: 28934,
    },
    {
      provider: 'AIOZ Network',
      network: 'AIOZ dCDN',
      nodes: 1156,
      totalTFLOPS: 15.7,
      availableTFLOPS: 11.8,
      cpuCores: 46240,
      gpuCount: 234,
      memoryGB: 184960,
      utilizationRate: '24.8%',
      reliability: '99.1%',
      status: 'Active',
      jobsCompleted: 18947,
    },
  ];

  const iotSensorNetworks = [
    {
      network: 'Wrfcoin Native IoT',
      type: 'Blockchain IoT',
      gateways: 3847,
      sensors: {
        weatherStations: 89456,
        airQuality: 67234,
        temperature: 123789,
        humidity: 98123,
        environmentalMonitors: 45678,
        total: 424280,
      },
      coverage: '94 countries',
      dailyReadings: '1.2M',
      dataReliability: '98.9%',
      status: 'Testing',
      rewardMultiplier: '4.2x',
      nativeProvider: true,
      description:
        'Premium rewards for Wrfcoin users providing IoT sensor data',
    },
    {
      network: 'The Things Network (TTN)',
      type: 'LoRaWAN',
      gateways: 12847,
      sensors: {
        temperature: 456789,
        humidity: 423156,
        airQuality: 489234,
        weatherStations: 445678,
        total: 1814857,
      },
      coverage: '167 countries',
      dailyReadings: '3.1M',
      dataReliability: '98.7%',
      status: 'Active',
    },
    {
      network: 'Helium Network',
      type: 'IoT Hotspots',
      gateways: 150,
      sensors: {
        temperature: 67890,
        locationBeacons: 45678,
        environmentalMonitors: 23456,
        assetTrackers: 34567,
        total: 171591,
      },
      coverage: '89 regions',
      dailyReadings: '178K',
      dataReliability: '99.2%',
      status: 'Active',
    },
    {
      network: 'FOAM Protocol',
      type: 'Location Verification',
      gateways: 4829,
      sensors: {
        locationBeacons: 4829,
        verifiedLocations: 2847923,
        proofOfLocation: 1894756,
        total: 4747508,
      },
      coverage: 'Global',
      dailyReadings: '847K',
      dataReliability: '99.8%',
      status: 'Active',
    },
    {
      network: 'IOTA Tangle',
      type: 'IoT Data Integrity',
      gateways: 1247,
      sensors: {
        iotDevices: 89456,
        dataStreams: 156789,
        verifiedTransactions: 2847291,
        climateSensors: 67234,
        total: 3160770,
      },
      coverage: '94 countries',
      dailyReadings: '2.8M',
      dataReliability: '99.5%',
      status: 'Active',
    },
    {
      network: 'Sensor.Community',
      type: 'Air Quality',
      gateways: 789,
      sensors: {
        pm25Sensors: 45678,
        pm10Sensors: 34567,
        temperatureSensors: 23456,
        humiditySensors: 12345,
        total: 116046,
      },
      coverage: '78 countries',
      dailyReadings: '234K',
      dataReliability: '97.9%',
      status: 'Active',
    },
    {
      network: 'Streamr Network',
      type: 'Real-time Data',
      gateways: 234,
      sensors: {
        dataStreams: 156789,
        environmentalSensors: 67890,
        weatherStations: 34567,
        mobileSensors: 23456,
        total: 282702,
      },
      coverage: '45 cities',
      dailyReadings: '567K',
      dataReliability: '98.4%',
      status: 'Active',
    },
    {
      network: 'Open Geospatial Consortium (OGC)',
      type: 'Geospatial Standards',
      gateways: 847,
      sensors: {
        weatherObservations: 234567,
        geospatialServices: 45678,
        sensorThings: 123456,
        complianceValidators: 12345,
        total: 416046,
      },
      coverage: 'Global Standards',
      dailyReadings: '1.2M',
      dataReliability: '99.9%',
      status: 'Active',
    },
    {
      network: 'OpenForis',
      type: 'Forest Monitoring Platform',
      gateways: 2345,
      sensors: {
        forestSurveys: 8947,
        biodiversityAssessments: 1234,
        carbonMeasurements: 567,
        landUseAnalysis: 890,
        total: 11638,
      },
      coverage: '89 countries',
      dailyReadings: '245K',
      dataReliability: '97.4%',
      status: 'Active',
    },
    {
      network: 'OpenAQ',
      type: 'Air Quality Data Network',
      gateways: 12847,
      sensors: {
        pm25Sensors: 45678,
        pm10Sensors: 34567,
        no2Sensors: 23456,
        o3Sensors: 12345,
        total: 116046,
      },
      coverage: '94 countries',
      dailyReadings: '1.8M',
      dataReliability: '98.7%',
      status: 'Active',
    },
    {
      network: 'IoTeX',
      type: 'Decentralized IoT Infrastructure',
      gateways: 1847,
      sensors: {
        iotDevices: 156789,
        environmentalSensors: 89456,
        weatherStations: 34567,
        airQualitySensors: 23456,
        total: 304268,
      },
      coverage: '78 countries',
      dailyReadings: '987K',
      dataReliability: '98.9%',
      status: 'Active',
    },
  ];

  // AI/ML Network Integrations - Real data from our integrated networks
  const aiMlNetworks = [
    {
      network: 'Bittensor',
      type: 'Decentralized AI',
      subnets: 32,
      miners: 12847,
      validators: 256,
      taoStaked: '847K TAO',
      aiModels: {
        textGeneration: 1247,
        imageGeneration: 567,
        dataAnalysis: 892,
        environmentalAI: 234,
        total: 2940,
      },
      networkHealth: '98.7%',
      incentiveTokens: '15.6K TAO/day',
      status: 'Active',
    },
    {
      network: 'Near Protocol',
      type: 'Scalable Blockchain AI',
      validators: 100,
      shards: 4,
      tps: 100000,
      blockHeight: 108567234,
      aiServices: {
        smartContracts: 8947,
        aiDapps: 456,
        mlModels: 1247,
        climatePrediction: 89,
        total: 10739,
      },
      networkHealth: '99.2%',
      nearStaked: '156M NEAR',
      status: 'Active',
    },
    {
      network: 'Fetch.ai',
      type: 'Autonomous Economic Agents',
      agents: 23456,
      activeSessions: 8947,
      validators: 100,
      marketplaceServices: {
        dataProcessing: 2456,
        weatherAnalysis: 567,
        predictiveModels: 892,
        autonomousAgents: 1247,
        total: 5162,
      },
      networkHealth: '97.8%',
      fetStaked: '2.1B FET',
      status: 'Active',
    },
    {
      network: 'SingularityNET',
      type: 'Decentralized AI Marketplace',
      aiServices: 1847,
      activeAgents: 15634,
      developers: 2456,
      marketplaceMetrics: {
        aiModels: 3456,
        dataProcessingServices: 1234,
        environmentalAI: 567,
        climateAnalysis: 345,
        total: 5602,
      },
      networkHealth: '98.9%',
      agixStaked: '456M AGIX',
      status: 'Active',
    },
  ];

  // Cross-Chain Protocol Integrations - Real data from our integrated networks
  const crossChainProtocols = [
    {
      protocol: 'LayerZero',
      type: 'Omnichain Interoperability',
      supportedChains: 60,
      totalMessages: '2.4M',
      dailyVolume: '$89.2M',
      avgLatency: '15s',
      successRate: '99.7%',
      gasEfficiency: 'Ultra-low',
      status: 'Active',
    },
    {
      protocol: 'Axelar Network',
      type: 'Cross-Chain Gateway',
      supportedChains: 45,
      totalMessages: '1.8M',
      dailyVolume: '$67.4M',
      avgLatency: '12s',
      successRate: '99.2%',
      gasEfficiency: 'Optimized',
      status: 'Active',
    },
    {
      protocol: 'Wormhole',
      type: 'Cross-Chain Bridge',
      supportedChains: 30,
      totalMessages: '3.2M',
      dailyVolume: '$156.8M',
      avgLatency: '8s',
      successRate: '99.9%',
      gasEfficiency: 'High',
      status: 'Active',
    },
    {
      protocol: 'Chainlink CCIP',
      type: 'Cross-Chain Infrastructure',
      supportedChains: 25,
      totalMessages: '1.2M',
      dailyVolume: '$34.6M',
      avgLatency: '18s',
      successRate: '99.8%',
      gasEfficiency: 'Standard',
      status: 'Active',
    },
    {
      protocol: 'IBC (Cosmos)',
      type: 'Inter-Blockchain Communication',
      supportedChains: 50,
      totalMessages: '4.1M',
      dailyVolume: '$78.9M',
      avgLatency: '6s',
      successRate: '99.6%',
      gasEfficiency: 'Very High',
      status: 'Active',
    },
    {
      protocol: 'ILPv4 (Interledger)',
      type: 'Payment Network Protocol',
      supportedChains: 15,
      totalMessages: '567K',
      dailyVolume: '$12.3M',
      avgLatency: '3s',
      successRate: '99.9%',
      gasEfficiency: 'Minimal',
      status: 'Active',
    },
    {
      protocol: 'XCMP (Polkadot)',
      type: 'Cross-Consensus Messaging',
      supportedChains: 35,
      totalMessages: '892K',
      dailyVolume: '$23.7M',
      avgLatency: '4s',
      successRate: '99.8%',
      gasEfficiency: 'High',
      status: 'Active',
    },
    {
      protocol: 'NEAR Rainbow Bridge',
      type: 'Trustless Bridge',
      supportedChains: 8,
      totalMessages: '345K',
      dailyVolume: '$18.4M',
      avgLatency: '25s',
      successRate: '99.5%',
      gasEfficiency: 'Standard',
      status: 'Active',
    },
    {
      protocol: 'Optimism Bridge',
      type: 'Layer 2 Bridge',
      supportedChains: 5,
      totalMessages: '1.7M',
      dailyVolume: '$245.6M',
      avgLatency: '7 days (security)',
      successRate: '100%',
      gasEfficiency: 'Very High',
      status: 'Active',
    },
    {
      protocol: 'THORChain',
      type: 'Cross-Chain DEX',
      supportedChains: 12,
      totalMessages: '234K',
      dailyVolume: '$45.2M',
      avgLatency: '120s',
      successRate: '99.1%',
      gasEfficiency: 'Medium',
      status: 'Active',
    },
    {
      protocol: 'ChainFlip',
      type: 'Cross-Chain AMM',
      supportedChains: 8,
      totalMessages: '156K',
      dailyVolume: '$28.9M',
      avgLatency: '90s',
      successRate: '98.9%',
      gasEfficiency: 'Medium',
      status: 'Active',
    },
    {
      protocol: 'Base Bridge',
      type: 'Coinbase L2 Bridge',
      supportedChains: 3,
      totalMessages: '987K',
      dailyVolume: '$134.7M',
      avgLatency: '7 days (security)',
      successRate: '100%',
      gasEfficiency: 'Very High',
      status: 'Active',
    },
    {
      protocol: 'Celer Network',
      type: 'Layer 2 Scaling',
      supportedChains: 40,
      totalMessages: '2.8M',
      dailyVolume: '$92.4M',
      avgLatency: '10s',
      successRate: '99.4%',
      gasEfficiency: 'High',
      status: 'Active',
    },
  ];

  const capacitySummary = {
    totalStorageCapacity: '36.9 PB',
    totalComputeCapacity: '40.5 TFLOPS',
    totalSensors: '7,132,704',
    totalNetworks: 20,
    globalCoverage: '167 countries',
    averageReliability: '98.6%',
    crossChainNetworks: '85 Unique Chains / 13 Protocols',
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleRefresh = () => {
    setLastUpdated(new Date());
  };

  const getStatusColor = status => {
    switch (status) {
    case 'Active':
      return 'success';
    case 'Testing':
      return 'info';
    case 'Degraded':
      return 'warning';
    case 'Offline':
      return 'error';
    default:
      return 'default';
    }
  };

  const getUtilizationColor = rate => {
    const numRate = parseFloat(rate);
    if (numRate < 30) return 'success';
    if (numRate < 70) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Infrastructure Capacity Dashboard
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="caption" color="textSecondary">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </Typography>
          <Tooltip title="Refresh Data">
            <IconButton onClick={handleRefresh} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={1.7}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <StorageIcon
                sx={{ fontSize: 35, color: 'primary.main', mb: 1 }}
              />
              <Typography
                variant="h6"
                component="div"
                sx={{ fontSize: '1rem' }}
              >
                {capacitySummary.totalStorageCapacity}
              </Typography>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ fontSize: '0.75rem' }}
              >
                Total Storage
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={1.7}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <ComputeIcon
                sx={{ fontSize: 35, color: 'success.main', mb: 1 }}
              />
              <Typography
                variant="h6"
                component="div"
                sx={{ fontSize: '1rem' }}
              >
                {capacitySummary.totalComputeCapacity}
              </Typography>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ fontSize: '0.75rem' }}
              >
                Total Compute
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={1.7}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <SensorsIcon
                sx={{ fontSize: 35, color: 'warning.main', mb: 1 }}
              />
              <Typography
                variant="h6"
                component="div"
                sx={{ fontSize: '1rem' }}
              >
                {capacitySummary.totalSensors}
              </Typography>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ fontSize: '0.75rem' }}
              >
                Total Sensors
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={1.3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <CloudIcon sx={{ fontSize: 35, color: 'info.main', mb: 1 }} />
              <Typography
                variant="h6"
                component="div"
                sx={{ fontSize: '1rem' }}
              >
                {capacitySummary.totalNetworks}
              </Typography>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ fontSize: '0.75rem' }}
              >
                Networks
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={1.8}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <SpeedIcon
                sx={{ fontSize: 35, color: 'secondary.main', mb: 1 }}
              />
              <Typography
                variant="h6"
                component="div"
                sx={{ fontSize: '1rem' }}
              >
                {capacitySummary.globalCoverage}
              </Typography>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ fontSize: '0.75rem' }}
              >
                Global Coverage
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={1.5}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <MemoryIcon sx={{ fontSize: 35, color: 'error.main', mb: 1 }} />
              <Typography
                variant="h6"
                component="div"
                sx={{ fontSize: '1rem' }}
              >
                {capacitySummary.averageReliability}
              </Typography>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ fontSize: '0.75rem' }}
              >
                Avg Reliability
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={1.8}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <CrossChainIcon sx={{ fontSize: 35, color: 'purple', mb: 1 }} />
              <Typography
                variant="h6"
                component="div"
                sx={{ lineHeight: 1.1, fontSize: '0.9rem' }}
              >
                85 Chains
                <br />
                13 Protocols
              </Typography>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ fontSize: '0.75rem' }}
              >
                Cross-Chain Network
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabbed Content */}
      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
          <Tab label="File Storage Providers" />
          <Tab label="Distributed Compute Providers" />
          <Tab label="IoT Sensor Networks" />
          <Tab label="AI/ML Networks" />
          <Tab label="Cross-Chain Protocols" />
        </Tabs>

        {/* File Storage Providers Tab */}
        {tabValue === 0 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Provider</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Network</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Nodes</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Total Capacity</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Available</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Utilization</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Reliability</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Regions</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Latency</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Status</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fileStorageProviders.map((provider, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      backgroundColor: provider.nativeProvider
                        ? 'rgba(25, 118, 210, 0.04)'
                        : 'inherit',
                    }}
                  >
                    <TableCell>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Typography variant="body2">
                          {provider.provider}
                        </Typography>
                        {provider.nativeProvider && (
                          <Chip
                            label={`${provider.rewardMultiplier} Rewards`}
                            color="success"
                            size="small"
                            sx={{ fontSize: '0.7rem', height: '20px' }}
                          />
                        )}
                      </Box>
                      {provider.description && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', fontSize: '0.7rem' }}
                        >
                          {provider.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{provider.network}</TableCell>
                    <TableCell>
                      {provider.nodes ? provider.nodes.toLocaleString() : 'N/A'}
                    </TableCell>
                    <TableCell>{provider.totalCapacity}</TableCell>
                    <TableCell>{provider.availableCapacity}</TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <LinearProgress
                          variant="determinate"
                          value={parseFloat(provider.utilizationRate)}
                          color={getUtilizationColor(provider.utilizationRate)}
                          sx={{ width: 60, height: 6 }}
                        />
                        <Typography variant="body2">
                          {provider.utilizationRate}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{provider.reliability}</TableCell>
                    <TableCell>{provider.regions}</TableCell>
                    <TableCell>{provider.avgLatency}</TableCell>
                    <TableCell>
                      <Chip
                        label={provider.status}
                        color={getStatusColor(provider.status)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Distributed Compute Providers Tab */}
        {tabValue === 1 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Provider</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Network</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Nodes</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Total TFLOPS</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Available TFLOPS</strong>
                  </TableCell>
                  <TableCell>
                    <strong>CPU Cores</strong>
                  </TableCell>
                  <TableCell>
                    <strong>GPUs</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Memory (GB)</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Utilization</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Jobs Completed</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Status</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {computeProviders.map((provider, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      backgroundColor: provider.nativeProvider
                        ? 'rgba(25, 118, 210, 0.04)'
                        : 'inherit',
                    }}
                  >
                    <TableCell>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Typography variant="body2">
                          {provider.provider}
                        </Typography>
                        {provider.nativeProvider && (
                          <Chip
                            label={`${provider.rewardMultiplier} Rewards`}
                            color="success"
                            size="small"
                            sx={{ fontSize: '0.7rem', height: '20px' }}
                          />
                        )}
                      </Box>
                      {provider.description && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', fontSize: '0.7rem' }}
                        >
                          {provider.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{provider.network}</TableCell>
                    <TableCell>
                      {provider.nodes ? provider.nodes.toLocaleString() : 'N/A'}
                    </TableCell>
                    <TableCell>{provider.totalTFLOPS}</TableCell>
                    <TableCell>{provider.availableTFLOPS}</TableCell>
                    <TableCell>
                      {provider.cpuCores
                        ? provider.cpuCores.toLocaleString()
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {provider.gpuCount
                        ? provider.gpuCount.toLocaleString()
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {provider.memoryGB
                        ? provider.memoryGB.toLocaleString()
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <LinearProgress
                          variant="determinate"
                          value={parseFloat(provider.utilizationRate)}
                          color={getUtilizationColor(provider.utilizationRate)}
                          sx={{ width: 60, height: 6 }}
                        />
                        <Typography variant="body2">
                          {provider.utilizationRate}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {provider.jobsCompleted
                        ? provider.jobsCompleted.toLocaleString()
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={provider.status}
                        color={getStatusColor(provider.status)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* IoT Sensor Networks Tab */}
        {tabValue === 2 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Network</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Type</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Gateways</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Sensor Breakdown</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Total Sensors</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Coverage</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Daily Readings</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Reliability</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Status</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {iotSensorNetworks.map((network, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      backgroundColor: network.nativeProvider
                        ? 'rgba(25, 118, 210, 0.04)'
                        : 'inherit',
                    }}
                  >
                    <TableCell>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Typography variant="body2">
                          {network.network}
                        </Typography>
                        {network.nativeProvider && (
                          <Chip
                            label={`${network.rewardMultiplier} Rewards`}
                            color="success"
                            size="small"
                            sx={{ fontSize: '0.7rem', height: '20px' }}
                          />
                        )}
                      </Box>
                      {network.description && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', fontSize: '0.7rem' }}
                        >
                          {network.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{network.type}</TableCell>
                    <TableCell>{network.gateways.toLocaleString()}</TableCell>
                    <TableCell>
                      <Box>
                        {Object.entries(network.sensors)
                          .filter(([key]) => key !== 'total')
                          .map(([key, value]) => (
                            <Typography
                              key={key}
                              variant="caption"
                              display="block"
                            >
                              {key.charAt(0).toUpperCase() + key.slice(1)}:{' '}
                              {value.toLocaleString()}
                            </Typography>
                          ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <strong>{network.sensors.total.toLocaleString()}</strong>
                    </TableCell>
                    <TableCell>{network.coverage}</TableCell>
                    <TableCell>{network.dailyReadings}</TableCell>
                    <TableCell>{network.dataReliability}</TableCell>
                    <TableCell>
                      <Chip
                        label={network.status}
                        color={getStatusColor(network.status)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* AI/ML Networks Tab */}
        {tabValue === 3 && (
          <Box>
            <AIModelDashboard />

            {/* Network Infrastructure Details */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  AI/ML Network Infrastructure
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <strong>Network</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Type</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Validators/Miners</strong>
                        </TableCell>
                        <TableCell>
                          <strong>AI Services</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Network Health</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Staked Tokens</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Status</strong>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {aiMlNetworks.map((network, index) => (
                        <TableRow key={index}>
                          <TableCell>{network.network}</TableCell>
                          <TableCell>{network.type}</TableCell>
                          <TableCell>
                            {network.miners
                              ? `${(network.miners || 0).toLocaleString()} miners, ${network.validators || 0} validators`
                              : network.agents
                                ? `${(network.agents || 0).toLocaleString()} agents, ${network.validators || 0} validators`
                                : network.activeAgents
                                  ? `${(network.activeAgents || 0).toLocaleString()} agents`
                                  : `${network.validators || 0} validators, ${network.shards || 0} shards`}
                          </TableCell>
                          <TableCell>
                            {network.aiModels?.total
                              ? `${network.aiModels.total.toLocaleString()} AI models`
                              : network.aiServices
                                ? `${(typeof network.aiServices === 'number' ? network.aiServices : 0).toLocaleString()} AI services`
                                : network.marketplaceMetrics?.total
                                  ? `${network.marketplaceMetrics.total.toLocaleString()} marketplace services`
                                  : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <LinearProgress
                              variant="determinate"
                              value={parseFloat(network.networkHealth)}
                              sx={{ width: 60, mr: 1, display: 'inline-block' }}
                            />
                            {network.networkHealth}
                          </TableCell>
                          <TableCell>
                            {network.taoStaked ||
                              network.nearStaked ||
                              network.fetStaked ||
                              network.agixStaked}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={network.status}
                              color={getStatusColor(network.status)}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Cross-Chain Protocols Tab */}
        {tabValue === 4 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Protocol</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Type</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Supported Chains</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Total Value Locked</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Monthly Transactions</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Bridge Reliability</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Avg Confirmation Time</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Status</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {crossChainNetworks.map((network, index) => (
                  <TableRow key={index}>
                    <TableCell>{network.protocol}</TableCell>
                    <TableCell>{network.type}</TableCell>
                    <TableCell>{network.supportedChains}</TableCell>
                    <TableCell>{network.totalValueLocked}</TableCell>
                    <TableCell>{network.monthlyTransactions}</TableCell>
                    <TableCell>
                      <LinearProgress
                        variant="determinate"
                        value={parseFloat(network.bridgeReliability)}
                        sx={{ width: 60, mr: 1, display: 'inline-block' }}
                      />
                      {network.bridgeReliability}
                    </TableCell>
                    <TableCell>{network.avgConfirmationTime}</TableCell>
                    <TableCell>
                      <Chip
                        label={network.status}
                        color={getStatusColor(network.status)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Cross-Chain Protocols Tab */}
        {tabValue === 4 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Protocol</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Type</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Supported Chains</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Total Messages</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Daily Volume</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Average Latency</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Success Rate</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Gas Efficiency</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Status</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {crossChainProtocols.map((protocol, index) => (
                  <TableRow key={index}>
                    <TableCell>{protocol.protocol}</TableCell>
                    <TableCell>{protocol.type}</TableCell>
                    <TableCell>{protocol.supportedChains}</TableCell>
                    <TableCell>{protocol.totalMessages}</TableCell>
                    <TableCell>{protocol.dailyVolume}</TableCell>
                    <TableCell>{protocol.avgLatency}</TableCell>
                    <TableCell>{protocol.successRate}</TableCell>
                    <TableCell>{protocol.gasEfficiency}</TableCell>
                    <TableCell>
                      <Chip
                        label={protocol.status}
                        color={getStatusColor(protocol.status)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

/**
 * frontend#304 gate: the sample dashboard renders only under the demo-surface
 * policy; every visitor on a default build sees the honest not-live state.
 */
const InfrastructureCapacityDashboard = () => {
  if (!FEATURES.demoSurfaces) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
          Infrastructure Capacity
        </Typography>
        <PublicViewerNotice
          reason="not-live"
          title="Infrastructure capacity reporting is not live on the testnet yet"
          description="Storage, compute, IoT, AI/ML and cross-chain provider capacity is not measured by any connected backend. The catalogue shown in demo builds is illustrative."
        />
      </Box>
    );
  }
  return (
    <>
      <Paper
        data-testid="infra-sample-banner"
        sx={{ bgcolor: '#F59E0B22', border: '1px solid #F59E0B', borderRadius: 2, p: 2, m: 3, mb: 0 }}
      >
        <Typography variant="body1" sx={{ fontWeight: 700 }}>
          Simulated preview — illustrative provider catalogue, not measured capacity
        </Typography>
      </Paper>
      <InfrastructureCapacityDashboardSample />
    </>
  );
};

export default InfrastructureCapacityDashboard;
