import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Divider,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Description as FileIcon,
  Close as CloseIcon,
  ArrowForward as ArrowIcon,
  ArrowBack as BackIcon,
  PlayArrow as StartIcon,
} from '@mui/icons-material';
import FormatDetector, {
  type DetectedFormat,
  type QualityPreview,
} from './FormatDetector';
import { type ColumnMapping } from './ColumnMapper';
import ImportProgress, {
  type ImportStats,
  type ImportResult,
  type ImportState,
} from './ImportProgress';
import CloudConnector, { type CloudPlatform } from './CloudConnector';
import { apiClient } from '../../services/apiClient';
import DemoSurfaceGate from '../common/DemoSurfaceGate';

// --- Types ---

type UploadStep = 'idle' | 'file-selected' | 'preview' | 'importing' | 'complete';

interface SelectedFile {
  name: string;
  size: number;
  type: string;
}

const SUPPORTED_FORMATS = [
  'CSV',
  'JSON',
  'WeatherLink Export',
  'Netatmo Export',
  'Weather Underground Archive',
  'Ambient Weather CSV',
  'Ecowitt CSV',
  'CWOP / APRS',
];

// --- Helpers ---

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// --- Component ---

// frontend#353: no backend route accepts batch uploads or cloud imports (the
// deployed API mounts no /api/upload). The former import reported "complete"
// after a 3 s timer, and cloud "connect" invented 42,000 records. The default
// build shows an honest not-live state. The demo build shows this sample
// with every import and connect action disabled.
const UPLOAD_UNAVAILABLE = 'Sample only: uploads and cloud imports are not accepted by the testnet API.';

const BatchUploadSample: React.FC = () => {
  const [step, setStep] = useState<UploadStep>('idle');
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format detection state (populated by upload API)
  const [detectedFormat, setDetectedFormat] = useState<DetectedFormat | null>(null);
  const [qualityPreview, setQualityPreview] = useState<QualityPreview | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [useMetric, setUseMetric] = useState(false);

  // Import state (populated by upload API)
  const [importState, setImportState] = useState<ImportState>('importing');
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Cloud connector state (fetched from API)
  const [platforms, setPlatforms] = useState<CloudPlatform[]>([]);

  useEffect(() => {
    apiClient.get<CloudPlatform[]>('/upload/cloud/platforms')
      .then((data) => { if (data) setPlatforms(data); })
      .catch(() => { /* keep empty list */ });
  }, []);

  // --- File handling ---

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile({ name: file.name, size: file.size, type: file.type });
    setStep('file-selected');
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setStep('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleProceedToPreview = useCallback(() => {
    setStep('preview');
  }, []);

  const handleDone = useCallback(() => {
    setStep('idle');
    setSelectedFile(null);
    setImportState('importing');
  }, []);

  // --- Render ---

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#0F172A',
        p: { xs: 2, md: 4 },
        fontFamily: '"Inter", sans-serif',
      }}
    >
      <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
        {/* Page header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            sx={{
              color: '#F8FAFC',
              fontWeight: 800,
              fontSize: '1.5rem',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              mb: 0.75,
            }}
          >
            Historical Data Import
          </Typography>
          <Typography sx={{ color: '#94A3B8', fontSize: '0.88rem', maxWidth: 640 }}>
            Import historical weather data from your station to earn retroactive quality points.
            Uploaded data is validated against physics-based checks and credited toward your
            achievement progress.
          </Typography>
        </Box>

        {/* Import progress / complete views */}
        {(step === 'importing' || step === 'complete') && importStats && (
          <ImportProgress
            state={importState}
            stats={importStats}
            result={importResult}
            onDone={handleDone}
          />
        )}

        {/* Preview step */}
        {step === 'preview' && detectedFormat && qualityPreview && (
          <Box>
            <FormatDetector
              format={detectedFormat}
              quality={qualityPreview}
              mappings={mappings}
              onMappingsChange={setMappings}
              useMetric={useMetric}
              onUnitToggle={setUseMetric}
            />

            {/* Action bar */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mt: 3,
              }}
            >
              <Button
                variant="outlined"
                startIcon={<BackIcon />}
                onClick={() => setStep('file-selected')}
                sx={{
                  borderColor: 'rgba(248,250,252,0.12)',
                  color: '#94A3B8',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: 'rgba(248,250,252,0.25)',
                    bgcolor: 'rgba(248,250,252,0.04)',
                  },
                }}
              >
                Back
              </Button>
              <Button
                variant="contained"
                endIcon={<StartIcon />}
                disabled
                title={UPLOAD_UNAVAILABLE}
                sx={{
                  bgcolor: '#10B981',
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 4,
                  '&:hover': { bgcolor: '#059669' },
                }}
              >
                Start Import
              </Button>
            </Box>
          </Box>
        )}

        {/* Idle & file-selected steps */}
        {(step === 'idle' || step === 'file-selected') && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Upload zone */}
            <Paper
              elevation={0}
              sx={{
                bgcolor: '#1E293B',
                borderRadius: 3,
                border: isDragOver
                  ? '2px dashed #3B82F6'
                  : '2px dashed rgba(248,250,252,0.12)',
                transition: 'border-color 0.2s, background-color 0.2s',
                ...(isDragOver && { bgcolor: 'rgba(59,130,246,0.06)' }),
                overflow: 'hidden',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json,.txt,.tsv"
                onChange={handleInputChange}
                style={{ display: 'none' }}
              />

              {/* Drop zone */}
              <Box
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !selectedFile && fileInputRef.current?.click()}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: selectedFile ? 3 : 6,
                  px: 3,
                  cursor: selectedFile ? 'default' : 'pointer',
                }}
              >
                {!selectedFile ? (
                  <>
                    <CloudUploadIcon
                      sx={{
                        fontSize: 56,
                        color: isDragOver ? '#3B82F6' : '#475569',
                        mb: 2,
                        transition: 'color 0.2s',
                      }}
                    />
                    <Typography
                      sx={{
                        color: '#F8FAFC',
                        fontWeight: 700,
                        fontSize: '1.05rem',
                        mb: 0.5,
                      }}
                    >
                      {isDragOver
                        ? 'Drop your file here'
                        : 'Drag and drop your weather data file'}
                    </Typography>
                    <Typography sx={{ color: '#64748B', fontSize: '0.82rem', mb: 2 }}>
                      or click to browse
                    </Typography>

                    {/* Supported formats */}
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 0.75,
                        justifyContent: 'center',
                        maxWidth: 520,
                      }}
                    >
                      {SUPPORTED_FORMATS.map((fmt) => (
                        <Chip
                          key={fmt}
                          label={fmt}
                          size="small"
                          sx={{
                            height: 24,
                            bgcolor: 'rgba(59,130,246,0.1)',
                            color: '#94A3B8',
                            fontSize: '0.68rem',
                            fontWeight: 500,
                            '& .MuiChip-label': { px: 1 },
                          }}
                        />
                      ))}
                    </Box>
                  </>
                ) : (
                  /* File selected display */
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      width: '100%',
                      maxWidth: 500,
                    }}
                  >
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: 'rgba(59,130,246,0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <FileIcon sx={{ color: '#3B82F6', fontSize: 24 }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          color: '#F8FAFC',
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {selectedFile.name}
                      </Typography>
                      <Typography sx={{ color: '#64748B', fontSize: '0.75rem' }}>
                        {formatFileSize(selectedFile.size)}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      startIcon={<CloseIcon sx={{ fontSize: 16 }} />}
                      onClick={handleRemoveFile}
                      sx={{
                        color: '#94A3B8',
                        textTransform: 'none',
                        fontSize: '0.75rem',
                        '&:hover': { color: '#EF4444', bgcolor: 'rgba(239,68,68,0.08)' },
                      }}
                    >
                      Remove
                    </Button>
                  </Box>
                )}
              </Box>

              {/* Proceed button when file is selected */}
              {selectedFile && (
                <Box
                  sx={{
                    px: 3,
                    py: 2,
                    borderTop: '1px solid rgba(248,250,252,0.06)',
                    display: 'flex',
                    justifyContent: 'flex-end',
                  }}
                >
                  <Button
                    variant="contained"
                    endIcon={<ArrowIcon />}
                    onClick={handleProceedToPreview}
                    sx={{
                      bgcolor: '#3B82F6',
                      textTransform: 'none',
                      fontWeight: 600,
                      '&:hover': { bgcolor: '#2563EB' },
                    }}
                  >
                    Detect Format & Preview
                  </Button>
                </Box>
              )}
            </Paper>

            {/* Divider */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Divider sx={{ flex: 1, borderColor: 'rgba(248,250,252,0.06)' }} />
              <Typography sx={{ color: '#475569', fontSize: '0.78rem', fontWeight: 500 }}>
                Or connect directly to your cloud account
              </Typography>
              <Divider sx={{ flex: 1, borderColor: 'rgba(248,250,252,0.06)' }} />
            </Box>

            {/* Cloud connector */}
            <CloudConnector platforms={platforms} unavailableReason={UPLOAD_UNAVAILABLE} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

const BatchUploadPage: React.FC = () => (
  <DemoSurfaceGate
    title="Batch upload is not live on the testnet"
    description="No testnet endpoint accepts file uploads or cloud-platform imports yet."
    testId="data-upload"
  >
    <BatchUploadSample />
  </DemoSurfaceGate>
);

export default BatchUploadPage;
