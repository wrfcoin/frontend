export function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * Number of base units in one WRF coin. All on-chain currency amounts (balances,
 * stakes, earnings) are integer base units; 1 WRF = 10^8 base units. See
 * WRF_UNITS_PER_COIN on the Rust side. Kept as a BigInt so conversions never
 * touch IEEE-754 floats.
 */
export const WRF_UNITS_PER_COIN = 100_000_000n;

/**
 * Coerce a balance value (which may arrive as an exact decimal string from the
 * big-integer-preserving JSON parser, a small JS number, or a bigint) into an
 * exact BigInt of base units. Returns null when the value cannot be interpreted
 * as a non-fractional integer amount.
 *
 * Issue #236: balances above 2^53-1 base units (90,071,992.55 WRF) lose
 * precision if ever routed through a JS `number`; this helper keeps them exact.
 */
export function toBaseUnits(value: unknown): bigint | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) return null;
    return BigInt(value);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!/^-?\d+$/.test(trimmed)) return null;
    try {
      return BigInt(trimmed);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Format integer base units as a human-readable WRF amount string WITHOUT any
 * floating-point arithmetic. Produces e.g. "90071992.55" WRF for
 * 9_007_199_255_000_000 base units. `fractionDigits` controls how many of the
 * 8 fractional digits to show (default 8, trailing zeros preserved).
 *
 * NOTE: when `fractionDigits` < 8, the fractional part is TRUNCATED (floored
 * toward zero), NOT rounded. e.g. 12_345_678 base units (0.12345678 WRF) with
 * `fractionDigits = 4` yields "0.1234", not "0.1235". This is intentional so a
 * displayed balance never overstates the true on-chain amount.
 *
 * Returns null for inputs that aren't integer base units.
 */
export function formatBaseUnitsToWrf(
  value: unknown,
  fractionDigits = 8,
): string | null {
  const units = toBaseUnits(value);
  if (units === null) return null;

  const digits = Math.min(Math.max(fractionDigits, 0), 8);
  const negative = units < 0n;
  const abs = negative ? -units : units;

  const whole = abs / WRF_UNITS_PER_COIN;
  const frac = abs % WRF_UNITS_PER_COIN;

  // Group the whole part with thousands separators (locale-agnostic comma) using
  // string math so we never overflow Number.
  const wholeStr = whole
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  let result = wholeStr;
  if (digits > 0) {
    const fracStr = frac.toString().padStart(8, '0').slice(0, digits);
    result += `.${fracStr}`;
  }

  return negative ? `-${result}` : result;
}

/**
 * Validate the wire contract for a base-unit amount and preserve its decimal
 * digits. Safe legacy numbers remain accepted; unsafe numbers are rejected
 * because their original digits are already unrecoverable after JSON.parse.
 */
export function requireExactBaseUnits(value: unknown, field: string): string {
  if (typeof value === 'string' && /^-?\d+$/.test(value)) return value;
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'number' && Number.isSafeInteger(value)) return String(value);
  throw new Error(`${field} must be an exact integer base-unit string`);
}

export function optionalExactBaseUnits(value: unknown, field: string): string | undefined {
  if (value == null) return undefined;
  return requireExactBaseUnits(value, field);
}

/**
 * Numeric adapter for chart libraries only. It converts after exact BigInt
 * validation and returns null instead of silently displaying a wrong zero when
 * the WRF whole-unit part exceeds the safe numeric range.
 */
export function toWrfNumberForChart(value: unknown): number | null {
  const units = toBaseUnits(value);
  if (units === null) return null;

  const whole = units / WRF_UNITS_PER_COIN;
  const maxSafe = BigInt(Number.MAX_SAFE_INTEGER);
  if (whole > maxSafe || whole < -maxSafe) return null;

  const fraction = units % WRF_UNITS_PER_COIN;
  const absoluteFraction = fraction < 0n ? -fraction : fraction;
  const wholeNumber = Number(whole);
  const fractionNumber = Number(absoluteFraction) / Number(WRF_UNITS_PER_COIN);
  return wholeNumber + (units < 0n ? -fractionNumber : fractionNumber);
}
