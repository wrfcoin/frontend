/**
 * The selected tab label (WrfTabs and every MUI Tab) is 14px text on dark cards. primary.main measured
 * 4.33:1 there under axe; the dark theme now colours the selected label with `darkTabSelectedColor`.
 * (The created MUI theme is stubbed under Jest, so this checks the constant the theme is built from.)
 */
import { describe, it, expect } from '@jest/globals';
import { darkDisabledButton, darkTabSelectedColor } from '../index';
import { contrastRatio, hexToRgb } from '../contrast';
import { bgPrimary, bgSecondary, primary, textSecondary } from '../tokens';

// The /pop card as axe measured it, plus the two token surfaces tabs sit on.
const SURFACES = ['#182234', bgSecondary, bgPrimary];

describe('dark theme tab labels', () => {
  it('selected label holds 4.5:1 on every dark surface', () => {
    for (const bg of SURFACES) {
      expect(contrastRatio(hexToRgb(darkTabSelectedColor), hexToRgb(bg))).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('unselected label (text.secondary) holds 4.5:1 on every dark surface', () => {
    for (const bg of SURFACES) {
      expect(contrastRatio(hexToRgb(textSecondary), hexToRgb(bg))).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('RED control: the previous colour (primary.main) fails on the /pop card', () => {
    expect(contrastRatio(hexToRgb(primary), hexToRgb('#182234'))).toBeLessThan(4.5);
  });
  it('a disabled primary button label holds 4.5:1 on its flat fill (not the blue gradient)', () => {
    expect(contrastRatio(hexToRgb(darkDisabledButton.color), hexToRgb(darkDisabledButton.background))).toBeGreaterThanOrEqual(4.5);
  });
});
