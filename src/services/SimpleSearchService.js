import { devLog } from '../utils/logger';
/**
 * Simple Search Service for immediate blockchain standards search
 * This provides a quick fix for finding EIP-712 and other blockchain standards
 */

// In-memory search data for immediate results
const searchData = [
  {
    id: 'eip-712',
    title: 'EIP-712: Typed Data Signing',
    description: 'Structured data hashing and signing standard for Ethereum',
    category: 'Ethereum Standards',
    content:
      'EIP-712 Ethereum Improvement Proposal typed data signing structured data hash cryptographic security blockchain smart contracts',
    tags: ['EIP', 'Ethereum', 'signing', 'typed-data', 'security'],
    url: '/resources#blockchain-standards',
  },
  {
    id: 'erc-4626',
    title: 'ERC-4626: Tokenized Vaults',
    description: 'Yield-bearing vault standard for DeFi protocols',
    category: 'Ethereum Standards',
    content:
      'ERC-4626 tokenized vault standard DeFi yield farming liquidity mining vault shares',
    tags: ['ERC', 'Ethereum', 'vault', 'DeFi', 'yield'],
    url: '/resources#blockchain-standards',
  },
  {
    id: 'erc-721',
    title: 'ERC-721: Non-Fungible Token',
    description: 'NFT standard implementation for unique digital assets',
    category: 'Ethereum Standards',
    content:
      'ERC-721 non-fungible token NFT unique digital assets collectibles blockchain Ethereum',
    tags: ['ERC', 'NFT', 'Ethereum', 'tokens', 'digital-assets'],
    url: '/resources#blockchain-standards',
  },
  {
    id: 'erc-1155',
    title: 'ERC-1155: Multi Token',
    description: 'Multi-token standard for efficient batch operations',
    category: 'Ethereum Standards',
    content:
      'ERC-1155 multi token standard batch operations gas efficiency fungible non-fungible',
    tags: ['ERC', 'Ethereum', 'multi-token', 'batch', 'efficiency'],
    url: '/resources#blockchain-standards',
  },
  {
    id: 'ibc-protocol',
    title: 'IBC Protocol',
    description: 'Inter-Blockchain Communication protocol for Cosmos ecosystem',
    category: 'Cross-Chain Standards',
    content:
      'IBC Inter-Blockchain Communication protocol Cosmos cross-chain interoperability',
    tags: ['IBC', 'Cosmos', 'cross-chain', 'interoperability'],
    url: '/resources#blockchain-standards',
  },
  {
    id: 'xcmp-polkadot',
    title: 'XCMP',
    description: 'Cross-Consensus Message Passing for Polkadot parachains',
    category: 'Polkadot Standards',
    content:
      'XCMP Cross-Consensus Message Passing Polkadot parachain communication substrate',
    tags: ['XCMP', 'Polkadot', 'parachain', 'messaging'],
    url: '/resources#blockchain-standards',
  },
  {
    id: 'wrfml-data',
    title: 'WrfML Data Format',
    description: 'Weather data standardization format for Wrfcoin network',
    category: 'Wrfcoin Standards',
    content:
      'WrfML weather data format standardization meteorological blockchain oracle',
    tags: ['WrfML', 'Wrfcoin', 'weather', 'data-format'],
    url: '/resources#blockchain-standards',
  },
  {
    id: 'wxm-protocol',
    title: 'WXM Protocol',
    description: 'Weather Exchange Messaging protocol for real-time data',
    category: 'Wrfcoin Standards',
    content:
      'WXM Weather Exchange Messaging protocol real-time data communication',
    tags: ['WXM', 'Wrfcoin', 'weather', 'messaging', 'real-time'],
    url: '/resources#blockchain-standards',
  },
  {
    id: 'blockchain-overview',
    title: 'Blockchain Standards Overview',
    description: 'Understanding EIP, ERC, and cross-chain protocols',
    category: 'Documentation',
    content:
      'This comprehensive guide covers Ethereum Improvement Proposals (EIP), Ethereum Request for Comments (ERC), and cross-chain communication protocols like IBC and XCMP.',
    tags: ['blockchain', 'standards', 'EIP', 'ERC', 'documentation'],
    url: '/resources#blockchain-standards',
  },
  // ISO Standards
  {
    id: 'iso-27001',
    title: 'ISO 27001: Information Security Management',
    description:
      'International standard for information security management systems',
    category: 'ISO Standards',
    content:
      'ISO 27001 information security management systems ISMS cybersecurity risk management compliance',
    tags: ['ISO', 'security', 'management', 'compliance', 'cybersecurity'],
    url: '/resources#iso-standards',
  },
  {
    id: 'iso-9001',
    title: 'ISO 9001: Quality Management Systems',
    description: 'International standard for quality management systems',
    category: 'ISO Standards',
    content:
      'ISO 9001 quality management systems QMS certification process improvement customer satisfaction',
    tags: ['ISO', 'quality', 'management', 'certification', 'improvement'],
    url: '/resources#iso-standards',
  },
  {
    id: 'iso-14001',
    title: 'ISO 14001: Environmental Management',
    description: 'Environmental management systems standard',
    category: 'ISO Standards',
    content:
      'ISO 14001 environmental management systems EMS sustainability environmental impact reduction',
    tags: ['ISO', 'environmental', 'sustainability', 'management', 'green'],
    url: '/resources#iso-standards',
  },
  // Technical Documentation
  {
    id: 'api-documentation',
    title: 'Wrfcoin API Documentation',
    description: 'Complete API reference for Wrfcoin blockchain',
    category: 'Technical Documentation',
    content:
      'API endpoints REST GraphQL WebSocket blockchain transactions mining rewards governance',
    tags: ['API', 'documentation', 'REST', 'GraphQL', 'blockchain'],
    url: '/resources#api-docs',
  },
  {
    id: 'smart-contracts',
    title: 'Smart Contract Guide',
    description: 'Development guide for Wrfcoin smart contracts',
    category: 'Technical Documentation',
    content:
      'smart contracts Solidity development deployment testing security best practices',
    tags: ['smart-contracts', 'Solidity', 'development', 'blockchain'],
    url: '/resources#smart-contracts',
  },
];

/**
 * Simple search function that works immediately
 * @param {string} query - The search query
 * @returns {Array} Array of search results
 */
export const simpleSearch = query => {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();
  devLog('Searching for:', normalizedQuery);

  const results = searchData.filter(item => {
    const searchableText = [
      item.title,
      item.description,
      item.content,
      item.category,
      ...(item.tags || []),
    ]
      .join(' ')
      .toLowerCase();

    // Check for exact matches and partial matches
    const exactMatch = searchableText.includes(normalizedQuery);
    const wordMatch = normalizedQuery
      .split(' ')
      .some(word => searchableText.includes(word) && word.length > 2);

    return exactMatch || wordMatch;
  });

  devLog('Found', results.length, 'results');
  return results.slice(0, 20); // Limit results
};

/**
 * Get all blockchain standards
 * @returns {Array} All blockchain standards
 */
export const getAllBlockchainStandards = () => {
  return searchData.filter(
    item =>
      item.category.includes('Standards') || item.category === 'Documentation',
  );
};
