/** @jest-environment jsdom */
/**
 * #556: the rebuilt Forecast page renders only reported NOAA fields, labels forecast-sourced values as
 * forecast, degrades to an honest empty hero, and still makes exactly the three admitted requests once.
 */
import React from 'react';
import { jest } from '@jest/globals';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

const { default: PublicForecastPage } = await import('../PublicForecastPage');

const LIVE_CURRENT = {
  status: 'success',
  current: { temperatureC: 18.2, relativeHumidityPercent: 81, windSpeedKmh: 14.5, barometricPressureHpa: 1013.3, seaLevelPressureHpa: null, observedAt: '2026-10-18T23:30:00+00:00' },
};
const hourlyPeriod = (hour, temperature, shortForecast, pop) => ({
  number: hour + 1, startTime: `2026-10-18T${String(hour).padStart(2, '0')}:00:00-07:00`, isDaytime: hour >= 7 && hour < 19,
  temperature, temperatureUnit: 'F', shortForecast, probabilityOfPrecipitation: { unitCode: 'wmoUnit:percent', value: pop },
});
const HOURLY = { status: 'success', forecast: { periods: Array.from({ length: 24 }, (_, i) => hourlyPeriod((16 + i) % 24, 65 - i, i === 0 ? 'Partly Cloudy' : 'Clear', i === 0 ? 20 : 0)) } };
const DAILY = { status: 'success', forecast: { periods: [
  { name: 'This Afternoon', startTime: '2026-10-18T16:00:00-07:00', isDaytime: true, temperature: 67, temperatureUnit: 'F', shortForecast: 'Sunny' },
  { name: 'Tonight', startTime: '2026-10-18T18:00:00-07:00', isDaytime: false, temperature: 52, temperatureUnit: 'F', shortForecast: 'Partly Cloudy' },
  { name: 'Monday', startTime: '2026-10-19T06:00:00-07:00', isDaytime: true, temperature: 70, temperatureUnit: 'F', shortForecast: 'Rain Likely', probabilityOfPrecipitation: { value: 60 } },
  { name: 'Monday Night', startTime: '2026-10-19T18:00:00-07:00', isDaytime: false, temperature: 54, temperatureUnit: 'F', shortForecast: 'Showers' },
] } };

let calls;
function mockFetch(currentBody = LIVE_CURRENT) {
  calls = [];
  global.fetch = jest.fn(async input => {
    const url = String(input);
    calls.push(url);
    const body = url.includes('/weather/current/') ? currentBody : url.includes('type=hourly') ? HOURLY : DAILY;
    return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
  });
}
async function search() {
  render(<PublicForecastPage />);
  fireEvent.change(screen.getByLabelText(/Latitude/), { target: { value: '37.87' } });
  fireEvent.change(screen.getByLabelText(/Longitude/), { target: { value: '-122.27' } });
  fireEvent.click(screen.getByText('Get forecast'));
  await screen.findByTestId('forecast-cell');
}
afterEach(() => { cleanup(); jest.restoreAllMocks(); });

it('shows the live current-observation fields in °F/mph and labels condition text and rain chance as forecast', async () => {
  mockFetch();
  await search();
  const hero = await screen.findByRole('region', { name: 'Current conditions' });
  expect(hero).toHaveTextContent('65°F');
  expect(hero).toHaveTextContent('81%');
  expect(hero).toHaveTextContent('9 mph');
  expect(hero).toHaveTextContent('1013.3 hPa');
  expect(hero).toHaveTextContent('Partly Cloudy');
  expect(hero).toHaveTextContent('20%');
  expect(within(hero).getAllByText('forecast, next hour').length).toBe(2);
  expect(hero).not.toHaveTextContent(/feels like|dew point/i);
  expect(screen.getByTestId('forecast-cell')).toHaveTextContent('37.9,-122.3');
});

it('prints a dash for each unreported value and the empty hero when nothing was observed', async () => {
  mockFetch({ status: 'success', current: { ...LIVE_CURRENT.current, relativeHumidityPercent: null, windSpeedKmh: null } });
  await search();
  const hero = await screen.findByRole('region', { name: 'Current conditions' });
  expect(within(hero).getAllByText('—').length).toBe(2);
  cleanup();

  mockFetch({ status: 'success', current: { temperatureC: null, relativeHumidityPercent: null, windSpeedKmh: null, barometricPressureHpa: null, seaLevelPressureHpa: null, observedAt: '2026-10-18T23:30:00+00:00' } });
  await search();
  const empty = await screen.findByRole('region', { name: 'Current conditions' });
  expect(empty).toHaveTextContent('No current observation for this cell');
  expect(empty).not.toHaveTextContent('°F');
  expect(screen.getByRole('region', { name: '7-day outlook' })).toBeInTheDocument();
});

it('pairs day and night periods into 7-day cards and keeps the 24-hour section', async () => {
  mockFetch();
  await search();
  const week = await screen.findByRole('region', { name: '7-day outlook' });
  const cards = within(week).getAllByRole('listitem');
  expect(cards.length).toBe(2);
  expect(cards[0]).toHaveTextContent('Today');
  expect(cards[0]).toHaveTextContent('67°');
  expect(cards[0]).toHaveTextContent('52°');
  expect(cards[0]).toHaveTextContent('Partly Cloudy');
  expect(cards[1]).toHaveTextContent('Mon');
  expect(cards[1]).toHaveTextContent('60%');
  expect(week).not.toHaveTextContent(/14-day/);
  expect(screen.getByRole('region', { name: 'Next 24 hours' })).toHaveTextContent('Now');
});

it('makes exactly three requests per search and none afterwards (no polling)', async () => {
  mockFetch();
  await search();
  await waitFor(() => expect(calls.length).toBe(3));
  await new Promise(resolve => setTimeout(resolve, 50));
  expect(calls.length).toBe(3);
  expect(calls.every(u => u.startsWith('/api/weather/'))).toBe(true);
  expect(JSON.stringify(calls)).not.toMatch(/37\.87|122\.27/);
});
