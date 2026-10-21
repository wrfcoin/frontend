import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Tabs,
  Tab,
  Chip,
  Card,
  CardContent,
  Divider,
  Select,
  MenuItem,
  Tooltip,
} from '@mui/material';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import Co2 from '@mui/icons-material/Co2';
import Forest from '@mui/icons-material/Forest';
import Assessment from '@mui/icons-material/Assessment';
import VerifiedUser from '@mui/icons-material/VerifiedUser';
import TrendingDown from '@mui/icons-material/TrendingDown';
import PictureAsPdf from '@mui/icons-material/PictureAsPdf';
import Warning from '@mui/icons-material/Warning';

import SankeyDiagram from './SankeyDiagram';
import ScenarioAnalysis from './ScenarioAnalysis';
import ScopeBreakdown from './ScopeBreakdown';
import CreditVerification from './CreditVerification';
import TCFDReport from './TCFDReport';
import FEATURES from '../../config/features';
import PublicViewerNotice from '../common/PublicViewerNotice';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  ChartTooltip,
  Legend,
);

// ---------------------------------------------------------------------------
// Constants & sample data (frontend#303)
//
// Every figure in this module and its sub-views (Sankey flows, scope
// breakdown, scenario modelling, credit verification, the TCFD report) is
// fabricated: backend has no carbon-credit or ESG data source at all
// (capability `carbonReporting` is `unavailable`, backend#1122/#1130). Under
// the demo-surface policy (FEATURES.demoSurfaces, default off) the sample
// dashboard renders beneath an unmistakable "Simulated preview" banner;
// otherwise the page shows the honest not-live state. The TCFD tab is
// additionally labelled illustrative and its export actions are disabled —
// a fabricated compliance disclosure must never be downloadable.
// ---------------------------------------------------------------------------

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const STAT_CARDS = [
  {
    label: 'Total Credits',
    value: '12,847',
    unit: 'tCO\u2082e',
    change: '+8.3%',
    changeDir: 'up',
    icon: Co2,
    color: '#3B82F6',
    bgColor: '#3B82F61A',
  },
  {
    label: 'Portfolio Value',
    value: '$384,410',
    unit: 'USD',
    change: '+12.7%',
    changeDir: 'up',
    icon: Assessment,
    color: '#10B981',
    bgColor: '#10B9811A',
  },
  {
    label: 'Offset Rate',
    value: '94.2%',
    unit: 'of emissions',
    change: '+2.1%',
    changeDir: 'up',
    icon: TrendingDown,
    color: '#8B5CF6',
    bgColor: '#8B5CF61A',
  },
  {
    label: 'Verification Score',
    value: 'A+',
    unit: 'rating',
    change: 'Stable',
    changeDir: 'flat',
    icon: VerifiedUser,
    color: '#F59E0B',
    bgColor: '#F59E0B1A',
  },
];

const MONTHLY_RETIRED = [840, 920, 1050, 980, 1120, 1200, 1080, 1150, 1210, 1340, 1280, 1390];
const MONTHLY_PURCHASED = [900, 1000, 1100, 1020, 1180, 1250, 1140, 1200, 1280, 1400, 1350, 1440];

const PRICE_HISTORY = [
  28.4, 29.1, 30.2, 29.8, 31.5, 32.1, 31.8, 33.2, 34.0, 35.1, 34.6, 36.2,
  37.0, 36.5, 38.1, 39.4, 38.8, 40.2, 41.5, 42.0, 41.3, 43.1, 44.2, 45.8,
];
const PRICE_LABELS = [
  'Jan 24', 'Feb 24', 'Mar 24', 'Apr 24', 'May 24', 'Jun 24',
  'Jul 24', 'Aug 24', 'Sep 24', 'Oct 24', 'Nov 24', 'Dec 24',
  'Jan 25', 'Feb 25', 'Mar 25', 'Apr 25', 'May 25', 'Jun 25',
  'Jul 25', 'Aug 25', 'Sep 25', 'Oct 25', 'Nov 25', 'Dec 25',
];

const NOTIFICATIONS = [
  {
    id: 1,
    type: 'warning',
    message: '3 credits pending verification',
    detail: 'VCS-6729-IS, GS-1287-ET, VCS-3912-NO require third-party verification',
    time: '2 hours ago',
  },
  {
    id: 2,
    type: 'alert',
    message: 'Annual TCFD report due in 14 days',
    detail: 'FY 2025 TCFD disclosure deadline: March 15, 2026',
    time: '1 day ago',
  },
  {
    id: 3,
    type: 'info',
    message: 'Carbon price up 4.2% this month',
    detail: 'Voluntary carbon market average: $45.80/tCO\u2082e',
    time: '3 days ago',
  },
  {
    id: 4,
    type: 'success',
    message: '1,390 credits retired in December',
    detail: 'Monthly retirement target exceeded by 12%',
    time: '1 week ago',
  },
];

const DATE_RANGES = ['Last 30 Days', 'Last Quarter', 'YTD', 'Last 12 Months', 'All Time'];
const TAB_LABELS = ['Portfolio', 'Scope Analysis', 'Scenario Modeling', 'Verification', 'TCFD Report (illustrative)'];

// ---------------------------------------------------------------------------
// Chart configurations
// ---------------------------------------------------------------------------

const retiredChartData = {
  labels: MONTHS,
  datasets: [
    {
      label: 'Credits Retired',
      data: MONTHLY_RETIRED,
      backgroundColor: '#10B981',
      borderRadius: 4,
      barPercentage: 0.6,
    },
    {
      label: 'Credits Purchased',
      data: MONTHLY_PURCHASED,
      backgroundColor: '#3B82F6',
      borderRadius: 4,
      barPercentage: 0.6,
    },
  ],
};

const retiredChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      grid: { color: '#334155' },
      ticks: { color: '#94A3B8', font: { size: 11 } },
    },
    y: {
      grid: { color: '#334155' },
      ticks: {
        color: '#94A3B8',
        font: { size: 11 },
        callback: (v) => `${v.toLocaleString()}`,
      },
      title: {
        display: true,
        text: 'tCO\u2082e',
        color: '#64748B',
      },
    },
  },
  plugins: {
    legend: {
      labels: { color: '#94A3B8', usePointStyle: true, padding: 16 },
    },
    tooltip: {
      backgroundColor: '#1E293B',
      borderColor: '#334155',
      borderWidth: 1,
      titleColor: '#F1F5F9',
      bodyColor: '#94A3B8',
      callbacks: {
        label: (ctx) => `${ctx.dataset.label}: ${ctx.raw.toLocaleString()} tCO\u2082e`,
      },
    },
  },
};

const priceChartData = {
  labels: PRICE_LABELS,
  datasets: [
    {
      label: 'Credit Price ($/tCO\u2082e)',
      data: PRICE_HISTORY,
      borderColor: '#8B5CF6',
      backgroundColor: '#8B5CF61A',
      fill: true,
      tension: 0.4,
      pointRadius: 2,
      pointBackgroundColor: '#8B5CF6',
      borderWidth: 2,
    },
  ],
};

const priceChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      grid: { color: '#334155' },
      ticks: { color: '#94A3B8', font: { size: 10 }, maxTicksLimit: 12 },
    },
    y: {
      grid: { color: '#334155' },
      ticks: {
        color: '#94A3B8',
        font: { size: 11 },
        callback: (v) => `$${v}`,
      },
      title: {
        display: true,
        text: '$/tCO\u2082e',
        color: '#64748B',
      },
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1E293B',
      borderColor: '#334155',
      borderWidth: 1,
      titleColor: '#F1F5F9',
      bodyColor: '#94A3B8',
      callbacks: {
        label: (ctx) => `$${ctx.raw.toFixed(2)}/tCO\u2082e`,
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Notification type config
// ---------------------------------------------------------------------------

const NOTIF_COLORS = {
  warning: { color: '#F59E0B', bg: '#F59E0B1A', icon: Warning },
  alert: { color: '#EF4444', bg: '#EF44441A', icon: Warning },
  info: { color: '#3B82F6', bg: '#3B82F61A', icon: Assessment },
  success: { color: '#10B981', bg: '#10B9811A', icon: VerifiedUser },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SAMPLE_BADGE_SX = { height: 20, fontSize: 10, bgcolor: 'rgba(148,163,184,0.2)', color: '#94A3B8' };

const CarbonReportDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [dateRange, setDateRange] = useState('Last 12 Months');
  // Fabricated dashboard renders only under the demo-surface policy (frontend#303).
  const showSample = FEATURES.demoSurfaces;

  if (!showSample) {
    return (
      <Box sx={{ bgcolor: '#0F172A', minHeight: '100vh', p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Co2 sx={{ color: '#10B981', fontSize: 36 }} />
          <Typography variant="h4" sx={{ color: '#F1F5F9', fontWeight: 700 }}>
            Carbon Credit Analytics
          </Typography>
        </Box>
        <PublicViewerNotice
          reason="not-live"
          title="Carbon reporting is not live on the testnet yet"
          description="No carbon-credit, offset or ESG data source is connected to this platform, so there are no credits, prices, scope figures or TCFD disclosures to show. This page will populate once a real carbon-accounting backend exists."
        />
      </Box>
    );
  }

  // Render the active tab content
  const renderTabContent = () => {
    switch (activeTab) {
    case 0:
      return <PortfolioView />;
    case 1:
      return <ScopeBreakdown />;
    case 2:
      return <ScenarioAnalysis />;
    case 3:
      return <CreditVerification />;
    case 4:
      return <TCFDReport />;
    default:
      return null;
    }
  };

  return (
    <Box sx={{ bgcolor: '#0F172A', minHeight: '100vh', p: 3 }}>
      <Paper
        data-testid="carbon-sample-banner"
        sx={{ bgcolor: '#F59E0B22', border: '1px solid #F59E0B', borderRadius: 2, p: 2, mb: 3 }}
      >
        <Typography variant="body1" sx={{ color: '#F1F5F9', fontWeight: 700 }}>
          Simulated preview — illustrative carbon data, not an ESG or compliance record
        </Typography>
        <Typography variant="body2" sx={{ color: '#94A3B8' }}>
          Every credit count, price, scope figure, flow and TCFD item on this page is invented sample
          data. WRFCoin has no carbon-accounting data source yet. Do not use anything here for
          reporting, disclosure or investment decisions.
        </Typography>
      </Paper>
      {/* Dashboard Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Co2 sx={{ color: '#10B981', fontSize: 36 }} />
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h4" sx={{ color: '#F1F5F9', fontWeight: 700 }}>
                Carbon Credit Analytics
              </Typography>
              <Chip label="Sample data" size="small" data-testid="carbon-sample-badge" sx={SAMPLE_BADGE_SX} />
            </Box>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              TCFD-Compliant Carbon Portfolio Management
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            size="small"
            sx={{
              color: '#94A3B8',
              bgcolor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: 1,
              '.MuiOutlinedInput-notchedOutline': { border: 'none' },
              '.MuiSelect-icon': { color: '#64748B' },
              minWidth: 160,
            }}
          >
            {DATE_RANGES.map((r) => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </Select>
          <Button
            variant="contained"
            startIcon={<PictureAsPdf />}
            disabled
            title="Export disabled: this is sample data, not a TCFD disclosure"
            sx={{
              bgcolor: '#3B82F6',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { bgcolor: '#2563EB' },
            }}
          >
            Export TCFD Report (disabled — sample data)
          </Button>
        </Box>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {STAT_CARDS.map((stat) => {
          const IconComp = stat.icon;
          return (
            <Grid item xs={12} sm={6} md={3} key={stat.label}>
              <Paper
                sx={{
                  bgcolor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: 2,
                  p: 2.5,
                  transition: 'border-color 0.2s',
                  '&:hover': { borderColor: stat.color },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>
                      {stat.label}
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#F1F5F9', fontWeight: 700, mt: 0.5 }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                      {stat.unit}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      bgcolor: stat.bgColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconComp sx={{ color: stat.color, fontSize: 24 }} />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1.5 }}>
                  <Chip
                    label={stat.change}
                    size="small"
                    sx={{
                      bgcolor:
                        stat.changeDir === 'up'
                          ? '#10B9811A'
                          : stat.changeDir === 'down'
                            ? '#EF44441A'
                            : '#94A3B81A',
                      color:
                        stat.changeDir === 'up'
                          ? '#10B981'
                          : stat.changeDir === 'down'
                            ? '#EF4444'
                            : '#94A3B8',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      height: 22,
                    }}
                  />
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    vs previous period
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* Tab Navigation */}
      <Paper
        sx={{
          bgcolor: '#1E293B',
          border: '1px solid #334155',
          borderRadius: 2,
          mb: 3,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 2,
            '& .MuiTabs-indicator': { bgcolor: '#3B82F6', height: 3, borderRadius: '3px 3px 0 0' },
            '& .MuiTab-root': {
              color: '#64748B',
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.9rem',
              minHeight: 52,
            },
            '& .Mui-selected': { color: '#F1F5F9' },
          }}
        >
          {TAB_LABELS.map((label) => (
            <Tab key={label} label={label} />
          ))}
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {renderTabContent()}
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Portfolio View (default tab)
// ---------------------------------------------------------------------------

const PortfolioView = () => {
  return (
    <Box>
      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Monthly Credits Retired */}
        <Grid item xs={12} md={7}>
          <Paper
            sx={{
              bgcolor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: 2,
              p: 2.5,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ color: '#F1F5F9', fontWeight: 600 }}>
                Monthly Carbon Credits Activity
              </Typography>
              <Chip
                label="FY 2025"
                size="small"
                sx={{ bgcolor: '#3B82F61A', color: '#3B82F6', fontWeight: 600 }}
              />
            </Box>
            <Box sx={{ height: 300 }}>
              <Bar data={retiredChartData} options={retiredChartOptions} />
            </Box>
          </Paper>
        </Grid>

        {/* Credit Price Trend */}
        <Grid item xs={12} md={5}>
          <Paper
            sx={{
              bgcolor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: 2,
              p: 2.5,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ color: '#F1F5F9', fontWeight: 600 }}>
                Credit Price Trend
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                <Typography variant="h5" sx={{ color: '#8B5CF6', fontWeight: 700 }}>
                  $45.80
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  /tCO&#8322;e
                </Typography>
              </Box>
            </Box>
            <Box sx={{ height: 300 }}>
              <Line data={priceChartData} options={priceChartOptions} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Sankey Diagram */}
      <Box sx={{ mb: 3 }}>
        <SankeyDiagram />
      </Box>

      {/* Bottom row: Quick Actions + Notifications */}
      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              bgcolor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: 2,
              p: 2.5,
            }}
          >
            <Typography variant="subtitle1" sx={{ color: '#F1F5F9', fontWeight: 600, mb: 2 }}>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {[
                { label: 'Purchase Credits', icon: Co2, color: '#3B82F6', desc: 'Buy verified carbon credits from the marketplace' },
                { label: 'Retire Credits', icon: Forest, color: '#10B981', desc: 'Permanently retire credits against your emissions' },
                { label: 'Generate Report', icon: PictureAsPdf, color: '#8B5CF6', desc: 'Create TCFD-compliant disclosure report' },
              ].map((action) => {
                const ActionIcon = action.icon;
                return (
                  <Paper
                    key={action.label}
                    sx={{
                      bgcolor: '#0F172A',
                      border: '1px solid #334155',
                      borderRadius: 2,
                      p: 2,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: action.color,
                        bgcolor: `${action.color}08`,
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1.5,
                          bgcolor: `${action.color}1A`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <ActionIcon sx={{ color: action.color, fontSize: 22 }} />
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#F1F5F9', fontWeight: 600 }}>
                          {action.label}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          {action.desc}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          </Paper>
        </Grid>

        {/* Notifications */}
        <Grid item xs={12} md={8}>
          <Paper
            sx={{
              bgcolor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: 2,
              p: 2.5,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ color: '#F1F5F9', fontWeight: 600 }}>
                Notifications & Alerts
              </Typography>
              <Chip
                label={`${NOTIFICATIONS.length} active`}
                size="small"
                sx={{ bgcolor: '#F59E0B1A', color: '#F59E0B', fontWeight: 600 }}
              />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {NOTIFICATIONS.map((notif) => {
                const config = NOTIF_COLORS[notif.type] || NOTIF_COLORS.info;
                const NotifIcon = config.icon;
                return (
                  <Paper
                    key={notif.id}
                    sx={{
                      bgcolor: '#0F172A',
                      border: '1px solid #334155',
                      borderRadius: 1.5,
                      p: 1.5,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 1,
                        bgcolor: config.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        mt: 0.25,
                      }}
                    >
                      <NotifIcon sx={{ color: config.color, fontSize: 18 }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <Typography variant="body2" sx={{ color: '#F1F5F9', fontWeight: 600, fontSize: '0.8rem' }}>
                          {notif.message}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#475569', whiteSpace: 'nowrap', ml: 1 }}>
                          {notif.time}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        {notif.detail}
                      </Typography>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CarbonReportDashboard;
