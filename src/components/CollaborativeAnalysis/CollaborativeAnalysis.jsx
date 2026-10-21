import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
  Tooltip,
  Badge,
  Menu,
  MenuItem,
  Divider,
  Grid,
  InputAdornment,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Groups as GroupsIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
  Search as SearchIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  MoreVert as MoreVertIcon,
  FolderShared as FolderSharedIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  Description as DescriptionIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { apiClient } from '../../services/apiClient';
import DemoSurfaceGate from '../common/DemoSurfaceGate';

// frontend#352: in the demo build this sample's controls are disabled; none of
// them reach a backend.
const SAMPLE_ACTION = 'Sample only: no workspace is created.';

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

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------
const TEAM_MEMBERS = [
  { id: 'u1', name: 'Dr. Sarah Chen', avatar: '', color: '#3B82F6' },
  { id: 'u2', name: 'Marcus Rivera', avatar: '', color: '#10B981' },
  { id: 'u3', name: 'Aiko Tanaka', avatar: '', color: '#F59E0B' },
  { id: 'u4', name: 'James O\'Brien', avatar: '', color: '#EF4444' },
  { id: 'u5', name: 'Priya Sharma', avatar: '', color: '#8B5CF6' },
  { id: 'u6', name: 'Carlos Mendez', avatar: '', color: '#EC4899' },
  { id: 'u7', name: 'Elena Kowalski', avatar: '', color: '#06B6D4' },
  { id: 'u8', name: 'David Kim', avatar: '', color: '#F97316' },
];


const RECENT_ACTIVITY = [
  { id: 'a1', user: TEAM_MEMBERS[0], workspace: 'Q1 2026 Hurricane Season Outlook', action: 'updated the SST anomaly chart', time: '12 min ago' },
  { id: 'a2', user: TEAM_MEMBERS[4], workspace: 'El Nino Teleconnection Impact Assessment', action: 'added a comment on precipitation correlation', time: '28 min ago' },
  { id: 'a3', user: TEAM_MEMBERS[2], workspace: 'Temperature Bias Correction Study', action: 'published the final report', time: '1 hour ago' },
  { id: 'a4', user: TEAM_MEMBERS[7], workspace: 'Precipitation Sensor Calibration Report', action: 'inserted a new calibration table', time: '2 hours ago' },
  { id: 'a5', user: TEAM_MEMBERS[3], workspace: 'Station Network Expansion Analysis', action: 'resolved 3 comments', time: '3 hours ago' },
  { id: 'a6', user: TEAM_MEMBERS[5], workspace: 'Winter Storm Elliott Post-Mortem', action: 'uploaded model verification data', time: '4 hours ago' },
  { id: 'a7', user: TEAM_MEMBERS[1], workspace: 'Q1 2026 Hurricane Season Outlook', action: 'edited the analog year comparison section', time: '5 hours ago' },
];

const TAG_OPTIONS = ['Forecasting', 'Verification', 'Research', 'Training'];
const TEAM_OPTIONS = ['All Teams', 'Tropical Weather Team', 'Infrastructure Team', 'Quality Assurance Team', 'Severe Weather Team', 'Climate Analysis Team'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getStatusColor(status) {
  switch (status) {
  case 'Active': return SUCCESS;
  case 'Draft': return WARNING;
  case 'Published': return PRIMARY;
  default: return TEXT_SECONDARY;
  }
}

function formatRelativeTime(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getInitials(name) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function StatCard({ label, value, icon }) {
  return (
    <Paper
      sx={{
        bgcolor: BG_CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 2,
        px: 3,
        py: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        flex: 1,
        minWidth: 180,
      }}
    >
      <Box
        sx={{
          bgcolor: `${PRIMARY}20`,
          borderRadius: '50%',
          width: 44,
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: PRIMARY,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1.1 }}>
          {value}
        </Typography>
        <Typography variant="caption" sx={{ color: TEXT_SECONDARY }}>
          {label}
        </Typography>
      </Box>
    </Paper>
  );
}

function WorkspaceCard({ workspace, viewMode, onToggleStar }) {
  const [menuAnchor, setMenuAnchor] = useState(null);

  if (viewMode === 'list') {
    return (
      <Paper
        sx={{
          bgcolor: BG_CARD,
          border: `1px solid ${BORDER}`,
          borderRadius: 2,
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          cursor: 'pointer',
          transition: 'border-color 0.2s',
          '&:hover': { borderColor: PRIMARY },
        }}
      >
        <IconButton size="small" onClick={() => onToggleStar(workspace.id)} sx={{ color: workspace.starred ? WARNING : TEXT_SECONDARY }}>
          {workspace.starred ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600 }} noWrap>
            {workspace.name}
          </Typography>
          <Typography variant="caption" sx={{ color: TEXT_SECONDARY }} noWrap>
            {workspace.description}
          </Typography>
        </Box>
        <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 28, height: 28, fontSize: 12, border: `2px solid ${BG_CARD}` } }}>
          {workspace.members.map((m) => (
            <Tooltip key={m.id} title={m.name}>
              <Avatar sx={{ bgcolor: m.color }}>{getInitials(m.name)}</Avatar>
            </Tooltip>
          ))}
        </AvatarGroup>
        <Chip
          label={workspace.status}
          size="small"
          sx={{
            bgcolor: `${getStatusColor(workspace.status)}20`,
            color: getStatusColor(workspace.status),
            fontWeight: 600,
            fontSize: 11,
            height: 24,
          }}
        />
        <Typography variant="caption" sx={{ color: TEXT_SECONDARY, minWidth: 60, textAlign: 'right' }}>
          {formatRelativeTime(workspace.lastModified)}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        bgcolor: BG_CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 2,
        p: 0,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color 0.2s, transform 0.2s',
        '&:hover': { borderColor: PRIMARY, transform: 'translateY(-2px)' },
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Card header bar */}
      <Box sx={{ bgcolor: `${getStatusColor(workspace.status)}15`, px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Chip
          label={workspace.status}
          size="small"
          sx={{
            bgcolor: `${getStatusColor(workspace.status)}25`,
            color: getStatusColor(workspace.status),
            fontWeight: 600,
            fontSize: 11,
            height: 22,
          }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); onToggleStar(workspace.id); }}
            sx={{ color: workspace.starred ? WARNING : TEXT_SECONDARY }}
          >
            {workspace.starred ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); }}
            sx={{ color: TEXT_SECONDARY }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
            PaperProps={{ sx: { bgcolor: BG_CARD, border: `1px solid ${BORDER}`, color: '#fff' } }}
          >
            <MenuItem onClick={() => setMenuAnchor(null)} sx={{ fontSize: 13 }}>Open</MenuItem>
            <MenuItem onClick={() => setMenuAnchor(null)} sx={{ fontSize: 13 }}>Duplicate</MenuItem>
            <MenuItem onClick={() => setMenuAnchor(null)} sx={{ fontSize: 13 }}>Share</MenuItem>
            <Divider sx={{ borderColor: BORDER }} />
            <MenuItem onClick={() => setMenuAnchor(null)} sx={{ fontSize: 13, color: ERROR }}>Delete</MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Body */}
      <Box sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 700, mb: 0.5, lineHeight: 1.3 }}>
          {workspace.name}
        </Typography>
        <Typography variant="body2" sx={{ color: TEXT_SECONDARY, mb: 2, lineHeight: 1.5, flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {workspace.description}
        </Typography>

        {/* Tags */}
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
          {workspace.tags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              sx={{
                bgcolor: `${PRIMARY}15`,
                color: PRIMARY,
                fontSize: 11,
                height: 22,
                fontWeight: 500,
              }}
            />
          ))}
          <Chip
            label={workspace.team}
            size="small"
            variant="outlined"
            sx={{
              borderColor: BORDER,
              color: TEXT_SECONDARY,
              fontSize: 11,
              height: 22,
            }}
          />
        </Box>
      </Box>

      {/* Footer */}
      <Divider sx={{ borderColor: BORDER }} />
      <Box sx={{ px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 26, height: 26, fontSize: 11, border: `2px solid ${BG_CARD}` } }}>
            {workspace.members.map((m) => (
              <Tooltip key={m.id} title={m.name}>
                <Avatar sx={{ bgcolor: m.color }}>{getInitials(m.name)}</Avatar>
              </Tooltip>
            ))}
          </AvatarGroup>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: TEXT_SECONDARY }}>
          <Tooltip title={`${workspace.editCount} edits`}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
              <EditIcon sx={{ fontSize: 14 }} />
              <Typography variant="caption">{workspace.editCount}</Typography>
            </Box>
          </Tooltip>
          <Tooltip title={`${workspace.commentCount} comments`}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
              <DescriptionIcon sx={{ fontSize: 14 }} />
              <Typography variant="caption">{workspace.commentCount}</Typography>
            </Box>
          </Tooltip>
          <Tooltip title={`Last edited by ${workspace.lastEditor.name}`}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
              <AccessTimeIcon sx={{ fontSize: 14 }} />
              <Typography variant="caption">{formatRelativeTime(workspace.lastModified)}</Typography>
            </Box>
          </Tooltip>
        </Box>
      </Box>
    </Paper>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
function CollaborativeAnalysisSample() {
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('All Teams');
  const [workspaces, setWorkspaces] = useState([]);

  useEffect(() => {
    apiClient.get('/collaborative/workspaces')
      .then((data) => setWorkspaces(Array.isArray(data) ? data : (data.workspaces ?? [])))
      .catch(() => setWorkspaces([]));
  }, []);

  const handleToggleStar = useCallback((wsId) => {
    setWorkspaces((prev) =>
      prev.map((ws) => (ws.id === wsId ? { ...ws, starred: !ws.starred } : ws)),
    );
  }, []);

  const handleTagToggle = useCallback((tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  const filteredWorkspaces = useMemo(() => {
    let result = workspaces;

    // Tab filtering
    if (activeTab === 0) {
      result = result.filter((ws) => ws.members.some((m) => m.id === 'u1'));
    } else if (activeTab === 1) {
      result = result.filter((ws) => ws.members.some((m) => m.id !== 'u1'));
    }
    // Tab 2 = all team workspaces, tab 3 = templates (not filtered here)

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (ws) =>
          ws.name.toLowerCase().includes(q) ||
          ws.description.toLowerCase().includes(q),
      );
    }

    // Tags
    if (selectedTags.length > 0) {
      result = result.filter((ws) =>
        selectedTags.some((tag) => ws.tags.includes(tag)),
      );
    }

    // Team
    if (selectedTeam !== 'All Teams') {
      result = result.filter((ws) => ws.team === selectedTeam);
    }

    return result;
  }, [workspaces, activeTab, searchQuery, selectedTags, selectedTeam]);

  return (
    <Box sx={{ bgcolor: BG_ROOT, minHeight: '100vh', p: 3 }}>
      {/* ---------- Header ---------- */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Collaborative Analysis
          </Typography>
          <Typography variant="body2" sx={{ color: TEXT_SECONDARY, mt: 0.5 }}>
            Shared workspaces for forecast teams to analyze, annotate, and publish weather insights
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', border: `1px solid ${BORDER}`, borderRadius: 1, overflow: 'hidden' }}>
            <IconButton
              size="small"
              onClick={() => setViewMode('grid')}
              sx={{
                borderRadius: 0,
                bgcolor: viewMode === 'grid' ? `${PRIMARY}25` : 'transparent',
                color: viewMode === 'grid' ? PRIMARY : TEXT_SECONDARY,
                px: 1,
              }}
            >
              <ViewModuleIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setViewMode('list')}
              sx={{
                borderRadius: 0,
                bgcolor: viewMode === 'list' ? `${PRIMARY}25` : 'transparent',
                color: viewMode === 'list' ? PRIMARY : TEXT_SECONDARY,
                px: 1,
              }}
            >
              <ViewListIcon fontSize="small" />
            </IconButton>
          </Box>
          <Button disabled title={SAMPLE_ACTION}
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              bgcolor: PRIMARY,
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              px: 3,
              '&:hover': { bgcolor: '#2563EB' },
            }}
          >
            New Workspace
          </Button>
        </Box>
      </Box>

      {/* ---------- Stats bar ---------- */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <StatCard label="Workspaces" value="12" icon={<FolderSharedIcon />} />
        <StatCard label="Team Members" value="8" icon={<GroupsIcon />} />
        <StatCard label="Shared Analyses" value="47" icon={<DescriptionIcon />} />
        <StatCard label="Active Now" value="5" icon={<TrendingUpIcon />} />
      </Box>

      {/* ---------- Tabs ---------- */}
      <Box sx={{ borderBottom: `1px solid ${BORDER}`, mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            '& .MuiTab-root': { color: TEXT_SECONDARY, textTransform: 'none', fontWeight: 500, fontSize: 14 },
            '& .Mui-selected': { color: PRIMARY },
            '& .MuiTabs-indicator': { bgcolor: PRIMARY },
          }}
        >
          <Tab label="My Workspaces" />
          <Tab label="Shared With Me" />
          <Tab label="Team Workspaces" />
          <Tab label="Templates" />
        </Tabs>
      </Box>

      {/* ---------- Filters ---------- */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search workspaces..."
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

        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <FilterListIcon sx={{ color: TEXT_SECONDARY, fontSize: 18, mr: 0.5 }} />
          {TAG_OPTIONS.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              onClick={() => handleTagToggle(tag)}
              sx={{
                bgcolor: selectedTags.includes(tag) ? `${PRIMARY}25` : 'transparent',
                color: selectedTags.includes(tag) ? PRIMARY : TEXT_SECONDARY,
                border: `1px solid ${selectedTags.includes(tag) ? PRIMARY : BORDER}`,
                fontWeight: 500,
                fontSize: 12,
                cursor: 'pointer',
                '&:hover': { bgcolor: `${PRIMARY}15` },
              }}
            />
          ))}
        </Box>

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <Select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
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
            {TEAM_OPTIONS.map((t) => (
              <MenuItem key={t} value={t} sx={{ fontSize: 13 }}>
                {t}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* ---------- Content: workspace grid / list + activity sidebar ---------- */}
      <Box sx={{ display: 'flex', gap: 3 }}>
        {/* Workspace cards */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {viewMode === 'grid' ? (
            <Grid container spacing={2.5}>
              {filteredWorkspaces.map((ws) => (
                <Grid item xs={12} sm={6} lg={4} key={ws.id}>
                  <WorkspaceCard workspace={ws} viewMode={viewMode} onToggleStar={handleToggleStar} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {filteredWorkspaces.map((ws) => (
                <WorkspaceCard key={ws.id} workspace={ws} viewMode={viewMode} onToggleStar={handleToggleStar} />
              ))}
            </Box>
          )}

          {filteredWorkspaces.length === 0 && (
            <Paper sx={{ bgcolor: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 2, p: 6, textAlign: 'center' }}>
              <FolderSharedIcon sx={{ color: TEXT_SECONDARY, fontSize: 48, mb: 1 }} />
              <Typography variant="subtitle1" sx={{ color: '#fff', mb: 0.5 }}>No workspaces found</Typography>
              <Typography variant="body2" sx={{ color: TEXT_SECONDARY }}>Try adjusting your search or filters</Typography>
            </Paper>
          )}
        </Box>

        {/* Recent activity sidebar */}
        <Paper
          sx={{
            bgcolor: BG_CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: 2,
            width: 320,
            flexShrink: 0,
            p: 2.5,
            alignSelf: 'flex-start',
            display: { xs: 'none', lg: 'block' },
          }}
        >
          <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700, mb: 2 }}>
            Recent Activity
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {RECENT_ACTIVITY.map((activity) => (
              <Box key={activity.id} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                <Avatar
                  sx={{
                    bgcolor: activity.user.color,
                    width: 30,
                    height: 30,
                    fontSize: 12,
                    mt: 0.3,
                  }}
                >
                  {getInitials(activity.user.name)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ color: '#fff', fontSize: 13, lineHeight: 1.4 }}>
                    <Box component="span" sx={{ fontWeight: 600 }}>{activity.user.name.split(' ')[0]}</Box>
                    {' '}{activity.action}
                  </Typography>
                  <Typography variant="caption" sx={{ color: TEXT_SECONDARY, display: 'block', mt: 0.2 }} noWrap>
                    {activity.workspace}
                  </Typography>
                  <Typography variant="caption" sx={{ color: `${TEXT_SECONDARY}90`, fontSize: 11 }}>
                    {activity.time}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

// frontend#352: display-only fabricated surface. The default build shows an
// honest not-live state and never mounts the sample.
const CollaborativeAnalysis = () => (
  <DemoSurfaceGate
    title="Collaborative analysis is not live on the testnet"
    description="No testnet endpoint serves shared workspaces, collaborators or analysis history yet."
    testId="collaboration"
  >
    <CollaborativeAnalysisSample />
  </DemoSurfaceGate>
);

export default CollaborativeAnalysis;
