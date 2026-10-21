import React, { useState } from 'react';
import axios from 'axios';
import { WrfCard, WrfButton, WrfInput, WrfAlert } from '../DesignSystem';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';

import MCPModelSelector from './MCPModelSelector';
import MCPContextSelector from './MCPContextSelector';
import { devLog } from '../../utils/logger';
// Icons replaced with custom implementations

// Custom icon replacements
const SendOutlined = () => <span className="icon">&#x1F4E4;</span>;
const InfoCircleOutlined = () => <span className="icon">&#x2139;&#xFE0F;</span>;
const LoadingOutlined = () => <span className="icon">&#x26AA;</span>;

// Local message helper (replaces CustomComponents message)
const message = {
  error: (s) => console.error(s),
  success: (s) => devLog(s),
  info: (s) => devLog(s),
  warning: (s) => console.warn(s),
};

/**
 * Model Context Protocol Dashboard Component
 *
 * Main interface for the Model Context Protocol (MCP) system
 */
const MCPDashboard = () => {
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedProviders, setSelectedProviders] = useState([]);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleModelSelect = model => {
    setSelectedModel(model);
  };

  const handleProvidersChange = providers => {
    setSelectedProviders(providers);
  };

  const handleSubmit = async () => {
    if (!selectedModel) {
      message.error('Please select an AI model');
      return;
    }

    if (selectedProviders.length === 0) {
      message.error('Please select at least one context provider');
      return;
    }

    if (!query.trim()) {
      message.error('Please enter a query');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResponse('');

      const payload = {
        modelId: selectedModel.id,
        providers: selectedProviders.map(p => p.id),
        query: query.trim(),
        options: {
          temperature: 0.7,
          maxTokens: 1000,
          includeMetadata: true,
        },
      };

      const response = await axios.post('/api/mcp/query', payload);
      setResponse(
        response.data.result || response.data.response || 'No response received',
      );
    } catch (err) {
      console.error('Error submitting MCP query:', err);
      setError('Failed to process your query. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="site-layout-background mcp-dashboard">
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h4">Model Context Protocol (MCP)</Typography>
          <Typography paragraph>
            The Model Context Protocol provides AI models with context-aware
            information from the Wrfcoin blockchain, weather data systems,
            governance structures, and computational resources.
          </Typography>
        </Grid>
      </Grid>

      <Divider />

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <MCPModelSelector
            onModelSelect={handleModelSelect}
            selectedModel={selectedModel}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <MCPContextSelector
            onProvidersChange={handleProvidersChange}
            selectedProviders={selectedProviders}
          />
        </Grid>
      </Grid>

      <Divider />

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <WrfCard headerTitle={<Typography variant="h6">Ask a Context-Aware Question</Typography>}>
            <Stack direction="column" spacing={2} sx={{ width: '100%' }}>
              <WrfInput
                placeholder="Enter your query..."
                multiline
                minRows={3}
                maxRows={6}
                value={query}
                onChange={e => setQuery(e.target.value)}
                disabled={loading}
                fullWidth
              />
              <div style={{ textAlign: 'right', marginTop: '10px' }}>
                <WrfButton
                  variant="contained"
                  startIcon={loading ? <LoadingOutlined /> : <SendOutlined />}
                  onClick={handleSubmit}
                  disabled={
                    loading ||
                    !selectedModel ||
                    selectedProviders.length === 0 ||
                    !query.trim()
                  }
                >
                  {loading ? 'Processing...' : 'Submit Query'}
                </WrfButton>
              </div>
            </Stack>
          </WrfCard>
        </Grid>
      </Grid>

      {error && (
        <Grid container spacing={2} sx={{ marginTop: '16px' }}>
          <Grid item xs={12}>
            <WrfAlert severity="error" title="Error">
              {error}
            </WrfAlert>
          </Grid>
        </Grid>
      )}

      {response && (
        <Grid container spacing={2} sx={{ marginTop: '16px' }}>
          <Grid item xs={12}>
            <WrfCard
              headerTitle={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <InfoCircleOutlined style={{ marginRight: '8px' }} />
                  <span>Response from {selectedModel?.name}</span>
                </div>
              }
              className="mcp-response-card"
            >
              <Typography paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                {response}
              </Typography>
              <Divider />
              <Typography paragraph color="text.secondary">
                <small>
                  Context Providers Used:{' '}
                  {selectedProviders.map(p => p.name).join(', ')}
                </small>
              </Typography>
            </WrfCard>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default MCPDashboard;
