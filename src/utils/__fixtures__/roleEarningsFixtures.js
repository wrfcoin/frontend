// Synthetic B2 wire fixtures: backend main 920b2f81, earnings.ts / earnings-routes.ts.
export const header = () => ({
  units: { currency: 'WRF', decimals: 8, scale: '100000000' },
  coverage: { fromHeight: '1', throughHeight: '41000', complete: true },
  asOf: { height: '41000', hash: 'a'.repeat(64), time: '2026-10-11T12:00:00.123456Z', checkedAt: '2026-10-11T12:01:00.000Z' },
  finalityPolicy: 'confirmed-canonical-with-rollback',
});
export const row = (over = {}) => ({
  rank: 1, profileKey: 'c_0123456789abcdef01234567', shortAddress: '0xa1a1…a1a1',
  displayName: 'Operator-01234567', paidBaseUnits: '9007199254740993', paidDisplay: '90071992.54740993', isYou: false, ...over,
});
export const board = (role = 'producer', period = 'all', over = {}) => ({
  success: true, ...header(), role, requestedScope: period, effectiveScope: period,
  status: 'available', complete: true, window: { from: period === 'all' ? null : '2026-10-04T12:00:00.123456Z', through: header().asOf.time },
  rows: [row()], ...over,
});
export const unsupported = () => ({
  success: true, units: header().units, role: 'node', status: 'unsupported', complete: false,
  paidBaseUnits: null, message: 'Node payments are not implemented yet', requestedScope: 'all', effectiveScope: null,
  coverage: null, asOf: null, finalityPolicy: null, rows: [],
});
export const profile = (over = {}) => ({
  walletAddress: '0xa1a1…a1a1', profileKey: row().profileKey, isYou: false, displayName: 'Operator-01234567',
  weatherStatisticsAvailable: false, totalRewardsEarned: null, legacyRewardSource: 'weather-submissions-db',
  roleEarnings: { ...header(), overallPaidBaseUnits: null, overallComplete: false, roles: {
    producer: { role: 'producer', status: 'available', complete: true, paidBaseUnits: row().paidBaseUnits,
      paidDisplay: row().paidDisplay, displayName: 'N5 node', coverage: header().coverage, asOf: header().asOf },
    attester: { role: 'attester', status: 'available', complete: true, paidBaseUnits: '0', paidDisplay: '0.00000000', displayName: null, coverage: header().coverage, asOf: header().asOf },
    contribution: { role: 'contribution', status: 'unavailable', complete: false, paidBaseUnits: null },
    forecast: { role: 'forecast', status: 'unavailable', complete: false, paidBaseUnits: null },
    node: { role: 'node', status: 'unsupported', complete: false, paidBaseUnits: null },
  } }, ...over,
});
