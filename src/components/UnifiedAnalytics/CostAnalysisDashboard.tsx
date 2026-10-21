import DemoSurfaceGate from '../common/DemoSurfaceGate';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Alert,
  Chip,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  AttachMoney,
  TrendingUp,
  TrendingDown,
  CloudQueue,
  Storage,
  Speed,
  NetworkCheck,
  Warning,
  CheckCircle,
  GetApp,
  Visibility,
  Timeline,
  PieChart,
  BarChart,
  Assessment,
} from '@mui/icons-material';

interface CostBreakdown {
  category: string;
  monthly: number;
  daily: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  description: string;
}

interface ServiceCost {
  serviceName: string;
  monthlyCost: number;
  cpu: number;
  memory: number;
  storage: number;
  network: number;
  costPerRequest: number;
  totalRequests: number;
}

interface CostOptimization {
  id: string;
  title: string;
  description: string;
  potentialSavings: number;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  category: string;
  implemented: boolean;
}

const CostAnalysisDashboardSample: React.FC = () => {
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown[]>([]);
  const [serviceCosts, setServiceCosts] = useState<ServiceCost[]>([]);
  const [optimizations, setOptimizations] = useState<CostOptimization[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [timeframe, setTimeframe] = useState('monthly');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [totalCost, setTotalCost] = useState(0);
  const [projectedSavings, setProjectedSavings] = useState(0);

  useEffect(() => {
    initializeCostData();
  }, []);

  const initializeCostData = () => {
    // Cost breakdown by category
    const breakdown: CostBreakdown[] = [
      {
        category: 'Compute Resources',
        monthly: 2450.0,
        daily: 81.67,
        percentage: 35,
        trend: 'up',
        description: 'CPU, memory, and processing across all microservices',
      },
      {
        category: 'Storage',
        monthly: 1580.0,
        daily: 52.67,
        percentage: 22,
        trend: 'stable',
        description: 'Database, IPFS, Arweave, and file storage costs',
      },
      {
        category: 'Network & Bandwidth',
        monthly: 890.0,
        daily: 29.67,
        percentage: 13,
        trend: 'down',
        description: 'Cross-chain bridges, API calls, and data transfer',
      },
      {
        category: 'AI/ML Services',
        monthly: 750.0,
        daily: 25.0,
        percentage: 11,
        trend: 'up',
        description: 'Model inference, training, and data processing',
      },
      {
        category: 'Security & HSM',
        monthly: 680.0,
        daily: 22.67,
        percentage: 10,
        trend: 'stable',
        description: 'Hardware security modules and cryptographic services',
      },
      {
        category: 'Monitoring & Analytics',
        monthly: 420.0,
        daily: 14.0,
        percentage: 6,
        trend: 'stable',
        description: 'Grafana, Prometheus, and logging infrastructure',
      },
      {
        category: 'External APIs',
        monthly: 230.0,
        daily: 7.67,
        percentage: 3,
        trend: 'up',
        description: 'Weather data, third-party services, and integrations',
      },
    ];

    setCostBreakdown(breakdown);
    setTotalCost(breakdown.reduce((sum, item) => sum + item.monthly, 0));

    // Service-specific cost analysis
    const services: ServiceCost[] = [
      {
        serviceName: 'Main API Server',
        monthlyCost: 450.0,
        cpu: 180.0,
        memory: 120.0,
        storage: 80.0,
        network: 70.0,
        costPerRequest: 0.0045,
        totalRequests: 100000,
      },
      {
        serviceName: 'Cross-Chain Protocol',
        monthlyCost: 380.0,
        cpu: 150.0,
        memory: 100.0,
        storage: 60.0,
        network: 70.0,
        costPerRequest: 0.019,
        totalRequests: 20000,
      },
      {
        serviceName: 'AI/ML Networks',
        monthlyCost: 750.0,
        cpu: 400.0,
        memory: 200.0,
        storage: 100.0,
        network: 50.0,
        costPerRequest: 0.15,
        totalRequests: 5000,
      },
      {
        serviceName: 'Storage Networks',
        monthlyCost: 320.0,
        cpu: 80.0,
        memory: 60.0,
        storage: 150.0,
        network: 30.0,
        costPerRequest: 0.008,
        totalRequests: 40000,
      },
      {
        serviceName: 'IoT Sensors',
        monthlyCost: 280.0,
        cpu: 100.0,
        memory: 80.0,
        storage: 60.0,
        network: 40.0,
        costPerRequest: 0.0028,
        totalRequests: 100000,
      },
      {
        serviceName: 'Compute Networks',
        monthlyCost: 420.0,
        cpu: 200.0,
        memory: 120.0,
        storage: 50.0,
        network: 50.0,
        costPerRequest: 0.084,
        totalRequests: 5000,
      },
    ];

    setServiceCosts(services);

    // Cost optimization opportunities
    const costOptimizations: CostOptimization[] = [
      {
        id: 'auto-scaling',
        title: 'Implement Auto-Scaling',
        description:
          'Automatically scale compute resources based on demand to reduce idle costs',
        potentialSavings: 450.0,
        effort: 'medium',
        impact: 'high',
        category: 'Compute',
        implemented: false,
      },
      {
        id: 'storage-cleanup',
        title: 'Storage Cleanup & Archival',
        description:
          'Archive old data and clean up unused files to optimize storage costs',
        potentialSavings: 280.0,
        effort: 'low',
        impact: 'medium',
        category: 'Storage',
        implemented: false,
      },
      {
        id: 'cache-optimization',
        title: 'Advanced Caching Strategy',
        description:
          'Implement intelligent caching to reduce API calls and compute overhead',
        potentialSavings: 180.0,
        effort: 'medium',
        impact: 'medium',
        category: 'Network',
        implemented: true,
      },
      {
        id: 'ai-model-optimization',
        title: 'AI Model Optimization',
        description:
          'Optimize ML models for reduced inference costs and faster processing',
        potentialSavings: 225.0,
        effort: 'high',
        impact: 'high',
        category: 'AI/ML',
        implemented: false,
      },
      {
        id: 'database-optimization',
        title: 'Database Query Optimization',
        description: 'Optimize slow queries and improve database performance',
        potentialSavings: 150.0,
        effort: 'medium',
        impact: 'medium',
        category: 'Storage',
        implemented: false,
      },
      {
        id: 'reserved-instances',
        title: 'Reserved Instance Commitment',
        description: 'Commit to reserved instances for predictable workloads',
        potentialSavings: 320.0,
        effort: 'low',
        impact: 'high',
        category: 'Compute',
        implemented: false,
      },
    ];

    setOptimizations(costOptimizations);
    setProjectedSavings(
      costOptimizations
        .filter(opt => !opt.implemented)
        .reduce((sum, opt) => sum + opt.potentialSavings, 0),
    );
  };

  const exportReport = (format: 'pdf' | 'csv' | 'excel') => {
    // Simulate export functionality
    const data = {
      totalCost,
      breakdown: costBreakdown,
      services: serviceCosts,
      optimizations,
      projectedSavings,
      reportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cost-analysis-${format}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setShowExportDialog(false);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
    case 'up':
      return <TrendingUp color="error" />;
    case 'down':
      return <TrendingDown color="success" />;
    case 'stable':
      return <Timeline color="info" />;
    default:
      return <Timeline />;
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
    case 'low':
      return 'success';
    case 'medium':
      return 'warning';
    case 'high':
      return 'error';
    default:
      return 'default';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
    case 'low':
      return 'info';
    case 'medium':
      return 'warning';
    case 'high':
      return 'success';
    default:
      return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            Cost Analysis Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Comprehensive cost tracking and optimization recommendations
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small">
            <InputLabel>Timeframe</InputLabel>
            <Select
              value={timeframe}
              onChange={e => setTimeframe(e.target.value)}
              label="Timeframe"
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<GetApp />}
            onClick={() => setShowExportDialog(true)}
          >
            Export Report
          </Button>
        </Box>
      </Box>

      {/* Cost Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AttachMoney
                sx={{ fontSize: 40, color: 'primary.main', mb: 1 }}
              />
              <Typography variant="h4">
                ${totalCost.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Monthly Cost
              </Typography>
              <LinearProgress variant="determinate" value={75} sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingDown
                sx={{ fontSize: 40, color: 'success.main', mb: 1 }}
              />
              <Typography variant="h4" color="success.main">
                ${projectedSavings.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Potential Savings
              </Typography>
              <Typography variant="caption" color="success.main">
                {((projectedSavings / totalCost) * 100).toFixed(1)}% reduction
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Assessment sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4">{serviceCosts.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                Services Monitored
              </Typography>
              <Typography variant="caption" color="info.main">
                Real-time tracking
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircle
                sx={{ fontSize: 40, color: 'warning.main', mb: 1 }}
              />
              <Typography variant="h4">
                {optimizations.filter(opt => !opt.implemented).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Optimizations Available
              </Typography>
              <Typography variant="caption" color="warning.main">
                Ready to implement
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
        >
          <Tab label="Cost Breakdown" />
          <Tab label="Service Analysis" />
          <Tab label="Optimizations" />
        </Tabs>

        {/* Cost Breakdown Tab */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {costBreakdown.map(item => (
                <Grid size={{ xs: 12, md: 6 }} key={item.category}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 2,
                        }}
                      >
                        <Typography variant="h6">{item.category}</Typography>
                        {getTrendIcon(item.trend)}
                      </Box>

                      <Typography
                        variant="h4"
                        color="primary.main"
                        gutterBottom
                      >
                        ${item.monthly.toLocaleString()}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        ${item.daily.toFixed(2)}/day • {item.percentage}% of
                        total
                      </Typography>

                      <LinearProgress
                        variant="determinate"
                        value={item.percentage}
                        sx={{ mb: 1 }}
                      />

                      <Typography variant="caption" color="text.secondary">
                        {item.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Service Analysis Tab */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Service</TableCell>
                    <TableCell align="right">Monthly Cost</TableCell>
                    <TableCell align="right">CPU</TableCell>
                    <TableCell align="right">Memory</TableCell>
                    <TableCell align="right">Storage</TableCell>
                    <TableCell align="right">Network</TableCell>
                    <TableCell align="right">Cost/Request</TableCell>
                    <TableCell align="right">Total Requests</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {serviceCosts.map(service => (
                    <TableRow key={service.serviceName}>
                      <TableCell>{service.serviceName}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="primary.main">
                          ${service.monthlyCost.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        ${service.cpu.toFixed(2)}
                      </TableCell>
                      <TableCell align="right">
                        ${service.memory.toFixed(2)}
                      </TableCell>
                      <TableCell align="right">
                        ${service.storage.toFixed(2)}
                      </TableCell>
                      <TableCell align="right">
                        ${service.network.toFixed(2)}
                      </TableCell>
                      <TableCell align="right">
                        ${service.costPerRequest.toFixed(4)}
                      </TableCell>
                      <TableCell align="right">
                        {service.totalRequests.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Optimizations Tab */}
        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            <List>
              {optimizations.map(opt => (
                <ListItem
                  key={opt.id}
                  sx={{
                    mb: 2,
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    border: 1,
                    borderColor: 'divider',
                  }}
                >
                  <ListItemIcon>
                    {opt.implemented ? (
                      <CheckCircle color="success" />
                    ) : (
                      <Warning color="warning" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        {opt.title}
                        <Chip
                          label={`$${opt.potentialSavings}/mo`}
                          color="success"
                          size="small"
                        />
                        <Chip
                          label={`${opt.effort} effort`}
                          color={getEffortColor(opt.effort) as any}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={`${opt.impact} impact`}
                          color={getImpactColor(opt.impact) as any}
                          size="small"
                          variant="outlined"
                        />
                        {opt.implemented && (
                          <Chip
                            label="Implemented"
                            color="success"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                    secondary={opt.description}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Paper>

      {/* Export Dialog */}
      <Dialog
        open={showExportDialog}
        onClose={() => setShowExportDialog(false)}
      >
        <DialogTitle>Export Cost Analysis Report</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Choose the format for your cost analysis report:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
            <Button variant="outlined" onClick={() => exportReport('pdf')}>
              Export as PDF
            </Button>
            <Button variant="outlined" onClick={() => exportReport('excel')}>
              Export as Excel
            </Button>
            <Button variant="outlined" onClick={() => exportReport('csv')}>
              Export as CSV
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExportDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const CostAnalysisDashboard: React.FC<React.ComponentProps<typeof CostAnalysisDashboardSample>> = (props) => (
  <DemoSurfaceGate
    testId="cost-analysis"
    title="Cost analysis is not live on this testnet"
    description="This preview contains illustrative data or simulated actions, not verified testnet results."
  >
    <CostAnalysisDashboardSample {...props} />
  </DemoSurfaceGate>
);

export default CostAnalysisDashboard;
