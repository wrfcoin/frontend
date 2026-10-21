import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Avatar,
  Rating,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  SmartToy,
  Speed,
  CloudUpload,
  Compare,
  TrendingUp,
  Star,
  GetApp,
  Schedule,
} from '@mui/icons-material';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const cardSx = {
  backgroundColor: '#1E293B',
  border: '1px solid #334155',
  borderRadius: 3,
  overflow: 'hidden',
  cursor: 'pointer',
  transition: 'all 0.25s ease',
  position: 'relative',
  '&:hover': {
    borderColor: '#3B82F6',
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 32px rgba(59,130,246,0.18)',
  },
  '&:hover .hover-metrics': {
    opacity: 1,
    transform: 'translateY(0)',
  },
};

const badgeColors = {
  'Global NWP': '#3B82F6',
  'Regional NWP': '#2563EB',
  'Climate Modeling': '#EC4899',
  'ML/AI Weather': '#8B5CF6',
  'Data Assimilation': '#6366F1',
  'Radar/Nowcasting': '#F59E0B',
  Hurricane: '#EF4444',
  'Severe Weather': '#DC2626',
  Wildfire: '#F97316',
  'Air Quality': '#10B981',
  Hydrology: '#06B6D4',
  'Ocean Modeling': '#0EA5E9',
  'Temperature Forecasting': '#E11D48',
  'Precipitation Forecasting': '#3B82F6',
  'Wind Prediction': '#14B8A6',
  'Humidity Modeling': '#0D9488',
};

const frameworkColors = {
  Fortran: '#734F96',
  'C/C++': '#00599C',
  Python: '#3776AB',
  PyTorch: '#EE4C2C',
  TensorFlow: '#FF6F00',
  ONNX: '#005CED',
  Custom: '#6366F1',
  Hybrid: '#A855F7',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ModelCard = ({
  model,
  onSelect,
  onDeploy,
  onCompare,
  isCompareSelected = false,
}) => {
  const [hovered, setHovered] = useState(false);

  const taskColor = badgeColors[model.taskType] || '#3B82F6';

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const timeSince = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 30) return `${days}d ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  };

  return (
    <Paper
      sx={cardSx}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect && onSelect(model)}
    >
      {/* Task type banner */}
      <Box sx={{ height: 4, backgroundColor: taskColor }} />

      <Box sx={{ p: 2.5 }}>
        {/* Header row: avatar + name + publisher */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
          <Avatar
            sx={{
              width: 42,
              height: 42,
              backgroundColor: `${taskColor}22`,
              color: taskColor,
              fontSize: 20,
            }}
          >
            <SmartToy fontSize="small" />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              sx={{
                color: '#F1F5F9',
                fontWeight: 700,
                lineHeight: 1.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {model.name}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              {model.publisher}
            </Typography>
          </Box>
        </Box>

        {/* Task type badge */}
        <Chip
          label={model.taskType}
          size="small"
          sx={{
            backgroundColor: `${taskColor}22`,
            color: taskColor,
            fontWeight: 600,
            fontSize: '0.7rem',
            height: 24,
            mb: 2,
          }}
        />

        {/* Primary metrics */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 1.5,
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
              RMSE
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: '#10B981', fontWeight: 700, fontSize: '1.1rem' }}
            >
              {model.rmse.toFixed(2)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
              MAE
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: '#3B82F6', fontWeight: 700, fontSize: '1.1rem' }}
            >
              {model.mae.toFixed(2)}
            </Typography>
          </Box>
        </Box>

        {/* Star rating */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Rating
            value={model.rating}
            precision={0.1}
            readOnly
            size="small"
            sx={{
              '& .MuiRating-iconFilled': { color: '#F59E0B' },
              '& .MuiRating-iconEmpty': { color: '#334155' },
            }}
          />
          <Typography variant="caption" sx={{ color: '#94A3B8' }}>
            ({model.reviewCount})
          </Typography>
        </Box>

        {/* Downloads + updated */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <GetApp sx={{ fontSize: 14, color: '#64748B' }} />
            <Typography variant="caption" sx={{ color: '#94A3B8' }}>
              {formatNumber(model.downloads)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Schedule sx={{ fontSize: 14, color: '#64748B' }} />
            <Typography variant="caption" sx={{ color: '#94A3B8' }}>
              {timeSince(model.lastUpdated)}
            </Typography>
          </Box>
        </Box>

        {/* Tags */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
          <Chip
            label={model.framework}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.65rem',
              backgroundColor: `${frameworkColors[model.framework] || '#6366F1'}22`,
              color: frameworkColors[model.framework] || '#6366F1',
              fontWeight: 600,
            }}
          />
          <Chip
            label={model.resolution}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.65rem',
              backgroundColor: '#1E40AF22',
              color: '#60A5FA',
            }}
          />
          <Chip
            label={model.region}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.65rem',
              backgroundColor: '#065F4622',
              color: '#34D399',
            }}
          />
        </Box>

        {/* Action buttons */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<CloudUpload sx={{ fontSize: 16 }} />}
            onClick={(e) => {
              e.stopPropagation();
              onDeploy && onDeploy(model);
            }}
            sx={{
              flex: 1,
              backgroundColor: '#3B82F6',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.75rem',
              py: 0.7,
              '&:hover': { backgroundColor: '#2563EB' },
            }}
          >
            Deploy
          </Button>
          <Tooltip title={isCompareSelected ? 'Remove from comparison' : 'Add to comparison'}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onCompare && onCompare(model);
              }}
              sx={{
                border: '1px solid',
                borderColor: isCompareSelected ? '#3B82F6' : '#334155',
                backgroundColor: isCompareSelected ? '#3B82F622' : 'transparent',
                color: isCompareSelected ? '#3B82F6' : '#94A3B8',
                '&:hover': {
                  borderColor: '#3B82F6',
                  backgroundColor: '#3B82F622',
                },
              }}
            >
              <Compare sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Hover overlay with additional metrics */}
      <Box
        className="hover-metrics"
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          borderTop: '1px solid #334155',
          p: 2,
          opacity: 0,
          transform: 'translateY(8px)',
          transition: 'all 0.25s ease',
          pointerEvents: hovered ? 'auto' : 'none',
        }}
      >
        <Typography
          variant="caption"
          sx={{ color: '#94A3B8', fontWeight: 600, mb: 1, display: 'block' }}
        >
          Additional Metrics
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 1,
          }}
        >
          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.6rem' }}>
              R-Squared
            </Typography>
            <Typography variant="body2" sx={{ color: '#F1F5F9', fontWeight: 600 }}>
              {model.rSquared.toFixed(3)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.6rem' }}>
              Skill Score
            </Typography>
            <Typography variant="body2" sx={{ color: '#F1F5F9', fontWeight: 600 }}>
              {model.skillScore.toFixed(2)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.6rem' }}>
              Inference
            </Typography>
            <Typography variant="body2" sx={{ color: '#F1F5F9', fontWeight: 600 }}>
              {model.inferenceTime}ms
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default ModelCard;
