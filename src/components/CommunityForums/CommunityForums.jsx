import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import {
  Box,
  Typography,
  Paper,
  Button,
  Avatar,
  AvatarGroup,
  Chip,
  TextField,
  Tabs,
  Tab,
  IconButton,
  Badge,
  Grid,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import ForumIcon from '@mui/icons-material/Forum';
import GroupsIcon from '@mui/icons-material/Groups';
import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import BuildIcon from '@mui/icons-material/Build';
import VerifiedIcon from '@mui/icons-material/Verified';
import BugReportIcon from '@mui/icons-material/BugReport';
import StorefrontIcon from '@mui/icons-material/Storefront';
import CodeIcon from '@mui/icons-material/Code';
import CampaignIcon from '@mui/icons-material/Campaign';
import PublicIcon from '@mui/icons-material/Public';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import { apiClient } from '../../services/apiClient';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLORS = {
  bg: '#0F172A',
  card: '#1E293B',
  cardHover: '#263548',
  border: '#334155',
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  purple: '#8B5CF6',
  pink: '#EC4899',
};

const STATS = [
  { label: 'Members', value: '4,832' },
  { label: 'Posts', value: '1,247' },
  { label: 'Cooperatives', value: '89' },
  { label: 'Regions', value: '32' },
];

const COOPERATIVE_FORUMS = [
  {
    id: 'coop-01',
    name: 'NYC Data Network',
    color: '#3B82F6',
    avatar: 'NY',
    members: 24,
    topics: 42,
    posts: 318,
    description: 'Forum for NYC Data Network cooperative members to discuss local weather data, station coordination, and shared forecasting.',
    recentTopics: [
      { id: 'ct-1', title: 'Best station placement tips for NYC rooftops', author: 'NYCWeather.wrf', replies: 23, time: '2 hours ago' },
      { id: 'ct-2', title: 'Winter calibration schedule reminder', author: 'HarlemHigh.wrf', replies: 8, time: '5 hours ago' },
      { id: 'ct-3', title: 'Data quality improvements this quarter', author: 'BrooklynWx.wrf', replies: 15, time: '1 day ago' },
    ],
  },
  {
    id: 'coop-02',
    name: 'Alpine Weather Collective',
    color: '#8B5CF6',
    avatar: 'AO',
    members: 15,
    topics: 28,
    posts: 196,
    description: 'High-altitude weather monitoring discussions, avalanche data sharing, and mountain forecasting coordination.',
    recentTopics: [
      { id: 'ct-4', title: 'Avalanche risk prediction model improvements', author: 'AlpineObserver.wrf', replies: 19, time: '3 hours ago' },
      { id: 'ct-5', title: 'New station deployed at 3200m elevation', author: 'SwissHigh.wrf', replies: 11, time: '8 hours ago' },
    ],
  },
  {
    id: 'coop-03',
    name: 'Harbor Watch',
    color: '#0891B2',
    avatar: 'CN',
    members: 18,
    topics: 19,
    posts: 134,
    description: 'Coastal and maritime weather discussions, sea-level data analysis, and marine forecasting coordination.',
    recentTopics: [
      { id: 'ct-6', title: 'Tidal surge tracking for nor\'easters', author: 'CoastalNJ.wrf', replies: 14, time: '6 hours ago' },
      { id: 'ct-7', title: 'New buoy data integration discussion', author: 'HarborView.wrf', replies: 7, time: '1 day ago' },
    ],
  },
  {
    id: 'coop-04',
    name: 'Tropical Storm Network',
    color: '#DC2626',
    avatar: 'HH',
    members: 31,
    topics: 67,
    posts: 489,
    description: 'Hurricane tracking, tropical weather system discussions, and storm surge monitoring coordination.',
    recentTopics: [
      { id: 'ct-8', title: 'Early season tropical activity predictions', author: 'HurricaneHunter.wrf', replies: 34, time: '1 hour ago' },
      { id: 'ct-9', title: 'Station hardening for hurricane season', author: 'GulfWatch.wrf', replies: 21, time: '4 hours ago' },
    ],
  },
  {
    id: 'coop-05',
    name: 'Pacific Rim Alliance',
    color: '#3B82F6',
    avatar: 'PW',
    members: 22,
    topics: 35,
    posts: 247,
    description: 'Trans-Pacific weather discussions spanning Japan, Australia, Philippines, and West Coast USA.',
    recentTopics: [
      { id: 'ct-10', title: 'Cross-Pacific weather pattern analysis', author: 'PacificWind.wrf', replies: 16, time: '5 hours ago' },
      { id: 'ct-11', title: 'Typhoon season prep guide', author: 'TokyoWx.wrf', replies: 9, time: '1 day ago' },
    ],
  },
  {
    id: 'coop-06',
    name: 'Saharan Data Collective',
    color: '#D97706',
    avatar: 'SD',
    members: 8,
    topics: 11,
    posts: 64,
    description: 'Desert and arid climate discussions, dust storm prediction, and heat wave monitoring coordination.',
    recentTopics: [
      { id: 'ct-12', title: 'Saharan dust transport patterns', author: 'SaharaDust.wrf', replies: 6, time: '2 days ago' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const StatsBar = () => (
  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
    {STATS.map((stat) => (
      <Paper
        key={stat.label}
        sx={{
          bgcolor: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          px: 3,
          py: 1.5,
          borderRadius: 2,
          minWidth: 120,
          textAlign: 'center',
        }}
      >
        <Typography variant="h5" sx={{ color: COLORS.text, fontWeight: 700 }}>
          {stat.value}
        </Typography>
        <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
          {stat.label}
        </Typography>
      </Paper>
    ))}
  </Box>
);

const CategoryRow = ({ category, onSelect }) => (
  <Paper
    onClick={() => onSelect(category.id)}
    sx={{
      bgcolor: COLORS.card,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 2,
      p: 2,
      cursor: 'pointer',
      transition: 'all 0.2s',
      '&:hover': { bgcolor: COLORS.cardHover, borderColor: category.color },
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
      <Avatar sx={{ bgcolor: `${category.color}22`, color: category.color, width: 48, height: 48 }}>
        {category.icon}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Typography variant="subtitle1" sx={{ color: COLORS.text, fontWeight: 600 }}>
            {category.name}
          </Typography>
          {category.id === 'announcements' && (
            <Chip label="Official" size="small" sx={{ bgcolor: `${COLORS.error}22`, color: COLORS.error, height: 20, fontSize: '0.7rem' }} />
          )}
        </Box>
        <Typography variant="body2" sx={{ color: COLORS.textSecondary, mb: 1 }}>
          {category.description}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
            {category.threadCount} threads
          </Typography>
          <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
            {category.postCount} posts
          </Typography>
        </Box>
      </Box>
      <Box sx={{ minWidth: 200, textAlign: 'right', display: { xs: 'none', md: 'block' } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end', mb: 0.5 }}>
          <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', bgcolor: category.color }}>
            {category.latestPost.avatar}
          </Avatar>
          <Typography variant="body2" sx={{ color: COLORS.text, fontWeight: 500 }}>
            {category.latestPost.author}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: COLORS.primary, fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {category.latestPost.title}
        </Typography>
        <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
          {category.latestPost.timestamp}
        </Typography>
      </Box>
    </Box>
  </Paper>
);

const TrendingSidebar = () => {
  const [trending, setTrending] = useState([]);
  useEffect(() => {
    apiClient.get('/community/trending-topics')
      .then((data) => setTrending(Array.isArray(data) ? data : (data.topics ?? [])))
      .catch(() => setTrending([]));
  }, []);
  return (
    <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 2, p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <TrendingUpIcon sx={{ color: COLORS.warning }} />
        <Typography variant="subtitle1" sx={{ color: COLORS.text, fontWeight: 600 }}>
          Trending Topics
        </Typography>
      </Box>
      <List disablePadding>
        {trending.map((topic, idx) => (
          <React.Fragment key={topic.id}>
            <ListItem disablePadding sx={{ py: 1, cursor: 'pointer', '&:hover': { bgcolor: COLORS.cardHover }, borderRadius: 1, px: 1 }}>
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  {topic.hot && <WhatshotIcon sx={{ color: COLORS.error, fontSize: 16 }} />}
                  <Typography variant="body2" sx={{ color: COLORS.text, fontWeight: 500, lineHeight: 1.3 }}>
                    {topic.title}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                    {topic.replies} replies
                  </Typography>
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                    {topic.views?.toLocaleString()} views
                  </Typography>
                </Box>
              </Box>
            </ListItem>
            {idx < trending.length - 1 && <Divider sx={{ borderColor: COLORS.border }} />}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

const OnlinePanel = () => {
  const [onlineMembers, setOnlineMembers] = useState([]);
  useEffect(() => {
    apiClient.get('/community/online-members')
      .then((data) => setOnlineMembers(Array.isArray(data) ? data : (data.members ?? [])))
      .catch(() => setOnlineMembers([]));
  }, []);
  return (
    <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 2, p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Badge
          variant="dot"
          sx={{ '& .MuiBadge-dot': { bgcolor: COLORS.success } }}
        >
          <PersonIcon sx={{ color: COLORS.textSecondary }} />
        </Badge>
        <Typography variant="subtitle1" sx={{ color: COLORS.text, fontWeight: 600 }}>
          Online Now
        </Typography>
        <Chip label={onlineMembers.length || '—'} size="small" sx={{ bgcolor: `${COLORS.success}22`, color: COLORS.success, height: 20, fontSize: '0.7rem' }} />
      </Box>
      <AvatarGroup
        max={8}
        sx={{
          justifyContent: 'flex-start',
          '& .MuiAvatar-root': { width: 32, height: 32, fontSize: '0.75rem', border: `2px solid ${COLORS.card}` },
        }}
      >
        {onlineMembers.map((m) => (
          <Tooltip key={m.name} title={m.name}>
            <Avatar sx={{ bgcolor: m.color }}>{m.avatar}</Avatar>
          </Tooltip>
        ))}
      </AvatarGroup>
      <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip
          icon={<FiberNewIcon sx={{ fontSize: 14 }} />}
          label="3 new members today"
          size="small"
          sx={{ bgcolor: `${COLORS.primary}22`, color: COLORS.primary, fontSize: '0.7rem' }}
        />
      </Box>
    </Paper>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const CooperativeForumCard = ({ coopForum, highlighted }) => (
  <Paper
    sx={{
      bgcolor: COLORS.card,
      border: `1px solid ${highlighted ? coopForum.color : COLORS.border}`,
      borderRadius: 2,
      overflow: 'hidden',
      transition: 'all 0.2s',
      ...(highlighted && { boxShadow: `0 0 16px ${coopForum.color}33` }),
      '&:hover': { borderColor: coopForum.color, bgcolor: COLORS.cardHover },
    }}
  >
    <Box sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
        <Avatar sx={{ bgcolor: coopForum.color, width: 44, height: 44, fontSize: '0.9rem', fontWeight: 700 }}>
          {coopForum.avatar}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ color: COLORS.text, fontWeight: 700 }}>
            {coopForum.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
              {coopForum.members} members
            </Typography>
            <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
              {coopForum.topics} topics
            </Typography>
            <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
              {coopForum.posts} posts
            </Typography>
          </Box>
        </Box>
        {highlighted && (
          <Chip
            label="Your Coop"
            size="small"
            sx={{ bgcolor: `${coopForum.color}22`, color: coopForum.color, height: 22, fontSize: '0.7rem', fontWeight: 600 }}
          />
        )}
      </Box>
      <Typography variant="body2" sx={{ color: COLORS.textSecondary, mb: 2 }}>
        {coopForum.description}
      </Typography>
      <Divider sx={{ borderColor: COLORS.border, mb: 1.5 }} />
      <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Recent Discussions
      </Typography>
      <List disablePadding>
        {coopForum.recentTopics.map((topic, idx) => (
          <React.Fragment key={topic.id}>
            <ListItem
              disablePadding
              sx={{ py: 1, cursor: 'pointer', '&:hover': { bgcolor: COLORS.cardHover }, borderRadius: 1, px: 1 }}
            >
              <Box sx={{ width: '100%' }}>
                <Typography variant="body2" sx={{ color: COLORS.text, fontWeight: 500, mb: 0.3 }}>
                  {topic.title}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Typography variant="caption" sx={{ color: COLORS.primary }}>
                    {topic.author}
                  </Typography>
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                    {topic.replies} replies
                  </Typography>
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                    {topic.time}
                  </Typography>
                </Box>
              </Box>
            </ListItem>
            {idx < coopForum.recentTopics.length - 1 && <Divider sx={{ borderColor: `${COLORS.border}66` }} />}
          </React.Fragment>
        ))}
      </List>
    </Box>
  </Paper>
);

const CommunityForums = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [highlightedCoop, setHighlightedCoop] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    apiClient.get('/community/forum-categories')
      .then((data) => setCategories(Array.isArray(data) ? data : (data.categories ?? [])))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const coopParam = searchParams.get('coop');
    if (tabParam === 'cooperatives') {
      setActiveTab(1);
      if (coopParam) {
        setHighlightedCoop(coopParam);
      }
    }
  }, [searchParams]);

  const handleTabChange = useCallback((_, newVal) => {
    setActiveTab(newVal);
    if (newVal !== 1) {
      setHighlightedCoop(null);
    }
  }, []);

  const handleCategorySelect = useCallback((id) => {
    setSelectedCategory(id);
  }, []);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q),
    );
  }, [searchQuery, categories]);

  const tabLabels = ['Forums', 'Cooperatives', 'Local Groups', 'Events'];

  return (
    <Box sx={{ bgcolor: COLORS.bg, minHeight: '100vh', p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ForumIcon sx={{ color: COLORS.primary, fontSize: 32 }} />
          <Typography variant="h4" sx={{ color: COLORS.text, fontWeight: 700 }}>
            Community Forums
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search forums..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: COLORS.textSecondary }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: 260,
              '& .MuiOutlinedInput-root': {
                bgcolor: COLORS.card,
                color: COLORS.text,
                '& fieldset': { borderColor: COLORS.border },
                '&:hover fieldset': { borderColor: COLORS.primary },
                '&.Mui-focused fieldset': { borderColor: COLORS.primary },
              },
              '& .MuiInputBase-input::placeholder': { color: COLORS.textSecondary },
            }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              bgcolor: COLORS.primary,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { bgcolor: '#2563EB' },
            }}
          >
            New Post
          </Button>
        </Box>
      </Box>

      {/* Stats Bar */}
      <Box sx={{ mb: 3 }}>
        <StatsBar />
      </Box>

      {/* Tabs */}
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': { color: COLORS.textSecondary, textTransform: 'none', fontWeight: 500, fontSize: '0.95rem' },
            '& .Mui-selected': { color: COLORS.primary },
            '& .MuiTabs-indicator': { bgcolor: COLORS.primary },
          }}
        >
          {tabLabels.map((label) => (
            <Tab key={label} label={label} />
          ))}
        </Tabs>
        <Divider sx={{ borderColor: COLORS.border }} />
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Forum Categories */}
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filteredCategories.map((cat) => (
                <CategoryRow key={cat.id} category={cat} onSelect={handleCategorySelect} />
              ))}
              {filteredCategories.length === 0 && (
                <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 2, p: 4, textAlign: 'center' }}>
                  <Typography sx={{ color: COLORS.textSecondary }}>
                    No forums match your search.
                  </Typography>
                </Paper>
              )}
            </Box>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TrendingSidebar />
              <OnlinePanel />

              {/* Quick Links */}
              <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 2, p: 2 }}>
                <Typography variant="subtitle1" sx={{ color: COLORS.text, fontWeight: 600, mb: 1.5 }}>
                  Quick Links
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {[
                    { label: 'Forum Rules & Guidelines', color: COLORS.primary },
                    { label: 'How to Earn WRF Rewards', color: COLORS.success },
                    { label: 'Hardware Buying Guide 2026', color: COLORS.warning },
                    { label: 'Station Setup Checklist', color: COLORS.purple },
                  ].map((link) => (
                    <Typography
                      key={link.label}
                      variant="body2"
                      sx={{ color: link.color, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                    >
                      {link.label}
                    </Typography>
                  ))}
                </Box>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Box>
          <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 2, p: 2.5, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <GroupsIcon sx={{ color: COLORS.primary, fontSize: 22 }} />
              <Typography variant="subtitle1" sx={{ color: COLORS.text, fontWeight: 700 }}>
                Cooperative Forums
              </Typography>
              <Chip
                label={`${COOPERATIVE_FORUMS.length} active`}
                size="small"
                sx={{ bgcolor: `${COLORS.success}22`, color: COLORS.success, height: 22, fontSize: '0.7rem', fontWeight: 600 }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
              Each cooperative has its own dedicated forum space. Discuss strategies, share data insights, and coordinate with your cooperative members.
            </Typography>
          </Paper>

          <Grid container spacing={2}>
            {(() => {
              const sorted = [...COOPERATIVE_FORUMS].sort((a, b) => {
                if (a.id === highlightedCoop) return -1;
                if (b.id === highlightedCoop) return 1;
                return 0;
              });
              return sorted.map((coopForum) => (
                <Grid item xs={12} md={6} key={coopForum.id}>
                  <CooperativeForumCard
                    coopForum={coopForum}
                    highlighted={coopForum.id === highlightedCoop}
                  />
                </Grid>
              ));
            })()}
          </Grid>
        </Box>
      )}

      {activeTab === 2 && (
        <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 2, p: 4, textAlign: 'center' }}>
          <PublicIcon sx={{ color: COLORS.textSecondary, fontSize: 48, mb: 2 }} />
          <Typography variant="h6" sx={{ color: COLORS.text, mb: 1 }}>
            Local Groups
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
            Find and join weather groups in your area. Share local observations and forecasts.
          </Typography>
        </Paper>
      )}

      {activeTab === 3 && (
        <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 2, p: 4, textAlign: 'center' }}>
          <EventIcon sx={{ color: COLORS.textSecondary, fontSize: 48, mb: 2 }} />
          <Typography variant="h6" sx={{ color: COLORS.text, mb: 1 }}>
            Events
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
            Upcoming community events, workshops, meetups, and webinars.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default CommunityForums;
