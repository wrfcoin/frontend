export const WEATHER_SCHEMA_V1 = 'wrf.weather.observation.v1';

const ALIAS_KEYS = {
  temperature_c: ['temperature', 'temp_c', 'temperature_celsius'],
  pressure_hpa: ['pressure'],
  wind_speed_ms: ['windSpeed', 'wind_speed'],
  precipitation: ['rainfall', 'precip_mm', 'precipitation_mm'],
  dewpoint_c: ['dewpoint', 'dew_point'],
};

const toFiniteNumber = value => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
};

const pickNumber = (measurements, keys) => {
  for (const key of keys) {
    const parsed = toFiniteNumber(measurements[key]);
    if (parsed !== undefined) {
      return parsed;
    }
  }
  return undefined;
};

export const canonicalizeWeatherPayload = input => {
  const measurements =
    input && typeof input.measurements === 'object' && input.measurements
      ? input.measurements
      : {};

  const observedAtUnix = (() => {
    const timestamp = input?.timestamp;
    if (typeof timestamp === 'string' && timestamp.trim().length > 0) {
      const millis = Date.parse(timestamp);
      if (Number.isFinite(millis)) {
        return Math.trunc(millis / 1000);
      }
    }
    return Math.trunc(Date.now() / 1000);
  })();

  const observation = {
    temperature_c: pickNumber(measurements, [
      'temperature_c',
      ...ALIAS_KEYS.temperature_c,
    ]),
    humidity: pickNumber(measurements, ['humidity', 'relative_humidity']),
    pressure_hpa: pickNumber(measurements, [
      'pressure_hpa',
      ...ALIAS_KEYS.pressure_hpa,
    ]),
    wind_speed_ms: pickNumber(measurements, [
      'wind_speed_ms',
      ...ALIAS_KEYS.wind_speed_ms,
    ]),
    precipitation: pickNumber(measurements, [
      'precipitation',
      ...ALIAS_KEYS.precipitation,
    ]),
    dewpoint_c: pickNumber(measurements, [
      'dewpoint_c',
      ...ALIAS_KEYS.dewpoint_c,
    ]),
  };

  const legacyKeys = [];
  for (const [canonicalKey, aliases] of Object.entries(ALIAS_KEYS)) {
    if (measurements[canonicalKey] !== undefined) {
      continue;
    }
    for (const alias of aliases) {
      if (measurements[alias] !== undefined) {
        legacyKeys.push(alias);
      }
    }
  }

  if (input?.stationId && !input?.station_id) {
    legacyKeys.push('stationId');
  }

  return {
    canonicalPayload: {
      schema_version: WEATHER_SCHEMA_V1,
      station_id: input?.station_id || input?.stationId,
      observed_at_unix: observedAtUnix,
      observation,
    },
    telemetry:
      legacyKeys.length > 0
        ? {
          event: 'legacy-format-detected',
          schemaVersion: WEATHER_SCHEMA_V1,
          source: 'legacy-flat',
          legacyKeys: [...new Set(legacyKeys)].sort(),
        }
        : undefined,
  };
};
