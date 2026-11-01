import { useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import { getAuthToken, subscribeAuthToken } from '../services/authTokenStore';
import { tokenWallet } from '../services/walletApi';
import { When, splitBaseUnits } from './publicForecastersShared';

/**
 * Shared pieces of the free-play duel pages (backend#228/#1424, demo item 10). Formatting only: the
 * verdict, rewards and phases are the server's, which reads them from the chain.
 */
export const DUEL_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export const FREE_PLAY_NOTE = 'Free play: no stakes, nothing is paid for winning. The chain judges: each forecast\'s own reward on chain decides.';
export const PHASE_LABEL = {
  open: 'Waiting for an opponent',
  expired: 'Nobody accepted',
  committing: 'Link forecasts before the lock',
  waiting_for_target: 'Locked: waiting for the target hour',
  judging: 'Waiting for the chain\'s verdict',
  resolved: 'Decided',
  void: 'Void',
};

export function useSignedInWallet() {
  const token = useSyncExternalStore(subscribeAuthToken, getAuthToken, getAuthToken);
  return token ? tokenWallet(token) : null;
}

export const shortAddress = a => (typeof a === 'string' && a.length > 14 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a ?? '');

export function Wrf({ units }) {
  const parts = splitBaseUnits(units);
  if (!parts) return <span className="fc-un">Unavailable</span>;
  return <>{parts.whole}<span className="du-frac">{parts.frac}</span> WRF</>;
}

function Side({ entry, label, you, winner }) {
  if (!entry) {
    return (
      <div className="du-side du-side--empty">
        <div className="du-side-label">{label}</div>
        <div className="du-side-who">Open seat</div>
      </div>
    );
  }
  const temp = entry.forecast?.temperature_c;
  return (
    <div className={`du-side${winner ? ' du-side--won' : ''}`} data-testid="duel-side">
      <div className="du-side-label">{label}{winner ? <span className="du-won"> Winner</span> : null}</div>
      <div className="du-side-who">{shortAddress(entry.address)}{entry.address === you ? <span className="fc-you"> You</span> : null}</div>
      <dl className="du-facts">
        <dt>Forecast</dt><dd>{entry.commitId ? (entry.recordVerified ? 'Linked and proven' : 'Linked') : 'Not linked yet'}</dd>
        <dt>Temperature</dt><dd>{typeof temp === 'number' ? `${temp.toFixed(1)} °C` : <span className="fc-un">{entry.commitId ? 'Hidden until revealed' : '—'}</span>}</dd>
        <dt>Chain reward</dt><dd>{entry.chainReward ? <><Wrf units={entry.chainReward} />{entry.chainRewardFinalized ? '' : ' (not final)'}</> : <span className="fc-un">Not decided yet</span>}</dd>
      </dl>
      {entry.invalidReason ? <p className="du-invalid">Entry not valid: {entry.invalidReason.replace(/_/g, ' ')}</p> : null}
    </div>
  );
}

export function DuelCard({ duel, you, link = true }) {
  const winner = duel.outcome?.winner ?? null;
  return (
    <article className="du-board" data-testid="duel-card" aria-label={`Duel on ${duel.stationAlias}`}>
      <header className="du-board-head">
        <div>
          <h3>{link ? <Link to={`/duels/${duel.id}`}>Station {duel.stationAlias}</Link> : <>Station {duel.stationAlias}</>}</h3>
          <div className="du-meta">
            <span>Target hour <When value={duel.targetAt} withTime /></span>
            <span>Lock <When value={duel.lockAt} withTime /></span>
          </div>
        </div>
        <span className={`du-phase du-phase--${duel.phase}`}>{PHASE_LABEL[duel.phase] ?? duel.phase}</span>
      </header>
      <div className="du-sides">
        <Side entry={duel.creator} label="Challenger" you={you} winner={winner && winner === duel.creator?.address} />
        <span className="du-vs" aria-hidden="true">vs</span>
        <Side entry={duel.opponent} label="Opponent" you={you} winner={winner && winner === duel.opponent?.address} />
      </div>
      {duel.outcome ? (
        <p className="du-outcome" data-testid="duel-outcome">
          <strong>{duel.outcome.result === 'draw' ? 'Draw' : duel.outcome.result === 'void' ? 'Void' : 'Decided'}.</strong> {duel.outcome.note}
        </p>
      ) : null}
      {duel.invitedOpponent ? <p className="du-note">Invited: {shortAddress(duel.invitedOpponent)}</p> : null}
    </article>
  );
}
