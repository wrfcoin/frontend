import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Tooltip,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Grid,
  TextField,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Map as MapIcon,
  CropFree,
  RadioButtonChecked,
  Pentagon,
  Bookmark,
  Delete,
  MyLocation,
  Layers,
  ZoomIn,
  ZoomOut,
  Close,
} from '@mui/icons-material';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLORS = {
  bg: '#0F172A',
  card: '#1E293B',
  border: '#334155',
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  text: '#FFFFFF',
  muted: '#94A3B8',
  regionFill: 'rgba(59, 130, 246, 0.18)',
  regionStroke: '#3B82F6',
  selectedFill: 'rgba(59, 130, 246, 0.35)',
  hoverFill: 'rgba(59, 130, 246, 0.25)',
};

const SELECTION_MODES = [
  { id: 'preset', label: 'Preset Regions', icon: Bookmark },
  { id: 'rectangle', label: 'Draw Rectangle', icon: CropFree },
  { id: 'polygon', label: 'Draw Polygon', icon: Pentagon },
  { id: 'radius', label: 'Radius from Point', icon: RadioButtonChecked },
];

const REGION_CATEGORIES = [
  { id: 'noaa', label: 'NOAA Climate Regions' },
  { id: 'us_states', label: 'US States' },
  { id: 'continental', label: 'Continental Areas' },
  { id: 'custom', label: 'Custom Saved' },
];

const PREDEFINED_REGIONS = [
  {
    id: 'ne_us',
    name: 'Northeast US',
    category: 'noaa',
    bounds: { north: 47.5, south: 37.0, east: -66.9, west: -80.5 },
    area: 457200,
    stationCount: 312,
    dataAvailability: 0.96,
    path: 'M 620 115 L 695 105 L 710 130 L 700 160 L 680 175 L 640 180 L 615 165 L 610 140 Z',
  },
  {
    id: 'se_us',
    name: 'Southeast US',
    category: 'noaa',
    bounds: { north: 37.0, south: 24.5, east: -75.0, west: -91.5 },
    area: 712300,
    stationCount: 478,
    dataAvailability: 0.93,
    path: 'M 570 180 L 680 175 L 700 195 L 690 260 L 640 280 L 580 275 L 540 245 L 535 205 Z',
  },
  {
    id: 'midwest',
    name: 'Upper Midwest',
    category: 'noaa',
    bounds: { north: 49.4, south: 36.5, east: -80.5, west: -97.2 },
    area: 834500,
    stationCount: 524,
    dataAvailability: 0.91,
    path: 'M 440 90 L 570 85 L 615 115 L 615 165 L 570 180 L 535 205 L 470 195 L 430 150 Z',
  },
  {
    id: 'south',
    name: 'South Central',
    category: 'noaa',
    bounds: { north: 37.0, south: 25.8, east: -88.0, west: -106.6 },
    area: 925100,
    stationCount: 389,
    dataAvailability: 0.88,
    path: 'M 390 200 L 470 195 L 535 205 L 540 245 L 530 290 L 460 310 L 390 280 L 370 240 Z',
  },
  {
    id: 'nw_us',
    name: 'Pacific Northwest',
    category: 'noaa',
    bounds: { north: 49.0, south: 42.0, east: -111.0, west: -124.7 },
    area: 504700,
    stationCount: 198,
    dataAvailability: 0.89,
    path: 'M 115 70 L 220 55 L 260 80 L 250 130 L 195 145 L 115 135 L 100 100 Z',
  },
  {
    id: 'sw_us',
    name: 'Desert Southwest',
    category: 'noaa',
    bounds: { north: 42.0, south: 31.3, east: -102.0, west: -124.4 },
    area: 1124800,
    stationCount: 267,
    dataAvailability: 0.85,
    path: 'M 100 100 L 115 135 L 195 145 L 250 130 L 340 140 L 370 200 L 370 240 L 280 280 L 160 260 L 100 190 Z',
  },
  {
    id: 'great_plains',
    name: 'Great Plains',
    category: 'noaa',
    bounds: { north: 49.0, south: 35.0, east: -96.0, west: -109.0 },
    area: 1029000,
    stationCount: 345,
    dataAvailability: 0.87,
    path: 'M 260 80 L 360 75 L 440 90 L 430 150 L 390 200 L 370 200 L 340 140 L 280 120 Z',
  },
  {
    id: 'alaska',
    name: 'Alaska',
    category: 'continental',
    bounds: { north: 71.4, south: 51.2, east: -130.0, west: -179.2 },
    area: 1717854,
    stationCount: 87,
    dataAvailability: 0.72,
    path: 'M 40 310 L 140 290 L 180 310 L 165 355 L 100 370 L 40 350 Z',
  },
];

// ---------------------------------------------------------------------------
// SVG Map Component
// ---------------------------------------------------------------------------

const USMapSVG = ({ regions, selectedRegions, hoveredRegion, onRegionClick, onRegionHover }) => {
  return (
    <svg
      viewBox="0 0 800 420"
      style={{ width: '100%', height: '100%' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background ocean */}
      <rect x="0" y="0" width="800" height="420" fill="#0C1426" rx="8" />

      {/* Simplified US outline */}
      <path
        d="M 90 60 L 220 45 L 360 65 L 440 80 L 570 75 L 620 105 L 695 95 L 720 120
           L 710 150 L 700 185 L 695 250 L 650 275 L 590 270 L 540 285 L 460 305
           L 390 275 L 370 235 L 280 275 L 160 255 L 100 185 L 90 95 Z"
        fill="#1A2744"
        stroke="#2D4A6F"
        strokeWidth="1.5"
      />

      {/* Grid lines */}
      {[100, 200, 300, 400, 500, 600, 700].map(x => (
        <line key={`vg-${x}`} x1={x} y1="0" x2={x} y2="420" stroke="#1E293B" strokeWidth="0.5" strokeDasharray="4 4" />
      ))}
      {[100, 200, 300].map(y => (
        <line key={`hg-${y}`} x1="0" y1={y} x2="800" y2={y} stroke="#1E293B" strokeWidth="0.5" strokeDasharray="4 4" />
      ))}

      {/* Region paths */}
      {regions.map(region => {
        const isSelected = selectedRegions.includes(region.id);
        const isHovered = hoveredRegion === region.id;
        return (
          <g key={region.id}>
            <path
              d={region.path}
              fill={isSelected ? COLORS.selectedFill : isHovered ? COLORS.hoverFill : COLORS.regionFill}
              stroke={isSelected ? COLORS.primary : isHovered ? '#60A5FA' : '#475569'}
              strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1}
              style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
              onClick={() => onRegionClick(region.id)}
              onMouseEnter={() => onRegionHover(region.id)}
              onMouseLeave={() => onRegionHover(null)}
            />
            <text
              x={getRegionCenter(region.path).x}
              y={getRegionCenter(region.path).y}
              textAnchor="middle"
              fill={isSelected ? '#FFFFFF' : '#94A3B8'}
              fontSize="11"
              fontWeight={isSelected ? 600 : 400}
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {region.name}
            </text>
          </g>
        );
      })}

      {/* Selected region station dots */}
      {regions
        .filter(r => selectedRegions.includes(r.id))
        .map(region => {
          const center = getRegionCenter(region.path);
          const dots = generateStationDots(center, 6);
          return dots.map((dot, i) => (
            <circle
              key={`dot-${region.id}-${i}`}
              cx={dot.x}
              cy={dot.y}
              r="2.5"
              fill={COLORS.success}
              opacity="0.7"
            />
          ));
        })}

      {/* Legend */}
      <g transform="translate(15, 385)">
        <rect x="0" y="0" width="12" height="12" fill={COLORS.regionFill} stroke="#475569" strokeWidth="1" />
        <text x="18" y="10" fill="#94A3B8" fontSize="10">Available</text>
        <rect x="90" y="0" width="12" height="12" fill={COLORS.selectedFill} stroke={COLORS.primary} strokeWidth="2" />
        <text x="108" y="10" fill="#94A3B8" fontSize="10">Selected</text>
        <circle cx="196" cy="6" r="3" fill={COLORS.success} opacity="0.7" />
        <text x="204" y="10" fill="#94A3B8" fontSize="10">Stations</text>
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRegionCenter(pathStr) {
  const coords = pathStr.match(/[\d.]+/g);
  if (!coords || coords.length < 4) return { x: 400, y: 200 };
  let sumX = 0, sumY = 0, count = 0;
  for (let i = 0; i < coords.length - 1; i += 2) {
    sumX += parseFloat(coords[i]);
    sumY += parseFloat(coords[i + 1]);
    count++;
  }
  return { x: sumX / count, y: sumY / count };
}

function generateStationDots(center, count) {
  const dots = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const radius = 15 + (i % 3) * 8;
    dots.push({
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    });
  }
  return dots;
}

function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
  return n.toString();
}

// ---------------------------------------------------------------------------
// RegionPicker Component
// ---------------------------------------------------------------------------

const RegionPicker = ({ selectedRegions: externalSelected, onRegionsChange }) => {
  const [selectionMode, setSelectionMode] = useState('preset');
  const [selectedCategory, setSelectedCategory] = useState('noaa');
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const [internalSelected, setInternalSelected] = useState([]);
  const [multiSelect, setMultiSelect] = useState(false);
  const [radiusKm, setRadiusKm] = useState(50);
  const [centerLat, setCenterLat] = useState('');
  const [centerLon, setCenterLon] = useState('');

  const selectedRegions = externalSelected || internalSelected;
  const setSelectedRegions = onRegionsChange || setInternalSelected;

  const filteredRegions = useMemo(() => {
    if (selectedCategory === 'custom') return [];
    return PREDEFINED_REGIONS.filter(r => r.category === selectedCategory);
  }, [selectedCategory]);

  const allRegions = PREDEFINED_REGIONS;

  const handleRegionClick = useCallback(
    regionId => {
      if (multiSelect) {
        setSelectedRegions(prev =>
          prev.includes(regionId) ? prev.filter(id => id !== regionId) : [...prev, regionId],
        );
      } else {
        setSelectedRegions(prev => (prev.includes(regionId) ? [] : [regionId]));
      }
    },
    [multiSelect, setSelectedRegions],
  );

  const handleClearSelection = useCallback(() => {
    setSelectedRegions([]);
  }, [setSelectedRegions]);

  const selectedRegionData = useMemo(
    () => allRegions.filter(r => selectedRegions.includes(r.id)),
    [selectedRegions, allRegions],
  );

  const totalArea = useMemo(
    () => selectedRegionData.reduce((sum, r) => sum + r.area, 0),
    [selectedRegionData],
  );

  const totalStations = useMemo(
    () => selectedRegionData.reduce((sum, r) => sum + r.stationCount, 0),
    [selectedRegionData],
  );

  const avgAvailability = useMemo(() => {
    if (selectedRegionData.length === 0) return 0;
    return selectedRegionData.reduce((sum, r) => sum + r.dataAvailability, 0) / selectedRegionData.length;
  }, [selectedRegionData]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MapIcon sx={{ color: COLORS.primary, fontSize: 24 }} />
          <Typography variant="h6" sx={{ color: COLORS.text, fontWeight: 700 }}>
            Region Selection
          </Typography>
        </Box>
        <FormControlLabel
          control={
            <Switch
              checked={multiSelect}
              onChange={e => setMultiSelect(e.target.checked)}
              size="small"
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': { color: COLORS.primary },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: COLORS.primary },
              }}
            />
          }
          label={<Typography sx={{ color: COLORS.muted, fontSize: 13 }}>Multi-select</Typography>}
        />
      </Box>

      {/* Selection Mode Toolbar */}
      <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, p: 1.5 }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {SELECTION_MODES.map(mode => {
            const Icon = mode.icon;
            return (
              <Button
                key={mode.id}
                variant={selectionMode === mode.id ? 'contained' : 'outlined'}
                size="small"
                startIcon={<Icon sx={{ fontSize: 16 }} />}
                onClick={() => setSelectionMode(mode.id)}
                sx={{
                  color: selectionMode === mode.id ? '#FFFFFF' : COLORS.muted,
                  bgcolor: selectionMode === mode.id ? COLORS.primary : 'transparent',
                  borderColor: COLORS.border,
                  fontSize: 12,
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: selectionMode === mode.id ? '#2563EB' : 'rgba(59, 130, 246, 0.1)',
                    borderColor: COLORS.primary,
                  },
                }}
              >
                {mode.label}
              </Button>
            );
          })}
        </Box>

        {/* Category filter for preset mode */}
        {selectionMode === 'preset' && (
          <Box sx={{ mt: 1.5 }}>
            <FormControl size="small" fullWidth>
              <InputLabel sx={{ color: COLORS.muted, fontSize: 13 }}>Region Category</InputLabel>
              <Select
                value={selectedCategory}
                label="Region Category"
                onChange={e => setSelectedCategory(e.target.value)}
                sx={{
                  color: COLORS.text,
                  fontSize: 13,
                  '.MuiOutlinedInput-notchedOutline': { borderColor: COLORS.border },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.primary },
                  '& .MuiSvgIcon-root': { color: COLORS.muted },
                }}
              >
                {REGION_CATEGORIES.map(cat => (
                  <MenuItem key={cat.id} value={cat.id} sx={{ fontSize: 13 }}>
                    {cat.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        {/* Radius mode controls */}
        {selectionMode === 'radius' && (
          <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              label="Latitude"
              type="number"
              value={centerLat}
              onChange={e => setCenterLat(e.target.value)}
              sx={{
                flex: 1,
                '& .MuiInputBase-root': { color: COLORS.text, fontSize: 13 },
                '& .MuiInputLabel-root': { color: COLORS.muted, fontSize: 13 },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.border },
              }}
            />
            <TextField
              size="small"
              label="Longitude"
              type="number"
              value={centerLon}
              onChange={e => setCenterLon(e.target.value)}
              sx={{
                flex: 1,
                '& .MuiInputBase-root': { color: COLORS.text, fontSize: 13 },
                '& .MuiInputLabel-root': { color: COLORS.muted, fontSize: 13 },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.border },
              }}
            />
            <TextField
              size="small"
              label="Radius (km)"
              type="number"
              value={radiusKm}
              onChange={e => setRadiusKm(Number(e.target.value))}
              sx={{
                width: 100,
                '& .MuiInputBase-root': { color: COLORS.text, fontSize: 13 },
                '& .MuiInputLabel-root': { color: COLORS.muted, fontSize: 13 },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.border },
              }}
            />
          </Box>
        )}
      </Paper>

      {/* Map Area */}
      <Paper
        sx={{
          bgcolor: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          flex: 1,
          minHeight: 320,
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 2,
        }}
      >
        {/* Zoom controls */}
        <Box sx={{ position: 'absolute', top: 10, right: 10, zIndex: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <IconButton size="small" sx={{ bgcolor: 'rgba(30,41,59,0.9)', color: COLORS.muted, '&:hover': { color: COLORS.text } }}>
            <ZoomIn fontSize="small" />
          </IconButton>
          <IconButton size="small" sx={{ bgcolor: 'rgba(30,41,59,0.9)', color: COLORS.muted, '&:hover': { color: COLORS.text } }}>
            <ZoomOut fontSize="small" />
          </IconButton>
          <IconButton size="small" sx={{ bgcolor: 'rgba(30,41,59,0.9)', color: COLORS.muted, '&:hover': { color: COLORS.text } }}>
            <Layers fontSize="small" />
          </IconButton>
        </Box>

        {/* Draw mode overlay */}
        {(selectionMode === 'rectangle' || selectionMode === 'polygon') && (
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              left: 10,
              zIndex: 2,
              bgcolor: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              borderRadius: 1,
              px: 1.5,
              py: 0.5,
            }}
          >
            <Typography sx={{ color: COLORS.primary, fontSize: 12, fontWeight: 600 }}>
              {selectionMode === 'rectangle'
                ? 'Click and drag to draw a rectangle'
                : 'Click to add polygon points, double-click to close'}
            </Typography>
          </Box>
        )}

        <USMapSVG
          regions={allRegions}
          selectedRegions={selectedRegions}
          hoveredRegion={hoveredRegion}
          onRegionClick={handleRegionClick}
          onRegionHover={setHoveredRegion}
        />
      </Paper>

      {/* Region Info Panel */}
      {selectedRegionData.length > 0 && (
        <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography sx={{ color: COLORS.text, fontWeight: 600, fontSize: 14 }}>
              Selected Region{selectedRegionData.length > 1 ? 's' : ''}
            </Typography>
            <Button
              size="small"
              startIcon={<Delete sx={{ fontSize: 14 }} />}
              onClick={handleClearSelection}
              sx={{ color: COLORS.error, fontSize: 12, textTransform: 'none' }}
            >
              Clear
            </Button>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {selectedRegionData.map(region => (
              <Chip
                key={region.id}
                label={region.name}
                size="small"
                onDelete={() => handleRegionClick(region.id)}
                sx={{
                  bgcolor: 'rgba(59, 130, 246, 0.15)',
                  color: COLORS.primary,
                  borderColor: COLORS.primary,
                  '& .MuiChip-deleteIcon': { color: COLORS.muted, '&:hover': { color: COLORS.error } },
                }}
                variant="outlined"
              />
            ))}
          </Box>

          <Divider sx={{ borderColor: COLORS.border, mb: 1.5 }} />

          {/* Summary stats */}
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Typography sx={{ color: COLORS.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Total Area
              </Typography>
              <Typography sx={{ color: COLORS.text, fontWeight: 700, fontSize: 18 }}>
                {formatNumber(totalArea)}
              </Typography>
              <Typography sx={{ color: COLORS.muted, fontSize: 11 }}>sq km</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography sx={{ color: COLORS.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Stations
              </Typography>
              <Typography sx={{ color: COLORS.success, fontWeight: 700, fontSize: 18 }}>
                {totalStations}
              </Typography>
              <Typography sx={{ color: COLORS.muted, fontSize: 11 }}>in region</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography sx={{ color: COLORS.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Data Coverage
              </Typography>
              <Typography sx={{ color: avgAvailability > 0.9 ? COLORS.success : COLORS.warning, fontWeight: 700, fontSize: 18 }}>
                {(avgAvailability * 100).toFixed(0)}%
              </Typography>
              <Typography sx={{ color: COLORS.muted, fontSize: 11 }}>availability</Typography>
            </Grid>
          </Grid>

          {/* Coordinate bounds */}
          {selectedRegionData.length === 1 && (
            <Box sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(15,23,42,0.6)', borderRadius: 1 }}>
              <Typography sx={{ color: COLORS.muted, fontSize: 11, mb: 0.5, textTransform: 'uppercase' }}>
                Bounding Box
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5 }}>
                <Typography sx={{ color: COLORS.text, fontSize: 12, fontFamily: 'monospace' }}>
                  N: {selectedRegionData[0].bounds.north.toFixed(1)}
                </Typography>
                <Typography sx={{ color: COLORS.text, fontSize: 12, fontFamily: 'monospace' }}>
                  E: {selectedRegionData[0].bounds.east.toFixed(1)}
                </Typography>
                <Typography sx={{ color: COLORS.text, fontSize: 12, fontFamily: 'monospace' }}>
                  S: {selectedRegionData[0].bounds.south.toFixed(1)}
                </Typography>
                <Typography sx={{ color: COLORS.text, fontSize: 12, fontFamily: 'monospace' }}>
                  W: {selectedRegionData[0].bounds.west.toFixed(1)}
                </Typography>
              </Box>
            </Box>
          )}
        </Paper>
      )}

      {/* Empty state */}
      {selectedRegionData.length === 0 && (
        <Paper sx={{ bgcolor: COLORS.card, border: `1px dashed ${COLORS.border}`, p: 3, textAlign: 'center' }}>
          <MyLocation sx={{ color: COLORS.muted, fontSize: 36, mb: 1 }} />
          <Typography sx={{ color: COLORS.muted, fontSize: 14 }}>
            Click a region on the map to select your forecast area
          </Typography>
          <Typography sx={{ color: COLORS.muted, fontSize: 12, mt: 0.5 }}>
            Enable multi-select to choose comparison regions
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default RegionPicker;
