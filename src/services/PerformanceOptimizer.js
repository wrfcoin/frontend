/**
 * Performance Optimizer for Faster Page Loads
 * Implements preloading, caching, and lazy loading strategies
 */

class PerformanceOptimizer {
  constructor() {
    this.preloadedRoutes = new Set();
    this.componentCache = new Map();
    this.apiCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Preload critical route components
   */
  preloadCriticalRoutes() {
    const criticalRoutes = [
      () => import('../components/Governance/ComprehensiveGovernanceDashboard'),
    ];

    criticalRoutes.forEach(routeImport => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => routeImport());
      } else {
        setTimeout(() => routeImport(), 100);
      }
    });
  }

  /**
   * Cache API responses with expiry
   */
  cacheApiResponse(key, data) {
    this.apiCache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Get cached API response if valid
   */
  getCachedApiResponse(key) {
    const cached = this.apiCache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.cacheExpiry;
    if (isExpired) {
      this.apiCache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Optimize images with lazy loading and compression
   */
  optimizeImages() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  }

  /**
   * Prefetch data for next likely navigation
   */
  prefetchNextPageData(currentRoute) {
    const routeDataMap = {
      '/': ['/api/dashboard/stats', '/api/blockchain/status'],
      '/governance': [
        '/api/governance/proposals',
        '/api/governance/voting-power',
      ],
      '/cross-chain': [
        '/api/cross-chain/bridges',
        '/api/cross-chain/transfers',
      ],
      '/mining': ['/api/mining/stats', '/api/mining/rewards'],
      '/staking': ['/api/staking/pools', '/api/staking/rewards'],
    };

    const nextRouteData = routeDataMap[currentRoute];
    if (nextRouteData) {
      nextRouteData.forEach(endpoint => {
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => this.prefetchEndpoint(endpoint));
        }
      });
    }
  }

  /**
   * Prefetch API endpoint
   */
  async prefetchEndpoint(endpoint) {
    try {
      const cached = this.getCachedApiResponse(endpoint);
      if (cached) return;

      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        this.cacheApiResponse(endpoint, data);
      }
    } catch (error) {
      console.debug('Prefetch failed for:', endpoint);
    }
  }

  /**
   * Initialize performance optimizations
   */
  initialize() {
    // Preload critical routes
    this.preloadCriticalRoutes();

    // Optimize images when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () =>
        this.optimizeImages(),
      );
    } else {
      this.optimizeImages();
    }

    // Set up route prefetching
    window.addEventListener('popstate', () => {
      const currentPath = window.location.pathname;
      this.prefetchNextPageData(currentPath);
    });

    // Clean up expired cache periodically
    setInterval(() => this.cleanupExpiredCache(), 60 * 1000);
  }

  /**
   * Clean up expired cache entries
   */
  cleanupExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.apiCache.entries()) {
      if (now - value.timestamp > this.cacheExpiry) {
        this.apiCache.delete(key);
      }
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return {
      cacheSize: this.apiCache.size,
      preloadedRoutes: this.preloadedRoutes.size,
      navigationTiming: performance.getEntriesByType('navigation')[0],
      resourceTiming: performance.getEntriesByType('resource').length,
    };
  }
}

export default new PerformanceOptimizer();
