import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import './IntegrationsGridView.css';
import DeviceSetupGuide from '../DeviceSetupGuide.jsx';

const IntegrationsGridView = ({ setActiveTab, filterCategory }) => {
  // Add state to track which categories are expanded
  const [expandedCategories, setExpandedCategories] = useState({});
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showDeviceSetup, setShowDeviceSetup] = useState(false);
  const [selectedDeviceType, setSelectedDeviceType] = useState('');
  const navigate = useNavigate();

  // Use proper theme detection with document body class and localStorage preference
  useEffect(() => {
    // Check for theme setting in localStorage or body class
    const storedTheme = localStorage.getItem('wrfcoin-theme');
    const bodyHasDarkClass = document.body.classList.contains('dark-mode');
    const systemPrefersDark =
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    setIsDarkMode(
      storedTheme === 'dark' || bodyHasDarkClass || systemPrefersDark,
    );

    // Listen for theme changes
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.attributeName === 'class') {
          setIsDarkMode(document.body.classList.contains('dark-mode'));
        }
      });
    });

    observer.observe(document.body, { attributes: true });

    return () => observer.disconnect();
  }, []);

  // Map category IDs to names for filtering
  const categoryMap = {
    oracles: 'Oracles',
    compute: 'Compute',
    storage: 'Storage',
    'ai-ml': 'AI/ML',
    iot: 'IoT',
    'cross-chain': 'Cross-Chain',
    'data-providers': 'Data Providers',
    'story-protocol': 'Story Protocol',
    devices: 'Device Integrations',
  };

  // Define categories with their icons, integrations, notifications
  const categories = [
    {
      id: 'oracles',
      name: 'Oracles',
      icon: 'bi-diagram-3',
      notifications: 2,
      integrations: [
        {
          id: 'oracle-dashboard',
          name: 'Oracle Dashboard',
          icon: 'bi-speedometer2',
          special: 'oracle-dashboard',
        },
        { id: 'chainlink', name: 'Chainlink', icon: 'bi-link-45deg' },
        { id: 'pyth', name: 'Pyth', icon: 'bi-broadcast' },
        { id: 'api3', name: 'API3', icon: 'bi-boxes' },
      ],
    },
    {
      id: 'compute',
      name: 'Compute',
      icon: 'bi-cpu',
      notifications: 0,
      integrations: [
        { id: 'akash', name: 'Akash', icon: 'bi-cloud' },
        { id: 'bacalhau', name: 'Bacalhau', icon: 'bi-cpu-fill' },
        { id: 'sonm', name: 'SONM', icon: 'bi-hdd-network' },
        { id: 'render', name: 'Render', icon: 'bi-gpu-card' },
        { id: 'icp', name: 'ICP', icon: 'bi-pc-display' },
        { id: 'flux', name: 'Flux', icon: 'bi-lightning' },
        { id: 'golem', name: 'Golem', icon: 'bi-hdd-stack' },
        { id: 'hetzner', name: 'Hetzner', icon: 'bi-server' },
        { id: 'aws', name: 'AWS', icon: 'bi-cloud-check' },
      ],
    },
    {
      id: 'storage',
      name: 'Storage',
      icon: 'bi-hdd-network',
      notifications: 0,
      integrations: [
        { id: 'arweave', name: 'Arweave', icon: 'bi-archive' },
        { id: 'filecoin', name: 'Filecoin', icon: 'bi-file-earmark' },
        { id: 'ipfs', name: 'IPFS', icon: 'bi-database' },
        { id: 'storj', name: 'Storj', icon: 'bi-hdd' },
        { id: 'walrus', name: 'Walrus', icon: 'bi-server' },
        { id: 's3', name: 'S3', icon: 'bi-bucket' },
        { id: 'sia', name: 'Sia', icon: 'bi-cloud-upload' },
        { id: 'ceramic', name: 'Ceramic', icon: 'bi-disc' },
        { id: 'safe', name: 'Safe', icon: 'bi-shield-lock' },
        { id: 'bigchaindb', name: 'BigchainDB', icon: 'bi-diagram-3' },
        { id: 'swarm', name: 'Swarm', icon: 'bi-hexagon-fill' },
        { id: 'skynet', name: 'Skynet', icon: 'bi-cloud-arrow-up' },
      ],
    },
    {
      id: 'ai-ml',
      name: 'AI/ML',
      icon: 'bi-robot',
      notifications: 0,
      integrations: [
        { id: 'openai', name: 'OpenAI', icon: 'bi-stars' },
        { id: 'bittensor', name: 'Bittensor', icon: 'bi-cpu' },
        { id: 'singularity', name: 'SingularityNET', icon: 'bi-robot' },
        { id: 'wolfram', name: 'Wolfram', icon: 'bi-calculator-fill' },
        { id: 'fetchai', name: 'Fetch.ai', icon: 'bi-magic' },
        { id: 'huggingface', name: 'HuggingFace', icon: 'bi-emoji-smile' },
        { id: 'anthropic', name: 'Anthropic', icon: 'bi-person-bounding-box' },
        { id: 'stability', name: 'StabilityAI', icon: 'bi-brush' },
        { id: 'replicate', name: 'Replicate', icon: 'bi-boxes' },
        { id: 'cohere', name: 'Cohere', icon: 'bi-chat-dots' },
        { id: 'midjourney', name: 'Midjourney', icon: 'bi-palette' },
        { id: 'runpod', name: 'RunPod', icon: 'bi-lightning-charge' },
        { id: 'langchain', name: 'LangChain Analytics', icon: 'bi-robot' },
      ],
    },
    {
      id: 'iot',
      name: 'IoT',
      icon: 'bi-broadcast',
      notifications: 6,
      integrations: [
        { id: 'helium', name: 'Helium', icon: 'bi-broadcast-pin' },
        { id: 'aioz', name: 'AIOZ', icon: 'bi-camera-video' },
        { id: 'ttn', name: 'TTN', icon: 'bi-wifi' },
        { id: 'foam', name: 'FOAM', icon: 'bi-geo-alt' },
        { id: 'ogc', name: 'OGC', icon: 'bi-globe-americas' },
        { id: 'streamr', name: 'Streamr', icon: 'bi-reception-4' },
        { id: 'iota', name: 'IOTA', icon: 'bi-diagram-2' },
        { id: 'sigfox', name: 'Sigfox', icon: 'bi-broadcast' },
        { id: 'arduino', name: 'Arduino', icon: 'bi-motherboard' },
        { id: 'esp32', name: 'ESP32', icon: 'bi-cpu-fill' },
      ],
    },
    {
      id: 'cross-chain',
      name: 'Cross-Chain',
      icon: 'bi-link-45deg',
      notifications: 1,
      integrations: [
        { id: 'cosmos', name: 'Cosmos', icon: 'bi-globe' },
        { id: 'axelar', name: 'Axelar', icon: 'bi-arrow-left-right' },
        { id: 'layerzero', name: 'LayerZero', icon: 'bi-layers' },
        { id: 'wormhole', name: 'Wormhole', icon: 'bi-box-arrow-in-right' },
        { id: 'parity', name: 'Polkadot', icon: 'bi-grid-3x3' },
        { id: 'near', name: 'Near', icon: 'bi-infinity' },
        { id: 'base', name: 'Base', icon: 'bi-hexagon' },
        { id: 'optimism', name: 'Optimism', icon: 'bi-speedometer' },
        { id: 'arbitrum', name: 'Arbitrum', icon: 'bi-cpu' },
      ],
    },
    {
      id: 'data-providers',
      name: 'Data',
      icon: 'bi-database',
      notifications: 0,
      integrations: [
        {
          id: 'share-weather-data',
          name: 'Share Weather Data',
          icon: 'bi-share',
          special: 'weather-sharing',
        },
        { id: 'indexing', name: 'Indexing', icon: 'bi-table' },
        { id: 'openforis', name: 'OpenForis', icon: 'bi-tree' },
        { id: 'ocean', name: 'Ocean', icon: 'bi-water' },
        { id: 'aerial', name: 'OpenAerial', icon: 'bi-map' },
        { id: 'weather', name: 'Weather', icon: 'bi-cloud-sun' },
        { id: 'graph', name: 'TheGraph', icon: 'bi-graph-up' },
        { id: 'sensor', name: 'Sensor', icon: 'bi-cloud-check' },
        { id: 'openaq', name: 'OpenAQ', icon: 'bi-wind' },
        { id: 'nasa', name: 'NASA', icon: 'bi-stars' },
      ],
    },
    {
      id: 'story-protocol',
      name: 'Story',
      icon: 'bi-journal-text',
      notifications: 0,
      integrations: [
        { id: 'ipkit', name: 'IP Kit', icon: 'bi-briefcase' },
        { id: 'contracts', name: 'Contracts', icon: 'bi-file-text' },
        { id: 'nft-oracle', name: 'NFT Oracle', icon: 'bi-gem' },
        { id: 'hub', name: 'Hub', icon: 'bi-grid-3x3' },
        { id: 'licensing', name: 'Licensing', icon: 'bi-key' },
        { id: 'royalties', name: 'Royalties', icon: 'bi-coin' },
        { id: 'creators', name: 'Creators', icon: 'bi-person-fill' },
        { id: 'legal', name: 'Legal', icon: 'bi-shield-check' },
        { id: 'registry', name: 'Registry', icon: 'bi-list-check' },
      ],
    },
    {
      id: 'devices',
      name: 'Device Integrations',
      icon: 'bi-router',
      notifications: 1,
      integrations: [
        {
          id: 'weather-station',
          name: 'Weather Station',
          icon: 'bi-thermometer-sun',
          special: 'device-setup',
        },
        {
          id: 'air-quality',
          name: 'Air Quality Monitor',
          icon: 'bi-wind',
          special: 'device-setup',
        },
        {
          id: 'soil-sensors',
          name: 'Soil Sensor',
          icon: 'bi-tree',
          special: 'device-setup',
        },
        {
          id: 'camera-traps',
          name: 'Camera Trap',
          icon: 'bi-camera',
          special: 'device-setup',
        },
        {
          id: 'water-quality',
          name: 'Water Quality Sensor',
          icon: 'bi-droplet',
          special: 'device-setup',
        },
        {
          id: 'noise-meters',
          name: 'Noise Monitor',
          icon: 'bi-soundwave',
          special: 'device-setup',
        },
        {
          id: 'energy-monitor',
          name: 'Energy Monitor',
          icon: 'bi-lightning',
          special: 'device-setup',
        },
        {
          id: 'gps-tracker',
          name: 'GPS Tracker',
          icon: 'bi-geo-alt',
          special: 'device-setup',
        },
        {
          id: 'iot-hub',
          name: 'IoT Sensor Hub',
          icon: 'bi-cpu',
          special: 'device-setup',
        },
      ],
    },
  ];

  // Helper function to get color variant for icons
  const getIconVariant = index => {
    const variants = [
      'variant-1',
      'variant-2',
      'variant-3',
      'variant-4',
      'variant-5',
      'variant-6',
      'variant-7',
      'variant-8',
      'variant-9',
    ];
    return variants[index % variants.length];
  };

  // Filter categories if a specific category is requested
  const displayCategories = filterCategory
    ? categories.filter(category => category.id === filterCategory)
    : categories;

  return (
    <div
      className={`integrations-grid-container ${isDarkMode ? 'dark-theme' : 'light-theme'}`}
    >
      {filterCategory && (
        <div className="category-filter-indicator">
          <h2>
            <i
              className={`bi ${categories.find(c => c.id === filterCategory)?.icon}`}
            ></i>
            {categoryMap[filterCategory] || 'All Integrations'}
          </h2>
        </div>
      )}
      <div className="categories-grid">
        {displayCategories.map(category => (
          <div key={category.id} className={`category-drawer ${category.id}`}>
            <div className="category-title">
              <i className={`bi ${category.icon}`}></i> {category.name}
              {category.notifications > 0 && (
                <div className="notification-badge">
                  {category.notifications}
                </div>
              )}
            </div>
            <div className="app-grid">
              {category.integrations.map((integration, idx) => (
                <div
                  key={integration.id}
                  className="app-icon"
                  data-special={integration.special}
                  onClick={() => {
                    if (integration.special === 'oracle-dashboard') {
                      navigate('/oracle/dashboard');
                    } else if (integration.special === 'weather-sharing') {
                      navigate('/integrations/share');
                    } else if (integration.special === 'device-setup') {
                      setSelectedDeviceType(integration.name);
                      setShowDeviceSetup(true);
                    } else if (integration.id === 'langchain') {
                      navigate('/integrations/ai/langchain');
                    } else if (setActiveTab) {
                      setActiveTab(integration.id);
                    }
                  }}
                >
                  <div className={`icon-wrapper ${getIconVariant(idx)}`}>
                    <i className={`bi ${integration.icon}`}></i>
                  </div>
                  <div className="app-name">{integration.name}</div>
                  {integration.notifications > 0 && (
                    <div className="notification-badge">
                      {integration.notifications}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Device Setup Dialog */}
      {showDeviceSetup && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
              borderRadius: '12px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setShowDeviceSetup(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: isDarkMode ? '#ffffff' : '#333333',
                zIndex: 10000,
              }}
            >
              ×
            </button>
            <DeviceSetupGuide deviceType={selectedDeviceType} />
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationsGridView;
