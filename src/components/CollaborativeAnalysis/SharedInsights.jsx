import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Avatar,
  Chip,
  Grid,
  IconButton,
  Tooltip,
  Divider,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import {
  ThumbUp as LikeIcon,
  ThumbUpOutlined as LikeOutlinedIcon,
  ChatBubbleOutline as CommentIcon,
  BookmarkBorder as BookmarkOutlinedIcon,
  Bookmark as BookmarkIcon,
  ForkRight as ForkIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as RecentIcon,
  Public as PublicIcon,
  Whatshot as FeaturedIcon,
} from '@mui/icons-material';
import { apiClient } from '../../services/apiClient';

// ---------------------------------------------------------------------------
// Theme constants
// ---------------------------------------------------------------------------
const BG_ROOT = '#0F172A';
const BG_CARD = '#1E293B';
const BORDER = '#334155';
const PRIMARY = '#3B82F6';
const SUCCESS = '#10B981';
const WARNING = '#F59E0B';
const ERROR = '#EF4444';
const TEXT_SECONDARY = '#94A3B8';
const PURPLE = '#8B5CF6';
const CYAN = '#06B6D4';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getInitials(name) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2);
}

function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getTagColor(tag) {
  const tagColors = {
    'Tropical': ERROR,
    'ENSO': CYAN,
    'Verification': PRIMARY,
    'Climate': SUCCESS,
    'Severe Weather': WARNING,
    'Data Quality': PURPLE,
    'Seasonal': CYAN,
    'Arctic': '#60A5FA',
    'Precipitation': '#34D399',
    'Temperature': ERROR,
    'Station Network': PURPLE,
    'Model Comparison': PRIMARY,
    'Drought': WARNING,
    'Mesoscale': ERROR,
  };
  return tagColors[tag] || TEXT_SECONDARY;
}


// ---------------------------------------------------------------------------
// Filter options
// ---------------------------------------------------------------------------
const TOPIC_OPTIONS = ['All Topics', 'Tropical', 'Climate', 'Verification', 'Severe Weather', 'Data Quality'];
const REGION_OPTIONS = ['All Regions', 'Global', 'North America', 'Atlantic', 'Central US', 'Arctic'];
const SORT_OPTIONS = [
  { value: 'recent', label: 'Most Recent', icon: <RecentIcon sx={{ fontSize: 16 }} /> },
  { value: 'popular', label: 'Most Popular', icon: <TrendingUpIcon sx={{ fontSize: 16 }} /> },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function InsightCard({ insight, onFork, onToggleLike, onToggleBookmark, liked, bookmarked }) {
  return (
    <Paper
      sx={{
        bgcolor: BG_CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 2,
        p: 2.5,
        transition: 'border-color 0.2s',
        '&:hover': { borderColor: `${BORDER}CC` },
      }}
    >
      {/* Author row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        <Avatar
          sx={{
            bgcolor: insight.author.color,
            width: 32,
            height: 32,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {getInitials(insight.author.name)}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>
            {insight.author.name}
          </Typography>
          <Typography variant="caption" sx={{ color: TEXT_SECONDARY, fontSize: 11 }}>
            {formatDate(insight.publishedDate)}
          </Typography>
        </Box>
        <Tooltip title={bookmarked ? 'Remove bookmark' : 'Bookmark'}>
          <IconButton
            size="small"
            onClick={() => onToggleBookmark(insight.id)}
            sx={{ color: bookmarked ? WARNING : TEXT_SECONDARY }}
          >
            {bookmarked ? <BookmarkIcon sx={{ fontSize: 18 }} /> : <BookmarkOutlinedIcon sx={{ fontSize: 18 }} />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Title */}
      <Typography
        variant="subtitle2"
        sx={{
          color: '#fff',
          fontWeight: 700,
          lineHeight: 1.4,
          mb: 1,
          cursor: 'pointer',
          '&:hover': { color: PRIMARY },
          transition: 'color 0.15s',
        }}
      >
        {insight.title}
      </Typography>

      {/* Abstract (2 lines) */}
      <Typography
        variant="body2"
        sx={{
          color: TEXT_SECONDARY,
          fontSize: 12,
          lineHeight: 1.6,
          mb: 1.5,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {insight.abstract}
      </Typography>

      {/* Tags */}
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1.5 }}>
        {insight.tags.map((tag) => (
          <Chip
            key={tag}
            label={tag}
            size="small"
            sx={{
              bgcolor: `${getTagColor(tag)}12`,
              color: getTagColor(tag),
              fontSize: 10,
              height: 20,
              fontWeight: 500,
              '& .MuiChip-label': { px: 0.8 },
            }}
          />
        ))}
      </Box>

      {/* Footer actions */}
      <Divider sx={{ borderColor: BORDER, mb: 1 }} />
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tooltip title={liked ? 'Unlike' : 'Like'}>
            <Box
              onClick={() => onToggleLike(insight.id)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                cursor: 'pointer',
                color: liked ? PRIMARY : TEXT_SECONDARY,
                transition: 'color 0.15s',
                '&:hover': { color: PRIMARY },
              }}
            >
              {liked ? <LikeIcon sx={{ fontSize: 16 }} /> : <LikeOutlinedIcon sx={{ fontSize: 16 }} />}
              <Typography variant="caption" sx={{ fontWeight: 600, fontSize: 12 }}>
                {insight.likeCount + (liked ? 1 : 0)}
              </Typography>
            </Box>
          </Tooltip>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: TEXT_SECONDARY }}>
            <CommentIcon sx={{ fontSize: 16 }} />
            <Typography variant="caption" sx={{ fontSize: 12 }}>
              {insight.commentCount}
            </Typography>
          </Box>
        </Box>
        <Tooltip title="Fork as editable copy">
          <Button
            size="small"
            startIcon={<ForkIcon sx={{ fontSize: 14 }} />}
            onClick={() => onFork(insight)}
            sx={{
              color: TEXT_SECONDARY,
              textTransform: 'none',
              fontSize: 11,
              fontWeight: 500,
              borderRadius: 1.5,
              px: 1.5,
              minHeight: 28,
              '&:hover': { color: PRIMARY, bgcolor: `${PRIMARY}10` },
            }}
          >
            Fork
          </Button>
        </Tooltip>
      </Box>
    </Paper>
  );
}

function FeaturedInsightCard({ insight, onFork, onToggleLike, onToggleBookmark, liked, bookmarked }) {
  return (
    <Paper
      sx={{
        bgcolor: BG_CARD,
        border: `1px solid ${PRIMARY}30`,
        borderRadius: 2,
        p: 2.5,
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 0.2s, transform 0.2s',
        '&:hover': { borderColor: PRIMARY, transform: 'translateY(-2px)' },
      }}
    >
      {/* Featured badge */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          bgcolor: `${WARNING}20`,
          borderBottomLeftRadius: 8,
          px: 1.5,
          py: 0.5,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
        }}
      >
        <StarIcon sx={{ fontSize: 12, color: WARNING }} />
        <Typography variant="caption" sx={{ color: WARNING, fontSize: 10, fontWeight: 700 }}>
          Featured
        </Typography>
      </Box>

      {/* Author */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Avatar
          sx={{
            bgcolor: insight.author.color,
            width: 28,
            height: 28,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {getInitials(insight.author.name)}
        </Avatar>
        <Box>
          <Typography variant="caption" sx={{ color: '#fff', fontWeight: 600, fontSize: 12, display: 'block', lineHeight: 1.2 }}>
            {insight.author.name}
          </Typography>
          <Typography variant="caption" sx={{ color: TEXT_SECONDARY, fontSize: 10 }}>
            {formatDate(insight.publishedDate)}
          </Typography>
        </Box>
      </Box>

      {/* Title */}
      <Typography
        variant="subtitle2"
        sx={{
          color: '#fff',
          fontWeight: 700,
          lineHeight: 1.35,
          mb: 1,
          flex: 1,
          cursor: 'pointer',
          '&:hover': { color: PRIMARY },
          transition: 'color 0.15s',
        }}
      >
        {insight.title}
      </Typography>

      {/* Tags */}
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1.5 }}>
        {insight.tags.slice(0, 2).map((tag) => (
          <Chip
            key={tag}
            label={tag}
            size="small"
            sx={{
              bgcolor: `${getTagColor(tag)}12`,
              color: getTagColor(tag),
              fontSize: 10,
              height: 18,
              fontWeight: 500,
            }}
          />
        ))}
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          onClick={() => onToggleLike(insight.id)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.3,
            cursor: 'pointer',
            color: liked ? PRIMARY : TEXT_SECONDARY,
            '&:hover': { color: PRIMARY },
          }}
        >
          {liked ? <LikeIcon sx={{ fontSize: 14 }} /> : <LikeOutlinedIcon sx={{ fontSize: 14 }} />}
          <Typography variant="caption" sx={{ fontSize: 11 }}>
            {insight.likeCount + (liked ? 1 : 0)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, color: TEXT_SECONDARY }}>
          <CommentIcon sx={{ fontSize: 14 }} />
          <Typography variant="caption" sx={{ fontSize: 11 }}>
            {insight.commentCount}
          </Typography>
        </Box>
        <Box sx={{ ml: 'auto' }}>
          <Tooltip title={bookmarked ? 'Remove bookmark' : 'Bookmark'}>
            <IconButton
              size="small"
              onClick={() => onToggleBookmark(insight.id)}
              sx={{ color: bookmarked ? WARNING : TEXT_SECONDARY, p: 0.3 }}
            >
              {bookmarked ? <BookmarkIcon sx={{ fontSize: 16 }} /> : <BookmarkOutlinedIcon sx={{ fontSize: 16 }} />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Paper>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
function SharedInsights() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All Topics');
  const [selectedRegion, setSelectedRegion] = useState('All Regions');
  const [sortBy, setSortBy] = useState('recent');
  const [likedInsights, setLikedInsights] = useState({});
  const [bookmarkedInsights, setBookmarkedInsights] = useState({});
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    apiClient.get('/collaborative/insights')
      .then((data) => setInsights(Array.isArray(data) ? data : (data.insights ?? [])))
      .catch(() => setInsights([]));
  }, []);

  const handleToggleLike = useCallback((insightId) => {
    setLikedInsights((prev) => ({ ...prev, [insightId]: !prev[insightId] }));
  }, []);

  const handleToggleBookmark = useCallback((insightId) => {
    setBookmarkedInsights((prev) => ({ ...prev, [insightId]: !prev[insightId] }));
  }, []);

  const handleFork = useCallback((insight) => {
    // In production, this would create a copy in the user's workspace
  }, []);

  const featuredInsights = useMemo(
    () => insights.filter((i) => i.featured),
    [insights],
  );

  const filteredInsights = useMemo(() => {
    let result = insights;

    if (selectedTopic !== 'All Topics') {
      result = result.filter((i) => i.topic === selectedTopic);
    }

    if (selectedRegion !== 'All Regions') {
      result = result.filter((i) => i.region === selectedRegion);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.abstract.toLowerCase().includes(q) ||
          i.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    if (sortBy === 'popular') {
      result = [...result].sort((a, b) => b.likeCount - a.likeCount);
    } else {
      result = [...result].sort(
        (a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime(),
      );
    }

    return result;
  }, [selectedTopic, selectedRegion, searchQuery, sortBy, insights]);

  return (
    <Box sx={{ bgcolor: BG_ROOT, minHeight: '100vh', p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, letterSpacing: '-0.01em' }}>
            Shared Insights
          </Typography>
          <Typography variant="body2" sx={{ color: TEXT_SECONDARY, mt: 0.5 }}>
            Community-published weather analyses and research findings
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PublicIcon sx={{ color: TEXT_SECONDARY, fontSize: 18 }} />
          <Typography variant="body2" sx={{ color: TEXT_SECONDARY }}>
            {insights.length} published insights
          </Typography>
        </Box>
      </Box>

      {/* Featured Insights */}
      <Paper
        sx={{
          bgcolor: `${PRIMARY}06`,
          border: `1px solid ${PRIMARY}20`,
          borderRadius: 2,
          p: 2.5,
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <FeaturedIcon sx={{ color: WARNING, fontSize: 20 }} />
          <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700 }}>
            Featured Insights
          </Typography>
        </Box>
        <Grid container spacing={2}>
          {featuredInsights.map((insight) => (
            <Grid item xs={12} md={4} key={insight.id}>
              <FeaturedInsightCard
                insight={insight}
                onFork={handleFork}
                onToggleLike={handleToggleLike}
                onToggleBookmark={handleToggleBookmark}
                liked={!!likedInsights[insight.id]}
                bookmarked={!!bookmarkedInsights[insight.id]}
              />
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Search & Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search insights..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: TEXT_SECONDARY, fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            minWidth: 260,
            '& .MuiOutlinedInput-root': {
              bgcolor: BG_CARD,
              color: '#fff',
              borderRadius: 2,
              '& fieldset': { borderColor: BORDER },
              '&:hover fieldset': { borderColor: TEXT_SECONDARY },
              '&.Mui-focused fieldset': { borderColor: PRIMARY },
            },
            '& input::placeholder': { color: TEXT_SECONDARY, opacity: 1 },
          }}
        />

        <Divider orientation="vertical" flexItem sx={{ borderColor: BORDER }} />

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <Select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            sx={{
              bgcolor: BG_CARD,
              color: '#fff',
              borderRadius: 2,
              fontSize: 13,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: TEXT_SECONDARY },
              '& .MuiSvgIcon-root': { color: TEXT_SECONDARY },
            }}
          >
            {TOPIC_OPTIONS.map((t) => (
              <MenuItem key={t} value={t} sx={{ fontSize: 13 }}>
                {t}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <Select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            sx={{
              bgcolor: BG_CARD,
              color: '#fff',
              borderRadius: 2,
              fontSize: 13,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: TEXT_SECONDARY },
              '& .MuiSvgIcon-root': { color: TEXT_SECONDARY },
            }}
          >
            {REGION_OPTIONS.map((r) => (
              <MenuItem key={r} value={r} sx={{ fontSize: 13 }}>
                {r}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ ml: 'auto', display: 'flex', border: `1px solid ${BORDER}`, borderRadius: 1, overflow: 'hidden' }}>
          {SORT_OPTIONS.map((opt) => (
            <Tooltip key={opt.value} title={opt.label}>
              <IconButton
                size="small"
                onClick={() => setSortBy(opt.value)}
                sx={{
                  borderRadius: 0,
                  bgcolor: sortBy === opt.value ? `${PRIMARY}25` : 'transparent',
                  color: sortBy === opt.value ? PRIMARY : TEXT_SECONDARY,
                  px: 1.5,
                  '&:hover': { bgcolor: `${PRIMARY}15` },
                }}
              >
                {opt.icon}
              </IconButton>
            </Tooltip>
          ))}
        </Box>
      </Box>

      {/* Insights feed */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {filteredInsights.map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            onFork={handleFork}
            onToggleLike={handleToggleLike}
            onToggleBookmark={handleToggleBookmark}
            liked={!!likedInsights[insight.id]}
            bookmarked={!!bookmarkedInsights[insight.id]}
          />
        ))}
      </Box>

      {/* Empty state */}
      {filteredInsights.length === 0 && (
        <Paper
          sx={{
            bgcolor: BG_CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: 2,
            p: 6,
            textAlign: 'center',
          }}
        >
          <PublicIcon sx={{ color: TEXT_SECONDARY, fontSize: 48, mb: 1 }} />
          <Typography variant="subtitle1" sx={{ color: '#fff', mb: 0.5 }}>
            No insights found
          </Typography>
          <Typography variant="body2" sx={{ color: TEXT_SECONDARY }}>
            Try adjusting your search or filters
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

export default SharedInsights;
