import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Grid,
  IconButton,
  Tooltip,
  Divider,
  TextField,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import {
  Description as DescriptionIcon,
  Visibility as PreviewIcon,
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Category as CategoryIcon,
  TrendingUp as TrendingUpIcon,
  Cloud as CloudIcon,
  Thunderstorm as StormIcon,
  SettingsInputAntenna as NetworkIcon,
  FactCheck as AuditIcon,
  WbSunny as SeasonalIcon,
  ArrowBack as BackIcon,
  ContentCopy as UseTemplateIcon,
} from '@mui/icons-material';
import { apiClient } from '../../services/apiClient';

// ---------------------------------------------------------------------------
// Theme constants
// ---------------------------------------------------------------------------
const BG_ROOT = '#0F172A';
const BG_CARD = '#1E293B';
const BORDER = '#334155';
const PRIMARY = '#3B82F6';
const SUCCESS = '#10B981';
const WARNING = '#F59E0B';
const ERROR = '#EF4444';
const TEXT_SECONDARY = '#94A3B8';
const PURPLE = '#8B5CF6';
const CYAN = '#06B6D4';

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
const CATEGORIES = [
  { value: 'all', label: 'All Templates' },
  { value: 'forecast-verification', label: 'Forecast Verification' },
  { value: 'climate-trend', label: 'Climate Trend Analysis' },
  { value: 'severe-weather', label: 'Severe Weather Post-Mortem' },
  { value: 'station-network', label: 'Station Network Assessment' },
  { value: 'data-quality', label: 'Data Quality Audit' },
  { value: 'seasonal-outlook', label: 'Seasonal Outlook' },
];

function getCategoryColor(category) {
  switch (category) {
  case 'forecast-verification': return PRIMARY;
  case 'climate-trend': return SUCCESS;
  case 'severe-weather': return ERROR;
  case 'station-network': return PURPLE;
  case 'data-quality': return WARNING;
  case 'seasonal-outlook': return CYAN;
  default: return TEXT_SECONDARY;
  }
}

function getCategoryIcon(category) {
  switch (category) {
  case 'forecast-verification': return <TrendingUpIcon sx={{ fontSize: 20 }} />;
  case 'climate-trend': return <CloudIcon sx={{ fontSize: 20 }} />;
  case 'severe-weather': return <StormIcon sx={{ fontSize: 20 }} />;
  case 'station-network': return <NetworkIcon sx={{ fontSize: 20 }} />;
  case 'data-quality': return <AuditIcon sx={{ fontSize: 20 }} />;
  case 'seasonal-outlook': return <SeasonalIcon sx={{ fontSize: 20 }} />;
  default: return <DescriptionIcon sx={{ fontSize: 20 }} />;
  }
}

function getCategoryLabel(category) {
  const cat = CATEGORIES.find((c) => c.value === category);
  return cat ? cat.label : category;
}


// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function TemplateCard({ template, onUse, onPreview }) {
  const color = getCategoryColor(template.category);
  const icon = getCategoryIcon(template.category);

  return (
    <Paper
      sx={{
        bgcolor: BG_CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 2,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'border-color 0.2s, transform 0.2s',
        '&:hover': { borderColor: color, transform: 'translateY(-2px)' },
      }}
    >
      {/* Preview thumbnail */}
      <Box
        sx={{
          height: 100,
          background: template.previewColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <Box sx={{ color: `${color}`, opacity: 0.6 }}>
          {React.cloneElement(icon, { sx: { fontSize: 40 } })}
        </Box>
        <Chip
          label={getCategoryLabel(template.category)}
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: `${color}25`,
            color,
            fontSize: 10,
            height: 20,
            fontWeight: 600,
            '& .MuiChip-label': { px: 1 },
          }}
        />
      </Box>

      {/* Body */}
      <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography
          variant="subtitle2"
          sx={{ color: '#fff', fontWeight: 700, mb: 0.5, lineHeight: 1.3 }}
        >
          {template.name}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: TEXT_SECONDARY,
            fontSize: 12,
            lineHeight: 1.5,
            mb: 1.5,
            flex: 1,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {template.description}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Chip
            icon={<UseTemplateIcon sx={{ fontSize: 12 }} />}
            label={`${template.usageCount} uses`}
            size="small"
            sx={{
              bgcolor: `${BORDER}60`,
              color: TEXT_SECONDARY,
              fontSize: 10,
              height: 20,
              '& .MuiChip-icon': { color: TEXT_SECONDARY },
            }}
          />
          <Chip
            label={`${template.sections.length} sections`}
            size="small"
            sx={{
              bgcolor: `${BORDER}60`,
              color: TEXT_SECONDARY,
              fontSize: 10,
              height: 20,
            }}
          />
        </Box>
      </Box>

      {/* Actions */}
      <Divider sx={{ borderColor: BORDER }} />
      <Box sx={{ display: 'flex', gap: 1, p: 1.5 }}>
        <Button
          variant="contained"
          size="small"
          fullWidth
          startIcon={<AddIcon sx={{ fontSize: 16 }} />}
          onClick={() => onUse(template)}
          sx={{
            bgcolor: color,
            textTransform: 'none',
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 1.5,
            '&:hover': { bgcolor: color, filter: 'brightness(0.85)' },
          }}
        >
          Use Template
        </Button>
        <Button
          variant="outlined"
          size="small"
          startIcon={<PreviewIcon sx={{ fontSize: 16 }} />}
          onClick={() => onPreview(template)}
          sx={{
            color: TEXT_SECONDARY,
            borderColor: BORDER,
            textTransform: 'none',
            fontSize: 12,
            fontWeight: 500,
            borderRadius: 1.5,
            minWidth: 'auto',
            px: 2,
            '&:hover': { borderColor: color, color },
          }}
        >
          Preview
        </Button>
      </Box>
    </Paper>
  );
}

function TemplatePreview({ template, onClose, onUse }) {
  const color = getCategoryColor(template.category);
  const [selectedSections, setSelectedSections] = useState(
    template.sections.reduce((acc, s) => {
      acc[s.id] = s.default;
      return acc;
    }, {}),
  );

  const handleToggleSection = useCallback((sectionId) => {
    setSelectedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  }, []);

  const selectedCount = Object.values(selectedSections).filter(Boolean).length;

  return (
    <Paper
      sx={{
        bgcolor: BG_CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 2,
        p: 3,
        maxWidth: 640,
        mx: 'auto',
        width: '100%',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <Box
            sx={{
              bgcolor: `${color}20`,
              borderRadius: 2,
              width: 44,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color,
              flexShrink: 0,
            }}
          >
            {getCategoryIcon(template.category)}
          </Box>
          <Box>
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1.3 }}>
              {template.name}
            </Typography>
            <Chip
              label={getCategoryLabel(template.category)}
              size="small"
              sx={{
                bgcolor: `${color}15`,
                color,
                fontSize: 11,
                height: 22,
                fontWeight: 500,
                mt: 0.5,
              }}
            />
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: TEXT_SECONDARY }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Typography variant="body2" sx={{ color: TEXT_SECONDARY, lineHeight: 1.6, mb: 3 }}>
        {template.description}
      </Typography>

      <Divider sx={{ borderColor: BORDER, mb: 2 }} />

      {/* Section customization */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700 }}>
          Customize Sections
        </Typography>
        <Typography variant="caption" sx={{ color: TEXT_SECONDARY }}>
          {selectedCount} of {template.sections.length} selected
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 3 }}>
        {template.sections.map((section, idx) => (
          <Paper
            key={section.id}
            sx={{
              bgcolor: selectedSections[section.id] ? `${color}08` : BG_ROOT,
              border: `1px solid ${selectedSections[section.id] ? `${color}30` : BORDER}`,
              borderRadius: 1.5,
              px: 2,
              py: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.15s',
              '&:hover': { borderColor: color },
            }}
            onClick={() => handleToggleSection(section.id)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography
                variant="caption"
                sx={{
                  color: selectedSections[section.id] ? color : TEXT_SECONDARY,
                  fontWeight: 700,
                  fontSize: 11,
                  minWidth: 20,
                }}
              >
                {idx + 1}.
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: selectedSections[section.id] ? '#fff' : TEXT_SECONDARY,
                  fontSize: 13,
                  fontWeight: selectedSections[section.id] ? 500 : 400,
                }}
              >
                {section.label}
              </Typography>
              {section.default && (
                <Chip
                  label="Default"
                  size="small"
                  sx={{
                    bgcolor: `${BORDER}60`,
                    color: TEXT_SECONDARY,
                    fontSize: 9,
                    height: 16,
                  }}
                />
              )}
            </Box>
            <Checkbox
              checked={selectedSections[section.id]}
              size="small"
              sx={{
                color: BORDER,
                '&.Mui-checked': { color },
                p: 0,
              }}
            />
          </Paper>
        ))}
      </Box>

      {/* Action buttons */}
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Button
          variant="contained"
          fullWidth
          startIcon={<AddIcon />}
          onClick={() => onUse(template)}
          disabled={selectedCount === 0}
          sx={{
            bgcolor: color,
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
            py: 1.2,
            '&:hover': { bgcolor: color, filter: 'brightness(0.85)' },
          }}
        >
          Create Workspace ({selectedCount} sections)
        </Button>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{
            color: TEXT_SECONDARY,
            borderColor: BORDER,
            textTransform: 'none',
            fontWeight: 500,
            borderRadius: 2,
            px: 3,
            '&:hover': { borderColor: TEXT_SECONDARY },
          }}
        >
          Cancel
        </Button>
      </Box>
    </Paper>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
function AnalysisTemplate() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    apiClient.get('/collaborative/templates')
      .then((data) => setTemplates(Array.isArray(data) ? data : (data.templates ?? [])))
      .catch(() => setTemplates([]));
  }, []);

  const handleUseTemplate = useCallback((template) => {
    // In a real application, this would navigate to the workspace editor
    // with the template's sections pre-populated.
    setPreviewTemplate(null);
  }, []);

  const handlePreview = useCallback((template) => {
    setPreviewTemplate(template);
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewTemplate(null);
  }, []);

  const filteredTemplates = useMemo(() => {
    let result = templates;

    if (selectedCategory !== 'all') {
      result = result.filter((t) => t.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q),
      );
    }

    return result;
  }, [selectedCategory, searchQuery, templates]);

  // If previewing, show the preview panel
  if (previewTemplate) {
    return (
      <Box sx={{ bgcolor: BG_ROOT, minHeight: '100vh', p: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={handleClosePreview}
          sx={{
            color: TEXT_SECONDARY,
            textTransform: 'none',
            fontWeight: 500,
            mb: 3,
            '&:hover': { color: '#fff' },
          }}
        >
          Back to Templates
        </Button>
        <TemplatePreview
          template={previewTemplate}
          onClose={handleClosePreview}
          onUse={handleUseTemplate}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: BG_ROOT, minHeight: '100vh', p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, letterSpacing: '-0.01em' }}>
            Analysis Templates
          </Typography>
          <Typography variant="body2" sx={{ color: TEXT_SECONDARY, mt: 0.5 }}>
            Pre-built templates to jumpstart your collaborative weather analysis
          </Typography>
        </Box>
        <Chip
          label={`${templates.length} templates`}
          sx={{
            bgcolor: `${PRIMARY}15`,
            color: PRIMARY,
            fontWeight: 600,
            fontSize: 12,
          }}
        />
      </Box>

      {/* Search & Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: TEXT_SECONDARY, fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            minWidth: 260,
            '& .MuiOutlinedInput-root': {
              bgcolor: BG_CARD,
              color: '#fff',
              borderRadius: 2,
              '& fieldset': { borderColor: BORDER },
              '&:hover fieldset': { borderColor: TEXT_SECONDARY },
              '&.Mui-focused fieldset': { borderColor: PRIMARY },
            },
            '& input::placeholder': { color: TEXT_SECONDARY, opacity: 1 },
          }}
        />

        <Divider orientation="vertical" flexItem sx={{ borderColor: BORDER }} />

        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <FilterListIcon sx={{ color: TEXT_SECONDARY, fontSize: 18, mr: 0.5 }} />
          {CATEGORIES.map((cat) => (
            <Chip
              key={cat.value}
              label={cat.value === 'all' ? 'All' : cat.label}
              size="small"
              onClick={() => setSelectedCategory(cat.value)}
              sx={{
                bgcolor: selectedCategory === cat.value ? `${getCategoryColor(cat.value === 'all' ? 'all' : cat.value)}25` : 'transparent',
                color: selectedCategory === cat.value
                  ? (cat.value === 'all' ? PRIMARY : getCategoryColor(cat.value))
                  : TEXT_SECONDARY,
                border: `1px solid ${selectedCategory === cat.value
                  ? (cat.value === 'all' ? PRIMARY : getCategoryColor(cat.value))
                  : BORDER
                }`,
                fontWeight: 500,
                fontSize: 11,
                cursor: 'pointer',
                '&:hover': { bgcolor: `${getCategoryColor(cat.value === 'all' ? 'all' : cat.value)}15` },
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Template Grid */}
      <Grid container spacing={2.5}>
        {filteredTemplates.map((template) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={template.id}>
            <TemplateCard
              template={template}
              onUse={handleUseTemplate}
              onPreview={handlePreview}
            />
          </Grid>
        ))}
      </Grid>

      {/* Empty state */}
      {filteredTemplates.length === 0 && (
        <Paper
          sx={{
            bgcolor: BG_CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: 2,
            p: 6,
            textAlign: 'center',
          }}
        >
          <CategoryIcon sx={{ color: TEXT_SECONDARY, fontSize: 48, mb: 1 }} />
          <Typography variant="subtitle1" sx={{ color: '#fff', mb: 0.5 }}>
            No templates found
          </Typography>
          <Typography variant="body2" sx={{ color: TEXT_SECONDARY }}>
            Try adjusting your search or category filter
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

export default AnalysisTemplate;
