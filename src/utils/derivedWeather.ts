/**
 * Values calculated from one station reading: dew point, heat index and wind chill.
 *
 * Each formula is the published one and is used only inside the range it was fitted for. Outside
 * that range the function returns null and the page shows nothing, never an extrapolated number.
 * Inputs and outputs are metric (°C, %, m/s).
 *
 *  - Dew point: Magnus formula with the Alduchov and Eskridge (1996) coefficients
 *    (a = 17.625, b = 243.04 °C). Used for -40 to 50 °C and 1 to 100 % humidity.
 *  - Heat index: the US National Weather Service procedure. The simple (Steadman) formula is
 *    averaged with the temperature; if that is 80 °F or more, the Rothfusz regression (NWS
 *    Technical Attachment SR 90-23) with the NWS high-humidity adjustment is used instead.
 *    Inputs are limited to the NWS heat index chart: 80 to 110 °F (26.7 to 43.3 °C) and humidity
 *    of 40 % or more. A result above the top of that chart (137 °F, 58.3 °C) is not shown: up
 *    there the regression is an extrapolation (110 °F at 100 % humidity would give 278 °F).
 *  - Wind chill: the 2001 NWS / Environment Canada formula. Used at 10 °C (50 °F) or colder,
 *    down to -50 °C, with wind above 4.8 km/h (3 mph).
 */

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export const cToF = (c: number) => (c * 9) / 5 + 32;
export const fToC = (f: number) => ((f - 32) * 5) / 9;

export const DEW_POINT_RANGE = { minTempC: -40, maxTempC: 50, minHumidityPct: 1, maxHumidityPct: 100 } as const;
export const HEAT_INDEX_RANGE = { minTempF: 80, maxTempF: 110, minHumidityPct: 40, maxHumidityPct: 100, maxResultF: 137 } as const;
export const WIND_CHILL_RANGE = { minTempC: -50, maxTempC: 10, minWindKmh: 4.8, maxWindKmh: 180 } as const;

const MAGNUS_A = 17.625;
const MAGNUS_B = 243.04;

/** Dew point in °C, or null outside the formula's range. */
export function dewPointC(temperatureC: unknown, humidityPct: unknown): number | null {
  if (!finite(temperatureC) || !finite(humidityPct)) return null;
  const r = DEW_POINT_RANGE;
  if (temperatureC < r.minTempC || temperatureC > r.maxTempC) return null;
  if (humidityPct < r.minHumidityPct || humidityPct > r.maxHumidityPct) return null;
  const gamma = Math.log(humidityPct / 100) + (MAGNUS_A * temperatureC) / (MAGNUS_B + temperatureC);
  return (MAGNUS_B * gamma) / (MAGNUS_A - gamma);
}

/**
 * Heat index in °C, or null outside the NWS chart: inputs below 80 °F, above 110 °F or under 40 %
 * humidity, or a result above the chart's top value of 137 °F.
 */
export function heatIndexC(temperatureC: unknown, humidityPct: unknown): number | null {
  if (!finite(temperatureC) || !finite(humidityPct)) return null;
  const r = HEAT_INDEX_RANGE;
  const t = cToF(temperatureC);
  const h = humidityPct;
  // A tiny tolerance so 26.67 °C, which is 80 °F to the precision stations report, counts as 80 °F.
  if (t < r.minTempF - 0.01 || t > r.maxTempF + 0.01) return null;
  if (h < r.minHumidityPct || h > r.maxHumidityPct) return null;
  // NWS step 1: the simple formula, averaged with the temperature.
  const simple = 0.5 * (t + 61 + (t - 68) * 1.2 + h * 0.094);
  let hi = (simple + t) / 2;
  // NWS step 2: at 80 °F or more, the full regression replaces it.
  if (hi >= 80) {
    hi = -42.379
      + 2.04901523 * t
      + 10.14333127 * h
      - 0.22475541 * t * h
      - 0.00683783 * t * t
      - 0.05481717 * h * h
      + 0.00122874 * t * t * h
      + 0.00085282 * t * h * h
      - 0.00000199 * t * t * h * h;
    // NWS adjustment for very humid air between 80 and 87 °F. (The dry-air adjustment applies only
    // under 13 % humidity, which is outside the range used here.)
    if (h > 85 && t >= 80 && t <= 87) hi += ((h - 85) / 10) * ((87 - t) / 5);
  }
  // Above the top of the NWS chart the regression is an extrapolation: show nothing.
  if (hi > r.maxResultF) return null;
  return fToC(hi);
}

/** Wind chill in °C, or null outside the formula's range (warmer than 10 °C, or wind of 4.8 km/h or less). */
export function windChillC(temperatureC: unknown, windSpeedMs: unknown): number | null {
  if (!finite(temperatureC) || !finite(windSpeedMs)) return null;
  const r = WIND_CHILL_RANGE;
  const kmh = windSpeedMs * 3.6;
  if (temperatureC < r.minTempC || temperatureC > r.maxTempC) return null;
  if (kmh <= r.minWindKmh || kmh > r.maxWindKmh) return null;
  const v = Math.pow(kmh, 0.16);
  return 13.12 + 0.6215 * temperatureC - 11.37 * v + 0.3965 * temperatureC * v;
}

export interface DerivedReading {
  dewPointC: number | null;
  heatIndexC: number | null;
  windChillC: number | null;
}

export function deriveFromReading(reading: { temperatureC?: unknown; humidityPct?: unknown; windSpeedMs?: unknown } | null | undefined): DerivedReading {
  if (!reading) return { dewPointC: null, heatIndexC: null, windChillC: null };
  return {
    dewPointC: dewPointC(reading.temperatureC, reading.humidityPct),
    heatIndexC: heatIndexC(reading.temperatureC, reading.humidityPct),
    windChillC: windChillC(reading.temperatureC, reading.windSpeedMs),
  };
}

/** "48.2°F (9.0°C)": °F first to match the rest of the station page, °C beside it. */
export function formatTemperatureBoth(celsius: number): string {
  return `${cToF(celsius).toFixed(1)}°F (${celsius.toFixed(1)}°C)`;
}
