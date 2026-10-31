import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import LinkIcon from '@mui/icons-material/Link';
import RefreshIcon from '@mui/icons-material/Refresh';
import { WrfCard } from '../DesignSystem/WrfCard';
import { WrfTooltip } from '../DesignSystem/WrfTooltip';
import { WrfStatCard } from '../DesignSystem/WrfStatCard';
import { WrfBadge } from '../DesignSystem/WrfBadge';
import { WrfButton } from '../DesignSystem/WrfButton';
import { WrfEmptyState } from '../DesignSystem/WrfEmptyState';
import { WrfSkeleton } from '../DesignSystem/WrfSkeleton';
import { palette, spacingScale, borderRadiusScale } from '../DesignSystem/tokens';
import { publicReadonlyApi } from '../../config/publicReadonlyApi';
import AddressLookup from './AddressLookup';

/**
 * The public block explorer (/explore; /explorer redirects here).
 *
 * One read of the 25 most recent blocks from the public edge, shown as
 * cards (frontend#561): height, local time, transaction count, short hash
 * with copy, and a permalink to the card. Nothing here is fabricated: a
 * field the API did not send renders as "unavailable". Above the blocks, an
 * address box (AddressLookup) shows an address's balance and earned total.
 */

type BlockRow = Record<string, unknown>;

export interface ExplorerBlock {
  height: number | null;
  hash: string | null;
  previousHash: string | null;
  timestamp: string | number | null;
  transactions: number | null;
}

export function extractRows(payload: unknown): BlockRow[] {
  if (Array.isArray(payload)) return payload as BlockRow[];
  if (!payload || typeof payload !== 'object') return [];
  const body = payload as Record<string, unknown>;
  for (const key of ['blocks', 'data', 'items']) {
    if (Array.isArray(body[key])) return body[key] as BlockRow[];
  }
  return [];
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/** Normalises one backend block row; unknown fields become null, never a guess. */
export function toExplorerBlock(row: BlockRow): ExplorerBlock {
  const timestamp = row.timestamp;
  return {
    height: asNumber(row.height ?? row.number ?? row.blockNumber),
    hash: asString(row.hash ?? row.blockHash),
    previousHash: asString(row.previousHash ?? row.prev_block_hash ?? row.parentHash),
    timestamp: typeof timestamp === 'string' || typeof timestamp === 'number' ? timestamp : null,
    transactions: asNumber(row.transactions ?? row.tx_count ?? row.txCount ?? row.transactionCount),
  };
}

/** core4 emits RFC3339 strings; accept epoch seconds/millis too. */
export function parseBlockDate(timestamp: string | number | null): Date | null {
  if (timestamp === null) return null;
  const millis = typeof timestamp === 'number' ? (timestamp < 1e12 ? timestamp * 1000 : timestamp) : Date.parse(timestamp);
  if (!Number.isFinite(millis)) return null;
  const date = new Date(millis);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function shortHash(hash: string | null): string {
  if (!hash) return 'unavailable';
  const bare = hash.startsWith('0x') ? hash.slice(2) : hash;
  if (bare.length <= 16) return hash;
  return `${hash.startsWith('0x') ? '0x' : ''}${bare.slice(0, 8)}…${bare.slice(-6)}`;
}

/** "just now", "4 min ago", "2 h ago", "3 d ago"; null when unknown. */
export function relativeTime(date: Date | null, now: number = Date.now()): string | null {
  if (!date) return null;
  const seconds = Math.max(0, Math.round((now - date.getTime()) / 1000));
  if (seconds < 45) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

const localTime = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
});

async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Clipboard access denied: the full hash stays in the tooltip/title.
  }
  return false;
}

const CopyButton: React.FC<{ text: string; label: string; icon?: React.ReactNode }> = ({ text, label, icon }) => {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);
  return (
    <WrfTooltip title={copied ? 'Copied' : label}>
      <IconButton
        size="small"
        aria-label={copied ? 'Copied' : label}
        onClick={async () => {
          if (await copyText(text)) setCopied(true);
        }}
        sx={{ color: copied ? palette.success.main : palette.text.secondary }}
      >
        {copied ? <CheckIcon fontSize="small" /> : icon ?? <ContentCopyIcon fontSize="small" />}
      </IconButton>
    </WrfTooltip>
  );
};

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: `${spacingScale.sm}px`,
      minHeight: 32,
    }}
  >
    <Typography
      component="span"
      sx={{ fontSize: '0.75rem', fontWeight: 600, color: palette.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}
    >
      {label}
    </Typography>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '2px', minWidth: 0, textAlign: 'right' }}>{children}</Box>
  </Box>
);

export const BlockCard: React.FC<{ block: ExplorerBlock; now?: number }> = ({ block, now }) => {
  const date = parseBlockDate(block.timestamp);
  const heightLabel = block.height === null ? 'unavailable' : block.height.toLocaleString();
  const anchor = block.height === null ? undefined : `block-${block.height}`;
  const permalink =
    anchor && typeof window !== 'undefined'
      ? `${window.location.origin}/explore#${anchor}`
      : null;
  const relative = relativeTime(date, now);

  return (
    <WrfCard
      id={anchor}
      variant="outlined"
      data-testid="explorer-block-card"
      header={
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 1 }}>
          <Typography component="h2" sx={{ fontSize: '1.125rem', fontWeight: 700, m: 0, color: palette.text.primary }}>
            Block {heightLabel}
          </Typography>
          <WrfBadge
            status={block.transactions === null ? 'neutral' : block.transactions > 0 ? 'info' : 'neutral'}
            label={
              block.transactions === null
                ? 'txs unavailable'
                : `${block.transactions.toLocaleString()} ${block.transactions === 1 ? 'tx' : 'txs'}`
            }
          />
        </Box>
      }
      sx={{ scrollMarginTop: 96, backgroundColor: palette.background.secondary, borderRadius: `${borderRadiusScale.md}px` }}
    >
      <Row label="Time">
        {date ? (
          <Typography component="time" dateTime={date.toISOString()} sx={{ fontSize: '0.875rem', color: palette.text.primary }}>
            {localTime.format(date)}
            {relative ? (
              <Typography component="span" sx={{ fontSize: '0.75rem', color: palette.text.muted, ml: 1 }}>
                {relative}
              </Typography>
            ) : null}
          </Typography>
        ) : (
          <Typography component="span" sx={{ fontSize: '0.875rem', color: palette.text.muted }}>unavailable</Typography>
        )}
      </Row>
      <Row label="Hash">
        <Typography
          component="code"
          title={block.hash ?? undefined}
          sx={{ fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.8125rem', color: palette.text.primary }}
        >
          {shortHash(block.hash)}
        </Typography>
        {block.hash ? <CopyButton text={block.hash} label="Copy block hash" /> : null}
      </Row>
      <Row label="Previous">
        <Typography
          component="code"
          title={block.previousHash ?? undefined}
          sx={{ fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.8125rem', color: palette.text.secondary }}
        >
          {shortHash(block.previousHash)}
        </Typography>
        {block.previousHash ? <CopyButton text={block.previousHash} label="Copy previous block hash" /> : null}
      </Row>
      <Row label="Link">
        {permalink ? (
          <>
            <Typography component="a" href={`#${anchor}`} sx={{ fontSize: '0.8125rem', color: palette.text.link, textDecoration: 'none' }}>
              /explore#{anchor}
            </Typography>
            <CopyButton text={permalink} label="Copy link to this block" icon={<LinkIcon fontSize="small" />} />
          </>
        ) : (
          <Typography component="span" sx={{ fontSize: '0.875rem', color: palette.text.muted }}>unavailable</Typography>
        )}
      </Row>
    </WrfCard>
  );
};

type LoadState = 'loading' | 'ready' | 'error';

export default function PublicReadOnlyExplorer() {
  const [blocks, setBlocks] = useState<ExplorerBlock[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [reloadToken, setReloadToken] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const controller = new globalThis.AbortController();
    setState('loading');
    fetch(publicReadonlyApi.blocks, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error(`blocks request failed: ${response.status}`);
        return response.json();
      })
      .then(payload => {
        setBlocks(extractRows(payload).map(toExplorerBlock));
        setNow(Date.now());
        setState('ready');
      })
      .catch(requestError => {
        if (requestError?.name !== 'AbortError') setState('error');
      });
    return () => controller.abort();
  }, [reloadToken]);

  const refresh = useCallback(() => setReloadToken(token => token + 1), []);

  const latest = useMemo(
    () => blocks.reduce<ExplorerBlock | null>((best, block) => (block.height !== null && (best === null || best.height === null || block.height > best.height) ? block : best), null),
    [blocks],
  );
  const latestDate = parseBlockDate(latest?.timestamp ?? null);
  const txTotal = blocks.reduce((sum, block) => sum + (block.transactions ?? 0), 0);

  return (
    <Box
      data-testid="public-readonly-explorer"
      // Extra bottom room on phones so the last card scrolls clear of the pinned Start bar.
      sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 3 }, pt: { xs: 2, md: 3 }, pb: { xs: 10, md: 3 } }}
    >
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight={700} sx={{ m: 0 }}>Block Explorer</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            The most recent blocks reported by the testnet's public read-only API. Per-transaction detail is not published on the public site.
          </Typography>
        </Box>
        <WrfButton variant="outline" size="sm" onClick={refresh} startIcon={<RefreshIcon fontSize="small" />} disabled={state === 'loading'}>
          Refresh
        </WrfButton>
      </Box>

      <AddressLookup />

      {state === 'loading' && (
        <Box aria-busy="true" aria-label="Loading blocks" role="status" data-testid="explorer-loading">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
            {[0, 1, 2].map(i => <WrfSkeleton key={i} variant="rect" height={104} sx={{ borderRadius: `${borderRadiusScale.lg}px` }} />)}
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
            {[0, 1, 2, 3, 4, 5].map(i => <WrfSkeleton key={i} variant="rect" height={220} sx={{ borderRadius: `${borderRadiusScale.md}px` }} />)}
          </Box>
        </Box>
      )}

      {state === 'error' && (
        <WrfEmptyState
          variant="error"
          title="Live block data is unavailable"
          description="The testnet's public API did not answer. Nothing is shown rather than a stale or made-up list."
          actionLabel="Try again"
          onAction={refresh}
        />
      )}

      {state === 'ready' && blocks.length === 0 && (
        <WrfEmptyState
          variant="no-data"
          title="No blocks were returned"
          description="The testnet API answered with an empty list."
          actionLabel="Refresh"
          onAction={refresh}
        />
      )}

      {state === 'ready' && blocks.length > 0 && (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }} data-testid="explorer-stats">
            <WrfStatCard label="Latest height" value={latest?.height === null || latest === null ? 'unavailable' : latest.height.toLocaleString()} />
            <WrfStatCard
              label="Latest block"
              value={latestDate ? localTime.format(latestDate) : 'unavailable'}
              color={palette.info.main}
            />
            <WrfStatCard
              label={`Transactions in ${blocks.length} blocks`}
              value={txTotal.toLocaleString()}
              color={palette.secondary.main}
            />
          </Box>
          <Box
            component="ul"
            aria-label="Recent blocks"
            sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2 }}
          >
            {blocks.map((block, index) => (
              <Box component="li" key={`${block.height ?? index}-${block.hash ?? index}`} sx={{ minWidth: 0 }}>
                <BlockCard block={block} now={now} />
              </Box>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}
