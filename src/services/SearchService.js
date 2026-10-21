import { devLog } from '../utils/logger';
/**
 * Wrfcoin Universal Search Service
 *
 * This service provides a comprehensive search capability that works both online and offline.
 * It uses a local indexing system combined with the IndexedDB API to store and query data locally.
 */

// Search categories
export const SEARCH_CATEGORIES = {
  // Resources & Documentation
  ARTICLES: 'articles',
  DOCUMENTATION: 'documentation',
  TUTORIALS: 'tutorials',
  BLOCKCHAIN_STANDARDS: 'blockchain_standards',
  ISO_STANDARDS: 'iso_standards',

  // Blockchain & Explorer
  TRANSACTIONS: 'transactions',
  BLOCKS: 'blocks',
  ADDRESSES: 'addresses',
  SMART_CONTRACTS: 'smart_contracts',
  BLOCKCHAIN_DATA: 'blockchain_data',

  // Communication & Social
  MESSAGES: 'messages',
  ADDRESS_BOOK: 'address_book',
  GROUP_CHATS: 'group_chats',
  CONTACTS: 'contacts',

  // Marketplace & NFTs
  NFT_MARKETPLACE: 'nft_marketplace',
  COMPUTATIONAL_NFTS: 'computational_nfts',
  TRADING_PAIRS: 'trading_pairs',

  // Governance & DAO
  GOVERNANCE: 'governance',
  PROPOSALS: 'proposals',
  VOTING_RECORDS: 'voting_records',
  DAO_ACTIVITIES: 'dao_activities',

  // Integrations & Hub
  INTEGRATIONS: 'integrations',
  AI_INTEGRATIONS: 'ai_integrations',
  ORACLE_NETWORK: 'oracle_network',
  STORY_PROTOCOL: 'story_protocol',
  WORKFLOWS: 'workflows',

  // Network & Infrastructure
  WEATHER_MODELS: 'weather_models',
  WEATHER_STATIONS: 'weather_stations',
  MINING_POOLS: 'mining_pools',
  NODES: 'nodes',
  VALIDATORS: 'validators',
  CROSS_CHAIN: 'cross_chain',

  // Computational & Tasks
  COMPUTATIONAL_TASKS: 'computational_tasks',
  PROOF_OF_PUBLISHING: 'proof_of_publishing',
  ACHIEVEMENTS: 'achievements',
  INCENTIVES: 'incentives',

  // System & Settings
  SETTINGS: 'settings',
  USERS: 'users',
  SYSTEM_MONITOR: 'system_monitor',
  NETWORK_STATUS: 'network_status',

  // Geographic / Location
  LOCATIONS: 'locations',
};

// Database name and version
const DB_NAME = 'wrfcoin_search';
const DB_VERSION = 1;

// Store names
const STORE_NAMES = {
  INDEX: 'search_index',
  METADATA: 'metadata',
};

let db = null;

/**
 * Initialize the search index database
 * @returns {Promise<IDBDatabase>} The database instance
 */
export const initSearchDatabase = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = event => {
      console.error('Failed to open search database:', event.target.error);
      reject(event.target.error);
    };

    request.onupgradeneeded = event => {
      const database = event.target.result;

      // Create the search index store with a compound index
      if (!database.objectStoreNames.contains(STORE_NAMES.INDEX)) {
        const store = database.createObjectStore(STORE_NAMES.INDEX, {
          keyPath: 'id',
          autoIncrement: true,
        });

        // Create indices for efficient searching
        store.createIndex('category_term', ['category', 'term'], {
          unique: false,
        });
        store.createIndex('term', 'term', { unique: false });
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('item_id', 'itemId', { unique: false });
        store.createIndex('boost', 'boost', { unique: false });
      }

      // Create metadata store for tracking indexing status
      if (!database.objectStoreNames.contains(STORE_NAMES.METADATA)) {
        const metaStore = database.createObjectStore(STORE_NAMES.METADATA, {
          keyPath: 'key',
        });

        // Add initial metadata
        const initialMetadata = {
          key: 'last_indexed',
          timestamp: Date.now(),
          version: DB_VERSION,
          categories: Object.values(SEARCH_CATEGORIES).reduce(
            (acc, category) => {
              acc[category] = {
                count: 0,
                last_indexed: null,
              };
              return acc;
            },
            {},
          ),
        };

        metaStore.add(initialMetadata);
      }
    };

    request.onsuccess = event => {
      db = event.target.result;
      devLog('Search database initialized successfully');
      resolve(db);
    };
  });
};

/**
 * Add terms to the search index
 * @param {Object[]} items - Array of items to index
 * @param {string} items[].category - The category of the item
 * @param {string} items[].itemId - The ID of the item in its original data store
 * @param {string[]} items[].terms - Array of search terms to index for this item
 * @param {Object} items[].metadata - Additional metadata to store with the indexed item
 * @param {number} items[].boost - Search relevance boost factor (1.0 is default)
 * @returns {Promise<void>}
 */
export const addToSearchIndex = async items => {
  const db = await initSearchDatabase();
  const transaction = db.transaction(
    [STORE_NAMES.INDEX, STORE_NAMES.METADATA],
    'readwrite',
  );
  const store = transaction.objectStore(STORE_NAMES.INDEX);
  const metaStore = transaction.objectStore(STORE_NAMES.METADATA);

  // Get current metadata
  const metadataRequest = metaStore.get('last_indexed');
  const metadata = await new Promise((resolve, reject) => {
    metadataRequest.onsuccess = () => resolve(metadataRequest.result);
    metadataRequest.onerror = event => reject(event.target.error);
  });

  // Track counts by category
  const categoryCounts = {};

  // Process each item for indexing
  for (const item of items) {
    const {
      category,
      itemId,
      terms,
      metadata: itemMetadata,
      boost = 1.0,
    } = item;

    // Count items per category
    if (!categoryCounts[category]) {
      categoryCounts[category] = 0;
    }
    categoryCounts[category]++;

    // Process each search term
    for (const term of terms) {
      // Add normalized version of the term to the index
      const normalizedTerm = term.toLowerCase().trim();
      if (normalizedTerm) {
        store.add({
          category,
          itemId,
          term: normalizedTerm,
          metadata: itemMetadata || {},
          boost,
          timestamp: Date.now(),
        });
      }
    }
  }

  // Update the metadata
  const now = Date.now();
  Object.keys(categoryCounts).forEach(category => {
    metadata.categories[category].count += categoryCounts[category];
    metadata.categories[category].last_indexed = now;
  });
  metadata.timestamp = now;

  metaStore.put(metadata);

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = event => reject(event.target.error);
  });
};

/**
 * Search the index for items matching the query
 * @param {string} query - The search query
 * @param {Object} options - Search options
 * @param {string[]} options.categories - Categories to search within (default: all)
 * @param {number} options.limit - Maximum number of results to return
 * @param {boolean} options.fuzzy - Whether to use fuzzy matching
 * @returns {Promise<Object[]>} Matching items
 */
export const search = async (query, options = {}) => {
  const {
    categories = Object.values(SEARCH_CATEGORIES),
    limit = 50,
    fuzzy = true,
  } = options;

  if (!query || query.trim() === '') {
    return [];
  }

  const db = await initSearchDatabase();
  const transaction = db.transaction([STORE_NAMES.INDEX], 'readonly');
  const store = transaction.objectStore(STORE_NAMES.INDEX);
  const termIndex = store.index('term');
  const categoryIndex = store.index('category');
  const categoryTermIndex = store.index('category_term');

  // Normalize the query and split into terms
  const normalizedQuery = query.toLowerCase().trim();
  const queryTerms = normalizedQuery.split(/\s+/);

  // Collect matching records for all query terms
  const termResultsPromises = queryTerms.map(term => {
    return new Promise((resolve, reject) => {
      const termResults = [];

      // Handle each term
      const processTermRequest = request => {
        request.onsuccess = event => {
          const cursor = event.target.result;
          if (cursor) {
            // Only include results from the requested categories
            if (categories.includes(cursor.value.category)) {
              termResults.push(cursor.value);
            }
            cursor.continue();
          } else {
            resolve(termResults);
          }
        };
        request.onerror = event => reject(event.target.error);
      };

      if (fuzzy) {
        // For fuzzy matching, get all terms and filter them
        const request = termIndex.openCursor();
        request.onsuccess = event => {
          const cursor = event.target.result;
          if (cursor) {
            // Check if the term contains our search term
            if (
              cursor.value.term.includes(term) &&
              categories.includes(cursor.value.category)
            ) {
              termResults.push(cursor.value);
            }
            cursor.continue();
          } else {
            resolve(termResults);
          }
        };
        request.onerror = event => reject(event.target.error);
      } else {
        // For exact matching, just search for the exact term
        const request = termIndex.openCursor(IDBKeyRange.only(term));
        processTermRequest(request);
      }
    });
  });

  const allTermResults = await Promise.all(termResultsPromises);

  // Merge and rank results
  const resultMap = new Map();

  allTermResults.forEach((termResults, termIndex) => {
    termResults.forEach(result => {
      const key = `${result.category}:${result.itemId}`;

      if (resultMap.has(key)) {
        // This item already matched another term, increase its score
        const existing = resultMap.get(key);
        existing.score += 1 * result.boost;
        existing.matchedTerms.add(result.term);
      } else {
        // First time seeing this item
        resultMap.set(key, {
          ...result,
          score: 1 * result.boost,
          matchedTerms: new Set([result.term]),
        });
      }
    });
  });

  // Convert to array and sort by score
  const results = Array.from(resultMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(result => ({
      id: result.itemId,
      category: result.category,
      score: result.score,
      metadata: result.metadata,
      matchedTermCount: result.matchedTerms.size,
      matchedTerms: Array.from(result.matchedTerms),
    }));

  return results;
};

/**
 * Delete all entries for a specific category from the search index
 * @param {string} category - The category to clear
 * @returns {Promise<void>}
 */
export const clearCategoryIndex = async category => {
  const db = await initSearchDatabase();
  const transaction = db.transaction(
    [STORE_NAMES.INDEX, STORE_NAMES.METADATA],
    'readwrite',
  );
  const store = transaction.objectStore(STORE_NAMES.INDEX);
  const metaStore = transaction.objectStore(STORE_NAMES.METADATA);
  const categoryIndex = store.index('category');

  // Get all records for this category
  const request = categoryIndex.openCursor(IDBKeyRange.only(category));

  request.onsuccess = event => {
    const cursor = event.target.result;
    if (cursor) {
      // Delete this record
      store.delete(cursor.primaryKey);
      cursor.continue();
    }
  };

  // Update metadata
  const metadataRequest = metaStore.get('last_indexed');
  metadataRequest.onsuccess = () => {
    const metadata = metadataRequest.result;
    metadata.categories[category].count = 0;
    metadata.categories[category].last_indexed = null;
    metadata.timestamp = Date.now();
    metaStore.put(metadata);
  };

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = event => reject(event.target.error);
  });
};

/**
 * Delete specific items from the search index
 * @param {string} category - The category of the items
 * @param {string[]} itemIds - Array of item IDs to remove
 * @returns {Promise<void>}
 */
export const removeFromSearchIndex = async (category, itemIds) => {
  const db = await initSearchDatabase();
  const transaction = db.transaction(
    [STORE_NAMES.INDEX, STORE_NAMES.METADATA],
    'readwrite',
  );
  const store = transaction.objectStore(STORE_NAMES.INDEX);
  const metaStore = transaction.objectStore(STORE_NAMES.METADATA);
  const itemIdIndex = store.index('item_id');

  let removedCount = 0;

  // Process each item ID
  for (const itemId of itemIds) {
    // Find all entries for this item ID
    const request = itemIdIndex.openCursor(IDBKeyRange.only(itemId));

    await new Promise(resolve => {
      request.onsuccess = event => {
        const cursor = event.target.result;
        if (cursor) {
          // Only delete if category matches
          if (cursor.value.category === category) {
            store.delete(cursor.primaryKey);
            removedCount++;
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
    });
  }

  // Update metadata if items were removed
  if (removedCount > 0) {
    const metadataRequest = metaStore.get('last_indexed');
    metadataRequest.onsuccess = () => {
      const metadata = metadataRequest.result;
      metadata.categories[category].count -= removedCount;
      if (metadata.categories[category].count < 0) {
        metadata.categories[category].count = 0;
      }
      metadata.timestamp = Date.now();
      metaStore.put(metadata);
    };
  }

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = event => reject(event.target.error);
  });
};

/**
 * Get search index statistics
 * @returns {Promise<Object>} Statistics about the search index
 */
export const getSearchIndexStats = async () => {
  const db = await initSearchDatabase();
  const transaction = db.transaction([STORE_NAMES.METADATA], 'readonly');
  const metaStore = transaction.objectStore(STORE_NAMES.METADATA);

  const metadataRequest = metaStore.get('last_indexed');

  return new Promise((resolve, reject) => {
    metadataRequest.onsuccess = () => {
      const metadata = metadataRequest.result;
      resolve({
        lastIndexed: new Date(metadata.timestamp),
        version: metadata.version,
        categories: metadata.categories,
      });
    };
    metadataRequest.onerror = event => reject(event.target.error);
  });
};

/**
 * Generate search terms from an object
 * @param {Object} object - The object to generate terms from
 * @param {string[]} fields - Array of field names to include
 * @returns {string[]} Array of search terms
 */
export const generateSearchTerms = (object, fields) => {
  const terms = new Set();

  // Process each field
  fields.forEach(field => {
    if (object[field] !== undefined && object[field] !== null) {
      const value = object[field];

      if (typeof value === 'string') {
        // Split string into words and add each one
        value.split(/\s+/).forEach(word => {
          if (word) terms.add(word.toLowerCase());
        });
      } else if (typeof value === 'number') {
        // Add the number as a string
        terms.add(value.toString());
      } else if (Array.isArray(value)) {
        // Process array elements
        value.forEach(item => {
          if (typeof item === 'string') {
            terms.add(item.toLowerCase());
          } else if (typeof item === 'number') {
            terms.add(item.toString());
          }
        });
      }
    }
  });

  return Array.from(terms);
};

/**
 * Index the documentation articles
 * @param {Object} docData - Documentation data
 * @returns {Promise<void>}
 */
export const indexDocumentationData = async docData => {
  const articlesToIndex = [];

  // Process each doc article
  Object.entries(docData).forEach(([key, article]) => {
    // Extract text from HTML content
    const parser = new DOMParser();
    const doc = parser.parseFromString(article.content, 'text/html');
    const textContent = doc.body.textContent || '';

    // Generate search terms
    const terms = [
      article.title,
      article.subtitle,
      ...textContent.split(/\s+/).filter(word => word.length > 2),
    ];

    // Handle table of contents sections
    if (article.tableOfContents) {
      article.tableOfContents.forEach(section => {
        terms.push(section.title);

        if (section.children) {
          section.children.forEach(child => {
            terms.push(child.title);
          });
        }
      });
    }

    articlesToIndex.push({
      category: SEARCH_CATEGORIES.ARTICLES,
      itemId: key,
      terms,
      metadata: {
        title: article.title,
        subtitle: article.subtitle,
        lastEditedBy: article.lastEditedBy,
        lastEditedDate: article.lastEditedDate,
        type: 'documentation',
      },
      boost: 1.5, // Documentation is important, so boost it
    });
  });

  // Add to search index
  await addToSearchIndex(articlesToIndex);
};

/**
 * Index blockchain transactions
 * @param {Object[]} transactions - Array of transactions
 * @returns {Promise<void>}
 */
export const indexTransactions = async transactions => {
  const itemsToIndex = transactions.map(tx => {
    // Generate search terms from the transaction data
    const terms = [
      tx.id,
      tx.type,
      tx.status,
      tx.amount.toString(),
      tx.fee.toString(),
      ...(tx.from ? [tx.from] : []),
      ...(tx.to ? [tx.to] : []),
      ...(tx.hash ? [tx.hash] : []),
      ...(tx.blockHeight ? [tx.blockHeight.toString()] : []),
      ...(tx.timestamp ? [new Date(tx.timestamp).toLocaleDateString()] : []),
    ];

    return {
      category: SEARCH_CATEGORIES.TRANSACTIONS,
      itemId: tx.id,
      terms,
      metadata: {
        type: tx.type,
        amount: tx.amount,
        fee: tx.fee,
        status: tx.status,
        timestamp: tx.timestamp,
      },
    };
  });

  await addToSearchIndex(itemsToIndex);
};

/**
 * Index NFT marketplace items
 * @param {Object[]} nfts - Array of NFT data
 * @returns {Promise<void>}
 */
export const indexNFTs = async nfts => {
  const itemsToIndex = nfts.map(nft => {
    // Generate search terms
    const terms = [
      nft.id,
      nft.title,
      nft.description,
      ...(nft.creator ? [nft.creator] : []),
      ...(nft.owner ? [nft.owner] : []),
      ...(nft.price ? [nft.price.toString()] : []),
      ...(nft.tags ? nft.tags : []),
      ...(nft.category ? [nft.category] : []),
      ...(nft.type ? [nft.type] : []),
    ];

    return {
      category: SEARCH_CATEGORIES.NFT_MARKETPLACE,
      itemId: nft.id,
      terms,
      metadata: {
        title: nft.title,
        description: nft.description.substring(0, 100),
        price: nft.price,
        imageUrl: nft.imageUrl,
        type: nft.type,
        creator: nft.creator,
      },
    };
  });

  await addToSearchIndex(itemsToIndex);
};

/**
 * Index weather models
 * @param {Object[]} models - Array of weather models
 * @returns {Promise<void>}
 */
export const indexWeatherModels = async models => {
  const itemsToIndex = models.map(model => {
    // Generate search terms
    const terms = [
      model.id,
      model.name,
      model.description,
      ...(model.creator ? [model.creator] : []),
      ...(model.region ? [model.region] : []),
      ...(model.parameters ? model.parameters : []),
      ...(model.tags ? model.tags : []),
      ...(model.type ? [model.type] : []),
    ];

    return {
      category: SEARCH_CATEGORIES.WEATHER_MODELS,
      itemId: model.id,
      terms,
      metadata: {
        name: model.name,
        description: model.description.substring(0, 100),
        region: model.region,
        created: model.created,
        lastRun: model.lastRun,
      },
    };
  });

  await addToSearchIndex(itemsToIndex);
};

/**
 * Index mining pools
 * @param {Object[]} pools - Array of mining pools
 * @returns {Promise<void>}
 */
export const indexMiningPools = async pools => {
  const itemsToIndex = pools.map(pool => {
    // Generate search terms
    const terms = [
      pool.id,
      pool.name,
      pool.description,
      ...(pool.operator ? [pool.operator] : []),
      ...(pool.location ? [pool.location] : []),
      ...(pool.hashrate ? [pool.hashrate.toString()] : []),
      ...(pool.fee ? [pool.fee.toString()] : []),
      ...(pool.miners ? [pool.miners.toString()] : []),
      ...(pool.tags ? pool.tags : []),
    ];

    return {
      category: SEARCH_CATEGORIES.MINING_POOLS,
      itemId: pool.id,
      terms,
      metadata: {
        name: pool.name,
        description: pool.description.substring(0, 100),
        miners: pool.miners,
        hashrate: pool.hashrate,
        fee: pool.fee,
      },
    };
  });

  await addToSearchIndex(itemsToIndex);
};

/**
 * Index settings
 * @param {Object[]} settings - Array of settings entries
 * @returns {Promise<void>}
 */
export const indexSettings = async settings => {
  const itemsToIndex = settings.map(setting => {
    // Generate search terms
    const terms = [
      setting.id,
      setting.name,
      setting.description,
      setting.category,
      ...(setting.tags ? setting.tags : []),
    ];

    return {
      category: SEARCH_CATEGORIES.SETTINGS,
      itemId: setting.id,
      terms,
      metadata: {
        name: setting.name,
        description: setting.description,
        category: setting.category,
        path: setting.path,
      },
    };
  });

  await addToSearchIndex(itemsToIndex);
};

/**
 * Index weather stations
 * @param {Object[]} stations - Array of weather station data
 * @returns {Promise<void>}
 */
export const indexWeatherStations = async stations => {
  const itemsToIndex = stations.map(station => {
    // Generate search terms
    const terms = [
      station.id,
      station.name,
      ...(station.owner ? [station.owner] : []),
      ...(station.location ? [station.location] : []),
      ...(station.address ? [station.address] : []),
      ...(station.model ? [station.model] : []),
      ...(station.manufacturer ? [station.manufacturer] : []),
      ...(station.status ? [station.status] : []),
    ];

    return {
      category: SEARCH_CATEGORIES.WEATHER_STATIONS,
      itemId: station.id,
      terms,
      metadata: {
        name: station.name,
        location: station.location,
        status: station.status,
        lastReport: station.lastReport,
      },
    };
  });

  await addToSearchIndex(itemsToIndex);
};

/**
 * Index network nodes
 * @param {Object[]} nodes - Array of node data
 * @returns {Promise<void>}
 */
export const indexNodes = async nodes => {
  const itemsToIndex = nodes.map(node => {
    // Generate search terms
    const terms = [
      node.id,
      node.name,
      node.type,
      node.status,
      ...(node.operator ? [node.operator] : []),
      ...(node.version ? [node.version] : []),
      ...(node.location ? [node.location] : []),
      ...(node.address ? [node.address] : []),
    ];

    return {
      category: SEARCH_CATEGORIES.NODES,
      itemId: node.id,
      terms,
      metadata: {
        name: node.name,
        type: node.type,
        status: node.status,
        uptime: node.uptime,
        location: node.location,
      },
    };
  });

  await addToSearchIndex(itemsToIndex);
};

/**
 * Index all data from multiple sources
 * @param {Object} data - Object containing data from multiple sources
 * @returns {Promise<void>}
 */
export const indexAllData = async data => {
  const indexPromises = [];

  if (data.documentation) {
    indexPromises.push(indexDocumentationData(data.documentation));
  }

  if (data.transactions) {
    indexPromises.push(indexTransactions(data.transactions));
  }

  if (data.nfts) {
    indexPromises.push(indexNFTs(data.nfts));
  }

  if (data.governance) {
    indexPromises.push(indexGovernanceProposalsEnhanced(data.governance));
  }

  if (data.weatherModels) {
    indexPromises.push(indexWeatherModels(data.weatherModels));
  }

  if (data.miningPools) {
    indexPromises.push(indexMiningPools(data.miningPools));
  }

  if (data.settings) {
    indexPromises.push(indexSettings(data.settings));
  }

  if (data.weatherStations) {
    indexPromises.push(indexWeatherStations(data.weatherStations));
  }

  if (data.nodes) {
    indexPromises.push(indexNodes(data.nodes));
  }

  if (data.oracleNetwork) {
    indexPromises.push(indexOracleNetwork(data.oracleNetwork));
  }

  await Promise.all(indexPromises);
};

/**
 * Index Oracle Network data including validators and bridge components
 * @param {Object} oracleData - Oracle Network data
 * @returns {Promise<void>}
 */
export const indexOracleNetwork = async oracleData => {
  const itemsToIndex = [];

  // Index validators
  if (oracleData.validators && Array.isArray(oracleData.validators)) {
    oracleData.validators.forEach(validator => {
      // Generate search terms
      const terms = [
        validator.id.toString(),
        validator.name,
        ...(validator.address ? [validator.address] : []),
        ...(validator.status ? [validator.status] : []),
        ...(validator.location ? [validator.location] : []),
        ...(validator.specialization ? [validator.specialization] : []),
        ...(validator.reputationScore
          ? [validator.reputationScore.toString()]
          : []),
        ...(validator.validationType ? [validator.validationType] : []),
        ...(validator.lastActive
          ? [new Date(validator.lastActive).toISOString().split('T')[0]]
          : []),
      ];

      itemsToIndex.push({
        category: SEARCH_CATEGORIES.ORACLE_NETWORK,
        itemId: `validator-${validator.id}`,
        terms,
        metadata: {
          type: 'validator',
          name: validator.name,
          status: validator.status,
          reputationScore: validator.reputationScore,
          validationType: validator.validationType,
        },
      });
    });
  }

  // Index bridges
  if (oracleData.bridges && Array.isArray(oracleData.bridges)) {
    oracleData.bridges.forEach(bridge => {
      // Generate search terms
      const terms = [
        bridge.id.toString(),
        bridge.name,
        ...(bridge.sourceChain ? [bridge.sourceChain] : []),
        ...(bridge.targetChain ? [bridge.targetChain] : []),
        ...(bridge.status ? [bridge.status] : []),
        ...(bridge.type ? [bridge.type] : []),
        ...(bridge.protocol ? [bridge.protocol] : []),
      ];

      itemsToIndex.push({
        category: SEARCH_CATEGORIES.ORACLE_NETWORK,
        itemId: `bridge-${bridge.id}`,
        terms,
        metadata: {
          type: 'bridge',
          name: bridge.name,
          sourceChain: bridge.sourceChain,
          targetChain: bridge.targetChain,
          status: bridge.status,
        },
      });
    });
  }

  // Index data feeds
  if (oracleData.dataFeeds && Array.isArray(oracleData.dataFeeds)) {
    oracleData.dataFeeds.forEach(feed => {
      // Generate search terms
      const terms = [
        feed.id.toString(),
        feed.name,
        ...(feed.dataType ? [feed.dataType] : []),
        ...(feed.source ? [feed.source] : []),
        ...(feed.updateFrequency ? [feed.updateFrequency] : []),
        ...(feed.status ? [feed.status] : []),
      ];

      itemsToIndex.push({
        category: SEARCH_CATEGORIES.ORACLE_NETWORK,
        itemId: `feed-${feed.id}`,
        terms,
        metadata: {
          type: 'data_feed',
          name: feed.name,
          dataType: feed.dataType,
          source: feed.source,
          status: feed.status,
        },
      });
    });
  }

  await addToSearchIndex(itemsToIndex);
};

/**
 * Index messages from the communication system
 * @param {Object[]} messages - Array of message data
 * @returns {Promise<void>}
 */
export const indexMessages = async messages => {
  const itemsToIndex = messages.map(message => {
    const terms = [
      message.id,
      message.content,
      message.sender,
      message.recipient,
      ...(message.type ? [message.type] : []),
      ...(message.timestamp
        ? [new Date(message.timestamp).toLocaleDateString()]
        : []),
    ];

    return {
      category: SEARCH_CATEGORIES.MESSAGES,
      itemId: message.id,
      terms,
      metadata: {
        sender: message.sender,
        recipient: message.recipient,
        timestamp: message.timestamp,
        type: message.type || 'text',
      },
    };
  });

  await addToSearchIndex(itemsToIndex);
};

/**
 * Index address book contacts
 * @param {Object[]} contacts - Array of contact data
 * @returns {Promise<void>}
 */
export const indexAddressBook = async contacts => {
  const itemsToIndex = contacts.map(contact => {
    const terms = [
      contact.id,
      contact.name,
      contact.label,
      contact.address,
      ...(contact.notes ? contact.notes.split(/\s+/) : []),
      ...(contact.chain ? [contact.chain] : []),
      ...(contact.tags ? contact.tags : []),
    ];

    return {
      category: SEARCH_CATEGORIES.ADDRESS_BOOK,
      itemId: contact.id,
      terms,
      metadata: {
        name: contact.name,
        address: contact.address,
        chain: contact.chain,
        label: contact.label,
      },
      boost: 1.3, // Contacts are frequently searched
    };
  });

  await addToSearchIndex(itemsToIndex);
};

/**
 * Index governance proposals (enhanced version)
 * @param {Object[]} proposals - Array of governance proposal data
 * @returns {Promise<void>}
 */
export const indexGovernanceProposalsEnhanced = async proposals => {
  const itemsToIndex = proposals.map(proposal => {
    const terms = [
      proposal.id,
      proposal.title,
      proposal.description,
      proposal.status,
      proposal.proposer,
      ...(proposal.category ? [proposal.category] : []),
      ...(proposal.tags ? proposal.tags : []),
    ];

    return {
      category: SEARCH_CATEGORIES.PROPOSALS,
      itemId: proposal.id,
      terms,
      metadata: {
        title: proposal.title,
        status: proposal.status,
        proposer: proposal.proposer,
        votingEnds: proposal.votingEnds,
      },
      boost: 1.4, // Governance is important
    };
  });

  await addToSearchIndex(itemsToIndex);
};

/**
 * Index blockchain standards documentation
 * @param {Object[]} standards - Array of blockchain standards
 * @returns {Promise<void>}
 */
export const indexBlockchainStandards = async standards => {
  const itemsToIndex = standards.map(standard => {
    const terms = [
      standard.id,
      standard.name,
      standard.description,
      standard.category,
      ...(standard.content
        ? standard.content.split(/\s+/).filter(word => word.length > 2)
        : []),
      ...(standard.tags ? standard.tags : []),
    ];

    return {
      category: SEARCH_CATEGORIES.BLOCKCHAIN_STANDARDS,
      itemId: standard.id,
      terms,
      metadata: {
        name: standard.name,
        category: standard.category,
        version: standard.version,
      },
      boost: 1.6, // Standards are highly valuable
    };
  });

  await addToSearchIndex(itemsToIndex);
};

/**
 * Index integrations from the integrations hub
 * @param {Object[]} integrations - Array of integration data
 * @returns {Promise<void>}
 */
export const indexIntegrations = async integrations => {
  const itemsToIndex = integrations.map(integration => {
    const terms = [
      integration.id,
      integration.name,
      integration.description,
      integration.category,
      integration.provider,
      ...(integration.tags ? integration.tags : []),
      ...(integration.features ? integration.features : []),
    ];

    return {
      category: SEARCH_CATEGORIES.INTEGRATIONS,
      itemId: integration.id,
      terms,
      metadata: {
        name: integration.name,
        category: integration.category,
        provider: integration.provider,
        status: integration.status,
      },
    };
  });

  await addToSearchIndex(itemsToIndex);
};

/**
 * Index comprehensive system data across all categories
 * @returns {Promise<void>}
 */
export const indexAllSystemData = async () => {
  try {
    devLog('Starting comprehensive search index update...');

    // Index blockchain standards with more comprehensive data including EIP content
    const blockchainStandards = [
      {
        id: 'eip-712',
        name: 'EIP-712: Typed Data Signing',
        category: 'Ethereum',
        description:
          'Structured data hashing and signing standard for Ethereum',
        content:
          'EIP-712 Ethereum Improvement Proposal typed data signing structured data hash cryptographic security blockchain smart contracts',
        tags: ['EIP', 'Ethereum', 'signing', 'typed-data', 'security'],
      },
      {
        id: 'erc-4626',
        name: 'ERC-4626: Tokenized Vaults',
        category: 'Ethereum',
        description: 'Yield-bearing vault standard for DeFi protocols',
        content:
          'ERC-4626 tokenized vault standard DeFi yield farming liquidity mining vault shares',
        tags: ['ERC', 'Ethereum', 'vault', 'DeFi', 'yield'],
      },
      {
        id: 'erc-721',
        name: 'ERC-721: Non-Fungible Token',
        category: 'Ethereum',
        description: 'NFT standard implementation for unique digital assets',
        content:
          'ERC-721 non-fungible token NFT unique digital assets collectibles blockchain Ethereum',
        tags: ['ERC', 'NFT', 'Ethereum', 'tokens', 'digital-assets'],
      },
      {
        id: 'erc-1155',
        name: 'ERC-1155: Multi Token',
        category: 'Ethereum',
        description: 'Multi-token standard for efficient batch operations',
        content:
          'ERC-1155 multi token standard batch operations gas efficiency fungible non-fungible',
        tags: ['ERC', 'Ethereum', 'multi-token', 'batch', 'efficiency'],
      },
      {
        id: 'ibc-protocol',
        name: 'IBC Protocol',
        category: 'Cross-Chain',
        description:
          'Inter-Blockchain Communication protocol for Cosmos ecosystem',
        content:
          'IBC Inter-Blockchain Communication protocol Cosmos cross-chain interoperability',
        tags: ['IBC', 'Cosmos', 'cross-chain', 'interoperability'],
      },
      {
        id: 'xcmp-polkadot',
        name: 'XCMP',
        category: 'Polkadot',
        description: 'Cross-Consensus Message Passing for Polkadot parachains',
        content:
          'XCMP Cross-Consensus Message Passing Polkadot parachain communication substrate',
        tags: ['XCMP', 'Polkadot', 'parachain', 'messaging'],
      },
      {
        id: 'wrfml-data',
        name: 'WrfML Data Format',
        category: 'Wrfcoin',
        description: 'Weather data standardization format for Wrfcoin network',
        content:
          'WrfML weather data format standardization meteorological blockchain oracle',
        tags: ['WrfML', 'Wrfcoin', 'weather', 'data-format'],
      },
      {
        id: 'wxm-protocol',
        name: 'WXM Protocol',
        category: 'Wrfcoin',
        description: 'Weather Exchange Messaging protocol for real-time data',
        content:
          'WXM Weather Exchange Messaging protocol real-time data communication',
        tags: ['WXM', 'Wrfcoin', 'weather', 'messaging', 'real-time'],
      },
    ];
    await indexBlockchainStandards(blockchainStandards);

    // Also index some sample documentation articles
    const sampleArticles = [
      {
        title: 'Blockchain Standards Overview',
        subtitle: 'Understanding EIP, ERC, and cross-chain protocols',
        content:
          'This comprehensive guide covers Ethereum Improvement Proposals (EIP), Ethereum Request for Comments (ERC), and cross-chain communication protocols like IBC and XCMP.',
        lastEditedBy: 'System',
        lastEditedDate: new Date().toISOString(),
      },
    ];
    await indexDocumentationData({ articles: sampleArticles });

    devLog(
      'Search database updated with comprehensive blockchain standards and documentation',
    );
  } catch (error) {
    console.error('Error indexing system data:', error);
  }
};

/**
 * Initialize the search service
 * This should be called during app startup
 * @returns {Promise<void>}
 */
export const initSearchService = async () => {
  try {
    await initSearchDatabase();
    await indexAllSystemData();
    devLog('Search database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize search database:', error);
  }
};

export default {
  initSearchService,
  search,
  addToSearchIndex,
  clearCategoryIndex,
  removeFromSearchIndex,
  getSearchIndexStats,
  indexDocumentationData,
  indexTransactions,
  indexNFTs,
  indexGovernanceProposalsEnhanced,
  indexWeatherModels,
  indexMiningPools,
  indexSettings,
  indexWeatherStations,
  indexNodes,
  indexMessages,
  indexAddressBook,
  indexBlockchainStandards,
  indexIntegrations,
  indexAllSystemData,
  indexAllData,
  SEARCH_CATEGORIES,
};
