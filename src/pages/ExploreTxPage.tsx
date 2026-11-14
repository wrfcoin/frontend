import React, { useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { WrfCard } from '../components/DesignSystem/WrfCard';
import { WrfSkeleton } from '../components/DesignSystem/WrfSkeleton';
import { WrfButton } from '../components/DesignSystem/WrfButton';
import { palette, borderRadiusScale } from '../components/DesignSystem/tokens';
import {
  lookupPublicTransaction,
  normalizeTxHash,
  txTypeLabel,
  type PublicTransaction,
  type PublicTransactionLookup,
} from '../services/publicTransaction';

/**
 * /explore/tx/:hash: one transaction on the public site, where the wallet, forecast and bond-grant
 * pages link a hash (VITE_EXPLORER_URL=self). Shows only status, block, type and block time.
 */

type View = { kind: 'loading' } | { kind: 'bad' } | PublicTransactionLookup;

const mono = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

const STATUS_TEXT: Record<PublicTransaction['status'], { title: string; note: string }> = {
  included: { title: 'Confirmed', note: 'This transaction is in a block on the testnet.' },
  pending: { title: 'Waiting', note: 'The node has this transaction and it is waiting for the next block (about 77 seconds).' },
  unknown: {
    title: 'Not found',
    note: 'This node has no transaction with this hash. It only keeps recent blocks, so an older transaction can be missing here. A transaction that was just sent can take a few seconds to show.',
  },
};

const Field: React.FC<{ label: string; children: React.ReactNode; testId: string }> = ({ label, children, testId }) => (
  <Box data-testid={testId} sx={{ p: 2, borderRadius: `${borderRadiusScale.md}px`, backgroundColor: palette.background.row, minWidth: 0 }}>
    <Typography component="h3" sx={{ m: 0, fontSize: '0.75rem', fontWeight: 600, color: palette.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {label}
    </Typography>
    <Box sx={{ mt: 0.5, fontSize: '1.0625rem', fontWeight: 600, color: palette.text.primary, overflowWrap: 'anywhere' }}>{children}</Box>
  </Box>
);

const Message: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Box role="status" data-testid="explore-tx-message" sx={{ p: 2, borderRadius: `${borderRadiusScale.md}px`, backgroundColor: palette.background.row }}>
    <Typography component="h2" sx={{ m: 0, fontSize: '1rem', fontWeight: 700, color: palette.text.primary }}>{title}</Typography>
    <Typography sx={{ mt: 0.5, fontSize: '0.875rem', color: palette.text.secondary }}>{children}</Typography>
  </Box>
);

function blockTime(iso: string | null): string {
  if (!iso) return 'Not reported';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? 'Not reported' : date.toLocaleString();
}

/** While a transaction is waiting or not found yet, look again this often, at most this many times. */
export const TX_POLL_MS = 20_000;
export const TX_POLL_MAX = 5;

/** A view worth looking at again: not in a block yet, not found yet, or the node was busy / did not answer. */
function mayChange(view: View): boolean {
  if (view.kind === 'ok') return view.value.status !== 'included';
  return view.kind === 'busy' || view.kind === 'unavailable';
}

export default function ExploreTxPage() {
  const { hash: param = '' } = useParams();
  // A new hash starts a fresh lookup (and a fresh poll budget).
  return <ExploreTxView key={param} param={param} />;
}

function ExploreTxView({ param }: { param: string }) {
  const hash = normalizeTxHash(param);
  const [view, setView] = useState<View>(hash ? { kind: 'loading' } : { kind: 'bad' });
  // Each bump looks the hash up again; the result already on screen stays until the answer comes.
  const [attempt, setAttempt] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const autoTries = useRef(0);

  useEffect(() => {
    if (!hash) {
      setView({ kind: 'bad' });
      return undefined;
    }
    const controller = new globalThis.AbortController();
    if (attempt === 0) setView({ kind: 'loading' });
    else setRefreshing(true);
    lookupPublicTransaction(hash, controller.signal).then(
      result => { if (!controller.signal.aborted) { setView(result); setRefreshing(false); } },
      error => { if (error?.name !== 'AbortError') { setView({ kind: 'unavailable' }); setRefreshing(false); } },
    );
    return () => controller.abort();
  }, [hash, attempt]);

  // Bounded polling: a just-sent transaction usually lands within a block or two (about 77 s each).
  const polling = !refreshing && mayChange(view) && autoTries.current < TX_POLL_MAX;
  useEffect(() => {
    if (!polling) return undefined;
    const timer = setTimeout(() => {
      autoTries.current += 1;
      setAttempt(n => n + 1);
    }, TX_POLL_MS);
    return () => clearTimeout(timer);
  }, [polling, view]);

  const refresh = () => {
    autoTries.current = 0;
    setAttempt(n => n + 1);
  };

  return (
    <Box sx={{ maxWidth: 880, mx: 'auto', px: { xs: 2, sm: 3 }, py: 3 }} data-testid="explore-tx-page">
      <Typography component="h1" sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' }, fontWeight: 700, m: 0, color: palette.text.primary }}>
        Transaction
      </Typography>
      <Typography
        component="p"
        title={hash ?? param}
        data-testid="explore-tx-hash"
        sx={{ mt: 1, mb: 3, fontFamily: mono, fontSize: '0.8125rem', color: palette.text.secondary, overflowWrap: 'anywhere' }}
      >
        {hash ?? param}
      </Typography>

      <WrfCard variant="outlined" sx={{ backgroundColor: palette.background.secondary, borderRadius: `${borderRadiusScale.md}px` }}>
        <Box aria-live="polite">
          {view.kind === 'loading' && (
            <Box role="status" aria-busy="true" aria-label="Looking up the transaction" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
              <WrfSkeleton variant="rect" height={72} sx={{ borderRadius: `${borderRadiusScale.md}px` }} />
              <WrfSkeleton variant="rect" height={72} sx={{ borderRadius: `${borderRadiusScale.md}px` }} />
            </Box>
          )}

          {view.kind === 'ok' && (
            <Box data-testid="explore-tx-result">
              <Typography component="h2" data-testid="explore-tx-status" sx={{ m: 0, fontSize: '1.25rem', fontWeight: 700, color: palette.text.primary }}>
                {STATUS_TEXT[view.value.status].title}
              </Typography>
              <Typography sx={{ mt: 0.5, mb: 2, fontSize: '0.875rem', color: palette.text.secondary }}>
                {STATUS_TEXT[view.value.status].note}
              </Typography>
              {view.value.status !== 'unknown' && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
                  <Field label="Type" testId="explore-tx-type">{txTypeLabel(view.value.txType)}</Field>
                  <Field label="Block" testId="explore-tx-block">
                    {view.value.blockHeight === null
                      ? 'Not in a block yet'
                      : <RouterLink to={`/explore/block/${view.value.blockHeight}`} data-testid="explore-tx-block-link">{view.value.blockHeight.toLocaleString()}</RouterLink>}
                  </Field>
                  <Field label="Block time" testId="explore-tx-time">
                    {view.value.status === 'included' ? blockTime(view.value.timestamp) : '—'}
                  </Field>
                </Box>
              )}
            </Box>
          )}

          {view.kind === 'bad' && (
            <Message title="Not a transaction hash">A transaction hash is 64 hex characters, with or without 0x in front.</Message>
          )}
          {view.kind === 'off' && (
            <Message title="Unavailable">Transaction lookup is not switched on on this server yet.</Message>
          )}
          {view.kind === 'busy' && (
            <Message title="Busy">Too many lookups right now. Please try again in a minute.</Message>
          )}
          {view.kind === 'unavailable' && (
            <Message title="Unavailable">The testnet node did not answer. Please try again in a minute.</Message>
          )}
        </Box>
        {hash && view.kind !== 'loading' && mayChange(view) && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <WrfButton variant="outline" size="sm" onClick={refresh} loading={refreshing} disabled={refreshing} data-testid="explore-tx-refresh">
              Refresh
            </WrfButton>
            <Typography component="span" data-testid="explore-tx-poll-note" sx={{ fontSize: '0.8125rem', color: palette.text.muted }}>
              {polling ? 'This page looks again every 20 seconds.' : 'Press Refresh to look again.'}
            </Typography>
          </Box>
        )}
      </WrfCard>

      <Typography sx={{ mt: 2, fontSize: '0.8125rem', color: palette.text.muted }}>
        This page shows what the chain makes public about a hash: whether it is in a block, which block,
        and what kind of transaction it is. Recent blocks are on the{' '}
        <RouterLink to="/explore">explorer</RouterLink>. Test coins have no value.
      </Typography>
    </Box>
  );
}
