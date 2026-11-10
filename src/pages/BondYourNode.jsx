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

const C = ({ children }) => <code className="nn-bond-code">{children}</code>;
const Out = ({ href, children }) => <a href={href} target="_blank" rel="noreferrer">{children}</a>;

// Every command and flag named here exists in the operator CLI (core4 tools/cli, `wrfcoin node bond …`).
// The full command lines, with every argument, are in the two linked guides.
const STEPS = [
  { key: 'run', title: 'Run a node', body: <>Install it from <Link to="/downloads">Downloads</Link> and leave it running. It must stay connected for 24 hours before it can be admitted.</> },
  { key: 'port', title: 'Open your port', body: <>Other nodes must be able to reach yours. The <Out href={`${GUIDE}#open-your-port-optional`}>node guide</Out> shows the router and firewall steps, and how to switch on bonded mode.</> },
  {
    key: 'grant', title: 'Ask for a bond grant',
    body: <>The testnet faucet funds the bond, once per node. Run <C>wrfcoin node bond grant-request</C> as shown in the <Out href={`${GUIDE}#the-operator-cli-wrfcoinexe`}>node guide</Out>, adding <C>--submit</C> and this site’s address to send it; it asks one captcha question. Grants given are listed on the <Link to="/faucet/bond-grants">bond grants</Link> page.</>,
  },
  {
    key: 'admission', title: 'Request admission',
    body: <>Build the bond request with <C>wrfcoin node bond deposit --admission-cosign --dry-run</C>, sign it with <C>wrfcoin node bond sign</C> twice (<C>--role server</C>, then <C>--role consumer</C>), then run <C>wrfcoin node bond admission-request</C> with <C>--out</C> and POST the file it writes to <C>/api/bond-admission</C> on this site. The network checks that the node is reachable, in sync and has been connected for 24 hours; the answer is your approved request, good for one epoch. Full commands: the <Out href={ADMISSION_GUIDE}>admission guide</Out> in the infra repository.</>,
  },
  {
    key: 'bond', title: 'Bond',
    body: <>Add the approval of the wallet that will be paid: with a passkey wallet (once the network supports passkey payout wallets), <C>wrfcoin node bond payout-challenge</C> prints a challenge, the wallet signs it, and <C>wrfcoin node bond attach-payout-passkey</C> adds the signature; with a dedicated payout key, use <C>wrfcoin node bond sign --role payout</C>. Then submit with <C>wrfcoin node bond deposit --approvals-file</C> and your owner key (<C>--key-file</C>) before the current epoch closes. The bond is active from the next epoch.</>,
  },
  { key: 'earn', title: 'Earn', body: 'A bonded node is paid for an epoch when another bonded node fetched a snapshot from it and the receipt was submitted in time. Payouts appear in the Bonded nodes table on this page.' },
];

function Wrf({ units }) {
  const parts = splitBaseUnits(units);
  return parts ? <span className="nn-num">{parts.whole}{parts.frac} WRF</span> : null;
}

/** The payout wallet's lifetime total: every source, not only this bond. Said as exactly that, or not at all. */
function WalletTotal({ units }) {
  return splitBaseUnits(units) ? <span className="nn-bond-aside">This payout wallet’s total, from all sources: <Wrf units={units} />.</span> : null;
}

const PAID_WHEN = 'A node is paid for an epoch when another bonded node fetched a snapshot from it and the receipt was submitted in time.';

/** One statement per stage, and never a promise of a payout. `step` is the STEPS key the node is at. */
function describe(progress, admissionsState) {
  const name = progress.alias ?? 'This node';
  const epoch = progress.lastPayout?.epoch;
  switch (progress.stage) {
  case BOND_STAGE.invalid:
    return { tone: 'warn', title: 'That is not a node key', body: 'Enter your node’s server key or bond id (64 hex characters), or its alias, for example node-1a2b3c4d.' };
  case BOND_STAGE.earning:
    return { tone: 'ok', step: 'earn', title: 'Bonded, earning', body: <>{name} is bonded. Its latest payout, for epoch {epoch}, is paid: <Wrf units={progress.lastPayout.amount} />. <WalletTotal units={progress.walletTotal} /></> };
  case BOND_STAGE.provisional:
    return { tone: 'wait', step: 'earn', title: 'Bonded, payout worked out, not paid', body: <>{name} is bonded. For epoch {epoch}, <Wrf units={progress.lastPayout.amount} /> is worked out, not paid.</> };
  case BOND_STAGE.open:
    return { tone: 'wait', step: 'earn', title: 'Bonded, epoch still running', body: <>{name} is bonded. Epoch {epoch} is still running; nothing is settled for it.</> };
  case BOND_STAGE.unissued:
    return { tone: 'wait', step: 'earn', title: 'Bonded, nothing issued', body: <>{name} is bonded. Nothing was issued for epoch {epoch}. {PAID_WHEN}</> };
  case BOND_STAGE.bonded:
    return { tone: 'ok', step: 'bond', title: 'Bonded', body: <>{name} is bonded. It has no payout entry in the recent epochs. {PAID_WHEN}</> };
  case BOND_STAGE.admitted:
    return {
      tone: 'wait', step: 'admission', title: 'Admitted, waiting for the bond',
      body: progress.bondListRead
        ? <>Admission approved for epoch {progress.effectiveEpoch}. Submit the bond before the current epoch closes; it shows here once it is on chain.</>
        : <>Admission approved for epoch {progress.effectiveEpoch}. The bonded list is unavailable right now, so this page cannot tell whether the bond is on chain yet.</>,
    };
  case BOND_STAGE.missed:
    return { tone: 'warn', step: 'admission', title: 'Admission expired', body: <>The admission was for epoch {progress.effectiveEpoch} and no bond arrived in time. Request admission again from the same node and the same address; that is not counted as a new request.</> };
  case BOND_STAGE.none:
    return { tone: 'wait', title: 'Not in the recent admissions', body: 'No admission for this key or alias is among the last 100, and no registered bond has this id or alias. If the node was admitted earlier, check with its alias or bond id.' };
  default:
    if (admissionsState === 'closed') return { tone: 'wait', title: 'Admission is not open yet.', body: 'This network is not taking bond requests yet. A node that is already bonded can be checked with its alias or bond id.' };
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
            placeholder="Server key, bond id or alias (node-1a2b3c4d)"
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
