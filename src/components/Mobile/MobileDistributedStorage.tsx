import React, { useState, useEffect } from 'react';
import DemoSurfaceGate from '../common/DemoSurfaceGate';
import {
  Box,
  Card,
  CardContent,
  Typography,
  useTheme,
  useMediaQuery,
  Stack,
  Avatar,
  LinearProgress,
  Tabs,
  Tab,
  Grid,
  Collapse,
  alpha,
  IconButton,
  Chip,
  SwipeableDrawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ButtonBase,
  Divider,
  Badge,
  Fab,
} from '@mui/material';
import {
  Storage as StorageIcon,
  CloudQueue as IPFSIcon,
  Architecture as ArweaveIcon,
  Token as FilecoinIcon,
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  VideoFile as VideoIcon,
  Image as ImageIcon,
  AudioFile as AudioIcon,
  Description as DocumentIcon,
  DataUsage as DataIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Sync as SyncIcon,
  CloudUpload as UploadIcon,
  CloudDownload as DownloadIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
  CheckCircle as VerifiedIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Share as ShareIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';

interface StorageFile {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'data' | 'folder';
  size: number;
  hash: string;
  network: 'ipfs' | 'arweave' | 'filecoin';
  status: 'stored' | 'syncing' | 'error' | 'pending';
  uploadDate: string;
  lastAccessed: string;
  replicas: number;
  encrypted: boolean;
  pinned: boolean;
  cost: number;
}

interface StorageMetrics {
  totalFiles: number;
  totalSize: number;
  availableSpace: number;
  monthlyUpload: number;
  monthlyDownload: number;
  replicationFactor: number;
  storageUtilization: number;
  networkDistribution: {
    ipfs: number;
    arweave: number;
    filecoin: number;
  };
}

interface MobileDistributedStorageProps {
  compact?: boolean;
  onFileSelect?: (file: StorageFile) => void;
  onFileAction?: (action: string, file: StorageFile) => void;
}

const MobileDistributedStorageSample: React.FC<MobileDistributedStorageProps> = ({
  compact = false,
  onFileSelect,
  onFileAction,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [files, setFiles] = useState<StorageFile[]>([]);
  const [metrics, setMetrics] = useState<StorageMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStorageData();
  }, []);

  const loadStorageData = async () => {
    try {
      setRefreshing(true);

      // Mock storage data - replace with actual API calls
      const mockFiles: StorageFile[] = [
        {
          id: 'QmX1Y2Z3',
          name: 'weather_data_2024.csv',
          type: 'data',
          size: 125000000,
          hash: 'QmX1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9',
          network: 'ipfs',
          status: 'stored',
          uploadDate: new Date(
            Date.now() - 2 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          lastAccessed: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          replicas: 15,
          encrypted: true,
          pinned: true,
          cost: 2.45,
        },
        {
          id: 'AR5T6Y7U',
          name: 'sensor_readings_archive.zip',
          type: 'data',
          size: 890000000,
          hash: 'ARG5T6Y7U8I9O0P1Q2W3E4R5T6Y7U8I9O0P1Q2W3E4R5T6Y7U8I9O0P1Q2W3E4R5',
          network: 'arweave',
          status: 'stored',
          uploadDate: new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          lastAccessed: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          replicas: 8,
          encrypted: true,
          pinned: false,
          cost: 12.3,
        },
        {
          id: 'FIL8H5K2',
          name: 'carbon_reports',
          type: 'folder',
          size: 340000000,
          hash: 'FIL8H5K2L9M3N6P0Q4R7S1T5U8V2W6X0Y4Z8A2B6C0D4E8F2G6H0I4J8K2L6M0N4',
          network: 'filecoin',
          status: 'syncing',
          uploadDate: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          lastAccessed: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          replicas: 12,
          encrypted: false,
          pinned: true,
          cost: 8.95,
        },
        {
          id: 'QmA9B8C7',
          name: 'dashboard_backup.json',
          type: 'document',
          size: 2400000,
          hash: 'QmA9B8C7D6E5F4G3H2I1J0K9L8M7N6O5P4Q3R2S1T0U9V8W7X6Y5Z4A3B2C1D0E9',
          network: 'ipfs',
          status: 'stored',
          uploadDate: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          lastAccessed: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          replicas: 6,
          encrypted: true,
          pinned: false,
          cost: 0.12,
        },
        {
          id: 'AR2M3N4',
          name: 'ai_model_weights.bin',
          type: 'data',
          size: 1200000000,
          hash: 'AR2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2G3H4I5J6K7L8M9N0O1P2',
          network: 'arweave',
          status: 'error',
          uploadDate: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          lastAccessed: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          replicas: 0,
          encrypted: true,
          pinned: true,
          cost: 0,
        },
      ];

      const mockMetrics: StorageMetrics = {
        totalFiles: 1247,
        totalSize: 15.4, // GB
        availableSpace: 84.6, // GB
        monthlyUpload: 3.2, // GB
        monthlyDownload: 8.7, // GB
        replicationFactor: 12.3,
        storageUtilization: 15.4,
        networkDistribution: {
          ipfs: 45.2,
          arweave: 32.8,
          filecoin: 22.0,
        },
      };

      setFiles(mockFiles);
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Failed to load storage data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const tabs = [
    { label: 'Overview', value: 0 },
    { label: 'Files', value: 1 },
    { label: 'Networks', value: 2 },
    { label: 'Analytics', value: 3 },
  ];

  const networks = [
    { key: 'all', label: 'All Networks', icon: <StorageIcon /> },
    { key: 'ipfs', label: 'IPFS', icon: <IPFSIcon /> },
    { key: 'arweave', label: 'Arweave', icon: <ArweaveIcon /> },
    { key: 'filecoin', label: 'Filecoin', icon: <FilecoinIcon /> },
  ];

  const fileTypes = [
    { key: 'all', label: 'All Types', icon: <FileIcon /> },
    { key: 'data', label: 'Data', icon: <DataIcon /> },
    { key: 'document', label: 'Documents', icon: <DocumentIcon /> },
    { key: 'image', label: 'Images', icon: <ImageIcon /> },
    { key: 'video', label: 'Videos', icon: <VideoIcon /> },
    { key: 'audio', label: 'Audio', icon: <AudioIcon /> },
    { key: 'folder', label: 'Folders', icon: <FolderIcon /> },
  ];

  const filteredFiles = files.filter(file => {
    const networkMatch =
      selectedNetwork === 'all' || file.network === selectedNetwork;
    const typeMatch = selectedType === 'all' || file.type === selectedType;
    return networkMatch && typeMatch;
  });

  const getNetworkColor = (network: string) => {
    switch (network) {
    case 'ipfs':
      return theme.palette.info.main;
    case 'arweave':
      return theme.palette.success.main;
    case 'filecoin':
      return theme.palette.warning.main;
    default:
      return theme.palette.grey[600];
    }
  };

  const getNetworkIcon = (network: string) => {
    switch (network) {
    case 'ipfs':
      return <IPFSIcon />;
    case 'arweave':
      return <ArweaveIcon />;
    case 'filecoin':
      return <FilecoinIcon />;
    default:
      return <StorageIcon />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
    case 'data':
      return <DataIcon />;
    case 'document':
      return <DocumentIcon />;
    case 'image':
      return <ImageIcon />;
    case 'video':
      return <VideoIcon />;
    case 'audio':
      return <AudioIcon />;
    case 'folder':
      return <FolderIcon />;
    default:
      return <FileIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
    case 'stored':
      return theme.palette.success.main;
    case 'syncing':
      return theme.palette.warning.main;
    case 'pending':
      return theme.palette.info.main;
    case 'error':
      return theme.palette.error.main;
    default:
      return theme.palette.grey[500];
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
    case 'stored':
      return <VerifiedIcon sx={{ fontSize: 16 }} />;
    case 'syncing':
      return <SyncIcon sx={{ fontSize: 16 }} />;
    case 'pending':
      return <WarningIcon sx={{ fontSize: 16 }} />;
    case 'error':
      return <ErrorIcon sx={{ fontSize: 16 }} />;
    default:
      return <WarningIcon sx={{ fontSize: 16 }} />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor(
      (now.getTime() - time.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const toggleCard = (fileId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(fileId)) {
      newExpanded.delete(fileId);
    } else {
      newExpanded.add(fileId);
    }
    setExpandedCards(newExpanded);
  };

  const handleFileAction = (action: string, file: StorageFile) => {
    onFileAction?.(action, file);

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  // Overview Tab Component
  const OverviewTab: React.FC = () => (
    <Box sx={{ p: 2 }}>
      {/* Storage Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={6}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    width: 32,
                    height: 32,
                  }}
                >
                  <FileIcon
                    sx={{ fontSize: 18, color: theme.palette.primary.main }}
                  />
                </Avatar>
                <Box flex={1}>
                  <Typography variant="caption" color="text.secondary">
                    Total Files
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontSize: '1.1rem', fontWeight: 600 }}
                  >
                    {metrics?.totalFiles.toLocaleString()}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={6}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    width: 32,
                    height: 32,
                  }}
                >
                  <StorageIcon
                    sx={{ fontSize: 18, color: theme.palette.info.main }}
                  />
                </Avatar>
                <Box flex={1}>
                  <Typography variant="caption" color="text.secondary">
                    Used Storage
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontSize: '1.1rem', fontWeight: 600 }}
                  >
                    {metrics?.totalSize.toFixed(1)} GB
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={6}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    width: 32,
                    height: 32,
                  }}
                >
                  <SpeedIcon
                    sx={{ fontSize: 18, color: theme.palette.success.main }}
                  />
                </Avatar>
                <Box flex={1}>
                  <Typography variant="caption" color="text.secondary">
                    Replication
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontSize: '1.1rem', fontWeight: 600 }}
                  >
                    {metrics?.replicationFactor.toFixed(1)}x
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={6}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    width: 32,
                    height: 32,
                  }}
                >
                  <SecurityIcon
                    sx={{ fontSize: 18, color: theme.palette.warning.main }}
                  />
                </Avatar>
                <Box flex={1}>
                  <Typography variant="caption" color="text.secondary">
                    Available
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontSize: '1.1rem', fontWeight: 600 }}
                  >
                    {metrics?.availableSpace.toFixed(1)} GB
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Storage Utilization */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ fontSize: '1rem', fontWeight: 600 }}
          >
            Storage Utilization
          </Typography>

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={1}
          >
            <Typography variant="body2">Used Space</Typography>
            <Typography variant="body2" fontWeight={600}>
              {metrics?.storageUtilization.toFixed(1)}%
            </Typography>
          </Stack>

          <LinearProgress
            variant="determinate"
            value={metrics?.storageUtilization || 0}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              '& .MuiLinearProgress-bar': {
                bgcolor:
                  metrics && metrics.storageUtilization > 80
                    ? theme.palette.error.main
                    : metrics && metrics.storageUtilization > 60
                      ? theme.palette.warning.main
                      : theme.palette.success.main,
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Network Distribution */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ fontSize: '1rem', fontWeight: 600 }}
          >
            Network Distribution
          </Typography>

          <Stack spacing={2}>
            <Box>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={0.5}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <IPFSIcon
                    sx={{ fontSize: 16, color: theme.palette.info.main }}
                  />
                  <Typography variant="body2">IPFS</Typography>
                </Stack>
                <Typography variant="body2" fontWeight={600}>
                  {metrics?.networkDistribution.ipfs.toFixed(1)}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={metrics?.networkDistribution.ipfs || 0}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.info.main, 0.1),
                  '& .MuiLinearProgress-bar': {
                    bgcolor: theme.palette.info.main,
                  },
                }}
              />
            </Box>

            <Box>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={0.5}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <ArweaveIcon
                    sx={{ fontSize: 16, color: theme.palette.success.main }}
                  />
                  <Typography variant="body2">Arweave</Typography>
                </Stack>
                <Typography variant="body2" fontWeight={600}>
                  {metrics?.networkDistribution.arweave.toFixed(1)}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={metrics?.networkDistribution.arweave || 0}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.success.main, 0.1),
                  '& .MuiLinearProgress-bar': {
                    bgcolor: theme.palette.success.main,
                  },
                }}
              />
            </Box>

            <Box>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={0.5}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <FilecoinIcon
                    sx={{ fontSize: 16, color: theme.palette.warning.main }}
                  />
                  <Typography variant="body2">Filecoin</Typography>
                </Stack>
                <Typography variant="body2" fontWeight={600}>
                  {metrics?.networkDistribution.filecoin.toFixed(1)}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={metrics?.networkDistribution.filecoin || 0}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                  '& .MuiLinearProgress-bar': {
                    bgcolor: theme.palette.warning.main,
                  },
                }}
              />
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Monthly Activity */}
      <Card>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ fontSize: '1rem', fontWeight: 600 }}
          >
            Monthly Activity
          </Typography>

          <Grid container spacing={2}>
            <Grid size={6}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <UploadIcon
                  sx={{ fontSize: 16, color: theme.palette.primary.main }}
                />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Uploaded
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {metrics?.monthlyUpload.toFixed(1)} GB
                  </Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid size={6}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <DownloadIcon
                  sx={{ fontSize: 16, color: theme.palette.secondary.main }}
                />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Downloaded
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {metrics?.monthlyDownload.toFixed(1)} GB
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );

  // Files Tab Component
  const FilesTab: React.FC = () => (
    <Box sx={{ p: 2 }}>
      {/* Filter Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
      >
        <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
          Distributed Files
        </Typography>

        <IconButton
          onClick={() => setFilterDrawerOpen(true)}
          size="small"
          sx={{
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.2),
            },
          }}
        >
          <Badge
            badgeContent={
              selectedNetwork !== 'all' || selectedType !== 'all' ? 1 : 0
            }
            color="primary"
          >
            <FilterIcon />
          </Badge>
        </IconButton>
      </Stack>

      {/* Files List */}
      {filteredFiles.map(file => (
        <FileCard key={file.id} file={file} />
      ))}

      {filteredFiles.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <StorageIcon
              sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }}
            />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Files Found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No files match the selected filters.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );

  // File Card Component
  const FileCard: React.FC<{ file: StorageFile }> = ({ file }) => {
    const isExpanded = expandedCards.has(file.id);

    return (
      <Card sx={{ mb: 2, overflow: 'hidden' }}>
        <ButtonBase
          sx={{ width: '100%', textAlign: 'left' }}
          onClick={() => toggleCard(file.id)}
        >
          <CardContent sx={{ p: 2, width: '100%' }}>
            <Stack direction="row" alignItems="flex-start" spacing={2}>
              <Avatar
                sx={{
                  bgcolor: alpha(getNetworkColor(file.network), 0.1),
                  color: getNetworkColor(file.network),
                  width: 40,
                  height: 40,
                }}
              >
                {getTypeIcon(file.type)}
              </Avatar>

              <Stack flex={1} spacing={1}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography
                    variant="h6"
                    sx={{ fontSize: '1rem', fontWeight: 600 }}
                  >
                    {file.name}
                  </Typography>
                  <Chip
                    icon={getStatusIcon(file.status)}
                    label={file.status}
                    size="small"
                    sx={{
                      bgcolor: alpha(getStatusColor(file.status), 0.1),
                      color: getStatusColor(file.status),
                      fontSize: '0.7rem',
                      height: 22,
                    }}
                  />
                </Stack>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: '0.85rem' }}
                >
                  {formatFileSize(file.size)} • {file.network.toUpperCase()}
                </Typography>

                <Stack direction="row" alignItems="center" spacing={2}>
                  <Typography variant="caption" color="text.secondary">
                    {file.replicas} replicas
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ${file.cost.toFixed(2)}
                  </Typography>
                  {file.encrypted && (
                    <Chip
                      label="Encrypted"
                      size="small"
                      sx={{
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                        fontSize: '0.6rem',
                        height: 18,
                      }}
                    />
                  )}
                </Stack>
              </Stack>

              <IconButton size="small">
                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Stack>
          </CardContent>
        </ButtonBase>

        <Collapse in={isExpanded}>
          <Divider />
          <CardContent sx={{ pt: 1, pb: 2 }}>
            <Stack spacing={2}>
              {/* File Details */}
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  gutterBottom
                >
                  Hash
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={400}
                  sx={{ fontSize: '0.8rem', wordBreak: 'break-all' }}
                >
                  {file.hash}
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid size={6}>
                  <Typography variant="caption" color="text.secondary">
                    Uploaded
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {formatTime(file.uploadDate)}
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="caption" color="text.secondary">
                    Last Accessed
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {formatTime(file.lastAccessed)}
                  </Typography>
                </Grid>
              </Grid>

              {/* Actions */}
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <ButtonBase
                  onClick={e => {
                    e.stopPropagation();
                    handleFileAction('view', file);
                  }}
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.2),
                    },
                  }}
                >
                  <ViewIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  View
                </ButtonBase>

                <ButtonBase
                  onClick={e => {
                    e.stopPropagation();
                    handleFileAction('share', file);
                  }}
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    color: theme.palette.success.main,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.success.main, 0.2),
                    },
                  }}
                >
                  <ShareIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  Share
                </ButtonBase>

                <ButtonBase
                  onClick={e => {
                    e.stopPropagation();
                    handleFileAction('delete', file);
                  }}
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.error.main, 0.1),
                    color: theme.palette.error.main,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.error.main, 0.2),
                    },
                  }}
                >
                  <DeleteIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  Delete
                </ButtonBase>
              </Stack>
            </Stack>
          </CardContent>
        </Collapse>
      </Card>
    );
  };

  // Filter Drawer
  const FilterDrawer: React.FC = () => (
    <SwipeableDrawer
      anchor="bottom"
      open={filterDrawerOpen}
      onClose={() => setFilterDrawerOpen(false)}
      onOpen={() => setFilterDrawerOpen(true)}
      sx={{
        '& .MuiDrawer-paper': {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: '70vh',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          mb={2}
        >
          <Typography variant="h6">Filters</Typography>
          <IconButton onClick={() => setFilterDrawerOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>

        <Typography variant="subtitle2" gutterBottom>
          Network
        </Typography>
        <List sx={{ mb: 2 }}>
          {networks.map(network => {
            const count =
              network.key === 'all'
                ? files.length
                : files.filter(f => f.network === network.key).length;

            return (
              <ListItem
                key={network.key}
                component={ButtonBase}
                onClick={() => setSelectedNetwork(network.key)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  bgcolor:
                    selectedNetwork === network.key
                      ? alpha(theme.palette.primary.main, 0.1)
                      : 'transparent',
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {network.icon}
                </ListItemIcon>
                <ListItemText
                  primary={network.label}
                  secondary={`${count} file${count !== 1 ? 's' : ''}`}
                />
                {selectedNetwork === network.key && (
                  <VerifiedIcon color="primary" />
                )}
              </ListItem>
            );
          })}
        </List>

        <Typography variant="subtitle2" gutterBottom>
          File Type
        </Typography>
        <List>
          {fileTypes.map(type => {
            const count =
              type.key === 'all'
                ? files.length
                : files.filter(f => f.type === type.key).length;

            return (
              <ListItem
                key={type.key}
                component={ButtonBase}
                onClick={() => setSelectedType(type.key)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  bgcolor:
                    selectedType === type.key
                      ? alpha(theme.palette.primary.main, 0.1)
                      : 'transparent',
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{type.icon}</ListItemIcon>
                <ListItemText
                  primary={type.label}
                  secondary={`${count} file${count !== 1 ? 's' : ''}`}
                />
                {selectedType === type.key && <VerifiedIcon color="primary" />}
              </ListItem>
            );
          })}
        </List>
      </Box>
    </SwipeableDrawer>
  );

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight={compact ? 200 : 300}
        p={3}
      >
        <Typography variant="body2" color="text.secondary">
          Loading storage data...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', minHeight: compact ? 300 : '100vh' }}>
      {/* Header */}
      <Box sx={{ p: 2, pb: 1 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          mb={2}
        >
          <Typography variant="h6" sx={{ fontSize: '1.3rem', fontWeight: 600 }}>
            Distributed Storage
          </Typography>

          <IconButton
            onClick={loadStorageData}
            disabled={refreshing}
            size="small"
            sx={{
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
              },
            }}
          >
            <RefreshIcon
              sx={{
                animation: refreshing ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                },
              }}
            />
          </IconButton>
        </Stack>

        {/* Tabs */}
        <Tabs
          value={selectedTab}
          onChange={(_, value) => setSelectedTab(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              minWidth: 'auto',
              fontSize: '0.85rem',
              py: 1,
            },
          }}
        >
          {tabs.map(tab => (
            <Tab key={tab.value} label={tab.label} />
          ))}
        </Tabs>
      </Box>

      {/* Tab Content */}
      {selectedTab === 0 && <OverviewTab />}
      {selectedTab === 1 && <FilesTab />}
      {selectedTab === 2 && (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Network management coming soon...
          </Typography>
        </Box>
      )}
      {selectedTab === 3 && (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Analytics dashboard coming soon...
          </Typography>
        </Box>
      )}

      {/* Upload FAB */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
        }}
        onClick={() => handleFileAction('upload', {} as StorageFile)}
      >
        <UploadIcon />
      </Fab>

      <FilterDrawer />
    </Box>
  );
};

// frontend#326: MobileDistributedStorageSample sets a hard-coded metrics object with no fetch.
// Default build: honest not-live, sample never mounted. Demo surfaces:
// sample under a "Sample data" chip.
const MobileDistributedStorage: React.FC<MobileDistributedStorageProps> = (props) => (
  <DemoSurfaceGate
    title="Distributed storage is not live on the testnet yet"
    description="No funded storage provider is connected (storage-providers#65); the capacity and health figures in the preview are hard-coded."
    testId="mobile-storage"
  >
    <MobileDistributedStorageSample {...props} />
  </DemoSurfaceGate>
);

export default MobileDistributedStorage;
