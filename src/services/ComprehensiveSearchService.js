/**
 * Comprehensive Search Service - searches across ALL app data
 * Includes contacts, messages, achievements, resources, bridges, settings, and more
 */

import { getContacts, getGroupChats } from '../utils/contactStorage';
import messageStorage from '../utils/messageStorage';
import { devLog } from '../utils/logger';

/**
 * Comprehensive search that covers the entire application
 * @param {string} query - The search query
 * @returns {Array} Array of search results from all app sources
 */
export const comprehensiveSearch = async query => {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();
  const results = [];

  // Search Contacts & Address Book
  try {
    const contacts = await getContacts();
    contacts.forEach(contact => {
      const searchableText = [
        contact.name || '',
        contact.label || '',
        contact.notes || '',
        contact.primaryAddress || '',
        ...(contact.addresses || []).map(
          addr => `${addr.address} ${addr.label} ${addr.chain}`,
        ),
        contact.category || '',
      ]
        .join(' ')
        .toLowerCase();

      if (searchableText.includes(normalizedQuery)) {
        results.push({
          id: `contact_${contact.id}`,
          title: contact.name || contact.primaryAddress,
          description: `Contact: ${contact.label || 'No label'} - ${contact.addresses?.length || 0} addresses`,
          category: 'Contacts',
          content: searchableText,
          url: '/address-book',
          icon: 'person',
          data: contact,
        });
      }
    });
  } catch (error) {
    console.warn('Could not search contacts:', error);
  }

  // Search Group Chats
  try {
    const groupChats = await getGroupChats();
    groupChats.forEach(group => {
      const searchableText = [
        group.name || '',
        group.description || '',
        ...(group.members || []).map(member => member.name || member.address),
        group.category || '',
      ]
        .join(' ')
        .toLowerCase();

      if (searchableText.includes(normalizedQuery)) {
        results.push({
          id: `group_${group.id}`,
          title: group.name || 'Unnamed Group',
          description: `Group Chat: ${group.members?.length || 0} members`,
          category: 'Group Chats',
          content: searchableText,
          url: '/messaging',
          icon: 'group',
          data: group,
        });
      }
    });
  } catch (error) {
    console.warn('Could not search group chats:', error);
  }

  // Search Messages
  try {
    const exportedMessages = messageStorage.exportMessages();
    Object.entries(exportedMessages).forEach(
      ([contactAddress, messageList]) => {
        messageList.forEach(message => {
          const searchableText = [
            message.content || '',
            message.sender || '',
            message.recipient || '',
            message.type || '',
          ]
            .join(' ')
            .toLowerCase();

          if (searchableText.includes(normalizedQuery)) {
            results.push({
              id: `message_${message.id}`,
              title: `Message: ${message.content?.substring(0, 50) || 'No content'}...`,
              description: `From: ${message.sender} to ${message.recipient}`,
              category: 'Messages',
              content: searchableText,
              url: '/messaging',
              icon: 'message',
              data: message,
            });
          }
        });
      },
    );
  } catch (error) {
    console.warn('Could not search messages:', error);
  }

  // Search Blockchain Standards & Resources
  const resourcesData = [
    {
      id: 'eip-712',
      title: 'EIP-712: Typed Data Signing',
      description: 'Structured data hashing and signing standard for Ethereum',
      category: 'Blockchain Standards',
      content:
        'EIP-712 Ethereum Improvement Proposal typed data signing structured data hash cryptographic security blockchain smart contracts',
      url: '/resources#blockchain-standards',
      icon: 'description',
    },
    {
      id: 'erc-721',
      title: 'ERC-721: Non-Fungible Token',
      description: 'NFT standard implementation for unique digital assets',
      category: 'Blockchain Standards',
      content:
        'ERC-721 non-fungible token NFT unique digital assets collectibles blockchain Ethereum',
      url: '/resources#blockchain-standards',
      icon: 'token',
    },
    {
      id: 'iso-27001',
      title: 'ISO 27001: Information Security Management',
      description:
        'International standard for information security management systems',
      category: 'ISO Standards',
      content:
        'ISO 27001 information security management systems ISMS cybersecurity risk management compliance',
      url: '/resources#iso-standards',
      icon: 'security',
    },
  ];

  resourcesData.forEach(resource => {
    const searchableText = [
      resource.title,
      resource.description,
      resource.content,
      resource.category,
    ]
      .join(' ')
      .toLowerCase();

    if (searchableText.includes(normalizedQuery)) {
      results.push(resource);
    }
  });

  // Search Wallet & Bridge Data
  const walletData = [
    {
      id: 'wallet-management',
      title: 'Wallet Management',
      description: 'Manage your cryptocurrency wallets and addresses',
      category: 'Wallet',
      content:
        'wallet management cryptocurrency addresses private keys public keys security',
      url: '/wallet',
      icon: 'account_balance_wallet',
    },
    {
      id: 'cross-chain-bridge',
      title: 'Cross-Chain Bridge',
      description: 'Bridge assets between different blockchain networks',
      category: 'Bridges',
      content:
        'cross-chain bridge assets ethereum polygon BSC avalanche transfer swap',
      url: '/bridge',
      icon: 'swap_horiz',
    },
  ];

  walletData.forEach(item => {
    const searchableText = [
      item.title,
      item.description,
      item.content,
      item.category,
    ]
      .join(' ')
      .toLowerCase();

    if (searchableText.includes(normalizedQuery)) {
      results.push(item);
    }
  });

  // Search Settings & Configuration
  const settingsData = [
    {
      id: 'privacy-settings',
      title: 'Privacy Settings',
      description: 'Configure privacy and security settings',
      category: 'Settings',
      content:
        'privacy settings security encryption disappearing messages contact verification',
      url: '/settings#privacy',
      icon: 'privacy_tip',
    },
    {
      id: 'network-settings',
      title: 'Network Settings',
      description: 'Configure blockchain network connections',
      category: 'Settings',
      content:
        'network settings blockchain RPC endpoints mainnet testnet custom networks',
      url: '/settings#network',
      icon: 'settings_ethernet',
    },
  ];

  settingsData.forEach(setting => {
    const searchableText = [
      setting.title,
      setting.description,
      setting.content,
      setting.category,
    ]
      .join(' ')
      .toLowerCase();

    if (searchableText.includes(normalizedQuery)) {
      results.push(setting);
    }
  });

  // Search Achievement NFTs & Governance
  const achievementData = [
    {
      id: 'achievement-nfts',
      title: 'Achievement NFTs',
      description: 'Your earned achievement badges and NFTs',
      category: 'Achievements',
      content:
        'achievement NFTs badges rewards earned collectibles proof participation',
      url: '/achievements',
      icon: 'military_tech',
    },
    {
      id: 'governance-proposals',
      title: 'Governance Proposals',
      description: 'Participate in Wrfcoin governance voting',
      category: 'Governance',
      content:
        'governance proposals voting DAO community decisions protocol upgrades',
      url: '/governance',
      icon: 'how_to_vote',
    },
  ];

  achievementData.forEach(item => {
    const searchableText = [
      item.title,
      item.description,
      item.content,
      item.category,
    ]
      .join(' ')
      .toLowerCase();

    if (searchableText.includes(normalizedQuery)) {
      results.push(item);
    }
  });

  // Sort results by relevance
  // Search known weather station locations
  const STATION_LOCATIONS = [
    { id: 'WS-NYC-001', name: 'Manhattan Hub', location: 'New York, NY', lat: 40.758, lng: -73.9855 },
    { id: 'WS-BOS-001', name: 'Boston Common', location: 'Boston, MA', lat: 42.3554, lng: -71.0655 },
    { id: 'WS-CHI-001', name: 'Chicago Loop', location: 'Chicago, IL', lat: 41.8781, lng: -87.6298 },
    { id: 'WS-SF-001', name: 'San Francisco Embarcadero', location: 'San Francisco, CA', lat: 37.7749, lng: -122.4194 },
    { id: 'WS-MIA-001', name: 'Miami Beach', location: 'Miami, FL', lat: 25.7617, lng: -80.1918 },
    { id: 'WS-SEA-001', name: 'Seattle Pike Place', location: 'Seattle, WA', lat: 47.6062, lng: -122.3321 },
    { id: 'WS-DEN-001', name: 'Denver Mile High', location: 'Denver, CO', lat: 39.7392, lng: -104.9903 },
    { id: 'WS-LA-001', name: 'Los Angeles DTLA', location: 'Los Angeles, CA', lat: 34.0522, lng: -118.2437 },
    { id: 'WS-DC-001', name: 'DC National Mall', location: 'Washington, DC', lat: 38.8977, lng: -77.0365 },
    { id: 'WS-ATL-001', name: 'Atlanta Midtown', location: 'Atlanta, GA', lat: 33.749, lng: -84.388 },
    { id: 'WS-DAL-001', name: 'Dallas Arts District', location: 'Dallas, TX', lat: 32.7767, lng: -96.797 },
    { id: 'WS-PHX-001', name: 'Phoenix Downtown', location: 'Phoenix, AZ', lat: 33.4484, lng: -112.074 },
  ];

  STATION_LOCATIONS.forEach(station => {
    const searchableText = `${station.name} ${station.location} ${station.id}`.toLowerCase();
    if (searchableText.includes(normalizedQuery)) {
      results.push({
        id: station.id,
        title: station.name,
        description: `Weather Station — ${station.location} (${station.lat.toFixed(2)}, ${station.lng.toFixed(2)})`,
        category: 'locations',
        content: searchableText,
        url: `/explorer?tab=map&station=${encodeURIComponent(station.id)}`,
        icon: 'place',
        data: station,
      });
    }
  });

  results.sort((a, b) => {
    const aTitle = (a.title || '').toLowerCase();
    const bTitle = (b.title || '').toLowerCase();

    const aExactMatch = aTitle.includes(normalizedQuery);
    const bExactMatch = bTitle.includes(normalizedQuery);

    if (aExactMatch && !bExactMatch) return -1;
    if (!aExactMatch && bExactMatch) return 1;

    return 0;
  });

  devLog(
    `Comprehensive search found ${results.length} results for "${query}"`,
  );
  return results.slice(0, 50); // Limit results
};

/**
 * Get search suggestions based on partial query
 * @param {string} partialQuery - Partial search query
 * @returns {Array} Array of search suggestions
 */
export const getSearchSuggestions = partialQuery => {
  if (!partialQuery || partialQuery.length < 2) {
    return [];
  }

  const suggestions = [
    'wallet',
    'bridge',
    'contacts',
    'messages',
    'settings',
    'EIP-712',
    'ISO-27001',
    'achievements',
    'governance',
    'privacy',
    'security',
    'cross-chain',
    'NFT',
  ];

  return suggestions
    .filter(suggestion =>
      suggestion.toLowerCase().includes(partialQuery.toLowerCase()),
    )
    .slice(0, 8);
};
