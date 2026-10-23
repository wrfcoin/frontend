import React, { useState, useEffect, useRef } from 'react';
import { TestnetChip } from '../common/TestnetNotice';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './StartMenu.css';
import { getWebSocketClient } from '../../services/websocketService';
import SearchBar from '../Search/SearchBar';
import usePageNavigation from '../../hooks/usePageNavigation';
import PageNavigator from './PageNavigator';
import { pathTitle } from './pathTitle';
import FEATURES from '../../config/features';
import { isCapabilityRouteAvailable } from '../../config/capabilityRoutePolicy';
import {
  filterPublicSurfaces,
  isFullStudioEnabled,
  isOperatorPreviewEnabled,
  isPublicReadonlyEnabled,
} from '../../config/contractSurfacePolicy';
import { getPublicNavEntries } from '../../config/publicNavigation';

const StartMenu = ({ darkMode, toggleDarkMode, isFeatureEnabled = () => false }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const menuRef = useRef(null);
  const startButtonRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const allowShellHiddenFeatures = isFullStudioEnabled(
    import.meta.env?.VITE_ENABLE_FULL_STUDIO,
  );
  const allowOperatorPreview = isOperatorPreviewEnabled(
    import.meta.env?.VITE_ENABLE_OPERATOR_PREVIEW,
  );
  const { prevPage, nextPage, goToPrev, goToNext, currentIndex, totalPages, goToIndex } = usePageNavigation(isFeatureEnabled);

  // Menu items structure
  const menuItems = [
    {
      name: 'Weather Hub',
      icon: 'bi-cloud-sun',
      path: '/',
      submenu: [
        { name: 'Home', path: '/', icon: 'bi-house' },
        { name: 'Mission Control', path: '/weather/dashboard', icon: 'bi-speedometer' },
        { name: 'Connect Sensor', path: '/weather/onboarding', icon: 'bi-broadcast-pin' },
        { name: 'Fleet Management', path: '/fleet', icon: 'bi-grid-3x3-gap' },
        { name: 'Upload Data', path: '/data/upload', icon: 'bi-cloud-arrow-up' },
        { name: 'Data Quality', path: '/quality', icon: 'bi-clipboard2-pulse' },
        { name: 'Slashing History', path: '/oracle/slashing', icon: 'bi-exclamation-diamond' },
        { name: 'Oracle Leaderboard', path: '/oracle/leaderboard', icon: 'bi-trophy' },
        { name: 'Earnings', path: '/earnings', icon: 'bi-coin' },
      ],
    },
    {
      name: 'Get Started',
      icon: 'bi-rocket-takeoff',
      path: '/onboarding',
    },
    {
      name: 'Weather Map',
      icon: 'bi-globe-americas',
      path: '/map',
    },
    {
      name: 'Dashboard',
      icon: 'bi-speedometer2',
      path: '/dashboard',
      submenu: [
        { name: 'Main Dashboard', path: '/dashboard', icon: 'bi-bar-chart-line' },
        { name: 'Legacy Dashboard', path: '/dashboard/legacy', icon: 'bi-clock-history' },
      ],
    },
    {
      name: 'Wallet',
      icon: 'bi-wallet2',
      path: '/wallet',
      submenu: [
        { name: 'Wallet', path: '/wallet', icon: 'bi-wallet2' },
      ],
    },
    {
      name: 'Weather Processing',
      icon: 'bi-cloud-lightning',
      path: '/miner',
      submenu: [
        { name: 'Processing Dashboard', path: '/miner', icon: 'bi-cloud-lightning' },
      ],
    },
    {
      name: 'Identity',
      icon: 'bi-person-badge',
      path: '/identity',
      featureKey: 'identity',
      submenu: [
        { name: 'DID Dashboard', path: '/identity', icon: 'bi-fingerprint' },
        { name: '.wrf Names', path: '/identity/names', icon: 'bi-tag' },
        { name: 'Reputation', path: '/identity/reputation', icon: 'bi-shield-check' },
      ],
    },
    {
      name: 'Explorer',
      icon: 'bi-search',
      path: '/explorer',
      submenu: [
        { name: 'Block Explorer', path: '/explorer', icon: 'bi-search' },
        { name: 'DAG Visualizer', path: '/dag-explorer', icon: 'bi-diagram-3' },
      ],
    },
    {
      name: 'NFT',
      icon: 'bi-palette',
      path: '/nfts/enhanced',
      submenu: [
        { name: 'NFT Dashboard', path: '/nfts/enhanced', icon: 'bi-stars' },
        { name: 'GraphQL NFTs', path: '/nfts/graphql', icon: 'bi-diagram-2' },
        { name: 'My Collection', path: '/wallet', icon: 'bi-collection' },
      ],
    },
    {
      name: 'Resources',
      icon: 'bi-book',
      path: '/resources',
      submenu: [
        { name: 'Resources', path: '/resources', icon: 'bi-book' },
        { name: 'Wiki', path: '/resources/wiki', icon: 'bi-journal-text' },
        { name: 'Standards', path: '/standards', icon: 'bi-file-earmark-ruled' },
      ],
    },
    {
      name: 'Search',
      icon: 'bi-search',
      path: '/search',
    },
    {
      name: 'Governance',
      icon: 'bi-people',
      path: '/governance/comprehensive',
      submenu: [
        { name: 'Overview', path: '/governance/comprehensive', icon: 'bi-speedometer2' },
        { name: 'Quadratic Voting', path: '/governance/quadratic', icon: 'bi-calculator' },
        { name: 'Conviction Voting', path: '/governance/conviction', icon: 'bi-hourglass-split' },
        { name: 'Delegation', path: '/governance/delegation', icon: 'bi-arrow-left-right' },
        { name: 'Treasury', path: '/governance/treasury', icon: 'bi-safe' },
        { name: 'Vote Analytics', path: '/governance/analytics', icon: 'bi-graph-up-arrow' },
      ],
    },
    {
      name: 'Cross-Chain Bridge',
      icon: 'bi-link-45deg',
      path: '/bridge',
      featureKey: 'crossChain',
    },
    {
      name: 'Forecasts',
      icon: 'bi-graph-up',
      path: '/forecast',
      featureKey: 'forecast',
    },
    {
      name: 'Climate Reports',
      icon: 'bi-file-earmark-bar-graph',
      path: '/climate/reports',
    },
    {
      name: 'Forecast Studio',
      icon: 'bi-pencil-square',
      path: '/forecast/studio',
      featureKey: 'forecastStudio',
    },
    {
      name: 'Data Pipelines',
      icon: 'bi-diagram-2',
      path: '/pipelines',
      featureKey: 'pipelines',
    },
    {
      name: 'AI Models',
      icon: 'bi-robot',
      path: '/ai-marketplace',
      featureKey: 'aiMarketplace',
    },
    {
      name: 'Carbon Reporting',
      icon: 'bi-tree',
      path: '/carbon/reporting',
      featureKey: 'carbonReporting',
    },
    {
      name: 'Collaboration',
      icon: 'bi-people-fill',
      path: '/collaboration',
      featureKey: 'collaboration',
    },
    {
      name: 'Compute Market',
      icon: 'bi-gpu-card',
      path: '/compute',
      featureKey: 'computeMarketplace',
    },
    {
      name: 'Community',
      icon: 'bi-chat-square-dots',
      path: '/community',
      submenu: [
        { name: 'Forums', path: '/community', icon: 'bi-chat-square-dots' },
        { name: '🎭 Meme Mining', path: '/meme', icon: 'bi-emoji-laughing' },
        { name: 'Referrals', path: '/referrals', icon: 'bi-person-plus' },
      ],
    },
    {
      name: 'Leaderboard',
      icon: 'bi-trophy',
      path: '/leaderboard',
      featureKey: 'leaderboard',
      submenu: [
        { name: 'Global Rankings', path: '/leaderboard', icon: 'bi-trophy' },
        { name: 'Contributors', path: '/leaderboard/contributors', icon: 'bi-people-fill' },
        { name: 'Station of the Day', path: '/leaderboard/station-of-the-day', icon: 'bi-star' },
        { name: 'Nearby Stations', path: '/leaderboard/nearby', icon: 'bi-geo-alt' },
        { name: 'Cooperatives', path: '/leaderboard/cooperatives', icon: 'bi-people' },
      ],
    },
    {
      name: 'Activity Feed',
      icon: 'bi-activity',
      path: '/realtime/activity',
    },
    {
      name: 'DeFi Portfolio',
      icon: 'bi-bank',
      path: '/defi',
      featureKey: 'defi',
      submenu: [
        { name: 'Portfolio', path: '/defi', icon: 'bi-pie-chart' },
        { name: 'Fair Launch', path: '/fair-launch', icon: 'bi-rocket-takeoff' },
      ],
    },
    {
      name: 'Network Fees',
      icon: 'bi-fuel-pump',
      path: '/network/fees',
      featureKey: 'feeMarket',
    },
    {
      name: 'Liquid Staking',
      icon: 'bi-droplet-half',
      path: '/staking/liquid',
      featureKey: 'staking',
    },
    {
      name: 'Infrastructure',
      icon: 'bi-diagram-3-fill',
      path: '/infrastructure',
      featureKey: 'infrastructure',
    },
    {
      name: 'Smart Contracts',
      icon: 'bi-diagram-2-fill',
      path: '/smart-contracts',
      featureKey: 'smartContracts',
      submenu: [
        { name: 'Overview', path: '/smart-contracts', icon: 'bi-diagram-2' },
        { name: 'Architecture Graph', path: '/smart-contract-graph', icon: 'bi-diagram-3' },
      ],
    },
    {
      name: 'Fair Launch',
      icon: 'bi-rocket-takeoff',
      path: '/fair-launch',
      featureKey: 'defi',
    },
    {
      name: 'IoT Dashboard',
      icon: 'bi-router-fill',
      path: '/IoT',
      featureKey: 'iot',
      submenu: [
        { name: 'IoT Overview', path: '/IoT', icon: 'bi-router-fill' },
        { name: 'IoTeX', path: '/iotex', icon: 'bi-cpu' },
        { name: 'Sensor Community', path: '/sensor-community', icon: 'bi-broadcast' },
      ],
    },
    {
      name: 'Distributed Storage',
      icon: 'bi-hdd-network',
      path: '/storage',
      featureKey: 'storage',
    },
    {
      name: 'Communication',
      icon: 'bi-chat-dots',
      path: '/messaging',
      featureKey: 'messaging',
      submenu: [
        { name: 'Messaging', path: '/messaging', icon: 'bi-chat-square-text' },
        { name: 'Messaging Hub', path: '/messaging/hub', icon: 'bi-chat-dots' },
        { name: 'Messaging Test', path: '/messaging/test', icon: 'bi-chat-square-dots' },
        { name: 'Address Book', path: '/address-book', icon: 'bi-person-lines-fill' },
      ],
    },
    {
      name: 'Analytics',
      icon: 'bi-graph-up-arrow',
      path: '/analytics/unified',
      featureKey: 'analytics',
    },
    {
      name: 'Integrations Hub',
      icon: 'bi-boxes',
      path: '/integrations',
      featureKey: 'integrations',
      submenu: [
        { name: 'All Integrations', path: '/integrations', icon: 'bi-grid-3x3-gap-fill' },
        { name: 'Enhanced Hub', path: '/integrations-enhanced', icon: 'bi-arrow-up-circle' },
        { name: 'Enhanced v2', path: '/integrations/enhanced', icon: 'bi-stars' },
        { name: 'Oracle Network', path: '/oracle/dashboard', icon: 'bi-diagram-3' },
        { name: 'Slashing History', path: '/oracle/slashing', icon: 'bi-exclamation-diamond' },
        { name: 'Oracle Leaderboard', path: '/oracle/leaderboard', icon: 'bi-trophy' },
        { name: 'AI Integrations', path: '/integrations/ai', icon: 'bi-cpu' },
        { name: 'AI Plugins', path: '/integrations/ai-plugins', icon: 'bi-plugin' },
        { name: 'Cortex AI', path: '/cortex', icon: 'bi-brain' },
        { name: 'Workflows', path: '/integrations/workflows', icon: 'bi-diagram-2' },
        { name: 'Story Protocol', path: '/integrations/story-protocol', icon: 'bi-journal-richtext' },
        { name: 'Helium', path: '/integrations/helium', icon: 'bi-broadcast-pin' },
        { name: 'Filecoin', path: '/integrations/filecoin', icon: 'bi-hdd-stack' },
        { name: 'Bacalhau', path: '/integrations/bacalhau', icon: 'bi-cloud-arrow-up' },
        { name: 'iExec', path: '/integrations/iexec', icon: 'bi-cpu-fill' },
        { name: 'Golem', path: '/integrations/golem', icon: 'bi-gear-wide-connected' },
        { name: 'SONM', path: '/integrations/sonm', icon: 'bi-hdd-network' },
        { name: 'TatauCloud', path: '/integrations/tatau', icon: 'bi-cloud' },
        { name: 'Luftdaten', path: '/integrations/luftdaten', icon: 'bi-wind' },
        { name: 'Device Manager', path: '/integrations/devices', icon: 'bi-phone' },
        { name: 'Share Data', path: '/integrations/share', icon: 'bi-share' },
      ],
    },
    {
      name: 'Sharding',
      icon: 'bi-grid-3x3',
      path: '/sharding',
      featureKey: 'sharding',
    },
    {
      name: 'Gamification',
      icon: 'bi-controller',
      path: '/gamification',
      featureKey: 'gamification',
    },
    {
      name: 'Incentives',
      icon: 'bi-geo-alt',
      path: '/incentives',
      featureKey: 'incentives',
    },
    {
      name: 'Proof of Publishing',
      icon: 'bi-cloud-upload',
      path: '/pop',
    },
    {
      name: 'Settings',
      icon: 'bi-gear-fill',
      path: '/settings',
      submenu: [
        { name: 'General', path: '/settings', icon: 'bi-gear' },
        { name: 'Notifications', path: '/notifications/preferences', icon: 'bi-bell' },
        { name: 'Push Setup', path: '/notifications/push-setup', icon: 'bi-broadcast' },
        { name: 'Connection Status', path: '/realtime/status', icon: 'bi-wifi' },
        { name: 'Alert Remediation', path: '/alerts/remediation', icon: 'bi-shield-exclamation' },
      ],
    },
    {
      name: 'System Monitor',
      icon: 'bi-pc-display',
      path: '/system',
      featureKey: 'system',
      submenu: [
        { name: 'System Monitor', path: '/system', icon: 'bi-pc-display' },
        { name: 'Node OS', path: '/node-os', icon: 'bi-hdd' },
        { name: 'MCP Tools', path: '/mcp', icon: 'bi-tools' },
        { name: 'WebSocket Demo', path: '/websocket-demo', icon: 'bi-plug' },
      ],
    },
    {
      name: 'Mobile App',
      icon: 'bi-phone',
      path: '/mobile',
      featureKey: 'mobile',
      submenu: [
        { name: 'Mobile App', path: '/mobile', icon: 'bi-phone' },
        { name: 'Onboarding', path: '/onboarding', icon: 'bi-person-plus' },
      ],
    },
    {
      name: 'Validator Ops',
      icon: 'bi-shield-check',
      path: '/validators',
      featureKey: 'validatorOps',
      submenu: [
        { name: 'Operations Center', path: '/validators', icon: 'bi-shield-check' },
        { name: 'Staking Manager', path: '/validators/staking', icon: 'bi-coin' },
        { name: 'Slashing Monitor', path: '/validators/slashing', icon: 'bi-exclamation-triangle' },
        { name: 'Block Production', path: '/validators/blocks', icon: 'bi-boxes' },
        { name: 'Compare Validators', path: '/validators/compare', icon: 'bi-bar-chart-line' },
      ],
    },
    {
      name: 'Network Insights',
      icon: 'bi-diagram-3',
      path: '/network/topology',
      featureKey: 'networkInsights',
      submenu: [
        { name: 'Topology Map', path: '/network/topology', icon: 'bi-diagram-3' },
        { name: 'Block Relay', path: '/network/relay', icon: 'bi-arrow-left-right' },
        { name: 'Light Clients', path: '/network/light-clients', icon: 'bi-phone' },
        { name: 'Mempool', path: '/network/mempool', icon: 'bi-stack' },
        { name: 'PBS Explorer', path: '/network/pbs', icon: 'bi-puzzle' },
      ],
    },
    {
      name: 'Bridge Advanced',
      icon: 'bi-link-45deg',
      path: '/bridge/optimizer',
      featureKey: 'bridgeAdvanced',
      submenu: [
        { name: 'Route Optimizer', path: '/bridge/optimizer', icon: 'bi-signpost-split' },
        { name: 'Liquidity Depth', path: '/bridge/liquidity', icon: 'bi-water' },
        { name: 'Transaction Tracker', path: '/bridge/tracker', icon: 'bi-list-check' },
        { name: 'Cross-Chain Portfolio', path: '/bridge/portfolio', icon: 'bi-pie-chart' },
        { name: 'Security Audit', path: '/bridge/security', icon: 'bi-shield-lock' },
      ],
    },
    {
      name: 'Onboarding',
      icon: 'bi-rocket-takeoff',
      path: '/onboarding/qr',
      featureKey: 'advancedOnboarding',
      submenu: [
        { name: 'QR Scanner', path: '/onboarding/qr', icon: 'bi-qr-code-scan' },
        { name: 'Auto-Detect', path: '/onboarding/auto-detect', icon: 'bi-search' },
        { name: 'Streak Shield', path: '/onboarding/streak-shield', icon: 'bi-shield-check' },
      ],
    },
    {
      name: 'ZK Verification',
      icon: 'bi-fingerprint',
      path: '/zk/proofs',
      featureKey: 'zkVerification',
      submenu: [
        { name: 'Proof Verification', path: '/zk/proofs', icon: 'bi-patch-check' },
        { name: 'Privacy Explorer', path: '/zk/privacy', icon: 'bi-incognito' },
        { name: 'ZK Prover', path: '/zk/prover', icon: 'bi-shield-lock' },
      ],
    },
    {
      name: 'Execution Debugger',
      icon: 'bi-bug',
      path: '/debug/traces',
      featureKey: 'executionDebugger',
      submenu: [
        { name: 'Execution Traces', path: '/debug/traces', icon: 'bi-diagram-3' },
        { name: 'Tx Inspector', path: '/debug/transactions', icon: 'bi-search' },
        { name: 'State Debugger', path: '/debug/state', icon: 'bi-database-gear' },
      ],
    },
    {
      name: 'Accessibility',
      icon: 'bi-universal-access',
      path: '/accessibility',
      featureKey: 'accessibilityHub',
      submenu: [
        { name: 'Settings', path: '/accessibility', icon: 'bi-gear' },
        { name: 'Shortcuts', path: '/accessibility/shortcuts', icon: 'bi-keyboard' },
        { name: 'Screen Reader', path: '/accessibility/screen-reader', icon: 'bi-eye' },
      ],
    },
    {
      name: 'Language',
      icon: 'bi-translate',
      path: '/language',
      featureKey: 'i18n',
      submenu: [
        { name: 'Language Settings', path: '/language', icon: 'bi-globe' },
        { name: 'Translations', path: '/language/translations', icon: 'bi-pencil-square' },
      ],
    },
    {
      name: 'Export Manager',
      icon: 'bi-download',
      path: '/exports',
      featureKey: 'exportManager',
      submenu: [
        { name: 'Export Dashboard', path: '/exports', icon: 'bi-file-earmark-arrow-down' },
        { name: 'Report Templates', path: '/exports/templates', icon: 'bi-layout-text-sidebar' },
        { name: 'Scheduled Exports', path: '/exports/scheduled', icon: 'bi-clock-history' },
      ],
    },
    {
      name: 'Weather Globe',
      icon: 'bi-globe-americas',
      path: '/globe',
      featureKey: 'weatherGlobe',
    },
    {
      name: 'Partners',
      icon: 'bi-handshake',
      path: '/partners',
      featureKey: 'partners',
    },
    {
      name: 'Developer',
      icon: 'bi-code-slash',
      path: '/developer',
      featureKey: 'developer',
      submenu: [
        { name: 'Developer Portal', path: '/developer', icon: 'bi-code-slash' },
        { name: 'Debug', path: '/debug', icon: 'bi-bug' },
      ],
    },
  ];
  // Public build (no full studio): a small flat menu derived from the route
  // policy, so every visible link is reachable. Studio builds keep the full menu.
  const publicMenuItems = getPublicNavEntries(
    isPublicReadonlyEnabled(import.meta.env?.VITE_PUBLIC_READONLY_PATHS),
  ).map(({ name, path, icon }) => ({ name, path, icon }));
  const visibleMenuItems = !allowShellHiddenFeatures ? publicMenuItems : filterPublicSurfaces(
    menuItems,
    allowShellHiddenFeatures,
    allowOperatorPreview,
  ).filter(item => (!item.featureKey || FEATURES[item.featureKey]) && isCapabilityRouteAvailable(item.path, isFeatureEnabled))
    .map(item => ({ ...item, submenu: item.submenu?.filter(child => isCapabilityRouteAvailable(child.path, isFeatureEnabled)) }));

  // State for real-time blockchain metrics data
  const [blockchainMetrics, setBlockchainMetrics] = useState([
    { icon: 'bi-boxes', label: 'Block', value: '...' },
    { icon: 'bi-lightning', label: 'TPS', value: '...' },
    { icon: 'bi-cloud-lightning', label: 'Processing', value: '...' },
    { icon: 'bi-diagram-3', label: 'Nodes', value: '...' },
  ]);

  // Connect to WebSocket for real-time metrics
  useEffect(() => {
    if (!allowShellHiddenFeatures) {
      return;
    }

    try {
      const wsClient = getWebSocketClient({
        channels: ['blocks'],
        autoReconnect: true,
      });

      // Handle state updates
      const handleStateUpdate = data => {
        if (data && data.state) {
          const { blockHeight, hashrate, difficulty, pendingTransactions } =
            data.state;

          // Get the page-specific metrics based on the current path
          const updatedMetrics = getPageSpecificMetrics(
            location.pathname,
            blockHeight,
            hashrate,
            difficulty,
            pendingTransactions,
          );

          setBlockchainMetrics(updatedMetrics);
        }
      };

      // Register handler for blockchain state updates
      const unsubscribe = wsClient.on('STATE_UPDATE', handleStateUpdate);

      // Cleanup on unmount
      return () => {
        if (unsubscribe) unsubscribe();
      };
    } catch (error) {
      console.error('Error connecting to WebSocket for metrics:', error);
    }
  }, [allowShellHiddenFeatures, location.pathname]);

  // Get page-specific metrics based on the current page
  const getPageSpecificMetrics = (
    path,
    blockHeight,
    hashrate,
    difficulty,
    pendingTx,
  ) => {
    // For bridge page
    if (path.includes('bridge')) {
      return [
        {
          icon: 'bi-boxes',
          label: 'Block',
          value: blockHeight?.toString() || '...',
        },
        {
          icon: 'bi-arrow-left-right',
          label: 'TPS',
          value: ((hashrate || 0) / 20).toFixed(1),
        },
        {
          icon: 'bi-cpu',
          label: 'Hashrate',
          value: `${(hashrate || 0) / 1000} PH/s`,
        },
        { icon: 'bi-diagram-3', label: 'Nodes', value: '327' },
      ];
    }

    // For NFT pages
    else if (path.includes('nft')) {
      return [
        {
          icon: 'bi-boxes',
          label: 'Block',
          value: blockHeight?.toString() || '...',
        },
        { icon: 'bi-palette', label: 'NFTs', value: '128' },
        { icon: 'bi-people', label: 'Creators', value: '42' },
        {
          icon: 'bi-cpu',
          label: 'Compute',
          value: `${(hashrate || 0) / 1500} C/s`,
        },
      ];
    }

    // For oracle pages
    else if (path.includes('oracle')) {
      return [
        {
          icon: 'bi-boxes',
          label: 'Block',
          value: blockHeight?.toString() || '...',
        },
        { icon: 'bi-diagram-3', label: 'Validators', value: '7' },
        { icon: 'bi-cloud-check', label: 'Uptime', value: '99.8%' },
        { icon: 'bi-link-45deg', label: 'Feeds', value: '15' },
      ];
    }

    // For governance pages
    else if (path.includes('governance')) {
      return [
        {
          icon: 'bi-boxes',
          label: 'Block',
          value: blockHeight?.toString() || '...',
        },
        { icon: 'bi-clipboard-check', label: 'Proposals', value: '8' },
        { icon: 'bi-people', label: 'Voters', value: '143' },
        { icon: 'bi-check-square', label: 'Success', value: '91%' },
      ];
    }

    // Default metrics for other pages
    return [
      {
        icon: 'bi-boxes',
        label: 'Block',
        value: blockHeight?.toString() || '...',
      },
      {
        icon: 'bi-lightning',
        label: 'TPS',
        value: ((hashrate || 0) / 20).toFixed(1),
      },
      {
        icon: 'bi-cpu',
        label: 'Hashrate',
        value: `${(hashrate || 0) / 1000} PH/s`,
      },
      {
        icon: 'bi-collection',
        label: 'Tx Pending',
        value: pendingTx?.toString() || '0',
      },
    ];
  };

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
        setActiveSubmenu(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Escape closes the open menu from anywhere (Start itself or a focused menu item) and hands focus
  // back to Start, so a keyboard user is never left on a removed element. Closing with the Start button
  // keeps focus there by itself; navigating moves on to the new page.
  useEffect(() => {
    if (!menuOpen) return undefined;
    function handleEscape(event) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setMenuOpen(false);
      setActiveSubmenu(null);
      startButtonRef.current?.focus();
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [menuOpen]);

  // Close menu when navigating to a new route
  useEffect(() => {
    setMenuOpen(false);
    setActiveSubmenu(null);
  }, [location.pathname]);

  // Helper to get current page name from pathname
  const getCurrentPageName = () => {
    const path = location.pathname;

    // Special case for home/dashboard
    if (path === '/') return 'Dashboard';

    // Find matching menu item
    const menuItem = visibleMenuItems.find(
      item =>
        path === item.path ||
        (item.submenu && item.submenu.some(sub => path === sub.path)),
    );

    if (menuItem) {
      if (menuItem.submenu) {
        const subItem = menuItem.submenu.find(sub => path === sub.path);
        if (subItem) return `${menuItem.name} > ${subItem.name}`;
      }
      return menuItem.name;
    }

    // Return formatted path name if no match found (opaque ids keep their case)
    return pathTitle(path);
  };

  // Toggle submenu visibility
  const toggleSubmenu = itemName => {
    if (activeSubmenu === itemName) {
      setActiveSubmenu(null);
    } else {
      setActiveSubmenu(itemName);
    }
  };

  // Handle navigation
  const handleNavigation = path => {
    navigate(path);
    setMenuOpen(false);
    setActiveSubmenu(null);
  };

  // frontend#298: one deterministic activation path for every top-level item,
  // shared by click and keyboard. A parent with a submenu toggles it (the
  // whole row, label and chevron alike, is the hit area — the row is the only
  // element with a handler, so there is no inner target that swallows the
  // click); a leaf navigates. Every parent also carries a `path` that has a
  // real route, so its URL can be typed or bookmarked directly.
  const activateMenuItem = (event, item) => {
    event.preventDefault();
    event.stopPropagation();
    if (item.submenu) {
      toggleSubmenu(item.name);
    } else {
      handleNavigation(item.path);
    }
  };

  return (
    <div className="start-menu-container" ref={menuRef}>
      {/* Start Menu */}
      {menuOpen && (
        <div className="start-menu">
          <div className="menu-columns">
            <div className="menu-column primary">
              <div className="menu-items">
                {visibleMenuItems.map(item => (
                  <div
                    key={item.name}
                    className={`menu-item ${location.pathname === item.path ? 'active' : ''} ${activeSubmenu === item.name ? 'submenu-open' : ''}`}
                  >
                    <div
                      className="menu-item-content"
                      role="button"
                      tabIndex={0}
                      data-testid={`start-menu-item-${item.name}`}
                      aria-haspopup={item.submenu ? 'true' : undefined}
                      aria-expanded={item.submenu ? activeSubmenu === item.name : undefined}
                      onClick={event => activateMenuItem(event, item)}
                      onKeyDown={event => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          activateMenuItem(event, item);
                        }
                      }}
                    >
                      <i className={`bi ${item.icon}`} aria-hidden="true"></i>
                      <span>{item.name}</span>
                      {item.submenu && (
                        <i className="bi bi-chevron-down submenu-indicator" aria-hidden="true"></i>
                      )}
                    </div>

                    {/* Submenu */}
                    {item.submenu && activeSubmenu === item.name && (
                      <div className="submenu">
                        {item.submenu.map(subItem => (
                          <div
                            key={subItem.name}
                            className={`submenu-item ${location.pathname === subItem.path ? 'active' : ''}`}
                            role="menuitem"
                            tabIndex={0}
                            onClick={event => {
                              event.stopPropagation();
                              handleNavigation(subItem.path);
                            }}
                            onKeyDown={event => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                handleNavigation(subItem.path);
                              }
                            }}
                          >
                            <i className={`bi ${subItem.icon}`}></i>
                            <span>{subItem.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="menu-column secondary">
              <div className="user-profile">
                <i className="bi bi-person-circle profile-icon"></i>
                <div className="profile-info">
                  <div className="username">WRF User</div>
                  <div className="network-status">Connected to testnet</div>
                </div>
              </div>

              <div className="quick-actions">
                <button className="action-button">
                  <i className="bi bi-gear"></i>
                  <span>Settings</span>
                </button>
                <button className="action-button">
                  <i className="bi bi-arrow-repeat"></i>
                  <span>Refresh Node</span>
                </button>
                <button className="action-button">
                  <i className="bi bi-power"></i>
                  <span>Power Options</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Taskbar */}
      <nav className="taskbar" aria-label="Taskbar">
        <div className="taskbar-left">
          {/* A real button: the menu opens from the keyboard (Enter/Space) and reports its state. */}
          <button
            ref={startButtonRef}
            type="button"
            className={`start-button ${menuOpen ? 'active' : ''}`}
            aria-expanded={menuOpen}
            aria-haspopup="true"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg
              className="logo-image"
              width="20"
              height="20"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M50 0C22.4 0 0 22.4 0 50C0 77.6 22.4 100 50 100C77.6 100 100 77.6 100 50C100 22.4 77.6 0 50 0ZM73.3 69.2L63.3 79.2C62.1 80.4 60.4 81 58.8 81H41.2C39.6 81 37.9 80.4 36.7 79.2L26.7 69.2C25.5 68 24.9 66.3 24.9 64.7V35.3C24.9 33.7 25.5 32 26.7 30.8L36.7 20.8C37.9 19.6 39.6 19 41.2 19H58.8C60.4 19 62.1 19.6 63.3 20.8L73.3 30.8C74.5 32 75.1 33.7 75.1 35.3V64.7C75.1 66.3 74.5 68 73.3 69.2Z"
                fill="var(--primary-color)"
              />
              <path
                d="M63 39L50 26L37 39L50 52L63 39Z"
                fill="var(--text-color)"
              />
              <path
                d="M36 63L49 76L62 63L49 50L36 63Z"
                fill="var(--text-color)"
              />
            </svg>
            <span>Start</span>
          </button>

          <PageNavigator
            currentPage={currentIndex}
            totalPages={totalPages}
            onNavigate={goToIndex}
            title={getCurrentPageName()}
          />
        </div>

        {/*
          The metrics strip is fed only by the 'blocks' WebSocket channel above,
          and that effect returns early when shell hidden features are off. For
          an anonymous public visitor it would therefore sit at its initial
          '...' placeholder forever — a permanently-loading Block / TPS /
          Processing / Nodes readout that reads as live chain data and never is.
          Render it only where it can actually be fed. The public landing page
          shows the real, admitted numbers instead (usePublicTestnetStats).
        */}
        {allowShellHiddenFeatures && (
          <div className="taskbar-center">
            <div className="status-metrics">
              {blockchainMetrics.map((metric, index) => (
                <div key={index} className="status-metric">
                  <i className={`bi ${metric.icon} metric-icon`}></i>
                  <div className="metric-content">
                    <div className="metric-label">{metric.label}</div>
                    <div className="metric-value">{metric.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="taskbar-right">
          {allowShellHiddenFeatures && (
            <div className="search-container" data-testid="start-menu-search-container">
              <SearchBar placeholder="Search Wrfcoin Core..." width="250px" />
            </div>
          )}
          <TestnetChip />
          <button className="theme-toggle-btn" aria-label="Toggle color theme" onClick={toggleDarkMode}>
            <i className={`bi ${darkMode ? 'bi-sun' : 'bi-moon'}`}></i>
          </button>
          <div className="time-display">
            {new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default StartMenu;
