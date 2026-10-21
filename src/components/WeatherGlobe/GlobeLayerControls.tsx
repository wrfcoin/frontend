// GlobeLayerControls - Layer toggle panel for the weather globe visualization
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Switch from '@mui/material/Switch';
import Slider from '@mui/material/Slider';
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';
import AirIcon from '@mui/icons-material/Air';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import RadarIcon from '@mui/icons-material/Radar';
import HubIcon from '@mui/icons-material/Hub';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { colors, spacing, borderRadius, shadows } from '../ui/tokens';
import { WrfCard, WrfButton, WrfBadge } from '../ui';

interface LayerState {
  stations: boolean;
  windFlow: boolean;
  temperatureHeatmap: boolean;
  coverageZones: boolean;
  networkConnections: boolean;
  precipitation: boolean;
}

interface GlobeLayerControlsProps {
  layers?: LayerState;
  onToggleLayer?: (layer: keyof LayerState) => void;
  layerCounts?: Record<keyof LayerState, number>;
  overlayOpacity?: number;
  onOpacityChange?: (value: number) => void;
  onResetView?: () => void;
}

interface LayerConfig {
  key: keyof LayerState;
  label: string;
  icon: React.ElementType;
  description: string;
}

const LAYER_CONFIGS: LayerConfig[] = [
  {
    key: 'stations',
    label: 'Stations',
    icon: SatelliteAltIcon,
    description: 'Weather station markers with clustering',
  },
  {
    key: 'windFlow',
    label: 'Wind Flow',
    icon: AirIcon,
    description: 'Animated wind particle simulation',
  },
  {
    key: 'temperatureHeatmap',
    label: 'Temperature',
    icon: ThermostatIcon,
    description: 'Interpolated temperature heatmap',
  },
  {
    key: 'coverageZones',
    label: 'Coverage',
    icon: RadarIcon,
    description: 'Station coverage areas',
  },
  {
    key: 'networkConnections',
    label: 'Network',
    icon: HubIcon,
    description: 'Inter-station connections',
  },
  {
    key: 'precipitation',
    label: 'Precipitation',
    icon: WaterDropIcon,
    description: 'Rain, snow, and sleet overlays',
  },
];

const TEMP_GRADIENT_STOPS = [
  { offset: '0%', color: '#1E50C8' },
  { offset: '25%', color: '#50B4FF' },
  { offset: '40%', color: '#64F0AA' },
  { offset: '55%', color: '#C8E650' },
  { offset: '75%', color: '#F0A028' },
  { offset: '100%', color: '#F03C05' },
];

const PRECIP_LEGEND = [
  { type: 'Rain', color: '#60A5FA', shape: 'line' as const },
  { type: 'Snow', color: '#F0F4FF', shape: 'circle' as const },
  { type: 'Sleet', color: '#FCD34D', shape: 'dash' as const },
];

const DEFAULT_LAYERS: LayerState = {
  stations: true,
  windFlow: false,
  temperatureHeatmap: false,
  coverageZones: false,
  networkConnections: false,
  precipitation: false,
};

const DEFAULT_COUNTS: Record<keyof LayerState, number> = {
  stations: 0,
  windFlow: 0,
  temperatureHeatmap: 0,
  coverageZones: 0,
  networkConnections: 0,
  precipitation: 0,
};

const GlobeLayerControls: React.FC<GlobeLayerControlsProps> = ({
  layers = DEFAULT_LAYERS,
  onToggleLayer = () => {},
  layerCounts = DEFAULT_COUNTS,
  overlayOpacity = 0.7,
  onOpacityChange = () => {},
  onResetView = () => {},
}) => {
  const activeLayers = Object.values(layers).filter(Boolean).length;

  return (
    <WrfCard
      title="Layers"
      subtitle={`${activeLayers} of ${LAYER_CONFIGS.length} active`}
      sx={{ position: 'sticky', top: spacing.lg }}
    >
      {/* Layer toggles */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${spacing.xs}px` }}>
        {LAYER_CONFIGS.map((config) => {
          const IconComp = config.icon;
          const isActive = layers[config.key];
          const count = layerCounts[config.key];

          return (
            <Box
              key={config.key}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: `${spacing.sm}px`,
                borderRadius: `${borderRadius.md}px`,
                backgroundColor: isActive
                  ? `${colors.brand.primary}08`
                  : 'transparent',
                transition: 'background-color 0.2s ease',
                '&:hover': {
                  backgroundColor: `${colors.brand.primary}12`,
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px`, flex: 1, minWidth: 0 }}>
                <IconComp
                  sx={{
                    fontSize: 18,
                    color: isActive ? colors.brand.primary : colors.text.muted,
                    flexShrink: 0,
                  }}
                />
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      color: isActive ? colors.text.primary : colors.text.secondary,
                      lineHeight: 1.3,
                    }}
                  >
                    {config.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.6875rem',
                      color: colors.text.muted,
                      lineHeight: 1.2,
                    }}
                  >
                    {config.description}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.xs}px`, flexShrink: 0 }}>
                <WrfBadge
                  status={isActive ? 'online' : 'offline'}
                  label={String(count)}
                  size="sm"
                />
                <Switch
                  size="small"
                  checked={isActive}
                  onChange={() => onToggleLayer(config.key)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: colors.brand.primary,
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: colors.brand.primary,
                    },
                    '& .MuiSwitch-track': {
                      backgroundColor: colors.text.muted,
                    },
                  }}
                />
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Wind speed legend */}
      {layers.windFlow && (
        <Box sx={{ mt: `${spacing.md}px`, pt: `${spacing.md}px`, borderTop: `1px solid ${colors.border.default}` }}>
          <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted, mb: `${spacing.xs}px`, fontWeight: 500 }}>
            Wind Speed Legend
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Box sx={{ width: 16, height: 2, bgcolor: `${colors.text.secondary}30` }} />
              <Typography sx={{ fontSize: '0.625rem', color: colors.text.muted }}>Light</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Box sx={{ width: 16, height: 2, bgcolor: `${colors.text.secondary}60` }} />
              <Typography sx={{ fontSize: '0.625rem', color: colors.text.muted }}>Moderate</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Box sx={{ width: 16, height: 2, bgcolor: `${colors.text.secondary}` }} />
              <Typography sx={{ fontSize: '0.625rem', color: colors.text.muted }}>Strong</Typography>
            </Box>
          </Box>
        </Box>
      )}

      {/* Temperature color scale legend */}
      {layers.temperatureHeatmap && (
        <Box sx={{ mt: `${spacing.md}px`, pt: `${spacing.md}px`, borderTop: `1px solid ${colors.border.default}` }}>
          <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted, mb: `${spacing.sm}px`, fontWeight: 500 }}>
            Temperature Scale
          </Typography>
          <svg width="100%" height="24" viewBox="0 0 200 24">
            <defs>
              <linearGradient id="temp-legend-gradient" x1="0" y1="0" x2="1" y2="0">
                {TEMP_GRADIENT_STOPS.map((stop, i) => (
                  <stop key={i} offset={stop.offset} stopColor={stop.color} />
                ))}
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="200" height="12" rx="3" fill="url(#temp-legend-gradient)" />
            <text x="0" y="22" fill={colors.text.muted} fontSize="8" fontFamily="sans-serif">-25</text>
            <text x="45" y="22" fill={colors.text.muted} fontSize="8" fontFamily="sans-serif">-5</text>
            <text x="90" y="22" fill={colors.text.muted} fontSize="8" fontFamily="sans-serif">10</text>
            <text x="140" y="22" fill={colors.text.muted} fontSize="8" fontFamily="sans-serif">30</text>
            <text x="185" y="22" fill={colors.text.muted} fontSize="8" fontFamily="sans-serif">45</text>
          </svg>
          <Typography sx={{ fontSize: '0.625rem', color: colors.text.muted, textAlign: 'center', mt: '2px' }}>
            Degrees Celsius
          </Typography>
        </Box>
      )}

      {/* Precipitation type legend */}
      {layers.precipitation && (
        <Box sx={{ mt: `${spacing.md}px`, pt: `${spacing.md}px`, borderTop: `1px solid ${colors.border.default}` }}>
          <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted, mb: `${spacing.sm}px`, fontWeight: 500 }}>
            Precipitation Types
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${spacing.xs}px` }}>
            {PRECIP_LEGEND.map((item) => (
              <Box key={item.type} sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px` }}>
                <svg width="20" height="14" viewBox="0 0 20 14">
                  {item.shape === 'line' && (
                    <>
                      <line x1="4" y1="2" x2="3" y2="12" stroke={item.color} strokeWidth="1.5" />
                      <line x1="10" y1="1" x2="9" y2="11" stroke={item.color} strokeWidth="1.5" />
                      <line x1="16" y1="3" x2="15" y2="13" stroke={item.color} strokeWidth="1.5" />
                    </>
                  )}
                  {item.shape === 'circle' && (
                    <>
                      <circle cx="4" cy="5" r="2" fill={item.color} opacity="0.9" />
                      <circle cx="10" cy="9" r="1.8" fill={item.color} opacity="0.8" />
                      <circle cx="16" cy="4" r="1.5" fill={item.color} opacity="0.85" />
                    </>
                  )}
                  {item.shape === 'dash' && (
                    <>
                      <line x1="3" y1="2" x2="5" y2="10" stroke={item.color} strokeWidth="1.5" />
                      <line x1="9" y1="3" x2="11" y2="11" stroke={item.color} strokeWidth="1.5" />
                      <line x1="15" y1="1" x2="17" y2="9" stroke={item.color} strokeWidth="1.5" />
                    </>
                  )}
                </svg>
                <Typography sx={{ fontSize: '0.6875rem', color: colors.text.secondary }}>
                  {item.type}
                </Typography>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: item.color,
                    opacity: 0.8,
                    flexShrink: 0,
                  }}
                />
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Overlay opacity slider */}
      <Box sx={{ mt: `${spacing.md}px`, pt: `${spacing.md}px`, borderTop: `1px solid ${colors.border.default}` }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: `${spacing.xs}px` }}>
          <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted, fontWeight: 500 }}>
            Overlay Opacity
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: colors.text.secondary, fontWeight: 600 }}>
            {overlayOpacity}%
          </Typography>
        </Box>
        <Slider
          value={overlayOpacity}
          onChange={(_e, val) => onOpacityChange(val as number)}
          min={0}
          max={100}
          size="small"
          sx={{
            color: colors.brand.primary,
            '& .MuiSlider-track': {
              backgroundColor: colors.brand.primary,
            },
            '& .MuiSlider-rail': {
              backgroundColor: colors.border.default,
            },
            '& .MuiSlider-thumb': {
              backgroundColor: colors.brand.primary,
              width: 14,
              height: 14,
              '&:hover': {
                boxShadow: shadows.glow(colors.brand.primary),
              },
            },
          }}
        />
      </Box>

      {/* Reset View */}
      <Box sx={{ mt: `${spacing.md}px` }}>
        <WrfButton
          variant="secondary"
          size="sm"
          fullWidth
          onClick={onResetView}
          startIcon={<RestartAltIcon sx={{ fontSize: 16 }} />}
        >
          Reset View
        </WrfButton>
      </Box>
    </WrfCard>
  );
};

export default GlobeLayerControls;
