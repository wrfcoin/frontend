import {
  isFullStudioEnabled,
  isPublicReadonlyEnabled,
} from '../config/contractSurfacePolicy';
import { coarsenCoordinate } from './geo';

type ProjectionFlags = { publicReadonly: unknown; fullStudio: unknown };

/** Stage 1.5 public read-only build: station positions leave only coarsened. */
export function isPublicStationProjection(flags: ProjectionFlags): boolean {
  return (
    isPublicReadonlyEnabled(flags.publicReadonly) &&
    !isFullStudioEnabled(flags.fullStudio)
  );
}

export function projectStationCoordinates(
  station: { latitude: number; longitude: number },
  flags: ProjectionFlags,
): { lat: number; lng: number } {
  const coarsen = isPublicStationProjection(flags);
  return {
    lat: coarsen ? coarsenCoordinate(station.latitude) : station.latitude,
    lng: coarsen ? coarsenCoordinate(station.longitude) : station.longitude,
  };
}

// One complete numeric-token grammar (frontend#436 / backend#1397 review):
// every maximal decimal token, with optional sign, empty fraction ("1."),
// leading dot (".5") and exponent ("1.e-3", "+.5e1"). No form is special-cased,
// so no spelling of a number slips past. Byte-identical to the backend rule;
// the shared vector table (station-name-public-vectors.json) pins both.
const NUMBER_TOKEN = /[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g;

/**
 * An owner-entered station name with every number token that parses to a
 * finite value with |value| ≤ 180 and is not already exactly at one decimal
 * replaced by its one-decimal form, e.g. "Hilltop 10.123456,-21" →
 * "Hilltop 10.1,-21". Integers and one-decimal values stay byte-identical
 * ("Station 42", "v2"). A non-coordinate such as "Unit 12.345" is coarsened
 * too: an accepted cost that fails safe.
 */
export function coarsenCoordinatesInName(name: string): string {
  return name.replace(NUMBER_TOKEN, (token) => {
    const value = Number(token);
    if (!Number.isFinite(value) || Math.abs(value) > 180) return token;
    // Not coarsenCoordinate(): round(v * 10) / 10 is the backend's exact
    // expression, so both sides produce the same text for every token.
    const oneDecimal = Math.round(value * 10) / 10;
    return oneDecimal === value ? token : String(oneDecimal);
  });
}

/** The station name a page shows: coordinate-like numbers coarsened in the public build. */
export function displayStationName<T extends string | null | undefined>(name: T, flags: ProjectionFlags): T {
  if (typeof name !== 'string' || !isPublicStationProjection(flags)) return name;
  return coarsenCoordinatesInName(name) as T;
}

/**
 * A station's position as text, under the same policy: in the public build,
 * the grid value at one decimal and never the free-text location (it is filled
 * from the street address); elsewhere, the location or four decimals.
 */
export function formatStationPosition(
  station: { latitude?: number; longitude?: number; location?: string | null },
  flags: ProjectionFlags,
): string {
  if (isPublicStationProjection(flags)) {
    if (station.latitude == null || station.longitude == null) return '';
    return `${coarsenCoordinate(station.latitude).toFixed(1)}, ${coarsenCoordinate(station.longitude).toFixed(1)}`;
  }
  return station.location ?? `${station.latitude?.toFixed(4)}, ${station.longitude?.toFixed(4)}`;
}

/**
 * Station detail (frontend#349) under the same policy as the public map:
 * coordinates coarsened to the grid, and the free-text location withheld
 * because the station service fills it from the street address. Internal
 * builds keep the precise values.
 */
export function projectStationDetail<
  T extends { latitude?: number; longitude?: number; location?: string; name?: string },
>(station: T, flags: ProjectionFlags): T {
  if (!isPublicStationProjection(flags)) {
    return station;
  }
  return {
    ...station,
    // frontend#436 review: an owner-entered name can carry a position.
    name: typeof station.name === 'string' ? coarsenCoordinatesInName(station.name) : station.name,
    latitude: station.latitude == null ? undefined : coarsenCoordinate(station.latitude),
    longitude: station.longitude == null ? undefined : coarsenCoordinate(station.longitude),
    location: undefined,
  };
}
