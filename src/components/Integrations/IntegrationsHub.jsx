import React, { useState, useEffect } from 'react';
import DemoSurfaceGate from '../common/DemoSurfaceGate';
import './IntegrationsHub.css';
import './IntegrationCards.css';
import './SidebarPin.css';
import PageTitle from '../common/PageTitle';
import {
  sanitizeHtml,
  sanitizeUrlParam,
  sanitizeId,
  escapeHtml,
} from '../../utils/securityUtils';
import IntegrationsGridView from './IntegrationsGridView';
import AIIntegrationsHub from './AIIntegrationsHub';
import IoTIntegrationDetails from './IoT/IoTIntegrationDetails';
import AIIntegrationDetails from './AI/AIIntegrationDetails';
import CrossChainIntegrationDetails from './CrossChain/CrossChainIntegrationDetails';
import BaseCard from './BaseCard';
import OptimismCard from './OptimismCard';
import CosmosCard from './CosmosCard';
import LayerZeroCard from './LayerZeroCard';
import AxelarCard from './AxelarCard';
import WormholeCard from './WormholeCard';
import PythCard from './PythCard';
import IPFSCard from './IPFSCard';
import StorjCard from './StorjCard';
import ArweaveCard from './ArweaveCard';
import FilecoinCard from './FilecoinCard';
import SuiWalrusCard from './SuiWalrusCard';
import API3Card from './API3Card';
import GraphProtocolCard from './GraphProtocolCard';
import AethirCard from './AethirCard';
import FluxCard from './FluxCard';
import InternetComputerCard from './InternetComputerCard';
import IExecCard from './IExecCard';
import GolemCard from './GolemCard';
import OpenForisCard from './OpenForisCard';
import OceanProtocolCard from './OceanProtocolCard';
import OpenAerialMapCard from './OpenAerialMapCard';
import WeatherProtocolsCard from './WeatherProtocolsCard';
import StreamrCard from './StreamrCard';
import SingularityNetCard from './SingularityNetCard';
import ChainlinkCard from './ChainlinkCard';
import AkashCard from './AkashCard';
import BacalhauCard from './BacalhauCard';
import BittensorCard from './BittensorCard';
import TheThingsNetworkCard from './TheThingsNetworkCard';
import AIOZMediaCard from './AIOZMediaCard';
import RenderCard from './RenderCard';
import FetchAiCard from './FetchAiCard';
import SensorCommunityCard from './SensorCommunityCard';
import SensorCommunityPanel from './SensorCommunityPanel';
import OpenAQCard from './OpenAQCard';
import OpenAQPanel from './OpenAQPanel';
import HeliumCard from './HeliumCard';
import SONMCard from './SonmCard';
import N8nCard from './N8nCard';

/**
 * IntegrationsHub - Main component for the integrations section of Wrfcoin Core
 *
 * This component handles:
 * 1. Category filtering (showing integrations by category)
 * 2. Specific integration display when selected
 * 3. Integration grid view with filtering
 *
 * @param {string} category - Optional category ID to filter by
 * @param {string} integration - Optional integration ID to show
 */
const IntegrationsHubSample = ({ category, integration }) => {
  // State for the currently active tab (integration) and category
  // Sanitize inputs before setting initial state
  // Apply strict sanitization to inputs from the URL/router
  const [activeTab, setActiveTab] = useState(
    integration ? sanitizeId(integration) : 0,
  );
  const [activeCategory, setActiveCategory] = useState(
    category ? sanitizeId(category) : 'all',
  );

  // Update state when props change (from router navigation)
  useEffect(() => {
    if (category) {
      // Sanitize category before setting state
      setActiveCategory(sanitizeId(category));
    }

    if (integration) {
      // Sanitize integration before setting state
      setActiveTab(sanitizeId(integration));
    }
  }, [category, integration]);

  // Function to handle rendering the correct content based on activeTab and activeCategory
  const renderTabContent = () => {
    // Sanitize activeTab and activeCategory for security
    const sanitizedTab =
      typeof activeTab === 'string' ? sanitizeId(activeTab) : activeTab;
    const sanitizedCategory = sanitizeId(activeCategory);

    // Special handling for the "All Integrations" view
    if (
      (sanitizedCategory === 'all' && !sanitizedTab) ||
      sanitizedTab === 'all-integrations'
    ) {
      return <IntegrationsGridView setActiveTab={setActiveTab} />;
    }

    // IoT integrations with new detailed view
    const iotIntegrations = [
      'helium',
      'ttn',
      'foam',
      'sigfox',
      'streamr',
      'ogc',
      'arduino',
      'esp32',
      'aioz',
    ];
    if (
      typeof sanitizedTab === 'string' &&
      iotIntegrations.includes(sanitizedTab)
    ) {
      return <IoTIntegrationDetails integrationId={sanitizedTab} />;
    }

    // AI/ML integrations with new detailed view
    const aiIntegrations = [
      'openai',
      'anthropic',
      'wolfram',
      'perplexity',
      'grok',
      'gemini',
      'localai',
      'mistral',
      'meta',
    ];
    if (
      typeof sanitizedTab === 'string' &&
      aiIntegrations.includes(sanitizedTab)
    ) {
      return <AIIntegrationDetails integrationId={sanitizedTab} />;
    }

    // Cross-Chain integrations with new detailed view
    const crossChainIntegrations = [
      'layerzero',
      'wormhole',
      'axelar',
      'cosmos',
      'polkadot',
      'near',
      'stargate',
      'multichain',
      'bearmint',
    ];
    if (
      typeof sanitizedTab === 'string' &&
      crossChainIntegrations.includes(sanitizedTab)
    ) {
      return <CrossChainIntegrationDetails integrationId={sanitizedTab} />;
    }

    // Switch case for legacy specific integration details
    switch (sanitizedTab) {
    // Cross-Chain integrations
    case 'base':
      return <BaseCard />;
    case 'optimism':
      return <OptimismCard />;
    case 'cosmos-legacy':
      return <CosmosCard />;
    case 'layerzero-legacy':
      return <LayerZeroCard />;
    case 'axelar-legacy':
      return <AxelarCard />;
    case 'wormhole-legacy':
      return <WormholeCard />;
    case 'pyth':
      return <PythCard />;

      // Storage integrations
    case 'ipfs':
      return <IPFSCard />;
    case 'storj':
      return <StorjCard />;
    case 'arweave':
      return <ArweaveCard />;
    case 'filecoin':
      return <FilecoinCard />;
    case 'walrus':
      return <SuiWalrusCard />;

      // Oracle integrations
    case 'api3':
      return <API3Card />;
    case 'graph':
      return <GraphProtocolCard />;
    case 'chainlink':
      return <ChainlinkCard />;

      // Compute integrations
    case 'akash':
      return <AkashCard />;
    case 'bacalhau':
      return <BacalhauCard />;
    case 'render':
      return <RenderCard />;
    case 'aethir':
      return <AethirCard />;
    case 'sonm':
      return <SONMCard />;
    case 'flux':
      return <FluxCard />;
    case 'icp':
      return <InternetComputerCard />;
    case 'iexec':
      return <IExecCard />;
    case 'golem':
      return <GolemCard />;

      // Data Providers
    case 'openforis':
      return <OpenForisCard />;
    case 'ocean':
      return <OceanProtocolCard />;
    case 'sensor-community':
      return <SensorCommunityPanel />;
    case 'openaq':
      return <OpenAQPanel />;
    case 'openaerialmap':
      return <OpenAerialMapCard />;
    case 'weather-protocols':
      return <WeatherProtocolsCard />;
    case 'data-indexing':
      return (
        <div className="integration-placeholder">
          <h3>Data Indexing Services</h3>
          <p>
              Tools and services for indexing and querying blockchain and
              meteorological data
          </p>
        </div>
      );

      // IoT and Streams (legacy cards)
    case 'streamr-legacy':
      return <StreamrCard />;
    case 'ttn-legacy':
      return <TheThingsNetworkCard />;
    case 'aioz-media-legacy':
      return <AIOZMediaCard />;
    case 'helium-legacy':
      return <HeliumCard />;

      // AI/ML
    case 'ai-providers':
      return <AIIntegrationsHub />;
    case 'singularitynet':
      return <SingularityNetCard />;

      // Automation
    case 'n8n':
      return <N8nCard />;
    case 'bittensor':
      return <BittensorCard />;
    case 'fetchai':
      return <FetchAiCard />;

    default:
      // If we're in a category view with no specific integration selected,
      // show the grid view filtered to that category
      if (sanitizedCategory !== 'all') {
        return (
          <IntegrationsGridView
            setActiveTab={setActiveTab}
            filterCategory={sanitizedCategory}
          />
        );
      }

      // Default to the grid view for all integrations
      return <IntegrationsGridView setActiveTab={setActiveTab} />;
    }
  };

  // Determine the CSS class for filtered view (if a category is selected)
  // Sanitize activeCategory before comparing
  const sanitizedActiveCategory = sanitizeId(activeCategory);
  const filteredViewClass =
    sanitizedActiveCategory !== 'all' ? 'filtered-view' : '';

  return (
    <div
      className={`integrations-hub full-width-container ${filteredViewClass}`}
    >
      {/* Title section positioned above the main content */}
      <div className="integrations-title-section">
        <PageTitle
          title="Integrations Hub"
          subtitle="Connect with external networks, data sources and services"
        />
      </div>

      {/* Main container with content area only - sidebar removed */}
      <div className="integrations-container full-width">
        <div className="integrations-content full-width">
          {/* Integration content */}
          <div className="integration-content">{renderTabContent()}</div>
        </div>
      </div>
    </div>
  );
};

// frontend#327: the partner cards (Chainlink, Pyth, iExec, AIOZ, Render,
// Optimism, …), the AI/IoT detail views and DeviceSetupGuide render random
// "live" stats, a fake VRF number, fake job results and a fake IPFS hash. No
// integration is wired to the testnet API (routes/integrations.ts exists but
// is unmounted). Gated once, at the hub, rather than in fourteen cards.
const IntegrationsHub = (props) => (
  <DemoSurfaceGate
    title="Third-party integrations are not live on the testnet yet"
    description="No partner integration is wired to the testnet API; the cards and detail views in the preview show generated stats, not live data."
    testId="integrations-hub"
  >
    <IntegrationsHubSample {...props} />
  </DemoSurfaceGate>
);

export default IntegrationsHub;
