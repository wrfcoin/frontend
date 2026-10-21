/**
 * Public position grid: 0.1 degree (~11 km). Owner ruling 2026-10-01, which
 * matches the backend's anonymous projection and mobile collect. No public page
 * shows a position finer than this.
 */
export const PUBLIC_COORDINATE_STEP = 0.1;

export function coarsenCoordinate(value: number, step = PUBLIC_COORDINATE_STEP): number {
  if (!Number.isFinite(value)) {
    throw new TypeError('Coordinate must be finite');
  }
  if (!Number.isFinite(step) || step <= 0) {
    throw new RangeError('Coordinate step must be positive');
  }

  const precision = Math.max(0, Math.ceil(-Math.log10(step)));
  return Number((Math.round(value / step) * step).toFixed(precision));
}
