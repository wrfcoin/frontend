import DemoSurfaceGate from '../common/DemoSurfaceGate';
// KeyboardShortcutsOverlay.tsx - Keyboard navigation reference and customization overlay
// Triggered by pressing "?" key, provides organized shortcut reference with search and customization
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Fade from '@mui/material/Fade';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import PrintIcon from '@mui/icons-material/Print';
import NavigationIcon from '@mui/icons-material/Navigation';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import StorageIcon from '@mui/icons-material/Storage';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { colors, spacing, borderRadius, shadows } from '../ui/tokens';
import WrfCard from '../ui/WrfCard';
import WrfButton from '../ui/WrfButton';
import WrfBadge from '../ui/WrfBadge';
import WrfInput from '../ui/WrfInput';
import {
  filterPublicSurfaces,
  isFullStudioEnabled,
  isOperatorPreviewEnabled,
} from '../../config/contractSurfacePolicy';

// ---- Types ----
interface Shortcut {
  id: string;
  description: string;
  keys: string[];
  customKeys?: string[];
}

interface ShortcutSection {
  title: string;
  icon: React.ReactNode;
  shortcuts: Shortcut[];
}

// ---- Mock shortcut data ----
const shortcutSections: ShortcutSection[] = [
  {
    title: 'Navigation',
    icon: <NavigationIcon sx={{ color: colors.brand.primary, fontSize: 20 }} />,
    shortcuts: [
      { id: 'nav-home', description: 'Go to Home / Dashboard', keys: ['H'] },
      { id: 'nav-explorer', description: 'Open Block Explorer', keys: ['E'] },
      { id: 'nav-wallet', description: 'Open Wallet', keys: ['W'] },
      { id: 'nav-settings', description: 'Open Settings', keys: ['S'] },
      { id: 'nav-search', description: 'Focus Search Bar', keys: ['/'] },
      { id: 'nav-back', description: 'Go Back', keys: ['Alt', 'Left'] },
      { id: 'nav-forward', description: 'Go Forward', keys: ['Alt', 'Right'] },
      { id: 'nav-help', description: 'Show Keyboard Shortcuts', keys: ['?'] },
    ],
  },
  {
    title: 'Actions',
    icon: <TouchAppIcon sx={{ color: colors.success.main, fontSize: 20 }} />,
    shortcuts: [
      { id: 'act-submit', description: 'Submit Weather Data', keys: ['Ctrl', 'Enter'] },
      { id: 'act-refresh', description: 'Refresh Current View', keys: ['R'] },
      { id: 'act-menu', description: 'Toggle Side Menu', keys: ['M'] },
      { id: 'act-notifications', description: 'Toggle Notifications', keys: ['Ctrl', 'N'] },
      { id: 'act-save', description: 'Save Current Changes', keys: ['Ctrl', 'S'] },
      { id: 'act-undo', description: 'Undo Last Action', keys: ['Ctrl', 'Z'] },
      { id: 'act-fullscreen', description: 'Toggle Fullscreen', keys: ['F11'] },
    ],
  },
  {
    title: 'Data & Stations',
    icon: <StorageIcon sx={{ color: colors.warning.main, fontSize: 20 }} />,
    shortcuts: [
      { id: 'data-next', description: 'Next Weather Station', keys: ['N'] },
      { id: 'data-prev', description: 'Previous Weather Station', keys: ['P'] },
      { id: 'data-export', description: 'Export Data', keys: ['Ctrl', 'E'] },
      { id: 'data-filter', description: 'Open Filter Panel', keys: ['F'] },
      { id: 'data-sort', description: 'Cycle Sort Order', keys: ['Ctrl', 'Shift', 'S'] },
      { id: 'data-map', description: 'Toggle Map View', keys: ['Ctrl', 'M'] },
    ],
  },
  {
    title: 'Accessibility',
    icon: <AccessibilityNewIcon sx={{ color: '#A78BFA', fontSize: 20 }} />,
    shortcuts: [
      { id: 'a11y-contrast', description: 'Toggle High Contrast', keys: ['Alt', 'C'] },
      { id: 'a11y-font-inc', description: 'Increase Font Size', keys: ['Ctrl', '+'] },
      { id: 'a11y-font-dec', description: 'Decrease Font Size', keys: ['Ctrl', '-'] },
      { id: 'a11y-font-reset', description: 'Reset Font Size', keys: ['Ctrl', '0'] },
      { id: 'a11y-motion', description: 'Toggle Reduced Motion', keys: ['Alt', 'M'] },
      { id: 'a11y-reader', description: 'Screen Reader Mode', keys: ['Alt', 'R'] },
    ],
  },
];

const fullStudioEnabled = isFullStudioEnabled(
  import.meta.env?.VITE_ENABLE_FULL_STUDIO,
);
const operatorPreviewEnabled = isOperatorPreviewEnabled(
  import.meta.env?.VITE_ENABLE_OPERATOR_PREVIEW,
);

const quickJumpPages = filterPublicSurfaces(
  [
    { num: 1, label: 'Dashboard', path: '/dashboard' },
    { num: 2, label: 'Weather Map', path: '/weather-map' },
    { num: 3, label: 'Block Explorer', path: '/explorer' },
    { num: 4, label: 'Wallet', path: '/wallet' },
    { num: 5, label: 'NFT Marketplace', path: '/marketplace' },
    { num: 6, label: 'DeFi Trading', path: '/defi' },
    { num: 7, label: 'Governance', path: '/governance' },
    { num: 8, label: 'Leaderboard', path: '/leaderboard' },
    { num: 9, label: 'Settings', path: '/settings' },
  ],
  fullStudioEnabled,
  operatorPreviewEnabled,
);

// ---- Styled key badge ----
const KbdKey: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box
    component="kbd"
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 28,
      height: 28,
      px: 1,
      fontSize: '0.75rem',
      fontWeight: 600,
      fontFamily: '"SF Mono", "Fira Code", monospace',
      color: colors.text.primary,
      backgroundColor: colors.bg.tertiary,
      border: `1px solid ${colors.border.light}`,
      borderBottom: `2px solid ${colors.border.light}`,
      borderRadius: `${borderRadius.sm}px`,
      boxShadow: `0 1px 0 ${colors.border.default}`,
      lineHeight: 1,
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </Box>
);

// ---- Component ----
const KeyboardShortcutsOverlaySample: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customizeMode, setCustomizeMode] = useState<boolean>(false);
  const [remappingId, setRemappingId] = useState<string | null>(null);
  const [customMappings, setCustomMappings] = useState<Record<string, string[]>>({});

  // Toggle overlay on "?" key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
        if (!isInput) {
          e.preventDefault();
          setIsOpen(prev => !prev);
        }
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setRemappingId(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Handle remap key capture
  useEffect(() => {
    if (!remappingId) return;

    const handleRemap = (e: KeyboardEvent) => {
      e.preventDefault();
      const newKeys: string[] = [];
      if (e.ctrlKey) newKeys.push('Ctrl');
      if (e.altKey) newKeys.push('Alt');
      if (e.shiftKey) newKeys.push('Shift');
      if (e.metaKey) newKeys.push('Meta');
      if (!['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
        newKeys.push(e.key.length === 1 ? e.key.toUpperCase() : e.key);
      }
      if (newKeys.length > 0) {
        setCustomMappings(prev => ({ ...prev, [remappingId]: newKeys }));
        setRemappingId(null);
      }
    };
    document.addEventListener('keydown', handleRemap);
    return () => document.removeEventListener('keydown', handleRemap);
  }, [remappingId]);

  // Filter shortcuts by search
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return shortcutSections;
    const q = searchQuery.toLowerCase();
    return shortcutSections
      .map(section => ({
        ...section,
        shortcuts: section.shortcuts.filter(
          s => s.description.toLowerCase().includes(q) || s.keys.join(' ').toLowerCase().includes(q),
        ),
      }))
      .filter(section => section.shortcuts.length > 0);
  }, [searchQuery]);

  const handlePrint = useCallback(() => {
    const printContent = shortcutSections
      .map(s => `\n${s.title}\n${'='.repeat(s.title.length)}\n` +
        s.shortcuts.map(sc => `  ${sc.description}: ${sc.keys.join(' + ')}`).join('\n'),
      )
      .join('\n');

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const doc = printWindow.document;
      const htmlEl = doc.createElement('html');
      const head = doc.createElement('head');
      const title = doc.createElement('title');
      title.textContent = 'WRFCoin Keyboard Shortcuts';
      const style = doc.createElement('style');
      style.textContent = 'body { font-family: monospace; padding: 40px; white-space: pre-wrap; }';
      head.appendChild(title);
      head.appendChild(style);
      const body = doc.createElement('body');
      body.textContent = `WRFCoin Keyboard Shortcuts\n${'='.repeat(28)}\n${printContent}`;
      htmlEl.appendChild(head);
      htmlEl.appendChild(body);
      doc.documentElement.replaceWith(htmlEl);
      doc.close();
      printWindow.print();
    }
  }, []);

  if (!isOpen) return null;

  return (
    <Fade in={isOpen}>
      <Box
        role="dialog"
        aria-label="Keyboard shortcuts reference"
        aria-modal="true"
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          p: 2,
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setIsOpen(false);
            setRemappingId(null);
          }
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 900,
            maxHeight: '90vh',
            overflowY: 'auto',
            bgcolor: colors.bg.primary,
            border: `1px solid ${colors.border.default}`,
            borderRadius: `${borderRadius.lg}px`,
            boxShadow: shadows.lg,
          }}
        >
          {/* Header */}
          <Box sx={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            p: 3, borderBottom: `1px solid ${colors.border.default}`,
            position: 'sticky', top: 0, bgcolor: colors.bg.primary, zIndex: 1,
          }}>
            <Box>
              <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: colors.text.primary }}>
                Keyboard Shortcuts
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: colors.text.muted }}>
                Press <KbdKey>?</KbdKey> to toggle this overlay. Press <KbdKey>Esc</KbdKey> to close.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <WrfButton
                variant={customizeMode ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => { setCustomizeMode(!customizeMode); setRemappingId(null); }}
                startIcon={<EditIcon sx={{ fontSize: 16 }} />}
              >
                Customize
              </WrfButton>
              <WrfButton
                variant="ghost"
                size="sm"
                onClick={handlePrint}
                startIcon={<PrintIcon sx={{ fontSize: 16 }} />}
              >
                Print
              </WrfButton>
              <IconButton
                onClick={() => { setIsOpen(false); setRemappingId(null); }}
                size="small"
                sx={{ color: colors.text.secondary }}
                aria-label="Close shortcuts overlay"
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Search */}
          <Box sx={{ px: 3, pt: 2 }}>
            <WrfInput
              placeholder="Search shortcuts..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              sx={{ width: '100%' }}
            />
          </Box>

          {/* Customization banner */}
          {customizeMode && (
            <Box sx={{
              mx: 3, mt: 2, p: 2, borderRadius: `${borderRadius.md}px`,
              bgcolor: `${colors.brand.primary}12`, border: `1px solid ${colors.brand.primary}33`,
            }}>
              <Typography sx={{ fontSize: '0.8rem', color: colors.brand.primary }}>
                Customization mode active. Click any shortcut to remap it, then press the new key combination.
              </Typography>
            </Box>
          )}

          {/* Shortcut Sections */}
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {filteredSections.map((section) => (
                <Grid size={{ xs: 12, md: 6 }} key={section.title}>
                  <WrfCard sx={{ height: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px`, mb: 2 }}>
                      {section.icon}
                      <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, color: colors.text.primary }}>
                        {section.title}
                      </Typography>
                      <WrfBadge
                        status="pending"
                        label={`${section.shortcuts.length}`}
                        size="sm"
                      />
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {section.shortcuts.map((shortcut) => {
                        const isRemapping = remappingId === shortcut.id;
                        const displayKeys = customMappings[shortcut.id] || shortcut.keys;

                        return (
                          <Box
                            key={shortcut.id}
                            onClick={() => {
                              if (customizeMode) setRemappingId(shortcut.id);
                            }}
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              py: 1,
                              px: 1.5,
                              borderRadius: `${borderRadius.sm}px`,
                              cursor: customizeMode ? 'pointer' : 'default',
                              transition: 'background-color 0.15s ease',
                              bgcolor: isRemapping ? `${colors.brand.primary}15` : 'transparent',
                              '&:hover': {
                                bgcolor: customizeMode ? `${colors.brand.primary}10` : colors.bg.tertiary,
                              },
                              border: isRemapping ? `1px solid ${colors.brand.primary}` : '1px solid transparent',
                            }}
                          >
                            <Typography sx={{
                              fontSize: '0.8rem',
                              color: colors.text.secondary,
                              flex: 1,
                            }}>
                              {shortcut.description}
                            </Typography>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                              {isRemapping ? (
                                <Typography sx={{
                                  fontSize: '0.75rem', color: colors.brand.primary,
                                  fontStyle: 'italic', animation: 'pulse 1.5s ease-in-out infinite',
                                  '@keyframes pulse': {
                                    '0%, 100%': { opacity: 1 },
                                    '50%': { opacity: 0.5 },
                                  },
                                }}>
                                  Press new key...
                                </Typography>
                              ) : (
                                <>
                                  {displayKeys.map((key, i) => (
                                    <React.Fragment key={i}>
                                      {i > 0 && (
                                        <Typography sx={{ fontSize: '0.65rem', color: colors.text.muted, mx: '1px' }}>+</Typography>
                                      )}
                                      <KbdKey>{key}</KbdKey>
                                    </React.Fragment>
                                  ))}
                                  {customMappings[shortcut.id] && (
                                    <CheckCircleIcon sx={{ fontSize: 14, color: colors.success.main, ml: 0.5 }} />
                                  )}
                                </>
                              )}
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  </WrfCard>
                </Grid>
              ))}
            </Grid>

            {filteredSections.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography sx={{ fontSize: '0.9rem', color: colors.text.muted }}>
                  No shortcuts found matching "{searchQuery}"
                </Typography>
              </Box>
            )}

            {/* Divider before Quick Jump */}
            <Box sx={{ my: 3, borderTop: `1px solid ${colors.border.default}` }} />

            {/* Quick Jump Section */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px`, mb: 2 }}>
                <RocketLaunchIcon sx={{ color: colors.success.main, fontSize: 20 }} />
                <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, color: colors.text.primary }}>
                  Quick Jump
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted }}>
                  Press a number key to navigate
                </Typography>
              </Box>

              <Grid container spacing={1}>
                {quickJumpPages.map((page) => (
                  <Grid size={{ xs: 6, sm: 4, md: 3 }} key={page.num}>
                    <Box sx={{
                      display: 'flex', alignItems: 'center', gap: `${spacing.sm}px`,
                      p: 1.5, borderRadius: `${borderRadius.md}px`,
                      bgcolor: colors.bg.secondary, border: `1px solid ${colors.border.default}`,
                      cursor: 'pointer',
                      transition: 'border-color 0.15s ease, background-color 0.15s ease',
                      '&:hover': {
                        borderColor: colors.brand.primary,
                        bgcolor: `${colors.brand.primary}08`,
                      },
                    }}>
                      <KbdKey>{page.num}</KbdKey>
                      <Box>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: colors.text.primary }}>
                          {page.label}
                        </Typography>
                        <Typography sx={{ fontSize: '0.65rem', color: colors.text.muted }}>
                          {page.path}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Box>
        </Box>
      </Box>
    </Fade>
  );
};

const KeyboardShortcutsOverlay: React.FC<React.ComponentProps<typeof KeyboardShortcutsOverlaySample>> = (props) => (
  <DemoSurfaceGate
    testId="keyboard-shortcuts"
    title="Keyboard shortcuts preview is not live on this testnet"
    description="This preview contains illustrative data or simulated actions, not verified testnet results."
  >
    <KeyboardShortcutsOverlaySample {...props} />
  </DemoSurfaceGate>
);

export default KeyboardShortcutsOverlay;
