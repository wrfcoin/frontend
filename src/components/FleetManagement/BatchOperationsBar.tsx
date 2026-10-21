import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Slider,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  PauseCircleOutline as PauseIcon,
  PlayCircleOutline as ResumeIcon,
  Schedule as IntervalIcon,
  FileDownload as ExportIcon,
  NotificationsActive as AlertIcon,
} from '@mui/icons-material';

// --- Types ---

export type BatchAction = 'pause' | 'resume' | 'interval' | 'export' | 'alert-threshold';

interface BatchOperationsBarProps {
  selectedCount: number;
  onAction: (action: BatchAction, params?: Record<string, unknown>) => void;
  onClearSelection: () => void;
}

// --- Component ---

const BatchOperationsBar: React.FC<BatchOperationsBarProps> = ({
  selectedCount,
  onAction,
  onClearSelection,
}) => {
  const [intervalAnchor, setIntervalAnchor] = useState<HTMLElement | null>(null);
  const [alertAnchor, setAlertAnchor] = useState<HTMLElement | null>(null);
  const [alertThreshold, setAlertThreshold] = useState<number>(80);

  if (selectedCount === 0) return null;

  const intervalOptions = [
    { label: '1 minute', value: 60 },
    { label: '5 minutes', value: 300 },
    { label: '15 minutes', value: 900 },
    { label: '30 minutes', value: 1800 },
    { label: '1 hour', value: 3600 },
  ];

  return (
    <Box
      sx={{
        position: 'sticky',
        bottom: 16,
        mx: 2,
        zIndex: 20,
        bgcolor: '#1E293B',
        border: '1px solid rgba(59,130,246,0.3)',
        borderRadius: 3,
        px: 2.5,
        py: 1.5,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        boxShadow: '0 -4px 24px rgba(0,0,0,0.4)',
        flexWrap: 'wrap',
      }}
    >
      {/* Selection count */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          label={selectedCount}
          size="small"
          sx={{
            height: 26,
            minWidth: 26,
            bgcolor: 'rgba(59,130,246,0.15)',
            color: '#3B82F6',
            fontWeight: 800,
            fontSize: '0.8rem',
            fontFamily: '"JetBrains Mono", monospace',
            border: '1px solid rgba(59,130,246,0.3)',
            '& .MuiChip-label': { px: 0.75 },
          }}
        />
        <Typography
          sx={{
            color: '#CBD5E1',
            fontSize: '0.8rem',
            fontWeight: 600,
            fontFamily: '"Inter", sans-serif',
          }}
        >
          station{selectedCount !== 1 ? 's' : ''} selected
        </Typography>
      </Box>

      <Divider
        orientation="vertical"
        flexItem
        sx={{ borderColor: 'rgba(248,250,252,0.08)' }}
      />

      {/* Actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        {/* Pause */}
        <Tooltip title="Pause selected stations">
          <Button
            size="small"
            startIcon={<PauseIcon sx={{ fontSize: 16 }} />}
            onClick={() => onAction('pause')}
            sx={{
              color: '#F59E0B',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.75rem',
              fontFamily: '"Inter", sans-serif',
              bgcolor: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 2,
              px: 1.5,
              '&:hover': {
                bgcolor: 'rgba(245,158,11,0.15)',
                borderColor: 'rgba(245,158,11,0.4)',
              },
            }}
          >
            Pause
          </Button>
        </Tooltip>

        {/* Resume */}
        <Tooltip title="Resume selected stations">
          <Button
            size="small"
            startIcon={<ResumeIcon sx={{ fontSize: 16 }} />}
            onClick={() => onAction('resume')}
            sx={{
              color: '#10B981',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.75rem',
              fontFamily: '"Inter", sans-serif',
              bgcolor: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: 2,
              px: 1.5,
              '&:hover': {
                bgcolor: 'rgba(16,185,129,0.15)',
                borderColor: 'rgba(16,185,129,0.4)',
              },
            }}
          >
            Resume
          </Button>
        </Tooltip>

        {/* Change Interval */}
        <Tooltip title="Change reporting interval">
          <Button
            size="small"
            startIcon={<IntervalIcon sx={{ fontSize: 16 }} />}
            onClick={(e) => setIntervalAnchor(e.currentTarget)}
            sx={{
              color: '#3B82F6',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.75rem',
              fontFamily: '"Inter", sans-serif',
              bgcolor: 'rgba(59,130,246,0.08)',
              border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: 2,
              px: 1.5,
              '&:hover': {
                bgcolor: 'rgba(59,130,246,0.15)',
                borderColor: 'rgba(59,130,246,0.4)',
              },
            }}
          >
            Interval
          </Button>
        </Tooltip>
        <Menu
          anchorEl={intervalAnchor}
          open={Boolean(intervalAnchor)}
          onClose={() => setIntervalAnchor(null)}
          slotProps={{
            paper: {
              sx: {
                bgcolor: '#1E293B',
                border: '1px solid rgba(248,250,252,0.1)',
                borderRadius: 2,
                minWidth: 180,
              },
            },
          }}
        >
          {intervalOptions.map((opt) => (
            <MenuItem
              key={opt.value}
              onClick={() => {
                onAction('interval', { seconds: opt.value });
                setIntervalAnchor(null);
              }}
              sx={{
                color: '#CBD5E1',
                fontSize: '0.8rem',
                fontFamily: '"Inter", sans-serif',
                '&:hover': { bgcolor: 'rgba(59,130,246,0.1)' },
              }}
            >
              <ListItemIcon>
                <IntervalIcon sx={{ fontSize: 16, color: '#3B82F6' }} />
              </ListItemIcon>
              <ListItemText
                primary={opt.label}
                slotProps={{ primary: { sx: { fontSize: '0.8rem' } } }}
              />
            </MenuItem>
          ))}
        </Menu>

        {/* Export */}
        <Tooltip title="Export data from selected stations">
          <Button
            size="small"
            startIcon={<ExportIcon sx={{ fontSize: 16 }} />}
            onClick={() => onAction('export')}
            sx={{
              color: '#A855F7',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.75rem',
              fontFamily: '"Inter", sans-serif',
              bgcolor: 'rgba(168,85,247,0.08)',
              border: '1px solid rgba(168,85,247,0.2)',
              borderRadius: 2,
              px: 1.5,
              '&:hover': {
                bgcolor: 'rgba(168,85,247,0.15)',
                borderColor: 'rgba(168,85,247,0.4)',
              },
            }}
          >
            Export
          </Button>
        </Tooltip>

        {/* Alert Threshold */}
        <Tooltip title="Set quality alert threshold">
          <Button
            size="small"
            startIcon={<AlertIcon sx={{ fontSize: 16 }} />}
            onClick={(e) => setAlertAnchor(e.currentTarget)}
            sx={{
              color: '#EF4444',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.75rem',
              fontFamily: '"Inter", sans-serif',
              bgcolor: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 2,
              px: 1.5,
              '&:hover': {
                bgcolor: 'rgba(239,68,68,0.15)',
                borderColor: 'rgba(239,68,68,0.4)',
              },
            }}
          >
            Alert
          </Button>
        </Tooltip>
        <Menu
          anchorEl={alertAnchor}
          open={Boolean(alertAnchor)}
          onClose={() => setAlertAnchor(null)}
          slotProps={{
            paper: {
              sx: {
                bgcolor: '#1E293B',
                border: '1px solid rgba(248,250,252,0.1)',
                borderRadius: 2,
                minWidth: 240,
                p: 2,
              },
            },
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: '#94A3B8', fontWeight: 600, letterSpacing: 0.5, mb: 1, display: 'block' }}
          >
            QUALITY ALERT THRESHOLD
          </Typography>
          <Box sx={{ px: 1 }}>
            <Slider
              value={alertThreshold}
              onChange={(_, val) => setAlertThreshold(val as number)}
              min={50}
              max={100}
              step={5}
              valueLabelDisplay="auto"
              valueLabelFormat={(v) => `${v}%`}
              sx={{
                color: '#EF4444',
                '& .MuiSlider-valueLabel': {
                  bgcolor: '#1E293B',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#EF4444',
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '0.7rem',
                },
              }}
            />
          </Box>
          <Button
            fullWidth
            size="small"
            onClick={() => {
              onAction('alert-threshold', { threshold: alertThreshold });
              setAlertAnchor(null);
            }}
            sx={{
              mt: 1,
              color: '#F8FAFC',
              bgcolor: 'rgba(239,68,68,0.15)',
              fontWeight: 600,
              fontSize: '0.75rem',
              fontFamily: '"Inter", sans-serif',
              textTransform: 'none',
              '&:hover': { bgcolor: 'rgba(239,68,68,0.25)' },
            }}
          >
            Apply to {selectedCount} station{selectedCount !== 1 ? 's' : ''}
          </Button>
        </Menu>
      </Box>

      {/* Spacer */}
      <Box sx={{ flex: 1 }} />

      {/* Clear */}
      <Tooltip title="Clear selection">
        <IconButton
          size="small"
          onClick={onClearSelection}
          sx={{ color: '#64748B', '&:hover': { color: '#F8FAFC' } }}
        >
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default BatchOperationsBar;
