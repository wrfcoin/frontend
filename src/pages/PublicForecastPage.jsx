import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useIsDarkTheme } from '../theme/ThemeProvider';
import { publicPageSurfaceVars } from '../theme/publicPageTheme';
import { WrfAlert, WrfButton, WrfCard, WrfEmptyState, WrfInput } from '../components/DesignSystem';
import {
  bgPrimary, bgSecondary, borders, categoryColors, fontFamily, glows, info, primaryLight, radii, shadows,
  textMuted, textPrimary, textSecondary,
} from '../components/DesignSystem/tokens';
import ForecastDayCard from '../components/Forecast/ForecastDayCard';
import ForecastHero from '../components/Forecast/ForecastHero';
import HourlyTemperatureChart from '../components/Forecast/HourlyTemperatureChart';
import WeatherIcon from '../components/Forecast/WeatherIcon';
import { hourlyRows, normalizeCurrent, pairDailyPeriods } from '../components/Forecast/forecastModel';
import { coarsePathSegment, isValidCoordinate } from '../utils/coarseLocation';
import { publicGet, weatherCurrentPath, weatherForecastPath } from '../services/publicReadonlyApi';
import './PublicForecastPage.css';

/**
 * Public weather forecast (S5, rebuilt for launch in #556). The visitor's coordinates are rounded to the
 * 0.1-degree cell on this device BEFORE any request is built (coarsePathSegment is the only way to a URL),
 * so the backend and edge never see a finer location. One search makes three GETs at most (current, hourly,
 * daily outlook), always on an explicit user action: no polling and no automatic refresh, because the edge
 * allows 10 requests/min/IP. Only reported NOAA fields are rendered; nothing is estimated client-side.
 */

// Design-system tokens as CSS custom properties for PublicForecastPage.css.
const TOKEN_VARS = {
  '--pf-bg-primary': bgPrimary,
  '--pf-bg-secondary': bgSecondary,
  '--pf-text': textPrimary,
  '--pf-text-secondary': textSecondary,
  '--pf-text-muted': textMuted,
  '--pf-border': borders.default,
  '--pf-info': info,
  '--pf-primary-light': primaryLight,
  '--pf-weather': categoryColors.weather,
  '--pf-r-sm': `${radii.sm}px`,
  '--pf-r-lg': `${radii.lg}px`,
  '--pf-shadow-md': shadows.md,
  '--pf-glow-weather': glows.weather,
  '--pf-font': fontFamily.display,
};

// `days=14` returns fourteen 12-hour periods (day + night) = about seven days; label it as such.
const DAILY_PERIODS = 14;
const HOURLY_PERIODS = 24;

function outcomeMessage(title, outcome) {
  if (outcome?.kind === 'rate_limited') {
    return `Too many forecast requests right now${outcome.retryAfterSeconds ? `; try again in ${outcome.retryAfterSeconds}s` : ', please wait a minute'}.`;
  }
  if (outcome?.kind === 'not_found') return 'No forecast is available for this location.';
  if (outcome?.kind === 'error') return `${title} unavailable right now.`;
  return null;
}

function Section({ title, subtitle, outcome, children }) {
  const problem = outcomeMessage(title, outcome);
  return (
    <WrfCard
      component="section"
      aria-label={title}
      className="pf-section"
      header={<><h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{title}</h2>{subtitle ? <span className="pf-section-sub">{subtitle}</span> : null}</>}
      noPadding={!problem}
    >
      {problem ? (
        <WrfAlert severity={outcome.kind === 'rate_limited' ? 'warning' : 'info'} role="alert">{problem}</WrfAlert>
      ) : children}
    </WrfCard>
  );
}

export default function PublicForecastPage() {
  // Light theme: surface/text/border variables come from the light token set; everything else stays.
  const isDark = useIsDarkTheme();
  const themeVars = { ...TOKEN_VARS, ...publicPageSurfaceVars('pf', isDark) };
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [formError, setFormError] = useState('');
  const [cell, setCell] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const inFlight = useRef(false);

  const run = useCallback(async (latitude, longitude) => {
    if (inFlight.current) return;
    const segment = coarsePathSegment(latitude, longitude);
    if (!segment) {
      setFormError('Enter a latitude between -90 and 90 and a longitude between -180 and 180.');
      return;
    }
    setFormError('');
    inFlight.current = true;
    setLoading(true);
    setCell(segment);
    try {
      const [current, hourly, daily] = await Promise.all([
        publicGet(weatherCurrentPath(segment)),
        publicGet(weatherForecastPath(segment, 'hourly')),
        publicGet(weatherForecastPath(segment, 'daily')),
      ]);
      setResults({ current, hourly, daily });
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, []);

  const onSubmit = event => {
    event.preventDefault();
    if (lat.trim() === '' || lon.trim() === '') {
      setFormError('Enter both a latitude and a longitude.');
      return;
    }
    run(Number(lat), Number(lon));
  };

  const useMyLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setFormError('Location is not available in this browser. Enter coordinates instead.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        if (isValidCoordinate(latitude, longitude)) {
          // Show only the coarse cell back to the visitor; the exact fix is dropped here.
          const [cLat, cLon] = coarsePathSegment(latitude, longitude).split(',');
          setLat(cLat);
          setLon(cLon);
          run(Number(cLat), Number(cLon));
        }
      },
      () => setFormError('Could not read your location. Enter coordinates instead.'),
    );
  };

  const current = useMemo(
    () => (results?.current?.kind === 'ok' ? normalizeCurrent(results.current.data) : null),
    [results],
  );
  const hourly = useMemo(
    () => (results?.hourly?.kind === 'ok' ? hourlyRows(results.hourly.data?.forecast?.periods, HOURLY_PERIODS) : []),
    [results],
  );
  const days = useMemo(
    () => (results?.daily?.kind === 'ok' ? pairDailyPeriods(results.daily.data?.forecast?.periods, DAILY_PERIODS) : []),
    [results],
  );
  const nextHour = hourly[0] ?? null;
  const showResults = Boolean(results) && !loading;

  return (
    <div className="public-read-page pf-page" data-testid="public-forecast" style={themeVars}>
      <header className="pf-head">
        <h1>Weather forecast</h1>
        <p className="pf-lede">Current conditions, the next 24 hours and a 7-day outlook for any place in the United States.</p>
      </header>

      <WrfCard component="section" aria-label="Location" className="pf-locbar">
        <form className="pf-loc-form" onSubmit={onSubmit}>
          <WrfInput
            label="Latitude"
            inputMode="decimal"
            value={lat}
            onChange={e => setLat(e.target.value)}
            suffixIcon={<span className="pf-small">°N</span>}
            disabled={loading}
          />
          <WrfInput
            label="Longitude"
            inputMode="decimal"
            value={lon}
            onChange={e => setLon(e.target.value)}
            suffixIcon={<span className="pf-small">°E</span>}
            disabled={loading}
          />
          <div className="pf-loc-actions">
            <WrfButton type="submit" variant="primary" loading={loading} startIcon={<WeatherIcon name="pin" size={16} />}>
              Get forecast
            </WrfButton>
            <WrfButton type="button" variant="outline" disabled={loading} onClick={useMyLocation} startIcon={<WeatherIcon name="crosshair" size={16} />}>
              Use my location
            </WrfButton>
          </div>
        </form>
        <p className="pf-note">
          Your location is rounded to about 11 km (0.1°) on this device before it is sent; the network never sees a finer position.
        </p>
        {formError && <WrfAlert severity="error" role="alert" className="pf-error">{formError}</WrfAlert>}
      </WrfCard>

      {loading && <p className="pf-small" role="status">Loading forecast…</p>}

      {cell && !loading && (
        <div className="pf-cell-line">
          <div>
            <span className="pf-cell" data-testid="forecast-cell">Forecast for {cell}</span>
            <span className="pf-small">0.1° cell · NOAA / National Weather Service</span>
          </div>
        </div>
      )}

      {!results && !loading && (
        <WrfEmptyState
          icon={() => <WeatherIcon name="cloud-sun" size={36} />}
          title="Pick a place to see its forecast"
          description="Enter coordinates or use your location. Results come from NOAA / National Weather Service and cover the United States."
        />
      )}

      {showResults && (
        <>
          {outcomeMessage('Current conditions', results.current) ? (
            <Section title="Current conditions" outcome={results.current} />
          ) : (
            <ForecastHero current={current} nextHour={nextHour} cell={cell} />
          )}

          <Section title="Next 24 hours" subtitle={<span className="pf-section-sub--long">Temperature °F · hourly from NOAA</span>} outcome={results.hourly}>
            {hourly.length === 0 ? (
              <p className="pf-section-empty" style={{ padding: '16px 20px' }}>No forecast periods returned.</p>
            ) : (
              <div style={{ padding: '12px 12px 8px' }}><HourlyTemperatureChart rows={hourly} /></div>
            )}
          </Section>

          <Section title="7-day outlook" subtitle="Day · night" outcome={results.daily}>
            {days.length === 0 ? (
              <p className="pf-section-empty" style={{ padding: '16px 20px' }}>No forecast periods returned.</p>
            ) : (
              <ul className="pf-days">{days.map(card => <ForecastDayCard key={card.key} card={card} />)}</ul>
            )}
          </Section>

          <p className="pf-attribution">
            Forecast data: <a href="https://www.weather.gov/" target="_blank" rel="noopener noreferrer">NOAA / National Weather Service</a>.
            Covers the United States only. Forecasts are fetched only when you ask; this page never polls.
          </p>
        </>
      )}
    </div>
  );
}
