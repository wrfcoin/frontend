import type { MyStationsList } from './apiClient/stationRegistrationService';

/**
 * The wallet-removal station check over the server list: true when the wallet owns a station. It throws
 * (the removal is then refused as "could not check") whenever the list is not a complete answer: a
 * passkey-later reply, rows dropped by validation, or a truncated list. "No station" is only ever said
 * when every station was really checked.
 */
export function ownsServerStation(list: MyStationsList): boolean {
  if (list.stations.length > 0) return true;
  if (list.passkeyLater || list.dropped > 0 || list.truncated) {
    throw new Error('The station list is incomplete, so the check could not be made.');
  }
  return false;
}
