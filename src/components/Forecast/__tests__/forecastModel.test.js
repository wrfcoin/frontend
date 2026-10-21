/** @jest-environment node */
import {
  celsiusToFahrenheit, currentIsEmpty, dayLabels, hourLabel, hourlyRows, iconFor, kmhToMph, localHour,
  normalizeCurrent, pairDailyPeriods, precipitationPercent,
} from '../forecastModel';

describe('normalizeCurrent (live proxy shape, verified 2026-10-18)', () => {
  it('converts reported metric fields and keeps unreported ones null', () => {
    const current = normalizeCurrent({ current: {
      temperatureC: 18.2, relativeHumidityPercent: 81.4, windSpeedKmh: 14.5, barometricPressureHpa: 1013.26,
      seaLevelPressureHpa: null, observedAt: '2026-10-18T23:30:00+00:00',
    } });
    expect(current).toEqual({
      temperatureF: 65, humidityPercent: 81, windMph: 9, pressureHpa: 1013.3, conditions: null,
      observedAt: '2026-10-18T23:30:00+00:00',
    });
    expect(currentIsEmpty(current)).toBe(false);
  });

  it('an observation with every value null is empty, and a missing object is null', () => {
    const current = normalizeCurrent({ current: {
      temperatureC: null, relativeHumidityPercent: null, barometricPressureHpa: null, seaLevelPressureHpa: null,
      windSpeedKmh: null, observedAt: '2026-10-18T23:30:00+00:00',
    } });
    expect(current.temperatureF).toBeNull();
    expect(currentIsEmpty(current)).toBe(true);
    expect(normalizeCurrent({})).toBeNull();
    expect(currentIsEmpty(null)).toBe(true);
  });

  it('still reads the older { current: { data } } fixture shape with its own units', () => {
    expect(normalizeCurrent({ current: { data: { temperature: 21, temperatureUnit: 'C', conditions: 'Clear' } } }))
      .toMatchObject({ temperatureF: 70, conditions: 'Clear', humidityPercent: null });
    expect(normalizeCurrent({ current: { data: { temperature: 70, temperatureUnit: 'F' } } }).temperatureF).toBe(70);
  });

  it('never invents a number from a non-numeric field', () => {
    expect(celsiusToFahrenheit('18')).toBeNull();
    expect(kmhToMph(Number.NaN)).toBeNull();
    expect(normalizeCurrent({ current: { temperatureC: 'warm' } }).temperatureF).toBeNull();
  });
});

describe('hourly rows', () => {
  it('reads the hour from the period\'s own offset, labels the first row Now and clamps PoP', () => {
    const rows = hourlyRows([
      { startTime: '2026-10-18T16:00:00-07:00', isDaytime: true, temperature: 65, temperatureUnit: 'F', shortForecast: 'Sunny', probabilityOfPrecipitation: { value: 0 } },
      { startTime: '2026-10-19T00:00:00-07:00', isDaytime: false, temperature: 55, temperatureUnit: 'F', shortForecast: 'Mostly Clear', probabilityOfPrecipitation: { value: 140 } },
      { startTime: '2026-10-19T03:00:00-07:00', isDaytime: false, temperature: null, temperatureUnit: 'F', shortForecast: 'Rain Showers Likely' },
    ]);
    expect(rows.map(r => [r.label, r.temperature, r.precipitation, r.icon])).toEqual([
      ['Now', 65, 0, 'sun'], ['12 AM', 55, 100, 'cloud-moon'], ['3 AM', null, null, 'rain'],
    ]);
    expect(localHour('2026-10-18T16:00:00-07:00')).toBe(16);
    expect(hourLabel(12)).toBe('12 PM');
    expect(hourlyRows(undefined)).toEqual([]);
    expect(hourlyRows(Array.from({ length: 30 }, (_, i) => ({ startTime: `2026-10-18T${String(i % 24).padStart(2, '0')}:00:00Z` }))).length).toBe(24);
  });

  it('maps NOAA wording to glyphs and returns null for no text', () => {
    expect(iconFor('Chance Showers And Thunderstorms', true)).toBe('thunder');
    expect(iconFor('Partly Cloudy', false)).toBe('cloud-moon');
    expect(iconFor('Mostly Sunny', true)).toBe('cloud-sun');
    expect(iconFor('Clear', false)).toBe('moon');
    expect(iconFor('Patchy Fog', true)).toBe('fog');
    expect(iconFor('Slight Chance Light Snow', true)).toBe('snow');
    expect(iconFor('Breezy', true)).toBe('wind');
    expect(iconFor('Cloudy', true)).toBe('cloud');
    expect(iconFor('', true)).toBeNull();
    expect(precipitationPercent({ probabilityOfPrecipitation: { value: null } })).toBeNull();
  });
});

describe('7-day pairing', () => {
  const period = (startTime, isDaytime, temperature, shortForecast, name, pop) => ({
    startTime, isDaytime, temperature, temperatureUnit: 'F', shortForecast, name,
    probabilityOfPrecipitation: pop === undefined ? undefined : { value: pop },
  });

  it('pairs each daytime period with its night and makes a leading night its own card', () => {
    const cards = pairDailyPeriods([
      period('2026-10-18T18:00:00-07:00', false, 52, 'Partly Cloudy', 'Tonight', 10),
      period('2026-10-19T06:00:00-07:00', true, 68, 'Sunny', 'Monday', 0),
      period('2026-10-19T18:00:00-07:00', false, 53, 'Clear', 'Monday Night', 0),
      period('2026-10-20T06:00:00-07:00', true, 61, 'Rain Likely', 'Tuesday', 70),
      period('2026-10-20T18:00:00-07:00', false, 50, 'Showers', 'Tuesday Night', 40),
    ]);
    expect(cards.map(c => [c.day, c.date, c.high, c.low, c.dayText, c.nightText, c.icon, c.precipitation])).toEqual([
      ['Tonight', 'Oct 18', null, 52, null, 'Partly Cloudy', 'cloud-moon', 10],
      ['Mon', 'Oct 19', 68, 53, 'Sunny', 'Clear', 'sun', 0],
      ['Tue', 'Oct 20', 61, 50, 'Rain Likely', 'Showers', 'rain', 70],
    ]);
  });

  it('fourteen half-day periods become seven cards and are labelled by their own date', () => {
    const periods = Array.from({ length: 14 }, (_, i) => period(
      `2026-10-${String(18 + Math.floor(i / 2)).padStart(2, '0')}T${i % 2 ? '18' : '06'}:00:00-07:00`, i % 2 === 0, 60 + i, 'Clear',
      i === 0 ? 'This Afternoon' : `P${i}`,
    ));
    const cards = pairDailyPeriods(periods);
    expect(cards.length).toBe(7);
    expect(cards[0]).toMatchObject({ day: 'Today', date: 'Oct 18', high: 60, low: 61, precipitation: null });
    expect(cards[6]).toMatchObject({ day: 'Sat', date: 'Oct 24', high: 72, low: 73 });
    expect(dayLabels('not a date', 'Monday')).toEqual({ day: 'Monday', date: '' });
  });
});
