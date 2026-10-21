import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';

/**
 * Public station alias: `st_` + first 12 hex of sha256("wrfcoin-station-alias-v1:" + stationId).
 * Byte-identical to backend `stationAlias` (server/utils/station-alias.js) and mobile `stationAliasOf`
 * (station_owner_api.dart). The public edge admits only alias paths, never raw station ids.
 */
export const STATION_ALIAS_DOMAIN = 'wrfcoin-station-alias-v1:';
const STATION_ALIAS_RE = /^st_[0-9a-f]{12}$/;

export function isStationAlias(value: unknown): value is string {
  return typeof value === 'string' && STATION_ALIAS_RE.test(value);
}

export function stationAlias(stationId: string): string {
  const digest = sha256(new TextEncoder().encode(STATION_ALIAS_DOMAIN + stationId));
  return `st_${bytesToHex(digest).slice(0, 12)}`;
}

/** The alias for an id that is already an alias (the public site's station id) or a raw station id. */
export function toStationAlias(stationId: string): string {
  return isStationAlias(stationId) ? stationId : stationAlias(stationId);
}
