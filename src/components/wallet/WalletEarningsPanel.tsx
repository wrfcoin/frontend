import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import QRCode from 'qrcode';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import RefreshIcon from '@mui/icons-material/Refresh';
import CallReceivedIcon from '@mui/icons-material/CallReceived';
import CallMadeIcon from '@mui/icons-material/CallMade';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import SearchIcon from '@mui/icons-material/Search';
import { Link, useInRouterContext } from 'react-router-dom';
import { walletService } from '../../services/apiClient';
import { formatBaseUnitsToWrf } from '../../services/apiClient/number';
import type { WalletBalance, WalletHistoryItem, WalletHistoryPage } from '../../services/apiClient';
import { getAuthToken, subscribeAuthToken } from '../../services/authTokenStore';
import { WrfCard } from '../DesignSystem/WrfCard';
import { WrfStatCard } from '../DesignSystem/WrfStatCard';
import { WrfBadge } from '../DesignSystem/WrfBadge';
import { WrfButton } from '../DesignSystem/WrfButton';
import { WrfAlert } from '../DesignSystem/WrfAlert';
import { WrfEmptyState } from '../DesignSystem/WrfEmptyState';
import { WrfSkeleton } from '../DesignSystem/WrfSkeleton';
import { WrfDataTable, type WrfDataTableColumn } from '../DesignSystem/WrfDataTable';
import { WrfGradientHero } from '../DesignSystem/WrfGradientHero';
import { WrfTooltip } from '../DesignSystem/WrfTooltip';
import { palette } from '../DesignSystem/tokens';
import { categoryColors } from '../../theme/tokens';
import { useViewportBelow } from '../../hooks/useViewportBelow';

/**
 * The signed-in wallet's own balance, reward totals, recent activity and Receive (S3, owner ruling
 * 2026-10-15: web parity with the WRFCoin app wallet screen), laid out to the owner-approved launch
 * mockup (frontend#557): blue balance hero, Receive card with QR, three stat cards, an activity table
 * and an aside (the phone-station card) on the right.
 *
 * Wording follows the app (wallet_reward_totals.dart): only reported chain totals are shown, an
 * unreported figure is "Not available" with its reason, and total earned is never a split of anything.
 * Amounts are exact base units formatted with BigInt math to 8 decimals; no JS float touches a balance.
 * Both reads need the wallet session's Bearer token (edge: Authorization "Bearer *"), so nothing is
 * requested without one.
 */
export const HISTORY_LIMIT = 10;
export const NOT_REPORTED = {
  earned: 'The node has not reported total earned.',
  paid: 'The node has not reported paid weather rewards.',
  pending: 'The node has not reported pending weather rewards.',
} as const;
export const EMPTY_WINDOW_MESSAGE =
  'No activity in the returned window. Older activity may exist; this page shows only the most recent window.';
export const SIGNED_OUT_MESSAGE =
  'Your wallet session is not signed in, so earnings are not loaded. Unlock your wallet again.';
export const RECEIVE_CARD_ID = 'wallet-receive';

/** Settlement words the node uses for a transfer that is submitted but not yet on chain. */
const PROCESSING_SETTLEMENTS = new Set(['processing', 'pending', 'submitted', 'unconfirmed']);

type BalanceView = { kind: 'loading' } | { kind: 'ready'; wallet: WalletBalance } | { kind: 'unavailable' };
type HistoryView = { kind: 'loading' } | { kind: 'ready'; page: WalletHistoryPage } | { kind: 'unavailable' };

const mono = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
const mask = (address: string) => (address.length <= 20 ? address : `${address.slice(0, 10)}…${address.slice(-8)}`);
const shortHash = (hash: string) => (hash.length <= 14 ? hash : `${hash.slice(0, 6)}…${hash.slice(-4)}`);
const looksLikeHash = (value: string) => /^(0x)?[0-9a-f]{64}$/i.test(value);

/** 8 fractional digits, BigInt only; null input or malformed units read "Not available". */
export function formatWrf(units: string | null | undefined): string | null {
  const text = units == null ? null : formatBaseUnitsToWrf(units, 8);
  return text === null ? null : `${text} WRF`;
}

/** "15,839.78588754 WRF" → { integer: "15,839", fraction: ".78588754", unit: "WRF" }. */
export function splitWrf(text: string): { integer: string; fraction: string; unit: string } {
  const [number, unit = 'WRF'] = text.split(' ');
  const dot = number.indexOf('.');
  return dot === -1
    ? { integer: number, fraction: '', unit }
    : { integer: number.slice(0, dot), fraction: number.slice(dot), unit };
}

/** The whole figure stays one string for assistive tech and tests; only the visual weight is split. */
function SplitAmount({ text, size = '1.75rem' }: { text: string; size?: string }) {
  const parts = splitWrf(text);
  return (
    <span style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
      {parts.integer}
      <small style={{ fontSize: `calc(${size} * 0.55)`, fontWeight: 600, color: palette.text.secondary }}>{parts.fraction} {parts.unit}</small>
    </span>
  );
}

function StatAmount({ label, units, reason, note, color, icon }: {
  label: string; units: string | null | undefined; reason: string; note: string; color: string; icon: React.ElementType;
}) {
  const text = formatWrf(units);
  return (
    <WrfStatCard
      label={label}
      color={color}
      icon={icon}
      value={
        text === null ? (
          <span>
            <Typography component="span" sx={{ fontSize: '1.125rem', fontWeight: 600, color: palette.text.secondary, display: 'block' }}>Not available</Typography>
            <Typography component="small" sx={{ display: 'block', fontSize: '0.75rem', fontWeight: 400, color: palette.text.muted, mt: 0.5, lineHeight: 1.4 }}>{reason}</Typography>
          </span>
        ) : (
          <span>
            <SplitAmount text={text} />
            <Typography component="small" sx={{ display: 'block', fontSize: '0.75rem', fontWeight: 400, color: palette.text.muted, mt: 0.5 }}>{note}</Typography>
          </span>
        )
      }
    />
  );
}

const DIRECTION_LABEL = { received: 'Received', sent: 'Sent', self: 'To self', unknown: 'Transfer' } as const;

/**
 * Newest first by reported time. Rows whose time is not reported (or unparseable) cannot be placed, so
 * they follow all timed rows in their received order (transfers, then credits); order is stable.
 */
export function mergeActivity(page: WalletHistoryPage): Array<{ item: WalletHistoryItem; reward: boolean }> {
  const rows = [
    ...page.items.map(item => ({ item, reward: false })),
    ...page.creditItems.map(item => ({ item, reward: true })),
  ].map((row, index) => {
    const t = row.item.timestamp === null ? Number.NaN : Date.parse(row.item.timestamp);
    return { ...row, t, index };
  });
  rows.sort((a, b) => {
    const aTimed = !Number.isNaN(a.t);
    const bTimed = !Number.isNaN(b.t);
    if (aTimed && bTimed) return b.t - a.t || a.index - b.index;
    if (aTimed !== bTimed) return aTimed ? -1 : 1;
    return a.index - b.index;
  });
  return rows.map(({ item, reward }) => ({ item, reward }));
}

/** Real QR code of the address, drawn as SVG rects (no innerHTML). */
export function AddressQr({ value, size = 132 }: { value: string; size?: number }) {
  const cells = useMemo(() => {
    const { modules } = QRCode.create(value, { errorCorrectionLevel: 'M' });
    const count: number = modules.size;
    const dark: string[] = [];
    for (let y = 0; y < count; y += 1) {
      for (let x = 0; x < count; x += 1) {
        if (modules.data[y * count + x]) dark.push(`M${x + 4} ${y + 4}h1v1h-1z`);
      }
    }
    return { size: count + 8, path: dark.join('') };
  }, [value]);
  return (
    <svg
      role="img"
      aria-label="QR code of your WRFCoin address"
      data-testid="receive-qr"
      viewBox={`0 0 ${cells.size} ${cells.size}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      style={{ borderRadius: 8, display: 'block' }}
    >
      <rect width={cells.size} height={cells.size} fill="#fff" />
      <path d={cells.path} fill="#000" />
    </svg>
  );
}

function CopyIconButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <WrfTooltip title={copied ? 'Copied' : label}>
      <IconButton
        size="small"
        aria-label={copied ? 'Copied' : label}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            setCopied(false);
          }
        }}
        sx={{ color: copied ? palette.success.main : palette.text.secondary, p: 0.5 }}
      >
        {copied ? <CheckIcon sx={{ fontSize: 16 }} /> : <ContentCopyIcon sx={{ fontSize: 16 }} />}
      </IconButton>
    </WrfTooltip>
  );
}

/** The hash goes to /search (no per-transaction explorer route exists on the public site). */
function HashLink({ hash }: { hash: string }) {
  const inRouter = useInRouterContext();
  const href = `/search?q=${encodeURIComponent(hash)}`;
  const label = `Find ${shortHash(hash)} in search`;
  const icon = <SearchIcon sx={{ fontSize: 16 }} />;
  const sx = { color: palette.text.secondary, p: 0.5 };
  return inRouter
    ? <IconButton size="small" aria-label={label} component={Link} to={href} sx={sx}>{icon}</IconButton>
    : <IconButton size="small" aria-label={label} href={href} sx={sx}>{icon}</IconButton>;
}

type ActivityKind = 'reward' | 'sent' | 'received' | 'self' | 'registration' | 'unknown';

function activityKind(item: WalletHistoryItem, reward: boolean): ActivityKind {
  if (reward) return 'reward';
  if (item.type && /registration/i.test(item.type)) return 'registration';
  if (item.direction === 'sent' || item.direction === 'received' || item.direction === 'self') return item.direction;
  return 'unknown';
}

const KIND_LOOK: Record<ActivityKind, { icon: React.ElementType; color: string }> = {
  reward: { icon: EmojiEventsIcon, color: palette.success.main },
  received: { icon: CallReceivedIcon, color: palette.success.main },
  sent: { icon: CallMadeIcon, color: palette.error.main },
  self: { icon: SwapVertIcon, color: palette.text.secondary },
  registration: { icon: PhoneAndroidIcon, color: palette.text.secondary },
  unknown: { icon: SwapVertIcon, color: palette.text.secondary },
};

export interface ActivityTableRow extends Record<string, unknown> {
  id: string;
  item: WalletHistoryItem;
  reward: boolean;
  kind: ActivityKind;
  title: string;
  amount: string;
  time: string;
  hash: string;
}

export function toActivityRow({ item, reward }: { item: WalletHistoryItem; reward: boolean }): ActivityTableRow {
  const kind = activityKind(item, reward);
  const title = reward ? 'Reward' : kind === 'registration' ? 'Station registration' : DIRECTION_LABEL[item.direction];
  const amount = formatWrf(item.amount);
  const sign = item.direction === 'sent' ? '-' : item.direction === 'received' || reward ? '+' : '';
  const timed = item.timestamp !== null && !Number.isNaN(Date.parse(item.timestamp));
  return {
    id: `${reward ? 'c' : 't'}-${item.id}`,
    item,
    reward,
    kind,
    title,
    amount: amount === null ? '' : `${sign}${amount}`,
    time: timed ? new Date(item.timestamp as string).toLocaleString() : '',
    hash: looksLikeHash(item.id) ? item.id : '',
  };
}

function captionFor(row: ActivityTableRow): string {
  const { item, reward } = row;
  const parts: string[] = [];
  if (reward) parts.push(item.blockHeight !== null ? `Weather reward · height ${item.blockHeight.toLocaleString()}` : 'Weather reward');
  else if (row.kind === 'registration') parts.push(item.blockHeight !== null ? `Included on chain · height ${item.blockHeight.toLocaleString()}` : 'Station registration');
  else if (item.direction === 'sent' && item.counterparty) parts.push(`To ${mask(item.counterparty)}`);
  else if (item.direction === 'received' && item.counterparty) parts.push(`From ${mask(item.counterparty)}`);
  else if (item.direction === 'self') parts.push('Your own account');
  else if (item.counterparty) parts.push(mask(item.counterparty));
  if (!reward && row.kind !== 'registration' && item.settlement) parts.push(item.settlement);
  return parts.join(' · ');
}

const TypeCell: React.FC<{ row: ActivityTableRow }> = ({ row }) => {
  const look = KIND_LOOK[row.kind];
  const Icon = look.icon;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
      <Box aria-hidden="true" sx={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${look.color}26`, color: look.color }}>
        <Icon sx={{ fontSize: 18 }} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography component="span" sx={{ display: 'block', fontWeight: 600, fontSize: '0.875rem' }}>{row.title}</Typography>
        <Typography component="span" title={row.item.counterparty ?? undefined} sx={{ display: 'block', fontSize: '0.75rem', color: palette.text.muted, overflowWrap: 'anywhere' }}>{captionFor(row)}</Typography>
      </Box>
    </Box>
  );
};

const AmountCell: React.FC<{ row: ActivityTableRow; compact: boolean }> = ({ row, compact }) => {
  if (row.amount === '') {
    return <Typography component="span" sx={{ fontSize: '0.8125rem', color: palette.text.muted }}>Amount not reported</Typography>;
  }
  const color = row.amount.startsWith('-') ? palette.error.light : row.amount.startsWith('+') ? palette.success.light : palette.text.secondary;
  const parts = splitWrf(row.amount);
  return (
    <Typography component="strong" sx={{ fontSize: '0.875rem', fontWeight: 600, color, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
      {parts.integer}{parts.fraction}
      {compact ? null : <Typography component="span" sx={{ fontSize: '0.75rem', color: palette.text.muted }}>{' '}{parts.unit}</Typography>}
    </Typography>
  );
};

const TimeCell: React.FC<{ row: ActivityTableRow }> = ({ row }) => (
  row.time
    ? <Typography component="span" sx={{ fontSize: '0.8125rem', color: palette.text.secondary, whiteSpace: 'nowrap' }}>{row.time}</Typography>
    : <Typography component="span" title="Time not reported" sx={{ fontSize: '0.8125rem', color: palette.text.muted }}>
      <span aria-hidden="true">—</span>
      <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>Time not reported</span>
    </Typography>
);

const HashCell: React.FC<{ row: ActivityTableRow }> = ({ row }) => (
  row.hash
    ? <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, whiteSpace: 'nowrap' }}>
      <Typography component="code" title={row.hash} sx={{ fontFamily: mono, fontSize: '0.75rem', color: palette.text.secondary }}>{shortHash(row.hash)}</Typography>
      <CopyIconButton value={row.hash} label={`Copy hash ${shortHash(row.hash)}`} />
      <HashLink hash={row.hash} />
    </Box>
    : <Typography component="span" sx={{ fontSize: '0.8125rem', color: palette.text.muted }}>—</Typography>
);

function activityColumns(compact: boolean): WrfDataTableColumn<ActivityTableRow>[] {
  const columns: WrfDataTableColumn<ActivityTableRow>[] = [
    { key: 'title', label: 'Type', render: (_value, row) => <TypeCell row={row} /> },
    { key: 'amount', label: 'Amount', render: (_value, row) => <AmountCell row={row} compact={compact} /> },
  ];
  if (!compact) {
    columns.push({ key: 'time', label: 'Time', render: (_value, row) => <TimeCell row={row} /> });
    columns.push({ key: 'hash', label: 'Hash', render: (_value, row) => <HashCell row={row} /> });
  }
  return columns;
}

const cardHeading = (text: string) => (
  <Typography component="h2" sx={{ fontSize: '1.0625rem', fontWeight: 700, m: 0 }}>{text}</Typography>
);

/**
 * Props. `onAvailableUnits` reports the balance the panel knows (exact base units) to whoever renders
 * Send, and `null` while loading or when the node did not answer: the Send form then does not gate.
 */
export default function WalletEarningsPanel({ ownerAddress, aside, onAvailableUnits }: { ownerAddress: string | null; aside?: React.ReactNode; onAvailableUnits?: (units: string | null) => void }) {
  const token = useSyncExternalStore(subscribeAuthToken, getAuthToken, () => '');
  const signedIn = token.trim() !== '';
  const [balance, setBalance] = useState<BalanceView>({ kind: 'loading' });
  const [history, setHistory] = useState<HistoryView>({ kind: 'loading' });
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);
  const [copy, setCopy] = useState<'idle' | 'copied' | 'failed'>('idle');
  const compact = useViewportBelow(600);

  // A reply belongs to the owner and request that started it; a late reply never overwrites a newer view.
  const latest = useRef(0);
  const report = useRef(onAvailableUnits);
  report.current = onAvailableUnits;

  const load = useCallback(async (address: string) => {
    const mine = ++latest.current;
    setBalance({ kind: 'loading' });
    report.current?.(null);
    setHistory({ kind: 'loading' });
    const [wallet, page] = await Promise.allSettled([
      Promise.resolve().then(() => walletService.getBalance(address)),
      Promise.resolve().then(() => walletService.getWalletHistory(address, { limit: HISTORY_LIMIT, offset: 0 })),
    ]);
    if (latest.current !== mine) return;
    setBalance(wallet.status === 'fulfilled' ? { kind: 'ready', wallet: wallet.value } : { kind: 'unavailable' });
    report.current?.(wallet.status === 'fulfilled' ? wallet.value.balance : null);
    setHistory(page.status === 'fulfilled' ? { kind: 'ready', page: page.value } : { kind: 'unavailable' });
    setLoadedAt(new Date());
  }, []);

  useEffect(() => {
    if (ownerAddress && signedIn) void load(ownerAddress);
    else latest.current += 1;
    return () => {
      latest.current += 1;
    };
  }, [ownerAddress, signedIn, load]);

  const copyAddress = useCallback(async () => {
    if (!ownerAddress) return;
    try {
      await navigator.clipboard.writeText(ownerAddress);
      setCopy('copied');
    } catch {
      setCopy('failed');
    }
  }, [ownerAddress]);

  const rows = useMemo(
    () => (history.kind === 'ready' ? mergeActivity(history.page).map(toActivityRow) : []),
    [history],
  );
  const columns = useMemo(() => activityColumns(compact), [compact]);
  const processing = rows.filter(row => !row.reward && row.item.settlement !== null && PROCESSING_SETTLEMENTS.has(row.item.settlement.toLowerCase())).length;

  if (!ownerAddress) return aside ? <>{aside}</> : null;

  const wallet = balance.kind === 'ready' ? balance.wallet : null;
  const balanceText = wallet ? formatWrf(wallet.balance) : null;
  const balanceParts = balanceText ? splitWrf(balanceText) : null;
  const loadedLabel = loadedAt ? `Loaded ${loadedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : null;
  const activityCount = history.kind === 'ready' ? history.page.items.length + history.page.creditItems.length : 0;

  const receiveCard = (
    <WrfCard
      id={RECEIVE_CARD_ID}
      variant="outlined"
      header={cardHeading('Receive')}
      headerAction={<Typography component="span" sx={{ fontSize: '0.75rem', color: palette.text.muted }}>Scan or copy</Typography>}
      sx={{ backgroundColor: palette.background.secondary, borderRadius: '16px', scrollMarginTop: 96 }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
        <Typography sx={{ fontSize: '0.8125rem', color: palette.text.secondary, textAlign: 'center', m: 0 }}>Share this address to receive WRF on the testnet.</Typography>
        <AddressQr value={ownerAddress} />
        <Typography
          component="output"
          aria-label="Your WRFCoin address"
          sx={{ display: 'block', fontFamily: mono, fontSize: '0.6875rem', color: palette.text.secondary, overflowWrap: 'anywhere', textAlign: 'center', lineHeight: 1.5 }}
        >
          {ownerAddress}
        </Typography>
        <WrfButton variant="outline" size="sm" startIcon={<ContentCopyIcon fontSize="small" />} onClick={() => void copyAddress()}>Copy address</WrfButton>
        {copy === 'copied' && <Typography role="status" sx={{ fontSize: '0.75rem', color: palette.success.light }}>Address copied</Typography>}
        {copy === 'failed' && <Typography role="status" sx={{ fontSize: '0.75rem', color: palette.warning.light }}>Could not copy; select the address above instead.</Typography>}
      </Box>
    </WrfCard>
  );

  return (
    <Box component="section" aria-label="Your earnings" data-testid="wallet-earnings" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {!signedIn && <WrfAlert severity="info" role="status">{SIGNED_OUT_MESSAGE}</WrfAlert>}

      {/* Top grid: balance hero + Receive */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 300px' }, gap: 2, alignItems: 'stretch' }}>
        {signedIn && (
          balance.kind === 'loading' ? (
            <WrfSkeleton variant="rect" height={200} sx={{ borderRadius: '16px' }} />
          ) : balance.kind === 'unavailable' ? (
            <WrfGradientHero variant="muted" label="Available balance" value="Not available" sub={<span role="status">Balance is not available right now. Try again later.</span>} />
          ) : (
            <WrfGradientHero
              variant="blue"
              label="Available balance"
              value={balanceParts ? balanceParts.integer : 'Not available'}
              fraction={balanceParts ? balanceParts.fraction : undefined}
              unit={balanceParts ? ` ${balanceParts.unit}` : undefined}
              valueProps={{ 'data-testid': 'wallet-balance' }}
              sub={loadedLabel}
            >
              {processing > 0 && (
                <WrfBadge
                  status="info"
                  label={`${processing} transfer${processing === 1 ? '' : 's'} processing`}
                  // The white label needs a darker chip than the hero to hold 4.5:1 in both themes (the pale
                  // white-18% chip gave 4.1:1); a slate-900 32% chip holds 7.8:1.
                  sx={{ backgroundColor: 'rgba(15, 23, 42, 0.32)', color: '#FFFFFF' }}
                />
              )}
            </WrfGradientHero>
          )
        )}
        {receiveCard}
      </Box>

      {signedIn && (
        <>
          {/* Reward totals */}
          {balance.kind === 'ready' && wallet ? (
            <Box component="section" aria-label="Reward totals" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 2, m: 0 }}>
              <StatAmount label="Total earned" units={wallet.earnedBalanceTotal} reason={NOT_REPORTED.earned} note="Lifetime, reported by the node" color={palette.primary.main} icon={ShowChartIcon} />
              <StatAmount label="Weather paid" units={wallet.weatherRewards} reason={wallet.weatherRewardsUnavailable ?? NOT_REPORTED.paid} note="Settled weather rewards" color={categoryColors.weather} icon={WbSunnyIcon} />
              <StatAmount label="Weather pending" units={wallet.weatherRewardsPending} reason={NOT_REPORTED.pending} note="Accrued, not yet paid out" color={palette.warning.main} icon={HourglassTopIcon} />
            </Box>
          ) : balance.kind === 'loading' ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
              {[0, 1, 2].map(i => <WrfSkeleton key={i} variant="rect" height={104} sx={{ borderRadius: '16px' }} />)}
            </Box>
          ) : (
            <Typography role="status" sx={{ color: palette.text.secondary, fontSize: '0.875rem' }}>Reward totals are not available right now.</Typography>
          )}

          {/* Bottom grid: activity + aside */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 300px' }, gap: 2, alignItems: 'start' }}>
            <WrfCard
              variant="outlined"
              noPadding
              header={cardHeading('Recent activity')}
              headerAction={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {history.kind === 'ready' && activityCount > 0 && (
                    <Typography component="span" sx={{ fontSize: '0.75rem', color: palette.text.muted, display: { xs: 'none', sm: 'inline' } }}>
                      Most recent window · {activityCount}{history.page.totalInWindow !== null ? ` of ${history.page.totalInWindow}` : ''}
                    </Typography>
                  )}
                  <WrfButton variant="ghost" size="sm" startIcon={<RefreshIcon fontSize="small" />} onClick={() => void load(ownerAddress)} disabled={balance.kind === 'loading'}>
                    Refresh earnings
                  </WrfButton>
                </Box>
              }
              footer={
                history.kind === 'ready' && activityCount > 0 ? (
                  <Typography component="span" sx={{ fontSize: '0.75rem', color: palette.text.muted }}>
                    Showing the most recent window. Older activity may exist.
                  </Typography>
                ) : undefined
              }
              sx={{ backgroundColor: palette.background.secondary, borderRadius: '16px' }}
            >
              {history.kind === 'loading' && <Box sx={{ p: 2 }}><WrfSkeleton variant="rect" height={180} /></Box>}
              {history.kind === 'unavailable' && (
                <Typography role="status" sx={{ p: 2.5, color: palette.text.secondary, fontSize: '0.875rem' }}>Activity is not available right now. Try again later.</Typography>
              )}
              {history.kind === 'ready' && (activityCount === 0
                ? <WrfEmptyState
                  variant="default"
                  title="No activity yet"
                  description={history.page.complete === true ? 'No activity yet.' : EMPTY_WINDOW_MESSAGE}
                  sx={{ background: 'none' }}
                />
                : <WrfDataTable<ActivityTableRow>
                  data-testid="wallet-activity"
                  columns={columns}
                  data={rows}
                  pagination={false}
                  sx={{ border: 'none', borderRadius: 0, backgroundColor: 'transparent' }}
                />)}
            </WrfCard>
            {aside}
          </Box>
        </>
      )}
      {!signedIn && aside}
    </Box>
  );
}
