import DemoSurfaceGate from '../common/DemoSurfaceGate';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  LinearProgress,
  Stack,
  Chip,
  Tooltip,
  Divider,
} from '@mui/material';
import SpeedIcon from '@mui/icons-material/Speed';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import StorageIcon from '@mui/icons-material/Storage';
import TimelineIcon from '@mui/icons-material/Timeline';
import PsychologyIcon from '@mui/icons-material/Psychology';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CircularProgress from '@mui/material/CircularProgress';

import { colors, spacing, borderRadius, shadows } from '../ui/tokens';
import WrfCard from '../ui/WrfCard';
import WrfStatCard from '../ui/WrfStatCard';
import WrfButton from '../ui/WrfButton';
import WrfBadge from '../ui/WrfBadge';
import { WrfVerificationTimeline } from '../DesignSystem/WrfVerificationTimeline';
import type { VerificationTimelineStep } from '../../types/verification';
import { useZkProver } from '../../hooks/useZkProver';

// ---------------------------------------------------------------------------
// Constants & Fallbacks
// ---------------------------------------------------------------------------

/** Fallback model list shown while circuits are loading from the API */
const FALLBACK_MODELS = [
  { id: 'gfs-001', label: 'Global Forecast System (GFS)', description: 'GFS weather model' },
  { id: 'ecmwf-002', label: 'European Model (ECMWF)', description: 'ECMWF forecast model' },
  { id: 'wrf-reg-003', label: 'WRF Regional Model', description: 'WRF regional weather model' },
  { id: 'cams-004', label: 'Air Quality (CAMS)', description: 'CAMS air quality model' },
];

type DisplayModel = {
  id: string;
  label: string;
  description: string;
};

type ProverProofResult = {
  proof?: string;
  valid?: boolean;
  durationMs?: number;
} | null;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const TheProverUISample: React.FC = () => {
  const [activeJob, setActiveJob] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);

  // Live API hook — wires /zk/circuits, /zk/stats, /zk/weather-model/generate+verify
  const {
    circuits,
    circuitsLoading,
    stats,
    statsLoading,
    totalProofs,
    proving,
    proofResult,
    proofError,
    proofStage,
    generateWeatherProof,
  } = (useZkProver(undefined) as unknown) as {
    circuits: Array<{ id?: string; description?: string; proof_system?: string }>;
    circuitsLoading: boolean;
    stats: Record<string, number> & {
      throughput_tps: number | null;
      uptime_percent: number | null;
    };
    statsLoading: boolean;
    totalProofs: number;
    proving: boolean;
    proofResult: ProverProofResult;
    proofError: string | null;
    proofStage: 'generating' | 'verifying' | 'done' | null;
    generateWeatherProof: (payload: {
      inputHash: string;
      outputHash: string;
      modelId: number;
      timeSecs: number;
      samples: number[];
    }) => Promise<void>;
  };

  const isComputing = proving || isSimulating;

  // Use live circuits from API; fall back to hardcoded if still loading or no weather circuits
  const displayModels = useMemo<DisplayModel[]>(() => {
    if (circuitsLoading) return FALLBACK_MODELS;
    const weatherCircuits = circuits.filter(
      (c) => c.id?.includes('weather') || c.proof_system === 'Groth16',
    );
    return weatherCircuits.length > 0
      ? weatherCircuits.map((c) => ({
        id: c.id || 'unknown-circuit',
        label: c.description || c.id || 'Unknown circuit',
        description: c.description || c.id || 'Weather circuit',
      }))
      : FALLBACK_MODELS;
  }, [circuits, circuitsLoading]);

  // Steps for the weather model execution
  const steps: VerificationTimelineStep[] = useMemo(() => [
    {
      name: 'issuance', // Reusing existing names to avoid TS errors
      label: 'Data Collection',
      status: currentStep > 0 ? 'completed' : currentStep === 0 ? 'active' : 'pending',
      details: 'Aggregating weather sensor data from L1 mesh nodes.',
      timestamp: currentStep >= 0 ? new Date().toISOString() : undefined,
    },
    {
      name: 'attestation',
      label: 'Model Computation',
      status: currentStep > 1 ? 'completed' : currentStep === 1 ? 'active' : 'pending',
      details: 'Running WRF-v4.5 core on decentralized compute nodes.',
    },
    {
      name: 'validation',
      label: 'ZK Proof Generation',
      status: currentStep > 2 ? 'completed' : currentStep === 2 ? 'active' : 'pending',
      details: 'Generating Groth16 proof for result integrity.',
    },
    {
      name: 'finality',
      label: 'On-chain Verification',
      status: currentStep > 3 ? 'completed' : currentStep === 3 ? 'active' : 'pending',
      details: 'L1 State Machine verifying proof and minting reward.',
      evidence: currentStep > 3
        ? [{ type: 'hash', value: proofResult?.proof ? `0x${proofResult.proof.slice(0, 8)}...` : '0x7a3f...e21d', label: 'Proof Hash' }]
        : undefined,
    },
  ], [currentStep, proofResult]);

  // Sync pipeline step with proofStage from the live API hook
  useEffect(() => {
    if (proofStage === 'generating') {
      setCurrentStep(2); // ZK Proof Generation
      setJobProgress(50);
    } else if (proofStage === 'verifying') {
      setCurrentStep(3); // On-chain Verification
      setJobProgress(80);
    } else if (proofStage === 'done') {
      setCurrentStep(4); // Complete
      setJobProgress(100);
      setIsSimulating(false);
    }
  }, [proofStage]);

  // Simulate early-stage progress (Data Collection → Model Computation) while API proof generates
  useEffect(() => {
    if (!proving) return;

    setJobProgress(0);
    setCurrentStep(0);
    let p = 0;
    setIsSimulating(true);

    const interval = setInterval(() => {
      p += 2;
      if (p >= 48) {
        // Hand off to real proof stage tracking
        clearInterval(interval);
        return;
      }
      setJobProgress(p);
      if (p < 25) setCurrentStep(0);
      else setCurrentStep(1);
    }, 150);

    return () => clearInterval(interval);
  }, [proving]);

  const handleGenerateProof = useCallback(async (modelId: string) => {
    // Derive pseudo-inputs from selected model for demo purposes
    const modelIdNum = displayModels.findIndex((m) => m.id === modelId) + 1 || 1;
    const now = Math.floor(Date.now() / 1000);
    // Use hex strings for hashes (32 bytes each)
    const inputHash = Array.from({ length: 64 }, (_, i) => ((modelIdNum * 7 + i) % 16).toString(16)).join('');
    const outputHash = Array.from({ length: 64 }, (_, i) => ((modelIdNum * 13 + i) % 16).toString(16)).join('');

    await generateWeatherProof({
      inputHash,
      outputHash,
      modelId: modelIdNum,
      timeSecs: now,
      samples: [100, 200, 300, 400, 500],
    });
  }, [displayModels, generateWeatherProof]);

  const handleStartCompute = useCallback((jobId: string) => {
    setActiveJob(jobId);
    setCurrentStep(0);

    // Add to recent events
    const model = displayModels.find((m) => m.id === jobId)?.label || 'Unknown';
    setRecentEvents(prev => [{
      id: Date.now(),
      model,
      status: 'Executing',
      time: 'Just now',
    }, ...prev.slice(0, 4)]);

    handleGenerateProof(jobId);
  }, [displayModels, handleGenerateProof]);

  // Build live terminal log lines from API proof result
  const terminalLines = useMemo(() => {
    const lines: { text: string; color: string }[] = [];

    if (currentStep === 0) lines.push({ text: '> INITIALIZING DATA AGGREGATOR...', color: '#10b981' });
    if (currentStep >= 1) lines.push({ text: '> RUNNING WRF KERNEL...', color: '#10b981' });
    if (proofStage === 'generating' || currentStep >= 2) {
      lines.push({ text: '> GENERATING GROTH16 CONSTRAINTS...', color: '#10b981' });
    }
    if (proofStage === 'verifying' || currentStep >= 3) {
      lines.push({ text: '> COMMITTING PROOF TO L1...', color: '#10b981' });
    }
    if (proofError) {
      lines.push({ text: `> ERROR: ${proofError}`, color: '#ef4444' });
    } else if (proofStage === 'done' && proofResult) {
      const proofHex = proofResult.proof ? `0x${proofResult.proof.slice(0, 32)}...` : '0x???';
      lines.push({ text: '> VERIFICATION SUCCESSFUL.', color: '#10b981' });
      lines.push({ text: `  proof: ${proofHex}`, color: '#64748b' });
      lines.push({ text: `  valid: ${proofResult.valid}`, color: '#64748b' });
      lines.push({ text: `  duration: ${proofResult.durationMs}ms`, color: '#64748b' });
    } else if (!activeJob) {
      lines.push({ text: '> IDLE. Select a model to begin.', color: '#64748b' });
    }

    return lines;
  }, [activeJob, currentStep, proofStage, proofResult, proofError]);

  // Average verify time from proof result; TODO: expose from /zk/stats
  const avgVerifyTime = proofResult?.durationMs ? `${proofResult.durationMs}ms` : '--';

  // Derive live throughput and uptime from /zk/stats when available;
  // fall back to '--' rather than showing fabricated numbers.
  const zkThroughput = statsLoading
    ? '...'
    : stats.throughput_tps != null
      ? `${stats.throughput_tps} TPS`
      : '--';

  const proverUptime = statsLoading
    ? '...'
    : stats.uptime_percent != null
      ? `${stats.uptime_percent}%`
      : '--';

  // Derived metrics using live stats
  const ZK_METRICS = useMemo(() => [
    {
      label: 'ZK Throughput',
      value: zkThroughput,
      icon: SpeedIcon,
      color: colors.brand.primary,
    },
    {
      label: 'Avg Verify Time',
      value: avgVerifyTime,
      icon: VerifiedUserIcon,
      color: colors.success.main,
    },
    {
      label: 'Prover Uptime',
      value: proverUptime,
      icon: StorageIcon,
      color: colors.warning.main,
    },
    {
      label: 'Network Proofs',
      value: statsLoading ? '...' : totalProofs.toLocaleString(),
      icon: TimelineIcon,
      color: '#8B5CF6',
    },
  ], [avgVerifyTime, statsLoading, totalProofs, zkThroughput, proverUptime]);

  return (
    <Box sx={{ p: 4, minHeight: '100vh', bgcolor: colors.bg.primary }}>
      {/* Header Area */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: colors.text.primary, mb: 1 }}>
            The Prover
          </Typography>
          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
            Real-time ZK-verified weather model execution dashboard.
          </Typography>
        </Box>
        <WrfBadge status={isComputing ? 'online' : 'offline'} label={isComputing ? 'SYSTEM ACTIVE' : 'IDLE'} size="md" />
      </Box>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {ZK_METRICS.map((metric) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={metric.label}>
            <WrfStatCard
              label={metric.label}
              value={metric.value}
              icon={metric.icon}
              color={metric.color}
              trendLabel="last 1h"
            />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Left Column: Job Selection & History */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3}>
            {/* Model Selection */}
            <WrfCard title={circuitsLoading ? 'Loading Circuits...' : 'Available Weather Models'}>
              <Stack spacing={1.5}>
                {displayModels.map((model) => (
                  <Box
                    key={model.id}
                    onClick={() => !isComputing && handleStartCompute(model.id)}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: activeJob === model.id ? colors.brand.primary : colors.border.default,
                      bgcolor: activeJob === model.id ? `${colors.brand.primary}08` : 'transparent',
                      cursor: isComputing ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      opacity: isComputing && activeJob !== model.id ? 0.5 : 1,
                      '&:hover': {
                        borderColor: colors.brand.primary,
                        bgcolor: `${colors.brand.primary}08`,
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{model.label}</Typography>
                      <CloudQueueIcon sx={{ color: colors.text.muted, fontSize: 18 }} />
                    </Box>
                    <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                      {model.id} • 12.5 GFLOPS required
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </WrfCard>

            {/* Recent Execution History */}
            <WrfCard title="Recent Executions">
              <Stack spacing={2}>
                {recentEvents.length === 0 ? (
                  <Typography variant="caption" sx={{ color: colors.text.muted, fontStyle: 'italic' }}>
                    No recent executions found.
                  </Typography>
                ) : (
                  recentEvents.map((event) => (
                    <Box key={event.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>{event.model}</Typography>
                        <Typography variant="caption" sx={{ color: colors.text.muted }}>{event.time}</Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={event.status === 'Executing' && isComputing ? 'PROVING' : 'VERIFIED'}
                        color={event.status === 'Executing' && isComputing ? 'primary' : 'success'}
                        sx={{ fontSize: '0.65rem', fontWeight: 800, height: 20 }}
                      />
                    </Box>
                  ))
                )}
              </Stack>
            </WrfCard>
          </Stack>
        </Grid>

        {/* Right Column: Active Execution Visualization */}
        <Grid size={{ xs: 12, md: 8 }}>
          <WrfCard
            title="Live Model Execution"
            headerAction={
              isComputing && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={14} thickness={6} />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: colors.brand.primary }}>
                    {jobProgress}% Complete
                  </Typography>
                </Stack>
              )
            }
          >
            {activeJob ? (
              <Box>
                {/* Progress Visual */}
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {displayModels.find(m => m.id === activeJob)?.label}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                      {currentStep < 4 ? 'Status: Proving Integrity' : 'Status: Fully Verified'}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={jobProgress}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: `${colors.brand.primary}15`,
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                        transition: 'transform 0.4s linear',
                      },
                    }}
                  />
                </Box>

                <Grid container spacing={4}>
                  {/* Timeline */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <WrfVerificationTimeline
                      steps={steps}
                      title="Verification Pipeline"
                      confidence={jobProgress > 90 ? 98 : jobProgress > 50 ? 85 : 42}
                    />
                  </Grid>

                  {/* Circuit/Logic Visual (Abstracted) */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box
                      sx={{
                        height: '100%',
                        minHeight: 280,
                        bgcolor: '#0f172a', // Dark theme for terminal/circuit feel
                        borderRadius: 2,
                        p: 2,
                        position: 'relative',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <Typography variant="caption" sx={{ color: '#64748b', fontFamily: 'monospace', mb: 2 }}>
                        // ZK-PROVER CORE 4.0 //
                      </Typography>

                      {/* Abstract Visual: Neural/Node connection feel */}
                      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Box sx={{ position: 'relative' }}>
                          <PsychologyIcon sx={{ fontSize: 48, color: currentStep > 1 ? colors.brand.primary : '#334155' }} />
                          {isComputing && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: -10,
                                left: -10,
                                right: -10,
                                bottom: -10,
                                borderRadius: '50%',
                                border: '2px solid',
                                borderColor: colors.brand.primary,
                                animation: 'pulse 2s infinite ease-in-out',
                                '@keyframes pulse': {
                                  '0%': { transform: 'scale(0.8)', opacity: 0.5 },
                                  '100%': { transform: 'scale(1.3)', opacity: 0 },
                                },
                              }}
                            />
                          )}
                        </Box>
                      </Box>

                      {/* Live terminal log — shows real proof hex, valid flag, and actual duration */}
                      <Box sx={{ mt: 'auto', p: 1, bgcolor: 'rgba(0,0,0,0.3)', borderRadius: 1 }}>
                        {terminalLines.map((line, idx) => (
                          <Typography
                            key={idx}
                            variant="caption"
                            sx={{
                              color: line.color,
                              fontFamily: 'monospace',
                              display: 'block',
                              fontSize: '0.7rem',
                            }}
                          >
                            {line.text}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  </Grid>
                </Grid>

                {currentStep === 4 && (
                  <Box sx={{ mt: 4, p: 2, bgcolor: `${colors.success.main}12`, borderRadius: 2, border: '1px solid', borderColor: `${colors.success.main}40`, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CheckCircleIcon color="success" />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {proofResult?.valid === false ? 'Proof Invalid' : 'Reward Distributed'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                        {proofResult?.valid === false
                          ? 'Proof verification returned invalid — no reward minted.'
                          : `Verified in ${proofResult?.durationMs ?? '--'}ms. 12.4 WRF credited to compute provider.`}
                      </Typography>
                    </Box>
                    <WrfButton size="sm" variant="secondary" sx={{ ml: 'auto' }}>View Transaction</WrfButton>
                  </Box>
                )}

                {proofError && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: '#ef444412', borderRadius: 2, border: '1px solid #ef444440' }}>
                    <Typography variant="caption" sx={{ color: '#ef4444', fontFamily: 'monospace' }}>
                      Error: {proofError}
                    </Typography>
                  </Box>
                )}
              </Box>
            ) : (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <CloudQueueIcon sx={{ fontSize: 64, color: colors.text.muted, mb: 2, opacity: 0.2 }} />
                <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                  Select a weather model from the list to start real-time execution.
                </Typography>
              </Box>
            )}
          </WrfCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export const TheProverUI: React.FC<React.ComponentProps<typeof TheProverUISample>> = (props) => (
  <DemoSurfaceGate
    testId="zk-prover"
    title="Proof-generation progress is not live on this testnet"
    description="This preview contains illustrative data or simulated actions, not verified testnet results."
  >
    <TheProverUISample {...props} />
  </DemoSurfaceGate>
);

export default TheProverUI;
