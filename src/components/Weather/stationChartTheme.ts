/**
 * Chart.js options for the station report charts, per theme.
 *
 * Chart.js draws on a canvas, and a canvas cannot read a CSS custom property: `fillStyle =
 * 'var(--x)'` is ignored and the previous value (black on a fresh context) is used. So these colours
 * are literal hex/rgba, chosen from the theme flag, never the design-system `var()` strings that the
 * rest of the page hands to CSS. The dark values are the slate tokens the page used before theming.
 */
import { textSecondary, textSecondaryLight } from '../../theme/tokens';

export const STATION_CHART_COLOURS = {
  dark: { text: textSecondary, grid: 'rgba(51,65,85,0.35)' },
  light: { text: textSecondaryLight, grid: 'rgba(148,163,184,0.35)' },
} as const;

export function stationChartOptions(isDark: boolean) {
  const { text, grid } = STATION_CHART_COLOURS[isDark ? 'dark' : 'light'];
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: text },
      },
    },
    scales: {
      x: {
        ticks: { color: text },
        grid: { color: grid },
      },
      y: {
        ticks: { color: text },
        grid: { color: grid },
      },
    },
  };
}

/** Every string inside a Chart.js option tree, with its path: the test asserts none is a CSS `var()`. */
export function collectStrings(value: unknown, path = 'options'): Array<[string, string]> {
  if (typeof value === 'string') return [[path, value]];
  if (Array.isArray(value)) return value.flatMap((v, i) => collectStrings(v, `${path}[${i}]`));
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) => collectStrings(v, `${path}.${k}`));
  }
  return [];
}
