import React, { useState, useEffect } from 'react';
import { WrfCard, WrfSelect, WrfAlert } from '../DesignSystem';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import axios from 'axios';

/**
 * MCPModelSelector Component
 *
 * Allows users to select an AI model for use within the Model Context Protocol system
 */
const MCPModelSelector = ({ onModelSelect, selectedModel }) => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/mcp/models');
        setModels(response.data.models || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching MCP models:', err);
        setError('Failed to load available AI models. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  const handleModelChange = (e) => {
    const modelId = e.target.value;
    const selected = models.find(model => model.id === modelId);
    if (selected && onModelSelect) {
      onModelSelect(selected);
    }
  };

  const getModelChipColor = (type) => {
    if (type === 'local') return 'success';
    if (type === 'external') return 'warning';
    return 'primary';
  };

  return (
    <WrfCard
      headerTitle={<Typography variant="h6">Select AI Model</Typography>}
      className="mcp-model-selector"
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
          <Typography component="span" className="mt-3">Loading available models...</Typography>
        </div>
      ) : (
        <Stack direction="column" spacing={2} sx={{ width: '100%' }}>
          <Typography component="span">Choose an AI model to process your context-aware queries:</Typography>
          <WrfSelect
            value={selectedModel?.id || ''}
            onChange={handleModelChange}
            options={models.map(model => ({
              value: model.id,
              label: model.name,
            }))}
            fullWidth
          />

          {selectedModel && (
            <div className="mcp-model-details mt-3">
              <Chip
                label={selectedModel.type}
                color={getModelChipColor(selectedModel.type)}
                size="small"
                sx={{ mb: 1 }}
              />
              <br />
              <Typography component="span" fontWeight="bold">Description:</Typography>
              <Typography component="span"> {selectedModel.description}</Typography>
              <br />
              <Typography component="span" fontWeight="bold">Context Limit:</Typography>
              <Typography component="span"> {selectedModel.contextLimit} tokens</Typography>
              <br />
              <Typography component="span" fontWeight="bold">Provider:</Typography>
              <Typography component="span"> {selectedModel.provider}</Typography>
            </div>
          )}
        </Stack>
      )}
    </WrfCard>
  );
};

export default MCPModelSelector;
