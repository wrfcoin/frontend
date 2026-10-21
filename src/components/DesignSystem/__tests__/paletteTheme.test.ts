/**
 * The design-system palette's text, surface and light-accent entries are CSS variables with the dark
 * token as fallback; theme.css sets the dark values on :root and the light values under
 * body.light-mode. This checks the fallbacks are the tokens, the stylesheet carries every variable
 * for both themes with the dark values equal to the fallbacks, and the light pairings hold 4.5:1.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from '@jest/globals';
import { palette } from '../tokens';
import { contrastRatio, hexToRgb, parseRgba, compositeOver } from '../../../theme/contrast';
import {
  textPrimary, textSecondary, textMuted, bgPrimary, bgSecondary, successLight, warningLight, errorLight, infoLight, primaryLight,
} from '../../../theme/tokens';

// Jest runs from the repository root (ESM test files have no __dirname).
const css = fs.readFileSync(path.resolve(process.cwd(), 'src/styles/theme.css'), 'utf8');
const block = (selector: string) => {
  const m = css.match(new RegExp(`${selector.replace('.', '\\.')}\\s*\\{([^}]*--wrf-ds-[^}]*)\\}`));
  if (!m) throw new Error(`no --wrf-ds block for ${selector}`);
  return Object.fromEntries([...m[1].matchAll(/(--wrf-ds-[a-z-]+):\s*([^;]+);/g)].map(x => [x[1], x[2].trim()]));
};
const varName = (value: string) => value.match(/^var\((--wrf-ds-[a-z-]+), (.+)\)$/);

describe('design-system palette theme variables', () => {
  const dark = block(':root');
  const light = block('body.light-mode');
  const themedEntries = {
    'text.primary': [palette.text.primary, textPrimary],
    'text.secondary': [palette.text.secondary, textSecondary],
    'text.muted': [palette.text.muted, textMuted],
    'text.link': [palette.text.link, primaryLight],
    'background.primary': [palette.background.primary, bgPrimary],
    'background.secondary': [palette.background.secondary, bgSecondary],
    'background.row': [palette.background.row, 'rgba(51, 65, 85, 0.3)'],
    'success.light': [palette.success.light, successLight],
    'warning.light': [palette.warning.light, warningLight],
    'error.light': [palette.error.light, errorLight],
    'info.light': [palette.info.light, infoLight],
  } as const;

  it('falls back to the dark token and the stylesheet carries the same dark value plus a light value', () => {
    for (const [value, token] of Object.values(themedEntries)) {
      const m = varName(value);
      expect(m).not.toBeNull();
      const [, name, fallback] = m as RegExpMatchArray;
      expect(fallback).toBe(token);
      expect(dark[name]).toBe(token);
      expect(light[name]).toBeDefined();
      expect(light[name]).not.toBe(token);
    }
    expect(Object.keys(dark).sort()).toEqual(Object.keys(light).sort());
  });

  it('keeps the main accents and the neutral scale literal, so alpha suffixes still work', () => {
    expect(palette.primary.main).toMatch(/^#[0-9A-F]{6}$/);
    expect(palette.success.main).toMatch(/^#[0-9A-F]{6}$/);
    expect(palette.warning.main).toMatch(/^#[0-9A-F]{6}$/);
    expect(palette.neutral[800]).toBe('#1E293B');
  });

  it('holds 4.5:1 for light text on the light surfaces and for the light accents', () => {
    const surfaces = [light['--wrf-ds-bg-primary'], light['--wrf-ds-bg-secondary'], light['--wrf-ds-bg-tertiary'], light['--wrf-ds-bg-row']].map(hexToRgb);
    for (const text of ['--wrf-ds-text-primary', '--wrf-ds-text-secondary', '--wrf-ds-text-link', '--wrf-ds-success-light', '--wrf-ds-warning-light', '--wrf-ds-error-light', '--wrf-ds-info-light']) {
      for (const surface of surfaces) expect(contrastRatio(hexToRgb(light[text]), surface)).toBeGreaterThanOrEqual(4.5);
    }
    // Muted text is used on the page and on cards, not inside rows.
    expect(contrastRatio(hexToRgb(light['--wrf-ds-text-muted']), hexToRgb(light['--wrf-ds-bg-secondary']))).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(hexToRgb(light['--wrf-ds-text-muted']), hexToRgb(light['--wrf-ds-bg-primary']))).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the dark text legible on the dark surfaces', () => {
    const { rgb, alpha } = parseRgba(dark['--wrf-ds-bg-row']);
    const row = compositeOver(rgb, alpha, hexToRgb(dark['--wrf-ds-bg-secondary']));
    for (const text of ['--wrf-ds-text-primary', '--wrf-ds-text-secondary', '--wrf-ds-success-light', '--wrf-ds-error-light']) {
      expect(contrastRatio(hexToRgb(dark[text]), hexToRgb(dark['--wrf-ds-bg-secondary']))).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(hexToRgb(dark[text]), row)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
