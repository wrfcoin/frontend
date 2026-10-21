/**
 * Default module data used as fallback when the backend API is unreachable.
 * Provides representative offline data so the Module Controller page renders
 * meaningful content instead of a blank page.
 */

export const DEFAULT_MODULES = [
  {
    id: 'consensus',
    name: 'Consensus Engine',
    description: 'PoW/PoS/PoP consensus mechanisms for block validation',
    category: 'Core',
    status: 'active',
    enabled: true,
    version: '2.4.0',
  },
  {
    id: 'p2p',
    name: 'P2P Networking',
    description: 'Libp2p-based peer discovery and message propagation',
    category: 'Core',
    status: 'active',
    enabled: true,
    version: '1.8.1',
  },
  {
    id: 'privacy',
    name: 'Privacy Layer',
    description: 'Ring signatures, stealth addresses, and selective disclosure',
    category: 'Core',
    status: 'active',
    enabled: true,
    version: '1.3.0',
  },
  {
    id: 'weather-data',
    name: 'Weather Data',
    description:
      'Weather station ingestion, forecast verification, and oracle feeds',
    category: 'Data',
    status: 'active',
    enabled: true,
    version: '3.1.2',
  },
  {
    id: 'governance',
    name: 'Governance',
    description: 'DAO proposals, voting, and treasury management',
    category: 'Platform',
    status: 'active',
    enabled: true,
    version: '1.5.0',
  },
  {
    id: 'nft',
    name: 'NFT Engine',
    description: 'Computational NFT minting, marketplace, and auction system',
    category: 'Finance',
    status: 'inactive',
    enabled: false,
    version: '2.0.1',
  },
  {
    id: 'defi',
    name: 'DeFi Protocols',
    description: 'AMM, yield farming, flash loans, and liquid staking',
    category: 'Finance',
    status: 'active',
    enabled: true,
    version: '1.2.0',
  },
  {
    id: 'monitoring',
    name: 'Monitoring',
    description: 'Prometheus metrics, health checks, and alerting',
    category: 'Platform',
    status: 'active',
    enabled: true,
    version: '1.1.0',
  },
];

export const DEFAULT_CATEGORIES = [
  {
    name: 'Core',
    status: 'active',
    enabledCount: 3,
    totalCount: 3,
  },
  {
    name: 'Data',
    status: 'active',
    enabledCount: 1,
    totalCount: 1,
  },
  {
    name: 'Finance',
    status: 'partial',
    enabledCount: 1,
    totalCount: 2,
  },
  {
    name: 'Platform',
    status: 'active',
    enabledCount: 2,
    totalCount: 2,
  },
];

export const DEFAULT_PROFILES = [
  {
    name: 'Full Node',
    description: 'All modules enabled for complete node operation',
    modules: [
      'consensus',
      'p2p',
      'privacy',
      'weather-data',
      'governance',
      'nft',
      'defi',
      'monitoring',
    ],
  },
  {
    name: 'Light Node',
    description: 'Minimal modules for lightweight participation',
    modules: ['consensus', 'p2p', 'weather-data'],
  },
  {
    name: 'Validator',
    description: 'Consensus and data modules for block validation',
    modules: ['consensus', 'p2p', 'privacy', 'weather-data', 'monitoring'],
  },
];
