import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { coarsenCoordinate } from '../geo';
import {
  coarsenCoordinatesInName,
  displayStationName,
  formatStationPosition,
  projectStationCoordinates,
  projectStationDetail,
} from '../publicStationProjection';

// Shared with backend#1397 (contract-fixtures/station-name-public-vectors.json):
// the two copies must stay byte-identical, so both suites pin the same hash.
const VECTORS_PATH = resolve(process.cwd(), 'contract-fixtures/station-name-public-vectors.json');
const VECTORS_SHA256 = 'e38a4fa25237ebad65397e92c43ddd7213e553bf0da681cbd10bdecac6701585'; // pragma: allowlist secret — sha256 of a test fixture

describe('public station coordinate coarsening', () => {
  it.each([
    [10.1235, 10.1],
    [-20.9877, -21],
    [0.05, 0.1],
    [-0.06, -0.1],
  ])('coarsens %p to a 0.1 degree grid', (input, expected) => {
    expect(coarsenCoordinate(input)).toBe(expected);
  });

  it('coarsens the station projection in public-readonly mode', () => {
    expect(projectStationCoordinates(
      { latitude: 10.123456, longitude: -20.987654 },
      { publicReadonly: 'true', fullStudio: undefined },
    )).toEqual({ lat: 10.1, lng: -21 });
  });

  it('preserves exact coordinates when full studio is enabled', () => {
    expect(projectStationCoordinates(
      { latitude: 10.123456, longitude: -20.987654 },
      { publicReadonly: 'true', fullStudio: 'true' },
    )).toEqual({ lat: 10.123456, lng: -20.987654 });
  });

  describe('station detail projection (frontend#349)', () => {
    const detail = {
      id: 'station-1',
      name: 'Private station',
      latitude: 10.123456,
      longitude: -20.987654,
      location: '1 Fake Lane, Testville',
    };

    it('coarsens coordinates and withholds the location in public-readonly mode', () => {
      expect(projectStationDetail(detail, { publicReadonly: 'true', fullStudio: undefined })).toEqual({
        id: 'station-1',
        name: 'Private station',
        latitude: 10.1,
        longitude: -21,
        location: undefined,
      });
    });

    it('keeps missing coordinates missing', () => {
      const projected = projectStationDetail(
        { id: 's', latitude: undefined, longitude: undefined },
        { publicReadonly: 'true', fullStudio: undefined },
      );
      expect(projected.latitude).toBeUndefined();
      expect(projected.longitude).toBeUndefined();
    });

    it.each([
      [{ publicReadonly: 'true', fullStudio: 'true' }],
      [{ publicReadonly: undefined, fullStudio: 'true' }],
      [{ publicReadonly: undefined, fullStudio: undefined }],
    ])('returns the precise detail outside the public read-only build (%p)', flags => {
      expect(projectStationDetail(detail, flags)).toBe(detail);
    });
  });

  describe('formatStationPosition (owner ruling 2026-10-01: 0.1 degree public)', () => {
    const station = { latitude: 10.123456, longitude: -20.987654, location: '1 Fake Lane, Testville' };
    it('shows one decimal and no free-text location in the public build', () => {
      const text = formatStationPosition(station, { publicReadonly: 'true', fullStudio: undefined });
      expect(text).toBe('10.1, -21.0');
      expect(text).not.toMatch(/\d\.\d{2}/);
    });
    it('keeps the location or four decimals outside the public build', () => {
      expect(formatStationPosition(station, { publicReadonly: 'true', fullStudio: 'true' })).toBe('1 Fake Lane, Testville');
      expect(formatStationPosition({ latitude: 10.123456, longitude: -20.987654 }, { publicReadonly: undefined, fullStudio: 'true' })).toBe('10.1235, -20.9877');
    });
    it('shows nothing when the position is missing', () => {
      expect(formatStationPosition({}, { publicReadonly: 'true', fullStudio: undefined })).toBe('');
    });
  });

  describe('station names (frontend#436 review): coordinate-like numbers in a NAME at one decimal', () => {
    const PUBLIC = { publicReadonly: 'true', fullStudio: undefined };
    const STUDIO = { publicReadonly: undefined, fullStudio: 'true' };

    it('rewrites decimal, exponent and plus forms, one or two axes', () => {
      expect(coarsenCoordinatesInName('Hilltop 10.123456,-21')).toBe('Hilltop 10.1,-21');
      expect(coarsenCoordinatesInName('Hilltop 10.1,-20.987654')).toBe('Hilltop 10.1,-21');
      expect(coarsenCoordinatesInName('At 1.0123456e1, +20.654321')).toBe('At 10.1, 20.7');
      expect(coarsenCoordinatesInName('Ridge 10.123456')).toBe('Ridge 10.1');
      // Leading-dot decimals, with signs and exponents (backend#1397 r3, same rule).
      expect(coarsenCoordinatesInName('Hilltop .10123456,-.20987654')).toBe('Hilltop 0.1,-0.2');
      expect(coarsenCoordinatesInName('Ridge +.10123456e2')).toBe('Ridge 10.1');
    });

    it('leaves names without a fine number byte-identical: integers, one-decimal values, large numbers', () => {
      for (const name of ['Hilltop station', 'Station 42', 'v2', '1.', 'Unit .5', 'Hilltop 10.1,-21.0', 'Elev 1234.567 m', 'Built 2026-10-01']) {
        expect(coarsenCoordinatesInName(name)).toBe(name);
      }
    });

    it('one numeric-token grammar: empty fractions and exponents (1.e-3) are numbers too', () => {
      expect(coarsenCoordinatesInName('Site 1.e-3')).toBe('Site 0');
      expect(coarsenCoordinatesInName('Peak 1.0123456E+1/2.0987654E+1')).toBe('Peak 10.1/21');
      // The accepted cost: a fine non-coordinate in a name is coarsened too.
      expect(coarsenCoordinatesInName('v2.15 build 1.2.3')).toBe('v2.2 build 1.2.3');
    });

    it('matches the shared vector table, byte-identical to backend#1397 (sha256-pinned)', () => {
      const bytes = readFileSync(VECTORS_PATH);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(VECTORS_SHA256);
      const { rows } = JSON.parse(bytes.toString('utf8')) as { rows: Array<{ input: string; public: string }> };
      expect(rows.length).toBeGreaterThanOrEqual(30);
      for (const row of rows) {
        expect({ input: row.input, public: coarsenCoordinatesInName(row.input) }).toEqual(row);
      }
    });

    it('applies in the public build only, and through the station detail projection', () => {
      expect(displayStationName('Hilltop 10.123456,-21', PUBLIC)).toBe('Hilltop 10.1,-21');
      expect(displayStationName('Hilltop 10.123456,-21', STUDIO)).toBe('Hilltop 10.123456,-21');
      expect(displayStationName(undefined, PUBLIC)).toBeUndefined();
      expect(projectStationDetail({ name: 'Hilltop 10.123456,-21', latitude: 10.123456 }, PUBLIC).name).toBe('Hilltop 10.1,-21');
      expect(projectStationDetail({ name: 'Hilltop 10.123456,-21' }, STUDIO).name).toBe('Hilltop 10.123456,-21');
    });
  });
});
