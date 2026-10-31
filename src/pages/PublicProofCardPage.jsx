import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { WrfAlert, WrfCard, WrfEmptyState } from '../components/DesignSystem';
import { proofCardPath, proofPagePath, publicGet } from '../services/publicReadonlyApi';
import { CopyButton, When, splitBaseUnits, useForecasterThemeVars } from './publicForecastersShared';
import ReadingUnusualCheck from '../components/Wolfram/ReadingUnusualCheck';
import './PublicForecastersPage.css';
import './PublicProofCardPage.css';

/**
 * Public proof card for one station reading (/proof/:commitId[?h=<height>]; backend#229, owner demo
 * queue 2026-11-01): "a person shares a station reading and the link opens a public card that shows the
 * block it landed in".
 *
 * Reads GET /api/proofs/<commit id>[?h=<height>] only. The backend builds the card from the chain node
 * (the reveal transaction found in its block, that block's hash and producer, the node's own reward
 * verdict). Nothing is computed here beyond formatting: a field the server sends as null is shown as
 * "Unavailable", and a reading the server could not place in a block says so instead of guessing.
 */

const UNAVAILABLE = 'Unavailable';
const short = (hex, head = 10, tail = 8) => (typeof hex === 'string' && hex.length > head + tail + 1 ? `${hex.slice(0, head)}…${hex.slice(-tail)}` : hex ?? UNAVAILABLE);
const num = (value, digits, unit) => (typeof value === 'number' && Number.isFinite(value) ? `${value.toFixed(digits)}${unit}` : '—');
const height = value => (Number.isSafeInteger(value) ? value.toLocaleString('en-US') : UNAVAILABLE);

function Wrf({ units }) {
  const parts = splitBaseUnits(units);
  if (!parts) return <>{UNAVAILABLE}</>;
  return <>{parts.whole}<span className="pc-frac">{parts.frac}</span> WRF</>;
}

function Row({ label, children, mono = false }) {
  return (
    <>
      <dt>{label}</dt>
      <dd className={mono ? 'pc-mono' : undefined}>{children}</dd>
    </>
  );
}

function rewardLine(reward) {
  switch (reward?.status) {
  case 'paid': return reward.rewarded ? 'Paid' : 'Paid, still settling';
  case 'pending_quorum': return 'Waiting for attesters';
  case 'finalized_zero': return 'Decided, no payment';
  case 'excluded_non_real': return 'Not paid: not a real station reading';
  case 'not_evaluated': return 'Not decided yet';
  default: return UNAVAILABLE;
  }
}

function attestationLine(card) {
  const a = card.attestation;
  if (a) {
    const of = Number.isSafeInteger(a.quorum) ? ` of ${a.quorum} needed` : '';
    return a.hasQuorum ? `Confirmed by ${a.approvals} attester${a.approvals === 1 ? '' : 's'}${of}` : `${a.approvals} attester${a.approvals === 1 ? '' : 's'} so far${of}`;
  }
  // The node drops attestation records once the reward decision is final; a final decision means quorum was reached.
  if (card.reward?.finalized) return 'Confirmed (reward decision is final)';
  return UNAVAILABLE;
}

function ShareBar({ url }) {
  const [shared, setShared] = useState('');
  const canShare = typeof globalThis.navigator?.share === 'function';
  const share = () => {
    globalThis.navigator.share({ title: 'WRFCoin station reading', text: 'A weather reading recorded on the WRFCoin testnet', url })
      .then(() => setShared('Shared'), () => {});
  };
  return (
    <div className="pc-share" data-testid="proof-share">
      {canShare ? <button type="button" className="pc-share-action" onClick={share}>Share</button> : null}
      <CopyButton text={url} label="Copy link to this card" />
      <span className="pc-share-url pc-mono" title={url}>{url}</span>
      {shared ? <span role="status" className="fc-count">{shared}</span> : null}
    </div>
  );
}

export default function PublicProofCardPage() {
  const { commitId } = useParams();
  const { search } = useLocation();
  const hint = new globalThis.URLSearchParams(search).get('h');
  const themeVars = useForecasterThemeVars();
  const path = proofCardPath(String(commitId ?? ''), hint);
  const [state, setState] = useState({ loading: Boolean(path), result: null });
  const load = useCallback(() => {
    if (!path) return undefined;
    const controller = new globalThis.AbortController();
    setState({ loading: true, result: null });
    publicGet(path, controller.signal)
      .then(result => setState({ loading: false, result }))
      .catch(() => {});
    return () => controller.abort();
  }, [path]);
  useEffect(() => load(), [load]);

  const shell = children => (
    <div className="public-read-page fc-page pc-page" data-testid="public-proof-card" style={themeVars}>
      <Link className="fc-back" to="/explore">← Explore the testnet</Link>
      {children}
    </div>
  );

  const { loading, result } = state;
  if (!path || result?.kind === 'not_found') {
    return shell(
      <WrfEmptyState
        title="No proof card for this link"
        description="The chain has no station reading with this id. The link may be incomplete, or proof cards are not switched on for this server yet."
      />,
    );
  }
  if (loading || !result) return shell(<p className="fc-count" role="status">Reading the chain…</p>);
  if (result.kind !== 'ok') {
    const busy = result.kind === 'rate_limited' || (result.kind === 'error' && result.status === 503);
    return shell(
      <WrfAlert severity={busy ? 'warning' : 'info'} role="alert" className="fc-unavailable" actionLabel="Retry" onAction={load}>
        {busy ? 'Too many requests right now. Please wait a moment and try again.' : 'Proof cards are unavailable right now: the chain node could not answer.'}
      </WrfAlert>,
    );
  }

  const card = result.data ?? {};
  const reading = card.reading;
  const block = card.inclusion?.block;
  const included = card.inclusion?.status === 'included' && block;
  const pagePath = proofPagePath(card.commitId ?? String(commitId), included ? block.height : hint);
  const shareUrl = `${globalThis.location?.origin ?? ''}${pagePath ?? ''}`;

  return shell(
    <>
      <header className="fc-head">
        <div>
          <h1>Station reading on chain</h1>
          <p className="fc-lede">
            A weather station sent this reading to the WRFCoin testnet. Everything on this card is read from the chain node:
            the reading from its transaction, the block it landed in, and the attesters&apos; and reward decisions.
          </p>
        </div>
      </header>

      <WrfCard component="section" aria-label="The reading" className="fc-section pc-reading" noPadding>
        <div className="pc-top">
          <div>
            <div className="pc-kicker">Reading</div>
            <div className="pc-when">{reading ? <When value={reading.observedAt} withTime /> : UNAVAILABLE}</div>
            {card.stationAlias ? (
              <Link className="fc-guide" to={`/weather/station/${card.stationAlias}`}>Station {card.stationAlias}</Link>
            ) : <span className="fc-un">Station {UNAVAILABLE.toLowerCase()}</span>}
          </div>
          <div className={`pc-pill pc-pill--${included ? 'in' : 'out'}`} data-testid="proof-inclusion">
            {included ? `In block ${height(block.height)}` : card.inclusion?.status === 'not_revealed' ? 'Not revealed yet' : 'Block not located'}
          </div>
        </div>
        {reading ? (
          <div className="pc-values" data-testid="proof-values">
            <div><span>Temperature</span><strong>{num(reading.temperatureC, 1, ' °C')}</strong></div>
            <div><span>Humidity</span><strong>{num(reading.humidityPct, 0, ' %')}</strong></div>
            <div><span>Pressure</span><strong>{num(reading.pressureHpa, 1, ' hPa')}</strong></div>
            <div><span>Wind</span><strong>{num(reading.windSpeedMs, 1, ' m/s')}</strong></div>
            <div><span>Rain</span><strong>{num(reading.precipitationMm, 1, ' mm')}</strong></div>
            <div><span>Dew point</span><strong>{num(reading.dewpointC, 1, ' °C')}</strong></div>
          </div>
        ) : (
          <p className="pc-missing" role="note">
            {card.inclusion?.status === 'not_revealed'
              ? 'The station has committed to this reading but not revealed it yet. The values appear once the reveal is in a block.'
              : 'The chain knows this reading, but its block is older than the window this server searches. A share link that includes the block height (?h=) opens it directly.'}
          </p>
        )}
        <div className="pc-foot">
          <span>{reading?.provenanceClass === 'real' ? 'Real station' : reading?.provenanceClass ? `Provenance: ${reading.provenanceClass}` : 'Provenance unavailable'}</span>
          <span>{attestationLine(card)}</span>
        </div>
      </WrfCard>

      {reading ? (
        <ReadingUnusualCheck stationAlias={card.stationAlias} observedAt={reading.observedAt} temperatureC={reading.temperatureC} />
      ) : null}

      <div className="fc-grid-2 pc-grid">
        <WrfCard component="section" aria-label="Block" className="fc-section" header={<div className="fc-section-head"><h2>The block it landed in</h2></div>} noPadding>
          {included ? (
            <dl className="fc-kv" data-testid="proof-block">
              <Row label="Height">{height(block.height)}</Row>
              <Row label="Block hash" mono>
                {block.hash ? <><span title={block.hash}>{short(block.hash)}</span> <CopyButton text={block.hash} label="Copy block hash" /></> : UNAVAILABLE}
              </Row>
              <Row label="Block time">{block.timestamp ? <When value={block.timestamp} withTime /> : UNAVAILABLE}</Row>
              <Row label="Final">{block.finalized === true ? 'Yes' : block.finalized === false ? 'Not yet' : UNAVAILABLE}</Row>
              <Row label="Producer key" mono>{block.producerPubkey ? <span title={block.producerPubkey}>{short(block.producerPubkey)}</span> : UNAVAILABLE}</Row>
            </dl>
          ) : (
            <p className="fc-placeholder">{card.inclusion?.status === 'not_revealed' ? 'Not in a block yet.' : 'Not located in the searched blocks.'}</p>
          )}
        </WrfCard>
        <WrfCard component="section" aria-label="Reward" className="fc-section" header={<div className="fc-section-head"><h2>Reward</h2></div>} noPadding>
          <dl className="fc-kv" data-testid="proof-reward">
            <Row label="Status">{rewardLine(card.reward)}</Row>
            <Row label="Amount">{card.reward?.amountBaseUnits ? <Wrf units={card.reward.amountBaseUnits} /> : '—'}</Row>
            <Row label="Paid in block">{card.reward?.block ? height(card.reward.block.height) : '—'}</Row>
            <Row label="Network">{[card.chain?.networkId, card.chain?.chainId ? `chain ${card.chain.chainId}` : null].filter(Boolean).join(' · ') || UNAVAILABLE}</Row>
            <Row label="Genesis" mono>{card.chain?.genesisHash ? <span title={card.chain.genesisHash}>{short(card.chain.genesisHash)}</span> : UNAVAILABLE}</Row>
          </dl>
        </WrfCard>
      </div>

      <WrfCard component="section" aria-label="Share" className="fc-section" header={<div className="fc-section-head"><h2>Share this reading</h2></div>} noPadding>
        <ShareBar url={shareUrl} />
        <div className="fc-foot">
          <span className="pc-mono" title={card.commitId}>Commit {short(card.commitId, 12, 8)}</span>
          <span>As of chain height {height(card.chain?.height)}</span>
        </div>
      </WrfCard>
    </>,
  );
}
