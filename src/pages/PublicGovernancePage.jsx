import React, { useCallback, useEffect, useState } from 'react';
import { useIsDarkTheme } from '../theme/ThemeProvider';
import { publicPageSurfaceVars } from '../theme/publicPageTheme';
import { Link, useParams } from 'react-router-dom';
import { WrfAlert, WrfBadge, WrfButton, WrfCard, WrfEmptyState, WrfStatCard } from '../components/DesignSystem';
import {
  accentPurple, bgPrimary, bgSecondary, borders, categoryColors, errorLight, fontFamily, glows, primary, primaryLight,
  radii, shadows, success, successLight, textMuted, textPrimary, textSecondary,
} from '../components/DesignSystem/tokens';
import { governanceService } from '../services/governanceService';
import { GOVERNANCE_PAGE_SIZE } from '../services/publicReadonlyApi';
import { declaredWrfAmount, groupThousands, undeclaredReason } from '../utils/declaredWrfAmount';
import './PublicGovernancePage.css';

/**
 * Public read-only governance (S4, rebuilt for launch in #558): proposals list, one proposal, treasury summary.
 * Reads only GET /api/governance/proposals?limit&offset, /proposals/<id> and /treasury (the three admitted
 * edge matchers). No votes, delegation or writes: those stay in the signed-in app. Treasury figures are shown
 * as WRF only when the node declares their units (same rule as the app); otherwise the reason is shown.
 */

// Voting happens in the WRFCoin app. Until the Android release (mobile#443) is published this points at
// onboarding, which explains how to get the app.
export const VOTE_IN_APP_HREF = '/onboarding';

const TOKEN_VARS = {
  '--pg-bg-primary': bgPrimary,
  '--pg-bg-secondary': bgSecondary,
  '--pg-text': textPrimary,
  '--pg-text-secondary': textSecondary,
  '--pg-text-muted': textMuted,
  '--pg-border': borders.default,
  '--pg-primary-light': primaryLight,
  '--pg-purple-dark': '#7C3AED',
  '--pg-success': success,
  '--pg-success-light': successLight,
  '--pg-error-light': errorLight,
  '--pg-r-lg': `${radii.lg}px`,
  '--pg-shadow-md': shadows.md,
  '--pg-shadow-lg': shadows.lg,
  '--pg-glow-purple': glows.mining,
  '--pg-font': fontFamily.display,
  '--pg-mono': fontFamily.mono,
};

const text = value => (value === null || value === undefined || value === '' ? '—' : String(value));

/**
 * Local date for a reported time: "Oct 25" (with the year when it differs), or with `withTime`
 * "Oct 25, 2026, 3:34 AM"; "—" when missing, the raw text when unparseable. Epoch s/ms accepted.
 */
function EndsOn({ value, withTime = false }) {
  if (value === null || value === undefined || value === '') return <>—</>;
  const ms = typeof value === 'number' ? (value < 1e12 ? value * 1000 : value) : Date.parse(String(value));
  if (!Number.isFinite(ms)) return <>{text(value)}</>;
  const date = new Date(ms);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  const label = withTime
    ? date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : date.toLocaleDateString(undefined, sameYear ? { month: 'short', day: 'numeric' } : { year: 'numeric', month: 'short', day: 'numeric' });
  return <time dateTime={date.toISOString()} title={date.toLocaleString()}>{label}</time>;
}

const STATUS_BADGE = { active: 'active', open: 'active', passed: 'info', succeeded: 'info', executed: 'info', rejected: 'error', defeated: 'error', failed: 'error', pending: 'warning', queued: 'warning' };
function StatusBadge({ status }) {
  if (status === null || status === undefined || status === '') return null;
  const key = String(status).toLowerCase();
  return <WrfBadge status={STATUS_BADGE[key] ?? 'neutral'} label={String(status)} />;
}

function Unavailable({ result, what, onRetry }) {
  const limited = result?.kind === 'rate_limited';
  return (
    <WrfAlert
      severity={limited ? 'warning' : 'info'}
      role="alert"
      className="pg-unavailable"
      actionLabel={onRetry ? 'Retry' : undefined}
      onAction={onRetry}
    >
      {limited ? 'Too many requests. Please wait a moment and try again.' : `${what} unavailable right now.`}
    </WrfAlert>
  );
}

/** "1,250,000" + ".00000000 WRF" split for the big figure; null when the units are not declared. */
function splitWrf(declared) {
  if (!declared) return null;
  const [amount] = declared.split(' ');
  const grouped = groupThousands(amount);
  const dot = grouped.indexOf('.');
  return dot === -1 ? { whole: grouped, frac: '' } : { whole: grouped.slice(0, dot), frac: grouped.slice(dot) };
}

function Treasury() {
  const [state, setState] = useState({ loading: true, result: null });
  const load = useCallback(() => {
    const controller = new globalThis.AbortController();
    setState({ loading: true, result: null });
    governanceService
      .getTreasurySummary(controller.signal)
      .then(result => setState({ loading: false, result }))
      .catch(() => {});
    return () => controller.abort();
  }, []);
  useEffect(() => load(), [load]);
  const { loading, result } = state;

  if (loading) {
    return (
      <section className="pg-treasury pg-treasury--plain" aria-label="Treasury" data-testid="public-treasury">
        <p className="pg-treasury__label">DAO treasury</p>
        <p className="pg-treasury__value pg-treasury__value--un" role="status">Loading treasury…</p>
      </section>
    );
  }
  if (result?.kind !== 'ok') {
    return (
      <section className="pg-treasury pg-treasury--plain" aria-label="Treasury" data-testid="public-treasury">
        <p className="pg-treasury__label">DAO treasury</p>
        <p className="pg-treasury__value pg-treasury__value--un">Balance unavailable</p>
        <Unavailable result={result} what="Treasury summary" onRetry={load} />
      </section>
    );
  }

  const { balance, totalDeposits, totalWithdrawals, transactionCount, amountUnits } = result.data;
  const declared = {
    balance: declaredWrfAmount(balance, amountUnits, 'balance'),
    totalDeposits: declaredWrfAmount(totalDeposits, amountUnits, 'totalDeposits'),
    totalWithdrawals: declaredWrfAmount(totalWithdrawals, amountUnits, 'totalWithdrawals'),
  };
  const reason = undeclaredReason(amountUnits);
  const big = splitWrf(declared.balance);
  // Integer large, fraction + unit smaller (the wallet stat cards' split), so a full 8-decimal
  // figure fits the card at 1440 and 390 instead of clipping at the card edge.
  const statValue = key => {
    const parts = splitWrf(declared[key]);
    return parts
      ? <span className="pg-stat-value">{parts.whole}<small>{parts.frac} WRF</small></span>
      : <span className="pg-stat-value pg-stat-value--un">Not declared</span>;
  };

  return (
    <div className="pg-top" data-testid="public-treasury">
      <section className={`pg-treasury${big ? '' : ' pg-treasury--plain'}`} aria-label="Treasury">
        <p className="pg-treasury__label">DAO treasury</p>
        {big ? (
          <p className="pg-treasury__value">{big.whole}<span className="frac">{big.frac}</span>{' '}<span className="sym">WRF</span></p>
        ) : (
          <p className="pg-treasury__value pg-treasury__value--un">Balance not declared</p>
        )}
        <p className="pg-treasury__sub">{big ? 'Balance reported by the node' : `Reported figure ${text(balance)}. ${reason}`}</p>
      </section>
      <div className="pg-stats">
        <WrfStatCard label="Total deposits" value={statValue('totalDeposits')} color={categoryColors.governance} />
        <WrfStatCard label="Total withdrawals" value={statValue('totalWithdrawals')} color={accentPurple} />
        <WrfStatCard label="Transactions" value={<span className="pg-stat-value">{Number.isFinite(transactionCount) ? transactionCount : '—'}</span>} color={primary} />
      </div>
    </div>
  );
}

function votePercents(p) {
  const f = Number(p.votesFor ?? p.forVotes);
  const a = Number(p.votesAgainst ?? p.againstVotes);
  const ab = Number(p.votesAbstain ?? p.abstainVotes ?? 0);
  if (![f, a, ab].every(n => Number.isFinite(n) && n >= 0)) return null;
  const total = f + a + ab;
  if (total <= 0) return null;
  return { f: Math.round((f / total) * 100), a: Math.round((a / total) * 100), ab: Math.round((ab / total) * 100) };
}

function ProposalRow({ p }) {
  const id = p.id ?? p.proposalId;
  const title = text(p.title ?? (id !== undefined && id !== null ? `Proposal ${id}` : null));
  const votes = votePercents(p);
  const ends = p.votingEndTime ?? p.endTime ?? null;
  const type = p.proposalType ?? p.type ?? null;
  return (
    <tr>
      <td className="pg-id">{id !== undefined && id !== null ? `#${id}` : '—'}</td>
      <td>
        {id !== undefined && id !== null ? (
          <Link className="pg-title" to={`/governance/public/${encodeURIComponent(String(id))}`}>{title}</Link>
        ) : <span className="pg-title">{title}</span>}
        <div className="pg-sub">
          {type ? <span>{String(type)}</span> : null}
          {p.proposer ? <span>· proposed by {String(p.proposer)}</span> : null}
          <span className="pg-only-phone-status"><StatusBadge status={p.status} /></span>
        </div>
      </td>
      <td className="pg-hide-phone"><StatusBadge status={p.status} /></td>
      <td className="pg-votes pg-hide-phone">
        {votes ? (
          <>
            <div className="pg-vbar"><span style={{ width: `${votes.f}%` }} /></div>
            <div className="pg-vnum"><span className="f">For {votes.f}%</span><span className="a">Against {votes.a}%</span><span className="ab">Abstain {votes.ab}%</span></div>
          </>
        ) : <span className="pg-count">—</span>}
      </td>
      <td className="pg-ends pg-hide-phone"><EndsOn value={ends} /></td>
    </tr>
  );
}

export function PublicGovernanceListPage() {
  // Light theme: surface/text/border variables come from the light token set; everything else stays.
  const isDark = useIsDarkTheme();
  const themeVars = { ...TOKEN_VARS, ...publicPageSurfaceVars('pg', isDark) };
  const [offset, setOffset] = useState(0);
  const [state, setState] = useState({ loading: true, result: null });
  const load = useCallback(() => {
    const controller = new globalThis.AbortController();
    setState({ loading: true, result: null });
    governanceService
      .getProposalsPage(offset, GOVERNANCE_PAGE_SIZE, controller.signal)
      .then(result => setState({ loading: false, result }))
      .catch(() => {});
    return () => controller.abort();
  }, [offset]);
  useEffect(() => load(), [load]);
  const { loading, result } = state;
  const proposals = result?.kind === 'ok' ? result.data.proposals : [];
  const total = result?.kind === 'ok' ? result.data.total : null;
  const hasMore = result?.kind === 'ok' && result.data.hasMore !== null ? result.data.hasMore : proposals.length >= GOVERNANCE_PAGE_SIZE;
  const first = offset + 1;
  const last = offset + proposals.length;
  const pageNumber = Math.floor(offset / GOVERNANCE_PAGE_SIZE) + 1;

  return (
    <div className="public-read-page pg-page" data-testid="public-governance" style={themeVars}>
      <header className="pg-head">
        <div>
          <h1>Governance</h1>
          <p className="pg-lede">Read-only view of testnet proposals and the treasury. Voting happens in the WRFCoin app.</p>
        </div>
        <div className="pg-vote">
          <WrfButton component={Link} to={VOTE_IN_APP_HREF} variant="outline">Vote in the app</WrfButton>
          <p className="pg-vote__note">Get the WRFCoin app to vote on proposals.</p>
        </div>
      </header>

      <Treasury />

      <WrfCard
        component="section"
        aria-label="Proposals"
        className="pg-section"
        header={<div className="pg-section-head"><h2>Proposals</h2>{!loading && result?.kind === 'ok' && total !== null ? <span className="pg-count">{total} total</span> : null}</div>}
        noPadding
      >
        {loading ? (
          <p className="pg-count" role="status" style={{ margin: 0, padding: '16px 20px' }}>Loading proposals…</p>
        ) : result?.kind !== 'ok' ? (
          <Unavailable result={result} what="Proposals" onRetry={load} />
        ) : proposals.length === 0 ? (
          <div className="pg-empty-wrap">
            {offset === 0 ? (
              <WrfEmptyState
                title="No proposals yet"
                description="Proposals submitted from the WRFCoin app will appear here with their status and vote totals."
                sx={{ background: 'transparent' }}
              />
            ) : (
              <WrfEmptyState title="No more proposals" description="You have reached the end of the list." sx={{ background: 'transparent' }} />
            )}
          </div>
        ) : (
          <table className="pg-table">
            <thead>
              <tr><th className="pg-id">ID</th><th>Proposal</th><th className="pg-hide-phone">Status</th><th className="pg-votes pg-hide-phone">Votes</th><th className="pg-hide-phone">Ends</th></tr>
            </thead>
            <tbody>{proposals.map((p, index) => <ProposalRow key={String(p.id ?? p.proposalId ?? index)} p={p} />)}</tbody>
          </table>
        )}
        <div className="pg-foot">
          <span>
            {loading || result?.kind !== 'ok' || proposals.length === 0 ? ''
              : total !== null ? `Showing ${first}–${last} of ${total} proposals` : `Showing ${first}–${last}`}
          </span>
          <div className="pg-pager">
            <WrfButton variant="outline" size="sm" disabled={offset === 0 || loading} onClick={() => setOffset(Math.max(0, offset - GOVERNANCE_PAGE_SIZE))}>Previous</WrfButton>
            <span className="pg-pager__page">Page {pageNumber}</span>
            <WrfButton variant="outline" size="sm" disabled={loading || !hasMore} onClick={() => setOffset(offset + GOVERNANCE_PAGE_SIZE)}>Next</WrfButton>
          </div>
        </div>
      </WrfCard>
    </div>
  );
}

export function PublicGovernanceProposalPage() {
  // Light theme: surface/text/border variables come from the light token set; everything else stays.
  const isDark = useIsDarkTheme();
  const themeVars = { ...TOKEN_VARS, ...publicPageSurfaceVars('pg', isDark) };
  const { proposalId } = useParams();
  const [state, setState] = useState({ loading: true, result: null });
  const load = useCallback(() => {
    const controller = new globalThis.AbortController();
    setState({ loading: true, result: null });
    governanceService
      .getPublicProposal(String(proposalId ?? ''), controller.signal)
      .then(result => setState({ loading: false, result }))
      .catch(() => {});
    return () => controller.abort();
  }, [proposalId]);
  useEffect(() => load(), [load]);
  const { loading, result } = state;
  const proposal = result?.kind === 'ok' ? result.data.proposal : null;
  const notFound = result?.kind === 'not_found' || (result?.kind === 'ok' && !proposal);

  return (
    <div className="public-read-page pg-page pg-detail" data-testid="public-governance-proposal" style={themeVars}>
      <Link className="pg-back" to="/governance/public">← All proposals</Link>
      {loading ? <p className="pg-count" role="status">Loading proposal…</p> : notFound ? (
        <WrfEmptyState variant="search" title="Proposal not found." description="There is no proposal with this id on the testnet." />
      ) : result?.kind !== 'ok' ? (
        <Unavailable result={result} what="Proposal" onRetry={load} />
      ) : (
        <WrfCard component="section" aria-label="Proposal">
          <h1>{text(proposal.title ?? `Proposal ${proposalId}`)}</h1>
          <dl className="pg-kv">
            <dt>Status</dt><dd><StatusBadge status={proposal.status} /> {proposal.status ? null : '—'}</dd>
            <dt>Proposer</dt><dd>{text(proposal.proposer)}</dd>
            {proposal.description ? (<><dt>Description</dt><dd>{String(proposal.description)}</dd></>) : null}
            {proposal.votingStartTime ?? proposal.startTime ? (<><dt>Voting starts</dt><dd><EndsOn value={proposal.votingStartTime ?? proposal.startTime} withTime /></dd></>) : null}
            {proposal.votingEndTime ?? proposal.endTime ? (<><dt>Voting ends</dt><dd><EndsOn value={proposal.votingEndTime ?? proposal.endTime} withTime /></dd></>) : null}
          </dl>
        </WrfCard>
      )}
    </div>
  );
}

export default PublicGovernanceListPage;
