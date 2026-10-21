import { NODE_STATS_POLL_MS } from '../../../contexts/MiningContext';

/**
 * Miner page status from the real GET /api/mining/node-stats poll in
 * MiningContext (frontend#355), never from a browser-side state machine.
 *
 * - 'online'      — the last poll succeeded within two poll intervals.
 * - 'unreachable' — the last poll failed.
 * - 'unknown'     — no successful poll yet, or the last success is stale.
 */
export function deriveNodeStatus(node, now = Date.now()) {
  if (!node || node.loadState === 'unavailable') {
    return node ? 'unreachable' : 'unknown';
  }
  const updatedAt = node.updatedAt ? Date.parse(node.updatedAt) : NaN;
  if (Number.isFinite(updatedAt) && now - updatedAt < 2 * NODE_STATS_POLL_MS) {
    return 'online';
  }
  return 'unknown';
}

export const NODE_STATUS_LABEL = {
  online: 'NODE ONLINE',
  unreachable: 'NODE UNREACHABLE',
  unknown: 'STATUS UNKNOWN',
};
