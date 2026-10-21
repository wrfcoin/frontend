import DemoSurfaceGate from '../common/DemoSurfaceGate';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepConnector, { stepConnectorClasses } from '@mui/material/StepConnector';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import { styled } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SpeedIcon from '@mui/icons-material/Speed';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import DataObjectIcon from '@mui/icons-material/DataObject';
import DescriptionIcon from '@mui/icons-material/Description';
import { colors, spacing, borderRadius, shadows } from '../ui/tokens';
import WrfCard from '../ui/WrfCard';
import WrfStatCard from '../ui/WrfStatCard';
import WrfButton from '../ui/WrfButton';
import WrfBadge from '../ui/WrfBadge';

// MOCK_RECENT_PROOFS removed — fetched from /api/zk/proofs/recent

const SAMPLE_PROOF_JSON = `{
  "pi_a": ["0x2a3f...", "0x1b8c...", "0x01"],
  "pi_b": [["0x0e7d...", "0x3a91..."], ["0x12c4...", "0x5f6b..."], ["0x01", "0x00"]],
  "pi_c": ["0x4d2e...", "0x8c7a...", "0x01"],
  "protocol": "groth16",
  "curve": "bn128",
  "publicSignals": [
    "2873498712349871234",
    "19827349812734981273",
    "8712349871234987123"
  ]
}`;

const VERIFICATION_STEPS = [
  'Parsing proof',
  'Verifying constraints',
  'Checking witness',
  'Validating public inputs',
  'Verified!',
];

// ---- Circuit SVG Visualization ----

interface CircuitGate {
  id: string;
  type: 'AND' | 'OR' | 'XOR' | 'INPUT' | 'OUTPUT';
  x: number;
  y: number;
}

interface CircuitEdge {
  from: string;
  to: string;
}

const CIRCUIT_GATES: CircuitGate[] = [
  { id: 'in1', type: 'INPUT', x: 40, y: 40 },
  { id: 'in2', type: 'INPUT', x: 40, y: 120 },
  { id: 'in3', type: 'INPUT', x: 40, y: 200 },
  { id: 'and1', type: 'AND', x: 180, y: 80 },
  { id: 'xor1', type: 'XOR', x: 180, y: 180 },
  { id: 'or1', type: 'OR', x: 320, y: 120 },
  { id: 'and2', type: 'AND', x: 460, y: 120 },
  { id: 'out1', type: 'OUTPUT', x: 580, y: 120 },
];

const CIRCUIT_EDGES: CircuitEdge[] = [
  { from: 'in1', to: 'and1' },
  { from: 'in2', to: 'and1' },
  { from: 'in2', to: 'xor1' },
  { from: 'in3', to: 'xor1' },
  { from: 'and1', to: 'or1' },
  { from: 'xor1', to: 'or1' },
  { from: 'or1', to: 'and2' },
  { from: 'in1', to: 'and2' },
  { from: 'and2', to: 'out1' },
];

const ACTIVE_PATH = ['in1', 'and1', 'or1', 'and2', 'out1'];

const gateColors: Record<string, string> = {
  AND: '#3B82F6',
  OR: '#10B981',
  XOR: '#F59E0B',
  INPUT: '#8B5CF6',
  OUTPUT: '#EF4444',
};

const CircuitVisualization: React.FC<{ activeStep: number }> = ({ activeStep }) => {
  const gateMap = useMemo(() => {
    const map: Record<string, CircuitGate> = {};
    CIRCUIT_GATES.forEach((g) => { map[g.id] = g; });
    return map;
  }, []);

  const progressRatio = activeStep / (VERIFICATION_STEPS.length - 1);
  const activeGateCount = Math.ceil(progressRatio * ACTIVE_PATH.length);
  const litGates = new Set(ACTIVE_PATH.slice(0, activeGateCount));

  const litEdges = new Set<string>();
  for (let i = 0; i < activeGateCount - 1; i++) {
    litEdges.add(`${ACTIVE_PATH[i]}->${ACTIVE_PATH[i + 1]}`);
  }

  return (
    <svg
      viewBox="0 0 640 240"
      width="100%"
      height="auto"
      style={{ display: 'block', maxHeight: 220 }}
    >
      <defs>
        <filter id="glow-filter">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Edges */}
      {CIRCUIT_EDGES.map((edge) => {
        const from = gateMap[edge.from];
        const to = gateMap[edge.to];
        if (!from || !to) return null;
        const edgeKey = `${edge.from}->${edge.to}`;
        const isLit = litEdges.has(edgeKey);
        return (
          <line
            key={edgeKey}
            x1={from.x + 24}
            y1={from.y + 16}
            x2={to.x}
            y2={to.y + 16}
            stroke={isLit ? colors.brand.primary : colors.border.default}
            strokeWidth={isLit ? 2.5 : 1.5}
            strokeOpacity={isLit ? 1 : 0.4}
            filter={isLit ? 'url(#glow-filter)' : undefined}
          />
        );
      })}

      {/* Gates */}
      {CIRCUIT_GATES.map((gate) => {
        const isLit = litGates.has(gate.id);
        const fill = gateColors[gate.type] || colors.text.muted;
        const opacity = isLit ? 1 : 0.35;
        const radius = gate.type === 'INPUT' || gate.type === 'OUTPUT' ? 14 : 18;

        return (
          <g key={gate.id}>
            {/* Gate body */}
            <rect
              x={gate.x}
              y={gate.y}
              width={radius * 2 + 12}
              height={32}
              rx={gate.type === 'INPUT' || gate.type === 'OUTPUT' ? 16 : 6}
              fill={fill}
              fillOpacity={isLit ? 0.2 : 0.08}
              stroke={fill}
              strokeWidth={isLit ? 2 : 1}
              strokeOpacity={opacity}
              filter={isLit ? 'url(#glow-filter)' : undefined}
            />
            {/* Gate label */}
            <text
              x={gate.x + radius + 6}
              y={gate.y + 20}
              textAnchor="middle"
              fill={fill}
              fillOpacity={opacity}
              fontSize="11"
              fontWeight="600"
              fontFamily="monospace"
            >
              {gate.type}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ---- Custom Stepper Connector ----

const ZkConnector = styled(StepConnector)(() => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 18,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      background: `linear-gradient(90deg, ${colors.brand.primary}, ${colors.success.main})`,
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundColor: colors.success.main,
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: colors.border.default,
    borderRadius: 1,
  },
}));

const ZkStepIcon: React.FC<{ active: boolean; completed: boolean; icon: React.ReactNode }> = ({
  active,
  completed,
  icon,
}) => {
  const stepIcons: Record<number, React.ReactElement> = {
    1: <DataObjectIcon sx={{ fontSize: 18 }} />,
    2: <AccountTreeIcon sx={{ fontSize: 18 }} />,
    3: <DescriptionIcon sx={{ fontSize: 18 }} />,
    4: <SpeedIcon sx={{ fontSize: 18 }} />,
    5: <CheckCircleIcon sx={{ fontSize: 18 }} />,
  };

  const iconIndex = typeof icon === 'number' ? icon : Number(icon);
  const bg = completed
    ? colors.success.main
    : active
      ? colors.brand.primary
      : colors.bg.tertiary;

  return (
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        backgroundColor: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: completed || active ? '#fff' : colors.text.muted,
        boxShadow: active ? shadows.glow(colors.brand.primary) : 'none',
        transition: 'all 0.3s ease',
      }}
    >
      {stepIcons[iconIndex] || icon}
    </Box>
  );
};

type RecentProof = {
  id: string;
  type: 'Groth16' | 'PLONK' | 'STARK';
  prover: string;
  timestamp: string;
  blockNumber: number;
  txHash: string;
  status: 'verified' | 'failed' | 'pending';
  verificationTime: number;
  gasCost: number;
  publicInputs: { label: string; value: string }[];
};

// ---- Main Component ----

const ProofVerificationUISample: React.FC = () => {
  const [proofInput, setProofInput] = useState<string>('');
  const [recentProofs, setRecentProofs] = useState<RecentProof[]>([]);
  const [proofsLoading, setProofsLoading] = useState(true);
  const [selectedProofId, setSelectedProofId] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<
    'verified' | 'failed' | 'unavailable' | null
  >(null);

  useEffect(() => {
    const fetchRecentProofs = async () => {
      setProofsLoading(true);
      try {
        // TODO: confirm endpoint path with backend team
        const res = await fetch('/api/zk/proofs/recent?limit=10', { headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(`Proofs fetch failed: ${res.status}`);
        const data = await res.json();
        const rows = Array.isArray(data) ? data : (data.data ?? data.proofs ?? []);
        const mapped: RecentProof[] = rows.map((p: any) => ({
          id: String(p.id ?? p.proofId ?? p.proof_id ?? ''),
          type: p.type ?? p.proofType ?? 'Groth16',
          prover: p.prover ?? p.proverAddress ?? '',
          timestamp: p.timestamp ?? p.createdAt ?? '',
          blockNumber: Number(p.blockNumber ?? p.block_number ?? 0),
          txHash: p.txHash ?? p.transaction_hash ?? '',
          status: p.status ?? 'pending',
          verificationTime: Number(p.verificationTime ?? p.verification_time ?? 0),
          gasCost: Number(p.gasCost ?? p.gas_cost ?? p.gasUsed ?? p.gas_used ?? 0),
          publicInputs: Array.isArray(p.publicInputs ?? p.public_inputs) ? (p.publicInputs ?? p.public_inputs) : [],
        }));
        setRecentProofs(mapped);
        if (mapped.length > 0) setSelectedProofId(mapped[0].id);
      } catch {
        // Non-critical: recent proofs panel stays empty on error
      } finally {
        setProofsLoading(false);
      }
    };
    fetchRecentProofs();
  }, []);

  const selectedProof = useMemo(
    () => recentProofs.find((p) => p.id === selectedProofId) ?? null,
    [recentProofs, selectedProofId],
  );
  const displayProof = selectedProof ?? recentProofs[0] ?? null;

  // Animate steps while verifying, then apply live result
  useEffect(() => {
    if (!isVerifying) return;

    let step = 0;
    setActiveStep(0);

    const interval = setInterval(() => {
      step += 1;
      if (step >= VERIFICATION_STEPS.length - 1) {
        clearInterval(interval);
        // Only a successful verifier result may activate the final step.
        setActiveStep(VERIFICATION_STEPS.length - 2);
      } else {
        setActiveStep(step);
      }
    }, 900);

    return () => clearInterval(interval);
  }, [isVerifying]);

  const handleStartVerification = useCallback(async () => {
    if (isVerifying) return;
    setIsVerifying(true);
    setVerificationResult(null);

    // Attempt live verification against /zk/range-proof/verify
    // A failed read is not a proof verdict.
    try {
      const proofData = proofInput.trim()
        ? JSON.parse(proofInput)
        : {
          proof: displayProof?.txHash || '0x0',
          commitment: displayProof?.publicInputs?.[0]?.value || '0x0',
          lower_bound: 0,
          upper_bound: 1_000_000,
        };

      const res = await fetch('/api/zk/range-proof/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proofData),
      });

      if (res.ok) {
        const { valid } = await res.json();
        const result = typeof valid === 'boolean' ? (valid ? 'verified' : 'failed') : 'unavailable';
        setVerificationResult(result);
        setActiveStep(result === 'verified' ? VERIFICATION_STEPS.length - 1 : -1);
      } else {
        // The verifier did not evaluate this proof.
        setVerificationResult('unavailable');
        setActiveStep(-1);
      }
    } catch {
      // Invalid input or a failed transport produces no verdict.
      setVerificationResult('unavailable');
      setActiveStep(-1);
    } finally {
      setIsVerifying(false);
    }
  }, [isVerifying, proofInput, displayProof]);

  const handleSelectRecentProof = useCallback((proofId: string) => {
    setSelectedProofId(proofId);
    setActiveStep(-1);
    setVerificationResult(null);
    setIsVerifying(false);
  }, []);

  const handleLoadSample = useCallback(() => {
    setProofInput(SAMPLE_PROOF_JSON);
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: colors.bg.primary,
        color: colors.text.primary,
        p: 3,
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          sx={{ fontSize: '2rem', fontWeight: 700, color: colors.text.primary, mb: 0.5 }}
        >
          ZK Proof Verification
        </Typography>
        <Typography sx={{ fontSize: '0.875rem', color: colors.text.secondary }}>
          Verify zero-knowledge proofs on-chain with interactive circuit visualization
        </Typography>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Proofs Verified (24h)"
            value="1,247"
            trend={12.4}
            trendLabel="vs yesterday"
            icon={VerifiedUserIcon}
            color={colors.success.main}
            sparklineData={[980, 1020, 1100, 1050, 1180, 1210, 1247]}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Avg Verification Time"
            value="128ms"
            trend={-5.2}
            trendLabel="improvement"
            icon={AccessTimeIcon}
            color={colors.brand.primary}
            sparklineData={[145, 140, 138, 135, 132, 130, 128]}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Success Rate"
            value="99.3%"
            trend={0.4}
            trendLabel="vs last week"
            icon={TrendingUpIcon}
            color={colors.warning.main}
            sparklineData={[98.7, 98.9, 99.0, 99.1, 99.0, 99.2, 99.3]}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Active Circuits"
            value="34"
            trend={3}
            trendLabel="new this week"
            icon={AccountTreeIcon}
            color="#8B5CF6"
            sparklineData={[28, 29, 30, 31, 31, 33, 34]}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Left Column: Proof Input & Recent Proofs */}
        <Grid size={{ xs: 12, md: 5 }}>
          {/* Proof Input Panel */}
          <WrfCard title="Proof Input" sx={{ mb: 3 }}>
            <TextField
              multiline
              minRows={6}
              maxRows={10}
              fullWidth
              placeholder="Paste proof JSON here..."
              value={proofInput}
              onChange={(e) => setProofInput(e.target.value)}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: colors.text.primary,
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  backgroundColor: colors.bg.primary,
                  borderRadius: `${borderRadius.md}px`,
                  '& fieldset': { borderColor: colors.border.default },
                  '&:hover fieldset': { borderColor: colors.border.light },
                  '&.Mui-focused fieldset': { borderColor: colors.brand.primary },
                },
                '& textarea::placeholder': { color: colors.text.muted, opacity: 1 },
              }}
            />
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <WrfButton
                variant="primary"
                size="md"
                onClick={handleStartVerification}
                loading={isVerifying}
                disabled={isVerifying}
              >
                Verify Proof
              </WrfButton>
              <WrfButton variant="secondary" size="md" onClick={handleLoadSample}>
                Load Sample
              </WrfButton>
            </Box>
          </WrfCard>

          {/* Recent Proofs */}
          <WrfCard title="Recent Proofs">
            {proofsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <Box component="span" sx={{ display: 'inline-block', width: 24, height: 24, borderRadius: '50%', border: `2px solid ${colors.brand.primary}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', '@keyframes spin': { to: { transform: 'rotate(360deg)' } } }} />
              </Box>
            ) : recentProofs.length === 0 ? (
              <Typography sx={{ color: colors.text.muted, fontSize: '0.85rem', textAlign: 'center', py: 2 }}>No recent proofs</Typography>
            ) : (
              <List disablePadding>
              {recentProofs.map((proof, idx) => (
                  <ListItem
                    key={proof.id}
                    onClick={() => handleSelectRecentProof(proof.id)}
                    sx={{
                      cursor: 'pointer',
                      borderRadius: `${borderRadius.md}px`,
                      mb: idx < recentProofs.length - 1 ? 0.5 : 0,
                      px: 1.5,
                      py: 1,
                      backgroundColor:
                      selectedProofId === proof.id
                        ? `${colors.brand.primary}12`
                        : 'transparent',
                      border:
                      selectedProofId === proof.id
                        ? `1px solid ${colors.brand.primary}40`
                        : '1px solid transparent',
                      '&:hover': {
                        backgroundColor:
                        selectedProofId === proof.id
                          ? `${colors.brand.primary}12`
                          : `${colors.bg.tertiary}60`,
                      },
                      transition: 'all 0.15s ease',
                    }}
                  >
                  <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                            sx={{
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              color: colors.text.primary,
                              fontFamily: 'monospace',
                            }}
                          >
                          {proof.id}
                        </Typography>
                        <Chip
                            label={proof.type}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.625rem',
                              fontWeight: 600,
                              bgcolor:
                              proof.type === 'Groth16'
                                ? `${colors.brand.primary}20`
                                : proof.type === 'PLONK'
                                  ? `${colors.success.main}20`
                                  : `${colors.warning.main}20`,
                              color:
                              proof.type === 'Groth16'
                                ? colors.brand.primary
                                : proof.type === 'PLONK'
                                  ? colors.success.main
                                  : colors.warning.main,
                            }}
                          />
                        <WrfBadge
                            status={proof.status === 'verified' ? 'online' : 'offline'}
                            label={proof.status === 'verified' ? 'Verified' : 'Failed'}
                            size="sm"
                          />
                      </Box>
                      }
                      secondary={
                        <Typography
                          sx={{
                            fontSize: '0.75rem',
                            color: colors.text.muted,
                            mt: 0.25,
                          }}
                        >
                        {proof.prover} -- Block #{proof.blockNumber.toLocaleString()}
                      </Typography>
                      }
                    />
                </ListItem>
                ))}
            </List>
            )}
          </WrfCard>
        </Grid>

        {/* Right Column: Verification & Circuit */}
        <Grid size={{ xs: 12, md: 7 }}>
          {/* Verification Stepper */}
          <WrfCard title="Verification Progress" sx={{ mb: 3 }}>
            <Box sx={{ width: '100%', pt: 1, pb: 2 }}>
              <Stepper
                alternativeLabel
                activeStep={activeStep}
                connector={<ZkConnector />}
              >
                {VERIFICATION_STEPS.map((label, index) => (
                  <Step key={label} completed={activeStep > index}>
                    <StepLabel
                      StepIconComponent={(props) => (
                        <ZkStepIcon
                          active={props.active || false}
                          completed={props.completed || false}
                          icon={index + 1}
                        />
                      )}
                      sx={{
                        '& .MuiStepLabel-label': {
                          color:
                            activeStep >= index
                              ? colors.text.primary
                              : colors.text.muted,
                          fontSize: '0.7rem',
                          fontWeight: activeStep === index ? 600 : 400,
                          mt: 1,
                        },
                      }}
                    >
                      {label}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>

            {/* Animated progress bar */}
            <Box
              sx={{
                height: 3,
                bgcolor: colors.bg.tertiary,
                borderRadius: 2,
                overflow: 'hidden',
                mb: 2,
              }}
            >
              <Box
                sx={{
                  height: '100%',
                  width:
                    activeStep >= 0
                      ? `${((activeStep + 1) / VERIFICATION_STEPS.length) * 100}%`
                      : '0%',
                  background: `linear-gradient(90deg, ${colors.brand.primary}, ${colors.success.main})`,
                  borderRadius: 2,
                  transition: 'width 0.5s ease',
                }}
              />
            </Box>
          </WrfCard>

          {/* Circuit Visualization */}
          <WrfCard title="Circuit Visualization" sx={{ mb: 3 }}>
            <Typography sx={{ fontSize: '0.75rem', color: colors.text.muted, mb: 1.5 }}>
              Simplified ZK circuit graph -- gates light up as verification progresses
            </Typography>
            <Box
              sx={{
                bgcolor: colors.bg.primary,
                borderRadius: `${borderRadius.md}px`,
                border: `1px solid ${colors.border.default}`,
                p: 2,
              }}
            >
              <CircuitVisualization activeStep={activeStep} />
            </Box>
            {/* Gate Legend */}
            <Box sx={{ display: 'flex', gap: 2, mt: 1.5, flexWrap: 'wrap' }}>
              {Object.entries(gateColors).map(([gate, color]) => (
                <Box key={gate} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: 1,
                      bgcolor: color,
                      opacity: 0.7,
                    }}
                  />
                  <Typography sx={{ fontSize: '0.675rem', color: colors.text.muted }}>
                    {gate}
                  </Typography>
                </Box>
              ))}
            </Box>
          </WrfCard>

          {/* Verification Result */}
          <WrfCard
            title="Verification Result"
            sx={{
              mb: 3,
              borderColor:
                verificationResult === 'verified'
                  ? colors.success.main
                  : verificationResult === 'failed'
                    ? colors.error.main
                    : colors.border.default,
              transition: 'border-color 0.3s ease',
            }}
          >
            {verificationResult ? (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                {verificationResult === 'verified' ? (
                  <CheckCircleIcon
                    sx={{ fontSize: 64, color: colors.success.main, mb: 1 }}
                  />
                ) : (
                  <CancelIcon
                    sx={{ fontSize: 64, color: colors.error.main, mb: 1 }}
                  />
                )}
                <Typography
                  sx={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color:
                      verificationResult === 'verified'
                        ? colors.success.main
                        : colors.error.main,
                    mb: 2,
                  }}
                >
                  {verificationResult === 'verified'
                    ? 'Proof Verified Successfully'
                    : verificationResult === 'failed'
                      ? 'Proof Verification Failed'
                      : 'Proof verification is unavailable'}
                </Typography>

                {verificationResult !== 'unavailable' && <Grid container spacing={2} sx={{ maxWidth: 500, mx: 'auto' }}>
                  <Grid size={4}>
                    <Typography
                      sx={{ fontSize: '0.7rem', color: colors.text.muted, mb: 0.5 }}
                    >
                      Proof Type
                    </Typography>
                    <Chip
                      label={displayProof?.type ?? 'Unknown'}
                      size="small"
                      sx={{
                        bgcolor: `${colors.brand.primary}20`,
                        color: colors.brand.primary,
                        fontWeight: 600,
                        fontSize: '0.75rem',
                      }}
                    />
                  </Grid>
                  <Grid size={4}>
                    <Typography
                      sx={{ fontSize: '0.7rem', color: colors.text.muted, mb: 0.5 }}
                    >
                      Verification Time
                    </Typography>
                    <Typography
                      sx={{ fontSize: '1.1rem', fontWeight: 600, color: colors.text.primary }}
                    >
                      {displayProof?.verificationTime ?? 0}ms
                    </Typography>
                  </Grid>
                  <Grid size={4}>
                    <Typography
                      sx={{ fontSize: '0.7rem', color: colors.text.muted, mb: 0.5 }}
                    >
                      Gas Cost
                    </Typography>
                    <Typography
                      sx={{ fontSize: '1.1rem', fontWeight: 600, color: colors.text.primary }}
                    >
                      {(displayProof?.gasCost ?? 0).toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography sx={{ fontSize: '0.875rem', color: colors.text.muted }}>
                  {isVerifying
                    ? 'Verification in progress...'
                    : 'Submit a proof or select a recent proof to begin verification'}
                </Typography>
              </Box>
            )}
          </WrfCard>

          {/* Public Inputs & Metadata */}
          <Grid container spacing={3}>
            {/* Public Inputs */}
            <Grid size={{ xs: 12, md: 6 }}>
              <WrfCard title="Public Inputs">
                {(displayProof?.publicInputs ?? []).map((input, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 1,
                      borderBottom:
                        idx < (displayProof?.publicInputs.length ?? 0) - 1
                          ? `1px solid ${colors.border.default}`
                          : 'none',
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '0.75rem',
                        color: colors.text.secondary,
                        fontWeight: 500,
                      }}
                    >
                      {input.label}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.75rem',
                        color: colors.brand.primary,
                        fontFamily: 'monospace',
                        maxWidth: 140,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {input.value}
                    </Typography>
                  </Box>
                ))}
              </WrfCard>
            </Grid>

            {/* Proof Metadata */}
            <Grid size={{ xs: 12, md: 6 }}>
              <WrfCard title="Proof Metadata">
                {[
                  { label: 'Prover', value: displayProof?.prover ?? '' },
                  {
                    label: 'Timestamp',
                    value: displayProof?.timestamp ? new Date(displayProof.timestamp).toLocaleString() : '—',
                  },
                  {
                    label: 'Block Number',
                    value: `#${(displayProof?.blockNumber ?? 0).toLocaleString()}`,
                  },
                  { label: 'Transaction Hash', value: displayProof?.txHash ?? '' },
                ].map((item, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 1,
                      borderBottom:
                        idx < 3
                          ? `1px solid ${colors.border.default}`
                          : 'none',
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '0.75rem',
                        color: colors.text.secondary,
                        fontWeight: 500,
                      }}
                    >
                      {item.label}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.75rem',
                        color: colors.text.primary,
                        fontFamily: 'monospace',
                        maxWidth: 150,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.value}
                    </Typography>
                  </Box>
                ))}
              </WrfCard>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default function ProofVerificationUI() {
  return <DemoSurfaceGate
    testId="zk-proof-verification"
    title="Proof verification is unavailable"
    description="The testnet API does not serve this verifier or proof history. This preview is illustrative and cannot establish on-chain acceptance."
  ><ProofVerificationUISample /></DemoSurfaceGate>;
}
