/**
 * "How does my station compare?" (Epic 8): parse GET /api/stations/<alias>/compare
 * (backend station-compare.ts). Every number is the server's; anything this app
 * cannot read is dropped rather than guessed.
 *
 * The server sends aggregates only for nearby stations (how many, median, lowest,
 * highest), only when at least 3 stations contribute, and never another station's
 * id, name or location.
 */

export type CompareVariable = 'temperature_c' | 'humidity_pct' | 'dewpoint_c';
export type Agreement = 'close' | 'higher' | 'lower';

export interface CompareRow {
  variable: CompareVariable;
  mine: number | null;
  closeWithin: number;
  nearby: { stations: number; median: number; lowest: number; highest: number; difference: number; agreement: Agreement } | null;
  nws: { value: number; difference: number; agreement: Agreement } | null;
}

export type StationCompareView =
  | {
      status: 'ok';
      observedAt: number;
      nearby: { stations: number; radiusKm: number; reason: string | null };
      nws: { stationIdentifier: string | null; observedAt: number | null; reason: string | null };
      rows: CompareRow[];
      notCompared: Array<{ variable: string; reason: string }>;
    }
  | { status: 'no_recent_reading'; reason: string };

export const VARIABLE_LABEL: Record<CompareVariable, string> = {
  temperature_c: 'Temperature',
  humidity_pct: 'Humidity',
  dewpoint_c: 'Dew point',
};

const VARIABLES = new Set<string>(Object.keys(VARIABLE_LABEL));
const AGREEMENTS = new Set<string>(['close', 'higher', 'lower']);
const NWS_ID_RE = /^[A-Z0-9]{3,6}$/;

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const count = (v: unknown): number | null => (Number.isSafeInteger(v) && (v as number) >= 0 ? (v as number) : null);
const text = (v: unknown): string | null => (typeof v === 'string' && v.length > 0 && v.length <= 300 ? v : null);
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function agreementOf(v: unknown): Agreement | null {
  return typeof v === 'string' && AGREEMENTS.has(v) ? (v as Agreement) : null;
}

function nearbyOf(v: unknown): CompareRow['nearby'] {
  if (!isObj(v)) return null;
  const stations = count(v.stations);
  const median = num(v.median);
  const lowest = num(v.lowest);
  const highest = num(v.highest);
  const difference = num(v.difference);
  const agreement = agreementOf(v.agreement);
  if (!stations || median === null || lowest === null || highest === null || difference === null || !agreement) return null;
  return { stations, median, lowest, highest, difference, agreement };
}

function nwsOf(v: unknown): CompareRow['nws'] {
  if (!isObj(v)) return null;
  const value = num(v.value);
  const difference = num(v.difference);
  const agreement = agreementOf(v.agreement);
  if (value === null || difference === null || !agreement) return null;
  return { value, difference, agreement };
}

/** Throws on a body this app cannot read, so the card can say "unavailable". */
export function normalizeStationCompare(raw: unknown): StationCompareView {
  if (!isObj(raw)) throw new Error('compare: unreadable response');
  if (raw.status === 'no_recent_reading') {
    return { status: 'no_recent_reading', reason: text(raw.reason) ?? 'This station has no recent reading on chain.' };
  }
  if (raw.status !== 'ok') throw new Error('compare: unknown status');
  const observedAt = num(raw.observedAt);
  if (observedAt === null || !Array.isArray(raw.variables)) throw new Error('compare: unreadable response');
  const nearbyRaw = isObj(raw.nearby) ? raw.nearby : {};
  const nwsRaw = isObj(raw.nws) ? raw.nws : {};
  const rows: CompareRow[] = [];
  for (const v of raw.variables) {
    if (!isObj(v) || typeof v.variable !== 'string' || !VARIABLES.has(v.variable)) continue;
    rows.push({
      variable: v.variable as CompareVariable,
      mine: num(v.mine),
      closeWithin: num(v.closeWithin) ?? 0,
      nearby: nearbyOf(v.nearby),
      nws: nwsOf(v.nws),
    });
  }
  const nwsId = typeof nwsRaw.stationIdentifier === 'string' && NWS_ID_RE.test(nwsRaw.stationIdentifier) ? nwsRaw.stationIdentifier : null;
  return {
    status: 'ok',
    observedAt,
    nearby: { stations: count(nearbyRaw.stations) ?? 0, radiusKm: count(nearbyRaw.radiusKm) ?? 100, reason: text(nearbyRaw.reason) },
    nws: { stationIdentifier: nwsId, observedAt: num(nwsRaw.observedAt), reason: text(nwsRaw.reason) },
    rows: rows.filter(r => r.mine !== null),
    notCompared: Array.isArray(raw.notCompared)
      ? raw.notCompared.flatMap(n => (isObj(n) && text(n.variable) && text(n.reason) ? [{ variable: String(n.variable), reason: String(n.reason) }] : []))
      : [],
  };
}

const toF = (c: number) => (c * 9) / 5 + 32;

/** Temperatures in °F to match the rest of the station page; humidity in %. */
export function formatValue(variable: CompareVariable, value: number): string {
  if (variable === 'humidity_pct') return `${value.toFixed(0)}%`;
  return `${toF(value).toFixed(1)}°F`;
}

/** A difference: temperature differences scale by 9/5 (no +32). */
export function formatDifference(variable: CompareVariable, difference: number): string {
  const d = variable === 'humidity_pct' ? difference : (difference * 9) / 5;
  const digits = variable === 'humidity_pct' ? 0 : 1;
  const rounded = Number(d.toFixed(digits));
  if (rounded === 0) return 'same';
  const unit = variable === 'humidity_pct' ? ' pts' : '°F';
  return `${rounded > 0 ? '+' : '−'}${Math.abs(rounded).toFixed(digits)}${unit}`;
}

const HIGHER: Record<CompareVariable, string> = { temperature_c: 'warmer', humidity_pct: 'more humid', dewpoint_c: 'higher' };
const LOWER: Record<CompareVariable, string> = { temperature_c: 'cooler', humidity_pct: 'drier', dewpoint_c: 'lower' };

export function agreementWord(variable: CompareVariable, agreement: Agreement): string {
  if (agreement === 'close') return 'close';
  return agreement === 'higher' ? HIGHER[variable] : LOWER[variable];
}

/** What a visitor reads instead of a verdict: the values are shown, no judgement about the station is made. */
export const PUBLIC_HEADLINE = 'The newest reading from this station, next to nearby stations and the National Weather Service.';

/**
 * One plain-language headline for the whole card. Only the station's owner gets the verdict
 * ("differs on temperature"); everyone else gets a neutral line.
 */
export function headline(view: StationCompareView, isOwner = true): string {
  if (view.status !== 'ok') return view.reason;
  if (!isOwner) {
    const any = view.rows.some(r => r.nearby !== null || r.nws !== null);
    return any ? PUBLIC_HEADLINE : 'Nothing to compare with yet. The reasons are below.';
  }
  const judged = view.rows.flatMap(r => [r.nearby?.agreement, r.nws?.agreement]).filter(Boolean);
  if (judged.length === 0) return 'Nothing to compare with yet. The reasons are below.';
  const off = view.rows.filter(r => (r.nearby !== null && r.nearby.agreement !== 'close')
    || (r.nws !== null && r.nws.agreement !== 'close'));
  if (off.length === 0) return 'Your station agrees with its references.';
  return `Your station differs on ${off.map(r => VARIABLE_LABEL[r.variable].toLowerCase()).join(' and ')}.`;
}
