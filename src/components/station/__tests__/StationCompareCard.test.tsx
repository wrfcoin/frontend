/**
 * @jest-environment jsdom
 */
import { describe, expect, it, afterEach } from '@jest/globals';
import React from 'react';
import '@testing-library/jest-dom';
import { cleanup, render, screen, within } from '@testing-library/react';
import StationCompareCard from '../StationCompareCard';
import { formatDifference, headline, normalizeStationCompare } from '../../../utils/stationCompare';

const body = (over: Record<string, unknown> = {}) => ({
  status: 'ok',
  observedAt: 1_790_000_000,
  nearby: { stations: 2, radiusKm: 100, reason: null },
  nws: { stationIdentifier: 'KBFI', observedAt: 1_789_999_100, reason: null },
  variables: [
    { variable: 'temperature_c', mine: 12, closeWithin: 1.5,
      nearby: { stations: 2, median: 10.5, lowest: 10, highest: 11, difference: 1.5, agreement: 'close' },
      nws: { value: 11, difference: 1, agreement: 'close' } },
    { variable: 'humidity_pct', mine: 60, closeWithin: 8,
      nearby: { stations: 2, median: 70, lowest: 68, highest: 72, difference: -10, agreement: 'lower' },
      nws: { value: 70, difference: -10, agreement: 'lower' } },
    { variable: 'dewpoint_c', mine: null, closeWithin: 1.5, nearby: null, nws: null },
  ],
  notCompared: [{ variable: 'pressure_hpa', reason: 'Station pressure depends on height, so it is not compared.' }],
  source: 'core4+nws',
  ...over,
});

describe('normalizeStationCompare', () => {
  it('keeps the server numbers and drops rows with no reading of ours', () => {
    const v = normalizeStationCompare(body());
    expect(v.status).toBe('ok');
    if (v.status !== 'ok') return;
    expect(v.rows.map(r => r.variable)).toEqual(['temperature_c', 'humidity_pct']);
    expect(v.rows[0].nearby?.median).toBe(10.5);
    expect(v.nws.stationIdentifier).toBe('KBFI');
  });
  it('drops anything it cannot read instead of guessing', () => {
    const v = normalizeStationCompare(body({
      nws: { stationIdentifier: '<script>', observedAt: 'x', reason: null },
      variables: [
        { variable: 'temperature_c', mine: 12, closeWithin: 1.5, nearby: { stations: 2, median: 'warm' }, nws: { value: 11, difference: 1, agreement: 'maybe' } },
        { variable: 'latitude', mine: 47.6 },
      ],
    }));
    if (v.status !== 'ok') throw new Error('expected ok');
    expect(v.nws.stationIdentifier).toBeNull();
    expect(v.rows).toHaveLength(1);
    expect(v.rows[0].nearby).toBeNull();
    expect(v.rows[0].nws).toBeNull();
  });
  it('passes no_recent_reading through and rejects junk', () => {
    expect(normalizeStationCompare({ status: 'no_recent_reading', reason: 'Nothing in 6 hours.' })).toEqual({ status: 'no_recent_reading', reason: 'Nothing in 6 hours.' });
    expect(() => normalizeStationCompare('nope')).toThrow();
    expect(() => normalizeStationCompare({ status: 'ok' })).toThrow();
  });
  it('formats temperature differences in °F without the +32 offset', () => {
    expect(formatDifference('temperature_c', 1.5)).toBe('+2.7°F');
    expect(formatDifference('temperature_c', -1)).toBe('−1.8°F');
    expect(formatDifference('humidity_pct', -10)).toBe('−10 pts');
    expect(formatDifference('temperature_c', 0.01)).toBe('same');
  });
  it('writes one plain headline', () => {
    expect(headline(normalizeStationCompare(body()))).toBe('Your station differs on humidity.');
    const agree = body();
    (agree.variables as unknown[]).splice(1, 1);
    expect(headline(normalizeStationCompare(agree))).toBe('Your station agrees with its references.');
  });
});

describe('StationCompareCard', () => {
  afterEach(() => cleanup());

  it('shows each variable against nearby and NWS', () => {
    render(<StationCompareCard view={normalizeStationCompare(body())} unavailable={false} />);
    const temp = screen.getByTestId('station-compare-row-temperature_c');
    expect(temp).toHaveTextContent('53.6°F'); // 12 °C
    expect(within(temp).getByText('Nearby (2 stations)')).toBeInTheDocument();
    expect(within(temp).getByText('NWS KBFI')).toBeInTheDocument();
    expect(temp).toHaveTextContent('range 50.0°F to 51.8°F');
    const hum = screen.getByTestId('station-compare-row-humidity_pct');
    expect(within(hum).getAllByText('drier')).toHaveLength(2);
    expect(screen.getByTestId('station-compare-reasons')).toHaveTextContent('not compared');
    expect(screen.getByText(/does not change rewards/)).toBeInTheDocument();
  });

  it('shows the reason when a reference is missing', () => {
    render(<StationCompareCard
      view={normalizeStationCompare(body({
        nearby: { stations: 0, radiusKm: 100, reason: 'No other registered station is within 100 km.' },
        nws: { stationIdentifier: null, observedAt: null, reason: 'The National Weather Service did not answer for this area (it covers the US only).' },
        variables: [{ variable: 'temperature_c', mine: 25, closeWithin: 1.5, nearby: null, nws: null }],
      }))}
      unavailable={false}
    />);
    expect(screen.getByTestId('station-compare-headline')).toHaveTextContent('Nothing to compare with yet');
    const reasons = screen.getByTestId('station-compare-reasons');
    expect(reasons).toHaveTextContent('Nearby: No other registered station is within 100 km.');
    expect(reasons).toHaveTextContent('US only');
  });

  it('says unavailable and no-recent-reading plainly', () => {
    const { rerender } = render(<StationCompareCard view={undefined} unavailable />);
    expect(screen.getByText(/comparison is unavailable/)).toBeInTheDocument();
    rerender(<StationCompareCard view={{ status: 'no_recent_reading', reason: 'This station has no reading on chain in the last 6 hours.' }} unavailable={false} />);
    expect(screen.getByText(/last 6 hours/)).toBeInTheDocument();
  });
});
