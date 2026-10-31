import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { WrfAlert, WrfCard, WrfEmptyState } from '../components/DesignSystem';
import { NETWORK_NODES_PATH, publicGet } from '../services/publicReadonlyApi';
import { When, splitBaseUnits, useForecasterThemeVars } from './publicForecastersShared';
import './PublicForecastersPage.css';
import './PublicNetworkNodesPage.css';

/**
 * Producers and bonded nodes (/nodes; owner demo queue 2026-11-01 item 3): "anyone sees who produces
 * blocks and who is bonded", placed on the participation ladder (node -> bonded node -> attester -> producer).
 *
 * Reads GET /api/network/nodes only. The backend reads everything from the chain node: producer activity
 * from the newest blocks' producer keys, bonds checked one by one on chain, attesters from the oracle
 * status, paid totals from each payout account's earned_balance_total. A section the node could not
 * answer reads "Unavailable"; a value it did not give is never shown as zero.
 */

const UNAVAILABLE = 'Unavailable';
const short = (hex, head = 8, tail = 6) => (typeof hex === 'string' && hex.length > head + tail + 1 ? `${hex.slice(0, head)}…${hex.slice(-tail)}` : hex ?? '—');
const n = value => (Number.isSafeInteger(value) ? value.toLocaleString('en-US') : '—');

function Wrf({ units }) {
  const parts = splitBaseUnits(units);
  if (!parts) return <span className="fc-un">{UNAVAILABLE}</span>;
  return <span className="nn-num">{parts.whole}<span className="nn-frac">{parts.frac}</span> WRF</span>;
}

function SectionUnavailable({ what }) {
  return <p className="fc-placeholder" role="note">{what} {UNAVAILABLE.toLowerCase()}: the chain node did not answer this part.</p>;
}

function Ladder({ data }) {
  const producers = data.producers?.status === 'ok' ? data.producers.members.filter(m => (m.blocksInWindow ?? 0) > 0).length : null;
  const rungs = [
    { key: 'node', title: 'Node', body: 'Holds and checks the whole chain.', value: data.chain?.status === 'ok' ? `Height ${n(data.chain.height)}` : UNAVAILABLE },
    { key: 'bonded', title: 'Bonded node', body: 'Locks a bond and is paid each settlement epoch.', value: data.bonded?.status === 'ok' ? `${data.bonded.nodes.length} bonded` : UNAVAILABLE },
    { key: 'attester', title: 'Attester', body: 'Confirms weather readings before they are paid.', value: data.attesters?.status === 'ok' ? `${data.attesters.ids.length} seated` : UNAVAILABLE },
    { key: 'producer', title: 'Producer', body: 'Signs the blocks.', value: producers === null ? UNAVAILABLE : `${producers} of ${data.producers.members.length} producing` },
  ];
  return (
    <ol className="nn-ladder" aria-label="Participation ladder" data-testid="nodes-ladder">
      {rungs.map((r, i) => (
        <li key={r.key} className="nn-rung">
          <span className="nn-step">{i + 1}</span>
          <div>
            <strong>{r.title}</strong>
            <span className="nn-rung-body">{r.body}</span>
            <span className="nn-rung-value">{r.value}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Producers({ p }) {
  if (p?.status !== 'ok') return <SectionUnavailable what="Producer activity" />;
  const w = p.window;
  return (
    <>
      <table className="fc-table nn-table" data-testid="nodes-producers">
        <thead>
          <tr>
            <th>Producer</th>
            <th className="fc-num">Blocks</th>
            <th className="fc-hide-phone">Last block</th>
            <th className="fc-num fc-hide-phone">Paid in total</th>
          </tr>
        </thead>
        <tbody>
          {p.members.map(m => (
            <tr key={m.publicKey}>
              <td>
                <strong>{m.producerId}</strong>
                <div className="fc-sub nn-mono" title={m.publicKey}>key {short(m.publicKey)}</div>
                <div className="fc-sub fc-only-phone">
                  {m.lastBlock ? <>last block {n(m.lastBlock.height)} · <When value={m.lastBlock.time} withTime /></> : 'no block in this window'}
                </div>
                <div className="fc-sub fc-only-phone">Paid in total: <Wrf units={m.earnedTotal} /></div>
              </td>
              <td className="fc-num">{m.blocksInWindow === null ? UNAVAILABLE : `${m.blocksInWindow} of ${w.read}`}</td>
              <td className="fc-hide-phone">{m.lastBlock ? <>{n(m.lastBlock.height)} <span className="fc-muted">· <When value={m.lastBlock.time} withTime /></span></> : <span className="fc-muted">None in this window</span>}</td>
              <td className="fc-num fc-hide-phone"><Wrf units={m.earnedTotal} /></td>
            </tr>
          ))}
          {p.unrostered.map(u => (
            <tr key={u.publicKey} data-testid="nodes-unrostered">
              <td><strong>Unnamed producer</strong><div className="fc-sub nn-mono" title={u.publicKey}>key {short(u.publicKey)}</div></td>
              <td className="fc-num">{`${u.blocksInWindow} of ${w.read}`}</td>
              <td className="fc-hide-phone">{n(u.lastBlock.height)}</td>
              <td className="fc-num fc-hide-phone"><span className="fc-un">{UNAVAILABLE}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="fc-foot">
        <span>Blocks {n(w.fromHeight)}–{n(w.toHeight)}: {w.read} read{w.unreadable ? `, ${w.unreadable} could not be read` : ''}{w.unsigned ? `, ${w.unsigned} unsigned` : ''}.</span>
        <span>Names come from the testnet genesis roster; activity comes from each block&apos;s producer key.</span>
      </div>
    </>
  );
}

function Bonded({ b }) {
  if (b?.status !== 'ok') return <SectionUnavailable what="Bonded nodes" />;
  if (b.nodes.length === 0) {
    return (
      <div className="fc-empty-wrap">
        <WrfEmptyState title="No bonded nodes found" description="No registered bond appeared in the recent settlement epochs or the known list." sx={{ background: 'transparent' }} />
      </div>
    );
  }
  return (
    <>
      <table className="fc-table nn-table" data-testid="nodes-bonded">
        <thead>
          <tr>
            <th>Node</th>
            <th className="fc-num fc-hide-phone">Bond</th>
            <th className="fc-hide-phone">Latest payout</th>
            <th className="fc-num">Paid in total</th>
          </tr>
        </thead>
        <tbody>
          {b.nodes.map(node => (
            <tr key={node.deploymentId}>
              <td>
                <strong>{node.alias ?? 'Unnamed node'}</strong>
                {node.jailed ? <span className="nn-flag">Jailed</span> : null}
                <div className="fc-sub nn-mono" title={node.deploymentId}>bond {short(node.deploymentId)}</div>
                {node.payoutAddress ? <div className="fc-sub nn-mono" title={node.payoutAddress}>pays {short(node.payoutAddress, 6, 4)}</div> : null}
                <div className="fc-sub fc-only-phone">Bond: <Wrf units={node.principal} /></div>
              </td>
              <td className="fc-num fc-hide-phone"><Wrf units={node.principal} /></td>
              <td className="fc-hide-phone">
                {node.lastPayout
                  ? <>{node.lastPayout.status === 'PROVISIONAL' ? 'Pending' : 'Paid'} <Wrf units={node.lastPayout.amount} /> <span className="fc-muted">· epoch {n(node.lastPayout.epoch)}</span></>
                  : <span className="fc-muted">None in the last epochs</span>}
              </td>
              <td className="fc-num"><Wrf units={node.earnedTotal} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="fc-foot">
        <span>Current settlement epoch {n(b.epoch)}. Each bond is checked on chain; only registered bonds are listed.</span>
      </div>
    </>
  );
}

function Attesters({ a }) {
  if (a?.status !== 'ok') return <SectionUnavailable what="Attesters" />;
  return (
    <div className="nn-attesters" data-testid="nodes-attesters">
      <p className="fc-count">{a.ids.length} seated{Number.isSafeInteger(a.quorum) ? ` · ${a.quorum} must agree before a reading is paid` : ''}</p>
      <ul>{a.ids.map(id => <li key={id} className="nn-mono">{id}</li>)}</ul>
    </div>
  );
}

export default function PublicNetworkNodesPage() {
  const themeVars = useForecasterThemeVars();
  const [state, setState] = useState({ loading: true, result: null });
  const load = useCallback(() => {
    const controller = new globalThis.AbortController();
    setState({ loading: true, result: null });
    publicGet(NETWORK_NODES_PATH, controller.signal)
      .then(result => setState({ loading: false, result }))
      .catch(() => {});
    return () => controller.abort();
  }, []);
  useEffect(() => load(), [load]);

  const shell = children => (
    <div className="public-read-page fc-page nn-page" data-testid="public-network-nodes" style={themeVars}>
      <header className="fc-head">
        <div>
          <h1>Producers and bonded nodes</h1>
          <p className="fc-lede">
            Who signs the blocks, who has bonded a node, and who checks weather readings on the WRFCoin testnet, read from the chain itself.
            Anyone can climb: run a node, bond it, then earn a seat as an attester and a producer.
          </p>
        </div>
        <div className="fc-head-side"><Link className="fc-guide" to="/downloads">Run a node</Link></div>
      </header>
      {children}
    </div>
  );

  const { loading, result } = state;
  if (loading || !result) return shell(<p className="fc-count" role="status">Reading the chain…</p>);
  if (result.kind === 'not_found') {
    return shell(<WrfEmptyState title="Not switched on yet" description="This server does not publish the producer and bonded-node list yet." />);
  }
  if (result.kind !== 'ok') {
    const busy = result.kind === 'rate_limited';
    return shell(
      <WrfAlert severity={busy ? 'warning' : 'info'} role="alert" className="fc-unavailable" actionLabel="Retry" onAction={load}>
        {busy ? 'Too many requests right now. Please wait a moment and try again.' : 'The producer and bonded-node list is unavailable right now: the chain node could not answer.'}
      </WrfAlert>,
    );
  }

  const d = result.data ?? {};
  return shell(
    <>
      <Ladder data={d} />
      <WrfCard component="section" aria-label="Producers" className="fc-section" header={<div className="fc-section-head"><h2>Producers</h2><span className="fc-count">Rung 4 · newest blocks</span></div>} noPadding>
        <Producers p={d.producers} />
      </WrfCard>
      <WrfCard component="section" aria-label="Bonded nodes" className="fc-section" header={<div className="fc-section-head"><h2>Bonded nodes</h2><span className="fc-count">Rung 2</span></div>} noPadding>
        <Bonded b={d.bonded} />
      </WrfCard>
      <WrfCard component="section" aria-label="Attesters" className="fc-section" header={<div className="fc-section-head"><h2>Attesters</h2><span className="fc-count">Rung 3</span></div>} noPadding>
        <Attesters a={d.attesters} />
      </WrfCard>
      <p className="fc-note">
        {d.chain?.networkId ? `${d.chain.networkId}${d.chain.chainId ? ` · chain ${d.chain.chainId}` : ''} · ` : ''}
        Checked <When value={d.checkedAt} withTime />. Paid totals are everything the chain has credited to each payout account.
      </p>
    </>,
  );
}
