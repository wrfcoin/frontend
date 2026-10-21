import { baseUnitsToDisplay, declaredWrfAmount, groupThousands, undeclaredReason } from '../declaredWrfAmount';

const UNITS = {
  denomination: 'WRF', baseUnitDecimals: 8, baseUnitsPerUnit: '100000000', available: true,
  fields: { balance: 'display_units', totalDeposits: 'base_units', totalWithdrawals: 'unknown' },
};

describe('declaredWrfAmount (parity with the app rule)', () => {
  it('shows WRF only when the envelope declares WRF/8 and names the field unit', () => {
    expect(declaredWrfAmount('12.50000000', UNITS, 'balance')).toBe('12.50000000 WRF');
    expect(declaredWrfAmount('125000000000', UNITS, 'totalDeposits')).toBe('1250.00000000 WRF');
    expect(declaredWrfAmount('7.5', UNITS, 'totalWithdrawals')).toBeNull();
  });

  it('is null for the live undeclared envelope and for malformed values', () => {
    const live = { denomination: null, baseUnitDecimals: null, baseUnitsPerUnit: null, available: false, reason: 'treasury_units_not_established', fields: { balance: 'unknown' } };
    expect(declaredWrfAmount('0.00000000', live, 'balance')).toBeNull();
    expect(declaredWrfAmount('0.00000000', undefined, 'balance')).toBeNull();
    expect(declaredWrfAmount(12.5, UNITS, 'balance')).toBeNull();
    expect(declaredWrfAmount('1e5', UNITS, 'balance')).toBeNull();
    expect(declaredWrfAmount('1.123456789', UNITS, 'balance')).toBeNull();
    expect(declaredWrfAmount('-5', UNITS, 'totalDeposits')).toBeNull();
    expect(declaredWrfAmount('12.5', { ...UNITS, baseUnitDecimals: 6 }, 'balance')).toBeNull();
    expect(undeclaredReason(live)).toBe('The node has not established the treasury units yet.');
    expect(undeclaredReason({ reason: 'oracle_offline' })).toBe('The node reports: oracle offline.');
    expect(undeclaredReason(null)).toBe('The node has not declared the units of this figure.');
  });

  it('formats base units with BigInt only and groups thousands without rounding', () => {
    expect(baseUnitsToDisplay('900719925474099312345')).toBe('9007199254740.99312345');
    expect(baseUnitsToDisplay('1')).toBe('0.00000001');
    expect(baseUnitsToDisplay('x')).toBeNull();
    expect(groupThousands('1250000.00000000')).toBe('1,250,000.00000000');
    expect(groupThousands('42')).toBe('42');
  });
});
