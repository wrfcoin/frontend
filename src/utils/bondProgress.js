/**
 * Where one node stands on the way to a bonded node, worked out from two public lists only:
 *
 *   - GET /api/bond-admission/recent: `{ admissions: [{ action, deploymentId, serverKey, serviceAlias,
 *     effectiveEpoch, renewal, time }] }` (backend bond-admission-routes.ts), the last 100 admissions;
 *   - GET /api/network/nodes `bonded`: `{ status, epoch, nodes: [{ deploymentId, alias, lastPayout,
 *     earnedTotal, ... }] }`, the bonds registered on chain.
 *
 * Nothing is guessed: a list that was not read gives `unknown`, never "not found".
 */

const HEX64 = /^[0-9a-f]{64}$/;
const ALIAS = /^node-[0-9a-f]{8}$/;

export const BOND_STAGE = Object.freeze({
  invalid: 'invalid',
  unknown: 'unknown',
  none: 'none',
  admitted: 'admitted',
  missed: 'missed',
  bonded: 'bonded',
  pending: 'pending',
  earning: 'earning',
});

/** A server key or bond id (64 hex, optional 0x) or a generated alias `node-<8 hex>`; null when neither. */
export function parseNodeQuery(input) {
  const text = typeof input === 'string' ? input.trim().toLowerCase().replace(/^0x/, '') : '';
  if (HEX64.test(text)) return { kind: 'hex', value: text };
  if (ALIAS.test(text)) return { kind: 'alias', value: text };
  return null;
}

/** The alias the admission service expects for a server key. */
export function generatedAlias(serverKey) {
  return typeof serverKey === 'string' && HEX64.test(serverKey) ? `node-${serverKey.slice(0, 8)}` : null;
}

function positiveUnits(value) {
  try {
    return typeof value === 'string' && /^\d+$/.test(value) && BigInt(value) > 0n;
  } catch {
    return false;
  }
}

/**
 * @param {string} input what the visitor typed
 * @param {{ admissions?: unknown[] | null, bonded?: { status?: string, epoch?: number, nodes?: unknown[] } | null }} lists
 *        `admissions: null` means the admission list was not readable.
 */
export function bondProgress(input, { admissions = null, bonded = null } = {}) {
  const query = parseNodeQuery(input);
  if (!query) return { stage: BOND_STAGE.invalid };

  const rows = Array.isArray(admissions) ? admissions.filter(r => r && typeof r === 'object') : null;
  const matches = row => (query.kind === 'alias'
    ? row.serviceAlias === query.value
    : row.serverKey === query.value || row.deploymentId === query.value);
  // Newest first, as the list is served; a renewal replaces the earlier epoch.
  const admission = rows ? rows.find(r => r.action === 'Deposit' && matches(r)) ?? null : null;

  const bondedOk = bonded?.status === 'ok' && Array.isArray(bonded.nodes);
  const node = bondedOk
    ? bonded.nodes.find(n => n && (
      (admission && n.deploymentId === admission.deploymentId)
      || (query.kind === 'alias' ? n.alias === query.value : n.deploymentId === query.value)
      || (query.kind === 'hex' && n.alias === generatedAlias(query.value))
    )) ?? null
    : null;

  if (node) {
    const base = { alias: node.alias ?? null, deploymentId: node.deploymentId, lastPayout: node.lastPayout ?? null, earnedTotal: node.earnedTotal ?? null };
    if (node.lastPayout?.status === 'PAID' || positiveUnits(node.earnedTotal)) return { stage: BOND_STAGE.earning, ...base };
    if (node.lastPayout) return { stage: BOND_STAGE.pending, ...base };
    return { stage: BOND_STAGE.bonded, ...base };
  }
  if (admission) {
    const base = { alias: admission.serviceAlias, deploymentId: admission.deploymentId, effectiveEpoch: admission.effectiveEpoch, admittedAt: admission.time };
    // The bond list could not be read: the admission is real, whether the deposit landed is not known.
    if (!bondedOk) return { stage: BOND_STAGE.admitted, bondListRead: false, ...base };
    const missed = Number.isSafeInteger(bonded.epoch) && Number.isSafeInteger(admission.effectiveEpoch) && bonded.epoch > admission.effectiveEpoch;
    return { stage: missed ? BOND_STAGE.missed : BOND_STAGE.admitted, bondListRead: true, ...base };
  }
  if (!rows || !bondedOk) return { stage: BOND_STAGE.unknown, admissionsRead: Boolean(rows), bondListRead: bondedOk };
  return { stage: BOND_STAGE.none };
}
