import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router';
import './SearchResults.css';
import { SEARCH_CATEGORIES, search } from '../../services/SearchService';
import { simpleSearch } from '../../services/SimpleSearchService';
import { comprehensiveSearch } from '../../services/ComprehensiveSearchService';
import SearchBar from './SearchBar';
import SearchSidebar from './SearchSidebar';
import {
  sanitizeUrlParam,
  sanitizeId,
  sanitizeHtml,
} from '../../utils/securityUtils';

/**
 * SearchResults component that displays search results from multiple categories
 */
const SearchResults = () => {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [stats, setStats] = useState({});

  const location = useLocation();
  const navigate = useNavigate();

  // Extract search query and categories from URL with validation
  const queryParams = new URLSearchParams(location.search);

  // Validate and sanitize search query parameter using our security utils
  const rawSearchQuery = queryParams.get('q') || '';
  const searchQuery = sanitizeUrlParam(rawSearchQuery, 200);

  // Validate and sanitize categories parameter
  const categoryParam = queryParams.get('categories') || '';

  // Validate that categories are only valid values from our predefined list
  const validCategories = Object.values(SEARCH_CATEGORIES);
  const [selectedCategories, setSelectedCategories] = useState(
    categoryParam
      ? categoryParam.split(',').filter(cat => validCategories.includes(cat))
      : validCategories,
  );

  // Fetch results whenever search query or categories change
  useEffect(() => {
    if (!searchQuery) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Use comprehensive search that covers all app data
        let searchResults = await comprehensiveSearch(searchQuery);

        // If no results from comprehensive search, try simple search as fallback
        if (searchResults.length === 0) {
          searchResults = simpleSearch(searchQuery);
        }

        setResults(searchResults);

        // Calculate statistics
        const categoryStats = {};
        searchResults.forEach(result => {
          if (!categoryStats[result.category]) {
            categoryStats[result.category] = 0;
          }
          categoryStats[result.category]++;
        });

        setStats({
          total: searchResults.length,
          byCategory: categoryStats,
        });
      } catch (err) {
        console.error('Error searching:', err);
        setError('Failed to fetch search results. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [searchQuery, selectedCategories.join(',')]);

  // Handle new search with validation and sanitization
  const handleSearch = (query, categories) => {
    // Use our sanitizeUrlParam utility for more robust protection
    const sanitizedQuery = sanitizeUrlParam(query, 200);

    // Validate categories are from our predefined list
    const validCats = categories.filter(cat => validCategories.includes(cat));

    // If no valid categories, use all categories
    const categoriesToUse = validCats.length > 0 ? validCats : validCategories;

    navigate(
      `/search?q=${encodeURIComponent(sanitizedQuery)}&categories=${categoriesToUse.join(',')}`,
    );
  };

  // Filter results by active category
  const filteredResults =
    activeCategory === 'all'
      ? results
      : results.filter(result => result.category === activeCategory);

  // Get display name for category
  const getCategoryName = category => {
    const key = Object.entries(SEARCH_CATEGORIES).find(
      ([_, value]) => value === category,
    )?.[0];
    return key ? key.replace(/_/g, ' ') : category;
  };

  // Icon mapping for different result types
  const getCategoryIcon = category => {
    switch (category) {
    case SEARCH_CATEGORIES.ARTICLES:
      return 'article';
    case SEARCH_CATEGORIES.TRANSACTIONS:
      return 'paid';
    case SEARCH_CATEGORIES.NFT_MARKETPLACE:
      return 'image';
    case SEARCH_CATEGORIES.GOVERNANCE:
      return 'gavel';
    case SEARCH_CATEGORIES.WEATHER_MODELS:
      return 'cloud';
    case SEARCH_CATEGORIES.MINING_POOLS:
      return 'hardware';
    case SEARCH_CATEGORIES.SETTINGS:
      return 'settings';
    case SEARCH_CATEGORIES.WEATHER_STATIONS:
      return 'sensors';
    case SEARCH_CATEGORIES.NODES:
      return 'router';
    case SEARCH_CATEGORIES.USERS:
      return 'person';
    case SEARCH_CATEGORIES.COMPUTATIONAL_TASKS:
      return 'memory';
    case SEARCH_CATEGORIES.BLOCKCHAIN_DATA:
      return 'storage';
    case SEARCH_CATEGORIES.CROSS_CHAIN:
      return 'link';
    case SEARCH_CATEGORIES.LOCATIONS:
      return 'place';
    default:
      return 'search';
    }
  };

  // Navigate to result with validation
  const navigateToResult = result => {
    // Validate result has required properties
    if (!result || !result.id || !result.category) {
      console.error('Invalid search result', result);
      return;
    }

    // Sanitize ID to prevent XSS or path traversal attacks
    // Only allow alphanumeric characters, hyphens, and underscores
    const sanitizedId = String(result.id).replace(/[^a-zA-Z0-9_-]/g, '');

    if (!sanitizedId) {
      console.error('Invalid ID in search result', result);
      return;
    }

    let path;

    switch (result.category) {
    case SEARCH_CATEGORIES.ARTICLES:
      path = `/resources/docs/${sanitizedId}`;
      break;
    case SEARCH_CATEGORIES.TRANSACTIONS:
      path = `/explorer/tx/${sanitizedId}`;
      break;
    case SEARCH_CATEGORIES.NFT_MARKETPLACE:
      path = `/marketplace/nft/${sanitizedId}`;
      break;
    case SEARCH_CATEGORIES.GOVERNANCE:
      path = `/governance/proposals/${sanitizedId}`;
      break;
    case SEARCH_CATEGORIES.WEATHER_MODELS:
      path = `/computational/weather/${sanitizedId}`;
      break;
    case SEARCH_CATEGORIES.MINING_POOLS:
      path = `/mining/pools/${sanitizedId}`;
      break;
    case SEARCH_CATEGORIES.SETTINGS:
      path = `/settings/${sanitizedId}`;
      break;
    case SEARCH_CATEGORIES.WEATHER_STATIONS:
      path = `/computational/stations/${sanitizedId}`;
      break;
    case SEARCH_CATEGORIES.NODES:
      path = `/network/nodes/${sanitizedId}`;
      break;
    case SEARCH_CATEGORIES.USERS:
      path = `/users/${sanitizedId}`;
      break;
    case SEARCH_CATEGORIES.COMPUTATIONAL_TASKS:
      path = `/computational/tasks/${sanitizedId}`;
      break;
    case SEARCH_CATEGORIES.BLOCKCHAIN_DATA:
      path = `/explorer/block/${sanitizedId}`;
      break;
    case SEARCH_CATEGORIES.CROSS_CHAIN:
      path = `/cross-chain/transfers/${sanitizedId}`;
      break;
    case SEARCH_CATEGORIES.LOCATIONS:
      path = `/explorer?tab=map&station=${sanitizedId}`;
      break;
    default:
      path = '/';
    }

    navigate(path);
  };

  // Render a result item
  const renderResultItem = result => {
    const { id, category, score, metadata, matchedTermCount } = result;
    const relevanceScore = Math.min(100, Math.round((score / 3) * 100));

    // Sanitize all user-generated content to prevent XSS attacks
    const safeId = sanitizeId(id);
    const safeTitle = sanitizeHtml(metadata?.title || metadata?.name || safeId);
    const safeCategoryName = getCategoryName(category);
    const safeDescription = sanitizeHtml(
      metadata?.subtitle || metadata?.description || `${safeCategoryName} item`,
    );

    // Safely format dates
    let safeLastEditedInfo = null;
    if (metadata?.lastEditedBy && metadata?.lastEditedDate) {
      const safeLastEditedBy = sanitizeHtml(metadata.lastEditedBy);
      let safeDate = '';
      try {
        safeDate = new Date(metadata.lastEditedDate).toLocaleDateString();
      } catch (e) {
        safeDate = 'Invalid date';
      }
      safeLastEditedInfo = `Last edited by ${safeLastEditedBy} on ${safeDate}`;
    }

    // Safely format timestamp
    let safeTimestamp = null;
    if (metadata?.timestamp) {
      try {
        safeTimestamp = new Date(metadata.timestamp).toLocaleString();
      } catch (e) {
        safeTimestamp = 'Invalid date';
      }
    }

    return (
      <div
        key={`${category}-${safeId}`}
        className="search-result-item"
        onClick={() => navigateToResult(result)}
      >
        <div className="result-icon">
          <i className="material-icons">{getCategoryIcon(category)}</i>
        </div>

        <div className="result-content">
          <div className="result-header">
            <h3 className="result-title">{safeTitle}</h3>
            <span className="result-category">{safeCategoryName}</span>
          </div>

          <p className="result-description">{safeDescription}</p>

          {safeLastEditedInfo && (
            <div className="result-metadata">{safeLastEditedInfo}</div>
          )}

          {safeTimestamp && (
            <div className="result-metadata">Date: {safeTimestamp}</div>
          )}
        </div>

        <div className="result-relevance">
          <div className="relevance-bar">
            <div
              className="relevance-fill"
              style={{ width: `${relevanceScore}%` }}
              title={`Relevance score: ${relevanceScore}%`}
            ></div>
          </div>
          <div className="relevance-label">
            {matchedTermCount} match{matchedTermCount !== 1 ? 'es' : ''}
          </div>
        </div>
      </div>
    );
  };

  // Find element with class="secondary-sidebar-content" and render SearchSidebar there
  useEffect(() => {
    const sidebarContentEl = document.querySelector(
      '.secondary-sidebar-content',
    );
    if (sidebarContentEl && !isLoading) {
      // Use React's createPortal via direct DOM manipulation
      // This is a workaround as we can't directly use createPortal here

      // Security: Clear inner HTML safely without using innerHTML directly
      while (sidebarContentEl.firstChild) {
        sidebarContentEl.removeChild(sidebarContentEl.firstChild);
      }

      const sidebarContainer = document.createElement('div');
      sidebarContentEl.appendChild(sidebarContainer);

      // We'll use a custom event to notify our sidebar component
      // Security: Sanitize all data before passing it through event system
      const updateSelectedCategories = categoryFilters => {
        // Validate that categoryFilters is an object
        if (typeof categoryFilters !== 'object' || categoryFilters === null) {
          console.error('Invalid categoryFilters provided', categoryFilters);
          return;
        }

        // Filter and validate categories
        const newSelectedCategories = Object.entries(categoryFilters)
          .filter(([category, isSelected]) => {
            // Validate that category is valid and isSelected is boolean
            return (
              Object.keys(SEARCH_CATEGORIES).includes(category) &&
              typeof isSelected === 'boolean'
            );
          })
          .filter(([_, isSelected]) => isSelected)
          .map(([category]) => SEARCH_CATEGORIES[category]);

        setSelectedCategories(newSelectedCategories);

        // Security: Validate and sanitize URL parameters
        const newParams = new URLSearchParams(location.search);
        const safeCategories = newSelectedCategories.join(',');
        newParams.set('categories', safeCategories);
        navigate(`${location.pathname}?${newParams.toString()}`);
      };

      const event = new CustomEvent('search-sidebar-ready', {
        detail: {
          stats,
          activeCategory,
          setActiveCategory: cat => {
            // Validate that category is valid
            if (cat === 'all' || validCategories.includes(cat)) {
              setActiveCategory(cat);
            } else {
              console.error('Invalid category selected', cat);
            }
          },
          updateSelectedCategories,
          getCategoryName,
          selectedCategories,
        },
      });
      document.dispatchEvent(event);
    }
  }, [isLoading, stats, activeCategory, selectedCategories]);

  // Listen for category filter updates from the SearchSidebar
  useEffect(() => {
    const handleUpdateFilters = event => {
      // Security: Validate event data before processing
      if (!event || !event.detail) {
        console.error(
          'Invalid event or missing detail in search-update-filters event',
        );
        return;
      }

      const { categoryFilters } = event.detail;

      // Security: Validate categoryFilters before processing
      if (!categoryFilters || typeof categoryFilters !== 'object') {
        console.error(
          'Invalid categoryFilters in search-update-filters event',
          categoryFilters,
        );
        return;
      }

      // Check if at least one category is selected
      const hasSelectedCategory = Object.values(categoryFilters).some(
        isSelected => isSelected === true,
      );

      if (!hasSelectedCategory) {
        console.warn(
          'No categories selected in filter update, keeping current selection',
        );
        return;
      }

      // Create a local function that has access to the current component state
      const processFilterUpdate = () => {
        // Filter and validate categories
        const newSelectedCategories = Object.entries(categoryFilters)
          .filter(([category, isSelected]) => {
            // Validate that category is valid and isSelected is boolean
            return (
              Object.keys(SEARCH_CATEGORIES).includes(category) &&
              typeof isSelected === 'boolean'
            );
          })
          .filter(([_, isSelected]) => isSelected)
          .map(([category]) => SEARCH_CATEGORIES[category]);

        // Update state with validated categories
        setSelectedCategories(newSelectedCategories);

        // Update URL to reflect selected categories
        const newParams = new URLSearchParams(location.search);
        const safeCategories = newSelectedCategories.join(',');
        newParams.set('categories', safeCategories);
        navigate(`${location.pathname}?${newParams.toString()}`);
      };

      processFilterUpdate();
    };

    document.addEventListener('search-update-filters', handleUpdateFilters);

    return () => {
      document.removeEventListener(
        'search-update-filters',
        handleUpdateFilters,
      );
    };
  }, [location, navigate]);

  return (
    <div className="search-results-container full-width-container">
      <div className="search-header">
        <h1>Search Results</h1>
        <SearchBar
          onSearch={handleSearch}
          expanded={false}
          placeholder="Refine your search..."
        />
      </div>

      {isLoading ? (
        <div className="search-loading">
          <i className="material-icons spinning">refresh</i>
          <p>Searching across Wrfcoin...</p>
        </div>
      ) : error ? (
        <div className="search-error">
          <i className="material-icons">error</i>
          <p>{error}</p>
        </div>
      ) : results.length === 0 ? (
        <div className="search-no-results">
          <i className="material-icons">search_off</i>
          <h2>No results found</h2>
          <p>Try adjusting your search terms or categories.</p>
        </div>
      ) : (
        <>
          <div className="search-stats">
            <p>
              Found <strong>{stats.total}</strong> results for "
              <strong>{searchQuery}</strong>"
            </p>
            {activeCategory !== 'all' && (
              <div className="active-category-indicator">
                <span>
                  Filtered by:{' '}
                  <strong>{getCategoryName(activeCategory)}</strong>
                </span>
                <button
                  className="clear-filter-btn"
                  onClick={() => setActiveCategory('all')}
                  title="Clear filter"
                >
                  <i className="material-icons">close</i>
                </button>
              </div>
            )}
          </div>

          <div className="search-results-list">
            {filteredResults.map(renderResultItem)}
          </div>
        </>
      )}

      {/* Hidden sidebar content for direct DOM rendering */}
      <div id="search-sidebar-container" style={{ display: 'none' }}>
        <SearchSidebar
          stats={stats}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          getCategoryName={getCategoryName}
        />
      </div>
    </div>
  );
};

export default SearchResults;
