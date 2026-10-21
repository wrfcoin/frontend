/** @jest-environment jsdom */
import React from 'react';
import { jest } from '@jest/globals';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockGetWeatherStations = jest.fn();

jest.unstable_mockModule('../../../../services/api', () => ({
  weatherEarningsAPI: { getWeatherStations: mockGetWeatherStations },
}));

jest.unstable_mockModule('lucide-react', () => ({
  Cloud: () => null,
  MapPin: () => null,
  Radio: () => null,
  WifiOff: () => null,
}));

const { default: WeatherStationSection } = await import('../WeatherStationSection');

const STATION_FULL = {
  id: 'st-1',
  name: 'Rooftop Alpha',
  status: 'online',
  location: { address: '123 Main St', latitude: 40.7128, longitude: -74.006 },
  earnings: { daily: '1.2345', monthly: '30.0' },
};

describe('WeatherStationSection — API shape hardening', () => {
  afterEach(() => jest.clearAllMocks());

  it('shows loading state while fetch is pending', async () => {
    mockGetWeatherStations.mockReturnValue(new Promise(() => {}));
    await act(async () => { render(<WeatherStationSection />); });
    expect(screen.getByTestId('stations-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('stations-error')).not.toBeInTheDocument();
    expect(screen.queryByTestId('stations-empty')).not.toBeInTheDocument();
  });

  it('shows error banner when fetch throws', async () => {
    mockGetWeatherStations.mockRejectedValue(new Error('fetch failed'));
    await act(async () => { render(<WeatherStationSection />); });
    expect(screen.getByTestId('stations-error')).toHaveTextContent('Could not load station data');
    expect(screen.queryByTestId('stations-loading')).not.toBeInTheDocument();
    expect(screen.queryByTestId('stations-empty')).not.toBeInTheDocument();
  });

  it('shows empty state when API returns an empty array', async () => {
    mockGetWeatherStations.mockResolvedValue([]);
    await act(async () => { render(<WeatherStationSection />); });
    expect(screen.getByTestId('stations-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('stations-error')).not.toBeInTheDocument();
    expect(screen.queryByTestId('stations-loading')).not.toBeInTheDocument();
  });

  it('treats null API response as empty without crashing', async () => {
    mockGetWeatherStations.mockResolvedValue(null);
    await act(async () => { render(<WeatherStationSection />); });
    expect(screen.getByTestId('stations-empty')).toBeInTheDocument();
  });

  it('renders a station with full data correctly', async () => {
    mockGetWeatherStations.mockResolvedValue([STATION_FULL]);
    await act(async () => { render(<WeatherStationSection />); });
    expect(screen.getByTestId('station-count')).toHaveTextContent('1');
    expect(screen.getByText('Rooftop Alpha')).toBeInTheDocument();
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
    expect(screen.getByTestId('station-earnings')).toHaveTextContent('+1.2345 WRF');
  });

  it('handles missing earnings gracefully', async () => {
    mockGetWeatherStations.mockResolvedValue([{ ...STATION_FULL, earnings: undefined }]);
    await act(async () => { render(<WeatherStationSection />); });
    expect(screen.getByTestId('station-earnings')).toHaveTextContent('—');
  });

  it('handles missing location gracefully', async () => {
    mockGetWeatherStations.mockResolvedValue([{ ...STATION_FULL, location: undefined }]);
    await act(async () => { render(<WeatherStationSection />); });
    expect(screen.getByText('Location unknown')).toBeInTheDocument();
  });

  it('shows IoT redirect note instead of fake sensor readings', async () => {
    mockGetWeatherStations.mockResolvedValue([STATION_FULL]);
    await act(async () => { render(<WeatherStationSection />); });
    expect(screen.getByTestId('station-no-readings')).toBeInTheDocument();
  });
});
