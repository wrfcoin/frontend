import { BOND_STAGE, bondProgress, generatedAlias, parseNodeQuery } from '../bondProgress';

const KEY = '1a2b3c4d'.padEnd(64, 'e');
const BOND = 'b0'.repeat(32);
const admission = (over = {}) => ({ action: 'Deposit', deploymentId: BOND, serverKey: KEY, serviceAlias: 'node-1a2b3c4d', effectiveEpoch: 31, renewal: false, time: '2026-11-10T10:00:00.000Z', ...over });
const bonded = (nodes = [], epoch = 30) => ({ status: 'ok', epoch, nodes });
const node = (over = {}) => ({ deploymentId: BOND, alias: 'node-1a2b3c4d', earnedTotal: '0', lastPayout: null, ...over });

test('accepts a server key (with or without 0x, any case) or a generated alias, nothing else', () => {
  expect(parseNodeQuery(` 0x${KEY.toUpperCase()} `)).toEqual({ kind: 'hex', value: KEY });
  expect(parseNodeQuery('node-1A2B3C4D')).toEqual({ kind: 'alias', value: 'node-1a2b3c4d' });
  for (const bad of ['', 'tony-laptop', 'node-xyz', KEY.slice(1), null, 12]) expect(parseNodeQuery(bad)).toBeNull();
  expect(generatedAlias(KEY)).toBe('node-1a2b3c4d');
  expect(bondProgress('nope', {}).stage).toBe(BOND_STAGE.invalid);
});

test('no admission and no bond: not admitted yet', () => {
  expect(bondProgress(KEY, { admissions: [], bonded: bonded() }).stage).toBe(BOND_STAGE.none);
});

test('a list that was not read is unknown, never "not found"', () => {
  expect(bondProgress(KEY, { admissions: null, bonded: bonded() })).toMatchObject({ stage: BOND_STAGE.unknown, admissionsRead: false, bondListRead: true });
  expect(bondProgress(KEY, { admissions: [], bonded: { status: 'unavailable', nodes: [] } })).toMatchObject({ stage: BOND_STAGE.unknown, bondListRead: false });
});

test('admitted for the next epoch: waiting for the bond', () => {
  expect(bondProgress(KEY, { admissions: [admission()], bonded: bonded() })).toMatchObject({ stage: BOND_STAGE.admitted, effectiveEpoch: 31, bondListRead: true });
  expect(bondProgress('node-1a2b3c4d', { admissions: [admission()], bonded: bonded() }).stage).toBe(BOND_STAGE.admitted);
  // The epoch it was admitted for is the current one: still in time (the bond becomes active as it starts).
  expect(bondProgress(KEY, { admissions: [admission()], bonded: bonded([], 31) }).stage).toBe(BOND_STAGE.admitted);
});

test('an admission whose epoch passed with no bond is expired; the newest admission wins', () => {
  expect(bondProgress(KEY, { admissions: [admission()], bonded: bonded([], 32) }).stage).toBe(BOND_STAGE.missed);
  const renewed = [admission({ effectiveEpoch: 33, renewal: true }), admission()];
  expect(bondProgress(KEY, { admissions: renewed, bonded: bonded([], 32) })).toMatchObject({ stage: BOND_STAGE.admitted, effectiveEpoch: 33 });
});

test('an admission with the bonded list unavailable stays "admitted" and says the list was not read', () => {
  expect(bondProgress(KEY, { admissions: [admission()], bonded: null })).toMatchObject({ stage: BOND_STAGE.admitted, bondListRead: false });
});

test('an Update admission is not a bond request', () => {
  expect(bondProgress(KEY, { admissions: [admission({ action: 'Update' })], bonded: bonded() }).stage).toBe(BOND_STAGE.none);
});

test('bonded: found through the admission, the alias, or the bond id', () => {
  expect(bondProgress(KEY, { admissions: [admission()], bonded: bonded([node()]) }).stage).toBe(BOND_STAGE.bonded);
  // The admission scrolled out of the last 100: the generated alias still finds the bond.
  expect(bondProgress(KEY, { admissions: [], bonded: bonded([node()]) }).stage).toBe(BOND_STAGE.bonded);
  expect(bondProgress(BOND, { admissions: null, bonded: bonded([node()]) }).stage).toBe(BOND_STAGE.bonded);
  expect(bondProgress('node-1a2b3c4d', { admissions: null, bonded: bonded([node()]) }).stage).toBe(BOND_STAGE.bonded);
});

test('payout states: pending, then earning', () => {
  const pending = node({ lastPayout: { epoch: 31, status: 'PROVISIONAL', amount: '14222222208' } });
  expect(bondProgress(KEY, { admissions: [], bonded: bonded([pending]) })).toMatchObject({ stage: BOND_STAGE.pending, lastPayout: { epoch: 31 } });
  const paid = node({ earnedTotal: '14222222208', lastPayout: { epoch: 31, status: 'PAID', amount: '14222222208' } });
  expect(bondProgress(KEY, { admissions: [], bonded: bonded([paid]) })).toMatchObject({ stage: BOND_STAGE.earning, earnedTotal: '14222222208' });
  // Paid earlier, nothing in the recent epochs: still earning, from the chain's paid total.
  expect(bondProgress(KEY, { admissions: [], bonded: bonded([node({ earnedTotal: '5' })]) }).stage).toBe(BOND_STAGE.earning);
});
