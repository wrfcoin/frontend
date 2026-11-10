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

test('bonded: found through the admission, the alias typed as an alias, or the bond id', () => {
  expect(bondProgress(KEY, { admissions: [admission()], bonded: bonded([node()]) }).stage).toBe(BOND_STAGE.bonded);
  expect(bondProgress(BOND, { admissions: null, bonded: bonded([node()]) }).stage).toBe(BOND_STAGE.bonded);
  expect(bondProgress('node-1a2b3c4d', { admissions: null, bonded: bonded([node()]) }).stage).toBe(BOND_STAGE.bonded);
});

test('a server key never matches a bond through the 8 characters of an alias', () => {
  // Another key with the same first 8 characters: that bond is not this node's.
  const other = '1a2b3c4d'.padEnd(64, 'f');
  expect(bondProgress(other, { admissions: [admission()], bonded: bonded([node()]) }).stage).toBe(BOND_STAGE.none);
  // Even the right key, once its admission is out of the last 100, is not guessed from the alias.
  expect(bondProgress(KEY, { admissions: [], bonded: bonded([node()]) }).stage).toBe(BOND_STAGE.none);
  expect(bondProgress(KEY, { admissions: null, bonded: bonded([node()]) }).stage).toBe(BOND_STAGE.unknown);
});

test('the stage follows the latest settlement status; only PAID is earning', () => {
  const at = (status, over = {}) => bondProgress(BOND, { admissions: [], bonded: bonded([node({ lastPayout: { epoch: 31, status, amount: '14222222208' }, ...over })]) });
  expect(at('PAID')).toMatchObject({ stage: BOND_STAGE.earning, lastPayout: { epoch: 31, amount: '14222222208' } });
  expect(at('PROVISIONAL').stage).toBe(BOND_STAGE.provisional);
  expect(at('OPEN').stage).toBe(BOND_STAGE.open);
  expect(at('UNISSUED').stage).toBe(BOND_STAGE.unissued);
  for (const odd of ['UNKNOWN', 'paid', '', 'constructor', 'toString', null, 7]) expect(at(odd).stage).toBe(BOND_STAGE.bonded);
});

test('the payout wallet total never makes a node "earning"', () => {
  // The wallet earned from other sources (the total is the account's lifetime figure): still just bonded.
  const rich = node({ earnedTotal: '999900000000', lastPayout: null });
  expect(bondProgress(BOND, { admissions: [], bonded: bonded([rich]) })).toMatchObject({ stage: BOND_STAGE.bonded, walletTotal: '999900000000' });
  const provisional = node({ earnedTotal: '999900000000', lastPayout: { epoch: 31, status: 'PROVISIONAL', amount: '1' } });
  expect(bondProgress(BOND, { admissions: [], bonded: bonded([provisional]) }).stage).toBe(BOND_STAGE.provisional);
});
