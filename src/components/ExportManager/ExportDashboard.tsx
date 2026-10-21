import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import DownloadIcon from '@mui/icons-material/Download';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import StorageIcon from '@mui/icons-material/Storage';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CategoryIcon from '@mui/icons-material/Category';
import DescriptionIcon from '@mui/icons-material/Description';
import TableChartIcon from '@mui/icons-material/TableChart';
import DataObjectIcon from '@mui/icons-material/DataObject';
import ImageIcon from '@mui/icons-material/Image';
import ApiIcon from '@mui/icons-material/Api';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { colors, spacing, borderRadius, shadows } from '../ui/tokens';
import { WrfCard, WrfStatCard, WrfButton, WrfBadge, WrfDataTable } from '../ui';

const exportFormats = [
  {
    name: 'PDF',
    icon: <DescriptionIcon sx={{ fontSize: 32, color: colors.error.main }} />,
    description: 'Formatted reports with charts, tables, and branding. Best for sharing.',
    sizeEstimate: '2-5 MB',
    popularity: 'Popular',
    popularityStatus: 'online' as const,
  },
  {
    name: 'XLSX',
    icon: <TableChartIcon sx={{ fontSize: 32, color: colors.success.main }} />,
    description: 'Spreadsheet format with multiple sheets and formulas. Ideal for analysis.',
    sizeEstimate: '1-3 MB',
    popularity: 'Popular',
    popularityStatus: 'online' as const,
  },
  {
    name: 'CSV',
    icon: <InsertDriveFileIcon sx={{ fontSize: 32, color: colors.brand.primary }} />,
    description: 'Plain text comma-separated values. Universal compatibility.',
    sizeEstimate: '0.5-2 MB',
    popularity: 'Standard',
    popularityStatus: 'pending' as const,
  },
  {
    name: 'JSON',
    icon: <DataObjectIcon sx={{ fontSize: 32, color: colors.warning.main }} />,
    description: 'Structured data format for programmatic consumption and API integration.',
    sizeEstimate: '1-4 MB',
    popularity: 'Standard',
    popularityStatus: 'pending' as const,
  },
  {
    name: 'PNG',
    icon: <ImageIcon sx={{ fontSize: 32, color: '#A855F7' }} />,
    description: 'Chart and graph snapshots as high-resolution images. Great for presentations.',
    sizeEstimate: '0.3-1 MB',
    popularity: 'New',
    popularityStatus: 'syncing' as const,
  },
  {
    name: 'API',
    icon: <ApiIcon sx={{ fontSize: 32, color: '#EC4899' }} />,
    description: 'Programmatic export via REST endpoints. Automate your data pipeline.',
    sizeEstimate: 'Variable',
    popularity: 'New',
    popularityStatus: 'syncing' as const,
  },
];

const dataSources = [
  'Station Report',
  'Climate Summary',
  'Earnings History',
  'Network Stats',
  'Portfolio',
];

const recentExports = [
  { id: 1, name: 'Q4_Station_Report', format: 'PDF', dataSource: 'Station Report', date: '2026-02-14', size: '3.2 MB', status: 'complete' },
  { id: 2, name: 'Weekly_Climate_Data', format: 'CSV', dataSource: 'Climate Summary', date: '2026-02-13', size: '1.8 MB', status: 'complete' },
  { id: 3, name: 'Earnings_Jan_2026', format: 'XLSX', dataSource: 'Earnings History', date: '2026-02-12', size: '2.4 MB', status: 'complete' },
  { id: 4, name: 'Network_Health_Snapshot', format: 'PNG', dataSource: 'Network Stats', date: '2026-02-12', size: '0.8 MB', status: 'processing' },
  { id: 5, name: 'Portfolio_Export_Feb', format: 'JSON', dataSource: 'Portfolio', date: '2026-02-11', size: '4.1 MB', status: 'complete' },
  { id: 6, name: 'Annual_Climate_Summary', format: 'PDF', dataSource: 'Climate Summary', date: '2026-02-10', size: '5.6 MB', status: 'complete' },
  { id: 7, name: 'Station_Raw_Data', format: 'CSV', dataSource: 'Station Report', date: '2026-02-09', size: '12.3 MB', status: 'failed' },
  { id: 8, name: 'API_Integration_Test', format: 'JSON', dataSource: 'Network Stats', date: '2026-02-08', size: '1.1 MB', status: 'complete' },
];

type BadgeStatus = 'online' | 'offline' | 'degraded' | 'pending' | 'syncing';

const formatBadgeStatus: Record<string, BadgeStatus> = {
  PDF: 'degraded',
  XLSX: 'online',
  CSV: 'pending',
  JSON: 'syncing',
  PNG: 'offline',
  API: 'online',
};

const statusBadgeMap: Record<string, { status: BadgeStatus; label: string }> = {
  complete: { status: 'online', label: 'Complete' },
  processing: { status: 'syncing', label: 'Processing' },
  failed: { status: 'degraded', label: 'Failed' },
};

const tableColumns = [
  { key: 'name', label: 'Export Name', sortable: true },
  {
    key: 'format',
    label: 'Format',
    sortable: true,
    render: (val: string) => (
      <WrfBadge status={formatBadgeStatus[val] || 'pending'} label={val} size="sm" />
    ),
  },
  { key: 'dataSource', label: 'Data Source', sortable: true },
  { key: 'date', label: 'Date', sortable: true },
  { key: 'size', label: 'Size', sortable: true },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (val: string) => {
      const cfg = statusBadgeMap[val] || { status: 'offline', label: val };
      return <WrfBadge status={cfg.status} label={cfg.label} size="sm" />;
    },
  },
  {
    key: 'download',
    label: '',
    sortable: false,
    render: (_val: unknown, row: Record<string, unknown>) => (
      <IconButton
        size="small"
        disabled={row.status !== 'complete'}
        sx={{
          color: row.status === 'complete' ? colors.brand.primary : colors.text.muted,
          '&:hover': { color: colors.brand.hover },
        }}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          alert(`Simulated download: ${row.name}.${(row.format as string).toLowerCase()}`);
        }}
      >
        <DownloadIcon fontSize="small" />
      </IconButton>
    ),
  },
];

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
  '& .MuiSelect-icon': { color: colors.text.muted },
};

const ExportDashboard = () => {
  const [selectedSource, setSelectedSource] = useState('Station Report');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-02-14');
  const [selectedFormat, setSelectedFormat] = useState('PDF');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => setIsExporting(false), 2500);
  };

  return (
    <Box sx={{ bgcolor: colors.bg.primary, color: colors.text.primary, minHeight: '100vh', p: 3 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: colors.text.primary, mb: 0.5 }}>
          Export Manager
        </Typography>
        <Typography sx={{ fontSize: '1rem', color: colors.text.secondary }}>
          Generate, schedule, and manage data exports across multiple formats
        </Typography>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Total Exports"
            value="247"
            trend={12}
            trendLabel="this month"
            icon={FileDownloadIcon}
            sparklineData={[18, 22, 19, 28, 25, 31, 27, 35]}
            color={colors.brand.primary}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Formats Available"
            value="6"
            icon={CategoryIcon}
            color={colors.success.main}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Scheduled Exports"
            value="3"
            trend={50}
            trendLabel="vs last week"
            icon={ScheduleIcon}
            color={colors.warning.main}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Storage Used"
            value="1.2 GB"
            trend={-8}
            trendLabel="after cleanup"
            icon={StorageIcon}
            sparklineData={[1.8, 1.7, 1.5, 1.4, 1.3, 1.2, 1.2, 1.2]}
            color="#A855F7"
          />
        </Grid>
      </Grid>

      {/* Export Format Cards */}
      <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: colors.text.primary, mb: 2 }}>
        Available Formats
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {exportFormats.map((fmt) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }} key={fmt.name}>
            <WrfCard
              sx={{
                textAlign: 'center',
                cursor: 'pointer',
                border: selectedFormat === fmt.name
                  ? `1px solid ${colors.brand.primary}`
                  : `1px solid ${colors.border.default}`,
                boxShadow: selectedFormat === fmt.name ? shadows.glow(colors.brand.primary) : 'none',
                '&:hover': { borderColor: colors.border.light },
                transition: 'all 0.2s ease',
              }}
              onClick={() => setSelectedFormat(fmt.name)}
            >
              <Box sx={{ mb: 1.5 }}>{fmt.icon}</Box>
              <Typography sx={{ fontWeight: 600, color: colors.text.primary, mb: 0.5 }}>
                {fmt.name}
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: colors.text.secondary, mb: 1.5, minHeight: 48 }}>
                {fmt.description}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted }}>
                  ~{fmt.sizeEstimate}
                </Typography>
                <WrfBadge status={fmt.popularityStatus} label={fmt.popularity} size="sm" />
              </Box>
            </WrfCard>
          </Grid>
        ))}
      </Grid>

      {/* Quick Export Section */}
      <WrfCard title="Quick Export" subtitle="Configure and generate an export in seconds" sx={{ mb: 4 }}>
        <Grid container spacing={3} sx={{ alignItems: 'flex-end' }}>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small" sx={inputSx}>
              <InputLabel>Data Source</InputLabel>
              <Select
                value={selectedSource}
                label="Data Source"
                onChange={(e) => setSelectedSource(e.target.value)}
              >
                {dataSources.map((src) => (
                  <MenuItem key={src} value={src}>{src}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <TextField
              label="Start Date"
              type="date"
              size="small"
              fullWidth
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={inputSx}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <TextField
              label="End Date"
              type="date"
              size="small"
              fullWidth
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={inputSx}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <RadioGroup
              row
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
            >
              {['PDF', 'CSV', 'JSON'].map((fmt) => (
                <FormControlLabel
                  key={fmt}
                  value={fmt}
                  control={
                    <Radio
                      size="small"
                      sx={{
                        color: colors.text.muted,
                        '&.Mui-checked': { color: colors.brand.primary },
                      }}
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: '0.8rem', color: colors.text.secondary }}>
                      {fmt}
                    </Typography>
                  }
                />
              ))}
            </RadioGroup>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <WrfButton
              fullWidth
              loading={isExporting}
              onClick={handleExport}
              startIcon={<FileDownloadIcon />}
            >
              Generate Export
            </WrfButton>
          </Grid>
        </Grid>
      </WrfCard>

      {/* Recent Exports Table */}
      <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: colors.text.primary, mb: 2 }}>
        Recent Exports
      </Typography>
      <WrfDataTable
        columns={tableColumns}
        data={recentExports}
        searchable
        exportable
        pagination
        pageSize={5}
      />
    </Box>
  );
};

export default ExportDashboard;
