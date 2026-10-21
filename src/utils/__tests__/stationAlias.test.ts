import { createHash } from 'node:crypto';
import { describe, expect, it } from '@jest/globals';
import { isStationAlias, stationAlias, toStationAlias } from '../stationAlias';

// Independent vectors: sha256("wrfcoin-station-alias-v1:" + id), hex, first 12 chars,
// computed outside this implementation (python3 hashlib) for the cross-check below.
const GOLDEN: Array<[string, string]> = [
  ['station-1', 'st_406339c8ab53'],
  ['mob-0123abcd', 'st_89946ed84c65'],
  ['', 'st_f9675c5d24ec'],
];

describe('stationAlias', () => {
  it.each(GOLDEN)('matches the golden vector for %p', (id, expected) => {
    expect(stationAlias(id)).toBe(expected);
  });

  it.each(GOLDEN)('matches node:crypto for %p', (id) => {
    const hex = createHash('sha256').update(`wrfcoin-station-alias-v1:${id}`, 'utf8').digest('hex');
    expect(stationAlias(id)).toBe(`st_${hex.slice(0, 12)}`);
  });

  it('hashes UTF-8 bytes', () => {
    const id = 'Station é中';
    const hex = createHash('sha256').update(`wrfcoin-station-alias-v1:${id}`, 'utf8').digest('hex');
    expect(stationAlias(id)).toBe(`st_${hex.slice(0, 12)}`);
  });

  it('toStationAlias keeps an alias and hashes a raw id', () => {
    const alias = stationAlias('station-1');
    expect(isStationAlias(alias)).toBe(true);
    expect(toStationAlias(alias)).toBe(alias);
    expect(toStationAlias('station-1')).toBe(alias);
    expect(isStationAlias('st_ABCDEF012345')).toBe(false);
  });
});
