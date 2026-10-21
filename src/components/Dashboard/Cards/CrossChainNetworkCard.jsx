import React, { useState, useEffect } from 'react';

import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import {
  AccountTree as ChainIcon,
  ConnectWithoutContact as BridgeIcon,
} from '@mui/icons-material';

import './MetricCard.css';

const CrossChainNetworkCard = () => {
  const [networkData, setNetworkData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNetworkData = async () => {
      try {
        setLoading(true);

        // Simulate network data - replace with actual API call when available
        const data = {
          totalChains: 15,
          activeBridges: 8,
          supportedNetworks: [
            'Ethereum',
            'Binance Smart Chain',
            'Polygon',
            'Avalanche',
            'Solana',
            'Cosmos',
            'Polkadot',
            'Near Protocol',
            'Fantom',
            'Arbitrum',
            'Optimism',
            'Cardano',
            'Terra',
            'Harmony',
            'Moonbeam',
          ],
          bridgeProtocols: [
            'LayerZero',
            'Axelar',
            'Wormhole',
            'Multichain',
            'Synapse',
            'Hop Protocol',
            'Celer Bridge',
            'Rainbow Bridge',
          ],
        };

        setNetworkData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching network data:', err);
        setError('Failed to load network data');
      } finally {
        setLoading(false);
      }
    };

    fetchNetworkData();

    // Refresh data every 30 seconds
    const interval = setInterval(fetchNetworkData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="metric-card">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Cross-Chain Network
          </Typography>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="150px"
          >
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="metric-card">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Cross-Chain Network
          </Typography>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="150px"
          >
            <Typography color="error">{error}</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="metric-card" style={{ width: '100%', height: '100%' }}>
      <CardContent
        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      >
        <Typography
          variant="h6"
          gutterBottom
          style={{ color: '#4fc3f7', marginBottom: '20px' }}
        >
          Cross-Chain Network
        </Typography>

        <Box
          display="flex"
          justifyContent="space-around"
          alignItems="center"
          style={{ flex: 1 }}
        >
          {/* Chains Metric */}
          <Box textAlign="center" style={{ flex: 1 }}>
            <ChainIcon
              style={{
                fontSize: '2.5rem',
                color: '#4fc3f7',
                marginBottom: '8px',
              }}
            />
            <Typography
              variant="h3"
              style={{
                fontWeight: 'bold',
                color: '#fff',
                marginBottom: '4px',
              }}
            >
              {networkData?.totalChains || 0}
            </Typography>
            <Typography
              variant="body2"
              style={{
                color: '#ccc',
                fontSize: '0.9rem',
              }}
            >
              Supported Chains
            </Typography>
          </Box>

          {/* Divider */}
          <Box
            style={{
              width: '1px',
              height: '80px',
              backgroundColor: '#444',
              margin: '0 20px',
            }}
          />

          {/* Bridges Metric */}
          <Box textAlign="center" style={{ flex: 1 }}>
            <BridgeIcon
              style={{
                fontSize: '2.5rem',
                color: '#66bb6a',
                marginBottom: '8px',
              }}
            />
            <Typography
              variant="h3"
              style={{
                fontWeight: 'bold',
                color: '#fff',
                marginBottom: '4px',
              }}
            >
              {networkData?.activeBridges || 0}
            </Typography>
            <Typography
              variant="body2"
              style={{
                color: '#ccc',
                fontSize: '0.9rem',
              }}
            >
              Active Bridges
            </Typography>
          </Box>
        </Box>

        {/* Network Status */}
        <Box style={{ marginTop: '16px', textAlign: 'center' }}>
          <Typography
            variant="caption"
            style={{
              color: '#4caf50',
              fontSize: '0.8rem',
              fontWeight: '500',
            }}
          >
            ✓ Multi-Chain Ecosystem Active
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CrossChainNetworkCard;
