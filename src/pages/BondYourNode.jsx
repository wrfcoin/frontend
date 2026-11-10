import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { WrfCard } from '../components/DesignSystem';
import { BOND_ADMISSIONS_RECENT_PATH, publicGet } from '../services/publicReadonlyApi';
import { BOND_STAGE, bondProgress, parseNodeQuery } from '../utils/bondProgress';
import { splitBaseUnits } from './publicForecastersShared';

/**
 * "Bond your node" on /nodes (FEATURES.bondGuide, default off): the steps from a running node to a bonded
 * node that is paid, and a check of where one node stands.
 *
 * The check reads GET /api/bond-admission/recent once per press (no polling) and compares it with the
 * bonded list the page already holds. It sends nothing about the visitor: the key or alias typed here is
 * matched in the browser against two public lists.
 */

const GUIDE = 'https://github.com/wrfcoin/core4/blob/main/docs/operator/windows-node.md';
const ADMISSION_GUIDE = 'https://github.com/wrfcoin/infra/blob/main/testnet/services/bond-admission/BOND_ADMISSION.md#flow';

const STEPS = [
  { key: 'run', title: 'Run a node', body: <>Install it from <Link to="/downloads">Downloads</Link> and leave it running. It must stay connected for 24 hours before it can be admitted.</> },
  { key: 'port', title: 'Open your port', body: <>Other nodes must be able to reach yours. The <a href={`${GUIDE}#open-your-port-optional`} target="_blank" rel="noreferrer">node guide</a> shows the router and firewall steps.</> },
  { key: 'grant', title: 'Ask for a bond grant', body: <>The testnet faucet funds the bond, once per node. The <a href={`${GUIDE}#the-operator-cli-wrfcoinexe`} target="_blank" rel="noreferrer">node guide</a> has the command; grants are listed on the <Link to="/faucet/bond-grants">bond grants</Link> page.</> },
  { key: 'admission', title: 'Request admission', body: <>You send your node’s bond request (<a href={ADMISSION_GUIDE} target="_blank" rel="noreferrer">commands</a>). The network checks that the node is reachable, in sync and has been connected for 24 hours, then approves it for the next settlement epoch.</> },
  { key: 'bond', title: 'Bond', body: 'Approve the wallet that will be paid, then submit the bond before the current epoch closes. It becomes active when the next epoch starts.' },
  { key: 'earn', title: 'Earn', body: 'A bonded node is paid for each settlement epoch in which it served the network. Payouts appear in the Bonded nodes table on this page.' },
];

function Wrf({ units }) {
  const parts = splitBaseUnits(units);
  return parts ? <span className="nn-num">{parts.whole}{parts.frac} WRF</span> : null;
}

/** One sentence per stage; `step` is the STEPS key the node is at. */
function describe(progress, admissionsState) {
  switch (progress.stage) {
  case BOND_STAGE.invalid:
    return { tone: 'warn', title: 'That is not a node key', body: 'Enter your node’s server key (64 hex characters) or its alias, for example node-1a2b3c4d.' };
  case BOND_STAGE.earning:
    return { tone: 'ok', step: 'earn', title: 'Bonded, earning', body: <>{progress.alias ?? 'This node'} is bonded and has been paid{progress.earnedTotal ? <>: <Wrf units={progress.earnedTotal} /> in total</> : ''}.</> };
  case BOND_STAGE.pending:
    return { tone: 'ok', step: 'earn', title: 'Bonded, first payout pending', body: <>{progress.alias ?? 'This node'} is bonded. Its payout for epoch {progress.lastPayout.epoch} is worked out and will be paid shortly.</> };
  case BOND_STAGE.bonded:
    return { tone: 'ok', step: 'bond', title: 'Bonded', body: <>{progress.alias ?? 'This node'} is bonded. It is paid after the first epoch in which it served the network.</> };
  case BOND_STAGE.admitted:
    return {
      tone: 'wait', step: 'admission', title: 'Admitted, waiting for the bond',
      body: progress.bondListRead
        ? <>Admission approved for epoch {progress.effectiveEpoch}. Submit the bond before the current epoch closes; it shows here once it is on chain.</>
        : <>Admission approved for epoch {progress.effectiveEpoch}. The bonded list is unavailable right now, so this page cannot tell whether the bond is on chain yet.</>,
    };
  case BOND_STAGE.missed:
    return { tone: 'warn', step: 'admission', title: 'Admission expired', body: <>The admission was for epoch {progress.effectiveEpoch} and no bond arrived in time. Request admission again from the same node; asking again does not count against you.</> };
  case BOND_STAGE.none:
    return { tone: 'wait', step: 'run', title: 'Not admitted yet', body: 'No admission or bond was found for this node. Request admission once the node has been connected for 24 hours.' };
  default:
    if (admissionsState === 'closed') return { tone: 'wait', title: 'Admission is not open yet', body: 'This network is not taking bond requests yet. A node that is already bonded still shows in the table below.' };
    if (admissionsState === 'busy') return { tone: 'warn', title: 'Too many requests', body: 'Please wait a moment and check again.' };
    return { tone: 'warn', title: 'Unavailable', body: 'The admission or bonded list could not be read right now, so this page cannot say where the node stands.' };
  }
}

export default function BondYourNode({ bonded }) {
  const [value, setValue] = useState('');
  const [state, setState] = useState({ checking: false, verdict: null });
  const inFlight = useRef(null);
  useEffect(() => () => inFlight.current?.abort(), []);

  const check = useCallback(async event => {
    event.preventDefault();
    if (!parseNodeQuery(value)) {
      setState({ checking: false, verdict: describe({ stage: BOND_STAGE.invalid }) });
      return;
    }
    inFlight.current?.abort();
    const controller = new globalThis.AbortController();
    inFlight.current = controller;
    setState({ checking: true, verdict: null });
    let result;
    try {
      result = await publicGet(BOND_ADMISSIONS_RECENT_PATH, controller.signal);
    } catch {
      return; // aborted
    }
    const admissions = result.kind === 'ok' && Array.isArray(result.data?.admissions) ? result.data.admissions : null;
    const admissionsState = admissions ? 'ok' : result.kind === 'not_found' ? 'closed' : result.kind === 'rate_limited' ? 'busy' : 'error';
    setState({ checking: false, verdict: describe(bondProgress(value, { admissions, bonded }), admissionsState) });
  }, [value, bonded]);

  const { checking, verdict } = state;
  return (
    <WrfCard
      component="section"
      aria-label="Bond your node"
      className="fc-section"
      data-testid="bond-your-node"
      header={<div className="fc-section-head"><h2>Bond your node</h2><span className="fc-count">Rung 1 to rung 2</span></div>}
      noPadding
    >
      <ol className="nn-bond-steps">
        {STEPS.map((step, i) => (
          <li key={step.key} className={`nn-bond-step${verdict?.step === step.key ? ' nn-bond-step--here' : ''}`} aria-current={verdict?.step === step.key ? 'step' : undefined}>
            <span className="nn-step">{i + 1}</span>
            <div><strong>{step.title}</strong><span className="nn-rung-body">{step.body}</span></div>
          </li>
        ))}
      </ol>
      <form className="nn-bond-check" onSubmit={check} noValidate>
        <label htmlFor="nn-bond-key">Check your node</label>
        <div className="nn-bond-line">
          <input
            id="nn-bond-key"
            className="nn-bond-input nn-mono"
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={66}
            placeholder="Server key or alias (node-1a2b3c4d)"
            value={value}
            onChange={e => setValue(e.target.value)}
          />
          <button type="submit" className="nn-bond-button" disabled={checking}>{checking ? 'Checking…' : 'Check'}</button>
        </div>
        <p className="nn-bond-hint">A server key is public. Never paste a key file or a recovery phrase here.</p>
        <div role="status" aria-live="polite">
          {verdict ? (
            <p className={`nn-bond-verdict nn-bond-verdict--${verdict.tone}`} data-testid="bond-verdict">
              <strong>{verdict.title}</strong>
              <span>{verdict.body}</span>
            </p>
          ) : null}
        </div>
      </form>
    </WrfCard>
  );
}
