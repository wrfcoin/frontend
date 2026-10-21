import React, { useState, useEffect, useSyncExternalStore } from 'react';
import NFTShowcase from '../components/ComputationalNFT/NFTShowcase';
import RecipeBuilder from '../components/ComputationalNFT/RecipeBuilder';
import WRFGFSRecipeBuilder from '../components/ComputationalNFT/WRFGFSRecipeBuilder';
import EnterpriseDemo from '../components/ComputationalNFT/EnterpriseDemo';
import ComputationalNFTList from './ComputationalNFTList';
import MPCPrivacyControls from '../components/ComputationalNFT/MPCPrivacyControls';
import ComputationalNFTMarketplace from '../components/nft/ComputationalNFTMarketplace';
import { fetchNftTotal } from '../services/nftTotal';
import { getAuthToken, subscribeAuthToken } from '../services/authTokenStore';
import {
  Box,
  Container,
  Typography,
  Grid,
  Tabs,
  Tab,
  AppBar,
  Toolbar,
  Fab,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Analytics as AnalyticsIcon,
  Storefront as StorefrontIcon,
  Build as BuildIcon,
  Business as BusinessIcon,
  Cloud as CloudIcon,
  Security as SecurityIcon,
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material';

// Import our new components

// Import existing components

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`nft-tabpanel-${index}`}
      aria-labelledby={`nft-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const EnhancedNFTPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  // frontend#353: the header shows only what a mounted route serves: the
  // minted count from GET /api/nft. The former header waited a second and then
  // invented 2,847 NFTs, 127 recipes, $245.8K value and 12.4 TFLOPS.
  const [nftTotal, setNftTotal] = useState({ status: 'loading', value: null });
  // The NFT router applies requireAuth, so the count needs a session. It is
  // re-read when the session changes, and a response started under an earlier
  // token is dropped.
  const token = useSyncExternalStore(subscribeAuthToken, getAuthToken, getAuthToken);

  useEffect(() => {
    if (!token) {
      setNftTotal({ status: 'signed-out', value: null });
      return undefined;
    }
    let cancelled = false;
    setNftTotal({ status: 'loading', value: null });
    const load = async () => {
      try {
        const value = await fetchNftTotal(token);
        if (!cancelled && getAuthToken() === token) setNftTotal({ status: 'ready', value });
      } catch {
        if (!cancelled && getAuthToken() === token) setNftTotal({ status: 'unavailable', value: null });
      }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [token]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const tabLabels = [
    { label: 'NFT Showcase', icon: <AnalyticsIcon /> },
    { label: 'Recipe Builder', icon: <BuildIcon /> },
    { label: 'WRF/GFS Models', icon: <CloudIcon /> },
    { label: 'Browse NFTs', icon: <StorefrontIcon /> },
    { label: 'Marketplace', icon: <ShoppingCartIcon /> },
    { label: 'Privacy', icon: <SecurityIcon /> },
    { label: 'Enterprise Demo', icon: <BusinessIcon /> },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      {/* Header with Live Metrics */}
      <AppBar position="static" sx={{ bgcolor: '#1a237e' }}>
        <Toolbar>
          <Typography
            variant="h4"
            component="h1"
            sx={{ flexGrow: 1, fontWeight: 'bold' }}
          >
            🌍 Computational NFTs
          </Typography>

          {/* The one served figure: minted count from GET /api/nft */}
          <Box sx={{ textAlign: 'center' }} data-testid="nft-header-total">
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {nftTotal.status === 'ready' ? nftTotal.value.toLocaleString() : '—'}
            </Typography>
            <Typography variant="caption">
              {nftTotal.status === 'unavailable'
                ? 'NFT count unavailable'
                : nftTotal.status === 'signed-out'
                  ? 'Sign in to see the NFT count'
                  : 'Minted NFTs'}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>


      {/* Navigation Tabs */}
      <Container maxWidth="lg">
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                minHeight: 64,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 'bold',
              },
            }}
          >
            {tabLabels.map((tab, index) => (
              <Tab
                key={index}
                icon={tab.icon}
                label={tab.label}
                iconPosition="start"
                id={`nft-tab-${index}`}
                aria-controls={`nft-tabpanel-${index}`}
              />
            ))}
          </Tabs>
        </Box>

        {/* Tab Content */}
        <TabPanel value={activeTab} index={0}>
          <NFTShowcase />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <RecipeBuilder />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <WRFGFSRecipeBuilder />
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <ComputationalNFTList />
        </TabPanel>

        <TabPanel value={activeTab} index={4}>
          <ComputationalNFTMarketplace />
        </TabPanel>

        <TabPanel value={activeTab} index={5}>
          <MPCPrivacyControls />
        </TabPanel>

        <TabPanel value={activeTab} index={6}>
          <EnterpriseDemo />
        </TabPanel>
      </Container>

      {/* Floating Action Button for Quick NFT Creation */}
      <Fab
        color="primary"
        aria-label="create nft"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          bgcolor: '#1a237e',
          '&:hover': {
            bgcolor: '#303f9f',
          },
        }}
        onClick={() => setActiveTab(1)}
      >
        <Badge badgeContent="NEW" color="error">
          <AddIcon />
        </Badge>
      </Fab>

    </Box>
  );
};

export default EnhancedNFTPage;
