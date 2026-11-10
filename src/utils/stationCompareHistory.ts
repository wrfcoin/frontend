/**
 * "Your station over the last 30 days" (Epic 8): parse GET /api/stations/<alias>/compare/history
 * (backend station-compare-history.ts) and put it in plain words. The backend answers only for the
 * wallet that owns the station. Every number is the server's; anything this app cannot read is
 * dropped rather than guessed.
 */
import { formatDifference, type CompareVariable } from './stationCompare';

export type HistoryVariable = Extract<CompareVariable, 'temperature_c' | 'humidity_pct'>;

export interface HistoryRow {
  variable: HistoryVariable;
  pairs: number;
  usualDifference: number;
  typicalGap: number;
  closePercent: number;
  closeWithin: number;
}

export type StationCompareHistoryView =
  | { status: 'ok'; days: number; from: number; to: number; referenceStation: string; rows: HistoryRow[]; note: string | null }
  | { status: 'not_enough_data'; days: number; pairs: number; pairsNeeded: number; daysWithData: number; daysNeeded: number };

const VARIABLES = new Set<string>(['temperature_c', 'humidity_pct']);
const NWS_ID_RE = /^[A-Z0-9]{3,6}$/;
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const count = (v: unknown): number | null => (Number.isSafeInteger(v) && (v as number) >= 0 ? (v as number) : null);
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Throws on a body this app cannot read, so the page shows nothing rather than a guess. */
export function normalizeStationCompareHistory(raw: unknown): StationCompareHistoryView {
  if (!isObj(raw)) throw new Error('compare history: unreadable response');
  const days = count(raw.days) ?? 30;
  if (raw.status === 'not_enough_data') {
    return {
      status: 'not_enough_data',
      days,
      pairs: count(raw.pairs) ?? 0,
      pairsNeeded: count(raw.pairsNeeded) ?? 0,
      daysWithData: count(raw.daysWithData) ?? 0,
      daysNeeded: count(raw.daysNeeded) ?? 0,
    };
  }
  if (raw.status !== 'ok') throw new Error('compare history: unknown status');
  const reference = isObj(raw.reference) ? raw.reference : {};
  const referenceStation = typeof reference.stationIdentifier === 'string' && NWS_ID_RE.test(reference.stationIdentifier)
    ? reference.stationIdentifier
    : null;
  const from = num(raw.from);
  const to = num(raw.to);
  if (referenceStation === null || from === null || to === null || !Array.isArray(raw.variables)) {
    throw new Error('compare history: unreadable response');
  }
  const rows: HistoryRow[] = [];
  for (const v of raw.variables) {
    if (!isObj(v) || typeof v.variable !== 'string' || !VARIABLES.has(v.variable)) continue;
    const pairs = count(v.pairs);
    const usualDifference = num(v.usualDifference);
    const typicalGap = num(v.typicalGap);
    const closePercent = num(v.closePercent);
    const closeWithin = num(v.closeWithin);
    if (!pairs || usualDifference === null || typicalGap === null || typicalGap < 0
      || closePercent === null || closePercent < 0 || closePercent > 100 || closeWithin === null || closeWithin <= 0) continue;
    rows.push({ variable: v.variable as HistoryVariable, pairs, usualDifference, typicalGap, closePercent, closeWithin });
  }
  if (rows.length === 0) throw new Error('compare history: no readable rows');
  const note = typeof raw.note === 'string' && raw.note.length > 0 && raw.note.length <= 400 ? raw.note : null;
  return { status: 'ok', days, from, to, referenceStation, rows, note };
}

const WORDS: Record<HistoryVariable, { higher: string; lower: string }> = {
  temperature_c: { higher: 'warmer', lower: 'cooler' },
  humidity_pct: { higher: 'more humid', lower: 'drier' },
};

/** An unsigned amount in the page's units: "3.6°F" or "6 pts". */
export function formatAmount(variable: HistoryVariable, amount: number): string {
  const text = formatDifference(variable, Math.abs(amount));
  return text === 'same' ? (variable === 'humidity_pct' ? '0 pts' : '0.0°F') : text.replace(/^[+−]/, '');
}

/** "Usually reads 3.6°F warmer than KAAA." or "Usually within 0.9°F of KAAA." */
export function usualSentence(row: HistoryRow, referenceStation: string): string {
  if (Math.abs(row.usualDifference) <= row.closeWithin) {
    return `Usually close to ${referenceStation}: the usual difference is ${formatAmount(row.variable, row.usualDifference)}.`;
  }
  const word = row.usualDifference > 0 ? WORDS[row.variable].higher : WORDS[row.variable].lower;
  return `Usually reads ${formatAmount(row.variable, row.usualDifference)} ${word} than ${referenceStation}.`;
}

/** "Close (within 2.7°F) 40% of the time. Typical gap 3.6°F, from 100 hourly comparisons." */
export function detailSentence(row: HistoryRow): string {
  return `Close (within ${formatAmount(row.variable, row.closeWithin)}) ${Math.round(row.closePercent)}% of the time. `
    + `Typical gap ${formatAmount(row.variable, row.typicalGap)}, from ${row.pairs} hourly comparisons.`;
}
