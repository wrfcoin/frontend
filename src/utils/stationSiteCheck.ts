/**
 * "Has this station moved?" (Epic 8): parse GET /api/stations/<alias>/site-check (backend
 * station-site-check.ts) and put it in plain words. The backend answers only for the wallet that
 * owns the station. Anything this app cannot read is dropped rather than guessed.
 *
 * The backend does not say when a change began (only where its newer window starts), so nothing
 * here states a date.
 */

export type SiteFlag =
  | { kind: 'pressure_offset_changed'; shiftPercent: number; approxHeightChangeM: number; heightDirection: 'higher' | 'lower' }
  | { kind: 'temperature_pattern_changed'; shiftC: number };

export type StationSiteCheckView =
  | { status: 'ok'; referenceStation: string; flags: SiteFlag[] }
  | { status: 'not_enough_data' };

const NWS_ID_RE = /^[A-Z0-9]{3,6}$/;
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function flagOf(v: unknown): SiteFlag | null {
  if (!isObj(v)) return null;
  if (v.kind === 'pressure_offset_changed') {
    const shiftPercent = num(v.shiftPercent);
    const metres = num(v.approxHeightChangeM);
    const direction = v.heightDirection === 'higher' || v.heightDirection === 'lower' ? v.heightDirection : null;
    if (shiftPercent === null || shiftPercent === 0 || Math.abs(shiftPercent) > 60
      || metres === null || metres <= 0 || metres > 9000 || direction === null) return null;
    return { kind: 'pressure_offset_changed', shiftPercent, approxHeightChangeM: metres, heightDirection: direction };
  }
  if (v.kind === 'temperature_pattern_changed') {
    const shiftC = num(v.shiftC);
    if (shiftC === null || shiftC === 0 || Math.abs(shiftC) > 60) return null;
    return { kind: 'temperature_pattern_changed', shiftC };
  }
  return null;
}

/** Throws on a body this app cannot read, so the page shows nothing rather than a guess. */
export function normalizeStationSiteCheck(raw: unknown): StationSiteCheckView {
  if (!isObj(raw)) throw new Error('site check: unreadable response');
  if (raw.status === 'not_enough_data') return { status: 'not_enough_data' };
  if (raw.status !== 'ok' || !Array.isArray(raw.flags)) throw new Error('site check: unreadable response');
  const reference = isObj(raw.reference) ? raw.reference : {};
  const referenceStation = typeof reference.stationIdentifier === 'string' && NWS_ID_RE.test(reference.stationIdentifier)
    ? reference.stationIdentifier
    : null;
  if (referenceStation === null) throw new Error('site check: unreadable response');
  return { status: 'ok', referenceStation, flags: raw.flags.map(flagOf).filter((f): f is SiteFlag => f !== null) };
}

const feet = (metres: number) => Math.round((metres * 3.28084) / 10) * 10;

/** One plain sentence per flag. Heights are approximate and already rounded by the server. */
export function flagSentence(flag: SiteFlag, referenceStation: string): string {
  if (flag.kind === 'pressure_offset_changed') {
    return `Its pressure next to ${referenceStation} is now about ${Math.abs(flag.shiftPercent).toFixed(1)}% ${flag.shiftPercent < 0 ? 'lower' : 'higher'} than it used to be, and has stayed that way. `
      + `That is what moving the station about ${feet(flag.approxHeightChangeM)} ft (${flag.approxHeightChangeM} m) ${flag.heightDirection} would look like.`;
  }
  const f = Math.abs((flag.shiftC * 9) / 5).toFixed(1);
  return `Next to ${referenceStation} it now reads about ${f}°F (${Math.abs(flag.shiftC).toFixed(1)}°C) ${flag.shiftC > 0 ? 'warmer' : 'cooler'} than it used to at the same time of day, and has stayed that way.`;
}
