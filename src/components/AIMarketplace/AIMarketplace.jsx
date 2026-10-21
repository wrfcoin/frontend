import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import DemoSurfaceGate from '../common/DemoSurfaceGate';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  TextField,
  Tabs,
  Tab,
  Grid,
  Avatar,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  SmartToy,
  Speed,
  Memory,
  CloudUpload,
  Compare,
  Leaderboard,
  Star,
  RocketLaunch,
  TrendingUp,
  Search,
  FilterList,
  EmojiEvents,
  Public,
  People,
  DataUsage,
  Close,
} from '@mui/icons-material';

import ModelCard from './ModelCard';
import ModelDetail from './ModelDetail';
import ModelLeaderboard from './ModelLeaderboard';
import ModelBenchmark from './ModelBenchmark';
import ModelDeploy from './ModelDeploy';
import { TASK_TYPES, RESOLUTIONS, REGIONS, FRAMEWORKS } from './modelData';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const StatBox = ({ icon, value, label }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
    <Avatar sx={{ width: 40, height: 40, backgroundColor: '#3B82F622', color: '#3B82F6' }}>
      {icon}
    </Avatar>
    <Box>
      <Typography variant="h6" sx={{ color: '#F1F5F9', fontWeight: 700, lineHeight: 1.2 }}>
        {value}
      </Typography>
      <Typography variant="caption" sx={{ color: '#64748B' }}>
        {label}
      </Typography>
    </Box>
  </Box>
);

const FilterSection = ({ title, options, selected, onToggle }) => (
  <Box sx={{ mb: 2.5 }}>
    <Typography variant="subtitle2" sx={{ color: '#94A3B8', fontWeight: 600, mb: 1 }}>
      {title}
    </Typography>
    {options.map((opt) => (
      <FormControlLabel
        key={opt}
        control={
          <Checkbox
            checked={selected.includes(opt) || (opt === 'All' && selected.length === 0)}
            onChange={() => onToggle(opt)}
            size="small"
            sx={{
              color: '#334155',
              '&.Mui-checked': { color: '#3B82F6' },
              py: 0.3,
            }}
          />
        }
        label={
          <Typography variant="body2" sx={{ color: '#94A3B8', fontSize: '0.8rem' }}>
            {opt}
          </Typography>
        }
        sx={{ display: 'flex', m: 0 }}
      />
    ))}
  </Box>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const AIMarketplaceSample = () => {
  // Navigation state
  const [activeTab, setActiveTab] = useState(0);
  const [selectedModel, setSelectedModel] = useState(null);
  const [deployModel, setDeployModel] = useState(null);

  // Models data
  const [models, setModels] = useState([]);

  useEffect(() => {
    apiClient.get('/ai-marketplace/models')
      .then((data) => setModels(Array.isArray(data) ? data : (data.models ?? [])))
      .catch(() => setModels([]));
  }, []);

  const featuredModel = useMemo(
    () => models.find((m) => m.id === 'graphcast-65') || models[0] || null,
    [models],
  );

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sidebarFilters, setSidebarFilters] = useState({
    taskType: [],
    resolution: [],
    region: [],
    framework: [],
  });

  // Compare state
  const [compareModels, setCompareModels] = useState([]);
  const [showSidebar, setShowSidebar] = useState(true);

  const categoryChips = [
    { label: 'All', count: models.length },
    { label: 'Global NWP', count: models.filter((m) => m.taskType === 'Global NWP').length },
    { label: 'Regional NWP', count: models.filter((m) => m.taskType === 'Regional NWP').length },
    { label: 'Climate', count: models.filter((m) => m.taskType.includes('Climate')).length },
    { label: 'ML/AI', count: models.filter((m) => m.taskType === 'ML/AI Weather').length },
    { label: 'Data Assimilation', count: models.filter((m) => m.taskType === 'Data Assimilation').length },
    { label: 'Nowcasting', count: models.filter((m) => m.taskType.includes('Nowcasting')).length },
    { label: 'Hurricane', count: models.filter((m) => m.taskType === 'Hurricane').length },
    { label: 'Severe Weather', count: models.filter((m) => m.taskType === 'Severe Weather').length },
    { label: 'Wildfire', count: models.filter((m) => m.taskType === 'Wildfire').length },
    { label: 'Air Quality', count: models.filter((m) => m.taskType === 'Air Quality').length },
    { label: 'Hydrology', count: models.filter((m) => m.taskType === 'Hydrology').length },
    { label: 'Ocean', count: models.filter((m) => m.taskType.includes('Ocean')).length },
  ];

  // Filter logic
  const filteredModels = useMemo(() => {
    let result = [...models];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.publisher.toLowerCase().includes(q) ||
          m.taskType.toLowerCase().includes(q) ||
          m.framework.toLowerCase().includes(q),
      );
    }

    // Category chip
    if (categoryFilter !== 'All') {
      result = result.filter((m) => m.taskType.toLowerCase().includes(categoryFilter.toLowerCase()));
    }

    // Sidebar filters
    if (sidebarFilters.taskType.length > 0) {
      result = result.filter((m) =>
        sidebarFilters.taskType.some((t) => m.taskType.toLowerCase().includes(t.toLowerCase())),
      );
    }
    if (sidebarFilters.resolution.length > 0) {
      result = result.filter((m) => sidebarFilters.resolution.includes(m.resolution));
    }
    if (sidebarFilters.region.length > 0) {
      result = result.filter((m) => sidebarFilters.region.includes(m.region));
    }
    if (sidebarFilters.framework.length > 0) {
      result = result.filter((m) => sidebarFilters.framework.includes(m.framework));
    }

    return result;
  }, [models, searchQuery, categoryFilter, sidebarFilters]);

  const handleFilterToggle = useCallback((category, value) => {
    setSidebarFilters((prev) => {
      if (value === 'All') return { ...prev, [category]: [] };
      const current = prev[category];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [category]: next };
    });
  }, []);

  const handleCompareToggle = useCallback((model) => {
    setCompareModels((prev) => {
      const exists = prev.find((m) => m.id === model.id);
      if (exists) return prev.filter((m) => m.id !== model.id);
      if (prev.length >= 4) return prev;
      return [...prev, model];
    });
  }, []);

  const handleDeployModel = useCallback((model) => {
    setDeployModel(model);
    setActiveTab(3);
  }, []);

  const handleSelectModel = useCallback((model) => {
    setSelectedModel(model);
  }, []);

  // Styles
  const panelSx = {
    backgroundColor: '#1E293B',
    border: '1px solid #334155',
    borderRadius: 2,
    p: 2.5,
  };

  // If viewing model detail
  if (selectedModel) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#0F172A', p: 3 }}>
        <ModelDetail
          model={selectedModel}
          onBack={() => setSelectedModel(null)}
          onDeploy={handleDeployModel}
          onCompare={handleCompareToggle}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#0F172A' }}>
      {/* Top bar */}
      <Box
        sx={{
          px: 3,
          py: 2.5,
          borderBottom: '1px solid #1E293B',
          backgroundColor: '#0F172A',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SmartToy sx={{ color: '#3B82F6', fontSize: 32 }} />
            <Typography variant="h5" sx={{ color: '#F1F5F9', fontWeight: 700 }}>
              AI Model Marketplace
            </Typography>
          </Box>

          {/* Search bar */}
          <TextField
            placeholder="Search models, publishers, frameworks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: '#64748B', fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <Close sx={{ fontSize: 16, color: '#64748B' }} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              flex: 1,
              minWidth: 280,
              maxWidth: 500,
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#1E293B',
                color: '#F1F5F9',
                '& fieldset': { borderColor: '#334155' },
                '&:hover fieldset': { borderColor: '#3B82F6' },
                '&.Mui-focused fieldset': { borderColor: '#3B82F6' },
              },
              '& .MuiInputBase-input::placeholder': { color: '#64748B', opacity: 1 },
            }}
          />

          {/* Sidebar toggle */}
          <Tooltip title={showSidebar ? 'Hide filters' : 'Show filters'}>
            <IconButton
              onClick={() => setShowSidebar(!showSidebar)}
              sx={{ color: showSidebar ? '#3B82F6' : '#64748B' }}
            >
              <FilterList />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Category filter chips */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {categoryChips.map((cat) => (
            <Chip
              key={cat.label}
              label={`${cat.label} (${cat.count})`}
              onClick={() => setCategoryFilter(cat.label)}
              sx={{
                backgroundColor: categoryFilter === cat.label ? '#3B82F6' : '#1E293B',
                color: categoryFilter === cat.label ? '#FFFFFF' : '#94A3B8',
                border: '1px solid',
                borderColor: categoryFilter === cat.label ? '#3B82F6' : '#334155',
                fontWeight: 600,
                fontSize: '0.75rem',
                '&:hover': {
                  backgroundColor: categoryFilter === cat.label ? '#2563EB' : '#334155',
                },
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Featured model banner */}
      {activeTab === 0 && featuredModel && (
        <Box sx={{ px: 3, pt: 3 }}>
          <Paper
            sx={{
              background: 'linear-gradient(135deg, #1E3A5F 0%, #1E293B 50%, #1E3A5F 100%)',
              border: '1px solid #334155',
              borderRadius: 3,
              p: 3,
              mb: 3,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: -40,
                right: -40,
                width: 200,
                height: 200,
                borderRadius: '50%',
                background: 'radial-gradient(circle, #3B82F620 0%, transparent 70%)',
              }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
              <EmojiEvents sx={{ color: '#F59E0B', fontSize: 20 }} />
              <Typography variant="overline" sx={{ color: '#F59E0B', fontWeight: 700, letterSpacing: 1.5 }}>
                MODEL OF THE WEEK
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, flexWrap: 'wrap' }}>
              <Box sx={{ flex: 1, minWidth: 250 }}>
                <Typography variant="h4" sx={{ color: '#F1F5F9', fontWeight: 700, mb: 0.5 }}>
                  {featuredModel.name}
                </Typography>
                <Typography variant="body1" sx={{ color: '#94A3B8', mb: 2 }}>
                  by {featuredModel.publisher} &mdash; State-of-the-art graph neural network
                  weather prediction with {featuredModel.rmse.toFixed(2)}C RMSE globally. Outperforms
                  traditional NWP models at a fraction of the computational cost.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<RocketLaunch />}
                    onClick={() => handleDeployModel(featuredModel)}
                    sx={{
                      backgroundColor: '#3B82F6',
                      textTransform: 'none',
                      fontWeight: 600,
                      '&:hover': { backgroundColor: '#2563EB' },
                    }}
                  >
                    Deploy Now
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => handleSelectModel(featuredModel)}
                    sx={{
                      borderColor: '#334155',
                      color: '#94A3B8',
                      textTransform: 'none',
                      '&:hover': { borderColor: '#3B82F6', color: '#3B82F6' },
                    }}
                  >
                    View Details
                  </Button>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 3 }}>
                {[
                  { label: 'RMSE', value: `${featuredModel.rmse.toFixed(2)}C`, color: '#10B981' },
                  { label: 'Rating', value: featuredModel.rating.toFixed(1), color: '#F59E0B' },
                  { label: 'Downloads', value: featuredModel.downloads >= 1000 ? `${(featuredModel.downloads / 1000).toFixed(1)}K` : String(featuredModel.downloads), color: '#3B82F6' },
                ].map((stat) => (
                  <Box key={stat.label} sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ color: stat.color, fontWeight: 700 }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                      {stat.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Paper>
        </Box>
      )}

      {/* Stats bar */}
      <Box sx={{ px: 3 }}>
        <Paper
          sx={{
            ...panelSx,
            mb: 3,
            display: 'flex',
            justifyContent: 'space-around',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <StatBox icon={<SmartToy sx={{ fontSize: 20 }} />} value={String(models.length)} label="Models" />
          <StatBox icon={<People sx={{ fontSize: 20 }} />} value={String(new Set(models.map((m) => m.publisher)).size)} label="Publishers" />
          <StatBox icon={<DataUsage sx={{ fontSize: 20 }} />} value="4.8M" label="Predictions/day" />
          <StatBox icon={<Public sx={{ fontSize: 20 }} />} value={String(new Set(models.map((m) => m.region)).size)} label="Regions Covered" />
          <StatBox icon={<TrendingUp sx={{ fontSize: 20 }} />} value="99.7%" label="Uptime" />
        </Paper>
      </Box>

      {/* Tab navigation */}
      <Box sx={{ px: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => {
            setActiveTab(v);
            setDeployModel(null);
          }}
          sx={{
            mb: 3,
            '& .MuiTab-root': {
              color: '#64748B',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              minHeight: 44,
            },
            '& .Mui-selected': { color: '#3B82F6' },
            '& .MuiTabs-indicator': { backgroundColor: '#3B82F6', height: 3, borderRadius: '3px 3px 0 0' },
          }}
        >
          <Tab icon={<SmartToy sx={{ fontSize: 18 }} />} iconPosition="start" label="Browse" />
          <Tab icon={<Leaderboard sx={{ fontSize: 18 }} />} iconPosition="start" label="Leaderboard" />
          <Tab
            icon={<Compare sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label={`Benchmark${compareModels.length > 0 ? ` (${compareModels.length})` : ''}`}
          />
          <Tab icon={<RocketLaunch sx={{ fontSize: 18 }} />} iconPosition="start" label="Deploy" />
        </Tabs>
      </Box>

      {/* Tab: Browse */}
      {activeTab === 0 && (
        <Box sx={{ px: 3, pb: 4 }}>
          <Box sx={{ display: 'flex', gap: 3 }}>
            {/* Sidebar filters */}
            {showSidebar && (
              <Paper
                sx={{
                  ...panelSx,
                  width: 240,
                  flexShrink: 0,
                  alignSelf: 'flex-start',
                  position: 'sticky',
                  top: 130,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <FilterList sx={{ color: '#3B82F6', fontSize: 18 }} />
                  <Typography variant="subtitle1" sx={{ color: '#F1F5F9', fontWeight: 700 }}>
                    Filters
                  </Typography>
                </Box>

                <FilterSection
                  title="Task Type"
                  options={TASK_TYPES}
                  selected={sidebarFilters.taskType}
                  onToggle={(v) => handleFilterToggle('taskType', v)}
                />
                <FilterSection
                  title="Resolution"
                  options={RESOLUTIONS}
                  selected={sidebarFilters.resolution}
                  onToggle={(v) => handleFilterToggle('resolution', v)}
                />
                <FilterSection
                  title="Region"
                  options={REGIONS}
                  selected={sidebarFilters.region}
                  onToggle={(v) => handleFilterToggle('region', v)}
                />
                <FilterSection
                  title="Framework"
                  options={FRAMEWORKS}
                  selected={sidebarFilters.framework}
                  onToggle={(v) => handleFilterToggle('framework', v)}
                />

                {(sidebarFilters.taskType.length > 0 ||
                  sidebarFilters.resolution.length > 0 ||
                  sidebarFilters.region.length > 0 ||
                  sidebarFilters.framework.length > 0) && (
                  <Button
                    fullWidth
                    size="small"
                    onClick={() =>
                      setSidebarFilters({ taskType: [], resolution: [], region: [], framework: [] })
                    }
                    sx={{ color: '#EF4444', textTransform: 'none', mt: 1 }}
                  >
                    Clear All Filters
                  </Button>
                )}
              </Paper>
            )}

            {/* Model grid */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {/* Results count */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#64748B' }}>
                  Showing {filteredModels.length} of {models.length} models
                </Typography>
                {compareModels.length > 0 && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Compare sx={{ fontSize: 16 }} />}
                    onClick={() => setActiveTab(2)}
                    sx={{
                      borderColor: '#3B82F6',
                      color: '#3B82F6',
                      textTransform: 'none',
                      fontWeight: 600,
                      '&:hover': { backgroundColor: '#3B82F611' },
                    }}
                  >
                    Compare {compareModels.length} Models
                  </Button>
                )}
              </Box>

              <Grid container spacing={2.5}>
                {filteredModels.map((model) => (
                  <Grid item xs={12} sm={6} md={showSidebar ? 4 : 3} key={model.id}>
                    <ModelCard
                      model={model}
                      onSelect={handleSelectModel}
                      onDeploy={handleDeployModel}
                      onCompare={handleCompareToggle}
                      isCompareSelected={compareModels.some((m) => m.id === model.id)}
                    />
                  </Grid>
                ))}
              </Grid>

              {filteredModels.length === 0 && (
                <Paper sx={{ ...panelSx, textAlign: 'center', py: 8 }}>
                  <SmartToy sx={{ fontSize: 48, color: '#334155', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: '#94A3B8' }}>
                    No models match your search criteria
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748B', mt: 1 }}>
                    Try adjusting your filters or search query
                  </Typography>
                </Paper>
              )}
            </Box>
          </Box>
        </Box>
      )}

      {/* Tab: Leaderboard */}
      {activeTab === 1 && (
        <Box sx={{ px: 3, pb: 4 }}>
          <ModelLeaderboard
            onSelectModel={handleSelectModel}
            onChallenge={() => {}}
          />
        </Box>
      )}

      {/* Tab: Benchmark (Compare) */}
      {activeTab === 2 && (
        <Box sx={{ px: 3, pb: 4 }}>
          <ModelBenchmark
            allModels={models}
            selectedModels={compareModels}
            onModelsChange={setCompareModels}
            onDeploy={handleDeployModel}
          />
        </Box>
      )}

      {/* Tab: Deploy */}
      {activeTab === 3 && (
        <Box sx={{ px: 3, pb: 4 }}>
          <ModelDeploy
            model={deployModel}
            allModels={models}
            onBack={() => setActiveTab(0)}
          />
        </Box>
      )}
    </Box>
  );
};

export default function AIMarketplace() {
  return <DemoSurfaceGate testId="ai-marketplace" title="AI marketplace is unavailable"
    description="The AI marketplace API is not served by the testnet. Model usage, uptime and deployment controls are illustrative only.">
    <AIMarketplaceSample />
  </DemoSurfaceGate>;
}
