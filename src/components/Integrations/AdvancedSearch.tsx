import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  TextField,
  Chip,
  Autocomplete,
  Card,
  CardContent,
  Typography,
  Grid,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Rating,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  History as HistoryIcon,
  Bookmark as BookmarkIcon,
  TrendingUp as TrendingIcon,
  ExpandMore as ExpandMoreIcon,
  Clear as ClearIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { sanitizeInput } from '../../utils/security';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  status: 'connected' | 'configured' | 'unconfigured' | 'error';
  popularity: number;
  rating: number;
  lastUsed?: Date;
  icon: string;
  provider?: string;
  setupComplexity: 'easy' | 'medium' | 'advanced';
}

interface SearchQuery {
  text: string;
  category?: string;
  tags: string[];
  status?: string;
  popularity?: number;
  rating?: number;
  timestamp: Date;
}

interface AdvancedSearchProps {
  integrations: Integration[];
  onSearchResults: (results: Integration[]) => void;
  onIntegrationSelect: (integration: Integration) => void;
  className?: string;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  integrations,
  onSearchResults,
  onIntegrationSelect,
  className,
}) => {
  const [searchText, setSearchText] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [minRating, setMinRating] = useState<number>(0);
  const [minPopularity, setMinPopularity] = useState<number>(0);
  const [setupComplexity, setSetupComplexity] = useState<string>('');
  const [searchHistory, setSearchHistory] = useState<SearchQuery[]>([]);
  const [savedQueries, setSavedQueries] = useState<SearchQuery[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [recommendations, setRecommendations] = useState<Integration[]>([]);

  // Load search history and saved queries from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('wrfcoin-search-history');
    const savedQueries = localStorage.getItem('wrfcoin-saved-queries');

    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory).map((query: any) => ({
          ...query,
          timestamp: new Date(query.timestamp),
        }));
        setSearchHistory(history);
      } catch (error) {
        console.warn('Failed to load search history:', error);
      }
    }

    if (savedQueries) {
      try {
        const queries = JSON.parse(savedQueries).map((query: any) => ({
          ...query,
          timestamp: new Date(query.timestamp),
        }));
        setSavedQueries(queries);
      } catch (error) {
        console.warn('Failed to load saved queries:', error);
      }
    }
  }, []);

  // Generate recommendations based on usage patterns
  useEffect(() => {
    const generateRecommendations = () => {
      // Get trending integrations (high popularity, recent usage)
      const trending = integrations
        .filter(integration => integration.popularity > 70)
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 3);

      // Get highly rated integrations
      const highRated = integrations
        .filter(integration => integration.rating >= 4.0)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 3);

      // Combine and deduplicate
      const combined = [...trending, ...highRated];
      const unique = combined.filter(
        (integration, index, self) =>
          index === self.findIndex(i => i.id === integration.id),
      );

      setRecommendations(unique.slice(0, 5));
    };

    if (integrations.length > 0) {
      generateRecommendations();
    }
  }, [integrations]);

  // Extract unique values for filter options
  const categories = useMemo(
    () => [...new Set(integrations.map(i => i.category))].sort(),
    [integrations],
  );

  const allTags = useMemo(
    () => [...new Set(integrations.flatMap(i => i.tags))].sort(),
    [integrations],
  );

  const statuses = ['connected', 'configured', 'unconfigured', 'error'];

  // Fuzzy search implementation
  const fuzzyMatch = useCallback((text: string, searchTerm: string): number => {
    if (!searchTerm) return 1;

    const searchLower = searchTerm.toLowerCase();
    const textLower = text.toLowerCase();

    // Exact match gets highest score
    if (textLower.includes(searchLower)) {
      return textLower === searchLower ? 1.0 : 0.8;
    }

    // Character-by-character fuzzy matching
    let score = 0;
    let searchIndex = 0;

    for (
      let i = 0;
      i < textLower.length && searchIndex < searchLower.length;
      i++
    ) {
      if (textLower[i] === searchLower[searchIndex]) {
        score += 1;
        searchIndex++;
      }
    }

    return searchIndex === searchLower.length
      ? (score / searchLower.length) * 0.6
      : 0;
  }, []);

  // Advanced search algorithm
  const performSearch = useCallback(() => {
    const sanitizedSearchText = sanitizeInput(searchText);

    let results = integrations.filter(integration => {
      // Text search with fuzzy matching
      const textMatch =
        !sanitizedSearchText ||
        fuzzyMatch(integration.name, sanitizedSearchText) > 0.3 ||
        fuzzyMatch(integration.description, sanitizedSearchText) > 0.3 ||
        integration.tags.some(
          tag => fuzzyMatch(tag, sanitizedSearchText) > 0.5,
        );

      // Category filter
      const categoryMatch =
        selectedCategories.length === 0 ||
        selectedCategories.includes(integration.category);

      // Tag filter
      const tagMatch =
        selectedTags.length === 0 ||
        selectedTags.some(tag => integration.tags.includes(tag));

      // Status filter
      const statusMatch = !statusFilter || integration.status === statusFilter;

      // Rating filter
      const ratingMatch = integration.rating >= minRating;

      // Popularity filter
      const popularityMatch = integration.popularity >= minPopularity;

      // Setup complexity filter
      const complexityMatch =
        !setupComplexity || integration.setupComplexity === setupComplexity;

      return (
        textMatch &&
        categoryMatch &&
        tagMatch &&
        statusMatch &&
        ratingMatch &&
        popularityMatch &&
        complexityMatch
      );
    });

    // Sort results by relevance
    if (sanitizedSearchText) {
      results = results.sort((a, b) => {
        const scoreA = Math.max(
          fuzzyMatch(a.name, sanitizedSearchText),
          fuzzyMatch(a.description, sanitizedSearchText),
          Math.max(...a.tags.map(tag => fuzzyMatch(tag, sanitizedSearchText))),
        );
        const scoreB = Math.max(
          fuzzyMatch(b.name, sanitizedSearchText),
          fuzzyMatch(b.description, sanitizedSearchText),
          Math.max(...b.tags.map(tag => fuzzyMatch(tag, sanitizedSearchText))),
        );

        // Secondary sort by popularity and rating
        if (scoreA === scoreB) {
          return b.popularity + b.rating * 20 - (a.popularity + a.rating * 20);
        }

        return scoreB - scoreA;
      });
    } else {
      // Sort by popularity and rating when no search text
      results = results.sort(
        (a, b) => b.popularity + b.rating * 20 - (a.popularity + a.rating * 20),
      );
    }

    onSearchResults(results);
  }, [
    searchText,
    selectedCategories,
    selectedTags,
    statusFilter,
    minRating,
    minPopularity,
    setupComplexity,
    integrations,
    fuzzyMatch,
    onSearchResults,
  ]);

  // Perform search when filters change
  useEffect(() => {
    performSearch();
  }, [performSearch]);

  // Save search to history
  const saveSearchToHistory = useCallback(() => {
    if (!searchText.trim()) return;

    const query: SearchQuery = {
      text: sanitizeInput(searchText),
      category:
        selectedCategories.length > 0 ? selectedCategories[0] : undefined,
      tags: [...selectedTags],
      status: statusFilter || undefined,
      popularity: minPopularity > 0 ? minPopularity : undefined,
      rating: minRating > 0 ? minRating : undefined,
      timestamp: new Date(),
    };

    const newHistory = [query, ...searchHistory.slice(0, 9)]; // Keep last 10
    setSearchHistory(newHistory);
    localStorage.setItem('wrfcoin-search-history', JSON.stringify(newHistory));
  }, [
    searchText,
    selectedCategories,
    selectedTags,
    statusFilter,
    minPopularity,
    minRating,
    searchHistory,
  ]);

  // Save current query
  const saveCurrentQuery = useCallback(() => {
    if (!searchText.trim()) return;

    const query: SearchQuery = {
      text: sanitizeInput(searchText),
      category:
        selectedCategories.length > 0 ? selectedCategories[0] : undefined,
      tags: [...selectedTags],
      status: statusFilter || undefined,
      popularity: minPopularity > 0 ? minPopularity : undefined,
      rating: minRating > 0 ? minRating : undefined,
      timestamp: new Date(),
    };

    const newSaved = [query, ...savedQueries.slice(0, 4)]; // Keep last 5
    setSavedQueries(newSaved);
    localStorage.setItem('wrfcoin-saved-queries', JSON.stringify(newSaved));
  }, [
    searchText,
    selectedCategories,
    selectedTags,
    statusFilter,
    minPopularity,
    minRating,
    savedQueries,
  ]);

  // Load saved query
  const loadQuery = useCallback((query: SearchQuery) => {
    setSearchText(query.text);
    setSelectedCategories(query.category ? [query.category] : []);
    setSelectedTags(query.tags);
    setStatusFilter(query.status || '');
    setMinRating(query.rating || 0);
    setMinPopularity(query.popularity || 0);
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchText('');
    setSelectedCategories([]);
    setSelectedTags([]);
    setStatusFilter('');
    setMinRating(0);
    setMinPopularity(0);
    setSetupComplexity('');
  }, []);

  return (
    <Card className={className} sx={{ mb: 2 }}>
      <CardContent>
        {/* Main Search Bar */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search integrations by name, description, or tags..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && saveSearchToHistory()}
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              ),
              endAdornment: searchText && (
                <IconButton size="small" onClick={() => setSearchText('')}>
                  <ClearIcon />
                </IconButton>
              ),
            }}
          />
          <IconButton
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            color={showAdvancedFilters ? 'primary' : 'default'}
          >
            <FilterIcon />
          </IconButton>
          <IconButton onClick={saveCurrentQuery} disabled={!searchText.trim()}>
            <BookmarkIcon />
          </IconButton>
        </Box>

        {/* Quick Filters */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {selectedCategories.map(category => (
            <Chip
              key={category}
              label={category}
              onDelete={() =>
                setSelectedCategories(prev => prev.filter(c => c !== category))
              }
              color="primary"
              size="small"
            />
          ))}
          {selectedTags.map(tag => (
            <Chip
              key={tag}
              label={tag}
              onDelete={() =>
                setSelectedTags(prev => prev.filter(t => t !== tag))
              }
              color="secondary"
              size="small"
            />
          ))}
          {statusFilter && (
            <Chip
              label={`Status: ${statusFilter}`}
              onDelete={() => setStatusFilter('')}
              color="info"
              size="small"
            />
          )}
          {(selectedCategories.length > 0 ||
            selectedTags.length > 0 ||
            statusFilter) && (
            <Chip
              label="Clear All"
              onClick={clearFilters}
              variant="outlined"
              size="small"
              deleteIcon={<ClearIcon />}
              onDelete={clearFilters}
            />
          )}
        </Box>

        {/* Advanced Filters */}
        <Accordion expanded={showAdvancedFilters}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">Advanced Filters</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Autocomplete
                  multiple
                  options={categories}
                  value={selectedCategories}
                  onChange={(_, newValue) => setSelectedCategories(newValue)}
                  renderInput={params => (
                    <TextField {...params} label="Categories" size="small" />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        {...getTagProps({ index })}
                        label={option}
                        size="small"
                        key={option}
                      />
                    ))
                  }
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Autocomplete
                  multiple
                  options={allTags}
                  value={selectedTags}
                  onChange={(_, newValue) => setSelectedTags(newValue)}
                  renderInput={params => (
                    <TextField {...params} label="Tags" size="small" />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        {...getTagProps({ index })}
                        label={option}
                        size="small"
                        key={option}
                      />
                    ))
                  }
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="">All</MenuItem>
                    {statuses.map(status => (
                      <MenuItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Complexity</InputLabel>
                  <Select
                    value={setupComplexity}
                    onChange={e => setSetupComplexity(e.target.value)}
                    label="Complexity"
                  >
                    <MenuItem value="">Any</MenuItem>
                    <MenuItem value="easy">Easy</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="advanced">Advanced</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <Box>
                  <Typography variant="caption" display="block">
                    Min Rating: {minRating}
                  </Typography>
                  <Rating
                    value={minRating}
                    onChange={(_, newValue) => setMinRating(newValue || 0)}
                    size="small"
                  />
                </Box>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Search History and Saved Queries */}
        {(searchHistory.length > 0 || savedQueries.length > 0) && (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {searchHistory.length > 0 && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 1, display: 'flex', alignItems: 'center' }}
                  >
                    <HistoryIcon sx={{ mr: 1, fontSize: 16 }} />
                    Recent Searches
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {searchHistory.slice(0, 3).map((query, index) => (
                      <Chip
                        key={index}
                        label={query.text}
                        size="small"
                        variant="outlined"
                        onClick={() => loadQuery(query)}
                        sx={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Box>
                </Grid>
              )}

              {savedQueries.length > 0 && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 1, display: 'flex', alignItems: 'center' }}
                  >
                    <BookmarkIcon sx={{ mr: 1, fontSize: 16 }} />
                    Saved Queries
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {savedQueries.slice(0, 3).map((query, index) => (
                      <Chip
                        key={index}
                        label={query.text}
                        size="small"
                        color="primary"
                        variant="outlined"
                        onClick={() => loadQuery(query)}
                        sx={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && !searchText && (
          <Box sx={{ mt: 2 }}>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1, display: 'flex', alignItems: 'center' }}
            >
              <TrendingIcon sx={{ mr: 1, fontSize: 16 }} />
              Recommended for You
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {recommendations.map(integration => (
                <Tooltip key={integration.id} title={integration.description}>
                  <Chip
                    label={integration.name}
                    size="small"
                    color="success"
                    variant="outlined"
                    onClick={() => onIntegrationSelect(integration)}
                    sx={{ cursor: 'pointer' }}
                    icon={
                      <Badge
                        badgeContent={integration.popularity}
                        color="primary"
                      >
                        <StarIcon sx={{ fontSize: 14 }} />
                      </Badge>
                    }
                  />
                </Tooltip>
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default AdvancedSearch;
