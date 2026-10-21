/**
 * Mirror of the app's `declaredWrfAmount` (mobile lib/core/formatting/reported_amount.dart): a treasury
 * figure is shown as WRF only when the node's `amountUnits` envelope declares WRF with 8 base-unit decimals
 * and names the unit of that field. Otherwise the figure is "not declared" and the reason is surfaced; no
 * denomination is ever assumed. Amounts are formatted with BigInt math only.
 */
export const WRF_DECIMALS = 8;
const BASE_UNITS_PER_WRF = (10n ** BigInt(WRF_DECIMALS)).toString();

export interface AmountUnits {
  denomination?: unknown;
  baseUnitDecimals?: unknown;
  baseUnitsPerUnit?: unknown;
  available?: unknown;
  reason?: unknown;
  fields?: unknown;
}

export function baseUnitsToDisplay(raw: string): string | null {
  if (!/^\d{1,39}$/.test(raw)) return null;
  const units = BigInt(raw);
  const whole = units / 10n ** BigInt(WRF_DECIMALS);
  const frac = (units % 10n ** BigInt(WRF_DECIMALS)).toString().padStart(WRF_DECIMALS, '0');
  return `${whole.toString()}.${frac}`;
}

/** `null` when the units are not declared for this field; otherwise "<display> WRF". */
export function declaredWrfAmount(value: unknown, amountUnits: unknown, field: string): string | null {
  if (typeof value !== 'string' || !amountUnits || typeof amountUnits !== 'object') return null;
  const u = amountUnits as AmountUnits;
  const fields = u.fields;
  if (
    u.available !== true ||
    u.denomination !== 'WRF' ||
    u.baseUnitDecimals !== WRF_DECIMALS ||
    u.baseUnitsPerUnit !== BASE_UNITS_PER_WRF ||
    !fields || typeof fields !== 'object'
  ) return null;
  const raw = value.trim();
  const kind = (fields as Record<string, unknown>)[field];
  let display: string | null;
  if (kind === 'base_units') display = baseUnitsToDisplay(raw);
  else if (kind === 'display_units') display = /^\d+(?:\.\d{1,8})?$/.test(raw) ? raw : null;
  else return null;
  return display === null ? null : `${display} WRF`;
}

/** Human wording for the node's `reason` when units are not declared. */
export function undeclaredReason(amountUnits: unknown): string {
  const reason = amountUnits && typeof amountUnits === 'object' ? (amountUnits as AmountUnits).reason : null;
  if (reason === 'treasury_units_not_established') return 'The node has not established the treasury units yet.';
  if (typeof reason === 'string' && reason.trim() !== '') return `The node reports: ${reason.replace(/_/g, ' ')}.`;
  return 'The node has not declared the units of this figure.';
}

/** Thousands-grouped display for an already-formatted "123456.78900000" string (grouping only, no rounding). */
export function groupThousands(display: string): string {
  const [whole, frac] = display.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return frac === undefined ? grouped : `${grouped}.${frac}`;
}
