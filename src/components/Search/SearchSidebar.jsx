import React, { useState, useEffect } from 'react';
import './SearchSidebar.css';
import { SEARCH_CATEGORIES } from '../../services/SearchService';

/**
 * SearchSidebar Component
 *
 * A sidebar component for search filters providing category filtering
 * and additional filtering options for search results.
 */
const SearchSidebar = ({
  stats = { total: 0, byCategory: {} },
  activeCategory = 'all',
  setActiveCategory = () => {},
  getCategoryName = cat => cat,
}) => {
  const [dateRange, setDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');
  const [selectedCategories, setSelectedCategories] = useState({
    NFT_MARKETPLACE: true,
    GOVERNANCE: true,
    TRANSACTIONS: true,
    WEATHER_MODELS: true,
    ARTICLES: true,
    BLOCKCHAIN_DATA: true,
    SETTINGS: true,
    NODES: true,
    CROSS_CHAIN: true,
  });

  // Listen for custom events from SearchResults component
  useEffect(() => {
    const handleSidebarReady = event => {
      const {
        stats: newStats,
        activeCategory: newCategory,
        setActiveCategory: newSetActiveCategory,
        getCategoryName: newGetCategoryName,
        updateSelectedCategories,
        selectedCategories: newSelectedCategories,
      } = event.detail;

      // Clone the sidebar content to the sidebar container
      const sidebarContent = document.querySelector(
        '.secondary-sidebar-content',
      );
      if (sidebarContent) {
        const sidebarContainer = document.createElement('div');
        sidebarContainer.className = 'search-sidebar';
        sidebarContent.appendChild(sidebarContainer);

        // Create category section
        const categorySection = document.createElement('div');
        categorySection.className = 'search-sidebar-section';
        sidebarContainer.appendChild(categorySection);

        // Add category heading
        const categoryHeading = document.createElement('h3');
        categoryHeading.className = 'search-sidebar-heading';
        categoryHeading.textContent = 'Categories';
        categorySection.appendChild(categoryHeading);

        // Create category list
        const categoryList = document.createElement('ul');
        categoryList.className = 'search-sidebar-list';
        categorySection.appendChild(categoryList);

        // Add "All Results" item
        const allItem = document.createElement('li');
        allItem.className = `search-sidebar-item ${newCategory === 'all' ? 'active' : ''}`;
        allItem.addEventListener('click', () => newSetActiveCategory('all'));
        categoryList.appendChild(allItem);

        const allItemName = document.createElement('span');
        allItemName.className = 'search-sidebar-item-name';
        allItemName.textContent = 'All Results';
        allItem.appendChild(allItemName);

        const allItemCount = document.createElement('span');
        allItemCount.className = 'search-sidebar-item-count';
        allItemCount.textContent = newStats.total || 0;
        allItem.appendChild(allItemCount);

        // Add category items
        Object.entries(newStats.byCategory || {}).forEach(
          ([category, count]) => {
            const item = document.createElement('li');
            item.className = `search-sidebar-item ${newCategory === category ? 'active' : ''}`;
            item.addEventListener('click', () =>
              newSetActiveCategory(category),
            );
            categoryList.appendChild(item);

            const itemName = document.createElement('span');
            itemName.className = 'search-sidebar-item-name';
            itemName.textContent = newGetCategoryName(category);
            item.appendChild(itemName);

            const itemCount = document.createElement('span');
            itemCount.className = 'search-sidebar-item-count';
            itemCount.textContent = count;
            item.appendChild(itemCount);
          },
        );

        // Add date range section
        const dateSection = document.createElement('div');
        dateSection.className = 'search-sidebar-section';
        sidebarContainer.appendChild(dateSection);

        const dateHeading = document.createElement('h3');
        dateHeading.className = 'search-sidebar-heading';
        dateHeading.textContent = 'Date Range';
        dateSection.appendChild(dateHeading);

        const dateFilter = document.createElement('div');
        dateFilter.className = 'search-sidebar-date-filter';
        dateSection.appendChild(dateFilter);

        const dateSelect = document.createElement('select');
        dateSelect.className = 'search-sidebar-select';
        dateSelect.value = dateRange;
        dateSelect.addEventListener('change', e =>
          setDateRange(e.target.value),
        );
        dateFilter.appendChild(dateSelect);

        const dateOptions = [
          { value: 'all', text: 'All time' },
          { value: 'day', text: 'Last 24 hours' },
          { value: 'week', text: 'Last week' },
          { value: 'month', text: 'Last month' },
          { value: 'year', text: 'Last year' },
        ];

        dateOptions.forEach(option => {
          const dateOption = document.createElement('option');
          dateOption.value = option.value;
          dateOption.textContent = option.text;
          dateSelect.appendChild(dateOption);
        });

        // Add sort by section
        const sortSection = document.createElement('div');
        sortSection.className = 'search-sidebar-section';
        sidebarContainer.appendChild(sortSection);

        const sortHeading = document.createElement('h3');
        sortHeading.className = 'search-sidebar-heading';
        sortHeading.textContent = 'Sort By';
        sortSection.appendChild(sortHeading);

        const sortOptions = document.createElement('div');
        sortOptions.className = 'search-sidebar-sort-options';
        sortSection.appendChild(sortOptions);

        const sortSelect = document.createElement('select');
        sortSelect.className = 'search-sidebar-select';
        sortSelect.value = sortBy;
        sortSelect.addEventListener('change', e => setSortBy(e.target.value));
        sortOptions.appendChild(sortSelect);

        const sortByOptions = [
          { value: 'relevance', text: 'Relevance' },
          { value: 'date-new', text: 'Date (newest first)' },
          { value: 'date-old', text: 'Date (oldest first)' },
          { value: 'alpha-asc', text: 'Name (A-Z)' },
          { value: 'alpha-desc', text: 'Name (Z-A)' },
        ];

        sortByOptions.forEach(option => {
          const sortOption = document.createElement('option');
          sortOption.value = option.value;
          sortOption.textContent = option.text;
          sortSelect.appendChild(sortOption);
        });
      }
    };

    document.addEventListener('search-sidebar-ready', handleSidebarReady);

    return () => {
      document.removeEventListener('search-sidebar-ready', handleSidebarReady);
    };
  }, [dateRange, sortBy]);

  // Handler for category checkbox change
  const handleCategoryCheckboxChange = category => {
    const newFilters = {
      ...selectedCategories,
      [category]: !selectedCategories[category],
    };

    setSelectedCategories(newFilters);

    // If we have access to the updateSelectedCategories function, call it
    const event = new CustomEvent('search-update-filters', {
      detail: { categoryFilters: newFilters },
    });
    document.dispatchEvent(event);
  };

  // Get a readable name for the category
  const getReadableCategoryName = category => {
    const mapping = {
      NFT_MARKETPLACE: 'NFT Marketplace',
      GOVERNANCE: 'Governance',
      TRANSACTIONS: 'Transactions',
      WEATHER_MODELS: 'Weather Models',
      ARTICLES: 'Documentation',
      BLOCKCHAIN_DATA: 'Blockchain Data',
      SETTINGS: 'Settings',
      NODES: 'Network Nodes',
      CROSS_CHAIN: 'Cross-Chain',
      COMPUTATIONAL_TASKS: 'Computational Tasks',
      WEATHER_STATIONS: 'Weather Stations',
      MINING_POOLS: 'Mining Pools',
      USERS: 'Users',
    };
    return mapping[category] || category;
  };

  // This component can be either rendered directly or through the DOM manipulation
  return (
    <div className="search-sidebar">
      <div className="search-sidebar-section">
        <h3 className="search-sidebar-heading">Categories</h3>
        <ul className="search-sidebar-list">
          <li
            className={`search-sidebar-item ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            <span className="search-sidebar-item-name">All Results</span>
            <span className="search-sidebar-item-count">
              {stats.total || 0}
            </span>
          </li>

          {Object.entries(stats.byCategory || {}).map(([category, count]) => (
            <li
              key={category}
              className={`search-sidebar-item ${activeCategory === category ? 'active' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              <span className="search-sidebar-item-name">
                {getCategoryName(category)}
              </span>
              <span className="search-sidebar-item-count">{count}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="search-sidebar-section">
        <h3 className="search-sidebar-heading">Filter By</h3>
        <div className="search-sidebar-filter-checkboxes">
          {Object.keys(SEARCH_CATEGORIES).map(categoryKey => (
            <div key={categoryKey} className="search-checkbox-item">
              <input
                type="checkbox"
                id={`cat-${categoryKey}`}
                checked={selectedCategories[categoryKey] || false}
                onChange={() => handleCategoryCheckboxChange(categoryKey)}
              />
              <label htmlFor={`cat-${categoryKey}`}>
                {getReadableCategoryName(categoryKey)}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="search-sidebar-section">
        <h3 className="search-sidebar-heading">Date Range</h3>
        <div className="search-sidebar-date-filter">
          <select
            className="search-sidebar-select"
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
          >
            <option value="all">All time</option>
            <option value="day">Last 24 hours</option>
            <option value="week">Last week</option>
            <option value="month">Last month</option>
            <option value="year">Last year</option>
          </select>
        </div>
      </div>

      <div className="search-sidebar-section">
        <h3 className="search-sidebar-heading">Sort By</h3>
        <div className="search-sidebar-sort-options">
          <select
            className="search-sidebar-select"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="relevance">Relevance</option>
            <option value="date-new">Date (newest first)</option>
            <option value="date-old">Date (oldest first)</option>
            <option value="alpha-asc">Name (A-Z)</option>
            <option value="alpha-desc">Name (Z-A)</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default SearchSidebar;
