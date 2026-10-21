import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  FormControlLabel,
  Alert,
  Tooltip,
  CircularProgress,
  Avatar,
  Badge,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import StorageIcon from '@mui/icons-material/Storage';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PinDropIcon from '@mui/icons-material/PinDrop';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderIcon from '@mui/icons-material/Folder';
import DescriptionIcon from '@mui/icons-material/Description';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import FEATURES from '../../config/features';
import PublicViewerNotice from '../common/PublicViewerNotice';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';

// frontend#304: every provider figure on this page is fabricated. There is no
// funded IPFS/Filecoin/Arweave credential anywhere in infra
// (storage-providers#65, infra#944) and backend's /api/storage is scoped to
// weather-station realtime reads (capability `storage` = degraded,
// backend#1130). The sample dashboard renders only under the demo-surface
// policy (FEATURES.demoSurfaces, default off), beneath a banner; otherwise the
// honest not-live state renders instead.
const SHOW_SAMPLE = () => FEATURES.demoSurfaces;

const DistributedStorageInterfaceSample = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [storageProvider, setStorageProvider] = useState('auto');
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Sample data (see the frontend#304 note above) — never real provider state.
  const [storageData, setStorageData] = useState({
    overview: {
      totalCapacity: '1.5 PB',
      usedStorage: '856.2 TB',
      availableStorage: '668.8 TB',
      activeNodes: 147,
      redundancyLevel: 3.2,
      networkHealth: 96.8,
      avgUploadSpeed: '12.5 MB/s',
      avgDownloadSpeed: '18.3 MB/s',
      totalFiles: 2847392,
      encryptedFiles: 2698451,
    },
    providers: [
      {
        id: 'ipfs',
        name: 'IPFS',
        status: 'online',
        nodes: 45,
        capacity: '347.2 TB',
        used: '198.7 TB',
        health: 98.2,
        latency: '67ms',
        cost: '$0.012/GB/month',
        rating: 4.7,
      },
      {
        id: 'filecoin',
        name: 'Filecoin',
        status: 'online',
        nodes: 67,
        capacity: '523.8 TB',
        used: '387.4 TB',
        health: 97.1,
        latency: '89ms',
        cost: '$0.018/GB/month',
        rating: 4.5,
      },
      {
        id: 'arweave',
        name: 'Arweave',
        status: 'online',
        nodes: 35,
        capacity: '298.1 TB',
        used: '270.1 TB',
        health: 95.8,
        latency: '124ms',
        cost: '$0.025/GB/month',
        rating: 4.3,
      },
    ],
    files: [
      {
        id: 'f1',
        name: 'weather_data_2024_q1.csv',
        size: '2.4 GB',
        type: 'csv',
        uploaded: '2024-01-15',
        provider: 'IPFS',
        encrypted: true,
        pinned: true,
        replicas: 3,
        hash: 'QmX7k...',
        downloads: 1247,
        cost: '$0.029/month',
      },
      {
        id: 'f2',
        name: 'climate_model_v3.2.pkl',
        size: '856 MB',
        type: 'pkl',
        uploaded: '2024-02-03',
        provider: 'Filecoin',
        encrypted: true,
        pinned: false,
        replicas: 2,
        hash: 'baga6ea...',
        downloads: 89,
        cost: '$0.015/month',
      },
      {
        id: 'f3',
        name: 'sensor_configs_backup.json',
        size: '12.3 MB',
        type: 'json',
        uploaded: '2024-03-12',
        provider: 'Arweave',
        encrypted: false,
        pinned: true,
        replicas: 4,
        hash: 'ar_1x...',
        downloads: 342,
        cost: '$0.001/month',
      },
    ],
    deals: [
      {
        id: 'd1',
        provider: 'StorageNode-Alpha',
        capacity: '100 GB',
        duration: '12 months',
        price: '$1.2/month',
        reliability: 99.7,
        location: 'US-West',
        specialization: 'High-frequency data',
      },
      {
        id: 'd2',
        provider: 'DecentralStore-Beta',
        capacity: '500 GB',
        duration: '6 months',
        price: '$4.8/month',
        reliability: 98.9,
        location: 'EU-Central',
        specialization: 'Cold storage',
      },
      {
        id: 'd3',
        provider: 'GreenStorage-Gamma',
        capacity: '1 TB',
        duration: '24 months',
        price: '$8.5/month',
        reliability: 99.2,
        location: 'Asia-Pacific',
        specialization: 'Renewable energy',
      },
    ],
    performance: {
      uploadTrend: [
        { time: '00:00', speed: 8.2, cost: 0.012 },
        { time: '04:00', speed: 12.1, cost: 0.011 },
        { time: '08:00', speed: 15.3, cost: 0.013 },
        { time: '12:00', speed: 18.7, cost: 0.015 },
        { time: '16:00', speed: 14.2, cost: 0.012 },
        { time: '20:00', speed: 11.8, cost: 0.01 },
      ],
      storageDistribution: [
        { name: 'IPFS', value: 35, color: '#FF6B6B' },
        { name: 'Filecoin', value: 42, color: '#4ECDC4' },
        { name: 'Arweave', value: 23, color: '#45B7D1' },
      ],
      costAnalysis: [
        { provider: 'IPFS', storage: 1.2, bandwidth: 0.8, total: 2.0 },
        { provider: 'Filecoin', storage: 1.8, bandwidth: 1.2, total: 3.0 },
        { provider: 'Arweave', storage: 2.5, bandwidth: 0.5, total: 3.0 },
      ],
    },
  });

  useEffect(() => {
    if (!SHOW_SAMPLE()) return undefined;
    // Simulate real-time data updates
    const interval = setInterval(() => {
      setStorageData(prev => ({
        ...prev,
        overview: {
          ...prev.overview,
          networkHealth: 95 + Math.random() * 5,
          avgUploadSpeed: `${(10 + Math.random() * 10).toFixed(1)} MB/s`,
          avgDownloadSpeed: `${(15 + Math.random() * 10).toFixed(1)} MB/s`,
        },
      }));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleFileUpload = useCallback(event => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
    setUploadDialogOpen(true);
  }, []);

  const handleUploadConfirm = async () => {
    setLoading(true);

    // Simulate upload process
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Add uploaded files to the files list
    const newFiles = selectedFiles.map((file, index) => ({
      id: `f${Date.now()}_${index}`,
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      type: file.name.split('.').pop(),
      uploaded: new Date().toISOString().split('T')[0],
      provider: storageProvider === 'auto' ? 'IPFS' : storageProvider,
      encrypted: encryptionEnabled,
      pinned: false,
      replicas: 1,
      hash: `Qm${Math.random().toString(36).substr(2, 9)}...`,
      downloads: 0,
      cost: '$0.001/month',
    }));

    setStorageData(prev => ({
      ...prev,
      files: [...prev.files, ...newFiles],
    }));

    setLoading(false);
    setUploadDialogOpen(false);
    setSelectedFiles([]);
  };

  const toggleFilePinned = fileId => {
    setStorageData(prev => ({
      ...prev,
      files: prev.files.map(file =>
        file.id === fileId ? { ...file, pinned: !file.pinned } : file,
      ),
    }));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API refresh
    await new Promise(resolve => setTimeout(resolve, 2000));
    setRefreshing(false);
  };

  const getStatusColor = status => {
    switch (status) {
    case 'online':
      return 'success';
    case 'degraded':
      return 'warning';
    case 'offline':
      return 'error';
    default:
      return 'default';
    }
  };

  const formatBytes = bytes => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const StorageOverview = () => (
    <Grid container spacing={3}>
      {/* Network Status Cards */}
      <Grid item xs={12} md={6} lg={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={1}>
              <StorageIcon color="primary" />
              <Typography variant="h6" sx={{ ml: 1 }}>
                Total Capacity
              </Typography>
            </Box>
            <Typography variant="h4" color="primary">
              {storageData.overview.totalCapacity}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {storageData.overview.usedStorage} used
            </Typography>
            <LinearProgress variant="determinate" value={65} sx={{ mt: 1 }} />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6} lg={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={1}>
              <SecurityIcon color="success" />
              <Typography variant="h6" sx={{ ml: 1 }}>
                Network Health
              </Typography>
            </Box>
            <Typography variant="h4" color="success.main">
              {storageData.overview.networkHealth.toFixed(1)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {storageData.overview.activeNodes} active nodes
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6} lg={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={1}>
              <SpeedIcon color="info" />
              <Typography variant="h6" sx={{ ml: 1 }}>
                Avg Speed
              </Typography>
            </Box>
            <Typography variant="h5" color="info.main">
              ↑ {storageData.overview.avgUploadSpeed}
            </Typography>
            <Typography variant="h5" color="info.main">
              ↓ {storageData.overview.avgDownloadSpeed}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6} lg={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={1}>
              <LockIcon color="warning" />
              <Typography variant="h6" sx={{ ml: 1 }}>
                Encryption
              </Typography>
            </Box>
            <Typography variant="h4" color="warning.main">
              94.8%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {storageData.overview.encryptedFiles.toLocaleString()} files
              encrypted
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Storage Providers */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h6">Storage Providers</Typography>
              <IconButton onClick={handleRefresh} disabled={refreshing}>
                <RefreshIcon />
              </IconButton>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Provider</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Capacity</TableCell>
                    <TableCell>Usage</TableCell>
                    <TableCell>Health</TableCell>
                    <TableCell>Latency</TableCell>
                    <TableCell>Cost</TableCell>
                    <TableCell>Rating</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {storageData.providers.map(provider => (
                    <TableRow key={provider.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                            {provider.name.charAt(0)}
                          </Avatar>
                          {provider.name}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={provider.status}
                          color={getStatusColor(provider.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{provider.capacity}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {provider.used} / {provider.capacity}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={
                              (parseFloat(provider.used) /
                                parseFloat(provider.capacity)) *
                              100
                            }
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <CheckCircleIcon
                            color="success"
                            sx={{ mr: 0.5, fontSize: 16 }}
                          />
                          {provider.health}%
                        </Box>
                      </TableCell>
                      <TableCell>{provider.latency}</TableCell>
                      <TableCell>{provider.cost}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <StarIcon
                            color="warning"
                            sx={{ mr: 0.5, fontSize: 16 }}
                          />
                          {provider.rating}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Performance Charts */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" mb={2}>
              Storage Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={storageData.performance.storageDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                >
                  {storageData.performance.storageDistribution.map(
                    (entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ),
                  )}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" mb={2}>
              Performance Trends
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={storageData.performance.uploadTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="speed"
                  stroke="#8884d8"
                  name="Speed (MB/s)"
                />
                <Line
                  type="monotone"
                  dataKey="cost"
                  stroke="#82ca9d"
                  name="Cost ($/GB)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const FileManagement = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h6">File Management</Typography>
              <Box>
                <input
                  accept="*/*"
                  style={{ display: 'none' }}
                  id="file-upload"
                  multiple
                  type="file"
                  onChange={handleFileUpload}
                />
                <label htmlFor="file-upload">
                  <Button
                    variant="contained"
                    component="span"
                    startIcon={<CloudUploadIcon />}
                    sx={{ mr: 1 }}
                  >
                    Upload Files
                  </Button>
                </label>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  Refresh
                </Button>
              </Box>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>File</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell>Provider</TableCell>
                    <TableCell>Uploaded</TableCell>
                    <TableCell>Security</TableCell>
                    <TableCell>Replicas</TableCell>
                    <TableCell>Downloads</TableCell>
                    <TableCell>Cost</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {storageData.files.map(file => (
                    <TableRow key={file.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <DescriptionIcon sx={{ mr: 1 }} />
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {file.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {file.hash}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{file.size}</TableCell>
                      <TableCell>
                        <Chip label={file.provider} size="small" />
                      </TableCell>
                      <TableCell>{file.uploaded}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          {file.encrypted ? (
                            <LockIcon color="success" />
                          ) : (
                            <LockOpenIcon color="warning" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Badge badgeContent={file.replicas} color="primary">
                          <StorageIcon />
                        </Badge>
                      </TableCell>
                      <TableCell>{file.downloads.toLocaleString()}</TableCell>
                      <TableCell>{file.cost}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Tooltip
                            title={file.pinned ? 'Unpin file' : 'Pin file'}
                          >
                            <IconButton
                              onClick={() => toggleFilePinned(file.id)}
                              color={file.pinned ? 'warning' : 'default'}
                            >
                              {file.pinned ? <StarIcon /> : <StarBorderIcon />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Download">
                            <IconButton>
                              <CloudDownloadIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View details">
                            <IconButton>
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const StorageMarketplace = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" mb={2}>
              Available Storage Deals
            </Typography>
            <Grid container spacing={2}>
              {storageData.deals.map(deal => (
                <Grid item xs={12} md={6} lg={4} key={deal.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box
                        display="flex"
                        justifyContent="between"
                        alignItems="center"
                        mb={1}
                      >
                        <Typography variant="h6" noWrap>
                          {deal.provider}
                        </Typography>
                        <Chip
                          label={`${deal.reliability}% uptime`}
                          color="success"
                          size="small"
                        />
                      </Box>

                      <Typography variant="h4" color="primary" mb={1}>
                        {deal.capacity}
                      </Typography>

                      <Box display="flex" alignItems="center" mb={1}>
                        <AttachMoneyIcon sx={{ mr: 0.5, fontSize: 16 }} />
                        <Typography variant="body1" fontWeight="medium">
                          {deal.price}
                        </Typography>
                      </Box>

                      <Typography variant="body2" color="text.secondary" mb={1}>
                        Duration: {deal.duration}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" mb={1}>
                        Location: {deal.location}
                      </Typography>

                      <Chip
                        label={deal.specialization}
                        variant="outlined"
                        size="small"
                        sx={{ mb: 2 }}
                      />

                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<StorageIcon />}
                      >
                        Purchase Deal
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const PerformanceMetrics = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" mb={2}>
              Cost Analysis by Provider
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={storageData.performance.costAnalysis}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="provider" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar
                  dataKey="storage"
                  stackId="a"
                  fill="#8884d8"
                  name="Storage Cost"
                />
                <Bar
                  dataKey="bandwidth"
                  stackId="a"
                  fill="#82ca9d"
                  name="Bandwidth Cost"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" mb={2}>
              Upload Performance
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={storageData.performance.uploadTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <RechartsTooltip />
                <Area
                  type="monotone"
                  dataKey="speed"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" mb={2}>
              Network Statistics
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <SpeedIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Average Retrieval Time"
                  secondary="2.3 seconds"
                />
                <ListItemSecondaryAction>
                  <TrendingDownIcon color="success" />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemIcon>
                  <StorageIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Total Storage Deals"
                  secondary="1,247 active"
                />
                <ListItemSecondaryAction>
                  <TrendingUpIcon color="success" />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemIcon>
                  <SecurityIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Data Integrity"
                  secondary="99.97% verified"
                />
                <ListItemSecondaryAction>
                  <CheckCircleIcon color="success" />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemIcon>
                  <AttachMoneyIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Monthly Storage Cost"
                  secondary="$47.23 total"
                />
                <ListItemSecondaryAction>
                  <TrendingDownIcon color="success" />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" component="h1">
          Distributed Storage Interface
        </Typography>
        <Box display="flex" alignItems="center">
          {refreshing && <CircularProgress size={20} sx={{ mr: 1 }} />}
          <Typography variant="body2" color="text.secondary">
            Last updated: {new Date().toLocaleTimeString()}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Overview" icon={<StorageIcon />} />
          <Tab label="File Management" icon={<FolderIcon />} />
          <Tab label="Storage Marketplace" icon={<AttachMoneyIcon />} />
          <Tab label="Performance Metrics" icon={<SpeedIcon />} />
        </Tabs>
      </Box>

      {activeTab === 0 && <StorageOverview />}
      {activeTab === 1 && <FileManagement />}
      {activeTab === 2 && <StorageMarketplace />}
      {activeTab === 3 && <PerformanceMetrics />}

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Upload Files to Distributed Storage</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Selected files: {selectedFiles.length}
            </Typography>
            {selectedFiles.map((file, index) => (
              <Chip
                key={index}
                label={`${file.name} (${formatBytes(file.size)})`}
                sx={{ mr: 1, mb: 1 }}
              />
            ))}
          </Box>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Storage Provider</InputLabel>
            <Select
              value={storageProvider}
              onChange={e => setStorageProvider(e.target.value)}
            >
              <MenuItem value="auto">Auto-select (Best Performance)</MenuItem>
              <MenuItem value="IPFS">IPFS</MenuItem>
              <MenuItem value="Filecoin">Filecoin</MenuItem>
              <MenuItem value="Arweave">Arweave</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={encryptionEnabled}
                onChange={e => setEncryptionEnabled(e.target.checked)}
              />
            }
            label="Enable end-to-end encryption"
          />

          <Alert severity="info" sx={{ mt: 2 }}>
            Files will be automatically replicated across multiple nodes for
            redundancy. Estimated cost: $0.15/month for selected files.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleUploadConfirm}
            variant="contained"
            startIcon={
              loading ? <CircularProgress size={20} /> : <CloudUploadIcon />
            }
            disabled={loading || selectedFiles.length === 0}
          >
            {loading ? 'Uploading...' : 'Upload Files'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

/**
 * frontend#304 gate: the sample dashboard renders only under the demo-surface
 * policy; every visitor on a default build sees the honest not-live state.
 */
const DistributedStorageInterface = () => {
  if (!FEATURES.demoSurfaces) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
          Distributed Storage
        </Typography>
        <PublicViewerNotice
          reason="not-live"
          title="Distributed storage is not live on the testnet yet"
          description="No IPFS, Filecoin or Arweave provider is connected: the platform holds no funded storage credentials, and the storage API currently serves weather-station reads only. Provider status, capacity, health and cost figures will appear once a real storage backend is wired."
        />
      </Box>
    );
  }
  return (
    <>
      <Paper
        data-testid="storage-sample-banner"
        sx={{ bgcolor: '#F59E0B22', border: '1px solid #F59E0B', borderRadius: 2, p: 2, m: 3, mb: 0 }}
      >
        <Typography variant="body1" sx={{ fontWeight: 700 }}>
          Simulated preview — no storage provider is connected
        </Typography>
        <Typography variant="body2" color="text.secondary">
          IPFS, Filecoin and Arweave are shown as illustrative sample providers. None of the capacity, health, latency, cost or file figures below is real; the platform holds no storage credentials.
        </Typography>
      </Paper>
      <DistributedStorageInterfaceSample />
    </>
  );
};

export default DistributedStorageInterface;
