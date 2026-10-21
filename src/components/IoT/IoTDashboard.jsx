import React, { useState, useEffect } from 'react';
import DemoSurfaceGate from '../common/DemoSurfaceGate';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Chip,
  LinearProgress,
  Button,
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
import RouterIcon from '@mui/icons-material/Router';
import CloudIcon from '@mui/icons-material/Cloud';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import SensorsIcon from '@mui/icons-material/Sensors';
import PowerIcon from '@mui/icons-material/Power';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const IoTDashboardSample = () => {
  const [selectedNetwork, setSelectedNetwork] = useState('all');
  const [timeRange, setTimeRange] = useState('24h');
  const [deviceStats, setDeviceStats] = useState({
    total: 2847,
    active: 2432,
    inactive: 415,
    alerts: 23,
  });

  const [networks] = useState([
    { id: 'helium', name: 'Helium', devices: 1203, status: 'active' },
    { id: 'iotex', name: 'IoTeX', devices: 876, status: 'active' },
    { id: 'ttn', name: 'The Things Network', devices: 543, status: 'active' },
    { id: 'aioz', name: 'AIOZ', devices: 225, status: 'syncing' },
  ]);

  const [recentActivity] = useState([
    {
      id: 1,
      device: 'Weather Station #42',
      type: 'Data Upload',
      time: '2 min ago',
      status: 'success',
    },
    {
      id: 2,
      device: 'Air Quality Sensor #15',
      type: 'Alert',
      time: '5 min ago',
      status: 'warning',
    },
    {
      id: 3,
      device: 'Temperature Node #128',
      type: 'Connection',
      time: '12 min ago',
      status: 'success',
    },
    {
      id: 4,
      device: 'Humidity Sensor #67',
      type: 'Data Upload',
      time: '18 min ago',
      status: 'success',
    },
    {
      id: 5,
      device: 'Wind Speed Monitor #9',
      type: 'Maintenance',
      time: '25 min ago',
      status: 'info',
    },
  ]);

  const deviceTypeData = [
    { name: 'Weather Stations', value: 892, color: '#0088FE' },
    { name: 'Air Quality', value: 567, color: '#00C49F' },
    { name: 'Temperature', value: 743, color: '#FFBB28' },
    { name: 'Humidity', value: 402, color: '#FF8042' },
    { name: 'Other', value: 243, color: '#8884D8' },
  ];

  const dataFlowChart = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    uploads: Math.floor(Math.random() * 500) + 200,
    downloads: Math.floor(Math.random() * 300) + 100,
  }));

  const getStatusColor = status => {
    switch (status) {
    case 'success':
      return '#4CAF50';
    case 'warning':
      return '#FF9800';
    case 'error':
      return '#F44336';
    case 'info':
      return '#2196F3';
    default:
      return '#757575';
    }
  };

  const getDeviceIcon = type => {
    switch (type) {
    case 'Weather Stations':
      return <CloudIcon />;
    case 'Air Quality':
      return <CloudIcon />;
    case 'Temperature':
      return <ThermostatIcon />;
    case 'Humidity':
      return <WaterDropIcon />;
    default:
      return <SensorsIcon />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}
      >
        <RouterIcon /> IoT Sensor Dashboard
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Devices
                  </Typography>
                  <Typography variant="h4">
                    {deviceStats.total.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    +12% from last month
                  </Typography>
                </Box>
                <SensorsIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active Devices
                  </Typography>
                  <Typography variant="h4">
                    {deviceStats.active.toLocaleString()}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CheckCircleIcon
                      sx={{ fontSize: 16, color: 'success.main' }}
                    />
                    <Typography variant="body2" color="success.main">
                      {((deviceStats.active / deviceStats.total) * 100).toFixed(
                        1,
                      )}
                      % online
                    </Typography>
                  </Box>
                </Box>
                <PowerIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Inactive Devices
                  </Typography>
                  <Typography variant="h4">{deviceStats.inactive}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {((deviceStats.inactive / deviceStats.total) * 100).toFixed(
                      1,
                    )}
                    % offline
                  </Typography>
                </Box>
                <PowerIcon sx={{ fontSize: 40, color: 'error.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active Alerts
                  </Typography>
                  <Typography variant="h4">{deviceStats.alerts}</Typography>
                  <Typography variant="body2" color="warning.main">
                    Requires attention
                  </Typography>
                </Box>
                <WarningIcon sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Network Status */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Network Status
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Network</TableCell>
                      <TableCell align="right">Devices</TableCell>
                      <TableCell align="center">Status</TableCell>
                      <TableCell align="right">Uptime</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {networks.map(network => (
                      <TableRow key={network.id}>
                        <TableCell>{network.name}</TableCell>
                        <TableCell align="right">
                          {network.devices.toLocaleString()}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={
                              network.status === 'active' ? 'Active' : 'Syncing'
                            }
                            color={
                              network.status === 'active'
                                ? 'success'
                                : 'warning'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">99.9%</TableCell>
                        <TableCell align="center">
                          <Button size="small" variant="outlined">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Device Types Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={deviceTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {deviceTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Data Flow Chart */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Data Flow (Last 24 Hours)
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dataFlowChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <RechartsTooltip />
              <Area
                type="monotone"
                dataKey="uploads"
                stackId="1"
                stroke="#8884d8"
                fill="#8884d8"
                name="Uploads"
              />
              <Area
                type="monotone"
                dataKey="downloads"
                stackId="1"
                stroke="#82ca9d"
                fill="#82ca9d"
                name="Downloads"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Activity
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Device</TableCell>
                  <TableCell>Activity Type</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentActivity.map(activity => (
                  <TableRow key={activity.id}>
                    <TableCell>{activity.device}</TableCell>
                    <TableCell>{activity.type}</TableCell>
                    <TableCell>{activity.time}</TableCell>
                    <TableCell>
                      <Chip
                        label={activity.status}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(activity.status),
                          color: 'white',
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Button size="small" variant="text">
                        View
                      </Button>
                    </TableCell>
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

// frontend#328: every figure in IoTDashboardSample is hard-coded or random; nothing
// on the testnet API backs it. Default build: honest not-live, sample never
// mounted. Demo surfaces: sample under a "Sample data" chip.
const IoTDashboard = (props) => (
  <DemoSurfaceGate
    title="IoT device telemetry is not live on the testnet yet"
    description="No device route is mounted on the testnet API (iotex.js is unmounted); the device counts and hourly transfer figures in the preview are hard-coded."
    testId="iot-dashboard"
  >
    <IoTDashboardSample {...props} />
  </DemoSurfaceGate>
);

export default IoTDashboard;
