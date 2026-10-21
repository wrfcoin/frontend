import { describe, expect, it } from '@jest/globals';
import { coarsen, coarsePathSegment } from '../coarseLocation';

// Golden values mirror mobile CoarseLocation._round: (v * 10).roundToDouble() / 10 + 0.0
// (Dart rounds half AWAY from zero, so -0.25 -> -0.3 where Math.round would give -0.2).
describe('coarsen (0.1 degree grid)', () => {
  it.each([
    [40.7128, 40.7],
    [-74.006, -74.0],
    [37.77493, 37.8],
    [-122.4194, -122.4],
    [0.04, 0.0],
    [0.05, 0.1], // x.x5 boundary rounds away from zero
    [0.15, 0.2],
    [0.25, 0.3],
    [0.35, 0.4],
    [-0.05, -0.1],
    [-0.15, -0.2],
    [-0.25, -0.3], // Math.round(-2.5) would give -2
    [-0.35, -0.4],
    [-0.04, 0],
    [179.96, 180.0],
    [-89.95, -90.0],
  ])('coarsen(%p) = %p', (input, expected) => {
    expect(coarsen(input)).toBe(expected);
  });

  it('never returns negative zero', () => {
    expect(Object.is(coarsen(-0.04), 0)).toBe(true);
    expect(Object.is(coarsen(-0), 0)).toBe(true);
  });
});

describe('coarsePathSegment', () => {
  it.each([
    [40.7128, -74.006, '40.7,-74.0'],
    [-33.8688, 151.2093, '-33.9,151.2'],
    [0.04, -0.04, '0.0,0.0'],
    [-0.25, 0.25, '-0.3,0.3'],
    [89.99, 179.99, '90.0,180.0'],
    [5, -5, '5.0,-5.0'],
  ])('(%p, %p) -> %p', (lat, lon, expected) => {
    expect(coarsePathSegment(lat, lon)).toBe(expected);
  });

  it('always has exactly one decimal per coordinate (the edge grammar)', () => {
    const grammar = /^-?[0-9]{1,2}\.[0-9],-?[0-9]{1,3}\.[0-9]$/;
    for (const [lat, lon] of [[12.345678, -98.765432], [-0.0001, 0.0001], [89.9, -179.9], [45, 90]]) {
      expect(coarsePathSegment(lat, lon)).toMatch(grammar);
    }
  });

  it.each([[91, 0], [-91, 0], [0, 181], [0, -181], [NaN, 0], [0, Infinity]])(
    'refuses out-of-range or non-finite (%p, %p)',
    (lat, lon) => {
      expect(coarsePathSegment(lat, lon)).toBeNull();
    },
  );
});
