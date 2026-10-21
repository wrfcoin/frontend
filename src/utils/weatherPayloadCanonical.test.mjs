import test from 'node:test';
import assert from 'node:assert/strict';

import {
  WEATHER_SCHEMA_V1,
  canonicalizeWeatherPayload,
} from './weatherPayloadCanonical.js';

test('canonicalizeWeatherPayload emits canonical payload without legacy telemetry for canonical keys', () => {
  const result = canonicalizeWeatherPayload({
    station_id: 'station-frontend-canonical',
    timestamp: '2026-02-27T00:00:00Z',
    measurements: {
      temperature_c: 20.5,
      humidity: 44,
      pressure_hpa: 1008.1,
    },
  });

  assert.equal(result.canonicalPayload.schema_version, WEATHER_SCHEMA_V1);
  assert.equal(result.canonicalPayload.station_id, 'station-frontend-canonical');
  assert.deepEqual(result.canonicalPayload.observation, {
    temperature_c: 20.5,
    humidity: 44,
    pressure_hpa: 1008.1,
    wind_speed_ms: undefined,
    precipitation: undefined,
    dewpoint_c: undefined,
  });
  assert.equal(result.telemetry, undefined);
});

test('canonicalizeWeatherPayload emits legacy-format-detected telemetry for alias keys', () => {
  const result = canonicalizeWeatherPayload({
    stationId: 'station-frontend-legacy',
    timestamp: '2026-02-27T00:00:00Z',
    measurements: {
      temp_c: 19.2,
      rainfall: 1.5,
      windSpeed: 3.4,
    },
  });

  assert.equal(result.canonicalPayload.schema_version, WEATHER_SCHEMA_V1);
  assert.equal(result.canonicalPayload.station_id, 'station-frontend-legacy');
  assert.equal(result.canonicalPayload.observation.temperature_c, 19.2);
  assert.equal(result.canonicalPayload.observation.precipitation, 1.5);
  assert.equal(result.canonicalPayload.observation.wind_speed_ms, 3.4);
  assert.deepEqual(result.telemetry, {
    event: 'legacy-format-detected',
    schemaVersion: WEATHER_SCHEMA_V1,
    source: 'legacy-flat',
    legacyKeys: ['rainfall', 'stationId', 'temp_c', 'windSpeed'],
  });
});

test('canonicalizeWeatherPayload keeps first-party canonical device-manager shape telemetry-free', () => {
  const result = canonicalizeWeatherPayload({
    station_id: 'station-device-manager-canonical',
    timestamp: '2026-02-28T12:34:56Z',
    measurements: {
      temperature_c: 21.1,
      humidity: 57.3,
      pressure_hpa: 1009.7,
      wind_speed_ms: 4.9,
      precipitation: 0.8,
    },
  });

  assert.equal(result.canonicalPayload.schema_version, WEATHER_SCHEMA_V1);
  assert.equal(result.canonicalPayload.station_id, 'station-device-manager-canonical');
  assert.deepEqual(result.canonicalPayload.observation, {
    temperature_c: 21.1,
    humidity: 57.3,
    pressure_hpa: 1009.7,
    wind_speed_ms: 4.9,
    precipitation: 0.8,
    dewpoint_c: undefined,
  });
  assert.equal(result.telemetry, undefined);
});
