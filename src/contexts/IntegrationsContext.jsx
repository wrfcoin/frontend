import React, { createContext, useState, useContext, useEffect } from 'react';

// Creating the context with default values
const IntegrationsContext = createContext({
  integrations: {},
  toggleIntegration: () => {},
  toggleCategory: () => {},
  updateIntegrations: () => {},
  isLoading: true,
});

// Initial integration categories and their items
const initialIntegrations = {
  oracles: {
    name: 'Oracle Networks',
    items: {
      chainlink: { name: 'Chainlink', enabled: true },
      pyth: { name: 'Pyth Network', enabled: true },
      api3: { name: 'API3', enabled: false },
    },
  },
  compute: {
    name: 'Compute Networks',
    items: {
      akash: { name: 'Akash Network', enabled: true },
      bacalhau: { name: 'Bacalhau', enabled: true },
      sonm: { name: 'SONM Network', enabled: true },
      render: { name: 'Render Network', enabled: true },
      'internet-computer': { name: 'Internet Computer', enabled: false },
    },
  },
  'ai-ml': {
    name: 'AI & ML Networks',
    items: {
      bittensor: { name: 'Bittensor', enabled: true },
      singularitynet: { name: 'SingularityNET AI', enabled: false },
      fetchai: { name: 'Fetch.ai', enabled: false },
      wolfram: { name: 'Wolfram Alpha & Language', enabled: false },
    },
  },
  iot: {
    name: 'IoT Networks',
    items: {
      helium: { name: 'Helium/AIOZ', enabled: true },
      'aioz-media': { name: 'AIOZ MediaMTX', enabled: true },
      ttn: { name: 'The Things Network', enabled: true },
    },
  },
  storage: {
    name: 'Storage Networks',
    items: {
      arweave: { name: 'Arweave', enabled: true },
      filecoin: { name: 'Filecoin', enabled: true },
      ipfs: { name: 'IPFS', enabled: true },
      walrus: { name: 'MystenLabs/Walrus', enabled: false },
    },
  },
  'cross-chain': {
    name: 'Cross-Chain Bridges',
    items: {
      axelar: { name: 'Axelar', enabled: true },
      layerzero: { name: 'LayerZero', enabled: true },
      wormhole: { name: 'Wormhole', enabled: true },
    },
  },
  l2: {
    name: 'Layer 2 Solutions',
    items: {
      optimism: { name: 'Optimism L2', enabled: false },
      base: { name: 'Base Network', enabled: false },
    },
  },
  'data-providers': {
    name: 'Data Providers',
    items: {
      'data-indexing': { name: 'Data Indexing', enabled: true },
      openforis: { name: 'OpenForis', enabled: true },
      'ocean-protocol': { name: 'Ocean Protocol', enabled: false },
      openaerialmap: { name: 'OpenAerialMap', enabled: false },
    },
  },
};

// IntegrationsProvider component with proper error handling
export const IntegrationsProvider = ({ children }) => {
  // Add null checks for React hooks
  if (typeof React === 'undefined' || !React.useState) {
    console.error('React is not properly loaded');
    return children;
  }

  const [integrations, setIntegrations] = React.useState({});
  const [isLoading, setIsLoading] = React.useState(true);

  // Toggle integration status
  const toggleIntegration = React.useCallback(integrationName => {
    setIntegrations(prev => ({
      ...prev,
      [integrationName]: {
        ...prev[integrationName],
        enabled: !prev[integrationName]?.enabled,
      },
    }));
  }, []);

  // Toggle category status
  const toggleCategory = React.useCallback(categoryName => {
    setIntegrations(prev => {
      const newIntegrations = { ...prev };
      const categoryIntegrations = Object.keys(newIntegrations).filter(
        key => newIntegrations[key]?.category === categoryName,
      );

      const allEnabled = categoryIntegrations.every(
        key => newIntegrations[key]?.enabled,
      );

      categoryIntegrations.forEach(key => {
        if (newIntegrations[key]) {
          newIntegrations[key].enabled = !allEnabled;
        }
      });

      return newIntegrations;
    });
  }, []);

  // Update integrations data
  const updateIntegrations = React.useCallback(newIntegrations => {
    setIntegrations(newIntegrations);
  }, []);

  // Load integrations from storage
  React.useEffect(() => {
    const loadIntegrations = async () => {
      try {
        const stored = localStorage.getItem('wrfcoin_integrations');
        if (stored) {
          const parsedIntegrations = JSON.parse(stored);
          setIntegrations(parsedIntegrations);
        } else {
          // Default integrations
          const defaultIntegrations = {
            crossChain: { enabled: true, category: 'blockchain' },
            aiMl: { enabled: true, category: 'ai' },
            iot: { enabled: true, category: 'sensors' },
            governance: { enabled: true, category: 'dao' },
          };
          setIntegrations(defaultIntegrations);
        }
      } catch (error) {
        console.error('Error loading integrations:', error);
        setIntegrations({});
      } finally {
        setIsLoading(false);
      }
    };

    loadIntegrations();
  }, []);

  // Save integrations to storage
  React.useEffect(() => {
    if (!isLoading && Object.keys(integrations).length > 0) {
      try {
        localStorage.setItem(
          'wrfcoin_integrations',
          JSON.stringify(integrations),
        );
      } catch (error) {
        console.error('Error saving integrations:', error);
      }
    }
  }, [integrations, isLoading]);

  const contextValue = React.useMemo(
    () => ({
      integrations,
      toggleIntegration,
      toggleCategory,
      updateIntegrations,
      isLoading,
    }),
    [
      integrations,
      toggleIntegration,
      toggleCategory,
      updateIntegrations,
      isLoading,
    ],
  );

  return (
    <IntegrationsContext.Provider value={contextValue}>
      {children}
    </IntegrationsContext.Provider>
  );
};
export const useIntegrations = () => {
  const context = useContext(IntegrationsContext);
  if (context === undefined) {
    throw new Error(
      'useIntegrations must be used within an IntegrationsProvider',
    );
  }
  return context;
};

export default IntegrationsContext;
