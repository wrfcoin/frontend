// ScreenReaderHelper.tsx - Screen reader optimization and ARIA audit tool
// Simulated WCAG audit results, contrast checker, focus order, and live region tester
import React, { useState, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ImageIcon from '@mui/icons-material/Image';
import InputIcon from '@mui/icons-material/Input';
import CampaignIcon from '@mui/icons-material/Campaign';
import LinkIcon from '@mui/icons-material/Link';
import PaletteIcon from '@mui/icons-material/Palette';
import MapIcon from '@mui/icons-material/Map';
import { colors, spacing, borderRadius } from '../ui/tokens';
import WrfCard from '../ui/WrfCard';
import WrfStatCard from '../ui/WrfStatCard';
import WrfButton from '../ui/WrfButton';
import WrfBadge from '../ui/WrfBadge';
import DemoSurfaceGate from '../common/DemoSurfaceGate';

// ---- Types ----
interface LandmarkAudit {
  role: string;
  label: string;
  count: number;
  status: 'pass' | 'warning' | 'fail';
}

interface HeadingNode {
  level: number;
  text: string;
  valid: boolean;
  reason?: string;
}

interface ImageAudit {
  src: string;
  alt: string | null;
  status: 'present' | 'missing' | 'decorative';
}

interface FormAudit {
  inputType: string;
  inputName: string;
  hasLabel: boolean;
  labelText?: string;
}

interface FocusOrderItem {
  order: number;
  element: string;
  label: string;
  role: string;
}

// ---- Mock audit data ----
const mockLandmarks: LandmarkAudit[] = [
  { role: 'banner', label: 'Site header with navigation', count: 1, status: 'pass' },
  { role: 'navigation', label: 'Main navigation menu', count: 2, status: 'pass' },
  { role: 'main', label: 'Primary content area', count: 1, status: 'pass' },
  { role: 'complementary', label: 'Sidebar widgets', count: 1, status: 'pass' },
  { role: 'contentinfo', label: 'Page footer', count: 1, status: 'pass' },
  { role: 'search', label: 'Search form', count: 0, status: 'warning' },
  { role: 'form', label: 'Data submission form', count: 1, status: 'pass' },
];

const mockHeadings: HeadingNode[] = [
  { level: 1, text: 'WRFCoin Dashboard', valid: true },
  { level: 2, text: 'Weather Stations Overview', valid: true },
  { level: 3, text: 'Active Stations', valid: true },
  { level: 3, text: 'Station Performance', valid: true },
  { level: 2, text: 'Recent Transactions', valid: true },
  { level: 4, text: 'Transaction Details', valid: false, reason: 'Skipped h3 level' },
  { level: 2, text: 'Earnings Summary', valid: true },
  { level: 3, text: 'Weekly Rewards', valid: true },
  { level: 3, text: 'Quality Bonuses', valid: true },
];

const mockImages: ImageAudit[] = [
  { src: '/weather-map.png', alt: 'Interactive weather map showing station locations', status: 'present' },
  { src: '/logo.svg', alt: 'WRFCoin logo', status: 'present' },
  { src: '/chart-temperature.png', alt: null, status: 'missing' },
  { src: '/divider.svg', alt: '', status: 'decorative' },
  { src: '/station-photo.jpg', alt: 'Weather station WST-042 located in Denver, CO', status: 'present' },
  { src: '/bg-pattern.png', alt: '', status: 'decorative' },
  { src: '/nft-preview.png', alt: null, status: 'missing' },
  { src: '/carbon-chart.png', alt: 'Carbon credit price trends over 30 days', status: 'present' },
];

const mockForms: FormAudit[] = [
  { inputType: 'text', inputName: 'search', hasLabel: true, labelText: 'Search stations' },
  { inputType: 'email', inputName: 'email', hasLabel: true, labelText: 'Email address' },
  { inputType: 'password', inputName: 'password', hasLabel: true, labelText: 'Password' },
  { inputType: 'number', inputName: 'amount', hasLabel: false },
  { inputType: 'select', inputName: 'network', hasLabel: true, labelText: 'Blockchain network' },
  { inputType: 'checkbox', inputName: 'agree', hasLabel: false },
];

const mockFocusOrder: FocusOrderItem[] = [
  { order: 1, element: 'a', label: 'Skip to main content', role: 'link' },
  { order: 2, element: 'a', label: 'WRFCoin Home', role: 'link' },
  { order: 3, element: 'button', label: 'Toggle Navigation', role: 'button' },
  { order: 4, element: 'a', label: 'Dashboard', role: 'link' },
  { order: 5, element: 'a', label: 'Explorer', role: 'link' },
  { order: 6, element: 'a', label: 'Wallet', role: 'link' },
  { order: 7, element: 'input', label: 'Search stations', role: 'searchbox' },
  { order: 8, element: 'button', label: 'Connect Wallet', role: 'button' },
  { order: 9, element: 'button', label: 'Notifications', role: 'button' },
  { order: 10, element: 'button', label: 'User Menu', role: 'button' },
  { order: 11, element: 'a', label: 'View All Stations', role: 'link' },
  { order: 12, element: 'button', label: 'Refresh Data', role: 'button' },
];

const mockSkipLinks = [
  { id: 'skip-main', target: '#main-content', label: 'Skip to main content' },
  { id: 'skip-nav', target: '#navigation', label: 'Skip to navigation' },
  { id: 'skip-search', target: '#search', label: 'Skip to search' },
  { id: 'skip-footer', target: '#footer', label: 'Skip to footer' },
];

// ---- Utility: contrast ratio ----
function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return null;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return [r, g, b];
}

function relativeLuminance(hex: string): number | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb.map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function calcContrastRatio(fg: string, bg: string): number | null {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  if (l1 === null || l2 === null) return null;
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return parseFloat(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

// ---- Status icon helper ----
const StatusIcon: React.FC<{ status: 'pass' | 'warning' | 'fail' }> = ({ status }) => {
  if (status === 'pass') return <CheckCircleIcon sx={{ fontSize: 16, color: colors.success.main }} />;
  if (status === 'warning') return <WarningAmberIcon sx={{ fontSize: 16, color: colors.warning.main }} />;
  return <CancelIcon sx={{ fontSize: 16, color: colors.error.main }} />;
};

// ---- Component ----
const ScreenReaderHelperSample: React.FC = () => {
  const [contrastFg, setContrastFg] = useState<string>('#F8FAFC');
  const [contrastBg, setContrastBg] = useState<string>('#0F172A');
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>('');
  const [liveLog, setLiveLog] = useState<{ text: string; mode: string; time: string }[]>([]);

  // Computed stats
  const landmarksFound = mockLandmarks.filter(l => l.count > 0).length;
  const validHeadings = mockHeadings.filter(h => h.valid).length;
  const imagesWithAlt = mockImages.filter(i => i.status === 'present').length;

  const contrastResult = useMemo(() => calcContrastRatio(contrastFg, contrastBg), [contrastFg, contrastBg]);

  const contrastIssues = useMemo(() => {
    let issues = 0;
    if (contrastResult !== null && contrastResult < 4.5) issues++;
    issues += mockImages.filter(i => i.status === 'missing').length;
    return issues;
  }, [contrastResult]);

  // WCAG pass/fail for contrast
  const normalAA = contrastResult !== null && contrastResult >= 4.5;
  const normalAAA = contrastResult !== null && contrastResult >= 7;
  const largeAA = contrastResult !== null && contrastResult >= 3;
  const largeAAA = contrastResult !== null && contrastResult >= 4.5;

  // Heading hierarchy audit score
  const headingScore = Math.round((validHeadings / mockHeadings.length) * 100);

  const handleAnnounce = useCallback((mode: 'polite' | 'assertive') => {
    if (!liveAnnouncement.trim()) return;
    const now = new Date().toLocaleTimeString();
    setLiveLog(prev => [{ text: liveAnnouncement, mode, time: now }, ...prev.slice(0, 9)]);
    setLiveAnnouncement('');
  }, [liveAnnouncement]);

  return (
    <Box sx={{ bgcolor: colors.bg.primary, color: colors.text.primary, minHeight: '100vh', p: 3 }}>
      {/* Page Header */}
      <Box sx={{ mb: `${spacing.lg}px` }}>
        <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: colors.text.primary, mb: `${spacing.xs}px` }}>
          Screen Reader Helper
        </Typography>
        <Typography sx={{ fontSize: '0.9rem', color: colors.text.secondary }}>
          ARIA audit tool, contrast checker, and screen reader optimization dashboard.
        </Typography>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Landmarks Found"
            value={`${landmarksFound}/${mockLandmarks.length}`}
            color={landmarksFound >= 5 ? colors.success.main : colors.warning.main}
            icon={MapIcon}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Headings Valid"
            value={`${headingScore}%`}
            color={headingScore >= 90 ? colors.success.main : headingScore >= 70 ? colors.warning.main : colors.error.main}
            icon={AccountTreeIcon}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Images with Alt"
            value={`${imagesWithAlt}/${mockImages.length}`}
            color={imagesWithAlt === mockImages.length ? colors.success.main : colors.warning.main}
            icon={ImageIcon}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Contrast Issues"
            value={String(contrastIssues)}
            color={contrastIssues === 0 ? colors.success.main : colors.error.main}
            icon={PaletteIcon}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* ---- Landmark Audit ---- */}
        <Grid size={{ xs: 12, md: 6 }}>
          <WrfCard title="Landmark Regions" subtitle="ARIA landmark roles detected on the current page">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {mockLandmarks.map((landmark) => (
                <Box key={landmark.role} sx={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  py: 1.5, px: 1.5, borderRadius: `${borderRadius.sm}px`,
                  '&:hover': { bgcolor: colors.bg.tertiary },
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                    <StatusIcon status={landmark.status} />
                    <Box>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: colors.text.primary }}>
                        {landmark.role}
                      </Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted }}>
                        {landmark.label}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={`${landmark.count} found`}
                      size="small"
                      sx={{
                        bgcolor: landmark.count > 0 ? `${colors.success.main}15` : `${colors.warning.main}15`,
                        color: landmark.count > 0 ? colors.success.main : colors.warning.main,
                        fontSize: '0.7rem', height: 24,
                      }}
                    />
                    <WrfBadge
                      status={landmark.status === 'pass' ? 'online' : 'degraded'}
                      label={landmark.status === 'pass' ? 'Pass' : 'Review'}
                      size="sm"
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          </WrfCard>
        </Grid>

        {/* ---- Heading Hierarchy ---- */}
        <Grid size={{ xs: 12, md: 6 }}>
          <WrfCard
            title="Heading Hierarchy"
            subtitle="Document heading structure and level validation"
            action={
              <WrfBadge
                status={headingScore === 100 ? 'online' : 'degraded'}
                label={`${headingScore}% valid`}
                size="sm"
              />
            }
          >
            <Box sx={{ mb: 2 }}>
              <LinearProgress
                variant="determinate"
                value={headingScore}
                sx={{
                  height: 6, borderRadius: 3,
                  bgcolor: colors.bg.tertiary,
                  '& .MuiLinearProgress-bar': {
                    bgcolor: headingScore >= 90 ? colors.success.main : colors.warning.main,
                    borderRadius: 3,
                  },
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              {mockHeadings.map((heading, index) => (
                <Box key={index} sx={{
                  display: 'flex', alignItems: 'center', gap: 1,
                  py: 1, px: 1.5, borderRadius: `${borderRadius.sm}px`,
                  ml: `${(heading.level - 1) * 20}px`,
                  bgcolor: heading.valid ? 'transparent' : `${colors.error.main}08`,
                  border: heading.valid ? 'none' : `1px solid ${colors.error.main}30`,
                }}>
                  <StatusIcon status={heading.valid ? 'pass' : 'fail'} />
                  <Chip
                    label={`H${heading.level}`}
                    size="small"
                    sx={{
                      bgcolor: heading.valid ? `${colors.brand.primary}15` : `${colors.error.main}15`,
                      color: heading.valid ? colors.brand.primary : colors.error.main,
                      fontSize: '0.7rem', fontWeight: 700, height: 22, minWidth: 32,
                    }}
                  />
                  <Typography sx={{
                    fontSize: '0.8rem', color: heading.valid ? colors.text.secondary : colors.error.light,
                    flex: 1,
                  }}>
                    {heading.text}
                  </Typography>
                  {heading.reason && (
                    <Typography sx={{ fontSize: '0.65rem', color: colors.error.main, fontStyle: 'italic' }}>
                      {heading.reason}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          </WrfCard>
        </Grid>

        {/* ---- Image Alt Text Audit ---- */}
        <Grid size={{ xs: 12, md: 6 }}>
          <WrfCard title="Image Alt Text Audit" subtitle="Alternative text status for all images">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {mockImages.map((img, index) => (
                <Box key={index} sx={{
                  display: 'flex', alignItems: 'center', gap: 1,
                  py: 1.5, px: 1.5, borderRadius: `${borderRadius.sm}px`,
                  '&:hover': { bgcolor: colors.bg.tertiary },
                }}>
                  <ImageIcon sx={{
                    fontSize: 18,
                    color: img.status === 'present' ? colors.success.main
                      : img.status === 'missing' ? colors.error.main
                        : colors.text.muted,
                  }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{
                      fontSize: '0.8rem', fontWeight: 500, color: colors.text.primary,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {img.src}
                    </Typography>
                    <Typography sx={{
                      fontSize: '0.7rem',
                      color: img.status === 'present' ? colors.text.muted
                        : img.status === 'missing' ? colors.error.light
                          : colors.text.muted,
                      fontStyle: img.status === 'missing' ? 'italic' : 'normal',
                    }}>
                      {img.status === 'present' ? img.alt
                        : img.status === 'missing' ? 'No alt text provided'
                          : 'Decorative (alt="")'}
                    </Typography>
                  </Box>
                  <WrfBadge
                    status={img.status === 'present' ? 'online' : img.status === 'missing' ? 'offline' : 'pending'}
                    label={img.status === 'present' ? 'Has Alt' : img.status === 'missing' ? 'Missing' : 'Decorative'}
                    size="sm"
                  />
                </Box>
              ))}
            </Box>
          </WrfCard>
        </Grid>

        {/* ---- Form Label Audit ---- */}
        <Grid size={{ xs: 12, md: 6 }}>
          <WrfCard title="Form Label Audit" subtitle="Form input elements and associated label status">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {mockForms.map((form, index) => (
                <Box key={index} sx={{
                  display: 'flex', alignItems: 'center', gap: 1,
                  py: 1.5, px: 1.5, borderRadius: `${borderRadius.sm}px`,
                  '&:hover': { bgcolor: colors.bg.tertiary },
                }}>
                  <InputIcon sx={{
                    fontSize: 18,
                    color: form.hasLabel ? colors.success.main : colors.error.main,
                  }} />
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={form.inputType}
                        size="small"
                        sx={{
                          bgcolor: `${colors.brand.primary}15`, color: colors.brand.primary,
                          fontSize: '0.65rem', height: 20,
                        }}
                      />
                      <Typography sx={{ fontSize: '0.8rem', color: colors.text.primary }}>
                        {form.inputName}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.7rem', color: form.hasLabel ? colors.text.muted : colors.error.light }}>
                      {form.hasLabel ? `Label: "${form.labelText}"` : 'No associated label found'}
                    </Typography>
                  </Box>
                  <StatusIcon status={form.hasLabel ? 'pass' : 'fail'} />
                </Box>
              ))}
            </Box>
          </WrfCard>
        </Grid>

        {/* ---- Live Region Preview ---- */}
        <Grid size={{ xs: 12, md: 6 }}>
          <WrfCard title="Live Region Tester" subtitle="Test ARIA live region announcements">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px`, mb: 2 }}>
              <CampaignIcon sx={{ color: colors.brand.primary, fontSize: 22 }} />
              <Typography sx={{ fontSize: '0.85rem', color: colors.text.secondary }}>
                Enter text to simulate a live region announcement
              </Typography>
            </Box>

            <TextField
              fullWidth
              size="small"
              placeholder="Type announcement text..."
              value={liveAnnouncement}
              onChange={(e) => setLiveAnnouncement(e.target.value)}
              sx={{
                mb: 1.5,
                '& .MuiOutlinedInput-root': {
                  color: colors.text.primary,
                  '& fieldset': { borderColor: colors.border.default },
                  '&:hover fieldset': { borderColor: colors.border.light },
                  '&.Mui-focused fieldset': { borderColor: colors.brand.primary },
                },
                '& .MuiInputBase-input::placeholder': { color: colors.text.muted },
              }}
            />

            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <WrfButton
                variant="secondary"
                size="sm"
                onClick={() => handleAnnounce('polite')}
                sx={{ flex: 1 }}
              >
                Polite
              </WrfButton>
              <WrfButton
                variant="primary"
                size="sm"
                onClick={() => handleAnnounce('assertive')}
                sx={{ flex: 1 }}
              >
                Assertive
              </WrfButton>
            </Box>

            {/* Hidden live regions for actual screen reader output */}
            <div aria-live="polite" aria-atomic="true" style={{ position: 'absolute', left: -9999, width: 1, height: 1, overflow: 'hidden' }}>
              {liveLog.length > 0 && liveLog[0].mode === 'polite' ? liveLog[0].text : ''}
            </div>
            <div aria-live="assertive" aria-atomic="true" style={{ position: 'absolute', left: -9999, width: 1, height: 1, overflow: 'hidden' }}>
              {liveLog.length > 0 && liveLog[0].mode === 'assertive' ? liveLog[0].text : ''}
            </div>

            {/* Announcement log */}
            <Box sx={{
              maxHeight: 160, overflowY: 'auto',
              borderRadius: `${borderRadius.md}px`, bgcolor: colors.bg.tertiary,
              border: `1px solid ${colors.border.default}`,
            }}>
              {liveLog.length === 0 ? (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted, fontStyle: 'italic' }}>
                    No announcements yet. Type text above and click a mode.
                  </Typography>
                </Box>
              ) : (
                liveLog.map((entry, i) => (
                  <Box key={i} sx={{
                    display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1,
                    borderBottom: i < liveLog.length - 1 ? `1px solid ${colors.border.default}` : 'none',
                  }}>
                    <Chip
                      label={entry.mode}
                      size="small"
                      sx={{
                        bgcolor: entry.mode === 'assertive' ? `${colors.error.main}15` : `${colors.brand.primary}15`,
                        color: entry.mode === 'assertive' ? colors.error.main : colors.brand.primary,
                        fontSize: '0.6rem', height: 18, textTransform: 'uppercase', fontWeight: 700,
                      }}
                    />
                    <Typography sx={{ fontSize: '0.75rem', color: colors.text.secondary, flex: 1 }}>
                      {entry.text}
                    </Typography>
                    <Typography sx={{ fontSize: '0.6rem', color: colors.text.muted }}>
                      {entry.time}
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
          </WrfCard>
        </Grid>

        {/* ---- Focus Order Visualization ---- */}
        <Grid size={{ xs: 12, md: 6 }}>
          <WrfCard title="Focus Order" subtitle="Tab navigation sequence through interactive elements">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {mockFocusOrder.map((item) => (
                <Box key={item.order} sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  py: 1, px: 1.5, borderRadius: `${borderRadius.sm}px`,
                  '&:hover': { bgcolor: colors.bg.tertiary },
                }}>
                  <WrfBadge
                    status="pending"
                    label={String(item.order)}
                    size="sm"
                    sx={{ minWidth: 36, justifyContent: 'center' }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: colors.text.primary }}>
                      {item.label}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.25 }}>
                      <Chip
                        label={`<${item.element}>`}
                        size="small"
                        sx={{ bgcolor: `${colors.brand.primary}10`, color: colors.brand.primary, fontSize: '0.6rem', height: 18 }}
                      />
                      <Chip
                        label={item.role}
                        size="small"
                        sx={{ bgcolor: `${colors.success.main}10`, color: colors.success.main, fontSize: '0.6rem', height: 18 }}
                      />
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </WrfCard>
        </Grid>

        {/* ---- Contrast Checker ---- */}
        <Grid size={{ xs: 12, md: 6 }}>
          <WrfCard title="Contrast Checker" subtitle="Check color contrast ratios against WCAG standards">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px`, mb: 2 }}>
              <PaletteIcon sx={{ color: colors.brand.primary, fontSize: 22 }} />
              <Typography sx={{ fontSize: '0.85rem', color: colors.text.secondary }}>
                Enter foreground and background colors to check contrast ratio
              </Typography>
            </Box>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={{ xs: 6 }}>
                <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted, mb: 0.5 }}>Foreground</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{
                    width: 32, height: 32, borderRadius: `${borderRadius.sm}px`,
                    bgcolor: contrastFg, border: `1px solid ${colors.border.light}`, flexShrink: 0,
                  }} />
                  <TextField
                    size="small"
                    value={contrastFg}
                    onChange={(e) => setContrastFg(e.target.value)}
                    sx={{
                      flex: 1,
                      '& .MuiOutlinedInput-root': {
                        color: colors.text.primary, fontSize: '0.8rem',
                        '& fieldset': { borderColor: colors.border.default },
                        '&:hover fieldset': { borderColor: colors.border.light },
                        '&.Mui-focused fieldset': { borderColor: colors.brand.primary },
                      },
                    }}
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted, mb: 0.5 }}>Background</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{
                    width: 32, height: 32, borderRadius: `${borderRadius.sm}px`,
                    bgcolor: contrastBg, border: `1px solid ${colors.border.light}`, flexShrink: 0,
                  }} />
                  <TextField
                    size="small"
                    value={contrastBg}
                    onChange={(e) => setContrastBg(e.target.value)}
                    sx={{
                      flex: 1,
                      '& .MuiOutlinedInput-root': {
                        color: colors.text.primary, fontSize: '0.8rem',
                        '& fieldset': { borderColor: colors.border.default },
                        '&:hover fieldset': { borderColor: colors.border.light },
                        '&.Mui-focused fieldset': { borderColor: colors.brand.primary },
                      },
                    }}
                  />
                </Box>
              </Grid>
            </Grid>

            {/* Preview */}
            <Box sx={{
              p: 3, mb: 2, borderRadius: `${borderRadius.md}px`,
              bgcolor: contrastBg, border: `1px solid ${colors.border.default}`,
              textAlign: 'center',
            }}>
              <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: contrastFg }}>
                Sample Text Preview
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: contrastFg, mt: 0.5 }}>
                The quick brown fox jumps over the lazy dog
              </Typography>
            </Box>

            {/* Ratio and pass/fail */}
            <Box sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 2, mb: 2,
            }}>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: colors.text.primary }}>
                {contrastResult !== null ? `${contrastResult}:1` : 'Invalid'}
              </Typography>
            </Box>

            <Grid container spacing={1}>
              {[
                { label: 'Normal Text AA (4.5:1)', pass: normalAA },
                { label: 'Normal Text AAA (7:1)', pass: normalAAA },
                { label: 'Large Text AA (3:1)', pass: largeAA },
                { label: 'Large Text AAA (4.5:1)', pass: largeAAA },
              ].map((check) => (
                <Grid size={{ xs: 6 }} key={check.label}>
                  <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 1,
                    py: 1, px: 1.5, borderRadius: `${borderRadius.sm}px`,
                    bgcolor: check.pass ? `${colors.success.main}08` : `${colors.error.main}08`,
                    border: `1px solid ${check.pass ? colors.success.main : colors.error.main}30`,
                  }}>
                    <StatusIcon status={check.pass ? 'pass' : 'fail'} />
                    <Typography sx={{ fontSize: '0.7rem', color: colors.text.secondary }}>
                      {check.label}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </WrfCard>
        </Grid>

        {/* ---- Skip Links Configuration ---- */}
        <Grid size={{ xs: 12, md: 6 }}>
          <WrfCard title="Skip Links" subtitle="Manage skip-to-content navigation links">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px`, mb: 2 }}>
              <LinkIcon sx={{ color: colors.brand.primary, fontSize: 22 }} />
              <Typography sx={{ fontSize: '0.85rem', color: colors.text.secondary }}>
                Skip links allow keyboard users to jump directly to page sections
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {mockSkipLinks.map((link) => (
                <Box key={link.id} sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  py: 1.5, px: 1.5, borderRadius: `${borderRadius.sm}px`,
                  '&:hover': { bgcolor: colors.bg.tertiary },
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon sx={{ fontSize: 16, color: colors.success.main }} />
                    <Box>
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: colors.text.primary }}>
                        {link.label}
                      </Typography>
                      <Typography sx={{ fontSize: '0.65rem', color: colors.text.muted, fontFamily: 'monospace' }}>
                        {link.target}
                      </Typography>
                    </Box>
                  </Box>
                  <WrfBadge status="online" label="Active" size="sm" />
                </Box>
              ))}
            </Box>
          </WrfCard>
        </Grid>
      </Grid>
    </Box>
  );
};

// frontend#352: display-only fabricated surface. The default build shows an
// honest not-live state and never mounts the sample.
const ScreenReaderHelper = () => (
  <DemoSurfaceGate
    title="The accessibility audit is not live"
    description="These landmark, heading, image, form and focus-order results were never measured on this site; no audit has been run."
    testId="screen-reader-audit"
  >
    <ScreenReaderHelperSample />
  </DemoSurfaceGate>
);

export default ScreenReaderHelper;
