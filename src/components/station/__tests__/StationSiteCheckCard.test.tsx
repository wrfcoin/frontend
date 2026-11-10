/**
 * @jest-environment jsdom
 */
import { describe, expect, it, afterEach } from '@jest/globals';
import React from 'react';
import '@testing-library/jest-dom';
import { cleanup, render, screen } from '@testing-library/react';
import StationSiteCheckCard from '../StationSiteCheckCard';
import { flagSentence, normalizeStationSiteCheck, type SiteFlag } from '../../../utils/stationSiteCheck';
import { shouldAttachBearer } from '../../../services/apiClient/authScope';

afterEach(cleanup);

const body = (flags: unknown[]) => ({
  status: 'ok', checkedFrom: 1_788_739_200, checkedTo: 1_790_208_000, recentFrom: 1_789_948_800,
  reference: { kind: 'nws', stationIdentifier: 'KAAA' }, flags, note: 'A hint for you only.', source: 'core4+nws',
});
const PRESSURE: SiteFlag = { kind: 'pressure_offset_changed', shiftPercent: -0.6, approxHeightChangeM: 50, heightDirection: 'higher' };
const TEMPERATURE: SiteFlag = { kind: 'temperature_pattern_changed', shiftC: 5 };

describe('normalizeStationSiteCheck', () => {
  it('keeps the flags it can read and drops the rest', () => {
    const v = normalizeStationSiteCheck(body([
      PRESSURE, TEMPERATURE,
      { kind: 'something_new' },
      { kind: 'pressure_offset_changed', shiftPercent: -0.6, approxHeightChangeM: 50, heightDirection: 'sideways' },
      { kind: 'temperature_pattern_changed', shiftC: 'hot' },
    ]));
    expect(v).toEqual({ status: 'ok', referenceStation: 'KAAA', flags: [PRESSURE, TEMPERATURE] });
  });
  it('reads not-enough-data and refuses anything else it cannot read', () => {
    expect(normalizeStationSiteCheck({ status: 'not_enough_data', reason: 'x' })).toEqual({ status: 'not_enough_data' });
    expect(() => normalizeStationSiteCheck({ status: 'ok' })).toThrow();
    expect(() => normalizeStationSiteCheck({ ...body([]), reference: { stationIdentifier: 'bad id' } })).toThrow();
    expect(() => normalizeStationSiteCheck(undefined)).toThrow();
  });
});

describe('flagSentence', () => {
  it('describes a height change in feet and metres without claiming it happened', () => {
    expect(flagSentence(PRESSURE, 'KAAA')).toBe(
      'Its pressure next to KAAA is now about 0.6% lower than it used to be, and has stayed that way. That is what moving the station about 160 ft (50 m) higher would look like.',
    );
  });
  it('describes a temperature change', () => {
    expect(flagSentence(TEMPERATURE, 'KAAA')).toBe('Next to KAAA it now reads about 9.0°F (5.0°C) warmer than it used to at the same time of day, and has stayed that way.');
    expect(flagSentence({ kind: 'temperature_pattern_changed', shiftC: -4.5 }, 'KAAA')).toContain('8.1°F (4.5°C) cooler');
  });
});

describe('StationSiteCheckCard', () => {
  it('asks the owner, says it is private and that rewards do not change', () => {
    const view = normalizeStationSiteCheck(body([PRESSURE, TEMPERATURE]));
    if (view.status !== 'ok') throw new Error('fixture');
    render(<StationSiteCheckCard view={view} />);
    const card = screen.getByTestId('station-site-check');
    expect(card).toHaveTextContent('Has this station moved?');
    expect(screen.getByTestId('station-site-check-pressure_offset_changed')).toHaveTextContent('50 m');
    expect(screen.getByTestId('station-site-check-temperature_pattern_changed')).toHaveTextContent('warmer');
    expect(card).toHaveTextContent('Shown only to you');
    expect(card).toHaveTextContent('In the last few days');
    expect(card).not.toHaveTextContent(/since/i);
    expect(card).toHaveTextContent('does not change rewards');
    expect(card).toHaveTextContent('there is nothing to do');
  });
  it('renders nothing without a flag', () => {
    render(<StationSiteCheckCard view={{ status: 'ok', referenceStation: 'KAAA', flags: [] }} />);
    expect(screen.queryByTestId('station-site-check')).toBeNull();
  });
});

describe('wallet session token scope', () => {
  it('goes with the owner site-check read', () => {
    expect(shouldAttachBearer('GET', '/api/stations/st_0123456789ab/site-check')).toBe(true);
    expect(shouldAttachBearer('GET', '/api/stations/st_0123456789ab/site-check/x')).toBe(false);
  });
});
