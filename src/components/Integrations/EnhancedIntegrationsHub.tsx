import DemoSurfaceGate from '../common/DemoSurfaceGate';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Tab,
  Tabs,
  Card,
  CardContent,
  Typography,
  Grid,
  Fab,
  Badge,
  Alert,
  AlertTitle,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Switch,
  FormControlLabel,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  Category as CategoryIcon,
  Add as AddIcon,
  Notifications as NotificationsIcon,
  AutoAwesome as AutoAwesomeIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

// Import our new components
import AdvancedSearch from './AdvancedSearch';
import StatusMonitorGrid from './StatusMonitorGrid';
import IntegrationWizard from './IntegrationWizard';
import CategoryOptimizer from './CategoryOptimizer';

// Import existing components
import IntegrationsGridView from './IntegrationsGridView';
import AIIntegrationsHub from './AIIntegrationsHub';
import PageTitle from '../common/PageTitle';

// Import types
import {
  Integration,
  IntegrationStatus,
  Category,
  IntegrationConfig,
} from './types';
import { sanitizeInput } from '../../utils/security';

interface EnhancedIntegrationsHubProps {
  category?: string;
  integration?: string;
}

const EnhancedIntegrationsHubSample: React.FC<EnhancedIntegrationsHubProps> = ({
  category,
  integration,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [integrationStatuses, setIntegrationStatuses] = useState<
    IntegrationStatus[]
  >([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredIntegrations, setFilteredIntegrations] = useState<
    Integration[]
  >([]);
  const [selectedIntegration, setSelectedIntegration] =
    useState<Integration | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardConfig, setWizardConfig] = useState<IntegrationConfig | null>(
    null,
  );
  const [showSettings, setShowSettings] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load integrations data
  useEffect(() => {
    const loadIntegrationsData = async () => {
      setIsLoading(true);
      try {
        // Load integrations from API
        const integrationsResponse = await fetch('/api/integrations');
        const integrationsData = await integrationsResponse.json();

        // Transform and sanitize integration data
        const sanitizedIntegrations: Integration[] = integrationsData.map(
          (integration: any) => ({
            id: sanitizeInput(integration.id),
            name: sanitizeInput(integration.name),
            description: sanitizeInput(integration.description),
            category: sanitizeInput(integration.category),
            tags:
              integration.tags?.map((tag: string) => sanitizeInput(tag)) || [],
            status: integration.status || 'unconfigured',
            popularity: integration.popularity || 0,
            rating: integration.rating || 0,
            lastUsed: integration.lastUsed
              ? new Date(integration.lastUsed)
              : undefined,
            icon: integration.icon || '/assets/icons/default-integration.svg',
            provider: integration.provider
              ? sanitizeInput(integration.provider)
              : undefined,
            setupComplexity: integration.setupComplexity || 'medium',
            usageCount: integration.usageCount || 0,
          }),
        );

        setIntegrations(sanitizedIntegrations);
        setFilteredIntegrations(sanitizedIntegrations);

        // Load status data
        const statusResponse = await fetch('/api/integrations/status');
        const statusData = await statusResponse.json();

        interface StatusEntry {
          id: string;
          uptime?: number;
          responseTime?: number;
          lastCheck?: string;
          errorCount?: number;
          warningCount?: number;
          throughput?: number;
          alerts?: any[];
        }

        const statusMap = new Map<string, StatusEntry>(
          statusData.map((status: StatusEntry) => [status.id, status]),
        );

        const integrationsWithStatus: IntegrationStatus[] =
          sanitizedIntegrations.map(integration => {
            const status = statusMap.get(integration.id);
            return {
              ...integration,
              uptime: status?.uptime || 0,
              responseTime: status?.responseTime || 0,
              lastCheck: status?.lastCheck
                ? new Date(status.lastCheck)
                : new Date(),
              errorCount: status?.errorCount || 0,
              warningCount: status?.warningCount || 0,
              throughput: status?.throughput || 0,
              alerts: status?.alerts || [],
            };
          });

        setIntegrationStatuses(integrationsWithStatus);

        // Generate categories from integrations
        const categoryMap = new Map<string, Category>();

        sanitizedIntegrations.forEach(integration => {
          if (!categoryMap.has(integration.category)) {
            categoryMap.set(integration.category, {
              id: integration.category,
              name:
                integration.category.charAt(0).toUpperCase() +
                integration.category.slice(1),
              description: `${integration.category} integrations`,
              icon: 'category',
              color: getCategoryColor(integration.category),
              integrations: [],
              isCustom: false,
              usageScore: 0,
            });
          }
          categoryMap.get(integration.category)!.integrations.push(integration);
        });

        setCategories(Array.from(categoryMap.values()));
      } catch (error) {
        console.error('Failed to load integrations data:', error);
        setSnackbarMessage('Failed to load integrations data');
      } finally {
        setIsLoading(false);
      }
    };

    loadIntegrationsData();
  }, []);

  // Handle URL parameters
  useEffect(() => {
    if (category) {
      // Switch to appropriate tab based on category
      setActiveTab(0); // Default to search/browse tab
    }
    if (integration) {
      // Find and select specific integration
      const foundIntegration = integrations.find(
        i => i.id === sanitizeInput(integration),
      );
      if (foundIntegration) {
        setSelectedIntegration(foundIntegration);
      }
    }
  }, [category, integration, integrations]);

  // Generate category colors
  const getCategoryColor = useCallback((categoryName: string): string => {
    const colors = [
      '#1976d2',
      '#388e3c',
      '#f57c00',
      '#d32f2f',
      '#7b1fa2',
      '#00796b',
      '#5d4037',
      '#455a64',
      '#e91e63',
      '#ff5722',
    ];

    let hash = 0;
    for (let i = 0; i < categoryName.length; i++) {
      hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  }, []);

  // Handle search results
  const handleSearchResults = useCallback((results: Integration[]) => {
    setFilteredIntegrations(results);
  }, []);

  // Handle integration selection
  const handleIntegrationSelect = useCallback((integration: Integration) => {
    setSelectedIntegration(integration);

    // If integration is not configured, show setup wizard
    if (integration.status === 'unconfigured') {
      setWizardConfig({
        id: integration.id,
        name: integration.name,
        description: integration.description,
        category: integration.category,
        icon: integration.icon,
        provider: integration.provider || 'Unknown',
        setupComplexity: integration.setupComplexity,
        estimatedTime: getEstimatedSetupTime(integration.setupComplexity),
        prerequisites: getPrerequisites(integration.category),
        documentation: `https://docs.wrfcoin.com/integrations/${integration.id}`,
        endpoints: integration.endpoint ? [integration.endpoint] : undefined,
      });
      setShowWizard(true);
    }
  }, []);

  // Handle integration move between categories
  const handleIntegrationMove = useCallback(
    (integrationId: string, fromCategory: string, toCategory: string) => {
      setIntegrations(prev =>
        prev.map(integration =>
          integration.id === integrationId
            ? { ...integration, category: toCategory }
            : integration
        ),
      );

      setCategories(prev =>
        prev.map(category => ({
          ...category,
          integrations:
            category.id === fromCategory
              ? category.integrations.filter(i => i.id !== integrationId)
              : category.id === toCategory
                ? [
                  ...category.integrations,
                    integrations.find(i => i.id === integrationId)!,
                ]
                : category.integrations,
        })),
      );

      setSnackbarMessage(`Integration moved to ${toCategory}`);
    },
    [integrations],
  );

  // Handle wizard completion
  const handleWizardComplete = useCallback(
    async (config: Record<string, any>) => {
      if (!wizardConfig) return;

      try {
        // Save integration configuration
        const response = await fetch('/api/integrations/configure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            integrationId: wizardConfig.id,
            config,
          }),
        });

        if (response.ok) {
          // Update integration status
          setIntegrations(prev =>
            prev.map(integration =>
              integration.id === wizardConfig.id
                ? { ...integration, status: 'configured' }
                : integration
            ),
          );

          setSnackbarMessage(
            `${wizardConfig.name} integration configured successfully!`,
          );
        } else {
          throw new Error('Configuration failed');
        }
      } catch (error) {
        console.error('Failed to configure integration:', error);
        setSnackbarMessage('Failed to configure integration');
      } finally {
        setShowWizard(false);
        setWizardConfig(null);
      }
    },
    [wizardConfig],
  );

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    // Reload integration statuses
    try {
      const response = await fetch('/api/integrations/status');
      const statusData = await response.json();

      interface RefreshStatusEntry {
        id: string;
        uptime?: number;
        responseTime?: number;
        lastCheck?: string;
        errorCount?: number;
        warningCount?: number;
        throughput?: number;
        alerts?: any[];
      }

      const statusMap = new Map<string, RefreshStatusEntry>(
        statusData.map((status: RefreshStatusEntry) => [status.id, status]),
      );

      setIntegrationStatuses(prev =>
        prev.map(integration => {
          const status = statusMap.get(integration.id);
          return {
            ...integration,
            uptime: status?.uptime || integration.uptime,
            responseTime: status?.responseTime || integration.responseTime,
            lastCheck: status?.lastCheck
              ? new Date(status.lastCheck)
              : integration.lastCheck,
            errorCount: status?.errorCount || integration.errorCount,
            warningCount: status?.warningCount || integration.warningCount,
            throughput: status?.throughput || integration.throughput,
            alerts: status?.alerts || integration.alerts,
          };
        }),
      );
    } catch (error) {
      console.error('Failed to refresh status:', error);
    }
  }, []);

  // Get estimated setup time based on complexity
  const getEstimatedSetupTime = (complexity: string): string => {
    switch (complexity) {
    case 'easy':
      return '2-5 minutes';
    case 'medium':
      return '5-10 minutes';
    case 'advanced':
      return '10-20 minutes';
    default:
      return '5-10 minutes';
    }
  };

  // Get prerequisites based on category
  const getPrerequisites = (category: string): string[] => {
    const prereqMap: Record<string, string[]> = {
      'ai-ml': ['API key from provider', 'Active account with provider'],
      storage: ['Account with storage provider', 'Access credentials'],
      'cross-chain': ['Wallet setup', 'Network configuration'],
      iot: ['Device access', 'Network connectivity'],
      'data-providers': ['API access', 'Account registration'],
    };

    return prereqMap[category] || ['Account with provider', 'API credentials'];
  };

  // Calculate notification count
  const notificationCount = useMemo(() => {
    return integrationStatuses.reduce(
      (count, integration) =>
        count +
        integration.errorCount +
        (integration.status === 'error' ? 1 : 0),
      0,
    );
  }, [integrationStatuses]);

  // Tab content renderer
  const renderTabContent = () => {
    switch (activeTab) {
    case 0: // Browse & Search
      return (
        <Box>
            <AdvancedSearch
            integrations={integrations as any}
            onSearchResults={handleSearchResults as any}
            onIntegrationSelect={handleIntegrationSelect as any}
            className="mb-4"
          />
            <IntegrationsGridView
            setActiveTab={(id: string) =>
              handleIntegrationSelect(integrations.find(i => i.id === id)!)
            }
            filterCategory={category}
          />
          </Box>
      );

    case 1: // Status Monitor
      return (
        <StatusMonitorGrid
          integrations={integrationStatuses as any}
          onIntegrationClick={(integration: any) => handleIntegrationSelect(integration)}
          onRefresh={handleRefresh}
          autoRefresh={autoRefresh}
          refreshInterval={refreshInterval}
        />
      );

    case 2: // Category Optimizer
      return (
        <CategoryOptimizer
          integrations={integrations}
          categories={categories}
          onCategoriesUpdate={setCategories}
          onIntegrationMove={handleIntegrationMove}
        />
      );

    case 3: // AI Integrations
      return <AIIntegrationsHub />;

    default:
      return null;
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 400,
        }}
      >
        <Typography>Loading integrations...</Typography>
      </Box>
    );
  }

  return (
    <Box className="enhanced-integrations-hub">
      {/* Title Section */}
      <Box sx={{ mb: 3 }}>
        {/* @ts-expect-error PageTitle is a JSX component with optional props */}
        <PageTitle
          title="Enhanced Integrations Hub"
          subtitle="Advanced integration management with AI-powered optimization and real-time monitoring"
        />
      </Box>

      {/* Main Content */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
          >
            <Tab
              icon={<SearchIcon />}
              label="Browse & Search"
              iconPosition="start"
            />
            <Tab
              icon={
                <Badge badgeContent={notificationCount} color="error">
                  <DashboardIcon />
                </Badge>
              }
              label="Status Monitor"
              iconPosition="start"
            />
            <Tab
              icon={<CategoryIcon />}
              label="Category Optimizer"
              iconPosition="start"
            />
            <Tab
              icon={<AutoAwesomeIcon />}
              label="AI Integrations"
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 3 }}>{renderTabContent()}</CardContent>
      </Card>

      {/* Floating Action Button for Quick Setup */}
      <Fab
        color="primary"
        aria-label="add integration"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={() => {
          // Show quick integration selector
          setSnackbarMessage('Quick integration setup coming soon!');
        }}
      >
        <AddIcon />
      </Fab>

      {/* Integration Setup Wizard */}
      {wizardConfig && (
        <IntegrationWizard
          integration={wizardConfig}
          onComplete={handleWizardComplete}
          onCancel={() => {
            setShowWizard(false);
            setWizardConfig(null);
          }}
          open={showWizard}
        />
      )}

      {/* Settings Dialog */}
      <Dialog open={showSettings} onClose={() => setShowSettings(false)}>
        <DialogTitle>Integration Hub Settings</DialogTitle>
        <DialogContent>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={e => setAutoRefresh(e.target.checked)}
              />
            }
            label="Auto-refresh status monitor"
          />
          <Typography variant="caption" display="block" sx={{ mt: 1, mb: 2 }}>
            Automatically refresh integration status every {refreshInterval}{' '}
            seconds
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettings(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        open={Boolean(snackbarMessage)}
        onClose={() => setSnackbarMessage('')}
        message={snackbarMessage}
        autoHideDuration={4000}
      />

      {/* Quick Actions Tooltip */}
      <Tooltip title="Settings" placement="left">
        <Fab
          size="small"
          color="secondary"
          aria-label="settings"
          sx={{ position: 'fixed', bottom: 96, right: 24 }}
          onClick={() => setShowSettings(true)}
        >
          <SettingsIcon />
        </Fab>
      </Tooltip>
    </Box>
  );
};

const EnhancedIntegrationsHub: React.FC<React.ComponentProps<typeof EnhancedIntegrationsHubSample>> = (props) => (
  <DemoSurfaceGate
    testId="enhanced-integrations"
    title="Enhanced integrations is not live on this testnet"
    description="This preview contains illustrative data or simulated actions, not verified testnet results."
  >
    <EnhancedIntegrationsHubSample {...props} />
  </DemoSurfaceGate>
);

export default EnhancedIntegrationsHub;
