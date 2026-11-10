import { describe, expect, it } from '@jest/globals';
import { cToF, deriveFromReading, dewPointC, fToC, formatTemperatureBoth, heatIndexC, windChillC } from '../derivedWeather';

describe('dewPointC (Magnus)', () => {
  it('matches published values', () => {
    expect(dewPointC(20, 50)).toBeCloseTo(9.26, 1);
    expect(dewPointC(30, 70)).toBeCloseTo(23.9, 1);
    expect(dewPointC(-10, 80)).toBeCloseTo(-12.8, 1);
  });
  it('equals the temperature at 100% humidity', () => {
    expect(dewPointC(15, 100)).toBeCloseTo(15, 6);
  });
  it('is null outside the range or without both inputs', () => {
    expect(dewPointC(20, 0)).toBeNull();
    expect(dewPointC(20, 101)).toBeNull();
    expect(dewPointC(51, 50)).toBeNull();
    expect(dewPointC(-41, 50)).toBeNull();
    expect(dewPointC(undefined, 50)).toBeNull();
    expect(dewPointC(20, null)).toBeNull();
    expect(dewPointC(Number.NaN, 50)).toBeNull();
  });
});

describe('heatIndexC (NWS Rothfusz)', () => {
  const hiF = (tF: number, rh: number) => {
    const c = heatIndexC(fToC(tF), rh);
    return c === null ? null : cToF(c);
  };
  it('matches the NWS heat index chart', () => {
    expect(hiF(90, 70)).toBeCloseTo(105.9, 0);
    expect(hiF(80, 40)).toBeCloseTo(80, 0);
    expect(hiF(96, 65)).toBeCloseTo(121, 0);
    expect(hiF(100, 40)).toBeCloseTo(109, 0);
  });
  it('applies the NWS adjustment for very humid air between 80 and 87 °F', () => {
    const plain = -42.379 + 2.04901523 * 82 + 10.14333127 * 95 - 0.22475541 * 82 * 95 - 0.00683783 * 82 * 82
      - 0.05481717 * 95 * 95 + 0.00122874 * 82 * 82 * 95 + 0.00085282 * 82 * 95 * 95 - 0.00000199 * 82 * 82 * 95 * 95;
    expect(hiF(82, 95)).toBeCloseTo(plain + 1, 5);
  });
  it('is null below 80 °F, above 110 °F or under 40% humidity', () => {
    expect(hiF(79.5, 60)).toBeNull();
    expect(hiF(111, 60)).toBeNull();
    expect(hiF(95, 39)).toBeNull();
    expect(heatIndexC(26, 90)).toBeNull();
    expect(heatIndexC(30, undefined)).toBeNull();
  });
  it('uses the NWS simple formula where its averaged result is under 80 °F', () => {
    // 80 °F at 40 %: simple = 0.5 * (80 + 61 + 14.4 + 3.76) = 79.58, averaged with 80 = 79.79.
    expect(hiF(80, 40)).toBeCloseTo(79.79, 2);
    // 81 °F at 45 % averages to 80.85, so the regression is used: 81.4 on the NWS chart.
    expect(hiF(81, 45)).toBeCloseTo(81.4, 0);
  });
  it('shows nothing above the top of the NWS chart instead of an extrapolated number', () => {
    expect(hiF(110, 100)).toBeNull(); // the regression alone would say about 278 °F
    expect(hiF(104, 80)).toBeNull();  // about 166 °F
    expect(hiF(100, 65)).toBeCloseTo(136, 0); // the chart's last value in that row is shown
    for (let t = 80; t <= 110; t += 1) {
      for (let rh = 40; rh <= 100; rh += 5) {
        const v = hiF(t, rh);
        if (v !== null) { expect(v).toBeLessThanOrEqual(137); expect(v).toBeGreaterThanOrEqual(79); }
      }
    }
  });
  it('counts 26.67 °C as 80 °F', () => {
    expect(heatIndexC(26.67, 50)).not.toBeNull();
  });
});

describe('windChillC (NWS / Environment Canada 2001)', () => {
  it('matches published values', () => {
    expect(windChillC(-10, 20 / 3.6)).toBeCloseTo(-17.9, 1);
    expect(windChillC(0, 30 / 3.6)).toBeCloseTo(-6.5, 1);
    expect(windChillC(-20, 40 / 3.6)).toBeCloseTo(-34.1, 0);
  });
  it('is null warmer than 10 °C, in light wind or without both inputs', () => {
    expect(windChillC(10.1, 10)).toBeNull();
    expect(windChillC(5, 4.8 / 3.6)).toBeNull();
    expect(windChillC(5, 0)).toBeNull();
    expect(windChillC(-51, 10)).toBeNull();
    expect(windChillC(5, undefined)).toBeNull();
  });
  it('is never warmer than the air at the edge of its range', () => {
    expect(windChillC(10, 5 / 3.6) as number).toBeLessThan(10);
  });
});

describe('deriveFromReading', () => {
  it('never shows heat index and wind chill together', () => {
    for (let t = -45; t <= 48; t += 1.5) {
      const d = deriveFromReading({ temperatureC: t, humidityPct: 70, windSpeedMs: 6 });
      expect(d.heatIndexC !== null && d.windChillC !== null).toBe(false);
    }
  });
  it('gives nothing for a missing reading', () => {
    expect(deriveFromReading(null)).toEqual({ dewPointC: null, heatIndexC: null, windChillC: null });
  });
  it('formats °F first with °C beside it', () => {
    expect(formatTemperatureBoth(9)).toBe('48.2°F (9.0°C)');
  });
});
