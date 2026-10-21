import React, { useCallback, useEffect, useRef, useState } from 'react';
import { weatherService } from '../../services/apiClient';
import ApiError from '../../utils/apiError';
import {
  OWNERSHIP_STATUS_LABEL,
  ownershipStatus,
  recoveryBlocksRemaining,
  type StationOwnershipView,
} from '../../utils/stationOwnership';

export const OWNERSHIP_NOT_REGISTERED_MESSAGE = 'This station is not registered on chain yet, so it has no owner record.';
export const OWNERSHIP_UNAVAILABLE_MESSAGE =
  'Ownership state is not available right now. Nothing about the owner or status is confirmed; try again later.';

type View =
  | { kind: 'loading' }
  | { kind: 'not_registered' }
  | { kind: 'ok'; ownership: StationOwnershipView }
  | { kind: 'unavailable' };

/**
 * Read-only station ownership status (S7; parity with the app's station ownership card). One GET, no
 * signing, no owner actions. An unregistered station (404) and an unreachable or malformed answer are
 * said plainly; nothing is defaulted to "active".
 */
export default function StationOwnershipCard({ stationId }: { stationId: string }) {
  const [view, setView] = useState<View>({ kind: 'loading' });
  const latest = useRef(0);

  const load = useCallback(async () => {
    const mine = ++latest.current;
    setView({ kind: 'loading' });
    try {
      const ownership = await weatherService.getStationOwnership(stationId);
      if (latest.current === mine) setView({ kind: 'ok', ownership });
    } catch (error) {
      if (latest.current !== mine) return;
      setView(error instanceof ApiError && error.status === 404 ? { kind: 'not_registered' } : { kind: 'unavailable' });
    }
  }, [stationId]);

  useEffect(() => {
    void load();
    return () => {
      latest.current += 1;
    };
  }, [load]);

  return (
    <section aria-label="Station ownership" data-testid="station-ownership">
      <h2>Station ownership</h2>
      {view.kind === 'loading' && <p>Checking ownership…</p>}
      {view.kind === 'not_registered' && <p>{OWNERSHIP_NOT_REGISTERED_MESSAGE}</p>}
      {view.kind === 'unavailable' && <p role="status">{OWNERSHIP_UNAVAILABLE_MESSAGE}</p>}
      {view.kind === 'ok' && <OwnershipDetails ownership={view.ownership} />}
    </section>
  );
}

function OwnershipDetails({ ownership }: { ownership: StationOwnershipView }) {
  const status = ownershipStatus(ownership);
  const pending = ownership.pendingRecovery;
  const remaining = recoveryBlocksRemaining(ownership);
  return (
    <>
      <p>
        Owner: <code>{ownership.owner ?? 'Unavailable'}</code>
      </p>
      <p>
        Status: <strong data-testid="ownership-status">{OWNERSHIP_STATUS_LABEL[status]}</strong>
        {ownership.frozenSinceHeight !== null && !ownership.ownerDeactivated && <> (since block {ownership.frozenSinceHeight})</>}
      </p>
      {ownership.rewardsSuspended && <p>Rewards are suspended for this station.</p>}
      {pending ? (
        <p data-testid="ownership-pending-recovery">
          Ownership recovery pending: <code>{pending.fromOwner ?? 'Unavailable'}</code> to{' '}
          <code>{pending.toOwner ?? 'Unavailable'}</code>. Filed at block {pending.filedAtHeight}; notice window{' '}
          {pending.noticeBlocks} blocks, executable at block {pending.executableAtHeight}
          {remaining === 0 ? ' (notice window elapsed).' : `, ${remaining} blocks remaining.`}
        </p>
      ) : (
        <p>No ownership recovery is pending.</p>
      )}
      <p>Owner nonce: {ownership.ownerNonce}</p>
      <p>As of block {ownership.observedAtHeight}.</p>
    </>
  );
}
