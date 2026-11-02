/**
 * Comprehensive Governance Dashboard
 * Hub for governance features in the full-studio mobile shell: Overview,
 * Trust Weights, plus navigation tabs to dedicated governance pages
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  Gavel,
  AccountBalance,
  TrendingUp,
  Analytics,
  Assessment,
  SwapHoriz,
  Dashboard,
  Tune,
} from '@mui/icons-material';
import { useNavigate } from 'react-router';

import TrustWeightGovernancePanel from './TrustWeightGovernancePanel';
import GovernancePanel from '../DeFi/GovernancePanel';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`governance-tabpanel-${index}`}
      aria-labelledby={`governance-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const REDIRECT_TABS = {
  2: '/governance/delegation',
  3: '/governance/treasury',
  4: '/governance/analytics',
  5: '/governance/quadratic',
  6: '/governance/conviction',
};

const ComprehensiveGovernanceDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    if (REDIRECT_TABS[newValue]) {
      navigate(REDIRECT_TABS[newValue]);
      return;
    }
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Dashboard sx={{ mr: 2 }} />
          <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
            Governance Dashboard
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Overview" icon={<Analytics />} />
          <Tab label="Trust Weights" icon={<Tune />} />
          <Tab label="Delegation" icon={<SwapHoriz />} />
          <Tab label="Treasury" icon={<AccountBalance />} />
          <Tab label="Analytics" icon={<Assessment />} />
          <Tab label="Quadratic Voting" icon={<Gavel />} />
          <Tab label="Conviction Voting" icon={<TrendingUp />} />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        <GovernancePanel />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <TrustWeightGovernancePanel />
      </TabPanel>
    </Box>
  );
};

export default ComprehensiveGovernanceDashboard;
