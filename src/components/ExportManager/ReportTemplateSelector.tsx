import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import DescriptionIcon from '@mui/icons-material/Description';
import StarIcon from '@mui/icons-material/Star';
import TimerIcon from '@mui/icons-material/Timer';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import { colors, spacing, borderRadius, shadows } from '../ui/tokens';
import { WrfCard, WrfStatCard, WrfButton, WrfBadge } from '../ui';

interface Template {
  id: number;
  name: string;
  description: string;
  formats: string[];
  previewColor: string;
  previewAccent: string;
}

const templates: Template[] = [
  { id: 1, name: 'Monthly Station Report', description: 'Comprehensive monthly overview of weather station performance, data quality, and uptime metrics.', formats: ['PDF', 'XLSX'], previewColor: '#3B82F6', previewAccent: '#60A5FA' },
  { id: 2, name: 'Annual Climate Summary', description: 'Year-over-year climate trend analysis with temperature, precipitation, and anomaly charts.', formats: ['PDF', 'CSV', 'XLSX'], previewColor: '#10B981', previewAccent: '#34D399' },
  { id: 3, name: 'Earnings Statement', description: 'Detailed breakdown of WRFCoin earnings by station, period, and quality multiplier.', formats: ['PDF', 'XLSX'], previewColor: '#F59E0B', previewAccent: '#FBBF24' },
  { id: 4, name: 'Network Health Report', description: 'Network-wide statistics including node count, block times, transaction throughput, and P2P metrics.', formats: ['PDF', 'JSON'], previewColor: '#A855F7', previewAccent: '#C084FC' },
  { id: 5, name: 'Carbon Credit Certificate', description: 'Verified carbon credit documentation with offset calculations and chain-of-custody provenance.', formats: ['PDF'], previewColor: '#059669', previewAccent: '#6EE7B7' },
  { id: 6, name: 'Fleet Performance', description: 'Multi-station fleet analytics comparing data throughput, quality scores, and maintenance status.', formats: ['PDF', 'XLSX', 'CSV'], previewColor: '#EC4899', previewAccent: '#F9A8D4' },
  { id: 7, name: 'Forecast Accuracy', description: 'Model performance evaluation comparing WRFCoin forecasts against observed conditions.', formats: ['PDF', 'JSON', 'CSV'], previewColor: '#EF4444', previewAccent: '#FCA5A5' },
  { id: 8, name: 'Regulatory Compliance', description: 'Compliance documentation for SOC2, GDPR, and ISO standards with audit trail evidence.', formats: ['PDF'], previewColor: '#64748B', previewAccent: '#94A3B8' },
];

const colorSchemes = [
  { name: 'Brand Blue', primary: '#3B82F6', secondary: '#1E40AF', bg: '#EFF6FF' },
  { name: 'Professional Gray', primary: '#64748B', secondary: '#334155', bg: '#F8FAFC' },
  { name: 'Nature Green', primary: '#10B981', secondary: '#065F46', bg: '#ECFDF5' },
  { name: 'Sunset Orange', primary: '#F97316', secondary: '#C2410C', bg: '#FFF7ED' },
];

const customSections = [
  'Summary',
  'Charts',
  'Data Tables',
  'Maps',
  'Methodology',
  'Appendix',
];

const formatBadgeStatus: Record<string, 'online' | 'offline' | 'degraded' | 'pending' | 'syncing'> = {
  PDF: 'degraded',
  XLSX: 'online',
  CSV: 'pending',
  JSON: 'syncing',
};

const TemplatePreviewSVG = ({ color, accent }: { color: string; accent: string }) => (
  <svg
    width="100%"
    height="80"
    viewBox="0 0 200 80"
    style={{ borderRadius: borderRadius.sm, display: 'block' }}
  >
    <rect width="200" height="80" fill={colors.bg.tertiary} rx="4" />
    <rect x="8" y="6" width="184" height="12" rx="2" fill={color} opacity="0.8" />
    <rect x="8" y="24" width="100" height="4" rx="1" fill={accent} opacity="0.5" />
    <rect x="8" y="32" width="70" height="3" rx="1" fill={colors.text.muted} opacity="0.3" />
    <rect x="8" y="42" width="88" height="30" rx="2" fill={color} opacity="0.15" />
    <rect x="12" y="46" width="20" height="22" rx="1" fill={color} opacity="0.4" />
    <rect x="36" y="52" width="20" height="16" rx="1" fill={accent} opacity="0.4" />
    <rect x="60" y="48" width="20" height="20" rx="1" fill={color} opacity="0.3" />
    <rect x="104" y="42" width="88" height="8" rx="1" fill={accent} opacity="0.2" />
    <rect x="104" y="54" width="88" height="6" rx="1" fill={colors.text.muted} opacity="0.15" />
    <rect x="104" y="64" width="60" height="6" rx="1" fill={colors.text.muted} opacity="0.15" />
  </svg>
);

const ReportPreview = ({ template, colorScheme, includeCharts, logoPosition }: {
  template: Template;
  colorScheme: typeof colorSchemes[0];
  includeCharts: boolean;
  logoPosition: string;
}) => {
  const logoX = logoPosition === 'left' ? 10 : logoPosition === 'center' ? 85 : 165;

  return (
    <WrfCard title="Report Preview" sx={{ mt: 2 }}>
      <Box sx={{
        border: `1px solid ${colors.border.default}`,
        borderRadius: `${borderRadius.md}px`,
        overflow: 'hidden',
        bgcolor: colorScheme.bg,
      }}>
        <svg width="100%" height="300" viewBox="0 0 300 300" style={{ display: 'block' }}>
          {/* Header Bar */}
          <rect width="300" height="50" fill={colorScheme.primary} />
          {/* Logo placeholder */}
          <rect x={logoX} y="12" width="30" height="26" rx="4" fill="white" opacity="0.3" />
          <text x="150" y="35" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" opacity="0.9">
            {template.name}
          </text>

          {/* Date line */}
          <text x="15" y="68" fill={colorScheme.secondary} fontSize="7" opacity="0.6">
            Generated: Feb 14, 2026
          </text>

          {/* Table section */}
          <rect x="15" y="80" width="270" height="8" rx="2" fill={colorScheme.primary} opacity="0.15" />
          {[0, 1, 2, 3, 4].map((i) => (
            <React.Fragment key={i}>
              <rect x="15" y={94 + i * 14} width="270" height="10" rx="1" fill={colorScheme.secondary} opacity={0.04 + (i % 2) * 0.03} />
              <rect x="20" y={96 + i * 14} width={60 + Math.random() * 40} height="6" rx="1" fill={colorScheme.secondary} opacity="0.15" />
              <rect x="140" y={96 + i * 14} width={30 + Math.random() * 20} height="6" rx="1" fill={colorScheme.primary} opacity="0.2" />
              <rect x="220" y={96 + i * 14} width={20 + Math.random() * 30} height="6" rx="1" fill={colorScheme.secondary} opacity="0.12" />
            </React.Fragment>
          ))}

          {/* Chart section */}
          {includeCharts && (
            <>
              <rect x="15" y="170" width="130" height="80" rx="4" fill={colorScheme.primary} opacity="0.06" />
              <polyline
                points="25,240 45,220 65,230 85,210 105,215 125,200 135,205"
                fill="none"
                stroke={colorScheme.primary}
                strokeWidth="2"
                opacity="0.5"
              />
              <rect x="155" y="170" width="130" height="80" rx="4" fill={colorScheme.primary} opacity="0.06" />
              {[0, 1, 2, 3, 4].map((i) => (
                <rect
                  key={`bar-${i}`}
                  x={170 + i * 22}
                  y={250 - (20 + i * 12)}
                  width="14"
                  height={20 + i * 12}
                  rx="2"
                  fill={colorScheme.primary}
                  opacity={0.3 + i * 0.08}
                />
              ))}
            </>
          )}

          {/* Footer */}
          <rect x="0" y="270" width="300" height="30" fill={colorScheme.secondary} opacity="0.05" />
          <text x="15" y="288" fill={colorScheme.secondary} fontSize="6" opacity="0.4">
            WRFCoin Platform - Confidential
          </text>
          <text x="285" y="288" textAnchor="end" fill={colorScheme.secondary} fontSize="6" opacity="0.4">
            Page 1 of 4
          </text>
        </svg>
      </Box>
    </WrfCard>
  );
};

const ReportTemplateSelector = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [logoPosition, setLogoPosition] = useState('left');
  const [selectedColorScheme, setSelectedColorScheme] = useState(0);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customSectionsChecked, setCustomSectionsChecked] = useState<Record<string, boolean>>(
    Object.fromEntries(customSections.map((s) => [s, s === 'Summary' || s === 'Data Tables'])),
  );

  const handleSectionToggle = (section: string) => {
    setCustomSectionsChecked((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      color: colors.text.primary,
      backgroundColor: colors.bg.tertiary,
      borderRadius: `${borderRadius.md}px`,
      '& fieldset': { borderColor: colors.border.default },
      '&:hover fieldset': { borderColor: colors.border.light },
      '&.Mui-focused fieldset': { borderColor: colors.border.focus },
    },
    '& .MuiInputLabel-root': { color: colors.text.muted },
    '& .MuiInputLabel-root.Mui-focused': { color: colors.brand.primary },
  };

  return (
    <Box sx={{ bgcolor: colors.bg.primary, color: colors.text.primary, minHeight: '100vh', p: 3 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: colors.text.primary, mb: 0.5 }}>
          Report Templates
        </Typography>
        <Typography sx={{ fontSize: '1rem', color: colors.text.secondary }}>
          Choose a template, customize the layout, and generate professional reports
        </Typography>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard label="Templates Available" value="12" icon={DescriptionIcon} color={colors.brand.primary} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard label="Custom Templates" value="3" trend={33} trendLabel="new this month" icon={DashboardCustomizeIcon} color={colors.success.main} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard label="Most Used" value="Station Report" icon={StarIcon} color={colors.warning.main} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard label="Avg Generation Time" value="4.2s" trend={-15} trendLabel="faster" icon={TimerIcon} color="#A855F7" />
        </Grid>
      </Grid>

      {/* Template Gallery */}
      <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: colors.text.primary, mb: 2 }}>
        Template Gallery
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {templates.map((tpl) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={tpl.id}>
            <WrfCard
              sx={{
                cursor: 'pointer',
                border: selectedTemplate?.id === tpl.id
                  ? `1px solid ${colors.brand.primary}`
                  : `1px solid ${colors.border.default}`,
                boxShadow: selectedTemplate?.id === tpl.id ? shadows.glow(colors.brand.primary) : 'none',
                '&:hover': { borderColor: colors.border.light },
                transition: 'all 0.2s ease',
              }}
              onClick={() => setSelectedTemplate(tpl)}
            >
              <TemplatePreviewSVG color={tpl.previewColor} accent={tpl.previewAccent} />
              <Typography sx={{ fontWeight: 600, color: colors.text.primary, mt: 1.5, mb: 0.5 }}>
                {tpl.name}
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: colors.text.secondary, mb: 1.5, minHeight: 40 }}>
                {tpl.description}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1.5 }}>
                {tpl.formats.map((fmt) => (
                  <WrfBadge
                    key={fmt}
                    status={formatBadgeStatus[fmt] || 'pending'}
                    label={fmt}
                    size="sm"
                  />
                ))}
              </Box>
              <WrfButton
                size="sm"
                fullWidth
                variant={selectedTemplate?.id === tpl.id ? 'primary' : 'secondary'}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  setSelectedTemplate(tpl);
                }}
              >
                Use Template
              </WrfButton>
            </WrfCard>
          </Grid>
        ))}
      </Grid>

      {/* Selected Template Detail Panel */}
      {selectedTemplate && (
        <>
          <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: colors.text.primary, mb: 2 }}>
            Customize: {selectedTemplate.name}
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 5 }}>
              <WrfCard title="Customization Options">
                {/* Template info */}
                <Typography sx={{ fontSize: '0.875rem', color: colors.text.secondary, mb: 2 }}>
                  {selectedTemplate.description}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, mb: 3 }}>
                  {selectedTemplate.formats.map((fmt) => (
                    <WrfBadge key={fmt} status={formatBadgeStatus[fmt] || 'pending'} label={fmt} size="sm" />
                  ))}
                </Box>

                {/* Include Charts Toggle */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography sx={{ fontSize: '0.875rem', color: colors.text.primary }}>
                    Include Charts
                  </Typography>
                  <Switch
                    checked={includeCharts}
                    onChange={(e) => setIncludeCharts(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: colors.brand.primary },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: colors.brand.primary },
                    }}
                  />
                </Box>

                {/* Date Range */}
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField label="Start Date" type="date" size="small" fullWidth defaultValue="2026-01-01" InputLabelProps={{ shrink: true }} sx={inputSx} />
                  <TextField label="End Date" type="date" size="small" fullWidth defaultValue="2026-02-14" InputLabelProps={{ shrink: true }} sx={inputSx} />
                </Box>

                {/* Logo Position */}
                <Typography sx={{ fontSize: '0.875rem', color: colors.text.primary, mb: 1 }}>
                  Logo Position
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                  {['left', 'center', 'right'].map((pos) => (
                    <Box
                      key={pos}
                      onClick={() => setLogoPosition(pos)}
                      sx={{
                        flex: 1,
                        textAlign: 'center',
                        py: 1,
                        borderRadius: `${borderRadius.md}px`,
                        cursor: 'pointer',
                        border: `1px solid ${logoPosition === pos ? colors.brand.primary : colors.border.default}`,
                        bgcolor: logoPosition === pos ? 'rgba(59,130,246,0.1)' : 'transparent',
                        color: logoPosition === pos ? colors.brand.primary : colors.text.secondary,
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {pos.charAt(0).toUpperCase() + pos.slice(1)}
                    </Box>
                  ))}
                </Box>

                {/* Color Scheme */}
                <Typography sx={{ fontSize: '0.875rem', color: colors.text.primary, mb: 1 }}>
                  Color Scheme
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                  {colorSchemes.map((scheme, idx) => (
                    <Box
                      key={scheme.name}
                      onClick={() => setSelectedColorScheme(idx)}
                      sx={{
                        flex: 1,
                        textAlign: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <Box sx={{
                        width: '100%',
                        height: 32,
                        borderRadius: `${borderRadius.sm}px`,
                        background: `linear-gradient(135deg, ${scheme.primary}, ${scheme.secondary})`,
                        border: selectedColorScheme === idx
                          ? '2px solid white'
                          : '2px solid transparent',
                        mb: 0.5,
                        transition: 'border 0.15s ease',
                      }} />
                      <Typography sx={{
                        fontSize: '0.65rem',
                        color: selectedColorScheme === idx ? colors.text.primary : colors.text.muted,
                      }}>
                        {scheme.name}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                <WrfButton fullWidth onClick={() => alert(`Generating ${selectedTemplate.name}...`)}>
                  Generate Report
                </WrfButton>
              </WrfCard>
            </Grid>
            <Grid size={{ xs: 12, md: 7 }}>
              <ReportPreview
                template={selectedTemplate}
                colorScheme={colorSchemes[selectedColorScheme]}
                includeCharts={includeCharts}
                logoPosition={logoPosition}
              />
            </Grid>
          </Grid>
        </>
      )}

      {/* Create Custom Template */}
      <Box sx={{ mt: 4 }}>
        <WrfButton
          variant={showCustomForm ? 'secondary' : 'primary'}
          startIcon={<DashboardCustomizeIcon />}
          onClick={() => setShowCustomForm(!showCustomForm)}
        >
          {showCustomForm ? 'Cancel' : 'Create Custom Template'}
        </WrfButton>

        {showCustomForm && (
          <WrfCard title="New Custom Template" sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Template Name"
                  size="small"
                  fullWidth
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="My Custom Report"
                  sx={inputSx}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography sx={{ fontSize: '0.875rem', color: colors.text.primary, mb: 1 }}>
                  Include Sections
                </Typography>
                <FormGroup row>
                  {customSections.map((section) => (
                    <FormControlLabel
                      key={section}
                      control={
                        <Checkbox
                          checked={customSectionsChecked[section] || false}
                          onChange={() => handleSectionToggle(section)}
                          size="small"
                          sx={{
                            color: colors.text.muted,
                            '&.Mui-checked': { color: colors.brand.primary },
                          }}
                        />
                      }
                      label={
                        <Typography sx={{ fontSize: '0.8rem', color: colors.text.secondary }}>
                          {section}
                        </Typography>
                      }
                    />
                  ))}
                </FormGroup>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <WrfButton
                  onClick={() => {
                    alert(`Custom template "${customName}" created with sections: ${Object.entries(customSectionsChecked).filter(([, v]) => v).map(([k]) => k).join(', ')}`);
                    setShowCustomForm(false);
                    setCustomName('');
                  }}
                  disabled={!customName.trim()}
                >
                  Save Template
                </WrfButton>
              </Grid>
            </Grid>
          </WrfCard>
        )}
      </Box>
    </Box>
  );
};

export default ReportTemplateSelector;
