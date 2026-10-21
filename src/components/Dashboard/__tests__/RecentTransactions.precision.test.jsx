import { describe, expect, it } from '@jest/globals';

import { formatTransactionAmount } from '../transactionAmount';

describe('RecentTransactions amount display', () => {
  it('keeps exact amounts and marks unavailable values', () => {
    expect(formatTransactionAmount('340282366920938463463374607431768211455', '+')).toBe(
      '+3,402,823,669,209,384,634,633,746,074,317.6821 WRF',
    );
    expect(formatTransactionAmount(null, '-')).toBe('-Unavailable WRF');
    expect(formatTransactionAmount('invalid')).toBe('Unavailable WRF');
  });
});
