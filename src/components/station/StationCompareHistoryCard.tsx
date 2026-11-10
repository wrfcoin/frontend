import React from 'react';
import { Box, Chip, Stack, Typography } from '@mui/material';
import { Lock as LockIcon, Timeline as TimelineIcon } from '@mui/icons-material';
import { VARIABLE_LABEL } from '../../utils/stationCompare';
import { detailSentence, usualSentence, type StationCompareHistoryView } from '../../utils/stationCompareHistory';

/**
 * "Your station over the last 30 days" (Epic 8). Shown only to the wallet that owns the station:
 * the backend refuses everyone else, and the page renders this card only when it got an answer.
 * Every number is the backend's.
 */

const text = 'var(--wrf-ds-text-primary, #F8FAFC)';
const textSecondary = 'var(--wrf-ds-text-secondary, #94A3B8)';
const border = 'var(--wrf-ds-border, rgba(148,163,184,0.24))';

const dayOf = (s: number) => new Date(s * 1000).toLocaleDateString([], { month: 'short', day: 'numeric' });

export default function StationCompareHistoryCard({ view }: { view: StationCompareHistoryView }) {
  return (
    <Box data-testid="station-compare-history">
      <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap" sx={{ mb: 1 }}>
        <TimelineIcon sx={{ color: '#38BDF8' }} />
        <Typography variant="h6" component="h2" sx={{ color: text, fontWeight: 700 }}>
          Your station over the last {view.days} days
        </Typography>
        <Chip
          size="small"
          icon={<LockIcon sx={{ fontSize: 14 }} />}
          label="Only you can see this"
          variant="outlined"
          sx={{ color: textSecondary, borderColor: border, '& .MuiChip-icon': { color: textSecondary } }}
        />
      </Stack>
      {view.status === 'not_enough_data' ? (
        <Typography sx={{ color: textSecondary }} data-testid="station-compare-history-waiting">
          Not enough history yet. This compares your station with the nearest National Weather Service station about
          once an hour, and needs at least {view.pairsNeeded} comparisons on {view.daysNeeded} different days. So far:{' '}
          {view.pairs} {view.pairs === 1 ? 'comparison' : 'comparisons'} on {view.daysWithData}{' '}
          {view.daysWithData === 1 ? 'day' : 'days'}.
        </Typography>
      ) : (
        <>
          <Typography variant="body2" sx={{ color: textSecondary, mb: 2 }}>
            Hourly readings from {dayOf(view.from)} to {dayOf(view.to)}, next to National Weather Service station{' '}
            {view.referenceStation}.
          </Typography>
          <Stack spacing={1.5}>
            {view.rows.map(row => (
              <Box
                key={row.variable}
                data-testid={`station-compare-history-row-${row.variable}`}
                sx={{ p: 1.5, border: `1px solid ${border}`, borderRadius: 2 }}
              >
                <Typography variant="caption" sx={{ color: textSecondary, display: 'block' }}>{VARIABLE_LABEL[row.variable]}</Typography>
                <Typography component="p" sx={{ color: text, fontWeight: 700 }}>{usualSentence(row, view.referenceStation)}</Typography>
                <Typography variant="body2" sx={{ color: textSecondary }}>{detailSentence(row)}</Typography>
              </Box>
            ))}
          </Stack>
          <Typography variant="caption" sx={{ color: textSecondary, display: 'block', mt: 1.5 }}>
            For your information only: this does not change rewards. A station in a sunny spot, a valley or near a wall
            can read differently from an airport station some distance away.
          </Typography>
        </>
      )}
    </Box>
  );
}
