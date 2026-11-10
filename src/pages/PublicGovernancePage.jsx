import React, { useCallback, useEffect, useState } from 'react';
import { useIsDarkTheme } from '../theme/ThemeProvider';
import { publicPageSurfaceVars } from '../theme/publicPageTheme';
import { Link, useParams } from 'react-router-dom';
import { WrfAlert, WrfBadge, WrfButton, WrfCard, WrfEmptyState } from '../components/DesignSystem';
import {
  bgPrimary, bgSecondary, borders, errorLight, fontFamily, primaryLight,
  radii, success, successLight, textMuted, textPrimary, textSecondary,
} from '../components/DesignSystem/tokens';
import { governanceService } from '../services/governanceService';
import { GOVERNANCE_PAGE_SIZE } from '../services/publicReadonlyApi';
import './PublicGovernancePage.css';

/**
 * Public read-only governance (S4, rebuilt for launch in #558): proposals list and one proposal.
 * Reads only GET /api/governance/proposals?limit&offset and /proposals/<id>. No votes, delegation or writes.
 * No treasury: the chain has none that holds funds, so this page shows no treasury figures.
 */

const TOKEN_VARS = {
  '--pg-bg-primary': bgPrimary,
  '--pg-bg-secondary': bgSecondary,
  '--pg-text': textPrimary,
  '--pg-text-secondary': textSecondary,
  '--pg-text-muted': textMuted,
  '--pg-border': borders.default,
  '--pg-primary-light': primaryLight,
  '--pg-success': success,
  '--pg-success-light': successLight,
  '--pg-error-light': errorLight,
  '--pg-r-lg': `${radii.lg}px`,
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

function votePercents(p) {
  const f = Number(p.votesFor ?? p.forVotes);
  const a = Number(p.votesAgainst ?? p.againstVotes);
  if (![f, a].every(n => Number.isFinite(n) && n >= 0)) return null;
  const total = f + a;
  if (total <= 0) return null;
  return { f: Math.round((f / total) * 100), a: Math.round((a / total) * 100) };
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
            <div className="pg-vnum"><span className="f">For {votes.f}%</span><span className="a">Against {votes.a}%</span></div>
          </>
        ) : <span className="pg-count">—</span>}
      </td>
      <td className="pg-ends pg-hide-phone"><EndsOn value={ends} /></td>
    </tr>
  );
}

const ADVISORY_STATUS = {
  active: { label: 'Voting', badge: 'active' },
  passed: { label: 'Passed (advisory)', badge: 'info' },
  rejected: { label: 'Rejected', badge: 'error' },
  failed_quorum: { label: 'Too few votes', badge: 'neutral' },
};

const count = value => (Number.isSafeInteger(value) && value >= 0 ? value : null);

/** One advisory proposal. Plain text only: React escapes it and the chain refuses control/bidi characters. */
function AdvisoryRow({ p }) {
  const status = ADVISORY_STATUS[String(p.status ?? '')] ?? { label: text(p.status), badge: 'neutral' };
  const yes = count(p.yes_votes);
  const no = count(p.no_votes);
  const eligible = count(p.eligible_count);
  const finalized = count(p.finalized_at_block);
  const deadline = count(p.voting_deadline);
  return (
    <li className="pg-adv-item" data-testid="advisory-proposal">
      <div className="pg-adv-top">
        <span className="pg-title">{text(p.title)}</span>
        <WrfBadge status={status.badge} label={status.label} />
      </div>
      <div className="pg-sub">
        <span>For {yes ?? '—'} · Against {no ?? '—'}</span>
        {eligible !== null ? <span>· {eligible} wallets could vote</span> : null}
        {finalized !== null ? <span>· decided at block {finalized}</span>
          : deadline !== null ? <span>· voting ends at block {deadline}</span> : null}
      </div>
      {p.summary ? (
        <details className="pg-adv-summary">
          <summary>Read the proposal</summary>
          <p>{String(p.summary)}</p>
          <p className="pg-adv-meta">Proposed by <span className="pg-mono">{text(p.proposer)}</span> · {text(p.id)}</p>
        </details>
      ) : null}
    </li>
  );
}

/**
 * Advisory proposals (core4 `advisory_governance`). Shown only once the node reports the feature active or
 * has proposals, so the page says nothing about it before then. A result counts wallets, not people.
 */
function AdvisorySection({ onActive }) {
  const [result, setResult] = useState(null);
  useEffect(() => {
    const controller = new globalThis.AbortController();
    governanceService
      .getAdvisoryProposalsPage(0, GOVERNANCE_PAGE_SIZE, controller.signal)
      .then(r => {
        setResult(r);
        if (r?.kind === 'ok' && r.data.featureActive) onActive(true);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [onActive]);
  if (result?.kind !== 'ok') return null;
  const { featureActive, proposals, total } = result.data;
  if (!featureActive && proposals.length === 0) return null;
  return (
    <WrfCard
      component="section"
      aria-label="Advisory proposals"
      className="pg-section"
      data-testid="advisory-proposals"
      header={<div className="pg-section-head"><h2>Advisory proposals</h2>{total !== null ? <span className="pg-count">{total} total</span> : null}</div>}
    >
      <p className="pg-adv-note">
        Text proposals signed by testnet wallets. A passed proposal is only recorded: nothing it says is carried
        out. Each wallet that held at least 1 WRF when it was proposed gets one vote, so results count wallets,
        not people.
      </p>
      {proposals.length === 0 ? (
        <WrfEmptyState title="No advisory proposals yet" description="Proposals are made with the WRFCoin CLI for now." sx={{ background: 'transparent' }} />
      ) : (
        <ul className="pg-adv-list">
          {proposals.map((p, index) => <AdvisoryRow key={String(p.id ?? index)} p={p} />)}
        </ul>
      )}
    </WrfCard>
  );
}

export function PublicGovernanceListPage() {
  // Light theme: surface/text/border variables come from the light token set; everything else stays.
  const isDark = useIsDarkTheme();
  const themeVars = { ...TOKEN_VARS, ...publicPageSurfaceVars('pg', isDark) };
  const [offset, setOffset] = useState(0);
  const [state, setState] = useState({ loading: true, result: null });
  const [advisoryActive, setAdvisoryActive] = useState(false);
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
          <p className="pg-lede">
            {advisoryActive
              ? 'Read-only view of testnet proposals. Wallets can sign advisory text proposals and vote on them; parameter proposals stay off.'
              : 'Read-only view of testnet proposals. Submitting proposals and voting aren\'t available on testnet yet.'}
          </p>
        </div>
      </header>

      <AdvisorySection onActive={setAdvisoryActive} />

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
                description={advisoryActive
                  ? 'Parameter proposals aren\'t available on testnet. Advisory proposals are listed above.'
                  : 'Submitting proposals isn\'t available on testnet yet.'}
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
