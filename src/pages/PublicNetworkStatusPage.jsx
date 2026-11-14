import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { WrfAlert, WrfCard, WrfEmptyState } from '../components/DesignSystem';
import { NETWORK_STATUS_PATH, publicGet } from '../services/publicReadonlyApi';
import { When, useForecasterThemeVars } from './publicForecastersShared';
import './PublicForecastersPage.css';
import './PublicNetworkStatusPage.css';

/**
 * Network status (/status; owner decision 2026-11-01): the public view of "is the testnet working?", in the
 * site's own style. Grafana and Prometheus stay a private operator cockpit; this page shows only the few
 * safe numbers GET /api/public/network-status gives: block pace against the ~77 s cadence, producers online
 * by their public label, the node's peer count, the newest paid node-pay epoch and scheduled upgrades.
 *
 * Honesty rules as on /nodes: a section the node could not answer says so; a value it did not give is never
 * shown as zero. The page reads again every 60 s (the backend's snapshot interval).
 *
 * Freshness: a refresh that fails keeps the last good numbers but marks them stale with the time of that
 * reading, and the verdict stops claiming anything about the chain right now (lost connectivity is not a
 * chain outage). A later 404 means the read was switched off: "Not switched on yet". The block age is the
 * snapshot's own age (lastBlockAgeSeconds as of checkedAt), plus how old the snapshot already was when it
 * arrived (bounded, see snapshotBlockAge), plus time since it arrived.
 */

const REFRESH_MS = 60_000;
const TICK_MS = 5_000;
const UNAVAILABLE = 'Unavailable';
/**
 * Clock-skew policy: the viewer's clock is trusted for time since the response arrived; how old the
 * snapshot was on arrival (receipt - checkedAt) is clamped to [0, MAX_ARRIVAL_DELAY_S] (backend snapshot 60 s
 * + edge cache 30 s, with margin), so a wrong viewer clock can neither hide nor invent a stall.
 */
export const MAX_ARRIVAL_DELAY_S = 300;
const n = value => (Number.isSafeInteger(value) ? value.toLocaleString('en-US') : '—');

/** "40 s", "2 min 34 s", "12 min", "3 h 5 min", "2 days". */
export function duration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '—';
  const s = Math.round(seconds);
  if (s < 90) return `${s} s`;
  if (s < 600) return s % 60 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${s / 60} min`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 48) return m % 60 ? `${h} h ${m % 60} min` : `${h} h`;
  return `${Math.round(h / 24)} days`;
}

/** "governance_proposals" -> "Governance proposals". */
const featureName = f => (typeof f === 'string' && f ? f.charAt(0).toUpperCase() + f.slice(1).replace(/_/g, ' ') : '—');

/** Health from the age of the newest block against the cadence. */
export function verdict(ageSeconds, target) {
  if (!Number.isFinite(ageSeconds) || !Number.isFinite(target)) return { tone: 'unknown', title: 'Status unknown', body: 'The chain node did not say when the newest block was made.' };
  if (ageSeconds <= target * 3) return { tone: 'ok', title: 'Making blocks', body: `A new block about every ${target} seconds, as planned.` };
  if (ageSeconds <= 15 * 60) return { tone: 'warn', title: 'Slower than usual', body: `No block for ${duration(ageSeconds)}; blocks normally come every ${target} seconds.` };
  return { tone: 'bad', title: 'Not making blocks', body: `No new block for ${duration(ageSeconds)}. Transactions sent now wait until blocks resume.` };
}

const parseTime = value => (typeof value === 'string' ? Date.parse(value) : NaN);

/** Age in seconds of the newest block at `now`, from the snapshot itself rather than from receipt time. */
export function snapshotBlockAge(data, receivedAt, now) {
  const b = data?.blocks?.status === 'ok' ? data.blocks : null;
  if (!b) return NaN;
  const checkedAt = parseTime(data.checkedAt);
  let base = Number.isFinite(b.lastBlockAgeSeconds) ? b.lastBlockAgeSeconds : NaN;
  if (!Number.isFinite(base)) {
    const lastBlockAt = parseTime(b.lastBlockAt);
    if (Number.isFinite(lastBlockAt) && Number.isFinite(checkedAt)) base = Math.max(0, (checkedAt - lastBlockAt) / 1000);
  }
  if (!Number.isFinite(base)) return NaN;
  const arrivalDelay = Number.isFinite(checkedAt) ? Math.min(MAX_ARRIVAL_DELAY_S, Math.max(0, (receivedAt - checkedAt) / 1000)) : 0;
  return base + arrivalDelay + Math.max(0, (now - receivedAt) / 1000);
}

function SectionUnavailable({ what }) {
  return <p className="fc-placeholder" role="note">{what} {UNAVAILABLE.toLowerCase()}: the chain node did not answer this part.</p>;
}

function Tile({ label, value, sub, testId }) {
  return (
    <div className="ns-tile" data-testid={testId}>
      <dt>{label}</dt>
      <dd>{value}</dd>
      {sub ? <span className="ns-tile-sub">{sub}</span> : null}
    </div>
  );
}

function pace(produced, expected) {
  if (!Number.isSafeInteger(produced)) return { value: UNAVAILABLE, sub: null };
  const pct = expected > 0 ? Math.round((produced / expected) * 100) : null;
  return { value: n(produced), sub: `of ~${n(expected)} expected${pct === null ? '' : ` · ${pct}%`}` };
}

function nodePayTile(nodePay) {
  if (nodePay?.status === 'partial') {
    const unread = Array.isArray(nodePay.epochsUnread) ? nodePay.epochsUnread : [];
    return {
      value: 'Partly checked',
      sub: `could not read epoch${unread.length === 1 ? '' : 's'} ${unread.map(n).join(', ')}; now epoch ${n(nodePay.currentEpoch)}`,
    };
  }
  if (nodePay?.status !== 'ok') return { value: UNAVAILABLE, sub: null };
  if (nodePay.lastPaidEpoch === null) return { value: 'None recently', sub: `no paid epoch in the last ${nodePay.epochsScanned.length}; now epoch ${n(nodePay.currentEpoch)}` };
  return { value: `Epoch ${n(nodePay.lastPaidEpoch)} paid`, sub: `now epoch ${n(nodePay.currentEpoch)}` };
}

function Summary({ d, age, stale }) {
  const b = d.blocks?.status === 'ok' ? d.blocks : null;
  const p = d.producers?.status === 'ok' ? d.producers : null;
  const net = d.network?.status === 'ok' ? d.network : null;
  const pay = nodePayTile(d.nodePay);
  const hour = b ? pace(b.lastHour.produced, b.lastHour.expected) : { value: UNAVAILABLE };
  const day = b ? pace(b.lastDay.produced, b.lastDay.expected) : { value: UNAVAILABLE };
  if (b && b.lastDay.atLeast && Number.isSafeInteger(b.lastDay.produced)) day.value = `${n(b.lastDay.produced)}+`;
  return (
    <dl className="ns-tiles" data-testid="status-tiles">
      <Tile testId="status-height" label="Block height" value={b ? n(b.tipHeight) : UNAVAILABLE} sub={net?.chainId ? `chain ${net.chainId}` : null} />
      <Tile testId="status-age" label={stale ? 'Newest block, at last reading' : 'Newest block'} value={Number.isFinite(age) ? `${duration(age)} ago` : UNAVAILABLE} sub={b?.lastBlockAt ? <When value={b.lastBlockAt} withTime /> : null} />
      <Tile testId="status-hour" label="Blocks, last hour" value={hour.value} sub={hour.sub} />
      <Tile testId="status-day" label="Blocks, last 24 hours" value={day.value} sub={day.sub} />
      <Tile testId="status-producers" label="Producers online" value={p ? `${p.online} of ${p.total}` : UNAVAILABLE} sub={p ? `signed a block in the last ${p.windowBlocks}` : null} />
      <Tile testId="status-peers" label="Peers" value={net && Number.isSafeInteger(net.peerCount) ? n(net.peerCount) : UNAVAILABLE} sub={net?.syncStatus ? `node ${net.syncStatus.replace(/_/g, ' ')}` : null} />
      <Tile testId="status-nodepay" label="Node pay" value={pay.value} sub={pay.sub} />
      <Tile testId="status-gap" label="Longest gap" value={b && Number.isSafeInteger(b.longestGapSeconds.value) ? duration(b.longestGapSeconds.value) : UNAVAILABLE} sub={b ? `between the newest ${b.longestGapSeconds.overBlocks} blocks` : null} />
    </dl>
  );
}

function Producers({ p }) {
  if (p?.status !== 'ok') return <SectionUnavailable what="Producer activity" />;
  if (p.members.length === 0) return <SectionUnavailable what="The producer set" />;
  return (
    <>
      <ul className="ns-producers" data-testid="status-producer-list">
        {p.members.map(m => (
          <li key={m.label} className={`ns-producer ns-producer--${m.online ? 'on' : 'off'}`}>
            <span className="ns-dot" aria-hidden="true" />
            <strong>{m.label}</strong>
            <span className="ns-producer-state">{m.online ? 'Online' : 'Not seen'}</span>
            <span className="fc-muted ns-producer-count">{m.blocksInWindow} of {p.windowBlocks} blocks</span>
          </li>
        ))}
      </ul>
      <div className="fc-foot">
        <span>Online means the producer signed at least one of the newest {p.windowBlocks} blocks.</span>
        <Link to="/nodes">Producers and bonded nodes</Link>
      </div>
    </>
  );
}

function Upgrades({ u, target, tip }) {
  if (u?.status !== 'ok') return <SectionUnavailable what="The upgrade schedule" />;
  const notice = u.signedNotice;
  if (u.pending.length === 0 && !notice) {
    return <p className="fc-placeholder" data-testid="status-upgrades-none">Nothing scheduled. {n(u.activeFeatures)} features are active.</p>;
  }
  const eta = blocks => (Number.isSafeInteger(blocks) && Number.isFinite(target) ? `~${duration(blocks * target)}` : '—');
  return (
    <>
      <table className="fc-table ns-table" data-testid="status-upgrades">
        <thead>
          <tr>
            <th>Feature</th>
            <th className="fc-num">At block</th>
            <th className="fc-num">In about</th>
          </tr>
        </thead>
        <tbody>
          {u.pending.map(f => (
            <tr key={`${f.feature}-${f.activationHeight}`}>
              <td><strong>{featureName(f.feature)}</strong></td>
              <td className="fc-num">{n(f.activationHeight)}</td>
              <td className="fc-num">{eta(f.blocksRemaining)}</td>
            </tr>
          ))}
          {notice ? (
            <tr data-testid="status-upgrade-notice">
              <td><strong>Node upgrade required</strong><div className="fc-sub">signed upgrade notice</div></td>
              <td className="fc-num">{n(notice.activationHeight)}</td>
              <td className="fc-num">{eta(notice.blocksRemaining)}</td>
            </tr>
          ) : null}
        </tbody>
      </table>
      <div className="fc-foot">
        <span>{n(u.activeFeatures)} features active{Number.isSafeInteger(tip) ? ` at block ${n(tip)}` : ''}. Times assume a block every {target} seconds.</span>
      </div>
    </>
  );
}

export default function PublicNetworkStatusPage() {
  const themeVars = useForecasterThemeVars();
  // `good` is the newest successful reading ({ data, at }); `failure` the kind of a later failed refresh.
  const [state, setState] = useState({ loading: true, result: null, good: null, failure: null });
  const [now, setNow] = useState(() => Date.now());
  const controllerRef = useRef(null);

  const load = useCallback((quiet = false) => {
    controllerRef.current?.abort();
    const controller = new globalThis.AbortController();
    controllerRef.current = controller;
    if (!quiet) setState(prev => ({ ...prev, loading: true }));
    publicGet(NETWORK_STATUS_PATH, controller.signal)
      .then(result => setState(prev => {
        if (result.kind === 'ok') return { loading: false, result, good: { data: result.data ?? {}, at: Date.now() }, failure: null };
        // Switched off: nothing old is shown as current.
        if (result.kind === 'not_found') return { loading: false, result, good: null, failure: null };
        // Any other failure keeps the last good reading, marked stale.
        return prev.good ? { loading: false, result, good: prev.good, failure: result.kind } : { loading: false, result, good: null, failure: null };
      }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const refresh = globalThis.setInterval(() => load(true), REFRESH_MS);
    const tick = globalThis.setInterval(() => setNow(Date.now()), TICK_MS);
    return () => {
      globalThis.clearInterval(refresh);
      globalThis.clearInterval(tick);
      controllerRef.current?.abort();
    };
  }, [load]);

  const shell = children => (
    <div className="public-read-page fc-page ns-page" data-testid="public-network-status" style={themeVars}>
      <header className="fc-head">
        <div>
          <h1>Network status</h1>
          <p className="fc-lede">
            Is the WRFCoin testnet making blocks right now? A few numbers read from the chain itself, refreshed every minute.
          </p>
        </div>
        <div className="fc-head-side"><Link className="fc-guide" to="/nodes">Who runs it</Link></div>
      </header>
      {children}
    </div>
  );

  const { loading, result, good, failure } = state;
  if (!result || (loading && !good)) return shell(<p className="fc-count" role="status">Reading the chain…</p>);
  if (result.kind === 'not_found') {
    return shell(<WrfEmptyState title="Not switched on yet" description="This server does not publish the network status yet." />);
  }
  if (!good) {
    const busy = result.kind === 'rate_limited';
    return shell(
      <WrfAlert severity={busy ? 'warning' : 'info'} role="alert" className="fc-unavailable" actionLabel="Retry" onAction={() => load()}>
        {busy ? 'Too many requests right now. Please wait a moment and try again.' : 'The network status is unavailable right now: the chain node could not answer.'}
      </WrfAlert>,
    );
  }

  const d = good.data;
  const b = d.blocks?.status === 'ok' ? d.blocks : null;
  const stale = failure !== null;
  // Stale: the age is frozen at the last reading's arrival and no claim is made about the chain now.
  const age = snapshotBlockAge(d, good.at, stale ? good.at : now);
  const v = stale
    ? { tone: 'unknown', title: 'Status unknown right now', body: 'This page could not refresh, so it cannot say whether the chain is making blocks now. The numbers below are from the last reading.' }
    : verdict(age, b?.targetBlockSeconds);
  return shell(
    <>
      {stale ? (
        <WrfAlert severity="warning" role="alert" className="fc-unavailable" actionLabel="Retry" onAction={() => load(true)}>
          <span data-testid="status-stale">
            {failure === 'rate_limited' ? 'Too many requests right now.' : 'Could not refresh the network status.'} Showing the last reading, checked{' '}
            {d.checkedAt ? <When value={d.checkedAt} withTime /> : 'at an unknown time'} (received <When value={new Date(good.at).toISOString()} withTime />).
          </span>
        </WrfAlert>
      ) : null}
      <section className={`ns-verdict ns-verdict--${v.tone}`} aria-live="polite" data-testid="status-verdict">
        <span className="ns-dot" aria-hidden="true" />
        <div>
          <h2>{v.title}</h2>
          <p>{v.body}</p>
        </div>
      </section>
      <Summary d={d} age={age} stale={stale} />
      <WrfCard component="section" aria-label="Producers" className="fc-section" header={<div className="fc-section-head"><h2>Producers</h2><span className="fc-count">who signs the blocks</span></div>} noPadding>
        <Producers p={d.producers} />
      </WrfCard>
      <WrfCard component="section" aria-label="Scheduled upgrades" className="fc-section" header={<div className="fc-section-head"><h2>Scheduled upgrades</h2><span className="fc-count">features the chain turns on at a set block</span></div>} noPadding>
        <Upgrades u={d.upgrades} target={b?.targetBlockSeconds ?? 77} tip={b?.tipHeight} />
      </WrfCard>
      <p className="fc-note">
        {d.network?.networkId ? `${d.network.networkId} · ` : ''}Checked <When value={d.checkedAt} withTime />. Numbers come from one chain node;
        the counts are what that node holds.
      </p>
    </>,
  );
}
