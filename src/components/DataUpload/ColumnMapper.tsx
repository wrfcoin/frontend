import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  DragIndicator as DragIcon,
  SwapHoriz as SwapIcon,
} from '@mui/icons-material';

// --- Types ---

export interface WrfcoinField {
  id: string;
  label: string;
  unit: string;
  required: boolean;
}

export interface ColumnMapping {
  csvColumn: string;
  wrfcoinField: string | null;
  confidence: number;
  autoDetected: boolean;
  sampleValues: string[];
}

export interface ColumnMapperProps {
  mappings: ColumnMapping[];
  onMappingsChange: (mappings: ColumnMapping[]) => void;
  useMetric: boolean;
}

// --- Constants ---

const WRFCOIN_FIELDS: WrfcoinField[] = [
  { id: 'timestamp', label: 'Timestamp', unit: '', required: true },
  { id: 'temperature', label: 'Temperature', unit: '\u00B0C / \u00B0F', required: true },
  { id: 'humidity', label: 'Humidity', unit: '%', required: true },
  { id: 'pressure', label: 'Pressure', unit: 'hPa / inHg', required: false },
  { id: 'wind_speed', label: 'Wind Speed', unit: 'm/s / mph', required: false },
  { id: 'wind_direction', label: 'Wind Direction', unit: '\u00B0', required: false },
  { id: 'rainfall', label: 'Rainfall', unit: 'mm / in', required: false },
  { id: 'uv_index', label: 'UV Index', unit: '', required: false },
  { id: 'pm25', label: 'PM2.5', unit: '\u00B5g/m\u00B3', required: false },
  { id: 'dewpoint', label: 'Dewpoint', unit: '\u00B0C / \u00B0F', required: false },
];

// (mock data removed — column mappings auto-detected by upload API)

// --- Component ---

const ColumnMapper: React.FC<ColumnMapperProps> = ({
  mappings,
  onMappingsChange,
  useMetric,
}) => {
  const [dragSource, setDragSource] = useState<number | null>(null);

  const assignedFields = mappings
    .filter((m) => m.wrfcoinField)
    .map((m) => m.wrfcoinField);

  const availableFields = WRFCOIN_FIELDS.filter(
    (f) => !assignedFields.includes(f.id),
  );

  const handleFieldChange = useCallback(
    (index: number, fieldId: string | null) => {
      const updated = mappings.map((m, i) =>
        i === index
          ? { ...m, wrfcoinField: fieldId, autoDetected: false, confidence: fieldId ? 1.0 : 0 }
          : m,
      );
      onMappingsChange(updated);
    },
    [mappings, onMappingsChange],
  );

  const handleDragStart = (index: number) => {
    setDragSource(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetIndex: number) => {
    if (dragSource === null || dragSource === targetIndex) return;
    const updated = [...mappings];
    const sourceField = updated[dragSource].wrfcoinField;
    const targetField = updated[targetIndex].wrfcoinField;
    updated[dragSource] = { ...updated[dragSource], wrfcoinField: targetField, autoDetected: false };
    updated[targetIndex] = { ...updated[targetIndex], wrfcoinField: sourceField, autoDetected: false };
    onMappingsChange(updated);
    setDragSource(null);
  };

  const getValidationStatus = (mapping: ColumnMapping): 'valid' | 'warning' | 'unmapped' => {
    if (!mapping.wrfcoinField) return 'unmapped';
    if (mapping.confidence >= 0.8) return 'valid';
    return 'warning';
  };

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: '#1E293B',
        borderRadius: 3,
        border: '1px solid rgba(59,130,246,0.15)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box sx={{ px: 3, py: 2, borderBottom: '1px solid rgba(248,250,252,0.06)' }}>
        <Typography sx={{ color: '#F8FAFC', fontWeight: 700, fontSize: '0.95rem' }}>
          Column Mapping
        </Typography>
        <Typography sx={{ color: '#64748B', fontSize: '0.78rem', mt: 0.5 }}>
          Drag to reorder or use dropdowns to assign CSV columns to WRFCoin fields.
          {useMetric ? ' Units: Metric' : ' Units: Imperial'}
        </Typography>
      </Box>

      {/* Column Headers */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '32px 1fr 32px 1fr 80px 1fr',
          gap: 1,
          px: 3,
          py: 1.5,
          bgcolor: 'rgba(15,23,42,0.5)',
          borderBottom: '1px solid rgba(248,250,252,0.06)',
        }}
      >
        <Box />
        <Typography sx={{ color: '#94A3B8', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>
          CSV Column
        </Typography>
        <Box />
        <Typography sx={{ color: '#94A3B8', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>
          WRFCoin Field
        </Typography>
        <Typography sx={{ color: '#94A3B8', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Status
        </Typography>
        <Typography sx={{ color: '#94A3B8', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Sample Data
        </Typography>
      </Box>

      {/* Mapping Rows */}
      {mappings.map((mapping, index) => {
        const status = getValidationStatus(mapping);
        return (
          <Box
            key={mapping.csvColumn}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(index)}
            sx={{
              display: 'grid',
              gridTemplateColumns: '32px 1fr 32px 1fr 80px 1fr',
              gap: 1,
              px: 3,
              py: 1.25,
              alignItems: 'center',
              borderBottom: '1px solid rgba(248,250,252,0.04)',
              bgcolor: dragSource === index ? 'rgba(59,130,246,0.08)' : 'transparent',
              transition: 'background-color 0.15s',
              cursor: 'grab',
              '&:hover': { bgcolor: 'rgba(248,250,252,0.02)' },
              '&:last-child': { borderBottom: 'none' },
            }}
          >
            {/* Drag handle */}
            <DragIcon sx={{ color: '#475569', fontSize: 18 }} />

            {/* CSV Column name */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                sx={{
                  color: '#F8FAFC',
                  fontSize: '0.82rem',
                  fontFamily: '"JetBrains Mono", monospace',
                  fontWeight: 500,
                }}
              >
                {mapping.csvColumn}
              </Typography>
            </Box>

            {/* Arrow */}
            <SwapIcon sx={{ color: '#475569', fontSize: 16 }} />

            {/* WRFCoin field selector */}
            <Box>
              {mapping.autoDetected && mapping.wrfcoinField ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ color: '#10B981', fontSize: '0.82rem', fontWeight: 600 }}>
                    {WRFCOIN_FIELDS.find((f) => f.id === mapping.wrfcoinField)?.label ?? mapping.wrfcoinField}
                  </Typography>
                  <Chip
                    label={`${Math.round(mapping.confidence * 100)}%`}
                    size="small"
                    sx={{
                      height: 18,
                      bgcolor: 'rgba(16,185,129,0.15)',
                      color: '#10B981',
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      '& .MuiChip-label': { px: 0.75 },
                    }}
                  />
                  <Tooltip title="Change mapping">
                    <IconButton
                      size="small"
                      onClick={() => handleFieldChange(index, null)}
                      sx={{ color: '#475569', p: 0.25 }}
                    >
                      <SwapIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              ) : (
                <Select
                  value={mapping.wrfcoinField ?? ''}
                  onChange={(e) =>
                    handleFieldChange(index, e.target.value || null)
                  }
                  displayEmpty
                  size="small"
                  sx={{
                    minWidth: 160,
                    bgcolor: 'rgba(15,23,42,0.6)',
                    color: '#F8FAFC',
                    fontSize: '0.8rem',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(248,250,252,0.1)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(59,130,246,0.4)',
                    },
                    '& .MuiSelect-icon': { color: '#64748B' },
                    height: 32,
                  }}
                >
                  <MenuItem value="">
                    <em style={{ color: '#64748B' }}>-- Skip column --</em>
                  </MenuItem>
                  {availableFields.map((field) => (
                    <MenuItem key={field.id} value={field.id}>
                      {field.label}
                      {field.required && (
                        <span style={{ color: '#EF4444', marginLeft: 4 }}>*</span>
                      )}
                    </MenuItem>
                  ))}
                </Select>
              )}
            </Box>

            {/* Status indicator */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {status === 'valid' && (
                <CheckCircleIcon sx={{ color: '#10B981', fontSize: 18 }} />
              )}
              {status === 'warning' && (
                <WarningIcon sx={{ color: '#F59E0B', fontSize: 18 }} />
              )}
              {status === 'unmapped' && (
                <Typography sx={{ color: '#475569', fontSize: '0.7rem' }}>--</Typography>
              )}
            </Box>

            {/* Sample values */}
            <Box sx={{ display: 'flex', gap: 0.75, overflow: 'hidden' }}>
              {mapping.sampleValues.slice(0, 3).map((val, vi) => (
                <Typography
                  key={vi}
                  sx={{
                    color: '#94A3B8',
                    fontSize: '0.7rem',
                    fontFamily: '"JetBrains Mono", monospace',
                    bgcolor: 'rgba(15,23,42,0.6)',
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {val}
                </Typography>
              ))}
            </Box>
          </Box>
        );
      })}

      {/* Footer */}
      <Box
        sx={{
          px: 3,
          py: 1.5,
          bgcolor: 'rgba(15,23,42,0.5)',
          borderTop: '1px solid rgba(248,250,252,0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography sx={{ color: '#64748B', fontSize: '0.72rem' }}>
          {mappings.filter((m) => m.wrfcoinField).length} / {mappings.length} columns mapped
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {WRFCOIN_FIELDS.filter((f) => f.required && !assignedFields.includes(f.id)).map((f) => (
            <Chip
              key={f.id}
              label={`Missing: ${f.label}`}
              size="small"
              sx={{
                height: 20,
                bgcolor: 'rgba(239,68,68,0.12)',
                color: '#EF4444',
                fontSize: '0.65rem',
                fontWeight: 600,
                '& .MuiChip-label': { px: 0.75 },
              }}
            />
          ))}
        </Box>
      </Box>
    </Paper>
  );
};

export default ColumnMapper;
