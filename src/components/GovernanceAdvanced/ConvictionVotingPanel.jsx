import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import DemoSurfaceGate from '../common/DemoSurfaceGate';
import {
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  Divider,
  TextField,
  InputAdornment,
  Alert,
  Tabs,
  Tab,
  Tooltip,
} from '@mui/material';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import InfoIcon from '@mui/icons-material/Info';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TimelineIcon from '@mui/icons-material/Timeline';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLORS = {
  bg: '#0F172A',
  card: '#1E293B',
  cardHover: '#263548',
  border: '#334155',
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  abstain: '#64748B',
  purple: '#8B5CF6',
  cyan: '#06B6D4',
};

const USER_BALANCE = 5000;

const COMPLETED_PROPOSALS = [
  { id: 'CV-098', title: 'Quantum-Resistant Wallet Integration', funded: 95000, passedDay: 21, totalStakers: 118 },
  { id: 'CV-097', title: 'Weather Alert SMS Notification System', funded: 42000, passedDay: 14, totalStakers: 76 },
  { id: 'CV-096', title: 'Multi-Chain Governance Aggregator', funded: 160000, passedDay: 30, totalStakers: 201 },
];

// ---------------------------------------------------------------------------
// Conviction Accumulation Line Chart (SVG)
// ---------------------------------------------------------------------------

const ConvictionChart = ({ history, threshold, width = 320, height = 180 }) => {
  const padding = { top: 20, right: 20, bottom: 30, left: 45 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxDay = Math.max(...history.map((p) => p.day), 1);
  const maxVal = Math.max(threshold * 1.15, ...history.map((p) => p.value));

  const scaleX = (d) => padding.left + (d / maxDay) * chartW;
  const scaleY = (v) => padding.top + chartH - (v / maxVal) * chartH;

  const pathD = history.map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.day)} ${scaleY(p.value)}`).join(' ');

  // Projected path (dashed)
  const lastPoint = history[history.length - 1];
  const rate = lastPoint.day > 0 ? lastPoint.value / lastPoint.day : 0;
  const projectedDays = rate > 0 ? Math.ceil(threshold / rate) : maxDay + 10;
  const projectedEnd = Math.min(projectedDays, maxDay + 15);

  const projectedPath = `M ${scaleX(lastPoint.day)} ${scaleY(lastPoint.value)} L ${scaleX(projectedEnd)} ${scaleY(Math.min(rate * projectedEnd, maxVal))}`;

  const thresholdY = scaleY(threshold);

  // Y axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(maxVal * f));

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Grid */}
      {yTicks.map((val) => (
        <g key={val}>
          <line x1={padding.left} y1={scaleY(val)} x2={width - padding.right} y2={scaleY(val)} stroke={COLORS.border} strokeWidth={0.5} strokeDasharray="3 3" />
          <text x={padding.left - 5} y={scaleY(val) + 3} fill={COLORS.textSecondary} fontSize={9} textAnchor="end">
            {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
          </text>
        </g>
      ))}

      {/* Threshold line */}
      <line x1={padding.left} y1={thresholdY} x2={width - padding.right} y2={thresholdY} stroke={COLORS.success} strokeWidth={1.5} strokeDasharray="6 3" />
      <text x={width - padding.right + 2} y={thresholdY - 4} fill={COLORS.success} fontSize={9}>
        Threshold
      </text>

      {/* Projected path */}
      <path d={projectedPath} fill="none" stroke={COLORS.primary} strokeWidth={1.5} strokeDasharray="4 4" opacity={0.4} />

      {/* Conviction line */}
      <path d={pathD} fill="none" stroke={COLORS.primary} strokeWidth={2.5} />

      {/* Fill under curve */}
      <path
        d={`${pathD} L ${scaleX(lastPoint.day)} ${scaleY(0)} L ${scaleX(0)} ${scaleY(0)} Z`}
        fill={COLORS.primary}
        opacity={0.08}
      />

      {/* Data points */}
      {history.map((p) => (
        <circle key={p.day} cx={scaleX(p.day)} cy={scaleY(p.value)} r={2.5} fill={COLORS.primary} />
      ))}

      {/* Last point highlight */}
      <circle cx={scaleX(lastPoint.day)} cy={scaleY(lastPoint.value)} r={5} fill={COLORS.primary} opacity={0.3} />
      <circle cx={scaleX(lastPoint.day)} cy={scaleY(lastPoint.value)} r={3} fill={COLORS.primary} />

      {/* X axis */}
      <text x={width / 2} y={height - 4} fill={COLORS.textSecondary} fontSize={9} textAnchor="middle">Days</text>
      {[0, Math.round(maxDay / 2), maxDay].map((d) => (
        <text key={d} x={scaleX(d)} y={height - padding.bottom + 14} fill={COLORS.textSecondary} fontSize={9} textAnchor="middle">
          {d}
        </text>
      ))}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Threshold Progress Bar
// ---------------------------------------------------------------------------

const ThresholdBar = ({ current, threshold }) => {
  const pct = Math.min((current / threshold) * 100, 100);
  const passed = current >= threshold;

  return (
    <Box sx={{ mb: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
          Conviction Progress
        </Typography>
        <Typography variant="caption" sx={{ color: passed ? COLORS.success : COLORS.primary, fontWeight: 600 }}>
          {pct.toFixed(1)}%
        </Typography>
      </Box>
      <Box sx={{ position: 'relative', height: 12, bgcolor: COLORS.border, borderRadius: 6 }}>
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: `${pct}%`,
            bgcolor: passed ? COLORS.success : COLORS.primary,
            borderRadius: 6,
            transition: 'width 0.5s',
          }}
        />
        {/* Threshold marker */}
        <Box
          sx={{
            position: 'absolute',
            top: -2,
            left: '100%',
            transform: 'translateX(-50%)',
            width: 2,
            height: 16,
            bgcolor: COLORS.success,
          }}
        />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.3 }}>
        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontSize: 10 }}>
          {current.toLocaleString()}
        </Typography>
        <Typography variant="caption" sx={{ color: COLORS.success, fontSize: 10 }}>
          {threshold.toLocaleString()}
        </Typography>
      </Box>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const ConvictionVotingPanelSample = () => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState(0);
  const [stakeAmounts, setStakeAmounts] = useState({});
  const [stakes, setStakes] = useState({});

  useEffect(() => {
    apiClient.get('/governance/conviction-proposals')
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.proposals ?? []);
        setProposals(list);
        const initial = {};
        list.forEach((p) => { initial[p.id] = p.yourStake ?? 0; });
        setStakes(initial);
      })
      .catch(() => setProposals([]))
      .finally(() => setLoading(false));
  }, []);

  const proposal = proposals[selectedProposal];

  const availableBalance = useMemo(() => {
    const totalStaked = Object.values(stakes).reduce((sum, v) => sum + v, 0);
    return USER_BALANCE - totalStaked;
  }, [stakes]);

  const handleInputChange = useCallback((proposalId, value) => {
    setStakeAmounts((prev) => ({ ...prev, [proposalId]: value }));
  }, []);

  if (loading) return <Box sx={{ minHeight: '100vh', bgcolor: COLORS.bg, p: 3 }}><Typography sx={{ color: COLORS.textSecondary }}>Loading proposals…</Typography></Box>;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: COLORS.bg, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <TimelineIcon sx={{ color: COLORS.purple, fontSize: 32 }} />
        <Box>
          <Typography variant="h5" sx={{ color: COLORS.text, fontWeight: 700 }}>
            Conviction Voting
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
            Stake tokens on proposals - conviction grows over time the longer you keep your stake
          </Typography>
        </Box>
      </Box>

      {/* Info Card */}
      <Paper sx={{ bgcolor: 'rgba(139,92,246,0.08)', border: `1px solid ${COLORS.purple}33`, borderRadius: 3, p: 2.5, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <InfoIcon sx={{ color: COLORS.purple, mt: 0.3 }} />
          <Box>
            <Typography variant="subtitle1" sx={{ color: COLORS.text, fontWeight: 600, mb: 0.5 }}>
              How Conviction Voting Works
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary, lineHeight: 1.7 }}>
              Stake your WRF tokens on proposals you support. Your <strong style={{ color: COLORS.purple }}>conviction</strong> (voting weight) grows
              continuously the longer your stake remains. This rewards long-term commitment and prevents last-minute vote manipulation.
              When the accumulated conviction crosses the <strong style={{ color: COLORS.success }}>threshold</strong>, the proposal passes and
              receives funding. You can unstake at any time, but your conviction resets.
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Balance Card */}
      <Paper sx={{ bgcolor: COLORS.card, borderRadius: 3, p: 2.5, mb: 3, border: `1px solid ${COLORS.border}`, display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AccountBalanceWalletIcon sx={{ color: COLORS.primary }} />
          <Box>
            <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>Total Balance</Typography>
            <Typography variant="h6" sx={{ color: COLORS.text, fontWeight: 700, lineHeight: 1.2 }}>
              {USER_BALANCE.toLocaleString()} WRF
            </Typography>
          </Box>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>Staked</Typography>
          <Typography variant="h6" sx={{ color: COLORS.warning, fontWeight: 700, lineHeight: 1.2 }}>
            {Object.values(stakes).reduce((s, v) => s + v, 0).toLocaleString()} WRF
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>Available</Typography>
          <Typography variant="h6" sx={{ color: COLORS.success, fontWeight: 700, lineHeight: 1.2 }}>
            {availableBalance.toLocaleString()} WRF
          </Typography>
        </Box>
      </Paper>

      {/* Proposals Grid */}
      <Grid container spacing={3}>
        {proposals.map((p, idx) => {
          const isPassed = p.status === 'passed';
          const currentStake = stakes[p.id] || 0;

          return (
            <Grid item xs={12} lg={6} key={p.id}>
              <Paper
                sx={{
                  bgcolor: COLORS.card,
                  borderRadius: 3,
                  border: `1px solid ${selectedProposal === idx ? COLORS.primary + '66' : COLORS.border}`,
                  overflow: 'hidden',
                  transition: 'border-color 0.2s',
                  cursor: 'pointer',
                }}
                onClick={() => setSelectedProposal(idx)}
              >
                {/* Proposal Header */}
                <Box sx={{ p: 2.5, pb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ flex: 1, mr: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>{p.id}</Typography>
                        <Chip
                          size="small"
                          label={isPassed ? 'Passed' : 'Accumulating'}
                          icon={isPassed ? <CheckCircleIcon sx={{ fontSize: 14 }} /> : <HourglassEmptyIcon sx={{ fontSize: 14 }} />}
                          sx={{
                            height: 22,
                            bgcolor: isPassed ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)',
                            color: isPassed ? COLORS.success : COLORS.primary,
                            '& .MuiChip-icon': { color: 'inherit' },
                          }}
                        />
                      </Box>
                      <Typography variant="subtitle1" sx={{ color: COLORS.text, fontWeight: 600, lineHeight: 1.3 }}>
                        {p.title}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>Requested</Typography>
                      <Typography variant="body2" sx={{ color: COLORS.warning, fontWeight: 700 }}>
                        {(p.requestedFunding / 1000).toFixed(0)}k WRF
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" sx={{ color: COLORS.textSecondary, mb: 1.5, fontSize: 13 }}>
                    {p.description}
                  </Typography>

                  {/* Stats Row */}
                  <Box sx={{ display: 'flex', gap: 2, mb: 1.5, flexWrap: 'wrap' }}>
                    <Chip size="small" label={`${p.stakerCount} stakers`} sx={{ bgcolor: COLORS.border, color: COLORS.textSecondary, height: 22, fontSize: 11 }} />
                    <Chip size="small" label={`${(p.totalStaked / 1000).toFixed(0)}k staked`} sx={{ bgcolor: COLORS.border, color: COLORS.textSecondary, height: 22, fontSize: 11 }} />
                    <Chip size="small" label={`Day ${p.daysSinceStart}`} icon={<AccessTimeIcon sx={{ fontSize: 12 }} />} sx={{ bgcolor: COLORS.border, color: COLORS.textSecondary, height: 22, fontSize: 11, '& .MuiChip-icon': { color: 'inherit' } }} />
                  </Box>
                </Box>

                {/* Threshold Bar */}
                <Box sx={{ px: 2.5 }}>
                  <ThresholdBar current={p.currentConviction} threshold={p.threshold} />
                </Box>

                {/* Conviction Chart */}
                <Box sx={{ px: 1, py: 1 }}>
                  <ConvictionChart history={p.convictionHistory} threshold={p.threshold} width={480} height={160} />
                </Box>

                {/* Timeline estimate */}
                {!isPassed && p.estimatedDaysToThreshold > 0 && (
                  <Box sx={{ px: 2.5, pb: 1 }}>
                    <Typography variant="caption" sx={{ color: COLORS.cyan }}>
                      Estimated to reach threshold in ~{p.estimatedDaysToThreshold} days at current rate
                    </Typography>
                  </Box>
                )}

                <Divider sx={{ borderColor: COLORS.border }} />

                {/* Staking Controls */}
                <Box sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LockIcon sx={{ color: COLORS.warning, fontSize: 18 }} />
                      <Typography variant="body2" sx={{ color: COLORS.text, fontWeight: 600 }}>
                        Your Stake: {currentStake.toLocaleString()} WRF
                      </Typography>
                    </Box>
                    {currentStake > 0 && !isPassed && (
                      <Button
                        size="small"
                        variant="outlined"
                        disabled
                        title="Sample only: nothing is staked."
                        onClick={(e) => e.stopPropagation()}
                        startIcon={<LockOpenIcon sx={{ fontSize: 14 }} />}
                        sx={{
                          borderColor: COLORS.error + '66',
                          color: COLORS.error,
                          textTransform: 'none',
                          fontSize: 12,
                          '&:hover': { borderColor: COLORS.error, bgcolor: COLORS.error + '11' },
                        }}
                      >
                        Unstake All
                      </Button>
                    )}
                  </Box>

                  {!isPassed && (
                    <Box sx={{ display: 'flex', gap: 1 }} onClick={(e) => e.stopPropagation()}>
                      <TextField
                        size="small"
                        type="number"
                        placeholder="Amount to stake"
                        value={stakeAmounts[p.id] || ''}
                        onChange={(e) => handleInputChange(p.id, e.target.value)}
                        InputProps={{
                          endAdornment: <InputAdornment position="end"><Typography variant="caption" sx={{ color: COLORS.textSecondary }}>WRF</Typography></InputAdornment>,
                          sx: {
                            color: COLORS.text,
                            bgcolor: COLORS.bg,
                            borderRadius: 1.5,
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.border },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.primary },
                          },
                        }}
                        sx={{ flex: 1 }}
                      />
                      <Button
                        variant="contained"
                        disabled
                        title="Sample only: nothing is staked."
                        startIcon={<LockIcon sx={{ fontSize: 16 }} />}
                        sx={{
                          bgcolor: COLORS.primary,
                          textTransform: 'none',
                          fontWeight: 600,
                          borderRadius: 1.5,
                          '&:hover': { bgcolor: '#2563EB' },
                          '&.Mui-disabled': { bgcolor: COLORS.border, color: COLORS.textSecondary },
                        }}
                      >
                        Stake
                      </Button>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* Historical Completed Proposals */}
      <Paper sx={{ bgcolor: COLORS.card, borderRadius: 3, p: 3, mt: 3, border: `1px solid ${COLORS.border}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CheckCircleIcon sx={{ color: COLORS.success }} />
          <Typography variant="subtitle1" sx={{ color: COLORS.text, fontWeight: 600 }}>
            Previously Passed Proposals
          </Typography>
        </Box>
        <Grid container spacing={2}>
          {COMPLETED_PROPOSALS.map((cp) => (
            <Grid item xs={12} md={4} key={cp.id}>
              <Paper sx={{ bgcolor: COLORS.bg, borderRadius: 2, p: 2, border: `1px solid ${COLORS.border}` }}>
                <Typography variant="caption" sx={{ color: COLORS.success, fontWeight: 600 }}>{cp.id}</Typography>
                <Typography variant="body2" sx={{ color: COLORS.text, fontWeight: 500, mb: 1 }}>
                  {cp.title}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                    Funded: {(cp.funded / 1000).toFixed(0)}k WRF
                  </Typography>
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                    Passed day {cp.passedDay} | {cp.totalStakers} stakers
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
};

// frontend#356: no backend route serves conviction voting (the fetched path is not
// mounted), and its action changed only local state. The default build
// shows an honest not-live state. The demo build shows the sample with
// the action disabled.
const ConvictionVotingPanel = () => (
  <DemoSurfaceGate
    title="Conviction voting is not live on the testnet"
    description="No testnet endpoint serves conviction-voting proposals or accepts stakes."
    testId="governance-conviction"
  >
    <ConvictionVotingPanelSample />
  </DemoSurfaceGate>
);

export default ConvictionVotingPanel;
