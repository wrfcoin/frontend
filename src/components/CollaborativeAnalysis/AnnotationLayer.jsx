import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  Slider,
  Switch,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Draw as DrawIcon,
  Circle as CircleOutlineIcon,
  CropSquare as RectangleIcon,
  TrendingFlat as ArrowIcon,
  TextFields as TextIcon,
  PushPin as PinIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Layers as LayersIcon,
  CenterFocusStrong as FocusIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  ColorLens as ColorLensIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  FiberManualRecord as DotIcon,
} from '@mui/icons-material';
import { apiClient } from '../../services/apiClient';

// ---------------------------------------------------------------------------
// Theme
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

// ---------------------------------------------------------------------------
// Preset colors
// ---------------------------------------------------------------------------
const PRESET_COLORS = [
  { id: 'red', value: '#EF4444', label: 'Red' },
  { id: 'blue', value: '#3B82F6', label: 'Blue' },
  { id: 'green', value: '#10B981', label: 'Green' },
  { id: 'yellow', value: '#F59E0B', label: 'Yellow' },
  { id: 'purple', value: '#8B5CF6', label: 'Purple' },
  { id: 'cyan', value: '#06B6D4', label: 'Cyan' },
];

// ---------------------------------------------------------------------------
// Annotation tools
// ---------------------------------------------------------------------------
const ANNOTATION_TOOLS = [
  { id: 'pencil', icon: <DrawIcon sx={{ fontSize: 18 }} />, label: 'Freeform Draw' },
  { id: 'circle', icon: <CircleOutlineIcon sx={{ fontSize: 18 }} />, label: 'Circle' },
  { id: 'rectangle', icon: <RectangleIcon sx={{ fontSize: 18 }} />, label: 'Rectangle' },
  { id: 'arrow', icon: <ArrowIcon sx={{ fontSize: 18 }} />, label: 'Arrow' },
  { id: 'text', icon: <TextIcon sx={{ fontSize: 18 }} />, label: 'Text Label' },
  { id: 'pin', icon: <PinIcon sx={{ fontSize: 18 }} />, label: 'Pin Marker' },
];


// ---------------------------------------------------------------------------
// Layer definitions
// ---------------------------------------------------------------------------
const INITIAL_LAYERS = [
  { id: 'storm-tracks', name: 'Storm Tracks', visible: true, opacity: 100 },
  { id: 'frontal', name: 'Frontal Analysis', visible: true, opacity: 100 },
  { id: 'pressure', name: 'Pressure Systems', visible: true, opacity: 85 },
  { id: 'convection', name: 'Convection', visible: true, opacity: 90 },
  { id: 'observations', name: 'Observations', visible: true, opacity: 100 },
  { id: 'upper-air', name: 'Upper Air', visible: false, opacity: 70 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getInitials(name) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2);
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

function getToolIcon(type) {
  const tool = ANNOTATION_TOOLS.find((t) => t.id === type);
  return tool ? tool.icon : <DrawIcon sx={{ fontSize: 14 }} />;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
function AnnotationLayer() {
  const [activeTool, setActiveTool] = useState(null);
  const [activeColor, setActiveColor] = useState(PRESET_COLORS[0].value);
  const [layers, setLayers] = useState(INITIAL_LAYERS);
  const [annotations, setAnnotations] = useState([]);

  useEffect(() => {
    apiClient.get('/collaborative/annotations')
      .then((data) => setAnnotations(Array.isArray(data) ? data : (data.annotations ?? [])))
      .catch(() => setAnnotations([]));
  }, []);
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuTarget, setMenuTarget] = useState(null);

  const handleToggleLayer = useCallback((layerId) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l)),
    );
  }, []);

  const handleOpacityChange = useCallback((layerId, value) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, opacity: value } : l)),
    );
  }, []);

  const handleDeleteAnnotation = useCallback((annId) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== annId));
    setMenuAnchor(null);
    setMenuTarget(null);
  }, []);

  const handleSelectAnnotation = useCallback((ann) => {
    setSelectedAnnotation(ann.id === selectedAnnotation ? null : ann.id);
  }, [selectedAnnotation]);

  const visibleLayers = useMemo(() => {
    const visible = new Set(layers.filter((l) => l.visible).map((l) => l.name));
    return visible;
  }, [layers]);

  const visibleAnnotations = useMemo(() => {
    return annotations.filter((a) => visibleLayers.has(a.layer));
  }, [annotations, visibleLayers]);

  return (
    <Box sx={{ bgcolor: BG_ROOT, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper
        sx={{
          bgcolor: BG_CARD,
          borderBottom: `1px solid ${BORDER}`,
          borderRadius: 0,
          px: 2.5,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <LayersIcon sx={{ color: PRIMARY }} />
          <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 700 }}>
            Annotation Layer
          </Typography>
          <Chip
            label={`${visibleAnnotations.length} annotations`}
            size="small"
            sx={{ bgcolor: `${PRIMARY}15`, color: PRIMARY, fontSize: 11, height: 22, fontWeight: 500 }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
            size="small"
            sx={{
              color: TEXT_SECONDARY,
              borderColor: BORDER,
              textTransform: 'none',
              fontSize: 12,
              fontWeight: 500,
              borderRadius: 1.5,
              '&:hover': { borderColor: PRIMARY, color: PRIMARY },
            }}
          >
            Export Annotations as GeoJSON
          </Button>
        </Box>
      </Paper>

      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* ========== Left panel: tools & layers ========== */}
        <Paper
          sx={{
            bgcolor: BG_CARD,
            borderRight: `1px solid ${BORDER}`,
            borderRadius: 0,
            width: 260,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
          }}
        >
          {/* Tool palette */}
          <Box sx={{ p: 2, borderBottom: `1px solid ${BORDER}` }}>
            <Typography variant="caption" sx={{ color: TEXT_SECONDARY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, mb: 1.5, display: 'block' }}>
              Drawing Tools
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {ANNOTATION_TOOLS.map((tool) => (
                <Tooltip key={tool.id} title={tool.label} placement="top">
                  <IconButton
                    size="small"
                    onClick={() => setActiveTool(activeTool === tool.id ? null : tool.id)}
                    sx={{
                      color: activeTool === tool.id ? '#fff' : TEXT_SECONDARY,
                      bgcolor: activeTool === tool.id ? PRIMARY : 'transparent',
                      border: `1px solid ${activeTool === tool.id ? PRIMARY : BORDER}`,
                      borderRadius: 1.5,
                      width: 38,
                      height: 38,
                      '&:hover': { bgcolor: activeTool === tool.id ? PRIMARY : `${PRIMARY}15` },
                    }}
                  >
                    {tool.icon}
                  </IconButton>
                </Tooltip>
              ))}
            </Box>

            {/* Undo/Redo */}
            <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
              <IconButton size="small" sx={{ color: TEXT_SECONDARY }}>
                <UndoIcon sx={{ fontSize: 16 }} />
              </IconButton>
              <IconButton size="small" sx={{ color: TEXT_SECONDARY }}>
                <RedoIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          </Box>

          {/* Color picker */}
          <Box sx={{ p: 2, borderBottom: `1px solid ${BORDER}` }}>
            <Typography variant="caption" sx={{ color: TEXT_SECONDARY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, mb: 1.5, display: 'block' }}>
              Color
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {PRESET_COLORS.map((c) => (
                <Tooltip key={c.id} title={c.label}>
                  <IconButton
                    size="small"
                    onClick={() => setActiveColor(c.value)}
                    sx={{
                      width: 30,
                      height: 30,
                      bgcolor: c.value,
                      border: activeColor === c.value ? '2px solid #fff' : '2px solid transparent',
                      borderRadius: '50%',
                      '&:hover': { opacity: 0.8 },
                    }}
                  >
                    {activeColor === c.value && (
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#fff' }} />
                    )}
                  </IconButton>
                </Tooltip>
              ))}
            </Box>
          </Box>

          {/* Layer management */}
          <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
            <Typography variant="caption" sx={{ color: TEXT_SECONDARY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, mb: 1.5, display: 'block' }}>
              Layers
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {layers.map((layer) => {
                const layerAnnotationCount = annotations.filter((a) => a.layer === layer.name).length;
                return (
                  <Paper
                    key={layer.id}
                    sx={{
                      bgcolor: BG_ROOT,
                      border: `1px solid ${BORDER}`,
                      borderRadius: 1.5,
                      p: 1.5,
                      opacity: layer.visible ? 1 : 0.5,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleLayer(layer.id)}
                          sx={{ color: layer.visible ? PRIMARY : TEXT_SECONDARY, p: 0.3 }}
                        >
                          {layer.visible ? <VisibilityIcon sx={{ fontSize: 16 }} /> : <VisibilityOffIcon sx={{ fontSize: 16 }} />}
                        </IconButton>
                        <Typography variant="body2" sx={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>
                          {layer.name}
                        </Typography>
                      </Box>
                      <Chip
                        label={layerAnnotationCount}
                        size="small"
                        sx={{ bgcolor: `${BORDER}60`, color: TEXT_SECONDARY, fontSize: 10, height: 18, minWidth: 24 }}
                      />
                    </Box>
                    {layer.visible && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 0.5 }}>
                        <Typography variant="caption" sx={{ color: TEXT_SECONDARY, fontSize: 10, minWidth: 48 }}>
                          Opacity
                        </Typography>
                        <Slider
                          size="small"
                          value={layer.opacity}
                          onChange={(_, v) => handleOpacityChange(layer.id, v)}
                          min={10}
                          max={100}
                          sx={{
                            color: PRIMARY,
                            height: 3,
                            '& .MuiSlider-thumb': { width: 12, height: 12 },
                          }}
                        />
                        <Typography variant="caption" sx={{ color: TEXT_SECONDARY, fontSize: 10, minWidth: 28, textAlign: 'right' }}>
                          {layer.opacity}%
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                );
              })}
            </Box>
          </Box>
        </Paper>

        {/* ========== Center: map / chart canvas ========== */}
        <Box sx={{ flex: 1, p: 3, overflow: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Paper
            sx={{
              bgcolor: BG_CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: 2,
              width: '100%',
              maxWidth: 800,
              aspectRatio: '16/10',
              position: 'relative',
              overflow: 'hidden',
              cursor: activeTool ? 'crosshair' : 'default',
            }}
          >
            {/* Mock map background */}
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background: `
                  radial-gradient(circle at 30% 40%, ${PRIMARY}08 0%, transparent 50%),
                  radial-gradient(circle at 70% 60%, ${SUCCESS}08 0%, transparent 50%),
                  radial-gradient(circle at 50% 30%, ${WARNING}05 0%, transparent 40%),
                  linear-gradient(180deg, #0F172A 0%, #1a2744 50%, #0F172A 100%)
                `,
              }}
            />

            {/* Grid lines (mock map grid) */}
            {[1, 2, 3, 4].map((i) => (
              <React.Fragment key={`grid-${i}`}>
                <Box
                  sx={{
                    position: 'absolute',
                    left: `${i * 20}%`,
                    top: 0,
                    bottom: 0,
                    width: 1,
                    bgcolor: `${BORDER}30`,
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: `${i * 20}%`,
                    left: 0,
                    right: 0,
                    height: 1,
                    bgcolor: `${BORDER}30`,
                  }}
                />
              </React.Fragment>
            ))}

            {/* Mock latitude/longitude labels */}
            <Typography variant="caption" sx={{ position: 'absolute', left: 8, top: '20%', color: `${TEXT_SECONDARY}50`, fontSize: 9 }}>40N</Typography>
            <Typography variant="caption" sx={{ position: 'absolute', left: 8, top: '40%', color: `${TEXT_SECONDARY}50`, fontSize: 9 }}>30N</Typography>
            <Typography variant="caption" sx={{ position: 'absolute', left: 8, top: '60%', color: `${TEXT_SECONDARY}50`, fontSize: 9 }}>20N</Typography>
            <Typography variant="caption" sx={{ position: 'absolute', left: 8, top: '80%', color: `${TEXT_SECONDARY}50`, fontSize: 9 }}>10N</Typography>
            <Typography variant="caption" sx={{ position: 'absolute', bottom: 4, left: '20%', color: `${TEXT_SECONDARY}50`, fontSize: 9 }}>90W</Typography>
            <Typography variant="caption" sx={{ position: 'absolute', bottom: 4, left: '40%', color: `${TEXT_SECONDARY}50`, fontSize: 9 }}>80W</Typography>
            <Typography variant="caption" sx={{ position: 'absolute', bottom: 4, left: '60%', color: `${TEXT_SECONDARY}50`, fontSize: 9 }}>70W</Typography>
            <Typography variant="caption" sx={{ position: 'absolute', bottom: 4, left: '80%', color: `${TEXT_SECONDARY}50`, fontSize: 9 }}>60W</Typography>

            {/* Rendered annotations on canvas */}
            {visibleAnnotations.map((ann) => {
              const layerData = layers.find((l) => l.name === ann.layer);
              const opacity = layerData ? layerData.opacity / 100 : 1;
              const isSelected = selectedAnnotation === ann.id;

              return (
                <Tooltip key={ann.id} title={`${ann.author.name}: ${ann.note.slice(0, 60)}...`}>
                  <Box
                    onClick={() => handleSelectAnnotation(ann)}
                    sx={{
                      position: 'absolute',
                      left: ann.position.x,
                      top: ann.position.y,
                      opacity,
                      cursor: 'pointer',
                      transition: 'transform 0.15s',
                      transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                      zIndex: isSelected ? 50 : 10,
                    }}
                  >
                    {ann.type === 'pin' && (
                      <PinIcon sx={{ fontSize: 24, color: ann.color, filter: isSelected ? `drop-shadow(0 0 6px ${ann.color})` : 'none' }} />
                    )}
                    {ann.type === 'circle' && (
                      <Box sx={{ width: 40, height: 40, borderRadius: '50%', border: `2px solid ${ann.color}`, bgcolor: `${ann.color}15`, boxShadow: isSelected ? `0 0 12px ${ann.color}60` : 'none' }} />
                    )}
                    {ann.type === 'rectangle' && (
                      <Box sx={{ width: 60, height: 36, border: `2px solid ${ann.color}`, bgcolor: `${ann.color}10`, borderRadius: 0.5, boxShadow: isSelected ? `0 0 12px ${ann.color}60` : 'none' }} />
                    )}
                    {ann.type === 'arrow' && (
                      <ArrowIcon sx={{ fontSize: 32, color: ann.color, filter: isSelected ? `drop-shadow(0 0 6px ${ann.color})` : 'none' }} />
                    )}
                    {ann.type === 'text' && (
                      <Chip
                        label={ann.note.split(' - ')[0] || ann.note.slice(0, 16)}
                        size="small"
                        sx={{
                          bgcolor: `${ann.color}20`,
                          color: ann.color,
                          border: `1px solid ${ann.color}60`,
                          fontSize: 9,
                          height: 20,
                          fontWeight: 600,
                          boxShadow: isSelected ? `0 0 8px ${ann.color}40` : 'none',
                        }}
                      />
                    )}
                    {ann.type === 'pencil' && (
                      <Box sx={{ width: 50, height: 3, bgcolor: ann.color, borderRadius: 1, transform: 'rotate(-15deg)', boxShadow: isSelected ? `0 0 8px ${ann.color}60` : 'none' }} />
                    )}
                    {/* Author avatar badge */}
                    <Avatar
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        width: 16,
                        height: 16,
                        fontSize: 8,
                        bgcolor: ann.author.color,
                        border: `1.5px solid ${BG_CARD}`,
                      }}
                    >
                      {ann.author.name[0]}
                    </Avatar>
                  </Box>
                </Tooltip>
              );
            })}

            {/* Active tool indicator */}
            {activeTool && (
              <Box sx={{ position: 'absolute', bottom: 12, left: 12, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  icon={getToolIcon(activeTool)}
                  label={ANNOTATION_TOOLS.find((t) => t.id === activeTool)?.label}
                  size="small"
                  sx={{
                    bgcolor: `${PRIMARY}25`,
                    color: PRIMARY,
                    fontWeight: 600,
                    fontSize: 11,
                    '& .MuiChip-icon': { color: PRIMARY },
                  }}
                />
                <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: activeColor, border: '2px solid #fff' }} />
              </Box>
            )}
          </Paper>
        </Box>

        {/* ========== Right panel: annotation list ========== */}
        <Paper
          sx={{
            bgcolor: BG_CARD,
            borderLeft: `1px solid ${BORDER}`,
            borderRadius: 0,
            width: 320,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700 }}>
              Annotations ({visibleAnnotations.length})
            </Typography>
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
            <List disablePadding>
              {visibleAnnotations.map((ann) => (
                <ListItem
                  key={ann.id}
                  onClick={() => handleSelectAnnotation(ann)}
                  sx={{
                    bgcolor: selectedAnnotation === ann.id ? `${PRIMARY}12` : 'transparent',
                    border: `1px solid ${selectedAnnotation === ann.id ? PRIMARY : 'transparent'}`,
                    borderRadius: 1.5,
                    mb: 0.5,
                    cursor: 'pointer',
                    px: 1.5,
                    py: 1,
                    '&:hover': { bgcolor: `${BORDER}30` },
                    transition: 'all 0.15s',
                  }}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuAnchor(e.currentTarget);
                        setMenuTarget(ann.id);
                      }}
                      sx={{ color: TEXT_SECONDARY }}
                    >
                      <MoreVertIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  }
                >
                  <ListItemAvatar sx={{ minWidth: 36 }}>
                    <Avatar sx={{ bgcolor: ann.author.color, width: 28, height: 28, fontSize: 11 }}>
                      {getInitials(ann.author.name)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: ann.color, flexShrink: 0 }} />
                        <Typography variant="body2" sx={{ color: '#fff', fontSize: 12, fontWeight: 600 }} noWrap>
                          {ann.layer}
                        </Typography>
                        <Chip
                          label={ann.type}
                          size="small"
                          sx={{ bgcolor: `${BORDER}60`, color: TEXT_SECONDARY, fontSize: 9, height: 16, ml: 'auto' }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" sx={{ color: '#CBD5E1', fontSize: 11, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>
                          {ann.note}
                        </Typography>
                        <Typography variant="caption" sx={{ color: `${TEXT_SECONDARY}80`, fontSize: 10, display: 'block', mt: 0.3 }}>
                          {ann.author.name.split(' ')[0]} - {formatRelative(ann.timestamp)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          {/* Context menu */}
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => { setMenuAnchor(null); setMenuTarget(null); }}
            PaperProps={{ sx: { bgcolor: BG_CARD, border: `1px solid ${BORDER}`, color: '#fff' } }}
          >
            <MenuItem onClick={() => { setMenuAnchor(null); }} sx={{ gap: 1, fontSize: 13 }}>
              <FocusIcon sx={{ fontSize: 16 }} /> Zoom to Location
            </MenuItem>
            <MenuItem onClick={() => { setMenuAnchor(null); }} sx={{ gap: 1, fontSize: 13 }}>
              <EditIcon sx={{ fontSize: 16 }} /> Edit Note
            </MenuItem>
            <Divider sx={{ borderColor: BORDER }} />
            <MenuItem onClick={() => handleDeleteAnnotation(menuTarget)} sx={{ gap: 1, fontSize: 13, color: ERROR }}>
              <DeleteIcon sx={{ fontSize: 16 }} /> Delete
            </MenuItem>
          </Menu>
        </Paper>
      </Box>
    </Box>
  );
}

export default AnnotationLayer;
