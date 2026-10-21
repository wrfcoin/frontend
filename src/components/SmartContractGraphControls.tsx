/**
 * Smart Contract Graph Controls Component
 *
 * Provides comprehensive filtering, search, layout switching, and configuration
 * controls for the WRFCoin Smart Contract Graph visualization
 */

import React, { useState, useCallback, useMemo } from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import {
  FilterOptions,
  GraphLayout,
  RenderConfig,
  ContractCategory,
  CategoryColors,
} from '../types/smartContract';
import '../styles/graph-controls.css';

interface SmartContractGraphControlsProps {
  filters: FilterOptions;
  layout: GraphLayout;
  renderConfig: RenderConfig;
  onFiltersChange: (filters: Partial<FilterOptions>) => void;
  onLayoutChange: (layout: GraphLayout) => void;
  onRenderConfigChange: (config: Partial<RenderConfig>) => void;
  totalNodes?: number;
  visibleNodes?: number;
  onResetView?: () => void;
  onExport?: (format: 'png' | 'svg' | 'json') => void;
}

export const SmartContractGraphControls: React.FC<
  SmartContractGraphControlsProps
> = ({
  filters,
  layout,
  renderConfig,
  onFiltersChange,
  onLayoutChange,
  onRenderConfigChange,
  totalNodes = 0,
  visibleNodes = 0,
  onResetView,
  onExport,
}) => {
  const [activeTab, setActiveTab] = useState<
    'filters' | 'layout' | 'performance'
  >('filters');
  const [searchFocus, setSearchFocus] = useState(false);
  const [exportAnchorEl, setExportAnchorEl] = useState<HTMLElement | null>(null);

  // Category filter handling
  const handleCategoryToggle = useCallback(
    (category: ContractCategory) => {
      const newCategories = filters.categories.includes(category)
        ? filters.categories.filter(c => c !== category)
        : [...filters.categories, category];
      onFiltersChange({ categories: newCategories });
    },
    [filters.categories, onFiltersChange],
  );

  const handleCategorySelectAll = useCallback(() => {
    const allCategories = Object.keys(CategoryColors) as ContractCategory[];
    onFiltersChange({ categories: allCategories });
  }, [onFiltersChange]);

  const handleCategorySelectNone = useCallback(() => {
    onFiltersChange({ categories: [] });
  }, [onFiltersChange]);

  // Type filter handling
  const handleTypeToggle = useCallback(
    (type: 'contract' | 'interface' | 'library') => {
      const newTypes = filters.types.includes(type)
        ? filters.types.filter(t => t !== type)
        : [...filters.types, type];
      onFiltersChange({ types: newTypes });
    },
    [filters.types, onFiltersChange],
  );

  // Audit status filter handling
  const handleAuditStatusToggle = useCallback(
    (status: 'audited' | 'pending' | 'unaudited') => {
      const newStatuses = filters.auditStatus.includes(status)
        ? filters.auditStatus.filter(s => s !== status)
        : [...filters.auditStatus, status];
      onFiltersChange({ auditStatus: newStatuses });
    },
    [filters.auditStatus, onFiltersChange],
  );

  // Search handling with debounce
  const handleSearchChange = useCallback(
    (value: string) => {
      onFiltersChange({ searchTerm: value });
    },
    [onFiltersChange],
  );

  // Layout presets
  const layoutPresets = useMemo(
    () => [
      {
        id: 'hub-spoke',
        name: 'Hub & Spoke',
        description: 'WRFToken at center with radial layout',
        config: { type: 'hub-spoke' as const, centerNode: 'WRFToken' },
      },
      {
        id: 'force',
        name: 'Force-Directed',
        description: 'Physics-based organic layout',
        config: { type: 'force' as const },
      },
      {
        id: 'hierarchical',
        name: 'Hierarchical',
        description: 'Top-down dependency tree',
        config: { type: 'hierarchical' as const, levels: 5 },
      },
      {
        id: 'clustered',
        name: 'Clustered',
        description: 'Grouped by contract category',
        config: { type: 'clustered' as const },
      },
    ],
    [],
  );

  // Filter statistics
  const filterStats = useMemo(() => {
    const selectedCategories = filters.categories.length;
    const totalCategories = Object.keys(CategoryColors).length;
    const selectedTypes = filters.types.length;
    const totalTypes = 3;
    const importanceRange = filters.maxImportance - filters.minImportance + 1;

    return {
      categories: `${selectedCategories}/${totalCategories}`,
      types: `${selectedTypes}/${totalTypes}`,
      importance: `${filters.minImportance}-${filters.maxImportance}`,
      hasSearch: filters.searchTerm.length > 0,
      activeFilters:
        selectedCategories +
        selectedTypes +
        (filters.searchTerm.length > 0 ? 1 : 0),
    };
  }, [filters]);

  return (
    <div className="graph-controls">
      {/* Header with tabs */}
      <div className="controls-header">
        <div className="controls-tabs">
          <button
            className={`tab ${activeTab === 'filters' ? 'active' : ''}`}
            onClick={() => setActiveTab('filters')}
          >
            Filters
            {filterStats.activeFilters > 0 && (
              <span className="filter-badge">{filterStats.activeFilters}</span>
            )}
          </button>
          <button
            className={`tab ${activeTab === 'layout' ? 'active' : ''}`}
            onClick={() => setActiveTab('layout')}
          >
            Layout
          </button>
          <button
            className={`tab ${activeTab === 'performance' ? 'active' : ''}`}
            onClick={() => setActiveTab('performance')}
          >
            Performance
          </button>
        </div>

        <div className="controls-actions">
          <button
            className="action-button reset"
            onClick={onResetView}
            title="Reset view to default"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
            </svg>
          </button>

          <div className="export-dropdown">
            <button className="action-button export" onClick={(e) => setExportAnchorEl(e.currentTarget)}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
            </button>
            <Menu
              anchorEl={exportAnchorEl}
              open={Boolean(exportAnchorEl)}
              onClose={() => setExportAnchorEl(null)}
            >
              <MenuItem onClick={() => { onExport?.('png'); setExportAnchorEl(null); }}>Export PNG</MenuItem>
              <MenuItem onClick={() => { onExport?.('svg'); setExportAnchorEl(null); }}>Export SVG</MenuItem>
              <MenuItem onClick={() => { onExport?.('json'); setExportAnchorEl(null); }}>Export Data</MenuItem>
            </Menu>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="status-bar">
        <span className="node-count">
          {visibleNodes} of {totalNodes} contracts visible
        </span>
        <div className="filter-summary">
          <span>Categories: {filterStats.categories}</span>
          <span>Types: {filterStats.types}</span>
          <span>Importance: {filterStats.importance}</span>
        </div>
      </div>

      {/* Tab content */}
      <div className="controls-content">
        {/* Filters Tab */}
        {activeTab === 'filters' && (
          <div className="filters-panel">
            {/* Search */}
            <div className="filter-section">
              <label className="filter-label">Search Contracts</label>
              <div className={`search-input ${searchFocus ? 'focused' : ''}`}>
                <svg
                  className="search-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by name, function, or description..."
                  value={filters.searchTerm}
                  onChange={e => handleSearchChange(e.target.value)}
                  onFocus={() => setSearchFocus(true)}
                  onBlur={() => setSearchFocus(false)}
                />
                {filters.searchTerm && (
                  <button
                    className="clear-search"
                    onClick={() => handleSearchChange('')}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Contract Categories */}
            <div className="filter-section">
              <div className="filter-header">
                <label className="filter-label">Contract Categories</label>
                <div className="filter-actions">
                  <button
                    onClick={handleCategorySelectAll}
                    className="select-all"
                  >
                    All
                  </button>
                  <button
                    onClick={handleCategorySelectNone}
                    className="select-none"
                  >
                    None
                  </button>
                </div>
              </div>
              <div className="category-filters">
                {Object.entries(CategoryColors).map(([category, color]) => (
                  <label key={category} className="category-filter">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(
                        category as ContractCategory,
                      )}
                      onChange={() =>
                        handleCategoryToggle(category as ContractCategory)
                      }
                    />
                    <span
                      className="checkbox-custom"
                      style={{ backgroundColor: color }}
                    >
                      <svg
                        className="check-icon"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="white"
                      >
                        <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
                      </svg>
                    </span>
                    <span className="category-name">{category}</span>
                    <div
                      className="category-color"
                      style={{ backgroundColor: color }}
                    ></div>
                  </label>
                ))}
              </div>
            </div>

            {/* Contract Types */}
            <div className="filter-section">
              <label className="filter-label">Contract Types</label>
              <div className="type-filters">
                {['contract', 'interface', 'library'].map(type => (
                  <label key={type} className="type-filter">
                    <input
                      type="checkbox"
                      checked={filters.types.includes(type as any)}
                      onChange={() => handleTypeToggle(type as any)}
                    />
                    <span className="checkbox-custom type">
                      <svg
                        className="check-icon"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="white"
                      >
                        <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
                      </svg>
                    </span>
                    <span className="type-name">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Audit Status */}
            <div className="filter-section">
              <label className="filter-label">Audit Status</label>
              <div className="audit-filters">
                {['audited', 'pending', 'unaudited'].map(status => (
                  <label key={status} className="audit-filter">
                    <input
                      type="checkbox"
                      checked={filters.auditStatus.includes(status as any)}
                      onChange={() => handleAuditStatusToggle(status as any)}
                    />
                    <span className={`checkbox-custom audit audit-${status}`}>
                      <svg
                        className="check-icon"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="white"
                      >
                        <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
                      </svg>
                    </span>
                    <span className="audit-name">{status}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Importance Range */}
            <div className="filter-section">
              <label className="filter-label">
                Importance Range ({filters.minImportance} -{' '}
                {filters.maxImportance})
              </label>
              <div className="range-slider">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={filters.minImportance}
                  onChange={e =>
                    onFiltersChange({
                      minImportance: Math.min(
                        parseInt(e.target.value),
                        filters.maxImportance,
                      ),
                    })
                  }
                  className="range-input min"
                />
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={filters.maxImportance}
                  onChange={e =>
                    onFiltersChange({
                      maxImportance: Math.max(
                        parseInt(e.target.value),
                        filters.minImportance,
                      ),
                    })
                  }
                  className="range-input max"
                />
                <div className="range-track">
                  <div
                    className="range-fill"
                    style={{
                      left: `${((filters.minImportance - 1) / 9) * 100}%`,
                      width: `${((filters.maxImportance - filters.minImportance) / 9) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Additional Options */}
            <div className="filter-section">
              <label className="filter-label">Options</label>
              <label className="option-filter">
                <input
                  type="checkbox"
                  checked={filters.showOnlyConnected}
                  onChange={e =>
                    onFiltersChange({ showOnlyConnected: e.target.checked })
                  }
                />
                <span className="checkbox-custom option">
                  <svg
                    className="check-icon"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="white"
                  >
                    <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
                  </svg>
                </span>
                <span className="option-name">
                  Show only connected contracts
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Layout Tab */}
        {activeTab === 'layout' && (
          <div className="layout-panel">
            <div className="filter-section">
              <label className="filter-label">Layout Algorithm</label>
              <div className="layout-presets">
                {layoutPresets.map(preset => (
                  <button
                    key={preset.id}
                    className={`layout-preset ${layout.type === preset.config.type ? 'active' : ''}`}
                    onClick={() => onLayoutChange(preset.config)}
                  >
                    <div className="preset-name">{preset.name}</div>
                    <div className="preset-description">
                      {preset.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {layout.type === 'hub-spoke' && (
              <div className="filter-section">
                <label className="filter-label">Center Node</label>
                <input
                  type="text"
                  value={layout.centerNode || ''}
                  onChange={e =>
                    onLayoutChange({ ...layout, centerNode: e.target.value })
                  }
                  placeholder="Enter node ID (e.g., WRFToken)"
                  className="text-input"
                />
              </div>
            )}

            {layout.type === 'hierarchical' && (
              <div className="filter-section">
                <label className="filter-label">Hierarchy Levels</label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={layout.levels || 5}
                  onChange={e =>
                    onLayoutChange({
                      ...layout,
                      levels: parseInt(e.target.value),
                    })
                  }
                  className="number-input"
                />
              </div>
            )}
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="performance-panel">
            <div className="filter-section">
              <label className="filter-label">Rendering Options</label>

              <label className="option-filter">
                <input
                  type="checkbox"
                  checked={renderConfig.enableLevelOfDetail}
                  onChange={e =>
                    onRenderConfigChange({
                      enableLevelOfDetail: e.target.checked,
                    })
                  }
                />
                <span className="checkbox-custom option">
                  <svg
                    className="check-icon"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="white"
                  >
                    <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
                  </svg>
                </span>
                <span className="option-name">
                  Enable Level-of-Detail (LOD)
                </span>
              </label>

              <label className="option-filter">
                <input
                  type="checkbox"
                  checked={renderConfig.viewportCulling}
                  onChange={e =>
                    onRenderConfigChange({ viewportCulling: e.target.checked })
                  }
                />
                <span className="checkbox-custom option">
                  <svg
                    className="check-icon"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="white"
                  >
                    <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
                  </svg>
                </span>
                <span className="option-name">Enable Viewport Culling</span>
              </label>

              <label className="option-filter">
                <input
                  type="checkbox"
                  checked={renderConfig.enablePhysics}
                  onChange={e =>
                    onRenderConfigChange({ enablePhysics: e.target.checked })
                  }
                />
                <span className="checkbox-custom option">
                  <svg
                    className="check-icon"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="white"
                  >
                    <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
                  </svg>
                </span>
                <span className="option-name">Enable Physics Simulation</span>
              </label>
            </div>

            <div className="filter-section">
              <label className="filter-label">
                Max Visible Nodes: {renderConfig.maxVisibleNodes}
              </label>
              <input
                type="range"
                min="50"
                max="200"
                value={renderConfig.maxVisibleNodes}
                onChange={e =>
                  onRenderConfigChange({
                    maxVisibleNodes: parseInt(e.target.value),
                  })
                }
                className="slider"
              />
            </div>

            <div className="filter-section">
              <label className="filter-label">
                Animation Speed: {renderConfig.animationSpeed}s
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={renderConfig.animationSpeed}
                onChange={e =>
                  onRenderConfigChange({
                    animationSpeed: parseFloat(e.target.value),
                  })
                }
                className="slider"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartContractGraphControls;
