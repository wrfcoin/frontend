/**
 * Which wallets in this browser own a weather station, as far as this browser knows.
 *
 * A wallet that owns a station must not be removed from the browser (owner ruling 2026-10-28, carried over to
 * the website). The backend has no "my stations" read, so the site remembers it here: when a registration
 * succeeds, the station id is recorded under the signed-in address.
 *
 * Public data only (an address and a station id; no key, no word, no token). Nothing here is ever sent. A
 * record that cannot be read counts as "owns a station", so a damaged record blocks removal rather than
 * allowing it.
 */
const STORAGE_KEY = 'wrfcoin.wallet.station_bound.v1';
const ADDRESS_RE = /^0x[0-9a-f]{40}$/;
const STATION_ID_RE = /^[a-zA-Z0-9_-]{1,64}$/;

type Markers = Record<string, string[]>;

function read(): Markers | 'unreadable' {
  let raw: string | null;
  try { raw = localStorage.getItem(STORAGE_KEY); } catch { return 'unreadable'; }
  if (raw === null) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return 'unreadable';
    const out: Markers = {};
    for (const [address, ids] of Object.entries(parsed as Record<string, unknown>)) {
      if (!ADDRESS_RE.test(address) || !Array.isArray(ids)) return 'unreadable';
      out[address] = ids.filter((id): id is string => typeof id === 'string' && STATION_ID_RE.test(id));
    }
    return out;
  } catch {
    return 'unreadable';
  }
}

/** Remember that `address` owns `stationId`. Adds only; never removes or rewrites another wallet's entry. */
export function markStationBound(address: string | null | undefined, stationId: string): void {
  const owner = (address ?? '').toLowerCase();
  if (!ADDRESS_RE.test(owner) || !STATION_ID_RE.test(stationId)) return;
  const current = read();
  if (current === 'unreadable') return; // Already blocks removal; never overwrite what cannot be read.
  const ids = current[owner] ?? [];
  if (ids.includes(stationId)) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, [owner]: [...ids, stationId] }));
  } catch { /* storage unavailable: the registration itself still succeeded */ }
}

export type StationBound = { bound: false } | { bound: true; stationIds: string[] };

/** Whether this browser knows `address` to own a station. An unreadable record answers "bound". */
export function stationBound(address: string | null | undefined): StationBound {
  const owner = (address ?? '').toLowerCase();
  const current = read();
  if (current === 'unreadable') return { bound: true, stationIds: [] };
  const ids = current[owner] ?? [];
  return ids.length > 0 ? { bound: true, stationIds: ids } : { bound: false };
}
