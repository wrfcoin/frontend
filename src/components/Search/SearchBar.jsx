import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import './SearchBar.css';
import { SEARCH_CATEGORIES } from '../../services/SearchService';
import { sanitizeUrlParam } from '../../utils/securityUtils';
import { geocodeSearch } from '../../services/geocodingService';

/**
 * SearchBar component that provides a universal search functionality
 * across the entire Wrfcoin application
 */
const SearchBar = ({
  onSearch,
  placeholder = 'Search articles, transactions, NFTs, and more...',
  expanded = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [selectedCategories, setSelectedCategories] = useState(
    Object.values(SEARCH_CATEGORIES),
  );
  const [showMenuUpward, setShowMenuUpward] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);
  const navigate = useNavigate();

  // Debounced geocoding for location autocomplete
  const fetchLocationSuggestions = useCallback(
    term => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();

      if (!term || term.trim().length < 3) {
        setLocationSuggestions([]);
        setShowLocationSuggestions(false);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        try {
          const controller = new AbortController();
          abortRef.current = controller;
          const results = await geocodeSearch(term.trim(), controller.signal);
          setLocationSuggestions(
            results.slice(0, 4).map(r => ({
              type: 'place',
              label: r.displayName.split(',').slice(0, 2).join(','),
              fullLabel: r.displayName,
              lat: r.lat,
              lng: r.lng,
            })),
          );
          setShowLocationSuggestions(results.length > 0);
        } catch {
          // Aborted or network error — ignore
        }
      }, 350);
    },
    [],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const handleLocationSelect = suggestion => {
    setShowLocationSuggestions(false);
    setSearchTerm('');
    if (suggestion.stationId) {
      navigate(`/explorer?tab=map&station=${encodeURIComponent(suggestion.stationId)}`);
    } else {
      navigate(
        `/explorer?tab=map&lat=${suggestion.lat}&lng=${suggestion.lng}&zoom=12`,
      );
    }
  };

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isExpanded]);

  // Check position to determine if menu should go upward
  useEffect(() => {
    if (isExpanded && searchContainerRef.current) {
      const rect = searchContainerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const bottomSpace = windowHeight - rect.bottom;

      // If there's less than 300px at the bottom, show menu upward
      setShowMenuUpward(bottomSpace < 300);
    }
  }, [isExpanded]);

  const handleSearchChange = e => {
    // Limit input length for search term to prevent DOS attacks
    // We'll apply more thorough sanitization on form submission
    const input = e.target.value;
    if (input.length <= 200) {
      setSearchTerm(input);
      fetchLocationSuggestions(input);
    }
  };

  const handleSearchSubmit = e => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Sanitize search term before using in URL or passing to callback
      const sanitizedTerm = sanitizeUrlParam(searchTerm, 200);

      // Validate categories to ensure they're from our predefined list
      const validCategories = Object.values(SEARCH_CATEGORIES);
      const validatedCategories = selectedCategories.filter(cat =>
        validCategories.includes(cat),
      );

      // Use default categories if none are valid
      const categoriesToUse =
        validatedCategories.length > 0 ? validatedCategories : validCategories;

      // Navigate to search results page with sanitized query parameters
      navigate(
        `/search?q=${encodeURIComponent(sanitizedTerm)}&categories=${categoriesToUse.join(',')}`,
      );

      // Call the onSearch callback if provided
      if (onSearch) {
        onSearch(sanitizedTerm, categoriesToUse);
      }
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleCategory = category => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category],
    );
  };

  const handleSelectAllCategories = () => {
    setSelectedCategories(Object.values(SEARCH_CATEGORIES));
  };

  const handleClearAllCategories = () => {
    setSelectedCategories([]);
  };

  return (
    <div
      ref={searchContainerRef}
      className={`search-bar-container ${isExpanded ? 'expanded' : ''}`}
    >
      <form onSubmit={handleSearchSubmit} className="search-form">
        <div className="search-input-container">
          <button
            type="button"
            className="search-icon-btn"
            onClick={toggleExpand}
            aria-label="Toggle search"
          >
            <i className="material-icons">search</i>
          </button>

          <input
            ref={searchInputRef}
            type="text"
            className="search-input"
            placeholder={placeholder}
            value={searchTerm}
            onChange={handleSearchChange}
            maxLength="200"
            pattern="[^<>]*"
            title="Search term cannot contain angle brackets"
            aria-label="Search"
          />

          {searchTerm && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchTerm('')}
              aria-label="Clear search"
            >
              <i className="material-icons">close</i>
            </button>
          )}

          {/* Submit button removed as requested */}
        </div>

        {/* Location autocomplete suggestions */}
        {showLocationSuggestions && locationSuggestions.length > 0 && (
          <div
            className="search-categories menu-downward"
            style={{ padding: '4px 0', maxHeight: 240 }}
          >
            <div
              style={{
                padding: '4px 12px 8px',
                fontSize: 11,
                color: 'var(--text-secondary, #757575)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Locations
            </div>
            {locationSuggestions.map((suggestion, idx) => (
              <button
                key={`loc-${idx}`}
                type="button"
                onClick={() => handleLocationSelect(suggestion)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: 'var(--text-primary, #212121)',
                  fontSize: 13,
                  minHeight: 44,
                }}
                onMouseEnter={e =>
                  (e.currentTarget.style.backgroundColor =
                    'var(--surface-hover, #f5f5f5)')
                }
                onMouseLeave={e =>
                  (e.currentTarget.style.backgroundColor = 'transparent')
                }
              >
                <i
                  className="material-icons"
                  style={{
                    fontSize: 18,
                    color: suggestion.stationId
                      ? '#22C55E'
                      : 'var(--text-secondary, #757575)',
                  }}
                >
                  {suggestion.stationId ? 'sensors' : 'place'}
                </i>
                <span style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontWeight: 500 }}>
                    {suggestion.label}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 11,
                      color: 'var(--text-secondary, #757575)',
                      fontFamily: 'monospace',
                    }}
                  >
                    {suggestion.lat.toFixed(4)}, {suggestion.lng.toFixed(4)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}

        {isExpanded && !showLocationSuggestions && (
          <div
            className={`search-categories ${showMenuUpward ? 'menu-upward' : 'menu-downward'}`}
          >
            <div className="category-controls">
              <button
                type="button"
                className="category-control-btn"
                onClick={handleSelectAllCategories}
              >
                Select All
              </button>
              <button
                type="button"
                className="category-control-btn"
                onClick={handleClearAllCategories}
              >
                Clear All
              </button>
            </div>

            <div className="category-options">
              {Object.entries(SEARCH_CATEGORIES).map(([key, value]) => (
                <div key={key} className="category-option">
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(value)}
                      onChange={() => toggleCategory(value)}
                    />
                    {key.replace(/_/g, ' ')}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default SearchBar;
