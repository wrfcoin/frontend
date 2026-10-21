/** @jest-environment jsdom */
import { jest } from '@jest/globals';
import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
const flags = { demoSurfaces: false };
jest.unstable_mockModule('../../../config/features', () => ({ default: flags, FEATURES: flags }));
const get = jest.fn(async () => { throw new Error('404: no forecast-studio API'); });
jest.unstable_mockModule('../../../services/apiClient', () => ({ apiClient: { get } }));
const { default: ForecastStudio } = await import('../ForecastStudio');
afterEach(() => { cleanup(); get.mockClear(); });
it('the unmounted forecast catalog cannot show generated statistics, activity or controls', () => {
  flags.demoSurfaces = false;
  render(<ForecastStudio />);
  expect(screen.getByText('Forecast studio is unavailable')).toBeInTheDocument();
  expect(screen.queryByText('Forecasts Created')).not.toBeInTheDocument();
  expect(screen.queryByText('Avg Skill')).not.toBeInTheDocument();
  expect(screen.queryByText(/48hr Northeast Snowfall/)).not.toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(get).not.toHaveBeenCalled();
});
it('the retained workspace is explicitly illustrative when demo surfaces are enabled', async () => {
  flags.demoSurfaces = true;
  render(<ForecastStudio />);
  expect(screen.getByTestId('forecast-studio-sample-badge')).toHaveTextContent('Sample data');
  await waitFor(() => expect(get).toHaveBeenCalledWith('/forecast-studio/forecasts'));
  expect(screen.getByText('Forecasts Created')).toBeInTheDocument();
});
