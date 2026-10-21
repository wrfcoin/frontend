// TranslationManager - Community translation contribution interface
import React, { useState, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import Avatar from '@mui/material/Avatar';
import TranslateIcon from '@mui/icons-material/Translate';
import RateReviewIcon from '@mui/icons-material/RateReview';
import GroupsIcon from '@mui/icons-material/Groups';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AddIcon from '@mui/icons-material/Add';
import { colors, spacing, borderRadius, shadows } from '../ui/tokens';
import { WrfCard, WrfStatCard, WrfBadge, WrfButton, WrfDataTable } from '../ui';
import DemoSurfaceGate from '../common/DemoSurfaceGate';

// frontend#352 (codex round 27): no backend route accepts translation
// suggestions, so the demo's Suggest Translation is disabled and claims nothing.
const SAMPLE_ACTION = 'Sample only: suggestions are not submitted anywhere.';

// ---------------------------------------------------------------------------
// Language tabs
// ---------------------------------------------------------------------------
const LANGUAGES = [
  { code: 'en', label: 'English', flag: '\u{1F1FA}\u{1F1F8}' },
  { code: 'es', label: 'Spanish', flag: '\u{1F1EA}\u{1F1F8}' },
  { code: 'fr', label: 'French', flag: '\u{1F1EB}\u{1F1F7}' },
  { code: 'de', label: 'German', flag: '\u{1F1E9}\u{1F1EA}' },
  { code: 'ja', label: 'Japanese', flag: '\u{1F1EF}\u{1F1F5}' },
];

// ---------------------------------------------------------------------------
// Stats per language
// ---------------------------------------------------------------------------
const LANG_STATS = {
  en: { translated: 342, needsReview: 0, contributors: 12 },
  es: { translated: 321, needsReview: 8, contributors: 7 },
  fr: { translated: 311, needsReview: 12, contributors: 5 },
  de: { translated: 297, needsReview: 18, contributors: 4 },
  ja: { translated: 280, needsReview: 24, contributors: 3 },
};

// ---------------------------------------------------------------------------
// Category progress per language
// ---------------------------------------------------------------------------
const CATEGORY_PROGRESS = {
  en: { Navigation: 100, Actions: 100, Weather: 100, Settings: 100, Errors: 100 },
  es: { Navigation: 100, Actions: 95, Weather: 92, Settings: 88, Errors: 78 },
  fr: { Navigation: 100, Actions: 95, Weather: 88, Settings: 80, Errors: 75 },
  de: { Navigation: 100, Actions: 90, Weather: 85, Settings: 78, Errors: 70 },
  ja: { Navigation: 100, Actions: 88, Weather: 80, Settings: 72, Errors: 65 },
};

// ---------------------------------------------------------------------------
// Mock translation rows
// ---------------------------------------------------------------------------
const TRANSLATION_ROWS = {
  en: [
    { id: 1, key: 'nav.dashboard', category: 'Navigation', english: 'Dashboard', translation: 'Dashboard', status: 'reviewed', updatedAt: '2026-02-12' },
    { id: 2, key: 'nav.wallet', category: 'Navigation', english: 'Wallet', translation: 'Wallet', status: 'reviewed', updatedAt: '2026-02-12' },
    { id: 3, key: 'nav.explorer', category: 'Navigation', english: 'Explorer', translation: 'Explorer', status: 'reviewed', updatedAt: '2026-02-12' },
    { id: 4, key: 'nav.weather', category: 'Navigation', english: 'Weather', translation: 'Weather', status: 'reviewed', updatedAt: '2026-02-12' },
    { id: 5, key: 'action.submit', category: 'Actions', english: 'Submit', translation: 'Submit', status: 'reviewed', updatedAt: '2026-02-10' },
    { id: 6, key: 'action.cancel', category: 'Actions', english: 'Cancel', translation: 'Cancel', status: 'reviewed', updatedAt: '2026-02-10' },
    { id: 7, key: 'action.save', category: 'Actions', english: 'Save', translation: 'Save', status: 'reviewed', updatedAt: '2026-02-10' },
    { id: 8, key: 'action.connect', category: 'Actions', english: 'Connect', translation: 'Connect', status: 'reviewed', updatedAt: '2026-02-09' },
    { id: 9, key: 'weather.temperature', category: 'Weather', english: 'Temperature', translation: 'Temperature', status: 'reviewed', updatedAt: '2026-02-08' },
    { id: 10, key: 'weather.humidity', category: 'Weather', english: 'Humidity', translation: 'Humidity', status: 'reviewed', updatedAt: '2026-02-08' },
    { id: 11, key: 'weather.pressure', category: 'Weather', english: 'Pressure', translation: 'Pressure', status: 'reviewed', updatedAt: '2026-02-08' },
    { id: 12, key: 'weather.windSpeed', category: 'Weather', english: 'Wind Speed', translation: 'Wind Speed', status: 'reviewed', updatedAt: '2026-02-07' },
    { id: 13, key: 'settings.theme', category: 'Settings', english: 'Theme', translation: 'Theme', status: 'reviewed', updatedAt: '2026-02-06' },
    { id: 14, key: 'settings.notifications', category: 'Settings', english: 'Notifications', translation: 'Notifications', status: 'reviewed', updatedAt: '2026-02-06' },
    { id: 15, key: 'error.network', category: 'Errors', english: 'Network error', translation: 'Network error', status: 'reviewed', updatedAt: '2026-02-05' },
    { id: 16, key: 'error.timeout', category: 'Errors', english: 'Request timed out', translation: 'Request timed out', status: 'reviewed', updatedAt: '2026-02-05' },
  ],
  es: [
    { id: 1, key: 'nav.dashboard', category: 'Navigation', english: 'Dashboard', translation: 'Panel', status: 'translated', updatedAt: '2026-02-11' },
    { id: 2, key: 'nav.wallet', category: 'Navigation', english: 'Wallet', translation: 'Billetera', status: 'translated', updatedAt: '2026-02-11' },
    { id: 3, key: 'nav.explorer', category: 'Navigation', english: 'Explorer', translation: 'Explorador', status: 'translated', updatedAt: '2026-02-11' },
    { id: 4, key: 'nav.weather', category: 'Navigation', english: 'Weather', translation: 'Clima', status: 'translated', updatedAt: '2026-02-11' },
    { id: 5, key: 'action.submit', category: 'Actions', english: 'Submit', translation: 'Enviar', status: 'reviewed', updatedAt: '2026-02-10' },
    { id: 6, key: 'action.cancel', category: 'Actions', english: 'Cancel', translation: 'Cancelar', status: 'reviewed', updatedAt: '2026-02-10' },
    { id: 7, key: 'action.save', category: 'Actions', english: 'Save', translation: 'Guardar', status: 'translated', updatedAt: '2026-02-10' },
    { id: 8, key: 'action.connect', category: 'Actions', english: 'Connect', translation: 'Conectar', status: 'translated', updatedAt: '2026-02-09' },
    { id: 9, key: 'weather.temperature', category: 'Weather', english: 'Temperature', translation: 'Temperatura', status: 'translated', updatedAt: '2026-02-08' },
    { id: 10, key: 'weather.humidity', category: 'Weather', english: 'Humidity', translation: 'Humedad', status: 'translated', updatedAt: '2026-02-08' },
    { id: 11, key: 'weather.pressure', category: 'Weather', english: 'Pressure', translation: 'Presi\u00f3n', status: 'fuzzy', updatedAt: '2026-02-08' },
    { id: 12, key: 'weather.windSpeed', category: 'Weather', english: 'Wind Speed', translation: 'Velocidad del viento', status: 'translated', updatedAt: '2026-02-07' },
    { id: 13, key: 'settings.theme', category: 'Settings', english: 'Theme', translation: 'Tema', status: 'translated', updatedAt: '2026-02-06' },
    { id: 14, key: 'settings.notifications', category: 'Settings', english: 'Notifications', translation: 'Notificaciones', status: 'translated', updatedAt: '2026-02-06' },
    { id: 15, key: 'error.network', category: 'Errors', english: 'Network error', translation: 'Error de red', status: 'translated', updatedAt: '2026-02-05' },
    { id: 16, key: 'error.timeout', category: 'Errors', english: 'Request timed out', translation: '', status: 'missing', updatedAt: '' },
  ],
  fr: [
    { id: 1, key: 'nav.dashboard', category: 'Navigation', english: 'Dashboard', translation: 'Tableau de bord', status: 'translated', updatedAt: '2026-02-10' },
    { id: 2, key: 'nav.wallet', category: 'Navigation', english: 'Wallet', translation: 'Portefeuille', status: 'translated', updatedAt: '2026-02-10' },
    { id: 3, key: 'nav.explorer', category: 'Navigation', english: 'Explorer', translation: 'Explorateur', status: 'translated', updatedAt: '2026-02-10' },
    { id: 4, key: 'nav.weather', category: 'Navigation', english: 'Weather', translation: 'M\u00e9t\u00e9o', status: 'reviewed', updatedAt: '2026-02-10' },
    { id: 5, key: 'action.submit', category: 'Actions', english: 'Submit', translation: 'Soumettre', status: 'translated', updatedAt: '2026-02-09' },
    { id: 6, key: 'action.cancel', category: 'Actions', english: 'Cancel', translation: 'Annuler', status: 'translated', updatedAt: '2026-02-09' },
    { id: 7, key: 'action.save', category: 'Actions', english: 'Save', translation: 'Enregistrer', status: 'translated', updatedAt: '2026-02-09' },
    { id: 8, key: 'action.connect', category: 'Actions', english: 'Connect', translation: 'Connecter', status: 'fuzzy', updatedAt: '2026-02-08' },
    { id: 9, key: 'weather.temperature', category: 'Weather', english: 'Temperature', translation: 'Temp\u00e9rature', status: 'translated', updatedAt: '2026-02-07' },
    { id: 10, key: 'weather.humidity', category: 'Weather', english: 'Humidity', translation: 'Humidit\u00e9', status: 'translated', updatedAt: '2026-02-07' },
    { id: 11, key: 'weather.pressure', category: 'Weather', english: 'Pressure', translation: 'Pression', status: 'translated', updatedAt: '2026-02-07' },
    { id: 12, key: 'weather.windSpeed', category: 'Weather', english: 'Wind Speed', translation: 'Vitesse du vent', status: 'translated', updatedAt: '2026-02-06' },
    { id: 13, key: 'settings.theme', category: 'Settings', english: 'Theme', translation: 'Th\u00e8me', status: 'translated', updatedAt: '2026-02-05' },
    { id: 14, key: 'settings.notifications', category: 'Settings', english: 'Notifications', translation: '', status: 'missing', updatedAt: '' },
    { id: 15, key: 'error.network', category: 'Errors', english: 'Network error', translation: 'Erreur r\u00e9seau', status: 'translated', updatedAt: '2026-02-04' },
    { id: 16, key: 'error.timeout', category: 'Errors', english: 'Request timed out', translation: '', status: 'missing', updatedAt: '' },
  ],
  de: [
    { id: 1, key: 'nav.dashboard', category: 'Navigation', english: 'Dashboard', translation: '\u00dcbersicht', status: 'translated', updatedAt: '2026-02-09' },
    { id: 2, key: 'nav.wallet', category: 'Navigation', english: 'Wallet', translation: 'Geldb\u00f6rse', status: 'translated', updatedAt: '2026-02-09' },
    { id: 3, key: 'nav.explorer', category: 'Navigation', english: 'Explorer', translation: 'Explorer', status: 'translated', updatedAt: '2026-02-09' },
    { id: 4, key: 'nav.weather', category: 'Navigation', english: 'Weather', translation: 'Wetter', status: 'translated', updatedAt: '2026-02-09' },
    { id: 5, key: 'action.submit', category: 'Actions', english: 'Submit', translation: 'Absenden', status: 'translated', updatedAt: '2026-02-08' },
    { id: 6, key: 'action.cancel', category: 'Actions', english: 'Cancel', translation: 'Abbrechen', status: 'translated', updatedAt: '2026-02-08' },
    { id: 7, key: 'action.save', category: 'Actions', english: 'Save', translation: 'Speichern', status: 'fuzzy', updatedAt: '2026-02-08' },
    { id: 8, key: 'action.connect', category: 'Actions', english: 'Connect', translation: 'Verbinden', status: 'translated', updatedAt: '2026-02-07' },
    { id: 9, key: 'weather.temperature', category: 'Weather', english: 'Temperature', translation: 'Temperatur', status: 'translated', updatedAt: '2026-02-06' },
    { id: 10, key: 'weather.humidity', category: 'Weather', english: 'Humidity', translation: 'Luftfeuchtigkeit', status: 'translated', updatedAt: '2026-02-06' },
    { id: 11, key: 'weather.pressure', category: 'Weather', english: 'Pressure', translation: 'Luftdruck', status: 'translated', updatedAt: '2026-02-06' },
    { id: 12, key: 'weather.windSpeed', category: 'Weather', english: 'Wind Speed', translation: '', status: 'missing', updatedAt: '' },
    { id: 13, key: 'settings.theme', category: 'Settings', english: 'Theme', translation: 'Thema', status: 'translated', updatedAt: '2026-02-04' },
    { id: 14, key: 'settings.notifications', category: 'Settings', english: 'Notifications', translation: 'Benachrichtigungen', status: 'translated', updatedAt: '2026-02-04' },
    { id: 15, key: 'error.network', category: 'Errors', english: 'Network error', translation: '', status: 'missing', updatedAt: '' },
    { id: 16, key: 'error.timeout', category: 'Errors', english: 'Request timed out', translation: '', status: 'missing', updatedAt: '' },
  ],
  ja: [
    { id: 1, key: 'nav.dashboard', category: 'Navigation', english: 'Dashboard', translation: '\u30C0\u30C3\u30B7\u30E5\u30DC\u30FC\u30C9', status: 'translated', updatedAt: '2026-02-08' },
    { id: 2, key: 'nav.wallet', category: 'Navigation', english: 'Wallet', translation: '\u30A6\u30A9\u30EC\u30C3\u30C8', status: 'translated', updatedAt: '2026-02-08' },
    { id: 3, key: 'nav.explorer', category: 'Navigation', english: 'Explorer', translation: '\u30A8\u30AF\u30B9\u30D7\u30ED\u30FC\u30E9\u30FC', status: 'translated', updatedAt: '2026-02-08' },
    { id: 4, key: 'nav.weather', category: 'Navigation', english: 'Weather', translation: '\u5929\u6C17', status: 'reviewed', updatedAt: '2026-02-08' },
    { id: 5, key: 'action.submit', category: 'Actions', english: 'Submit', translation: '\u9001\u4FE1', status: 'translated', updatedAt: '2026-02-07' },
    { id: 6, key: 'action.cancel', category: 'Actions', english: 'Cancel', translation: '\u30AD\u30E3\u30F3\u30BB\u30EB', status: 'translated', updatedAt: '2026-02-07' },
    { id: 7, key: 'action.save', category: 'Actions', english: 'Save', translation: '\u4FDD\u5B58', status: 'translated', updatedAt: '2026-02-07' },
    { id: 8, key: 'action.connect', category: 'Actions', english: 'Connect', translation: '\u63A5\u7D9A', status: 'fuzzy', updatedAt: '2026-02-06' },
    { id: 9, key: 'weather.temperature', category: 'Weather', english: 'Temperature', translation: '\u6E29\u5EA6', status: 'translated', updatedAt: '2026-02-05' },
    { id: 10, key: 'weather.humidity', category: 'Weather', english: 'Humidity', translation: '\u6E7F\u5EA6', status: 'translated', updatedAt: '2026-02-05' },
    { id: 11, key: 'weather.pressure', category: 'Weather', english: 'Pressure', translation: '\u6C17\u5727', status: 'translated', updatedAt: '2026-02-05' },
    { id: 12, key: 'weather.windSpeed', category: 'Weather', english: 'Wind Speed', translation: '', status: 'missing', updatedAt: '' },
    { id: 13, key: 'settings.theme', category: 'Settings', english: 'Theme', translation: '', status: 'missing', updatedAt: '' },
    { id: 14, key: 'settings.notifications', category: 'Settings', english: 'Notifications', translation: '\u901A\u77E5', status: 'translated', updatedAt: '2026-02-03' },
    { id: 15, key: 'error.network', category: 'Errors', english: 'Network error', translation: '', status: 'missing', updatedAt: '' },
    { id: 16, key: 'error.timeout', category: 'Errors', english: 'Request timed out', translation: '', status: 'missing', updatedAt: '' },
  ],
};

// ---------------------------------------------------------------------------
// Leaderboard contributors
// ---------------------------------------------------------------------------
const CONTRIBUTORS = [
  { name: 'Maria G.', language: 'Spanish', count: 187, initials: 'MG', color: '#EF4444' },
  { name: 'Takeshi Y.', language: 'Japanese', count: 142, initials: 'TY', color: '#3B82F6' },
  { name: 'Pierre D.', language: 'French', count: 128, initials: 'PD', color: '#10B981' },
  { name: 'Hans W.', language: 'German', count: 104, initials: 'HW', color: '#F59E0B' },
  { name: 'Ana R.', language: 'Spanish', count: 91, initials: 'AR', color: '#8B5CF6' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const TranslationManagerSample = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [suggestionKey, setSuggestionKey] = useState('');
  const [suggestionValue, setSuggestionValue] = useState('');

  const currentLangCode = LANGUAGES[activeTab].code;
  const stats = LANG_STATS[currentLangCode];
  const categoryProgress = CATEGORY_PROGRESS[currentLangCode];
  const rows = TRANSLATION_ROWS[currentLangCode] || [];

  // Compute per-language missing count
  const missingCount = useMemo(
    () => rows.filter((r) => r.status === 'missing').length,
    [rows],
  );

  // Badge renderer for status column
  const renderStatus = useCallback((val) => {
    const map = {
      translated: { status: 'online', label: 'Translated' },
      reviewed: { status: 'online', label: 'Reviewed' },
      missing: { status: 'offline', label: 'Missing' },
      fuzzy: { status: 'degraded', label: 'Fuzzy' },
    };
    const cfg = map[val] || map.missing;
    return <WrfBadge status={cfg.status} label={cfg.label} size="sm" />;
  }, []);

  const tableColumns = [
    { key: 'key', label: 'Key', sortable: true },
    { key: 'english', label: 'English (Source)', sortable: false },
    {
      key: 'translation',
      label: 'Translation',
      sortable: false,
      render: (val, row) => (
        <Box
          sx={{
            backgroundColor: val ? 'transparent' : `${colors.error.main}12`,
            borderRadius: `${borderRadius.sm}px`,
            px: val ? 0 : 1,
            py: 0.25,
            minWidth: 80,
            fontStyle: val ? 'normal' : 'italic',
            color: val ? colors.text.primary : colors.text.muted,
            fontSize: '0.875rem',
          }}
        >
          {val || '(untranslated)'}
        </Box>
      ),
    },
    { key: 'status', label: 'Status', sortable: true, render: renderStatus },
    { key: 'updatedAt', label: 'Last Updated', sortable: true },
  ];

  return (
    <Box sx={{ bgcolor: colors.bg.primary, color: colors.text.primary, minHeight: '100vh', p: 3 }}>
      {/* Page header */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: colors.text.primary, mb: 0.5 }}>
          Translation Manager
        </Typography>
        <Typography sx={{ fontSize: '0.875rem', color: colors.text.secondary }}>
          Browse, review, and contribute translations for the WRFCoin platform.
        </Typography>
      </Box>

      {/* Stat cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Total Keys"
            value="342"
            icon={AssignmentIcon}
            color={colors.brand.primary}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Translated"
            value={stats.translated}
            trend={3.2}
            trendLabel="this week"
            icon={CheckCircleOutlineIcon}
            color={colors.success.main}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Needs Review"
            value={stats.needsReview}
            icon={RateReviewIcon}
            color={colors.warning.main}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Community Contributors"
            value={stats.contributors}
            trend={12}
            trendLabel="this month"
            icon={GroupsIcon}
            color="#8B5CF6"
          />
        </Grid>
      </Grid>

      {/* Language tabs */}
      <Box
        sx={{
          mb: 3,
          borderBottom: `1px solid ${colors.border.default}`,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              color: colors.text.muted,
              textTransform: 'none',
              fontWeight: 500,
              minHeight: 48,
              '&.Mui-selected': { color: colors.brand.primary },
            },
            '& .MuiTabs-indicator': { backgroundColor: colors.brand.primary },
          }}
        >
          {LANGUAGES.map((lang) => (
            <Tab key={lang.code} label={`${lang.flag}  ${lang.label}`} />
          ))}
        </Tabs>
      </Box>

      {/* Main content: table + sidebar */}
      <Grid container spacing={3}>
        {/* Translation table */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <WrfCard title="Translation Entries" subtitle={`Showing translations for ${LANGUAGES[activeTab].label}`}>
            <WrfDataTable
              columns={tableColumns}
              data={rows}
              searchable
              exportable
              pagination
              pageSize={8}
              sx={{ border: 'none' }}
            />
          </WrfCard>

          {/* Category progress */}
          <WrfCard title="Translation Progress by Category" sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {Object.entries(categoryProgress).map(([category, pct]) => (
                <Box key={category}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: colors.text.primary }}>
                      {category}
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: pct === 100 ? colors.success.main : pct >= 85 ? colors.brand.primary : colors.warning.main }}>
                      {pct}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={pct}
                    sx={{
                      height: 8,
                      borderRadius: `${borderRadius.full}px`,
                      backgroundColor: colors.bg.tertiary,
                      '& .MuiLinearProgress-bar': {
                        borderRadius: `${borderRadius.full}px`,
                        backgroundColor:
                          pct === 100
                            ? colors.success.main
                            : pct >= 85
                              ? colors.brand.primary
                              : colors.warning.main,
                      },
                    }}
                  />
                </Box>
              ))}
            </Box>
          </WrfCard>
        </Grid>

        {/* Sidebar */}
        <Grid size={{ xs: 12, lg: 4 }}>
          {/* Suggest translation */}
          <WrfCard title="Suggest Translation" sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Translation Key"
                placeholder="e.g. error.timeout"
                size="small"
                value={suggestionKey}
                onChange={(e) => setSuggestionKey(e.target.value)}
                sx={{
                  '& .MuiInputBase-root': {
                    color: colors.text.primary,
                    backgroundColor: colors.bg.primary,
                    borderRadius: `${borderRadius.md}px`,
                  },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border.default },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.border.light },
                  '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.brand.primary },
                  '& .MuiInputLabel-root': { color: colors.text.muted },
                  '& .MuiInputLabel-root.Mui-focused': { color: colors.brand.primary },
                }}
              />
              <TextField
                label={`Translation (${LANGUAGES[activeTab].label})`}
                placeholder="Enter your translation..."
                size="small"
                multiline
                rows={2}
                value={suggestionValue}
                onChange={(e) => setSuggestionValue(e.target.value)}
                sx={{
                  '& .MuiInputBase-root': {
                    color: colors.text.primary,
                    backgroundColor: colors.bg.primary,
                    borderRadius: `${borderRadius.md}px`,
                  },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border.default },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.border.light },
                  '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.brand.primary },
                  '& .MuiInputLabel-root': { color: colors.text.muted },
                  '& .MuiInputLabel-root.Mui-focused': { color: colors.brand.primary },
                }}
              />
              <WrfButton
                variant="primary"
                size="md"
                disabled
                title={SAMPLE_ACTION}
                startIcon={<AddIcon />}
                fullWidth
              >
                Suggest Translation
              </WrfButton>
            </Box>

          </WrfCard>

          {/* Contribution leaderboard */}
          <WrfCard title="Contribution Leaderboard">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {CONTRIBUTORS.map((contrib, idx) => (
                <Box
                  key={contrib.name}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    backgroundColor: colors.bg.primary,
                    border: `1px solid ${colors.border.default}`,
                    borderRadius: `${borderRadius.md}px`,
                    p: 1.5,
                    transition: 'border-color 0.2s ease',
                    '&:hover': { borderColor: colors.border.light },
                  }}
                >
                  {/* Rank */}
                  <Typography
                    sx={{
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      color: idx === 0 ? '#FBBF24' : idx === 1 ? '#94A3B8' : idx === 2 ? '#CD7F32' : colors.text.muted,
                      width: 20,
                      textAlign: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </Typography>

                  {/* Avatar */}
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: `${contrib.color}22`,
                      color: contrib.color,
                      flexShrink: 0,
                    }}
                  >
                    {contrib.initials}
                  </Avatar>

                  {/* Info */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.text.primary, lineHeight: 1.3 }}>
                      {contrib.name}
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted, lineHeight: 1.3 }}>
                      {contrib.language}
                    </Typography>
                  </Box>

                  {/* Count */}
                  <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: colors.brand.primary }}>
                      {contrib.count}
                    </Typography>
                    <Typography sx={{ fontSize: '0.625rem', color: colors.text.muted }}>
                      translations
                    </Typography>
                  </Box>
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
const TranslationManager = () => (
  <DemoSurfaceGate
    title="Translation management is not live"
    description="No backend route stores translation strings or coverage yet."
    testId="translation-manager"
  >
    <TranslationManagerSample />
  </DemoSurfaceGate>
);

export default TranslationManager;
