import React, { useState, useEffect } from 'react';

import { Box, Grid, Typography, Paper } from '@mui/material';

import NodeTypeDistributionChart from './Charts/NodeTypeDistributionChart';
import GeographicDistributionChart from './Charts/GeographicDistributionChart';
import ComputationalPowerDistributionChart from './Charts/ComputationalPowerDistributionChart';
import FileStorageDistributionChart from './Charts/FileStorageDistributionChart';

const DistributionDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [distributionData, setDistributionData] = useState({
    nodeTypes: null,
    geographic: null,
    computationalPower: null,
    fileStorage: null,
  });

  useEffect(() => {
    // Fetch distribution data
    const fetchDistributionData = async () => {
      try {
        // In a real scenario, we would fetch this data from an API
        // For now, we'll use the default data provided in each chart component

        // Simulate API call delay
        setTimeout(() => {
          setDistributionData({
            nodeTypes: null, // Using default data in the component
            geographic: null, // Using default data in the component
            computationalPower: null, // Using default data in the component
            fileStorage: null, // Using default data in the component
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching distribution data:', error);
        setError('Failed to load distribution data. Please try again later.');
        setLoading(false);
      }
    };

    fetchDistributionData();
  }, []);

  // Render loading state
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '300px',
        }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading distribution data...
        </Typography>
      </Box>
    );
  }

  // Display error message if there's an error
  if (error) {
    return (
      <Box
        sx={{
          p: 3,
          bgcolor: '#f8d7da',
          color: '#721c24',
          borderRadius: 1,
          textAlign: 'center',
        }}
      >
        <Typography variant="h6">Error</Typography>
        <Typography variant="body1">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Paper
        elevation={0}
        sx={{ p: 3, backgroundColor: '#ffeecc', borderRadius: 2, mb: 3 }}
      >
        <Typography
          variant="h5"
          sx={{ mb: 1, fontWeight: 'medium', color: '#333' }}
        >
          Network Distribution Metrics
        </Typography>
        <Typography variant="body1" sx={{ mb: 2, color: '#666' }}>
          Comprehensive visualization of network resources and node distribution
          across the Wrfcoin ecosystem
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        {/* Row 1 - Node Type and Geographic Distribution */}
        <Grid size={{ xs: 12, md: 6 }}>
          <NodeTypeDistributionChart data={distributionData.nodeTypes} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <GeographicDistributionChart data={distributionData.geographic} />
        </Grid>

        {/* Row 2 - Computational Power and File Storage Distribution */}
        <Grid size={{ xs: 12, md: 6 }}>
          <ComputationalPowerDistributionChart
            data={distributionData.computationalPower}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FileStorageDistributionChart data={distributionData.fileStorage} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default DistributionDashboard;
