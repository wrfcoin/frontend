import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Avatar,
  AvatarGroup,
  Chip,
  TextField,
  IconButton,
  Tooltip,
  Badge,
  Menu,
  MenuItem,
  Divider,
  Select,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Switch,
} from '@mui/material';
import {
  Edit as EditIcon,
  Comment as CommentIcon,
  Share as ShareIcon,
  Save as SaveIcon,
  History as HistoryIcon,
  FormatBold as FormatBoldIcon,
  FormatItalic as FormatItalicIcon,
  InsertChart as InsertChartIcon,
  Map as MapIcon,
  TableChart as TableChartIcon,
  Functions as FunctionsIcon,
  FormatListBulleted as FormatListIcon,
  FormatQuote as FormatQuoteIcon,
  Title as TitleIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  MoreVert as MoreVertIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
  Send as SendIcon,
  ExpandMore as ExpandMoreIcon,
  FiberManualRecord as DotIcon,
  Fullscreen as FullscreenIcon,
  KeyboardArrowLeft as BackIcon,

  PanTool as CursorIcon,
} from '@mui/icons-material';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';

import { apiClient } from '../../services/apiClient';
import DemoSurfaceGate from '../common/DemoSurfaceGate';

// frontend#352: in the demo build this sample's actions are disabled; none of
// them reached a backend, and several reported success after a timer.
const SAMPLE_ACTION = 'Sample only: this workspace is not stored.';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, ChartTooltip, Legend);

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------
const BG_ROOT = '#0F172A';
const BG_CARD = '#1E293B';
const BG_EDITOR = '#141C2E';
const BORDER = '#334155';
const PRIMARY = '#3B82F6';
const SUCCESS = '#10B981';
const WARNING = '#F59E0B';
const ERROR = '#EF4444';
const TEXT_SECONDARY = '#94A3B8';
const PURPLE = '#8B5CF6';

// ---------------------------------------------------------------------------
// Mock collaborators
// ---------------------------------------------------------------------------
const COLLABORATORS = [
  { id: 'u1', name: 'Dr. Sarah Chen', color: '#3B82F6', online: true, cursorY: 180, cursorSection: 'Abstract' },
  { id: 'u2', name: 'Marcus Rivera', color: '#10B981', online: true, cursorY: 420, cursorSection: 'Data Sources' },
  { id: 'u3', name: 'Aiko Tanaka', color: '#F59E0B', online: true, cursorY: 680, cursorSection: 'Analysis' },
  { id: 'u4', name: 'James O\'Brien', color: '#EF4444', online: false, cursorY: null, cursorSection: null },
  { id: 'u5', name: 'Priya Sharma', color: '#8B5CF6', online: true, cursorY: 900, cursorSection: 'Conclusions' },
];

// ---------------------------------------------------------------------------
// Mock version history
// ---------------------------------------------------------------------------
const VERSION_HISTORY = [
  { id: 'v1', timestamp: '2026-02-14T09:42:00Z', author: 'Dr. Sarah Chen', label: 'Updated SST anomaly charts', autosave: false },
  { id: 'v2', timestamp: '2026-02-14T09:35:00Z', author: 'Marcus Rivera', label: 'Added GFS ensemble data', autosave: true },
  { id: 'v3', timestamp: '2026-02-14T09:12:00Z', author: 'Aiko Tanaka', label: 'Revised methodology section', autosave: false },
  { id: 'v4', timestamp: '2026-02-14T08:48:00Z', author: 'Dr. Sarah Chen', label: 'Initial analog year comparison', autosave: false },
  { id: 'v5', timestamp: '2026-02-13T17:20:00Z', author: 'Priya Sharma', label: 'Conclusion draft', autosave: true },
  { id: 'v6', timestamp: '2026-02-13T15:05:00Z', author: 'Marcus Rivera', label: 'Storm track overlay added', autosave: false },
];


// ---------------------------------------------------------------------------
// Mock document sections
// ---------------------------------------------------------------------------
const DOCUMENT_SECTIONS = [
  {
    id: 's1',
    type: 'heading',
    level: 1,
    content: 'Q1 2026 Hurricane Season Outlook',
  },
  {
    id: 's2',
    type: 'metadata',
    content: 'Tropical Weather Team | Version 3.2 | Last updated: Feb 14, 2026',
  },
  {
    id: 's3',
    type: 'heading',
    level: 2,
    content: 'Abstract',
  },
  {
    id: 's4',
    type: 'paragraph',
    content: 'This collaborative analysis presents the WRFCoin Tropical Weather Team\'s seasonal outlook for the 2026 Atlantic hurricane season. Using multi-model ensemble data, historical analog comparisons, and real-time SST monitoring from our IoT station network, we project an above-normal season with 18-22 named storms, 8-11 hurricanes, and 4-6 major hurricanes.',
  },
  {
    id: 's5',
    type: 'heading',
    level: 2,
    content: 'Key Predictors & Data Sources',
  },
  {
    id: 's6',
    type: 'paragraph',
    content: 'Our outlook integrates the following primary data sources and predictive indices:',
  },
  {
    id: 's7',
    type: 'list',
    items: [
      'ENSO state: Weak El Nino transitioning to neutral (ONI: +0.4C, falling)',
      'Atlantic Multidecadal Oscillation (AMO): Positive phase, supporting enhanced activity',
      'Main Development Region SSTs: +0.8C above 1991-2020 baseline',
      'Vertical wind shear: Below average across the tropical Atlantic',
      'West African monsoon: Enhanced easterly wave activity indicated',
    ],
  },
  {
    id: 's8',
    type: 'heading',
    level: 2,
    content: 'SST Anomaly Analysis',
  },
  {
    id: 's9',
    type: 'chart',
    chartType: 'line',
    title: 'MDR Sea Surface Temperature Anomalies (2025-2026)',
  },
  {
    id: 's10',
    type: 'heading',
    level: 2,
    content: 'Analog Year Comparison',
  },
  {
    id: 's11',
    type: 'paragraph',
    content: 'Based on ENSO state, AMO phase, QBO direction, and MDR SST patterns, we identified 5 analog years: 2005, 2010, 2017, 2020, and 2024. The composite of these years supports our above-normal forecast.',
  },
  {
    id: 's12',
    type: 'chart',
    chartType: 'bar',
    title: 'Named Storm Counts: Analog Years vs. Forecast',
  },
  {
    id: 's13',
    type: 'heading',
    level: 2,
    content: 'Model Ensemble Summary',
  },
  {
    id: 's14',
    type: 'table',
    headers: ['Model', 'Named Storms', 'Hurricanes', 'Major', 'ACE Index'],
    rows: [
      ['GFS Extended', '20', '10', '5', '168'],
      ['ECMWF S2S', '22', '11', '6', '185'],
      ['CSU Forecast', '19', '9', '4', '155'],
      ['TSR Outlook', '21', '10', '5', '172'],
      ['WRFCoin Ensemble', '20', '10', '5', '170'],
    ],
  },
  {
    id: 's15',
    type: 'heading',
    level: 2,
    content: 'Conclusions & Confidence Assessment',
  },
  {
    id: 's16',
    type: 'paragraph',
    content: 'The convergence of favorable large-scale conditions strongly supports an above-normal 2026 Atlantic hurricane season. Confidence is assessed as HIGH (85%) for the overall seasonal activity and MODERATE (65%) for the specific storm count ranges. Key uncertainties include the pace of ENSO transition and potential mid-season SST fluctuations in the MDR.',
  },
];

// ---------------------------------------------------------------------------
// Chart data generators
// ---------------------------------------------------------------------------
function buildSSTChart() {
  const months = ['Jul 25', 'Aug 25', 'Sep 25', 'Oct 25', 'Nov 25', 'Dec 25', 'Jan 26', 'Feb 26'];
  return {
    labels: months,
    datasets: [
      {
        label: 'MDR SST Anomaly (C)',
        data: [0.45, 0.62, 0.78, 0.71, 0.58, 0.52, 0.65, 0.80],
        borderColor: ERROR,
        backgroundColor: `${ERROR}30`,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
      },
      {
        label: 'Climatological Mean',
        data: [0, 0, 0, 0, 0, 0, 0, 0],
        borderColor: TEXT_SECONDARY,
        borderDash: [5, 5],
        pointRadius: 0,
      },
    ],
  };
}

function buildAnalogChart() {
  const years = ['2005', '2010', '2017', '2020', '2024', '2026\n(Forecast)'];
  return {
    labels: years,
    datasets: [
      {
        label: 'Named Storms',
        data: [28, 19, 17, 30, 23, 20],
        backgroundColor: PRIMARY,
        borderRadius: 4,
      },
      {
        label: 'Hurricanes',
        data: [15, 12, 10, 13, 11, 10],
        backgroundColor: WARNING,
        borderRadius: 4,
      },
      {
        label: 'Major Hurricanes',
        data: [7, 5, 6, 6, 5, 5],
        backgroundColor: ERROR,
        borderRadius: 4,
      },
    ],
  };
}

const CHART_OPTIONS_BASE = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: TEXT_SECONDARY, font: { size: 11 } } },
  },
  scales: {
    x: { ticks: { color: TEXT_SECONDARY, font: { size: 11 } }, grid: { color: `${BORDER}60` } },
    y: { ticks: { color: TEXT_SECONDARY, font: { size: 11 } }, grid: { color: `${BORDER}60` } },
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getInitials(name) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2);
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatRelative(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function ToolbarButton({ icon, label, active, onClick }) {
  return (
    <Tooltip title={label}>
      <IconButton
        size="small"
        onClick={onClick}
        sx={{
          color: active ? PRIMARY : TEXT_SECONDARY,
          bgcolor: active ? `${PRIMARY}20` : 'transparent',
          borderRadius: 1,
          '&:hover': { bgcolor: `${PRIMARY}15`, color: '#fff' },
        }}
      >
        {icon}
      </IconButton>
    </Tooltip>
  );
}

function CursorIndicator({ collaborator }) {
  if (!collaborator.online || collaborator.cursorY === null) return null;
  return (
    <Box
      sx={{
        position: 'absolute',
        left: -4,
        top: collaborator.cursorY,
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        zIndex: 10,
        pointerEvents: 'none',
      }}
    >
      <Box sx={{ width: 2, height: 20, bgcolor: collaborator.color, borderRadius: 1 }} />
      <Chip
        label={collaborator.name.split(' ')[0]}
        size="small"
        sx={{
          bgcolor: collaborator.color,
          color: '#fff',
          fontSize: 10,
          height: 18,
          fontWeight: 600,
          '& .MuiChip-label': { px: 0.8 },
        }}
      />
    </Box>
  );
}

function DocumentSection({ section }) {
  const sstData = useMemo(() => buildSSTChart(), []);
  const analogData = useMemo(() => buildAnalogChart(), []);

  switch (section.type) {
  case 'heading':
    return (
      <Typography
        variant={section.level === 1 ? 'h5' : 'h6'}
        sx={{
          color: '#fff',
          fontWeight: section.level === 1 ? 800 : 700,
          mt: section.level === 1 ? 0 : 3,
          mb: 1,
          letterSpacing: '-0.01em',
          borderBottom: section.level === 2 ? `1px solid ${BORDER}` : 'none',
          pb: section.level === 2 ? 1 : 0,
        }}
      >
        {section.content}
      </Typography>
    );
  case 'metadata':
    return (
      <Typography variant="body2" sx={{ color: TEXT_SECONDARY, mb: 2, fontStyle: 'italic' }}>
        {section.content}
      </Typography>
    );
  case 'paragraph':
    return (
      <Typography variant="body1" sx={{ color: '#CBD5E1', lineHeight: 1.8, mb: 2, fontSize: 14 }}>
        {section.content}
      </Typography>
    );
  case 'list':
    return (
      <Box component="ul" sx={{ color: '#CBD5E1', pl: 3, mb: 2, lineHeight: 2 }}>
        {section.items.map((item, i) => (
          <Box component="li" key={i} sx={{ fontSize: 14, mb: 0.5 }}>
            {item}
          </Box>
        ))}
      </Box>
    );
  case 'chart':
    return (
      <Paper sx={{ bgcolor: BG_EDITOR, border: `1px solid ${BORDER}`, borderRadius: 2, p: 2, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ color: TEXT_SECONDARY, mb: 1.5, fontSize: 12 }}>
          {section.title}
        </Typography>
        <Box sx={{ height: 220 }}>
          {section.chartType === 'line' ? (
            <Line data={sstData} options={CHART_OPTIONS_BASE} />
          ) : (
            <Bar data={analogData} options={CHART_OPTIONS_BASE} />
          )}
        </Box>
      </Paper>
    );
  case 'table':
    return (
      <Paper sx={{ bgcolor: BG_EDITOR, border: `1px solid ${BORDER}`, borderRadius: 2, mb: 2, overflow: 'hidden' }}>
        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
          <Box component="thead">
            <Box component="tr" sx={{ bgcolor: `${PRIMARY}10` }}>
              {section.headers.map((h) => (
                <Box
                  component="th"
                  key={h}
                  sx={{ color: PRIMARY, fontSize: 12, fontWeight: 700, p: 1.5, textAlign: 'left', borderBottom: `1px solid ${BORDER}` }}
                >
                  {h}
                </Box>
              ))}
            </Box>
          </Box>
          <Box component="tbody">
            {section.rows.map((row, ri) => (
              <Box
                component="tr"
                key={ri}
                sx={{
                  bgcolor: ri % 2 === 0 ? 'transparent' : `${BORDER}20`,
                  '&:hover': { bgcolor: `${PRIMARY}08` },
                }}
              >
                {row.map((cell, ci) => (
                  <Box
                    component="td"
                    key={ci}
                    sx={{
                      color: ci === 0 ? '#fff' : '#CBD5E1',
                      fontSize: 13,
                      p: 1.5,
                      fontWeight: ci === 0 ? 600 : 400,
                      borderBottom: `1px solid ${BORDER}40`,
                    }}
                  >
                    {cell}
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
        </Box>
      </Paper>
    );
  default:
    return null;
  }
}

function CommentThread({ comment, onToggleResolve }) {
  const [replyText, setReplyText] = useState('');

  return (
    <Paper
      sx={{
        bgcolor: comment.resolved ? `${BG_CARD}80` : BG_CARD,
        border: `1px solid ${comment.resolved ? `${BORDER}60` : BORDER}`,
        borderLeft: `3px solid ${comment.author.color}`,
        borderRadius: 1.5,
        p: 2,
        opacity: comment.resolved ? 0.7 : 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ bgcolor: comment.author.color, width: 24, height: 24, fontSize: 11 }}>
            {getInitials(comment.author.name)}
          </Avatar>
          <Typography variant="caption" sx={{ color: '#fff', fontWeight: 600 }}>
            {comment.author.name}
          </Typography>
          <Chip
            label={comment.section}
            size="small"
            sx={{ bgcolor: `${PRIMARY}15`, color: PRIMARY, fontSize: 10, height: 18 }}
          />
        </Box>
        <IconButton
          size="small"
          onClick={() => onToggleResolve(comment.id)}
          sx={{ color: comment.resolved ? SUCCESS : TEXT_SECONDARY }}
        >
          {comment.resolved ? <CheckCircleIcon sx={{ fontSize: 18 }} /> : <UncheckedIcon sx={{ fontSize: 18 }} />}
        </IconButton>
      </Box>

      <Typography variant="body2" sx={{ color: '#CBD5E1', fontSize: 13, mb: 1, lineHeight: 1.5 }}>
        {comment.text}
      </Typography>

      <Typography variant="caption" sx={{ color: `${TEXT_SECONDARY}80`, fontSize: 11 }}>
        {formatRelative(comment.timestamp)}
      </Typography>

      {/* Replies */}
      {comment.replies.length > 0 && (
        <Box sx={{ mt: 1.5, pl: 2, borderLeft: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {comment.replies.map((reply) => (
            <Box key={reply.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                <Avatar sx={{ bgcolor: reply.author.color, width: 18, height: 18, fontSize: 9 }}>
                  {getInitials(reply.author.name)}
                </Avatar>
                <Typography variant="caption" sx={{ color: '#fff', fontWeight: 600, fontSize: 11 }}>
                  {reply.author.name}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#CBD5E1', fontSize: 12, lineHeight: 1.4 }}>
                {reply.text}
              </Typography>
              <Typography variant="caption" sx={{ color: `${TEXT_SECONDARY}80`, fontSize: 10 }}>
                {formatRelative(reply.timestamp)}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* Reply input */}
      {!comment.resolved && (
        <Box sx={{ display: 'flex', gap: 0.5, mt: 1.5 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: BG_ROOT,
                color: '#fff',
                fontSize: 12,
                '& fieldset': { borderColor: BORDER },
              },
            }}
          />
          <IconButton disabled title={SAMPLE_ACTION} size="small" sx={{ color: PRIMARY }}>
            <SendIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      )}
    </Paper>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
function WorkspaceEditorSample() {
  const [showComments, setShowComments] = useState(true);
  const [commentFilter, setCommentFilter] = useState('all');
  const [comments, setComments] = useState([]);

  useEffect(() => {
    apiClient.get('/collaborative/comments')
      .then((data) => setComments(Array.isArray(data) ? data : (data.comments ?? [])))
      .catch(() => setComments([]));
  }, []);
  const [historyAnchor, setHistoryAnchor] = useState(null);
  const [insertAnchor, setInsertAnchor] = useState(null);
  const [activeFormatting, setActiveFormatting] = useState({ bold: false, italic: false });

  // No auto-save: nothing stores this workspace (the former timer reported
  // "saved" every 30 s).

  const handleToggleResolve = useCallback((commentId) => {
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, resolved: !c.resolved } : c)),
    );
  }, []);

  const filteredComments = useMemo(() => {
    if (commentFilter === 'resolved') return comments.filter((c) => c.resolved);
    if (commentFilter === 'unresolved') return comments.filter((c) => !c.resolved);
    return comments;
  }, [comments, commentFilter]);

  const onlineCount = COLLABORATORS.filter((c) => c.online).length;

  return (
    <Box sx={{ bgcolor: BG_ROOT, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ========== Top bar ========== */}
      <Paper
        sx={{
          bgcolor: BG_CARD,
          borderBottom: `1px solid ${BORDER}`,
          borderRadius: 0,
          px: 2,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 100,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tooltip title="Back to workspaces">
            <IconButton disabled title={SAMPLE_ACTION} size="small" sx={{ color: TEXT_SECONDARY }}>
              <BackIcon />
            </IconButton>
          </Tooltip>
          <Box>
            <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1.2 }}>
              Q1 2026 Hurricane Season Outlook
            </Typography>
            <Typography variant="caption" sx={{ color: TEXT_SECONDARY }}>
              Tropical Weather Team
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Save status */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 1 }}>
            <Typography variant="caption" data-testid="workspace-save-status" sx={{ color: TEXT_SECONDARY, fontSize: 11 }}>
              {SAMPLE_ACTION}
            </Typography>
          </Box>

          {/* Collaborators */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AvatarGroup
              max={5}
              sx={{
                '& .MuiAvatar-root': {
                  width: 28,
                  height: 28,
                  fontSize: 11,
                  border: '2px solid transparent',
                },
              }}
            >
              {COLLABORATORS.filter((c) => c.online).map((c) => (
                <Tooltip key={c.id} title={`${c.name} (editing ${c.cursorSection || ''})`}>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    variant="dot"
                    sx={{ '& .MuiBadge-dot': { bgcolor: SUCCESS, width: 8, height: 8, border: `1.5px solid ${BG_CARD}` } }}
                  >
                    <Avatar sx={{ bgcolor: c.color }}>{getInitials(c.name)}</Avatar>
                  </Badge>
                </Tooltip>
              ))}
            </AvatarGroup>
            <Typography variant="caption" sx={{ color: TEXT_SECONDARY }}>
              {onlineCount} online
            </Typography>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ borderColor: BORDER, mx: 0.5 }} />

          {/* Version history */}
          <Tooltip title="Version history">
            <IconButton
              size="small"
              onClick={(e) => setHistoryAnchor(e.currentTarget)}
              sx={{ color: TEXT_SECONDARY }}
            >
              <HistoryIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={historyAnchor}
            open={Boolean(historyAnchor)}
            onClose={() => setHistoryAnchor(null)}
            PaperProps={{
              sx: {
                bgcolor: BG_CARD,
                border: `1px solid ${BORDER}`,
                color: '#fff',
                width: 340,
                maxHeight: 400,
              },
            }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700 }}>Version History</Typography>
            </Box>
            <Divider sx={{ borderColor: BORDER }} />
            {VERSION_HISTORY.map((v) => (
              <MenuItem
                key={v.id}
                onClick={() => setHistoryAnchor(null)}
                sx={{ py: 1.5, display: 'block' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>
                    {v.label}
                  </Typography>
                  {v.autosave && (
                    <Chip label="Auto" size="small" sx={{ bgcolor: `${BORDER}60`, color: TEXT_SECONDARY, fontSize: 10, height: 18 }} />
                  )}
                </Box>
                <Typography variant="caption" sx={{ color: TEXT_SECONDARY }}>
                  {v.author} - {formatTime(v.timestamp)}
                </Typography>
              </MenuItem>
            ))}
          </Menu>

          <Tooltip title="Comments">
            <IconButton
              size="small"
              onClick={() => setShowComments((p) => !p)}
              sx={{ color: showComments ? PRIMARY : TEXT_SECONDARY }}
            >
              <Badge badgeContent={comments.filter((c) => !c.resolved).length} color="error" sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 16, minWidth: 16 } }}>
                <CommentIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>

          <Button disabled title={SAMPLE_ACTION}
            variant="contained"
            startIcon={<ShareIcon sx={{ fontSize: 16 }} />}
            size="small"
            sx={{ bgcolor: PRIMARY, textTransform: 'none', fontWeight: 600, borderRadius: 1.5, fontSize: 12, '&:hover': { bgcolor: '#2563EB' } }}
          >
            Share
          </Button>
        </Box>
      </Paper>

      {/* ========== Toolbar ========== */}
      <Paper
        sx={{
          bgcolor: BG_CARD,
          borderBottom: `1px solid ${BORDER}`,
          borderRadius: 0,
          px: 2,
          py: 0.5,
          display: 'flex',
          alignItems: 'center',
          gap: 0.3,
        }}
      >
        <ToolbarButton icon={<UndoIcon sx={{ fontSize: 18 }} />} label="Undo" />
        <ToolbarButton icon={<RedoIcon sx={{ fontSize: 18 }} />} label="Redo" />
        <Divider orientation="vertical" flexItem sx={{ borderColor: BORDER, mx: 0.5 }} />

        <ToolbarButton
          icon={<FormatBoldIcon sx={{ fontSize: 18 }} />}
          label="Bold"
          active={activeFormatting.bold}
          onClick={() => setActiveFormatting((p) => ({ ...p, bold: !p.bold }))}
        />
        <ToolbarButton
          icon={<FormatItalicIcon sx={{ fontSize: 18 }} />}
          label="Italic"
          active={activeFormatting.italic}
          onClick={() => setActiveFormatting((p) => ({ ...p, italic: !p.italic }))}
        />
        <ToolbarButton icon={<TitleIcon sx={{ fontSize: 18 }} />} label="Heading" />
        <ToolbarButton icon={<FormatListIcon sx={{ fontSize: 18 }} />} label="Bullet List" />
        <ToolbarButton icon={<FormatQuoteIcon sx={{ fontSize: 18 }} />} label="Block Quote" />
        <Divider orientation="vertical" flexItem sx={{ borderColor: BORDER, mx: 0.5 }} />

        <Tooltip title="Insert">
          <Button
            size="small"
            startIcon={<InsertChartIcon sx={{ fontSize: 16 }} />}
            endIcon={<ExpandMoreIcon sx={{ fontSize: 14 }} />}
            onClick={(e) => setInsertAnchor(e.currentTarget)}
            sx={{ color: TEXT_SECONDARY, textTransform: 'none', fontSize: 12, fontWeight: 500 }}
          >
            Insert
          </Button>
        </Tooltip>
        <Menu
          anchorEl={insertAnchor}
          open={Boolean(insertAnchor)}
          onClose={() => setInsertAnchor(null)}
          PaperProps={{ sx: { bgcolor: BG_CARD, border: `1px solid ${BORDER}`, color: '#fff' } }}
        >
          <MenuItem onClick={() => setInsertAnchor(null)} sx={{ gap: 1, fontSize: 13 }}><InsertChartIcon sx={{ fontSize: 16 }} /> Chart</MenuItem>
          <MenuItem onClick={() => setInsertAnchor(null)} sx={{ gap: 1, fontSize: 13 }}><MapIcon sx={{ fontSize: 16 }} /> Map</MenuItem>
          <MenuItem onClick={() => setInsertAnchor(null)} sx={{ gap: 1, fontSize: 13 }}><TableChartIcon sx={{ fontSize: 16 }} /> Table</MenuItem>
          <MenuItem onClick={() => setInsertAnchor(null)} sx={{ gap: 1, fontSize: 13 }}><FunctionsIcon sx={{ fontSize: 16 }} /> Equation</MenuItem>
        </Menu>

        <Divider orientation="vertical" flexItem sx={{ borderColor: BORDER, mx: 0.5 }} />
        <ToolbarButton icon={<CommentIcon sx={{ fontSize: 18 }} />} label="Add Comment" />
      </Paper>

      {/* ========== Main editor area ========== */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Document pane */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 4,
            position: 'relative',
          }}
        >
          {/* Cursor presence indicators */}
          {COLLABORATORS.filter((c) => c.online && c.cursorY !== null).map((c) => (
            <CursorIndicator key={c.id} collaborator={c} />
          ))}

          {/* Document content */}
          <Paper
            sx={{
              bgcolor: BG_EDITOR,
              border: `1px solid ${BORDER}`,
              borderRadius: 2,
              maxWidth: 820,
              mx: 'auto',
              p: 5,
              minHeight: '80vh',
            }}
          >
            {DOCUMENT_SECTIONS.map((section) => (
              <DocumentSection key={section.id} section={section} />
            ))}
          </Paper>
        </Box>

        {/* Comment sidebar */}
        {showComments && (
          <Paper
            sx={{
              bgcolor: BG_CARD,
              borderLeft: `1px solid ${BORDER}`,
              borderRadius: 0,
              width: 340,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${BORDER}` }}>
              <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700 }}>
                Comments ({comments.length})
              </Typography>
              <Select
                size="small"
                value={commentFilter}
                onChange={(e) => setCommentFilter(e.target.value)}
                sx={{
                  color: TEXT_SECONDARY,
                  fontSize: 12,
                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                  '& .MuiSvgIcon-root': { color: TEXT_SECONDARY, fontSize: 18 },
                }}
              >
                <MenuItem value="all" sx={{ fontSize: 12 }}>All</MenuItem>
                <MenuItem value="unresolved" sx={{ fontSize: 12 }}>Unresolved</MenuItem>
                <MenuItem value="resolved" sx={{ fontSize: 12 }}>Resolved</MenuItem>
              </Select>
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto', p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {filteredComments.map((comment) => (
                <CommentThread
                  key={comment.id}
                  comment={comment}
                  onToggleResolve={handleToggleResolve}
                />
              ))}
              {filteredComments.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CommentIcon sx={{ color: TEXT_SECONDARY, fontSize: 32, mb: 1 }} />
                  <Typography variant="body2" sx={{ color: TEXT_SECONDARY }}>
                    No {commentFilter} comments
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        )}
      </Box>
    </Box>
  );
}

// frontend#352: display-only fabricated surface. The default build shows an
// honest not-live state and never mounts the sample.
const WorkspaceEditor = () => (
  <DemoSurfaceGate
    title="The shared workspace editor is not live on the testnet"
    description="No testnet endpoint stores workspaces, collaborators, comments or version history yet."
    testId="collaboration-editor"
  >
    <WorkspaceEditorSample />
  </DemoSurfaceGate>
);

export default WorkspaceEditor;
