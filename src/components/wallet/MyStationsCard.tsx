import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import RefreshIcon from '@mui/icons-material/Refresh';
import { stationRegistrationService, type MyStation, type MyStationsList } from '../../services/apiClient';
import { WrfCard } from '../DesignSystem/WrfCard';
import { WrfBadge } from '../DesignSystem/WrfBadge';
import { WrfButton } from '../DesignSystem/WrfButton';
import { palette } from '../DesignSystem/tokens';

/**
 * "My stations" (owner decision 2026-11-10): every station the signed-in wallet owns, wherever it was connected.
 * The list comes from the backend (owner-only, read by the session's wallet), so a station connected from
 * another browser shows up here. Each row: public alias and name, last reading, and the on-chain step.
 * No location is shown. Flag: FEATURES.myStations (VITE_ENABLE_MY_STATIONS); the page decides.
 */
export const MY_STATIONS_TITLE = 'Your stations';
export const MY_STATIONS_EMPTY = 'No weather station is connected to this wallet yet.';
export const MY_STATIONS_UNAVAILABLE = 'Your stations could not be loaded right now. Try again in a minute.';
export const MY_STATIONS_PASSKEY_LATER =
  'Stations owned by a passkey wallet will be listed here once the network pays passkey owners.';
export const MY_STATIONS_TRUNCATED = 'Only the first 50 stations are shown.';

const CHAIN_STEP: Record<string, string> = {
  needs_owner_signature: 'Needs your signature',
  waiting: 'Waiting to join the chain',
  earning: 'On chain, earning',
  blocked: 'Blocked on chain',
};

export function chainStepLabel(station: MyStation): string | null {
  if (station.onChain === undefined) return null;
  if (station.onChain === null) return 'On-chain step unavailable';
  return CHAIN_STEP[station.onChain.state] ?? null;
}

function freshnessBadge(station: MyStation): { status: 'active' | 'warning' | 'neutral'; label: string } {
  if (station.status === 'live') return { status: 'active', label: 'Live' };
  if (station.status === 'stale') return { status: 'warning', label: 'Quiet' };
  return { status: 'neutral', label: 'No readings yet' };
}

type View =
  | { kind: 'loading' }
  | { kind: 'list'; list: MyStationsList }
  | { kind: 'unavailable' };

export default function MyStationsCard({ ownerAddress }: { ownerAddress: string | null }) {
  const navigate = useNavigate();
  const [view, setView] = useState<View>({ kind: 'loading' });
  // A late reply for an earlier owner or request never overwrites the current one.
  const latest = useRef(0);

  const load = useCallback(async () => {
    const mine = ++latest.current;
    setView({ kind: 'loading' });
    try {
      const list = await stationRegistrationService.getMyStations();
      if (latest.current === mine) setView({ kind: 'list', list });
    } catch {
      if (latest.current === mine) setView({ kind: 'unavailable' });
    }
  }, []);

  useEffect(() => {
    if (ownerAddress) void load();
    else latest.current += 1;
    return () => { latest.current += 1; };
  }, [ownerAddress, load]);

  if (!ownerAddress) return null;

  const muted = { color: palette.text.secondary, fontSize: '0.875rem' } as const;
  return (
    <WrfCard
      component="section"
      aria-label={MY_STATIONS_TITLE}
      data-testid="my-stations"
      variant="outlined"
      header={<Typography component="h2" sx={{ fontSize: '1.0625rem', fontWeight: 700, m: 0 }}>{MY_STATIONS_TITLE}</Typography>}
      footer={(
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <WrfButton variant="ghost" size="sm" startIcon={<RefreshIcon fontSize="small" />} onClick={() => void load()} disabled={view.kind === 'loading'}>
            Refresh
          </WrfButton>
          <WrfButton variant="ghost" size="sm" onClick={() => navigate('/connect-station')}>
            Connect a station
          </WrfButton>
        </Box>
      )}
      sx={{ backgroundColor: palette.background.secondary, borderRadius: '16px' }}
    >
      {view.kind === 'loading' && <Typography role="status" sx={muted}>Loading your stations…</Typography>}
      {view.kind === 'unavailable' && <Typography role="status" sx={muted} data-testid="my-stations-unavailable">{MY_STATIONS_UNAVAILABLE}</Typography>}
      {view.kind === 'list' && view.list.passkeyLater && (
        <Typography sx={muted} data-testid="my-stations-passkey-later">{MY_STATIONS_PASSKEY_LATER}</Typography>
      )}
      {view.kind === 'list' && !view.list.passkeyLater && view.list.stations.length === 0 && (
        <Typography sx={muted} data-testid="my-stations-empty">{MY_STATIONS_EMPTY}</Typography>
      )}
      {view.kind === 'list' && view.list.stations.length > 0 && (
        <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {view.list.stations.map(station => {
            const badge = freshnessBadge(station);
            const step = chainStepLabel(station);
            return (
              <Box
                component="li"
                key={station.alias}
                data-testid="my-stations-row"
                sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1, p: 1.5, borderRadius: '12px', backgroundColor: palette.background.row }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    component={RouterLink}
                    to={`/weather/station/${station.alias}`}
                    sx={{ fontWeight: 600, fontSize: '0.9375rem', color: palette.text.primary, overflowWrap: 'anywhere', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                  >
                    {station.name}
                  </Typography>
                  <Typography sx={{ ...muted, fontSize: '0.8125rem' }}>
                    {station.lastReadingAt ? `Last reading ${new Date(station.lastReadingAt).toLocaleString()}` : 'No reading yet'}
                    {step ? ` · ${step}` : ''}
                  </Typography>
                </Box>
                <WrfBadge status={badge.status} label={badge.label} />
              </Box>
            );
          })}
        </Box>
      )}
      {view.kind === 'list' && view.list.truncated && <Typography sx={{ ...muted, mt: 1.5 }}>{MY_STATIONS_TRUNCATED}</Typography>}
    </WrfCard>
  );
}
