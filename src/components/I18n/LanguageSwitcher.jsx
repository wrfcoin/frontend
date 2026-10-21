// LanguageSwitcher - Full-page language & localization settings
import React, { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import LanguageIcon from '@mui/icons-material/Language';
import TranslateIcon from '@mui/icons-material/Translate';
import GroupsIcon from '@mui/icons-material/Groups';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { colors, spacing, borderRadius, shadows } from '../ui/tokens';
import { WrfCard, WrfStatCard, WrfBadge, WrfButton, WrfDataTable } from '../ui';
import DemoSurfaceGate from '../common/DemoSurfaceGate';

// frontend#352: in the demo build this sample's controls are disabled; none of
// them reach a backend.
const SAMPLE_ACTION = 'Sample only: the site language does not change.';

// ---------------------------------------------------------------------------
// Language data
// ---------------------------------------------------------------------------
const LANGUAGES = [
  { code: 'en', flag: '\u{1F1FA}\u{1F1F8}', native: 'English', english: 'English', completion: 100 },
  { code: 'es', flag: '\u{1F1EA}\u{1F1F8}', native: 'Espa\u00f1ol', english: 'Spanish', completion: 94 },
  { code: 'fr', flag: '\u{1F1EB}\u{1F1F7}', native: 'Fran\u00e7ais', english: 'French', completion: 91 },
  { code: 'de', flag: '\u{1F1E9}\u{1F1EA}', native: 'Deutsch', english: 'German', completion: 87 },
  { code: 'ja', flag: '\u{1F1EF}\u{1F1F5}', native: '\u65E5\u672C\u8A9E', english: 'Japanese', completion: 82 },
];

// Mock translated preview content per locale
const PREVIEW_CONTENT = {
  en: {
    title: 'Platform Overview',
    description: 'View real-time weather data and manage your WRFCoin assets from one dashboard.',
    button: 'Connect Wallet',
    status: 'Online',
  },
  es: {
    title: 'Vista general de la plataforma',
    description: 'Vea datos meteorol\u00f3gicos en tiempo real y gestione sus activos WRFCoin desde un panel.',
    button: 'Conectar billetera',
    status: 'En l\u00ednea',
  },
  fr: {
    title: 'Aper\u00e7u de la plateforme',
    description: 'Consultez les donn\u00e9es m\u00e9t\u00e9o en temps r\u00e9el et g\u00e9rez vos actifs WRFCoin.',
    button: 'Connecter le portefeuille',
    status: 'En ligne',
  },
  de: {
    title: 'Plattform\u00fcbersicht',
    description: 'Sehen Sie Echtzeit-Wetterdaten und verwalten Sie Ihre WRFCoin-Verm\u00f6genswerte.',
    button: 'Geldb\u00f6rse verbinden',
    status: 'Online',
  },
  ja: {
    title: '\u30D7\u30E9\u30C3\u30C8\u30D5\u30A9\u30FC\u30E0\u6982\u8981',
    description: '\u30EA\u30A2\u30EB\u30BF\u30A4\u30E0\u306E\u6C17\u8C61\u30C7\u30FC\u30BF\u3092\u8868\u793A\u3057\u3001WRFCoin\u8CC7\u7523\u3092\u7BA1\u7406\u3057\u307E\u3059\u3002',
    button: '\u30A6\u30A9\u30EC\u30C3\u30C8\u3092\u63A5\u7D9A',
    status: '\u30AA\u30F3\u30E9\u30A4\u30F3',
  },
};

// Mock translation key samples per locale for the data table
const SAMPLE_KEYS = [
  { key: 'nav.dashboard', en: 'Dashboard', es: 'Panel', fr: 'Tableau de bord', de: '\u00dcbersicht', ja: '\u30C0\u30C3\u30B7\u30E5\u30DC\u30FC\u30C9', status: 'translated' },
  { key: 'nav.wallet', en: 'Wallet', es: 'Billetera', fr: 'Portefeuille', de: 'Geldb\u00f6rse', ja: '\u30A6\u30A9\u30EC\u30C3\u30C8', status: 'translated' },
  { key: 'action.submit', en: 'Submit', es: 'Enviar', fr: 'Soumettre', de: 'Absenden', ja: '\u9001\u4FE1', status: 'translated' },
  { key: 'action.cancel', en: 'Cancel', es: 'Cancelar', fr: 'Annuler', de: 'Abbrechen', ja: '\u30AD\u30E3\u30F3\u30BB\u30EB', status: 'translated' },
  { key: 'weather.temperature', en: 'Temperature', es: 'Temperatura', fr: 'Temp\u00e9rature', de: 'Temperatur', ja: '\u6E29\u5EA6', status: 'translated' },
  { key: 'weather.humidity', en: 'Humidity', es: 'Humedad', fr: 'Humidit\u00e9', de: 'Luftfeuchtigkeit', ja: '\u6E7F\u5EA6', status: 'translated' },
  { key: 'status.online', en: 'Online', es: 'En l\u00ednea', fr: 'En ligne', de: 'Online', ja: '\u30AA\u30F3\u30E9\u30A4\u30F3', status: 'translated' },
  { key: 'weather.windSpeed', en: 'Wind Speed', es: 'Velocidad del viento', fr: 'Vitesse du vent', de: 'Windgeschwindigkeit', ja: '\u98A8\u901F', status: 'translated' },
  { key: 'error.network', en: 'Network error', es: 'Error de red', fr: '', de: '', ja: '', status: 'missing' },
  { key: 'defi.slippage', en: 'Slippage tolerance', es: 'Tolerancia de deslizamiento', fr: 'Tol\u00e9rance de glissement', de: '', ja: '', status: 'fuzzy' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const LanguageSwitcherSample = () => {
  const [selectedLocale, setSelectedLocale] = useState('en');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [tempUnit, setTempUnit] = useState('\u00b0C');
  const [windUnit, setWindUnit] = useState('km/h');

  const currentLang = LANGUAGES.find((l) => l.code === selectedLocale) || LANGUAGES[0];
  const preview = PREVIEW_CONTENT[selectedLocale] || PREVIEW_CONTENT.en;

  // Build table data for the selected locale
  const tableData = useMemo(
    () =>
      SAMPLE_KEYS.map((row) => ({
        id: row.key,
        key: row.key,
        english: row.en,
        translated: row[selectedLocale] || '',
        status: row[selectedLocale] ? row.status : 'missing',
      })),
    [selectedLocale],
  );

  const tableColumns = [
    { key: 'key', label: 'Key', sortable: true },
    { key: 'english', label: 'English', sortable: false },
    { key: 'translated', label: currentLang.english, sortable: false },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (val) => {
        const statusMap = {
          translated: 'online',
          missing: 'offline',
          fuzzy: 'degraded',
        };
        const labelMap = {
          translated: 'Translated',
          missing: 'Missing',
          fuzzy: 'Fuzzy',
        };
        return <WrfBadge status={statusMap[val] || 'offline'} label={labelMap[val] || val} size="sm" />;
      },
    },
  ];

  return (
    <Box sx={{ bgcolor: colors.bg.primary, color: colors.text.primary, minHeight: '100vh', p: 3 }}>
      {/* Page header */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: colors.text.primary, mb: 0.5 }}>
          Language & Localization
        </Typography>
        <Typography sx={{ fontSize: '0.875rem', color: colors.text.secondary }}>
          Configure your preferred language, regional formats, and preview translations across the WRFCoin platform.
        </Typography>
      </Box>

      {/* Stat cards row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Current Language"
            value={currentLang.native}
            icon={LanguageIcon}
            color={colors.brand.primary}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Translation Coverage"
            value={`${currentLang.completion}%`}
            trend={currentLang.completion === 100 ? 0 : 2.4}
            trendLabel="this month"
            icon={TranslateIcon}
            color={colors.success.main}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Supported Languages"
            value="5"
            icon={LanguageIcon}
            color={colors.warning.main}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Community Translations"
            value="1,247"
            trend={8.3}
            trendLabel="this month"
            icon={GroupsIcon}
            color="#8B5CF6"
          />
        </Grid>
      </Grid>

      {/* Language selector grid */}
      <WrfCard title="Select Language" sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          {LANGUAGES.map((lang) => {
            const isSelected = lang.code === selectedLocale;
            return (
              <Grid size={{ xs: 12, sm: 6, md: 2.4 }} key={lang.code}>
                <Box
                  onClick={() => setSelectedLocale(lang.code)}
                  sx={{
                    backgroundColor: colors.bg.tertiary,
                    border: `2px solid ${isSelected ? colors.brand.primary : colors.border.default}`,
                    borderRadius: `${borderRadius.lg}px`,
                    padding: `${spacing.lg}px`,
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? shadows.glow(colors.brand.primary) : 'none',
                    '&:hover': {
                      borderColor: isSelected ? colors.brand.primary : colors.border.light,
                      backgroundColor: 'rgba(51, 65, 85, 0.8)',
                    },
                  }}
                >
                  <Typography sx={{ fontSize: '2.5rem', lineHeight: 1, mb: 1 }}>{lang.flag}</Typography>
                  <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: colors.text.primary, mb: 0.25 }}>
                    {lang.native}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted, mb: 1 }}>
                    {lang.english}
                  </Typography>
                  <WrfBadge
                    status={lang.completion === 100 ? 'online' : lang.completion >= 90 ? 'pending' : 'degraded'}
                    label={`${lang.completion}%`}
                    size="sm"
                  />
                  {isSelected && (
                    <CheckCircleIcon
                      sx={{ fontSize: 18, color: colors.brand.primary, display: 'block', mx: 'auto', mt: 1 }}
                    />
                  )}
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </WrfCard>

      {/* Preview panel */}
      <WrfCard title="Translation Preview" subtitle="How the selected language looks in context" sx={{ mb: 3 }}>
        <Box
          sx={{
            backgroundColor: colors.bg.primary,
            border: `1px solid ${colors.border.default}`,
            borderRadius: `${borderRadius.md}px`,
            p: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: colors.text.primary }}>
              {preview.title}
            </Typography>
            <WrfBadge status="online" label={preview.status} size="sm" pulse />
          </Box>
          <Typography sx={{ fontSize: '0.875rem', color: colors.text.secondary, mb: 2, lineHeight: 1.6 }}>
            {preview.description}
          </Typography>
          <WrfButton disabled title={SAMPLE_ACTION} variant="primary" size="md">
            {preview.button}
          </WrfButton>
        </Box>
      </WrfCard>

      {/* Regional format settings */}
      <WrfCard title="Regional Format Settings" subtitle="Customize how dates, temperatures, and units are displayed" sx={{ mb: 3 }}>
        <Grid container spacing={3}>
          {/* Date format */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
              Date Format
            </Typography>
            <Select
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              size="small"
              fullWidth
              sx={{
                color: colors.text.primary,
                backgroundColor: colors.bg.primary,
                borderRadius: `${borderRadius.md}px`,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border.default },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.border.light },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.brand.primary },
                '& .MuiSvgIcon-root': { color: colors.text.muted },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: colors.bg.secondary,
                    border: `1px solid ${colors.border.default}`,
                    '& .MuiMenuItem-root': {
                      color: colors.text.primary,
                      '&:hover': { backgroundColor: colors.bg.tertiary },
                      '&.Mui-selected': { backgroundColor: `${colors.brand.primary}22` },
                    },
                  },
                },
              }}
            >
              <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
              <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
              <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
            </Select>
          </Grid>

          {/* Temperature unit */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
              Temperature Unit
            </Typography>
            <ToggleButtonGroup
              value={tempUnit}
              exclusive
              onChange={(_, val) => val && setTempUnit(val)}
              fullWidth
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  color: colors.text.secondary,
                  borderColor: colors.border.default,
                  textTransform: 'none',
                  fontWeight: 500,
                  '&.Mui-selected': {
                    backgroundColor: `${colors.brand.primary}22`,
                    color: colors.brand.primary,
                    borderColor: colors.brand.primary,
                  },
                  '&:hover': { backgroundColor: colors.bg.tertiary },
                },
              }}
            >
              <ToggleButton value="\u00b0C">{'\u00b0C'}</ToggleButton>
              <ToggleButton value="\u00b0F">{'\u00b0F'}</ToggleButton>
            </ToggleButtonGroup>
          </Grid>

          {/* Wind speed unit */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
              Wind Speed Unit
            </Typography>
            <ToggleButtonGroup
              value={windUnit}
              exclusive
              onChange={(_, val) => val && setWindUnit(val)}
              fullWidth
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  color: colors.text.secondary,
                  borderColor: colors.border.default,
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '0.8rem',
                  '&.Mui-selected': {
                    backgroundColor: `${colors.brand.primary}22`,
                    color: colors.brand.primary,
                    borderColor: colors.brand.primary,
                  },
                  '&:hover': { backgroundColor: colors.bg.tertiary },
                },
              }}
            >
              <ToggleButton value="km/h">km/h</ToggleButton>
              <ToggleButton value="mph">mph</ToggleButton>
              <ToggleButton value="m/s">m/s</ToggleButton>
              <ToggleButton value="knots">knots</ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>
      </WrfCard>

      {/* Translation key samples table */}
      <WrfCard title="Translation Key Samples" subtitle="A sample of translation keys and their current status">
        <WrfDataTable
          columns={tableColumns}
          data={tableData}
          searchable
          pagination
          pageSize={10}
          sx={{ border: 'none' }}
        />
      </WrfCard>
    </Box>
  );
};

// frontend#352: display-only fabricated surface. The default build shows an
// honest not-live state and never mounts the sample.
const LanguageSwitcher = () => (
  <DemoSurfaceGate
    title="Language settings are not live"
    description="This page does not change the site language; the translated previews and coverage figures are samples."
    testId="language-preview"
  >
    <LanguageSwitcherSample />
  </DemoSurfaceGate>
);

export default LanguageSwitcher;
