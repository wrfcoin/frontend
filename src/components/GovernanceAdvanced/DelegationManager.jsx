/**
 * DelegationManager — /governance/delegation (frontend#356).
 *
 * Every figure comes from a served backend route, and every enabled control
 * issues a real request:
 * - GET  /api/governance/voting-power?address=      your voting power
 * - GET  /api/governance/delegations/delegator/:a   your active delegations
 * - GET  /api/governance/analytics/delegates        delegates on the network
 * - POST /api/governance/delegate                   (requireAuth; delegator = JWT subject)
 *
 * The former page rendered constant power, invented named delegates
 * ("ClimateDAO", "WeatherNode") with token amounts, and revoke actions that
 * changed only local state. The backend has no revoke route, so revoke is gone.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import { governanceService } from '../../services/apiClient';
import { currentAuthSubject, isSameSubject, useAuthSubject } from '../../hooks/useAuthSubject';

const COLORS = {
  bg: '#0F172A',
  card: '#1E293B',
  border: '#334155',
  primary: '#3B82F6',
  success: '#10B981',
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  purple: '#8B5CF6',
  cyan: '#06B6D4',
};

const cellSx = { color: COLORS.text, borderColor: COLORS.border, fontSize: '0.85rem' };
const headSx = { color: COLORS.textSecondary, borderColor: COLORS.border, fontSize: '0.75rem', textTransform: 'uppercase' };

function errorText(err) {
  return err instanceof Error ? err.message : 'request failed';
}

const Section = ({ title, children, testId }) => (
  <Paper data-testid={testId} sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 3, p: 3, mb: 3 }}>
    <Typography sx={{ color: COLORS.text, fontWeight: 600, mb: 2 }}>{title}</Typography>
    {children}
  </Paper>
);

const DelegationManager = () => {
  const subject = useAuthSubject();
  const [power, setPower] = useState(null);
  const [mine, setMine] = useState(null);
  const [mineError, setMineError] = useState(null);
  const [delegates, setDelegates] = useState(null);
  const [delegatesError, setDelegatesError] = useState(null);
  const [target, setTarget] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const loadDelegates = useCallback(async () => {
    setDelegatesError(null);
    try {
      setDelegates(await governanceService.getAnalyticsDelegates());
    } catch (err) {
      setDelegates(null);
      setDelegatesError(errorText(err));
    }
  }, []);

  const loadMine = useCallback(async () => {
    setPower(null);
    setMine(null);
    setMineError(null);
    if (!subject) return;
    const initiator = subject;
    try {
      const [p, rows] = await Promise.all([
        governanceService.getVotingPower(initiator),
        governanceService.getDelegations(initiator),
      ]);
      // A slower response for an earlier account must not overwrite this one.
      if (!isSameSubject(currentAuthSubject(), initiator)) return;
      setPower(p);
      setMine(rows);
    } catch (err) {
      if (!isSameSubject(currentAuthSubject(), initiator)) return;
      setMineError(errorText(err));
    }
  }, [subject]);

  useEffect(() => { void loadDelegates(); }, [loadDelegates]);
  useEffect(() => { void loadMine(); }, [loadMine]);
  // Outcome and form state belong to the session that produced them.
  useEffect(() => {
    setResult(null);
    setSubmitting(false);
    setTarget('');
    setAmount('');
  }, [subject]);

  const trimmed = target.trim();
  const parsedAmount = amount.trim() === '' ? undefined : Number(amount);
  const invalidReason = !subject
    ? 'Sign in with a wallet to delegate.'
    : trimmed !== '' && trimmed.toLowerCase() === subject.toLowerCase()
      ? 'You cannot delegate to yourself.'
      : parsedAmount !== undefined && (!Number.isFinite(parsedAmount) || parsedAmount < 0)
        ? 'Amount must be a non-negative number.'
        : null;

  const submit = async () => {
    const initiator = subject;
    const stillCurrent = () => isSameSubject(currentAuthSubject(), initiator);
    setSubmitting(true);
    setResult(null);
    try {
      const delegation = await governanceService.delegate(trimmed, parsedAmount);
      if (!stillCurrent()) return;
      setResult({ ok: true, message: `Delegation to ${delegation.delegate} recorded.` });
      setTarget('');
      setAmount('');
      await Promise.all([loadMine(), loadDelegates()]);
    } catch (err) {
      if (!stillCurrent()) return;
      setResult({ ok: false, message: errorText(err) });
    } finally {
      if (stillCurrent()) setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: COLORS.bg, p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <GroupsIcon sx={{ color: COLORS.purple, fontSize: 32 }} />
        <Typography variant="h5" sx={{ color: COLORS.text, fontWeight: 700 }}>Delegation</Typography>
      </Box>

      <Section title="Your voting power" testId="delegation-power">
        {!subject && (
          <Typography data-testid="delegation-sign-in" sx={{ color: COLORS.textSecondary }}>
            Sign in with a wallet to see your voting power and delegations.
          </Typography>
        )}
        {subject && mineError && <Alert severity="error">Voting power unavailable: {mineError}</Alert>}
        {subject && !mineError && !power && <CircularProgress size={20} />}
        {subject && power && (
          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {[
              ['Delegated to you', power.delegatedPower, COLORS.success],
              ['Participation bonus', power.participationBonus, COLORS.cyan],
              ['Total voting power', power.totalPower, COLORS.purple],
            ].map(([label, value, color]) => (
              <Box key={label}>
                <Typography sx={{ color: COLORS.textSecondary, fontSize: '0.75rem', textTransform: 'uppercase' }}>{label}</Typography>
                <Typography data-testid={`delegation-${label}`} sx={{ color, fontWeight: 700, fontSize: '1.2rem' }}>{value.toLocaleString()}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </Section>

      <Section title="Your active delegations" testId="delegation-mine">
        {!subject && <Typography sx={{ color: COLORS.textSecondary }}>Sign in to see your delegations.</Typography>}
        {subject && mine && mine.length === 0 && (
          <Typography data-testid="delegation-empty" sx={{ color: COLORS.textSecondary }}>No delegations yet.</Typography>
        )}
        {subject && mine && mine.length > 0 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={headSx}>Delegate</TableCell>
                  <TableCell sx={headSx}>Amount</TableCell>
                  <TableCell sx={headSx}>Since</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mine.map((d) => (
                  <TableRow key={`${d.delegate}-${d.createdAt ?? ''}`}>
                    <TableCell sx={cellSx}>{d.delegate}</TableCell>
                    <TableCell sx={cellSx}>{d.votingPower ?? '—'}</TableCell>
                    <TableCell sx={cellSx}>{d.createdAt ? String(d.createdAt).slice(0, 10) : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Section>

      <Section title="Delegate your voting power" testId="delegation-form">
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <TextField
            size="small"
            label="Delegate address"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            disabled={!subject}
            sx={{ flex: 2, minWidth: 260, '& .MuiInputBase-root': { color: COLORS.text } }}
          />
          <TextField
            size="small"
            label="Amount (optional)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={!subject}
            sx={{ flex: 1, minWidth: 140, '& .MuiInputBase-root': { color: COLORS.text } }}
          />
          <Button
            variant="contained"
            disabled={!subject || trimmed === '' || Boolean(invalidReason) || submitting}
            onClick={() => { void submit(); }}
          >
            {submitting ? 'Delegating…' : 'Delegate'}
          </Button>
        </Box>
        {invalidReason && (
          <Typography data-testid="delegation-disabled-reason" sx={{ color: COLORS.textSecondary, fontSize: '0.8rem', mt: 1 }}>
            {invalidReason}
          </Typography>
        )}
        {result && (
          <Alert severity={result.ok ? 'success' : 'error'} sx={{ mt: 2 }} data-testid={result.ok ? 'delegation-recorded' : 'delegation-error'}>
            {result.ok ? result.message : `Delegation not recorded: ${result.message}`}
          </Alert>
        )}
      </Section>

      <Section title="Delegates on the network" testId="delegation-delegates">
        {delegatesError && <Alert severity="error">Delegates unavailable: {delegatesError}</Alert>}
        {!delegatesError && !delegates && <CircularProgress size={20} />}
        {delegates && delegates.length === 0 && (
          <Typography data-testid="delegates-empty" sx={{ color: COLORS.textSecondary }}>No active delegations on the network yet.</Typography>
        )}
        {delegates && delegates.length > 0 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={headSx}>Delegate</TableCell>
                  <TableCell sx={headSx}>Total delegated</TableCell>
                  <TableCell sx={headSx}>Delegators</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {delegates.map((d) => (
                  <TableRow key={d.address}>
                    <TableCell sx={cellSx}>{d.address}</TableCell>
                    <TableCell sx={cellSx}>{d.totalDelegated}</TableCell>
                    <TableCell sx={cellSx}>{d.delegatorCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Section>
    </Box>
  );
};

export default DelegationManager;
