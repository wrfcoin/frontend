import { useSyncExternalStore } from 'react';
import { getAuthToken, subscribeAuthToken } from '../services/authTokenStore';
import { tokenWallet } from '../services/walletApi';
import { When } from './publicForecastersShared';

/**
 * Shared pieces of the friend challenge pages (backend#249, demo item 8). The board is the server's
 * answer formatted, nothing more: counts are readings that landed on chain from stations each wallet owns,
 * and nothing here is paid.
 */

export const INVITE_CODE_RE = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;
export const STATUS_LABEL = { pending: 'Waiting for players', live: 'Live', completed: 'Finished' };
export const POINTS_NOTE = 'Points only: nothing is paid. Counts are readings from stations each wallet owns that landed on chain during the challenge.';

/** The signed-in wallet, from the in-memory login token (display only; the server checks the token). */
export function useSignedInWallet() {
  const token = useSyncExternalStore(subscribeAuthToken, getAuthToken, getAuthToken);
  return token ? tokenWallet(token) : null;
}

export const shortAddress = address => (typeof address === 'string' && address.length > 14 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address ?? '');

export function challengeBoardPath(code) {
  return INVITE_CODE_RE.test(code) ? `/challenges/code/${code}` : null;
}

function Bar({ value, max }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return <span className="ch-bar" aria-hidden="true"><span style={{ width: `${pct}%` }} /></span>;
}

export function ChallengeCard({ challenge, you, footer = null }) {
  const top = Math.max(1, challenge.targetScore ?? 1);
  const teams = challenge.format === 'team'
    ? Object.entries(challenge.participants.reduce((acc, p) => ({ ...acc, [p.teamName || 'No team']: (acc[p.teamName || 'No team'] ?? 0) + p.score }), {}))
    : [];
  return (
    <article className="ch-board" data-testid="challenge-card" aria-label={challenge.title}>
      <header className="ch-board-head">
        <div>
          <h3>{challenge.title}</h3>
          {challenge.description ? <p className="ch-desc">{challenge.description}</p> : null}
        </div>
        <span className={`ch-status ch-status--${challenge.status}`}>{STATUS_LABEL[challenge.status] ?? challenge.status}</span>
      </header>
      <div className="ch-meta">
        <span>{challenge.format === 'team' ? 'Team battle' : 'Head-to-head'}</span>
        <span>First to {challenge.targetScore} {challenge.metricLabel}</span>
        <span>Ends <When value={challenge.endsAt} withTime /></span>
        <span className="ch-code">Code <strong>{challenge.inviteCode}</strong></span>
      </div>
      {teams.length ? (
        <div className="ch-teams" data-testid="challenge-teams">
          {teams.map(([team, score]) => <span key={team}><strong>{team}</strong> {score}</span>)}
        </div>
      ) : null}
      <ol className="ch-players">
        {challenge.participants.map(p => (
          <li key={p.id} className={p.id === you ? 'ch-you' : undefined} data-testid="challenge-player">
            <span className="ch-name">
              {p.name}{p.id === you ? <span className="fc-you"> You</span> : null}
              <span className="ch-sub">{shortAddress(p.id)}{p.teamName ? ` · ${p.teamName}` : ''}{p.stations === 0 ? ' · no station linked to this wallet' : ''}</span>
            </span>
            <Bar value={p.score} max={top} />
            <span className="ch-score">{p.score}</span>
          </li>
        ))}
      </ol>
      <footer className="ch-foot">
        <span>{challenge.scoring?.countedAt ? <>Counted from the chain <When value={challenge.scoring.countedAt} withTime /></> : 'Not counted yet: the first count runs within a few minutes.'}</span>
        {footer}
      </footer>
    </article>
  );
}
