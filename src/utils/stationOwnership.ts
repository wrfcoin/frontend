/**
 * Read-only station ownership state from `GET /api/stations/st_<12hex>/ownership`
 * (backend server/routes/station-owner-routes.ts). Validation is fail-closed: a body missing
 * any field this view relies on is refused, never rendered as "active / not frozen".
 */
export interface PendingRecoveryView {
  fromOwner: string | null;
  toOwner: string | null;
  recoveryNonce: number;
  filedAtHeight: number;
  executableAtHeight: number;
  noticeBlocks: number;
}

export interface StationOwnershipView {
  stationAlias: string;
  owner: string | null;
  ownerNonce: number;
  frozenSinceHeight: number | null;
  ownerDeactivated: boolean;
  rewardsSuspended: boolean;
  pendingRecovery: PendingRecoveryView | null;
  observedAtHeight: number;
  settledHeight: number;
}

export type OwnershipStatus = 'active' | 'frozen' | 'deactivated';

export const OWNERSHIP_STATUS_LABEL: Record<OwnershipStatus, string> = {
  active: 'Active',
  frozen: 'Frozen',
  deactivated: 'Deactivated',
};

const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const ownerOrNull = (v: unknown): string | null | undefined =>
  v === null ? null : typeof v === 'string' ? v : undefined;

export function normalizeStationOwnership(body: unknown): StationOwnershipView {
  const bad = (): never => {
    throw new Error('Station ownership state has an unexpected shape.');
  };
  if (!isRecord(body)) return bad();
  const owner = ownerOrNull(body.owner);
  if (typeof body.stationAlias !== 'string' || owner === undefined) return bad();
  if (!isInt(body.ownerNonce) || typeof body.ownerDeactivated !== 'boolean' || typeof body.rewardsSuspended !== 'boolean') {
    return bad();
  }
  if (!isInt(body.observedAtHeight) || !isInt(body.settledHeight)) return bad();
  if (!('frozen' in body) || !('pendingRecovery' in body)) return bad();

  let frozenSinceHeight: number | null = null;
  if (body.frozen !== null) {
    if (!isRecord(body.frozen) || !isInt(body.frozen.sinceHeight)) return bad();
    frozenSinceHeight = body.frozen.sinceHeight;
  }

  let pendingRecovery: PendingRecoveryView | null = null;
  if (body.pendingRecovery !== null) {
    const p = body.pendingRecovery;
    if (!isRecord(p) || !isInt(p.recoveryNonce) || !isInt(p.filedAtHeight) || !isInt(p.executableAtHeight) || !isInt(p.noticeBlocks)) {
      return bad();
    }
    const fromOwner = ownerOrNull(p.fromOwner);
    const toOwner = ownerOrNull(p.toOwner);
    if (fromOwner === undefined || toOwner === undefined) return bad();
    pendingRecovery = {
      fromOwner,
      toOwner,
      recoveryNonce: p.recoveryNonce,
      filedAtHeight: p.filedAtHeight,
      executableAtHeight: p.executableAtHeight,
      noticeBlocks: p.noticeBlocks,
    };
  }

  return {
    stationAlias: body.stationAlias,
    owner,
    ownerNonce: body.ownerNonce,
    frozenSinceHeight,
    ownerDeactivated: body.ownerDeactivated,
    rewardsSuspended: body.rewardsSuspended,
    pendingRecovery,
    observedAtHeight: body.observedAtHeight,
    settledHeight: body.settledHeight,
  };
}

export function ownershipStatus(view: StationOwnershipView): OwnershipStatus {
  if (view.ownerDeactivated) return 'deactivated';
  if (view.frozenSinceHeight !== null) return 'frozen';
  return 'active';
}

/** Blocks left in a pending recovery's notice window at the observed height (0 = elapsed). */
export function recoveryBlocksRemaining(view: StationOwnershipView): number | null {
  if (!view.pendingRecovery) return null;
  return Math.max(0, view.pendingRecovery.executableAtHeight - view.observedAtHeight);
}
