import { useEffect, useMemo, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';
import CelebrationIcon from '@mui/icons-material/Celebration';
import IosShareIcon from '@mui/icons-material/IosShare';
import type { EarningsHistoryEntry } from '../../services/apiClient/types';
import { formatExactAmount } from '../../services/apiClient/amountPrecision';
import { toBaseUnits } from '../../services/apiClient/number';
import { downloadOrShareEarnCard } from '../../utils/earnShareCard';

type Props = { stationId: string; stationName: string; history: EarningsHistoryEntry[]; walletAddress?: string | null };

export default function FirstEarnCelebration({ stationId, stationName, history, walletAddress = null }: Props) {
  const firstEarn = useMemo(() => history.find(entry => (toBaseUnits(entry.amount) ?? 0n) > 0n) ?? null, [history]);
  // Once per STATION, never per user: a user is celebrated for each piece of
  // equipment they bring onboard, so a second station must still celebrate even
  // though the same wallet already dismissed the first. walletAddress is still
  // used for the share card below, but must not key this dismissal.
  const storageKey = `wrfcoin:first-earned:${stationId}`;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (firstEarn && !localStorage.getItem(storageKey)) setOpen(true);
  }, [firstEarn, storageKey]);

  if (!firstEarn) return null;
  const dismiss = () => { localStorage.setItem(storageKey, firstEarn.id); setOpen(false); };
  const share = async () => { await downloadOrShareEarnCard({ heading: 'My first WRF earned', amount: firstEarn.amount, walletAddress }); dismiss(); };

  const amountLabel = formatExactAmount(firstEarn.amount, 4);
  return <Dialog open={open} onClose={dismiss} aria-labelledby="first-earned-title">
    <DialogTitle id="first-earned-title"><Stack direction="row" gap={1} alignItems="center"><CelebrationIcon color="warning" />Your station is earning WRF</Stack></DialogTitle>
    <DialogContent><Typography>{stationName} received its first verified reward: <strong>{amountLabel} WRF</strong>.</Typography><Typography variant="body2" sx={{ mt: 1 }}>This is an on-chain reward from your station history, not a projection.</Typography></DialogContent>
    <DialogActions><Button onClick={dismiss}>Not now</Button><Button variant="contained" startIcon={<IosShareIcon />} onClick={() => { void share(); }}>Share my card</Button></DialogActions>
  </Dialog>;
}
