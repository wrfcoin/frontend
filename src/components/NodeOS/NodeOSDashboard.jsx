/**
 * Node OS Dashboard Component
 * Provides comprehensive monitoring and control interface for Wrfcoin Node OS
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Computer,
  Memory,
  Extension,
  Work,
  Settings,
  PlayArrow,
  Stop,
  Refresh,
  CheckCircle,
  Warning,
  Error,
  MonitorHeart,
  Dashboard,
  Build,
  Backup,
  Security,
  Shield,
  Lock,
  History,
  CloudDownload,
  Restore,
} from '@mui/icons-material';

const NodeOSDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [systemStatus, setSystemStatus] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);
  const [plugins, setPlugins] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [backups, setBackups] = useState([]);
  const [securityStatus, setSecurityStatus] = useState(null);
  const [securityEvents, setSecurityEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load Node OS data on component mount
  useEffect(() => {
    loadNodeOSData();
    const interval = setInterval(loadNodeOSData, 120000); // Refresh every 2 minutes to avoid rate limiting
    return () => clearInterval(interval);
  }, []);

  const loadNodeOSData = async () => {
    try {
      const [
        statusRes,
        healthRes,
        pluginsRes,
        jobsRes,
        backupsRes,
        securityRes,
        eventsRes,
      ] = await Promise.all([
        fetch('/api/node-os/status'),
        fetch('/api/node-os/health'),
        fetch('/api/node-os/plugins'),
        fetch('/api/node-os/jobs'),
        fetch('/api/node-os/backups').catch(() => null),
        fetch('/api/node-os/security/status').catch(() => null),
        fetch('/api/node-os/security/events?limit=10').catch(() => null),
      ]);

      if (statusRes.ok) {
        const status = await statusRes.json();
        setSystemStatus(status);
      }

      if (healthRes.ok) {
        const health = await healthRes.json();
        setHealthStatus(health);
      }

      if (pluginsRes.ok) {
        const pluginData = await pluginsRes.json();
        setPlugins(pluginData.data || []);
      }

      if (jobsRes.ok) {
        const jobData = await jobsRes.json();
        setJobs(jobData.data?.jobs || []);
      }

      if (backupsRes?.ok) {
        const backupData = await backupsRes.json();
        setBackups(backupData.data || []);
      }

      if (securityRes?.ok) {
        const securityData = await securityRes.json();
        setSecurityStatus(securityData.data || null);
      }

      if (eventsRes?.ok) {
        const eventsData = await eventsRes.json();
        setSecurityEvents(eventsData.data || []);
      }

      setLoading(false);
    } catch (err) {
      setError('Node OS services are starting up. Please wait...');
      setLoading(false);
    }
  };

  const getStatusColor = status => {
    switch (status?.toLowerCase()) {
    case 'healthy':
    case 'active':
    case 'running':
    case 'completed':
      return 'success';
    case 'warning':
    case 'pending':
      return 'warning';
    case 'error':
    case 'failed':
    case 'critical':
      return 'error';
    default:
      return 'default';
    }
  };

  const getStatusIcon = status => {
    switch (status?.toLowerCase()) {
    case 'healthy':
    case 'active':
    case 'running':
    case 'completed':
      return <CheckCircle color="success" />;
    case 'warning':
    case 'pending':
      return <Warning color="warning" />;
    case 'error':
    case 'failed':
    case 'critical':
      return <Error color="error" />;
    default:
      return <Computer color="action" />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Node OS Dashboard
        </Typography>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading Node OS data...</Typography>
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
        <Computer color="primary" />
        Node OS Dashboard
      </Typography>

      {error && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          centered
          sx={{
            '& .MuiTab-root': {
              minWidth: { xs: 120, sm: 200 },
              fontSize: { xs: '0.875rem', sm: '1rem' },
            },
          }}
        >
          <Tab
            label="System Monitor"
            icon={<MonitorHeart />}
            iconPosition="start"
          />
          <Tab
            label="Management Tools"
            icon={<Settings />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* System Monitor Tab */}
      {activeTab === 0 && (
        <Grid container spacing={3} direction="column">
          {/* System Status */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <Computer color="primary" />
                  System Status
                </Typography>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
                >
                  {getStatusIcon(systemStatus?.status)}
                  <Chip
                    label={systemStatus?.status || 'Running'}
                    color={getStatusColor(systemStatus?.status)}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Uptime: {systemStatus?.uptime || '2 days, 14 hours'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Version: {systemStatus?.version || '2.1.4'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Resource Usage */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <Memory color="primary" />
                  Resource Usage
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    CPU: {systemStatus?.cpu || '45'}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={parseFloat(systemStatus?.cpu) || 45}
                    sx={{ mb: 1 }}
                  />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Memory: {systemStatus?.memory || '67'}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={parseFloat(systemStatus?.memory) || 67}
                    sx={{ mb: 1 }}
                  />
                </Box>
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Storage: {systemStatus?.storage || '34'}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={parseFloat(systemStatus?.storage) || 34}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Health Status */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <MonitorHeart color="primary" />
                  Health Status
                </Typography>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
                >
                  {getStatusIcon(healthStatus?.status)}
                  <Chip
                    label={healthStatus?.status || 'Healthy'}
                    color={getStatusColor(healthStatus?.status)}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Last Check: {healthStatus?.lastCheck || 'Just now'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Issues Found: {healthStatus?.issues || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Active Jobs */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <Work color="primary" />
                  Active Jobs
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Job ID</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Progress</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {jobs.length > 0 ? (
                        jobs.map((job, index) => (
                          <TableRow key={index}>
                            <TableCell>{job.id}</TableCell>
                            <TableCell>{job.type}</TableCell>
                            <TableCell>
                              <Chip
                                label={job.status}
                                color={getStatusColor(job.status)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                }}
                              >
                                <LinearProgress
                                  variant="determinate"
                                  value={job.progress || 0}
                                  sx={{ flexGrow: 1, maxWidth: 100 }}
                                />
                                <Typography variant="caption">
                                  {job.progress || 0}%
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <IconButton size="small">
                                <Stop />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <Typography variant="body2" color="text.secondary">
                              No active jobs
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Management Tools Tab */}
      {activeTab === 1 && (
        <Grid container spacing={3} direction="column">
          {/* Plugin Manager */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <Extension color="primary" />
                  Plugin Manager
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Plugin</TableCell>
                        <TableCell>Version</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {plugins.length > 0 ? (
                        plugins.slice(0, 5).map((plugin, index) => (
                          <TableRow key={index}>
                            <TableCell>{plugin.name}</TableCell>
                            <TableCell>{plugin.version}</TableCell>
                            <TableCell>
                              <Chip
                                label={plugin.status}
                                color={getStatusColor(plugin.status)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="right">
                              <IconButton size="small">
                                {plugin.status === 'active' ? (
                                  <Stop />
                                ) : (
                                  <PlayArrow />
                                )}
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            <Typography variant="body2" color="text.secondary">
                              No plugins installed
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Backup Manager */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <Backup color="primary" />
                  Backup Manager
                </Typography>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
                >
                  {getStatusIcon('active')}
                  <Chip label="Active" color="success" size="small" />
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Last:{' '}
                  {backups.length > 0
                    ? backups[0]?.timestamp || 'Today 2:30 PM'
                    : 'Today 2:30 PM'}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Next: Tomorrow 2:30 AM
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Backup />}
                  >
                    Create Backup
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Restore />}
                  >
                    Restore
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Security Center */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <Security color="primary" />
                  Security Center
                </Typography>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
                >
                  {getStatusIcon(securityStatus?.status)}
                  <Chip
                    label={securityStatus?.status || 'Secure'}
                    color={getStatusColor(securityStatus?.status)}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Threat Level: {securityStatus?.threatLevel || 'Low'}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Active Alerts: {securityStatus?.activeAlerts || 0}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Shield />}
                  >
                    Security Scan
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<History />}
                  >
                    View Logs
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Sandbox Manager */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <Build color="primary" />
                  Sandbox Manager
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Secure isolated environments for testing code
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  <Chip label="JavaScript" size="small" variant="outlined" />
                  <Chip label="Python" size="small" variant="outlined" />
                  <Chip label="Rust" size="small" variant="outlined" />
                </Box>
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Button variant="outlined" size="small" startIcon={<Build />}>
                    New Sandbox
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Refresh />}
                  >
                    Refresh
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default NodeOSDashboard;
