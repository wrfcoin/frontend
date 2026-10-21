/**
 * Pure view-model helpers for the public Forecast page (#556). No fetching, no clocks, nothing fabricated:
 * every value shown comes from a NOAA field the proxy returned; a missing field renders as null and
 * the components print "—" or hide the row.
 *
 * Shapes (verified against the live proxy on 2026-10-18):
 *   GET /weather/current/<cell>        → { current: { temperatureC, relativeHumidityPercent, windSpeedKmh,
 *                                          barometricPressureHpa, seaLevelPressureHpa, observedAt } }
 *   GET /weather/forecast/<cell>?…     → { forecast: { periods: [{ startTime, isDaytime, temperature,
 *                                          temperatureUnit, shortForecast, probabilityOfPrecipitation?,
 *                                          name? (daily only) }] } }
 * The older test fixture shape { current: { data: { temperature, temperatureUnit, conditions } } } is still
 * accepted so the S5 page tests keep their meaning.
 */

const finite = value => (typeof value === 'number' && Number.isFinite(value) ? value : null);

export function celsiusToFahrenheit(celsius) {
  const c = finite(celsius);
  return c === null ? null : Math.round((c * 9) / 5 + 32);
}

export function kmhToMph(kmh) {
  const k = finite(kmh);
  return k === null ? null : Math.round(k / 1.609344);
}

/**
 * Normalises the current-observation payload. Returns null when the proxy returned no `current`
 * object at all; returns an object whose fields may each be null when NOAA reported no value.
 */
export function normalizeCurrent(payload) {
  const raw = payload?.current;
  if (!raw || typeof raw !== 'object') return null;
  const obs = raw.data && typeof raw.data === 'object' ? raw.data : raw;
  let temperatureF = celsiusToFahrenheit(obs.temperatureC);
  if (temperatureF === null && finite(obs.temperature) !== null) {
    temperatureF = obs.temperatureUnit === 'C' ? celsiusToFahrenheit(obs.temperature) : Math.round(obs.temperature);
  }
  const humidity = finite(obs.relativeHumidityPercent);
  const windMph = kmhToMph(obs.windSpeedKmh);
  const pressureHpa = finite(obs.barometricPressureHpa) ?? finite(obs.seaLevelPressureHpa);
  return {
    temperatureF,
    humidityPercent: humidity === null ? null : Math.round(humidity),
    windMph,
    pressureHpa: pressureHpa === null ? null : Math.round(pressureHpa * 10) / 10,
    conditions: typeof obs.conditions === 'string' && obs.conditions.trim() !== '' ? obs.conditions : null,
    observedAt: typeof obs.observedAt === 'string' ? obs.observedAt : null,
  };
}

/** True when the observation object exists but carries no reportable value. */
export function currentIsEmpty(current) {
  return (
    !current ||
    (current.temperatureF === null &&
      current.humidityPercent === null &&
      current.windMph === null &&
      current.pressureHpa === null &&
      current.conditions === null)
  );
}

export function precipitationPercent(period) {
  const pop = period?.probabilityOfPrecipitation;
  const value = finite(typeof pop === 'object' && pop !== null ? pop.value : pop);
  return value === null ? null : Math.max(0, Math.min(100, Math.round(value)));
}

/** Hour of day (0-23) in the forecast location's own offset, read from the ISO string itself. */
export function localHour(isoStartTime) {
  const match = /T(\d{2}):/.exec(String(isoStartTime ?? ''));
  return match ? Number(match[1]) : null;
}

export function hourLabel(hour) {
  if (hour === null || hour === undefined) return '';
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

/** Maps NOAA shortForecast text to one of the page's ten icon glyphs. */
export function iconFor(shortForecast, isDaytime = true) {
  const text = String(shortForecast ?? '').toLowerCase();
  if (/thunder|t-storm/.test(text)) return 'thunder';
  if (/snow|sleet|flurr|blizzard|ice|freezing/.test(text)) return 'snow';
  if (/rain|shower|drizzle/.test(text)) return 'rain';
  if (/fog|haze|smoke|mist/.test(text)) return 'fog';
  if (/wind|breezy|blustery/.test(text)) return 'wind';
  if (/overcast|mostly cloudy|^cloudy/.test(text)) return 'cloud';
  if (/partly|mostly sunny|mostly clear|few clouds|scattered/.test(text)) return isDaytime ? 'cloud-sun' : 'cloud-moon';
  if (/sunny|clear/.test(text)) return isDaytime ? 'sun' : 'moon';
  if (text === '') return null;
  return 'cloud';
}

/** Rows for the 24-hour chart; one per hourly period, in the order NOAA returned them. */
export function hourlyRows(periods, limit = 24) {
  const list = Array.isArray(periods) ? periods.slice(0, limit) : [];
  return list.map((p, index) => {
    const hour = localHour(p.startTime);
    return {
      key: p.startTime ?? String(index),
      hour,
      label: index === 0 ? 'Now' : hourLabel(hour),
      temperature: finite(p.temperature),
      temperatureUnit: typeof p.temperatureUnit === 'string' ? p.temperatureUnit : null,
      precipitation: precipitationPercent(p),
      shortForecast: typeof p.shortForecast === 'string' ? p.shortForecast : null,
      icon: iconFor(p.shortForecast, p.isDaytime !== false),
    };
  });
}

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Mon" / "Oct 19" from the period's own ISO date (location-local, no browser timezone). */
export function dayLabels(isoStartTime, name) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(isoStartTime ?? ''));
  if (!match) return { day: name ?? '', date: '' };
  const [, y, m, d] = match.map(Number);
  const weekday = WEEKDAY[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  const date = `${MONTH[m - 1]} ${d}`;
  const n = String(name ?? '');
  if (/^(this afternoon|today|this morning)$/i.test(n)) return { day: 'Today', date };
  if (/^tonight$/i.test(n)) return { day: 'Tonight', date };
  return { day: weekday, date };
}

/**
 * Pairs NOAA half-day periods into day cards: a daytime period followed by its night. A leading
 * night-only period ("Tonight") becomes its own card. `days=14` yields fourteen half-days = 7 cards.
 */
export function pairDailyPeriods(periods, limit = 14) {
  const list = Array.isArray(periods) ? periods.slice(0, limit) : [];
  const cards = [];
  for (let i = 0; i < list.length; i += 1) {
    const p = list[i];
    const next = list[i + 1];
    const isDay = p.isDaytime !== false;
    const night = isDay && next && next.isDaytime === false ? next : null;
    const dayPeriod = isDay ? p : null;
    const nightPeriod = isDay ? night : p;
    const labels = dayLabels(p.startTime, p.name);
    cards.push({
      key: p.startTime ?? String(i),
      day: labels.day,
      date: labels.date,
      high: dayPeriod ? finite(dayPeriod.temperature) : null,
      low: nightPeriod ? finite(nightPeriod.temperature) : null,
      unit: typeof p.temperatureUnit === 'string' ? p.temperatureUnit : 'F',
      dayText: dayPeriod && typeof dayPeriod.shortForecast === 'string' ? dayPeriod.shortForecast : null,
      nightText: nightPeriod && typeof nightPeriod.shortForecast === 'string' ? nightPeriod.shortForecast : null,
      icon: iconFor((dayPeriod ?? nightPeriod)?.shortForecast, Boolean(dayPeriod)),
      precipitation: Math.max(precipitationPercent(dayPeriod) ?? -1, precipitationPercent(nightPeriod) ?? -1),
    });
    if (night) i += 1;
  }
  return cards.map(c => ({ ...c, precipitation: c.precipitation < 0 ? null : c.precipitation }));
}

/** "4:30 PM" from an ISO observation time, in the browser's zone (observations are instants). */
export function observedLabel(iso) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
