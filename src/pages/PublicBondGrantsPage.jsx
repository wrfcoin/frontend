import { useCallback, useEffect, useState } from 'react';
import { WrfAlert, WrfCard, WrfEmptyState } from '../components/DesignSystem';
import { fontFamily, infoLight, radii } from '../components/DesignSystem/tokens';
import { explorerTxUrl } from '../config/network';
import { useIsDarkTheme } from '../theme/ThemeProvider';
import { publicPageSurfaceVars } from '../theme/publicPageTheme';
import { BOND_GRANTS_PATH, publicGet } from '../services/publicReadonlyApi';
import './PublicBondGrantsPage.css';

/**
 * Public audit list of faucet bond grants (/faucet/bond-grants; self-serve bond grant spec section 4).
 *
 * Reads GET /api/faucet/bond-grants only: the backend forwards the faucet's audit list unchanged,
 * `{ grants: [{ ownerAddress, peerId, serverKey, txHash, time, bonded }] }`, newest first, at most 100
 * (infra testnet/services/faucet/BOND_GRANT.md). The page shows what the list holds and nothing more:
 * owner wallets and peer ids are shortened with a copy button for the full value the list already
 * publishes, and `bonded: null` (the faucet cannot resolve bond status yet) reads "Not yet available",
 * never "No".
 */

// Theme-independent tokens; surface, text, border and accent colours come from publicPageSurfaceVars.
const TOKEN_VARS = {
  '--bga-info-light': infoLight,
  '--bga-r-md': `${radii.md}px`,
  '--bga-font': fontFamily.display,
  '--bga-mono': fontFamily.mono,
};

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
// libp2p peer ids are base58btc (no 0, O, I, l).
const PEER_ID_RE = /^[1-9A-HJ-NP-Za-km-z]{16,128}$/;
const TX_HASH_RE = /^(0x)?[0-9a-fA-F]{64}$/;
export const NOT_YET_LABEL = 'Not yet available';

function shorten(value, head, tail) {
  return value.length <= head + tail + 1 ? value : `${value.slice(0, head)}…${value.slice(-tail)}`;
}

function useThemeVars() {
  const isDark = useIsDarkTheme();
  const surface = publicPageSurfaceVars('bga', isDark);
  return { ...TOKEN_VARS, ...surface, ...(isDark ? {} : { '--bga-info-light': surface['--bga-info'] }) };
}

function When({ value }) {
  const ms = Date.parse(String(value ?? ''));
  if (!Number.isFinite(ms)) return <>—</>;
  const date = new Date(ms);
  const label = date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  return <time dateTime={date.toISOString()} title={date.toISOString()}>{label}</time>;
}

/** Copy-to-clipboard; silent when the clipboard API is missing. */
function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await globalThis.navigator?.clipboard?.writeText?.(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable: nothing to show */ }
  };
  return (
    <button type="button" className="bga-copy" onClick={copy} aria-label={label} title={label}>
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function Shortened({ value, re, head, tail, what }) {
  if (typeof value !== 'string' || !re.test(value)) return <span className="bga-muted">—</span>;
  return (
    <span className="bga-id">
      <span className="bga-mono" title={value}>{shorten(value, head, tail)}</span>
      <CopyButton text={value} label={`Copy ${what} ${value}`} />
    </span>
  );
}

export function Bonded({ value }) {
  if (value === true) return <span className="bga-bonded bga-bonded--yes">Yes</span>;
  if (value === false) return <span className="bga-bonded bga-bonded--no">No</span>;
  return <span className="bga-muted" title="The faucet cannot read bond status for a grant yet.">{NOT_YET_LABEL}</span>;
}

function GrantTx({ hash }) {
  if (typeof hash !== 'string' || !TX_HASH_RE.test(hash)) return <span className="bga-muted">—</span>;
  const url = explorerTxUrl(hash);
  const short = shorten(hash.replace(/^0x/, ''), 8, 6);
  return url
    ? <a className="bga-mono bga-link" href={url} target="_blank" rel="noopener noreferrer" title={hash}>{short}</a>
    : <span className="bga-id"><span className="bga-mono" title={hash}>{short}</span><CopyButton text={hash} label={`Copy transaction hash ${hash}`} /></span>;
}

function Row({ grant }) {
  return (
    <tr data-testid="bond-grant-row">
      <td>
        <Shortened value={grant.ownerAddress} re={ADDRESS_RE} head={6} tail={4} what="owner wallet" />
        <div className="bga-sub bga-only-phone">Peer <span className="bga-mono">{typeof grant.peerId === 'string' && PEER_ID_RE.test(grant.peerId) ? shorten(grant.peerId, 6, 4) : '—'}</span></div>
        <div className="bga-sub bga-only-phone"><When value={grant.time} /></div>
        <div className="bga-sub bga-only-phone">Grant tx <GrantTx hash={grant.txHash} /></div>
      </td>
      <td className="bga-hide-phone"><Shortened value={grant.peerId} re={PEER_ID_RE} head={8} tail={6} what="peer id" /></td>
      <td className="bga-hide-phone bga-muted bga-nowrap"><When value={grant.time} /></td>
      <td><Bonded value={grant.bonded} /></td>
      <td className="bga-hide-phone"><GrantTx hash={grant.txHash} /></td>
    </tr>
  );
}

/** A 404 or 503 means this network does not serve the list (the feature or its proxy is off), not a fault. */
function Unavailable({ result, onRetry }) {
  const limited = result?.kind === 'rate_limited';
  const offHere = result?.kind === 'not_found' || (result?.kind === 'error' && result.status === 503);
  return (
    <WrfAlert severity={limited ? 'warning' : 'info'} role="alert" className="bga-unavailable" actionLabel={onRetry ? 'Retry' : undefined} onAction={onRetry}>
      {limited
        ? 'Too many requests. Please wait a moment and try again.'
        : offHere
          ? 'Bond grant history is not available on this network yet.'
          : 'Bond grant history is unavailable right now.'}
    </WrfAlert>
  );
}

export default function PublicBondGrantsPage() {
  const themeVars = useThemeVars();
  const [state, setState] = useState({ loading: true, result: null });
  const load = useCallback(() => {
    const controller = new globalThis.AbortController();
    setState({ loading: true, result: null });
    publicGet(BOND_GRANTS_PATH, controller.signal)
      .then(result => setState({ loading: false, result }))
      .catch(() => {});
    return () => controller.abort();
  }, []);
  useEffect(() => load(), [load]);

  const { loading, result } = state;
  const ok = result?.kind === 'ok' && Array.isArray(result.data?.grants);
  const grants = ok ? result.data.grants.filter(g => g && typeof g === 'object') : [];

  return (
    <main className="public-read-page bga-page" data-testid="public-bond-grants" style={themeVars}>
      <header className="bga-head">
        <h1>Bond grants</h1>
        <p className="bga-lede">
          Every node bond the testnet faucet has funded, newest first. A grant pays one node's bond deposit, once per
          node, per peer and per wallet; this page lists them so anyone can check who received one.
        </p>
      </header>

      <WrfCard
        component="section"
        aria-label="Bond grants"
        className="bga-section"
        header={(
          <div className="bga-section-head">
            <h2>Recent grants</h2>
            {ok ? <span className="bga-count">{grants.length} shown</span> : null}
          </div>
        )}
        noPadding
      >
        {loading ? (
          <p className="bga-count bga-loading" role="status">Loading bond grants…</p>
        ) : !ok ? (
          <Unavailable result={result} onRetry={load} />
        ) : grants.length === 0 ? (
          <div className="bga-empty-wrap">
            <WrfEmptyState
              title="No grants yet"
              description="The faucet has not funded a node bond on this network yet."
              sx={{ background: 'transparent' }}
            />
          </div>
        ) : (
          <table className="bga-table">
            <thead>
              <tr>
                <th>Owner wallet</th>
                <th className="bga-hide-phone">Peer id</th>
                <th className="bga-hide-phone">Time</th>
                <th>Bonded</th>
                <th className="bga-hide-phone">Grant transaction</th>
              </tr>
            </thead>
            <tbody>{grants.map((g, i) => <Row key={`${g.txHash ?? ''}-${i}`} grant={g} />)}</tbody>
          </table>
        )}
        {ok && grants.length > 0 ? (
          <p className="bga-foot">
            The faucet keeps the most recent 100 grants here. &ldquo;{NOT_YET_LABEL}&rdquo; under Bonded means the faucet
            cannot read the grant&rsquo;s bond status yet, not that the node did not bond.
          </p>
        ) : null}
      </WrfCard>
    </main>
  );
}
