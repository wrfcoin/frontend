import React, { useCallback, useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import RefreshIcon from '@mui/icons-material/Refresh';
import StationOwnershipCard from '../station/StationOwnershipCard';
import { stationRegistrationService, type MobileStationStatus } from '../../services/apiClient';
import { WrfCard } from '../DesignSystem/WrfCard';
import { WrfBadge } from '../DesignSystem/WrfBadge';
import { WrfButton } from '../DesignSystem/WrfButton';
import { palette } from '../DesignSystem/tokens';

/**
 * The signed-in wallet's own phone station (W28, owner ruling 2026-10-02 #14: phone-station status on the web).
 *
 * The wording matches the WRFCoin app (mobile_station_status_service.dart) so the web and the phone never
 * disagree: registered and submitted stations are "awaiting activation"; an unavailable status never turns
 * into an activation claim. No location is shown. Readings are collected in the app, never here.
 */
export const AWAITING_ACTIVATION_MESSAGE =
  'Station awaiting activation. Rewards start once the network activates your station.';
export const ACTIVE_MESSAGE = 'Your phone station is active on the network.';
export const NOT_REGISTERED_MESSAGE =
  'No phone station is registered for this wallet. To add one, open the WRFCoin app with this wallet and tap '
  + 'Collect Now once on Collect.';
export const UNAVAILABLE_MESSAGE =
  'Phone station status is not available right now. Nothing about activation or rewards is confirmed; try again later.';

type View =
  | { kind: 'loading' }
  | { kind: 'none' }
  | { kind: 'status'; status: MobileStationStatus }
  | { kind: 'unavailable' };

export function phoneStationMessage(status: MobileStationStatus): string {
  return status.phase === 'on_chain' ? ACTIVE_MESSAGE : AWAITING_ACTIVATION_MESSAGE;
}

function badgeFor(view: View): { status: 'active' | 'warning' | 'neutral' | 'error'; label: string } {
  if (view.kind === 'status') {
    return view.status.phase === 'on_chain'
      ? { status: 'active', label: 'Active' }
      : { status: 'warning', label: 'Awaiting activation' };
  }
  if (view.kind === 'none') return { status: 'neutral', label: 'None' };
  if (view.kind === 'unavailable') return { status: 'error', label: 'Unavailable' };
  return { status: 'neutral', label: 'Checking' };
}

const rowLabelSx = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: palette.text.muted,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  m: 0,
} as const;

export default function PhoneStationStatusCard({ ownerAddress }: { ownerAddress: string | null }) {
  const [view, setView] = useState<View>({ kind: 'loading' });

  // Each read belongs to the owner and request that started it; a late reply for a previous owner or an
  // older request must never overwrite the current owner's view.
  const latest = useRef(0);

  const load = useCallback(async () => {
    const mine = ++latest.current;
    setView({ kind: 'loading' });
    try {
      const status = await stationRegistrationService.getMobileStationStatus();
      if (latest.current === mine) setView(status ? { kind: 'status', status } : { kind: 'none' });
    } catch {
      if (latest.current === mine) setView({ kind: 'unavailable' });
    }
  }, []);

  useEffect(() => {
    if (ownerAddress) void load();
    else latest.current += 1;
    return () => {
      latest.current += 1;
    };
  }, [ownerAddress, load]);

  // Only the signed-in owner has a phone station to show; the status read is wallet-scoped.
  if (!ownerAddress) return null;

  const badge = badgeFor(view);
  return (
    <WrfCard
      component="section"
      aria-label="Your phone station"
      data-testid="phone-station-status"
      variant="outlined"
      header={<Typography component="h2" sx={{ fontSize: '1.0625rem', fontWeight: 700, m: 0 }}>Your phone station</Typography>}
      headerAction={<WrfBadge status={badge.status} label={badge.label} />}
      footer={
        <WrfButton variant="ghost" size="sm" startIcon={<RefreshIcon fontSize="small" />} onClick={() => void load()} disabled={view.kind === 'loading'}>
          Refresh station status
        </WrfButton>
      }
      sx={{ backgroundColor: palette.background.secondary, borderRadius: '16px' }}
    >
      {view.kind === 'loading' && <Typography sx={{ color: palette.text.secondary, fontSize: '0.875rem' }}>Checking your phone station…</Typography>}
      {view.kind === 'none' && <Typography sx={{ color: palette.text.secondary, fontSize: '0.875rem' }}>{NOT_REGISTERED_MESSAGE}</Typography>}
      {view.kind === 'unavailable' && <Typography role="status" sx={{ color: palette.text.secondary, fontSize: '0.875rem' }}>{UNAVAILABLE_MESSAGE}</Typography>}
      {view.kind === 'status' && (
        <>
          <Typography sx={{ color: palette.text.secondary, fontSize: '0.875rem', mb: 2 }}>{phoneStationMessage(view.status)}</Typography>
          <Box component="dl" sx={{ display: 'grid', gridTemplateColumns: '104px minmax(0, 1fr)', rowGap: 1, columnGap: 1, m: 0, mb: 2, alignItems: 'baseline' }}>
            <Typography component="dt" sx={rowLabelSx}>Station</Typography>
            <Typography component="dd" sx={{ m: 0, fontSize: '0.8125rem', overflowWrap: 'anywhere' }}>
              <code style={{ fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace' }}>{view.status.stationId}</code>
            </Typography>
            {view.status.updatedAt && (
              <>
                <Typography component="dt" sx={rowLabelSx}>Last updated</Typography>
                <Typography component="dd" sx={{ m: 0, fontSize: '0.8125rem' }}>{new Date(view.status.updatedAt).toLocaleString()}</Typography>
              </>
            )}
          </Box>
          {/* The read-only ownership card (S7) keeps its own markup; size it to this card's rows. */}
          <Box
            sx={{
              '& h2': { fontSize: '0.75rem', fontWeight: 600, color: palette.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em', m: 0, mb: 1 },
              '& p': { fontSize: '0.8125rem', color: palette.text.secondary, m: 0, mb: 0.75, overflowWrap: 'anywhere' },
              '& code': { fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.75rem', color: palette.text.primary },
              '& strong': { color: palette.text.primary },
            }}
          >
            <StationOwnershipCard stationId={view.status.stationId} />
          </Box>
        </>
      )}
    </WrfCard>
  );
}
