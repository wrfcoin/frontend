import React from 'react';
import { Alert, Box, Stack, Typography } from '@mui/material';
import { Timeline as TrailIcon } from '@mui/icons-material';
import {
  STAGE_LABEL,
  TRAIL_STAGES,
  heldAt,
  reasonText,
  shortId,
  type StationRewardTrailView,
  type TrailRow,
  type TrailState,
} from '../../utils/stationRewardTrail';
import { useIsDarkTheme } from '../../theme/ThemeProvider';

/**
 * Reward trail (plan 2026-11-17-reward-trail, slice 1). For each recent reading of this station, the
 * plain stages it has reached on its way to the owner's wallet, each backed by a chain record:
 * submitted (the reading's commit id), accepted (block height), eligible (or why not), settled (pay
 * block height) and in wallet. A read that failed or history out of reach shows as "unknown", never as
 * "not paid". Each reading shows its own WRF amount once it is eligible (owner ruling 2026-11-19), marked
 * settled or not yet settled. There is no total and no single "earned" number: this card answers "where is
 * my reading, and what did it earn?".
 */

const text = 'var(--wrf-ds-text-primary, #F8FAFC)';
const textSecondary = 'var(--wrf-ds-text-secondary, #94A3B8)';
const border = 'var(--wrf-ds-border, rgba(148,163,184,0.24))';

const TONE: Record<TrailState, { dark: string; light: string; mark: string; word: string }> = {
  done: { dark: '#22C55E', light: '#166534', mark: '✓', word: 'done' },
  pending: { dark: '#F59E0B', light: '#92400E', mark: '…', word: 'waiting' },
  not_eligible: { dark: '#94A3B8', light: '#475569', mark: '–', word: 'not eligible' },
  unknown: { dark: '#FB923C', light: '#9A3412', mark: '?', word: 'unknown' },
  not_reached: { dark: '#64748B', light: '#64748B', mark: '', word: 'not yet' },
};

function Step({ label, state, height, amountWrf }: { label: string; state: TrailState; height: number | null; amountWrf: string | null }) {
  const isDark = useIsDarkTheme();
  const tone = TONE[state];
  const color = isDark ? tone.dark : tone.light;
  const reached = state !== 'not_reached';
  return (
    <Box sx={{ minWidth: 0, textAlign: 'center' }} aria-label={`${label}: ${tone.word}${height !== null ? `, block ${height}` : ''}${amountWrf !== null ? `, ${amountWrf} WRF` : ''}`} role="listitem">
      <Box
        aria-hidden
        sx={{
          mx: 'auto',
          width: 22,
          height: 22,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          fontSize: 13,
          fontWeight: 800,
          color: reached ? color : 'transparent',
          bgcolor: reached ? `${tone.dark}24` : 'transparent',
          border: `2px ${reached ? 'solid' : 'dashed'} ${reached ? color : border}`,
        }}
      >
        {tone.mark}
      </Box>
      <Typography
        variant="caption"
        sx={{
          display: 'block', mt: 0.5, color: reached ? text : textSecondary, fontWeight: state === 'done' ? 600 : 400,
          lineHeight: 1.2, fontSize: { xs: '0.6rem', sm: '0.75rem' }, letterSpacing: { xs: '-0.01em', sm: 0 },
          overflowWrap: 'anywhere',
        }}
      >
        {label}
      </Typography>
      {height !== null && (
        <Typography variant="caption" sx={{ display: 'block', color: textSecondary, fontSize: { xs: '0.66rem', sm: '0.72rem' } }}>
          #{height}
        </Typography>
      )}
    </Box>
  );
}

function summary(row: TrailRow): { line: string; state: TrailState } {
  const held = heldAt(row);
  if (!held) return { line: 'In the owner’s wallet.', state: 'done' };
  return {
    line: reasonText(held.step.reason) ?? `${STAGE_LABEL[held.stage]}: ${TONE[held.step.state].word}.`,
    state: held.step.state,
  };
}

function Row({ row }: { row: TrailRow }) {
  const isDark = useIsDarkTheme();
  const s = summary(row);
  const tone = TONE[s.state];
  return (
    <Box component="li" sx={{ listStyle: 'none', border: `1px solid ${border}`, borderRadius: 2, p: { xs: 1.25, sm: 1.75 } }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'baseline' }}
        spacing={{ xs: 0.25, sm: 1 }}
        sx={{ mb: 1.25, minWidth: 0 }}
      >
        <Typography variant="body2" sx={{ color: text, fontWeight: 600, whiteSpace: 'nowrap' }}>
          {row.readingHeight !== null ? `Reading in block #${row.readingHeight}` : 'Reading (block unknown)'}
        </Typography>
        <Typography
          variant="caption"
          title={row.commitId}
          sx={{ color: textSecondary, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          id {shortId(row.commitId)}
        </Typography>
      </Stack>
      <Box role="list" sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: { xs: 0.75, sm: 1 }, maxWidth: 620 }}>
        {TRAIL_STAGES.map((k) => (
          <Step
            key={k}
            label={STAGE_LABEL[k]}
            state={row.steps[k].state}
            height={k === 'accepted' || k === 'settled' ? row.steps[k].height : null}
            amountWrf={row.steps[k].amountWrf}
          />
        ))}
      </Box>
      <Typography variant="body2" sx={{ mt: 1.25, color: isDark ? tone.dark : tone.light, fontSize: '0.82rem' }}>
        {s.line}
      </Typography>
      {row.amountWrf !== null && (
        <Typography variant="body2" data-testid="trail-reading-amount" sx={{ mt: 0.5, color: text, fontSize: '0.82rem' }}>
          This reading: <Box component="span" sx={{ fontWeight: 700 }}>{row.amountWrf} WRF</Box>
          <Box component="span" sx={{ color: textSecondary }}>{row.amountSettled ? ' (settled)' : ' (eligible, not settled yet)'}</Box>
        </Typography>
      )}
    </Box>
  );
}

export interface StationRewardTrailCardProps {
  view: StationRewardTrailView | undefined;
  unavailable: boolean;
  /** How many readings to show (newest first). */
  limit?: number;
}

export default function StationRewardTrailCard({ view, unavailable, limit = 5 }: StationRewardTrailCardProps) {
  return (
    <Box data-testid="station-reward-trail">
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
        <TrailIcon sx={{ color: textSecondary }} />
        <Typography variant="h6" component="h2" sx={{ color: text, fontWeight: 700 }}>
          Reading trail
        </Typography>
      </Stack>
      <Typography variant="body2" sx={{ color: textSecondary, mb: 2 }}>
        Where this station’s newest readings are on their way to the owner’s wallet, and what each one earned.
        Each step is a chain record. Amounts are per reading, not a total.
      </Typography>

      {unavailable ? (
        <Alert severity="warning">Reading stages are unavailable right now. Nothing is assumed: try again later.</Alert>
      ) : !view ? (
        <Typography variant="body2" sx={{ color: textSecondary }}>Loading reading stages…</Typography>
      ) : view.status !== 'ok' ? (
        <Alert severity="info">{view.reason}</Alert>
      ) : (
        <>
          <Box component="ul" sx={{ m: 0, p: 0, display: 'grid', gap: 1.25 }} aria-label="Newest readings and their stages">
            {view.rows.slice(0, limit).map((row) => <Row key={row.commitId} row={row} />)}
          </Box>
          {!view.windowComplete && (
            <Typography variant="caption" sx={{ display: 'block', mt: 1.25, color: textSecondary }}>
              Older readings are not listed here.
            </Typography>
          )}
        </>
      )}

      <Typography variant="caption" sx={{ display: 'block', mt: 2, color: textSecondary }}>
        Forecasts: not paid yet (future). Skill pay is not switched on on chain.
      </Typography>
    </Box>
  );
}
