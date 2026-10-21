// AccessibilitySettings.tsx - Comprehensive accessibility preferences panel
// WCAG 2.1 AA/AAA compliance settings with live previews
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';
import Slider from '@mui/material/Slider';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import ContrastIcon from '@mui/icons-material/Contrast';
import FormatSizeIcon from '@mui/icons-material/FormatSize';
import SpeedIcon from '@mui/icons-material/Speed';
import RestoreIcon from '@mui/icons-material/Restore';
import { colors, spacing, borderRadius, shadows } from '../ui/tokens';
import WrfCard from '../ui/WrfCard';
import WrfStatCard from '../ui/WrfStatCard';
import WrfButton from '../ui/WrfButton';
import WrfBadge from '../ui/WrfBadge';

// ---- Types ----
interface AccessibilityPreferences {
  fontSize: number;
  highContrast: boolean;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  reducedMotion: boolean;
  theme: 'dark' | 'light' | 'system';
  lineSpacing: number;
  letterSpacing: number;
  dyslexiaFont: boolean;
  focusIndicator: 'default' | 'enhanced' | 'high-visibility';
  tabOrderVisualization: boolean;
  autoFocusManagement: boolean;
  ariaVerbosity: 'polite' | 'assertive';
  landmarksDescription: boolean;
  imageDescriptions: boolean;
}

const STORAGE_KEY = 'wrfcoin-a11y-preferences';

const defaultPreferences: AccessibilityPreferences = {
  fontSize: 16,
  highContrast: false,
  colorBlindMode: 'none',
  reducedMotion: false,
  theme: 'dark',
  lineSpacing: 1.5,
  letterSpacing: 0,
  dyslexiaFont: false,
  focusIndicator: 'default',
  tabOrderVisualization: false,
  autoFocusManagement: true,
  ariaVerbosity: 'polite',
  landmarksDescription: true,
  imageDescriptions: true,
};

// ---- Color-blind palette samples ----
const colorPalettes: Record<string, string[]> = {
  none: ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'],
  protanopia: ['#997A00', '#D4B800', '#6B9F47', '#3B82F6', '#8B5CF6', '#8888CC'],
  deuteranopia: ['#A89000', '#D4A800', '#7B8F3E', '#3B82F6', '#8B5CF6', '#9999BB'],
  tritanopia: ['#EF4444', '#FF8888', '#449999', '#3355AA', '#774477', '#CC5577'],
};

// ---- Focus indicator styles ----
const focusStyles: Record<string, React.CSSProperties> = {
  default: { outline: `2px solid ${colors.brand.primary}`, outlineOffset: '2px' },
  enhanced: { outline: `3px solid ${colors.brand.primary}`, outlineOffset: '3px', boxShadow: `0 0 0 6px rgba(59,130,246,0.25)` },
  'high-visibility': { outline: `3px dashed #FBBF24`, outlineOffset: '3px', boxShadow: `0 0 0 6px rgba(251,191,36,0.3)` },
};

// ---- Utility: contrast ratio ----
function luminance(hex: string): number {
  const rgb = hex.replace('#', '').match(/.{2}/g)!.map(c => {
    const v = parseInt(c, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function contrastRatio(fg: string, bg: string): number {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return parseFloat(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

// ---- Section Header ----
const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({
  icon, title, description,
}) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.md}px`, mb: `${spacing.md}px` }}>
    <Box sx={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: 40, height: 40, borderRadius: `${borderRadius.md}px`,
      backgroundColor: `${colors.brand.primary}15`,
    }}>
      {icon}
    </Box>
    <Box>
      <Typography sx={{ fontSize: '1.125rem', fontWeight: 600, color: colors.text.primary }}>{title}</Typography>
      <Typography sx={{ fontSize: '0.8rem', color: colors.text.muted }}>{description}</Typography>
    </Box>
  </Box>
);

// ---- Component ----
const AccessibilitySettings: React.FC = () => {
  const [prefs, setPrefs] = useState<AccessibilityPreferences>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...defaultPreferences, ...JSON.parse(stored) } : defaultPreferences;
    } catch {
      return defaultPreferences;
    }
  });

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [prefs]);

  // Respect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches && !prefs.reducedMotion) {
      setPrefs(p => ({ ...p, reducedMotion: true }));
    }
  }, []);

  const updatePref = useCallback(<K extends keyof AccessibilityPreferences>(
    key: K, value: AccessibilityPreferences[K],
  ) => {
    setPrefs(p => ({ ...p, [key]: value }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setPrefs(defaultPreferences);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Computed WCAG level
  const wcagLevel = useMemo(() => {
    let score = 0;
    if (prefs.highContrast) score += 2;
    if (prefs.focusIndicator !== 'default') score += 1;
    if (prefs.imageDescriptions) score += 1;
    if (prefs.landmarksDescription) score += 1;
    if (prefs.fontSize >= 18) score += 1;
    return score >= 5 ? 'AAA' : score >= 2 ? 'AA' : 'A';
  }, [prefs]);

  const currentContrast = useMemo(() => {
    const bg = prefs.highContrast ? '#000000' : colors.bg.primary;
    const fg = prefs.highContrast ? '#FFFFFF' : colors.text.primary;
    return contrastRatio(fg, bg);
  }, [prefs.highContrast]);

  const fontScale = useMemo(() => `${Math.round((prefs.fontSize / 16) * 100)}%`, [prefs.fontSize]);

  return (
    <Box sx={{ bgcolor: colors.bg.primary, color: colors.text.primary, minHeight: '100vh', p: 3 }}>
      {/* Page Header */}
      <Box sx={{ mb: `${spacing.lg}px` }}>
        <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: colors.text.primary, mb: `${spacing.xs}px` }}>
          Accessibility Settings
        </Typography>
        <Typography sx={{ fontSize: '0.9rem', color: colors.text.secondary }}>
          Configure your accessibility preferences for an optimized experience. All settings are saved locally.
        </Typography>
      </Box>

      {/* Stat Cards Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="WCAG Level"
            value={wcagLevel}
            color={wcagLevel === 'AAA' ? colors.success.main : wcagLevel === 'AA' ? colors.brand.primary : colors.warning.main}
            icon={AccessibilityNewIcon}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Contrast Ratio"
            value={`${currentContrast}:1`}
            color={currentContrast >= 7 ? colors.success.main : currentContrast >= 4.5 ? colors.brand.primary : colors.error.main}
            icon={ContrastIcon}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Font Scale"
            value={fontScale}
            color={colors.brand.primary}
            icon={FormatSizeIcon}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Motion Reduced"
            value={prefs.reducedMotion ? 'Yes' : 'No'}
            color={prefs.reducedMotion ? colors.success.main : colors.text.muted}
            icon={SpeedIcon}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* ---- Visual Settings ---- */}
        <Grid size={{ xs: 12, md: 6 }}>
          <WrfCard title="Visual Settings" subtitle="Adjust display and contrast preferences">
            <SectionHeader
              icon={<VisibilityIcon sx={{ color: colors.brand.primary, fontSize: 22 }} />}
              title="Display"
              description="Font size, contrast, and color adjustments"
            />

            {/* Font Size Slider */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontSize: '0.85rem', color: colors.text.secondary }}>Font Size</Typography>
                <Typography sx={{ fontSize: '0.85rem', color: colors.brand.primary, fontWeight: 600 }}>{prefs.fontSize}px</Typography>
              </Box>
              <Slider
                value={prefs.fontSize}
                onChange={(_, v) => updatePref('fontSize', v as number)}
                min={12}
                max={24}
                step={1}
                marks={[
                  { value: 12, label: '12' },
                  { value: 16, label: '16' },
                  { value: 20, label: '20' },
                  { value: 24, label: '24' },
                ]}
                sx={{
                  color: colors.brand.primary,
                  '& .MuiSlider-markLabel': { color: colors.text.muted, fontSize: '0.7rem' },
                  '& .MuiSlider-track': { backgroundColor: colors.brand.primary },
                  '& .MuiSlider-rail': { backgroundColor: colors.border.default },
                }}
                aria-label="Font size"
              />
              <Box sx={{
                mt: 1, p: 2, borderRadius: `${borderRadius.md}px`,
                bgcolor: colors.bg.tertiary, border: `1px solid ${colors.border.default}`,
              }}>
                <Typography sx={{ fontSize: `${prefs.fontSize}px`, color: colors.text.primary }}>
                  Live preview text at {prefs.fontSize}px
                </Typography>
              </Box>
            </Box>

            {/* High Contrast Toggle */}
            <Box sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={prefs.highContrast}
                    onChange={(e) => updatePref('highContrast', e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: colors.brand.primary },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: colors.brand.primary },
                    }}
                  />
                }
                label={<Typography sx={{ fontSize: '0.85rem', color: colors.text.secondary }}>High Contrast Mode</Typography>}
              />
              <Grid container spacing={1} sx={{ mt: 1 }}>
                <Grid size={{ xs: 6 }}>
                  <Box sx={{
                    p: 2, borderRadius: `${borderRadius.md}px`, textAlign: 'center',
                    bgcolor: colors.bg.secondary, border: `1px solid ${colors.border.default}`,
                  }}>
                    <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted, mb: 0.5 }}>Normal</Typography>
                    <Typography sx={{ fontSize: '0.85rem', color: colors.text.primary }}>Sample Text</Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Box sx={{
                    p: 2, borderRadius: `${borderRadius.md}px`, textAlign: 'center',
                    bgcolor: '#000000', border: `1px solid #FFFFFF`,
                  }}>
                    <Typography sx={{ fontSize: '0.7rem', color: '#AAAAAA', mb: 0.5 }}>High Contrast</Typography>
                    <Typography sx={{ fontSize: '0.85rem', color: '#FFFFFF', fontWeight: 700 }}>Sample Text</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* Color Blind Mode */}
            <Box sx={{ mb: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel
                  sx={{ color: colors.text.secondary, '&.Mui-focused': { color: colors.brand.primary } }}
                >
                  Color Blind Mode
                </InputLabel>
                <Select
                  value={prefs.colorBlindMode}
                  onChange={(e) => updatePref('colorBlindMode', e.target.value as AccessibilityPreferences['colorBlindMode'])}
                  label="Color Blind Mode"
                  sx={{
                    color: colors.text.primary,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border.default },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.border.light },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.brand.primary },
                    '& .MuiSvgIcon-root': { color: colors.text.secondary },
                  }}
                >
                  <MenuItem value="none">None (Default)</MenuItem>
                  <MenuItem value="protanopia">Protanopia (Red-Blind)</MenuItem>
                  <MenuItem value="deuteranopia">Deuteranopia (Green-Blind)</MenuItem>
                  <MenuItem value="tritanopia">Tritanopia (Blue-Blind)</MenuItem>
                </Select>
              </FormControl>
              {/* Color palette preview */}
              <Box sx={{ display: 'flex', gap: '4px', mt: 1.5 }}>
                {(colorPalettes[prefs.colorBlindMode] || colorPalettes.none).map((color, i) => (
                  <Tooltip key={i} title={color} arrow>
                    <Box sx={{
                      flex: 1, height: 28, borderRadius: `${borderRadius.sm}px`,
                      backgroundColor: color, border: `1px solid ${colors.border.default}`,
                      cursor: 'pointer',
                    }} />
                  </Tooltip>
                ))}
              </Box>
              <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted, mt: 0.5 }}>
                Preview: Adjusted color palette for {prefs.colorBlindMode === 'none' ? 'normal vision' : prefs.colorBlindMode}
              </Typography>
            </Box>

            {/* Reduced Motion */}
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={prefs.reducedMotion}
                    onChange={(e) => updatePref('reducedMotion', e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: colors.brand.primary },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: colors.brand.primary },
                    }}
                  />
                }
                label={<Typography sx={{ fontSize: '0.85rem', color: colors.text.secondary }}>Reduced Motion</Typography>}
              />
              <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted, ml: '48px' }}>
                Disables animations and transitions. Respects your OS setting.
              </Typography>
            </Box>

            {/* Theme Selector */}
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: '0.85rem', color: colors.text.secondary, mb: 1 }}>Theme</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {(['dark', 'light', 'system'] as const).map((t) => (
                  <WrfButton
                    key={t}
                    variant={prefs.theme === t ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => updatePref('theme', t)}
                    sx={{ flex: 1, textTransform: 'capitalize' }}
                  >
                    {t}
                  </WrfButton>
                ))}
              </Box>
            </Box>
          </WrfCard>
        </Grid>

        {/* ---- Reading Settings ---- */}
        <Grid size={{ xs: 12, md: 6 }}>
          <WrfCard title="Reading Settings" subtitle="Optimize text readability and spacing">
            <SectionHeader
              icon={<TextFieldsIcon sx={{ color: colors.brand.primary, fontSize: 22 }} />}
              title="Typography"
              description="Line height, letter spacing, and font options"
            />

            {/* Line Spacing */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontSize: '0.85rem', color: colors.text.secondary }}>Line Spacing</Typography>
                <Typography sx={{ fontSize: '0.85rem', color: colors.brand.primary, fontWeight: 600 }}>{prefs.lineSpacing.toFixed(1)}</Typography>
              </Box>
              <Slider
                value={prefs.lineSpacing}
                onChange={(_, v) => updatePref('lineSpacing', v as number)}
                min={1.0}
                max={2.0}
                step={0.1}
                marks={[
                  { value: 1.0, label: '1.0' },
                  { value: 1.5, label: '1.5' },
                  { value: 2.0, label: '2.0' },
                ]}
                sx={{
                  color: colors.brand.primary,
                  '& .MuiSlider-markLabel': { color: colors.text.muted, fontSize: '0.7rem' },
                  '& .MuiSlider-track': { backgroundColor: colors.brand.primary },
                  '& .MuiSlider-rail': { backgroundColor: colors.border.default },
                }}
                aria-label="Line spacing"
              />
              <Box sx={{
                mt: 1, p: 2, borderRadius: `${borderRadius.md}px`,
                bgcolor: colors.bg.tertiary, border: `1px solid ${colors.border.default}`,
              }}>
                <Typography sx={{ fontSize: '0.85rem', color: colors.text.primary, lineHeight: prefs.lineSpacing }}>
                  Weather data shows a high pressure system moving northeast with sustained winds of 15-20 knots.
                  Temperature readings remain stable at 72F with humidity at 45%.
                </Typography>
              </Box>
            </Box>

            {/* Letter Spacing */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontSize: '0.85rem', color: colors.text.secondary }}>Letter Spacing</Typography>
                <Typography sx={{ fontSize: '0.85rem', color: colors.brand.primary, fontWeight: 600 }}>
                  {prefs.letterSpacing === 0 ? 'Normal' : `${prefs.letterSpacing.toFixed(2)}em`}
                </Typography>
              </Box>
              <Slider
                value={prefs.letterSpacing}
                onChange={(_, v) => updatePref('letterSpacing', v as number)}
                min={0}
                max={0.2}
                step={0.02}
                sx={{
                  color: colors.brand.primary,
                  '& .MuiSlider-track': { backgroundColor: colors.brand.primary },
                  '& .MuiSlider-rail': { backgroundColor: colors.border.default },
                }}
                aria-label="Letter spacing"
              />
              <Box sx={{
                mt: 1, p: 2, borderRadius: `${borderRadius.md}px`,
                bgcolor: colors.bg.tertiary, border: `1px solid ${colors.border.default}`,
              }}>
                <Typography sx={{
                  fontSize: '0.85rem', color: colors.text.primary,
                  letterSpacing: prefs.letterSpacing === 0 ? 'normal' : `${prefs.letterSpacing}em`,
                }}>
                  WRFCoin blockchain transactions secured with quantum-resistant cryptography.
                </Typography>
              </Box>
            </Box>

            {/* Dyslexia Font */}
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={prefs.dyslexiaFont}
                    onChange={(e) => updatePref('dyslexiaFont', e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: colors.brand.primary },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: colors.brand.primary },
                    }}
                  />
                }
                label={<Typography sx={{ fontSize: '0.85rem', color: colors.text.secondary }}>Dyslexia-Friendly Font</Typography>}
              />
              <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted, ml: '48px' }}>
                Switches to a font with weighted bottoms for improved letter recognition.
              </Typography>
              {prefs.dyslexiaFont && (
                <Box sx={{
                  mt: 1, p: 2, borderRadius: `${borderRadius.md}px`,
                  bgcolor: colors.bg.tertiary, border: `1px solid ${colors.border.default}`,
                }}>
                  <Typography sx={{
                    fontSize: '0.9rem', color: colors.text.primary,
                    fontFamily: '"Comic Sans MS", "OpenDyslexic", cursive',
                    letterSpacing: '0.05em', lineHeight: 1.8,
                  }}>
                    This text uses a dyslexia-friendly font style with increased spacing for better readability.
                  </Typography>
                </Box>
              )}
            </Box>

            <Divider sx={{ borderColor: colors.border.default, my: 2 }} />

            {/* ---- Focus & Navigation ---- */}
            <SectionHeader
              icon={<KeyboardIcon sx={{ color: colors.brand.primary, fontSize: 22 }} />}
              title="Focus & Navigation"
              description="Keyboard navigation and focus indicator preferences"
            />

            {/* Focus Indicator Style */}
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontSize: '0.85rem', color: colors.text.secondary, mb: 1 }}>Focus Indicator Style</Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                {(['default', 'enhanced', 'high-visibility'] as const).map((style) => (
                  <WrfButton
                    key={style}
                    variant={prefs.focusIndicator === style ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => updatePref('focusIndicator', style)}
                    sx={{ flex: 1, fontSize: '0.7rem' }}
                  >
                    {style === 'high-visibility' ? 'High Vis' : style.charAt(0).toUpperCase() + style.slice(1)}
                  </WrfButton>
                ))}
              </Box>
              {/* Focus indicator preview */}
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3, bgcolor: colors.bg.tertiary, borderRadius: `${borderRadius.md}px` }}>
                <Box
                  component="button"
                  sx={{
                    px: 3, py: 1.5,
                    bgcolor: colors.brand.primary, color: '#FFFFFF',
                    border: 'none', borderRadius: `${borderRadius.md}px`,
                    fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer',
                    ...focusStyles[prefs.focusIndicator],
                  }}
                >
                  Sample Focused Button
                </Box>
              </Box>
            </Box>

            {/* Tab Order Visualization */}
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={prefs.tabOrderVisualization}
                    onChange={(e) => updatePref('tabOrderVisualization', e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: colors.brand.primary },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: colors.brand.primary },
                    }}
                  />
                }
                label={<Typography sx={{ fontSize: '0.85rem', color: colors.text.secondary }}>Tab Order Visualization</Typography>}
              />
            </Box>

            {/* Auto-Focus Management */}
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={prefs.autoFocusManagement}
                    onChange={(e) => updatePref('autoFocusManagement', e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: colors.brand.primary },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: colors.brand.primary },
                    }}
                  />
                }
                label={<Typography sx={{ fontSize: '0.85rem', color: colors.text.secondary }}>Auto-Focus Management</Typography>}
              />
              <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted, ml: '48px' }}>
                Automatically manages focus when navigating between pages and modals.
              </Typography>
            </Box>
          </WrfCard>
        </Grid>

        {/* ---- Screen Reader Settings ---- */}
        <Grid size={{ xs: 12, md: 6 }}>
          <WrfCard title="Screen Reader" subtitle="Optimize ARIA and assistive technology behavior">
            <SectionHeader
              icon={<AccessibilityNewIcon sx={{ color: colors.brand.primary, fontSize: 22 }} />}
              title="Assistive Technology"
              description="ARIA live regions, landmarks, and descriptions"
            />

            {/* ARIA Verbosity */}
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontSize: '0.85rem', color: colors.text.secondary, mb: 1 }}>
                ARIA Live Region Verbosity
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {(['polite', 'assertive'] as const).map((mode) => (
                  <WrfButton
                    key={mode}
                    variant={prefs.ariaVerbosity === mode ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => updatePref('ariaVerbosity', mode)}
                    sx={{ flex: 1, textTransform: 'capitalize' }}
                  >
                    {mode}
                  </WrfButton>
                ))}
              </Box>
              <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted, mt: 1 }}>
                {prefs.ariaVerbosity === 'polite'
                  ? 'Announcements wait for the user to finish their current action.'
                  : 'Announcements interrupt the user immediately for urgent updates.'}
              </Typography>
            </Box>

            {/* Landmarks Description */}
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={prefs.landmarksDescription}
                    onChange={(e) => updatePref('landmarksDescription', e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: colors.brand.primary },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: colors.brand.primary },
                    }}
                  />
                }
                label={<Typography sx={{ fontSize: '0.85rem', color: colors.text.secondary }}>Announce Landmark Regions</Typography>}
              />
              <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted, ml: '48px' }}>
                Adds descriptive labels to page landmark regions for screen readers.
              </Typography>
            </Box>

            {/* Image Descriptions */}
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={prefs.imageDescriptions}
                    onChange={(e) => updatePref('imageDescriptions', e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: colors.brand.primary },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: colors.brand.primary },
                    }}
                  />
                }
                label={<Typography sx={{ fontSize: '0.85rem', color: colors.text.secondary }}>Image Descriptions</Typography>}
              />
              <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted, ml: '48px' }}>
                Provides extended descriptions for weather charts, maps, and data visualizations.
              </Typography>
            </Box>

            <Divider sx={{ borderColor: colors.border.default, my: 2 }} />

            {/* WCAG Compliance Summary */}
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: colors.text.primary, mb: 1.5 }}>
                WCAG Compliance Summary
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {[
                  { label: 'Perceivable', met: prefs.highContrast || prefs.fontSize >= 18, level: prefs.highContrast ? 'AAA' : 'AA' },
                  { label: 'Operable', met: prefs.focusIndicator !== 'default', level: prefs.focusIndicator === 'high-visibility' ? 'AAA' : 'AA' },
                  { label: 'Understandable', met: prefs.landmarksDescription, level: 'AA' },
                  { label: 'Robust', met: prefs.imageDescriptions && prefs.landmarksDescription, level: 'AA' },
                ].map((item) => (
                  <Box key={item.label} sx={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    p: 1.5, borderRadius: `${borderRadius.md}px`, bgcolor: colors.bg.tertiary,
                  }}>
                    <Typography sx={{ fontSize: '0.8rem', color: colors.text.secondary }}>{item.label}</Typography>
                    <WrfBadge
                      status={item.met ? 'online' : 'degraded'}
                      label={item.met ? `${item.level} Pass` : 'Needs Review'}
                      size="sm"
                    />
                  </Box>
                ))}
              </Box>
            </Box>
          </WrfCard>
        </Grid>

        {/* ---- Reset Section ---- */}
        <Grid size={{ xs: 12, md: 6 }}>
          <WrfCard title="Manage Preferences" subtitle="Reset or export your accessibility settings">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{
                p: 2, borderRadius: `${borderRadius.md}px`,
                bgcolor: colors.bg.tertiary, border: `1px solid ${colors.border.default}`,
              }}>
                <Typography sx={{ fontSize: '0.85rem', color: colors.text.secondary, mb: 1 }}>
                  Current configuration summary:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {prefs.highContrast && <WrfBadge status="online" label="High Contrast" size="sm" />}
                  {prefs.reducedMotion && <WrfBadge status="online" label="Reduced Motion" size="sm" />}
                  {prefs.dyslexiaFont && <WrfBadge status="online" label="Dyslexia Font" size="sm" />}
                  {prefs.colorBlindMode !== 'none' && (
                    <WrfBadge status="online" label={prefs.colorBlindMode} size="sm" />
                  )}
                  {prefs.focusIndicator !== 'default' && (
                    <WrfBadge status="online" label={`${prefs.focusIndicator} Focus`} size="sm" />
                  )}
                  <WrfBadge status="pending" label={`${prefs.fontSize}px Font`} size="sm" />
                  <WrfBadge status="pending" label={`${prefs.lineSpacing.toFixed(1)} Line Height`} size="sm" />
                </Box>
              </Box>
              <WrfButton
                variant="danger"
                size="md"
                onClick={resetToDefaults}
                startIcon={<RestoreIcon sx={{ fontSize: 18 }} />}
                fullWidth
              >
                Reset to Defaults
              </WrfButton>
            </Box>
          </WrfCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AccessibilitySettings;
