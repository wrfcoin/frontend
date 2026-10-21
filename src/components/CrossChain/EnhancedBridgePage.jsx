import React, { useState, useEffect } from 'react';
import WeatherStationSetup from '../WeatherStationSetup';
import DuluthLiftBridgeIcon from './DuluthLiftBridgeIcon';
import RealTimeBridgeStatus from './RealTimeBridgeStatus';
import bridgeStatusService from '../../services/bridgeStatusService';
import { crossChainService } from '../../services/crossChainService';
import { getSecureWallet } from '../../services/secureWalletStorage';
import './CrossChainBridge.css';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Chip,
  LinearProgress,
  Paper,
  IconButton,
  Tooltip,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Radio,
  RadioGroup,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
} from '@mui/material';
import {
  SwapHoriz,
  Security,
  Speed,
  AccountBalance,
  TrendingUp,
  CheckCircle,
  Warning,
  Info,
  Refresh,
  AccountBalanceWallet,
  CompareArrows,
  Timer,
  MonetizationOn,
  DevicesOther,
  Cloud,
  Settings,
  WbSunny,
} from '@mui/icons-material';
import { devLog } from '../../utils/logger';
import FEATURES from '../../config/features';
import PublicViewerNotice from '../common/PublicViewerNotice';
import { apiClient } from '../../services/apiClient';

// frontend#296 — every protocol profile, wallet balance, TVL and volume figure
// in the sample page below is a hard-coded illustration. It renders only when
// FEATURES.demoSurfaces is explicitly on, under a page banner and a "Sample
// data" badge on the aggregated statistics. The default (public) build shows
// the honest not-live state plus the testnet's real bridge readiness, read
// from GET /api/bridges/capabilities/readiness (bridges.js, the one bridge
// route the main API actually serves).
const SAMPLE_BADGE_SX = { bgcolor: 'rgba(237, 108, 2, 0.12)', color: '#b45309', fontWeight: 600 };

const SampleBadge = ({ testId }) => (
  <Chip label="Sample data" size="small" data-testid={testId} sx={SAMPLE_BADGE_SX} />
);

const READINESS_MODE_COLOR = {
  'production-verified': 'success',
  'local-manager': 'info',
  simulated: 'warning',
  degraded: 'warning',
  unavailable: 'error',
};

const READINESS_LABELS = {
  'bridge.transfer': 'Bridge transfers',
  'bridge.verification': 'Validator verification',
  'route.store': 'Route store',
};

export const BridgeReadinessPanel = () => {
  const [readiness, setReadiness] = useState({ status: 'loading', data: null });

  useEffect(() => {
    let active = true;
    apiClient
      .get('/bridges/capabilities/readiness')
      .then((body) => {
        if (!active) return;
        const ok = body && body.success !== false && body.capabilities && typeof body.capabilities === 'object';
        setReadiness({ status: ok ? 'ready' : 'unavailable', data: ok ? body : null });
      })
      .catch(() => {
        if (active) setReadiness({ status: 'unavailable', data: null });
      });
    return () => {
      active = false;
    };
  }, []);

  if (readiness.status === 'loading') {
    return (
      <Paper sx={{ p: 3, mt: 3 }} data-testid="bridge-readiness-loading">
        <Typography variant="body2" color="text.secondary">
          Checking bridge readiness on the testnet…
        </Typography>
      </Paper>
    );
  }

  if (readiness.status === 'unavailable') {
    return (
      <Paper sx={{ p: 3, mt: 3 }} data-testid="bridge-readiness-unavailable">
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Bridge readiness unavailable
        </Typography>
        <Typography variant="body2" color="text.secondary">
          The testnet API did not answer /api/bridges/capabilities/readiness, so no bridge status can be
          shown. Nothing on this page is estimated in its place.
        </Typography>
      </Paper>
    );
  }

  const { overallMode, capabilities, signals, timestamp } = readiness.data;
  const entries = Object.entries(capabilities);

  return (
    <Paper sx={{ p: 3, mt: 3 }} data-testid="bridge-readiness-live">
      <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} mb={2}>
        <Typography variant="h6" fontWeight="bold">
          Bridge readiness (live from the testnet API)
        </Typography>
        <Chip
          label={`overall: ${overallMode}`}
          color={READINESS_MODE_COLOR[overallMode] || 'default'}
          size="small"
          data-testid="bridge-readiness-overall"
        />
      </Box>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Capability</TableCell>
            <TableCell>Mode</TableCell>
            <TableCell>Reason</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {entries.map(([id, cap]) => (
            <TableRow key={id}>
              <TableCell>{READINESS_LABELS[id] || id}</TableCell>
              <TableCell>
                <Chip label={cap.mode} color={READINESS_MODE_COLOR[cap.mode] || 'default'} size="small" />
              </TableCell>
              <TableCell>{cap.reason}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
        Bridge safety: {signals?.bridgeSafety || 'unknown'} · validator config source: {signals?.validatorConfigSource || 'unknown'}
        {timestamp ? ` · reported ${timestamp}` : ''}
      </Typography>
    </Paper>
  );
};

const EnhancedBridgePageSample = () => {
  const [bridgeStats, setBridgeStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBridge, setSelectedBridge] = useState(null);

  // Bridge form state
  const [selectedAsset, setSelectedAsset] = useState('');
  const [selectedDestination, setSelectedDestination] = useState('');
  const [bridgeAmount, setBridgeAmount] = useState('');
  const [availableRoutes, setAvailableRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [routesLoading, setRoutesLoading] = useState(false);

  // Transaction feedback states
  const [transactionStatus, setTransactionStatus] = useState(null); // 'pending', 'success', 'error'
  const [transactionHash, setTransactionHash] = useState('');
  const [bridging, setBridging] = useState(false);

  // Real-time bridge status
  const [bridgeStatuses, setBridgeStatuses] = useState({});
  const [realTimeConnected, setRealTimeConnected] = useState(false);

  // Bridge configurations with your comprehensive ecosystem
  const bridgeProtocols = [
    {
      id: 'axelar',
      name: 'Axelar Network',
      status: 'active',
      type: 'Universal Cross-Chain',
      tvl: '$892M',
      dailyVolume: '$45M',
      chains: 47,
      description: 'Universal cross-chain communication protocol',
      features: ['Secure messaging', 'Token transfers', 'Smart contract calls'],
      color: '#00D4FF',
    },
    {
      id: 'layerzero',
      name: 'LayerZero',
      status: 'active',
      type: 'Omnichain Protocol',
      tvl: '$1.2B',
      dailyVolume: '$67M',
      chains: 50,
      description: 'Omnichain interoperability protocol',
      features: [
        'Ultra-light nodes',
        'Cross-chain messaging',
        'Unified liquidity',
      ],
      color: '#8B5CF6',
    },
    {
      id: 'wormhole',
      name: 'Wormhole',
      status: 'active',
      type: 'Multi-Chain Bridge',
      tvl: '$756M',
      dailyVolume: '$38M',
      chains: 23,
      description: 'Leading multi-chain bridge protocol',
      features: ['Token bridging', 'NFT transfers', 'Data messaging'],
      color: '#FF6B6B',
    },
    {
      id: 'chainlink-ccip',
      name: 'Chainlink CCIP',
      status: 'active',
      type: 'Enterprise Bridge',
      tvl: '$423M',
      dailyVolume: '$28M',
      chains: 12,
      description: 'Enterprise-grade cross-chain infrastructure',
      features: [
        'Institutional security',
        'Programmable tokens',
        'Risk management',
      ],
      color: '#375BD2',
    },
    {
      id: 'chainflip',
      name: 'Chainflip',
      status: 'active',
      type: 'Native Swap Protocol',
      tvl: '$189M',
      dailyVolume: '$15M',
      chains: 6,
      description: 'Trustless cross-chain native swaps',
      features: ['Native Bitcoin', 'No wrapped tokens', 'MEV protection'],
      color: '#00E676',
    },
    {
      id: 'celer-cbridge',
      name: 'Celer cBridge',
      status: 'active',
      type: 'High-Performance Bridge',
      tvl: '$267M',
      dailyVolume: '$22M',
      chains: 35,
      description: 'High-performance cross-chain bridge',
      features: ['Fast finality', 'Low fees', 'Multi-asset support'],
      color: '#FF9800',
    },
    {
      id: 'thorchain',
      name: 'THORChain',
      status: 'active',
      type: 'Native Cross-Chain DEX',
      tvl: '$345M',
      dailyVolume: '$31M',
      chains: 8,
      description: 'Decentralized cross-chain exchange',
      features: ['Native swaps', 'Liquidity pools', 'No synthetic assets'],
      color: '#33FF57',
    },
    {
      id: 'near-rainbow',
      name: 'NEAR Rainbow Bridge',
      status: 'active',
      type: 'Ethereum-NEAR Bridge',
      tvl: '$123M',
      dailyVolume: '$8M',
      chains: 2,
      description: 'Ethereum to NEAR Protocol bridge',
      features: [
        'ETH compatibility',
        'Light client proofs',
        'Trustless design',
      ],
      color: '#00C1DE',
    },
    {
      id: 'optimism',
      name: 'Optimism Bridge',
      status: 'active',
      type: 'L2 Scaling Bridge',
      tvl: '$1.8B',
      dailyVolume: '$89M',
      chains: 2,
      description: 'Ethereum Layer 2 optimistic rollup bridge',
      features: ['7-day withdrawal', 'Low fees', 'EVM compatibility'],
      color: '#FF0420',
    },
    {
      id: 'base',
      name: 'Base Network',
      status: 'active',
      type: 'Coinbase L2 Bridge',
      tvl: '$2.1B',
      dailyVolume: '$156M',
      chains: 2,
      description: 'Coinbase Layer 2 network bridge',
      features: ['Coinbase integration', 'Low fees', 'Fast transactions'],
      color: '#0052FF',
    },
    {
      id: 'cosmos-ibc',
      name: 'Cosmos IBC',
      status: 'active',
      type: 'Inter-Blockchain Communication',
      tvl: '$892M',
      dailyVolume: '$43M',
      chains: 51,
      description: 'Cosmos inter-blockchain communication protocol',
      features: ['Trustless transfers', 'Sovereign chains', 'Cosmos SDK'],
      color: '#6F7CFF',
    },
    {
      id: 'interledger',
      name: 'Interledger (ILPv4)',
      status: 'active',
      type: 'Payment Protocol',
      tvl: '$67M',
      dailyVolume: '$4M',
      chains: 15,
      description: 'Universal payment protocol',
      features: ['Micropayments', 'Multi-currency', 'Streaming payments'],
      color: '#1976D2',
    },
    {
      id: 'polkadot-xcmp',
      name: 'Polkadot XCMP',
      status: 'active',
      type: 'Cross-Consensus Messaging',
      tvl: '$1.4B',
      dailyVolume: '$89M',
      chains: 45,
      description: 'Cross-Consensus Message Passing for Polkadot ecosystem',
      features: [
        'Parachain interop',
        'Native DOT transfers',
        'Substrate compatibility',
      ],
      color: '#E6007A',
    },
  ];

  // Mock wallet assets
  const walletAssets = [
    {
      symbol: 'WRF',
      name: 'Wrfcoin',
      balance: '1,234.56',
      chain: 'Wrfcoin',
      icon: '🌱',
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      balance: '2.45',
      chain: 'Ethereum',
      icon: '⟠',
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      balance: '5,678.90',
      chain: 'Ethereum',
      icon: '💵',
    },
    {
      symbol: 'DOT',
      name: 'Polkadot',
      balance: '89.12',
      chain: 'Polkadot',
      icon: '⚫',
    },
    {
      symbol: 'AVAX',
      name: 'Avalanche',
      balance: '45.67',
      chain: 'Avalanche',
      icon: '🔺',
    },
    {
      symbol: 'MATIC',
      name: 'Polygon',
      balance: '234.89',
      chain: 'Polygon',
      icon: '🟣',
    },
  ];

  // Available destination chains
  const destinationChains = [
    { id: 'ethereum', name: 'Ethereum', icon: '⟠' },
    { id: 'polygon', name: 'Polygon', icon: '🟣' },
    { id: 'avalanche', name: 'Avalanche', icon: '🔺' },
    { id: 'arbitrum', name: 'Arbitrum', icon: '🔵' },
    { id: 'optimism', name: 'Optimism', icon: '🔴' },
    { id: 'base', name: 'Base', icon: '🟦' },
    { id: 'polkadot', name: 'Polkadot', icon: '⚫' },
    { id: 'cosmos', name: 'Cosmos Hub', icon: '⚪' },
    { id: 'near', name: 'NEAR Protocol', icon: '🌌' },
  ];

  const aggregatedStats = {
    totalTVL: '$11.2B',
    totalDailyVolume: '$736M',
    totalChains: 248,
    totalBridges: 13,
    successRate: '99.7%',
    avgTransactionTime: '8.3 min',
    totalTransactions: '2.8M',
    avgFee: '$12.50',
  };

  useEffect(() => {
    // Initialize bridge data and real-time service
    const loadBridgeData = async () => {
      setLoading(true);

      // Initialize bridge status service with timeout
      try {
        const connectWithTimeout = Promise.race([
          bridgeStatusService.connect(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 5000)),
        ]);
        await connectWithTimeout;
        setRealTimeConnected(true);

        const statuses = bridgeStatusService.getAllBridgeStatuses();
        setBridgeStatuses(statuses);

        const unsubscribe = bridgeStatusService.subscribe(
          (bridgeId, status) => {
            if (bridgeId === 'all') {
              setBridgeStatuses(bridgeStatusService.getAllBridgeStatuses());
            } else {
              setBridgeStatuses(prev => ({
                ...prev,
                [bridgeId]: bridgeStatusService.getBridgeStatus(bridgeId),
              }));
            }
          },
        );

        window.bridgeStatusUnsubscribe = unsubscribe;
      } catch (error) {
        console.warn('Failed to connect to real-time bridge service:', error);
        setRealTimeConnected(false);
      }

      setBridgeStats(aggregatedStats);
      setLoading(false);
    };

    loadBridgeData();

    // Cleanup on unmount
    return () => {
      if (window.bridgeStatusUnsubscribe) {
        window.bridgeStatusUnsubscribe();
      }
    };
  }, []);

  // Generate available routes when asset and destination are selected
  useEffect(() => {
    if (selectedAsset && selectedDestination && bridgeAmount) {
      fetchAvailableRoutes();
    } else {
      setAvailableRoutes([]);
      setSelectedRoute('');
    }
  }, [selectedAsset, selectedDestination, bridgeAmount, bridgeStatuses]);

  const fetchAvailableRoutes = async () => {
    setRoutesLoading(true);

    try {
      // Generate routes from available bridge protocols with real-time data
      const availableBridges = bridgeProtocols.filter(bridge => {
        // Check if bridge supports the destination chain
        const supportedChains = {
          ethereum: [
            'axelar',
            'layerzero',
            'wormhole',
            'chainlink-ccip',
            'optimism',
            'base',
          ],
          polygon: ['axelar', 'layerzero', 'wormhole', 'celer-cbridge'],
          avalanche: ['axelar', 'layerzero', 'chainflip'],
          arbitrum: ['axelar', 'layerzero', 'optimism'],
          optimism: ['axelar', 'layerzero', 'optimism'],
          base: ['axelar', 'layerzero', 'base'],
          polkadot: ['polkadot-xcmp', 'chainlink-ccip'],
          cosmos: ['cosmos-ibc', 'axelar'],
          near: ['near-rainbow', 'axelar'],
        };

        return supportedChains[selectedDestination]?.includes(bridge.id);
      });

      // Generate routes with real-time pricing and timing
      const routes = await Promise.all(
        availableBridges.map(async bridge => {
          const status =
            bridgeStatuses[bridge.id] ||
            bridgeStatusService.getBridgeStatus(bridge.id);
          const feeEstimate = await bridgeStatusService.getFeeEstimate(
            bridge.id,
            bridgeAmount,
            walletAssets
              .find(a => a.symbol === selectedAsset)
              ?.chain?.toLowerCase() || 'ethereum',
            selectedDestination,
          );

          // frontend#329: a bridge with no received status has unknown
          // figures — say so, never substitute a plausible number.
          return {
            bridge: bridge.id,
            name: bridge.name,
            estimatedTime: status?.avgTransactionTime ?? 'unavailable',
            bridgeFee: feeEstimate?.bridgeFee ?? status?.currentFee ?? 'unavailable',
            gasEstimate: feeEstimate?.gasFee ?? status?.gasEstimate ?? 'unavailable',
            totalFee: feeEstimate?.totalFee ?? 'unavailable',
            reliability: typeof status?.uptime === 'number' ? status.uptime : null,
            throughput: status?.throughput ?? 'unavailable',
            securityLevel: status?.securityLevel ?? 'unknown',
            status: status?.status ?? 'unknown',
            score: 0, // Will be calculated
            color: bridge.color,
          };
        }),
      );

      // Calculate route scores using real-time data
      const scoredRoutes = bridgeStatusService.calculateOptimalRoute(routes);

      setAvailableRoutes(scoredRoutes);
      setRoutesLoading(false);
    } catch (error) {
      console.error('Failed to fetch routes:', error);
      setRoutesLoading(false);
    }
  };

  const handleBridgeSelect = bridge => {
    setSelectedBridge(bridge);
  };

  const getStatusColor = status => {
    switch (status) {
    case 'active':
      return '#4CAF50';
    case 'maintenance':
      return '#FF9800';
    case 'deprecated':
      return '#F44336';
    default:
      return '#9E9E9E';
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="400px"
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading Bridge Ecosystem...
        </Typography>
      </Box>
    );
  }

  const handleBridge = async () => {
    if (
      !selectedAsset ||
      !selectedDestination ||
      !bridgeAmount ||
      !selectedRoute
    ) {
      return;
    }

    setBridging(true);
    setTransactionStatus('pending');

    try {
      devLog('Bridge transaction:', {
        asset: selectedAsset,
        destination: selectedDestination,
        amount: bridgeAmount,
        route: selectedRoute,
      });

      const wallet = getSecureWallet();
      const senderAddress = wallet?.address || '';
      const sourceChain =
        walletAssets.find(a => a.symbol === selectedAsset)?.chain?.toLowerCase() ||
        'wrfcoin';

      const tx = await crossChainService.initiateTransfer({
        sourceChain,
        targetChain: selectedDestination,
        token: selectedAsset,
        amount: bridgeAmount,
        sender: senderAddress,
        recipient: senderAddress,
      });

      // sourceHash is the real on-chain tx hash from the source chain.
      // Leave it empty when the backend hasn't committed it yet; the UI
      // omits the hash field when falsy so users never see a placeholder.
      setTransactionHash(tx.sourceHash || '');
      setTransactionStatus(tx.status === 'FAILED' ? 'error' : 'success');
    } catch (error) {
      console.error('Bridge transaction failed:', error);
      setTransactionStatus('error');
    } finally {
      setBridging(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          gutterBottom
          sx={{
            fontWeight: 'bold',
            color: '#1976d2',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <DuluthLiftBridgeIcon sx={{ fontSize: 48, color: '#1976d2' }} />
          Wrfcoin Bridge Ecosystem
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          Simulated preview of a multi-bridge routing surface: 13 sample
          protocol profiles, none of them integrated with the testnet
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          <strong>Sample data:</strong> the routing, failover and gas figures on
          this page are illustrative. No bridge protocol is integrated with the
          testnet; the live readiness of the bridge service is reported in the
          panel above.
        </Alert>
      </Box>

      {/* Bridge Interface */}
      <Box sx={{ mb: 6 }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{ fontWeight: 'bold', mb: 3 }}
        >
          🚀 Bridge Assets
        </Typography>

        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Grid container spacing={2}>
              {/* Asset Selection - Now wider */}
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Select Asset from Wallet</InputLabel>
                  <Select
                    value={selectedAsset}
                    onChange={e => setSelectedAsset(e.target.value)}
                    label="Select Asset from Wallet"
                  >
                    {walletAssets.map(asset => (
                      <MenuItem key={asset.symbol} value={asset.symbol}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <span>{asset.icon}</span>
                          <Box>
                            <Typography variant="body1">
                              {asset.symbol}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Balance: {asset.balance}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Destination Chain - Now wider */}
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Bridge to Destination Chain</InputLabel>
                  <Select
                    value={selectedDestination}
                    onChange={e => setSelectedDestination(e.target.value)}
                    label="Bridge to Destination Chain"
                  >
                    {destinationChains.map(chain => (
                      <MenuItem key={chain.id} value={chain.id}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <span>{chain.icon}</span>
                          <Typography>{chain.name}</Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Amount - Now full width */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Amount"
                  value={bridgeAmount}
                  onChange={e => setBridgeAmount(e.target.value)}
                  type="number"
                  InputProps={{
                    endAdornment: selectedAsset && (
                      <Typography variant="body2" color="text.secondary">
                        {selectedAsset}
                      </Typography>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Bridge Routes Table */}
        {(routesLoading || availableRoutes.length > 0) && (
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <CompareArrows />
                Available Bridge Routes
              </Typography>

              {routesLoading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Select</TableCell>
                        <TableCell>Bridge</TableCell>
                        <TableCell align="center">Fee</TableCell>
                        <TableCell align="center">Time</TableCell>
                        <TableCell align="center">Security</TableCell>
                        <TableCell align="center">Gas Estimate</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {availableRoutes.map(route => (
                        <TableRow
                          key={route.bridge}
                          hover
                          selected={selectedRoute === route.bridge}
                          onClick={() => setSelectedRoute(route.bridge)}
                          sx={{
                            cursor: 'pointer',
                            '&.Mui-selected': {
                              backgroundColor: `${route.color}20`,
                            },
                          }}
                        >
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Box
                                sx={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: '50%',
                                  backgroundColor: route.color,
                                }}
                              />
                              <Typography fontWeight="bold">
                                {route.name}
                              </Typography>
                              {route.score > 85 && (
                                <Chip
                                  label="Optimal"
                                  size="small"
                                  color="success"
                                />
                              )}
                              {route.status === 'active' && (
                                <Chip
                                  label="Live"
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Uptime: {typeof route.reliability === 'number' ? `${route.reliability.toFixed(1)}%` : 'unavailable'} •{' '}
                              {route.securityLevel} security
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {route.estimatedTime}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {route.throughput}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {route.bridgeFee}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Real-time rate
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {route.totalFee}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Gas: {route.gasEstimate}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {availableRoutes.length > 0 && selectedRoute && (
                <Box
                  sx={{
                    mt: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleBridge}
                    disabled={bridging}
                    sx={{
                      px: 4,
                      py: 1.5,
                      background: bridging
                        ? 'rgba(0,0,0,0.12)'
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    }}
                  >
                    {bridging ? (
                      <>
                        <CircularProgress
                          size={20}
                          sx={{ mr: 1, color: 'white' }}
                        />
                        Processing Bridge...
                      </>
                    ) : (
                      <>
                        <AccountBalanceWallet sx={{ mr: 1 }} />
                        Bridge {bridgeAmount} {selectedAsset}
                      </>
                    )}
                  </Button>

                  {/* Transaction Status Feedback */}
                  {transactionStatus && (
                    <Box sx={{ mt: 2, width: '100%', maxWidth: 500 }}>
                      {transactionStatus === 'pending' && (
                        <Alert
                          severity="info"
                          sx={{ display: 'flex', alignItems: 'center' }}
                        >
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          <Box>
                            <Typography variant="body1" fontWeight="bold">
                              Bridge Transaction Processing...
                            </Typography>
                            <Typography variant="body2">
                              Your {selectedAsset} tokens are being bridged to{' '}
                              {selectedDestination}
                            </Typography>
                          </Box>
                        </Alert>
                      )}

                      {transactionStatus === 'success' && (
                        <Alert
                          severity="success"
                          sx={{ display: 'flex', alignItems: 'center' }}
                        >
                          <CheckCircle sx={{ mr: 1 }} />
                          <Box>
                            <Typography variant="body1" fontWeight="bold">
                              Bridge Transaction Successful! 🎉
                            </Typography>
                            <Typography variant="body2">
                              {bridgeAmount} {selectedAsset} successfully
                              bridged to {selectedDestination}
                            </Typography>
                            {transactionHash && (
                              <Typography
                                variant="caption"
                                sx={{
                                  fontFamily: 'monospace',
                                  wordBreak: 'break-all',
                                }}
                              >
                                Tx Hash: {transactionHash}
                              </Typography>
                            )}
                          </Box>
                        </Alert>
                      )}

                      {transactionStatus === 'error' && (
                        <Alert
                          severity="error"
                          sx={{ display: 'flex', alignItems: 'center' }}
                        >
                          <Warning sx={{ mr: 1 }} />
                          <Box>
                            <Typography variant="body1" fontWeight="bold">
                              Bridge Transaction Failed
                            </Typography>
                            <Typography variant="body2">
                              Please check your connection and try again
                            </Typography>
                          </Box>
                        </Alert>
                      )}
                    </Box>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Aggregated Statistics — hard-coded sample figures (frontend#296) */}
      <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">
          Ecosystem Statistics
        </Typography>
        <SampleBadge testId="bridge-stats-sample-badge" />
      </Box>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {bridgeStats?.totalTVL}
                  </Typography>
                  <Typography variant="body2">Total Value Locked</Typography>
                </Box>
                <AccountBalance sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {bridgeStats?.totalDailyVolume}
                  </Typography>
                  <Typography variant="body2">Daily Volume</Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {bridgeStats?.totalChains}
                  </Typography>
                  <Typography variant="body2">Supported Chains</Typography>
                </Box>
                <DuluthLiftBridgeIcon sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {bridgeStats?.successRate}
                  </Typography>
                  <Typography variant="body2">Success Rate</Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bridge Protocols Grid */}
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Integrated Bridge Protocols
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 2,
          '@media (max-width: 1200px)': {
            gridTemplateColumns: 'repeat(3, 1fr)',
          },
          '@media (max-width: 900px)': {
            gridTemplateColumns: 'repeat(2, 1fr)',
          },
          '@media (max-width: 600px)': {
            gridTemplateColumns: '1fr',
          },
        }}
      >
        {bridgeProtocols.map(bridge => (
          <RealTimeBridgeStatus
            key={bridge.id}
            bridge={bridge}
            onClick={() => handleBridgeSelect(bridge)}
          />
        ))}
      </Box>

      {/* Real-time Connection Status */}
      {realTimeConnected && (
        <Box sx={{ mt: 2, mb: 2 }}>
          <Alert
            severity="success"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <CheckCircle sx={{ mr: 1 }} />
            <Typography variant="body2">
              Real-time bridge monitoring active - Status updates every 5
              seconds
            </Typography>
          </Alert>
        </Box>
      )}

      {/* Bridge Selection Details */}
      {selectedBridge && (
        <Box sx={{ mt: 4 }}>
          <Card sx={{ border: `2px solid ${selectedBridge.color}` }}>
            <CardContent>
              <Typography
                variant="h5"
                gutterBottom
                sx={{ fontWeight: 'bold', color: selectedBridge.color }}
              >
                {selectedBridge.name} - Detailed Information
              </Typography>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="body1" gutterBottom>
                    <strong>Type:</strong> {selectedBridge.type}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>Description:</strong> {selectedBridge.description}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>Supported Chains:</strong> {selectedBridge.chains}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>Daily Volume:</strong> {selectedBridge.dailyVolume}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="body1" gutterBottom>
                    <strong>Total Value Locked:</strong> {selectedBridge.tvl}
                  </Typography>
                  {bridgeStatuses[selectedBridge.id] && (
                    <>
                      <Typography variant="body1" gutterBottom>
                        <strong>Current Uptime:</strong>{' '}
                        {bridgeStatuses[selectedBridge.id].uptime?.toFixed(2)}%
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        <strong>Current Fee Rate:</strong>{' '}
                        {bridgeStatuses[selectedBridge.id].currentFee}
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        <strong>Avg Transaction Time:</strong>{' '}
                        {bridgeStatuses[selectedBridge.id].avgTransactionTime}
                      </Typography>
                    </>
                  )}
                </Grid>
              </Grid>

              <Typography
                variant="h6"
                sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}
              >
                Key Features:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedBridge.features.map((feature, index) => (
                  <Chip
                    key={index}
                    label={feature}
                    variant="outlined"
                    size="small"
                    sx={{
                      borderColor: selectedBridge.color,
                      color: selectedBridge.color,
                    }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Legacy Bridge Cards (Hidden) */}
      <Box sx={{ display: 'none' }}>
        {bridgeProtocols.map(bridge => (
          <Box key={bridge.id}>
            <Card
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border:
                  selectedBridge?.id === bridge.id
                    ? `2px solid ${bridge.color}`
                    : '1px solid #e0e0e0',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
              onClick={() => handleBridgeSelect(bridge)}
            >
              <CardContent>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  mb={2}
                >
                  <Typography variant="h6" fontWeight="bold">
                    {bridge.name}
                  </Typography>
                  <Chip
                    label={bridge.status}
                    size="small"
                    sx={{
                      backgroundColor: getStatusColor(bridge.status),
                      color: 'white',
                      fontWeight: 'bold',
                    }}
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" mb={2}>
                  {bridge.description}
                </Typography>

                <Box mb={2}>
                  <Chip
                    label={bridge.type}
                    size="small"
                    sx={{
                      backgroundColor: bridge.color,
                      color: 'white',
                      mr: 1,
                      mb: 1,
                    }}
                  />
                </Box>

                <Grid container spacing={2} mb={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      TVL
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {bridge.tvl}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Daily Volume
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {bridge.dailyVolume}
                    </Typography>
                  </Grid>
                </Grid>

                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  mb={2}
                >
                  <Typography variant="body2" color="text.secondary">
                    {bridge.chains} Chains Supported
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(bridge.chains / 60) * 100}
                    sx={{
                      width: '50%',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: bridge.color,
                      },
                    }}
                  />
                </Box>

                <Box>
                  <Typography variant="body2" fontWeight="bold" mb={1}>
                    Key Features:
                  </Typography>
                  {bridge.features.map((feature, index) => (
                    <Chip
                      key={index}
                      label={feature}
                      size="small"
                      variant="outlined"
                      sx={{ mr: 0.5, mb: 0.5, fontSize: '0.7rem' }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Advanced Features Section */}
      <Box sx={{ mt: 6 }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{ fontWeight: 'bold', mb: 3 }}
        >
          Advanced Bridge Features
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card
              sx={{
                height: '100%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
              }}
            >
              <CardContent>
                <Security sx={{ fontSize: 40, mb: 2 }} />
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  Enterprise Security
                </Typography>
                <Typography variant="body2">
                  Multi-signature validation, fraud proofs, and real-time
                  monitoring across all bridge protocols
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card
              sx={{
                height: '100%',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
              }}
            >
              <CardContent>
                <Speed sx={{ fontSize: 40, mb: 2 }} />
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  Intelligent Routing
                </Typography>
                <Typography variant="body2">
                  AI-powered route optimization for fastest, cheapest
                  cross-chain transactions with automatic failover
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card
              sx={{
                height: '100%',
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
              }}
            >
              <CardContent>
                <TrendingUp sx={{ fontSize: 40, mb: 2 }} />
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  Liquidity Aggregation
                </Typography>
                <Typography variant="body2">
                  Unified liquidity pools across all bridges with dynamic
                  rebalancing and yield optimization
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Performance Metrics */}
      <Box sx={{ mt: 6 }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{ fontWeight: 'bold', mb: 3 }}
        >
          Network Performance
        </Typography>
        <Box sx={{ mb: 2 }}>
          <SampleBadge testId="bridge-performance-sample-badge" />
        </Box>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Transaction Metrics
              </Typography>
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Average Transaction Time
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {bridgeStats?.avgTransactionTime}
                </Typography>
              </Box>
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Total Transactions Processed
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {bridgeStats?.totalTransactions}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Average Network Fee
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {bridgeStats?.avgFee}
                </Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Network Health
              </Typography>
              <Box mb={2}>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Typography variant="body2">Bridge Uptime</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    99.97%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={99.97}
                  sx={{ mt: 1 }}
                />
              </Box>
              <Box mb={2}>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Typography variant="body2">Active Validators</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    847
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={85}
                  sx={{ mt: 1 }}
                />
              </Box>
              <Box>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Typography variant="body2">Network Consensus</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    100%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={100}
                  sx={{ mt: 1 }}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

const EnhancedBridgePage = () => {
  if (!FEATURES.demoSurfaces) {
    return (
      <Box sx={{ p: 3 }} data-testid="bridge-not-live">
        <PublicViewerNotice
          reason="not-live"
          title="Cross-chain bridging is not live on the testnet yet"
          description="No bridge transfer can be submitted from this build. The protocol catalogue, wallet balances and volume figures of the preview are illustrative, not testnet state; the real readiness of the bridge service is reported below."
        />
        <BridgeReadinessPanel />
      </Box>
    );
  }

  return (
    <>
      <Paper
        data-testid="bridge-sample-banner"
        sx={{ mx: 3, mt: 3, p: 2, bgcolor: 'rgba(237, 108, 2, 0.08)', border: '1px solid rgba(237, 108, 2, 0.4)' }}
      >
        <Typography variant="subtitle1" fontWeight="bold">
          Simulated preview — bridge protocols, TVL, volumes and wallet balances are illustrative sample data
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Shown because VITE_ENABLE_DEMO_SURFACES is on. Nothing below is testnet state; the panel that follows is.
        </Typography>
        <BridgeReadinessPanel />
      </Paper>
      <EnhancedBridgePageSample />
    </>
  );
};

export default EnhancedBridgePage;
