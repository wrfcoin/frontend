import { describe, expect, it } from '@jest/globals';
import { parseJsonPreservingBigInts } from '../losslessJson';
import {
  formatBaseUnitsToWrf,
  requireExactBaseUnits,
  toBaseUnits,
  toWrfNumberForChart,
  WRF_UNITS_PER_COIN,
} from '../number';

describe('parseJsonPreservingBigInts (issue #236)', () => {
  it('preserves quoted integers above 2^53-1 exactly', () => {
    const big = '9000000000000000001';
    const parsed = parseJsonPreservingBigInts(`{"balance":"${big}","symbol":"WRF"}`);
    expect(parsed.balance).toBe(big);
    expect(parsed.symbol).toBe('WRF');
  });

  it('preserves a quoted u128-scale balance far beyond 2^53', () => {
    const big = '340282366920938463463374607431768211455'; // u128 max
    const parsed = parseJsonPreservingBigInts(`{"stake_locked":"${big}"}`);
    expect(parsed.stake_locked).toBe(big);
  });

  it('rejects unsafe bare integers instead of repairing a rounded value', () => {
    expect(() => parseJsonPreservingBigInts('{"balance":9007199254740993}')).toThrow(
      'Unsafe bare numeric JSON value',
    );
  });

  it('leaves safe integers as JS numbers (no behaviour change)', () => {
    const parsed = parseJsonPreservingBigInts('{"a":42,"b":-7,"c":0}');
    expect(parsed).toEqual({ a: 42, b: -7, c: 0 });
    expect(typeof parsed.a).toBe('number');
  });

  it('does not touch the boundary value 2^53-1 (still a number)', () => {
    const parsed = parseJsonPreservingBigInts(
      `{"v":${Number.MAX_SAFE_INTEGER}}`,
    );
    expect(parsed.v).toBe(Number.MAX_SAFE_INTEGER);
    expect(typeof parsed.v).toBe('number');
  });

  it('rejects the first unsafe integer at 2^53', () => {
    expect(() => parseJsonPreservingBigInts('{"v":9007199254740992}')).toThrow(
      'Unsafe bare numeric JSON value',
    );
  });

  it('leaves floats and exponents untouched', () => {
    const parsed = parseJsonPreservingBigInts(
      '{"f":1.5,"e":1000e0,"g":0.000001}',
    );
    expect(typeof parsed.f).toBe('number');
    expect(parsed.f).toBe(1.5);
    expect(typeof parsed.e).toBe('number');
  });

  it('does not corrupt digit-bearing strings', () => {
    const parsed = parseJsonPreservingBigInts(
      '{"note":"balance is 9007199254740993 units","n":"9007199254740993"}',
    );
    expect(parsed.note).toBe('balance is 9007199254740993 units');
    expect(parsed.n).toBe('9007199254740993');
  });

  it('handles escaped quotes inside strings', () => {
    const parsed = parseJsonPreservingBigInts(
      '{"s":"a \\"9999999999999999\\" b","n":"9999999999999999"}',
    );
    expect(parsed.s).toBe('a "9999999999999999" b');
    expect(parsed.n).toBe('9999999999999999');
  });

  it('handles arrays of large integers', () => {
    const parsed = parseJsonPreservingBigInts('[1,"9007199254740993",2]');
    expect(parsed).toEqual([1, '9007199254740993', 2]);
  });
});

describe('formatBaseUnitsToWrf (issue #236)', () => {
  it('formats a balance above 2^53 base units exactly', () => {
    // 9_000_000_000_000_000 base units / 10^8 = 90,000,000 WRF exactly.
    expect(formatBaseUnitsToWrf('9000000000000000')).toBe('90,000,000.00000000');
  });

  it('formats the 2^53 precision boundary exactly', () => {
    // 2^53 base units = 9_007_199_254_740_992 => 90,071,992.54740992 WRF.
    expect(formatBaseUnitsToWrf('9007199254740992')).toBe(
      '90,071,992.54740992',
    );
    // A naive Number(...)/1e8 would NOT reproduce these low-order digits.
  });

  it('formats with a reduced fraction-digit count', () => {
    expect(formatBaseUnitsToWrf('9007199254740992', 2)).toBe('90,071,992.54');
  });

  it('formats small balances and fractions', () => {
    expect(formatBaseUnitsToWrf('150000000')).toBe('1.50000000');
    expect(formatBaseUnitsToWrf('1')).toBe('0.00000001');
    expect(formatBaseUnitsToWrf('0')).toBe('0.00000000');
  });

  it('returns null for non-integer / invalid input', () => {
    expect(formatBaseUnitsToWrf('1.5')).toBeNull();
    expect(formatBaseUnitsToWrf('abc')).toBeNull();
    expect(formatBaseUnitsToWrf(null)).toBeNull();
  });
});

describe('toBaseUnits (issue #236)', () => {
  it('parses exact strings beyond 2^53', () => {
    expect(toBaseUnits('9000000000000000')).toBe(9000000000000000n);
  });
  it('accepts safe numbers and bigints', () => {
    expect(toBaseUnits(42)).toBe(42n);
    expect(toBaseUnits(10n)).toBe(10n);
  });
  it('rejects fractional numbers', () => {
    expect(toBaseUnits(1.5)).toBeNull();
  });
  it('rejects unsafe already-parsed numbers', () => {
    expect(toBaseUnits(9007199254740993)).toBeNull();
    expect(() => requireExactBaseUnits(9007199254740993, 'balance')).toThrow(
      'exact integer base-unit string',
    );
  });
  it('keeps exact low-order digits at the display boundary', () => {
    expect(formatBaseUnitsToWrf('9007199254740993')).toBe('90,071,992.54740993');
    expect(toWrfNumberForChart('9007199254740993')).toBeCloseTo(90071992.54740993, 8);
  });
  it('does not turn an unrepresentable chart amount into zero', () => {
    expect(toWrfNumberForChart('340282366920938463463374607431768211455')).toBeNull();
  });
  it('exposes the correct base-unit scale', () => {
    expect(WRF_UNITS_PER_COIN).toBe(100000000n);
  });
});
