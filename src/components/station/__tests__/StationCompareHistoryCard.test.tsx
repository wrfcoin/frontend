/**
 * @jest-environment jsdom
 */
import { describe, expect, it, afterEach } from '@jest/globals';
import React from 'react';
import '@testing-library/jest-dom';
import { cleanup, render, screen } from '@testing-library/react';
import StationCompareHistoryCard from '../StationCompareHistoryCard';
import { detailSentence, formatAmount, normalizeStationCompareHistory, usualSentence } from '../../../utils/stationCompareHistory';
import { shouldAttachBearer } from '../../../services/apiClient/authScope';

afterEach(cleanup);

const body = (over: Record<string, unknown> = {}) => ({
  status: 'ok',
  days: 30,
  from: 1_790_000_000 - 20 * 86_400,
  to: 1_790_000_000,
  reference: { kind: 'nws', stationIdentifier: 'KAAA' },
  variables: [
    { variable: 'temperature_c', pairs: 100, usualDifference: 2, typicalGap: 2, closePercent: 40, closeWithin: 1.5 },
    { variable: 'humidity_pct', pairs: 96, usualDifference: -6, typicalGap: 6, closePercent: 91, closeWithin: 8 },
  ],
  note: 'For your information only.',
  source: 'core4+nws',
  ...over,
});

describe('normalizeStationCompareHistory', () => {
  it('keeps the server numbers', () => {
    const v = normalizeStationCompareHistory(body());
    expect(v.status).toBe('ok');
    if (v.status !== 'ok') return;
    expect(v.referenceStation).toBe('KAAA');
    expect(v.rows).toHaveLength(2);
    expect(v.rows[0]).toEqual({ variable: 'temperature_c', pairs: 100, usualDifference: 2, typicalGap: 2, closePercent: 40, closeWithin: 1.5 });
  });
  it('drops rows it cannot read and refuses a body with none left', () => {
    const v = normalizeStationCompareHistory(body({
      variables: [
        { variable: 'pressure_hpa', pairs: 10, usualDifference: 1, typicalGap: 1, closePercent: 50, closeWithin: 1 },
        { variable: 'temperature_c', pairs: 100, usualDifference: 'warm', typicalGap: 2, closePercent: 40, closeWithin: 1.5 },
        { variable: 'humidity_pct', pairs: 96, usualDifference: -6, typicalGap: 6, closePercent: 91, closeWithin: 8 },
      ],
    }));
    expect(v.status === 'ok' && v.rows.map(r => r.variable)).toEqual(['humidity_pct']);
    expect(() => normalizeStationCompareHistory(body({ variables: [] }))).toThrow();
    expect(() => normalizeStationCompareHistory(body({ reference: { stationIdentifier: '<b>x</b>' } }))).toThrow();
    expect(() => normalizeStationCompareHistory(body({ status: 'weird' }))).toThrow();
    expect(() => normalizeStationCompareHistory(null)).toThrow();
  });
  it('reads the not-enough-data answer', () => {
    expect(normalizeStationCompareHistory({ status: 'not_enough_data', days: 30, pairs: 5, pairsNeeded: 24, daysWithData: 1, daysNeeded: 3 }))
      .toEqual({ status: 'not_enough_data', days: 30, pairs: 5, pairsNeeded: 24, daysWithData: 1, daysNeeded: 3 });
  });
});

describe('plain-language sentences', () => {
  const row = (over: Record<string, unknown> = {}) => ({ variable: 'temperature_c' as const, pairs: 100, usualDifference: 2, typicalGap: 2, closePercent: 40, closeWithin: 1.5, ...over });
  it('says warmer, cooler, drier or close, in the page units', () => {
    expect(usualSentence(row(), 'KAAA')).toBe('Usually reads 3.6°F warmer than KAAA.');
    expect(usualSentence(row({ usualDifference: -2.5 }), 'KAAA')).toBe('Usually reads 4.5°F cooler than KAAA.');
    expect(usualSentence(row({ usualDifference: 0.5 }), 'KAAA')).toBe('Usually close to KAAA: the usual difference is 0.9°F.');
    expect(usualSentence(row({ usualDifference: 0 }), 'KAAA')).toBe('Usually close to KAAA: the usual difference is 0.0°F.');
    expect(usualSentence(row({ variable: 'humidity_pct', usualDifference: -12, closeWithin: 8 }), 'KAAA')).toBe('Usually reads 12 pts drier than KAAA.');
  });
  it('gives the share of close readings and the typical gap', () => {
    expect(detailSentence(row())).toBe('Close (within 2.7°F) 40% of the time. Typical gap 3.6°F, from 100 hourly comparisons.');
    expect(formatAmount('humidity_pct', -6)).toBe('6 pts');
  });
});

describe('StationCompareHistoryCard', () => {
  it('shows the summary and that it is private', () => {
    const view = normalizeStationCompareHistory(body());
    render(<StationCompareHistoryCard view={view} />);
    expect(screen.getByRole('heading', { name: 'Your station over the last 30 days' })).toBeInTheDocument();
    expect(screen.getByText('Only you can see this')).toBeInTheDocument();
    expect(screen.getByTestId('station-compare-history-row-temperature_c')).toHaveTextContent('Usually reads 3.6°F warmer than KAAA.');
    expect(screen.getByTestId('station-compare-history-row-humidity_pct')).toHaveTextContent('Usually close to KAAA');
    expect(screen.getByTestId('station-compare-history')).toHaveTextContent('does not change rewards');
  });
  it('says how much history there is when there is not enough', () => {
    render(<StationCompareHistoryCard view={{ status: 'not_enough_data', days: 30, pairs: 1, pairsNeeded: 24, daysWithData: 1, daysNeeded: 3 }} />);
    expect(screen.getByTestId('station-compare-history-waiting')).toHaveTextContent('So far: 1 comparison on 1 day.');
  });
});

describe('wallet session token scope', () => {
  it('goes with the owner history read and not with the public compare read', () => {
    expect(shouldAttachBearer('GET', '/api/stations/st_0123456789ab/compare/history')).toBe(true);
    expect(shouldAttachBearer('GET', '/api/stations/st_0123456789ab/compare')).toBe(false);
    expect(shouldAttachBearer('GET', '/api/stations/st_0123456789ab/compare/history/extra')).toBe(false);
  });
});
