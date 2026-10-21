import React, { useState, useEffect } from 'react';
import { WrfCard, WrfAlert } from '../DesignSystem';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import axios from 'axios';

/**
 * MCPContextSelector Component
 *
 * Allows users to select which context providers to include in their queries
 */
const MCPContextSelector = ({ onProvidersChange, selectedProviders = [] }) => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/mcp/providers');
        setProviders(response.data.providers || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching MCP context providers:', err);
        setError(
          'Failed to load available context providers. Please try again later.',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  const handleCheckboxChange = (providerId, checked) => {
    if (onProvidersChange) {
      const currentIds = selectedProviders.map(p => p.id);
      let newCheckedIds;
      if (checked) {
        newCheckedIds = [...currentIds, providerId];
      } else {
        newCheckedIds = currentIds.filter(id => id !== providerId);
      }
      const selectedProviderObjects = providers.filter(provider =>
        newCheckedIds.includes(provider.id),
      );
      onProvidersChange(selectedProviderObjects);
    }
  };

  return (
    <WrfCard
      headerTitle={<Typography variant="h6">Select Context Providers</Typography>}
      className="mcp-context-selector"
    >
      {error && (
        <WrfAlert
          severity="error"
          title="Error"
          className="mb-3"
        >
          {error}
        </WrfAlert>
      )}

      {loading ? (
        <div className="mcp-loading-container">
          <CircularProgress size={40} />
          <Typography component="span" className="mt-3">Loading context providers...</Typography>
        </div>
      ) : (
        <Stack direction="column" spacing={2} sx={{ width: '100%' }}>
          <Typography paragraph>
            Select which data sources to include in your context-aware queries:
          </Typography>

          <FormGroup>
            {providers.map(provider => (
              <FormControlLabel
                key={provider.id}
                control={
                  <Checkbox
                    checked={selectedProviders.some(p => p.id === provider.id)}
                    onChange={(e) => handleCheckboxChange(provider.id, e.target.checked)}
                    disabled={provider.status === 'offline'}
                  />
                }
                label={provider.name}
              />
            ))}
          </FormGroup>

          <Divider />

          {providers.length > 0 && (
            <div className="provider-details">
              <Typography variant="subtitle1">Provider Information</Typography>
              {providers.map(provider => (
                <div key={provider.id} className="provider-detail-item">
                  <Typography paragraph>
                    <Typography component="span" fontWeight="bold">{provider.name}</Typography> - {provider.description}
                  </Typography>
                  <Typography paragraph>
                    <Typography component="span" color="text.secondary">
                      Data types: {(provider.contextTypes || []).join(', ')}
                    </Typography>
                  </Typography>
                </div>
              ))}
            </div>
          )}
        </Stack>
      )}
    </WrfCard>
  );
};

export default MCPContextSelector;
