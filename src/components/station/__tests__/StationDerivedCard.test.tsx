/**
 * @jest-environment jsdom
 */
import { describe, expect, it, afterEach } from '@jest/globals';
import React from 'react';
import '@testing-library/jest-dom';
import { cleanup, render, screen } from '@testing-library/react';
import StationDerivedCard from '../StationDerivedCard';

afterEach(cleanup);

describe('StationDerivedCard', () => {
  it('shows only dew point for a mild reading and says when the others appear', () => {
    render(<StationDerivedCard reading={{ timestamp: '2026-11-01T12:00:00Z', temperatureC: 20, humidityPct: 50, windSpeedMs: 3 }} />);
    expect(screen.getByTestId('station-derived-dew-point')).toHaveTextContent('48.7°F (9.3°C)');
    expect(screen.queryByTestId('station-derived-heat-index')).toBeNull();
    expect(screen.queryByTestId('station-derived-wind-chill')).toBeNull();
    const note = screen.getByTestId('station-derived-note');
    expect(note).toHaveTextContent('Heat index appears from 80°F');
    expect(note).toHaveTextContent('Wind chill appears at 50°F');
    expect(note).toHaveTextContent('not medical or safety advice');
  });

  it('shows heat index on a hot, humid reading', () => {
    render(<StationDerivedCard reading={{ temperatureC: 32.2222, humidityPct: 70, windSpeedMs: 3 }} />);
    expect(screen.getByTestId('station-derived-heat-index')).toHaveTextContent('105.9°F (41.1°C)');
    expect(screen.queryByTestId('station-derived-wind-chill')).toBeNull();
    expect(screen.getByTestId('station-derived-note')).not.toHaveTextContent('Heat index appears');
  });

  it('shows wind chill on a cold, windy reading', () => {
    render(<StationDerivedCard reading={{ temperatureC: -10, humidityPct: 80, windSpeedMs: 20 / 3.6 }} />);
    expect(screen.getByTestId('station-derived-wind-chill')).toHaveTextContent('-0.1°F (-17.9°C)');
    expect(screen.queryByTestId('station-derived-heat-index')).toBeNull();
    expect(screen.getByTestId('station-derived-note')).not.toHaveTextContent('Wind chill appears');
  });

  it('shows no tile when humidity and wind are missing, and nothing without a temperature', () => {
    const { rerender } = render(<StationDerivedCard reading={{ temperatureC: 20 }} />);
    expect(screen.queryByTestId('station-derived-dew-point')).toBeNull();
    expect(screen.getByTestId('station-derived-note')).toBeInTheDocument();
    rerender(<StationDerivedCard reading={{ humidityPct: 50 }} />);
    expect(screen.queryByTestId('station-derived')).toBeNull();
    rerender(<StationDerivedCard reading={undefined} />);
    expect(screen.queryByTestId('station-derived')).toBeNull();
  });
});
