import React from 'react';
import { Alert, Box, Chip, Stack, Typography } from '@mui/material';
import { CompareArrows as CompareIcon } from '@mui/icons-material';
import {
  VARIABLE_LABEL,
  agreementWord,
  formatDifference,
  formatValue,
  headline,
  type Agreement,
  type CompareRow,
  type StationCompareView,
} from '../../utils/stationCompare';
import { useIsDarkTheme } from '../../theme/ThemeProvider';

/**
 * "How does my station compare?" (Epic 8). Shows the station's newest chain reading next to
 * nearby WRFCoin stations (a median, never a named station) and the nearest National Weather
 * Service observation. Every number is the backend's; a missing reference shows its reason.
 *
 * The values are public. The verdict on them is not: "yours +3.4°F", the close / warmer / cooler
 * labels and the "differs on" headline are shown only when `isOwner` is true (the signed-in wallet
 * owns the station). A visitor sees the same numbers side by side with no judgement of the station.
 */

const text = 'var(--wrf-ds-text-primary, #F8FAFC)';
const textSecondary = 'var(--wrf-ds-text-secondary, #94A3B8)';
const border = 'var(--wrf-ds-border, rgba(148,163,184,0.24))';

const TONE: Record<Agreement, { dark: string; light: string }> = {
  close: { dark: '#22C55E', light: '#166534' },
  higher: { dark: '#F59E0B', light: '#92400E' },
  lower: { dark: '#38BDF8', light: '#075985' },
};

const timeOf = (s: number) => new Date(s * 1000).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

function AgreementChip({ row, agreement }: { row: CompareRow; agreement: Agreement }) {
  const isDark = useIsDarkTheme();
  const tone = TONE[agreement];
  return (
    <Chip
      size="small"
      label={agreementWord(row.variable, agreement)}
      sx={{ bgcolor: `${tone.dark}1f`, color: isDark ? tone.dark : tone.light, fontWeight: 700, height: 22 }}
    />
  );
}

function Cell({ label, row, reference, extra, isOwner }: {
  label: string;
  row: CompareRow;
  reference: { value: number; difference: number; agreement: Agreement } | null;
  extra?: string;
  isOwner: boolean;
}) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" sx={{ color: textSecondary, display: 'block' }}>{label}</Typography>
      {reference ? (
        <>
          <Typography component="p" sx={{ color: text, fontWeight: 700 }}>{formatValue(row.variable, reference.value)}</Typography>
          {isOwner && (
            <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
              <Typography variant="body2" sx={{ color: textSecondary }}>
                yours {formatDifference(row.variable, reference.difference)}
              </Typography>
              <AgreementChip row={row} agreement={reference.agreement} />
            </Stack>
          )}
          {extra && <Typography variant="caption" sx={{ color: textSecondary }}>{extra}</Typography>}
        </>
      ) : (
        <Typography component="p" sx={{ color: textSecondary }}>—</Typography>
      )}
    </Box>
  );
}

export default function StationCompareCard({ view, unavailable, isOwner = false }: {
  view: StationCompareView | undefined;
  unavailable: boolean;
  /** True only when the signed-in wallet owns this station. Default false: no verdict is shown. */
  isOwner?: boolean;
}) {
  return (
    <Box data-testid="station-compare">
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <CompareIcon sx={{ color: '#38BDF8' }} />
        <Typography variant="h6" component="h2" sx={{ color: text, fontWeight: 700 }}>
          How this station compares
        </Typography>
      </Stack>
      {unavailable ? (
        <Alert severity="warning">The comparison is unavailable right now. Try again later.</Alert>
      ) : !view ? (
        <Typography sx={{ color: textSecondary }}>Loading the comparison…</Typography>
      ) : view.status !== 'ok' ? (
        <Alert severity="info">{view.reason}</Alert>
      ) : (
        <>
          <Typography sx={{ color: text, mb: 0.5 }} data-testid="station-compare-headline">{headline(view, isOwner)}</Typography>
          <Typography variant="body2" sx={{ color: textSecondary, mb: 2 }}>
            Newest reading on chain, {timeOf(view.observedAt)}. Nearby means other WRFCoin stations within {view.nearby.radiusKm} km
            {' '}(their median, shown only when at least 3 report, never any one station). NWS is the nearest National Weather Service observation.
          </Typography>
          <Stack spacing={1.5}>
            {view.rows.map(row => (
              <Box
                key={row.variable}
                data-testid={`station-compare-row-${row.variable}`}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr 1fr', sm: isOwner ? '1.1fr 1fr 1fr 1fr' : '1.1fr 1fr 1fr' },
                  gap: 1.5,
                  p: 1.5,
                  border: `1px solid ${border}`,
                  borderRadius: 2,
                }}
              >
                <Box sx={{ gridColumn: { xs: '1 / -1', sm: 'auto' } }}>
                  <Typography variant="caption" sx={{ color: textSecondary, display: 'block' }}>{VARIABLE_LABEL[row.variable]}</Typography>
                  <Typography component="p" sx={{ color: text, fontWeight: 700 }}>
                    {row.mine === null ? '—' : formatValue(row.variable, row.mine)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: textSecondary }}>{isOwner ? 'your station' : 'this station'}</Typography>
                </Box>
                <Cell
                  label={row.nearby ? `Nearby (${row.nearby.stations} stations)` : 'Nearby'}
                  row={row}
                  isOwner={isOwner}
                  reference={row.nearby ? { value: row.nearby.median, difference: row.nearby.difference, agreement: row.nearby.agreement } : null}
                  extra={row.nearby
                    ? `range ${formatValue(row.variable, row.nearby.lowest)} to ${formatValue(row.variable, row.nearby.highest)}`
                    : undefined}
                />
                <Cell
                  label={view.nws.stationIdentifier ? `NWS ${view.nws.stationIdentifier}` : 'NWS'}
                  row={row}
                  isOwner={isOwner}
                  reference={row.nws}
                />
                {isOwner && (
                  <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                    <Typography variant="caption" sx={{ color: textSecondary, display: 'block' }}>Counts as close</Typography>
                    <Typography variant="body2" sx={{ color: textSecondary }}>
                      within {formatDifference(row.variable, row.closeWithin).replace('+', '')}
                    </Typography>
                  </Box>
                )}
              </Box>
            ))}
          </Stack>
          {(view.nearby.reason || view.nws.reason || view.notCompared.length > 0) && (
            <Box component="ul" sx={{ color: textSecondary, pl: 2.5, mt: 2, mb: 0, fontSize: 14 }} data-testid="station-compare-reasons">
              {view.nearby.reason && <li>Nearby: {view.nearby.reason}</li>}
              {view.nws.reason && <li>NWS: {view.nws.reason}</li>}
              {view.notCompared.map(n => <li key={n.variable}>{n.reason}</li>)}
            </Box>
          )}
          <Typography variant="caption" sx={{ color: textSecondary, display: 'block', mt: 1.5 }}>
            {isOwner
              ? 'For your information only: this does not change rewards. The differences and the close, warmer or cooler labels are shown only to you. '
              : 'This does not change rewards. '}
            A station in a sunny spot, a valley or near a wall can read differently from its neighbours.
          </Typography>
        </>
      )}
    </Box>
  );
}
