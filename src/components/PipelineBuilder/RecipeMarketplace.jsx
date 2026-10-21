import DemoSurfaceGate from '../common/DemoSurfaceGate';
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Chip,
  IconButton,
  Tooltip,
  InputAdornment,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  Avatar,
} from '@mui/material';
import {
  Search as SearchIcon,
  GetApp as DownloadIcon,
  Visibility as PreviewIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  AccountTree as PipelineIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  CloudDownload as CloudDownloadIcon,
} from '@mui/icons-material';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const colors = {
  bg: '#0F172A',
  card: '#1E293B',
  border: '#334155',
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  purple: '#8B5CF6',
};

const CATEGORIES = [
  { key: 'all', label: 'All Recipes' },
  { key: 'quality', label: 'Quality Analysis' },
  { key: 'forecasting', label: 'Forecasting' },
  { key: 'alerting', label: 'Alerting' },
  { key: 'cleaning', label: 'Data Cleaning' },
  { key: 'ml', label: 'ML Pipelines' },
];


// ---------------------------------------------------------------------------
// Recipe Card
// ---------------------------------------------------------------------------

const NODE_COLORS = {
  source: '#3B82F6',
  transform: '#F59E0B',
  ml: '#8B5CF6',
  output: '#10B981',
};

function RecipeCard({ recipe, onUseTemplate, onPreview }) {
  return (
    <Paper
      sx={{
        bgcolor: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: 2,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 0.2s, transform 0.15s',
        '&:hover': { borderColor: colors.primary, transform: 'translateY(-2px)' },
      }}
    >
      {/* Mini pipeline preview */}
      <Box sx={{ px: 2, pt: 2, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
          {recipe.nodes.map((node, i) => (
            <React.Fragment key={i}>
              <Tooltip title={node.label}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    bgcolor: `${NODE_COLORS[node.type]}33`,
                    border: `2px solid ${NODE_COLORS[node.type]}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.55rem',
                    fontWeight: 700,
                    color: NODE_COLORS[node.type],
                  }}
                >
                  {node.type[0].toUpperCase()}
                </Box>
              </Tooltip>
              {i < recipe.nodes.length - 1 && (
                <Box sx={{ width: 12, height: 2, bgcolor: colors.border, borderRadius: 1 }} />
              )}
            </React.Fragment>
          ))}
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="subtitle2" sx={{ color: colors.text, fontWeight: 700, mb: 0.5, lineHeight: 1.3 }}>
          {recipe.name}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Avatar sx={{ width: 20, height: 20, fontSize: '0.6rem', bgcolor: colors.purple }}>{recipe.authorAvatar}</Avatar>
          <Typography variant="caption" sx={{ color: colors.textSecondary }}>{recipe.author}</Typography>
        </Box>

        <Typography
          variant="body2"
          sx={{
            color: colors.textSecondary,
            fontSize: '0.75rem',
            lineHeight: 1.5,
            mb: 1.5,
            flex: 1,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {recipe.description}
        </Typography>

        {/* Tags */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
          {recipe.tags.slice(0, 3).map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.6rem',
                bgcolor: `${colors.primary}22`,
                color: colors.primary,
                border: `1px solid ${colors.primary}44`,
              }}
            />
          ))}
          {recipe.tags.length > 3 && (
            <Chip
              label={`+${recipe.tags.length - 3}`}
              size="small"
              sx={{ height: 20, fontSize: '0.6rem', bgcolor: colors.bg, color: colors.textSecondary }}
            />
          )}
        </Box>

        {/* Stats */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Rating
              value={recipe.rating}
              precision={0.1}
              readOnly
              size="small"
              sx={{ '& .MuiRating-iconFilled': { color: colors.warning }, '& .MuiRating-iconEmpty': { color: colors.border } }}
            />
            <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: '0.7rem' }}>
              {recipe.rating}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CloudDownloadIcon sx={{ fontSize: 14, color: colors.textSecondary }} />
            <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: '0.7rem' }}>
              {recipe.downloads.toLocaleString()}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ borderColor: colors.border, mb: 1.5 }} />

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<DownloadIcon sx={{ fontSize: 14 }} />}
            onClick={() => onUseTemplate(recipe)}
            sx={{
              flex: 1,
              bgcolor: colors.primary,
              '&:hover': { bgcolor: '#2563EB' },
              textTransform: 'none',
              fontSize: '0.75rem',
              py: 0.5,
            }}
          >
            Use Template
          </Button>
          <Tooltip title="Preview Pipeline">
            <IconButton
              size="small"
              onClick={() => onPreview(recipe)}
              sx={{ color: colors.textSecondary, border: `1px solid ${colors.border}`, borderRadius: 1 }}
            >
              <PreviewIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Paper>
  );
}

// ---------------------------------------------------------------------------
// Preview Dialog
// ---------------------------------------------------------------------------

function PreviewDialog({ recipe, open, onClose, onUseTemplate }) {
  if (!recipe) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: colors.card,
          border: `1px solid ${colors.border}`,
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ color: colors.text, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{recipe.name}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Avatar sx={{ width: 20, height: 20, fontSize: '0.6rem', bgcolor: colors.purple }}>{recipe.authorAvatar}</Avatar>
            <Typography variant="caption" sx={{ color: colors.textSecondary }}>{recipe.author}</Typography>
            <Chip label={`${recipe.nodeCount} nodes`} size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: colors.bg, color: colors.textSecondary }} />
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: colors.textSecondary }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 3 }}>
          {recipe.description}
        </Typography>

        {/* Pipeline visualization */}
        <Paper sx={{ bgcolor: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 2, p: 3, mb: 3 }}>
          <Typography variant="subtitle2" sx={{ color: colors.text, mb: 2, fontWeight: 600 }}>Pipeline Flow</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 1 }}>
            {recipe.nodes.map((node, i) => (
              <React.Fragment key={i}>
                <Paper
                  sx={{
                    bgcolor: colors.card,
                    border: `1px solid ${NODE_COLORS[node.type]}`,
                    borderRadius: 1.5,
                    px: 2,
                    py: 1,
                    textAlign: 'center',
                    minWidth: 100,
                  }}
                >
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: `${NODE_COLORS[node.type]}22`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 0.5,
                    }}
                  >
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: NODE_COLORS[node.type] }}>
                      {node.type[0].toUpperCase()}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: colors.text, fontWeight: 600, fontSize: '0.7rem' }}>
                    {node.label}
                  </Typography>
                </Paper>
                {i < recipe.nodes.length - 1 && (
                  <Typography sx={{ color: colors.border, fontSize: '1.2rem' }}>&#8594;</Typography>
                )}
              </React.Fragment>
            ))}
          </Box>
        </Paper>

        {/* Tags & meta */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
          {recipe.tags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              sx={{ bgcolor: `${colors.primary}22`, color: colors.primary, border: `1px solid ${colors.primary}44` }}
            />
          ))}
        </Box>
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Rating
              value={recipe.rating}
              precision={0.1}
              readOnly
              size="small"
              sx={{ '& .MuiRating-iconFilled': { color: colors.warning }, '& .MuiRating-iconEmpty': { color: colors.border } }}
            />
            <Typography variant="body2" sx={{ color: colors.textSecondary }}>{recipe.rating} / 5</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CloudDownloadIcon sx={{ fontSize: 16, color: colors.textSecondary }} />
            <Typography variant="body2" sx={{ color: colors.textSecondary }}>{recipe.downloads.toLocaleString()} downloads</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ScheduleIcon sx={{ fontSize: 16, color: colors.textSecondary }} />
            <Typography variant="body2" sx={{ color: colors.textSecondary }}>Updated {recipe.updatedAt}</Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.border}` }}>
        <Button onClick={onClose} sx={{ color: colors.textSecondary, textTransform: 'none' }}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={() => { onUseTemplate(recipe); onClose(); }}
          sx={{ bgcolor: colors.primary, '&:hover': { bgcolor: '#2563EB' }, textTransform: 'none' }}
        >
          Use This Template
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const RecipeMarketplaceSample = ({ onUseTemplate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [previewRecipe, setPreviewRecipe] = useState(null);
  const [sortBy, setSortBy] = useState('downloads'); // 'downloads' | 'rating' | 'recent'
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    apiClient.get('/pipeline/recipes')
      .then((data) => setRecipes(Array.isArray(data) ? data : (data.recipes ?? [])))
      .catch(() => setRecipes([]));
  }, []);

  const filteredRecipes = useMemo(() => {
    let results = recipes;

    // Category filter
    if (selectedCategory !== 'all') {
      results = results.filter((r) => r.category === selectedCategory);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          r.description.toLowerCase().includes(query) ||
          r.tags.some((t) => t.toLowerCase().includes(query)) ||
          r.author.toLowerCase().includes(query),
      );
    }

    // Sort
    results = [...results].sort((a, b) => {
      if (sortBy === 'downloads') return b.downloads - a.downloads;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'recent') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      return 0;
    });

    return results;
  }, [recipes, searchQuery, selectedCategory, sortBy]);

  const handleUseTemplate = useCallback((recipe) => {
    if (onUseTemplate) {
      onUseTemplate(recipe);
    }
  }, [onUseTemplate]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Search & Filter Bar */}
      <Paper
        sx={{
          bgcolor: colors.card,
          border: `1px solid ${colors.border}`,
          borderRadius: 2,
          p: 2,
          mb: 2,
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Search recipes by name, tag, or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: colors.textSecondary, fontSize: 18 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& input': { color: colors.text },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border },
              '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.primary },
            }}
          />
          <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
            {[
              { key: 'downloads', label: 'Popular', icon: <TrendingUpIcon sx={{ fontSize: 14 }} /> },
              { key: 'rating', label: 'Top Rated', icon: <StarIcon sx={{ fontSize: 14 }} /> },
              { key: 'recent', label: 'Recent', icon: <ScheduleIcon sx={{ fontSize: 14 }} /> },
            ].map((s) => (
              <Chip
                key={s.key}
                icon={s.icon}
                label={s.label}
                size="small"
                onClick={() => setSortBy(s.key)}
                variant={sortBy === s.key ? 'filled' : 'outlined'}
                sx={{
                  color: sortBy === s.key ? '#fff' : colors.textSecondary,
                  bgcolor: sortBy === s.key ? colors.primary : 'transparent',
                  borderColor: colors.border,
                  '& .MuiChip-icon': { color: sortBy === s.key ? '#fff' : colors.textSecondary },
                  '&:hover': { bgcolor: sortBy === s.key ? '#2563EB' : 'rgba(59,130,246,0.1)' },
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Category chips */}
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {CATEGORIES.map((cat) => (
            <Chip
              key={cat.key}
              label={cat.label}
              size="small"
              onClick={() => setSelectedCategory(cat.key)}
              variant={selectedCategory === cat.key ? 'filled' : 'outlined'}
              sx={{
                color: selectedCategory === cat.key ? '#fff' : colors.textSecondary,
                bgcolor: selectedCategory === cat.key ? colors.primary : 'transparent',
                borderColor: colors.border,
                '&:hover': { bgcolor: selectedCategory === cat.key ? '#2563EB' : 'rgba(59,130,246,0.1)' },
              }}
            />
          ))}
        </Box>
      </Paper>

      {/* Results count */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexShrink: 0 }}>
        <Typography variant="body2" sx={{ color: colors.textSecondary }}>
          {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''} found
        </Typography>
      </Box>

      {/* Recipe Grid */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {filteredRecipes.length > 0 ? (
          <Grid container spacing={2}>
            {filteredRecipes.map((recipe) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={recipe.id}>
                <RecipeCard
                  recipe={recipe}
                  onUseTemplate={handleUseTemplate}
                  onPreview={setPreviewRecipe}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8,
            }}
          >
            <PipelineIcon sx={{ fontSize: 48, color: colors.border, mb: 2 }} />
            <Typography variant="body1" sx={{ color: colors.textSecondary, mb: 0.5 }}>
              No recipes match your search
            </Typography>
            <Typography variant="caption" sx={{ color: colors.border }}>
              Try adjusting your filters or search terms
            </Typography>
          </Box>
        )}
      </Box>

      {/* Preview Dialog */}
      <PreviewDialog
        recipe={previewRecipe}
        open={!!previewRecipe}
        onClose={() => setPreviewRecipe(null)}
        onUseTemplate={handleUseTemplate}
      />
    </Box>
  );
};

export default function RecipeMarketplace(props) {
  return <DemoSurfaceGate testId="pipeline-recipes" title="Pipeline recipes are unavailable"
    description="The recipe catalog API is not served by the testnet. Any enabled preview is illustrative.">
    <RecipeMarketplaceSample {...props} />
  </DemoSurfaceGate>;
}
