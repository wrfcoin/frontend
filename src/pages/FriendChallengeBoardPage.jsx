import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { WrfAlert, WrfEmptyState } from '../components/DesignSystem';
import { publicGet } from '../services/publicReadonlyApi';
import { walletCall } from '../services/walletApi';
import { CopyButton, useForecasterThemeVars } from './publicForecastersShared';
import { ChallengeCard, POINTS_NOTE, challengeBoardPath, useSignedInWallet } from './friendChallengesShared';
import './PublicForecastersPage.css';
import './FriendChallengesPage.css';

/**
 * One friend challenge's public board (/challenges/:code; backend#249, demo item 8): the link a player
 * shares. Reads GET /api/challenges/code/<code> with no login. A signed-in wallet that is not in the
 * challenge yet can join from here (POST /api/challenges/join as that wallet).
 */
export default function FriendChallengeBoardPage() {
  const { code: raw } = useParams();
  const code = String(raw ?? '').toUpperCase();
  const path = challengeBoardPath(code);
  const themeVars = useForecasterThemeVars();
  const you = useSignedInWallet();
  const [state, setState] = useState({ loading: Boolean(path), result: null });
  const [notice, setNotice] = useState(null);
  const load = useCallback(() => {
    if (!path) return undefined;
    const controller = new globalThis.AbortController();
    setState(prev => ({ loading: true, result: prev.result }));
    publicGet(path, controller.signal).then(result => setState({ loading: false, result })).catch(() => {});
    return () => controller.abort();
  }, [path]);
  useEffect(() => load(), [load]);

  const join = async () => {
    const result = await walletCall('POST', '/challenges/join', { inviteCode: code });
    if (result.kind === 'ok') { setNotice({ tone: 'success', message: 'Joined. Your readings count from now on.' }); load(); } else {
      setNotice({ tone: 'warning', message: result.kind === 'refused' ? (result.message ?? 'The server refused this.') : 'Could not join right now.' });
    }
  };

  const shell = children => (
    <div className="public-read-page fc-page ch-page" data-testid="friend-challenge-board" style={themeVars}>
      <Link className="fc-back" to="/challenges">← Friend challenges</Link>
      {children}
    </div>
  );
  const { loading, result } = state;
  if (!path || result?.kind === 'not_found') {
    return shell(<WrfEmptyState title="No challenge for this code" description="Check the invite code, or friend challenges are not switched on for this server yet." />);
  }
  if (loading && !result) return shell(<p className="fc-count" role="status">Loading the board…</p>);
  if (result?.kind !== 'ok') {
    return shell(
      <WrfAlert severity="info" role="alert" className="fc-unavailable" actionLabel="Retry" onAction={load}>
        {result?.kind === 'rate_limited' ? 'Too many requests right now. Please wait a moment and try again.' : 'This board is unavailable right now.'}
      </WrfAlert>,
    );
  }
  const challenge = result.data?.challenge;
  if (!challenge) return shell(<WrfEmptyState title="No challenge for this code" description="Check the invite code." />);
  const inIt = you && challenge.participants.some(p => p.id === you);
  const canJoin = you && !inIt && challenge.status !== 'completed';
  const shareUrl = `${globalThis.location?.origin ?? ''}/challenges/${challenge.inviteCode}`;

  return shell(
    <>
      <header className="fc-head">
        <div>
          <h1>{challenge.title}</h1>
          <p className="fc-note">{POINTS_NOTE}</p>
        </div>
      </header>
      <ChallengeCard
        challenge={challenge}
        you={you}
        footer={(
          <span className="ch-share">
            <CopyButton text={shareUrl} label="Copy link to this board" />
            {canJoin ? <button type="button" className="ch-action" onClick={() => void join()}>Join this challenge</button> : null}
            {!you && challenge.status !== 'completed' ? <Link className="fc-guide" to="/wallet">Sign in with your wallet to join</Link> : null}
          </span>
        )}
      />
      {notice ? <WrfAlert severity={notice.tone} role="status" className="ch-notice">{notice.message}</WrfAlert> : null}
    </>,
  );
}
