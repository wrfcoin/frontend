/**
 * 0.1-degree coordinate coarsening for the public weather forecast (S5).
 *
 * Mirrors mobile CoarseLocation (coarse_location.dart): `(v * 10).roundToDouble() / 10 + 0.0`.
 * Dart's roundToDouble rounds half AWAY from zero, unlike Math.round (half toward +Infinity), so the
 * negative half-cells (-0.25 -> -0.3) are done by hand. The `+ 0` folds -0 into +0 because the sign of a
 * zero would reveal which half of the cell the fix is in. An unrounded fix can never reach a URL: the only
 * way to a path segment is through `coarsePathSegment`.
 */
export const GRID_DEGREES = 0.1;

export function coarsen(value: number): number {
  const scaled = value * 10;
  const rounded = scaled < 0 ? -Math.round(-scaled) : Math.round(scaled);
  return rounded / 10 + 0;
}

export function isValidCoordinate(lat: number, lon: number): boolean {
  return (
    Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180
  );
}

/** `lat,lon` with exactly one decimal each, the only shape the edge admits; null for an invalid fix. */
export function coarsePathSegment(lat: number, lon: number): string | null {
  if (!isValidCoordinate(lat, lon)) return null;
  return `${coarsen(lat).toFixed(1)},${coarsen(lon).toFixed(1)}`;
}
