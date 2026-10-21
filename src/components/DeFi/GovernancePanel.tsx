import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import { governanceService } from '../../services/apiClient';
import type { GovernanceProposal, GovernanceVotingPower } from '../../services/apiClient';
import { currentAuthSubject, isSameSubject, useAuthSubject } from '../../hooks/useAuthSubject';
import {
  HowToVote as VoteIcon,
  Groups as DelegateIcon,
  CheckCircle as PassedIcon,
  Cancel as RejectedIcon,
  Schedule as PendingIcon,
  Gavel as GavelIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

// --- Palette ---

const palette = {
  bg: '#0F172A',
  card: '#1E293B',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  border: '#334155',
  purple: '#8B5CF6',
  cyan: '#06B6D4',
};

const fontMono = '"JetBrains Mono", "Fira Code", monospace';
const fontUI = '"Inter", "Segoe UI", sans-serif';

// --- Types ---
//
// frontend#356: everything below comes from served routes.
// - Proposals: GET /api/governance/proposals (core4 records: string ids,
//   status, yes_votes/no_votes, votes_by_voter).
// - Votes: POST /api/governance/proposals/:id/vote (requireAuth; FOR/AGAINST).
// - Voting power and delegation: GET /voting-power, GET /delegations, and
//   POST /delegate (requireAuth).
// Nothing is optimistic. A control is enabled only when it will issue a real
// request, and a failure is shown as a failure.

type VoteChoice = 'for' | 'against';

interface Proposal {
  id: string;
  title: string;
  status: 'active' | 'passed' | 'rejected' | 'other';
  rawStatus: string;
  yesVotes?: number;
  noVotes?: number;
  userVote: VoteChoice | null;
  proposer: string;
  createdAt: string;
  timeRemaining: string | null;
}

function normalizeStatus(raw: string): Proposal['status'] {
  const s = raw.toLowerCase();
  if (s === 'active' || s === 'voting') return 'active';
  if (s === 'passed' || s === 'executed') return 'passed';
  if (s === 'rejected' || s === 'failedquorum' || s === 'failed_quorum' || s === 'vetoed') return 'rejected';
  return 'other';
}

function toProposal(p: GovernanceProposal, subject: string | null): Proposal {
  const approve = subject ? p.votesByVoter?.[subject.toLowerCase()] : undefined;
  let timeRemaining: string | null = null;
  if (p.votingEndsAt) {
    const diff = new Date(p.votingEndsAt).getTime() - Date.now();
    if (Number.isFinite(diff)) {
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      timeRemaining = diff <= 0 ? 'Ended' : d > 0 ? `${d}d ${h}h` : `${h}h`;
    }
  }
  return {
    id: p.id,
    title: p.title,
    status: normalizeStatus(p.status),
    rawStatus: p.status,
    yesVotes: p.yesVotes,
    noVotes: p.noVotes,
    userVote: approve === undefined ? null : approve ? 'for' : 'against',
    proposer: p.proposer ?? '',
    createdAt: p.createdAt ? String(p.createdAt).slice(0, 10) : '',
    timeRemaining,
  };
}

const SIGN_IN_TO_VOTE = 'Sign in with a wallet to vote. Votes are recorded for the signed-in wallet.';

// --- Sub-components ---

type VoteState = { submitting: boolean; error: string | null; submitted: VoteChoice | null };

const ProposalCard: React.FC<{
  proposal: Proposal;
  canVote: boolean;
  voteState: VoteState;
  onVote: (choice: VoteChoice) => void;
}> = ({ proposal, canVote, voteState, onVote }) => {
  const hasTally = proposal.yesVotes !== undefined && proposal.noVotes !== undefined;
  const total = hasTally ? (proposal.yesVotes as number) + (proposal.noVotes as number) : 0;
  const forPct = hasTally && total > 0 ? ((proposal.yesVotes as number) / total) * 100 : 0;
  const againstPct = hasTally && total > 0 ? ((proposal.noVotes as number) / total) * 100 : 0;
  const disabledReason = !canVote ? SIGN_IN_TO_VOTE : voteState.submitting ? 'Submitting vote…' : null;

  return (
    <Card
      data-testid={`proposal-${proposal.id}`}
      sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 3 }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
              <Chip
                label={`#${proposal.id}`}
                size="small"
                sx={{ bgcolor: `${palette.primary}20`, color: palette.primary, fontFamily: fontMono, fontWeight: 600, fontSize: '0.7rem', height: 22 }}
              />
              {proposal.timeRemaining && (
                <Chip
                  label={proposal.timeRemaining}
                  size="small"
                  icon={<PendingIcon sx={{ fontSize: 14 }} />}
                  sx={{ bgcolor: `${palette.warning}20`, color: palette.warning, fontFamily: fontMono, fontSize: '0.7rem', height: 22, '& .MuiChip-icon': { color: 'inherit' } }}
                />
              )}
            </Stack>
            <Typography sx={{ color: palette.text, fontFamily: fontUI, fontWeight: 600, fontSize: '0.95rem', lineHeight: 1.3 }}>
              {proposal.title}
            </Typography>
          </Box>
          {proposal.userVote && (
            <Chip
              label={`Voted: ${proposal.userVote === 'for' ? 'For' : 'Against'}`}
              size="small"
              sx={{
                bgcolor: proposal.userVote === 'for' ? `${palette.success}20` : `${palette.error}20`,
                color: proposal.userVote === 'for' ? palette.success : palette.error,
                fontFamily: fontUI, fontWeight: 500, fontSize: '0.7rem', height: 22,
              }}
            />
          )}
        </Stack>

        {hasTally ? (
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Typography sx={{ color: palette.success, fontFamily: fontUI, fontSize: '0.72rem', fontWeight: 600 }}>
                For {proposal.yesVotes} ({forPct.toFixed(1)}%)
              </Typography>
              <Typography sx={{ color: palette.error, fontFamily: fontUI, fontSize: '0.72rem', fontWeight: 600 }}>
                Against {proposal.noVotes} ({againstPct.toFixed(1)}%)
              </Typography>
            </Stack>
            <Box sx={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', bgcolor: `${palette.textSecondary}20` }}>
              <Box sx={{ width: `${forPct}%`, bgcolor: palette.success }} />
              <Box sx={{ width: `${againstPct}%`, bgcolor: palette.error }} />
            </Box>
          </Box>
        ) : (
          <Typography sx={{ color: palette.textSecondary, fontFamily: fontUI, fontSize: '0.75rem', mb: 2 }}>
            Vote tally not reported for this proposal.
          </Typography>
        )}

        {proposal.status === 'active' && !proposal.userVote && !voteState.submitted && (
          <Stack spacing={1}>
            <Stack direction="row" spacing={1}>
              <Button
                fullWidth
                variant="contained"
                size="small"
                disabled={Boolean(disabledReason)}
                onClick={() => onVote('for')}
                sx={{ bgcolor: palette.success, color: palette.bg, fontFamily: fontUI, fontWeight: 600, textTransform: 'none', fontSize: '0.8rem', '&:hover': { bgcolor: '#059669' } }}
              >
                For
              </Button>
              <Button
                fullWidth
                variant="contained"
                size="small"
                disabled={Boolean(disabledReason)}
                onClick={() => onVote('against')}
                sx={{ bgcolor: palette.error, color: palette.text, fontFamily: fontUI, fontWeight: 600, textTransform: 'none', fontSize: '0.8rem', '&:hover': { bgcolor: '#DC2626' } }}
              >
                Against
              </Button>
            </Stack>
            {disabledReason && (
              <Typography data-testid={`vote-disabled-reason-${proposal.id}`} sx={{ color: palette.textSecondary, fontFamily: fontUI, fontSize: '0.72rem' }}>
                {disabledReason}
              </Typography>
            )}
          </Stack>
        )}
        {voteState.submitted && (
          <Alert severity="success" sx={{ mt: 1 }} data-testid={`vote-recorded-${proposal.id}`}>
            Vote {voteState.submitted === 'for' ? 'For' : 'Against'} accepted by the governance API.
          </Alert>
        )}
        {voteState.error && (
          <Alert severity="error" sx={{ mt: 1 }} data-testid={`vote-error-${proposal.id}`}>
            Vote not recorded: {voteState.error}
          </Alert>
        )}

        {proposal.proposer && (
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 2 }}>
            <Typography sx={{ color: palette.textSecondary, fontFamily: fontUI, fontSize: '0.7rem' }}>Proposed by</Typography>
            <Typography sx={{ color: palette.primary, fontFamily: fontMono, fontSize: '0.7rem' }}>{proposal.proposer}</Typography>
            {proposal.createdAt && (
              <Typography sx={{ color: palette.textSecondary, fontFamily: fontUI, fontSize: '0.7rem' }}>on {proposal.createdAt}</Typography>
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

// --- Delegate Panel ---

const DelegatePanel: React.FC<{
  subject: string | null;
  power: GovernanceVotingPower | null;
  powerError: string | null;
  currentDelegate: string | null;
  onDelegated: () => void;
}> = ({ subject, power, powerError, currentDelegate, onDelegated }) => {
  const [delegateAddress, setDelegateAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const target = delegateAddress.trim();
  const disabledReason = !subject
    ? 'Sign in with a wallet to delegate.'
    : target === ''
      ? null
      : target.toLowerCase() === subject.toLowerCase()
        ? 'You cannot delegate to yourself.'
        : null;

  const submit = async () => {
    const initiator = subject;
    setSubmitting(true);
    setResult(null);
    try {
      const delegation = await governanceService.delegate(target);
      if (!isSameSubject(currentAuthSubject(), initiator)) return;
      setResult({ ok: true, message: `Delegation to ${delegation.delegate} recorded.` });
      setDelegateAddress('');
      onDelegated();
    } catch (err) {
      if (!isSameSubject(currentAuthSubject(), initiator)) return;
      setResult({ ok: false, message: err instanceof Error ? err.message : 'Delegation failed' });
    } finally {
      if (isSameSubject(currentAuthSubject(), initiator)) setSubmitting(false);
    }
  };

  const stats = subject && power
    ? [
      { label: 'Delegated to You', value: `${power.delegatedPower.toLocaleString()}`, color: palette.success },
      { label: 'Participation Bonus', value: `${power.participationBonus.toLocaleString()}`, color: palette.cyan },
      { label: 'Total Voting Power', value: `${power.totalPower.toLocaleString()}`, color: palette.purple },
      { label: 'Current Delegate', value: currentDelegate ?? 'None', color: palette.text },
    ]
    : [];

  return (
    <Card data-testid="delegate-panel" sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 3, p: 3 }}>
      <Typography sx={{ color: palette.text, fontFamily: fontUI, fontWeight: 600, fontSize: '1rem', mb: 2 }}>
        Delegate Voting Power
      </Typography>

      {!subject && (
        <Typography data-testid="delegate-sign-in" sx={{ color: palette.textSecondary, fontFamily: fontUI, fontSize: '0.85rem', mb: 2 }}>
          Sign in with a wallet to see your voting power and delegate it.
        </Typography>
      )}
      {subject && powerError && (
        <Alert severity="error" sx={{ mb: 2 }} data-testid="voting-power-error">
          Voting power unavailable: {powerError}
        </Alert>
      )}
      {stats.length > 0 && (
        <Stack direction="row" flexWrap="wrap" gap={3} sx={{ mb: 3 }}>
          {stats.map((s) => (
            <Box key={s.label} sx={{ flex: 1, minWidth: 150 }}>
              <Typography sx={{ color: palette.textSecondary, fontFamily: fontUI, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.5 }}>
                {s.label}
              </Typography>
              <Typography sx={{ color: s.color, fontFamily: fontMono, fontWeight: 700, fontSize: '1.1rem' }}>{s.value}</Typography>
            </Box>
          ))}
        </Stack>
      )}

      <Divider sx={{ borderColor: palette.border, mb: 3 }} />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-end">
        <TextField
          fullWidth
          placeholder="Delegate address (0x...)"
          value={delegateAddress}
          onChange={(e) => setDelegateAddress(e.target.value)}
          disabled={!subject}
          variant="outlined"
          size="small"
          inputProps={{ 'aria-label': 'Delegate address' }}
          sx={{ '& .MuiOutlinedInput-root': { color: palette.text, fontFamily: fontMono, fontSize: '0.85rem', bgcolor: palette.bg, '& fieldset': { borderColor: palette.border } } }}
        />
        <Button
          variant="contained"
          disabled={!subject || target === '' || Boolean(disabledReason) || submitting}
          onClick={() => { void submit(); }}
          sx={{ bgcolor: palette.primary, color: palette.text, fontFamily: fontUI, fontWeight: 600, textTransform: 'none', whiteSpace: 'nowrap', px: 4 }}
        >
          {submitting ? 'Delegating…' : 'Delegate'}
        </Button>
      </Stack>
      {disabledReason && (
        <Typography data-testid="delegate-disabled-reason" sx={{ color: palette.textSecondary, fontFamily: fontUI, fontSize: '0.72rem', mt: 1 }}>
          {disabledReason}
        </Typography>
      )}
      {result && (
        <Alert severity={result.ok ? 'success' : 'error'} sx={{ mt: 2 }} data-testid={result.ok ? 'delegate-recorded' : 'delegate-error'}>
          {result.ok ? result.message : `Delegation not recorded: ${result.message}`}
        </Alert>
      )}
    </Card>
  );
};

// --- Main Component ---

const GovernancePanel: React.FC = () => {
  const subject = useAuthSubject();
  const [rawProposals, setRawProposals] = useState<GovernanceProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votes, setVotes] = useState<Record<string, VoteState>>({});
  const [power, setPower] = useState<GovernanceVotingPower | null>(null);
  const [powerError, setPowerError] = useState<string | null>(null);
  const [currentDelegate, setCurrentDelegate] = useState<string | null>(null);

  const fetchProposals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRawProposals(await governanceService.getProposals(50));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load governance data');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPower = useCallback(async () => {
    setPower(null);
    setPowerError(null);
    setCurrentDelegate(null);
    if (!subject) return;
    const initiator = subject;
    try {
      const [p, delegations] = await Promise.all([
        governanceService.getVotingPower(initiator),
        governanceService.getDelegations(initiator),
      ]);
      // A slower response for an earlier account must not overwrite this one.
      if (!isSameSubject(currentAuthSubject(), initiator)) return;
      setPower(p);
      setCurrentDelegate(delegations[0]?.delegate || null);
    } catch (err) {
      if (!isSameSubject(currentAuthSubject(), initiator)) return;
      setPowerError(err instanceof Error ? err.message : 'request failed');
    }
  }, [subject]);

  useEffect(() => { void fetchProposals(); }, [fetchProposals]);
  useEffect(() => { void fetchPower(); }, [fetchPower]);
  // A vote outcome belongs to the session that cast it.
  useEffect(() => { setVotes({}); }, [subject]);

  const proposals = useMemo(() => rawProposals.map((p) => toProposal(p, subject)), [rawProposals, subject]);

  const castVote = async (proposalId: string, choice: VoteChoice) => {
    // The vote belongs to the session that cast it; a completion that lands
    // after the account changed is not shown to the new account.
    const initiator = subject;
    setVotes((prev) => ({ ...prev, [proposalId]: { submitting: true, error: null, submitted: null } }));
    try {
      const result = await governanceService.castVote({ proposalId, vote: choice });
      if (!isSameSubject(currentAuthSubject(), initiator)) return;
      if (!result.accepted) throw new Error('The governance API did not confirm the vote.');
      setVotes((prev) => ({ ...prev, [proposalId]: { submitting: false, error: null, submitted: choice } }));
      void fetchProposals();
    } catch (err) {
      if (!isSameSubject(currentAuthSubject(), initiator)) return;
      setVotes((prev) => ({
        ...prev,
        [proposalId]: { submitting: false, error: err instanceof Error ? err.message : 'request failed', submitted: null },
      }));
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress sx={{ color: palette.primary }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={<Button size="small" onClick={() => { void fetchProposals(); }}>Retry</Button>}>
        {error}
      </Alert>
    );
  }

  const activeProposals = proposals.filter((p) => p.status === 'active');
  const historical = proposals.filter((p) => p.status === 'passed' || p.status === 'rejected');
  const idle: VoteState = { submitting: false, error: null, submitted: null };

  return (
    <Stack spacing={3}>
      <Stack direction="row" flexWrap="wrap" gap={2}>
        {[
          { label: 'Active Proposals', value: String(activeProposals.length), icon: <VoteIcon />, color: palette.primary },
          {
            label: 'Your Voting Power',
            value: subject && power ? power.totalPower.toLocaleString() : '—',
            icon: <GavelIcon />,
            color: palette.purple,
          },
        ].map((s) => (
          <Card key={s.label} sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 3, flex: 1, minWidth: 170 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography sx={{ color: palette.textSecondary, fontFamily: fontUI, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {s.label}
                </Typography>
                <Box sx={{ color: s.color, opacity: 0.7 }}>{s.icon}</Box>
              </Stack>
              <Typography data-testid={`summary-${s.label}`} sx={{ color: palette.text, fontFamily: fontMono, fontWeight: 700, fontSize: '1.25rem' }}>
                {s.value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Typography sx={{ color: palette.text, fontFamily: fontUI, fontWeight: 600, fontSize: '1.1rem' }}>Active Proposals</Typography>
      {activeProposals.length === 0 ? (
        <Typography sx={{ color: palette.textSecondary, fontFamily: fontUI, fontSize: '0.9rem' }}>No active proposals.</Typography>
      ) : (
        <Stack spacing={2}>
          {activeProposals.map((p) => (
            <ProposalCard
              key={p.id}
              proposal={p}
              canVote={Boolean(subject)}
              voteState={votes[p.id] ?? idle}
              onVote={(choice) => { void castVote(p.id, choice); }}
            />
          ))}
        </Stack>
      )}

      <DelegatePanel
        key={subject ?? 'signed-out'}
        subject={subject}
        power={power}
        powerError={powerError}
        currentDelegate={currentDelegate}
        onDelegated={() => { void fetchPower(); }}
      />

      {historical.length > 0 && (
        <Card sx={{ bgcolor: palette.card, border: `1px solid ${palette.border}`, borderRadius: 3 }}>
          <Box sx={{ p: 2.5, pb: 0 }}>
            <Typography sx={{ color: palette.text, fontFamily: fontUI, fontWeight: 600, fontSize: '1rem' }}>Historical Proposals</Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {['ID', 'Title', 'Outcome', 'Votes For', 'Votes Against'].map((h) => (
                    <TableCell key={h} sx={{ color: palette.textSecondary, fontFamily: fontUI, fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.5, borderColor: palette.border }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {historical.map((p) => (
                  <TableRow key={p.id} sx={{ '& td': { borderColor: palette.border } }}>
                    <TableCell sx={{ color: palette.primary, fontFamily: fontMono, fontSize: '0.8rem' }}>#{p.id}</TableCell>
                    <TableCell sx={{ color: palette.text, fontFamily: fontUI, fontSize: '0.8rem', maxWidth: 300 }}>{p.title}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        icon={p.status === 'passed' ? <PassedIcon sx={{ fontSize: 14 }} /> : <RejectedIcon sx={{ fontSize: 14 }} />}
                        label={p.rawStatus}
                        sx={{
                          bgcolor: p.status === 'passed' ? `${palette.success}20` : `${palette.error}20`,
                          color: p.status === 'passed' ? palette.success : palette.error,
                          fontFamily: fontUI, fontWeight: 500, fontSize: '0.7rem', height: 22, '& .MuiChip-icon': { color: 'inherit' },
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: palette.success, fontFamily: fontMono, fontSize: '0.78rem' }}>{p.yesVotes ?? '—'}</TableCell>
                    <TableCell sx={{ color: palette.error, fontFamily: fontMono, fontSize: '0.78rem' }}>{p.noVotes ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Stack>
  );
};

export default GovernancePanel;
