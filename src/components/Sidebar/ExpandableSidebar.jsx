import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './ExpandableSidebar.css';
import SearchSidebar from '../Search/SearchSidebar';
import {
  filterPublicSurfaces,
  isFullStudioEnabled,
  isOperatorPreviewEnabled,
} from '../../config/contractSurfacePolicy';

const ExpandableSidebar = ({
  sidebarCollapsed,
  expandedMenu,
  toggleExpandMenu,
}) => {
  const showFullStudioFeatures = isFullStudioEnabled(
    import.meta.env?.VITE_ENABLE_FULL_STUDIO,
  );
  const showOperatorPreview = isOperatorPreviewEnabled(
    import.meta.env?.VITE_ENABLE_OPERATOR_PREVIEW,
  );
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedCategories, setExpandedCategories] = useState({});

  // Function to toggle category expansion
  const toggleCategory = categoryName => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
  };

  // Function to handle menu item click that both navigates and expands
  const handleMenuItemClick = (menuName, path) => {
    // Toggle the menu expansion
    toggleExpandMenu(menuName);

    // Navigate to the specified path
    if (path) {
      navigate(path);
    }
  };

  // Menu definitions
  const menus = {
    settings: {
      title: 'Settings',
      items: [
        {
          name: 'User Preferences',
          path: '/settings/preferences',
          icon: 'bi-person-gear',
        },
        { name: 'Privacy', path: '/settings/privacy', icon: 'bi-shield-lock' },
        { name: 'Network', path: '/settings/network', icon: 'bi-router' },
        {
          name: 'Integrations',
          path: '/settings/integrations',
          icon: 'bi-boxes',
        },
        {
          name: 'Security',
          path: '/settings/security',
          icon: 'bi-shield-check',
        },
      ],
    },
    integrations: {
      title: 'Integrations',
      items: [
        {
          name: 'All Integrations',
          path: '/integrations',
          icon: 'bi-grid-3x3-gap-fill',
        },
        {
          name: 'Oracles',
          path: '/integrations/oracles',
          icon: 'bi-diagram-3',
          children: [
            {
              name: 'Chainlink',
              path: '/integrations/oracles/chainlink',
              icon: 'bi-link',
            },
            {
              name: 'Pyth Network',
              path: '/integrations/oracles/pyth',
              icon: 'bi-p-square',
            },
            {
              name: 'API3',
              path: '/integrations/oracles/api3',
              icon: 'bi-three-dots',
            },
          ],
        },
        {
          name: 'Storage',
          path: '/integrations/storage',
          icon: 'bi-hdd-network',
          children: [
            {
              name: 'IPFS',
              path: '/integrations/storage/ipfs',
              icon: 'bi-hdd',
            },
            {
              name: 'Arweave',
              path: '/integrations/storage/arweave',
              icon: 'bi-archive',
            },
            {
              name: 'Filecoin',
              path: '/integrations/storage/filecoin',
              icon: 'bi-file-earmark',
            },
            {
              name: 'Storj',
              path: '/integrations/storage/storj',
              icon: 'bi-cloud-upload',
            },
            {
              name: 'Walrus',
              path: '/integrations/storage/walrus',
              icon: 'bi-safe',
            },
          ],
        },
        {
          name: 'Compute',
          path: '/integrations/compute',
          icon: 'bi-cpu',
          children: [
            {
              name: 'Akash Network',
              path: '/integrations/compute/akash',
              icon: 'bi-server',
            },
            {
              name: 'Bacalhau',
              path: '/integrations/compute/bacalhau',
              icon: 'bi-motherboard',
            },
            {
              name: 'Render Network',
              path: '/integrations/compute/render',
              icon: 'bi-gpu-card',
            },
            {
              name: 'Aethir',
              path: '/integrations/compute/aethir',
              icon: 'bi-lightning',
            },
            {
              name: 'Internet Computer',
              path: '/integrations/compute/icp',
              icon: 'bi-globe',
            },
            {
              name: 'SONM',
              path: '/integrations/compute/sonm',
              icon: 'bi-hdd-network',
            },
            {
              name: 'Golem',
              path: '/integrations/compute/golem',
              icon: 'bi-braces',
            },
            {
              name: 'iExec',
              path: '/integrations/compute/iexec',
              icon: 'bi-gpu-card',
            },
            {
              name: 'Luftdaten',
              path: '/integrations/compute/luftdaten',
              icon: 'bi-cloud-haze',
            },
          ],
        },
        {
          name: 'Cross-Chain',
          path: '/integrations/cross-chain',
          icon: 'bi-link-45deg',
          children: [
            {
              name: 'Cross-Chain Bridge',
              path: '/bridge',
              icon: 'bi-arrow-left-right',
              description:
                'Unified cross-chain interface with token bridge, NFT bridge, privacy features, and analytics',
            },
            {
              name: 'Cosmos',
              path: '/integrations/cross-chain/cosmos',
              icon: 'bi-stars',
            },
            {
              name: 'Axelar',
              path: '/integrations/cross-chain/axelar',
              icon: 'bi-arrow-left-right',
            },
            {
              name: 'LayerZero',
              path: '/integrations/cross-chain/layerzero',
              icon: 'bi-layers',
            },
            {
              name: 'Wormhole',
              path: '/integrations/cross-chain/wormhole',
              icon: 'bi-infinity',
            },
            {
              name: 'Base',
              path: '/integrations/cross-chain/base',
              icon: 'bi-box',
            },
            {
              name: 'Optimism',
              path: '/integrations/cross-chain/optimism',
              icon: 'bi-arrow-up-right-circle',
            },
          ],
        },
        {
          name: 'AI/ML',
          path: '/integrations/ai-ml',
          icon: 'bi-robot',
          children: [
            {
              name: 'Model Context Protocol',
              path: '/mcp',
              icon: 'bi-diagram-3-fill',
            },
            {
              name: 'Bittensor',
              path: '/integrations/ai-ml/bittensor',
              icon: 'bi-cpu-fill',
            },
            {
              name: 'SingularityNET',
              path: '/integrations/ai-ml/singularitynet',
              icon: 'bi-stars',
            },
            {
              name: 'Wolfram Alpha & Language',
              path: '/integrations/ai-ml/wolfram',
              icon: 'bi-calculator-fill',
            },
            {
              name: 'Fetch.ai',
              path: '/integrations/ai-ml/fetchai',
              icon: 'bi-robot',
            },
          ],
        },
        {
          name: 'IoT',
          path: '/integrations/iot',
          icon: 'bi-broadcast',
          children: [
            {
              name: 'AIOZ MediaMTX',
              path: '/integrations/iot/aioz-media',
              icon: 'bi-broadcast-pin',
            },
            {
              name: 'The Things Network',
              path: '/integrations/iot/ttn',
              icon: 'bi-wifi',
            },
            {
              name: 'Streamr',
              path: '/integrations/iot/streamr',
              icon: 'bi-broadcast',
            },
            {
              name: 'Helium',
              path: '/integrations/iot/helium',
              icon: 'bi-reception-4',
            },
            {
              name: 'FOAM Protocol',
              path: '/integrations/iot/foam',
              icon: 'bi-geo-alt',
            },
            {
              name: 'Open Geospatial',
              path: '/integrations/iot/ogc',
              icon: 'bi-globe-americas',
            },
          ],
        },
        {
          name: 'Data Providers',
          path: '/integrations/data-providers',
          icon: 'bi-database',
          children: [
            {
              name: 'Weather Protocols',
              path: '/integrations/data-providers/weather',
              icon: 'bi-cloud-sun',
            },
            {
              name: 'Sensor.Community',
              path: '/integrations/data-providers/sensor-community',
              icon: 'bi-thermometer',
            },
            {
              name: 'OpenAQ',
              path: '/integrations/data-providers/openaq',
              icon: 'bi-wind',
            },
            {
              name: 'OpenAerialMap',
              path: '/integrations/data-providers/openaerialmap',
              icon: 'bi-map',
            },
            {
              name: 'OpenForis',
              path: '/integrations/data-providers/openforis',
              icon: 'bi-tree',
            },
            {
              name: 'Ocean Protocol',
              path: '/integrations/data-providers/ocean',
              icon: 'bi-water',
            },
            {
              name: 'The Graph Protocol',
              path: '/integrations/data-providers/graph',
              icon: 'bi-diagram-3',
            },
          ],
        },
        {
          name: 'Story Protocol',
          path: '/integrations/story-protocol',
          icon: 'bi-journal-text',
          children: [
            {
              name: 'IP Kit',
              path: '/integrations/story-protocol/ipkit',
              icon: 'bi-briefcase',
            },
            {
              name: 'Protocol Contracts',
              path: '/integrations/story-protocol/protocol-contracts',
              icon: 'bi-file-text',
            },
            {
              name: 'NFT Oracle',
              path: '/integrations/story-protocol/nft-oracle',
              icon: 'bi-gem',
            },
            {
              name: 'Integration Hub',
              path: '/integrations/story-protocol/integration',
              icon: 'bi-grid-3x3',
            },
          ],
        },
      ],
    },
    resources: {
      title: 'Resources',
      items: [
        { name: 'Documentation', path: '/resources', icon: 'bi-book' },
        { name: 'Wiki', path: '/resources/docs', icon: 'bi-file-text' },
        {
          name: 'Tutorials',
          path: '/resources/tutorials',
          icon: 'bi-mortarboard',
        },
        {
          name: 'API Reference',
          path: '/resources/api',
          icon: 'bi-code-square',
        },
      ],
    },
    governance: {
      title: 'Governance',
      items: [
        { name: 'Dashboard', path: '/governance', icon: 'bi-people' },
        {
          name: 'Proposals',
          path: '/governance/proposals',
          icon: 'bi-list-check',
        },
        {
          name: 'Create Proposal',
          path: '/governance/proposals/new',
          icon: 'bi-file-plus',
        },
        { name: 'Voting', path: '/governance/voting', icon: 'bi-check-square' },
      ],
    },
    nfts: {
      title: 'NFT Management',
      items: [
        { name: 'NFT Dashboard', path: '/nfts/enhanced', icon: 'bi-stars' },
        {
          name: 'My Collection',
          path: '/nfts/collection',
          icon: 'bi-collection',
        },
      ],
    },
  };
  const visibleMenus = Object.fromEntries(
    Object.entries(menus).map(([key, menu]) => [
      key,
      {
        ...menu,
        items: filterPublicSurfaces(
          menu.items,
          showFullStudioFeatures,
          showOperatorPreview,
        ),
      },
    ]),
  );

  // Active state check for sidebar items
  const isActive = path => {
    return (
      location.pathname === path ||
      (path !== '/' && location.pathname.startsWith(path))
    );
  };

  return (
    <div
      className={`sidebar-submenu-container ${sidebarCollapsed ? 'collapsed' : ''}`}
    >
      {/* Show expanded menu when an item is selected */}
      {expandedMenu && (
        <div className="secondary-sidebar">
          <div className="secondary-sidebar-header">
            <h3>{visibleMenus[expandedMenu].title}</h3>
            <button
              className="close-secondary-btn"
              onClick={() => toggleExpandMenu(null)}
            >
              <i className="bi bi-x"></i>
            </button>
          </div>
          <ul className="secondary-sidebar-menu">
            {visibleMenus[expandedMenu].items.map((item, index) => (
              <li
                key={index}
                className={`secondary-sidebar-item ${isActive(item.path) ? 'active' : ''}`}
              >
                <Link to={item.path} className="secondary-sidebar-link">
                  <i className={`bi ${item.icon}`}></i>
                  <span className="secondary-link-text">{item.name}</span>
                </Link>
                {item.children && (
                  <div className="category-container">
                    <div
                      className="category-header"
                      onClick={e => {
                        e.preventDefault();
                        toggleCategory(item.name);
                      }}
                    >
                      <i
                        className={`bi ${expandedCategories[item.name] ? 'bi-chevron-down' : 'bi-chevron-right'}`}
                      ></i>
                      <span>Toggle {item.name}</span>
                    </div>
                    <ul
                      className={`secondary-sidebar-submenu ${expandedCategories[item.name] ? 'expanded' : 'collapsed'}`}
                    >
                      {item.children.map((child, childIndex) => (
                        <li
                          key={`${index}-${childIndex}`}
                          className={`secondary-sidebar-subitem ${isActive(child.path) ? 'active' : ''}`}
                        >
                          <Link
                            to={child.path}
                            className="secondary-sidebar-sublink"
                            onClick={() => toggleExpandMenu(null)}
                          >
                            <i className={`bi ${child.icon}`}></i>
                            <span className="secondary-sublink-text">
                              {child.name}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Show search sidebar when on the search page and no other menu is expanded */}
      {location.pathname.startsWith('/search') && !expandedMenu && (
        <div className="secondary-sidebar">
          <div className="secondary-sidebar-header">
            <h3>Search Filters</h3>
          </div>
          <div className="secondary-sidebar-content">
            {/* The SearchSidebar component will be rendered from the SearchResults component */}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpandableSidebar;
