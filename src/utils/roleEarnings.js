export const EARNING_ROLES = [
  { key: 'contribution', label: 'Weather data' },
  { key: 'attester', label: 'Oracles & attesters' },
  { key: 'producer', label: 'Block producers' },
  { key: 'node', label: 'Nodes' },
  { key: 'forecast', label: 'Forecasting' },
];
export const EARNING_PERIODS = [
  { key: 'all', label: 'All time' }, { key: '7d', label: '7 days' }, { key: '30d', label: '30 days' },
];
export const NODE_PAYMENT_NOTICE = 'Node payments are not implemented yet';

function require(condition) {
  if (!condition) throw new Error('Role payments unavailable');
}

export function exactPaidUnits(raw) {
  if (typeof raw !== 'string' || !/^(0|[1-9][0-9]{0,38})$/.test(raw)) return null;
  return BigInt(raw);
}

export function paidDisplay(raw) {
  const units = exactPaidUnits(raw);
  if (units === null) return null;
  return `${units / 100000000n}.${(units % 100000000n).toString().padStart(8, '0')}`;
}

export function formatRolePayment(raw) {
  const display = paidDisplay(raw);
  if (display === null) return null;
  const [whole, decimals] = display.split('.');
  const fraction = decimals.replace(/0+$/, '');
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${fraction ? `.${fraction}` : ''} WRF`;
}

// Display names are supplied by the approved backend map. Never infer a host
// or operator from a payout address, key prefix, row rank or connected wallet.
export function roleDisplayName(name) {
  return ['N5 node', 'Mango', 'Workstation'].includes(name) ||
    (typeof name === 'string' && /^Operator-[0-9a-f]{8}$/.test(name)) ? name : 'Unknown operator';
}

export function earningsQuery(role, period, limit = 30) {
  require(EARNING_ROLES.some(r => r.key === role) && EARNING_PERIODS.some(p => p.key === period));
  require(Number.isInteger(limit) && limit >= 1 && limit <= 30);
  // Backend#1481 and edge admission require this exact order, with no extras.
  return `/api/earnings/leaderboard?${new URLSearchParams({ role, period, limit: String(limit) })}`;
}

export function completeEarningsHeader(data) {
  const height = data?.asOf?.height;
  return data?.units?.currency === 'WRF' && data.units.decimals === 8 && data.units.scale === '100000000' &&
    data?.coverage?.complete === true && data.coverage.fromHeight === '1' &&
    typeof height === 'string' && /^[1-9][0-9]*$/.test(height) && data.coverage.throughHeight === height &&
    typeof data.asOf.hash === 'string' && /^[0-9a-f]{64}$/.test(data.asOf.hash) &&
    Number.isFinite(Date.parse(data.asOf.time)) && Number.isFinite(Date.parse(data.asOf.checkedAt)) &&
    data.finalityPolicy === 'confirmed-canonical-with-rollback';
}

export function validateRoleBoard(data, role, period) {
  require(data?.success === true && data.role === role && data.requestedScope === period && Array.isArray(data.rows));
  if (data.status === 'unsupported') {
    require(role === 'node' && data.rows.length === 0 && data.complete === false && data.paidBaseUnits === null);
    return data;
  }
  if (data.status === 'unavailable') throw new Error('Role payments unavailable');
  require(data.status === 'available' && role !== 'node' && data.complete === true &&
    data.effectiveScope === period && completeEarningsHeader(data) && data.rows.length <= 30);
  require(data.window?.through === data.asOf.time &&
    (period === 'all' ? data.window.from === null : Number.isFinite(Date.parse(data.window?.from))));
  const seen = new Set();
  let previous = null;
  for (const [i, row] of data.rows.entries()) {
    const units = exactPaidUnits(row?.paidBaseUnits);
    require(row?.rank === i + 1 && typeof row.profileKey === 'string' && /^c_[0-9a-f]{24}$/.test(row.profileKey) &&
      !seen.has(row.profileKey) && typeof row.shortAddress === 'string' &&
      units !== null && units > 0n && row.paidDisplay === paidDisplay(row.paidBaseUnits) &&
      (previous === null || previous >= units));
    seen.add(row.profileKey);
    previous = units;
  }
  return data;
}

export function visibleRoleAmount(header, entry, role) {
  if (!completeEarningsHeader(header) || entry?.role !== role || entry.status !== 'available' ||
    entry.complete !== true || entry.coverage?.complete !== true ||
    entry.coverage.fromHeight !== header.coverage.fromHeight || entry.coverage.throughHeight !== header.coverage.throughHeight ||
    entry.asOf?.height !== header.asOf.height || entry.asOf?.hash !== header.asOf.hash ||
    entry.paidDisplay !== paidDisplay(entry.paidBaseUnits)) return null;
  return formatRolePayment(entry.paidBaseUnits);
}
