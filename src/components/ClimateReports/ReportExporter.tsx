import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Switch,
  Chip,
  Divider,
  Alert,
} from '@mui/material';
import {
  PictureAsPdf,
  Language,
  TableChart,
  CloudUpload,
  Description,
  Shield,
} from '@mui/icons-material';

import type { Region, AnnualRecord, SeasonData } from './ClimateReportDashboard';

// --- Types ---

interface ReportExporterProps {
  region: Region;
  annualData: AnnualRecord[];
  seasonData: SeasonData[];
}

type ExportFormat = 'pdf' | 'web' | 'csv';

interface ExportSection {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

// --- Main Component ---

const ReportExporter: React.FC<ReportExporterProps> = ({ region, annualData, seasonData }) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [publishToChain, setPublishToChain] = useState(false);
  // frontend#330: there is no export service behind this panel. The former
  // handleGenerate() animated a random progress bar for ~3 s and then claimed
  // "Report generated successfully!" (and "Hash published to blockchain")
  // without producing anything. Say so instead.
  const [exportUnavailable, setExportUnavailable] = useState(false);

  const [sections, setSections] = useState<ExportSection[]>([
    { id: 'seasonal', label: 'Seasonal Summary', description: 'Four-season overview with temperature and precipitation', enabled: true },
    { id: 'trends', label: 'Trend Analysis', description: 'Temperature, precipitation, and growing season trends', enabled: true },
    { id: 'extremes', label: 'Extreme Events', description: 'Frequency analysis of extreme weather events', enabled: true },
    { id: 'indicators', label: 'Climate Indicators', description: 'Heating/cooling degree days and drought index', enabled: true },
    { id: 'stations', label: 'Station Data Provenance', description: 'Source station metadata and quality scores', enabled: true },
    { id: 'methodology', label: 'Methodology Notes', description: 'Data processing, QC methods, and statistical approaches', enabled: true },
  ]);

  const handleToggleSection = (id: string) => {
    setSections(prev =>
      prev.map(s => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
    );
  };

  const handleGenerate = () => {
    setExportUnavailable(true);
  };

  const enabledCount = sections.filter(s => s.enabled).length;
  const yearRange = `${annualData[0]?.year}\u2013${annualData[annualData.length - 1]?.year}`;

  const FORMAT_OPTIONS: { key: ExportFormat; label: string; icon: React.ReactNode; desc: string }[] = [
    { key: 'pdf', label: 'PDF Report', icon: <PictureAsPdf />, desc: 'Formatted document with charts and tables' },
    { key: 'web', label: 'Interactive Web', icon: <Language />, desc: 'Shareable link with interactive charts' },
    { key: 'csv', label: 'CSV Data', icon: <TableChart />, desc: 'Raw data export for further analysis' },
  ];

  return (
    <Box>
      <Typography
        sx={{
          color: '#F8FAFC',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 700,
          fontSize: 20,
          mb: 2,
        }}
      >
        Generate Climate Report
      </Typography>

      <Grid container spacing={2.5}>
        {/* Report Preview & Sections */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ bgcolor: '#0F172A', borderRadius: 2, p: 2.5, border: '1px solid #1E293B' }}>
            {/* Report Header Preview */}
            <Box
              sx={{
                bgcolor: '#1E293B',
                borderRadius: 1.5,
                p: 2,
                mb: 2,
                border: '1px solid #334155',
              }}
            >
              <Typography sx={{ color: '#3B82F6', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 16 }}>
                Regional Climate Report
              </Typography>
              <Typography sx={{ color: '#F8FAFC', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 22, mt: 0.5 }}>
                {region.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, mt: 1, flexWrap: 'wrap' }}>
                <Chip
                  size="small"
                  label={yearRange}
                  sx={{ bgcolor: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}
                />
                <Chip
                  size="small"
                  label={`${region.stationCount} stations`}
                  sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#10B981', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}
                />
                <Chip
                  size="small"
                  label={`${enabledCount} sections`}
                  sx={{ bgcolor: 'rgba(148, 163, 184, 0.15)', color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}
                />
              </Box>
            </Box>

            {/* Section Toggles */}
            <Typography
              sx={{
                color: '#94A3B8',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: 13,
                mb: 1.5,
              }}
            >
              Report Sections
            </Typography>
            <FormGroup>
              {sections.map(section => (
                <Box
                  key={section.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    py: 1,
                    borderBottom: '1px solid #1E293B',
                  }}
                >
                  <Box>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={section.enabled}
                          onChange={() => handleToggleSection(section.id)}
                          sx={{
                            color: '#334155',
                            '&.Mui-checked': { color: '#3B82F6' },
                          }}
                        />
                      }
                      label={
                        <Typography sx={{ color: '#F8FAFC', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600 }}>
                          {section.label}
                        </Typography>
                      }
                    />
                    <Typography sx={{ color: '#64748B', fontSize: 12, fontFamily: 'Inter, sans-serif', ml: 4 }}>
                      {section.description}
                    </Typography>
                  </Box>
                  <Description sx={{ color: '#334155', fontSize: 18, mt: 1 }} />
                </Box>
              ))}
            </FormGroup>
          </Paper>
        </Grid>

        {/* Export Options */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ bgcolor: '#0F172A', borderRadius: 2, p: 2.5, border: '1px solid #1E293B' }}>
            <Typography
              sx={{
                color: '#94A3B8',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: 13,
                mb: 2,
              }}
            >
              Export Format
            </Typography>

            {FORMAT_OPTIONS.map(opt => (
              <Box
                key={opt.key}
                onClick={() => setSelectedFormat(opt.key)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 1.5,
                  mb: 1,
                  cursor: 'pointer',
                  bgcolor: selectedFormat === opt.key ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  border: `1px solid ${selectedFormat === opt.key ? '#3B82F6' : '#1E293B'}`,
                  transition: 'all 0.15s',
                  '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.05)' },
                }}
              >
                <Box sx={{ color: selectedFormat === opt.key ? '#3B82F6' : '#64748B' }}>
                  {opt.icon}
                </Box>
                <Box>
                  <Typography sx={{ color: '#F8FAFC', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 14 }}>
                    {opt.label}
                  </Typography>
                  <Typography sx={{ color: '#64748B', fontSize: 11, fontFamily: 'Inter, sans-serif' }}>
                    {opt.desc}
                  </Typography>
                </Box>
              </Box>
            ))}

            <Divider sx={{ borderColor: '#1E293B', my: 2 }} />

            {/* Publish to Chain */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1.5,
                borderRadius: 1.5,
                bgcolor: publishToChain ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                border: `1px solid ${publishToChain ? '#10B981' : '#1E293B'}`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Shield sx={{ color: publishToChain ? '#10B981' : '#64748B', fontSize: 20 }} />
                <Box>
                  <Typography sx={{ color: '#F8FAFC', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 14 }}>
                    Publish to Chain
                  </Typography>
                  <Typography sx={{ color: '#64748B', fontSize: 11, fontFamily: 'Inter, sans-serif' }}>
                    Hash report on WRFCoin blockchain
                  </Typography>
                </Box>
              </Box>
              <Switch
                checked={publishToChain}
                onChange={(_, checked) => setPublishToChain(checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#10B981' },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#10B981' },
                }}
              />
            </Box>

            <Divider sx={{ borderColor: '#1E293B', my: 2 }} />

            {/* Generate Button */}
            {exportUnavailable && (
              <Alert
                severity="warning"
                data-testid="report-export-not-live"
                sx={{ mb: 2, '& .MuiAlert-message': { fontFamily: 'Inter, sans-serif', fontSize: 13 } }}
              >
                Report generation is not available yet — no export service is wired to the testnet API, so
                nothing was generated{publishToChain ? ' or published' : ''}.
              </Alert>
            )}
            <Button
              variant="contained"
              fullWidth
              startIcon={<CloudUpload />}
              onClick={handleGenerate}
              disabled={enabledCount === 0 || exportUnavailable}
              sx={{
                bgcolor: '#3B82F6',
                color: '#F8FAFC',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                textTransform: 'none',
                py: 1.5,
                fontSize: 15,
                '&:hover': { bgcolor: '#2563EB' },
                '&:disabled': { bgcolor: '#334155', color: '#64748B' },
              }}
            >
              Generate Report
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReportExporter;
