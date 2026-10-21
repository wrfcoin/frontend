import DemoSurfaceGate from '../common/DemoSurfaceGate';
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Grid,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Paper,
  Tabs,
  Tab,
  Box,
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled components
const PluginCard = styled(Card)(({ theme, active }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s ease',
  border: active
    ? `2px solid ${theme.palette.primary.main}`
    : '1px solid rgba(0, 0, 0, 0.12)',
  '&:hover': {
    boxShadow: theme.shadows[6],
    transform: 'translateY(-5px)',
  },
}));

const PluginCardContent = styled(CardContent)({
  flexGrow: 1,
});

const PluginLogo = styled('div')({
  height: 80,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 16,
});

const ConfigDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(3),
  },
}));

function AIPluginsHubSample() {
  // State for plugin configuration and active plugin
  const [plugins, setPlugins] = useState([]);
  const [activePlugin, setActivePlugin] = useState('');
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [currentPlugin, setCurrentPlugin] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  // Fetch plugin configuration on component mount
  useEffect(() => {
    fetchPlugins();
  }, []);

  // Mock function to fetch plugin data - would be replaced with actual API call
  const fetchPlugins = async () => {
    try {
      // This would be an API call to the server
      // For now, we'll use mock data
      const mockPlugins = [
        {
          id: 'openai',
          name: 'OpenAI',
          description:
            'Integrate with OpenAI models like GPT-4 for advanced weather analysis.',
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/OpenAI_Logo.svg/512px-OpenAI_Logo.svg.png',
          enabled: false,
          config: {
            apiKey: '',
            model: 'gpt-4o',
          },
          features: [
            'Climate pattern analysis',
            'Extreme weather prediction',
            'Regional impact assessment',
          ],
        },
        {
          id: 'anthropic',
          name: 'Anthropic Claude',
          description:
            'Use Claude models for nuanced climate data interpretation and analysis.',
          logo: 'https://assets-global.website-files.com/62a2c1d40d0fb94dc7cb6edf/649e904e1ffb64f23a0c7be1_anthropic-logo.svg',
          enabled: false,
          config: {
            apiKey: '',
            model: 'claude-3-7-sonnet-20250219',
          },
          features: [
            'Long context understanding',
            'Data correlation analysis',
            'Environmental risk assessment',
          ],
        },
        {
          id: 'perplexity',
          name: 'Perplexity',
          description:
            'Research-focused AI to enhance weather data with latest scientific information.',
          logo: 'https://www.perplexity.ai/favicon.ico',
          enabled: false,
          config: {
            apiKey: '',
            model: 'llama-3.1-sonar-small-128k-online',
          },
          features: [
            'Real-time research integration',
            'Web knowledge enhancement',
            'Up-to-date climate research',
          ],
        },
        {
          id: 'xai',
          name: 'xAI Grok',
          description:
            'Leverage Grok for real-time data processing and analysis.',
          logo: 'https://www.x.ai/images/favicon.ico',
          enabled: false,
          config: {
            apiKey: '',
            model: 'grok-2-1212',
          },
          features: [
            'Real-time data processing',
            'Pattern recognition',
            'Advanced forecasting analysis',
          ],
        },
        {
          id: 'local',
          name: 'Local Models',
          description:
            'Run AI analysis completely on your local machine with no data sharing.',
          logo: '/static/images/local-model-icon.svg',
          enabled: false,
          config: {
            modelPath: '',
            modelType: 'llama3',
          },
          features: ['Complete privacy', 'No API costs', 'Offline capability'],
        },
      ];

      setPlugins(mockPlugins);

      // Mock active plugin
      setActivePlugin('mock');
    } catch (error) {
      console.error('Error fetching plugin configuration:', error);
    }
  };

  const handleOpenConfig = plugin => {
    setCurrentPlugin(plugin);
    setEnabled(plugin.enabled);
    setApiKey(plugin.config.apiKey || '');
    setModel(plugin.config.model || '');
    setConfigDialogOpen(true);
  };

  const handleCloseConfig = () => {
    setConfigDialogOpen(false);
    setTestResult(null);
  };

  const handleSaveConfig = async () => {
    try {
      // This would be an API call to save the configuration
      const updatedPlugins = plugins.map(p => {
        if (p.id === currentPlugin.id) {
          return {
            ...p,
            enabled: enabled,
            config: {
              ...p.config,
              apiKey: apiKey,
              model: model,
            },
          };
        }
        return p;
      });

      setPlugins(updatedPlugins);
      setConfigDialogOpen(false);
      setTestResult(null);

      // If enabling this plugin, make it active
      if (enabled) {
        setActivePlugin(currentPlugin.id);
      }
    } catch (error) {
      console.error('Error saving plugin configuration:', error);
    }
  };

  const handleTestConnection = async () => {
    try {
      // This would be an API call to test the plugin connection
      // For now, just simulate a successful test
      setTestResult({
        success: true,
        message: 'Connection successful! API key is valid.',
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Connection failed. Please check your API key and try again.',
      });
    }
  };

  const handleActivatePlugin = async pluginId => {
    try {
      // This would be an API call to set the active plugin
      setActivePlugin(pluginId);
    } catch (error) {
      console.error('Error activating plugin:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Container>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ mt: 3, fontWeight: 'bold' }}
      >
        AI Provider Integrations
      </Typography>

      <Typography variant="body1" paragraph>
        Connect your preferred AI services to enhance weather data analysis,
        forecasting, and computational NFTs. All AI processing is optional and
        configurable based on your preferences.
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Available Providers" />
          <Tab label="Active Integration" />
          <Tab label="Usage Analytics" />
          <Tab label="Settings" />
        </Tabs>
      </Paper>

      {tabValue === 0 && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {plugins.map(plugin => (
            <Grid item xs={12} sm={6} md={4} key={plugin.id}>
              <PluginCard active={plugin.id === activePlugin}>
                <PluginCardContent>
                  <PluginLogo>
                    <img
                      src={plugin.logo}
                      alt={`${plugin.name} logo`}
                      style={{ maxHeight: '100%', maxWidth: '80%' }}
                    />
                  </PluginLogo>

                  <Typography variant="h6" component="h2" gutterBottom>
                    {plugin.name}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" paragraph>
                    {plugin.description}
                  </Typography>

                  <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                    Features:
                  </Typography>

                  <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
                    {plugin.features.map((feature, index) => (
                      <li key={index}>
                        <Typography variant="body2">{feature}</Typography>
                      </li>
                    ))}
                  </ul>
                </PluginCardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleOpenConfig(plugin)}
                    fullWidth
                  >
                    Configure
                  </Button>

                  {plugin.enabled && plugin.id !== activePlugin && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleActivatePlugin(plugin.id)}
                      fullWidth
                      sx={{ ml: 1 }}
                    >
                      Activate
                    </Button>
                  )}
                </CardActions>
              </PluginCard>
            </Grid>
          ))}
        </Grid>
      )}

      {tabValue === 1 && (
        <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            Active Provider:{' '}
            {activePlugin === 'mock'
              ? 'Built-in Fallback Provider'
              : plugins.find(p => p.id === activePlugin)?.name || 'None'}
          </Typography>

          <Typography variant="body1" paragraph>
            {activePlugin === 'mock'
              ? 'Currently using the built-in fallback provider for weather analysis. This provides basic analysis capabilities without external APIs.'
              : plugins.find(p => p.id === activePlugin)?.description ||
                'No active AI provider selected.'}
          </Typography>

          {activePlugin === 'mock' && (
            <Alert severity="info" sx={{ mt: 2 }}>
              To enable enhanced weather data analysis, configure and activate
              one of the available AI providers.
            </Alert>
          )}
        </Box>
      )}

      {tabValue === 2 && (
        <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            AI Usage Analytics
          </Typography>

          <Typography variant="body1">
            Usage statistics and analytics will be available here after
            processing data with AI providers.
          </Typography>
        </Box>
      )}

      {tabValue === 3 && (
        <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            Global AI Settings
          </Typography>

          <FormControlLabel
            control={<Switch checked={true} onChange={() => {}} />}
            label="Enable AI processing for weather data analysis"
          />

          <FormControlLabel
            control={<Switch checked={false} onChange={() => {}} />}
            label="Allow sharing anonymized data for research purposes"
          />

          <FormControlLabel
            control={<Switch checked={true} onChange={() => {}} />}
            label="Fall back to local processing when AI provider is unavailable"
          />
        </Box>
      )}

      {/* Configuration Dialog */}
      <ConfigDialog
        open={configDialogOpen}
        onClose={handleCloseConfig}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Configure {currentPlugin?.name}</DialogTitle>

        <DialogContent>
          <FormControlLabel
            control={
              <Switch
                checked={enabled}
                onChange={e => setEnabled(e.target.checked)}
                color="primary"
              />
            }
            label={`Enable ${currentPlugin?.name} integration`}
            sx={{ mb: 2, display: 'block' }}
          />

          <TextField
            label="API Key"
            type="password"
            fullWidth
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            margin="normal"
            helperText={`Enter your ${currentPlugin?.name} API key. This is stored locally and never shared.`}
          />

          <TextField
            label="Model"
            fullWidth
            value={model}
            onChange={e => setModel(e.target.value)}
            margin="normal"
            helperText="Select the model to use for analysis"
          />

          {testResult && (
            <Alert
              severity={testResult.success ? 'success' : 'error'}
              sx={{ mt: 2 }}
            >
              {testResult.message}
            </Alert>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseConfig}>Cancel</Button>

          <Button
            variant="outlined"
            onClick={handleTestConnection}
            disabled={!apiKey}
          >
            Test Connection
          </Button>

          <Button
            variant="contained"
            onClick={handleSaveConfig}
            disabled={enabled && !apiKey}
          >
            Save
          </Button>
        </DialogActions>
      </ConfigDialog>
    </Container>
  );
}

const AIPluginsHub = (props) => (
  <DemoSurfaceGate
    testId="ai-plugins"
    title="AI plugins is not live on this testnet"
    description="This preview contains illustrative data or simulated actions, not verified testnet results."
  >
    <AIPluginsHubSample {...props} />
  </DemoSurfaceGate>
);

export default AIPluginsHub;
