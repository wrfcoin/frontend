/**
 * Advanced Caching Service - Phase 4 Optimization
 * Multi-layer caching system for optimal frontend performance
 */

class CachingService {
  constructor() {
    this.memoryCache = new Map();
    this.sessionCache = new Map();
    this.localStoragePrefix = 'wrfcoin_cache_';
    this.defaultTTL = 300000; // 5 minutes
    this.maxMemorySize = 100; // Maximum number of items in memory cache
    this.compressionThreshold = 1024; // Compress items larger than 1KB

    // Cache strategy configurations
    this.strategies = {
      blockchain: { ttl: 10000, priority: 'high' }, // 10 seconds
      performance: { ttl: 5000, priority: 'critical' }, // 5 seconds
      crosschain: { ttl: 15000, priority: 'high' }, // 15 seconds
      static: { ttl: 3600000, priority: 'low' }, // 1 hour
      user: { ttl: 900000, priority: 'medium' }, // 15 minutes
    };

    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      compressions: 0,
    };

    this.initializeCache();
  }

  /**
   * Initialize cache with cleanup and monitoring
   */
  initializeCache() {
    // Clean expired items on startup
    this.cleanupExpiredItems();

    // Set up periodic cleanup
    setInterval(() => {
      this.cleanupExpiredItems();
      this.optimizeMemoryUsage();
    }, 60000); // Every minute

    // Handle browser storage events
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.persistCriticalData();
      });
    }
  }

  /**
   * Smart cache retrieval with fallback layers
   */
  get(key, options = {}) {
    const strategy = this.getStrategy(options.category);

    // Try memory cache first (fastest)
    const memoryResult = this.getFromMemory(key);
    if (memoryResult) {
      this.metrics.hits++;
      return memoryResult.data;
    }

    // Try session storage (medium speed)
    const sessionResult = this.getFromSession(key);
    if (sessionResult) {
      // Promote to memory cache for faster future access
      this.setInMemory(key, sessionResult.data, sessionResult.expiry);
      this.metrics.hits++;
      return sessionResult.data;
    }

    // Try local storage (slower but persistent)
    const localResult = this.getFromLocalStorage(key);
    if (localResult) {
      // Promote to higher cache layers
      this.setInSession(key, localResult.data, localResult.expiry);
      this.setInMemory(key, localResult.data, localResult.expiry);
      this.metrics.hits++;
      return localResult.data;
    }

    this.metrics.misses++;
    return null;
  }

  /**
   * Intelligent cache storage with automatic layer selection
   */
  set(key, data, options = {}) {
    const strategy = this.getStrategy(options.category);
    const ttl = options.ttl || strategy.ttl;
    const expiry = Date.now() + ttl;

    const serializedSize = JSON.stringify(data).length;

    // Always store in memory for critical/high priority items
    if (strategy.priority === 'critical' || strategy.priority === 'high') {
      this.setInMemory(key, data, expiry);
    }

    // Store in session for medium-term persistence
    if (strategy.priority !== 'low') {
      this.setInSession(key, data, expiry);
    }

    // Store in local storage for long-term persistence or large items
    if (
      strategy.priority === 'low' ||
      serializedSize > this.compressionThreshold
    ) {
      this.setInLocalStorage(
        key,
        data,
        expiry,
        serializedSize > this.compressionThreshold,
      );
    }
  }

  /**
   * Memory cache operations
   */
  getFromMemory(key) {
    const item = this.memoryCache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.memoryCache.delete(key);
      return null;
    }

    // Update access time for LRU eviction
    item.lastAccess = Date.now();
    return item;
  }

  setInMemory(key, data, expiry) {
    // Implement LRU eviction if cache is full
    if (this.memoryCache.size >= this.maxMemorySize) {
      this.evictLRUMemoryItem();
    }

    this.memoryCache.set(key, {
      data,
      expiry,
      lastAccess: Date.now(),
      size: JSON.stringify(data).length,
    });
  }

  /**
   * Session storage operations
   */
  getFromSession(key) {
    if (typeof sessionStorage === 'undefined') return null;

    try {
      const item = sessionStorage.getItem(this.localStoragePrefix + key);
      if (!item) return null;

      const parsed = JSON.parse(item);
      if (Date.now() > parsed.expiry) {
        sessionStorage.removeItem(this.localStoragePrefix + key);
        return null;
      }

      return parsed;
    } catch (error) {
      console.warn('Session storage read error:', error);
      return null;
    }
  }

  setInSession(key, data, expiry) {
    if (typeof sessionStorage === 'undefined') return;

    try {
      const item = {
        data,
        expiry,
        timestamp: Date.now(),
      };

      sessionStorage.setItem(
        this.localStoragePrefix + key,
        JSON.stringify(item),
      );
    } catch (error) {
      console.warn('Session storage write error:', error);
      this.clearOldestSessionItems();
    }
  }

  /**
   * Local storage operations with compression
   */
  getFromLocalStorage(key) {
    if (typeof localStorage === 'undefined') return null;

    try {
      const item = localStorage.getItem(this.localStoragePrefix + key);
      if (!item) return null;

      const parsed = JSON.parse(item);
      if (Date.now() > parsed.expiry) {
        localStorage.removeItem(this.localStoragePrefix + key);
        return null;
      }

      // Decompress if needed
      let data = parsed.data;
      if (parsed.compressed) {
        data = this.decompress(data);
      }

      return { data, expiry: parsed.expiry };
    } catch (error) {
      console.warn('Local storage read error:', error);
      return null;
    }
  }

  setInLocalStorage(key, data, expiry, compress = false) {
    if (typeof localStorage === 'undefined') return;

    try {
      let processedData = data;

      if (compress) {
        processedData = this.compress(data);
        this.metrics.compressions++;
      }

      const item = {
        data: processedData,
        expiry,
        timestamp: Date.now(),
        compressed: compress,
      };

      localStorage.setItem(this.localStoragePrefix + key, JSON.stringify(item));
    } catch (error) {
      console.warn('Local storage write error:', error);
      this.clearOldestLocalItems();
    }
  }

  /**
   * Cache invalidation and cleanup
   */
  invalidate(key) {
    this.memoryCache.delete(key);

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(this.localStoragePrefix + key);
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.localStoragePrefix + key);
    }
  }

  invalidateByPattern(pattern) {
    const regex = new RegExp(pattern);

    // Clear from memory cache
    for (const [key] of this.memoryCache) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear from storage
    this.clearStorageByPattern(pattern);
  }

  /**
   * High-level caching methods for specific data types
   */
  cacheBlockchainData(key, data) {
    return this.set(key, data, { category: 'blockchain' });
  }

  cachePerformanceMetrics(key, data) {
    return this.set(key, data, { category: 'performance' });
  }

  cacheCrossChainData(key, data) {
    return this.set(key, data, { category: 'crosschain' });
  }

  cacheStaticData(key, data) {
    return this.set(key, data, { category: 'static' });
  }

  cacheUserData(key, data) {
    return this.set(key, data, { category: 'user' });
  }

  /**
   * Cache optimization and maintenance
   */
  optimizeMemoryUsage() {
    const memoryUsage = this.getMemoryUsage();

    if (memoryUsage.totalSize > 5 * 1024 * 1024) {
      // 5MB threshold
      // Aggressively clean low-priority items
      this.evictLowPriorityItems();
    }
  }

  evictLRUMemoryItem() {
    let oldestKey = null;
    let oldestTime = Date.now();

    for (const [key, item] of this.memoryCache) {
      if (item.lastAccess < oldestTime) {
        oldestTime = item.lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
      this.metrics.evictions++;
    }
  }

  evictLowPriorityItems() {
    for (const [key, item] of this.memoryCache) {
      const strategy = this.getStrategyForKey(key);
      if (strategy.priority === 'low') {
        this.memoryCache.delete(key);
        this.metrics.evictions++;
      }
    }
  }

  /**
   * Utility methods
   */
  getStrategy(category = 'static') {
    return this.strategies[category] || this.strategies.static;
  }

  getStrategyForKey(key) {
    // Analyze key to determine strategy
    if (key.includes('blockchain') || key.includes('block'))
      return this.strategies.blockchain;
    if (key.includes('performance') || key.includes('metrics'))
      return this.strategies.performance;
    if (key.includes('crosschain') || key.includes('bridge'))
      return this.strategies.crosschain;
    if (key.includes('user') || key.includes('profile'))
      return this.strategies.user;
    return this.strategies.static;
  }

  compress(data) {
    // Simple JSON compression (in production, use a proper compression library)
    try {
      return btoa(JSON.stringify(data));
    } catch (error) {
      return data;
    }
  }

  decompress(data) {
    try {
      return JSON.parse(atob(data));
    } catch (error) {
      return data;
    }
  }

  cleanupExpiredItems() {
    const now = Date.now();

    // Clean memory cache
    for (const [key, item] of this.memoryCache) {
      if (now > item.expiry) {
        this.memoryCache.delete(key);
      }
    }

    // Clean storage caches
    this.cleanupExpiredStorage();
  }

  cleanupExpiredStorage() {
    if (typeof localStorage === 'undefined') return;

    const keysToRemove = [];
    const now = Date.now();

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.localStoragePrefix)) {
        try {
          const item = JSON.parse(localStorage.getItem(key));
          if (now > item.expiry) {
            keysToRemove.push(key);
          }
        } catch (error) {
          keysToRemove.push(key); // Remove corrupted items
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  clearStorageByPattern(pattern) {
    if (typeof localStorage === 'undefined') return;

    const regex = new RegExp(pattern);
    const keysToRemove = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.localStoragePrefix)) {
        const cacheKey = key.substring(this.localStoragePrefix.length);
        if (regex.test(cacheKey)) {
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  clearOldestSessionItems() {
    // Implement session storage cleanup when full
  }

  clearOldestLocalItems() {
    // Implement local storage cleanup when full
  }

  persistCriticalData() {
    // Save critical cache data before page unload
    for (const [key, item] of this.memoryCache) {
      const strategy = this.getStrategyForKey(key);
      if (strategy.priority === 'critical') {
        this.setInLocalStorage(key, item.data, item.expiry);
      }
    }
  }

  getMemoryUsage() {
    let totalSize = 0;
    let itemCount = 0;

    for (const [key, item] of this.memoryCache) {
      totalSize += item.size || 0;
      itemCount++;
    }

    return { totalSize, itemCount };
  }

  getMetrics() {
    const hitRate =
      (this.metrics.hits / (this.metrics.hits + this.metrics.misses)) * 100;
    const memoryUsage = this.getMemoryUsage();

    return {
      ...this.metrics,
      hitRate: hitRate.toFixed(2) + '%',
      memoryUsage,
      cacheSize: this.memoryCache.size,
    };
  }

  clear() {
    this.memoryCache.clear();
    this.sessionCache.clear();

    if (typeof localStorage !== 'undefined') {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.localStoragePrefix)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  }
}

// Export singleton instance
export default new CachingService();
