/**
 * ProposalAnalytics — /governance/analytics (frontend#356).
 *
 * Every number comes from the mounted backend analytics routes:
 * - GET /api/governance/analytics/dashboard      proposals, votes, active proposals
 * - GET /api/governance/analytics/participation  unique voters, votes per proposal
 * - GET /api/governance/analytics/treasury       balance, inflow, outflow, transactions
 * - GET /api/governance/analytics/delegates      delegates and delegated totals
 *
 * The former page drew a monthly participation trend, voter distribution,
 * outcome "predictions", top voters and a Gini coefficient from constants.
 * No route serves those series, so those charts are removed, not zero-filled.
 * Each section fails on its own and says so.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import { governanceService } from '../../services/apiClient';

const COLORS = {
  bg: '#0F172A',
  card: '#1E293B',
  border: '#334155',
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  purple: '#8B5CF6',
  cyan: '#06B6D4',
};

function useSection(load) {
  const [state, setState] = useState({ data: null, error: null });
  const run = useCallback(async () => {
    try {
      setState({ data: await load(), error: null });
    } catch (err) {
      setState({ data: null, error: err instanceof Error ? err.message : 'request failed' });
    }
  }, [load]);
  useEffect(() => { void run(); }, [run]);
  return state;
}

const Stat = ({ label, value, color, testId }) => (
  <Box sx={{ minWidth: 160 }}>
    <Typography sx={{ color: COLORS.textSecondary, fontSize: '0.75rem', textTransform: 'uppercase' }}>{label}</Typography>
    <Typography data-testid={testId} sx={{ color, fontWeight: 700, fontSize: '1.4rem' }}>{value}</Typography>
  </Box>
);

const Section = ({ title, state, testId, children }) => (
  <Paper data-testid={testId} sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 3, p: 3, mb: 3 }}>
    <Typography sx={{ color: COLORS.text, fontWeight: 600, mb: 2 }}>{title}</Typography>
    {state.error && <Alert severity="error" data-testid={`${testId}-error`}>Unavailable: {state.error}</Alert>}
    {!state.error && !state.data && <CircularProgress size={20} />}
    {state.data && children(state.data)}
  </Paper>
);

const loadDashboard = () => governanceService.getAnalyticsDashboard();
const loadParticipation = () => governanceService.getAnalyticsParticipation();
const loadTreasury = () => governanceService.getAnalyticsTreasury();
const loadDelegates = () => governanceService.getAnalyticsDelegates();

const ProposalAnalytics = () => {
  const dashboard = useSection(loadDashboard);
  const participation = useSection(loadParticipation);
  const treasury = useSection(loadTreasury);
  const delegates = useSection(loadDelegates);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: COLORS.bg, p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <AnalyticsIcon sx={{ color: COLORS.cyan, fontSize: 32 }} />
        <Typography variant="h5" sx={{ color: COLORS.text, fontWeight: 700 }}>Governance Analytics</Typography>
      </Box>

      <Section title="Proposals and votes" state={dashboard} testId="analytics-dashboard">
        {(d) => (
          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <Stat label="Total proposals" value={d.totalProposals} color={COLORS.primary} testId="analytics-total-proposals" />
            <Stat label="Active proposals" value={d.activeProposals} color={COLORS.warning} testId="analytics-active-proposals" />
            <Stat label="Total votes" value={d.totalVotes} color={COLORS.success} testId="analytics-total-votes" />
          </Box>
        )}
      </Section>

      <Section title="Participation" state={participation} testId="analytics-participation">
        {(p) => (
          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <Stat label="Unique voters" value={p.uniqueVoters} color={COLORS.purple} testId="analytics-unique-voters" />
            <Stat label="Votes per proposal" value={p.avgVotesPerProposal || '—'} color={COLORS.cyan} testId="analytics-votes-per-proposal" />
          </Box>
        )}
      </Section>

      <Section title="Treasury" state={treasury} testId="analytics-treasury">
        {(t) => (
          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <Stat label="Balance" value={t.balance || '—'} color={COLORS.success} testId="analytics-treasury-balance" />
            <Stat label="Inflow" value={t.totalInflow || '—'} color={COLORS.primary} testId="analytics-treasury-inflow" />
            <Stat label="Outflow" value={t.totalOutflow || '—'} color={COLORS.warning} testId="analytics-treasury-outflow" />
            <Stat label="Transactions" value={t.transactionCount} color={COLORS.text} testId="analytics-treasury-transactions" />
          </Box>
        )}
      </Section>

      <Section title="Delegates" state={delegates} testId="analytics-delegates">
        {(rows) => (rows.length === 0 ? (
          <Typography data-testid="analytics-delegates-empty" sx={{ color: COLORS.textSecondary }}>
            No active delegations on the network yet.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Delegate', 'Total delegated', 'Delegators'].map((h) => (
                    <TableCell key={h} sx={{ color: COLORS.textSecondary, borderColor: COLORS.border, fontSize: '0.75rem', textTransform: 'uppercase' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.address}>
                    <TableCell sx={{ color: COLORS.text, borderColor: COLORS.border }}>{r.address}</TableCell>
                    <TableCell sx={{ color: COLORS.text, borderColor: COLORS.border }}>{r.totalDelegated}</TableCell>
                    <TableCell sx={{ color: COLORS.text, borderColor: COLORS.border }}>{r.delegatorCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ))}
      </Section>
    </Box>
  );
};

export default ProposalAnalytics;
