/**
 * Chart.js paints on a canvas, which cannot resolve CSS custom properties, so the station chart
 * options must carry literal colours in both themes; dark keeps the token the page always used.
 */
import { describe, it, expect } from '@jest/globals';
import { STATION_CHART_COLOURS, collectStrings, stationChartOptions } from '../stationChartTheme';
import { contrastRatio, hexToRgb } from '../../../theme/contrast';
import { bgSecondaryLight, textSecondary } from '../../../theme/tokens';

const COLOUR = /^(#[0-9A-Fa-f]{6}|rgba?\([\d.\s,]+\))$/;

describe('stationChartOptions', () => {
  for (const isDark of [true, false]) {
    it(`${isDark ? 'dark' : 'light'}: every colour is a literal, never a CSS var()`, () => {
      const strings = collectStrings(stationChartOptions(isDark));
      expect(strings.length).toBeGreaterThan(0);
      for (const [path, value] of strings) {
        expect(`${path}=${value}`).not.toMatch(/var\(/);
        if (/color$/i.test(path)) expect(value).toMatch(COLOUR);
      }
    });
  }
  it('dark keeps the slate-400 secondary text the page used before theming', () => {
    const opts = stationChartOptions(true);
    expect(opts.plugins.legend.labels.color).toBe(textSecondary);
    expect(opts.scales.x.ticks.color).toBe('#94A3B8');
    expect(opts.scales.x.grid.color).toBe('rgba(51,65,85,0.35)');
  });
  it('light text holds 4.5:1 on the white card', () => {
    expect(contrastRatio(hexToRgb(STATION_CHART_COLOURS.light.text), hexToRgb(bgSecondaryLight))).toBeGreaterThanOrEqual(4.5);
  });
});
