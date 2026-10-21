/**
 * WrfBadge draws its light-theme text over a translucent chip on white or slate-100 cards; every
 * status must hold 4.5:1 there, and the dark-theme text colours stay what they were.
 */
import { describe, it, expect } from '@jest/globals';
import { statusColorMap } from '../WrfBadge';
import { contrastRatio, hexToRgb, compositeOver, parseRgba } from '../../../theme/contrast';

const DARK_TEXT: Record<string, string> = { active: '#34D399', warning: '#F59E0B', error: '#F87171', info: '#38BDF8', neutral: '#94A3B8' };
const WHITE: [number, number, number] = [255, 255, 255];
const SLATE_100: [number, number, number] = [241, 245, 249];
const SLATE_800: [number, number, number] = [30, 41, 59];

describe('WrfBadge text colour per theme', () => {
  for (const [status, colors] of Object.entries(statusColorMap)) {
    const { rgb, alpha } = parseRgba(colors.bg);
    it(`${status}: light text holds 4.5:1 on white and slate-100 chips`, () => {
      const text = hexToRgb(colors.lightText);
      expect(contrastRatio(text, compositeOver(rgb, alpha, WHITE))).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(text, compositeOver(rgb, alpha, SLATE_100))).toBeGreaterThanOrEqual(4.5);
    });
    it(`${status}: dark text is unchanged and legible on a slate-800 card`, () => {
      expect(colors.text).toBe(DARK_TEXT[status]);
      expect(contrastRatio(hexToRgb(colors.text), compositeOver(rgb, alpha, SLATE_800))).toBeGreaterThanOrEqual(4.5);
    });
  }
});
