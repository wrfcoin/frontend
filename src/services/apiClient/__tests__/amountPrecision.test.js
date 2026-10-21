import { describe, expect, it } from '@jest/globals';
import {
  chartAmountOrGap,
  formatExactAmount,
  sumExactBaseUnits,
} from '../amountPrecision';

describe('consumer amount precision boundaries', () => {
  it('aggregates u128 values exactly instead of zeroing them', () => {
    const u128 = '340282366920938463463374607431768211455';
    expect(sumExactBaseUnits([u128, '1'])).toBe(
      '340282366920938463463374607431768211456',
    );
    expect(formatExactAmount(u128, 4)).toBe(
      '3,402,823,669,209,384,634,633,746,074,317.6821',
    );
  });

  it('returns unavailable chart gaps for out-of-range values', () => {
    const u128 = '340282366920938463463374607431768211455';
    expect(chartAmountOrGap(u128)).toBeNull();
    expect(chartAmountOrGap('0')).toBe(0);
  });

  it('keeps ordinary display and chart values unchanged', () => {
    expect(sumExactBaseUnits(['150000000', '50000000'])).toBe('200000000');
    expect(formatExactAmount('150000000', 2)).toBe('1.50');
    expect(chartAmountOrGap('150000000')).toBe(1.5);
  });

  it('marks null and malformed ordinary amounts unavailable instead of zero', () => {
    expect(sumExactBaseUnits([null])).toBeNull();
    expect(formatExactAmount(null, 2)).toBe('Unavailable');
    expect(formatExactAmount('not-an-amount', 2)).toBe('Unavailable');
  });
});
