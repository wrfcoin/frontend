import { describe, expect, it } from '@jest/globals';
import {
  API_BASE_URL,
  WEATHER_EARNINGS_API_URL,
  defaultConfig,
} from '../config';

describe('service config defaults', () => {
  it('keeps the main API on the proxy-friendly /api path', () => {
    expect(API_BASE_URL).toBe('/api');
    expect(defaultConfig.baseUrl).toBe('/api');
  });

  it('routes weather earnings through the dedicated proxy path by default', () => {
    expect(WEATHER_EARNINGS_API_URL).toBe('/api/weather-earnings');
  });
});
