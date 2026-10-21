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
  IconButton,
  Chip,
  LinearProgress,
  Divider,
  Tooltip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BarChartIcon from '@mui/icons-material/BarChart';

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

const OPTION_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

const TOTAL_CREDITS = 100;

// ---------------------------------------------------------------------------
// Cost Curve SVG
// ---------------------------------------------------------------------------

const CostCurveSVG = () => {
  const width = 280;
  const height = 160;
  const padding = 30;
  const points = [];

  for (let credits = 0; credits <= 25; credits++) {
    const x = padding + (credits / 25) * (width - 2 * padding);
    const votes = Math.sqrt(credits);
    const y = height - padding - (votes / 5) * (height - 2 * padding);
    points.push({ x, y, credits, votes });
  }

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Grid lines */}
      {[1, 2, 3, 4, 5].map((v) => {
        const y = height - padding - (v / 5) * (height - 2 * padding);
        return (
          <g key={v}>
            <line x1={padding} y1={y} x2={width - padding} y2={y} stroke={COLORS.border} strokeWidth={0.5} strokeDasharray="4 4" />
            <text x={padding - 5} y={y + 4} fill={COLORS.textSecondary} fontSize={10} textAnchor="end">{v}</text>
          </g>
        );
      })}
      {[0, 5, 10, 15, 20, 25].map((c) => {
        const x = padding + (c / 25) * (width - 2 * padding);
        return (
          <text key={c} x={x} y={height - padding + 14} fill={COLORS.textSecondary} fontSize={10} textAnchor="middle">{c}</text>
        );
      })}
      {/* Axis labels */}
      <text x={width / 2} y={height - 2} fill={COLORS.textSecondary} fontSize={10} textAnchor="middle">Credits Spent</text>
      <text x={8} y={height / 2} fill={COLORS.textSecondary} fontSize={10} textAnchor="middle" transform={`rotate(-90, 8, ${height / 2})`}>Votes</text>
      {/* Curve */}
      <path d={pathD} fill="none" stroke={COLORS.primary} strokeWidth={2.5} />
      {/* Key points */}
      {[1, 4, 9, 16, 25].map((c) => {
        const x = padding + (c / 25) * (width - 2 * padding);
        const votes = Math.sqrt(c);
        const y = height - padding - (votes / 5) * (height - 2 * padding);
        return (
          <g key={c}>
            <circle cx={x} cy={y} r={3.5} fill={COLORS.primary} />
            <text x={x} y={y - 8} fill={COLORS.text} fontSize={9} textAnchor="middle">{c}c={votes.toFixed(0)}v</text>
          </g>
        );
      })}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Vote Distribution Bar Chart
// ---------------------------------------------------------------------------

const VoteDistributionChart = ({ options, allocations }) => {
  const maxVotes = Math.max(...options.map((o, i) => o.currentVotes + Math.sqrt(allocations[o.id] || 0)), 1);
  const barWidth = 260;
  const barHeight = 24;
  const gap = 8;
  const labelWidth = 140;
  const totalWidth = labelWidth + barWidth + 60;
  const totalHeight = options.length * (barHeight + gap) + 10;

  return (
    <svg width="100%" height={totalHeight} viewBox={`0 0 ${totalWidth} ${totalHeight}`} preserveAspectRatio="xMidYMid meet">
      {options.map((option, i) => {
        const existingVotes = option.currentVotes;
        const yourVotes = Math.sqrt(allocations[option.id] || 0);
        const totalVotes = existingVotes + yourVotes;
        const existingWidth = (existingVotes / maxVotes) * barWidth;
        const yourWidth = (yourVotes / maxVotes) * barWidth;
        const y = i * (barHeight + gap);

        return (
          <g key={option.id}>
            <text x={0} y={y + barHeight / 2 + 4} fill={COLORS.textSecondary} fontSize={11}>
              {option.label.length > 22 ? option.label.slice(0, 22) + '...' : option.label}
            </text>
            {/* Existing votes bar */}
            <rect x={labelWidth} y={y} width={existingWidth} height={barHeight} rx={4} fill={OPTION_COLORS[i % OPTION_COLORS.length]} opacity={0.6} />
            {/* Your votes bar */}
            {yourWidth > 0 && (
              <rect x={labelWidth + existingWidth} y={y} width={yourWidth} height={barHeight} rx={4} fill={OPTION_COLORS[i % OPTION_COLORS.length]} />
            )}
            <text x={labelWidth + existingWidth + yourWidth + 6} y={y + barHeight / 2 + 4} fill={COLORS.text} fontSize={11} fontWeight={600}>
              {totalVotes.toFixed(1)}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const QuadraticVotingPanelSample = () => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [allocations, setAllocations] = useState({});
  const [submitted, setSubmitted] = useState({});

  useEffect(() => {
    apiClient.get('/governance/quadratic-proposals')
      .then((data) => setProposals(Array.isArray(data) ? data : (data.proposals ?? [])))
      .catch(() => setProposals([]))
      .finally(() => setLoading(false));
  }, []);

  const activeProposal = proposals[selectedTab];

  const creditsUsed = useMemo(() => {
    return Object.values(allocations).reduce((sum, v) => sum + v, 0);
  }, [allocations]);

  const creditsRemaining = TOTAL_CREDITS - creditsUsed;

  const handleAllocate = useCallback((optionId, delta) => {
    setAllocations((prev) => {
      const current = prev[optionId] || 0;
      const newVal = Math.max(0, current + delta);
      const totalOther = Object.entries(prev)
        .filter(([k]) => k !== optionId)
        .reduce((sum, [, v]) => sum + v, 0);
      if (totalOther + newVal > TOTAL_CREDITS) return prev;
      return { ...prev, [optionId]: newVal };
    });
  }, []);

  const handleTabChange = useCallback((_, newVal) => {
    setSelectedTab(newVal);
    setAllocations({});
  }, []);

  const costTable = useMemo(() => {
    return [1, 4, 9, 16, 25, 36, 49, 64, 81, 100].map((c) => ({
      credits: c,
      votes: Math.sqrt(c),
    }));
  }, []);

  const isSubmitted = submitted[activeProposal?.id];

  if (loading) return <Box sx={{ minHeight: '100vh', bgcolor: COLORS.bg, p: 3 }}><Typography sx={{ color: COLORS.textSecondary }}>Loading proposals…</Typography></Box>;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: COLORS.bg, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <HowToVoteIcon sx={{ color: COLORS.primary, fontSize: 32 }} />
        <Box>
          <Typography variant="h5" sx={{ color: COLORS.text, fontWeight: 700 }}>
            Quadratic Voting
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
            Allocate voice credits across proposals - voting power equals the square root of credits spent
          </Typography>
        </Box>
      </Box>

      {/* Explanation Card */}
      <Paper sx={{ bgcolor: 'rgba(59,130,246,0.08)', border: `1px solid ${COLORS.primary}33`, borderRadius: 3, p: 2.5, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <InfoIcon sx={{ color: COLORS.primary, mt: 0.3 }} />
          <Box>
            <Typography variant="subtitle1" sx={{ color: COLORS.text, fontWeight: 600, mb: 0.5 }}>
              How Quadratic Voting Works
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary, lineHeight: 1.7 }}>
              You have <strong style={{ color: COLORS.primary }}>{TOTAL_CREDITS} voice credits</strong> to distribute across proposal options.
              The cost of votes increases quadratically: 1 vote costs 1 credit, 2 votes cost 4 credits, 3 votes cost 9 credits, and so on.
              This mechanism prevents wealthy voters from dominating outcomes while allowing passionate minorities to express strong preferences.
              Your voting power on each option equals <strong style={{ color: COLORS.success }}>sqrt(credits spent)</strong>.
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, mt: 1.5 }}>
              <CostCurveSVG />
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600, mb: 1, display: 'block' }}>
                  Quick Reference
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: COLORS.textSecondary, borderColor: COLORS.border, py: 0.5, fontSize: 11 }}>Credits</TableCell>
                        <TableCell sx={{ color: COLORS.textSecondary, borderColor: COLORS.border, py: 0.5, fontSize: 11 }}>Votes</TableCell>
                        <TableCell sx={{ color: COLORS.textSecondary, borderColor: COLORS.border, py: 0.5, fontSize: 11 }}>Cost/Vote</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {costTable.slice(0, 6).map((row) => (
                        <TableRow key={row.credits}>
                          <TableCell sx={{ color: COLORS.text, borderColor: COLORS.border, py: 0.3, fontSize: 12 }}>{row.credits}</TableCell>
                          <TableCell sx={{ color: COLORS.success, borderColor: COLORS.border, py: 0.3, fontSize: 12, fontWeight: 600 }}>{row.votes.toFixed(1)}</TableCell>
                          <TableCell sx={{ color: COLORS.warning, borderColor: COLORS.border, py: 0.3, fontSize: 12 }}>{(row.credits / row.votes).toFixed(1)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Proposal Tabs */}
      <Tabs
        value={selectedTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 3,
          '& .MuiTabs-indicator': { bgcolor: COLORS.primary },
          '& .MuiTab-root': { color: COLORS.textSecondary, textTransform: 'none', fontWeight: 500 },
          '& .Mui-selected': { color: COLORS.primary },
        }}
      >
        {proposals.map((p) => (
          <Tab
            key={p.id}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>{p.id}</span>
                {submitted[p.id] && <CheckCircleIcon sx={{ fontSize: 16, color: COLORS.success }} />}
              </Box>
            }
          />
        ))}
      </Tabs>

      {activeProposal && (
        <Grid container spacing={3}>
          {/* Left Column: Proposal Details + Voting */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ bgcolor: COLORS.card, borderRadius: 3, p: 3, mb: 3, border: `1px solid ${COLORS.border}` }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ color: COLORS.text, fontWeight: 700, mb: 0.5 }}>
                    {activeProposal.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: COLORS.textSecondary, mb: 1.5 }}>
                    {activeProposal.description}
                  </Typography>
                </Box>
                <Chip
                  icon={<AccessTimeIcon sx={{ fontSize: 14 }} />}
                  label={`Ends in ${activeProposal.endsIn}`}
                  size="small"
                  sx={{ bgcolor: 'rgba(245,158,11,0.15)', color: COLORS.warning, border: `1px solid ${COLORS.warning}33` }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Chip
                  label={`${activeProposal.totalVoters} voters`}
                  size="small"
                  sx={{ bgcolor: 'rgba(59,130,246,0.15)', color: COLORS.primary }}
                />
                <Chip
                  label={`Quorum: ${activeProposal.totalVoters}/${activeProposal.quorum}`}
                  size="small"
                  sx={{
                    bgcolor: activeProposal.totalVoters >= activeProposal.quorum
                      ? 'rgba(16,185,129,0.15)'
                      : 'rgba(148,163,184,0.15)',
                    color: activeProposal.totalVoters >= activeProposal.quorum
                      ? COLORS.success
                      : COLORS.textSecondary,
                  }}
                />
              </Box>

              <Divider sx={{ borderColor: COLORS.border, mb: 2.5 }} />

              {/* Option Voting Controls */}
              {activeProposal.options.map((option, idx) => {
                const credits = allocations[option.id] || 0;
                const votes = Math.sqrt(credits);
                return (
                  <Paper
                    key={option.id}
                    sx={{
                      bgcolor: credits > 0 ? 'rgba(59,130,246,0.06)' : 'rgba(15,23,42,0.5)',
                      border: `1px solid ${credits > 0 ? COLORS.primary + '44' : COLORS.border}`,
                      borderRadius: 2,
                      p: 2,
                      mb: 1.5,
                      transition: 'all 0.2s',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ flex: 1, mr: 2 }}>
                        <Typography variant="body1" sx={{ color: COLORS.text, fontWeight: 500, mb: 0.3 }}>
                          <Box component="span" sx={{ color: OPTION_COLORS[idx], fontWeight: 700, mr: 1 }}>
                            {String.fromCharCode(65 + idx)}.
                          </Box>
                          {option.label}
                        </Typography>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                          Current community votes: {option.currentVotes}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {/* Credits control */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleAllocate(option.id, -1)}
                            disabled={credits === 0 || isSubmitted}
                            sx={{
                              bgcolor: COLORS.border,
                              color: COLORS.text,
                              width: 30,
                              height: 30,
                              '&:hover': { bgcolor: COLORS.error + '33' },
                              '&.Mui-disabled': { color: COLORS.textSecondary + '44' },
                            }}
                          >
                            <RemoveIcon sx={{ fontSize: 16 }} />
                          </IconButton>

                          <Box
                            sx={{
                              minWidth: 48,
                              textAlign: 'center',
                              bgcolor: COLORS.bg,
                              borderRadius: 1,
                              px: 1,
                              py: 0.5,
                            }}
                          >
                            <Typography variant="body2" sx={{ color: COLORS.text, fontWeight: 700 }}>
                              {credits}
                            </Typography>
                            <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontSize: 9 }}>
                              credits
                            </Typography>
                          </Box>

                          <IconButton
                            size="small"
                            onClick={() => handleAllocate(option.id, 1)}
                            disabled={creditsRemaining <= 0 || isSubmitted}
                            sx={{
                              bgcolor: COLORS.border,
                              color: COLORS.text,
                              width: 30,
                              height: 30,
                              '&:hover': { bgcolor: COLORS.success + '33' },
                              '&.Mui-disabled': { color: COLORS.textSecondary + '44' },
                            }}
                          >
                            <AddIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>

                        {/* Votes display */}
                        <Box
                          sx={{
                            bgcolor: OPTION_COLORS[idx] + '22',
                            border: `1px solid ${OPTION_COLORS[idx]}44`,
                            borderRadius: 1.5,
                            px: 1.5,
                            py: 0.5,
                            minWidth: 64,
                            textAlign: 'center',
                          }}
                        >
                          <Typography variant="body2" sx={{ color: OPTION_COLORS[idx], fontWeight: 700 }}>
                            {votes.toFixed(2)}
                          </Typography>
                          <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontSize: 9 }}>
                            votes
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                );
              })}

              {isSubmitted && (
                <Alert
                  severity="success"
                  sx={{
                    mt: 2,
                    bgcolor: 'rgba(16,185,129,0.1)',
                    color: COLORS.success,
                    border: `1px solid ${COLORS.success}33`,
                    '& .MuiAlert-icon': { color: COLORS.success },
                  }}
                >
                  Your votes have been submitted for {activeProposal.id}
                </Alert>
              )}
            </Paper>

            {/* Vote Distribution Chart */}
            <Paper sx={{ bgcolor: COLORS.card, borderRadius: 3, p: 3, border: `1px solid ${COLORS.border}` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <BarChartIcon sx={{ color: COLORS.primary }} />
                <Typography variant="subtitle1" sx={{ color: COLORS.text, fontWeight: 600 }}>
                  Vote Distribution (Community + Your Votes)
                </Typography>
              </Box>
              <VoteDistributionChart options={activeProposal.options} allocations={allocations} />
            </Paper>
          </Grid>

          {/* Right Column: Credits & Cost Table */}
          <Grid item xs={12} md={4}>
            {/* Credits Remaining */}
            <Paper sx={{ bgcolor: COLORS.card, borderRadius: 3, p: 3, mb: 3, border: `1px solid ${COLORS.border}` }}>
              <Typography variant="subtitle2" sx={{ color: COLORS.textSecondary, mb: 1 }}>
                Voice Credits Remaining
              </Typography>
              <Typography variant="h3" sx={{ color: creditsRemaining > 20 ? COLORS.primary : COLORS.warning, fontWeight: 800, mb: 1 }}>
                {creditsRemaining}
                <Typography component="span" variant="h6" sx={{ color: COLORS.textSecondary, fontWeight: 400, ml: 0.5 }}>
                  / {TOTAL_CREDITS}
                </Typography>
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(creditsUsed / TOTAL_CREDITS) * 100}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  bgcolor: COLORS.border,
                  mb: 1.5,
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 5,
                    bgcolor: creditsRemaining > 20 ? COLORS.primary : creditsRemaining > 5 ? COLORS.warning : COLORS.error,
                  },
                }}
              />
              <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                {creditsUsed} credits allocated across {Object.values(allocations).filter((v) => v > 0).length} options
              </Typography>

              <Divider sx={{ borderColor: COLORS.border, my: 2 }} />

              {/* Per-option summary */}
              {activeProposal.options.map((option, idx) => {
                const credits = allocations[option.id] || 0;
                if (credits === 0) return null;
                return (
                  <Box key={option.id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                    <Typography variant="caption" sx={{ color: OPTION_COLORS[idx], fontWeight: 600 }}>
                      Option {String.fromCharCode(65 + idx)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: COLORS.text }}>
                      {credits} credits = {Math.sqrt(credits).toFixed(2)} votes
                    </Typography>
                  </Box>
                );
              })}

              <Button
                variant="contained"
                fullWidth
                disabled
                title="Sample only: quadratic votes are not submitted anywhere."
                startIcon={<HowToVoteIcon />}
                sx={{
                  mt: 2,
                  bgcolor: COLORS.primary,
                  borderRadius: 2,
                  py: 1.2,
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#2563EB' },
                  '&.Mui-disabled': { bgcolor: COLORS.border, color: COLORS.textSecondary },
                }}
              >
                {isSubmitted ? 'Votes Submitted' : 'Submit Votes'}
              </Button>
            </Paper>

            {/* Full Cost Table */}
            <Paper sx={{ bgcolor: COLORS.card, borderRadius: 3, p: 3, border: `1px solid ${COLORS.border}` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TrendingUpIcon sx={{ color: COLORS.warning }} />
                <Typography variant="subtitle1" sx={{ color: COLORS.text, fontWeight: 600 }}>
                  Cost Table
                </Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: COLORS.textSecondary, borderColor: COLORS.border, fontWeight: 600, fontSize: 12 }}>Credits</TableCell>
                      <TableCell sx={{ color: COLORS.textSecondary, borderColor: COLORS.border, fontWeight: 600, fontSize: 12 }}>Votes</TableCell>
                      <TableCell sx={{ color: COLORS.textSecondary, borderColor: COLORS.border, fontWeight: 600, fontSize: 12 }}>Marginal Cost</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {costTable.map((row, i) => (
                      <TableRow key={row.credits} sx={{ '&:last-child td': { borderBottom: 'none' } }}>
                        <TableCell sx={{ color: COLORS.text, borderColor: COLORS.border, py: 0.6, fontSize: 13 }}>{row.credits}</TableCell>
                        <TableCell sx={{ color: COLORS.success, borderColor: COLORS.border, py: 0.6, fontSize: 13, fontWeight: 600 }}>{row.votes.toFixed(1)}</TableCell>
                        <TableCell sx={{ color: COLORS.warning, borderColor: COLORS.border, py: 0.6, fontSize: 13 }}>
                          {i === 0 ? '1.0' : (row.credits - costTable[i - 1].credits).toFixed(0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

// frontend#356: no backend route serves quadratic voting (the fetched path is not
// mounted), and its action changed only local state. The default build
// shows an honest not-live state. The demo build shows the sample with
// the action disabled.
const QuadraticVotingPanel = () => (
  <DemoSurfaceGate
    title="Quadratic voting is not live on the testnet"
    description="No testnet endpoint serves quadratic-voting proposals or accepts quadratic votes."
    testId="governance-quadratic"
  >
    <QuadraticVotingPanelSample />
  </DemoSurfaceGate>
);

export default QuadraticVotingPanel;
