import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { WrfCard } from '../components/DesignSystem/WrfCard';
import { WrfSkeleton } from '../components/DesignSystem/WrfSkeleton';
import { palette, borderRadiusScale } from '../components/DesignSystem/tokens';
import { lookupPublicBlock, parseBlockHeight, MAX_BLOCK_HEIGHT, type BlockRewardSummary, type PublicBlockLookup } from '../services/publicBlock';
import { txTypeLabel } from '../services/publicTransaction';
import { proofPagePath } from '../services/publicReadonlyApi';
import { formatBaseUnitsToWrf } from '../services/apiClient/number';

/**
 * /explore/block/:height: one block on the public site (owner approval 2026-11-08). Shows the header,
 * what kinds of transactions it holds, links to the proof page of each station reading revealed in
 * it, and the block's reward totals. Never who was paid: the backend sends aggregates only.
 */

type View = { kind: 'loading' } | { kind: 'bad' } | PublicBlockLookup;

const mono = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
const MAX_PROOF_LINKS = 20;

const Field: React.FC<{ label: string; children: React.ReactNode; testId: string; monoValue?: boolean }> = ({ label, children, testId, monoValue }) => (
  <Box data-testid={testId} sx={{ p: 2, borderRadius: `${borderRadiusScale.md}px`, backgroundColor: palette.background.row, minWidth: 0 }}>
    <Typography component="h3" sx={{ m: 0, fontSize: '0.75rem', fontWeight: 600, color: palette.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {label}
    </Typography>
    <Box sx={{ mt: 0.5, fontSize: monoValue ? '0.8125rem' : '1.0625rem', fontFamily: monoValue ? mono : undefined, fontWeight: 600, color: palette.text.primary, overflowWrap: 'anywhere' }}>
      {children}
    </Box>
  </Box>
);

const Message: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Box role="status" data-testid="explore-block-message" sx={{ p: 2, borderRadius: `${borderRadiusScale.md}px`, backgroundColor: palette.background.row }}>
    <Typography component="h2" sx={{ m: 0, fontSize: '1rem', fontWeight: 700, color: palette.text.primary }}>{title}</Typography>
    <Typography sx={{ mt: 0.5, fontSize: '0.875rem', color: palette.text.secondary }}>{children}</Typography>
  </Box>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography component="h2" sx={{ mt: 3, mb: 1.5, fontSize: '1.0625rem', fontWeight: 700, color: palette.text.primary }}>{children}</Typography>
);

function wrf(units: string | null): string {
  if (units === null) return 'Not reported';
  return `${formatBaseUnitsToWrf(units, 2) ?? '—'} WRF`;
}

function rewardLine(summary: BlockRewardSummary | null, noun: [string, string]): string {
  if (!summary) return 'None in this block';
  if (summary.count === null) return 'Not reported';
  if (summary.count === 0) return 'None in this block';
  const who = `${summary.count.toLocaleString()} ${summary.count === 1 ? noun[0] : noun[1]}`;
  return summary.totalBaseUnits === null ? who : `${wrf(summary.totalBaseUnits)} to ${who}`;
}

const shortHash = (h: string) => `${h.slice(0, 10)}…${h.slice(-6)}`;

export default function ExploreBlockPage() {
  const { height: param = '' } = useParams();
  const height = parseBlockHeight(param);
  const [view, setView] = useState<View>(height === null ? { kind: 'bad' } : { kind: 'loading' });

  useEffect(() => {
    if (height === null) {
      setView({ kind: 'bad' });
      return undefined;
    }
    const controller = new globalThis.AbortController();
    setView({ kind: 'loading' });
    lookupPublicBlock(height, controller.signal).then(
      result => { if (!controller.signal.aborted) setView(result); },
      error => { if (error?.name !== 'AbortError') setView({ kind: 'unavailable' }); },
    );
    return () => controller.abort();
  }, [height]);

  return (
    <Box sx={{ maxWidth: 880, mx: 'auto', px: { xs: 2, sm: 3 }, py: 3 }} data-testid="explore-block-page">
      <Typography component="h1" sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' }, fontWeight: 700, m: 0, color: palette.text.primary }}>
        {height === null ? 'Block' : `Block ${height.toLocaleString()}`}
      </Typography>
      {height !== null && (
        <Box component="nav" aria-label="Neighbouring blocks" sx={{ display: 'flex', gap: 2, mt: 1, mb: 3, fontSize: '0.875rem' }}>
          {height > 0 && <RouterLink to={`/explore/block/${height - 1}`} data-testid="explore-block-prev">← Block {(height - 1).toLocaleString()}</RouterLink>}
          {height < MAX_BLOCK_HEIGHT && <RouterLink to={`/explore/block/${height + 1}`} data-testid="explore-block-next">Block {(height + 1).toLocaleString()} →</RouterLink>}
        </Box>
      )}

      <WrfCard variant="outlined" sx={{ backgroundColor: palette.background.secondary, borderRadius: `${borderRadiusScale.md}px` }}>
        <Box aria-live="polite">
          {view.kind === 'loading' && (
            <Box role="status" aria-busy="true" aria-label="Looking up the block" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
              <WrfSkeleton variant="rect" height={72} sx={{ borderRadius: `${borderRadiusScale.md}px` }} />
              <WrfSkeleton variant="rect" height={72} sx={{ borderRadius: `${borderRadiusScale.md}px` }} />
            </Box>
          )}

          {view.kind === 'ok' && (
            <Box data-testid="explore-block-result">
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
                <Field label="Time" testId="explore-block-time">
                  {view.value.timestamp ? new Date(view.value.timestamp).toLocaleString() : 'Not reported'}
                </Field>
                <Field label="Transactions" testId="explore-block-txcount">{view.value.transactionCount.toLocaleString()}</Field>
                <Field label="Block hash" testId="explore-block-hash" monoValue>{view.value.hash ?? 'Not reported'}</Field>
                <Field label="Previous block hash" testId="explore-block-prevhash" monoValue>{view.value.previousHash ?? 'Not reported'}</Field>
              </Box>

              <SectionTitle>What is in this block</SectionTitle>
              {view.value.typeCounts.length === 0 ? (
                <Typography sx={{ fontSize: '0.875rem', color: palette.text.secondary }}>No transactions. The chain still makes a block about every 77 seconds.</Typography>
              ) : (
                <Box component="ul" data-testid="explore-block-types" sx={{ m: 0, pl: 2.5, color: palette.text.primary, fontSize: '0.9375rem' }}>
                  {view.value.typeCounts.map(row => (
                    <li key={row.type ?? 'unknown'}>{txTypeLabel(row.type)}: {row.count.toLocaleString()}</li>
                  ))}
                </Box>
              )}

              {view.value.revealCommitIds.length > 0 && (
                <>
                  <SectionTitle>Station readings revealed here</SectionTitle>
                  <Box component="ul" data-testid="explore-block-proofs" sx={{ m: 0, pl: 2.5, fontFamily: mono, fontSize: '0.8125rem' }}>
                    {view.value.revealCommitIds.slice(0, MAX_PROOF_LINKS).map(id => {
                      const path = proofPagePath(id, view.value.height);
                      return <li key={id}>{path ? <RouterLink to={path}>{shortHash(id)}</RouterLink> : shortHash(id)}</li>;
                    })}
                  </Box>
                  {view.value.revealCommitIds.length > MAX_PROOF_LINKS && (
                    <Typography sx={{ mt: 1, fontSize: '0.8125rem', color: palette.text.muted }}>
                      and {(view.value.revealCommitIds.length - MAX_PROOF_LINKS).toLocaleString()} more.
                    </Typography>
                  )}
                </>
              )}

              <SectionTitle>Rewards in this block</SectionTitle>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
                <Field label="Station readings" testId="explore-block-reward-stations">{rewardLine(view.value.rewards.stations, ['reading', 'readings'])}</Field>
                <Field label="Reading checks" testId="explore-block-reward-attesters">{rewardLine(view.value.rewards.attesters, ['check', 'checks'])}</Field>
                <Field label="Block producer" testId="explore-block-reward-producer">{wrf(view.value.rewards.producerBaseUnits)}</Field>
                <Field label="Minted for readings" testId="explore-block-reward-minted">{wrf(view.value.rewards.mintedTotalBaseUnits)}</Field>
              </Box>
              <Typography sx={{ mt: 1.5, fontSize: '0.8125rem', color: palette.text.muted }}>
                Totals only. The public site does not show who was paid in a block.
              </Typography>
            </Box>
          )}

          {view.kind === 'bad' && <Message title="Not a block number">A block number is a whole number, like 19044.</Message>}
          {view.kind === 'missing' && (
            <Message title="Not found">This node has no block at this height. It may not be made yet: a new block comes about every 77 seconds.</Message>
          )}
          {view.kind === 'busy' && <Message title="Busy">Too many lookups right now. Please try again in a minute.</Message>}
          {view.kind === 'unavailable' && <Message title="Unavailable">The testnet node did not answer. Please try again in a minute.</Message>}
        </Box>
      </WrfCard>

      <Typography sx={{ mt: 2, fontSize: '0.8125rem', color: palette.text.muted }}>
        Recent blocks are on the <RouterLink to="/explore">explorer</RouterLink>. Test coins have no value.
      </Typography>
    </Box>
  );
}
